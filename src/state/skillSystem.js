"use strict";

// ====== SKILL / POTION / BUFF SYSTEM ======
// SKILL_DB определён в heroState.js — здесь НЕ дублируем!

// ==== HELPERS ДЛЯ СЛОТОВ СКИЛЛОВ ====

function getSkillFromSlot(slotKey) {
  if (typeof skills === "undefined" || !skills || !skills.slots) {
    return { key: null, cfg: null };
  }
  const key = skills.slots[slotKey] || null;
  const cfg = key && SKILL_DB && SKILL_DB[key] ? SKILL_DB[key] : null;
  return { key, cfg };
}

function getSkillButtonLabel(slotKey, isReady) {
  const { key } = getSkillFromSlot(slotKey);

  if (!key) {
    const base = slotKey === "slot1" ? "Скилл 1" : "Скилл 2";
    return isReady ? base + " (пусто)" : base + " (CD)";
  }

  return isReady ? key : key + " (CD)";
}

// ====== UI: ПОДПИСИ КНОПОК ======

function updateSkillButtonsUI() {
  if (typeof consumables !== "undefined" && hpPotionButtonText) {
    hpPotionButtonText.setText("HP банка (" + consumables.hpPotions + ")");
  }
  if (typeof consumables !== "undefined" && mpPotionButtonText) {
    mpPotionButtonText.setText("MP банка (" + consumables.mpPotions + ")");
  }
  if (typeof consumables !== "undefined" && pBuffButtonText) {
    pBuffButtonText.setText("+P.ATK (" + consumables.pAtkScrolls + ")");
  }
  if (typeof consumables !== "undefined" && mBuffButtonText) {
    mBuffButtonText.setText("+M.ATK (" + consumables.mAtkScrolls + ")");
  }

  if (typeof skill1Ready === "undefined") {
    if (skill1ButtonText) skill1ButtonText.setText("Скилл 1");
    if (skill2ButtonText) skill2ButtonText.setText("Скилл 2");
    return;
  }

  if (skill1ButtonText) {
    skill1ButtonText.setText(getSkillButtonLabel("slot1", skill1Ready));
  }
  if (skill2ButtonText) {
    skill2ButtonText.setText(getSkillButtonLabel("slot2", skill2Ready));
  }
}

// ====== АКТИВНЫЕ СКИЛЛЫ ======

function useSkill1(scene) {
  useSkillFromSlot(scene, "slot1", "skill1");
}

function useSkill2(scene) {
  useSkillFromSlot(scene, "slot2", "skill2");
}

function useSkillFromSlot(scene, slotKey, readyKey) {
  if (mode !== "location") return;
  if (!enemyAlive) return;
  if (!stats || stats.hp <= 0) return;

  // Нельзя использовать скиллы сидя (встаёт и отменяет действие)
  if (typeof canPerformAction === "function" && !canPerformAction()) {
    spawnCannotAttackText(scene);
    return;
  }
  // Fallback: старая проверка
  if (buffs.isResting) {
    spawnCannotAttackText(scene);
    return;
  }

  const isReady = readyKey === "skill1" ? skill1Ready : skill2Ready;
  if (!isReady) {
    spawnForgeResultText(scene, "Скилл перезаряжается", false, true);
    return;
  }

  const { key, cfg } = getSkillFromSlot(slotKey);

  if (!key || !cfg) {
    const slotNum = slotKey === "slot1" ? "1" : "2";
    spawnForgeResultText(scene, "В слоте " + slotNum + " нет навыка", false, true);
    return;
  }

  const mpCost = typeof cfg.mp === "number" ? cfg.mp : 0;
  if (stats.mp < mpCost) {
    spawnForgeResultText(scene, "Недостаточно MP для " + key, false, true);
    return;
  }

  stats.mp -= mpCost;
  if (stats.mp < 0) stats.mp = 0;

  if (readyKey === "skill1") {
    skill1Ready = false;
  } else {
    skill2Ready = false;
  }

  updateHeroUI();
  updateSkillButtonsUI();

  const power = typeof cfg.power === "number" ? cfg.power : 1.0;

  // Наносим урон
  damageEnemyWithSkill(scene, power, false);

  // Спец-эффекты
  if (cfg.healPercent && cfg.healPercent > 0) {
    // Vampiric Touch — лечение
    const healAmount = Math.round(power * stats.maxAttack * cfg.healPercent);
    stats.hp += healAmount;
    if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;
    spawnHealText(scene, healAmount);
  }
  
  if (cfg.stun) {
    // Shield Stun — стан врага
    stopEnemyAttackTemporarily(scene, 2000);
    spawnStunText(scene);
  }

  // Cooldown
  let fallbackCd;
  if (readyKey === "skill1") {
    fallbackCd = typeof SKILL1_COOLDOWN_MS === "number" ? SKILL1_COOLDOWN_MS : 3000;
  } else {
    fallbackCd = typeof SKILL2_COOLDOWN_MS === "number" ? SKILL2_COOLDOWN_MS : 5000;
  }
  const cd = typeof cfg.cd === "number" ? cfg.cd : fallbackCd;

  scene.time.delayedCall(
    cd,
    () => {
      if (readyKey === "skill1") {
        skill1Ready = true;
      } else {
        skill2Ready = true;
      }
      updateSkillButtonsUI();
    },
    null,
    scene
  );
}

// Хелперы для спец-эффектов
function spawnHealText(scene, amount) {
  if (!hero) return;
  const text = scene.add
    .text(hero.x, hero.y - 40, "+" + amount + " HP", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#00ff00",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 30,
    alpha: 0,
    duration: 800,
    onComplete: () => text.destroy(),
  });
}

