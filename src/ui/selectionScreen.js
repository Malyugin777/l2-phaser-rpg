"use strict";

// ================== ВАЙП АККАУНТА ==================

function wipeAccount() {
  // Сбрасываем всё в памяти
  profile.race = null;
  profile.archetype = null;
  profile.profession = null;
  
  stats.level = 1;
  stats.exp = 0;
  stats.expToNext = 100;
  stats.sp = 0;
  stats.maxHp = 100;
  stats.hp = 100;
  stats.maxMp = 50;
  stats.mp = 50;
  stats.minAttack = 10;
  stats.maxAttack = 20;
  stats.critChance = 0.25;
  stats.critMultiplier = 2.0;
  
  wallet.gold = 0;
  wallet.ether = 50;
  wallet.crystals = 0;
  
  progress.kills = 0;
  progress.eliteKills = 0;
  progress.arenaRating = 0;
  
  consumables.hpPotions = 5;
  consumables.mpPotions = 3;
  consumables.pAtkScrolls = 2;
  consumables.mAtkScrolls = 2;
  
  inventory.length = 0;
  
  quests.killQuestDone = false;
  quests.goldQuestDone = false;
  quests.eliteQuestDone = false;
  
  equipment.weapon = null;
  equipment.armor = null;
  equipment.jewelry1 = null;
  equipment.jewelry2 = null;
  
  skills.learned = [];
  skills.slots.slot1 = null;
  skills.slots.slot2 = null;
  
  pet.obtained = false;
  pet.active = false;
  pet.name = "";
  pet.level = 1;
  
  mercenary.active = false;
  
  buffs.pAtkActive = false;
  buffs.mAtkActive = false;
  buffs.soulshotsOn = false;
  buffs.spiritshotsOn = false;
  buffs.isResting = false;
  
  currentLocationIndex = 0;
  
  // Очищаем localStorage
  localStorage.removeItem("l2rpg_save");
  
  // Перезагружаем
  location.reload();
}

// ================== ВЫБОР РАСЫ/КЛАССА ==================

function openSelectionPanelIfNeeded(scene) {
  if (profile.race && profile.archetype) return;

  const hasProgress =
    stats.level > 1 ||
    stats.exp > 0 ||
    wallet.gold > 0 ||
    progress.kills > 0;

  // если уже есть прогресс — автоназначаем дефолт и не показываем окно
  if (hasProgress) {
    if (!profile.race) profile.race = "human";
    if (!profile.archetype) profile.archetype = "fighter";
    return;
  }

  createSelectionUI(scene);
}

function createSelectionUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  selectedRaceId = null;
  selectedClassId = null;

  // Полноэкранный overlay
  selectionPanel = scene.add
    .rectangle(w / 2, h / 2, w, h, 0x000000, 0.85)
    .setInteractive();
  selectionPanel.setDepth(50);

  // Заголовок
  selectionText = scene.add
    .text(w / 2, 120, "СОЗДАНИЕ ГЕРОЯ", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#d4af37",
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(51);

  // Подзаголовок "Выбери расу"
  scene.add
    .text(w / 2, 180, "Выбери расу", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(51);

  // Кнопки рас — 3 в ряд
  const raceY = 260;
  const raceBtnW = 100;
  const raceBtnH = 50;
  const raceGapX = 110;
  const raceStartX = w / 2 - raceGapX;
  raceButtons = [];

  RACES.forEach((race, index) => {
    const x = raceStartX + raceGapX * index;
    const isLocked = race.id !== "human";
    const rect = scene.add
      .rectangle(x, raceY, raceBtnW, raceBtnH, isLocked ? 0x222222 : 0x333333)
      .setStrokeStyle(2, isLocked ? 0x555555 : 0xd4af37)
      .setDepth(50);

    if (!isLocked) {
      rect.setInteractive({ useHandCursor: true });
    }

    const label = isLocked ? race.label + "\n(скоро)" : race.label;
    const txt = scene.add
      .text(x, raceY, label, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: isLocked ? "#666666" : "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(51);

    if (!isLocked) {
      rect.on("pointerdown", () => setRaceSelection(race.id));
    }
    raceButtons.push({ id: race.id, rect, txt });
  });

  // Подзаголовок "Выбери класс"
  scene.add
    .text(w / 2, 340, "Выбери класс", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(51);

  // Кнопки классов — 2 кнопки
  const classY = 410;
  const classBtnW = 130;
  const classBtnH = 50;
  const classGapX = 140;
  const classStartX = w / 2 - classGapX / 2;
  classButtons = [];

  ARCHETYPES.forEach((arch, index) => {
    const x = classStartX + classGapX * index;
    const rect = scene.add
      .rectangle(x, classY, classBtnW, classBtnH, 0x333333)
      .setStrokeStyle(2, 0xd4af37)
      .setInteractive({ useHandCursor: true })
      .setDepth(50);
    const txt = scene.add
      .text(x, classY, arch.label, {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(51);
    rect.on("pointerdown", () => setClassSelection(arch.id));
    classButtons.push({ id: arch.id, rect, txt });
  });

  // Кнопка подтверждения
  confirmButton = scene.add
    .rectangle(w / 2, 520, 180, 50, 0x333333)
    .setStrokeStyle(2, 0xd4af37)
    .setInteractive({ useHandCursor: true })
    .setDepth(50);
  confirmButtonText = scene.add
    .text(w / 2, 520, "Играть", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#d4af37",
    })
    .setOrigin(0.5)
    .setDepth(51);

  confirmButton.on("pointerdown", () => confirmRaceClassSelection(scene));
}

function setRaceSelection(raceId) {
  selectedRaceId = raceId;
  raceButtons.forEach((btn) => {
    const isLocked = btn.id !== "human";
    if (!isLocked) {
      btn.rect.fillColor = btn.id === raceId ? 0x4a3a1a : 0x333333;
      btn.rect.setStrokeStyle(2, btn.id === raceId ? 0xffd700 : 0xd4af37);
    }
  });
}

function setClassSelection(classId) {
  selectedClassId = classId;
  classButtons.forEach((btn) => {
    btn.rect.fillColor = btn.id === classId ? 0x4a3a1a : 0x333333;
    btn.rect.setStrokeStyle(2, btn.id === classId ? 0xffd700 : 0xd4af37);
  });
}

function confirmRaceClassSelection(scene) {
  if (!selectedRaceId || !selectedClassId) {
    spawnForgeResultText(
      scene,
      "Сначала выбери расу и архетип",
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

function applyHeroPreset(raceId, archetypeId) {
  profile.race = raceId;
  profile.archetype = archetypeId;
  profile.profession = null;

  let baseHp, baseMp, baseMinAtk, baseMaxAtk, baseCrit, baseCritMult;
  switch (archetypeId) {
    case "fighter":
      baseHp = 140;
      baseMp = 40;
      baseMinAtk = 12;
      baseMaxAtk = 20;
      baseCrit = 0.15;
      baseCritMult = 1.8;
      break;
    case "mystic":
      baseHp = 80;
      baseMp = 110;
      baseMinAtk = 18;
      baseMaxAtk = 26;
      baseCrit = 0.2;
      baseCritMult = 2.0;
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

  stats.level = 1;
  stats.exp = 0;
  stats.expToNext = 100;
  stats.sp = 0;
  stats.maxHp = finalHp;
  stats.hp = finalHp;
  stats.maxMp = finalMp;
  stats.mp = finalMp;
  stats.minAttack = finalMinAtk;
  stats.maxAttack = finalMaxAtk;
  stats.critChance = finalCrit;
  stats.critMultiplier = baseCritMult;

  wallet.gold = 0;
  wallet.ether = 50;

  progress.kills = 0;
  progress.eliteKills = 0;
  progress.arenaRating = 0;

  consumables.hpPotions = 5;
  consumables.mpPotions = 3;
  consumables.pAtkScrolls = 2;
  consumables.mAtkScrolls = 2;

  inventory = [];

  quests.killQuestDone = false;
  quests.goldQuestDone = false;
  quests.eliteQuestDone = false;

  equipment.weapon = null;
  equipment.armor = null;
  equipment.jewelry1 = null;
  equipment.jewelry2 = null;

  skills.learned = [];
  skills.slots.slot1 = null;
  skills.slots.slot2 = null;

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