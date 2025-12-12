"use strict";

// ============================================================
//  UI LAYOUT — Координаты и создание элементов интерфейса
//  Стиль: Lineage M (мобильный, компактный)
// ============================================================

// ----- КОНСТАНТЫ РАЗМЕРОВ -----
const UI_PADDING = 10;
const BAR_WIDTH = 180;
const BAR_HEIGHT = 18;
const BUTTON_WIDTH = 70;
const BUTTON_HEIGHT = 40;
const ICON_SIZE = 44;
const SKILL_BUTTON_SIZE = 56;

// ----- ЦВЕТА -----
const UI_COLORS = {
  hpBar: 0xcc3333,
  hpBarBg: 0x660000,
  mpBar: 0x3366cc,
  mpBarBg: 0x003366,
  expBar: 0xcccc33,
  expBarBg: 0x666600,
  buttonBg: 0x333333,
  buttonBorder: 0x888888,
  panelBg: 0x000000,
  panelBorder: 0xffffff,
  textWhite: "#ffffff",
  textGold: "#ffd700",
  textGray: "#aaaaaa",
};

// ----- ПОЗИЦИИ (относительно экрана) -----
function getUIPositions(w, h) {
  return {
    // === ВЕРХНИЙ ЛЕВЫЙ: HP/MP бары ===
    hpBar: { x: UI_PADDING, y: UI_PADDING, w: BAR_WIDTH, h: BAR_HEIGHT },
    mpBar: { x: UI_PADDING, y: UI_PADDING + BAR_HEIGHT + 4, w: BAR_WIDTH, h: BAR_HEIGHT },
    
    // === ВЕРХНИЙ ЦЕНТР: Валюта ===
    currency: { x: w / 2, y: UI_PADDING + 10 },
    
    // === ВЕРХНИЙ ПРАВЫЙ: Меню иконки ===
    menuIcons: {
      startX: w - UI_PADDING - ICON_SIZE,
      y: UI_PADDING,
      gap: ICON_SIZE + 6,
      icons: ["≡", "⚙", "📦", "📋"]  // Меню, Статы, Инвентарь, Квесты
    },
    
    // === КНОПКА ГОРОДА (в бою) ===
    cityButton: { x: w - UI_PADDING - ICON_SIZE, y: UI_PADDING + ICON_SIZE + 60 },
    
    // === ЛЕВЫЙ НИЗ: Уровень, EXP ===
    levelBox: { x: UI_PADDING, y: h - 70 },
    expBar: { x: UI_PADDING, y: h - 35, w: 120, h: 12 },
    
    // === ЦЕНТР НИЗ: Банки + Сесть ===
    potions: {
      x: w / 2 - 80,
      y: h - 60,
      gap: 70
    },
    sitButton: { x: w / 2 + 60, y: h - 60, w: 50, h: 50 }, // Справа от банок
    
    // === ПРАВЫЙ НИЗ: Скиллы + Shots + Auto + Атака ===
    skills: {
      skill1: { x: w - 200, y: h - 110 },
      skill2: { x: w - 200, y: h - 50 },
      shots: { x: w - 140, y: h - 110 },   // Рядом с S1
      auto: { x: w - 140, y: h - 50 },     // Рядом с S2
      attack: { x: w - 60, y: h - 80, size: 70 }
    },
    
    // === ЦЕНТР: Название локации ===
    locationLabel: { x: w / 2, y: UI_PADDING + 50 },
    
    // === ГОРОД: NPC кнопки (иконки внизу по центру) ===
    npcButtons: {
      y: h - 100,
      centerX: w / 2,
      gap: 70,
      npcs: [
        { icon: "🗺️", label: "Карта" },
        { icon: "🔨", label: "Кузнец" },
        { icon: "🛒", label: "Магазин" },
        { icon: "⚔️", label: "Арена" },
        { icon: "🏰", label: "Данж" },
        { icon: "👤", label: "Наёмник" }
      ]
    },
    
    // === ЛОКАЦИЯ: Выбор локации ===
    locationNav: {
      prev: { x: w / 2 - 120, y: h - 30 },
      next: { x: w / 2 + 120, y: h - 30 },
      label: { x: w / 2, y: h - 30 }
    },
    
    // === ВРАГ ===
    enemy: {
      sprite: { x: w / 2 + 80, y: h / 2 - 20 },
      hpBar: { x: w / 2 + 80, y: h / 2 - 80, w: 100, h: 12 },
      name: { x: w / 2 + 80, y: h / 2 - 100 }
    },
    
    // === ГЕРОЙ ===
    hero: {
      city: { x: w / 2 - 100, y: h / 2 + 30 },
      location: { x: w / 2 - 80, y: h / 2 }
    }
  };
}

