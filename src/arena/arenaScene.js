"use strict";

// ============================================================
//  ARENA SCENE — 2-Screen Wide World (IIFE to avoid conflicts)
//  Studio Quality: Cinematic camera, proper ground positioning
// ============================================================

(function() {

let arenaActive = false;
let arenaState = "NONE"; // NONE, INTRO, RUN_IN, ENGAGE, FIGHT

let arenaBgSprite = null;
let arenaPlayerSprite = null;
let arenaEnemySprite = null;
let arenaExitBtnSprite = null;

const ARENA_CONFIG = {
  worldMultiplier: 2,      // World = 2x screen width
  fightOffset: 150,        // Distance from center for each fighter
  engageDistance: 300,     // Stop when this close
  spawnMargin: 0.30,       // Spawn at 30% from edge
  groundY: 0.38,           // Ground at 38% from top (fence line)
  runSpeed: 2500,          // Slower for drama
  vsScreenDuration: 1500,
  fadeTime: 300,
  engagePause: 300,
  fighterScale: 0.8        // Slightly smaller
};

let BASE_W, BASE_H, WORLD_W, WORLD_H, GROUND_Y;

// ============================================================
//  START ARENA
// ============================================================

function startArena(scene, enemyData) {
  if (arenaActive) return;
  arenaActive = true;
  arenaState = "INTRO";

  BASE_W = scene.scale.width;
  BASE_H = scene.scale.height;
  WORLD_W = BASE_W * ARENA_CONFIG.worldMultiplier;
  WORLD_H = BASE_H;

  console.log("[ARENA] WORLD_W:", WORLD_W, "BASE_W:", BASE_W);

  hideCity();

  showVSScreen(scene, enemyData, () => {
    setupArenaWorld(scene);
    spawnFighters(scene, enemyData);
    startRunIn(scene);
  });
}

function hideCity() {
  if (window.cityBg) window.cityBg.setVisible(false);
  if (window.spineHero) window.spineHero.setVisible(false);
  if (window.panelContainer) window.panelContainer.setVisible(false);
  if (window.locationBg) window.locationBg.setVisible(false);
}

function showCity() {
  if (window.cityBg) window.cityBg.setVisible(true);
  if (window.spineHero) window.spineHero.setVisible(true);
  if (window.panelContainer) window.panelContainer.setVisible(true);
}

// ============================================================
//  VS SCREEN
// ============================================================

function showVSScreen(scene, enemyData, onComplete) {
  const w = BASE_W, h = BASE_H;

  const vsOverlay = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9);
  vsOverlay.setDepth(500).setScrollFactor(0).setAlpha(0);

  const playerName = window.profile?.name || "Игрок";
  const playerLevel = window.stats?.level || 1;
  const enemyName = enemyData?.name || "Противник";
  const enemyLevel = enemyData?.level || 1;

  const vsText = scene.add.text(w/2, h/2,
    `${playerName}  Lv.${playerLevel}\n\n⚔️ VS ⚔️\n\n${enemyName}  Lv.${enemyLevel}`, {
    fontFamily: 'Arial', fontSize: '32px', color: '#ffffff',
    align: 'center', stroke: '#000000', strokeThickness: 4
  });
  vsText.setOrigin(0.5).setDepth(501).setScrollFactor(0).setAlpha(0);

  scene.tweens.add({
    targets: [vsOverlay, vsText],
    alpha: 1,
    duration: ARENA_CONFIG.fadeTime,
    onComplete: () => {
      scene.time.delayedCall(ARENA_CONFIG.vsScreenDuration, () => {
        scene.tweens.add({
          targets: [vsOverlay, vsText],
          alpha: 0,
          duration: ARENA_CONFIG.fadeTime,
          onComplete: () => {
            vsOverlay.destroy();
            vsText.destroy();
            if (onComplete) onComplete();
          }
        });
      });
    }
  });
}

// ============================================================
//  SETUP ARENA WORLD
// ============================================================

function setupArenaWorld(scene) {
  console.log("[ARENA] Setup world");

  // Camera bounds = world size
  scene.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  // IMPORTANT: Reset camera zoom to 1
  scene.cameras.main.setZoom(1);

  // Background centered in world, scaled to fit WIDTH
  arenaBgSprite = scene.add.image(WORLD_W / 2, BASE_H / 2, 'arena_village');

  // Scale: fit WIDTH of world (not zoom to fill)
  const bgScale = WORLD_W / arenaBgSprite.width;
  arenaBgSprite.setScale(bgScale);
  arenaBgSprite.setOrigin(0.5, 0.5);
  arenaBgSprite.setDepth(10);
  arenaBgSprite.setScrollFactor(1);

  console.log("[ARENA] BG scale:", bgScale.toFixed(3),
    "size:", arenaBgSprite.displayWidth.toFixed(0), "x", arenaBgSprite.displayHeight.toFixed(0));

  // Exit button (fixed to screen)
  arenaExitBtnSprite = scene.add.text(BASE_W / 2, BASE_H - 100, '[ Выход ]', {
    fontSize: '28px', color: '#ffffff', backgroundColor: '#222222',
    padding: { x: 24, y: 12 }
  });
  arenaExitBtnSprite.setOrigin(0.5).setDepth(300).setScrollFactor(0);
  arenaExitBtnSprite.setInteractive({ useHandCursor: true });
  arenaExitBtnSprite.on('pointerdown', () => exitArena(scene));
}

// ============================================================
//  SPAWN FIGHTERS
// ============================================================

function spawnFighters(scene, enemyData) {
  const playerStartX = BASE_W * ARENA_CONFIG.spawnMargin;
  const enemyStartX = WORLD_W - BASE_W * ARENA_CONFIG.spawnMargin;

  // Calculate ground Y from background (fence line)
  const bgTop = BASE_H / 2 - (arenaBgSprite.displayHeight / 2);
  const fenceY = bgTop + arenaBgSprite.displayHeight * 0.65;  // 65% down the BG = fence line
  GROUND_Y = fenceY;

  console.log("[ARENA] Ground Y:", GROUND_Y.toFixed(0), "BG top:", bgTop.toFixed(0));

  // Player (left side)
  if (scene.spine) {
    try {
      arenaPlayerSprite = scene.add.spine(playerStartX, GROUND_Y, 'hero', 'idle', true);
      arenaPlayerSprite.setScale(ARENA_CONFIG.fighterScale);
    } catch(e) {
      arenaPlayerSprite = scene.add.rectangle(playerStartX, GROUND_Y, 60, 120, 0x3366cc);
    }
  } else {
    arenaPlayerSprite = scene.add.rectangle(playerStartX, GROUND_Y, 60, 120, 0x3366cc);
  }
  arenaPlayerSprite.setDepth(100).setScrollFactor(1);

  // Enemy (right side, flipped)
  if (scene.spine) {
    try {
      arenaEnemySprite = scene.add.spine(enemyStartX, GROUND_Y, 'hero', 'idle', true);
      arenaEnemySprite.setScale(-ARENA_CONFIG.fighterScale, ARENA_CONFIG.fighterScale);
    } catch(e) {
      arenaEnemySprite = scene.add.rectangle(enemyStartX, GROUND_Y, 60, 120, 0xcc3333);
    }
  } else {
    arenaEnemySprite = scene.add.rectangle(enemyStartX, GROUND_Y, 60, 120, 0xcc3333);
  }
  arenaEnemySprite.setDepth(100).setScrollFactor(1);

  // === CINEMATIC CAMERA START ===
  // Start camera on PLAYER (left side)
  scene.cameras.main.scrollX = 0;

  console.log("[ARENA] Spawned at Player:", playerStartX.toFixed(0), "Enemy:", enemyStartX.toFixed(0));
}

// ============================================================
//  RUN-IN SEQUENCE
// ============================================================

function startRunIn(scene) {
  arenaState = "RUN_IN";
  console.log("[ARENA] State: RUN_IN");

  const targetPlayerX = WORLD_W / 2 - ARENA_CONFIG.fightOffset;
  const targetEnemyX = WORLD_W / 2 + ARENA_CONFIG.fightOffset;

  // Start run animations
  if (arenaPlayerSprite.play) arenaPlayerSprite.play('run', true);
  if (arenaEnemySprite.play) arenaEnemySprite.play('run', true);

  // Move fighters with smooth easing
  scene.tweens.add({
    targets: arenaPlayerSprite,
    x: targetPlayerX,
    duration: ARENA_CONFIG.runSpeed,
    ease: 'Sine.easeInOut'
  });

  scene.tweens.add({
    targets: arenaEnemySprite,
    x: targetEnemyX,
    duration: ARENA_CONFIG.runSpeed,
    ease: 'Sine.easeInOut'
  });
}

// ============================================================
//  UPDATE (Camera Follow Midpoint with LERP)
// ============================================================

function updateArena(scene) {
  if (!arenaActive || arenaState !== "RUN_IN") return;

  // Camera follows midpoint with LERP (smooth)
  const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;
  const targetScrollX = midX - BASE_W / 2;
  const clampedX = Math.max(0, Math.min(targetScrollX, WORLD_W - BASE_W));

  // Smooth camera movement (lerp)
  const currentX = scene.cameras.main.scrollX;
  const lerpSpeed = 0.08;  // 8% per frame = smooth
  scene.cameras.main.scrollX = currentX + (clampedX - currentX) * lerpSpeed;

  // Check engage distance
  const distance = Math.abs(arenaEnemySprite.x - arenaPlayerSprite.x);
  if (distance <= ARENA_CONFIG.engageDistance) {
    onEngageDistance(scene);
  }
}

// ============================================================
//  ENGAGE
// ============================================================

function onEngageDistance(scene) {
  if (arenaState !== "RUN_IN") return;
  arenaState = "ENGAGE";
  console.log("[ARENA] State: ENGAGE");

  scene.tweens.killTweensOf(arenaPlayerSprite);
  scene.tweens.killTweensOf(arenaEnemySprite);

  if (arenaPlayerSprite.play) arenaPlayerSprite.play('idle', true);
  if (arenaEnemySprite.play) arenaEnemySprite.play('idle', true);

  scene.time.delayedCall(ARENA_CONFIG.engagePause, () => {
    arenaState = "FIGHT";
    console.log("[ARENA] State: FIGHT");
  });
}

// ============================================================
//  EXIT ARENA
// ============================================================

function exitArena(scene) {
  if (!arenaActive) return;
  console.log("[ARENA] Exit");

  if (arenaBgSprite) { arenaBgSprite.destroy(); arenaBgSprite = null; }
  if (arenaPlayerSprite) { arenaPlayerSprite.destroy(); arenaPlayerSprite = null; }
  if (arenaEnemySprite) { arenaEnemySprite.destroy(); arenaEnemySprite = null; }
  if (arenaExitBtnSprite) { arenaExitBtnSprite.destroy(); arenaExitBtnSprite = null; }

  scene.cameras.main.setBounds(0, 0, BASE_W, BASE_H);
  scene.cameras.main.scrollX = 0;
  scene.cameras.main.setZoom(1);

  showCity();
  arenaState = "NONE";
  arenaActive = false;
}

// ============================================================
//  PUBLIC API
// ============================================================

window.startArena = startArena;
window.exitArena = exitArena;
window.updateArena = updateArena;

console.log("[ArenaScene] Module loaded");

})();
