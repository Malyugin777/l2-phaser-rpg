"use strict";

// ============================================================
//  INVENTORY SCENE v5 — CLEAN VERSION
//
//  Первый экран показывает:
//  - Header с кнопкой X
//  - Equipment slots (6 слева + 6 справа)
//  - Hero по центру (ниже на 30%)
//  - Stats bar (кликабельный)
//  - 1-2 строки предметов
//
//  Остальное — скролл вниз
// ============================================================

class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });

    this.CFG = {
      // Layout
      headerH: 60,
      equipSlot: 70,
      equipGap: 4,
      statsBarH: 55,
      gridSlot: 82,
      gridGap: 6,
      gridCols: 6,
      padding: 12,

      // Colors (Dark Fantasy)
      bgDark: 0x0f1218,
      bgPanel: 0x1a1d24,
      slotBg: 0x1e2229,
      border: 0x3d4654,
      borderLight: 0x4a5568,

      gold: "#D6B36A",
      goldHex: 0xD6B36A,
      white: "#ffffff",
      textMuted: "#8892a0",
      red: "#E05252",
      blue: "#4FA3FF",

      fontMain: 'Verdana, Arial, sans-serif',

      // Rarity
      rarity: {
        common:    { color: 0x4b5563 },
        uncommon:  { color: 0x22c55e },
        rare:      { color: 0x3b82f6 },
        epic:      { color: 0xa855f7 },
        legendary: { color: 0xD6B36A },
      }
    };

    // Иконки для пустых слотов экипировки
    this.SLOT_ICONS = {
      helmet:   'inv_helmet',
      chest:    'inv_armor',
      pants:    'inv_legg',
      gloves:   'inv_gloves',
      boots:    'inv_boots',
      mainHand: 'inv_sword',
      offHand:  'inv_shield',
      necklace: 'inv_necklace',
      earring1: 'inv_earring',
      earring2: 'inv_earring',
      ring1:    'inv_ring',
      ring2:    'inv_ring'
    };

    this.items = [];
    this.equipped = {};
  }

  init(data) {
    this.items = data?.items || this._getTestItems();
    this.equipped = data?.equipped || {};
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const C = this.CFG;

    // Background
    this.add.rectangle(W/2, H/2, W, H, C.bgDark);

    // === HEADER (фиксированный) ===
    this._createHeader(W, C);

    // === SCROLLABLE CONTENT ===
    this.scrollContent = this.add.container(0, 0);

    // Начальная Y позиция контента
    let currentY = C.headerH + 10;

    // Equipment Zone (slots + hero)
    currentY = this._createEquipmentZone(W, currentY, C);

    // Stats Bar
    currentY = this._createStatsBar(W, currentY, C);

    // Grid
    currentY = this._createGrid(W, currentY, C);

    // Сохраняем высоту контента
    this.contentHeight = currentY + 20;
    this.viewHeight = H - C.headerH;
    this.scrollStartY = C.headerH;

    // Маска для скролла (под header)
    const maskGfx = this.make.graphics({ add: false });
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(0, C.headerH, W, H - C.headerH);
    this.scrollContent.setMask(maskGfx.createGeometryMask());

    // Setup scroll
    this._setupScroll();

    // ESC закрывает
    this.input.keyboard?.on('keydown-ESC', () => this._close());

    console.log('[INV] v5 Created. ContentH:', this.contentHeight, 'ViewH:', this.viewHeight);
  }

  // ============================================================
  //  HEADER
  // ============================================================
  _createHeader(W, C) {
    // Background
    const bg = this.add.rectangle(W/2, C.headerH/2, W, C.headerH, C.bgPanel);

    // Border bottom
    this.add.rectangle(W/2, C.headerH - 1, W, 2, C.border);

    // Title
    const title = this.add.text(C.padding + 8, C.headerH/2, 'ИНВЕНТАРЬ', {
      fontFamily: C.fontMain,
      fontSize: '22px',
      fontStyle: 'bold',
      color: C.gold
    }).setOrigin(0, 0.5);

    // Close button
    const closeBtn = this.add.text(W - C.padding - 16, C.headerH/2, '×', {
      fontSize: '38px',
      fontStyle: 'bold',
      color: C.white
    }).setOrigin(0.5);

    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this._close());
    closeBtn.on('pointerover', () => closeBtn.setColor(C.gold));
    closeBtn.on('pointerout', () => closeBtn.setColor(C.white));
  }

  // ============================================================
  //  EQUIPMENT ZONE
  // ============================================================
  _createEquipmentZone(W, startY, C) {
    const leftSlots = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
    const rightSlots = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];

    const slot = C.equipSlot;
    const gap = C.equipGap;
    const zoneH = leftSlots.length * slot + (leftSlots.length - 1) * gap;

    // Left column
    const leftX = C.padding + slot/2;
    leftSlots.forEach((type, i) => {
      const y = startY + i * (slot + gap) + slot/2;
      this._createEquipSlot(leftX, y, type, slot, C);
    });

    // Right column
    const rightX = W - C.padding - slot/2;
    rightSlots.forEach((type, i) => {
      const y = startY + i * (slot + gap) + slot/2;
      this._createEquipSlot(rightX, y, type, slot, C);
    });

    // Hero center (30% ниже центра зоны)
    const heroX = W / 2;
    const heroY = startY + zoneH * 0.55;
    this._createHero(heroX, heroY, C);

    return startY + zoneH + 12;
  }

  _createEquipSlot(x, y, type, size, C) {
    const container = this.add.container(x, y);
    const item = this.equipped[type];

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(C.slotBg, 1);
    bg.fillRoundedRect(-size/2, -size/2, size, size, 8);
    bg.lineStyle(2, item ? (C.rarity[item.rarity]?.color || C.border) : C.border, 0.7);
    bg.strokeRoundedRect(-size/2, -size/2, size, size, 8);
    container.add(bg);

    // Icon (силуэт для пустого слота)
    const iconKey = this.SLOT_ICONS[type];
    if (iconKey && this.textures.exists(iconKey)) {
      const icon = this.add.image(0, 0, iconKey);
      icon.setDisplaySize(size * 0.55, size * 0.55);
      icon.setAlpha(item ? 1 : 0.25);
      if (!item) icon.setTint(0x555555);
      container.add(icon);
    }

    // Level badge if equipped
    if (item?.level) {
      const lvl = this.add.text(size/2 - 12, size/2 - 12, item.level, {
        fontFamily: C.fontMain,
        fontSize: '13px',
        fontStyle: 'bold',
        color: C.gold
      }).setOrigin(0.5);
      lvl.setShadow(1, 1, '#000', 2);
      container.add(lvl);
    }

    this.scrollContent.add(container);
  }

  _createHero(x, y, C) {
    // Shadow
    const shadow = this.add.ellipse(x, y + 95, 90, 20, 0x000000, 0.3);
    this.scrollContent.add(shadow);

    // Try Spine
    if (this.cache?.custom?.spine?.get('hero')) {
      try {
        const hero = this.add.spine(x, y + 70, 'hero', 'idle', true);
        hero.setScale(0.32);
        this.scrollContent.add(hero);
        return;
      } catch (e) {}
    }

    // Fallback — просто текст
    const fallback = this.add.text(x, y + 30, '🧍', { fontSize: '80px' }).setOrigin(0.5);
    this.scrollContent.add(fallback);
  }

  // ============================================================
  //  STATS BAR (кликабельный)
  // ============================================================
  _createStatsBar(W, startY, C) {
    const barH = C.statsBarH;
    const container = this.add.container(0, startY);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(C.bgPanel, 1);
    bg.fillRoundedRect(C.padding, 0, W - C.padding * 2, barH, 10);
    bg.lineStyle(1, C.borderLight, 0.5);
    bg.strokeRoundedRect(C.padding, 0, W - C.padding * 2, barH, 10);
    container.add(bg);

    // Stats
    const stats = this._getStats();
    const centerY = barH / 2;
    const sectionW = (W - C.padding * 2) / 3;

    // HP
    this._addStatIcon(container, C.padding + sectionW * 0.5 - 30, centerY, '❤️', stats.hp, C.red, C);

    // ATK
    this._addStatIcon(container, C.padding + sectionW * 1.5 - 30, centerY, '⚔️', stats.atk, C.white, C);

    // DEF
    this._addStatIcon(container, C.padding + sectionW * 2.5 - 30, centerY, '🛡️', stats.def, C.blue, C);

    // Arrow (показывает что кликабельно)
    const arrow = this.add.text(W - C.padding - 20, centerY, '›', {
      fontSize: '24px',
      color: C.textMuted
    }).setOrigin(0.5);
    container.add(arrow);

    // Hitbox
    const hitbox = this.add.rectangle(W/2, centerY, W - C.padding * 2, barH, 0xffffff, 0);
    hitbox.setInteractive({ useHandCursor: true });
    hitbox.on('pointerdown', () => {
      console.log('[INV] Stats clicked — open details');
      // TODO: Open stats detail panel
    });
    container.add(hitbox);

    this.scrollContent.add(container);
    return startY + barH + 8;
  }

  _addStatIcon(container, x, y, emoji, value, color, C) {
    container.add(this.add.text(x, y, emoji, { fontSize: '20px' }).setOrigin(0.5));
    container.add(this.add.text(x + 35, y, value.toString(), {
      fontFamily: C.fontMain,
      fontSize: '22px',
      fontStyle: 'bold',
      color: color
    }).setOrigin(0, 0.5));
  }

  _getStats() {
    if (window.heroState) {
      return {
        hp: window.heroState.maxHp || 850,
        atk: window.heroState.attack || 120,
        def: window.heroState.defense || 75
      };
    }
    return { hp: 850, atk: 120, def: 75 };
  }

  // ============================================================
  //  GRID
  // ============================================================
  _createGrid(W, startY, C) {
    // Title bar
    const titleH = 36;
    const titleBg = this.add.rectangle(W/2, startY + titleH/2, W, titleH, 0x0d1015);
    this.scrollContent.add(titleBg);

    const title = this.add.text(C.padding, startY + titleH/2, 'Предметы', {
      fontFamily: C.fontMain,
      fontSize: '16px',
      fontStyle: 'bold',
      color: C.white
    }).setOrigin(0, 0.5);
    this.scrollContent.add(title);

    const totalSlots = C.gridCols * 6;
    const countText = this.add.text(W - C.padding, startY + titleH/2, `${this.items.length}/${totalSlots}`, {
      fontFamily: C.fontMain,
      fontSize: '14px',
      color: C.textMuted
    }).setOrigin(1, 0.5);
    this.scrollContent.add(countText);

    // Grid
    const gridY = startY + titleH + 8;
    const slot = C.gridSlot;
    const gap = C.gridGap;
    const cols = C.gridCols;

    // Calculate slot size to fit width
    const availW = W - C.padding * 2;
    const actualSlot = Math.floor((availW - gap * (cols - 1)) / cols);
    const gridW = cols * actualSlot + (cols - 1) * gap;
    const gridX = (W - gridW) / 2;

    const rows = Math.max(4, Math.ceil(this.items.length / cols));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const x = gridX + col * (actualSlot + gap) + actualSlot/2;
        const y = gridY + row * (actualSlot + gap) + actualSlot/2;
        const item = this.items[i] || null;
        this._createGridSlot(x, y, item, actualSlot, C);
      }
    }

    return gridY + rows * (actualSlot + gap);
  }

  _createGridSlot(x, y, item, size, C) {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(C.slotBg, 1);
    bg.fillRoundedRect(-size/2, -size/2, size, size, 6);
    if (item) {
      bg.lineStyle(2, C.rarity[item.rarity]?.color || C.border, 1);
    } else {
      bg.lineStyle(1, C.border, 0.3);
    }
    bg.strokeRoundedRect(-size/2, -size/2, size, size, 6);
    container.add(bg);

    if (item) {
      // Icon
      const iconKey = this.SLOT_ICONS[item.type];
      if (iconKey && this.textures.exists(iconKey)) {
        const icon = this.add.image(0, -2, iconKey);
        icon.setDisplaySize(size * 0.5, size * 0.5);
        container.add(icon);
      }

      // Level
      if (item.level) {
        const lvl = this.add.text(size/2 - 10, size/2 - 10, item.level, {
          fontFamily: C.fontMain,
          fontSize: '12px',
          fontStyle: 'bold',
          color: C.gold
        }).setOrigin(0.5);
        lvl.setShadow(1, 1, '#000', 2);
        container.add(lvl);
      }

      // Interactive
      const hit = this.add.rectangle(0, 0, size, size, 0xffffff, 0);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => console.log('[INV] Item:', item.name));
      container.add(hit);
    }

    this.scrollContent.add(container);
  }

  // ============================================================
  //  SCROLL (как в лидерборде)
  // ============================================================
  _setupScroll() {
    const C = this.CFG;

    // Лимиты — ПРАВИЛЬНАЯ формула
    const scrollMin = Math.min(0, this.viewHeight - this.contentHeight);
    const scrollMax = 0;

    console.log('[INV] Scroll: min=' + scrollMin + ', max=' + scrollMax);

    // Если контент меньше view — скролл не нужен
    if (this.contentHeight <= this.viewHeight) {
      console.log('[INV] No scroll needed');
      return;
    }

    let drag = { active: false, startY: 0, scrollY: 0 };

    this.input.on('pointerdown', (p) => {
      if (p.y > this.scrollStartY) {
        drag.active = true;
        drag.startY = p.y;
        drag.scrollY = this.scrollContent.y;
      }
    });

    this.input.on('pointermove', (p) => {
      if (!drag.active) return;
      const delta = p.y - drag.startY;
      let newY = drag.scrollY + delta;
      newY = Phaser.Math.Clamp(newY, scrollMin, scrollMax);
      this.scrollContent.y = newY;
    });

    this.input.on('pointerup', () => {
      drag.active = false;
    });

    // Mouse wheel
    this.input.on('wheel', (p, objs, dx, dy) => {
      if (p.y > this.scrollStartY) {
        let newY = this.scrollContent.y - dy * 0.5;
        newY = Phaser.Math.Clamp(newY, scrollMin, scrollMax);
        this.scrollContent.y = newY;
      }
    });
  }

  // ============================================================
  //  CLOSE
  // ============================================================
  _close() {
    this.tweens.add({
      targets: [this.scrollContent],
      alpha: 0,
      duration: 100,
      onComplete: () => this.scene.stop()
    });
  }

  // ============================================================
  //  TEST DATA
  // ============================================================
  _getTestItems() {
    const types = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand', 'offHand', 'necklace', 'ring1'];
    const rarities = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'rare', 'epic'];

    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      type: types[i % types.length],
      rarity: rarities[i % rarities.length],
      level: Math.floor(Math.random() * 20) + 1
    }));
  }
}

// Register
if (typeof window !== 'undefined') {
  window.InventoryScene = InventoryScene;
}

console.log('[InventoryScene] v5 Clean loaded');
