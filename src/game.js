"use strict";

// ----- КВЕСТЫ -----
let questKillCompleted = false;
let questGoldCompleted = false;
let questEliteCompleted = false;

// ----- СКИЛЛЫ ГЕРОЯ -----
// список выученных скиллов (ID из SKILL_DB)
let learnedSkills = [];

// что лежит на кнопках Скилл 1 / Скилл 2
let skillSlots = {
  slot1: null, // например "Wind Strike"
  slot2: null, // например "Vampiric Touch"
};

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
let statsSkillsButton, statsSkillsButtonText; // кнопка "Навыки" на панели статов
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

// ----- ЛУТ / ИНВЕНТАРЬ -----
let inventoryItems = [];
const lootTable = [
  "Меч новичка",
  "Кинжал охотника",
  "Кольцо ученика",
  "Серьга путешественника",
  "Кольчуга гнома",
  "Талисман ветра",
];
const LOOT_DROP_CHANCE = 0.3;

// надетые предметы
let equippedWeapon = null;
let equippedArmor = null;
let equippedJewelry1 = null;
let equippedJewelry2 = null;

// ----- ПАНЕЛЬ СКИЛЛОВ (в бою) -----
let skill1Button, skill1ButtonText;
let skill2Button, skill2ButtonText;
let hpPotionButton, hpPotionButtonText;
let mpPotionButton, mpPotionButtonText;
let pBuffButton, pBuffButtonText;
let mBuffButton, mBuffButtonText;

// кнопки управления экипировкой в инвентаре
let inventoryEquipBestButton, inventoryEquipBestButtonText;
let inventoryUnequipAllButton, inventoryUnequipAllButtonText;

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
  width: 1024,
  height: 576,
  parent: "game-container",
  backgroundColor: 0x000000,
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

// ================== PRELOAD / UPDATE ==================

function preload() {
  // музыка
  this.load.audio("city_theme", "assets/audio/city_theme.mp3");
  this.load.audio("battle_theme", "assets/audio/battle_theme.mp3");

  // фоны
  this.load.image("bg_city", "assets/backgrounds/bg_city.png");
  this.load.image("bg_gludio", "assets/backgrounds/bg_gludio.png");
  this.load.image("bg_dion", "assets/backgrounds/bg_dion.png");
  this.load.image("bg_dragon", "assets/backgrounds/bg_dragon.png");
}

function update() {
  // пока ничего не нужно
}

// ================== CREATE ==================

function create() {
  loadGame();

  const scene = this;
  const centerY = this.scale.height / 2;
  const h = this.scale.height;
  const centerX = this.scale.width / 2;
  const w = this.scale.width;

  // фоны
  cityBg = this.add.image(w / 2, h / 2, "bg_city");
  cityBg.setDisplaySize(w, h);
  cityBg.setDepth(-5);

  locationBg = this.add.image(w / 2, h / 2, "bg_gludio");
  locationBg.setDisplaySize(w, h);
  locationBg.setDepth(-5);
  locationBg.setVisible(false);

  // музыка
  cityMusic = scene.sound.add("city_theme", { loop: true, volume: 0.6 });
  battleMusic = scene.sound.add("battle_theme", { loop: true, volume: 0.6 });

  // герой/враг для локации
  heroStartX = this.scale.width * 0.2;
  heroStartY = centerY;
  hero = this.add.rectangle(heroStartX, heroStartY, 60, 60, 0x0000ff);

  const enemyX = this.scale.width * 0.8;
  const enemyY = centerY;
  enemy = this.add.rectangle(enemyX, enemyY, 60, 60, 0xff3b1f);
  enemy.setInteractive({ useHandCursor: true });

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
  cityHero = this.add.rectangle(
    this.scale.width * 0.25,
    centerY,
    60,
    60,
    0x0000ff
  );

  // НАЁМНИК
  merc = this.add.rectangle(heroStartX - 80, heroStartY, 50, 50, 0x6a0dad);
  merc.setVisible(false);

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
  mapPanelText = this.add
    .text(panelX, panelY - 30, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "left",
      wordWrap: { width: 460 },
    })
    .setOrigin(0.5);
  mapGoButton = this.add.rectangle(panelX, panelY + 110, 220, 40, 0x555555);
  mapGoButton.setStrokeStyle(2, 0xffffff);
  mapGoButton.setInteractive({ useHandCursor: true });
  mapGoButtonText = this.add
    .text(panelX, panelY + 110, "В путь", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    })
    .setOrigin(0.5);

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
    if (heroStats.hp <= 0) return;
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

  // таймер регена
  scene.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      handleRegen();
    },
  });

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

