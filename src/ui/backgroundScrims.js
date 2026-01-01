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

  // --- TOP SCRIM (Simple black rectangle) ---
  // Single semi-transparent black rectangle at top
  const topScrim = scene.add.rectangle(width / 2, 100, width, 200, 0x000000, 0.7);
  topScrim.setScrollFactor(0);
  topScrim.setDepth(150);  // Above hero (100), below UI (200)

  console.log('[SCRIMS] Top scrim created: depth 150, height 200px, alpha 70%');

  // --- BOTTOM SCRIM (Simple black rectangle) ---
  // Single semi-transparent black rectangle at bottom
  const botScrim = scene.add.rectangle(width / 2, height - 150, width, 300, 0x000000, 0.8);
  botScrim.setScrollFactor(0);
  botScrim.setDepth(150);  // Above hero (100), below UI (200)

  console.log('[SCRIMS] Bottom scrim created: depth 150, height 300px, alpha 80%');

  return {
    topScrim,
    botScrim
  };
}

// Export for global access
window.createBackgroundScrims = createBackgroundScrims;

console.log("[BackgroundScrims] Module loaded");
