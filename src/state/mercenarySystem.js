"use strict";

// ====== НАЁМНИК ======
// Данные наёмника теперь в heroState.js → mercenary

let merc = null;
let mercAttackEvent = null;
const MERC_HIRE_COST = 200;

// Остановка таймера атаки наёмника
function stopMercAttack() {
  if (mercAttackEvent) {
    mercAttackEvent.remove(false);
    mercAttackEvent = null;
  }
}

// Обновление статов наёмника от текущих статов героя
function updateMercStatsFromHero() {
  const effMin = getEffectiveMinAttack();
  const effMax = getEffectiveMaxAttack();
  const effCrit = getEffectiveCritChance();

  mercenary.maxHp = Math.round(stats.maxHp * 0.8);
  mercenary.hp = mercenary.maxHp;
  mercenary.minAttack = Math.round(effMin * 0.7);
  mercenary.maxAttack = Math.round(effMax * 0.7);
  mercenary.critChance = Math.min(0.5, effCrit + 0.05);
  mercenary.critMultiplier = stats.critMultiplier;
}

// Вкл/выкл наёмника
function toggleMercenary(scene) {
  if (mercenary.active) {
    // отключаем
    mercenary.active = false;
    if (merc) merc.setVisible(false);
    stopMercAttack();
    spawnForgeResultText(scene, "Наёмник распущен", true, true);
  } else {
    // пытаемся нанять
    if (wallet.gold < MERC_HIRE_COST) {
      spawnForgeResultText(
        scene,
        "Нужно " + MERC_HIRE_COST + " адены для найма",
        false,
        true
      );
      return;
    }
    wallet.gold -= MERC_HIRE_COST;
    mercenary.active = true;
    updateMercStatsFromHero();
    spawnForgeResultText(scene, "Наёмник нанят", true, true);

    if (mode === "location" && merc) {
      merc.setVisible(true);
      merc.x = heroStartX - 80;
      merc.y = heroStartY;

      stopMercAttack();
      mercAttackEvent = scene.time.addEvent({
        delay: 1500,
        loop: true,
        callback: function () {
          if (!mercenary.active) return;
          if (mode !== "location") return;
          if (!enemyAlive) return;
          if (stats.hp <= 0) return;
          mercAttackEnemy(scene);
        },
      });
    }
  }

  updateHeroUI();
  saveGame();
}