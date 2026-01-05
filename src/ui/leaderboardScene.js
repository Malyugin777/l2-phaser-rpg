"use strict";

// ============================================================
//  LEADERBOARD SCENE — Dark Fantasy Style (Phaser 3)
//  Modal panel with tabs + scrollable list + "me" row
//  v14 — @username display + safe area margins
// ============================================================

class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: "LeaderboardScene" });

    this.CFG = {
      panelMaxW: 720,
      panelSidePad: 28,
      panelInnerPad: 36,
      radius: 28,

      headerH: 110,
      tabH: 56,
      tabGap: 14,

      rowH: 100,
      rowGap: 16,

      footerH: 130,

      bgTop: 0x2a313b,
      bgBottom: 0x0e141b,
      gold: "#D6B36A",
      goldHex: 0xD6B36A,

      // Font families (readable, no pixel fonts)
      fontMain: 'Verdana, Arial, sans-serif',
      fontReadable: 'Verdana, Arial, sans-serif',

      top1: { border: 0xd6b36a, badge: 0xd6b36a },
      top2: { border: 0xbec5d1, badge: 0xbec5d1 },
      top3: { border: 0xb37a4c, badge: 0xb37a4c },

      // Focused row scaling
      focusBaseScale: 1.0,
      focusMaxScale: 1.08,
      focusRadius: 250,
      focusSmoothing: 0.15,
    };

    this.currentTab = "rating";

    const baseRating = [
      { id: 1, level: 40, name: "Mighty Ernest", value: 1308 },
      { id: 2, level: 40, name: "The Chef", value: 1274 },
      { id: 3, level: 40, name: "Ron The TNT", value: 1274 },
      { id: 4, level: 40, name: "Ares The Tense", value: 1205 },
      { id: 5, level: 39, name: "Wade The Cannon", value: 1160 },
      { id: 6, level: 38, name: "Shawn The Smart", value: 1121 },
      { id: 7, level: 37, name: "The Knight", value: 1049 },
      { id: 8, level: 36, name: "Rick Du Aguilar", value: 1034 },
      { id: 9, level: 35, name: "Shadow Walker", value: 998 },
      { id: 10, level: 34, name: "Dragon Slayer", value: 956 },
    ];

    const baseKills = [
      { id: 1, level: 40, name: "Ron The TNT", value: 842 },
      { id: 2, level: 40, name: "Mighty Ernest", value: 799 },
      { id: 3, level: 40, name: "The Chef", value: 760 },
      { id: 4, level: 39, name: "Ares The Tense", value: 702 },
      { id: 5, level: 38, name: "Wade The Cannon", value: 654 },
      { id: 6, level: 37, name: "Shawn The Smart", value: 612 },
    ];

    this.mockRating = this._expandMock(baseRating, 40);
    this.mockKills = this._expandMock(baseKills, 40);

    this.myData = {
      name: "Malyugin777",
      level: 20,
      rating: 98,
      kills: 12,
      rankRating: 42,
      rankKills: 77,
    };

    // API data (null = use mock)
    this.apiRating = null;
    this.apiKills = null;
    this.isLoading = false;

    this._drag = null;
  }

  /**
   * Load leaderboard from API
   */
  async _loadLeaderboard(tab) {
    if (typeof apiGetLeaderboard !== 'function') {
      console.warn('[LEADERBOARD] API not available, using mock data');
      return;
    }

    this.isLoading = true;
    console.log('[LEADERBOARD] Loading from API, tab:', tab);

    try {
      const result = await apiGetLeaderboard(tab);

      if (result.success && result.leaderboard) {
        const data = result.leaderboard.map((u, i) => ({
          id: i + 1,
          name: u.username ? `@${u.username}` : (u.first_name || 'Unknown'),
          level: u.level || 1,
          value: tab === 'kills' ? (u.kills || 0) : (u.rating || 0),
          avatar: u.photo_url || null
        }));

        if (tab === 'rating') {
          this.apiRating = data;
        } else {
          this.apiKills = data;
        }

        console.log('[LEADERBOARD] API loaded:', data.length, 'entries');
        this._refreshList();
      }
    } catch (error) {
      console.error('[LEADERBOARD] API error:', error);
    }

    this.isLoading = false;
  }

  _expandMock(base, targetCount) {
    const out = [];
    let id = 1;
    while (out.length < targetCount) {
      for (let i = 0; i < base.length && out.length < targetCount; i++) {
        const b = base[i];
        out.push({
          id: id++,
          level: Math.max(1, b.level - Math.floor(out.length / 3)),
          name: b.name,
          value: Math.max(1, b.value - out.length * 7),
        });
      }
    }
    return out;
  }

  preload() {
    if (!this.textures.exists("icon_golden_cup")) {
      this.load.image("icon_golden_cup", "assets/ui/golden_cup.png");
    }
    if (!this.textures.exists("icon_pvp")) {
      this.load.image("icon_pvp", "assets/ui/pvp_1.png");
    }
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const C = this.CFG;

    // Safe areas with fallback for phones with notches
    const safeTop = Math.max((window?.SAFE_TOP_PX ?? 0) | 0, 60);
    const safeBottom = Math.max((window?.SAFE_BOTTOM_PX ?? 0) | 0, 80);
    const usableH = H - safeTop - safeBottom;

    const panelW = Math.min(C.panelMaxW, W - C.panelSidePad * 2);
    const panelH = Math.min(usableH - 40, H - safeTop - safeBottom - 40);
    const panelX = (W - panelW) / 2;
    const panelY = safeTop + Math.max(10, (usableH - panelH) / 2);

    this.panelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };

    this.ui = this.add.container(0, 0);

    // Dimmer - close only on tap (not during scroll)
    const dimmer = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75);
    dimmer.setInteractive();

    let dimmerDownTime = 0;
    let dimmerDownPos = { x: 0, y: 0 };

    dimmer.on("pointerdown", (pointer) => {
      dimmerDownTime = Date.now();
      dimmerDownPos = { x: pointer.x, y: pointer.y };
    });

    dimmer.on("pointerup", (pointer) => {
      // Only close if it was a quick tap (< 300ms) and didn't move much (< 20px)
      const dt = Date.now() - dimmerDownTime;
      const dx = Math.abs(pointer.x - dimmerDownPos.x);
      const dy = Math.abs(pointer.y - dimmerDownPos.y);

      if (dt < 300 && dx < 20 && dy < 20 && !this._drag?.active) {
        this.close();
      }
    });

    this.ui.add(dimmer);

    // Panel container
    this.panel = this.add.container(panelX, panelY);
    this.ui.add(this.panel);

    // Panel background
    const bg = this.add.graphics();
    bg.fillGradientStyle(C.bgTop, C.bgTop, C.bgBottom, C.bgBottom, 1);
    bg.fillRoundedRect(0, 0, panelW, panelH, C.radius);
    this.panel.add(bg);

    this._createHeader();
    this._createTabs();
    this._createList();
    this._createFooter();

    // Open animation
    this.panel.setAlpha(0);
    this.panel.setScale(0.98);
    this.tweens.add({
      targets: this.panel,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: "Back.Out",
    });

    this.input.keyboard?.on("keydown-ESC", () => this.close());

    // Load data from API
    this._loadLeaderboard(this.currentTab);

    console.log("[LeaderboardScene] v13 Created");
  }

  _createHeader() {
    const C = this.CFG;
    const P = this.panelBounds;

    const title = this.add.text(C.panelInnerPad, 54, "ЛИДЕРБОРД", {
      fontFamily: C.fontMain,
      fontSize: "36px",
      fontStyle: "bold",
      color: C.gold,
    });
    title.setOrigin(0, 0.5);
    title.setShadow(0, 4, "#000000", 8);
    this.panel.add(title);

    // Close button
    const cx = P.w - 54;
    const cy = 54;

    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x0e141b, 0.35);
    closeBg.fillCircle(cx, cy, 30);
    closeBg.lineStyle(2, 0xffffff, 0.12);
    closeBg.strokeCircle(cx, cy, 30);
    this.panel.add(closeBg);

    const closeX = this.add.text(cx, cy, "×", {
      fontSize: "50px",
      fontStyle: "bold",
      color: "#0E141B",
    }).setOrigin(0.5);

    closeX.setInteractive({ useHandCursor: true });
    closeX.on("pointerdown", () => {
      this._pressPop(closeX, 0.92);
      this.close();
    });
    this.panel.add(closeX);

    // Separator
    const line = this.add.graphics();
    line.lineStyle(2, 0xffffff, 0.10);
    line.lineBetween(0, C.headerH, P.w, C.headerH);
    this.panel.add(line);
  }

  _createTabs() {
    const C = this.CFG;
    const y = C.headerH + 18;
    const x0 = C.panelInnerPad;

    this.tabs = {};
    this.tabs.rating = this._createTab(x0, y, "Рейтинг", "rating");
    this.tabs.kills = this._createTab(x0 + 220, y, "Убийства", "kills");

    this._updateTabs();
  }

  _createTab(x, y, label, key) {
    const C = this.CFG;
    const tabW = 200;
    const tabH = C.tabH;

    const tab = this.add.container(x, y);
    const bg = this.add.graphics();
    tab.add(bg);

    const iconKey = key === "rating" ? "icon_golden_cup" : "icon_pvp";
    const icon = this.textures.exists(iconKey)
      ? this.add.image(30, tabH / 2, iconKey).setDisplaySize(32, 32)
      : this.add.text(30, tabH / 2, key === "rating" ? "🏆" : "☠️", { fontSize: "28px" }).setOrigin(0.5);
    tab.add(icon);

    const text = this.add.text(60, tabH / 2, label, {
      fontFamily: C.fontMain,
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0, 0.5);
    tab.add(text);

    const hit = this.add.rectangle(tabW / 2, tabH / 2, tabW, tabH, 0xffffff, 0);
    hit.setInteractive({ useHandCursor: true });
    hit.on("pointerdown", () => {
      this._pressPop(tab, 0.97);
      this._switchTab(key);
    });
    tab.add(hit);

    this.panel.add(tab);
    return { tab, bg, text, icon, w: tabW, h: tabH, key };
  }

  _updateTabs() {
    Object.keys(this.tabs).forEach((k) => {
      const t = this.tabs[k];
      const isActive = this.currentTab === t.key;

      t.bg.clear();
      if (isActive) {
        t.bg.fillGradientStyle(0xd6b36a, 0xd6b36a, 0xb89149, 0xb89149, 1);
        t.bg.fillRoundedRect(0, 0, t.w, t.h, 28);
        t.bg.lineStyle(2, 0xe6cc8b, 1);
        t.bg.strokeRoundedRect(0, 0, t.w, t.h, 28);
        t.text.setColor("#0E141B").setAlpha(1);
      } else {
        t.bg.fillStyle(0xffffff, 0.06);
        t.bg.fillRoundedRect(0, 0, t.w, t.h, 28);
        t.bg.lineStyle(2, 0xffffff, 0.12);
        t.bg.strokeRoundedRect(0, 0, t.w, t.h, 28);
        t.text.setColor("#ffffff").setAlpha(0.65);
      }
    });
  }

  _switchTab(key) {
    if (this.currentTab === key) return;
    this.currentTab = key;
    this._updateTabs();
    this._refreshList();
    this._updateFooter();

    // Load API data for new tab if not already loaded
    const hasData = key === 'rating' ? this.apiRating : this.apiKills;
    if (!hasData) {
      this._loadLeaderboard(key);
    }
  }

  _createList() {
    const C = this.CFG;
    const P = this.panelBounds;

    const listY = C.headerH + 18 + C.tabH + 18;
    const listH = P.h - listY - C.footerH - 18;

    this.listBounds = {
      x: 16,
      y: listY,
      w: P.w - 32,
      h: Math.max(220, listH),
    };

    // Глобальные bounds для проверки кликов
    this.listGlobalBounds = {
      x: P.x + this.listBounds.x,
      y: P.y + this.listBounds.y,
      w: this.listBounds.w,
      h: this.listBounds.h,
    };

    this.listContent = this.add.container(0, 0);
    this.panel.add(this.listContent);

    // Маска
    const maskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(this.listBounds.x, this.listBounds.y, this.listBounds.w, this.listBounds.h);
    this.listContent.setMask(maskGraphics.createGeometryMask());

    this._setupScroll();
    this._refreshList();
  }

  _getTabData() {
    // Use API data if available, otherwise mock
    if (this.currentTab === "rating") {
      return this.apiRating || this.mockRating;
    } else {
      return this.apiKills || this.mockKills;
    }
  }

  _refreshList() {
    const C = this.CFG;
    const L = this.listBounds;

    this.listContent.removeAll(true);

    const data = this._getTabData();

    data.forEach((row, i) => {
      const y = L.y + i * (C.rowH + C.rowGap) + C.rowH / 2;
      const x = L.x + L.w / 2;
      this._createRow(x, y, row, i + 1);
    });

    const contentH = data.length * C.rowH + Math.max(0, data.length - 1) * C.rowGap;

    this.scrollMaxY = 0;
    this.scrollMinY = Math.min(0, L.h - contentH);
    this.listContent.y = 0;

    // Apply initial focus effect
    this._updateFocusEffect();

    console.log(`[LEADERBOARD] ${data.length} rows, contentH=${contentH}, listH=${L.h}, scrollMin=${this.scrollMinY}`);
  }

  _createRow(x, y, data, rank) {
    const C = this.CFG;
    const L = this.listBounds;
    const isTop = rank <= 3;
    const rowW = L.w - 48;  // Было -16, теперь больше padding

    const row = this.add.container(x, y);

    // Background with gradient for top 3
    const bg = this.add.graphics();
    if (isTop) {
      const cfg = rank === 1 ? C.top1 : rank === 2 ? C.top2 : C.top3;
      bg.fillGradientStyle(cfg.border, 0x1a1d24, 0x1a1d24, cfg.border, 0.25, 0.05, 0.05, 0.15);
      bg.fillRoundedRect(-rowW / 2, -C.rowH / 2, rowW, C.rowH, 16);
      bg.lineStyle(2, cfg.border, 0.6);
      bg.strokeRoundedRect(-rowW / 2, -C.rowH / 2, rowW, C.rowH, 16);
    } else {
      bg.fillStyle(0xffffff, 0.05);
      bg.fillRoundedRect(-rowW / 2, -C.rowH / 2, rowW, C.rowH, 16);
    }
    row.add(bg);

    // Rank badge - сдвинул правее
    const badgeX = -rowW / 2 + 45;
    const badge = this.add.graphics();
    if (isTop) {
      const cfg = rank === 1 ? C.top1 : rank === 2 ? C.top2 : C.top3;
      badge.fillStyle(cfg.badge, 1);
    } else {
      badge.fillStyle(0xffffff, 0.08);
    }
    badge.fillCircle(badgeX, 0, 22);  // Чуть меньше
    row.add(badge);

    row.add(this.add.text(badgeX, 0, String(rank), {
      fontFamily: C.fontMain,
      fontSize: "18px",
      fontStyle: "bold",
      color: isTop ? "#0E141B" : "rgba(255,255,255,0.55)",
    }).setOrigin(0.5));

    // Level badge - ближе к rank
    const lvlX = badgeX + 58;  // Было 70
    const lvlBg = this.add.graphics();
    lvlBg.fillStyle(0xffffff, 0.10);
    lvlBg.fillCircle(lvlX, 0, 28);  // Чуть меньше
    lvlBg.lineStyle(2, 0xffffff, 0.15);
    lvlBg.strokeCircle(lvlX, 0, 28);
    row.add(lvlBg);

    row.add(this.add.text(lvlX, -10, "Lvl", { fontFamily: C.fontReadable, fontSize: "12px", color: "rgba(255,255,255,0.55)" }).setOrigin(0.5));
    row.add(this.add.text(lvlX, 8, String(data.level), { fontFamily: C.fontMain, fontSize: "16px", fontStyle: "bold", color: "#ffffff" }).setOrigin(0.5));

    // Name - ближе
    row.add(this.add.text(lvlX + 50, 0, data.name, { fontFamily: C.fontMain, fontSize: "18px", color: "#ffffff" }).setOrigin(0, 0.5));

    // Value + icon
    const valueX = rowW / 2 - 30;
    const iconKey = this.currentTab === "rating" ? "icon_golden_cup" : "icon_pvp";
    if (this.textures.exists(iconKey)) {
      const icon = this.add.image(valueX - 90, 0, iconKey);  // Сдвинуто влево
      icon.setDisplaySize(24, 24).setAlpha(0.85);  // Чуть меньше
      row.add(icon);
    }

    row.add(this.add.text(valueX, 0, String(data.value), {
      fontFamily: C.fontMain,
      fontSize: "18px",
      fontStyle: "bold",
      color: isTop ? "#ffffff" : "rgba(255,255,255,0.82)",
    }).setOrigin(1, 0.5));

    // БЕЗ hitbox на строке - скролл через scrollZone

    this.listContent.add(row);
  }

  // Focused row scaling effect (no snap, just visual)
  _updateFocusEffect() {
    const C = this.CFG;
    const L = this.listBounds;
    const focusY = L.y + L.h / 2;  // Center of visible list area

    const easeOutQuad = (t) => t * (2 - t);

    const rows = this.listContent.list;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.active) continue;

      // Row world Y position (accounting for scroll offset)
      const rowWorldY = row.y + this.listContent.y;
      const dist = Math.abs(rowWorldY - focusY);

      // Calculate target scale based on distance from focus
      const t = Math.max(0, 1 - dist / C.focusRadius);
      const targetScale = C.focusBaseScale + (C.focusMaxScale - C.focusBaseScale) * easeOutQuad(t);

      // Smooth interpolation (lerp)
      const currentScale = row.scaleX;
      const newScale = currentScale + (targetScale - currentScale) * C.focusSmoothing;

      row.setScale(newScale);
    }
  }

  _setupScroll() {
    const drag = {
      active: false,
      startY: 0,
      startContentY: 0,
      lastY: 0,
      lastT: 0,
      vel: 0,
      inertiaEvent: null,
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
      const target = Phaser.Math.Clamp(this.listContent.y, this.scrollMinY, this.scrollMaxY);
      if (Math.abs(target - this.listContent.y) < 0.5) {
        this.listContent.y = target;
        this._updateFocusEffect();
        return;
      }
      this.tweens.add({
        targets: this.listContent,
        y: target,
        duration: 180,
        ease: "Sine.Out",
        onUpdate: () => this._updateFocusEffect(),
        onComplete: () => this._updateFocusEffect(),
      });
    };

    // Проверка что pointer внутри list bounds
    const isInListArea = (px, py) => {
      const b = this.listGlobalBounds;
      return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
    };

    // Глобальные события
    this.input.on("pointerdown", (p) => {
      if (!isInListArea(p.x, p.y)) return;
      
      stopInertia();
      drag.active = true;
      drag.startY = p.y;
      drag.startContentY = this.listContent.y;
      drag.lastY = p.y;
      drag.lastT = p.event?.timeStamp ?? performance.now();
      drag.vel = 0;
    });

    this.input.on("pointermove", (p) => {
      if (!drag.active) return;
      const t = p.event?.timeStamp ?? performance.now();
      const dt = Math.max(16, t - drag.lastT);
      const dy = p.y - drag.lastY;
      drag.vel = dy / dt;
      drag.lastY = p.y;
      drag.lastT = t;
      const raw = drag.startContentY + (p.y - drag.startY);
      this.listContent.y = rubberClamp(raw);
      this._updateFocusEffect();
    });

    this.input.on("pointerup", () => {
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
          const next = rubberClamp(this.listContent.y + step);
          this.listContent.y = next;
          v *= 0.92;

          this._updateFocusEffect();

          const outTop = this.listContent.y > this.scrollMaxY + 0.5;
          const outBot = this.listContent.y < this.scrollMinY - 0.5;

          if (Math.abs(v) < 0.02) {
            stopInertia();
            snapToBounds();
          } else if (outTop || outBot) {
            v *= 0.75;
          }
        },
      });
    });

    this.input.on("wheel", (p, go, dx, dy) => {
      if (!isInListArea(p.x, p.y)) return;
      if (this.scrollMinY === 0 && this.scrollMaxY === 0) return;
      const next = Phaser.Math.Clamp(this.listContent.y - dy * 0.6, this.scrollMinY - 40, this.scrollMaxY + 40);
      this.listContent.y = next;
      this._updateFocusEffect();
    });
  }

  _createFooter() {
    const C = this.CFG;
    const P = this.panelBounds;

    this.footer = this.add.container(0, 0);
    this.panel.add(this.footer);

    this.footerBg = this.add.graphics();
    this.footer.add(this.footerBg);

    this.footerRankText = this.add.text(0, 0, "", { fontFamily: C.fontMain, fontSize: "22px", fontStyle: "bold", color: C.gold });
    this.footer.add(this.footerRankText);

    this.footerLvlBg = this.add.graphics();
    this.footer.add(this.footerLvlBg);

    this.footerLvlTop = this.add.text(0, 0, "Lvl", { fontFamily: C.fontReadable, fontSize: "12px", color: "rgba(255,255,255,0.55)" }).setOrigin(0.5);
    this.footer.add(this.footerLvlTop);

    this.footerLvlNum = this.add.text(0, 0, "", { fontFamily: C.fontMain, fontSize: "18px", fontStyle: "bold", color: "#ffffff" }).setOrigin(0.5);
    this.footer.add(this.footerLvlNum);

    this.footerName = this.add.text(0, 0, "", { fontFamily: C.fontMain, fontSize: "18px", fontStyle: "bold", color: "#ffffff" }).setOrigin(0, 0.5);
    this.footer.add(this.footerName);

    this.footerSub = this.add.text(0, 0, "Это ты", { fontFamily: C.fontReadable, fontSize: "12px", color: "rgba(255,255,255,0.4)" }).setOrigin(0, 0.5);
    this.footer.add(this.footerSub);

    this.footerIcon = null;
    this.footerValue = this.add.text(0, 0, "", { fontFamily: C.fontMain, fontSize: "22px", fontStyle: "bold", color: C.gold }).setOrigin(1, 0.5);
    this.footer.add(this.footerValue);

    this.footerY = P.h - C.footerH + 12;
    this._updateFooter();
  }

  _updateFooter() {
    const C = this.CFG;
    const P = this.panelBounds;
    const me = this.myData;

    const isRating = this.currentTab === "rating";
    const meRank = isRating ? me.rankRating : me.rankKills;
    const meValue = isRating ? me.rating : me.kills;

    const footerW = P.w - C.panelInnerPad * 2;
    const footerH = 100;
    const x = C.panelInnerPad;
    const y = this.footerY;

    this.footerBg.clear();
    this.footerBg.fillStyle(0x1a2230, 1);
    this.footerBg.fillRoundedRect(x, y, footerW, footerH, 16);
    this.footerBg.lineStyle(4, C.goldHex, 1);
    this.footerBg.strokeRoundedRect(x, y, footerW, footerH, 16);

    this.footerRankText.setText(`#${meRank}`).setPosition(x + 30, y + footerH / 2).setOrigin(0, 0.5);

    const lvlX = x + 120;
    const lvlY = y + footerH / 2;

    this.footerLvlBg.clear();
    this.footerLvlBg.fillStyle(0xffffff, 0.10);
    this.footerLvlBg.fillCircle(lvlX, lvlY, 32);
    this.footerLvlBg.lineStyle(2, 0xffffff, 0.15);
    this.footerLvlBg.strokeCircle(lvlX, lvlY, 32);

    this.footerLvlTop.setPosition(lvlX, lvlY - 12);
    this.footerLvlNum.setText(String(me.level)).setPosition(lvlX, lvlY + 10);

    const nameX = lvlX + 50;
    this.footerName.setText(me.name).setPosition(nameX, lvlY - 10);
    this.footerSub.setPosition(nameX, lvlY + 16);

    const valueX = x + footerW - 30;
    const iconKey = isRating ? "icon_golden_cup" : "icon_pvp";

    if (this.footerIcon) {
      this.footerIcon.destroy();
      this.footerIcon = null;
    }

    if (this.textures.exists(iconKey)) {
      this.footerIcon = this.add.image(valueX - 110, lvlY, iconKey).setDisplaySize(28, 28).setAlpha(0.85);
      this.footer.add(this.footerIcon);
    }

    this.footerValue.setText(String(meValue)).setPosition(valueX, lvlY);
  }

  _pressPop(target, scaleTo = 0.97) {
    this.tweens.add({
      targets: target,
      scale: scaleTo,
      duration: 70,
      ease: "Sine.Out",
      yoyo: true,
    });
  }

  close() {
    this.tweens.add({
      targets: this.panel,
      alpha: 0,
      scale: 0.985,
      duration: 140,
      ease: "Sine.In",
      onComplete: () => {
        this.scene.stop("LeaderboardScene");
        console.log("[LeaderboardScene] Closed");
      },
    });
  }
}

window.LeaderboardScene = LeaderboardScene;
console.log("[LeaderboardScene] v13 READABLE loaded");
