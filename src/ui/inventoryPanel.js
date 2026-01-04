"use strict";

// ============================================================
//  INVENTORY PANEL v6 — DRAG TUNE MODE (как tuneMode.js)
//  URL: ?inv_tune=1
//  
//  Картинки в ОРИГИНАЛЬНОМ размере, двигай мышкой!
// ============================================================

const INV_TUNE_ENABLED = new URLSearchParams(window.location.search).has('inv_tune');
const INV_TUNE_VERSION = 'inv_v3';

let isInventoryOpen = false;
let inventoryOverlay = null;

// ========== НАСТРОЙКИ (сохраняются в localStorage) ==========
function getInvSettings() {
  const defaults = {
    // Close button
    closeBtnX: 320, closeBtnY: 10, closeBtnScale: 1,

    // Background stone
    bgX: 0, bgY: 0, bgScale: 1,

    // Header
    headerX: 0, headerY: 0, headerScale: 1,

    // Left column
    leftColX: 20, leftColY: 80,

    // Right column
    rightColX: 280, rightColY: 80,

    // Character preview
    charX: 150, charY: 200, charScale: 1,

    // Stats bar
    statsX: 0, statsY: 460, statsScale: 1,

    // Grid
    gridX: 0, gridY: 520,

    // Slot sizes
    slotSize: 58,
    gridSlotSize: 52,
  };

  const savedVersion = localStorage.getItem('INV_TUNE_VERSION');
  if (savedVersion !== INV_TUNE_VERSION) {
    localStorage.removeItem('INV_TUNE_SETTINGS');
    localStorage.setItem('INV_TUNE_VERSION', INV_TUNE_VERSION);
    console.log('[INV_TUNE] Reset to defaults');
  }

  if (!INV_TUNE_ENABLED) return defaults;

  try {
    const saved = localStorage.getItem('INV_TUNE_SETTINGS');
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch (e) {}
  return defaults;
}

let S = getInvSettings(); // Settings

// ========== DATA ==========
const RARITY = {
  common: { border: "#52525b", glow: "none" },
  uncommon: { border: "#22c55e", glow: "0 0 8px rgba(34,197,94,0.4)" },
  rare: { border: "#3b82f6", glow: "0 0 8px rgba(59,130,246,0.4)" },
  epic: { border: "#a855f7", glow: "0 0 10px rgba(168,85,247,0.5)" }
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

// DOM refs
let els = {};
let selectedElement = 'bg';
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let elementStartX = 0, elementStartY = 0;

// ============================================================
//  CREATE OVERLAY
// ============================================================
function createInventoryOverlay() {
  if (inventoryOverlay) return;

  if (INV_TUNE_ENABLED) {
    console.log('[INV_TUNE] ===== DRAG TUNE MODE =====');
    console.log('[INV_TUNE] Click element to select, drag to move');
    console.log('[INV_TUNE] Q/E = scale, P = print, R = reset');
  }

  // Styles
  const style = document.createElement('style');
  style.id = 'inv-style';
  style.textContent = `
    #inv-overlay {
      position:fixed; inset:0;
      background:rgba(0,0,0,0.9);
      display:none; z-index:9999;
      font-family:Verdana,sans-serif;
    }
    #inv-overlay.open { display:block; }
    
    #inv-panel {
      position:relative;
      width:100%; height:100%;
      overflow:hidden;
    }
    
    .inv-element {
      position:absolute;
      cursor:${INV_TUNE_ENABLED ? 'move' : 'default'};
      user-select:none;
    }
    .inv-element.selected {
      outline:2px dashed #0f0 !important;
      outline-offset:2px;
    }
    
    #inv-bg {
      /* Оригинальный размер картинки */
    }
    
    #inv-header {
      width:100%;
      height:60px;
      background:url('assets/ui/Invertory_header.png') center/100% 100%;
      display:flex; align-items:center; justify-content:center;
      font-size:20px; font-weight:bold; color:#fff;
      text-shadow:0 2px 4px #000;
    }
    
    #inv-close {
      position:absolute;
      width:40px; height:40px;
      background:url('assets/ui/btn_close.png') center/contain no-repeat;
      border:none; cursor:pointer;
      z-index:100;
    }
    #inv-close:hover { filter:brightness(1.2); }
    #inv-close:active { transform:scale(0.95); }
    
    .inv-slot {
      width:${S.slotSize}px; height:${S.slotSize}px;
      background:url('assets/ui/invertory_slot_frame.png') center/cover;
      border-radius:6px;
      display:flex; align-items:center; justify-content:center;
      font-size:${Math.round(S.slotSize * 0.45)}px;
      margin-bottom:8px;
    }
    .inv-slot-label {
      font-size:9px; color:#888; text-align:center;
    }
    
    #inv-char {
      width:120px; height:120px;
      background:rgba(0,0,0,0.6);
      border:2px solid #3f3f46;
      border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      font-size:50px;
    }
    
    #inv-stats {
      width:90%;
      height:44px;
      background:rgba(30,30,40,0.9);
      border:1px solid #3f3f46;
      border-radius:8px;
      display:flex; align-items:center; justify-content:space-around;
      color:#fff; font-size:14px;
    }
    
    #inv-grid {
      display:grid;
      grid-template-columns:repeat(6,${S.gridSlotSize}px);
      gap:6px;
    }
    .inv-grid-slot {
      width:${S.gridSlotSize}px; height:${S.gridSlotSize}px;
      background:url('assets/ui/invertory_slot_frame.png') center/cover;
      border-radius:5px;
      display:flex; align-items:center; justify-content:center;
      position:relative;
      font-size:${Math.round(S.gridSlotSize * 0.4)}px;
    }
    .inv-grid-slot.empty { opacity:0.4; }
    .inv-grid-slot .lvl {
      position:absolute; top:1px; right:2px;
      background:rgba(0,0,0,0.85);
      padding:0 3px; border-radius:2px;
      font-size:9px; color:#fbbf24;
    }
    
    /* TUNE PANEL */
    #inv-tune-panel {
      position:fixed; top:10px; left:10px;
      background:rgba(0,0,0,0.95);
      color:#0f0; padding:12px;
      font:11px monospace;
      z-index:99999;
      border:1px solid #0f0;
      border-radius:5px;
      min-width:200px;
      cursor:move;
      touch-action:none;
      user-select:none;
    }
    #inv-tune-panel button {
      padding:4px 8px;
      margin:2px;
      cursor:pointer;
      background:#222;
      color:#0f0;
      border:1px solid #0f0;
      border-radius:3px;
    }
    #inv-tune-panel button:hover { background:#0a0; color:#000; }
    #inv-tune-panel button.active { background:#0f0; color:#000; }
    .tune-arrows {
      display:flex; flex-direction:column; align-items:center; gap:2px; margin:8px 0;
    }
    .tune-arrows button { width:40px; height:30px; font-size:16px; }
  `;
  document.head.appendChild(style);

  // Main overlay
  inventoryOverlay = document.createElement('div');
  inventoryOverlay.id = 'inv-overlay';
  inventoryOverlay.innerHTML = `
    <div id="inv-panel">
      <button id="inv-close" class="inv-element"></button>
      
      <!-- Background (оригинальный размер) -->
      <img id="inv-bg" class="inv-element" src="assets/ui/phone_invertory_v2.png" draggable="false">
      
      <!-- Header -->
      <div id="inv-header" class="inv-element">Инвентарь</div>
      
      <!-- Left column -->
      <div id="inv-left" class="inv-element"></div>
      
      <!-- Right column -->
      <div id="inv-right" class="inv-element"></div>
      
      <!-- Character -->
      <div id="inv-char" class="inv-element">🛡️</div>
      
      <!-- Stats -->
      <div id="inv-stats" class="inv-element">
        <span>❤️ <b>850</b></span>
        <span>⚔️ <b>120</b></span>
        <span>🛡️ <b>75</b></span>
      </div>
      
      <!-- Grid title -->
      <div id="inv-grid-title" class="inv-element" style="color:#fff;font-size:14px;">
        <b>Предметы</b> <span style="color:#888;margin-left:10px;">8 шт</span>
      </div>
      
      <!-- Grid -->
      <div id="inv-grid" class="inv-element"></div>
    </div>
    
    ${INV_TUNE_ENABLED ? createTunePanel() : ''}
  `;
  document.body.appendChild(inventoryOverlay);

  // Get element refs
  els = {
    closeBtn: document.getElementById('inv-close'),
    bg: document.getElementById('inv-bg'),
    header: document.getElementById('inv-header'),
    leftCol: document.getElementById('inv-left'),
    rightCol: document.getElementById('inv-right'),
    char: document.getElementById('inv-char'),
    stats: document.getElementById('inv-stats'),
    gridTitle: document.getElementById('inv-grid-title'),
    grid: document.getElementById('inv-grid'),
  };

  // Close button - only close if NOT in tune mode
  document.getElementById('inv-close').onclick = (e) => {
    if (INV_TUNE_ENABLED) {
      e.stopPropagation();
      return; // In tune mode, clicking selects but doesn't close
    }
    hideInventoryPanel();
  };

  // Render content
  renderSlots();
  renderGrid();
  applyPositions();

  // Init tune mode
  if (INV_TUNE_ENABLED) {
    initInvTuneMode();
  }

  console.log('[InventoryPanel] v6 DRAG TUNE created');
}

// ============================================================
//  TUNE PANEL HTML
// ============================================================
function createTunePanel() {
  return `
    <div id="inv-tune-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <b>🎮 INV TUNE</b>
        <button onclick="toggleTuneCollapse()">➖</button>
      </div>
      <div id="inv-tune-body">
      
      <div>Selected: <span id="inv-tune-sel" style="color:#ff0">bg</span></div>
      <div id="inv-tune-pos" style="color:#888;font-size:10px;">x:0 y:0 s:1</div>
      
      <hr style="border-color:#333;margin:8px 0;">
      
      <!-- Element buttons -->
      <div style="display:flex;flex-wrap:wrap;gap:2px;">
        <button class="inv-tune-btn" data-el="closeBtn">Close</button>
        <button class="inv-tune-btn active" data-el="bg">BG</button>
        <button class="inv-tune-btn" data-el="header">Header</button>
        <button class="inv-tune-btn" data-el="leftCol">Left</button>
        <button class="inv-tune-btn" data-el="rightCol">Right</button>
        <button class="inv-tune-btn" data-el="char">Char</button>
        <button class="inv-tune-btn" data-el="stats">Stats</button>
        <button class="inv-tune-btn" data-el="grid">Grid</button>
      </div>
      
      <hr style="border-color:#333;margin:8px 0;">
      
      <!-- Arrow controls -->
      <div class="tune-arrows">
        <button id="inv-tune-up">⬆</button>
        <div style="display:flex;gap:2px;">
          <button id="inv-tune-left">⬅</button>
          <button id="inv-tune-down">⬇</button>
          <button id="inv-tune-right">➡</button>
        </div>
        <div style="display:flex;gap:2px;margin-top:4px;">
          <button id="inv-tune-minus">➖</button>
          <button id="inv-tune-plus">➕</button>
        </div>
      </div>
      
      <hr style="border-color:#333;margin:8px 0;">

      <div style="display:flex;gap:4px;">
        <button onclick="printInvSettings()">📋 Print</button>
        <button onclick="resetInvSettings()">🔄 Reset</button>
        <button onclick="saveInvSettings()">💾 Save</button>
      </div>
      </div>
    </div>
  `;
}

// Toggle collapse tune panel
function toggleTuneCollapse() {
  const body = document.getElementById('inv-tune-body');
  const btn = document.querySelector('#inv-tune-panel > div:first-child > button');
  if (body.style.display === 'none') {
    body.style.display = 'block';
    btn.textContent = '➖';
  } else {
    body.style.display = 'none';
    btn.textContent = '➕';
  }
}
window.toggleTuneCollapse = toggleTuneCollapse;

// ============================================================
//  INIT TUNE MODE
// ============================================================
function initInvTuneMode() {
  const STEP = 5;
  const SCALE_STEP = 0.05;

  // Element selector buttons
  document.querySelectorAll('.inv-tune-btn').forEach(btn => {
    btn.onclick = () => {
      selectedElement = btn.dataset.el;
      document.querySelectorAll('.inv-tune-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Highlight element
      document.querySelectorAll('.inv-element').forEach(el => el.classList.remove('selected'));
      if (els[selectedElement]) els[selectedElement].classList.add('selected');
      
      updateTuneDisplay();
    };
  });

  // Arrow buttons
  document.getElementById('inv-tune-up').onclick = () => moveElement(0, -STEP);
  document.getElementById('inv-tune-down').onclick = () => moveElement(0, STEP);
  document.getElementById('inv-tune-left').onclick = () => moveElement(-STEP, 0);
  document.getElementById('inv-tune-right').onclick = () => moveElement(STEP, 0);
  document.getElementById('inv-tune-plus').onclick = () => scaleElement(SCALE_STEP);
  document.getElementById('inv-tune-minus').onclick = () => scaleElement(-SCALE_STEP);

  // Click to select element
  document.querySelectorAll('.inv-element').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.id.replace('inv-', '');
      const mappedId = {
        'close': 'closeBtn', 'bg': 'bg', 'header': 'header', 'left': 'leftCol', 'right': 'rightCol',
        'char': 'char', 'stats': 'stats', 'grid-title': 'gridTitle', 'grid': 'grid'
      }[id] || id;
      
      selectedElement = mappedId;
      document.querySelectorAll('.inv-tune-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.el === mappedId);
      });
      document.querySelectorAll('.inv-element').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      updateTuneDisplay();
    };

    // Drag support
    el.onpointerdown = (e) => {
      if (!INV_TUNE_ENABLED) return;
      e.preventDefault();
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      elementStartX = parseInt(el.style.left) || 0;
      elementStartY = parseInt(el.style.top) || 0;
      
      // Select this element
      el.click();
    };
  });

  // Global drag handlers
  document.addEventListener('pointermove', (e) => {
    if (!isDragging || !INV_TUNE_ENABLED) return;
    
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    
    const el = els[selectedElement];
    if (el) {
      el.style.left = (elementStartX + dx) + 'px';
      el.style.top = (elementStartY + dy) + 'px';
      
      // Update settings
      updateSettingsFromElement();
      updateTuneDisplay();
    }
  });

  document.addEventListener('pointerup', () => {
    if (isDragging) {
      isDragging = false;
      saveInvSettings();
    }
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!isInventoryOpen || !INV_TUNE_ENABLED) return;
    
    switch(e.key) {
      case 'ArrowUp': moveElement(0, -STEP); break;
      case 'ArrowDown': moveElement(0, STEP); break;
      case 'ArrowLeft': moveElement(-STEP, 0); break;
      case 'ArrowRight': moveElement(STEP, 0); break;
      case 'q': case 'Q': scaleElement(-SCALE_STEP); break;
      case 'e': case 'E': scaleElement(SCALE_STEP); break;
      case 'p': case 'P': printInvSettings(); break;
      case 'r': case 'R': resetInvSettings(); break;
    }
  });

  // Make tune panel draggable
  const panel = document.getElementById('inv-tune-panel');
  let tunePanelDrag = false;
  let tunePanelOffsetX = 0, tunePanelOffsetY = 0;

  panel.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
    e.preventDefault();
    tunePanelDrag = true;
    const rect = panel.getBoundingClientRect();
    tunePanelOffsetX = e.clientX - rect.left;
    tunePanelOffsetY = e.clientY - rect.top;
    panel.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!tunePanelDrag) return;
    e.preventDefault();
    panel.style.left = (e.clientX - tunePanelOffsetX) + 'px';
    panel.style.top = (e.clientY - tunePanelOffsetY) + 'px';
    panel.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (tunePanelDrag) {
      tunePanelDrag = false;
      panel.style.cursor = 'move';
    }
  });

  // Initial highlight
  if (els.bg) els.bg.classList.add('selected');
  updateTuneDisplay();
}

