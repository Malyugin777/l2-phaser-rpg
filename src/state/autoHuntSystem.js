"use strict";

// ====== АВТО-ОХОТА ======

let autoHuntEnabled = false;
let autoHuntEvent = null;
let autoHuntSessionTimer = null;
const AUTO_HP_THRESHOLD = 0.3;
const AUTO_MP_THRESHOLD = 0.2;

// Авто-использование банок во время авто-охоты
function autoPotionsDuringHunt(scene) {
  if (!autoHuntEnabled) return;
  if (heroStats.hp <= 0) return;

  const hpRatio = heroStats.hp / heroStats.maxHp;
  const mpRatio = heroStats.mp / heroStats.maxMp;

  if (hpRatio < AUTO_HP_THRESHOLD && heroHpPotions > 0) useHpPotion(scene);
  if (mpRatio < AUTO_MP_THRESHOLD && heroMpPotions > 0) useMpPotion(scene);
}

// Включить авто-охоту
function enableAutoHunt(scene) {
  if (mode !== "location") return;
  if (heroStats.hp <= 0) return;

  autoHuntEnabled = true;
  saveGame();

  if (autoButton) autoButton.fillColor = 0x1e7f1e;
  if (autoButtonText) autoButtonText.setText("Авто-охота: ON");

  if (autoHuntEvent) {
    autoHuntEvent.remove(false);
    autoHuntEvent = null;
  }
  if (autoHuntSessionTimer) {
    autoHuntSessionTimer.remove(false);
    autoHuntSessionTimer = null;
  }

  autoHuntEvent = scene.time.addEvent({
    delay: 1200,
    loop: true,
    callback: function () {
      if (!autoHuntEnabled) return;
      if (mode !== "location") return;
      if (heroStats.hp <= 0) return;
      autoPotionsDuringHunt(scene);
      if (isAttacking) return;
      if (!enemyAlive) return;
      startHeroAttack(scene);
    },
  });

  autoHuntSessionTimer = scene.time.delayedCall(
    AUTO_HUNT_DURATION_MS,
    () => {
      onAutoHuntSessionEnd(scene);
    },
    null,
    scene
  );

  hideCamp();
}

// Событие окончания сессии авто-охоты
function onAutoHuntSessionEnd(scene) {
  disableAutoHunt();
  showCamp(scene);
}

// Выключить авто-охоту
function disableAutoHunt() {
  autoHuntEnabled = false;
  if (autoButton) autoButton.fillColor = 0x333333;
  if (autoButtonText) autoButtonText.setText("Авто-охота: OFF");

  if (autoHuntEvent) {
    autoHuntEvent.remove(false);
    autoHuntEvent = null;
  }
  if (autoHuntSessionTimer) {
    autoHuntSessionTimer.remove(false);
    autoHuntSessionTimer = null;
  }
}
