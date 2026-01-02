"use strict";

// ============================================================
//  PLAYER HEADER — Top UI (Avatar, EXP Ring, Resources)
//  Z-Index: Avatar (bottom) → EXP Ring (middle) → Panel (top)
// ============================================================

const PLAYER_HEADER_CONFIG = {
  // Container position (FIXED coordinates - moved to TOP)
  container: {
    x: 387,        // Fixed X position
    y: 100,        // Move to TOP (was 374)
    offsetX: 0,
    offsetY: 0
  },

  // Panel settings
  panel: {
    scale: 0.8,    // Scaled down to fit screen
    offsetX: 0,
    offsetY: 0
  },

  // Avatar settings (bottom layer) - relative to container
  avatar: {
    x: 8,          // From tune mode
    y: 229,        // From tune mode
    scale: 0.82
  },

  // EXP ring settings (middle layer) - SAME position as avatar (ring goes around it)
  expRing: {
    x: 8,          // SAME as avatar.x
    y: 229,        // SAME as avatar.y
    scale: 0.86
  },

  // Resource slots positions (4 slots: Energy, Stars, Gems, Adena)
  resources: [
    { x: -40, y: -5, icon: '⚡' },  // Slot 1: Energy (lightning)
    { x: 90, y: -5, icon: '⭐' },   // Slot 2: Stars
    { x: 220, y: -5, icon: '💎' },  // Slot 3: Gems (crystal)
    { x: 350, y: -5, icon: '🪙' }   // Slot 4: Adena (coin)
  ],

  // Level text position
  level: {
    x: -330,       // Near avatar
    y: 40,
    fontSize: 20
  },

  // Nickname text position
  nickname: {
    x: -200,       // Right of avatar
    y: 40,
    fontSize: 18
  },

  // Text style (improved readability with stroke and shadow)
  textStyle: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '18px',
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 4,  // Thick stroke for readability
    shadow: {
      offsetX: 2,
      offsetY: 2,
      color: '#000000',
      blur: 2,
      fill: true
    }
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
  const headerBg = scene.add.rectangle(0, 0, w + 100, 200, 0x1a1a2e, 0.95);
  headerContainer.add(headerBg);
  console.log('[PLAYER_HEADER] Dark background added at Y=0');

  // === LAYER 1: AVATAR (Bottom - drawn first) ===
  const avatar = scene.add.image(
    cfg.avatar.x,
    cfg.avatar.y,
    'ui_avatar_placeholder'
  );
  avatar.setScale(cfg.avatar.scale);
  headerContainer.add(avatar);
  console.log('[PLAYER_HEADER] Avatar created at', cfg.avatar.x, cfg.avatar.y, 'scale', cfg.avatar.scale);

  // === LAYER 2: EXP RING (Middle - drawn second) ===
  const expRing = scene.add.image(
    cfg.expRing.x,
    cfg.expRing.y,
    'ui_exp_ring_full'
  );
  expRing.setScale(1.5);           // BIGGER for visibility
  expRing.setTint(0xff0000);       // RED to see it easily
  expRing.setAlpha(1);

  // TEMPORARILY DISABLE MASK for debugging
  // const maskGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
  // const expMask = new Phaser.Display.Masks.GeometryMask(scene, maskGraphics);
  // expRing.setMask(expMask);

  headerContainer.add(expRing);
  console.log('[PLAYER_HEADER] Ring at SAME position as avatar:', cfg.expRing.x, cfg.expRing.y);
  console.log('[DEBUG] Ring texture:', expRing.texture.key);
  console.log('[DEBUG] Ring size:', expRing.width, 'x', expRing.height);
  console.log('[DEBUG] Ring visible:', expRing.visible);

  // DISABLED: Mask data (mask is disabled for debugging)
  // const maskData = {
  //   graphics: maskGraphics,
  //   centerX: containerX + cfg.expRing.x,
  //   centerY: containerY + cfg.expRing.y,
  //   radius: 50,
  //   currentPercent: 1.0
  // };

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

  // Level text
  const levelText = scene.add.text(
    cfg.level.x,
    cfg.level.y,
    'Lvl 1',
    {
      ...textStyle,
      fontSize: cfg.level.fontSize
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
      textStyle
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

  // Expose for tune mode
  window.playerHeaderAvatar = avatar;
  window.playerHeaderExpRing = expRing;
  window.playerHeaderPanel = panel;

  // === PUBLIC API ===
  return {
    container: headerContainer,
    avatar: avatar,
    expRing: expRing,
    panel: panel,

    /**
     * Set EXP percentage (0.0 to 1.0)
     * DISABLED: mask is disabled for debugging
     */
    setExp(percent) {
      // updateExpMask(percent);
      console.log('[PLAYER_HEADER] setExp called (mask disabled):', percent);
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
     * Set player level
     */
    setLevel(level) {
      levelText.setText(`Lvl ${level}`);
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
      maskData.graphics.destroy();
      headerContainer.destroy();
    }
  };
}

// Export for global access
window.createPlayerHeader = createPlayerHeader;

console.log("[PlayerHeader] Module loaded");
