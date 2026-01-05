"use strict";

// ============================================================
//  LEADERBOARD SCENE — Dark Fantasy Style
//  Converted from React to Phaser 3
// ============================================================

class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
    
    this.CFG = {
      panelW: 720,
      panelPadding: 48,
      headerH: 100,
      tabH: 80,
      rowH: 100,
      footerH: 140,
      
      bgTop: 0x2A313B,
      bgBottom: 0x0E141B,
      gold: '#D6B36A',
      goldHex: 0xD6B36A,
      
      top1: { border: 0xD6B36A, badge: 0xD6B36A },
      top2: { border: 0xBEC5D1, badge: 0xBEC5D1 },
      top3: { border: 0xB37A4C, badge: 0xB37A4C },
    };
    
    this.currentTab = 'rating';
    
    this.mockRating = [
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
    
    this.mockKills = [
      { id: 1, level: 40, name: "Ron The TNT", value: 842 },
      { id: 2, level: 40, name: "Mighty Ernest", value: 799 },
      { id: 3, level: 40, name: "The Chef", value: 760 },
      { id: 4, level: 39, name: "Ares The Tense", value: 702 },
      { id: 5, level: 38, name: "Wade The Cannon", value: 654 },
      { id: 6, level: 37, name: "Shawn The Smart", value: 612 },
    ];
    
    this.myData = { name: "Malyugin777", level: 20, value: 98, rank: 42 };
  }

  preload() {
    if (!this.textures.exists('icon_golden_cup')) {
      this.load.image('icon_golden_cup', 'assets/ui/golden_cup.png');
    }
    if (!this.textures.exists('icon_pvp')) {
      this.load.image('icon_pvp', 'assets/ui/pvp_1.png');
    }
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const C = this.CFG;
    
    const panelH = H - 100;
    const panelX = (W - C.panelW) / 2;
    const panelY = 50;
    this.panelBounds = { x: panelX, y: panelY, w: C.panelW, h: panelH };
    
    this.container = this.add.container(0, 0);
    
    // Dimmer
    this.dimmer = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.85);
    this.dimmer.setInteractive();
    this.dimmer.on('pointerdown', () => this.close());
    this.container.add(this.dimmer);
    
    // Panel
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(C.bgTop, C.bgTop, C.bgBottom, C.bgBottom, 1);
    panelBg.fillRoundedRect(panelX, panelY, C.panelW, panelH, 28);
    this.container.add(panelBg);
    
    this.createHeader();
    this.createTabs();
    this.createList();
    this.createFooter();
    
    this.input.keyboard.on('keydown-ESC', () => this.close());
    console.log('[LeaderboardScene] Created');
  }

  createHeader() {
    const C = this.CFG;
    const P = this.panelBounds;
    
    const title = this.add.text(P.x + C.panelPadding, P.y + 50, 'ЛИДЕРБОРД', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: C.gold,
    }).setOrigin(0, 0.5);
    title.setShadow(0, 4, '#000000', 8);
    this.container.add(title);
    
    const closeBtnX = P.x + P.w - 60;
    const closeBtnY = P.y + 50;
    
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0xffffff, 0.1);
    closeBg.fillCircle(closeBtnX, closeBtnY, 30);
    closeBg.lineStyle(2, 0xffffff, 0.15);
    closeBg.strokeCircle(closeBtnX, closeBtnY, 30);
    this.container.add(closeBg);
    
    const closeX = this.add.text(closeBtnX, closeBtnY, '×', {
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#0E141B',
    }).setOrigin(0.5);
    closeX.setInteractive({ useHandCursor: true });
    closeX.on('pointerdown', () => this.close());
    this.container.add(closeX);
    
    const line = this.add.graphics();
    line.lineStyle(2, 0xffffff, 0.1);
    line.lineBetween(P.x, P.y + C.headerH, P.x + P.w, P.y + C.headerH);
    this.container.add(line);
  }

  createTabs() {
    const C = this.CFG;
    const P = this.panelBounds;
    const tabY = P.y + C.headerH + 30;
    
    this.tabs = {};
    this.tabs.rating = this.createTab(P.x + C.panelPadding, tabY, 'Рейтинг', 'rating');
    this.tabs.kills = this.createTab(P.x + C.panelPadding + 220, tabY, 'Убийства', 'kills');
    this.updateTabs();
  }

  createTab(x, y, label, key) {
    const tabW = 200, tabH = 56;
    const container = this.add.container(x, y);
    
    const bg = this.add.graphics();
    container.add(bg);
    
    const iconKey = key === 'rating' ? 'icon_golden_cup' : 'icon_pvp';
    let icon;
    if (this.textures.exists(iconKey)) {
      icon = this.add.image(30, tabH/2, iconKey);
      icon.setDisplaySize(32, 32);
    } else {
      icon = this.add.text(30, tabH/2, key === 'rating' ? '🏆' : '☠️', { fontSize: '28px' }).setOrigin(0.5);
    }
    container.add(icon);
    
    const text = this.add.text(60, tabH/2, label, {
      fontFamily: 'Verdana',
      fontSize: '26px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    container.add(text);
    
    const hitbox = this.add.rectangle(tabW/2, tabH/2, tabW, tabH, 0xffffff, 0);
    hitbox.setInteractive({ useHandCursor: true });
    hitbox.on('pointerdown', () => this.switchTab(key));
    container.add(hitbox);
    
    this.container.add(container);
    return { container, bg, text, icon, w: tabW, h: tabH };
  }

  updateTabs() {
    Object.keys(this.tabs).forEach(key => {
      const tab = this.tabs[key];
      const isActive = this.currentTab === key;
      
      tab.bg.clear();
      if (isActive) {
        tab.bg.fillGradientStyle(0xD6B36A, 0xD6B36A, 0xB89149, 0xB89149, 1);
        tab.bg.fillRoundedRect(0, 0, tab.w, tab.h, 28);
        tab.bg.lineStyle(2, 0xE6CC8B, 1);
        tab.bg.strokeRoundedRect(0, 0, tab.w, tab.h, 28);
        tab.text.setColor('#0E141B');
        tab.text.setAlpha(1);
      } else {
        tab.bg.fillStyle(0xffffff, 0.06);
        tab.bg.fillRoundedRect(0, 0, tab.w, tab.h, 28);
        tab.bg.lineStyle(2, 0xffffff, 0.12);
        tab.bg.strokeRoundedRect(0, 0, tab.w, tab.h, 28);
        tab.text.setColor('#ffffff');
        tab.text.setAlpha(0.65);
      }
    });
  }

  switchTab(key) {
    if (this.currentTab === key) return;
    this.currentTab = key;
    this.updateTabs();
    this.refreshList();
  }

  createList() {
    const C = this.CFG;
    const P = this.panelBounds;
    
    const listY = P.y + C.headerH + C.tabH + 20;
    const listH = P.h - C.headerH - C.tabH - C.footerH - 40;
    
    this.listBounds = { x: P.x + 16, y: listY, w: P.w - 32, h: listH };
    
    // List container
    this.listContainer = this.add.container(0, 0);
    this.container.add(this.listContainer);
    
    // Mask (НЕ белая, просто геометрия)
    const maskGraphics = this.make.graphics();
    maskGraphics.fillStyle(0x000000);  // Цвет не важен для геометрической маски
    maskGraphics.fillRect(this.listBounds.x, this.listBounds.y, this.listBounds.w, this.listBounds.h);
    const mask = maskGraphics.createGeometryMask();
    this.listContainer.setMask(mask);
    
    this.refreshList();
    this.setupScroll();
  }

  refreshList() {
    this.listContainer.removeAll(true);
    
    const data = this.currentTab === 'rating' ? this.mockRating : this.mockKills;
    const C = this.CFG;
    const L = this.listBounds;
    const rowGap = 16;
    
    console.log(`[LEADERBOARD] Rendering ${data.length} rows, listY=${L.y}, listH=${L.h}`);
    
    data.forEach((row, i) => {
      const y = L.y + i * (C.rowH + rowGap) + C.rowH/2;
      this.createRow(L.x + L.w/2, y, row, i + 1);
    });
    
    const contentH = data.length * (C.rowH + rowGap);
    this.scrollMinY = Math.min(0, -(contentH - L.h));
    this.scrollMaxY = 0;
    this.listContainer.y = 0;
    
    console.log(`[LEADERBOARD] contentH=${contentH}, scrollMin=${this.scrollMinY}`);
  }

  createRow(x, y, data, rank) {
    const C = this.CFG;
    const L = this.listBounds;
    const isTop = rank <= 3;
    const rowW = L.w - 16;
    
    console.log(`[LEADERBOARD] Creating row #${rank} at x=${x}, y=${y}`);
    
    const container = this.add.container(x, y);
    
    const bg = this.add.graphics();
    if (isTop) {
      const cfg = rank === 1 ? C.top1 : rank === 2 ? C.top2 : C.top3;
      bg.fillStyle(cfg.border, 0.15);
      bg.fillRoundedRect(-rowW/2, -C.rowH/2, rowW, C.rowH, 16);
      bg.lineStyle(2, cfg.border, 0.55);
      bg.strokeRoundedRect(-rowW/2, -C.rowH/2, rowW, C.rowH, 16);
    } else {
      bg.fillStyle(0xffffff, 0.05);
      bg.fillRoundedRect(-rowW/2, -C.rowH/2, rowW, C.rowH, 16);
    }
    container.add(bg);
    
    // Rank badge
    const badgeX = -rowW/2 + 50;
    const badgeBg = this.add.graphics();
    if (isTop) {
      const cfg = rank === 1 ? C.top1 : rank === 2 ? C.top2 : C.top3;
      badgeBg.fillStyle(cfg.badge, 1);
    } else {
      badgeBg.fillStyle(0xffffff, 0.08);
    }
    badgeBg.fillCircle(badgeX, 0, 24);
    container.add(badgeBg);
    
    const rankText = this.add.text(badgeX, 0, rank, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: isTop ? '#0E141B' : 'rgba(255,255,255,0.55)',
    }).setOrigin(0.5);
    container.add(rankText);
    
    // Level badge
    const lvlX = badgeX + 70;
    const lvlBg = this.add.graphics();
    lvlBg.fillStyle(0xffffff, 0.1);
    lvlBg.fillCircle(lvlX, 0, 32);
    lvlBg.lineStyle(2, 0xffffff, 0.15);
    lvlBg.strokeCircle(lvlX, 0, 32);
    container.add(lvlBg);
    
    container.add(this.add.text(lvlX, -12, 'Lvl', { fontSize: '16px', color: 'rgba(255,255,255,0.55)' }).setOrigin(0.5));
    container.add(this.add.text(lvlX, 10, data.level, { fontSize: '24px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5));
    
    // Name
    container.add(this.add.text(lvlX + 60, 0, data.name, { fontSize: '26px', color: '#ffffff' }).setOrigin(0, 0.5));
    
    // Value + icon
    const valueX = rowW/2 - 40;
    const iconKey = this.currentTab === 'rating' ? 'icon_golden_cup' : 'icon_pvp';
    if (this.textures.exists(iconKey)) {
      const icon = this.add.image(valueX - 70, 0, iconKey);
      icon.setDisplaySize(28, 28).setAlpha(0.8);
      container.add(icon);
    }
    container.add(this.add.text(valueX, 0, data.value, {
      fontSize: '28px', fontStyle: 'bold', color: isTop ? '#ffffff' : 'rgba(255,255,255,0.8)'
    }).setOrigin(1, 0.5));
    
    this.listContainer.add(container);
  }

  setupScroll() {
    const L = this.listBounds;
    const scrollZone = this.add.zone(L.x + L.w/2, L.y + L.h/2, L.w, L.h);
    scrollZone.setInteractive();
    this.container.add(scrollZone);
    
    let isDragging = false, dragStartY = 0, containerStartY = 0;
    
    scrollZone.on('pointerdown', (p) => { isDragging = true; dragStartY = p.y; containerStartY = this.listContainer.y; });
    this.input.on('pointermove', (p) => {
      if (!isDragging) return;
      let newY = containerStartY + (p.y - dragStartY);
      this.listContainer.y = Phaser.Math.Clamp(newY, this.scrollMinY, this.scrollMaxY);
    });
    this.input.on('pointerup', () => isDragging = false);
    this.input.on('wheel', (p, go, dx, dy) => {
      let newY = this.listContainer.y - dy * 0.5;
      this.listContainer.y = Phaser.Math.Clamp(newY, this.scrollMinY, this.scrollMaxY);
    });
  }

  createFooter() {
    const C = this.CFG;
    const P = this.panelBounds;
    const me = this.myData;
    
    const footerY = P.y + P.h - C.footerH + 20;
    const footerW = P.w - C.panelPadding * 2;
    const footerH = 100;
    const footerX = P.x + C.panelPadding;
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1A2230, 1);
    bg.fillRoundedRect(footerX, footerY, footerW, footerH, 16);
    bg.lineStyle(4, C.goldHex, 1);
    bg.strokeRoundedRect(footerX, footerY, footerW, footerH, 16);
    this.container.add(bg);
    
    this.container.add(this.add.text(footerX + 30, footerY + footerH/2, `#${me.rank}`, {
      fontSize: '28px', fontStyle: 'bold', color: C.gold
    }).setOrigin(0, 0.5));
    
    const lvlX = footerX + 120;
    const lvlBg = this.add.graphics();
    lvlBg.fillStyle(0xffffff, 0.1);
    lvlBg.fillCircle(lvlX, footerY + footerH/2, 32);
    lvlBg.lineStyle(2, 0xffffff, 0.15);
    lvlBg.strokeCircle(lvlX, footerY + footerH/2, 32);
    this.container.add(lvlBg);
    
    this.container.add(this.add.text(lvlX, footerY + footerH/2 - 12, 'Lvl', { fontSize: '14px', color: 'rgba(255,255,255,0.55)' }).setOrigin(0.5));
    this.container.add(this.add.text(lvlX, footerY + footerH/2 + 10, me.level, { fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5));
    
    const nameX = lvlX + 50;
    this.container.add(this.add.text(nameX, footerY + footerH/2 - 10, me.name, { fontSize: '24px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0, 0.5));
    this.container.add(this.add.text(nameX, footerY + footerH/2 + 16, 'Это ты', { fontSize: '18px', color: 'rgba(255,255,255,0.4)' }).setOrigin(0, 0.5));
    
    const valueX = footerX + footerW - 30;
    const iconKey = this.currentTab === 'rating' ? 'icon_golden_cup' : 'icon_pvp';
    if (this.textures.exists(iconKey)) {
      const icon = this.add.image(valueX - 80, footerY + footerH/2, iconKey);
      icon.setDisplaySize(28, 28).setAlpha(0.8);
      this.container.add(icon);
    }
    this.container.add(this.add.text(valueX, footerY + footerH/2, me.value, { fontSize: '28px', fontStyle: 'bold', color: C.gold }).setOrigin(1, 0.5));
  }

  close() {
    this.scene.stop('LeaderboardScene');
    console.log('[LeaderboardScene] Closed');
  }
}

window.LeaderboardScene = LeaderboardScene;
console.log('[LeaderboardScene] v2 Module loaded');
