"use strict";

// ============================================================
//  INVENTORY PANEL v3 — DOM Overlay (красивый UI)
// ============================================================

let isInventoryOpen = false;
let inventoryOverlay = null;

// Данные
const RARITY_COLORS = {
  common: { border: "#52525b", glow: "none", text: "#a1a1aa" },
  uncommon: { border: "#22c55e", glow: "0 0 10px rgba(34,197,94,0.4)", text: "#22c55e" },
  rare: { border: "#3b82f6", glow: "0 0 10px rgba(59,130,246,0.4)", text: "#3b82f6" },
  epic: { border: "#a855f7", glow: "0 0 12px rgba(168,85,247,0.5)", text: "#a855f7" }
};

const SLOT_ICONS = {
  helmet: "🪖", chest: "🛡️", pants: "👖", gloves: "🧤",
  boots: "👢", mainHand: "⚔️", offHand: "🛡️", necklace: "📿",
  earring1: "💎", earring2: "💎", ring1: "💍", ring2: "💍"
};

const SLOT_LABELS = {
  helmet: "Шлем", chest: "Броня", pants: "Штаны", gloves: "Перчатки",
  boots: "Ботинки", mainHand: "Оружие", offHand: "Щит", necklace: "Ожерелье",
  earring1: "Серьга", earring2: "Серьга", ring1: "Кольцо", ring2: "Кольцо"
};

// Тестовые предметы (потом заменишь на реальные из heroState)
let inventoryItems = [
  { id: "1", name: "Iron Sword", type: "mainHand", rarity: "common", level: 5, attack: 25 },
  { id: "2", name: "Mystic Helm", type: "helmet", rarity: "rare", level: 8, defense: 15, hp: 50 },
  { id: "3", name: "Leather Boots", type: "boots", rarity: "uncommon", level: 3, defense: 8 },
  { id: "4", name: "Dragon Blade", type: "mainHand", rarity: "epic", level: 15, attack: 85 },
  { id: "5", name: "Steel Plate", type: "chest", rarity: "uncommon", level: 6, defense: 30 },
  { id: "6", name: "Magic Ring", type: "ring1", rarity: "rare", level: 10, hp: 100 },
  { id: "7", name: "Warrior Gloves", type: "gloves", rarity: "common", level: 4, defense: 5 },
  { id: "8", name: "Phoenix Armor", type: "chest", rarity: "epic", level: 20, defense: 65, hp: 200 },
];

let equippedItems = {};
let selectedItem = null;
let popupElement = null;

// ============================================================
//  СОЗДАНИЕ OVERLAY
// ============================================================

