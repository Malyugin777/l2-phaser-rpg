"use strict";

// ============================================================
//  PLAYER HEADER — Top UI (Avatar, EXP Ring, Resources)
//  Z-Index: Avatar (bottom) → EXP Ring (middle) → Panel (top)
// ============================================================

const PLAYER_HEADER_CONFIG = {
  // Panel settings (from TuneMode iPhone)
  panel: {
    scale: 0.8,
    y: -160
  },

  // Avatar settings - tuned position
  avatar: {
    x: 7,            // Near center (tuned from iPhone)
    y: 67,           // From top of visible area
    scale: 0.82
  },

  // EXP ring settings - left side
  expRing: {
    x: -321,         // Left side (tuned from iPhone)
    y: 68,           // From top of visible area
    radius: 52,
    thickness: 8,
    color: 0xFFD700,
    bgColor: 0x333333,
    bgAlpha: 0.3
  },

  // Dark background behind header
  darkBg: {
    width: 900,
    height: 130,
    alpha: 0.92
  },

  // Resource texts - tuned from iPhone
  resources: {
    energy: { x: -18, y: 65, fontSize: 18 },
    stars:  { x: 95,  y: 65, fontSize: 18 },
    gems:   { x: 200, y: 65, fontSize: 18 },
    adena:  { x: 312, y: 65, fontSize: 18 }
  },

  // Level text - tuned from iPhone
  level: {
    x: -272,
    y: 109,
    fontSize: 12
  },

  // Nickname text - tuned from iPhone
  nickname: {
    x: -244,
    y: 70,
    fontSize: 24
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

  // === ADAPTIVE POSITIONING based on cropTop ===
  const cropTop = window.ENVELOP_CROP_TOP || 0;

  console.log('[PLAYER_HEADER] cropTop=' + cropTop + ' (adaptive positioning)');

  // Dark background - starts at cropTop (top of visible area)
  const headerBg = scene.add.rectangle(w/2, cropTop, cfg.darkBg.width, cfg.darkBg.height, 0x3a3a4a, cfg.darkBg.alpha);
  headerBg.setOrigin(0.5, 0);
  headerBg.setScrollFactor(0);
  headerBg.setDepth(299);
  window.playerHeaderDarkBg = headerBg;

  // Container at cropTop - all elements relative to visible top
  const headerContainer = scene.add.container(w/2, cropTop);
  headerContainer.setDepth(300);
  headerContainer.setScrollFactor(0);

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
  const panel = scene.add.image(0, cfg.panel.y, 'ui_top_panel');
  panel.setScale(cfg.panel.scale);
  panel.setOrigin(0.5, 0);  // Top-center origin
  headerContainer.add(panel);

  // Get panel height for positioning content
  const panelHeight = panel.displayHeight;
  console.log('[PLAYER_HEADER] Panel at Y=0, displayHeight=' + panelHeight);

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

  // Resource texts (4 slots: Energy, Stars, Gems, Adena)
  const energyText = scene.add.text(
    cfg.resources.energy.x,
    cfg.resources.energy.y,
    '30',
    {
      ...textStyle,
      fontSize: cfg.resources.energy.fontSize + 'px'
    }
  );
  energyText.setOrigin(0.5);
  headerContainer.add(energyText);

  const starsText = scene.add.text(
    cfg.resources.stars.x,
    cfg.resources.stars.y,
    '150',
    {
      ...textStyle,
      fontSize: cfg.resources.stars.fontSize + 'px'
    }
  );
  starsText.setOrigin(0.5);
  headerContainer.add(starsText);

  const gemsText = scene.add.text(
    cfg.resources.gems.x,
    cfg.resources.gems.y,
    '5000',
    {
      ...textStyle,
      fontSize: cfg.resources.gems.fontSize + 'px'
    }
  );
  gemsText.setOrigin(0.5);
  headerContainer.add(gemsText);

  const adenaText = scene.add.text(
    cfg.resources.adena.x,
    cfg.resources.adena.y,
    '125K',
    {
      ...textStyle,
      fontSize: cfg.resources.adena.fontSize + 'px'
    }
  );
  adenaText.setOrigin(0.5);
  headerContainer.add(adenaText);

  // Array for setResources() API
  const resourceTexts = [energyText, starsText, gemsText, adenaText];

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
     * Set player nickname (auto font size based on length)
     */
    setNickname(name) {
      // Auto-size font based on name length
      let fontSize = cfg.nickname.fontSize;  // default 24
      if (name.length > 10) fontSize = 20;
      if (name.length > 14) fontSize = 16;
      if (name.length > 18) fontSize = 14;

      nicknameText.setFontSize(fontSize);
      nicknameText.setText(name);
    },

    /**
     * Set avatar image (load external URL or use texture key)
     * @param {string} urlOrKey - Image URL or texture key
     */
    setAvatar(urlOrKey) {
      // Check if it's a URL (starts with http)
      if (urlOrKey.startsWith('http')) {
        // Load via Image API to bypass CORS (t.me URLs)
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
          // Create canvas texture
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Add to Phaser textures
          if (scene.textures.exists('player_avatar_custom')) {
            scene.textures.remove('player_avatar_custom');
          }
          scene.textures.addCanvas('player_avatar_custom', canvas);
          avatar.setTexture('player_avatar_custom');
          console.log('[PlayerHeader] Avatar loaded via canvas');
        };
        img.onerror = function() {
          console.warn('[PlayerHeader] Avatar CORS blocked, keeping placeholder');
        };
        img.src = urlOrKey;
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

/**
 * Update player header with API data
 * @param {string} name - Player name from API
 * @param {string} avatarUrl - Avatar URL from Telegram
 */
function updatePlayerHeader(name, avatarUrl) {
  if (!window.playerHeader) {
    console.warn('[PlayerHeader] Header not created yet, saving for later');
    window._pendingPlayerName = name;
    window._pendingPlayerAvatar = avatarUrl;
    return;
  }

  if (name) {
    window.playerHeader.setNickname(name);
    console.log('[PlayerHeader] Name updated:', name);
  }

  if (avatarUrl) {
    window.playerHeader.setAvatar(avatarUrl);
    console.log('[PlayerHeader] Avatar loading:', avatarUrl);
  }
}

window.updatePlayerHeader = updatePlayerHeader;

/**
 * Update header stats from heroState
 * Call after loading progress or after changes
 */
function updateHeaderStats() {
  if (!window.playerHeader) {
    console.warn('[PlayerHeader] Header not created yet');
    return;
  }

  const h = window.heroState || {};

  // Update level
  window.playerHeader.setLevel(h.level || 1);

  // Update resources: Energy, Stars (Telegram), Gems, Gold (adena)
  const energy = h.energy || 100;
  const stars = h.stars || 0;  // Telegram Stars - NOT rating!
  const gems = h.gems || 0;
  const gold = h.gold || 0;

  // Format large numbers
  const formatNum = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
  };

  window.playerHeader.setResources(energy, stars, gems, formatNum(gold));

  // Update EXP ring (calculate percent to next level)
  const expForLevel = (h.level || 1) * 100; // Simple formula
  const expPercent = (h.exp || 0) / expForLevel;
  window.playerHeader.setExp(Math.min(expPercent, 1));

  console.log('[PlayerHeader] Stats updated:', { level: h.level, energy, stars, gems, gold });
}

window.updateHeaderStats = updateHeaderStats;

console.log("[PlayerHeader] Module loaded");
