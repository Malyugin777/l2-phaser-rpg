"use strict";

// ============================================================
//  INVENTORY PANEL — FINAL v8
//  L2 Dark Fantasy Style
//  PNG слоты + тёмный градиент + правильные размеры
// ============================================================

let isInventoryOpen = false;
let inventoryOverlay = null;
let inventoryPopup = null;

// ===== КОНФИГ =====
const INV = {
  // Размеры
  equipSlot: 72,      // Слот экипировки
  gridSlot: 58,       // Слот сетки
  gridCols: 6,
  gridRows: 4,
  gap: 10,
  padding: 16,
  
  // Цвета L2 Dark Fantasy
  colors: {
    bgTop: '#232730',
    bgBottom: '#0f1116',
    panelBg: '#1a1d24',
    footerBg: '#111318',
    border: '#4b5563',
    borderLight: '#6b7280',
    text: '#e2e8f0',
    textMuted: '#64748b',
    gold: '#D6B36A',
    blue: '#4FA3FF',
    red: '#E05252',
  },
  
  // Tint для слотов
  slotTintEmpty: '#889099',    // Затемнённый камень
  slotTintFilled: '#ffffff',   // Яркий камень
  
  // Редкость
  rarity: {
    common:    { border: '#4b5563', glow: 'none', text: '#94a3b8', name: 'Обычный' },
    uncommon:  { border: '#22c55e', glow: '0 0 8px #22c55e', text: '#4ade80', name: 'Необычный' },
    rare:      { border: '#3b82f6', glow: '0 0 10px #3b82f6', text: '#60a5fa', name: 'Редкий' },
    epic:      { border: '#a855f7', glow: '0 0 12px #a855f7', text: '#c084fc', name: 'Эпический' },
    legendary: { border: '#D6B36A', glow: '0 0 14px #D6B36A', text: '#D6B36A', name: 'Легендарный' },
  }
};

// ===== ДАННЫЕ =====
const ICONS = {
  helmet: "⛑️", chest: "🎽", pants: "👖", gloves: "🧤",
  boots: "👢", mainHand: "🗡️", offHand: "🛡️", necklace: "📿",
  earring1: "💎", earring2: "💎", ring1: "💍", ring2: "💍"
};

const LABELS = {
  helmet: "Шлем", chest: "Броня", pants: "Штаны", gloves: "Перчатки",
  boots: "Ботинки", mainHand: "Оружие", offHand: "Щит", necklace: "Ожерелье",
  earring1: "Серьга", earring2: "Серьга", ring1: "Кольцо", ring2: "Кольцо"
};

// Тестовые данные (замени на heroState)
let invItems = [
  { id: "1", type: "mainHand", rarity: "common", level: 5, name: "Железный меч", atk: 15 },
  { id: "2", type: "helmet", rarity: "rare", level: 8, name: "Шлем мага", def: 12, hp: 50 },
  { id: "3", type: "boots", rarity: "uncommon", level: 3, name: "Сапоги следопыта", def: 8 },
  { id: "4", type: "chest", rarity: "epic", level: 15, name: "Доспех дракона", def: 45, hp: 120 },
  { id: "5", type: "pants", rarity: "uncommon", level: 6, name: "Стальные поножи", def: 18 },
  { id: "6", type: "ring1", rarity: "legendary", level: 20, name: "Кольцо Феникса", atk: 30, hp: 200 },
  { id: "7", type: "gloves", rarity: "common", level: 4, name: "Перчатки воина", def: 5 },
  { id: "8", type: "necklace", rarity: "rare", level: 12, name: "Амулет мудрости", hp: 80 },
];

let invEquipped = {};