function createInventoryOverlay() {
  if (inventoryOverlay) return;

  // Стили
  const style = document.createElement('style');
  style.textContent = `
    .inv-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      display: none;
      z-index: 9999;
      font-family: Verdana, Arial, sans-serif;
    }
    .inv-overlay.open { display: block; }
    
    .inv-panel {
      width: 100%;
      height: 100%;
      max-width: 100vw;
      max-height: 100vh;
      background: linear-gradient(180deg, #18181b 0%, #09090b 100%);
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
    }
    
    .inv-header {
      padding: 12px 16px 20px;
      background-image: url('assets/ui/Invertory_header.png');
      background-size: 100% 100%;
      background-color: #18181b;
      border-bottom: 1px solid #27272a;
      position: sticky;
      top: 0;
      z-index: 10;
      text-align: center;
    }
    
    .inv-close {
      position: absolute;
      top: 14px; right: 12px;
      width: 32px; height: 32px;
      cursor: pointer;
      border: none;
      background: none;
      padding: 0;
    }
    .inv-close img { width: 100%; height: 100%; }
    
    .inv-title {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      color: #fff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    
    .inv-equipment {
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      background-image: url('assets/ui/phone_invertory_v2.png');
      background-size: 100% 100%;
      background-position: center;
    }
    
    .inv-equip-col {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }
    
    .inv-equip-slot {
      width: 56px; height: 56px;
      background-image: url('assets/ui/invertory_slot_frame.png');
      background-size: cover;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.1s;
    }
    .inv-equip-slot:hover { transform: scale(1.05); }
    .inv-equip-slot .icon { font-size: 24px; opacity: 0.6; }
    .inv-equip-label { font-size: 10px; color: #71717a; }
    
    .inv-char-preview {
      width: 100px; height: 100px;
      background: linear-gradient(135deg, #27272a 0%, #18181b 100%);
      border: 2px solid #3f3f46;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: center;
    }
    .inv-char-preview .icon { font-size: 40px; opacity: 0.4; }
    
    .inv-stats {
      margin: 0 16px 12px;
      background: rgba(39,39,42,0.5);
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-around;
    }
    .inv-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #fff;
      font-size: 13px;
      font-weight: bold;
    }
    .inv-stat svg { width: 16px; height: 16px; }
    
    .inv-grid-title {
      padding: 0 16px 8px;
      display: flex;
      justify-content: space-between;
    }
    .inv-grid-title span:first-child { color: #fff; font-size: 14px; font-weight: bold; }
    .inv-grid-title span:last-child { color: #71717a; font-size: 12px; }
    
    .inv-grid {
      padding: 0 16px 100px;
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
    }
    
    .inv-slot {
      width: 52px; height: 52px;
      background-image: url('assets/ui/invertory_slot_frame.png');
      background-size: cover;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: transform 0.1s;
    }
    .inv-slot.empty { opacity: 0.5; cursor: default; }
    .inv-slot:not(.empty):hover { transform: scale(1.05); }
    .inv-slot.selected { transform: scale(0.92); }
    .inv-slot .icon { font-size: 20px; }
    .inv-slot .level {
      position: absolute;
      top: 1px; right: 1px;
      background: rgba(0,0,0,0.85);
      border-radius: 2px;
      padding: 0 3px;
      font-size: 9px;
      color: #fbbf24;
      font-weight: bold;
    }
    
    .inv-popup {
      position: fixed;
      transform: translate(-50%, -100%);
      background: linear-gradient(180deg, rgba(24,24,27,0.98) 0%, rgba(9,9,11,0.98) 100%);
      border: 1px solid #3f3f46;
      border-radius: 12px;
      padding: 16px;
      z-index: 10000;
      min-width: 180px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
    }
    .inv-popup::after {
      content: '';
      position: absolute;
      bottom: -8px; left: 50%;
      transform: translateX(-50%);
      border: 8px solid transparent;
      border-top-color: #3f3f46;
    }
    .inv-popup-name {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .inv-popup-info {
      text-align: center;
      color: #71717a;
      font-size: 11px;
      margin-bottom: 14px;
    }
    .inv-popup-btns { display: flex; flex-direction: column; gap: 8px; }
    
    .inv-btn {
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: bold;
      font-family: Verdana;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
    }
    .inv-btn-equip {
      background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(37,99,235,0.4);
    }
    .inv-btn-sell {
      background: transparent;
      color: #f59e0b;
      border: 2px solid #f59e0b;
    }
  `;
  document.head.appendChild(style);

  // HTML
  inventoryOverlay = document.createElement('div');
  inventoryOverlay.className = 'inv-overlay';
  inventoryOverlay.innerHTML = `
    <div class="inv-panel">
      <div class="inv-header">
        <button class="inv-close"><img src="assets/ui/btn_close.png" alt="Close"></button>
        <h1 class="inv-title">Инвентарь</h1>
      </div>
      
      <div class="inv-equipment">
        <div class="inv-equip-col" id="inv-equip-left"></div>
        <div class="inv-char-preview"><span class="icon">🛡️</span></div>
        <div class="inv-equip-col" id="inv-equip-right"></div>
      </div>
      
      <div class="inv-stats">
        <div class="inv-stat"><svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span id="inv-hp">850</span></div>
        <div class="inv-stat"><svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="m14.5 17.5 3 3 3-3"/><path d="M3.5 3.5 7 7l3-3"/><path d="m7 3.5 10 10"/><path d="m3.5 7 10 10"/><path d="m14.5 21 3-3 3 3"/></svg><span id="inv-atk">120</span></div>
        <div class="inv-stat"><svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg><span id="inv-def">75</span></div>
      </div>
      
      <div class="inv-grid-title">
        <span>Предметы</span>
        <span id="inv-count">0 шт</span>
      </div>
      
      <div class="inv-grid" id="inv-grid"></div>
    </div>
  `;
  document.body.appendChild(inventoryOverlay);

  // Events
  inventoryOverlay.querySelector('.inv-close').onclick = hideInventoryPanel;
  inventoryOverlay.onclick = (e) => {
    if (e.target === inventoryOverlay) hideInventoryPanel();
  };

  renderEquipment();
  renderGrid();
  updateStats();

  console.log('[InventoryPanel] DOM overlay created');
}

// ============================================================
//  РЕНДЕР
// ============================================================

function renderEquipment() {
  const leftSlots = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
  const rightSlots = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];

  const leftCol = document.getElementById('inv-equip-left');
  const rightCol = document.getElementById('inv-equip-right');

  leftCol.innerHTML = leftSlots.map(type => createEquipSlotHTML(type)).join('');
  rightCol.innerHTML = rightSlots.map(type => createEquipSlotHTML(type)).join('');
}

