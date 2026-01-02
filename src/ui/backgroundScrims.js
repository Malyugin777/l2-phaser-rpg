"use strict";

// ============================================================
//  BACKGROUND SCRIMS — Gradient overlays for UI readability
// ============================================================

/**
 * Creates dark gradient overlays using Phaser Graphics directly
 * @param {Phaser.Scene} scene - Current Phaser scene
 */
function createBackgroundScrims(scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const DEPTH_SCRIM = 150; // Above hero (100), below UI (200+)

  console.log('[SCRIMS] Creating GRADIENT scrims, screen:', width, 'x', height);

  // =================================================================
  // TOP GRADIENT (Under resources bar)
  // =================================================================
  const topGraph = scene.add.graphics();

  // fillGradientStyle(topLeftColor, topRightColor, bottomLeftColor, bottomRightColor,
  //                   alphaTL, alphaTR, alphaBL, alphaBR)
  // Top: Black with alpha 0.85 (almost opaque)
  // Bottom: Black with alpha 0 (fully transparent)
  topGraph.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.85, 0.85, 0, 0);

  // Draw from top-left corner (0,0)
  topGraph.fillRect(0, 0, width, 280);

  topGraph.setScrollFactor(0);
  topGraph.setDepth(DEPTH_SCRIM);

  console.log('[SCRIMS] Top gradient: 0-280px, alpha 0.85→0');


  // =================================================================
  // BOTTOM GRADIENT (Under buttons)
  // =================================================================
  const botGraph = scene.add.graphics();

  // Top: Transparent (alpha 0)
  // Bottom: Black (alpha 0.9)
  botGraph.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.9, 0.9);

  const botHeight = 350;
  botGraph.fillRect(0, height - botHeight, width, botHeight);

  botGraph.setScrollFactor(0);
  botGraph.setDepth(DEPTH_SCRIM);

  console.log('[SCRIMS] Bottom gradient:', (height - botHeight), '-', height, 'px, alpha 0→0.9');

  // DEBUG - red box to verify rendering
  const debug = scene.add.rectangle(width/2, 150, 200, 100, 0xff0000, 1);
  debug.setScrollFactor(0);
  debug.setDepth(1000);
  console.log('[SCRIMS] DEBUG RED BOX at depth 1000');

  return { topGraph, botGraph };
}

// Export for global access
window.createBackgroundScrims = createBackgroundScrims;

console.log("[BackgroundScrims] Module loaded");
