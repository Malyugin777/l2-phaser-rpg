"use strict";

// ============================================================
//  INVENTORY PANEL v5 — ANCHOR LAYOUT + TUNE MODE
//  URL: ?inv_tune=1 для включения
//  
//  Gemini-подход: Всё привязано к ANCHORS, не к магическим числам
//  Камень растягивается от headerBottom до gridTop
// ============================================================

let isInventoryOpen = false;
let inventoryOverlay = null;

// ========== TUNE CONFIG — ДВИГАЙ СТРЕЛКАМИ ==========
const T = {
  // Header
  headerH: 60,
  
  // Equipment slots — КРУТИ ЭТО
  slotSize: 72,        // Размер слотов экипировки
  slotGap: 8,          // Отступ между слотами
  colPadding: 16,      // Отступ колонок от края
  
  // Character preview  
  charSize: 130,       // Размер превью персонажа
  
  // Stats bar
  statsH: 48,
  statsMargin: 12,
  
  // Grid — КРУТИ ЭТО
  gridSlotSize: 58,    // Размер слотов сумки
  gridGap: 8,
  gridPadding: 16,
  gridRows: 4,
  gridCols: 6,
  gridBottomPad: 20,
  
  // Background (камень) — КРУТИ ЭТО
  bgScale: 105,        // Масштаб камня %
  bgOffsetY: 0,        // Сдвиг камня вниз (px)
};

// ========== CALCULATED VALUES (авто от anchors) ==========
function calcLayout() {
  const vh = window.innerHeight;
  
  // Grid height (снизу вверх)
  const gridH = T.gridRows * T.gridSlotSize + (T.gridRows - 1) * T.gridGap;
  const gridTop = vh - gridH - T.gridBottomPad - 30;
  
  // Stats bar
  const statsTop = gridTop - T.statsH - T.statsMargin;
  
  // Equipment zone (между header и stats)
  const equipTop = T.headerH;
  const equipH = statsTop - equipTop - T.statsMargin;
  
  return { vh, gridH, gridTop, statsTop, equipTop, equipH };
}

// ========== DATA ==========
const RARITY = {
  common: { border: "#52525b", glow: "none", text: "#a1a1aa" },
  uncommon: { border: "#22c55e", glow: "0 0 8px rgba(34,197,94,0.4)", text: "#22c55e" },
  rare: { border: "#3b82f6", glow: "0 0 8px rgba(59,130,246,0.4)", text: "#3b82f6" },
  epic: { border: "#a855f7", glow: "0 0 10px rgba(168,85,247,0.5)", text: "#a855f7" }
};

const ICONS = {
  helmet: "🪖", chest: "🛡️", pants: "👖", gloves: "🧤",
  boots: "👢", mainHand: "⚔️", offHand: "🛡️", necklace: "📿",
  earring1: "💎", earring2: "💎", ring1: "💍", ring2: "💍"
};

const LABELS = {
  helmet: "Шлем", chest: "Броня", pants: "Штаны", gloves: "Перчатки",
  boots: "Ботинки", mainHand: "Оружие", offHand: "Щит", necklace: "Ожерелье",
  earring1: "Серьга", earring2: "Серьга", ring1: "Кольцо", ring2: "Кольцо"
};

let items = [
  { id: "1", type: "mainHand", rarity: "common", level: 5 },
  { id: "2", type: "helmet", rarity: "rare", level: 8 },
  { id: "3", type: "boots", rarity: "uncommon", level: 3 },
  { id: "4", type: "mainHand", rarity: "epic", level: 15 },
  { id: "5", type: "chest", rarity: "uncommon", level: 6 },
  { id: "6", type: "ring1", rarity: "rare", level: 10 },
  { id: "7", type: "gloves", rarity: "common", level: 4 },
  { id: "8", type: "chest", rarity: "epic", level: 20 },
];

let equipped = {};
let tuneMode = false;
let tuneTarget = 'slotSize';
let tuneLabel = null;

const TUNE_KEYS = [
  'slotSize', 'slotGap', 'colPadding', 'charSize',
  'gridSlotSize', 'gridGap', 'gridPadding', 'gridBottomPad',
  'bgScale', 'bgOffsetY',
  'headerH', 'statsH', 'statsMargin'
];