// ============================================================
//  СОЗДАНИЕ
// ============================================================
function createInventoryOverlay() {
  if (inventoryOverlay) return;

  // CSS
  const style = document.createElement('style');
  style.id = 'inv-final-style';
  style.textContent = `
    /* ===== OVERLAY ===== */
    #inv-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      display: none;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      justify-content: center;
      align-items: center;
    }
    #inv-overlay.open { display: flex; }

    /* ===== MAIN PANEL ===== */
    #inv-panel {
      width: 94%;
      max-width: 400px;
      max-height: 92vh;
      background: linear-gradient(180deg, ${INV.colors.bgTop} 0%, ${INV.colors.bgBottom} 100%);
      border: 4px solid ${INV.colors.border};
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 0 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);
    }

    /* ===== HEADER ===== */
    #inv-header {
      padding: 14px ${INV.padding}px;
      background: linear-gradient(180deg, #2a2f3a 0%, ${INV.colors.panelBg} 100%);
      border-bottom: 3px solid ${INV.colors.border};
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    #inv-header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: ${INV.colors.gold};
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      letter-spacing: 0.5px;
    }
    #inv-header .subtitle {
      font-size: 11px;
      color: ${INV.colors.textMuted};
      margin-top: 2px;
    }
    #inv-close {
      width: 36px;
      height: 36px;
      background: url('assets/ui/btn_close.png') center/contain no-repeat;
      border: none;
      cursor: pointer;
      transition: transform 0.1s;
    }
    #inv-close:hover { transform: scale(1.1); }
    #inv-close:active { transform: scale(0.95); }

    /* ===== EQUIPMENT ZONE ===== */
    #inv-equip {
      padding: ${INV.padding}px;
      background: linear-gradient(180deg, ${INV.colors.panelBg} 0%, rgba(15,17,22,0.5) 100%);
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: ${INV.gap}px;
      align-items: center;
    }

    /* ===== SLOT COLUMNS ===== */
    .inv-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    /* ===== EQUIPMENT SLOT ===== */
    .inv-eslot {
      width: ${INV.equipSlot}px;
      height: ${INV.equipSlot}px;
      background: url('assets/ui/invertory_slot_frame.png') center/cover no-repeat;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transition: all 0.15s ease;
      filter: brightness(0.6) saturate(0.8);
    }
    .inv-eslot.filled {
      filter: brightness(1) saturate(1);
    }
    .inv-eslot:hover {
      transform: scale(1.05);
      filter: brightness(1.1) saturate(1);
    }
    .inv-eslot .icon {
      font-size: ${Math.round(INV.equipSlot * 0.38)}px;
      opacity: 0.4;
    }
    .inv-eslot.filled .icon {
      opacity: 1;
    }
    .inv-eslot .label {
      position: absolute;
      bottom: -16px;
      font-size: 9px;
      color: ${INV.colors.textMuted};
      white-space: nowrap;
    }
    .inv-eslot .lvl {
      position: absolute;
      bottom: 3px;
      right: 5px;
      font-size: 10px;
      font-weight: 700;
      color: ${INV.colors.gold};
      text-shadow: 0 1px 3px #000;
    }
    /* Glow для редкости */
    .inv-eslot.rarity-uncommon { box-shadow: ${INV.rarity.uncommon.glow}; }
    .inv-eslot.rarity-rare { box-shadow: ${INV.rarity.rare.glow}; }
    .inv-eslot.rarity-epic { box-shadow: ${INV.rarity.epic.glow}; }
    .inv-eslot.rarity-legendary { 
      box-shadow: ${INV.rarity.legendary.glow}; 
      animation: legendaryPulse 2s ease-in-out infinite;
    }

    /* ===== CHARACTER ===== */
    #inv-char {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #inv-char-box {
      width: 110px;
      height: 130px;
      background: linear-gradient(180deg, #1e222a 0%, #12151a 100%);
      border: 3px solid ${INV.colors.border};
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      box-shadow: inset 0 0 25px rgba(0,0,0,0.5), 0 6px 16px rgba(0,0,0,0.4);
      position: relative;
    }
    #inv-char-box .emoji { font-size: 50px; }
    #inv-char-box .name { font-size: 12px; font-weight: 600; color: ${INV.colors.blue}; }
    #inv-char-box .level { font-size: 10px; color: ${INV.colors.textMuted}; }
    /* Подиум-тень */
    #inv-char-box::after {
      content: '';
      position: absolute;
      bottom: 8px;
      width: 60px;
      height: 12px;
      background: radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%);
      border-radius: 50%;
    }

    /* ===== STATS FOOTER ===== */
    #inv-stats {
      padding: 12px ${INV.padding}px;
      background: ${INV.colors.footerBg};
      border-top: 1px solid #1f2937;
      border-bottom: 1px solid #1f2937;
      display: flex;
      justify-content: space-around;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);
    }
    .inv-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .inv-stat .val {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 15px;
      font-weight: 700;
    }
    .inv-stat .lbl {
      font-size: 9px;
      color: ${INV.colors.textMuted};
    }

    /* ===== GRID SECTION ===== */
    #inv-grid-section {
      padding: ${INV.padding}px;
      flex: 1;
      overflow-y: auto;
    }
    #inv-grid-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    #inv-grid-header .title {
      font-size: 14px;
      font-weight: 600;
      color: ${INV.colors.text};
    }
    #inv-grid-header .count {
      font-size: 12px;
      color: ${INV.colors.textMuted};
    }

    /* ===== GRID ===== */
    #inv-grid {
      display: grid;
      grid-template-columns: repeat(${INV.gridCols}, 1fr);
      gap: 8px;
    }

    /* ===== GRID SLOT ===== */
    .inv-gslot {
      aspect-ratio: 1;
      background: url('assets/ui/invertory_slot_frame.png') center/cover no-repeat;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transition: all 0.15s ease;
      filter: brightness(0.5) saturate(0.6);
    }
    .inv-gslot.filled {
      filter: brightness(0.9) saturate(1);
    }
    .inv-gslot:hover:not(.empty) {
      transform: scale(1.08);
      filter: brightness(1.1) saturate(1);
      z-index: 10;
    }
    .inv-gslot .icon {
      font-size: ${Math.round(INV.gridSlot * 0.38)}px;
    }
    .inv-gslot .lvl {
      position: absolute;
      bottom: 2px;
      right: 4px;
      font-size: 9px;
      font-weight: 700;
      color: ${INV.colors.gold};
      text-shadow: 0 1px 2px #000;
    }
    /* Glow */
    .inv-gslot.rarity-uncommon { box-shadow: ${INV.rarity.uncommon.glow}; }
    .inv-gslot.rarity-rare { box-shadow: ${INV.rarity.rare.glow}; }
    .inv-gslot.rarity-epic { box-shadow: ${INV.rarity.epic.glow}; }
    .inv-gslot.rarity-legendary { 
      box-shadow: ${INV.rarity.legendary.glow};
      animation: legendaryPulse 2s ease-in-out infinite;
    }

    /* ===== POPUP ===== */
    #inv-popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 10000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 20px;
    }
    #inv-popup {
      width: 90%;
      max-width: 360px;
      background: linear-gradient(180deg, #252a33 0%, ${INV.colors.panelBg} 100%);
      border: 3px solid ${INV.colors.border};
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 -4px 30px rgba(0,0,0,0.6);
    }
    #inv-popup.rarity-uncommon { border-color: ${INV.rarity.uncommon.border}; }
    #inv-popup.rarity-rare { border-color: ${INV.rarity.rare.border}; }
    #inv-popup.rarity-epic { border-color: ${INV.rarity.epic.border}; }
    #inv-popup.rarity-legendary { border-color: ${INV.rarity.legendary.border}; }
    
    #inv-popup-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;
    }
    #inv-popup-icon {
      width: 60px;
      height: 60px;
      background: url('assets/ui/invertory_slot_frame.png') center/cover no-repeat;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
    }
    #inv-popup-info { flex: 1; }
    #inv-popup-name {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 3px;
    }
    #inv-popup-meta {
      font-size: 11px;
      color: ${INV.colors.textMuted};
    }
    #inv-popup-stats {
      display: flex;
      gap: 12px;
      margin-top: 6px;
      font-size: 12px;
    }
    #inv-popup-btns {
      display: flex;
      gap: 10px;
    }
    .inv-btn {
      flex: 1;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .inv-btn-equip {
      background: linear-gradient(180deg, #2d6a4f 0%, #1b4332 100%);
      border: 2px solid #40916c;
      color: #fff;
      box-shadow: 0 4px 12px rgba(45,106,79,0.3);
    }
    .inv-btn-equip:hover { background: linear-gradient(180deg, #40916c 0%, #2d6a4f 100%); }
    .inv-btn-sell {
      background: transparent;
      border: 2px solid ${INV.colors.gold};
      color: ${INV.colors.gold};
    }
    .inv-btn-sell:hover { background: rgba(214,179,106,0.1); }

    /* ===== ANIMATIONS ===== */
    @keyframes legendaryPulse {
      0%, 100% { box-shadow: 0 0 14px rgba(214,179,106,0.5); }
      50% { box-shadow: 0 0 22px rgba(214,179,106,0.8); }
    }
  `;
  document.head.appendChild(style);

  // HTML
  inventoryOverlay = document.createElement('div');
  inventoryOverlay.id = 'inv-overlay';
  inventoryOverlay.innerHTML = `
    <div id="inv-panel">
      <!-- Header -->
      <div id="inv-header">
        <div>
          <h1>ИНВЕНТАРЬ</h1>
          <div class="subtitle">Warrior • Lv.42</div>
        </div>
        <button id="inv-close"></button>
      </div>
      
      <!-- Equipment -->
      <div id="inv-equip">
        <div class="inv-col" id="inv-left"></div>
        <div id="inv-char">
          <div id="inv-char-box">
            <span class="emoji">🧙‍♂️</span>
            <span class="name">Warrior</span>
            <span class="level">Уровень 42</span>
          </div>
        </div>
        <div class="inv-col" id="inv-right"></div>
      </div>
      
      <!-- Stats -->
      <div id="inv-stats">
        <div class="inv-stat">
          <span class="val" style="color:${INV.colors.red}">❤️ <span id="stat-hp">850</span></span>
          <span class="lbl">HP</span>
        </div>
        <div class="inv-stat">
          <span class="val" style="color:${INV.colors.gold}">⚔️ <span id="stat-atk">120</span></span>
          <span class="lbl">ATK</span>
        </div>
        <div class="inv-stat">
          <span class="val" style="color:${INV.colors.blue}">🛡️ <span id="stat-def">75</span></span>
          <span class="lbl">DEF</span>
        </div>
      </div>
      
      <!-- Grid -->
      <div id="inv-grid-section">
        <div id="inv-grid-header">
          <span class="title">Предметы</span>
          <span class="count" id="inv-count">0/24</span>
        </div>
        <div id="inv-grid"></div>
      </div>
    </div>
  `;
  document.body.appendChild(inventoryOverlay);

  // Events
  document.getElementById('inv-close').onclick = hideInventoryPanel;
  inventoryOverlay.onclick = (e) => {
    if (e.target === inventoryOverlay) hideInventoryPanel();
  };

  // Render
  renderEquipSlots();
  renderGrid();
  updateStats();

  console.log('[InventoryPanel] FINAL v8 created');
}