function spawnStunText(scene) {
  if (!enemy) return;
  const text = scene.add
    .text(enemy.x, enemy.y - 100, "STUNNED!", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffff00",
      stroke: "#000000",
      strokeThickness: 4,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 20,
    alpha: 0,
    duration: 1500,
    onComplete: () => text.destroy(),
  });
}

function stopEnemyAttackTemporarily(scene, duration) {
  stopEnemyAttack();
  scene.time.delayedCall(duration, () => {
    if (mode === "location" && enemyAlive) {
      enemyAttackEvent = scene.time.addEvent({
        delay: ENEMY_ATTACK_INTERVAL_MS,
        loop: true,
        callback: () => {
          if (mode !== "location" || !enemyAlive || stats.hp <= 0) return;
          enemyAttackHero(scene);
        },
      });
    }
  });
}

// ====== БАНКИ ======

function useHpPotion(scene) {
  if (consumables.hpPotions <= 0) {
    spawnForgeResultText(scene, "Нет HP банок", false, true);
    return;
  }
  if (stats.hp >= stats.maxHp) {
    spawnForgeResultText(scene, "HP уже полное", false, true);
    return;
  }
  consumables.hpPotions -= 1;
  const heal = Math.round(stats.maxHp * 0.4);
  stats.hp += heal;
  if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;

  spawnForgeResultText(scene, "+HP банка (" + heal + ")", true, true);
  updateHeroUI();
  saveGame();
}

function useMpPotion(scene) {
  if (consumables.mpPotions <= 0) {
    spawnForgeResultText(scene, "Нет MP банок", false, true);
    return;
  }
  if (stats.mp >= stats.maxMp) {
    spawnForgeResultText(scene, "MP уже полное", false, true);
    return;
  }
  consumables.mpPotions -= 1;
  const heal = Math.round(stats.maxMp * 0.4);
  stats.mp += heal;
  if (stats.mp > stats.maxMp) stats.mp = stats.maxMp;

  spawnForgeResultText(scene, "+MP банка (" + heal + ")", true, true);
  updateHeroUI();
  saveGame();
}

// ====== БАФЫ СВИТКАМИ ======

function usePAtkBuff(scene) {
  if (consumables.pAtkScrolls <= 0) {
    spawnForgeResultText(scene, "Нет свитков +P.ATK", false, true);
    return;
  }
  consumables.pAtkScrolls -= 1;
  buffs.pAtkActive = true;
  if (buffPTimer) {
    buffPTimer.remove(false);
    buffPTimer = null;
  }
  buffPTimer = scene.time.delayedCall(
    BUFF_DURATION_MS,
    () => {
      buffs.pAtkActive = false;
      updateHeroUI();
    },
    null,
    scene
  );
  spawnForgeResultText(scene, "Баф +P.ATK активен", true, true);
  updateHeroUI();
  saveGame();
}

function useMAtkBuff(scene) {
  if (consumables.mAtkScrolls <= 0) {
    spawnForgeResultText(scene, "Нет свитков +M.ATK", false, true);
    return;
  }
  consumables.mAtkScrolls -= 1;
  buffs.mAtkActive = true;
  if (buffMTimer) {
    buffMTimer.remove(false);
    buffMTimer = null;
  }
  buffMTimer = scene.time.delayedCall(
    BUFF_DURATION_MS,
    () => {
      buffs.mAtkActive = false;
      updateHeroUI();
    },
    null,
    scene
  );
  spawnForgeResultText(scene, "Баф +M.ATK активен", true, true);
  updateHeroUI();
  saveGame();
}

// ====== БАЗОВАЯ АВТОАТАКА ГЕРОЯ ======

function startHeroAttack(scene) {
  console.log("[Attack] Starting attack check...");
  console.log("[Attack] isAttacking:", isAttacking, "enemyAlive:", enemyAlive, "hero:", !!hero, "enemy:", !!enemy);

  // Нельзя атаковать сидя (встаёт и отменяет действие)
  if (typeof canPerformAction === "function" && !canPerformAction()) {
    console.log("[Attack] Blocked: sitting, standing up");
    return;
  }

  if (isAttacking) {
    console.log("[Attack] Blocked: already attacking");
    return;
  }
  if (!enemyAlive) {
    console.log("[Attack] Blocked: enemy not alive");
    return;
  }
  if (!hero || !enemy) {
    console.log("[Attack] Blocked: hero or enemy missing");
    return;
  }
  if (stats.hp <= 0) {
    console.log("[Attack] Blocked: hero HP <= 0");
    return;
  }

  console.log("[Attack] Starting hero attack!");
  isAttacking = true;
  const attackX = enemy.x - 80;
  const useEtherShot =
    typeof autoHuntEnabled !== "undefined" &&
    autoHuntEnabled &&
    wallet.ether > 0;

  scene.tweens.add({
    targets: hero,
    x: attackX,
    duration: 400,
    ease: "Power2",
    onComplete: function () {
      damageEnemy(scene, useEtherShot);
      scene.tweens.add({
        targets: hero,
        x: attackX + 20,
        duration: 80,
        yoyo: true,
        repeat: 2,
        ease: "Power1",
        onComplete: function () {
          scene.tweens.add({
            targets: hero,
            x: heroStartX,
            duration: 400,
            ease: "Power2",
            onComplete: function () {
              isAttacking = false;
            },
          });
        },
      });
    },
  });
}