// ============================================================
//  CREATE
// ============================================================
function createInventoryOverlay() {
  if (inventoryOverlay) return;
  
  tuneMode = new URLSearchParams(window.location.search).has('inv_tune');
  if (tuneMode) {
    console.log('[INV_TUNE] ===== TUNE MODE =====');
    console.log('[INV_TUNE] Tab=cycle, Arrows=adjust, Shift=×10, P=print');
  }

  const style = document.createElement('style');
  style.id = 'inv-style';
  document.head.appendChild(style);

  inventoryOverlay = document.createElement('div');
  inventoryOverlay.id = 'inv-overlay';
  inventoryOverlay.innerHTML = `
    <div id="inv-panel">
      <div id="inv-header">
        <span>Инвентарь</span>
        <button id="inv-close">✕</button>
      </div>
      <div id="inv-equip">
        <div id="inv-left" class="inv-col"></div>
        <div id="inv-char">🛡️</div>
        <div id="inv-right" class="inv-col"></div>
      </div>
      <div id="inv-stats">
        <span>❤️ <b id="s-hp">850</b></span>
        <span>⚔️ <b id="s-atk">120</b></span>
        <span>🛡️ <b id="s-def">75</b></span>
      </div>
      <div id="inv-grid-title"><span>Предметы</span><span id="inv-cnt">8 шт</span></div>
      <div id="inv-grid"></div>
    </div>
    ${tuneMode ? '<div id="inv-tune">[TUNE] Tab to select</div>' : ''}
  `;
  document.body.appendChild(inventoryOverlay);

  document.getElementById('inv-close').onclick = hideInventoryPanel;
  inventoryOverlay.onclick = e => { if (e.target === inventoryOverlay) hideInventoryPanel(); };

  if (tuneMode) {
    tuneLabel = document.getElementById('inv-tune');
    document.addEventListener('keydown', onTuneKey);
  }

  applyStyles();
  renderSlots();
  renderGrid();
}

// ============================================================
//  STYLES (regenerated from T + anchors)
// ============================================================
function applyStyles() {
  const L = calcLayout();
  
  document.getElementById('inv-style').textContent = `
    #inv-overlay {
      position:fixed; inset:0;
      background:rgba(0,0,0,0.88);
      display:none; z-index:9999;
      font-family:Verdana,sans-serif;
    }
    #inv-overlay.open { display:block; }
    
    #inv-panel {
      width:100%; height:100%;
      background:#0a0a0f;
      overflow-y:auto;
    }
    
    #inv-header {
      height:${T.headerH}px;
      background:url('assets/ui/Invertory_header.png') center/100% 100%, #1a1a1f;
      display:flex; align-items:center; justify-content:center;
      position:relative;
      font-size:20px; font-weight:bold; color:#fff;
      text-shadow:0 2px 4px #000;
    }
    #inv-close {
      position:absolute; right:12px;
      width:36px; height:36px;
      background:#dc2626; border:none; border-radius:50%;
      color:#fff; font-size:18px; cursor:pointer;
    }
    
    #inv-equip {
      height:${L.equipH}px;
      background-image:url('assets/ui/phone_invertory_v2.png');
      background-repeat:no-repeat;
      background-position:center ${T.bgOffsetY}px;
      background-size:${T.bgScale}% auto;
      display:flex;
      padding:${T.colPadding}px;
    }
    
    .inv-col {
      display:flex; flex-direction:column;
      gap:${T.slotGap}px;
      justify-content:center;
    }
    #inv-left { margin-right:auto; }
    #inv-right { margin-left:auto; }
    
    .inv-slot-eq {
      width:${T.slotSize}px; height:${T.slotSize}px;
      background:url('assets/ui/invertory_slot_frame.png') center/cover;
      border-radius:6px;
      display:flex; align-items:center; justify-content:center;
      font-size:${Math.round(T.slotSize*0.45)}px;
      opacity:0.7;
    }
    .inv-slot-label {
      font-size:9px; color:#71717a; text-align:center; margin-top:2px;
    }
    
    #inv-char {
      width:${T.charSize}px; height:${T.charSize}px;
      background:rgba(0,0,0,0.6);
      border:2px solid #3f3f46; border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      font-size:${Math.round(T.charSize*0.45)}px;
      align-self:center;
      margin:0 auto;
    }
    
    #inv-stats {
      height:${T.statsH}px;
      margin:0 ${T.statsMargin}px ${T.statsMargin}px;
      background:rgba(30,30,35,0.9);
      border:1px solid #3f3f46; border-radius:8px;
      display:flex; align-items:center; justify-content:space-around;
      color:#fff; font-size:14px;
    }
    
    #inv-grid-title {
      padding:0 ${T.gridPadding}px 6px;
      display:flex; justify-content:space-between;
      color:#fff; font-size:13px;
    }
    #inv-cnt { color:#71717a; }
    
    #inv-grid {
      padding:0 ${T.gridPadding}px ${T.gridBottomPad}px;
      display:grid;
      grid-template-columns:repeat(${T.gridCols},1fr);
      gap:${T.gridGap}px;
    }
    
    .inv-slot {
      width:${T.gridSlotSize}px; height:${T.gridSlotSize}px;
      background:url('assets/ui/invertory_slot_frame.png') center/cover;
      border-radius:5px;
      display:flex; align-items:center; justify-content:center;
      position:relative;
      font-size:${Math.round(T.gridSlotSize*0.4)}px;
      cursor:pointer;
      transition:transform 0.1s;
    }
    .inv-slot:hover { transform:scale(1.06); }
    .inv-slot.empty { opacity:0.4; cursor:default; }
    .inv-slot .lvl {
      position:absolute; top:1px; right:2px;
      background:rgba(0,0,0,0.85);
      padding:0 3px; border-radius:2px;
      font-size:9px; color:#fbbf24; font-weight:bold;
    }
    
    #inv-tune {
      position:fixed; top:8px; left:8px;
      background:#000; color:#0f0;
      padding:6px 10px; font:12px monospace;
      border:1px solid #0f0; border-radius:4px;
      z-index:99999;
    }
  `;
}