// ============================================================
//  RENDER EQUIPMENT
// ============================================================
function renderEquipSlots() {
  const left = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
  const right = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];
  
  document.getElementById('inv-left').innerHTML = left.map(t => equipSlotHTML(t)).join('');
  document.getElementById('inv-right').innerHTML = right.map(t => equipSlotHTML(t)).join('');
  
  // Click handlers
  document.querySelectorAll('.inv-eslot').forEach(el => {
    el.onclick = () => {
      const type = el.dataset.type;
      const item = invEquipped[type];
      if (item) showPopup(item, 'unequip');
    };
  });
}

function equipSlotHTML(type) {
  const item = invEquipped[type];
  const filled = item ? 'filled' : '';
  const rarity = item ? `rarity-${item.rarity}` : '';
  
  return `
    <div class="inv-eslot ${filled} ${rarity}" data-type="${type}">
      <span class="icon">${ICONS[type]}</span>
      ${item ? `<span class="lvl">${item.level}</span>` : ''}
      <span class="label">${LABELS[type]}</span>
    </div>
  `;
}

// ============================================================
//  RENDER GRID
// ============================================================
function renderGrid() {
  const total = INV.gridCols * INV.gridRows;
  let html = '';
  
  for (let i = 0; i < total; i++) {
    const item = invItems[i];
    if (item) {
      html += `
        <div class="inv-gslot filled rarity-${item.rarity}" data-id="${item.id}">
          <span class="icon">${ICONS[item.type]}</span>
          <span class="lvl">${item.level}</span>
        </div>
      `;
    } else {
      html += `<div class="inv-gslot empty"></div>`;
    }
  }
  
  document.getElementById('inv-grid').innerHTML = html;
  document.getElementById('inv-count').textContent = `${invItems.length}/${total}`;
  
  // Click handlers
  document.querySelectorAll('.inv-gslot.filled').forEach(el => {
    el.onclick = () => {
      const item = invItems.find(i => i.id === el.dataset.id);
      if (item) showPopup(item, 'equip');
    };
  });
}

