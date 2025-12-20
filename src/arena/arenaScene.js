"use strict";

// ============================================================
//  ARENA SCENE — 2-Screen Wide World (IIFE to avoid conflicts)
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
  fightOffset: 110,        // Distance from center for each fighter
  engageDistance: 220,     // Stop when this close
  spawnMargin: 0.15,       // Spawn at 15% from edge
  groundY: 0.55,           // Ground at 55% screen height
  runSpeed: 2000,          // Run duration (ms)
  vsScreenDuration: 1500,
  fadeTime: 300,
  engagePause: 200,
  fighterScale: 1.0
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
  GROUND_Y = BASE_H * ARENA_CONFIG.groundY;

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

  scene.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  arenaBgSprite = scene.add.image(WORLD_W / 2, BASE_H / 2, 'arena_village');

  const scaleW = WORLD_W / arenaBgSprite.width;
  const scaleH = BASE_H / arenaBgSprite.height;
  const bgScale = Math.max(scaleW, scaleH);

  arenaBgSprite.setScale(bgScale).setOrigin(0.5, 0.5).setDepth(10).setScrollFactor(1);

  console.log("[ARENA] bgScale:", bgScale.toFixed(3));

  arenaExitBtnSprite = scene.add.text(BASE_W / 2, BASE_H - 80, '[ Выход ]', {
    fontSize: '24px', color: '#ffffff', backgroundColor: '#333333',
    padding: { x: 20, y: 10 }
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

  console.log("[ARENA] Spawn Player X:", playerStartX, "Enemy X:", enemyStartX);

  // Player (left)
  if (scene.spine) {
    try {
      arenaPlayerSprite = scene.add.spine(playerStartX, GROUND_Y, 'hero', 'idle', true);
      arenaPlayerSprite.setScale(ARENA_CONFIG.fighterScale);
    } catch(e) {
      arenaPlayerSprite = scene.add.rectangle(playerStartX, GROUND_Y, 80, 150, 0x3366cc);
    }
  } else {
    arenaPlayerSprite = scene.add.rectangle(playerStartX, GROUND_Y, 80, 150, 0x3366cc);
  }
  arenaPlayerSprite.setDepth(100).setScrollFactor(1);

  // Enemy (right, flipped)
  if (scene.spine) {
    try {
      arenaEnemySprite = scene.add.spine(enemyStartX, GROUND_Y, 'hero', 'idle', true);
      arenaEnemySprite.setScale(-ARENA_CONFIG.fighterScale, ARENA_CONFIG.fighterScale);
    } catch(e) {
      arenaEnemySprite = scene.add.rectangle(enemyStartX, GROUND_Y, 80, 150, 0xcc3333);
    }
  } else {
    arenaEnemySprite = scene.add.rectangle(enemyStartX, GROUND_Y, 80, 150, 0xcc3333);
  }
  arenaEnemySprite.setDepth(100).setScrollFactor(1);

  scene.cameras.main.scrollX = Math.max(0, playerStartX - BASE_W / 2);
}

// ============================================================
//  RUN-IN SEQUENCE
// ============================================================

function startRunIn(scene) {
  arenaState = "RUN_IN";
  console.log("[ARENA] State: RUN_IN");

  const targetPlayerX = WORLD_W / 2 - ARENA_CONFIG.fightOffset;
  const targetEnemyX = WORLD_W / 2 + ARENA_CONFIG.fightOffset;

  if (arenaPlayerSprite.play) arenaPlayerSprite.play('run', true);
  if (arenaEnemySprite.play) arenaEnemySprite.play('run', true);

  scene.tweens.add({
    targets: arenaPlayerSprite,
    x: targetPlayerX,
    duration: ARENA_CONFIG.runSpeed,
    ease: 'Linear'
  });

  scene.tweens.add({
    targets: arenaEnemySprite,
    x: targetEnemyX,
    duration: ARENA_CONFIG.runSpeed,
    ease: 'Linear'
  });
}

// ============================================================
//  UPDATE (Camera Follow Midpoint)
// ============================================================

function updateArena(scene) {
  if (!arenaActive || arenaState !== "RUN_IN") return;

  const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;
  const targetScrollX = midX - BASE_W / 2;
  const clampedX = Math.max(0, Math.min(targetScrollX, WORLD_W - BASE_W));
  scene.cameras.main.scrollX = clampedX;

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
