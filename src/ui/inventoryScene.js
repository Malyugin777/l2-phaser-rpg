"use strict";

// ============================================================
//  INVENTORY SCENE v2 — Clean Design
//  - PNG slot icons (helmet, armor, sword, etc.)
//  - No labels under equipment slots
//  - Hero positioned lower (30% down from center)
//  - Clickable stats bar as button
//  - Proper grid alignment
// ============================================================

class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });

    this.CFG = {
      panelMaxW: 700,
      panelSidePad: 20,
      panelInnerPad: 24,
      radius: 20,

      headerH: 70,

      // Colors (L2 Dark Fantasy)
      bgTop: 0x2a313b,
      bgBottom: 0x0e141b,
      panelBg: 0x1a1d24,
      slotBg: 0x1e2229,
      border: 0x3d4654,

      gold: "#D6B36A",
      goldHex: 0xD6B36A,
      textColor: '#e2e8f0',
      textMuted: '#64748b',
      blue: '#4FA3FF',
      red: '#E05252',

      fontMain: 'Verdana, Arial, sans-serif',

      // Slot sizes
      equipSlot: 80,      // Equipment slot size
      equipGap: 8,        // Gap between equipment slots
      gridSlot: 80,       // Inventory grid slot size
      gridGap: 6,
      gridCols: 6,
      gridRows: 4,

      // Rarity colors
      rarity: {
        common:    { color: 0x4b5563 },
        uncommon:  { color: 0x22c55e },
        rare:      { color: 0x3b82f6 },
        epic:      { color: 0xa855f7 },
        legendary: { color: 0xD6B36A },
      }
    };

    // PNG icon mapping for equipment slots
    this.SLOT_ICONS = {
      helmet:   'inv_helmet',
      chest:    'inv_armor',
      pants:    'inv_legg',
      gloves:   'inv_gloves',
      boots:    'inv_boots',
      mainHand: 'inv_sword',
      offHand:  'inv_shield',
      necklace: 'inv_necklace',
      earring1: 'inv_ring',
      earring2: 'inv_ring',
      ring1:    'inv_ring',
      ring2:    'inv_ring'
    };

    this.items = [];
    this.equipped = {};
    this.slotSprites = {};
    this.gridSlots = [];
  }

  init(data) {
    this.items = data?.items || this._getTestItems();
    this.equipped = data?.equipped || {};
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const C = this.CFG;

    // Safe area
    const safeTop = Math.max((window?.SAFE_TOP_PX ?? 0) | 0, 100);
    const safeBottom = Math.max((window?.SAFE_BOTTOM_PX ?? 0) | 0, 80);
    const usableH = H - safeTop - safeBottom;

    const panelW = Math.min(C.panelMaxW, W - C.panelSidePad * 2);
    const panelH = Math.min(usableH - 20, H * 0.88);
    const panelX = (W - panelW) / 2;
    const panelY = safeTop + 10;

    this.panelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

    this.ui = this.add.container(0, 0);

    // Dimmer with tap-only close
    this._createDimmer(W, H);

    // Main panel
    this.panel = this.add.container(panelX, panelY);
    this.ui.add(this.panel);

    // Panel background with gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(C.bgTop, C.bgTop, C.bgBottom, C.bgBottom, 1);
    bg.fillRoundedRect(0, 0, panelW, panelH, C.radius);
    bg.lineStyle(2, C.border, 0.5);
    bg.strokeRoundedRect(0, 0, panelW, panelH, C.radius);
    this.panel.add(bg);

    // Build UI sections
    this._createHeader();
    this._createEquipmentZone();
    this._createStatsButton();
    this._createGrid();

    // Open animation
    this.panel.setAlpha(0);
    this.panel.setScale(0.96);
    this.tweens.add({
      targets: this.panel,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: 'Back.Out'
    });

    // ESC to close
    this.input.keyboard?.on('keydown-ESC', () => this.closeInventory());

    console.log('[InventoryScene] v2 Created');
  }

  // ============================================================
  //  DIMMER — closes only on tap, not scroll
  // ============================================================
  _createDimmer(W, H) {
    const dimmer = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.8);
    dimmer.setInteractive();

    let downTime = 0;
    let downPos = { x: 0, y: 0 };

    dimmer.on('pointerdown', (p) => {
      downTime = Date.now();
      downPos = { x: p.x, y: p.y };
    });

    dimmer.on('pointerup', (p) => {
      const dt = Date.now() - downTime;
      const dx = Math.abs(p.x - downPos.x);
      const dy = Math.abs(p.y - downPos.y);
      if (dt < 300 && dx < 20 && dy < 20) {
        this.closeInventory();
      }
    });

    this.ui.add(dimmer);
  }

  // ============================================================
  //  HEADER
  // ============================================================
  _createHeader() {
    const C = this.CFG;
    const P = this.panelBounds;

    // Title
    const title = this.add.text(C.panelInnerPad, C.headerH / 2, 'ИНВЕНТАРЬ', {
      fontFamily: C.fontMain,
      fontSize: '28px',
      fontStyle: 'bold',
      color: C.gold
    }).setOrigin(0, 0.5);
    title.setShadow(0, 3, '#000000', 6);
    this.panel.add(title);

    // Close button
    const closeX = P.w - 45;
    const closeY = C.headerH / 2;

    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x0e141b, 0.5);
    closeBg.fillCircle(closeX, closeY, 22);
    this.panel.add(closeBg);

    const closeBtn = this.add.text(closeX, closeY, '×', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeInventory());
    closeBtn.on('pointerover', () => closeBtn.setColor(C.gold));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'));
    this.panel.add(closeBtn);

    // Separator
    const line = this.add.graphics();
    line.lineStyle(1, 0xffffff, 0.1);
    line.lineBetween(0, C.headerH, P.w, C.headerH);
    this.panel.add(line);
  }

  // ============================================================
  //  EQUIPMENT ZONE — NO LABELS, PNG ICONS
  // ============================================================
  _createEquipmentZone() {
    const C = this.CFG;
    const P = this.panelBounds;
    const startY = C.headerH + 16;

    const leftSlots = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
    const rightSlots = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];

    const slotSize = C.equipSlot;
    const gap = C.equipGap;

    // Calculate zone height
    const zoneH = leftSlots.length * slotSize + (leftSlots.length - 1) * gap;

    // Left column — align to left edge with padding
    const leftX = C.panelInnerPad + slotSize / 2;
    leftSlots.forEach((type, i) => {
      const y = startY + i * (slotSize + gap) + slotSize / 2;
      this._createEquipSlot(leftX, y, type, slotSize);
    });

    // Right column — align to right edge with padding
    const rightX = P.w - C.panelInnerPad - slotSize / 2;
    rightSlots.forEach((type, i) => {
      const y = startY + i * (slotSize + gap) + slotSize / 2;
      this._createEquipSlot(rightX, y, type, slotSize);
    });

    // Hero in center — positioned 30% lower
    const centerX = P.w / 2;
    const heroZoneTop = startY;
    const heroZoneBottom = startY + zoneH;
    const heroCenter = heroZoneTop + (heroZoneBottom - heroZoneTop) * 0.55;  // 55% down (30% lower than center)
    this._createHeroPreview(centerX, heroCenter);

    this.equipZoneEndY = startY + zoneH + 16;
  }

  // ============================================================
  //  EQUIPMENT SLOT — PNG icon, NO label
  // ============================================================
  _createEquipSlot(x, y, type, size) {
    const C = this.CFG;
    const item = this.equipped[type];

    const container = this.add.container(x, y);

    // Slot background
    const bg = this.add.graphics();
    bg.fillStyle(C.slotBg, 1);
    bg.fillRoundedRect(-size/2, -size/2, size, size, 10);
    bg.lineStyle(2, item ? C.rarity[item.rarity]?.color || C.border : C.border, 0.8);
    bg.strokeRoundedRect(-size/2, -size/2, size, size, 10);
    container.add(bg);

    // PNG Icon (or fallback)
    const iconKey = this.SLOT_ICONS[type];
    if (iconKey && this.textures.exists(iconKey)) {
      const icon = this.add.image(0, 0, iconKey);
      icon.setDisplaySize(size * 0.55, size * 0.55);
      icon.setAlpha(item ? 1 : 0.3);
      if (!item) icon.setTint(0x666666);
      container.add(icon);
    }

    // Item level badge (if equipped)
    if (item && item.level) {
      const lvlBg = this.add.graphics();
      lvlBg.fillStyle(0x000000, 0.7);
      lvlBg.fillCircle(size/2 - 14, size/2 - 14, 12);
      container.add(lvlBg);

      const lvl = this.add.text(size/2 - 14, size/2 - 14, item.level, {
        fontFamily: C.fontMain,
        fontSize: '14px',
        fontStyle: 'bold',
        color: C.gold
      }).setOrigin(0.5);
      container.add(lvl);
    }

    // Interactive
    const hitArea = this.add.rectangle(0, 0, size, size, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      if (item) this._showItemPopup(item, 'unequip');
    });
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a3040, 1);
      bg.fillRoundedRect(-size/2, -size/2, size, size, 10);
      bg.lineStyle(2, C.goldHex, 1);
      bg.strokeRoundedRect(-size/2, -size/2, size, size, 10);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(C.slotBg, 1);
      bg.fillRoundedRect(-size/2, -size/2, size, size, 10);
      bg.lineStyle(2, item ? C.rarity[item.rarity]?.color || C.border : C.border, 0.8);
      bg.strokeRoundedRect(-size/2, -size/2, size, size, 10);
    });
    container.add(hitArea);

    this.panel.add(container);
    this.slotSprites[type] = { container, bg };
  }

  // ============================================================
  //  HERO PREVIEW — 20% bigger, 30% lower
  // ============================================================
  _createHeroPreview(x, y) {
    // Shadow/pedestal
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(x, y + 100, 100, 25);
    this.panel.add(shadow);

    // Try Spine hero
    if (this.cache?.custom?.spine?.get('hero')) {
      try {
        this.heroSpine = this.add.spine(x, y + 80, 'hero', 'idle', true);
        this.heroSpine.setScale(0.35);  // 20% bigger than 0.28
        this.panel.add(this.heroSpine);
        return;
      } catch (e) {
        console.log('[INV] Spine failed, using fallback');
      }
    }

    // Fallback - use hero image if exists
    if (this.textures.exists('hero_preview')) {
      const hero = this.add.image(x, y + 40, 'hero_preview');
      hero.setDisplaySize(180, 220);
      this.panel.add(hero);
    }
  }

  // ============================================================
  //  STATS BUTTON — Clickable bar with HP/ATK/DEF
  // ============================================================
  _createStatsButton() {
    const C = this.CFG;
    const P = this.panelBounds;
    const barH = 56;
    const y = this.equipZoneEndY;

    const container = this.add.container(0, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1d24, 1);
    bg.fillRoundedRect(16, 0, P.w - 32, barH, 12);
    bg.lineStyle(2, C.border, 0.6);
    bg.strokeRoundedRect(16, 0, P.w - 32, barH, 12);
    container.add(bg);

    // Stats
    const stats = this._calculateStats();
    const centerY = barH / 2;
    const statW = (P.w - 32) / 3;

    // HP
    const hpX = 16 + statW * 0.5;
    if (this.textures.exists('icon_hp')) {
      container.add(this.add.image(hpX - 40, centerY, 'icon_hp').setDisplaySize(24, 24));
    } else {
      container.add(this.add.text(hpX - 40, centerY, '❤️', { fontSize: '20px' }).setOrigin(0.5));
    }
    container.add(this.add.text(hpX, centerY, stats.hp.toString(), {
      fontFamily: C.fontMain, fontSize: '22px', fontStyle: 'bold', color: C.red
    }).setOrigin(0.5));

    // ATK
    const atkX = 16 + statW * 1.5;
    if (this.textures.exists('icon_atk')) {
      container.add(this.add.image(atkX - 40, centerY, 'icon_atk').setDisplaySize(24, 24));
    } else {
      container.add(this.add.text(atkX - 40, centerY, '⚔️', { fontSize: '20px' }).setOrigin(0.5));
    }
    container.add(this.add.text(atkX, centerY, stats.atk.toString(), {
      fontFamily: C.fontMain, fontSize: '22px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5));

    // DEF
    const defX = 16 + statW * 2.5;
    if (this.textures.exists('icon_def')) {
      container.add(this.add.image(defX - 40, centerY, 'icon_def').setDisplaySize(24, 24));
    } else {
      container.add(this.add.text(defX - 40, centerY, '🛡️', { fontSize: '20px' }).setOrigin(0.5));
    }
    container.add(this.add.text(defX, centerY, stats.def.toString(), {
      fontFamily: C.fontMain, fontSize: '22px', fontStyle: 'bold', color: C.blue
    }).setOrigin(0.5));

    // Arrow indicator (shows it's clickable)
    const arrow = this.add.text(P.w - 40, centerY, '›', {
      fontSize: '28px', color: C.textMuted
    }).setOrigin(0.5);
    container.add(arrow);

    // Make clickable
    const hitbox = this.add.rectangle(P.w / 2, centerY, P.w - 32, barH, 0xffffff, 0);
    hitbox.setInteractive({ useHandCursor: true });
    hitbox.on('pointerdown', () => {
      // Visual feedback
      bg.clear();
      bg.fillStyle(0x252830, 1);
      bg.fillRoundedRect(16, 0, P.w - 32, barH, 12);
      bg.lineStyle(2, C.goldHex, 1);
      bg.strokeRoundedRect(16, 0, P.w - 32, barH, 12);

      // Open stats panel
      this._openStatsDetail();
    });
    hitbox.on('pointerup', () => {
      bg.clear();
      bg.fillStyle(0x1a1d24, 1);
      bg.fillRoundedRect(16, 0, P.w - 32, barH, 12);
      bg.lineStyle(2, C.border, 0.6);
      bg.strokeRoundedRect(16, 0, P.w - 32, barH, 12);
    });
    container.add(hitbox);

    this.panel.add(container);
    this.statsBarEndY = y + barH;
  }

  _calculateStats() {
    let hp = 850, atk = 120, def = 75;
    Object.values(this.equipped).forEach(item => {
      if (item) {
        hp += item.hp || 0;
        atk += item.atk || 0;
        def += item.def || 0;
      }
    });
    // Also check heroState
    if (window.heroState) {
      hp = window.heroState.maxHp || hp;
      atk = window.heroState.attack || atk;
      def = window.heroState.defense || def;
    }
    return { hp, atk, def };
  }

  _openStatsDetail() {
    console.log('[INV] Opening stats detail panel');
    // TODO: Open detailed stats panel
  }

  // ============================================================
  //  GRID — Properly aligned inventory slots
  // ============================================================
  _createGrid() {
    const C = this.CFG;
    const P = this.panelBounds;
    const startY = this.statsBarEndY + 12;

    // Title bar
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x0e1116, 0.5);
    titleBg.fillRect(0, startY, P.w, 36);
    this.panel.add(titleBg);

    const title = this.add.text(C.panelInnerPad, startY + 18, 'Предметы', {
      fontFamily: C.fontMain,
      fontSize: '18px',
      fontStyle: 'bold',
      color: C.textColor
    }).setOrigin(0, 0.5);
    this.panel.add(title);

    const totalSlots = C.gridCols * C.gridRows;
    const count = this.add.text(P.w - C.panelInnerPad, startY + 18, `${this.items.length}/${totalSlots}`, {
      fontFamily: C.fontMain,
      fontSize: '16px',
      color: C.textMuted
    }).setOrigin(1, 0.5);
    this.panel.add(count);

    // Grid content
    const gridStartY = startY + 44;
    const slotSize = C.gridSlot;
    const gap = C.gridGap;
    const listH = P.h - gridStartY - 16;

    // Calculate grid dimensions
    const totalRows = Math.max(C.gridRows, Math.ceil(this.items.length / C.gridCols));
    const contentH = totalRows * (slotSize + gap);

    // Center the grid horizontally
    const actualGridW = C.gridCols * slotSize + (C.gridCols - 1) * gap;
    const gridStartX = (P.w - actualGridW) / 2 + slotSize / 2;

    // Grid container for scrolling
    this.gridContent = this.add.container(0, 0);
    this.panel.add(this.gridContent);

    // Create slots
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < C.gridCols; col++) {
        const i = row * C.gridCols + col;
        const x = gridStartX + col * (slotSize + gap);
        const y = gridStartY + row * (slotSize + gap) + slotSize / 2;

        const item = this.items[i] || null;
        this._createGridSlot(x, y, item, i, slotSize);
      }
    }

    // Mask (NOT added to scene!)
    const maskGfx = this.make.graphics({ add: false });
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(0, gridStartY, P.w, listH);
    this.gridContent.setMask(maskGfx.createGeometryMask());

    // Scroll bounds
    this.scrollMaxY = 0;
    this.scrollMinY = Math.min(0, listH - contentH);

    // Setup scroll if needed
    if (contentH > listH) {
      this._setupScroll(gridStartY, listH);
    }

    console.log(`[INV] Grid: ${totalRows} rows, scrollable: ${contentH > listH}`);
  }

  _createGridSlot(x, y, item, index, size) {
    const C = this.CFG;
    const container = this.add.container(x, y);

    // Slot background
    const bg = this.add.graphics();
    bg.fillStyle(C.slotBg, 1);
    bg.fillRoundedRect(-size/2, -size/2, size, size, 8);
    if (item) {
      bg.lineStyle(2, C.rarity[item.rarity]?.color || C.border, 1);
    } else {
      bg.lineStyle(1, C.border, 0.4);
    }
    bg.strokeRoundedRect(-size/2, -size/2, size, size, 8);
    container.add(bg);

    if (item) {
      // Item icon
      const iconKey = this.SLOT_ICONS[item.type];
      if (iconKey && this.textures.exists(iconKey)) {
        const icon = this.add.image(0, -4, iconKey);
        icon.setDisplaySize(size * 0.5, size * 0.5);
        container.add(icon);
      }

      // Level badge
      if (item.level) {
        const lvl = this.add.text(size/2 - 12, size/2 - 12, item.level, {
          fontFamily: C.fontMain,
          fontSize: '14px',
          fontStyle: 'bold',
          color: C.gold
        }).setOrigin(0.5);
        lvl.setShadow(1, 1, '#000000', 3);
        container.add(lvl);
      }

      // Quantity (if stackable)
      if (item.quantity && item.quantity > 1) {
        const qty = this.add.text(-size/2 + 12, size/2 - 12, 'x' + item.quantity, {
          fontFamily: C.fontMain,
          fontSize: '12px',
          color: '#ffffff'
        }).setOrigin(0.5);
        qty.setShadow(1, 1, '#000000', 2);
        container.add(qty);
      }

      // Interactive
      const hitArea = this.add.rectangle(0, 0, size, size, 0xffffff, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this._showItemPopup(item, 'equip'));
      container.add(hitArea);
    }

    this.gridContent.add(container);
    this.gridSlots.push({ container, item, index });
  }

  // ============================================================
  //  SCROLL
  // ============================================================
  _setupScroll(startY, viewH) {
    const P = this.panelBounds;

    let isDragging = false;
    let startDragY = 0;
    let startScrollY = 0;

    this.input.on('pointerdown', (pointer) => {
      // Check if inside grid area
      const localY = pointer.y - P.y;
      if (localY > startY && localY < startY + viewH) {
        isDragging = true;
        startDragY = pointer.y;
        startScrollY = this.gridContent.y;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!isDragging) return;
      const delta = pointer.y - startDragY;
      let newY = startScrollY + delta;
      newY = Phaser.Math.Clamp(newY, this.scrollMinY, this.scrollMaxY);
      this.gridContent.y = newY;
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    // Mouse wheel
    this.input.on('wheel', (pointer, objects, dx, dy) => {
      let newY = this.gridContent.y - dy * 0.5;
      newY = Phaser.Math.Clamp(newY, this.scrollMinY, this.scrollMaxY);
      this.gridContent.y = newY;
    });
  }

  // ============================================================
  //  ITEM POPUP
  // ============================================================
  _showItemPopup(item, action) {
    console.log('[INV] Item clicked:', item.name, action);
    // TODO: Show item detail popup with equip/unequip button
  }

  // ============================================================
  //  CLOSE
  // ============================================================
  closeInventory() {
    this.tweens.add({
      targets: this.panel,
      alpha: 0,
      scale: 0.95,
      duration: 150,
      ease: 'Power2',
      onComplete: () => this.scene.stop()
    });
  }

  // ============================================================
  //  TEST DATA
  // ============================================================
  _getTestItems() {
    const types = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand', 'offHand', 'necklace', 'ring1'];
    const rarities = ['common', 'common', 'common', 'uncommon', 'uncommon', 'rare', 'epic'];

    return Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      type: types[i % types.length],
      rarity: rarities[i % rarities.length],
      level: Math.floor(Math.random() * 20) + 1,
      hp: Math.floor(Math.random() * 50),
      atk: Math.floor(Math.random() * 20),
      def: Math.floor(Math.random() * 15)
    }));
  }
}

// Register scene
if (typeof window !== 'undefined') {
  window.InventoryScene = InventoryScene;
}

console.log('[InventoryScene] v2 Clean Design loaded');
