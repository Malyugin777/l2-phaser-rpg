"use strict";

// ============================================================
//  game.js — ГЛАВНЫЙ ФАЙЛ ИГРЫ
//  Все данные героя теперь в heroState.js
// ============================================================

// ----- ОБЪЕКТЫ СЦЕНЫ -----
let hero;
let cityHero;
let heroStartX;
let heroStartY;
let isAttacking = false;

// ----- ВЕРХНИЙ UI -----
let heroStatsText;
let goldText;
let killsText;
let etherText;
let locationText;

// ----- НИЖНИЕ КНОПКИ -----
let inventoryButton, inventoryButtonText;
let statsButton, statsButtonText;
let questsButton, questsButtonText;
let overdriveButton, overdriveButtonText;
let modeButton, modeButtonText;
let autoButton, autoButtonText;

// стрелки локации
let locationPrevButton, locationPrevText;
let locationNextButton, locationNextText;

// ----- ПАНЕЛИ -----
let inventoryPanel, inventoryPanelText;
let statsPanel, statsPanelText;
let statsSkillsButton, statsSkillsButtonText;
let forgePanel, forgePanelText, forgeDoButton, forgeDoButtonText;
let questsPanel, questsPanelText;
let shopPanel, shopPanelText, shopBuyButton, shopBuyButtonText;
let mapPanel, mapPanelText, mapGoButton, mapGoButtonText;
let arenaPanel, arenaText, arenaFightButton, arenaFightButtonText;
let arenaBackButton, arenaBackButtonText;
let dungeonPanel, dungeonPanelText, dungeonStartButton, dungeonStartButtonText;

// панель навыков
let skillsPanel,
  skillsPanelText,
  skillsLearnButton,
  skillsLearnButtonText,
  skillsSlot1Button,
  skillsSlot1ButtonText,
  skillsSlot2Button,
  skillsSlot2ButtonText,
  skillsPrevButton,
  skillsPrevButtonText,
  skillsNextButton,
  skillsNextButtonText,
  skillsCloseButton,
  skillsCloseButtonText;

let isInventoryOpen = false;
let isStatsOpen = false;
let isForgeOpen = false;
let isQuestsOpen = false;
let isShopOpen = false;
let isMapOpen = false;
let isArenaOpen = false;
let isDungeonOpen = false;
let isSkillsOpen = false;

// состояние панели навыков
let availableSkills = [];
let currentSkillIndex = 0;

// палатка (для автоохоты)
let campTent = null;
let campText = null;

// кнопки управления экипировкой в инвентаре
let inventoryEquipBestButton, inventoryEquipBestButtonText;
let inventoryUnequipAllButton, inventoryUnequipAllButtonText;

// ----- ПАНЕЛЬ СКИЛЛОВ (в бою) -----
let skill1Button, skill1ButtonText;
let skill2Button, skill2ButtonText;
let hpPotionButton, hpPotionButtonText;
let mpPotionButton, mpPotionButtonText;
let pBuffButton, pBuffButtonText;
let mBuffButton, mBuffButtonText;

// ----- АТАКИ МОБА -----
let enemyAttackEvent = null;
const ENEMY_ATTACK_INTERVAL_MS = 1800;

// ----- ВЫБОР РАСЫ / КЛАССА -----
let selectionPanel = null;
let selectionText = null;
let raceButtons = [];
let classButtons = [];
let confirmButton = null;
let confirmButtonText = null;
let selectedRaceId = null;
let selectedClassId = null;

// ----- NPC В ГОРОДЕ -----
let npcSmithRect = null,
  npcSmithText = null;
let npcMapRect = null,
  npcMapText = null;
let npcShopRect = null,
  npcShopText = null;
let npcArenaRect = null,
  npcArenaText = null;
let npcMercRect = null,
  npcMercText = null;
let npcDungeonRect = null,
  npcDungeonText = null;

// ----- PHASER КОНФИГ -----
const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: "game-container",
  backgroundColor: 0x000000,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

// ================== СПРАЙТ ГЕРОЯ (простой человечек) ==================

function createHeroSprite(scene, x, y, color) {
  const g = scene.add.graphics();
  
  // Тело (туловище)
  g.fillStyle(color, 1);
  g.fillRect(-12, -15, 24, 30);
  
  // Голова
  g.fillStyle(0xffcc99, 1); // цвет кожи
  g.fillCircle(0, -30, 14);
  
  // Глаза
  g.fillStyle(0x000000, 1);
  g.fillCircle(-5, -32, 2);
  g.fillCircle(5, -32, 2);
  
  // Ноги
  g.fillStyle(0x333333, 1);
  g.fillRect(-10, 15, 8, 25);
  g.fillRect(2, 15, 8, 25);
  
  // Руки
  g.fillStyle(color, 1);
  g.fillRect(-20, -12, 8, 20);
  g.fillRect(12, -12, 8, 20);
  
  // Меч (для воина)
  g.fillStyle(0xaaaaaa, 1);
  g.fillRect(20, -25, 4, 35);
  g.fillStyle(0x8b4513, 1);
  g.fillRect(18, 5, 8, 8);
  
  // Создаём контейнер
  const container = scene.add.container(x, y, [g]);
  container.setSize(60, 80);
  
  return container;
}

// ================== PRELOAD / UPDATE ==================

function preload() {
  this.load.audio("city_theme", "assets/audio/city_theme.mp3");
  this.load.audio("battle_theme", "assets/audio/battle_theme.mp3");

  this.load.image("talkingisland_main", "assets/backgrounds/talkingisland_main.png");
  this.load.image("obelisk_of_victory", "assets/backgrounds/obelisk_of_victory.png");
  this.load.image("northern_territory", "assets/backgrounds/northern_territory.png");
  this.load.image("elven_ruins", "assets/backgrounds/elven_ruins.png");
  this.load.image("orc_barracks", "assets/backgrounds/orc_barracks.png");
  
  // UI карта мира
  this.load.image("map_world", "assets/ui/map_world.png");
  
  // Для раннера (пока используем существующие как заглушки)
  // bg_far и bg_near - будут tileSprite
}

function update(time, delta) {
  // Тик-система (реген, кулдауны, баффы)
  if (typeof processTick === "function") {
    processTick(delta);
  }

  // Обновление раннера (если активен)
  if (mode === "runner" && typeof updateRunnerBattle === "function") {
    updateRunnerBattle(this, delta);
  }
}

