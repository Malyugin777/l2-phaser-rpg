"use strict";

// ====== АВТО-ОХОТА ======

let autoHuntEnabled = false;
let autoHuntEvent = null;
let autoHuntSessionTimer = null;
const AUTO_HP_THRESHOLD = 0.3;
const AUTO_MP_THRESHOLD = 0.2;
const AUTO_REST_HP_LOW = 0.3;   // Садимся при HP < 30%
const AUTO_REST_HP_HIGH = 0.8;  // Встаём при HP > 80%

// Авто-использование банок во время авто-охоты
function autoPotionsDuringHunt(scene) {
  if (!autoHuntEnabled) return;
  if (stats.hp <= 0) return;

  const hpRatio = stats.hp / stats.maxHp;
  const mpRatio = stats.mp / stats.maxMp;

  if (hpRatio < AUTO_HP_THRESHOLD && consumables.hpPotions > 0) useHpPotion(scene);
  if (mpRatio < AUTO_MP_THRESHOLD && consumables.mpPotions > 0) useMpPotion(scene);
}

// Автоматический отдых во время авто-охоты
function autoRestDuringHunt(scene) {
  if (!autoHuntEnabled) return;
  if (stats.hp <= 0) return;
  
  const hpRatio = stats.hp / stats.maxHp;
  
  // Если HP низкий и нет банок — садимся
  if (hpRatio < AUTO_REST_HP_LOW && consumables.hpPotions === 0) {
    if (!buffs.isResting) {
      startRest();
    }
  }
  
  // Если HP восстановился — встаём
  if (hpRatio > AUTO_REST_HP_HIGH && buffs.isResting) {
    stopRest();
  }
}

// Включить авто-охоту
function enableAutoHunt(scene) {
  if (mode !== "location") {
    console.log("[AutoHunt] mode !== location, mode =", mode);
    return;
  }
  if (stats.hp <= 0) {
    console.log("[AutoHunt] stats.hp <= 0");
    return;
  }

  console.log("[AutoHunt] Enabled!");
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
      if (!autoHuntEnabled) {
        console.log("[AutoHunt] Disabled in callback");
        return;
      }
      if (mode !== "location") {
        console.log("[AutoHunt] Wrong mode:", mode);
        return;
      }
      if (stats.hp <= 0) {
        console.log("[AutoHunt] HP <= 0");
        return;
      }
      
      // Сначала проверяем отдых
      autoRestDuringHunt(scene);
      
      // Потом банки
      autoPotionsDuringHunt(scene);
      
      // Если отдыхаем — не атакуем
      if (buffs.isResting) {
        console.log("[AutoHunt] Resting");
        return;
      }
      
      if (isAttacking) {
        console.log("[AutoHunt] Already attacking");
        return;
      }
      if (!enemyAlive) {
        console.log("[AutoHunt] Enemy not alive");
        return;
      }
      console.log("[AutoHunt] Starting attack!");
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