function createEquipSlotHTML(type) {
  const item = equippedItems[type];
  const rarity = item ? RARITY_COLORS[item.rarity] : null;
  const borderStyle = item ? `border: 2px solid ${rarity.border}; box-shadow: ${rarity.glow};` : '';
  
  return `
    <div>
      <div class="inv-equip-slot" data-type="${type}" style="${borderStyle}">
        <span class="icon">${SLOT_ICONS[type]}</span>
      </div>
      <div class="inv-equip-label">${SLOT_LABELS[type]}</div>
    </div>
  `;
}

function renderGrid() {
  const grid = document.getElementById('inv-grid');
  let html = '';

  for (let i = 0; i < 24; i++) {
    const item = inventoryItems[i];
    if (item) {
      const rarity = RARITY_COLORS[item.rarity];
      html += `
        <div class="inv-slot" data-id="${item.id}" style="border: 2px solid ${rarity.border}; box-shadow: ${rarity.glow};">
          <span class="icon">${SLOT_ICONS[item.type]}</span>
          <span class="level">${item.level}</span>
        </div>
      `;
    } else {
      html += `<div class="inv-slot empty"></div>`;
    }
  }

  grid.innerHTML = html;
  document.getElementById('inv-count').textContent = `${inventoryItems.length} шт`;

  // Клики на слоты
  grid.querySelectorAll('.inv-slot:not(.empty)').forEach(slot => {
    slot.onclick = (e) => {
      const id = slot.dataset.id;
      const item = inventoryItems.find(i => i.id === id);
      if (item) showPopup(e, item, slot);
    };
  });
}

function updateStats() {
  const hp = 850 + Object.values(equippedItems).reduce((a, i) => a + (i?.hp || 0), 0);
  const atk = 120 + Object.values(equippedItems).reduce((a, i) => a + (i?.attack || 0), 0);
  const def = 75 + Object.values(equippedItems).reduce((a, i) => a + (i?.defense || 0), 0);

  document.getElementById('inv-hp').textContent = hp;
  document.getElementById('inv-atk').textContent = atk;
  document.getElementById('inv-def').textContent = def;
}

// ============================================================
//  POPUP
// ============================================================

function showPopup(e, item, slot) {
  hidePopup();
  selectedItem = item;

  // Выделение
  document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('selected'));
  slot.classList.add('selected');

  const rect = slot.getBoundingClientRect();
  const rarity = RARITY_COLORS[item.rarity];

  popupElement = document.createElement('div');
  popupElement.className = 'inv-popup';
  popupElement.style.left = `${rect.left + rect.width / 2}px`;
  popupElement.style.top = `${rect.top - 12}px`;
  popupElement.innerHTML = `
    <div class="inv-popup-name" style="color: ${rarity.text}">${item.name}</div>
    <div class="inv-popup-info">Уровень ${item.level} • ${SLOT_LABELS[item.type]}</div>
    <div class="inv-popup-btns">
      <button class="inv-btn inv-btn-equip">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        Надеть
      </button>
      <button class="inv-btn inv-btn-sell">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        Продать
      </button>
    </div>
  `;

  document.body.appendChild(popupElement);

  // Кнопки
  popupElement.querySelector('.inv-btn-equip').onclick = () => equipItem(item);
  popupElement.querySelector('.inv-btn-sell').onclick = () => sellItem(item);

  // Закрыть при клике вне
  setTimeout(() => {
    document.addEventListener('click', closePopupOnClickOutside);
  }, 10);
}

function hidePopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
  selectedItem = null;
  document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('selected'));
  document.removeEventListener('click', closePopupOnClickOutside);
}

function closePopupOnClickOutside(e) {
  if (popupElement && !popupElement.contains(e.target) && !e.target.closest('.inv-slot')) {
    hidePopup();
  }
}

// ============================================================
//  ДЕЙСТВИЯ
// ============================================================

function equipItem(item) {
  equippedItems[item.type] = item;
  inventoryItems = inventoryItems.filter(i => i.id !== item.id);
  hidePopup();
  renderEquipment();
  renderGrid();
  updateStats();
  console.log('[INV] Equipped:', item.name);
}

function sellItem(item) {
  inventoryItems = inventoryItems.filter(i => i.id !== item.id);
  hidePopup();
  renderGrid();
  console.log('[INV] Sold:', item.name);
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
  hidePopup();
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

Object.defineProperty(window, 'isInventoryOpen', {
  get: () => isInventoryOpen,
  set: (v) => { isInventoryOpen = v; },
  configurable: true
});

console.log('[InventoryPanel] v3 DOM overlay loaded');
