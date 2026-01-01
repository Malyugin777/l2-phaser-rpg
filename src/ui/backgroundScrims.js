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

  // --- TOP GRADIENT (Under resources) ---
  // Black on top, transparent on bottom. Height 150px.
  const topGradient = scene.make.graphics()
    .fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.8, 0.8, 0, 0)
    .fillRect(0, 0, width, 150);

  // Convert to texture to fix on screen
  topGradient.generateTexture('top_scrim', width, 150);
  const topScrim = scene.add.image(0, 0, 'top_scrim')
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(90);  // Between game and UI

  console.log('[SCRIMS] Top gradient created: depth 90, height 150px');

  // --- BOTTOM GRADIENT (Under buttons) ---
  // Transparent on top, black on bottom. Height 200px.
  // This removes "homeless" look from bottom, buttons will sit on "foundation".
  const botGradient = scene.make.graphics()
    .fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.9, 0.9)
    .fillRect(0, 0, width, 200);

  botGradient.generateTexture('bot_scrim', width, 200);
  const botScrim = scene.add.image(0, height, 'bot_scrim')
    .setOrigin(0, 1)
    .setScrollFactor(0)
    .setDepth(90);

  console.log('[SCRIMS] Bottom gradient created: depth 90, height 200px');

  return {
    topScrim,
    botScrim
  };
}

// Export for global access
window.createBackgroundScrims = createBackgroundScrims;

console.log("[BackgroundScrims] Module loaded");
