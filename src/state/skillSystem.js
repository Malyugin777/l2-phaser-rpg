"use strict";

// ====== SKILL / POTION / BUFF SYSTEM ======
//
// ВАЖНО: не объявляем SKILL_DB вторым const'ом, а создаём,
// только если он ещё не существует (без конфликтов с другими файлами).
if (typeof SKILL_DB === "undefined") {
 window.SKILL_DB = {
  // --- 1 ПРОФА (FIGHTER) ---
  "Power Strike": {
    id: "power_strike",
    name: "Power Strike",
    type: "physical",
    power: 1.5,
    mp: 10,
    cd: 4000,
    desc: "Мощный удар x1.5",

    // NEW: цена обучения
    costSp: 5,
    costGold: 100,
  },
  "Mortal Blow": {
    id: "mortal_blow",
    name: "Mortal Blow",
    type: "physical",
    power: 2.5,
    mp: 15,
    cd: 6000,
    chance: 0.7,
    desc: "Летал x2.5 (Шанс 70%)",

    costSp: 8,
    costGold: 150,
  },

  // --- 1 ПРОФА (MYSTIC) ---
  "Wind Strike": {
    id: "wind_strike",
    name: "Wind Strike",
    type: "magical",
    power: 2.0,
    mp: 12,
    cd: 3000,
    castTime: 1500,
    desc: "Нюк ветром x2.0",

    costSp: 5,
    costGold: 100,
  },
  "Vampiric Touch": {
    id: "vamp_touch",
    name: "Vampiric Touch",
    type: "magical",
    power: 1.2,
    mp: 20,
    cd: 8000,
    castTime: 1500,
    healPercent: 0.4,
    desc: "Дрейн ХП (40%)",

    costSp: 10,
    costGold: 200,
  },

  // --- 2 ПРОФА (KNIGHT - 20+) ---
  "Shield Stun": {
    id: "shield_stun",
    name: "Shield Stun",
    type: "physical",
    power: 1.2,
    mp: 20,
    cd: 8000,
    stun: true,
    desc: "Стан врага на 2 сек.",

    costSp: 15,
    costGold: 400,
  },
  "Ultimate Defense": {
    id: "ult_defense",
    name: "Ultimate Defense",
    type: "buff",
    mp: 50,
    cd: 60000,
    duration: 15000,
    effect: { pDef: 3.0 },
    desc: "P.Def x3 (УД)",

    costSp: 20,
    costGold: 500,
  },

  // --- 2 ПРОФА (ROGUE - 20+) ---
  "Backstab": {
    id: "backstab",
    name: "Backstab",
    type: "physical",
    power: 4.0,
    mp: 30,
    cd: 10000,
    chance: 0.5,
    desc: "Удар в спину x4.0 (Шанс 50%)",

    costSp: 18,
    costGold: 450,
  },
  "Dash": {
    id: "dash",
    name: "Dash",
    type: "buff",
    mp: 20,
    cd: 30000,
    duration: 10000,
    effect: { atkSpeed: 1.3 },
    desc: "Скор. Атк +30%",

    costSp: 12,
    costGold: 350,
  },

  // --- 2 ПРОФА (WIZARD - 20+) ---
  "Blaze": {
    id: "blaze",
    name: "Blaze",
    type: "magical",
    power: 3.0,
    mp: 25,
    cd: 4000,
    castTime: 2000,
    desc: "Огненный шар x3.0",

    costSp: 15,
    costGold: 450,
  },
  "Aura Flare": {
    id: "aura_flare",
    name: "Aura Flare",
    type: "magical",
    power: 1.5,
    mp: 30,
    cd: 500,
    castTime: 500,
    desc: "Быстрая вспышка (спам)",

    costSp: 18,
    costGold: 500,
  },
};

}

// ==== HELPERS ДЛЯ СЛОТОВ СКИЛЛОВ ====