// ============================================================
//  MOVE / SCALE
// ============================================================
function moveElement(dx, dy) {
  const el = els[selectedElement];
  if (!el) return;
  
  const x = (parseInt(el.style.left) || 0) + dx;
  const y = (parseInt(el.style.top) || 0) + dy;
  
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  
  updateSettingsFromElement();
  updateTuneDisplay();
  saveInvSettings();
}

function scaleElement(delta) {
  const el = els[selectedElement];
  if (!el) return;
  
  const key = selectedElement + 'Scale';
  S[key] = (S[key] || 1) + delta;
  S[key] = Math.max(0.1, S[key]);
  
  el.style.transform = `scale(${S[key]})`;
  
  updateTuneDisplay();
  saveInvSettings();
}

function updateSettingsFromElement() {
  const el = els[selectedElement];
  if (!el) return;
  
  const keyX = selectedElement + 'X';
  const keyY = selectedElement + 'Y';
  
  S[keyX] = parseInt(el.style.left) || 0;
  S[keyY] = parseInt(el.style.top) || 0;
}

function updateTuneDisplay() {
  const selEl = document.getElementById('inv-tune-sel');
  const posEl = document.getElementById('inv-tune-pos');
  if (!selEl || !posEl) return;
  
  selEl.textContent = selectedElement;
  
  const el = els[selectedElement];
  if (el) {
    const x = parseInt(el.style.left) || 0;
    const y = parseInt(el.style.top) || 0;
    const scale = S[selectedElement + 'Scale'] || 1;
    posEl.textContent = `x:${x} y:${y} s:${scale.toFixed(2)}`;
  }
}

