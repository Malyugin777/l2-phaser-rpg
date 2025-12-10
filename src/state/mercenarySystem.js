"use strict";

// ====== НАЁМНИК ======

let mercActive = false;
let mercStats = {
  maxHp: 80,
  hp: 80,
  minAttack: 8,
  maxAttack: 15,
  critChance: 0.2,
  critMultiplier: 1.8,
};
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

  mercStats.maxHp = Math.round(heroStats.maxHp * 0.8);
  mercStats.hp = mercStats.maxHp;
  mercStats.minAttack = Math.round(effMin * 0.7);
  mercStats.maxAttack = Math.round(effMax * 0.7);
  mercStats.critChance = Math.min(0.5, effCrit + 0.05);
  mercStats.critMultiplier = heroStats.critMultiplier;
}

// Вкл/выкл наёмника
function toggleMercenary(scene) {
  if (mercActive) {
    // отключаем
    mercActive = false;
    if (merc) merc.setVisible(false);
    stopMercAttack();
    spawnForgeResultText(scene, "Наёмник распущен", true, true);
  } else {
    // пытаемся нанять
    if (heroGold < MERC_HIRE_COST) {
      spawnForgeResultText(
        scene,
        "Нужно " + MERC_HIRE_COST + " адены для найма",
        false,
        true
      );
      return;
    }
    heroGold -= MERC_HIRE_COST;
    mercActive = true;
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
          if (!mercActive) return;
          if (mode !== "location") return;
          if (!enemyAlive) return;
          if (heroStats.hp <= 0) return;
          mercAttackEnemy(scene);
        },
      });
    }
  }

  updateHeroUI();
  saveGame();
}
