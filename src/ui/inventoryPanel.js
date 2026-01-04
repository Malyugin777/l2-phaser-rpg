"use strict";

// ============================================================
//  INVENTORY PANEL — HTML Overlay (v0 design)
//  Slots: helmet, chest, pants, gloves, boots, mainHand,
//         offHand, necklace, earring1, earring2, ring1, ring2
// ============================================================

let isInventoryOpen = false;
let inventoryOverlay = null;
let selectedInventoryItem = null;

// Rarity colors
const RARITY_COLORS = {
  common: { border: '#52525b', glow: 'none', text: '#a1a1aa' },
  uncommon: { border: '#22c55e', glow: '0 0 10px rgba(34,197,94,0.3)', text: '#4ade80' },
  rare: { border: '#3b82f6', glow: '0 0 10px rgba(59,130,246,0.3)', text: '#60a5fa' },
  epic: { border: '#a855f7', glow: '0 0 10px rgba(168,85,247,0.3)', text: '#c084fc' },
  legendary: { border: '#f59e0b', glow: '0 0 15px rgba(245,158,11,0.4)', text: '#fbbf24' }
};

// Equipment slot types
const SLOT_TYPES = [
  'helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand',
  'offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'
];

// Slot icons (SVG paths or emoji fallbacks)
const SLOT_ICONS = {
  helmet: '🪖',
  chest: '🛡️',
  pants: '👖',
  gloves: '🧤',
  boots: '👢',
  mainHand: '⚔️',
  offHand: '🛡️',
  necklace: '📿',
  earring1: '💎',
  earring2: '💎',
  ring1: '💍',
  ring2: '💍'
};

// Slot labels (Russian)
const SLOT_LABELS = {
  helmet: 'Шлем',
  chest: 'Броня',
  pants: 'Штаны',
  gloves: 'Перчатки',
  boots: 'Сапоги',
  mainHand: 'Оружие',
  offHand: 'Щит',
  necklace: 'Ожерелье',
  earring1: 'Серьга',
  earring2: 'Серьга',
  ring1: 'Кольцо',
  ring2: 'Кольцо'
};

/**
 * Create inventory overlay HTML
 */
