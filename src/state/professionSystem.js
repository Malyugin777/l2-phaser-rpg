"use strict";

// ============================================================
//  PROFESSION SYSTEM — Выбор профессии на 20 уровне
// ============================================================

// UI элементы
let professionButton = null;
let professionButtonText = null;
let professionPanel = null;
let professionPanelText = null;
let professionKnightBtn = null, professionKnightBtnText = null;
let professionRogueBtn = null, professionRogueBtnText = null;
let professionWizardBtn = null, professionWizardBtnText = null;
let professionCloseBtn = null, professionCloseBtnText = null;

let isProfessionPanelOpen = false;

// Создание UI (вызывается из game.js create())
function createProfessionUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const panelX = w / 2;
  const panelY = h / 2;

  // Кнопка "Профессия" на панели статов (под кнопкой "Навыки")
  professionButton = scene.add.rectangle(panelX, panelY + 130, 200, 36, 0x884400);
  professionButton.setStrokeStyle(2, 0xffaa00);
  professionButton.setInteractive({ useHandCursor: true });
  professionButton.setDepth(25);
  
  professionButtonText = scene.add
    .text(panelX, panelY + 130, "⚔ Выбрать профессию", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffdd00",
    })
    .setOrigin(0.5);
  professionButtonText.setDepth(26);

  professionButton.setVisible(false);
  professionButtonText.setVisible(false);

  // Панель выбора профессии
  professionPanel = scene.add.rectangle(panelX, panelY, 450, 300, 0x000000, 0.95);
  professionPanel.setStrokeStyle(3, 0xffaa00);
  professionPanel.setDepth(30);

  professionPanelText = scene.add
    .text(panelX, panelY - 100, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5);
  professionPanelText.setDepth(31);

  // Кнопка Knight
  professionKnightBtn = scene.add.rectangle(panelX - 140, panelY + 20, 120, 80, 0x333366);
  professionKnightBtn.setStrokeStyle(2, 0x6666ff);
  professionKnightBtn.setInteractive({ useHandCursor: true });
  professionKnightBtn.setDepth(31);
  
  professionKnightBtnText = scene.add
    .text(panelX - 140, panelY + 20, "Knight\n🛡️\nТанк", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#aaaaff",
      align: "center",
    })
    .setOrigin(0.5);
  professionKnightBtnText.setDepth(32);

  // Кнопка Rogue
  professionRogueBtn = scene.add.rectangle(panelX, panelY + 20, 120, 80, 0x336633);
  professionRogueBtn.setStrokeStyle(2, 0x66ff66);
  professionRogueBtn.setInteractive({ useHandCursor: true });
  professionRogueBtn.setDepth(31);
  
  professionRogueBtnText = scene.add
    .text(panelX, panelY + 20, "Rogue\n🗡️\nКриты", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#aaffaa",
      align: "center",
    })
    .setOrigin(0.5);
  professionRogueBtnText.setDepth(32);

  // Кнопка Wizard
  professionWizardBtn = scene.add.rectangle(panelX + 140, panelY + 20, 120, 80, 0x663366);
  professionWizardBtn.setStrokeStyle(2, 0xff66ff);
  professionWizardBtn.setInteractive({ useHandCursor: true });
  professionWizardBtn.setDepth(31);
  
  professionWizardBtnText = scene.add
    .text(panelX + 140, panelY + 20, "Wizard\n🔮\nМаг", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffaaff",
      align: "center",
    })
    .setOrigin(0.5);
  professionWizardBtnText.setDepth(32);

  // Кнопка закрыть
  professionCloseBtn = scene.add.rectangle(panelX, panelY + 120, 100, 36, 0x444444);
  professionCloseBtn.setStrokeStyle(2, 0xffffff);
  professionCloseBtn.setInteractive({ useHandCursor: true });
  professionCloseBtn.setDepth(31);
  
  professionCloseBtnText = scene.add
    .text(panelX, panelY + 120, "Закрыть", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
    })
    .setOrigin(0.5);
  professionCloseBtnText.setDepth(32);

  // Скрыть панель
  hideProfessionPanel();

  // Обработчики
  professionButton.on("pointerdown", () => {
    showProfessionPanel();
  });

  professionKnightBtn.on("pointerdown", () => {
    if (profile.archetype === "fighter") {
      applyProfession("knight", scene);
    }
  });

  professionRogueBtn.on("pointerdown", () => {
    if (profile.archetype === "fighter") {
      applyProfession("rogue", scene);
    }
  });

  professionWizardBtn.on("pointerdown", () => {
    if (profile.archetype === "mystic") {
      applyProfession("wizard", scene);
    }
  });

  professionCloseBtn.on("pointerdown", () => {
    hideProfessionPanel();
  });
}