// ============================================================
//  UPDATE STATS
// ============================================================
function updateStats() {
  const base = { hp: 850, atk: 120, def: 75 };
  
  Object.values(invEquipped).forEach(item => {
    if (item) {
      base.hp += item.hp || 0;
      base.atk += item.atk || 0;
      base.def += item.def || 0;
    }
  });
  
  document.getElementById('stat-hp').textContent = base.hp;
  document.getElementById('stat-atk').textContent = base.atk;
  document.getElementById('stat-def').textContent = base.def;
}

// ============================================================
//  POPUP
// ============================================================
function showPopup(item, action) {
  hidePopup();
  
  const r = INV.rarity[item.rarity];
  
  const overlay = document.createElement('div');
  overlay.id = 'inv-popup-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) hidePopup(); };
  
  overlay.innerHTML = `
    <div id="inv-popup" class="rarity-${item.rarity}">
      <div id="inv-popup-header">
        <div id="inv-popup-icon">${ICONS[item.type]}</div>
        <div id="inv-popup-info">
          <div id="inv-popup-name" style="color:${r.text}">${item.name}</div>
          <div id="inv-popup-meta">${r.name} • ${LABELS[item.type]} • Ур.${item.level}</div>
          <div id="inv-popup-stats">
            ${item.atk ? `<span style="color:${INV.colors.gold}">⚔️ +${item.atk}</span>` : ''}
            ${item.def ? `<span style="color:${INV.colors.blue}">🛡️ +${item.def}</span>` : ''}
            ${item.hp ? `<span style="color:${INV.colors.red}">❤️ +${item.hp}</span>` : ''}
          </div>
        </div>
      </div>
      <div id="inv-popup-btns">
        ${action === 'equip' 
          ? `<button class="inv-btn inv-btn-equip" id="popup-equip">✨ Надеть</button>`
          : `<button class="inv-btn inv-btn-equip" id="popup-unequip">📤 Снять</button>`
        }
        <button class="inv-btn inv-btn-sell" id="popup-sell">💰 Продать</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  inventoryPopup = overlay;
  
  // Buttons
  const equipBtn = document.getElementById('popup-equip');
  const unequipBtn = document.getElementById('popup-unequip');
  const sellBtn = document.getElementById('popup-sell');
  
  if (equipBtn) equipBtn.onclick = () => equipItem(item);
  if (unequipBtn) unequipBtn.onclick = () => unequipItem(item);
  if (sellBtn) sellBtn.onclick = () => sellItem(item);
}

function hidePopup() {
  if (inventoryPopup) {
    inventoryPopup.remove();
    inventoryPopup = null;
  }
}

// ============================================================
//  ACTIONS
// ============================================================
function equipItem(item) {
  // Если что-то надето — вернуть в инвентарь
  if (invEquipped[item.type]) {
    invItems.push(invEquipped[item.type]);
  }
  
  invEquipped[item.type] = item;
  invItems = invItems.filter(i => i.id !== item.id);
  
  hidePopup();
  renderEquipSlots();
  renderGrid();
  updateStats();
  
  console.log('[INV] Equipped:', item.name);
}

function unequipItem(item) {
  delete invEquipped[item.type];
  invItems.push(item);
  
  hidePopup();
  renderEquipSlots();
  renderGrid();
  updateStats();
  
  console.log('[INV] Unequipped:', item.name);
}

function sellItem(item) {
  // Удаляем из инвентаря или экипировки
  invItems = invItems.filter(i => i.id !== item.id);
  
  Object.keys(invEquipped).forEach(type => {
    if (invEquipped[type]?.id === item.id) {
      delete invEquipped[type];
    }
  });
  
  hidePopup();
  renderEquipSlots();
  renderGrid();
  updateStats();
  
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
//  API для внешнего использования
// ============================================================
function setInventoryItems(items) {
  invItems = items;
  if (inventoryOverlay) {
    renderGrid();
    updateStats();
  }
}

function setEquippedItems(equipped) {
  invEquipped = equipped;
  if (inventoryOverlay) {
    renderEquipSlots();
    updateStats();
  }
}

function getInventoryState() {
  return { items: invItems, equipped: invEquipped };
}

// ============================================================
//  EXPORTS
// ============================================================
window.createInventoryPanel = createInventoryOverlay;
window.showInventoryPanel = showInventoryPanel;
window.hideInventoryPanel = hideInventoryPanel;
window.toggleInventoryPanel = toggleInventoryPanel;
window.setInventoryItems = setInventoryItems;
window.setEquippedItems = setEquippedItems;
window.getInventoryState = getInventoryState;

Object.defineProperty(window, 'isInventoryOpen', {
  get: () => isInventoryOpen,
  set: (v) => { isInventoryOpen = v; },
  configurable: true
});

console.log('[InventoryPanel] FINAL v8 loaded');