// ----- UI ЭЛЕМЕНТЫ (глобальные ссылки) -----
let uiElements = {
  // Бары
  hpBarBg: null,
  hpBarFill: null,
  hpText: null,
  mpBarBg: null,
  mpBarFill: null,
  mpText: null,
  expBarBg: null,
  expBarFill: null,
  
  // Верх
  currencyText: null,
  menuButtons: [],
  
  // Низ лево
  levelText: null,
  expText: null,
  sitButton: null,
  sitButtonText: null,
  
  // Низ центр
  hpPotionBtn: null,
  hpPotionText: null,
  mpPotionBtn: null,
  mpPotionText: null,
  
  // Низ право
  skill1Btn: null,
  skill1Text: null,
  skill2Btn: null,
  skill2Text: null,
  shotsBtn: null,
  shotsText: null,
  autoBtn: null,
  autoText: null,
  attackBtn: null,
  attackText: null,
  
  // Кнопка города (в бою)
  cityBtn: null,
  cityText: null,
  
  // Центр
  locationLabel: null,
  
  // NPC
  npcButtons: [],
  
  // Навигация локаций
  locPrevBtn: null,
  locNextBtn: null,
  locNavLabel: null
};

// ============================================================
//  СОЗДАНИЕ UI
// ============================================================

function createGameUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const pos = getUIPositions(w, h);
  
  createTopLeftUI(scene, pos);
  createTopCenterUI(scene, pos);
  createTopRightUI(scene, pos);
  createBottomLeftUI(scene, pos);
  createBottomCenterUI(scene, pos);
  createBottomRightUI(scene, pos);
  createCenterUI(scene, pos);
  createNPCButtons(scene, pos);
  createLocationNav(scene, pos);
  
  // Сразу скрываем навигацию локаций (не нужна)
  uiElements.locPrevBtn.setVisible(false);
  uiElements.locNextBtn.setVisible(false);
  uiElements.locNavLabel.setVisible(false);
}

// ----- ВЕРХНИЙ ЛЕВЫЙ: HP/MP -----
function createTopLeftUI(scene, pos) {
  const depth = 20;
  
  // HP Bar
  uiElements.hpBarBg = scene.add.rectangle(
    pos.hpBar.x + pos.hpBar.w / 2,
    pos.hpBar.y + pos.hpBar.h / 2,
    pos.hpBar.w, pos.hpBar.h,
    UI_COLORS.hpBarBg
  ).setDepth(depth).setStrokeStyle(1, 0x000000);
  
  uiElements.hpBarFill = scene.add.rectangle(
    pos.hpBar.x + pos.hpBar.w / 2,
    pos.hpBar.y + pos.hpBar.h / 2,
    pos.hpBar.w, pos.hpBar.h,
    UI_COLORS.hpBar
  ).setDepth(depth + 1);
  
  uiElements.hpText = scene.add.text(
    pos.hpBar.x + pos.hpBar.w / 2,
    pos.hpBar.y + pos.hpBar.h / 2,
    "100/100", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: UI_COLORS.textWhite,
      stroke: "#000000",
      strokeThickness: 2
    }
  ).setOrigin(0.5).setDepth(depth + 2);
  
  // MP Bar
  uiElements.mpBarBg = scene.add.rectangle(
    pos.mpBar.x + pos.mpBar.w / 2,
    pos.mpBar.y + pos.mpBar.h / 2,
    pos.mpBar.w, pos.mpBar.h,
    UI_COLORS.mpBarBg
  ).setDepth(depth).setStrokeStyle(1, 0x000000);
  
  uiElements.mpBarFill = scene.add.rectangle(
    pos.mpBar.x + pos.mpBar.w / 2,
    pos.mpBar.y + pos.mpBar.h / 2,
    pos.mpBar.w, pos.mpBar.h,
    UI_COLORS.mpBar
  ).setDepth(depth + 1);
  
  uiElements.mpText = scene.add.text(
    pos.mpBar.x + pos.mpBar.w / 2,
    pos.mpBar.y + pos.mpBar.h / 2,
    "50/50", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: UI_COLORS.textWhite,
      stroke: "#000000",
      strokeThickness: 2
    }
  ).setOrigin(0.5).setDepth(depth + 2);
}