function showProfessionPanel() {
  if (profile.profession) return; // Уже есть профессия
  if (stats.level < 20) return;   // Ещё рано

  isProfessionPanelOpen = true;

  const arch = profile.archetype;
  let title = "ВЫБОР ПРОФЕССИИ\n\nТвой архетип: " + (arch === "fighter" ? "Воин" : "Мистик");
  title += "\n\nВыбери специализацию:";
  
  professionPanelText.setText(title);

  professionPanel.setVisible(true);
  professionPanelText.setVisible(true);
  professionCloseBtn.setVisible(true);
  professionCloseBtnText.setVisible(true);

  // Показываем только доступные профессии
  if (arch === "fighter") {
    professionKnightBtn.setVisible(true);
    professionKnightBtnText.setVisible(true);
    professionRogueBtn.setVisible(true);
    professionRogueBtnText.setVisible(true);
    professionWizardBtn.setVisible(false);
    professionWizardBtnText.setVisible(false);
  } else if (arch === "mystic") {
    professionKnightBtn.setVisible(false);
    professionKnightBtnText.setVisible(false);
    professionRogueBtn.setVisible(false);
    professionRogueBtnText.setVisible(false);
    professionWizardBtn.setVisible(true);
    professionWizardBtnText.setVisible(true);
  }
}

function hideProfessionPanel() {
  isProfessionPanelOpen = false;
  
  if (professionPanel) professionPanel.setVisible(false);
  if (professionPanelText) professionPanelText.setVisible(false);
  if (professionKnightBtn) professionKnightBtn.setVisible(false);
  if (professionKnightBtnText) professionKnightBtnText.setVisible(false);
  if (professionRogueBtn) professionRogueBtn.setVisible(false);
  if (professionRogueBtnText) professionRogueBtnText.setVisible(false);
  if (professionWizardBtn) professionWizardBtn.setVisible(false);
  if (professionWizardBtnText) professionWizardBtnText.setVisible(false);
  if (professionCloseBtn) professionCloseBtn.setVisible(false);
  if (professionCloseBtnText) professionCloseBtnText.setVisible(false);
}

// Применить профессию
function applyProfession(profId, scene) {
  if (profile.profession) return; // Уже есть

  profile.profession = profId;

  // Буст статов
  switch (profId) {
    case "knight":
      stats.maxHp = Math.round(stats.maxHp * 1.3);  // +30% HP
      stats.hp = stats.maxHp;
      stats.pDef += 10;
      // Выдаём скиллы Knight
      addLearnedSkill("Shield Stun");
      addLearnedSkill("Ultimate Defense");
      spawnProfessionText(scene, "KNIGHT", "🛡️ Ты стал Рыцарем!");
      break;
      
    case "rogue":
      stats.critChance += 0.15;    // +15% крит
      stats.critMultiplier += 0.5; // +0.5 к множителю
      stats.minAttack = Math.round(stats.minAttack * 1.2);
      stats.maxAttack = Math.round(stats.maxAttack * 1.2);
      // Выдаём скиллы Rogue
      addLearnedSkill("Backstab");
      addLearnedSkill("Dash");
      spawnProfessionText(scene, "ROGUE", "🗡️ Ты стал Разбойником!");
      break;
      
    case "wizard":
      stats.maxMp = Math.round(stats.maxMp * 1.5);  // +50% MP
      stats.mp = stats.maxMp;
      stats.minAttack = Math.round(stats.minAttack * 1.3); // Маг урон
      stats.maxAttack = Math.round(stats.maxAttack * 1.3);
      // Выдаём скиллы Wizard
      addLearnedSkill("Blaze");
      addLearnedSkill("Aura Flare");
      spawnProfessionText(scene, "WIZARD", "🔮 Ты стал Волшебником!");
      break;
  }

  hideProfessionPanel();
  updateProfessionButton();
  updateStatsPanel();
  updateHeroUI();
  saveGame();
}

// Красивый текст при получении профессии
function spawnProfessionText(scene, profName, message) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const text = scene.add
    .text(w / 2, h / 2, message, {
      fontFamily: "Arial",
      fontSize: "36px",
      color: "#ffdd00",
      stroke: "#000000",
      strokeThickness: 5,
      align: "center",
    })
    .setOrigin(0.5);
  text.setDepth(50);

  scene.tweens.add({
    targets: text,
    y: text.y - 50,
    alpha: 0,
    duration: 2000,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

// Показать/скрыть кнопку профессии на панели статов
function updateProfessionButton() {
  if (!professionButton || !professionButtonText) return;

  // Показываем если: level >= 20 И профессии ещё нет
  const shouldShow = stats.level >= 20 && !profile.profession;
  
  // Кнопка видна только когда открыта панель статов
  if (isStatsOpen && shouldShow) {
    professionButton.setVisible(true);
    professionButtonText.setVisible(true);
  } else {
    professionButton.setVisible(false);
    professionButtonText.setVisible(false);
  }
}