// ============================================================
//  APPLY POSITIONS
// ============================================================
function applyPositions() {
  const apply = (el, xKey, yKey, scaleKey) => {
    if (!el) return;
    el.style.left = (S[xKey] || 0) + 'px';
    el.style.top = (S[yKey] || 0) + 'px';
    if (S[scaleKey]) el.style.transform = `scale(${S[scaleKey]})`;
  };

  apply(els.closeBtn, 'closeBtnX', 'closeBtnY', 'closeBtnScale');
  apply(els.bg, 'bgX', 'bgY', 'bgScale');
  apply(els.header, 'headerX', 'headerY', 'headerScale');
  apply(els.leftCol, 'leftColX', 'leftColY');
  apply(els.rightCol, 'rightColX', 'rightColY');
  apply(els.char, 'charX', 'charY', 'charScale');
  apply(els.stats, 'statsX', 'statsY', 'statsScale');
  apply(els.gridTitle, 'gridTitleX', 'gridTitleY');
  apply(els.grid, 'gridX', 'gridY');
}

// ============================================================
//  SAVE / LOAD / PRINT
// ============================================================
window.saveInvSettings = function() {
  localStorage.setItem('INV_TUNE_SETTINGS', JSON.stringify(S));
  console.log('[INV_TUNE] Saved');
};

