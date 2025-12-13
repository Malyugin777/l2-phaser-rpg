"use strict";

// ============================================================
//  SKILLS PANEL — UI панель навыков
// ============================================================

// Переменные панели
let skillsPanel, skillsBg, skillsTitle;
let skillsPanelText;
let skillsPrevButton, skillsPrevButtonText;
let skillsNextButton, skillsNextButtonText;
let skillsLearnButton, skillsLearnButtonText;
let skillsSlot1Button, skillsSlot1ButtonText;
let skillsSlot2Button, skillsSlot2ButtonText;
let skillsCloseButton, skillsCloseButtonText;

let isSkillsOpen = false;
let availableSkills = [];
let currentSkillIndex = 0;

function openSkillsScreen(scene) {
  hideInventoryPanel();
  hideStatsPanel();
  hideForgePanel();
  hideQuestsPanel();
  hideShopPanel();
  hideMapPanel();
  hideArenaPanel();
  hideDungeonPanel();

  rebuildAvailableSkillsList();
  updateSkillsPanel();
  showSkillsPanel();
}

function rebuildAvailableSkillsList() {
  availableSkills = [];
  if (typeof SKILL_DB === "undefined" || !SKILL_DB) return;

  for (const key in SKILL_DB) {
    if (!Object.prototype.hasOwnProperty.call(SKILL_DB, key)) continue;
    if (isSkillVisibleForHero(key)) {
      availableSkills.push(key);
    }
  }
  if (availableSkills.length === 0) {
    currentSkillIndex = 0;
  } else if (currentSkillIndex >= availableSkills.length) {
    currentSkillIndex = 0;
  }
}

function learnCurrentSkill(scene) {
  if (!availableSkills || availableSkills.length === 0) return;

  const skillKey = availableSkills[currentSkillIndex];
  const requiredLevel = getSkillRequiredLevel(skillKey);

  if (isSkillLearned(skillKey)) {
    spawnForgeResultText(scene, "Скилл уже выучен", false, true);
    return;
  }

  if (stats.level < requiredLevel) {
    spawnForgeResultText(
      scene,
      "Недостаточный уровень. Нужен " + requiredLevel + " лвл",
      false,
      true
    );
    return;
  }

  const cfg = SKILL_DB && SKILL_DB[skillKey] ? SKILL_DB[skillKey] : null;

  let costSp = 0;
  let costGold = 0;

  if (cfg) {
    if (typeof cfg.costSp === "number") costSp = cfg.costSp;
    if (typeof cfg.costGold === "number") costGold = cfg.costGold;
  }

  const currentSp = typeof stats.sp === "number" ? stats.sp : 0;
  const currentGold = typeof wallet.gold === "number" ? wallet.gold : 0;

  if (currentSp < costSp) {
    spawnForgeResultText(
      scene,
      "Не хватает SP. Нужно: " + costSp + ", у тебя: " + currentSp,
      false,
      true
    );
    return;
  }

  if (currentGold < costGold) {
    spawnForgeResultText(
      scene,
      "Не хватает адены. Нужно: " + costGold + ", у тебя: " + currentGold,
      false,
      true
    );
    return;
  }

  stats.sp = currentSp - costSp;
  wallet.gold = currentGold - costGold;

  addLearnedSkill(skillKey);

  // авто-назначение в свободный слот
  if (skills.slots && !skills.slots.slot1) {
    skills.slots.slot1 = skillKey;
  } else if (skills.slots && !skills.slots.slot2) {
    skills.slots.slot2 = skillKey;
  }

  spawnForgeResultText(
    scene,
    "Вы выучили: " + skillKey + " (-" + costSp + " SP, -" + costGold + " адены)",
    true,
    true
  );

  updateHeroUI();
  updateSkillsPanel();
  updateSkillButtonsUI();
  saveGame();
}

function assignCurrentSkillToSlot(scene, slotKey) {
  if (!availableSkills || availableSkills.length === 0) return;
  const skillKey = availableSkills[currentSkillIndex];

  if (!isSkillLearned(skillKey)) {
    spawnForgeResultText(scene, "Сначала выучите навык", false, true);
    return;
  }

  if (!skills.slots || typeof skills.slots !== "object") {
    skills.slots = { slot1: null, slot2: null };
  }

  skills.slots[slotKey] = skillKey;

  const slotLabel = slotKey === "slot1" ? "1" : "2";
  spawnForgeResultText(
    scene,
    'Скилл "' + skillKey + '" назначен в слот ' + slotLabel,
    true,
    true
  );

  updateSkillButtonsUI();
  updateSkillsPanel();
  saveGame();
}