function createInventoryOverlay() {
  if (inventoryOverlay) return;

  inventoryOverlay = document.createElement('div');
  inventoryOverlay.id = 'inventory-overlay';
  inventoryOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.95);
    z-index: 10000;
    display: none;
    overflow-y: auto;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #f4f4f5;
  `;

  inventoryOverlay.innerHTML = `
    <div id="inv-container" style="
      max-width: 390px;
      margin: 0 auto;
      min-height: 100%;
      background: linear-gradient(to bottom, #18181b, #09090b);
      position: relative;
    ">
      <!-- Header -->
      <div style="
        background: rgba(24,24,27,0.9);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid #27272a;
        padding: 16px;
        position: sticky;
        top: 0;
        z-index: 10;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <p style="font-size:14px;color:#a1a1aa;margin:0;">Воин</p>
            <p style="font-size:18px;font-weight:bold;margin:4px 0;" id="inv-player-name">Игрок</p>
            <p style="font-size:12px;color:#f59e0b;margin:0;" id="inv-player-level">Уровень 1</p>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
            <div style="display:flex;align-items:center;gap:4px;background:#27272a;padding:6px 12px;border-radius:20px;">
              <span style="font-size:14px;">🪙</span>
              <span style="font-size:14px;font-weight:600;" id="inv-gold">0</span>
            </div>
            <button id="inv-close-btn" style="
              width:36px;height:36px;
              background:#27272a;
              border:none;
              border-radius:50%;
              color:#f4f4f5;
              font-size:20px;
              cursor:pointer;
            ">✕</button>
          </div>
        </div>
      </div>

      <!-- Equipment Section -->
      <div style="padding:16px;">
        <!-- Equipment Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
          <!-- Left Column: Armor -->
          <div style="display:flex;flex-direction:column;gap:8px;" id="inv-left-slots"></div>

          <!-- Center: Character Preview -->
          <div style="display:flex;align-items:center;justify-content:center;">
            <div style="
              width:100px;height:140px;
              border-radius:12px;
              background:linear-gradient(135deg,#27272a,#18181b);
              border:2px solid #3f3f46;
              display:flex;
              align-items:center;
              justify-content:center;
            ">
              <span style="font-size:48px;opacity:0.5;">🧙</span>
            </div>
          </div>

          <!-- Right Column: Accessories -->
          <div style="display:flex;flex-direction:column;gap:8px;" id="inv-right-slots"></div>
        </div>

        <!-- Stats Bar -->
        <button id="inv-stats-btn" style="
          width:100%;
          background:rgba(39,39,42,0.5);
          border:1px solid #3f3f46;
          border-radius:8px;
          padding:12px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          cursor:pointer;
          margin-bottom:16px;
        ">
          <div style="display:flex;align-items:center;gap:16px;font-size:13px;">
            <span style="display:flex;align-items:center;gap:4px;">
              <span style="color:#ef4444;">❤️</span>
              <span style="font-weight:600;" id="inv-stat-hp">0</span>
            </span>
            <span style="color:#3f3f46;">•</span>
            <span style="display:flex;align-items:center;gap:4px;">
              <span style="color:#f97316;">⚔️</span>
              <span style="font-weight:600;" id="inv-stat-atk">0</span>
            </span>
            <span style="color:#3f3f46;">•</span>
            <span style="display:flex;align-items:center;gap:4px;">
              <span style="color:#3b82f6;">🛡️</span>
              <span style="font-weight:600;" id="inv-stat-def">0</span>
            </span>
          </div>
          <span style="color:#71717a;font-size:16px;">›</span>
        </button>

        <!-- Inventory Title -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-size:18px;font-weight:bold;margin:0;">Инвентарь</h2>
          <span style="font-size:14px;color:#71717a;" id="inv-count">0 предметов</span>
        </div>

        <!-- Inventory Grid -->
        <div id="inv-grid" style="
          display:grid;
          grid-template-columns:repeat(6,1fr);
          gap:6px;
          padding-bottom:100px;
        "></div>
      </div>

      <!-- Action Bar (fixed bottom) -->
      <div id="inv-action-bar" style="
        position:fixed;
        bottom:0;
        left:50%;
        transform:translateX(-50%);
        width:100%;
        max-width:390px;
        background:rgba(24,24,27,0.95);
        backdrop-filter:blur(8px);
        border-top:1px solid #27272a;
        padding:16px;
        display:none;
      ">
        <div style="text-align:center;margin-bottom:8px;">
          <p id="inv-selected-name" style="font-size:14px;font-weight:bold;margin:0;"></p>
          <p id="inv-selected-info" style="font-size:12px;color:#71717a;margin:4px 0 0 0;"></p>
        </div>
        <div style="display:flex;gap:8px;">
          <button id="inv-equip-btn" style="
            flex:1;
            padding:12px;
            background:#2563eb;
            border:none;
            border-radius:8px;
            color:white;
            font-weight:600;
            font-size:14px;
            cursor:pointer;
          ">✨ Надеть</button>
          <button id="inv-sell-btn" style="
            flex:1;
            padding:12px;
            background:transparent;
            border:1px solid #d97706;
            border-radius:8px;
            color:#fbbf24;
            font-weight:600;
            font-size:14px;
            cursor:pointer;
          ">🪙 Продать</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(inventoryOverlay);

  // Build equipment slots
  buildEquipmentSlots();

  // Event listeners
  document.getElementById('inv-close-btn').onclick = hideInventoryPanel;
  document.getElementById('inv-equip-btn').onclick = equipSelectedItem;
  document.getElementById('inv-sell-btn').onclick = sellSelectedItem;

  // Close on background click
  inventoryOverlay.onclick = (e) => {
    if (e.target === inventoryOverlay) hideInventoryPanel();
  };
}

/**
 * Build equipment slot HTML
 */
function buildEquipmentSlots() {
  const leftSlots = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
  const rightSlots = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];

  const leftContainer = document.getElementById('inv-left-slots');
  const rightContainer = document.getElementById('inv-right-slots');

  leftSlots.forEach(slot => {
    leftContainer.appendChild(createSlotElement(slot));
  });

  rightSlots.forEach(slot => {
    rightContainer.appendChild(createSlotElement(slot));
  });
}

/**
 * Create single equipment slot element
 */
