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
  // Use Graphics directly instead of texture
  const topScrim = scene.add.graphics();
  topScrim.fillGradientStyle(
    0x000000, 0x000000, 0x000000, 0x000000,  // All black corners
    1, 1, 0, 0  // Top fully opaque (100%), bottom transparent (0%)
  );
  topScrim.fillRect(0, 0, width, 300);  // Full width, 300px height
  topScrim.setDepth(150);  // Above game (100), BELOW UI panels (200)
  topScrim.setScrollFactor(0);

  console.log('[SCRIMS] Top gradient created: depth 150, height 300px, alpha 100%→0%');

  // --- BOTTOM GRADIENT (Under bottom UI buttons) ---
  const botScrim = scene.add.graphics();
  botScrim.fillGradientStyle(
    0x000000, 0x000000, 0x000000, 0x000000,  // All black corners
    0, 0, 1, 1  // Top transparent (0%), bottom fully opaque (100%)
  );
  botScrim.fillRect(0, height - 350, width, 350);  // Full width, 350px height from bottom
  botScrim.setDepth(150);
  botScrim.setScrollFactor(0);

  console.log('[SCRIMS] Bottom gradient created: depth 150, height 350px, alpha 0%→100%');

  return {
    topScrim,
    botScrim
  };
}

// Export for global access
window.createBackgroundScrims = createBackgroundScrims;

console.log("[BackgroundScrims] Module loaded");
