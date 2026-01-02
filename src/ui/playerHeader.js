"use strict";

// ============================================================
//  PLAYER HEADER — Top UI (Avatar, EXP Ring, Resources)
//  Z-Index: Avatar (bottom) → EXP Ring (middle) → Panel (top)
// ============================================================

const PLAYER_HEADER_CONFIG = {
  // Container position - FROM SAVED TUNE
  container: {
    x: 387,        // FROM SAVED TUNE
    y: 374,        // FROM SAVED TUNE
    offsetX: 0,
    offsetY: 0
  },

  // Panel settings
  panel: {
    scale: 0.8,
    offsetX: 0,
    offsetY: 0
  },

  // Avatar settings (bottom layer) - FROM SAVED TUNE
  avatar: {
    x: 8,          // FROM SAVED TUNE
    y: 229,        // FROM SAVED TUNE
    scale: 0.82    // FROM SAVED TUNE
  },

  // EXP ring settings (middle layer) - FIXED FROM TUNEMODE
  expRing: {
    x: -319,         // Center X - FIXED FROM TUNEMODE
    y: 230,          // Center Y - FIXED FROM TUNEMODE
    radius: 52,      // Ring radius - FIXED FROM TUNEMODE (r:52)
    thickness: 8,    // Line thickness - FIXED
    color: 0xFFD700, // Gold color - FIXED
    bgColor: 0x333333,     // Background ring dark gray - FIXED
    bgAlpha: 0.3           // Background transparency - FIXED
  },

  // Dark background behind header - FIXED FROM TUNEMODE
  darkBg: {
    x: -10,          // FROM TUNEMODE
    y: 149,          // FROM TUNEMODE
    width: 900,
    height: 250,
    alpha: 0.92
  },

  // Resource slots positions (4 slots: Energy, Stars, Gems, Adena)
  resources: [
    { x: -40, y: -5, icon: '⚡', fontSize: 18 },  // Slot 1: Energy (lightning)
    { x: 90, y: -5, icon: '⭐', fontSize: 18 },   // Slot 2: Stars
    { x: 220, y: -5, icon: '💎', fontSize: 18 },  // Slot 3: Gems (crystal)
    { x: 350, y: -5, icon: '🪙', fontSize: 18 }   // Slot 4: Adena (coin)
  ],

  // Level text position - FIXED FROM TUNEMODE
  level: {
    x: -274,         // FROM TUNEMODE
    y: 269,          // FROM TUNEMODE
    fontSize: 12     // FROM TUNEMODE (sz:12)
  },

  // Nickname text position - FIXED FROM TUNEMODE
  nickname: {
    x: -249,         // FROM TUNEMODE
    y: 226,          // FROM TUNEMODE
    fontSize: 15     // FROM TUNEMODE (sz:15)
  },

  // Text style (Gemini recommended)
  textStyle: {
    fontFamily: 'Verdana, Arial, sans-serif',
    fontSize: '18px',
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3
  }
};

/**
 * Create Player Header UI
 * @param {Phaser.Scene} scene - Current Phaser scene
 * @returns {Object} - Player header control object
 */
