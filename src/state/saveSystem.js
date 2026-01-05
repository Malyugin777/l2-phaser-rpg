"use strict";

// ============================================================
//  SAVE SYSTEM — Сохранение и загрузка прогресса
//  SAVE_VERSION берётся из heroState.js
// ============================================================

function saveGame() {
  try {
    const timestamp = Date.now();
    progress.lastSessionTime = timestamp;

    const data = {
      v: SAVE_VERSION,

      // Основные данные
      stats: stats,
      profile: profile,
      wallet: wallet,
      resources: resources,
      consumables: consumables,
      progress: progress,
      equipment: equipment,
      inventory: inventory,
      skills: skills,
      buffs: buffs,
      quests: quests,
      mercenary: mercenary,
      pet: pet,
      heroModifiers: heroModifiers,
      arenaState: arenaState,

      // Arena (new system)
      arenaData: typeof arenaData !== "undefined" ? arenaData : null,
      arenaHistory: typeof arenaHistory !== "undefined" ? arenaHistory : null,

      // Глобальные переменные
      currentLocationIndex: typeof currentLocationIndex !== "undefined" ? currentLocationIndex : 0,
      isDungeonRun: typeof isDungeonRun !== "undefined" ? isDungeonRun : false,
      dungeonKills: typeof dungeonKills !== "undefined" ? dungeonKills : 0,
      musicMuted: typeof musicMuted !== "undefined" ? musicMuted : false,
    };

    localStorage.setItem("pocketChroniclesSave", JSON.stringify(data));
  } catch (e) {
    console.warn("[Save] Error saving game", e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem("pocketChroniclesSave");
    if (!raw) return false;

    const data = JSON.parse(raw);

    // Проверка версии сейва
    if (data.v !== SAVE_VERSION) {
      console.warn("[Save] Version mismatch (got " + data.v + ", need " + SAVE_VERSION + "), resetting save");
      localStorage.removeItem("pocketChroniclesSave");
      return false;
    }

    // Загрузка данных
    if (data.stats) Object.assign(stats, data.stats);
    if (data.profile) Object.assign(profile, data.profile);
    if (data.wallet) Object.assign(wallet, data.wallet);
    if (data.resources) Object.assign(resources, data.resources);
    if (data.consumables) Object.assign(consumables, data.consumables);
    if (data.progress) Object.assign(progress, data.progress);
    if (data.equipment) Object.assign(equipment, data.equipment);
    if (data.skills) Object.assign(skills, data.skills);
    if (data.buffs) Object.assign(buffs, data.buffs);
    if (data.quests) Object.assign(quests, data.quests);
    if (data.mercenary) Object.assign(mercenary, data.mercenary);
    if (data.pet) Object.assign(pet, data.pet);
    if (data.heroModifiers) Object.assign(heroModifiers, data.heroModifiers);
    if (data.arenaState) Object.assign(arenaState, data.arenaState);

    // Arena (new system)
    if (data.arenaData && typeof arenaData !== "undefined") {
      Object.assign(arenaData, data.arenaData);
    }
    if (data.arenaHistory && typeof arenaHistory !== "undefined") {
      arenaHistory.matches = data.arenaHistory.matches || [];
    }

    if (data.inventory && Array.isArray(data.inventory)) {
      inventory.length = 0;
      inventory.push(...data.inventory);
    }

    // Глобальные переменные
    if (typeof data.currentLocationIndex === "number") {
      currentLocationIndex = data.currentLocationIndex;
    }
    if (typeof data.isDungeonRun === "boolean") {
      isDungeonRun = data.isDungeonRun;
    }
    if (typeof data.dungeonKills === "number") {
      dungeonKills = data.dungeonKills;
    }
    if (typeof data.musicMuted === "boolean") {
      musicMuted = data.musicMuted;
    }

    return true;
  } catch (e) {
    console.warn("[Save] Error loading game", e);
    return false;
  }
}

function migrateOldSave(data) {
  console.log("[Save] Migrating old save to version 2...");

  // stats
  if (data.heroStats) Object.assign(stats, data.heroStats);

  // profile
  if (data.heroMeta) {
    profile.race = data.heroMeta.race || null;
    profile.archetype = data.heroMeta.archetype || null;
    profile.profession = data.heroMeta.profession || null;
  }

  // wallet
  if (typeof data.heroGold === "number") wallet.gold = data.heroGold;
  if (typeof data.heroEther === "number") wallet.ether = data.heroEther;

  // consumables
  if (typeof data.heroHpPotions === "number") consumables.hpPotions = data.heroHpPotions;
  if (typeof data.heroMpPotions === "number") consumables.mpPotions = data.heroMpPotions;
  if (typeof data.heroPAtkScrolls === "number") consumables.pAtkScrolls = data.heroPAtkScrolls;
  if (typeof data.heroMAtkScrolls === "number") consumables.mAtkScrolls = data.heroMAtkScrolls;

  // progress
  if (typeof data.heroKills === "number") progress.kills = data.heroKills;
  if (typeof data.heroEliteKills === "number") progress.eliteKills = data.heroEliteKills;
  if (typeof data.heroArenaRating === "number") progress.arenaRating = data.heroArenaRating;
  if (typeof data.lastSessionTime === "number") progress.lastSessionTime = data.lastSessionTime;

  // equipment
  if (typeof data.equippedWeapon === "string") equipment.weapon = data.equippedWeapon;
  if (typeof data.equippedArmor === "string") equipment.armor = data.equippedArmor;
  if (typeof data.equippedJewelry1 === "string") equipment.jewelry1 = data.equippedJewelry1;
  if (typeof data.equippedJewelry2 === "string") equipment.jewelry2 = data.equippedJewelry2;

  // inventory - ВАЖНО: не делать inventory = ..., только push
  if (Array.isArray(data.inventoryItems)) {
    inventory.length = 0;
    inventory.push(...data.inventoryItems);
  }

  // skills
  if (Array.isArray(data.learnedSkills)) skills.learned = data.learnedSkills;
  if (data.skillSlots) {
    skills.slots.slot1 = data.skillSlots.slot1 || null;
    skills.slots.slot2 = data.skillSlots.slot2 || null;
  }

  // quests
  if (typeof data.questKillCompleted === "boolean") quests.killQuestDone = data.questKillCompleted;
  if (typeof data.questGoldCompleted === "boolean") quests.goldQuestDone = data.questGoldCompleted;
  if (typeof data.questEliteCompleted === "boolean") quests.eliteQuestDone = data.questEliteCompleted;

  // mercenary
  if (typeof data.mercActive === "boolean") mercenary.active = data.mercActive;
  if (data.mercStats) Object.assign(mercenary, data.mercStats);

  // globals
  if (typeof data.currentLocationIndex === "number") {
    currentLocationIndex = data.currentLocationIndex;
  }
  if (typeof data.isDungeonRun === "boolean") {
    isDungeonRun = data.isDungeonRun;
  }
  if (typeof data.dungeonKills === "number") {
    dungeonKills = data.dungeonKills;
  }
  if (typeof data.musicMuted === "boolean") {
    musicMuted = data.musicMuted;
  }

  // Сохраняем в новом формате
  saveGame();
  console.log("[Save] Migration complete!");
}
