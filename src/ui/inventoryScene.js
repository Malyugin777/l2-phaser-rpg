"use strict";

// ============================================================
//  INVENTORY SCENE — Leaderboard Architecture v1
//  Phaser Native | L2 Dark Fantasy | Proper Safe Areas + Mask
//
//  Based on LeaderboardScene architecture:
//  - Safe area handling (120px min top)
//  - Dimmer closes only on tap (not scroll)
//  - Proper mask (not added to scene)
//  - Gradient panel
// ============================================================

class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });

    this.CFG = {
      panelMaxW: 720,
      panelSidePad: 28,
      panelInnerPad: 36,
      radius: 28,

      headerH: 100,

      // Colors (L2 Dark Fantasy)
      bgTop: 0x2a313b,
      bgBottom: 0x0e141b,
      panelBg: 0x1a1d24,
      footerBg: 0x111318,
      border: 0x4b5563,

      gold: "#D6B36A",
      goldHex: 0xD6B36A,
      textColor: '#e2e8f0',
      textMuted: '#64748b',
      blue: '#4FA3FF',
      red: '#E05252',

      // Fonts
      fontMain: 'Verdana, Arial, sans-serif',

      // Slot sizes
      equipSlot: 100,
      gridSlot: 90,
      heroBoxW: 200,
      heroBoxH: 280,
      gridCols: 6,

      // Rarity colors
      rarity: {
        common:    { color: 0x4b5563, glow: null },
        uncommon:  { color: 0x22c55e, glow: 0x22c55e },
        rare:      { color: 0x3b82f6, glow: 0x3b82f6 },
        epic:      { color: 0xa855f7, glow: 0xa855f7 },
        legendary: { color: 0xD6B36A, glow: 0xD6B36A },
      }
    };

    this.ICONS = {
      helmet: "⛑️", chest: "🎽", pants: "👖", gloves: "🧤",
      boots: "👢", mainHand: "🗡️", offHand: "🛡️", necklace: "📿",
      earring1: "💎", earring2: "💎", ring1: "💍", ring2: "💍"
    };

    this.LABELS = {
      helmet: "Шлем", chest: "Броня", pants: "Штаны", gloves: "Перчатки",
      boots: "Ботинки", mainHand: "Оружие", offHand: "Щит", necklace: "Ожерелье",
      earring1: "Серьга", earring2: "Серьга", ring1: "Кольцо", ring2: "Кольцо"
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

    // ===== SAFE AREA — CRITICAL for iPhone notch =====
    const safeTop = Math.max((window?.SAFE_TOP_PX ?? 0) | 0, 120);  // Min 120px top!
    const safeBottom = Math.max((window?.SAFE_BOTTOM_PX ?? 0) | 0, 100);
    const usableH = H - safeTop - safeBottom;

    const panelW = Math.min(C.panelMaxW, W - C.panelSidePad * 2);
    const panelH = Math.min(usableH - 40, H * 0.85);
    const panelX = (W - panelW) / 2;
    const panelY = safeTop + 20;

    this.panelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

    // Main UI container
    this.ui = this.add.container(0, 0);

    // ===== DIMMER — close only on tap, not scroll =====
    const dimmer = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8);
    dimmer.setInteractive();

    let dimmerDownTime = 0;
    let dimmerDownPos = { x: 0, y: 0 };

    dimmer.on('pointerdown', (p) => {
      dimmerDownTime = Date.now();
      dimmerDownPos = { x: p.x, y: p.y };
    });

    dimmer.on('pointerup', (p) => {
      const dt = Date.now() - dimmerDownTime;
      const dx = Math.abs(p.x - dimmerDownPos.x);
      const dy = Math.abs(p.y - dimmerDownPos.y);

      // Only close if quick tap (< 300ms) and didn't move much (< 20px)
      if (dt < 300 && dx < 20 && dy < 20 && !this._drag?.active) {
        this._close();
      }
    });

    this.ui.add(dimmer);

    // ===== PANEL CONTAINER =====
    this.panel = this.add.container(panelX, panelY);
    this.ui.add(this.panel);

    // ===== GRADIENT BACKGROUND =====
    const bg = this.add.graphics();
    bg.fillGradientStyle(C.bgTop, C.bgTop, C.bgBottom, C.bgBottom, 1);
    bg.fillRoundedRect(0, 0, panelW, panelH, C.radius);
    this.panel.add(bg);

    // Build UI sections
    this._createHeader();
    this._createEquipmentZone();
    this._createStatsBar();
    this._createGrid();

    // Open animation
    this.panel.setAlpha(0);
    this.panel.setScale(0.98);
    this.tweens.add({
      targets: this.panel,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: 'Back.Out'
    });

    // ESC to close
    this.input.keyboard?.on('keydown-ESC', () => this._close());

    console.log('[InventoryScene] Created with safe area:', safeTop);
  }

  // ============================================================
  //  HEADER
  // ============================================================
  _createHeader() {
    const C = this.CFG;
    const P = this.panelBounds;

    // Title
    const title = this.add.text(C.panelInnerPad, 50, 'ИНВЕНТАРЬ', {
      fontFamily: C.fontMain,
      fontSize: '32px',
      fontStyle: 'bold',
      color: C.gold
    }).setOrigin(0, 0.5);
    title.setShadow(0, 4, '#000000', 8);
    this.panel.add(title);

    // Close button (like leaderboard)
    const cx = P.w - 54;
    const cy = 50;

    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x0e141b, 0.35);
    closeBg.fillCircle(cx, cy, 30);
    closeBg.lineStyle(2, 0xffffff, 0.12);
    closeBg.strokeCircle(cx, cy, 30);
    this.panel.add(closeBg);

    const closeX = this.add.text(cx, cy, '×', {
      fontSize: '50px',
      fontStyle: 'bold',
      color: '#0E141B'
    }).setOrigin(0.5);

    closeX.setInteractive({ useHandCursor: true });
    closeX.on('pointerdown', () => this._close());
    this.panel.add(closeX);

    // Separator line
    const line = this.add.graphics();
    line.lineStyle(2, 0xffffff, 0.10);
    line.lineBetween(0, C.headerH, P.w, C.headerH);
    this.panel.add(line);
  }

  // ============================================================
  //  EQUIPMENT ZONE — slots + hero
  // ============================================================
  _createEquipmentZone() {
    const C = this.CFG;
    const P = this.panelBounds;
    const startY = C.headerH + 20;

    const leftSlots = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
    const rightSlots = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];

    const slotGap = 4;
    const slotWithLabel = C.equipSlot + 20;

    // Left column
    const leftX = C.panelInnerPad + C.equipSlot / 2;
    leftSlots.forEach((type, i) => {
      const y = startY + i * (slotWithLabel + slotGap) + C.equipSlot / 2;
      this._createEquipSlot(leftX, y, type);
    });

    // Right column
    const rightX = P.w - C.panelInnerPad - C.equipSlot / 2;
    rightSlots.forEach((type, i) => {
      const y = startY + i * (slotWithLabel + slotGap) + C.equipSlot / 2;
      this._createEquipSlot(rightX, y, type);
    });

    // Hero in center
    const centerX = P.w / 2;
    const equipColH = 6 * (slotWithLabel + slotGap);
    const centerY = startY + equipColH / 2;
    this._createHeroPreview(centerX, centerY);

    this.equipZoneEndY = startY + equipColH + 10;
  }

  _createEquipSlot(x, y, type) {
    const C = this.CFG;
    const item = this.equipped[type];

    const container = this.add.container(x, y);

    // Black depth background
    const depth = this.add.graphics();
    depth.fillStyle(0x000000, 1);
    depth.fillRoundedRect(-C.equipSlot/2 + 6, -C.equipSlot/2 + 6, C.equipSlot - 12, C.equipSlot - 12, 8);
    container.add(depth);

    // Slot frame
    const hasSlotFrame = this.textures.exists('inv_slot_frame');
    let slotBg;

    if (hasSlotFrame) {
      slotBg = this.add.image(0, 0, 'inv_slot_frame');
      slotBg.setDisplaySize(C.equipSlot, C.equipSlot);
      if (item && item.rarity !== 'common' && C.rarity[item.rarity]?.color) {
        slotBg.setTint(C.rarity[item.rarity].color);
      }
    } else {
      slotBg = this.add.graphics();
      const borderColor = (item && item.rarity !== 'common') ? C.rarity[item.rarity]?.color || C.border : C.border;
      slotBg.fillStyle(0x2a2a35, 1);
      slotBg.fillRoundedRect(-C.equipSlot/2, -C.equipSlot/2, C.equipSlot, C.equipSlot, 12);
      slotBg.lineStyle(4, borderColor, 1);
      slotBg.strokeRoundedRect(-C.equipSlot/2, -C.equipSlot/2, C.equipSlot, C.equipSlot, 12);
    }
    container.add(slotBg);

    // Icon
    const icon = this.add.text(0, -4, this.ICONS[type], {
      fontSize: `${Math.round(C.equipSlot * 0.4)}px`
    }).setOrigin(0.5);
    icon.setAlpha(item ? 1 : 0.15);
    container.add(icon);

    // Item level
    if (item) {
      const lvl = this.add.text(C.equipSlot/2 - 14, C.equipSlot/2 - 20, item.level, {
        fontFamily: C.fontMain,
        fontSize: '18px',
        fontStyle: 'bold',
        color: C.gold
      }).setOrigin(0.5);
      lvl.setShadow(0, 2, '#000000', 4);
      container.add(lvl);
    }

    // Label
    const label = this.add.text(0, C.equipSlot/2 + 16, this.LABELS[type], {
      fontFamily: C.fontMain,
      fontSize: '14px',
      color: C.textMuted
    }).setOrigin(0.5);
    container.add(label);

    // Interactive hit area
    const hitArea = this.add.rectangle(0, 0, C.equipSlot, C.equipSlot, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      if (item) this._showPopup(item, 'unequip');
    });
    hitArea.on('pointerover', () => container.setScale(1.05));
    hitArea.on('pointerout', () => container.setScale(1));
    container.add(hitArea);

    this.panel.add(container);
    this.slotSprites[type] = { container, slotBg, icon };
  }

  _createHeroPreview(x, y) {
    const C = this.CFG;

    // Pedestal shadow
    const pedestal = this.add.graphics();
    pedestal.fillStyle(0x000000, 0.4);
    pedestal.fillEllipse(x, y + 50, 80, 20);
    this.panel.add(pedestal);

    // Spine hero or fallback
    if (this.game.cache?.custom?.spine?.has('hero') || this.cache?.custom?.spine?.get('hero')) {
      try {
        this.heroSpine = this.add.spine(x, y + 50, 'hero', 'idle', true);
        this.heroSpine.setScale(0.28);
        this.panel.add(this.heroSpine);
      } catch (e) {
        this._createHeroFallback(x, y);
      }
    } else {
      this._createHeroFallback(x, y);
    }
  }

  _createHeroFallback(x, y) {
    const emoji = this.add.text(x, y + 30, '🧙‍♂️', { fontSize: '100px' }).setOrigin(0.5);
    this.panel.add(emoji);
  }

  // ============================================================
  //  STATS BAR
  // ============================================================
  _createStatsBar() {
    const C = this.CFG;
    const P = this.panelBounds;
    const barH = 70;
    const y = this.equipZoneEndY;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(C.footerBg, 1);
    bg.fillRect(0, y, P.w, barH);
    bg.lineStyle(2, 0x1f2937, 1);
    bg.lineBetween(0, y, P.w, y);
    bg.lineBetween(0, y + barH, P.w, y + barH);
    this.panel.add(bg);

    // Stats
    const stats = this._calculateStats();
    const statsData = [
      { icon: '❤️', value: stats.hp, label: 'HP', color: C.red },
      { icon: '⚔️', value: stats.atk, label: 'ATK', color: C.gold },
      { icon: '🛡️', value: stats.def, label: 'DEF', color: C.blue }
    ];

    const statW = P.w / 3;
    statsData.forEach((stat, i) => {
      const sx = statW * i + statW / 2;
      const sy = y + barH / 2;

      const val = this.add.text(sx, sy - 8, `${stat.icon} ${stat.value}`, {
        fontFamily: C.fontMain,
        fontSize: '24px',
        fontStyle: 'bold',
        color: stat.color
      }).setOrigin(0.5);
      val.setShadow(0, 2, '#000000', 4);
      this.panel.add(val);

      const lbl = this.add.text(sx, sy + 18, stat.label, {
        fontFamily: C.fontMain,
        fontSize: '14px',
        color: C.textMuted
      }).setOrigin(0.5);
      this.panel.add(lbl);
    });

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
    return { hp, atk, def };
  }

  // ============================================================
  //  GRID — scrollable items
  // ============================================================
  _createGrid() {
    const C = this.CFG;
    const P = this.panelBounds;
    const startY = this.statsBarEndY + 16;

    // Title
    const title = this.add.text(C.panelInnerPad, startY, 'Предметы', {
      fontFamily: C.fontMain,
      fontSize: '22px',
      fontStyle: 'bold',
      color: C.textColor
    });
    this.panel.add(title);

    // Count
    const totalSlots = C.gridCols * 6;
    const count = this.add.text(P.w - C.panelInnerPad, startY, `${this.items.length}/${totalSlots}`, {
      fontFamily: C.fontMain,
      fontSize: '18px',
      color: C.textMuted
    }).setOrigin(1, 0);
    this.panel.add(count);
    this.gridCountText = count;

    // Grid area
    const gridStartY = startY + 40;
    const gridSlot = C.gridSlot;
    const gridGap = 8;
    const listH = P.h - gridStartY - 20;

    // Total rows
    const totalRows = Math.max(6, Math.ceil(totalSlots / C.gridCols));
    const contentH = totalRows * (gridSlot + gridGap);

    // Center grid
    const contentW = P.w - C.panelInnerPad * 2;
    const actualGridW = C.gridCols * gridSlot + (C.gridCols - 1) * gridGap;
    const gridOffsetX = (contentW - actualGridW) / 2;
    const relativeStartX = C.panelInnerPad + gridOffsetX + gridSlot / 2;

    // List bounds (relative to panel)
    this.listBounds = {
      x: 16,
      y: gridStartY,
      w: P.w - 32,
      h: listH
    };

    // Global bounds for scroll detection
    this.listGlobalBounds = {
      x: P.x + this.listBounds.x,
      y: P.y + this.listBounds.y,
      w: this.listBounds.w,
      h: this.listBounds.h
    };

    // Grid content container
    this.gridContent = this.add.container(0, 0);
    this.panel.add(this.gridContent);

    // Create slots
    this.gridSlots = [];
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < C.gridCols; col++) {
        const i = row * C.gridCols + col;
        const x = relativeStartX + col * (gridSlot + gridGap);
        const y = gridStartY + row * (gridSlot + gridGap) + gridSlot / 2;

        const item = this.items[i] || null;
        this._createGridSlot(x, y, item, i, gridSlot);
      }
    }

    // ===== MASK — CORRECT WAY (not added to scene!) =====
    const maskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(this.listBounds.x, this.listBounds.y, this.listBounds.w, this.listBounds.h);
    this.gridContent.setMask(maskGraphics.createGeometryMask());

    // Scroll limits
    this.scrollMaxY = 0;
    this.scrollMinY = Math.min(0, listH - contentH);

    // Setup scroll
    this._setupScroll();

    console.log(`[INV] Grid: rows=${totalRows}, contentH=${contentH}, listH=${listH}, scrollMin=${this.scrollMinY}`);
  }

  _createGridSlot(x, y, item, index, size) {
    const C = this.CFG;

    const container = this.add.container(x, y);

    // Black depth background
    const depth = this.add.graphics();
    depth.fillStyle(0x000000, 1);
    depth.fillRoundedRect(-size/2 + 4, -size/2 + 4, size - 8, size - 8, 6);
    container.add(depth);

    // Slot frame
    const hasSlotFrame = this.textures.exists('inv_slot_frame');
    let slotBg;

    if (hasSlotFrame) {
      slotBg = this.add.image(0, 0, 'inv_slot_frame');
      slotBg.setDisplaySize(size, size);
      if (item && item.rarity !== 'common' && C.rarity[item.rarity]?.color) {
        slotBg.setTint(C.rarity[item.rarity].color);
      }
    } else {
      slotBg = this.add.graphics();
      const borderColor = (item && item.rarity !== 'common') ? C.rarity[item.rarity]?.color || C.border : C.border;
      slotBg.fillStyle(0x2a2a35, 1);
      slotBg.fillRoundedRect(-size/2, -size/2, size, size, 10);
      slotBg.lineStyle(3, borderColor, 1);
      slotBg.strokeRoundedRect(-size/2, -size/2, size, size, 10);
    }
    container.add(slotBg);

    if (item) {
      // Icon
      const icon = this.add.text(0, -4, this.ICONS[item.type], {
        fontSize: `${Math.round(size * 0.4)}px`
      }).setOrigin(0.5);
      container.add(icon);

      // Level
      const lvl = this.add.text(size/2 - 10, size/2 - 14, item.level, {
        fontFamily: C.fontMain,
        fontSize: '16px',
        fontStyle: 'bold',
        color: C.gold
      }).setOrigin(0.5);
      lvl.setShadow(0, 2, '#000000', 4);
      container.add(lvl);

      // Interactive
      const hitArea = this.add.rectangle(0, 0, size, size, 0xffffff, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this._showPopup(item, 'equip'));
      hitArea.on('pointerover', () => container.setScale(1.06));
      hitArea.on('pointerout', () => container.setScale(1));
      container.add(hitArea);
    }

    this.gridContent.add(container);
    this.gridSlots.push({ container, slotBg, index });
  }

  // ============================================================
  //  SCROLL SETUP (like leaderboard)
  // ============================================================
  _setupScroll() {
    const drag = {
      active: false,
      startY: 0,
      startContentY: 0,
      lastY: 0,
      lastT: 0,
      vel: 0,
      inertiaEvent: null
    };
    this._drag = drag;

    const rubberClamp = (y) => {
      if (y > this.scrollMaxY) return this.scrollMaxY + (y - this.scrollMaxY) * 0.35;
      if (y < this.scrollMinY) return this.scrollMinY + (y - this.scrollMinY) * 0.35;
      return y;
    };

    const stopInertia = () => {
      if (drag.inertiaEvent) {
        drag.inertiaEvent.remove(false);
        drag.inertiaEvent = null;
      }
    };

    const snapToBounds = () => {
      const target = Phaser.Math.Clamp(this.gridContent.y, this.scrollMinY, this.scrollMaxY);
      if (Math.abs(target - this.gridContent.y) < 0.5) {
        this.gridContent.y = target;
        return;
      }
      this.tweens.add({
        targets: this.gridContent,
        y: target,
        duration: 180,
        ease: 'Sine.Out'
      });
    };

    // Check if pointer is in list area
    const isInListArea = (px, py) => {
      const b = this.listGlobalBounds;
      return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
    };

    // Global events
    this.input.on('pointerdown', (p) => {
      if (!isInListArea(p.x, p.y)) return;

      stopInertia();
      drag.active = true;
      drag.startY = p.y;
      drag.startContentY = this.gridContent.y;
      drag.lastY = p.y;
      drag.lastT = p.event?.timeStamp ?? performance.now();
      drag.vel = 0;
    });

    this.input.on('pointermove', (p) => {
      if (!drag.active) return;
      const t = p.event?.timeStamp ?? performance.now();
      const dt = Math.max(16, t - drag.lastT);
      const dy = p.y - drag.lastY;
      drag.vel = dy / dt;
      drag.lastY = p.y;
      drag.lastT = t;
      const raw = drag.startContentY + (p.y - drag.startY);
      this.gridContent.y = rubberClamp(raw);
    });

    this.input.on('pointerup', () => {
      if (!drag.active) return;
      drag.active = false;

      if (this.scrollMinY === 0 && this.scrollMaxY === 0) {
        snapToBounds();
        return;
      }

      stopInertia();
      let v = Phaser.Math.Clamp(drag.vel, -2.5, 2.5);
      if (Math.abs(v) < 0.02) {
        snapToBounds();
        return;
      }

      drag.inertiaEvent = this.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          const step = v * 16 * 28;
          const next = rubberClamp(this.gridContent.y + step);
          this.gridContent.y = next;
          v *= 0.92;

          const outTop = this.gridContent.y > this.scrollMaxY + 0.5;
          const outBot = this.gridContent.y < this.scrollMinY - 0.5;

          if (Math.abs(v) < 0.02) {
            stopInertia();
            snapToBounds();
          } else if (outTop || outBot) {
            v *= 0.75;
          }
        }
      });
    });

    // Mouse wheel
    this.input.on('wheel', (p, go, dx, dy) => {
      if (!isInListArea(p.x, p.y)) return;
      if (this.scrollMinY === 0 && this.scrollMaxY === 0) return;
      const next = Phaser.Math.Clamp(this.gridContent.y - dy * 0.6, this.scrollMinY - 40, this.scrollMaxY + 40);
      this.gridContent.y = next;
    });
  }

  // ============================================================
  //  POPUP
  // ============================================================
  _showPopup(item, action) {
    const C = this.CFG;
    const W = this.scale.width;
    const H = this.scale.height;

    if (this.popupContainer) this.popupContainer.destroy();

    this.popupContainer = this.add.container(0, 0);
    this.popupContainer.setDepth(100);

    // Dimmer
    const dim = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6);
    dim.setInteractive();
    dim.on('pointerdown', () => this._hidePopup());
    this.popupContainer.add(dim);

    // Panel
    const popupW = Math.min(W * 0.9, 640);
    const popupH = 260;
    const popupX = (W - popupW) / 2;
    const popupY = H - popupH - 80;

    const rarity = C.rarity[item.rarity] || C.rarity.common;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x252a33, 0x252a33, C.panelBg, C.panelBg, 1);
    bg.fillRoundedRect(popupX, popupY, popupW, popupH, 20);
    bg.lineStyle(4, rarity.color, 1);
    bg.strokeRoundedRect(popupX, popupY, popupW, popupH, 20);
    this.popupContainer.add(bg);

    // Item icon background
    const iconBg = this.add.graphics();
    iconBg.fillStyle(0x1a1d24, 1);
    iconBg.fillRoundedRect(popupX + 24, popupY + 24, 90, 90, 14);
    iconBg.lineStyle(3, rarity.color, 1);
    iconBg.strokeRoundedRect(popupX + 24, popupY + 24, 90, 90, 14);
    this.popupContainer.add(iconBg);

    const icon = this.add.text(popupX + 69, popupY + 69, this.ICONS[item.type], {
      fontSize: '42px'
    }).setOrigin(0.5);
    this.popupContainer.add(icon);

    // Name
    const name = this.add.text(popupX + 130, popupY + 30, item.name, {
      fontFamily: C.fontMain,
      fontSize: '24px',
      fontStyle: 'bold',
      color: `#${rarity.color.toString(16).padStart(6, '0')}`
    });
    name.setShadow(0, 2, '#000000', 4);
    this.popupContainer.add(name);

    // Meta
    const rarityNames = { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный' };
    const meta = this.add.text(popupX + 130, popupY + 62, `${rarityNames[item.rarity]} • ${this.LABELS[item.type]} • Ур.${item.level}`, {
      fontFamily: C.fontMain,
      fontSize: '14px',
      color: C.textMuted
    });
    this.popupContainer.add(meta);

    // Stats
    let statsStr = '';
    if (item.atk) statsStr += `⚔️+${item.atk}  `;
    if (item.def) statsStr += `🛡️+${item.def}  `;
    if (item.hp) statsStr += `❤️+${item.hp}`;

    if (statsStr) {
      const stats = this.add.text(popupX + 130, popupY + 92, statsStr.trim(), {
        fontFamily: C.fontMain,
        fontSize: '20px',
        color: C.textColor
      });
      this.popupContainer.add(stats);
    }

    // Buttons
    const btnY = popupY + popupH - 70;
    const btnW = (popupW - 72) / 2;
    const btnH = 50;

    // Action button (Equip/Unequip)
    this._createButton(
      popupX + 24, btnY, btnW, btnH,
      action === 'equip' ? '✨ Надеть' : '📤 Снять',
      0x2d6a4f, 0x40916c,
      () => action === 'equip' ? this._equipItem(item) : this._unequipItem(item)
    );

    // Sell button
    this._createButton(
      popupX + 24 + btnW + 24, btnY, btnW, btnH,
      '💰 Продать',
      0x1a1d24, C.goldHex,
      () => this._sellItem(item),
      true
    );
  }

  _createButton(x, y, w, h, text, bgColor, borderColor, callback, outline = false) {
    const btn = this.add.graphics();

    if (outline) {
      btn.fillStyle(0x000000, 0);
      btn.lineStyle(3, borderColor, 1);
      btn.strokeRoundedRect(x, y, w, h, 10);
    } else {
      btn.fillStyle(bgColor, 1);
      btn.fillRoundedRect(x, y, w, h, 10);
      btn.lineStyle(3, borderColor, 1);
      btn.strokeRoundedRect(x, y, w, h, 10);
    }
    this.popupContainer.add(btn);

    const label = this.add.text(x + w/2, y + h/2, text, {
      fontFamily: this.CFG.fontMain,
      fontSize: '20px',
      fontStyle: 'bold',
      color: outline ? `#${borderColor.toString(16).padStart(6, '0')}` : '#ffffff'
    }).setOrigin(0.5);
    this.popupContainer.add(label);

    const hitArea = this.add.rectangle(x + w/2, y + h/2, w, h, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', callback);
    this.popupContainer.add(hitArea);
  }

  _hidePopup() {
    if (this.popupContainer) {
      this.popupContainer.destroy();
      this.popupContainer = null;
    }
  }

  // ============================================================
  //  ACTIONS
  // ============================================================
  _equipItem(item) {
    if (this.equipped[item.type]) {
      this.items.push(this.equipped[item.type]);
    }
    this.equipped[item.type] = item;
    this.items = this.items.filter(i => i.id !== item.id);

    this._hidePopup();
    this._refreshUI();
    console.log('[INV] Equipped:', item.name);
  }

  _unequipItem(item) {
    delete this.equipped[item.type];
    this.items.push(item);

    this._hidePopup();
    this._refreshUI();
    console.log('[INV] Unequipped:', item.name);
  }

  _sellItem(item) {
    this.items = this.items.filter(i => i.id !== item.id);
    Object.keys(this.equipped).forEach(type => {
      if (this.equipped[type]?.id === item.id) delete this.equipped[type];
    });

    this._hidePopup();
    this._refreshUI();
    console.log('[INV] Sold:', item.name);
  }

  _refreshUI() {
    // Recreate UI
    this.ui.destroy();
    this.create();
  }

  // ============================================================
  //  CLOSE
  // ============================================================
  _close() {
    this._hidePopup();

    this.tweens.add({
      targets: this.panel,
      alpha: 0,
      scale: 0.985,
      duration: 140,
      ease: 'Sine.In',
      onComplete: () => {
        this.scene.stop('InventoryScene');
        console.log('[INV] Closed');
      }
    });
  }

  // ============================================================
  //  TEST DATA
  // ============================================================
  _getTestItems() {
    return [
      { id: "1", type: "mainHand", rarity: "common", level: 5, name: "Железный меч", atk: 15 },
      { id: "2", type: "helmet", rarity: "rare", level: 8, name: "Шлем мага", def: 12, hp: 50 },
      { id: "3", type: "boots", rarity: "uncommon", level: 3, name: "Сапоги следопыта", def: 8 },
      { id: "4", type: "chest", rarity: "epic", level: 15, name: "Доспех дракона", def: 45, hp: 120 },
      { id: "5", type: "pants", rarity: "uncommon", level: 6, name: "Стальные поножи", def: 18 },
      { id: "6", type: "ring1", rarity: "legendary", level: 20, name: "Кольцо Феникса", atk: 30, hp: 200 },
      { id: "7", type: "gloves", rarity: "common", level: 4, name: "Перчатки воина", def: 5 },
      { id: "8", type: "necklace", rarity: "rare", level: 12, name: "Амулет мудрости", hp: 80 },
      { id: "9", type: "offHand", rarity: "uncommon", level: 7, name: "Щит стража", def: 25 },
      { id: "10", type: "earring1", rarity: "rare", level: 10, name: "Серьга удачи", atk: 8 },
      { id: "11", type: "mainHand", rarity: "epic", level: 18, name: "Меч бури", atk: 55 },
      { id: "12", type: "helmet", rarity: "common", level: 2, name: "Кожаный шлем", def: 5 },
      { id: "13", type: "boots", rarity: "legendary", level: 25, name: "Сапоги ветра", def: 20, atk: 15 },
      { id: "14", type: "chest", rarity: "uncommon", level: 9, name: "Кольчуга", def: 30 },
      { id: "15", type: "gloves", rarity: "rare", level: 11, name: "Перчатки вора", atk: 12 },
      { id: "16", type: "ring2", rarity: "epic", level: 16, name: "Кольцо силы", atk: 25 }
    ];
  }
}

// ============================================================
//  EXPORT
// ============================================================
window.InventoryScene = InventoryScene;

console.log('[InventoryScene] Leaderboard Architecture v1 loaded');