function createSlotElement(slotType) {
  const div = document.createElement('div');
  div.id = `inv-slot-${slotType}`;
  div.dataset.slot = slotType;
  div.style.cssText = `
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:4px;
  `;
  div.innerHTML = `
    <div class="slot-box" style="
      width:56px;height:56px;
      border-radius:8px;
      border:2px solid #3f3f46;
      background:rgba(24,24,27,0.5);
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      transition:all 0.2s;
    ">
      <span style="font-size:24px;opacity:0.5;">${SLOT_ICONS[slotType]}</span>
    </div>
    <span style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">
      ${SLOT_LABELS[slotType]}
    </span>
  `;

  // Click handler for equipped item
  div.querySelector('.slot-box').onclick = () => {
    const equipped = getEquippedItem(slotType);
    if (equipped) {
      selectItem(equipped, slotType);
    }
  };

  return div;
}

/**
 * Get equipped item from game state
 */
function getEquippedItem(slotType) {
  // Integration with game state
  if (typeof window.equipment !== 'undefined') {
    return window.equipment[slotType] || null;
  }
  return null;
}

/**
 * Get inventory items from game state
 */
function getInventoryItems() {
  // Integration with game state
  if (typeof window.inventory !== 'undefined' && Array.isArray(window.inventory)) {
    return window.inventory;
  }
  // Demo items for testing
  return [
    { id: '1', name: 'Железный меч', type: 'mainHand', rarity: 'common', level: 5, attack: 25 },
    { id: '2', name: 'Мистический шлем', type: 'helmet', rarity: 'rare', level: 8, defense: 15, hp: 50 },
    { id: '3', name: 'Кожаные сапоги', type: 'boots', rarity: 'uncommon', level: 3, defense: 8 },
    { id: '4', name: 'Драконий клинок', type: 'mainHand', rarity: 'epic', level: 15, attack: 85 },
    { id: '5', name: 'Стальная кираса', type: 'chest', rarity: 'uncommon', level: 6, defense: 30 },
    { id: '6', name: 'Магическое кольцо', type: 'ring1', rarity: 'rare', level: 10, hp: 100 },
  ];
}

/**
 * Select an item
 */
function selectItem(item, fromSlot = null) {
  selectedInventoryItem = { ...item, fromSlot };

  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

  document.getElementById('inv-selected-name').textContent = item.name;
  document.getElementById('inv-selected-name').style.color = rarity.text;
  document.getElementById('inv-selected-info').textContent =
    `Ур. ${item.level} • ${SLOT_LABELS[item.type] || item.type}`;

  // Update action bar button text
  const equipBtn = document.getElementById('inv-equip-btn');
  if (fromSlot) {
    equipBtn.textContent = '📤 Снять';
  } else {
    equipBtn.textContent = '✨ Надеть';
  }

  document.getElementById('inv-action-bar').style.display = 'block';

  // Highlight selected item in grid
  document.querySelectorAll('.inv-item').forEach(el => {
    el.style.transform = el.dataset.id === item.id ? 'scale(0.95)' : 'scale(1)';
  });
}

/**
 * Equip selected item
 */
function equipSelectedItem() {
  if (!selectedInventoryItem) return;

  const item = selectedInventoryItem;

  if (item.fromSlot) {
    // Unequip: move to inventory
    if (typeof window.equipment !== 'undefined') {
      window.equipment[item.fromSlot] = null;
    }
    console.log('[INV] Unequipped:', item.name);
  } else {
    // Equip: move from inventory to slot
    if (typeof window.equipment !== 'undefined') {
      window.equipment[item.type] = item;
    }
    console.log('[INV] Equipped:', item.name);
  }

  selectedInventoryItem = null;
  document.getElementById('inv-action-bar').style.display = 'none';
  updateInventoryPanel();
}

/**
 * Sell selected item
 */
function sellSelectedItem() {
  if (!selectedInventoryItem) return;

  const item = selectedInventoryItem;
  const sellPrice = (item.level || 1) * 10;

  // Add gold
  if (typeof window.wallet !== 'undefined') {
    window.wallet.gold = (window.wallet.gold || 0) + sellPrice;
  }

  console.log('[INV] Sold:', item.name, 'for', sellPrice, 'gold');

  selectedInventoryItem = null;
  document.getElementById('inv-action-bar').style.display = 'none';
  updateInventoryPanel();
}

/**
 * Update inventory display
 */