// ----- ВЕРХНИЙ ЦЕНТР: Валюта -----
function createTopCenterUI(scene, pos) {
  uiElements.currencyText = scene.add.text(
    pos.currency.x, pos.currency.y,
    "💎 50  🪙 0", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: UI_COLORS.textGold,
      stroke: "#000000",
      strokeThickness: 3
    }
  ).setOrigin(0.5).setDepth(20);
}

// ----- ВЕРХНИЙ ПРАВЫЙ: Меню иконки -----
function createTopRightUI(scene, pos) {
  const icons = pos.menuIcons.icons;
  const actions = ["openMainMenu", "openStats", "openInventory", "openQuests"];
  
  uiElements.menuButtons = [];
  
  icons.forEach((icon, i) => {
    const x = pos.menuIcons.startX - (i * pos.menuIcons.gap);
    const btn = scene.add.rectangle(x, pos.menuIcons.y + ICON_SIZE / 2, ICON_SIZE, ICON_SIZE, UI_COLORS.buttonBg)
      .setStrokeStyle(2, UI_COLORS.buttonBorder)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    
    const txt = scene.add.text(x, pos.menuIcons.y + ICON_SIZE / 2, icon, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: UI_COLORS.textWhite
    }).setOrigin(0.5).setDepth(21);
    
    uiElements.menuButtons.push({ btn, txt, action: actions[i] });
  });
  
  // Кнопка "В город" (видна только в локации)
  uiElements.cityBtn = scene.add.rectangle(
    pos.cityButton.x, pos.cityButton.y,
    ICON_SIZE, ICON_SIZE, 0x1a5c1a
  ).setStrokeStyle(2, 0x33aa33)
   .setInteractive({ useHandCursor: true })
   .setDepth(20);
  
  uiElements.cityText = scene.add.text(
    pos.cityButton.x, pos.cityButton.y,
    "🏠", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: UI_COLORS.textWhite
    }
  ).setOrigin(0.5).setDepth(21);
}

// ----- НИЖНИЙ ЛЕВЫЙ: Уровень, EXP, Сесть -----
function createBottomLeftUI(scene, pos) {
  // Уровень
  uiElements.levelText = scene.add.text(
    pos.levelBox.x, pos.levelBox.y,
    "Lv.1", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: UI_COLORS.textWhite,
      stroke: "#000000",
      strokeThickness: 4
    }
  ).setDepth(20);
  
  // EXP текст
  uiElements.expText = scene.add.text(
    pos.expBar.x, pos.expBar.y + 18,
    "EXP 0%", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: UI_COLORS.textGray
    }
  ).setDepth(20);
  
  // EXP Bar
  uiElements.expBarBg = scene.add.rectangle(
    pos.expBar.x + pos.expBar.w / 2,
    pos.expBar.y + pos.expBar.h / 2,
    pos.expBar.w, pos.expBar.h,
    UI_COLORS.expBarBg
  ).setDepth(20).setStrokeStyle(1, 0x000000);
  
  uiElements.expBarFill = scene.add.rectangle(
    pos.expBar.x + 1,
    pos.expBar.y + pos.expBar.h / 2,
    1, pos.expBar.h - 2,
    UI_COLORS.expBar
  ).setOrigin(0, 0.5).setDepth(21);
  
  // Кнопка Сесть
  uiElements.sitButton = scene.add.rectangle(
    pos.sitButton.x + pos.sitButton.w / 2,
    pos.sitButton.y + pos.sitButton.h / 2,
    pos.sitButton.w, pos.sitButton.h,
    UI_COLORS.buttonBg
  ).setStrokeStyle(2, UI_COLORS.buttonBorder)
   .setInteractive({ useHandCursor: true })
   .setDepth(20);
  
  uiElements.sitButtonText = scene.add.text(
    pos.sitButton.x + pos.sitButton.w / 2,
    pos.sitButton.y + pos.sitButton.h / 2,
    "⛺", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: UI_COLORS.textWhite
    }
  ).setOrigin(0.5).setDepth(21);
}

