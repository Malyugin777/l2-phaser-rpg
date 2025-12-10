"use strict";

// ----- Офлайн-прогресс -----

function applyOfflineProgress(scene) {
  if (!lastSessionTime) return;
  const now = Date.now();
  let diff = now - lastSessionTime;
  if (diff < OFFLINE_MIN_THRESHOLD_MS) return;
  let minutes = Math.floor(diff / 60000);
  if (minutes > OFFLINE_MAX_MINUTES) minutes = OFFLINE_MAX_MINUTES;

  const loc = getCurrentLocation();
  const offlineKills = minutes;
  const goldGain = offlineKills * loc.goldReward;
  const expGain = offlineKills * loc.expReward;
  const etherGain = Math.floor(offlineKills / 10);
  const offlineEliteKills = Math.floor(offlineKills * 0.1);

  heroGold += goldGain;
  heroKills += offlineKills;
  heroEliteKills += offlineEliteKills;
  heroEther += etherGain;
  heroStats.exp += expGain;

  while (heroStats.exp >= heroStats.expToNext) {
    heroStats.exp -= heroStats.expToNext;
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
  ];
  if (etherGain > 0) lines.push(" • " + etherGain + " Эфира");
  if (eliteKills > 0) lines.push(" • " + eliteKills + " элитных убийств");

  const panel = scene.add
    .rectangle(w / 2, h / 2, 520, 260, 0x000000, 0.9)
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
    delay: 2000,
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
  if (heroStats.hp > 0 && heroStats.hp < heroStats.maxHp) {
    const hpPerTick = heroStats.maxHp / REGEN_TICKS_TO_FULL;
    hpRegenAcc += hpPerTick;
    const addHp = Math.floor(hpRegenAcc);
    if (addHp >= 1) {
      heroStats.hp += addHp;
      if (heroStats.hp > heroStats.maxHp) heroStats.hp = heroStats.maxHp;
      hpRegenAcc -= addHp;
    }
  }
  if (heroStats.mp < heroStats.maxMp) {
    const mpPerTick = heroStats.maxMp / REGEN_TICKS_TO_FULL;
    mpRegenAcc += mpPerTick;
    const addMp = Math.floor(mpRegenAcc);
    if (addMp >= 1) {
      heroStats.mp += addMp;
      if (heroStats.mp > heroStats.maxMp) heroStats.mp = heroStats.maxMp;
      mpRegenAcc -= addMp;
    }
  }
  updateHeroUI();
}
