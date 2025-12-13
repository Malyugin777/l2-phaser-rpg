"use strict";

// ----- Офлайн-прогресс v2 (MVP) -----

// Константы MVP
const OFFLINE_CAP_SECONDS = 3 * 3600;  // 3 часа максимум
const OFFLINE_MULT = 0.15;              // 15% от онлайна
const AVG_KILL_TIME = 20;               // секунд на моба

// TODO: Будущие фичи
// const AD_CAP_SECONDS = 6 * 3600;     // 6 часов за рекламу
// const PREMIUM_CAP_SECONDS = 12 * 3600; // 12 часов премиум
// const PREMIUM_MULT = 0.30;           // 30% для премиума

function applyOfflineProgress(scene) {
  // Guard: нет времени последней сессии
  if (!progress.lastSessionTime) return;

  const now = Date.now();
  let elapsedSeconds = (now - progress.lastSessionTime) / 1000;

  // Guard: меньше минуты — игнорируем
  if (elapsedSeconds < 60) return;

  // Guard: отрицательное время (часы сбились)
  if (elapsedSeconds < 0) elapsedSeconds = 0;

  // Обновляем время сразу
  progress.lastSessionTime = now;

  // === ГОРОД: фарм не шёл ===
  if (progress.lastMode === "city" || !progress.lastMode) {
    showCityRestPopup(scene, Math.floor(elapsedSeconds / 60));
    saveGame();
    return;
  }

  // === ЛОКАЦИЯ: считаем награды ===
  const effectiveSeconds = Math.min(elapsedSeconds, OFFLINE_CAP_SECONDS);
  const kills = Math.floor(effectiveSeconds / AVG_KILL_TIME);

  if (kills <= 0) return;

  // Берём данные локации где вышел
  const locIndex = progress.lastLocationIndex || 0;
  const loc = locations && locations[locIndex] ? locations[locIndex] : null;

  // Средние награды с мобов локации
  let avgGold = 10;
  let avgExp = 20;
  let avgSp = 2;

  if (loc && loc.mobs && loc.mobs.length > 0) {
    let totalGold = 0, totalExp = 0, totalSp = 0;

    for (const mob of loc.mobs) {
      const mobGoldMin = mob.gold ? mob.gold[0] : 5;
      const mobGoldMax = mob.gold ? mob.gold[1] : 15;
      totalGold += (mobGoldMin + mobGoldMax) / 2;
      totalExp += mob.exp || 20;
      totalSp += mob.sp || 2;
    }

    avgGold = Math.round(totalGold / loc.mobs.length);
    avgExp = Math.round(totalExp / loc.mobs.length);
    avgSp = Math.round(totalSp / loc.mobs.length);
  }

  // Награды с оффлайн множителем
  const goldGain = Math.floor(kills * avgGold * OFFLINE_MULT);
  const expGain = Math.floor(kills * avgExp * OFFLINE_MULT);
  const spGain = Math.floor(kills * avgSp * OFFLINE_MULT);

  // Начисляем
  wallet.gold += goldGain;
  stats.exp += expGain;
  stats.sp += spGain;
  progress.kills += kills;

  // Левелап если нужно
  while (stats.exp >= stats.expToNext) {
    stats.exp -= stats.expToNext;
    if (typeof levelUp === "function") levelUp(scene);
  }

  // UI
  if (typeof checkQuestCompletion === "function") checkQuestCompletion(scene);
  if (typeof updateHeroUI === "function") updateHeroUI();
  saveGame();

  // Popup с наградами
  showOfflinePopup(scene, Math.floor(effectiveSeconds / 60), kills, goldGain, expGain, spGain);
}

function showCityRestPopup(scene, minutes) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const lines = [
    "Пока тебя не было: " + minutes + " мин",
    "",
    "Герой отдыхал в городе",
    "Оффлайн фарм не шёл",
    "",
    "Выйди в локацию перед выходом",
    "чтобы копить награды!"
  ];

  const panel = scene.add
    .rectangle(w / 2, h / 2, 320, 220, 0x000000, 0.9)
    .setStrokeStyle(2, 0x888888);
  const text = scene.add
    .text(w / 2, h / 2, lines.join("\n"), {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#aaaaaa",
      align: "center",
    })
    .setOrigin(0.5);

  panel.setDepth(30);
  text.setDepth(31);

  scene.tweens.add({
    targets: [panel, text],
    alpha: { from: 1, to: 0 },
    delay: 3000,
    duration: 800,
    onComplete: () => {
      panel.destroy();
      text.destroy();
    },
  });
}

function showOfflinePopup(scene, minutes, kills, goldGain, expGain, spGain) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const lines = [
    "Пока тебя не было: " + minutes + " мин",
    "",
    "Гном нафармил (15% от онлайна):",
    " • " + kills + " убийств",
    " • " + goldGain + " адены",
    " • " + expGain + " EXP",
    " • " + spGain + " SP"
  ];

  const panel = scene.add
    .rectangle(w / 2, h / 2, 320, 240, 0x000000, 0.9)
    .setStrokeStyle(2, 0xd4af37);
  const text = scene.add
    .text(w / 2, h / 2, lines.join("\n"), {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5);

  panel.setDepth(30);
  text.setDepth(31);

  scene.tweens.add({
    targets: [panel, text],
    alpha: { from: 1, to: 0 },
    delay: 3500,
    duration: 800,
    onComplete: () => {
      panel.destroy();
      text.destroy();
    },
  });
}

// ================== РЕГЕН HP/MP ==================

function handleRegen() {
  // Авто-воскрешение в городе
  if (stats.hp <= 0 && mode === "city") {
    stats.hp = Math.floor(stats.maxHp * 0.1); // Воскрешение с 10% HP
  }

  // Множитель регена (x5 при отдыхе, x3 в городе)
  let regenMult = 1;
  if (buffs.isResting) {
    regenMult = 5;
  } else if (mode === "city") {
    regenMult = 3;
  }

  if (stats.hp > 0 && stats.hp < stats.maxHp) {
    const hpPerTick = (stats.maxHp / REGEN_TICKS_TO_FULL) * regenMult;
    hpRegenAcc += hpPerTick;
    const addHp = Math.floor(hpRegenAcc);
    if (addHp >= 1) {
      stats.hp += addHp;
      if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;
      hpRegenAcc -= addHp;
    }
  }
  if (stats.mp < stats.maxMp) {
    const mpPerTick = (stats.maxMp / REGEN_TICKS_TO_FULL) * regenMult;
    mpRegenAcc += mpPerTick;
    const addMp = Math.floor(mpRegenAcc);
    if (addMp >= 1) {
      stats.mp += addMp;
      if (stats.mp > stats.maxMp) stats.mp = stats.maxMp;
      mpRegenAcc -= addMp;
    }
  }
  updateHeroUI();
}