function getSkillFromSlot(slotKey) {
  if (typeof skillSlots === "undefined" || !skillSlots) {
    return { key: null, cfg: null };
  }
  const key = skillSlots[slotKey] || null;
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
  if (typeof heroHpPotions !== "undefined" && hpPotionButtonText) {
    hpPotionButtonText.setText("HP банка (" + heroHpPotions + ")");
  }
  if (typeof heroMpPotions !== "undefined" && mpPotionButtonText) {
    mpPotionButtonText.setText("MP банка (" + heroMpPotions + ")");
  }
  if (typeof heroPAtkScrolls !== "undefined" && pBuffButtonText) {
    pBuffButtonText.setText("+P.ATK (" + heroPAtkScrolls + ")");
  }
  if (typeof heroMAtkScrolls !== "undefined" && mBuffButtonText) {
    mBuffButtonText.setText("+M.ATK (" + heroMAtkScrolls + ")");
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
  if (!heroStats || heroStats.hp <= 0) return;

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
  if (heroStats.mp < mpCost) {
    spawnForgeResultText(scene, "Недостаточно MP для " + key, false, true);
    return;
  }

  // Списываем MP
  heroStats.mp -= mpCost;
  if (heroStats.mp < 0) heroStats.mp = 0;

  if (readyKey === "skill1") {
    skill1Ready = false;
  } else {
    skill2Ready = false;
  }

  updateHeroUI();
  updateSkillButtonsUI();

  const useEtherShot =
    typeof autoHuntEnabled !== "undefined" &&
    autoHuntEnabled &&
    typeof heroEther !== "undefined" &&
    heroEther > 0;

  const power = typeof cfg.power === "number" ? cfg.power : 1.0;

  // Пока просто передаём множитель урона в damageEnemyWithSkill
  damageEnemyWithSkill(scene, power, useEtherShot);

  // Фоллбэк, если в конфиге не указан cd
  let fallbackCd;
  if (readyKey === "skill1") {
    fallbackCd =
      typeof SKILL1_COOLDOWN_MS === "number" ? SKILL1_COOLDOWN_MS : 3000;
  } else {
    fallbackCd =
      typeof SKILL2_COOLDOWN_MS === "number" ? SKILL2_COOLDOWN_MS : 5000;
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

// ====== БАНКИ ======

function useHpPotion(scene) {
  if (heroHpPotions <= 0) {
    spawnForgeResultText(scene, "Нет HP банок", false, true);
    return;
  }
  if (heroStats.hp >= heroStats.maxHp) {
    spawnForgeResultText(scene, "HP уже полное", false, true);
    return;
  }
  heroHpPotions -= 1;
  const heal = Math.round(heroStats.maxHp * 0.4);
  heroStats.hp += heal;
  if (heroStats.hp > heroStats.maxHp) heroStats.hp = heroStats.maxHp;

  spawnForgeResultText(scene, "+HP банка (" + heal + ")", true, true);
  updateHeroUI();
  saveGame();
}

function useMpPotion(scene) {
  if (heroMpPotions <= 0) {
    spawnForgeResultText(scene, "Нет MP банок", false, true);
    return;
  }
  if (heroStats.mp >= heroStats.maxMp) {
    spawnForgeResultText(scene, "MP уже полное", false, true);
    return;
  }
  heroMpPotions -= 1;
  const heal = Math.round(heroStats.maxMp * 0.4);
  heroStats.mp += heal;
  if (heroStats.mp > heroStats.maxMp) heroStats.mp = heroStats.maxMp;

  spawnForgeResultText(scene, "+MP банка (" + heal + ")", true, true);
  updateHeroUI();
  saveGame();
}

// ====== БАФЫ СВИТКАМИ ======

function usePAtkBuff(scene) {
  if (heroPAtkScrolls <= 0) {
    spawnForgeResultText(scene, "Нет свитков +P.ATK", false, true);
    return;
  }
  heroPAtkScrolls -= 1;
  buffPActive = true;
  if (buffPTimer) {
    buffPTimer.remove(false);
    buffPTimer = null;
  }
  buffPTimer = scene.time.delayedCall(
    BUFF_DURATION_MS,
    () => {
      buffPActive = false;
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
  if (heroMAtkScrolls <= 0) {
    spawnForgeResultText(scene, "Нет свитков +M.ATK", false, true);
    return;
  }
  heroMAtkScrolls -= 1;
  buffMActive = true;
  if (buffMTimer) {
    buffMTimer.remove(false);
    buffMTimer = null;
  }
  buffMTimer = scene.time.delayedCall(
    BUFF_DURATION_MS,
    () => {
      buffMActive = false;
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
  if (isAttacking) return;
  if (!enemyAlive) return;
  if (!hero || !enemy) return;
  if (heroStats.hp <= 0) return;

  isAttacking = true;
  const attackX = enemy.x - 80;
  const useEtherShot =
    typeof autoHuntEnabled !== "undefined" &&
    autoHuntEnabled &&
    typeof heroEther !== "undefined" &&
    heroEther > 0;

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
