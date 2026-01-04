"use strict";

// ============================================================
//  INVENTORY SCENE v2 — Pure Phaser (МОНОЛИТНЫЙ LAYOUT)
//  Жирно и богато, без бомжатины
// ============================================================

class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });
    
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

  preload() {
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

  create() {
    const W = this.scale.width;   // 780
    const H = this.scale.height;  // 1688
    
    console.log('[INV_SCENE] Creating v2, size:', W, 'x', H);

    // ========== CONFIG v2 — ЖИРНЫЕ РАЗМЕРЫ ==========
    this.CFG = {
      // Colors
      dimmerAlpha: 0.85, // Темнее!
      
      rarityColors: {
        common:   { color: 0x52525b },
        uncommon: { color: 0x22c55e },
        rare:     { color: 0x3b82f6 },
        epic:     { color: 0xa855f7 },
        legendary:{ color: 0xf59e0b }
      },
      
      // Layout — КЛЮЧЕВЫЕ ВЫСОТЫ
      headerHeight: 90,
      equipZoneHeight: 580,  // Зона экипировки
      statsBarHeight: 55,
      
      // Slots — УВЕЛИЧЕННЫЕ
      equipSlotSize: 82,
      equipSlotGap: 8,
      gridSlotSize: 68,
      gridCols: 6,
      gridRows: 4,
      gridGap: 10,
      
      // Positions — ШИРОКО РАЗНЕСЕНЫ
      leftColX: W * 0.14,      // 14% от края
      rightColX: W * 0.86,     // 86% от края
      centerX: W / 2,
    };

    // Вычисляем Y координаты
    this.CFG.equipZoneY = this.CFG.headerHeight;
    this.CFG.statsBarY = this.CFG.headerHeight + this.CFG.equipZoneHeight;
    this.CFG.gridStartY = this.CFG.statsBarY + this.CFG.statsBarHeight + 45;

    // ========== 1. ПОЛНЫЙ DIMMER ==========
    this.dimmer = this.add.rectangle(W/2, H/2, W, H, 0x000000, this.CFG.dimmerAlpha);
    this.dimmer.setInteractive();
    this.dimmer.on('pointerdown', (ptr) => {
      // Закрыть только если клик вне UI
      if (ptr.y > this.CFG.gridStartY + 300) {
        this.closeInventory();
      }
    });

    // ========== 2. MAIN CONTAINER ==========
    this.mainContainer = this.add.container(0, 0);

    // ========== 3. ТЕМНАЯ ПОДЛОЖКА ПОД GRID ==========
    this.createGridBackground(W, H);

    // ========== 4. КАМЕННЫЙ ФОН (на всю ширину) ==========
    this.createStoneBackground(W, H);

    // ========== 5. HEADER ==========
    this.createHeader(W);

    // ========== 6. EQUIPMENT SLOTS ==========
    this.createEquipmentSlots(W);

    // ========== 7. CHARACTER PREVIEW ==========
    this.createCharPreview(W);

    // ========== 8. STATS BAR ==========
    this.createStatsBar(W);

    // ========== 9. INVENTORY GRID ==========
    this.createInventoryGrid(W, H);

    // ========== 10. INPUT ==========
    this.setupInput();

    console.log('[INV_SCENE] v2 Created successfully');
  }

  // ============================================================
  //  GRID BACKGROUND (темная панель под сеткой)
  // ============================================================
  createGridBackground(W, H) {
    const startY = this.CFG.statsBarY;
    const height = H - startY;
    
    // Темная панель под сеткой предметов
    const gridBg = this.add.rectangle(W/2, startY + height/2, W, height, 0x0a0a0f, 0.95);
    this.mainContainer.add(gridBg);
  }

  // ============================================================
  //  STONE BACKGROUND (каменная плита на всю ширину)
  // ============================================================
  createStoneBackground(W, H) {
    const topY = this.CFG.headerHeight;
    const height = this.CFG.equipZoneHeight;
    
    if (this.textures.exists('inv_bg')) {
      this.stoneBg = this.add.image(W / 2, topY + height / 2, 'inv_bg');
      // Растягиваем на ВСЮ ширину и нужную высоту
      this.stoneBg.setDisplaySize(W, height);
    } else {
      // Fallback — тёмный градиент
      this.stoneBg = this.add.rectangle(W/2, topY + height/2, W, height, 0x1a1a2e);
    }
    
    this.mainContainer.add(this.stoneBg);
  }

  // ============================================================
  //  HEADER
  // ============================================================
  createHeader(W) {
    const headerH = this.CFG.headerHeight;
    
    // Header background
    if (this.textures.exists('inv_header')) {
      this.header = this.add.image(W / 2, headerH / 2, 'inv_header');
      this.header.setDisplaySize(W, headerH);
    } else {
      this.header = this.add.rectangle(W / 2, headerH / 2, W, headerH, 0x27272a);
    }
    this.mainContainer.add(this.header);
    
    // Title
    this.title = this.add.text(W / 2, headerH / 2, 'Инвентарь', {
      fontFamily: 'Verdana, Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.mainContainer.add(this.title);
    
    // Close button
    const closeX = W - 55;
    const closeY = headerH / 2;
    
    if (this.textures.exists('inv_close')) {
      this.closeBtn = this.add.image(closeX, closeY, 'inv_close');
      this.closeBtn.setDisplaySize(48, 48);
    } else {
      this.closeBtn = this.add.text(closeX, closeY, '✕', {
        fontSize: '36px',
        color: '#ff6666',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
    this.closeBtn.setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.closeInventory());
    this.closeBtn.on('pointerover', () => this.closeBtn.setScale(1.15));
    this.closeBtn.on('pointerout', () => this.closeBtn.setScale(1.0));
    this.mainContainer.add(this.closeBtn);
  }

  // ============================================================
  //  EQUIPMENT SLOTS
  // ============================================================
  createEquipmentSlots(W) {
    const cfg = this.CFG;
    const startY = cfg.headerHeight + 25;
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
      slotBg.setStrokeStyle(2, 0x4f4f56);
    }
    container.add(slotBg);
    
    // Icon — КРУПНЕЕ
    const iconText = this.add.text(0, 0, icon, {
      fontSize: '36px'
    }).setOrigin(0.5).setAlpha(0.5);
    container.add(iconText);
    
    // Label
    const labelText = this.add.text(0, size / 2 + 14, label, {
      fontFamily: 'Verdana',
      fontSize: '12px',
      color: '#9ca3af'
    }).setOrigin(0.5);
    container.add(labelText);
    
    // Interactive
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.on('pointerover', () => {
      slotBg.setTint(0x5a5a62);
      container.setScale(1.05);
    });
    slotBg.on('pointerout', () => {
      slotBg.clearTint();
      container.setScale(1.0);
    });
    slotBg.on('pointerdown', () => this.onEquipSlotClick(type));
    
    this.mainContainer.add(container);
    
    return { container, bg: slotBg, icon: iconText, label: labelText, type, item: null };
  }

  // ============================================================
  //  CHARACTER PREVIEW
  // ============================================================
  createCharPreview(W) {
    const cfg = this.CFG;
    const centerY = cfg.headerHeight + cfg.equipZoneHeight / 2;
    const size = 160; // Крупнее!
    
    // Preview background
    const previewBg = this.add.rectangle(W / 2, centerY, size, size, 0x12121a);
    previewBg.setStrokeStyle(3, 0x3f3f46);
    this.mainContainer.add(previewBg);
    
    // Character icon (placeholder) — КРУПНЕЕ
    const charIcon = this.add.text(W / 2, centerY, '🛡️', {
      fontSize: '72px'
    }).setOrigin(0.5).setAlpha(0.7);
    this.mainContainer.add(charIcon);
    
    // Shadow under character
    const shadow = this.add.ellipse(W / 2, centerY + 65, 80, 20, 0x000000, 0.4);
    this.mainContainer.add(shadow);
    
    this.charPreview = { bg: previewBg, icon: charIcon, shadow };
  }

  // ============================================================
  //  STATS BAR
  // ============================================================
  createStatsBar(W) {
    const y = this.CFG.statsBarY + this.CFG.statsBarHeight / 2;
    const barW = W - 30;
    const barH = this.CFG.statsBarHeight;
    
    // Background
    const statsBg = this.add.rectangle(W / 2, y, barW, barH, 0x1f1f28, 0.95);
    statsBg.setStrokeStyle(1, 0x3f3f46);
    this.mainContainer.add(statsBg);
    
    // Stats
    const stats = this.calculateStats();
    
    const statsText = this.add.text(W / 2, y, 
      `❤️ ${stats.hp}      ⚔️ ${stats.atk}      🛡️ ${stats.def}`, {
      fontFamily: 'Verdana',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.mainContainer.add(statsText);
    
    this.statsBar = { bg: statsBg, text: statsText };
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
    this.statsBar.text.setText(`❤️ ${stats.hp}      ⚔️ ${stats.atk}      🛡️ ${stats.def}`);
  }

  // ============================================================
  //  INVENTORY GRID
  // ============================================================
  createInventoryGrid(W, H) {
    const cfg = this.CFG;
    const startY = cfg.gridStartY;
    const slotSize = cfg.gridSlotSize;
    const gap = cfg.gridGap;
    const cols = cfg.gridCols;
    const rows = cfg.gridRows;
    
    const gridW = cols * slotSize + (cols - 1) * gap;
    const startX = (W - gridW) / 2 + slotSize / 2;
    
    // Title
    const titleY = startY - 35;
    const gridTitle = this.add.text(35, titleY, 'Предметы', {
      fontFamily: 'Verdana',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    this.mainContainer.add(gridTitle);
    
    const countText = this.add.text(W - 35, titleY, `${this.inventoryItems.length} шт`, {
      fontFamily: 'Verdana',
      fontSize: '14px',
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
    
    // Item icon
    const itemIcon = this.add.text(0, 0, '', {
      fontSize: '28px'
    }).setOrigin(0.5).setVisible(false);
    container.add(itemIcon);
    
    // Level badge
    const levelBadge = this.add.text(size/2 - 4, -size/2 + 4, '', {
      fontFamily: 'Verdana',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#fbbf24',
      backgroundColor: '#000000aa',
      padding: { x: 3, y: 2 }
    }).setOrigin(1, 0).setVisible(false);
    container.add(levelBadge);
    
    // Interactive
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.on('pointerover', () => container.setScale(1.08));
    slotBg.on('pointerout', () => {
      if (this.selectedItem?.id !== this.gridSlots[index]?.item?.id) {
        container.setScale(1.0);
      }
    });
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
          slot.bg.setStrokeStyle(3, rarity.color);
        }
        
        slot.container.setAlpha(1);
      } else {
        slot.icon.setVisible(false);
        slot.level.setVisible(false);
        if (slot.bg.setStrokeStyle) {
          slot.bg.setStrokeStyle(1, 0x3f3f46);
        }
        slot.container.setAlpha(0.4);
      }
    });
    
    if (this.gridCountText) {
      this.gridCountText.setText(`${this.inventoryItems.length} шт`);
    }
  }

  // ============================================================
  //  INPUT
  // ============================================================
  setupInput() {
    this.input.keyboard.on('keydown-ESC', () => this.closeInventory());
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
    
    this.closePopup();
    
    this.selectedItem = slot.item;
    slot.container.setScale(0.92);
    
    this.showPopup(slot.x, slot.y - 80, slot.item);
  }

  // ============================================================
  //  POPUP
  // ============================================================
  showPopup(x, y, item) {
    const popupW = 180;
    const popupH = 120;
    
    this.popup = this.add.container(x, y);
    
    // Background
    const bg = this.add.rectangle(0, 0, popupW, popupH, 0x18181b, 0.98);
    bg.setStrokeStyle(2, 0x3f3f46);
    this.popup.add(bg);
    
    // Item name
    const rarity = this.CFG.rarityColors[item.rarity] || this.CFG.rarityColors.common;
    const nameText = this.add.text(0, -38, item.name, {
      fontFamily: 'Verdana',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#' + rarity.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    this.popup.add(nameText);
    
    // Level info
    const infoText = this.add.text(0, -18, `Уровень ${item.level}`, {
      fontFamily: 'Verdana',
      fontSize: '11px',
      color: '#9ca3af'
    }).setOrigin(0.5);
    this.popup.add(infoText);
    
    // Equip button
    const equipBtn = this.add.rectangle(0, 12, 140, 32, 0x2563eb);
    equipBtn.setInteractive({ useHandCursor: true });
    equipBtn.on('pointerdown', () => this.equipItem(item));
    equipBtn.on('pointerover', () => equipBtn.setFillStyle(0x3b82f6));
    equipBtn.on('pointerout', () => equipBtn.setFillStyle(0x2563eb));
    this.popup.add(equipBtn);
    
    const equipText = this.add.text(0, 12, '✨ Надеть', {
      fontFamily: 'Verdana',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.popup.add(equipText);
    
    // Sell button
    const sellBtn = this.add.rectangle(0, 48, 140, 32, 0x000000, 0);
    sellBtn.setStrokeStyle(2, 0xf59e0b);
    sellBtn.setInteractive({ useHandCursor: true });
    sellBtn.on('pointerdown', () => this.sellItem(item));
    sellBtn.on('pointerover', () => sellBtn.setFillStyle(0xf59e0b, 0.2));
    sellBtn.on('pointerout', () => sellBtn.setFillStyle(0x000000, 0));
    this.popup.add(sellBtn);
    
    const sellText = this.add.text(0, 48, '💰 Продать', {
      fontFamily: 'Verdana',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f59e0b'
    }).setOrigin(0.5);
    this.popup.add(sellText);
    
    // Arrow
    const arrow = this.add.triangle(0, popupH/2 + 10, -10, 0, 10, 0, 0, 12, 0x18181b);
    this.popup.add(arrow);
    
    this.mainContainer.add(this.popup);
  }

  closePopup() {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    
    this.gridSlots.forEach(slot => slot.container.setScale(1));
    this.selectedItem = null;
  }

  // ============================================================
  //  ACTIONS
  // ============================================================
  equipItem(item) {
    console.log('[INV] Equipping:', item.name);
    
    this.equippedItems[item.type] = item;
    this.inventoryItems = this.inventoryItems.filter(i => i.id !== item.id);
    
    this.closePopup();
    this.refreshGrid();
    this.updateStatsDisplay();
    this.updateEquipSlot(item.type);
  }

  sellItem(item) {
    console.log('[INV] Selling:', item.name);
    
    this.inventoryItems = this.inventoryItems.filter(i => i.id !== item.id);
    
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

console.log('[InventoryScene] v2 Phaser scene loaded');
