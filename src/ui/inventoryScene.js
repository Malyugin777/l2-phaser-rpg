"use strict";

// ============================================================
//  INVENTORY SCENE v5 — FIT ON FIRST SCREEN
//  - No header offset, compact layout
//  - Equipment slots 70px, gap 4px
//  - Stats bar 60px
//  - Grid slots 85px
//  - Fixed scroll formula
// ============================================================

class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });

    this.CFG = {
      headerH: 70,

      // Colors
      bgTop: 0x1a1d24,
      bgBottom: 0x0a0c10,
      slotBg: 0x1e2229,
      border: 0x3d4654,

      gold: "#D6B36A",
      goldHex: 0xD6B36A,
      textColor: '#e2e8f0',
      textMuted: '#64748b',
      blue: '#4FA3FF',
      red: '#E05252',

      fontMain: 'Verdana, Arial, sans-serif',

      // Compact slot sizes
      equipSlot: 70,
      equipGap: 4,

      // Stats bar
      statsBarH: 60,

      // Grid
      gridSlot: 85,
      gridGap: 6,
      gridCols: 6,

      // Hero
      heroScale: 0.32,

      // Rarity colors
      rarity: {
        common:    { color: 0x4b5563 },
        uncommon:  { color: 0x22c55e },
        rare:      { color: 0x3b82f6 },
        epic:      { color: 0xa855f7 },
        legendary: { color: 0xD6B36A },
      }
    };

    // PNG icon mapping
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
    this._drag = null;
  }

  init(data) {
    this.items = data?.items || this._getTestItems();
    this.equipped = data?.equipped || {};
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const C = this.CFG;

    this.panelBounds = { x: 0, y: 0, w: W, h: H };

    // Main UI container
    this.ui = this.add.container(0, 0);

    // Background gradient fullscreen
    const bg = this.add.graphics();
    bg.fillGradientStyle(C.bgTop, C.bgTop, C.bgBottom, C.bgBottom, 1);
    bg.fillRect(0, 0, W, H);
    this.ui.add(bg);

    // Fixed header
    this._createHeader();

    // Scrollable content container
    this.scrollContent = this.add.container(0, 0);
    this.ui.add(this.scrollContent);

    // Build content starting after header
    this.currentY = C.headerH;

    this._createEquipmentZone();
    this._createStatsBar();
    this._createGrid();

    // Content height = where we ended
    this.contentHeight = this.currentY;
    // View height = screen minus header
    this.viewHeight = H - C.headerH;

    // Setup scroll
    this._setupFullScroll();

    // Mask below header
    const maskGfx = this.make.graphics({ add: false });
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(0, C.headerH, W, H - C.headerH);
    this.scrollContent.setMask(maskGfx.createGeometryMask());

    // Fade in
    this.ui.setAlpha(0);
    this.tweens.add({
      targets: this.ui,
      alpha: 1,
      duration: 150,
      ease: 'Power2'
    });

    // ESC to close
    this.input.keyboard?.on('keydown-ESC', () => this._close());

    console.log('[INV] v5 Created, contentH:', this.contentHeight, 'viewH:', this.viewHeight);
  }

  // ============================================================
  //  HEADER
  // ============================================================
  _createHeader() {
    const W = this.scale.width;
    const C = this.CFG;

    // Dark header background
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0c10, 0.98);
    headerBg.fillRect(0, 0, W, C.headerH);
    headerBg.lineStyle(1, C.border, 0.5);
    headerBg.lineBetween(0, C.headerH, W, C.headerH);
    this.ui.add(headerBg);

    // Title
    const title = this.add.text(20, C.headerH / 2, 'ИНВЕНТАРЬ', {
      fontFamily: C.fontMain,
      fontSize: '26px',
      fontStyle: 'bold',
      color: C.gold
    }).setOrigin(0, 0.5);
    title.setShadow(0, 2, '#000000', 4);
    this.ui.add(title);

    // Close button
    const closeBtn = this.add.text(W - 30, C.headerH / 2, '×', {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this._close());
    closeBtn.on('pointerover', () => closeBtn.setColor(C.gold));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'));
    this.ui.add(closeBtn);
  }

  // ============================================================
  //  EQUIPMENT ZONE — Compact
  // ============================================================
  _createEquipmentZone() {
    const W = this.scale.width;
    const C = this.CFG;
    const startY = this.currentY + 8;

    const leftSlots = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
    const rightSlots = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];

    const slotSize = C.equipSlot;
    const gap = C.equipGap;

    // Zone height: 6 slots + 5 gaps
    const zoneH = leftSlots.length * slotSize + (leftSlots.length - 1) * gap;

    // Left column
    const leftX = 14 + slotSize / 2;
    leftSlots.forEach((type, i) => {
      const y = startY + i * (slotSize + gap) + slotSize / 2;
      this._createEquipSlot(leftX, y, type, slotSize);
    });

    // Right column
    const rightX = W - 14 - slotSize / 2;
    rightSlots.forEach((type, i) => {
      const y = startY + i * (slotSize + gap) + slotSize / 2;
      this._createEquipSlot(rightX, y, type, slotSize);
    });

    // Hero center — 65% down
    const centerX = W / 2;
    const heroY = startY + zoneH * 0.65;
    this._createHeroPreview(centerX, heroY);

    this.currentY = startY + zoneH + 8;
  }

  // ============================================================
  //  EQUIPMENT SLOT
  // ============================================================
  _createEquipSlot(x, y, type, size) {
    const C = this.CFG;
    const item = this.equipped[type];

    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(C.slotBg, 1);
    bg.fillRoundedRect(-size/2, -size/2, size, size, 8);
    bg.lineStyle(2, item ? C.rarity[item.rarity]?.color || C.border : C.border, 0.8);
    bg.strokeRoundedRect(-size/2, -size/2, size, size, 8);
    container.add(bg);

    // PNG Icon
    const iconKey = this.SLOT_ICONS[type];
    if (iconKey && this.textures.exists(iconKey)) {
      const icon = this.add.image(0, 0, iconKey);
      icon.setDisplaySize(size * 0.55, size * 0.55);
      icon.setAlpha(item ? 1 : 0.25);
      if (!item) icon.setTint(0x555555);
      container.add(icon);
    }

    // Level badge
    if (item && item.level) {
      const lvlBg = this.add.graphics();
      lvlBg.fillStyle(0x000000, 0.8);
      lvlBg.fillCircle(size/2 - 10, size/2 - 10, 10);
      container.add(lvlBg);

      const lvl = this.add.text(size/2 - 10, size/2 - 10, item.level, {
        fontFamily: C.fontMain,
        fontSize: '12px',
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
      bg.fillRoundedRect(-size/2, -size/2, size, size, 8);
      bg.lineStyle(2, C.goldHex, 1);
      bg.strokeRoundedRect(-size/2, -size/2, size, size, 8);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(C.slotBg, 1);
      bg.fillRoundedRect(-size/2, -size/2, size, size, 8);
      bg.lineStyle(2, item ? C.rarity[item.rarity]?.color || C.border : C.border, 0.8);
      bg.strokeRoundedRect(-size/2, -size/2, size, size, 8);
    });
    container.add(hitArea);

    this.scrollContent.add(container);
    this.slotSprites[type] = { container, bg };
  }

  // ============================================================
  //  HERO — Compact
  // ============================================================
  _createHeroPreview(x, y) {
    const C = this.CFG;

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(x, y + 80, 80, 20);
    this.scrollContent.add(shadow);

    // Spine hero
    if (this.cache?.custom?.spine?.get('hero')) {
      try {
        this.heroSpine = this.add.spine(x, y + 60, 'hero', 'idle', true);
        this.heroSpine.setScale(C.heroScale);
        this.scrollContent.add(this.heroSpine);
        return;
      } catch (e) {
        console.log('[INV] Spine failed');
      }
    }

    // Fallback
    if (this.textures.exists('hero_preview')) {
      const hero = this.add.image(x, y + 30, 'hero_preview');
      hero.setDisplaySize(140, 180);
      this.scrollContent.add(hero);
    }
  }

  // ============================================================
  //  STATS BAR — Compact (60px)
  // ============================================================
  _createStatsBar() {
    const W = this.scale.width;
    const C = this.CFG;
    const barH = C.statsBarH;
    const padding = 8;
    const y = this.currentY;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1d24, 1);
    bg.fillRoundedRect(padding, y, W - padding * 2, barH, 12);
    bg.lineStyle(1, C.border, 0.6);
    bg.strokeRoundedRect(padding, y, W - padding * 2, barH, 12);
    this.scrollContent.add(bg);

    // Stats
    const stats = this._calculateStats();
    const centerY = y + barH / 2;
    const statW = (W - padding * 2) / 3;

    // HP
    const hpX = padding + statW * 0.5;
    if (this.textures.exists('icon_hp')) {
      this.scrollContent.add(this.add.image(hpX - 45, centerY, 'icon_hp').setDisplaySize(28, 28));
    } else {
      this.scrollContent.add(this.add.text(hpX - 45, centerY, '❤️', { fontSize: '22px' }).setOrigin(0.5));
    }
    this.scrollContent.add(this.add.text(hpX + 5, centerY, stats.hp.toString(), {
      fontFamily: C.fontMain, fontSize: '24px', fontStyle: 'bold', color: C.red
    }).setOrigin(0.5));

    // ATK
    const atkX = padding + statW * 1.5;
    if (this.textures.exists('icon_atk')) {
      this.scrollContent.add(this.add.image(atkX - 45, centerY, 'icon_atk').setDisplaySize(28, 28));
    } else {
      this.scrollContent.add(this.add.text(atkX - 45, centerY, '⚔️', { fontSize: '22px' }).setOrigin(0.5));
    }
    this.scrollContent.add(this.add.text(atkX + 5, centerY, stats.atk.toString(), {
      fontFamily: C.fontMain, fontSize: '24px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5));

    // DEF
    const defX = padding + statW * 2.5;
    if (this.textures.exists('icon_def')) {
      this.scrollContent.add(this.add.image(defX - 45, centerY, 'icon_def').setDisplaySize(28, 28));
    } else {
      this.scrollContent.add(this.add.text(defX - 45, centerY, '🛡️', { fontSize: '22px' }).setOrigin(0.5));
    }
    this.scrollContent.add(this.add.text(defX + 5, centerY, stats.def.toString(), {
      fontFamily: C.fontMain, fontSize: '24px', fontStyle: 'bold', color: C.blue
    }).setOrigin(0.5));

    this.currentY = y + barH + 8;
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
    if (window.heroState) {
      hp = window.heroState.maxHp || hp;
      atk = window.heroState.attack || atk;
      def = window.heroState.defense || def;
    }
    return { hp, atk, def };
  }

  // ============================================================
  //  GRID
  // ============================================================
  _createGrid() {
    const W = this.scale.width;
    const C = this.CFG;
    const startY = this.currentY;

    // Title bar
    const titleBarH = 36;
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x0e1116, 0.7);
    titleBg.fillRect(0, startY, W, titleBarH);
    this.scrollContent.add(titleBg);

    const title = this.add.text(14, startY + titleBarH / 2, 'Предметы', {
      fontFamily: C.fontMain,
      fontSize: '16px',
      fontStyle: 'bold',
      color: C.textColor
    }).setOrigin(0, 0.5);
    this.scrollContent.add(title);

    const totalSlots = C.gridCols * 6;
    const count = this.add.text(W - 14, startY + titleBarH / 2, `${this.items.length}/${totalSlots}`, {
      fontFamily: C.fontMain,
      fontSize: '14px',
      color: C.textMuted
    }).setOrigin(1, 0.5);
    this.scrollContent.add(count);

    // Grid
    const gridStartY = startY + titleBarH + 6;
    const padding = 10;
    const gap = C.gridGap;
    const cols = C.gridCols;
    const slotSize = C.gridSlot;

    const totalRows = Math.max(4, Math.ceil(this.items.length / cols));

    // Center grid
    const actualGridW = cols * slotSize + (cols - 1) * gap;
    const gridStartX = (W - actualGridW) / 2 + slotSize / 2;

    // Create slots
    this.gridSlots = [];
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const x = gridStartX + col * (slotSize + gap);
        const y = gridStartY + row * (slotSize + gap) + slotSize / 2;

        const item = this.items[i] || null;
        this._createGridSlot(x, y, item, i, slotSize);
      }
    }

    this.currentY = gridStartY + totalRows * (slotSize + gap) + padding;
  }

  _createGridSlot(x, y, item, index, size) {
    const C = this.CFG;
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(C.slotBg, 1);
    bg.fillRoundedRect(-size/2, -size/2, size, size, 8);
    if (item) {
      bg.lineStyle(2, C.rarity[item.rarity]?.color || C.border, 1);
    } else {
      bg.lineStyle(1, C.border, 0.3);
    }
    bg.strokeRoundedRect(-size/2, -size/2, size, size, 8);
    container.add(bg);

    if (item) {
      // Item icon
      const iconKey = this.SLOT_ICONS[item.type];
      if (iconKey && this.textures.exists(iconKey)) {
        const icon = this.add.image(0, -2, iconKey);
        icon.setDisplaySize(size * 0.5, size * 0.5);
        container.add(icon);
      }

      // Level badge
      if (item.level) {
        const lvl = this.add.text(size/2 - 10, size/2 - 10, item.level, {
          fontFamily: C.fontMain,
          fontSize: '13px',
          fontStyle: 'bold',
          color: C.gold
        }).setOrigin(0.5);
        lvl.setShadow(1, 1, '#000000', 3);
        container.add(lvl);
      }

      // Interactive
      const hitArea = this.add.rectangle(0, 0, size, size, 0xffffff, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this._showItemPopup(item, 'equip'));
      container.add(hitArea);
    }

    this.scrollContent.add(container);
    this.gridSlots.push({ container, item, index });
  }

  // ============================================================
  //  SCROLL — Fixed formula
  // ============================================================
  _setupFullScroll() {
    const C = this.CFG;
    const scrollAreaTop = C.headerH;

    const drag = {
      active: false,
      startY: 0,
      contentStartY: 0
    };
    this._drag = drag;

    // Correct formula (like leaderboard)
    const minY = Math.min(0, this.viewHeight - this.contentHeight);
    const maxY = 0;

    console.log('[INV] Scroll: viewH=' + this.viewHeight + ', contentH=' + this.contentHeight + ', minY=' + minY);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.y > scrollAreaTop) {
        drag.active = true;
        drag.startY = pointer.y;
        drag.contentStartY = this.scrollContent.y;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!drag.active) return;
      const delta = pointer.y - drag.startY;
      let newY = drag.contentStartY + delta;
      newY = Phaser.Math.Clamp(newY, minY, maxY);
      this.scrollContent.y = newY;
    });

    this.input.on('pointerup', () => {
      drag.active = false;
    });

    this.input.on('wheel', (pointer, objects, dx, dy) => {
      if (pointer.y > scrollAreaTop) {
        let newY = this.scrollContent.y - dy * 0.5;
        newY = Phaser.Math.Clamp(newY, minY, maxY);
        this.scrollContent.y = newY;
      }
    });
  }

  // ============================================================
  //  ITEM POPUP
  // ============================================================
  _showItemPopup(item, action) {
    console.log('[INV] Item:', item.name, action);
  }

  // ============================================================
  //  CLOSE
  // ============================================================
  _close() {
    this.tweens.add({
      targets: this.ui,
      alpha: 0,
      duration: 120,
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

    return Array.from({ length: 20 }, (_, i) => ({
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

// Register
if (typeof window !== 'undefined') {
  window.InventoryScene = InventoryScene;
}

console.log('[InventoryScene] v5 Compact loaded');
