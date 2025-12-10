"use strict";

// ================== ВЫБОР РАСЫ/КЛАССА ==================

function openSelectionPanelIfNeeded(scene) {
  if (heroMeta.race && heroMeta.heroClass) return;

  const hasProgress =
    heroStats.level > 1 ||
    heroStats.exp > 0 ||
    heroGold > 0 ||
    heroKills > 0;

  // если уже есть прогресс — автоназначаем дефолт и не показываем окно
  if (hasProgress) {
    if (!heroMeta.race) heroMeta.race = "human";
    if (!heroMeta.heroClass) heroMeta.heroClass = "knight";
    return;
  }

  createSelectionUI(scene);
}

function createSelectionUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  selectedRaceId = null;
  selectedClassId = null;

  selectionPanel = scene.add
    .rectangle(w / 2, h / 2, 600, 360, 0x000000, 0.92)
    .setStrokeStyle(2, 0xffffff)
    .setInteractive();
  selectionPanel.setDepth(50);

  selectionText = scene.add
    .text(w / 2, h / 2 - 140, "Создание героя\nВыбери расу и класс", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(51);

  const raceY = h / 2 - 40;
  const raceStartX = w / 2 - 200;
  const raceGapX = 200;
  raceButtons = [];

  RACES.forEach((race, index) => {
    const x = raceStartX + raceGapX * index;
    const rect = scene.add
      .rectangle(x, raceY, 160, 50, 0x333333)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(50);
    const txt = scene.add
      .text(x, raceY, race.label, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(51);
    rect.on("pointerdown", () => setRaceSelection(race.id));
    raceButtons.push({ id: race.id, rect, txt });
  });

  const classY = h / 2 + 40;
  const classStartX = w / 2 - 200;
  const classGapX = 200;
  classButtons = [];

  CLASSES.forEach((cls, index) => {
    const x = classStartX + classGapX * index;
    const rect = scene.add
      .rectangle(x, classY, 160, 50, 0x333333)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(50);
    const txt = scene.add
      .text(x, classY, cls.label, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(51);
    rect.on("pointerdown", () => setClassSelection(cls.id));
    classButtons.push({ id: cls.id, rect, txt });
  });

  confirmButton = scene.add
    .rectangle(w / 2, h / 2 + 130, 200, 44, 0x555555)
    .setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .setDepth(50);
  confirmButtonText = scene.add
    .text(w / 2, h / 2 + 130, "Играть", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(51);

  confirmButton.on("pointerdown", () => confirmRaceClassSelection(scene));
}

function setRaceSelection(raceId) {
  selectedRaceId = raceId;
  raceButtons.forEach((btn) => {
    btn.rect.fillColor = btn.id === raceId ? 0x1e7f1e : 0x333333;
  });
}

function setClassSelection(classId) {
  selectedClassId = classId;
  classButtons.forEach((btn) => {
    btn.rect.fillColor = btn.id === classId ? 0x1e7f1e : 0x333333;
  });
}

function confirmRaceClassSelection(scene) {
  if (!selectedRaceId || !selectedClassId) {
    spawnForgeResultText(
      scene,
      "Сначала выбери расу и класс",
      false,
      true
    );
    return;
  }

  applyHeroPreset(selectedRaceId, selectedClassId);

  if (selectionPanel) {
    selectionPanel.destroy();
    selectionPanel = null;
  }
  if (selectionText) {
    selectionText.destroy();
    selectionText = null;
  }
  raceButtons.forEach((btn) => {
    btn.rect.destroy();
    btn.txt.destroy();
  });
  raceButtons = [];
  classButtons.forEach((btn) => {
    btn.rect.destroy();
    btn.txt.destroy();
  });
  classButtons = [];
  if (confirmButton) {
    confirmButton.destroy();
    confirmButton = null;
  }
  if (confirmButtonText) {
    confirmButtonText.destroy();
    confirmButtonText = null;
  }

  updateHeroUI();
  saveGame();
}

function applyHeroPreset(raceId, classId) {
  heroMeta.race = raceId;
  heroMeta.heroClass = classId;

  let baseHp, baseMp, baseMinAtk, baseMaxAtk, baseCrit, baseCritMult;
  switch (classId) {
    case "knight":
      baseHp = 140;
      baseMp = 40;
      baseMinAtk = 12;
      baseMaxAtk = 20;
      baseCrit = 0.15;
      baseCritMult = 1.8;
      break;
    case "mage":
      baseHp = 80;
      baseMp = 110;
      baseMinAtk = 18;
      baseMaxAtk = 26;
      baseCrit = 0.2;
      baseCritMult = 2.0;
      break;
    case "rogue":
      baseHp = 100;
      baseMp = 60;
      baseMinAtk = 14;
      baseMaxAtk = 30;
      baseCrit = 0.35;
      baseCritMult = 2.2;
      break;
    default:
      baseHp = 100;
      baseMp = 50;
      baseMinAtk = 10;
      baseMaxAtk = 20;
      baseCrit = 0.25;
      baseCritMult = 2.0;
      break;
  }

  let hpMul = 1,
    mpMul = 1,
    atkMul = 1,
    critMul = 1;
  switch (raceId) {
    case "human":
      break;
    case "elf":
      hpMul = 0.9;
      mpMul = 1.15;
      atkMul = 0.95;
      critMul = 1.1;
      break;
    case "darkelf":
      hpMul = 1.05;
      mpMul = 0.9;
      atkMul = 1.15;
      critMul = 1.05;
      break;
  }

  const finalHp = Math.round(baseHp * hpMul);
  const finalMp = Math.round(baseMp * mpMul);
  const finalMinAtk = Math.round(baseMinAtk * atkMul);
  const finalMaxAtk = Math.round(baseMaxAtk * atkMul);
  const finalCrit = Math.min(0.6, baseCrit * critMul);

  heroStats.level = 1;
  heroStats.exp = 0;
  heroStats.expToNext = 100;
  heroStats.maxHp = finalHp;
  heroStats.hp = finalHp;
  heroStats.maxMp = finalMp;
  heroStats.mp = finalMp;
  heroStats.minAttack = finalMinAtk;
  heroStats.maxAttack = finalMaxAtk;
  heroStats.critChance = finalCrit;
  heroStats.critMultiplier = baseCritMult;

  heroGold = 0;
  heroKills = 0;
  heroEliteKills = 0;
  heroEther = 50;
  heroHpPotions = 5;
  heroMpPotions = 3;
  heroPAtkScrolls = 2;
  heroMAtkScrolls = 2;
  inventoryItems = [];
  heroArenaRating = 0;

  questKillCompleted = false;
  questGoldCompleted = false;
  questEliteCompleted = false;

  equippedWeapon = null;
  equippedArmor = null;
  equippedJewelry1 = null;
  equippedJewelry2 = null;

  updateMercStatsFromHero();
}

// ================== СТАРТОВЫЙ СПЛЭШ ==================

function showSplash(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  splashPanel = scene.add
    .rectangle(w / 2, h / 2, w, h, 0x000000, 0.95)
    .setDepth(40)
    .setInteractive();
  splashLogoText = scene.add
    .text(w / 2, h / 2 - 40, "POCKET LINEAGE", {
      fontFamily: "Arial",
      fontSize: "38px",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(41);
  splashLoadingText = scene.add
    .text(w / 2, h / 2 + 20, "Загрузка", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(41);

  let dots = 0;
  splashDotsEvent = scene.time.addEvent({
    delay: 400,
    loop: true,
    callback: () => {
      dots = (dots + 1) % 4;
      if (splashLoadingText) {
        splashLoadingText.setText("Загрузка" + ".".repeat(dots));
      }
    },
  });

  scene.time.delayedCall(
    1800,
    () => {
      hideSplash(scene);
      startGameFlow(scene);
    },
    null,
    scene
  );
}

function hideSplash(scene) {
  if (splashDotsEvent) {
    splashDotsEvent.remove(false);
    splashDotsEvent = null;
  }
  if (splashPanel) {
    splashPanel.destroy();
    splashPanel = null;
  }
  if (splashLogoText) {
    splashLogoText.destroy();
    splashLogoText = null;
  }
  if (splashLoadingText) {
    splashLoadingText.destroy();
    splashLoadingText = null;
  }
}

function startGameFlow(scene) {
  applyOfflineProgress(scene);
  openSelectionPanelIfNeeded(scene);
  updateHeroUI();
}
