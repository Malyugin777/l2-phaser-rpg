"use strict";

// ----- Офлайн-прогресс -----

function applyOfflineProgress(scene) {
  if (!progress.lastSessionTime) return;
  const now = Date.now();
  let diff = now - progress.lastSessionTime;
  if (diff < OFFLINE_MIN_THRESHOLD_MS) return;
  let minutes = Math.floor(diff / 60000);
  if (minutes > OFFLINE_MAX_MINUTES) minutes = OFFLINE_MAX_MINUTES;

  const loc = getCurrentLocation();
  const offlineKills = minutes;
  
  // Получаем средние награды с мобов локации
  let avgGold = 10;
  let avgExp = 20;
  let avgSp = 2;
  
  if (loc.mobs && loc.mobs.length > 0) {
    let totalGold = 0;
    let totalExp = 0;
    let totalSp = 0;
    
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
  
  const goldGain = offlineKills * avgGold;
  const expGain = offlineKills * avgExp;
  const spGain = offlineKills * avgSp;
  const etherGain = Math.floor(offlineKills / 10);
  const offlineEliteKills = Math.floor(offlineKills * 0.1);

  wallet.gold += goldGain;
  progress.kills += offlineKills;
  progress.eliteKills += offlineEliteKills;
  wallet.ether += etherGain;
  stats.exp += expGain;
  stats.sp += spGain;

  while (stats.exp >= stats.expToNext) {
    stats.exp -= stats.expToNext;
    levelUp(scene);
  }

  checkQuestCompletion(scene);
  updateHeroUI();
  saveGame();
  showOfflinePopup(
    scene,
    minutes,
    offlineKills,
    goldGain,
    expGain,
    spGain,
    etherGain,
    offlineEliteKills
  );
}

function showOfflinePopup(
  scene,
  minutes,
  kills,
  goldGain,
  expGain,
  spGain,
  etherGain,
  eliteKills
) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const lines = [
    "Пока тебя не было: " + minutes + " мин",
    "",
    "Гном нафармил:",
    " • " + kills + " убийств",
    " • " + goldGain + " адены",
    " • " + expGain + " EXP",
    " • " + spGain + " SP",
  ];
  if (etherGain > 0) lines.push(" • " + etherGain + " Эфира");
  if (eliteKills > 0) lines.push(" • " + eliteKills + " элитных убийств");

  const panel = scene.add
    .rectangle(w / 2, h / 2, 520, 280, 0x000000, 0.9)
    .setStrokeStyle(2, 0xffffff);
  const text = scene.add
    .text(w / 2, h / 2, lines.join("\n"), {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5);

  panel.setDepth(30);
  text.setDepth(31);

  scene.tweens.add({
    targets: [panel, text],
    alpha: { from: 1, to: 0 },
    delay: 2500,
    duration: 800,
    ease: "Power1",
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