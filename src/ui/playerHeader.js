"use strict";

// ============================================================
//  PLAYER HEADER — Top UI (Avatar, EXP Ring, Resources)
//  Z-Index: Avatar (bottom) → EXP Ring (middle) → Panel (top)
// ============================================================

const PLAYER_HEADER_CONFIG = {
  // Container position (FIXED coordinates from tune mode)
  container: {
    x: 387,        // Fixed X position
    y: 374,        // Fixed Y position
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
    x: 0,          // Center of container (adjust from here)
    y: 20,         // Slightly below center
    scale: 1.0
  },

  // EXP ring settings (middle layer) - relative to container
  expRing: {
    x: 0,          // Same as avatar (centered on avatar)
    y: 20,         // Slightly below center
    scale: 2.0     // Bigger to be visible
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

  // Text style
  textStyle: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
    fontStyle: 'bold'
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

  // === CONTAINER === (using fixed absolute coordinates)
  const containerX = cfg.container.x + cfg.container.offsetX;
  const containerY = cfg.container.y + cfg.container.offsetY;

  const headerContainer = scene.add.container(containerX, containerY);
  headerContainer.setDepth(300);  // Above other UI
  headerContainer.setScrollFactor(0);

  // === LAYER 1: AVATAR (Bottom) ===
  const avatar = scene.add.image(
    cfg.avatar.x,
    cfg.avatar.y,
    'ui_avatar_placeholder'
  );
  avatar.setScale(cfg.avatar.scale);
  headerContainer.add(avatar);

  // === LAYER 2: EXP RING with MASK (Middle) ===
  const expRing = scene.add.image(
    cfg.expRing.x,
    cfg.expRing.y,
    'ui_exp_ring_full'
  );
  expRing.setScale(cfg.expRing.scale);

  // Create mask graphics for radial progress
  const maskGraphics = scene.make.graphics({ x: 0, y: 0 }, false);
  const expMask = new Phaser.Display.Masks.GeometryMask(scene, maskGraphics);
  expRing.setMask(expMask);

  headerContainer.add(expRing);

  // Store mask graphics for later updates
  const maskData = {
    graphics: maskGraphics,
    centerX: containerX + cfg.expRing.x,
    centerY: containerY + cfg.expRing.y,
    radius: 80,  // Adjust based on ring size (will tune manually)
    currentPercent: 1.0  // Start at 100%
  };

  // === LAYER 3: PANEL (Top) ===
  const panel = scene.add.image(
    cfg.panel.offsetX,
    cfg.panel.offsetY,
    'ui_top_panel'
  );
  panel.setScale(cfg.panel.scale);
  panel.setOrigin(0.5, 0);  // Top-center origin
  headerContainer.add(panel);

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

  // === HELPER: Update EXP Ring Mask ===
  function updateExpMask(percent) {
    percent = Phaser.Math.Clamp(percent, 0, 1);
    maskData.currentPercent = percent;

    const graphics = maskData.graphics;
    graphics.clear();

    if (percent > 0) {
      graphics.fillStyle(0xffffff);

      // Draw arc from -90° (top) clockwise
      const startAngle = Phaser.Math.DegToRad(-90);
      const endAngle = startAngle + Phaser.Math.DegToRad(360 * percent);

      graphics.beginPath();
      graphics.arc(
        maskData.centerX,
        maskData.centerY,
        maskData.radius,
        startAngle,
        endAngle,
        false  // Clockwise
      );
      graphics.lineTo(maskData.centerX, maskData.centerY);
      graphics.closePath();
      graphics.fillPath();
    }
  }

  // Initialize mask at 100%
  updateExpMask(1.0);

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
     */
    setExp(percent) {
      updateExpMask(percent);
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
