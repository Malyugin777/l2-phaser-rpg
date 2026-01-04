"use strict";

// ============================================================
//  INVENTORY PANEL — Phaser-based UI (Stone style)
//  Assets: Invertory_header, invertory_slot_frame, btn_close
// ============================================================

let isInventoryOpen = false;
let inventoryContainer = null;
let inventoryDimmer = null;
let inventoryScene = null;

// Inventory config
const INV_CONFIG = {
  slots: {
    columns: 5,
    rows: 4,
    gap: 6,
    targetSize: 64  // Target slot size in pixels
  },
  header: {
    targetWidth: 350  // Target header width
  },
  closeBtn: {
    targetSize: 40  // Target close button size
  },
  bodyColor: 0x1a1a1a,
  bodyPadding: 15,
  dimmerAlpha: 0.75
};

/**
 * Create inventory panel (called once from game.js)
 */
function createInventoryPanel(scene) {
  inventoryScene = scene;
  const w = scene.scale.width;
  const h = scene.scale.height;

  console.log('[INV] Creating Phaser-based inventory panel...');

  // === 1. DIMMER (Full screen dark overlay) ===
  inventoryDimmer = scene.add.rectangle(w/2, h/2, w, h, 0x000000, INV_CONFIG.dimmerAlpha);
  inventoryDimmer.setScrollFactor(0);
  inventoryDimmer.setDepth(999);
  inventoryDimmer.setInteractive();
  inventoryDimmer.setVisible(false);

  // Click on dimmer to close
  inventoryDimmer.on('pointerdown', () => {
    hideInventoryPanel();
  });

  // === 2. CONTAINER (Holds all inventory elements) ===
  inventoryContainer = scene.add.container(w/2, h/2);
  inventoryContainer.setScrollFactor(0);
  inventoryContainer.setDepth(1000);
  inventoryContainer.setVisible(false);

  // Get texture sizes
  const headerTex = scene.textures.get('Invertory_header');
  const slotTex = scene.textures.get('invertory_slot_frame');
  const closeTex = scene.textures.get('btn_close');

  const headerTexW = headerTex.getSourceImage().width;
  const headerTexH = headerTex.getSourceImage().height;
  const slotTexW = slotTex.getSourceImage().width;
  const slotTexH = slotTex.getSourceImage().height;
  const closeTexW = closeTex.getSourceImage().width;
  const closeTexH = closeTex.getSourceImage().height;

  // Calculate scales to fit target sizes
  const headerScale = INV_CONFIG.header.targetWidth / headerTexW;
  const slotScale = INV_CONFIG.slots.targetSize / slotTexW;
  const closeScale = INV_CONFIG.closeBtn.targetSize / closeTexW;

  // Scaled dimensions
  const headerW = headerTexW * headerScale;
  const headerH = headerTexH * headerScale;
  const slotW = slotTexW * slotScale;
  const slotH = slotTexH * slotScale;
  const closeW = closeTexW * closeScale;
  const closeH = closeTexH * closeScale;

  console.log('[INV] Texture sizes (original):',
    'header:', headerTexW, 'x', headerTexH,
    'slot:', slotTexW, 'x', slotTexH,
    'close:', closeTexW, 'x', closeTexH
  );
  console.log('[INV] Scales:',
    'header:', headerScale.toFixed(3),
    'slot:', slotScale.toFixed(3),
    'close:', closeScale.toFixed(3)
  );

  // Calculate body size based on slots grid
  const cfg = INV_CONFIG.slots;
  const gridW = cfg.columns * slotW + (cfg.columns - 1) * cfg.gap;
  const gridH = cfg.rows * slotH + (cfg.rows - 1) * cfg.gap;
  const bodyW = gridW + INV_CONFIG.bodyPadding * 2;
  const bodyH = gridH + INV_CONFIG.bodyPadding * 2;

  // Use header width if wider than body
  const panelW = Math.max(headerW, bodyW);

  // === 3. BODY BACKGROUND (Dark rectangle under slots) ===
  const bodyBg = scene.add.rectangle(
    0,
    headerH / 2 + bodyH / 2,  // Below header
    panelW,
    bodyH,
    INV_CONFIG.bodyColor
  );
  bodyBg.setOrigin(0.5);
  inventoryContainer.add(bodyBg);

  // === 4. HEADER SPRITE ===
  const header = scene.add.image(0, 0, 'Invertory_header');
  header.setOrigin(0.5, 0.5);
  header.setScale(headerScale);
  inventoryContainer.add(header);

  // === 5. HEADER TITLE TEXT ===
  const titleText = scene.add.text(0, -5, 'INVENTORY', {
    fontFamily: 'Georgia, serif',
    fontSize: '24px',
    color: '#d4a855',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3
  });
  titleText.setOrigin(0.5);
  inventoryContainer.add(titleText);

  // === 6. CLOSE BUTTON ===
  const closeBtn = scene.add.image(
    headerW / 2 - closeW / 2 - 5,  // Right side of header
    -headerH / 2 + closeH / 2 + 5,  // Top of header
    'btn_close'
  );
  closeBtn.setScale(closeScale);
  closeBtn.setInteractive({ useHandCursor: true });
  closeBtn.on('pointerdown', () => {
    hideInventoryPanel();
  });
  closeBtn.on('pointerover', () => closeBtn.setTint(0xcccccc));
  closeBtn.on('pointerout', () => closeBtn.clearTint());
  inventoryContainer.add(closeBtn);

  // === 7. INVENTORY SLOTS GRID ===
  const slotsContainer = scene.add.container(0, headerH / 2 + INV_CONFIG.bodyPadding + slotH / 2);
  inventoryContainer.add(slotsContainer);

  // Create slots
  const slots = [];
  const startX = -(gridW / 2) + slotW / 2;
  const startY = 0;

  for (let row = 0; row < cfg.rows; row++) {
    for (let col = 0; col < cfg.columns; col++) {
      const x = startX + col * (slotW + cfg.gap);
      const y = startY + row * (slotH + cfg.gap);

      const slot = scene.add.image(x, y, 'invertory_slot_frame');
      slot.setScale(slotScale);
      slot.setInteractive({ useHandCursor: true });

      // Slot click handler
      const slotIndex = row * cfg.columns + col;
      slot.setData('slotIndex', slotIndex);

      slot.on('pointerdown', () => {
        console.log('[INV] Slot clicked:', slotIndex);
        onSlotClick(slotIndex);
      });

      slot.on('pointerover', () => slot.setTint(0xaaaaaa));
      slot.on('pointerout', () => slot.clearTint());

      slotsContainer.add(slot);
      slots.push(slot);
    }
  }

  // Store slots reference
  inventoryContainer.setData('slots', slots);
  inventoryContainer.setData('slotsContainer', slotsContainer);

  // Center container vertically (adjust for header + body)
  const totalH = headerH + bodyH;
  inventoryContainer.y = h / 2 - (totalH / 2 - headerH / 2);

  console.log('[INV] Panel created. Slots:', slots.length);

  // Store globally
  window.inventoryContainer = inventoryContainer;
  window.inventoryDimmer = inventoryDimmer;
}