// ============================================================
//  RENDER
// ============================================================
function renderSlots() {
  const left = ['helmet','chest','pants','gloves','boots','mainHand'];
  const right = ['offHand','necklace','earring1','earring2','ring1','ring2'];
  
  document.getElementById('inv-left').innerHTML = left.map(t => slotHTML(t)).join('');
  document.getElementById('inv-right').innerHTML = right.map(t => slotHTML(t)).join('');
}

function slotHTML(type) {
  return `<div><div class="inv-slot-eq">${ICONS[type]}</div><div class="inv-slot-label">${LABELS[type]}</div></div>`;
}

function renderGrid() {
  let html = '';
  for (let i = 0; i < T.gridRows * T.gridCols; i++) {
    const it = items[i];
    if (it) {
      const r = RARITY[it.rarity];
      html += `<div class="inv-slot" style="border:2px solid ${r.border};box-shadow:${r.glow}">${ICONS[it.type]}<span class="lvl">${it.level}</span></div>`;
    } else {
      html += `<div class="inv-slot empty"></div>`;
    }
  }
  document.getElementById('inv-grid').innerHTML = html;
  document.getElementById('inv-cnt').textContent = items.length + ' шт';
}

// ============================================================
//  TUNE MODE
// ============================================================
function onTuneKey(e) {
  if (!isInventoryOpen) return;
  
  if (e.key === 'Tab') {
    e.preventDefault();
    const i = TUNE_KEYS.indexOf(tuneTarget);
    tuneTarget = TUNE_KEYS[(i + 1) % TUNE_KEYS.length];
    updateTuneLabel();
    return;
  }
  
  if (e.key === 'p' || e.key === 'P') {
    console.log('\n[INV_TUNE] ===== VALUES =====');
    console.log('const T = {');
    Object.entries(T).forEach(([k,v]) => console.log(`  ${k}: ${v},`));
    console.log('};');
    return;
  }
  
  const step = e.shiftKey ? 10 : 1;
  let changed = false;
  
  if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { T[tuneTarget] += step; changed = true; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { T[tuneTarget] -= step; changed = true; }
  
  if (changed) {
    applyStyles();
    updateTuneLabel();
  }
}

function updateTuneLabel() {
  if (tuneLabel) tuneLabel.textContent = `[TUNE] ${tuneTarget}: ${T[tuneTarget]} (←→ ±1, Shift ±10)`;
}

// ============================================================
//  SHOW/HIDE
// ============================================================
function showInventoryPanel() {
  if (!inventoryOverlay) createInventoryOverlay();
  inventoryOverlay.classList.add('open');
  isInventoryOpen = true;
  if (tuneMode) updateTuneLabel();
}

function hideInventoryPanel() {
  if (inventoryOverlay) inventoryOverlay.classList.remove('open');
  isInventoryOpen = false;
}

function toggleInventoryPanel() {
  isInventoryOpen ? hideInventoryPanel() : showInventoryPanel();
}

// ============================================================
//  EXPORTS
// ============================================================
window.createInventoryPanel = createInventoryOverlay;
window.showInventoryPanel = showInventoryPanel;
window.hideInventoryPanel = hideInventoryPanel;
window.toggleInventoryPanel = toggleInventoryPanel;
window.INV_TUNE = T;

Object.defineProperty(window, 'isInventoryOpen', {
  get: () => isInventoryOpen,
  set: v => { isInventoryOpen = v; }
});

console.log('[InventoryPanel] v5 ANCHOR+TUNE loaded');
