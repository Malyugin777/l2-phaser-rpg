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
  if (heroEther < OVERDRIVE_ETHER_COST) {
    spawnForgeResultText(
      scene,
      "Недостаточно Эфира для Перегрузки",
      false,
      true
    );
    return;
  }

  heroEther -= OVERDRIVE_ETHER_COST;
  if (heroEther < 0) heroEther = 0;

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
