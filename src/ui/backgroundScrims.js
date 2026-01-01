"use strict";

// ============================================================
//  BACKGROUND SCRIMS — Gradient overlays for UI readability
// ============================================================

/**
 * Creates dark gradient overlays (top and bottom) to improve UI text readability
 * @param {Phaser.Scene} scene - Current Phaser scene
 */
function createBackgroundScrims(scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;

  console.log('[SCRIMS] Creating background gradients for UI readability');

  // --- TOP GRADIENT (Under top UI bar) ---
  // Creates a gradient texture in memory (1px width, 200px height)
  const topGradientTexture = scene.make.graphics({ x: 0, y: 0, add: false })
    .fillGradientStyle(
      0x000000, 0x000000, 0x000000, 0x000000,  // All black
      0.8, 0.8, 0, 0  // Top opaque (80%), bottom transparent (0%)
    )
    .fillRect(0, 0, 1, 200)  // Draw 1x200 strip
    .generateTexture('top_scrim_gradient', 1, 200);  // Save as texture

  // Create image from texture and stretch across full width
  const topScrim = scene.add.image(0, 0, 'top_scrim_gradient')
    .setOrigin(0, 0)
    .setDisplaySize(width, 200)  // Stretch to full width, 200px height
    .setScrollFactor(0)
    .setDepth(150);  // Above game (100), BELOW UI panels (200)

  console.log('[SCRIMS] Top gradient created: depth 150, height 200px');

  // --- BOTTOM GRADIENT (Under bottom UI buttons) ---
  // Same but reversed opacity (top 0, bottom 0.8)
  const botGradientTexture = scene.make.graphics({ x: 0, y: 0, add: false })
    .fillGradientStyle(
      0x000000, 0x000000, 0x000000, 0x000000,  // All black
      0, 0, 0.8, 0.8  // Top transparent (0%), bottom opaque (80%)
    )
    .fillRect(0, 0, 1, 250)  // Height 250px for bottom panel
    .generateTexture('bot_scrim_gradient', 1, 250);

  const botScrim = scene.add.image(0, height, 'bot_scrim_gradient')
    .setOrigin(0, 1)  // Anchor bottom-left
    .setDisplaySize(width, 250)
    .setScrollFactor(0)
    .setDepth(150);  // Same depth as top - between game and UI

  console.log('[SCRIMS] Bottom gradient created: depth 150, height 250px');

  return {
    topScrim,
    botScrim
  };
}

// Export for global access
window.createBackgroundScrims = createBackgroundScrims;

console.log("[BackgroundScrims] Module loaded");