// какие навыки вообще показывать герою
function isSkillVisibleForHero(skillKey) {
  const arch = heroMeta && heroMeta.archetype;
  const prof = heroMeta && heroMeta.profession;

  switch (skillKey) {
    // 1 профа: Fighter
    case "Power Strike":
    case "Mortal Blow":
      return arch === "fighter";
    // 1 профа: Mystic
    case "Wind Strike":
    case "Vampiric Touch":
      return arch === "mystic";
    // 2 профа: Knight
    case "Shield Stun":
    case "Ultimate Defense":
      return prof === "knight";
    // 2 профа: Rogue
    case "Backstab":
    case "Dash":
      return prof === "rogue";
    // 2 профа: Wizard
    case "Blaze":
    case "Aura Flare":
      return prof === "wizard";
    default:
      return false;
  }
}

// минимальный уровень для навыка
function getSkillRequiredLevel(skillKey) {
  switch (skillKey) {
    case "Power Strike":
    case "Mortal Blow":
    case "Wind Strike":
    case "Vampiric Touch":
      return 1;
    case "Shield Stun":
    case "Ultimate Defense":
    case "Backstab":
    case "Dash":
    case "Blaze":
    case "Aura Flare":
      return 20;
    default:
      return 1;
  }
}

function isSkillLearned(skillKey) {
  if (!Array.isArray(learnedSkills)) return false;

  // 1) храним имя навыка
  if (learnedSkills.includes(skillKey)) return true;

  // 2) на всякий случай поддержим вариант, если в массив записали id
  if (
    typeof SKILL_DB !== "undefined" &&
    SKILL_DB &&
    SKILL_DB[skillKey] &&
    SKILL_DB[skillKey].id
  ) {
    const altId = SKILL_DB[skillKey].id;
    if (learnedSkills.includes(altId)) return true;
  }
  return false;
}