// ----- НИЖНИЙ ЦЕНТР: Банки -----
function createBottomCenterUI(scene, pos) {
  // HP Potion
  uiElements.hpPotionBtn = scene.add.rectangle(
    pos.potions.x, pos.potions.y,
    50, 50, 0x882222
  ).setStrokeStyle(2, UI_COLORS.buttonBorder)
   .setInteractive({ useHandCursor: true })
   .setDepth(20);
  
  uiElements.hpPotionText = scene.add.text(
    pos.potions.x, pos.potions.y,
    "💊\n5", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ff6666",
      align: "center"
    }
  ).setOrigin(0.5).setDepth(21);
  
  // MP Potion
  uiElements.mpPotionBtn = scene.add.rectangle(
    pos.potions.x + pos.potions.gap, pos.potions.y,
    50, 50, 0x222288
  ).setStrokeStyle(2, UI_COLORS.buttonBorder)
   .setInteractive({ useHandCursor: true })
   .setDepth(20);
  
  uiElements.mpPotionText = scene.add.text(
    pos.potions.x + pos.potions.gap, pos.potions.y,
    "💧\n3", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#6666ff",
      align: "center"
    }
  ).setOrigin(0.5).setDepth(21);
}

// ----- НИЖНИЙ ПРАВЫЙ: Скиллы + Атака -----
function createBottomRightUI(scene, pos) {
  // Skill 1
  uiElements.skill1Btn = scene.add.rectangle(
    pos.skills.skill1.x, pos.skills.skill1.y,
    SKILL_BUTTON_SIZE, SKILL_BUTTON_SIZE, UI_COLORS.buttonBg
  ).setStrokeStyle(2, 0x6666ff)
   .setInteractive({ useHandCursor: true })
   .setDepth(20);
  
  uiElements.skill1Text = scene.add.text(
    pos.skills.skill1.x, pos.skills.skill1.y,
    "S1", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: UI_COLORS.textWhite
    }
  ).setOrigin(0.5).setDepth(21);
  
  // Skill 2
  uiElements.skill2Btn = scene.add.rectangle(
    pos.skills.skill2.x, pos.skills.skill2.y,
    SKILL_BUTTON_SIZE, SKILL_BUTTON_SIZE, UI_COLORS.buttonBg
  ).setStrokeStyle(2, 0x6666ff)
   .setInteractive({ useHandCursor: true })
   .setDepth(20);
  
  uiElements.skill2Text = scene.add.text(
    pos.skills.skill2.x, pos.skills.skill2.y,
    "S2", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: UI_COLORS.textWhite
    }
  ).setOrigin(0.5).setDepth(21);
  
  // Shots toggle
  uiElements.shotsBtn = scene.add.rectangle(
    pos.skills.shots.x, pos.skills.shots.y,
    SKILL_BUTTON_SIZE, SKILL_BUTTON_SIZE, UI_COLORS.buttonBg
  ).setStrokeStyle(2, 0xffcc00)
   .setInteractive({ useHandCursor: true })
   .setDepth(20);
  
  uiElements.shotsText = scene.add.text(
    pos.skills.shots.x, pos.skills.shots.y,
    "💎", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: UI_COLORS.textWhite
    }
  ).setOrigin(0.5).setDepth(21);
  
  // Auto button
  uiElements.autoBtn = scene.add.rectangle(
    pos.skills.auto.x, pos.skills.auto.y,
    SKILL_BUTTON_SIZE, SKILL_BUTTON_SIZE, UI_COLORS.buttonBg
  ).setStrokeStyle(2, 0x66ff66)
   .setInteractive({ useHandCursor: true })
   .setDepth(20);
  
  uiElements.autoText = scene.add.text(
    pos.skills.auto.x, pos.skills.auto.y,
    "AUTO", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: UI_COLORS.textWhite
    }
  ).setOrigin(0.5).setDepth(21);
  
  // Attack button (большая)
  uiElements.attackBtn = scene.add.circle(
    pos.skills.attack.x, pos.skills.attack.y,
    pos.skills.attack.size / 2, 0x883333
  ).setStrokeStyle(3, 0xff6666)
   .setInteractive({ useHandCursor: true })
   .setDepth(20);
  
  uiElements.attackText = scene.add.text(
    pos.skills.attack.x, pos.skills.attack.y,
    "⚔", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: UI_COLORS.textWhite
    }
  ).setOrigin(0.5).setDepth(21);
}

