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
// forgePanel теперь в ui/forgePanel.js
let questsPanel, questsPanelText;
let shopPanel, shopPanelText, shopBuyButton, shopBuyButtonText;
let mapPanel, mapPanelText, mapGoButton, mapGoButtonText;
let arenaPanel, arenaText, arenaFightButton, arenaFightButtonText;
let arenaBackButton, arenaBackButtonText;
let dungeonPanel, dungeonPanelText, dungeonStartButton, dungeonStartButtonText;

// панели состояние (skillsPanel переменные теперь в ui/skillsPanel.js)
let isInventoryOpen = false;
let isStatsOpen = false;
let isForgeOpen = false;
let isQuestsOpen = false;
let isShopOpen = false;
let isMapOpen = false;
let isArenaOpen = false;
let isDungeonOpen = false;

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

// ----- PHASER КОНФИГ (TMA портретный режим) -----
const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: "game-container",
  backgroundColor: 0x0a0a12,
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 360,
      height: 640
    },
    max: {
      width: 430,
      height: 932
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  plugins: {
    scene: [
      { key: 'SpinePlugin', plugin: window.SpinePlugin, mapping: 'spine' }
    ]
  }
};

const game = new Phaser.Game(config);

// ----- LEGACY UI FLAG -----
// false = используется новый UI из ui/*.js
// true = старые панели из game.js (для отладки)
const ENABLE_LEGACY_UI = false;

// ----- SAFE AREA для TMA -----
const SAFE_AREA = {
  top: 0.08,      // 8% сверху (~67px) — под шапку Telegram
  bottom: 0.10,   // 10% снизу (~84px) — под жесты/кнопку
  left: 0.04,     // 4% слева
  right: 0.04     // 4% справа
};

// Рабочая зона (где размещать UI)
function getSafeArea(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  return {
    x: w * SAFE_AREA.left,
    y: h * SAFE_AREA.top,
    width: w * (1 - SAFE_AREA.left - SAFE_AREA.right),
    height: h * (1 - SAFE_AREA.top - SAFE_AREA.bottom),
    centerX: w / 2,
    centerY: h / 2
  };
}

// ----- SAFE EVENT HANDLER (для защиты от undefined кнопок) -----
function safeOn(btn, event, callback) {
  if (btn && typeof btn.on === "function") {
    btn.on(event, callback);
  } else {
    console.warn("[UI] Missing button for:", event);
  }
}

// ----- SAFE RECALC (ждёт готовности itemSystem) -----
function safeRecalc(scene) {
  if (typeof getAllEquipmentStats !== "function") {
    console.warn("[StatSystem] Retry in 50ms...");
    scene.time.delayedCall(50, () => safeRecalc(scene));
    return;
  }
  recalculateHeroStats();
}