window.resetInvSettings = function() {
  localStorage.removeItem('INV_TUNE_SETTINGS');
  localStorage.removeItem('INV_TUNE_VERSION');
  location.reload();
};

window.printInvSettings = function() {
  console.log('\n[INV_TUNE] ===== CURRENT SETTINGS =====');
  console.log('const S = ' + JSON.stringify(S, null, 2) + ';');
  console.log('=========================================\n');
  
  // Also copy to clipboard
  const text = 'const S = ' + JSON.stringify(S, null, 2) + ';';
  navigator.clipboard?.writeText(text).then(() => {
    console.log('[INV_TUNE] Copied to clipboard!');
  });
};

// ============================================================
//  RENDER SLOTS
// ============================================================
function renderSlots() {
  const leftTypes = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
  const rightTypes = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];
  
  els.leftCol.innerHTML = leftTypes.map(t => `
    <div style="text-align:center;">
      <div class="inv-slot">${ICONS[t]}</div>
      <div class="inv-slot-label">${LABELS[t]}</div>
    </div>
  `).join('');
  
  els.rightCol.innerHTML = rightTypes.map(t => `
    <div style="text-align:center;">
      <div class="inv-slot">${ICONS[t]}</div>
      <div class="inv-slot-label">${LABELS[t]}</div>
    </div>
  `).join('');
}

function renderGrid() {
  let html = '';
  for (let i = 0; i < 24; i++) {
    const item = items[i];
    if (item) {
      const r = RARITY[item.rarity];
      html += `<div class="inv-grid-slot" style="border:2px solid ${r.border};box-shadow:${r.glow}">
        ${ICONS[item.type]}<span class="lvl">${item.level}</span>
      </div>`;
    } else {
      html += `<div class="inv-grid-slot empty"></div>`;
    }
  }
  els.grid.innerHTML = html;
}

// ============================================================
//  SHOW / HIDE
// ============================================================
function showInventoryPanel() {
  if (!inventoryOverlay) createInventoryOverlay();
  inventoryOverlay.classList.add('open');
  isInventoryOpen = true;
  console.log('[INV] Opened');
}

function hideInventoryPanel() {
  if (inventoryOverlay) inventoryOverlay.classList.remove('open');
  isInventoryOpen = false;
  console.log('[INV] Closed');
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
window.INV_SETTINGS = S;

Object.defineProperty(window, 'isInventoryOpen', {
  get: () => isInventoryOpen,
  set: v => { isInventoryOpen = v; }
});

console.log('[InventoryPanel] v6 DRAG TUNE loaded');
