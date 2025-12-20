"use strict";

// ============================================================
//  ARENA SCENE — Cinematic Auto-Battler
// ============================================================

let arenaActive = false;
let arenaBg = null;
let vsOverlay = null;
let vsText = null;

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
  vsOverlay = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9);
  vsOverlay.setDepth(500);
  vsOverlay.setScrollFactor(0);
  vsOverlay.setAlpha(0);

  // VS текст
  const playerName = window.profile?.name || "Игрок";
  const playerLevel = window.stats?.level || 1;
  const enemyName = enemyData?.name || "Противник";
  const enemyLevel = enemyData?.level || 1;

  const vsContent = `${playerName}  Lv.${playerLevel}\n\n⚔️ VS ⚔️\n\n${enemyName}  Lv.${enemyLevel}`;

  vsText = scene.add.text(w/2, h/2, vsContent, {
    fontFamily: 'Arial',
    fontSize: '32px',
    color: '#ffffff',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 4
  });
  vsText.setOrigin(0.5);
  vsText.setDepth(501);
  vsText.setScrollFactor(0);
  vsText.setAlpha(0);

  // Fade in
  scene.tweens.add({
    targets: [vsOverlay, vsText],
    alpha: 1,
    duration: ARENA_CONFIG.vs.fadeTime,
    onComplete: () => {
      // Держим VS экран
      scene.time.delayedCall(ARENA_CONFIG.vs.duration, () => {
        // Fade out
        scene.tweens.add({
          targets: [vsOverlay, vsText],
          alpha: 0,
          duration: ARENA_CONFIG.vs.fadeTime,
          onComplete: () => {
            vsOverlay.destroy();
            vsText.destroy();
            vsOverlay = null;
            vsText = null;
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
  arenaBg = scene.add.image(w/2, h/2, 'arena_village');
  arenaBg.setScale(ARENA_CONFIG.bg.scale);
  arenaBg.setDepth(50);
  arenaBg.setScrollFactor(0);

  // Центрируем по вертикали (фон широкий, показываем центр)
  // Можно настроить Y offset если нужно

  console.log("[ARENA] Background ready, size:", arenaBg.displayWidth, "x", arenaBg.displayHeight);

  // Временная кнопка выхода (для теста)
  const exitBtn = scene.add.text(w/2, h - 100, '[ Выход ]', {
    fontSize: '24px',
    color: '#ffffff',
    backgroundColor: '#333333',
    padding: { x: 20, y: 10 }
  });
  exitBtn.setOrigin(0.5);
  exitBtn.setDepth(300);
  exitBtn.setScrollFactor(0);
  exitBtn.setInteractive({ useHandCursor: true });
  exitBtn.on('pointerdown', () => {
    exitBtn.destroy();
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
  if (arenaBg) {
    arenaBg.destroy();
    arenaBg = null;
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