// ================== CREATE ==================

function create() {
  loadGame();

  // Пересчитываем статы после загрузки
  if (typeof recalculateHeroStats === "function") {
    recalculateHeroStats();
  }

  const scene = this;
  window.gameScene = this; // для доступа из панелей
  const centerY = this.scale.height / 2;
  const h = this.scale.height;
  const centerX = this.scale.width / 2;
  const w = this.scale.width;

  // фоны
  cityBg = this.add.image(w / 2, h / 2, "talkingisland_main");
  cityBg.setDisplaySize(w, h);
  cityBg.setDepth(-5);

  locationBg = this.add.image(w / 2, h / 2, "obelisk_of_victory");
  locationBg.setDisplaySize(w, h);
  locationBg.setDepth(-5);
  locationBg.setVisible(false);

  // музыка
  cityMusic = scene.sound.add("city_theme", { loop: true, volume: 0.6 });
  battleMusic = scene.sound.add("battle_theme", { loop: true, volume: 0.6 });

  // герой/враг для локации
  heroStartX = this.scale.width * 0.2;
  heroStartY = centerY;
  
  // Создаём спрайт героя (простой человечек)
  hero = createHeroSprite(this, heroStartX, heroStartY, 0x3366cc);

  const enemyX = this.scale.width * 0.8;
  const enemyY = centerY;
  
  // Враг тоже человечек (красный)
  enemy = createHeroSprite(this, enemyX, enemyY, 0xcc3333);
  enemy.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-30, -40, 60, 80), hitAreaCallback: Phaser.Geom.Rectangle.Contains });

  enemyHpText = this.add
    .text(enemyX, enemyY - 60, getEnemyHpLabel(), {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    })
    .setOrigin(0.5);

  enemyAlive = true;

  // герой в городе
  cityHero = createHeroSprite(this, this.scale.width * 0.25, centerY, 0x3366cc);

  // НАЁМНИК
  merc = createHeroSprite(this, heroStartX - 80, heroStartY, 0x6a0dad);
  merc.setVisible(false);
  merc.setScale(0.8);

  // NPC КУЗНЕЦ
  npcSmithRect = this.add.rectangle(
    this.scale.width * 0.6,
    centerY - 60,
    140,
    50,
    0x444444
  );
  npcSmithRect.setStrokeStyle(2, 0xffffff);
  npcSmithRect.setInteractive({ useHandCursor: true });
  npcSmithText = this.add
    .text(npcSmithRect.x, npcSmithRect.y, "Кузнец", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // NPC КАРТА МИРА
  npcMapRect = this.add.rectangle(
    this.scale.width * 0.6,
    centerY - 130,
    160,
    50,
    0x444444
  );
  npcMapRect.setStrokeStyle(2, 0xffffff);
  npcMapRect.setInteractive({ useHandCursor: true });
  npcMapText = this.add
    .text(npcMapRect.x, npcMapRect.y, "Карта мира", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // NPC МАГАЗИН
  npcShopRect = this.add.rectangle(
    this.scale.width * 0.8,
    centerY - 20,
    160,
    50,
    0x444444
  );
  npcShopRect.setStrokeStyle(2, 0xffffff);
  npcShopRect.setInteractive({ useHandCursor: true });
  npcShopText = this.add
    .text(npcShopRect.x, npcShopRect.y, "Магазин", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // NPC АРЕНА
  npcArenaRect = this.add.rectangle(
    this.scale.width * 0.8,
    centerY + 70,
    160,
    50,
    0x444444
  );
  npcArenaRect.setStrokeStyle(2, 0xffffff);
  npcArenaRect.setInteractive({ useHandCursor: true });
  npcArenaText = this.add
    .text(npcArenaRect.x, npcArenaRect.y, "Арена", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // NPC НАЁМНИК
  npcMercRect = this.add.rectangle(
    this.scale.width * 0.25,
    centerY + 110,
    160,
    50,
    0x444444
  );
  npcMercRect.setStrokeStyle(2, 0xffffff);
  npcMercRect.setInteractive({ useHandCursor: true });
  npcMercText = this.add
    .text(npcMercRect.x, npcMercRect.y, "Наёмник", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // NPC ДАНЖ
  npcDungeonRect = this.add.rectangle(
    this.scale.width * 0.5,
    centerY + 170,
    160,
    50,
    0x444444
  );
  npcDungeonRect.setStrokeStyle(2, 0xffffff);
  npcDungeonRect.setInteractive({ useHandCursor: true });
  npcDungeonText = this.add
    .text(npcDungeonRect.x, npcDungeonRect.y, "Данж", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // верхний UI
  heroStatsText = this.add.text(16, 16, getHeroStatsLabel(), {
    fontFamily: "Arial",
    fontSize: "18px",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 3,
  });

  goldText = this.add.text(16, 42, getGoldLabel(), {
    fontFamily: "Arial",
    fontSize: "18px",
    color: "#ffd700",
    stroke: "#000000",
    strokeThickness: 3,
  });

  killsText = this.add.text(16, 68, getKillsLabel(), {
    fontFamily: "Arial",
    fontSize: "18px",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 3,
  });

  etherText = this.add.text(16, 94, getEtherLabel(), {
    fontFamily: "Arial",
    fontSize: "18px",
    color: "#7fffd4",
    stroke: "#000000",
    strokeThickness: 3,
  });

  // переключатель музыки
  musicToggleButton = this.add.rectangle(
    this.scale.width - 110,
    24,
    180,
    32,
    0x333333
  );
  musicToggleButton.setStrokeStyle(2, 0xffffff);
  musicToggleButton.setInteractive({ useHandCursor: true });
  musicToggleButtonText = this.add
    .text(this.scale.width - 110, 24, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
    })
    .setOrigin(0.5);
  musicToggleButton.on("pointerdown", () => {
    toggleMusicMute();
  });
  updateMusicToggleLabel();

  locationText = this.add
    .text(centerX, 16, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center",
    })
    .setOrigin(0.5);

  // стрелки локаций
  locationPrevButton = this.add.rectangle(centerX - 200, 52, 40, 32, 0x333333);
  locationPrevButton.setStrokeStyle(2, 0xffffff);
  locationPrevButton.setInteractive({ useHandCursor: true });
  locationPrevText = this.add
    .text(centerX - 200, 52, "<", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  locationNextButton = this.add.rectangle(centerX + 200, 52, 40, 32, 0x333333);
  locationNextButton.setStrokeStyle(2, 0xffffff);
  locationNextButton.setInteractive({ useHandCursor: true });
  locationNextText = this.add
    .text(centerX + 200, 52, ">", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // нижние кнопки
  const invX = 90;
  const statsX = 260;
  const questsX = 430;
  const overdriveX = 600;
  const modeX = 770;
  const autoX = 940;

  inventoryButton = this.add.rectangle(invX, h - 40, 160, 40, 0x333333);
  inventoryButton.setStrokeStyle(2, 0xffffff);
  inventoryButton.setInteractive({ useHandCursor: true });
  inventoryButtonText = this.add
    .text(invX, h - 40, "Инвентарь", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  statsButton = this.add.rectangle(statsX, h - 40, 160, 40, 0x333333);
  statsButton.setStrokeStyle(2, 0xffffff);
  statsButton.setInteractive({ useHandCursor: true });
  statsButtonText = this.add
    .text(statsX, h - 40, "Статы", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  questsButton = this.add.rectangle(questsX, h - 40, 160, 40, 0x333333);
  questsButton.setStrokeStyle(2, 0xffffff);
  questsButton.setInteractive({ useHandCursor: true });
  questsButtonText = this.add
    .text(questsX, h - 40, "Квесты", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  overdriveButton = this.add.rectangle(overdriveX, h - 40, 160, 40, 0x333333);
  overdriveButton.setStrokeStyle(2, 0xffffff);
  overdriveButton.setInteractive({ useHandCursor: true });
  overdriveButtonText = this.add
    .text(overdriveX, h - 40, "Перегрузка", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  modeButton = this.add.rectangle(modeX, h - 40, 160, 40, 0x333333);
  modeButton.setStrokeStyle(2, 0xffffff);
  modeButton.setInteractive({ useHandCursor: true });
  modeButtonText = this.add
    .text(modeX, h - 40, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  autoButton = this.add.rectangle(autoX, h - 40, 160, 40, 0x333333);
  autoButton.setStrokeStyle(2, 0xffffff);
  autoButton.setInteractive({ useHandCursor: true });
  autoButtonText = this.add
    .text(autoX, h - 40, "Авто-охота: OFF", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // панель скиллов (внизу, боевые кнопки)
  const skillY = h - 100;

  skill1Button = this.add.rectangle(invX, skillY, 160, 40, 0x444444);
  skill1Button.setStrokeStyle(2, 0xffffff);
  skill1Button.setInteractive({ useHandCursor: true });
  skill1ButtonText = this.add
    .text(invX, skillY, "Скилл 1", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  skill2Button = this.add.rectangle(statsX, skillY, 160, 40, 0x444444);
  skill2Button.setStrokeStyle(2, 0xffffff);
  skill2Button.setInteractive({ useHandCursor: true });
  skill2ButtonText = this.add
    .text(statsX, skillY, "Скилл 2", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  hpPotionButton = this.add.rectangle(questsX, skillY, 160, 40, 0x444444);
  hpPotionButton.setStrokeStyle(2, 0xffffff);
  hpPotionButton.setInteractive({ useHandCursor: true });
  hpPotionButtonText = this.add
    .text(questsX, skillY, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  mpPotionButton = this.add.rectangle(overdriveX, skillY, 160, 40, 0x444444);
  mpPotionButton.setStrokeStyle(2, 0xffffff);
  mpPotionButton.setInteractive({ useHandCursor: true });
  mpPotionButtonText = this.add
    .text(overdriveX, skillY, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  pBuffButton = this.add.rectangle(modeX, skillY, 160, 40, 0x444444);
  pBuffButton.setStrokeStyle(2, 0xffffff);
  pBuffButton.setInteractive({ useHandCursor: true });
  pBuffButtonText = this.add
    .text(modeX, skillY, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  mBuffButton = this.add.rectangle(autoX, skillY, 160, 40, 0x444444);
  mBuffButton.setStrokeStyle(2, 0xffffff);
  mBuffButton.setInteractive({ useHandCursor: true });
  mBuffButtonText = this.add
    .text(autoX, skillY, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // панели
  const panelX = this.scale.width / 2;
  const panelY = this.scale.height / 2;

  // --- Инвентарь ---
  inventoryPanel = this.add.rectangle(
    panelX,
    panelY,
    420,
    260,
    0x000000,
    0.85
  );
  inventoryPanel.setStrokeStyle(2, 0xffffff);
  inventoryPanelText = this.add
    .text(panelX, panelY, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 380 },
    })
    .setOrigin(0.5);

  // кнопки управления экипировкой в инвентаре
  inventoryEquipBestButton = this.add.rectangle(
    panelX,
    panelY + 90,
    200,
    40,
    0x555555
  );
  inventoryEquipBestButton.setStrokeStyle(2, 0xffffff);
  inventoryEquipBestButton.setInteractive({ useHandCursor: true });
  inventoryEquipBestButtonText = this.add
    .text(panelX, panelY + 90, "Надеть лучшее", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  inventoryUnequipAllButton = this.add.rectangle(
    panelX,
    panelY + 130,
    200,
    36,
    0x555555
  );
  inventoryUnequipAllButton.setStrokeStyle(2, 0xffffff);
  inventoryUnequipAllButton.setInteractive({ useHandCursor: true });
  inventoryUnequipAllButtonText = this.add
    .text(panelX, panelY + 130, "Снять всё", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // --- Статы ---
  statsPanel = this.add.rectangle(panelX, panelY, 420, 260, 0x000000, 0.85);
  statsPanel.setStrokeStyle(2, 0xffffff);
  statsPanelText = this.add
    .text(panelX, panelY - 20, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 380 },
    })
    .setOrigin(0.5);

  // кнопка "Навыки" на панели статов
  statsSkillsButton = this.add.rectangle(
    panelX,
    panelY + 90,
    200,
    36,
    0x555555
  );
  statsSkillsButton.setStrokeStyle(2, 0xffffff);
  statsSkillsButton.setInteractive({ useHandCursor: true });
  statsSkillsButtonText = this.add
    .text(panelX, panelY + 90, "Навыки", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // --- Кузнец / Точка ---
  forgePanel = this.add.rectangle(panelX, panelY, 420, 320, 0x000000, 0.9);
  forgePanel.setStrokeStyle(2, 0xffffff);
  forgePanelText = this.add
    .text(panelX, panelY - 20, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 380 },
    })
    .setOrigin(0.5);
  forgeDoButton = this.add.rectangle(panelX, panelY + 110, 180, 40, 0x555555);
  forgeDoButton.setStrokeStyle(2, 0xffffff);
  forgeDoButton.setInteractive({ useHandCursor: true });
  forgeDoButtonText = this.add
    .text(panelX, panelY + 110, "Точить", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // --- Квесты ---
  questsPanel = this.add.rectangle(panelX, panelY, 420, 260, 0x000000, 0.9);
  questsPanel.setStrokeStyle(2, 0xffffff);
  questsPanelText = this.add
    .text(panelX, panelY, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 380 },
    })
    .setOrigin(0.5);

  // --- Магазин ---
  shopPanel = this.add.rectangle(panelX, panelY, 420, 260, 0x000000, 0.9);
  shopPanel.setStrokeStyle(2, 0xffffff);
  shopPanelText = this.add
    .text(panelX, panelY - 30, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 380 },
    })
    .setOrigin(0.5);
  shopBuyButton = this.add.rectangle(panelX, panelY + 90, 240, 40, 0x555555);
  shopBuyButton.setStrokeStyle(2, 0xffffff);
  shopBuyButton.setInteractive({ useHandCursor: true });
  shopBuyButtonText = this.add
    .text(panelX, panelY + 90, "Купить набор (50 адены)", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // --- Карта мира ---
  mapPanel = this.add.rectangle(panelX, panelY, 520, 320, 0x000000, 0.9);
  mapPanel.setStrokeStyle(2, 0xffffff);
  mapPanel.setDepth(29);
  mapPanelText = this.add
    .text(panelX, panelY - 30, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 460 },
    })
    .setOrigin(0.5)
    .setDepth(29);
  mapGoButton = this.add.rectangle(panelX, panelY + 110, 220, 40, 0x555555);
  mapGoButton.setStrokeStyle(2, 0xffffff);
  mapGoButton.setInteractive({ useHandCursor: true });
  mapGoButton.setDepth(29);
  mapGoButtonText = this.add
    .text(panelX, panelY + 110, "В путь", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setDepth(29);

  // --- Арена ---
  arenaPanel = this.add.rectangle(panelX, panelY, 520, 320, 0x000000, 0.9);
  arenaPanel.setStrokeStyle(2, 0xffffff);
  arenaText = this.add
    .text(panelX, panelY - 40, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 460 },
    })
    .setOrigin(0.5);
  arenaFightButton = this.add.rectangle(
    panelX - 130,
    panelY + 110,
    200,
    40,
    0x555555
  );
  arenaFightButton.setStrokeStyle(2, 0xffffff);
  arenaFightButton.setInteractive({ useHandCursor: true });
  arenaFightButtonText = this.add
    .text(panelX - 130, panelY + 110, "Начать бой", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);
  arenaBackButton = this.add.rectangle(
    panelX + 130,
    panelY + 110,
    200,
    40,
    0x555555
  );
  arenaBackButton.setStrokeStyle(2, 0xffffff);
  arenaBackButton.setInteractive({ useHandCursor: true });
  arenaBackButtonText = this.add
    .text(panelX + 130, panelY + 110, "Закрыть", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // --- Данж ---
  dungeonPanel = this.add.rectangle(panelX, panelY, 520, 320, 0x000000, 0.9);
  dungeonPanel.setStrokeStyle(2, 0xffffff);
  dungeonPanelText = this.add
    .text(panelX, panelY - 30, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 460 },
    })
    .setOrigin(0.5);
  dungeonStartButton = this.add.rectangle(
    panelX,
    panelY + 110,
    220,
    40,
    0x555555
  );
  dungeonStartButton.setStrokeStyle(2, 0xffffff);
  dungeonStartButton.setInteractive({ useHandCursor: true });
  dungeonStartButtonText = this.add
    .text(panelX, panelY + 110, "Войти в данж", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // --- Панель Навыков ---
  skillsPanel = this.add.rectangle(panelX, panelY, 520, 340, 0x000000, 0.9);
  skillsPanel.setStrokeStyle(2, 0xffffff);
  skillsPanelText = this.add
    .text(panelX, panelY - 60, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 460 },
    })
    .setOrigin(0.5);

  skillsPrevButton = this.add.rectangle(
    panelX - 220,
    panelY,
    40,
    36,
    0x555555
  );
  skillsPrevButton.setStrokeStyle(2, 0xffffff);
  skillsPrevButton.setInteractive({ useHandCursor: true });
  skillsPrevButtonText = this.add
    .text(panelX - 220, panelY, "<", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  skillsNextButton = this.add.rectangle(
    panelX + 220,
    panelY,
    40,
    36,
    0x555555
  );
  skillsNextButton.setStrokeStyle(2, 0xffffff);
  skillsNextButton.setInteractive({ useHandCursor: true });
  skillsNextButtonText = this.add
    .text(panelX + 220, panelY, ">", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  skillsLearnButton = this.add.rectangle(
    panelX,
    panelY + 80,
    220,
    40,
    0x555555
  );
  skillsLearnButton.setStrokeStyle(2, 0xffffff);
  skillsLearnButton.setInteractive({ useHandCursor: true });
  skillsLearnButtonText = this.add
    .text(panelX, panelY + 80, "Выучить", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  skillsSlot1Button = this.add.rectangle(
    panelX - 130,
    panelY + 130,
    200,
    36,
    0x555555
  );
  skillsSlot1Button.setStrokeStyle(2, 0xffffff);
  skillsSlot1Button.setInteractive({ useHandCursor: true });
  skillsSlot1ButtonText = this.add
    .text(panelX - 130, panelY + 130, "В слот 1", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  skillsSlot2Button = this.add.rectangle(
    panelX + 130,
    panelY + 130,
    200,
    36,
    0x555555
  );
  skillsSlot2Button.setStrokeStyle(2, 0xffffff);
  skillsSlot2Button.setInteractive({ useHandCursor: true });
  skillsSlot2ButtonText = this.add
    .text(panelX + 130, panelY + 130, "В слот 2", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  skillsCloseButton = this.add.rectangle(
    panelX,
    panelY + 180,
    180,
    36,
    0x555555
  );
  skillsCloseButton.setStrokeStyle(2, 0xffffff);
  skillsCloseButton.setInteractive({ useHandCursor: true });
  skillsCloseButtonText = this.add
    .text(panelX, panelY + 180, "Закрыть", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

  // все всплывающие панели поверх
  [
    inventoryPanel,
    inventoryPanelText,
    inventoryEquipBestButton,
    inventoryEquipBestButtonText,
    inventoryUnequipAllButton,
    inventoryUnequipAllButtonText,
    statsPanel,
    statsPanelText,
    statsSkillsButton,
    statsSkillsButtonText,
    forgePanel,
    forgePanelText,
    forgeDoButton,
    forgeDoButtonText,
    questsPanel,
    questsPanelText,
    shopPanel,
    shopPanelText,
    shopBuyButton,
    shopBuyButtonText,
    mapPanel,
    mapPanelText,
    mapGoButton,
    mapGoButtonText,
    arenaPanel,
    arenaText,
    arenaFightButton,
    arenaFightButtonText,
    arenaBackButton,
    arenaBackButtonText,
    dungeonPanel,
    dungeonPanelText,
    dungeonStartButton,
    dungeonStartButtonText,
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
  ].forEach((obj) => obj && obj.setDepth && obj.setDepth(10));

  // создаём UI профессий (если функция существует)
  if (typeof createProfessionUI === "function") {
    createProfessionUI(this);
  }
  
  // создаём UI отдыха и shots (если функция существует)
  if (typeof createRestAndShotsUI === "function") {
    createRestAndShotsUI(this);
  }
  
  // создаём спрайт питомца (если функция существует)
  if (typeof createPetSprite === "function") {
    createPetSprite(this);
  }
  
  // создаём новый UI (Lineage M стиль)
  createGameUI(this);
  
  // создаём графическую карту
  createMapUI(this);
  
  // инициализируем раннер (для тестирования)
  if (typeof initRunnerBattle === "function") {
    initRunnerBattle(this);
  }
  
  // подключаем обработчики нового UI
  setupNewUIHandlers(scene);

  // на старте всё скрываем
  hideInventoryPanel();
  hideStatsPanel();
  hideForgePanel();
  hideQuestsPanel();
  hideShopPanel();
  hideMapPanel();
  hideArenaPanel();
  hideDungeonPanel();
  hideSkillsPanel();
  hideProfessionPanel();
  
  // скрываем старый UI
  hideOldUI();

  // первые обновления UI
  updateHeroUI();
  updateLocationLabel();
  updateSkillButtonsUI();
  updateMercStatsFromHero();

  // обработчики
  inventoryButton.on("pointerdown", () => {
    if (isInventoryOpen) hideInventoryPanel();
    else {
      hideStatsPanel();
      hideForgePanel();
      hideQuestsPanel();
      hideShopPanel();
      hideMapPanel();
      hideArenaPanel();
      hideDungeonPanel();
      hideSkillsPanel();
      showInventoryPanel();
    }
  });

  statsButton.on("pointerdown", () => {
    if (isStatsOpen) hideStatsPanel();
    else {
      hideInventoryPanel();
      hideForgePanel();
      hideQuestsPanel();
      hideShopPanel();
      hideMapPanel();
      hideArenaPanel();
      hideDungeonPanel();
      hideSkillsPanel();
      showStatsPanel();
    }
  });

  // клик по кнопке "Навыки" в панели статов
  statsSkillsButton.on("pointerdown", () => {
    openSkillsScreen(scene);
  });

  questsButton.on("pointerdown", () => {
    if (isQuestsOpen) hideQuestsPanel();
    else {
      hideInventoryPanel();
      hideStatsPanel();
      hideForgePanel();
      hideShopPanel();
      hideMapPanel();
      hideArenaPanel();
      hideDungeonPanel();
      hideSkillsPanel();
      showQuestsPanel();
    }
  });

  forgeDoButton.on("pointerdown", () => {
    performEnchant(scene);
  });

  modeButton.on("pointerdown", () => {
    if (mode === "city") enterLocation(scene);
    else enterCity(scene);
  });

  autoButton.on("pointerdown", () => {
    if (mode !== "location") return;
    if (autoHuntEnabled) disableAutoHunt();
    else enableAutoHunt(scene);
  });

  overdriveButton.on("pointerdown", () => {
    activateOverdrive(scene);
  });

  locationPrevButton.on("pointerdown", () => {
    if (mode !== "city") return;
    changeLocation(-1);
    updateMapPanel();
  });

  locationNextButton.on("pointerdown", () => {
    if (mode !== "city") return;
    changeLocation(1);
    updateMapPanel();
  });

  enemy.on("pointerdown", function () {
    if (mode !== "location") return;
    if (isAttacking) return;
    if (!enemyAlive) return;
    if (stats.hp <= 0) return;
    startHeroAttack(scene);
  });

  skill1Button.on("pointerdown", () => {
    useSkill1(scene);
  });
  skill2Button.on("pointerdown", () => {
    useSkill2(scene);
  });
  hpPotionButton.on("pointerdown", () => {
    useHpPotion(scene);
  });
  mpPotionButton.on("pointerdown", () => {
    useMpPotion(scene);
  });
  pBuffButton.on("pointerdown", () => {
    usePAtkBuff(scene);
  });
  mBuffButton.on("pointerdown", () => {
    useMAtkBuff(scene);
  });

  if (inventoryEquipBestButton) {
    inventoryEquipBestButton.on("pointerdown", () => {
      autoEquipBestItems();
      updateHeroUI();
      updateInventoryPanel();
      saveGame();
    });
  }

  if (inventoryUnequipAllButton) {
    inventoryUnequipAllButton.on("pointerdown", () => {
      unequipAllItems();
      updateHeroUI();
      updateInventoryPanel();
      saveGame();
    });
  }

  npcSmithRect.on("pointerdown", () => {
    if (mode !== "city") return;
    hideInventoryPanel();
    hideStatsPanel();
    hideQuestsPanel();
    hideShopPanel();
    hideMapPanel();
    hideArenaPanel();
    hideDungeonPanel();
    hideSkillsPanel();
    showForgePanel();
    updateForgePanel();
  });

  npcMapRect.on("pointerdown", () => {
    if (mode !== "city") return;
    if (isMapOpen) {
      hideMapPanel();
    } else {
      hideInventoryPanel();
      hideStatsPanel();
      hideForgePanel();
      hideQuestsPanel();
      hideShopPanel();
      hideArenaPanel();
      hideDungeonPanel();
      hideSkillsPanel();
      showMapPanel();
    }
  });

  npcShopRect.on("pointerdown", () => {
    if (mode !== "city") return;
    if (isShopOpen) {
      hideShopPanel();
    } else {
      hideInventoryPanel();
      hideStatsPanel();
      hideForgePanel();
      hideQuestsPanel();
      hideMapPanel();
      hideArenaPanel();
      hideDungeonPanel();
      hideSkillsPanel();
      showShopPanel();
    }
  });

  npcArenaRect.on("pointerdown", () => {
    if (mode !== "city") return;
    if (isArenaOpen) {
      hideArenaPanel();
    } else {
      hideInventoryPanel();
      hideStatsPanel();
      hideForgePanel();
      hideQuestsPanel();
      hideShopPanel();
      hideMapPanel();
      hideDungeonPanel();
      hideSkillsPanel();
      showArenaPanel();
    }
  });

  npcMercRect.on("pointerdown", () => {
    if (mode !== "city") return;
    toggleMercenary(scene);
  });

  npcDungeonRect.on("pointerdown", () => {
    if (mode !== "city") return;
    if (isDungeonOpen) {
      hideDungeonPanel();
    } else {
      hideInventoryPanel();
      hideStatsPanel();
      hideForgePanel();
      hideQuestsPanel();
      hideShopPanel();
      hideMapPanel();
      hideArenaPanel();
      hideSkillsPanel();
      showDungeonPanel();
    }
  });

  shopBuyButton.on("pointerdown", () => {
    buyStarterPack(scene);
  });

  mapGoButton.on("pointerdown", () => {
    teleportToCurrentLocation(scene);
  });

  arenaFightButton.on("pointerdown", () => {
    runArenaBattle(scene);
  });

  arenaBackButton.on("pointerdown", () => {
    hideArenaPanel();
  });

  dungeonStartButton.on("pointerdown", () => {
    startDungeonRun(scene);
  });

  // навигация по панели навыков
  skillsPrevButton.on("pointerdown", () => {
    if (!isSkillsOpen || availableSkills.length === 0) return;
    currentSkillIndex =
      (currentSkillIndex - 1 + availableSkills.length) % availableSkills.length;
    updateSkillsPanel();
  });

  skillsNextButton.on("pointerdown", () => {
    if (!isSkillsOpen || availableSkills.length === 0) return;
    currentSkillIndex = (currentSkillIndex + 1) % availableSkills.length;
    updateSkillsPanel();
  });

  skillsLearnButton.on("pointerdown", () => {
    learnCurrentSkill(scene);
  });

  skillsSlot1Button.on("pointerdown", () => {
    assignCurrentSkillToSlot(scene, "slot1");
  });

  skillsSlot2Button.on("pointerdown", () => {
    assignCurrentSkillToSlot(scene, "slot2");
  });

  skillsCloseButton.on("pointerdown", () => {
    hideSkillsPanel();
  });

  // старт в городе
  enterCity(scene);

  // автосейв при закрытии вкладки
  window.addEventListener("beforeunload", () => {
    saveGame();
  });

  // Реген теперь через tickSystem.js (processTick в update)

  // оффлайн-прогресс и выбор расы/класса
  applyOfflineProgress(scene);
  openSelectionPanelIfNeeded(scene);
  updateHeroUI();
}

// ================== НАВЫКИ: СПИСОК, УСЛОВИЯ, UI ==================

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

// ================== СОХРАНЕНИЕ / ЗАГРУЗКА ==================

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

      // Глобальные переменные
      currentLocationIndex: typeof currentLocationIndex !== "undefined" ? currentLocationIndex : 0,
      isDungeonRun: typeof isDungeonRun !== "undefined" ? isDungeonRun : false,
      dungeonKills: typeof dungeonKills !== "undefined" ? dungeonKills : 0,
      musicMuted: typeof musicMuted !== "undefined" ? musicMuted : false,
    };

    localStorage.setItem("pocketLineageSave", JSON.stringify(data));
  } catch (e) {
    console.warn("Save error", e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem("pocketLineageSave");
    if (!raw) return false;

    const data = JSON.parse(raw);

    // Проверка версии сейва
    if (data.v !== SAVE_VERSION) {
      console.warn("[Save] Version mismatch (got " + data.v + ", need " + SAVE_VERSION + "), resetting save");
      localStorage.removeItem("pocketLineageSave");
      return false;
    }

    // Загрузка данных
    if (data.stats) Object.assign(stats, data.stats);
    if (data.profile) Object.assign(profile, data.profile);
    if (data.wallet) Object.assign(wallet, data.wallet);
    if (data.consumables) Object.assign(consumables, data.consumables);
    if (data.progress) Object.assign(progress, data.progress);
    if (data.equipment) Object.assign(equipment, data.equipment);
    if (data.skills) Object.assign(skills, data.skills);
    if (data.buffs) Object.assign(buffs, data.buffs);
    if (data.quests) Object.assign(quests, data.quests);
    if (data.mercenary) Object.assign(mercenary, data.mercenary);
    if (data.pet) Object.assign(pet, data.pet);
    if (data.heroModifiers) Object.assign(heroModifiers, data.heroModifiers);
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
    console.warn("Load error", e);
    return false;
  }
}

function migrateOldSave(data) {
  console.log("Migrating old save to version 2...");

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

  // inventory
  if (Array.isArray(data.inventoryItems)) inventory = data.inventoryItems;

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
  console.log("Migration complete!");
}

// ================== UI-ХЕЛПЕРЫ ДЛЯ ТЕКСТА ==================

function getHeroStatsLabel() {
  const spText = typeof stats.sp === "number" ? stats.sp : 0;

  return (
    "Герой  Lv." +
    stats.level +
    " (" +
    stats.exp +
    "/" +
    stats.expToNext +
    " EXP)\n" +
    "SP: " +
    spText +
    "\n" +
    "HP: " +
    stats.hp +
    "/" +
    stats.maxHp +
    "   MP: " +
    stats.mp +
    "/" +
    stats.maxMp +
    "\n" +
    "Атака: " +
    stats.minAttack +
    "-" +
    stats.maxAttack +
    "  Крит: " +
    Math.round(stats.critChance * 100) +
    "%\n" +
    "Мультипликатор крита: x" +
    stats.critMultiplier.toFixed(1)
  );
}

function getGoldLabel() {
  return "Адена: " + wallet.gold;
}

function getKillsLabel() {
  return "Убийств: " + progress.kills + " (элита: " + progress.eliteKills + ")";
}

function getEtherLabel() {
  return "Эфир: " + wallet.ether;
}

function getEnemyHpLabel() {
  if (typeof enemyStats !== "undefined" && enemyStats.hp !== undefined) {
    const mobName = enemyStats.name || "Enemy";
    const mobLvl = enemyStats.level || 1;
    return mobName + " [Lv." + mobLvl + "]\nHP: " + enemyStats.hp + "/" + enemyStats.maxHp;
  }
  return "HP: ?";
}

function updateHeroUI() {
  if (heroStatsText) heroStatsText.setText(getHeroStatsLabel());
  if (goldText) goldText.setText(getGoldLabel());
  if (killsText) killsText.setText(getKillsLabel());
  if (etherText) etherText.setText(getEtherLabel());

  if (typeof updateSkillButtonsUI === "function") {
    updateSkillButtonsUI();
  }
  
  // Обновляем новый UI
  if (typeof updateNewUI === "function") {
    updateNewUI();
  }
}

function updateLocationLabel() {
  if (!locationText) return;
  if (typeof locations === "undefined") {
    locationText.setText("Локация: неизвестно");
    return;
  }

  const idx = typeof currentLocationIndex === "number" ? currentLocationIndex : 0;
  const loc = locations[idx] || locations[0];

  if (!loc) {
    locationText.setText("Локация: неизвестно");
    return;
  }

  locationText.setText(
    loc.name + "\n(рекомендуемый уровень: " + loc.recommendedLevel + "+)"
  );
}

// ============================================================
//  НОВЫЙ UI — Обработчики и скрытие старого
// ============================================================

function setupNewUIHandlers(scene) {
  if (!uiElements) return;
  
  // Меню кнопки (верх право)
  uiElements.menuButtons.forEach(item => {
    item.btn.on("pointerdown", () => {
      if (item.action === "openMainMenu") {
        // Пока ничего
      } else if (item.action === "openStats") {
        if (isStatsOpen) hideStatsPanel();
        else {
          hideAllPanels();
          showStatsPanel();
        }
      } else if (item.action === "openInventory") {
        if (isInventoryOpen) hideInventoryPanel();
        else {
          hideAllPanels();
          showInventoryPanel();
        }
      } else if (item.action === "openQuests") {
        if (isQuestsOpen) hideQuestsPanel();
        else {
          hideAllPanels();
          showQuestsPanel();
        }
      }
    });
  });
  
  // NPC кнопки (город)
  uiElements.npcButtons.forEach(item => {
    item.btn.on("pointerdown", () => {
      if (item.action === "openMap") {
        if (isMapOpen) hideMapPanel();
        else {
          hideAllPanels();
          showMapPanel();
        }
      } else if (item.action === "openForge") {
        if (isForgeOpen) hideForgePanel();
        else {
          hideAllPanels();
          showForgePanel();
        }
      } else if (item.action === "openShop") {
        if (isShopOpen) hideShopPanel();
        else {
          hideAllPanels();
          showShopPanel();
        }
      } else if (item.action === "openArena") {
        // ТЕСТ: Запуск раннера вместо арены
        if (typeof enterRunnerMode === "function") {
          hideAllPanels();
          enterRunnerMode(scene);
        } else {
          if (isArenaOpen) hideArenaPanel();
          else {
            hideAllPanels();
            showArenaPanel();
          }
        }
      } else if (item.action === "openDungeon") {
        if (isDungeonOpen) hideDungeonPanel();
        else {
          hideAllPanels();
          showDungeonPanel();
        }
      } else if (item.action === "openMerc") {
        toggleMercenary(scene);
      }
    });
  });
  
  // Навигация локаций
  uiElements.locPrevBtn.on("pointerdown", () => {
    if (mode !== "city") return;
    changeLocation(-1);
    updateMapPanel();
    uiElements.locNavLabel.setText(getCurrentLocation().name);
  });
  
  uiElements.locNextBtn.on("pointerdown", () => {
    if (mode !== "city") return;
    changeLocation(1);
    updateMapPanel();
    uiElements.locNavLabel.setText(getCurrentLocation().name);
  });
  
  // Атака
  uiElements.attackBtn.on("pointerdown", () => {
    if (mode !== "location") return;
    if (isAttacking) return;
    if (!enemyAlive) return;
    if (stats.hp <= 0) return;
    startHeroAttack(scene);
  });
  
  // Кнопка "В город"
  if (uiElements.cityBtn) {
    uiElements.cityBtn.on("pointerdown", () => {
      if (mode !== "location") return;
      enterCity(scene);
    });
  }
  
  // Скиллы
  uiElements.skill1Btn.on("pointerdown", () => {
    useSkill1(scene);
  });
  
  uiElements.skill2Btn.on("pointerdown", () => {
    useSkill2(scene);
  });
  
  // Auto
  uiElements.autoBtn.on("pointerdown", () => {
    console.log("[UI] AUTO button clicked! mode =", mode, "autoHuntEnabled =", autoHuntEnabled);
    if (mode !== "location") {
      console.log("[UI] Not in location mode, ignoring");
      return;
    }
    if (autoHuntEnabled) {
      console.log("[UI] Disabling auto hunt");
      disableAutoHunt();
    } else {
      console.log("[UI] Enabling auto hunt");
      enableAutoHunt(scene);
    }
    updateAutoButton(autoHuntEnabled);
  });
  
  // Сесть
  uiElements.sitButton.on("pointerdown", () => {
    toggleRest(scene);
    updateSitButton(buffs.isResting);
  });
  
  // Shots
  uiElements.shotsBtn.on("pointerdown", () => {
    toggleShots(scene);
    updateShotsButton(buffs.soulshotsOn || buffs.spiritshotsOn);
  });
  
  // Банки
  uiElements.hpPotionBtn.on("pointerdown", () => {
    useHpPotion(scene);
  });
  
  uiElements.mpPotionBtn.on("pointerdown", () => {
    useMpPotion(scene);
  });
}

function hideAllPanels() {
  hideInventoryPanel();
  hideStatsPanel();
  hideForgePanel();
  hideQuestsPanel();
  hideShopPanel();
  hideMapPanel();
  hideArenaPanel();
  hideDungeonPanel();
  hideSkillsPanel();
}

function hideOldUI() {
  // Скрываем старые текстовые элементы
  if (heroStatsText) heroStatsText.setVisible(false);
  if (goldText) goldText.setVisible(false);
  if (killsText) killsText.setVisible(false);
  if (etherText) etherText.setVisible(false);
  
  // Скрываем старые кнопки внизу
  if (inventoryButton) inventoryButton.setVisible(false);
  if (inventoryButtonText) inventoryButtonText.setVisible(false);
  if (statsButton) statsButton.setVisible(false);
  if (statsButtonText) statsButtonText.setVisible(false);
  if (questsButton) questsButton.setVisible(false);
  if (questsButtonText) questsButtonText.setVisible(false);
  if (overdriveButton) overdriveButton.setVisible(false);
  if (overdriveButtonText) overdriveButtonText.setVisible(false);
  if (modeButton) modeButton.setVisible(false);
  if (modeButtonText) modeButtonText.setVisible(false);
  if (autoButton) autoButton.setVisible(false);
  if (autoButtonText) autoButtonText.setVisible(false);
  
  // Скрываем старые скиллы/банки
  if (skill1Button) skill1Button.setVisible(false);
  if (skill1ButtonText) skill1ButtonText.setVisible(false);
  if (skill2Button) skill2Button.setVisible(false);
  if (skill2ButtonText) skill2ButtonText.setVisible(false);
  if (hpPotionButton) hpPotionButton.setVisible(false);
  if (hpPotionButtonText) hpPotionButtonText.setVisible(false);
  if (mpPotionButton) mpPotionButton.setVisible(false);
  if (mpPotionButtonText) mpPotionButtonText.setVisible(false);
  if (pBuffButton) pBuffButton.setVisible(false);
  if (pBuffButtonText) pBuffButtonText.setVisible(false);
  if (mBuffButton) mBuffButton.setVisible(false);
  if (mBuffButtonText) mBuffButtonText.setVisible(false);
  
  // Скрываем старые NPC
  if (npcSmithRect) npcSmithRect.setVisible(false);
  if (npcSmithText) npcSmithText.setVisible(false);
  if (npcMapRect) npcMapRect.setVisible(false);
  if (npcMapText) npcMapText.setVisible(false);
  if (npcShopRect) npcShopRect.setVisible(false);
  if (npcShopText) npcShopText.setVisible(false);
  if (npcArenaRect) npcArenaRect.setVisible(false);
  if (npcArenaText) npcArenaText.setVisible(false);
  if (npcMercRect) npcMercRect.setVisible(false);
  if (npcMercText) npcMercText.setVisible(false);
  if (npcDungeonRect) npcDungeonRect.setVisible(false);
  if (npcDungeonText) npcDungeonText.setVisible(false);
  
  // Скрываем старую навигацию локаций
  if (locationPrevButton) locationPrevButton.setVisible(false);
  if (locationPrevText) locationPrevText.setVisible(false);
  if (locationNextButton) locationNextButton.setVisible(false);
  if (locationNextText) locationNextText.setVisible(false);
  
  // Скрываем старый музыка toggle
  if (musicToggleButton) musicToggleButton.setVisible(false);
  if (musicToggleButtonText) musicToggleButtonText.setVisible(false);
  
  // Скрываем старый location text
  if (locationText) locationText.setVisible(false);
  
  // Скрываем стрелки навигации сверху
  if (typeof navPrevButton !== "undefined" && navPrevButton) navPrevButton.setVisible(false);
  if (typeof navPrevText !== "undefined" && navPrevText) navPrevText.setVisible(false);
  if (typeof navNextButton !== "undefined" && navNextButton) navNextButton.setVisible(false);
  if (typeof navNextText !== "undefined" && navNextText) navNextText.setVisible(false);
  
  // Скрываем панель скиллов если открыта
  if (typeof skillsPanel !== "undefined" && skillsPanel) skillsPanel.setVisible(false);
  if (typeof skillsPanelText !== "undefined" && skillsPanelText) skillsPanelText.setVisible(false);
  if (typeof skillsCloseButton !== "undefined" && skillsCloseButton) skillsCloseButton.setVisible(false);
  if (typeof skillsCloseButtonText !== "undefined" && skillsCloseButtonText) skillsCloseButtonText.setVisible(false);
  if (typeof skillsLearnButton !== "undefined" && skillsLearnButton) skillsLearnButton.setVisible(false);
  if (typeof skillsLearnButtonText !== "undefined" && skillsLearnButtonText) skillsLearnButtonText.setVisible(false);
  if (typeof skillsSlot1Button !== "undefined" && skillsSlot1Button) skillsSlot1Button.setVisible(false);
  if (typeof skillsSlot1ButtonText !== "undefined" && skillsSlot1ButtonText) skillsSlot1ButtonText.setVisible(false);
  if (typeof skillsSlot2Button !== "undefined" && skillsSlot2Button) skillsSlot2Button.setVisible(false);
  if (typeof skillsSlot2ButtonText !== "undefined" && skillsSlot2ButtonText) skillsSlot2ButtonText.setVisible(false);
  if (typeof skillsPrevButton !== "undefined" && skillsPrevButton) skillsPrevButton.setVisible(false);
  if (typeof skillsPrevButtonText !== "undefined" && skillsPrevButtonText) skillsPrevButtonText.setVisible(false);
  if (typeof skillsNextButton !== "undefined" && skillsNextButton) skillsNextButton.setVisible(false);
  if (typeof skillsNextButtonText !== "undefined" && skillsNextButtonText) skillsNextButtonText.setVisible(false);
}

// Интеграция с updateHeroUI
function updateNewUI() {
  if (typeof updateUIBars === "function") {
    updateUIBars();
  }
  if (typeof updateUIForMode === "function") {
    updateUIForMode(mode);
  }
  if (typeof updateSkillButtons === "function") {
    updateSkillButtons();
  }
}