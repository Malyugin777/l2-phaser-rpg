"use strict";

// ====== ПЕРЕГРУЗКА ======

let isOverdriveActive = false;
let overdriveTimerEvent = null;

function activateOverdrive(scene) {
  if (mode !== "location") {
    spawnForgeResultText(
      scene,
      "Перегрузка доступна только в локации",
      false,
      true
    );
    return;
  }
  if (isOverdriveActive) {
    spawnForgeResultText(scene, "Перегрузка уже активна", false, true);
    return;
  }
  if (wallet.ether < OVERDRIVE_ETHER_COST) {
    spawnForgeResultText(
      scene,
      "Недостаточно Эфира для Перегрузки",
      false,
      true
    );
    return;
  }

  wallet.ether -= OVERDRIVE_ETHER_COST;
  if (wallet.ether < 0) wallet.ether = 0;

  isOverdriveActive = true;
  if (hero) hero.fillColor = 0xffff00;

  if (overdriveTimerEvent) {
    overdriveTimerEvent.remove(false);
    overdriveTimerEvent = null;
  }

  overdriveTimerEvent = scene.time.delayedCall(
    OVERDRIVE_DURATION_MS,
    () => {
      endOverdrive(scene);
    },
    null,
    scene
  );

  updateHeroUI();
  saveGame();
}

function endOverdrive(scene) {
  isOverdriveActive = false;
  if (overdriveTimerEvent) {
    overdriveTimerEvent.remove(false);
    overdriveTimerEvent = null;
  }
  if (hero) hero.fillColor = 0x0000ff;
}