// ----- ЦЕНТР: Название локации -----
function createCenterUI(scene, pos) {
  uiElements.locationLabel = scene.add.text(
    pos.locationLabel.x, pos.locationLabel.y,
    "Talking Island Village", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: UI_COLORS.textWhite,
      stroke: "#000000",
      strokeThickness: 3
    }
  ).setOrigin(0.5).setDepth(20);
}

// ----- NPC КНОПКИ (город) -----
function createNPCButtons(scene, pos) {
  const npcs = pos.npcButtons.npcs;
  const actions = ["openMap", "openForge", "openShop", "openArena", "openDungeon", "openMerc"];
  
  uiElements.npcButtons = [];
  
  const totalWidth = (npcs.length - 1) * pos.npcButtons.gap;
  const startX = pos.npcButtons.centerX - totalWidth / 2;
  
  npcs.forEach((npc, i) => {
    const x = startX + (i * pos.npcButtons.gap);
    
    // Круглая кнопка
    const btn = scene.add.circle(x, pos.npcButtons.y, 28, UI_COLORS.buttonBg)
      .setStrokeStyle(2, UI_COLORS.buttonBorder)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    
    // Иконка
    const icon = scene.add.text(x, pos.npcButtons.y - 2, npc.icon, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: UI_COLORS.textWhite
    }).setOrigin(0.5).setDepth(21);
    
    // Подпись под кнопкой
    const txt = scene.add.text(x, pos.npcButtons.y + 38, npc.label, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: UI_COLORS.textGray,
      stroke: "#000000",
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(21);
    
    uiElements.npcButtons.push({ btn, icon, txt, action: actions[i] });
  });
}

// ----- НАВИГАЦИЯ ЛОКАЦИЙ (СКРЫТА - не создаём) -----
function createLocationNav(scene, pos) {
  // Навигация через карту — эти элементы не нужны
  // Создаём пустышки чтобы не было ошибок
  uiElements.locPrevBtn = scene.add.rectangle(0, 0, 1, 1, 0x000000).setVisible(false);
  uiElements.locNextBtn = scene.add.rectangle(0, 0, 1, 1, 0x000000).setVisible(false);
  uiElements.locNavLabel = scene.add.text(0, 0, "").setVisible(false);
}

// ============================================================
//  ОБНОВЛЕНИЕ UI
// ============================================================

function updateUIBars() {
  if (!uiElements.hpBarFill) return;
  
  const w = 180; // BAR_WIDTH
  
  // HP
  const hpRatio = stats.hp / stats.maxHp;
  uiElements.hpBarFill.width = Math.max(1, w * hpRatio);
  uiElements.hpText.setText(stats.hp + "/" + stats.maxHp);
  
  // MP
  const mpRatio = stats.mp / stats.maxMp;
  uiElements.mpBarFill.width = Math.max(1, w * mpRatio);
  uiElements.mpText.setText(stats.mp + "/" + stats.maxMp);
  
  // EXP
  const expRatio = stats.exp / stats.expToNext;
  uiElements.expBarFill.width = Math.max(1, 118 * expRatio);
  uiElements.expText.setText("EXP " + Math.floor(expRatio * 100) + "%");
  
  // Level + EXP%
  const expPercent = Math.floor((stats.exp / stats.expToNext) * 100);
  uiElements.levelText.setText("Lv." + stats.level + " (" + expPercent + "%)");
  
  // Currency
  const gold = wallet.gold || 0;
  const ether = wallet.ether || 0;
  uiElements.currencyText.setText("💎 " + ether + "  🪙 " + gold);
  
  // Potions
  uiElements.hpPotionText.setText("💊\n" + consumables.hpPotions);
  uiElements.mpPotionText.setText("💧\n" + consumables.mpPotions);
}