/**
 * Show inventory panel
 */
function showInventoryPanel() {
  if (!inventoryContainer || !inventoryDimmer) {
    console.warn('[INV] Panel not created yet!');
    return;
  }

  isInventoryOpen = true;
  inventoryDimmer.setVisible(true);
  inventoryContainer.setVisible(true);

  // Update slot contents
  updateInventorySlots();

  console.log('[INV] Panel opened');
}

/**
 * Hide inventory panel
 */
function hideInventoryPanel() {
  if (inventoryDimmer) inventoryDimmer.setVisible(false);
  if (inventoryContainer) inventoryContainer.setVisible(false);
  isInventoryOpen = false;

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

/**
 * Update inventory slot contents
 */
function updateInventorySlots() {
  if (!inventoryContainer) return;

  const slots = inventoryContainer.getData('slots');
  if (!slots) return;

  // Get inventory items from game state
  const items = getInventoryItems();

  slots.forEach((slot, index) => {
    // TODO: Display item icon if slot has item
    // For now just clear/reset
    slot.clearTint();
  });
}

/**
 * Get inventory items from game state
 */
function getInventoryItems() {
  // Integration with game state
  if (typeof window.inventory !== 'undefined' && Array.isArray(window.inventory)) {
    return window.inventory;
  }
  // Demo items
  return [];
}

/**
 * Handle slot click
 */
function onSlotClick(slotIndex) {
  const items = getInventoryItems();
  const item = items[slotIndex];

  if (item) {
    console.log('[INV] Selected item:', item);
    // TODO: Show item details popup
  } else {
    console.log('[INV] Empty slot:', slotIndex);
  }
}

// Expose globally
window.createInventoryPanel = createInventoryPanel;
window.showInventoryPanel = showInventoryPanel;
window.hideInventoryPanel = hideInventoryPanel;
window.toggleInventoryPanel = toggleInventoryPanel;
window.updateInventorySlots = updateInventorySlots;

// Getter/Setter for isInventoryOpen
Object.defineProperty(window, 'isInventoryOpen', {
  get: () => isInventoryOpen,
  set: (val) => { isInventoryOpen = val; },
  configurable: true
});

console.log('[InventoryPanel] Module loaded (Phaser stone style)');