// Масштабирование фона (cover, без чёрных полос)
function fitBackground(bg, scene) {
  if (!bg || !scene) return;
  var scaleX = scene.scale.width / bg.width;
  var scaleY = scene.scale.height / bg.height;
  var scale = Math.max(scaleX, scaleY);
  bg.setScale(scale);
  bg.setPosition(scene.scale.width / 2, scene.scale.height / 2);
  bg.setOrigin(0.5, 0.5);
}

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
  // Прогресс загрузки для preEntry
  this.load.on('progress', function(value) {
    if (window.preEntry) {
      window.preEntry.setProgress(value);
    }
  });

  this.load.audio("city_theme", "assets/audio/city_theme.mp3");
  this.load.audio("battle_theme", "assets/audio/battle_theme.mp3");

  this.load.image("talkingisland_main", "assets/backgrounds/talkingisland_main.png");
  this.load.image("obelisk_of_victory", "assets/backgrounds/obelisk_of_victory.png");
  this.load.image("northern_territory", "assets/backgrounds/northern_territory.png");
  this.load.image("elven_ruins", "assets/backgrounds/elven_ruins.png");
  this.load.image("orc_barracks", "assets/backgrounds/orc_barracks.png");
  
  // UI карта мира
  this.load.image("map_world", "assets/ui/map_world.png");

  // Экран регистрации
  this.load.image("registration_bg", "assets/intro/registration.png");

  // Spine анимация героя
  this.load.spine('hero', 'assets/spine/hero-pro.json', 'assets/spine/hero.atlas');

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

  // Пересчитываем статы после загрузки (с retry)
  safeRecalc(this);

  const scene = this;
  window.gameScene = this; // для доступа из панелей
  const centerY = this.scale.height / 2;
  const h = this.scale.height;
  const centerX = this.scale.width / 2;
  const w = this.scale.width;

  // AudioContext fix для TMA (resume после первого клика)
  this.input.once("pointerdown", () => {
    if (this.sound && this.sound.context && this.sound.context.state === "suspended") {
      this.sound.context.resume();
    }
  });

  // фоны
  cityBg = this.add.image(w / 2, h / 2, "talkingisland_main");
  fitBackground(cityBg, this);
  cityBg.setDepth(-5);

  locationBg = this.add.image(w / 2, h / 2, "obelisk_of_victory");
  fitBackground(locationBg, this);
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

  // ----- LEGACY PANELS (deprecated) -----
  if (ENABLE_LEGACY_UI) {
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

  // --- Кузнец (UI теперь в forgePanel.js, вызывается через createForgeUI) ---

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
    // forgePanel теперь в forgePanel.js
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
  } // END ENABLE_LEGACY_UI

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

  // создаём UI кузницы
  if (typeof createForgeUI === "function") {
    createForgeUI(this);
  }

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
  
  // скрываем старый UI (только если legacy включён)
  if (ENABLE_LEGACY_UI) hideOldUI();

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
  safeOn(statsSkillsButton, "pointerdown", () => {
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

  // forgeDoButton теперь в forgePanel.js

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

  safeOn(shopBuyButton, "pointerdown", () => {
    buyStarterPack(scene);
  });

  safeOn(mapGoButton, "pointerdown", () => {
    teleportToCurrentLocation(scene);
  });

  safeOn(arenaFightButton, "pointerdown", () => {
    runArenaBattle(scene);
  });

  safeOn(arenaBackButton, "pointerdown", () => {
    hideArenaPanel();
  });

  safeOn(dungeonStartButton, "pointerdown", () => {
    startDungeonRun(scene);
  });

  // навигация по панели навыков
  safeOn(skillsPrevButton, "pointerdown", () => {
    if (!isSkillsOpen || availableSkills.length === 0) return;
    currentSkillIndex =
      (currentSkillIndex - 1 + availableSkills.length) % availableSkills.length;
    updateSkillsPanel();
  });

  safeOn(skillsNextButton, "pointerdown", () => {
    if (!isSkillsOpen || availableSkills.length === 0) return;
    currentSkillIndex = (currentSkillIndex + 1) % availableSkills.length;
    updateSkillsPanel();
  });

  safeOn(skillsLearnButton, "pointerdown", () => {
    learnCurrentSkill(scene);
  });

  safeOn(skillsSlot1Button, "pointerdown", () => {
    assignCurrentSkillToSlot(scene, "slot1");
  });

  safeOn(skillsSlot2Button, "pointerdown", () => {
    assignCurrentSkillToSlot(scene, "slot2");
  });

  safeOn(skillsCloseButton, "pointerdown", () => {
    hideSkillsPanel();
  });

  // старт в городе
  enterCity(scene);

  // автосейв при закрытии вкладки
  window.addEventListener("beforeunload", () => {
    saveGame();
  });

  // Реген теперь через tickSystem.js (processTick в update)

  // оффлайн-прогресс
  applyOfflineProgress(scene);

  // Интеграция с preEntry
  if (!profile.race || !profile.archetype) {
    // Новый игрок — показываем интро
    if (window.preEntry) {
      window.preEntry.showIntro(function() {
        // Показать loading сразу после клика
        if (window.preEntry.showLoading) {
          window.preEntry.showLoading();
        }

        // Небольшая задержка для визуального фидбэка
        setTimeout(function() {
          window.preEntry.hide();
          // Новый полноэкранный экран создания персонажа
          if (window.characterCreation) {
            window.characterCreation.show(scene);
          }
        }, 300);
      });
    } else {
      // Новый полноэкранный экран создания персонажа
      if (window.characterCreation) {
        window.characterCreation.show(scene);
      }
    }
  } else {
    // Уже играл — сразу в игру
    if (window.preEntry) {
      window.preEntry.skip();
    }
  }

  updateHeroUI();
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
        // PvE Арена — полноэкранный режим боя
        hideAllPanels();
        if (typeof onArenaButtonClick === "function") {
          onArenaButtonClick(scene);
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