function updateUIForMode(currentMode) {
  const isCity = currentMode === "city";
  
  // NPC кнопки — только в городе
  uiElements.npcButtons.forEach(npc => {
    npc.btn.setVisible(isCity);
    if (npc.icon) npc.icon.setVisible(isCity);
    npc.txt.setVisible(isCity);
  });
  
  // Навигация локаций — СКРЫТА (телепорт через карту)
  uiElements.locPrevBtn.setVisible(false);
  uiElements.locNextBtn.setVisible(false);
  uiElements.locNavLabel.setVisible(false);
  
  // Боевые кнопки — только в локации
  const inBattle = !isCity;
  uiElements.attackBtn.setVisible(inBattle);
  uiElements.attackText.setVisible(inBattle);
  uiElements.skill1Btn.setVisible(inBattle);
  uiElements.skill1Text.setVisible(inBattle);
  uiElements.skill2Btn.setVisible(inBattle);
  uiElements.skill2Text.setVisible(inBattle);
  uiElements.shotsBtn.setVisible(inBattle);
  uiElements.shotsText.setVisible(inBattle);
  uiElements.autoBtn.setVisible(inBattle);
  uiElements.autoText.setVisible(inBattle);
  uiElements.sitButton.setVisible(inBattle);
  uiElements.sitButtonText.setVisible(inBattle);
  
  // Банки — только в локации
  uiElements.hpPotionBtn.setVisible(inBattle);
  uiElements.hpPotionText.setVisible(inBattle);
  uiElements.mpPotionBtn.setVisible(inBattle);
  uiElements.mpPotionText.setVisible(inBattle);
  
  // Кнопка города — только в локации
  if (uiElements.cityBtn) uiElements.cityBtn.setVisible(inBattle);
  if (uiElements.cityText) uiElements.cityText.setVisible(inBattle);
  
  // EXP бар — только в локации, но уровень ВСЕГДА
  uiElements.expBarBg.setVisible(inBattle);
  uiElements.expBarFill.setVisible(inBattle);
  uiElements.expText.setVisible(inBattle);
  uiElements.levelText.setVisible(true); // Уровень виден всегда!
  
  // Обновляем label
  if (isCity) {
    uiElements.locationLabel.setText("Talking Island Village");
  } else {
    const loc = getCurrentLocation();
    uiElements.locationLabel.setText(loc.name + " (Lv." + loc.recommendedLevel + "+)");
  }
}

function updateSkillButtons() {
  if (!uiElements.skill1Text) return;
  
  const s1 = skills.slots.slot1;
  const s2 = skills.slots.slot2;
  
  uiElements.skill1Text.setText(s1 ? s1.substring(0, 4) : "S1");
  uiElements.skill2Text.setText(s2 ? s2.substring(0, 4) : "S2");
}

function updateAutoButton(isActive) {
  if (!uiElements.autoBtn) return;
  uiElements.autoBtn.fillColor = isActive ? 0x336633 : UI_COLORS.buttonBg;
  uiElements.autoText.setColor(isActive ? "#66ff66" : UI_COLORS.textWhite);
}

function updateSitButton(isResting) {
  if (!uiElements.sitButton) return;
  uiElements.sitButton.fillColor = isResting ? 0x336633 : UI_COLORS.buttonBg;
}

function updateShotsButton(isOn) {
  if (!uiElements.shotsBtn) return;
  uiElements.shotsBtn.fillColor = isOn ? 0x665500 : UI_COLORS.buttonBg;
}