function updateSkillsPanel() {
  if (!skillsPanelText) return;

  if (!availableSkills || availableSkills.length === 0) {
    skillsPanelText.setText(
      "Навыки\n\n" +
        "Пока нет доступных навыков для вашего архетипа/профессии.\n" +
        "Сначала выберите класс и/или возьмите 20 уровень."
    );

    if (skillsLearnButton) {
      skillsLearnButton.setVisible(false);
      skillsLearnButtonText.setVisible(false);
    }
    [
      skillsSlot1Button,
      skillsSlot1ButtonText,
      skillsSlot2Button,
      skillsSlot2ButtonText,
    ].forEach((obj) => obj && obj.setVisible(false));
    return;
  }

  const skillKey = availableSkills[currentSkillIndex];
  const cfg = SKILL_DB && SKILL_DB[skillKey] ? SKILL_DB[skillKey] : null;
  const requiredLevel = getSkillRequiredLevel(skillKey);
  const learned = isSkillLearned(skillKey);

  const slot1Name = skills.slots && skills.slots.slot1 ? skills.slots.slot1 : "пусто";
  const slot2Name = skills.slots && skills.slots.slot2 ? skills.slots.slot2 : "пусто";

  const costSp = cfg && typeof cfg.costSp === "number" ? cfg.costSp : 0;
  const costGold = cfg && typeof cfg.costGold === "number" ? cfg.costGold : 0;

  const currentSp = typeof stats.sp === "number" ? stats.sp : 0;
  const currentGold = typeof wallet.gold === "number" ? wallet.gold : 0;

  let text = "Навыки\n\n";
  text += "Текущий навык: " + skillKey + "\n";

  if (cfg) {
    if (cfg.type) text += "Тип: " + cfg.type + "\n";
    if (typeof cfg.power === "number")
      text += "Множитель урона: x" + cfg.power + "\n";
    if (typeof cfg.mp === "number") text += "MP: " + cfg.mp + "\n";
    if (typeof cfg.cd === "number")
      text += "Перезарядка: " + Math.round(cfg.cd / 1000) + " c\n";
  }

  text += "\nТребуемый уровень: " + requiredLevel + "\n";
  text += "Статус: " + (learned ? "выучен" : "не выучен") + "\n";

  text += "\nСтоимость изучения: " + costSp + " SP, " + costGold + " адены\n";
  text += "У тебя сейчас: " + currentSp + " SP, " + currentGold + " адены\n";

  text += "\nСлот 1: " + slot1Name + "\n";
  text += "Слот 2: " + slot2Name + "\n";

  skillsPanelText.setText(text);

  const canLearn = !learned && stats.level >= requiredLevel;
  if (skillsLearnButton) {
    skillsLearnButton.setVisible(canLearn);
    skillsLearnButtonText.setVisible(canLearn);
  }

  const assignVisible = learned;
  [
    skillsSlot1Button,
    skillsSlot1ButtonText,
    skillsSlot2Button,
    skillsSlot2ButtonText,
  ].forEach((obj) => obj && obj.setVisible(assignVisible));
}

function showSkillsPanel() {
  isSkillsOpen = true;
  [
    skillsPanel,
    skillsPanelText,
    skillsPrevButton,
    skillsPrevButtonText,
    skillsNextButton,
    skillsNextButtonText,
    skillsLearnButton,
    skillsLearnButtonText,
    skillsSlot1Button,
    skillsSlot1ButtonText,
    skillsSlot2Button,
    skillsSlot2ButtonText,
    skillsCloseButton,
    skillsCloseButtonText,
  ].forEach((obj) => obj && obj.setVisible(true));
}

function hideSkillsPanel() {
  isSkillsOpen = false;
  [
    skillsPanel,
    skillsPanelText,
    skillsPrevButton,
    skillsPrevButtonText,
    skillsNextButton,
    skillsNextButtonText,
    skillsLearnButton,
    skillsLearnButtonText,
    skillsSlot1Button,
    skillsSlot1ButtonText,
    skillsSlot2Button,
    skillsSlot2ButtonText,
    skillsCloseButton,
    skillsCloseButtonText,
  ].forEach((obj) => obj && obj.setVisible(false));
}
