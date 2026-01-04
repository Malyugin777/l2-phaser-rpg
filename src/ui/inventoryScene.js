"use strict";

// ============================================================
//  INVENTORY SCENE — Pure Phaser (Overlay Mode)
//  Работает ПАРАЛЛЕЛЬНО с MainScene, не ставит на паузу
// ============================================================

class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });
    
    // Data
    this.equippedItems = {};
    this.inventoryItems = [
      { id: "1", name: "Iron Sword", type: "mainHand", rarity: "common", level: 5, attack: 25 },
      { id: "2", name: "Mystic Helm", type: "helmet", rarity: "rare", level: 8, defense: 15, hp: 50 },
      { id: "3", name: "Leather Boots", type: "boots", rarity: "uncommon", level: 3, defense: 8 },
      { id: "4", name: "Dragon Blade", type: "mainHand", rarity: "epic", level: 15, attack: 85 },
      { id: "5", name: "Steel Plate", type: "chest", rarity: "uncommon", level: 6, defense: 30 },
      { id: "6", name: "Magic Ring", type: "ring1", rarity: "rare", level: 10, hp: 100 },
      { id: "7", name: "Warrior Gloves", type: "gloves", rarity: "common", level: 4, defense: 5 },
      { id: "8", name: "Phoenix Armor", type: "chest", rarity: "epic", level: 20, defense: 65, hp: 200 },
    ];
    
    this.selectedItem = null;
    this.popup = null;
  }

  // ============================================================
  //  PRELOAD — если ассеты ещё не загружены
  // ============================================================
  preload() {
    // Проверяем, загружены ли уже текстуры
    if (!this.textures.exists('inv_bg')) {
      this.load.image('inv_bg', 'assets/ui/phone_invertory_v2.png');
    }
    if (!this.textures.exists('inv_header')) {
      this.load.image('inv_header', 'assets/ui/Invertory_header.png');
    }
    if (!this.textures.exists('inv_slot')) {
      this.load.image('inv_slot', 'assets/ui/invertory_slot_frame.png');
    }
    if (!this.textures.exists('inv_close')) {
      this.load.image('inv_close', 'assets/ui/btn_close.png');
    }
  }

  // ============================================================
  //  CREATE
  // ============================================================
  create() {
    const W = this.scale.width;   // 780
    const H = this.scale.height;  // 1688
    
    console.log('[INV_SCENE] Creating, size:', W, 'x', H);

    // ========== CONFIG ==========
    this.CFG = {
      // Colors
      dimmerAlpha: 0.75,
      rarityColors: {
        common:   { color: 0x52525b, glow: 0x52525b },
        uncommon: { color: 0x22c55e, glow: 0x22c55e },
        rare:     { color: 0x3b82f6, glow: 0x3b82f6 },
        epic:     { color: 0xa855f7, glow: 0xa855f7 },
        legendary:{ color: 0xf59e0b, glow: 0xf59e0b }
      },
      
      // Layout
      headerHeight: 80,
      statsBarHeight: 60,
      statsBarY: 0, // Will calculate
      gridStartY: 0, // Will calculate
      
      // Slots
      equipSlotSize: 72,
      equipSlotGap: 12,
      gridSlotSize: 56,
      gridCols: 6,
      gridRows: 4,
      gridGap: 8,
      
      // Positions
      leftColX: 100,
      rightColX: W - 100,
      centerX: W / 2,
    };

    // ========== 1. DIMMER (полупрозрачный фон) ==========
    this.dimmer = this.add.rectangle(W/2, H/2, W, H, 0x000000, this.CFG.dimmerAlpha);
    this.dimmer.setInteractive(); // Блокирует клики сквозь
    this.dimmer.on('pointerdown', () => this.closeInventory());

    // ========== 2. MAIN CONTAINER ==========
    this.mainContainer = this.add.container(0, 0);

    // ========== 3. BACKGROUND (каменная плита) ==========
    this.createBackground(W, H);

    // ========== 4. HEADER ==========
    this.createHeader(W);

    // ========== 5. EQUIPMENT SLOTS ==========
    this.createEquipmentSlots(W, H);

    // ========== 6. CHARACTER PREVIEW ==========
    this.createCharPreview(W);

    // ========== 7. STATS BAR ==========
    this.createStatsBar(W);

    // ========== 8. INVENTORY GRID ==========
    this.createInventoryGrid(W, H);

    // ========== 9. INPUT ==========
    this.setupInput();

    console.log('[INV_SCENE] Created successfully');
  }

  // ============================================================
  //  BACKGROUND
  // ============================================================
  createBackground(W, H) {
    // Позиция: от низа header до верха grid
    const bgTopY = this.CFG.headerHeight;
    const bgBottomY = H * 0.52; // Примерно до stats
    const bgHeight = bgBottomY - bgTopY;
    
    if (this.textures.exists('inv_bg')) {
      this.bg = this.add.image(W / 2, bgTopY, 'inv_bg');
      this.bg.setOrigin(0.5, 0);
      this.bg.setDisplaySize(W * 0.95, bgHeight);
    } else {
      // Fallback — градиент через graphics
      this.bg = this.add.graphics();
      this.bg.fillGradientStyle(0x27272a, 0x27272a, 0x18181b, 0x18181b, 1);
      this.bg.fillRect(W * 0.025, bgTopY, W * 0.95, bgHeight);
    }
    
    this.mainContainer.add(this.bg);
    this.CFG.statsBarY = bgBottomY + 10;
  }

  // ============================================================
  //  HEADER
  // ============================================================
  createHeader(W) {
    const headerY = 0;
    
    // Header background
    if (this.textures.exists('inv_header')) {
      this.header = this.add.image(W / 2, headerY, 'inv_header');
      this.header.setOrigin(0.5, 0);
      this.header.setDisplaySize(W, this.CFG.headerHeight);
    } else {
      this.header = this.add.rectangle(W / 2, headerY + this.CFG.headerHeight / 2, W, this.CFG.headerHeight, 0x27272a);
    }
    this.mainContainer.add(this.header);
    
    // Title
    this.title = this.add.text(W / 2, headerY + 40, 'Инвентарь', {
      fontFamily: 'Verdana, Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.mainContainer.add(this.title);
    
    // Close button
    if (this.textures.exists('inv_close')) {
      this.closeBtn = this.add.image(W - 50, headerY + 40, 'inv_close');
      this.closeBtn.setDisplaySize(40, 40);
    } else {
      this.closeBtn = this.add.text(W - 50, headerY + 40, '✕', {
        fontSize: '32px',
        color: '#ff6666'
      }).setOrigin(0.5);
    }
    this.closeBtn.setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.closeInventory());
    this.closeBtn.on('pointerover', () => this.closeBtn.setScale(1.1));
    this.closeBtn.on('pointerout', () => this.closeBtn.setScale(1.0));
    this.mainContainer.add(this.closeBtn);
  }

  // ============================================================
  //  EQUIPMENT SLOTS
  // ============================================================
  createEquipmentSlots(W, H) {
    const cfg = this.CFG;
    const startY = cfg.headerHeight + 30;
    const slotSize = cfg.equipSlotSize;
    const gap = cfg.equipSlotGap;
    
    const leftSlots = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
    const rightSlots = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];
    
    const labels = {
      helmet: 'Шлем', chest: 'Броня', pants: 'Штаны', gloves: 'Перчатки',
      boots: 'Ботинки', mainHand: 'Оружие', offHand: 'Щит', necklace: 'Ожерелье',
      earring1: 'Серьга', earring2: 'Серьга', ring1: 'Кольцо', ring2: 'Кольцо'
    };
    
    const icons = {
      helmet: '🪖', chest: '🛡️', pants: '👖', gloves: '🧤',
      boots: '👢', mainHand: '⚔️', offHand: '🛡️', necklace: '📿',
      earring1: '💎', earring2: '💎', ring1: '💍', ring2: '💍'
    };

    this.equipSlots = {};

    // Left column
    leftSlots.forEach((type, i) => {
      const x = cfg.leftColX;
      const y = startY + i * (slotSize + gap);
      this.equipSlots[type] = this.createEquipSlot(x, y, type, labels[type], icons[type]);
    });

    // Right column
    rightSlots.forEach((type, i) => {
      const x = cfg.rightColX;
      const y = startY + i * (slotSize + gap);
      this.equipSlots[type] = this.createEquipSlot(x, y, type, labels[type], icons[type]);
    });
  }

  createEquipSlot(x, y, type, label, icon) {
    const size = this.CFG.equipSlotSize;
    const container = this.add.container(x, y);
    
    // Slot background
    let slotBg;
    if (this.textures.exists('inv_slot')) {
      slotBg = this.add.image(0, 0, 'inv_slot');
      slotBg.setDisplaySize(size, size);
    } else {
      slotBg = this.add.rectangle(0, 0, size, size, 0x27272a);
      slotBg.setStrokeStyle(2, 0x3f3f46);
    }
    container.add(slotBg);
    
    // Icon
    const iconText = this.add.text(0, 0, icon, {
      fontSize: '28px'
    }).setOrigin(0.5).setAlpha(0.5);
    container.add(iconText);
    
    // Label
    const labelText = this.add.text(0, size / 2 + 12, label, {
      fontFamily: 'Verdana',
      fontSize: '11px',
      color: '#71717a'
    }).setOrigin(0.5);
    container.add(labelText);
    
    // Interactive
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.on('pointerover', () => slotBg.setTint(0x4a4a52));
    slotBg.on('pointerout', () => slotBg.clearTint());
    slotBg.on('pointerdown', () => this.onEquipSlotClick(type));
    
    this.mainContainer.add(container);
    
    return { container, bg: slotBg, icon: iconText, label: labelText, type, item: null };
  }

  // ============================================================
  //  CHARACTER PREVIEW
  // ============================================================
  createCharPreview(W) {
    const cfg = this.CFG;
    const y = cfg.headerHeight + 200;
    const size = 120;
    
    // Preview background
    const previewBg = this.add.rectangle(W / 2, y, size, size, 0x18181b);
    previewBg.setStrokeStyle(3, 0x3f3f46);
    this.mainContainer.add(previewBg);
    
    // Character icon (placeholder)
    const charIcon = this.add.text(W / 2, y, '🛡️', {
      fontSize: '48px'
    }).setOrigin(0.5).setAlpha(0.6);
    this.mainContainer.add(charIcon);
    
    // Shadow under character
    const shadow = this.add.ellipse(W / 2, y + 45, 60, 15, 0x000000, 0.3);
    this.mainContainer.add(shadow);
    
    this.charPreview = { bg: previewBg, icon: charIcon, shadow };
  }

  // ============================================================
  //  STATS BAR
  // ============================================================
  createStatsBar(W) {
    const y = this.CFG.statsBarY || this.scale.height * 0.52;
    const barW = W - 40;
    const barH = 50;
    
    // Background
    const statsBg = this.add.rectangle(W / 2, y, barW, barH, 0x27272a, 0.8);
    statsBg.setStrokeStyle(1, 0x3f3f46);
    this.mainContainer.add(statsBg);
    
    // Stats
    const stats = this.calculateStats();
    
    const statsText = this.add.text(W / 2, y, 
      `❤️ ${stats.hp}     ⚔️ ${stats.atk}     🛡️ ${stats.def}`, {
      fontFamily: 'Verdana',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.mainContainer.add(statsText);
    
    this.statsBar = { bg: statsBg, text: statsText };
    this.CFG.gridStartY = y + barH / 2 + 60;
  }

  calculateStats() {
    let hp = 850, atk = 120, def = 75;
    Object.values(this.equippedItems).forEach(item => {
      if (item) {
        hp += item.hp || 0;
        atk += item.attack || 0;
        def += item.defense || 0;
      }
    });
    return { hp, atk, def };
  }

  updateStatsDisplay() {
    const stats = this.calculateStats();
    this.statsBar.text.setText(`❤️ ${stats.hp}     ⚔️ ${stats.atk}     🛡️ ${stats.def}`);
  }

  // ============================================================
  //  INVENTORY GRID
  // ============================================================
  createInventoryGrid(W, H) {
    const cfg = this.CFG;
    const startY = cfg.gridStartY || H * 0.56;
    const slotSize = cfg.gridSlotSize;
    const gap = cfg.gridGap;
    const cols = cfg.gridCols;
    const rows = cfg.gridRows;
    
    const gridW = cols * slotSize + (cols - 1) * gap;
    const startX = (W - gridW) / 2 + slotSize / 2;
    
    // Title
    const titleY = startY - 30;
    const gridTitle = this.add.text(40, titleY, 'Предметы', {
      fontFamily: 'Verdana',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    this.mainContainer.add(gridTitle);
    
    const countText = this.add.text(W - 40, titleY, `${this.inventoryItems.length} шт`, {
      fontFamily: 'Verdana',
      fontSize: '12px',
      color: '#71717a'
    }).setOrigin(1, 0);
    this.mainContainer.add(countText);
    this.gridCountText = countText;
    
    // Grid slots
    this.gridSlots = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (slotSize + gap);
        const y = startY + row * (slotSize + gap);
        const idx = row * cols + col;
        
        const slot = this.createGridSlot(x, y, idx);
        this.gridSlots.push(slot);
      }
    }
    
    // Populate with items
    this.refreshGrid();
  }

  createGridSlot(x, y, index) {
    const size = this.CFG.gridSlotSize;
    const container = this.add.container(x, y);
    
    // Slot background
    let slotBg;
    if (this.textures.exists('inv_slot')) {
      slotBg = this.add.image(0, 0, 'inv_slot');
      slotBg.setDisplaySize(size, size);
    } else {
      slotBg = this.add.rectangle(0, 0, size, size, 0x27272a);
      slotBg.setStrokeStyle(1, 0x3f3f46);
    }
    container.add(slotBg);
    
    // Item icon (hidden by default)
    const itemIcon = this.add.text(0, 0, '', {
      fontSize: '22px'
    }).setOrigin(0.5).setVisible(false);
    container.add(itemIcon);
    
    // Level badge (hidden by default)
    const levelBadge = this.add.text(size/2 - 5, -size/2 + 5, '', {
      fontFamily: 'Verdana',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#fbbf24',
      backgroundColor: '#000000',
      padding: { x: 2, y: 1 }
    }).setOrigin(1, 0).setVisible(false);
    container.add(levelBadge);
    
    // Interactive
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.on('pointerdown', () => this.onGridSlotClick(index));
    
    this.mainContainer.add(container);
    
    return { 
      container, bg: slotBg, icon: itemIcon, level: levelBadge, 
      index, item: null, x, y 
    };
  }

  refreshGrid() {
    const icons = {
      helmet: '🪖', chest: '🛡️', pants: '👖', gloves: '🧤',
      boots: '👢', mainHand: '⚔️', offHand: '🛡️', necklace: '📿',
      earring1: '💎', earring2: '💎', ring1: '💍', ring2: '💍'
    };
    
    this.gridSlots.forEach((slot, i) => {
      const item = this.inventoryItems[i];
      slot.item = item || null;
      
      if (item) {
        slot.icon.setText(icons[item.type] || '📦');
        slot.icon.setVisible(true);
        slot.level.setText(item.level);
        slot.level.setVisible(true);
        
        // Rarity border
        const rarity = this.CFG.rarityColors[item.rarity] || this.CFG.rarityColors.common;
        if (slot.bg.setStrokeStyle) {
          slot.bg.setStrokeStyle(2, rarity.color);
        } else {
          slot.bg.setTint(rarity.color);
        }
        
        slot.bg.setAlpha(1);
      } else {
        slot.icon.setVisible(false);
        slot.level.setVisible(false);
        if (slot.bg.setStrokeStyle) {
          slot.bg.setStrokeStyle(1, 0x3f3f46);
        }
        slot.bg.setAlpha(0.5);
      }
    });
    
    // Update count
    if (this.gridCountText) {
      this.gridCountText.setText(`${this.inventoryItems.length} шт`);
    }
  }

  // ============================================================
  //  INPUT
  // ============================================================
  setupInput() {
    // ESC to close
    this.input.keyboard.on('keydown-ESC', () => this.closeInventory());
    
    // I to toggle (close)
    this.input.keyboard.on('keydown-I', () => this.closeInventory());
  }

  // ============================================================
  //  SLOT CLICKS
  // ============================================================
  onEquipSlotClick(type) {
    console.log('[INV] Equip slot clicked:', type);
    const slot = this.equipSlots[type];
    if (slot.item) {
      // TODO: Unequip
    }
  }

  onGridSlotClick(index) {
    const slot = this.gridSlots[index];
    if (!slot.item) return;
    
    console.log('[INV] Grid slot clicked:', index, slot.item.name);
    
    // Close existing popup
    this.closePopup();
    
    // Select
    this.selectedItem = slot.item;
    slot.bg.setScale(0.9);
    
    // Show popup
    this.showPopup(slot.x, slot.y - 60, slot.item);
  }

  // ============================================================
  //  POPUP
  // ============================================================
  showPopup(x, y, item) {
    const popupW = 160;
    const popupH = 100;
    
    this.popup = this.add.container(x, y);
    
    // Background
    const bg = this.add.rectangle(0, 0, popupW, popupH, 0x18181b, 0.95);
    bg.setStrokeStyle(1, 0x3f3f46);
    this.popup.add(bg);
    
    // Item name
    const rarity = this.CFG.rarityColors[item.rarity] || this.CFG.rarityColors.common;
    const nameText = this.add.text(0, -30, item.name, {
      fontFamily: 'Verdana',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#' + rarity.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    this.popup.add(nameText);
    
    // Equip button
    const equipBtn = this.add.rectangle(0, 5, 120, 30, 0x2563eb);
    equipBtn.setInteractive({ useHandCursor: true });
    equipBtn.on('pointerdown', () => this.equipItem(item));
    equipBtn.on('pointerover', () => equipBtn.setFillStyle(0x3b82f6));
    equipBtn.on('pointerout', () => equipBtn.setFillStyle(0x2563eb));
    this.popup.add(equipBtn);
    
    const equipText = this.add.text(0, 5, '✨ Надеть', {
      fontFamily: 'Verdana',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.popup.add(equipText);
    
    // Sell button
    const sellBtn = this.add.rectangle(0, 40, 120, 30, 0x000000, 0);
    sellBtn.setStrokeStyle(2, 0xf59e0b);
    sellBtn.setInteractive({ useHandCursor: true });
    sellBtn.on('pointerdown', () => this.sellItem(item));
    sellBtn.on('pointerover', () => sellBtn.setFillStyle(0xf59e0b, 0.2));
    sellBtn.on('pointerout', () => sellBtn.setFillStyle(0x000000, 0));
    this.popup.add(sellBtn);
    
    const sellText = this.add.text(0, 40, '💰 Продать', {
      fontFamily: 'Verdana',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f59e0b'
    }).setOrigin(0.5);
    this.popup.add(sellText);
    
    // Arrow
    const arrow = this.add.triangle(0, popupH/2 + 8, -8, 0, 8, 0, 0, 10, 0x18181b);
    this.popup.add(arrow);
    
    this.mainContainer.add(this.popup);
  }

  closePopup() {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    
    // Deselect all
    this.gridSlots.forEach(slot => slot.bg.setScale(1));
    this.selectedItem = null;
  }

  // ============================================================
  //  ACTIONS
  // ============================================================
  equipItem(item) {
    console.log('[INV] Equipping:', item.name);
    
    // Add to equipped
    this.equippedItems[item.type] = item;
    
    // Remove from inventory
    this.inventoryItems = this.inventoryItems.filter(i => i.id !== item.id);
    
    // Update UI
    this.closePopup();
    this.refreshGrid();
    this.updateStatsDisplay();
    this.updateEquipSlot(item.type);
  }

  sellItem(item) {
    console.log('[INV] Selling:', item.name);
    
    // Remove from inventory
    this.inventoryItems = this.inventoryItems.filter(i => i.id !== item.id);
    
    // Update UI
    this.closePopup();
    this.refreshGrid();
  }

  updateEquipSlot(type) {
    const slot = this.equipSlots[type];
    const item = this.equippedItems[type];
    
    if (item) {
      const icons = {
        helmet: '🪖', chest: '🛡️', pants: '👖', gloves: '🧤',
        boots: '👢', mainHand: '⚔️', offHand: '🛡️', necklace: '📿',
        earring1: '💎', earring2: '💎', ring1: '💍', ring2: '💍'
      };
      
      slot.icon.setText(icons[type]);
      slot.icon.setAlpha(1);
      slot.item = item;
      
      // Rarity glow
      const rarity = this.CFG.rarityColors[item.rarity];
      if (slot.bg.setStrokeStyle) {
        slot.bg.setStrokeStyle(3, rarity.color);
      }
    }
  }

  // ============================================================
  //  CLOSE
  // ============================================================
  closeInventory() {
    console.log('[INV_SCENE] Closing');
    this.closePopup();
    this.scene.stop('InventoryScene');
  }
}

// ============================================================
//  EXPORTS
// ============================================================
window.InventoryScene = InventoryScene;

console.log('[InventoryScene] Phaser scene loaded');
