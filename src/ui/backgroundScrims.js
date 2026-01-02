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

  console.log('[SCRIMS] Creating gradients, screen:', width, 'x', height);

  // TOP GRADIENT
  const topGraph = scene.add.graphics();
  topGraph.setScrollFactor(0);  // IMMEDIATELY after creation!
  topGraph.setDepth(150);

  topGraph.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.85, 0.85, 0, 0);
  topGraph.fillRect(0, 0, width, 280);

  console.log('[SCRIMS] Top gradient created');

  // BOTTOM GRADIENT
  const botGraph = scene.add.graphics();
  botGraph.setScrollFactor(0);  // IMMEDIATELY after creation!
  botGraph.setDepth(150);

  botGraph.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.9, 0.9);
  botGraph.fillRect(0, height - 350, width, 350);

  console.log('[SCRIMS] Bottom gradient created');

  // DEBUG TEST - with scrollFactor!
  const debug = scene.add.rectangle(width/2, 200, 200, 100, 0xff0000, 1);
  debug.setScrollFactor(0);  // THIS IS KEY!
  debug.setDepth(9999);
  console.log('[SCRIMS] Debug red box WITH scrollFactor(0)');

  return { topGraph, botGraph };
}

window.createBackgroundScrims = createBackgroundScrims;
console.log("[BackgroundScrims] Module loaded");