function updateInventoryPanel() {
  if (!inventoryOverlay) return;

  // Update player info
  const playerName = window.profile?.name || window.heroState?.nickname || 'Игрок';
  const playerLevel = window.stats?.level || window.heroState?.level || 1;
  const gold = window.wallet?.gold || window.heroState?.adena || 0;

  document.getElementById('inv-player-name').textContent = playerName;
  document.getElementById('inv-player-level').textContent = `Уровень ${playerLevel}`;
  document.getElementById('inv-gold').textContent = gold.toLocaleString();

  // Update stats
  const hp = window.stats?.maxHp || 100;
  const atk = window.stats?.pAtk || 10;
  const def = window.stats?.pDef || 5;

  document.getElementById('inv-stat-hp').textContent = hp;
  document.getElementById('inv-stat-atk').textContent = atk;
  document.getElementById('inv-stat-def').textContent = def;

  // Update equipment slots
  SLOT_TYPES.forEach(slot => {
    const slotEl = document.getElementById(`inv-slot-${slot}`);
    if (!slotEl) return;

    const item = getEquippedItem(slot);
    const box = slotEl.querySelector('.slot-box');

    if (item) {
      const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
      box.style.borderColor = rarity.border;
      box.style.boxShadow = rarity.glow;
      box.style.background = 'linear-gradient(135deg,#27272a,#18181b)';
      box.innerHTML = `<span style="font-size:24px;">${SLOT_ICONS[slot]}</span>`;
    } else {
      box.style.borderColor = '#3f3f46';
      box.style.boxShadow = 'none';
      box.style.background = 'rgba(24,24,27,0.5)';
      box.innerHTML = `<span style="font-size:24px;opacity:0.5;">${SLOT_ICONS[slot]}</span>`;
    }
  });

  // Update inventory grid
  const items = getInventoryItems();
  const grid = document.getElementById('inv-grid');
  grid.innerHTML = '';

  document.getElementById('inv-count').textContent = `${items.length} предметов`;

  items.forEach(item => {
    const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

    const itemEl = document.createElement('button');
    itemEl.className = 'inv-item';
    itemEl.dataset.id = item.id;
    itemEl.style.cssText = `
      aspect-ratio:1;
      border-radius:8px;
      border:2px solid ${rarity.border};
      box-shadow:${rarity.glow};
      background:linear-gradient(135deg,#27272a,#18181b);
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      padding:4px;
      cursor:pointer;
      position:relative;
      transition:transform 0.15s;
    `;

    itemEl.innerHTML = `
      <span style="font-size:20px;">${SLOT_ICONS[item.type] || '📦'}</span>
      <span style="
        position:absolute;
        top:2px;right:2px;
        background:rgba(0,0,0,0.8);
        border-radius:4px;
        padding:1px 4px;
        font-size:9px;
        font-weight:bold;
        color:#fbbf24;
      ">${item.level}</span>
    `;

    itemEl.onclick = () => selectItem(item);
    grid.appendChild(itemEl);
  });
}

/**
 * Show inventory panel
 */
function showInventoryPanel() {
  if (!inventoryOverlay) {
    createInventoryOverlay();
  }

  isInventoryOpen = true;
  inventoryOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Hide action bar
  document.getElementById('inv-action-bar').style.display = 'none';
  selectedInventoryItem = null;

  updateInventoryPanel();

  console.log('[INV] Panel opened');
}

/**
 * Hide inventory panel
 */
function hideInventoryPanel() {
  if (inventoryOverlay) {
    inventoryOverlay.style.display = 'none';
  }
  isInventoryOpen = false;
  document.body.style.overflow = '';

  console.log('[INV] Panel closed');
}

/**
 * Toggle inventory panel
 */
function toggleInventoryPanel() {
  if (isInventoryOpen) {
    hideInventoryPanel();
  } else {
    showInventoryPanel();
  }
}

// Expose globally
window.showInventoryPanel = showInventoryPanel;
window.hideInventoryPanel = hideInventoryPanel;
window.toggleInventoryPanel = toggleInventoryPanel;
window.updateInventoryPanel = updateInventoryPanel;
window.isInventoryOpen = false;

// Getter for isInventoryOpen
Object.defineProperty(window, 'isInventoryOpen', {
  get: () => isInventoryOpen,
  set: (val) => { isInventoryOpen = val; }
});

console.log('[InventoryPanel] Module loaded (v0 design)');