function learnCurrentSkill(scene) {
  if (!availableSkills || availableSkills.length === 0) return;

  const skillKey = availableSkills[currentSkillIndex];
  const requiredLevel = getSkillRequiredLevel(skillKey);

  if (isSkillLearned(skillKey)) {
    spawnForgeResultText(scene, "Скилл уже выучен", false, true);
    return;
  }

  if (heroStats.level < requiredLevel) {
    spawnForgeResultText(
      scene,
      "Недостаточный уровень. Нужен " + requiredLevel + " лвл",
      false,
      true
    );
    return;
  }

  const cfg = typeof SKILL_DB !== "undefined" && SKILL_DB
    ? SKILL_DB[skillKey]
    : null;

  let costSp = 0;
  let costGold = 0;

  if (cfg) {
    if (typeof cfg.costSp === "number") costSp = cfg.costSp;
    if (typeof cfg.costGold === "number") costGold = cfg.costGold;
  }

  const currentSp =
    typeof heroStats.sp === "number" ? heroStats.sp : 0;
  const currentGold =
    typeof heroGold === "number" ? heroGold : 0;

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

  heroStats.sp = currentSp - costSp;
  heroGold = currentGold - costGold;

  addLearnedSkill(skillKey);
  spawnForgeResultText(
    scene,
    "Вы выучили: " +
      skillKey +
      " (-" +
      costSp +
      " SP, -" +
      costGold +
      " адены)",
    true,
    true
  );

  updateHeroUI();
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
  const cfg = typeof SKILL_DB !== "undefined" && SKILL_DB
    ? SKILL_DB[skillKey]
    : null;
  const requiredLevel = getSkillRequiredLevel(skillKey);
  const learned = isSkillLearned(skillKey);

  const slot1Name = skillSlots && skillSlots.slot1 ? skillSlots.slot1 : "пусто";
  const slot2Name = skillSlots && skillSlots.slot2 ? skillSlots.slot2 : "пусто";

  const costSp =
    cfg && typeof cfg.costSp === "number" ? cfg.costSp : 0;
  const costGold =
    cfg && typeof cfg.costGold === "number" ? cfg.costGold : 0;

  const currentSp =
    typeof heroStats.sp === "number" ? heroStats.sp : 0;
  const currentGold =
    typeof heroGold === "number" ? heroGold : 0;

  let text = "Навыки\n\n";
  text += "Текущий навык: " + skillKey + "\n";

  if (cfg) {
    if (cfg.type) text += "Тип: " + cfg.type + "\n";
    if (typeof cfg.power === "number")
      text += "Множитель урона: x" + cfg.power + "\n";
    if (typeof cfg.mp === "number")
      text += "MP: " + cfg.mp + "\n";
    if (typeof cfg.cd === "number")
      text +=
        "Перезарядка: " + Math.round(cfg.cd / 1000) + " c\n";
  }

  text += "\nТребуемый уровень: " + requiredLevel + "\n";
  text += "Статус: " + (learned ? "выучен" : "не выучен") + "\n";

  text +=
    "\nСтоимость изучения: " +
    costSp +
    " SP, " +
    costGold +
    " адены\n";
  text +=
    "У тебя сейчас: " +
    currentSp +
    " SP, " +
    currentGold +
    " адены\n";

  text += "\nСлот 1: " + slot1Name + "\n";
  text += "Слот 2: " + slot2Name + "\n";

  skillsPanelText.setText(text);

  const canLearn = !learned && heroStats.level >= requiredLevel;
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

function learnCurrentSkill(scene) {
  if (!availableSkills || availableSkills.length === 0) return;

  const skillKey = availableSkills[currentSkillIndex];
  const requiredLevel = getSkillRequiredLevel(skillKey);
  const cfg = SKILL_DB && SKILL_DB[skillKey] ? SKILL_DB[skillKey] : null;
  const spCost =
    cfg && typeof cfg.spCost === "number" ? cfg.spCost : 1;

  if (isSkillLearned(skillKey)) {
    spawnForgeResultText(scene, "Скилл уже выучен", false, true);
    return;
  }

  if (heroStats.level < requiredLevel) {
    spawnForgeResultText(
      scene,
      "Недостаточный уровень. Нужен " + requiredLevel + " лвл",
      false,
      true
    );
    return;
  }

  if (heroStats.sp < spCost) {
    spawnForgeResultText(
      scene,
      "Недостаточно SP. Нужно " +
        spCost +
        " SP, у тебя " +
        heroStats.sp,
      false,
      true
    );
    return;
  }

  // списываем SP
  heroStats.sp -= spCost;
  if (heroStats.sp < 0) heroStats.sp = 0;

  // добавляем навык
  addLearnedSkill(skillKey);

  // авто-назначение в свободный слот
  if (skillSlots && !skillSlots.slot1) {
    skillSlots.slot1 = skillKey;
  } else if (skillSlots && !skillSlots.slot2) {
    skillSlots.slot2 = skillKey;
  }

  spawnForgeResultText(
    scene,
    "Вы выучили: " + skillKey,
    true,
    true
  );

  updateHeroUI();       // чтобы сверху сразу обновились SP
  updateSkillsPanel();  // чтобы пропала кнопка "Выучить"
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

  if (!skillSlots || typeof skillSlots !== "object") {
    skillSlots = { slot1: null, slot2: null };
  }

  skillSlots[slotKey] = skillKey;

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

// ================== СОХРАНЕНИЕ / ЗАГРУЗКА ==================

function saveGame() {
  try {
    const timestamp = Date.now();
    lastSessionTime = timestamp;

    const data = {
      // базовые статы и мета
      heroStats,
      heroMeta,

      // скиллы
      learnedSkills,
      skillSlots,

      // экономика / ресурсы
      heroGold,
      heroKills,
      heroEliteKills,
      heroEther,
      heroHpPotions,
      heroMpPotions,
      heroPAtkScrolls,
      heroMAtkScrolls,

      // прогресс по миру
      currentLocationIndex,
      lastSessionTime: timestamp,
      heroArenaRating,

      // инвентарь / экип
      inventoryItems,
      equippedWeapon,
      equippedArmor,
      equippedJewelry1,
      equippedJewelry2,

      // квесты
      questKillCompleted,
      questGoldCompleted,
      questEliteCompleted,

      // наёмник
      mercActive,
      mercStats,

      // данж / музыка
      isDungeonRun,
      dungeonKills,
      musicMuted,
    };

    localStorage.setItem("pocketLineageSave", JSON.stringify(data));
  } catch (e) {
    console.warn("Save error", e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem("pocketLineageSave");
    if (!raw) return;

    const data = JSON.parse(raw);

    if (data.heroStats) Object.assign(heroStats, data.heroStats);

    if (data.heroMeta) {
      // аккуратно переписываем мету (поддерживает новые поля archetype/profession)
      Object.assign(heroMeta, data.heroMeta);
    }

    if (typeof data.heroGold === "number") heroGold = data.heroGold;
    if (typeof data.heroKills === "number") heroKills = data.heroKills;
    if (typeof data.heroEliteKills === "number")
      heroEliteKills = data.heroEliteKills;
    if (typeof data.heroEther === "number") heroEther = data.heroEther;
    if (typeof data.heroHpPotions === "number")
      heroHpPotions = data.heroHpPotions;
    if (typeof data.heroMpPotions === "number")
      heroMpPotions = data.heroMpPotions;
    if (typeof data.heroPAtkScrolls === "number")
      heroPAtkScrolls = data.heroPAtkScrolls;
    if (typeof data.heroMAtkScrolls === "number")
      heroMAtkScrolls = data.heroMAtkScrolls;

    if (typeof data.currentLocationIndex === "number") {
      currentLocationIndex = data.currentLocationIndex;
      if (
        currentLocationIndex < 0 ||
        (typeof locations !== "undefined" &&
          currentLocationIndex >= locations.length)
      ) {
        currentLocationIndex = 0;
      }
    }

    if (Array.isArray(data.inventoryItems)) {
      inventoryItems = data.inventoryItems;
    }

    if (typeof data.lastSessionTime === "number") {
      lastSessionTime = data.lastSessionTime;
    }

    if (typeof data.heroArenaRating === "number") {
      heroArenaRating = data.heroArenaRating;
    }

    if (typeof data.questKillCompleted === "boolean") {
      questKillCompleted = data.questKillCompleted;
    }
    if (typeof data.questGoldCompleted === "boolean") {
      questGoldCompleted = data.questGoldCompleted;
    }
    if (typeof data.questEliteCompleted === "boolean") {
      questEliteCompleted = data.questEliteCompleted;
    }

    if (typeof data.mercActive === "boolean") {
      mercActive = data.mercActive;
    }
    if (data.mercStats) {
      Object.assign(mercStats, data.mercStats);
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

    if (typeof data.equippedWeapon === "string") {
      equippedWeapon = data.equippedWeapon;
    }
    if (typeof data.equippedArmor === "string") {
      equippedArmor = data.equippedArmor;
    }
    if (typeof data.equippedJewelry1 === "string") {
      equippedJewelry1 = data.equippedJewelry1;
    }
    if (typeof data.equippedJewelry2 === "string") {
      equippedJewelry2 = data.equippedJewelry2;
    }

    // ----- НОВОЕ: скиллы -----

    // 1) Выученные скиллы
    if (Array.isArray(data.learnedSkills)) {
      learnedSkills = data.learnedSkills;
    }

    // 2) Слоты панели скиллов
    if (data.skillSlots && typeof data.skillSlots === "object") {
      if (!skillSlots || typeof skillSlots !== "object") {
        skillSlots = { slot1: null, slot2: null };
      }
      skillSlots.slot1 = data.skillSlots.slot1 || null;
      skillSlots.slot2 = data.skillSlots.slot2 || null;
    }
  } catch (e) {
    console.warn("Load error", e);
  }
}

// ================== UI-ХЕЛПЕРЫ ДЛЯ ТЕКСТА ==================

function getHeroStatsLabel() {
  const spText =
    typeof heroStats.sp === "number" ? heroStats.sp : 0;

  return (
    "Герой  Lv." +
    heroStats.level +
    " (" +
    heroStats.exp +
    "/" +
    heroStats.expToNext +
    " EXP)\n" +
    "SP: " +
    spText +
    "\n" +
    "HP: " +
    heroStats.hp +
    "/" +
    heroStats.maxHp +
    "   MP: " +
    heroStats.mp +
    "/" +
    heroStats.maxMp +
    "\n" +
    "Атака: " +
    heroStats.minAttack +
    "-" +
    heroStats.maxAttack +
    "  Крит: " +
    Math.round(heroStats.critChance * 100) +
    "%\n" +
    "Мультипликатор крита: x" +
    heroStats.critMultiplier.toFixed(1)
  );
}


function getGoldLabel() {
  return "Адена: " + heroGold;
}

function getKillsLabel() {
  return "Убийств: " + heroKills + " (элита: " + heroEliteKills + ")";
}

function getEtherLabel() {
  return "Эфир: " + heroEther;
}

function getEnemyHpLabel() {
  // безопасно читаем enemyHp / enemyMaxHp, даже если где-то ещё не объявлено
  if (typeof enemyHp !== "undefined" && typeof enemyMaxHp !== "undefined") {
    return "HP: " + enemyHp + "/" + enemyMaxHp;
  }
  return "HP: ?";
}

// Обновление всего верхнего UI за раз
function updateHeroUI() {
  if (heroStatsText) heroStatsText.setText(getHeroStatsLabel());
  if (goldText) goldText.setText(getGoldLabel());
  if (killsText) killsText.setText(getKillsLabel());
  if (etherText) etherText.setText(getEtherLabel());

  // обновляем подписи на кнопках скиллов/банок, если функция есть
  if (typeof updateSkillButtonsUI === "function") {
    updateSkillButtonsUI();
  }
}

// Обновление подписи текущей локации
function updateLocationLabel() {
  if (!locationText) return;
  if (typeof locations === "undefined") {
    locationText.setText("Локация: неизвестно");
    return;
  }

  const idx =
    typeof currentLocationIndex === "number" ? currentLocationIndex : 0;
  const loc = locations[idx] || locations[0];

  if (!loc) {
    locationText.setText("Локация: неизвестно");
    return;
  }

  locationText.setText(
    loc.name + "\n(рекомендуемый уровень: " + loc.recommendedLevel + "+)"
  );
}
