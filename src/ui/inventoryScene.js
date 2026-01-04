"use strict";

// ============================================================
//  INVENTORY SCENE v4 — Visual RPG (Textures + Spine Hero)
//  Phaser Scene с текстурами хедера и Spine-персонажем
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

    // Tune mode (press T to toggle)
    this.tuneMode = false;
    this.tunableElements = [];
    this.selectedElement = null;
  }

  preload() {
    // Load textures
    if (!this.textures.exists('inv_slot')) {
      this.load.image('inv_slot', 'assets/ui/invertory_slot_frame.png');
    }
    if (!this.textures.exists('inv_close')) {
      this.load.image('inv_close', 'assets/ui/btn_close.png');
    }
    if (!this.textures.exists('inv_header')) {
      this.load.image('inv_header', 'assets/ui/Invertory_header.png');
    }
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    console.log('[INV_SCENE] Creating v4 Visual, size:', W, 'x', H);

    // ========== CONFIG ==========
    this.CFG = {
      dimmerAlpha: 0.85,

      rarityColors: {
        common:   { color: 0x9ca3af },
        uncommon: { color: 0x22c55e },
        rare:     { color: 0x3b82f6 },
        epic:     { color: 0xa855f7 },
        legendary:{ color: 0xf59e0b }
      },

      // Layout
      panelPadding: 20,
      headerHeight: 100,
      equipZoneHeight: 520,
      statsBarHeight: 50,

      // Slots
      equipSlotSize: 80,
      equipSlotGap: 12,
      gridSlotSize: 72,
      gridCols: 6,
      gridRows: 4,
      gridGap: 8,

      // Positions
      leftColX: W * 0.15,
      rightColX: W * 0.85,
      centerX: W / 2,
    };

    // Panel bounds
    const panelW = W - 40;
    const panelH = H * 0.88;
    const panelX = W / 2;
    const panelY = H / 2;

    this.panelBounds = {
      x: panelX - panelW / 2,
      y: panelY - panelH / 2,
      w: panelW,
      h: panelH
    };

    // Derived positions
    this.CFG.headerY = this.panelBounds.y;
    this.CFG.equipZoneY = this.panelBounds.y + this.CFG.headerHeight;
    this.CFG.statsBarY = this.CFG.equipZoneY + this.CFG.equipZoneHeight;
    this.CFG.gridStartY = this.CFG.statsBarY + this.CFG.statsBarHeight + 30;

    // ========== 1. DIMMER ==========
    this.dimmer = this.add.rectangle(W/2, H/2, W, H, 0x000000, this.CFG.dimmerAlpha);
    this.dimmer.setInteractive();
    this.dimmer.on('pointerdown', (ptr) => {
      if (ptr.y > this.CFG.gridStartY + 350) {
        this.closeInventory();
      }
    });

    // ========== 2. MAIN CONTAINER ==========
    this.mainContainer = this.add.container(0, 0);

    // ========== 3. VISUAL PANEL ==========
    this.createVisualPanel(W, H);

    // ========== 4. EQUIPMENT SLOTS ==========
    this.createEquipmentSlots(W);

    // ========== 5. HERO PREVIEW ==========
    this.createHeroPreview(W);

    // ========== 6. STATS BAR ==========
    this.createStatsBar(W);

    // ========== 7. INVENTORY GRID ==========
    this.createInventoryGrid(W, H);

    // ========== 8. INPUT ==========
    this.setupInput();

    // ========== 9. TUNE MODE ==========
    if (this.tuneMode) {
      this.setupTuneMode();
    }

    console.log('[INV_SCENE] v4 Created successfully');
  }

  // ============================================================
  //  VISUAL PANEL (with textures)
  // ============================================================
  createVisualPanel(W, H) {
    const pb = this.panelBounds;

    // ===== MAIN BACKGROUND =====
    this.panelBg = this.add.graphics();

    // Dark fill with rounded corners
    this.panelBg.fillStyle(0x0d0d12, 0.95);
    this.panelBg.fillRoundedRect(pb.x, pb.y, pb.w, pb.h, 16);

    // Gold/bronze stroke
    this.panelBg.lineStyle(3, 0x8b7355, 1);
    this.panelBg.strokeRoundedRect(pb.x, pb.y, pb.w, pb.h, 16);

    // Inner glow line
    this.panelBg.lineStyle(1, 0x3f3f46, 0.5);
    this.panelBg.strokeRoundedRect(pb.x + 4, pb.y + 4, pb.w - 8, pb.h - 8, 12);

    this.mainContainer.add(this.panelBg);

    // ===== HEADER IMAGE =====
    if (this.textures.exists('inv_header')) {
      this.header = this.add.image(W / 2, pb.y + 50, 'inv_header');
      this.header.setDisplaySize(pb.w - 20, this.CFG.headerHeight);
      this.mainContainer.add(this.header);
      this.registerTunable(this.header, 'header');
    }

    // ===== TITLE TEXT (over header) =====
    this.title = this.add.text(W / 2, pb.y + 50, 'ИНВЕНТАРЬ', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5);
    this.mainContainer.add(this.title);
    this.registerTunable(this.title, 'title');

    // ===== CLOSE BUTTON =====
    const closeX = pb.x + pb.w - 45;
    const closeY = pb.y + 50;

    if (this.textures.exists('inv_close')) {
      this.closeBtn = this.add.image(closeX, closeY, 'inv_close');
      this.closeBtn.setDisplaySize(40, 40);
    } else {
      this.closeBtn = this.add.text(closeX, closeY, '✕', {
        fontSize: '32px',
        color: '#ff6b6b',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    this.closeBtn.setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.closeInventory());
    this.closeBtn.on('pointerover', () => this.closeBtn.setScale(1.2));
    this.closeBtn.on('pointerout', () => this.closeBtn.setScale(1.0));
    this.mainContainer.add(this.closeBtn);

    // ===== SEPARATOR LINE =====
    const sepY = this.CFG.equipZoneY;
    this.separator = this.add.graphics();
    this.separator.lineStyle(2, 0x5a4a3a, 0.8);
    this.separator.lineBetween(pb.x + 30, sepY, pb.x + pb.w - 30, sepY);
    this.mainContainer.add(this.separator);
  }

  // ============================================================
  //  EQUIPMENT SLOTS
  // ============================================================
  createEquipmentSlots(W) {
    const cfg = this.CFG;
    const startY = cfg.equipZoneY + 30;
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

    // Slot background - NO tint, original texture
    let slotBg;
    if (this.textures.exists('inv_slot')) {
      slotBg = this.add.image(0, 0, 'inv_slot');
      slotBg.setDisplaySize(size, size);
      // Light tint for visibility on dark bg
      slotBg.setTint(0xbbbbbb);
    } else {
      slotBg = this.add.rectangle(0, 0, size, size, 0x2a2a35);
      slotBg.setStrokeStyle(2, 0x5a5a6a);
    }
    container.add(slotBg);

    // Icon
    const iconText = this.add.text(0, 0, icon, {
      fontSize: '32px'
    }).setOrigin(0.5).setAlpha(0.4);
    container.add(iconText);

    // Label
    const labelText = this.add.text(0, size / 2 + 12, label, {
      fontFamily: 'Verdana',
      fontSize: '11px',
      color: '#a0a0a0'
    }).setOrigin(0.5);
    container.add(labelText);

    // Interactive
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.on('pointerover', () => {
      slotBg.setTint(0xffffff);
      container.setScale(1.08);
    });
    slotBg.on('pointerout', () => {
      slotBg.setTint(0xbbbbbb);
      container.setScale(1.0);
    });
    slotBg.on('pointerdown', () => this.onEquipSlotClick(type));

    this.mainContainer.add(container);
    this.registerTunable(container, `slot_${type}`);

    return { container, bg: slotBg, icon: iconText, label: labelText, type, item: null };
  }

  // ============================================================
  //  HERO PREVIEW (Spine)
  // ============================================================
  createHeroPreview(W) {
    const cfg = this.CFG;
    const centerY = cfg.equipZoneY + cfg.equipZoneHeight / 2 + 20;

    // Background frame
    const frameW = 180;
    const frameH = 320;

    this.heroFrame = this.add.graphics();
    this.heroFrame.fillStyle(0x0a0a10, 0.6);
    this.heroFrame.fillRoundedRect(W/2 - frameW/2, centerY - frameH/2, frameW, frameH, 12);
    this.heroFrame.lineStyle(2, 0x4a4a5a, 0.8);
    this.heroFrame.strokeRoundedRect(W/2 - frameW/2, centerY - frameH/2, frameW, frameH, 12);
    this.mainContainer.add(this.heroFrame);

    // Shadow under hero
    const shadow = this.add.ellipse(W / 2, centerY + 130, 100, 25, 0x000000, 0.5);
    this.mainContainer.add(shadow);

    // Try to add Spine hero
    try {
      if (this.cache.custom && this.cache.custom.spine && this.cache.custom.spine.has('hero')) {
        this.heroSpine = this.add.spine(W / 2, centerY + 80, 'hero', 'idle', true);
        this.heroSpine.setScale(0.7);
        this.mainContainer.add(this.heroSpine);
        this.registerTunable(this.heroSpine, 'heroSpine');
        console.log('[INV] Spine hero added');
      } else {
        // Fallback - text placeholder
        this.heroPlaceholder = this.add.text(W / 2, centerY, '⚔️', {
          fontSize: '80px'
        }).setOrigin(0.5).setAlpha(0.5);
        this.mainContainer.add(this.heroPlaceholder);
        console.log('[INV] Spine not available, using placeholder');
      }
    } catch (e) {
      console.log('[INV] Spine error:', e.message);
      this.heroPlaceholder = this.add.text(W / 2, centerY, '🛡️', {
        fontSize: '80px'
      }).setOrigin(0.5).setAlpha(0.5);
      this.mainContainer.add(this.heroPlaceholder);
    }

    this.charPreview = { frame: this.heroFrame, shadow };
  }

  // ============================================================
  //  STATS BAR
  // ============================================================
  createStatsBar(W) {
    const y = this.CFG.statsBarY + this.CFG.statsBarHeight / 2;
    const barW = this.panelBounds.w - 60;
    const barH = this.CFG.statsBarHeight;

    // Background
    const statsBg = this.add.rectangle(W / 2, y, barW, barH, 0x1a1a22, 0.9);
    statsBg.setStrokeStyle(1, 0x4a4a5a);
    this.mainContainer.add(statsBg);

    // Stats
    const stats = this.calculateStats();

    const statsText = this.add.text(W / 2, y,
      `❤️ ${stats.hp}      ⚔️ ${stats.atk}      🛡️ ${stats.def}`, {
      fontFamily: 'Verdana',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#e8e8e8'
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
    const titleY = startY - 30;
    const gridTitle = this.add.text(this.panelBounds.x + 30, titleY, 'Предметы', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#d4af37'
    });
    this.mainContainer.add(gridTitle);

    const countText = this.add.text(this.panelBounds.x + this.panelBounds.w - 30, titleY,
      `${this.inventoryItems.length} шт`, {
      fontFamily: 'Verdana',
      fontSize: '13px',
      color: '#808080'
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

    // Slot background - lighter tint
    let slotBg;
    if (this.textures.exists('inv_slot')) {
      slotBg = this.add.image(0, 0, 'inv_slot');
      slotBg.setDisplaySize(size, size);
      slotBg.setTint(0xaaaaaa);
    } else {
      slotBg = this.add.rectangle(0, 0, size, size, 0x2a2a35);
      slotBg.setStrokeStyle(1, 0x4a4a5a);
    }
    container.add(slotBg);

    // Item icon
    const itemIcon = this.add.text(0, 0, '', {
      fontSize: '26px'
    }).setOrigin(0.5).setVisible(false);
    container.add(itemIcon);

    // Level badge
    const levelBadge = this.add.text(size/2 - 4, -size/2 + 4, '', {
      fontFamily: 'Verdana',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffd700',
      backgroundColor: '#000000cc',
      padding: { x: 3, y: 2 }
    }).setOrigin(1, 0).setVisible(false);
    container.add(levelBadge);

    // Interactive
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.on('pointerover', () => {
      container.setScale(1.1);
      slotBg.setTint(0xffffff);
    });
    slotBg.on('pointerout', () => {
      if (this.selectedItem?.id !== this.gridSlots[index]?.item?.id) {
        container.setScale(1.0);
        slotBg.setTint(0xaaaaaa);
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
        slot.bg.setTint(rarity.color);

        slot.container.setAlpha(1);
      } else {
        slot.icon.setVisible(false);
        slot.level.setVisible(false);
        slot.bg.setTint(0x666666);
        slot.container.setAlpha(0.5);
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
    this.input.keyboard.on('keydown-T', () => this.toggleTuneMode());
  }

  toggleTuneMode() {
    this.tuneMode = !this.tuneMode;
    if (this.tuneMode) {
      this.setupTuneMode();
      console.log('[INV] Tune mode ON');
    } else {
      if (this.tuneLabel) {
        this.tuneLabel.destroy();
        this.tuneLabel = null;
      }
      this.selectedElement = null;
      console.log('[INV] Tune mode OFF');
    }
  }

  // ============================================================
  //  TUNE MODE
  // ============================================================
  registerTunable(element, name) {
    if (!this.tuneMode) return;
    this.tunableElements.push({ element, name, originalX: element.x, originalY: element.y });
  }

  setupTuneMode() {
    console.log('[INV_TUNE] ===== TUNE MODE ENABLED =====');
    console.log('[INV_TUNE] Arrow keys = move, Q/E = scale, P = print');

    // Tune label
    this.tuneLabel = this.add.text(10, 10, '🔧 TUNE MODE', {
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(1000);

    this.input.keyboard.on('keydown-LEFT', () => this.moveSelected(-5, 0));
    this.input.keyboard.on('keydown-RIGHT', () => this.moveSelected(5, 0));
    this.input.keyboard.on('keydown-UP', () => this.moveSelected(0, -5));
    this.input.keyboard.on('keydown-DOWN', () => this.moveSelected(0, 5));
    this.input.keyboard.on('keydown-Q', () => this.scaleSelected(-0.05));
    this.input.keyboard.on('keydown-E', () => this.scaleSelected(0.05));
    this.input.keyboard.on('keydown-P', () => this.printTuneData());

    // Click to select
    this.input.on('pointerdown', (ptr) => {
      this.tunableElements.forEach(t => {
        const bounds = t.element.getBounds ? t.element.getBounds() :
          { x: t.element.x - 50, y: t.element.y - 50, width: 100, height: 100 };
        if (ptr.x >= bounds.x && ptr.x <= bounds.x + bounds.width &&
            ptr.y >= bounds.y && ptr.y <= bounds.y + bounds.height) {
          this.selectedElement = t;
          console.log('[TUNE] Selected:', t.name);
        }
      });
    });
  }

  moveSelected(dx, dy) {
    if (!this.selectedElement) return;
    this.selectedElement.element.x += dx;
    this.selectedElement.element.y += dy;
  }

  scaleSelected(ds) {
    if (!this.selectedElement) return;
    const el = this.selectedElement.element;
    const newScale = (el.scaleX || 1) + ds;
    el.setScale(Math.max(0.1, newScale));
  }

  printTuneData() {
    console.log('[TUNE] ===== POSITIONS =====');
    this.tunableElements.forEach(t => {
      const el = t.element;
      console.log(`${t.name}: x=${Math.round(el.x)}, y=${Math.round(el.y)}, scale=${(el.scaleX || 1).toFixed(2)}`);
    });
  }

  // ============================================================
  //  SLOT CLICKS
  // ============================================================
  onEquipSlotClick(type) {
    console.log('[INV] Equip slot clicked:', type);
    const slot = this.equipSlots[type];
    if (slot.item) {
      // Unequip
      this.inventoryItems.push(slot.item);
      slot.item = null;
      slot.icon.setAlpha(0.4);
      slot.bg.setTint(0xbbbbbb);
      delete this.equippedItems[type];
      this.refreshGrid();
      this.updateStatsDisplay();
    }
  }

  onGridSlotClick(index) {
    const slot = this.gridSlots[index];
    if (!slot.item) return;

    console.log('[INV] Grid slot clicked:', index, slot.item.name);

    this.closePopup();

    this.selectedItem = slot.item;
    slot.container.setScale(0.95);

    this.showPopup(slot.x, slot.y - 90, slot.item);
  }

  // ============================================================
  //  POPUP
  // ============================================================
  showPopup(x, y, item) {
    const popupW = 190;
    const popupH = 130;

    this.popup = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, popupW, popupH, 0x12121a, 0.98);
    bg.setStrokeStyle(2, 0x5a4a3a);
    this.popup.add(bg);

    // Item name
    const rarity = this.CFG.rarityColors[item.rarity] || this.CFG.rarityColors.common;
    const nameText = this.add.text(0, -42, item.name, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#' + rarity.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    this.popup.add(nameText);

    // Level info
    const infoText = this.add.text(0, -22, `Уровень ${item.level}`, {
      fontFamily: 'Verdana',
      fontSize: '11px',
      color: '#a0a0a0'
    }).setOrigin(0.5);
    this.popup.add(infoText);

    // Equip button
    const equipBtn = this.add.rectangle(0, 12, 150, 34, 0x2563eb);
    equipBtn.setStrokeStyle(1, 0x3b82f6);
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
    const sellBtn = this.add.rectangle(0, 50, 150, 34, 0x000000, 0);
    sellBtn.setStrokeStyle(2, 0xd4af37);
    sellBtn.setInteractive({ useHandCursor: true });
    sellBtn.on('pointerdown', () => this.sellItem(item));
    sellBtn.on('pointerover', () => sellBtn.setFillStyle(0xd4af37, 0.2));
    sellBtn.on('pointerout', () => sellBtn.setFillStyle(0x000000, 0));
    this.popup.add(sellBtn);

    const sellText = this.add.text(0, 50, '💰 Продать', {
      fontFamily: 'Verdana',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#d4af37'
    }).setOrigin(0.5);
    this.popup.add(sellText);

    // Arrow
    const arrow = this.add.triangle(0, popupH/2 + 8, -12, 0, 12, 0, 0, 14, 0x12121a);
    this.popup.add(arrow);

    this.mainContainer.add(this.popup);
  }

  closePopup() {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }

    this.gridSlots.forEach(slot => {
      slot.container.setScale(1);
      if (slot.item) {
        const rarity = this.CFG.rarityColors[slot.item.rarity];
        slot.bg.setTint(rarity.color);
      }
    });
    this.selectedItem = null;
  }

  // ============================================================
  //  ACTIONS
  // ============================================================
  equipItem(item) {
    console.log('[INV] Equipping:', item.name);

    // If slot occupied, swap
    if (this.equippedItems[item.type]) {
      this.inventoryItems.push(this.equippedItems[item.type]);
    }

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
      slot.bg.setTint(rarity.color);
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

console.log('[InventoryScene] v4 Visual RPG loaded');