function createPlayerHeader(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const cfg = PLAYER_HEADER_CONFIG;

  console.log("[PLAYER_HEADER] Creating UI, screen:", w, "x", h);

  // === DEBUG: Check textures ===
  console.log('[DEBUG] Textures available:');
  console.log('  ui_exp_ring_full:', scene.textures.exists('ui_exp_ring_full'));
  console.log('  ui_avatar_placeholder:', scene.textures.exists('ui_avatar_placeholder'));
  console.log('  ui_top_panel:', scene.textures.exists('ui_top_panel'));

  // === CONTAINER === (using fixed absolute coordinates)
  const containerX = cfg.container.x + cfg.container.offsetX;
  const containerY = cfg.container.y + cfg.container.offsetY;

  const headerContainer = scene.add.container(containerX, containerY);
  headerContainer.setDepth(300);  // Above other UI
  headerContainer.setScrollFactor(0);

  // === LAYER 0: DARK BACKGROUND (Behind all elements) ===
  // Stone-gray color instead of black
  const headerBg = scene.add.rectangle(
    cfg.darkBg.x,
    cfg.darkBg.y,
    cfg.darkBg.width,
    cfg.darkBg.height,
    0x3a3a4a,      // GRAY (was 0x000000 black)
    0.92           // Slightly more opaque
  );
  headerContainer.add(headerBg);

  // Expose for TuneMode
  window.playerHeaderDarkBg = headerBg;
  console.log('[PLAYER_HEADER] DarkBg exposed for TuneMode');

  // === LAYER 1: AVATAR (Bottom - drawn first) ===
  const avatar = scene.add.image(
    cfg.avatar.x,
    cfg.avatar.y,
    'ui_avatar_placeholder'
  );
  avatar.setScale(cfg.avatar.scale);
  headerContainer.add(avatar);
  console.log('[PLAYER_HEADER] Avatar created at', cfg.avatar.x, cfg.avatar.y, 'scale', cfg.avatar.scale);

  // === LAYER 2: EXP RING drawn with Graphics ===
  const expRingGraphics = scene.add.graphics();

  // Ring parameters - ALL VALUES FROM CONFIG (FIXED)
  const ringConfig = {
    x: cfg.expRing.x,           // Center X (from config)
    y: cfg.expRing.y,           // Center Y (from config)
    radius: cfg.expRing.radius,       // Radius (from config)
    thickness: cfg.expRing.thickness, // Line thickness (from config)
    color: cfg.expRing.color,         // Gold color (from config)
    bgColor: cfg.expRing.bgColor,     // Background ring (from config)
    bgAlpha: cfg.expRing.bgAlpha      // Background transparency (from config)
  };

  // Draw background ring (full circle, semi-transparent)
  expRingGraphics.lineStyle(ringConfig.thickness, ringConfig.bgColor, ringConfig.bgAlpha);
  expRingGraphics.strokeCircle(ringConfig.x, ringConfig.y, ringConfig.radius);

  // Draw foreground ring (XP progress - full for now)
  expRingGraphics.lineStyle(ringConfig.thickness, ringConfig.color, 1);
  expRingGraphics.strokeCircle(ringConfig.x, ringConfig.y, ringConfig.radius);

  headerContainer.add(expRingGraphics);

  // Store for updates and TuneMode
  const expRing = expRingGraphics;
  expRing.ringConfig = ringConfig;

  // Store original position for TuneMode
  expRing.ringX = ringConfig.x;
  expRing.ringY = ringConfig.y;

  console.log('[PLAYER_HEADER] Ring drawn with Graphics at', ringConfig.x, ringConfig.y);

  // === LAYER 3: PANEL (Top - drawn last, covers edges) ===
  const panel = scene.add.image(
    cfg.panel.offsetX,
    cfg.panel.offsetY,
    'ui_top_panel'
  );
  panel.setScale(cfg.panel.scale);
  panel.setOrigin(0.5, 0);  // Top-center origin
  headerContainer.add(panel);
  console.log('[PLAYER_HEADER] Panel created at', cfg.panel.offsetX, cfg.panel.offsetY, 'scale', cfg.panel.scale);

  // === TEXTS ===
  const textStyle = cfg.textStyle;

  // Level text (two lines: "Lvl" on first line, number on second)
  const levelText = scene.add.text(
    cfg.level.x,
    cfg.level.y,
    'Lvl\n1',
    {
      ...textStyle,
      fontSize: cfg.level.fontSize,
      align: 'center'
    }
  );
  levelText.setOrigin(0.5);
  headerContainer.add(levelText);

  // Nickname text
  const nicknameText = scene.add.text(
    cfg.nickname.x,
    cfg.nickname.y,
    'Warrior',
    {
      ...textStyle,
      fontSize: cfg.nickname.fontSize
    }
  );
  nicknameText.setOrigin(0, 0.5);
  headerContainer.add(nicknameText);

  // Resource texts (4 slots)
  const resourceTexts = cfg.resources.map((slot, index) => {
    const text = scene.add.text(
      slot.x,
      slot.y,
      '0',
      {
        ...textStyle,
        fontSize: slot.fontSize
      }
    );
    text.setOrigin(0.5);
    headerContainer.add(text);
    return text;
  });

  // DISABLED: Update EXP Ring Mask (mask disabled for debugging)
  // function updateExpMask(percent) {
  //   percent = Phaser.Math.Clamp(percent, 0, 1);
  //   maskData.currentPercent = percent;
  //
  //   const graphics = maskData.graphics;
  //   graphics.clear();
  //
  //   if (percent > 0) {
  //     graphics.fillStyle(0xffffff);
  //
  //     const startAngle = Phaser.Math.DegToRad(-90);
  //     const endAngle = startAngle + Phaser.Math.DegToRad(360 * percent);
  //
  //     graphics.beginPath();
  //     graphics.arc(
  //       maskData.centerX,
  //       maskData.centerY,
  //       maskData.radius,
  //       startAngle,
  //       endAngle,
  //       false
  //     );
  //     graphics.lineTo(maskData.centerX, maskData.centerY);
  //     graphics.closePath();
  //     graphics.fillPath();
  //   }
  // }

  // DISABLED: Initialize mask
  // updateExpMask(1.0);

  console.log("[PLAYER_HEADER] Created successfully");

  // === PUBLIC API ===
  const api = {
    container: headerContainer,
    avatar: avatar,
    ring: expRing,
    expRing: expRing,
    panel: panel,

    /**
     * Set EXP percentage (0.0 to 1.0)
     */
    setExp(percent) {
      percent = Phaser.Math.Clamp(percent, 0, 1);

      const ring = expRingGraphics;
      const cfg = ring.ringConfig;

      ring.clear();

      // Background ring (full, dark)
      ring.lineStyle(cfg.thickness, cfg.bgColor, cfg.bgAlpha);
      ring.strokeCircle(cfg.x, cfg.y, cfg.radius);

      // Foreground ring (partial, gold)
      if (percent > 0) {
        ring.lineStyle(cfg.thickness, cfg.color, 1);

        // Arc from -90° (top) clockwise
        const startAngle = Phaser.Math.DegToRad(-90);
        const endAngle = startAngle + Phaser.Math.DegToRad(360 * percent);

        ring.beginPath();
        ring.arc(cfg.x, cfg.y, cfg.radius, startAngle, endAngle, false);
        ring.strokePath();
      }
    },

    /**
     * Set resource values
     * @param {number} energy - Energy value
     * @param {number} stars - Telegram Stars value
     * @param {number} gems - Gems value
     * @param {number} adena - Adena value
     */
    setResources(energy, stars, gems, adena) {
      const values = [energy, stars, gems, adena];
      resourceTexts.forEach((text, i) => {
        if (i < values.length) {
          text.setText(values[i].toString());
        }
      });
    },

    /**
     * Set player level (two-line format: "Lvl" + level number)
     */
    setLevel(level) {
      levelText.setText(`Lvl\n${level}`);
    },

    /**
     * Set player nickname
     */
    setNickname(name) {
      nicknameText.setText(name);
    },

    /**
     * Set avatar image (load external URL or use texture key)
     * @param {string} urlOrKey - Image URL or texture key
     */
    setAvatar(urlOrKey) {
      // Check if it's a URL (starts with http)
      if (urlOrKey.startsWith('http')) {
        // Load external image
        scene.load.image('player_avatar_custom', urlOrKey);
        scene.load.once('complete', () => {
          avatar.setTexture('player_avatar_custom');
        });
        scene.load.start();
      } else {
        // Use existing texture
        avatar.setTexture(urlOrKey);
      }
    },

    /**
     * Show/hide header
     */
    setVisible(visible) {
      headerContainer.setVisible(visible);
    },

    /**
     * Destroy header
     */
    destroy() {
      // maskData.graphics.destroy();  // Disabled with mask
      headerContainer.destroy();
    }
  };

  // Expose ALL elements for TuneMode
  window.playerHeader = api;
  window.playerHeaderContainer = headerContainer;
  window.playerHeaderAvatar = avatar;
  window.playerHeaderExpRing = expRingGraphics;  // tuneMode uses this name
  window.playerHeaderRing = expRingGraphics;     // alternative name
  window.playerHeaderPanel = panel;
  window.playerHeaderDarkBg = headerBg;

  // Expose text elements for TuneMode
  window.headerTextLevel = levelText;
  window.headerTextNickname = nicknameText;
  window.headerTextEnergy = resourceTexts[0];    // Energy ⚡
  window.headerTextStars = resourceTexts[1];     // Stars ⭐
  window.headerTextGems = resourceTexts[2];      // Gems 💎
  window.headerTextAdena = resourceTexts[3];     // Adena 🪙

  return api;
}

// Export for global access
window.createPlayerHeader = createPlayerHeader;

console.log("[PlayerHeader] Module loaded");
