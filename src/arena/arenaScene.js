"use strict";

// ============================================================
//  ARENA SCENE — Cinematic Auto-Battler (IIFE to avoid conflicts)
// ============================================================

(function() {

let arenaActive = false;
let arenaBackground = null;
let arenaVsOverlay = null;
let arenaVsText = null;
let arenaExitBtn = null;

// Arena config
const ARENA_CONFIG = {
  bg: {
    key: 'arena_village',
    scale: 0.38  // 2048 * 0.38 ≈ 778px (fits 780 screen)
  },
  vs: {
    duration: 1500,  // 1.5 sec
    fadeTime: 300
  },
  spawn: {
    heroX: 200,   // левый край (в координатах фона)
    enemyX: 1800, // правый край
    centerX: 1024 // центр боя
  }
};

// ============================================================
//  START ARENA
// ============================================================

function startArena(scene, enemyData) {
  if (arenaActive) return;
  arenaActive = true;

  console.log("[ARENA] Starting...");

  // Скрываем город
  if (window.cityBg) window.cityBg.setVisible(false);
  if (window.spineHero) window.spineHero.setVisible(false);
  if (window.panelContainer) window.panelContainer.setVisible(false);

  // Показываем VS экран
  showVSScreen(scene, enemyData, () => {
    // После VS — показываем арену
    showArenaBackground(scene);
  });
}

// ============================================================
//  VS SCREEN
// ============================================================

function showVSScreen(scene, enemyData, onComplete) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  // Затемнение
  arenaVsOverlay = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9);
  arenaVsOverlay.setDepth(500);
  arenaVsOverlay.setScrollFactor(0);
  arenaVsOverlay.setAlpha(0);

  // VS текст
  const playerName = window.profile?.name || "Игрок";
  const playerLevel = window.stats?.level || 1;
  const enemyName = enemyData?.name || "Противник";
  const enemyLevel = enemyData?.level || 1;

  const vsContent = `${playerName}  Lv.${playerLevel}\n\n⚔️ VS ⚔️\n\n${enemyName}  Lv.${enemyLevel}`;

  arenaVsText = scene.add.text(w/2, h/2, vsContent, {
    fontFamily: 'Arial',
    fontSize: '32px',
    color: '#ffffff',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 4
  });
  arenaVsText.setOrigin(0.5);
  arenaVsText.setDepth(501);
  arenaVsText.setScrollFactor(0);
  arenaVsText.setAlpha(0);

  // Fade in
  scene.tweens.add({
    targets: [arenaVsOverlay, arenaVsText],
    alpha: 1,
    duration: ARENA_CONFIG.vs.fadeTime,
    onComplete: () => {
      // Держим VS экран
      scene.time.delayedCall(ARENA_CONFIG.vs.duration, () => {
        // Fade out
        scene.tweens.add({
          targets: [arenaVsOverlay, arenaVsText],
          alpha: 0,
          duration: ARENA_CONFIG.vs.fadeTime,
          onComplete: () => {
            arenaVsOverlay.destroy();
            arenaVsText.destroy();
            arenaVsOverlay = null;
            arenaVsText = null;
            if (onComplete) onComplete();
          }
        });
      });
    }
  });
}

// ============================================================
//  ARENA BACKGROUND
// ============================================================

function showArenaBackground(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  console.log("[ARENA] Showing background");

  // Создаём фон арены
  arenaBackground = scene.add.image(w/2, h/2, 'arena_village');
  arenaBackground.setScale(ARENA_CONFIG.bg.scale);
  arenaBackground.setDepth(50);
  arenaBackground.setScrollFactor(0);

  console.log("[ARENA] Background ready, size:", arenaBackground.displayWidth, "x", arenaBackground.displayHeight);

  // Временная кнопка выхода (для теста)
  arenaExitBtn = scene.add.text(w/2, h - 100, '[ Выход ]', {
    fontSize: '24px',
    color: '#ffffff',
    backgroundColor: '#333333',
    padding: { x: 20, y: 10 }
  });
  arenaExitBtn.setOrigin(0.5);
  arenaExitBtn.setDepth(300);
  arenaExitBtn.setScrollFactor(0);
  arenaExitBtn.setInteractive({ useHandCursor: true });
  arenaExitBtn.on('pointerdown', () => {
    exitArena(scene);
  });

  // TODO Phase 2: spawn персонажей и начать сближение
}

// ============================================================
//  EXIT ARENA
// ============================================================

function exitArena(scene) {
  if (!arenaActive) return;

  console.log("[ARENA] Exiting...");

  // Убираем арену
  if (arenaBackground) {
    arenaBackground.destroy();
    arenaBackground = null;
  }
  if (arenaExitBtn) {
    arenaExitBtn.destroy();
    arenaExitBtn = null;
  }

  // Возвращаем город
  if (window.cityBg) window.cityBg.setVisible(true);
  if (window.spineHero) window.spineHero.setVisible(true);
  if (window.panelContainer) window.panelContainer.setVisible(true);

  arenaActive = false;
}

// ============================================================
//  PUBLIC API
// ============================================================

window.startArena = startArena;
window.exitArena = exitArena;

console.log("[ArenaScene] Module loaded");

})();
