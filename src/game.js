"use strict";
console.log("GAMEJS BUILD: 2025-12-19-REFACTOR-FINAL");

const UI_MODE = "CLEAN";  // CLEAN = new UI only, LEGACY = old UI, CITY_CLEAN = minimal
window.UI_MODE = UI_MODE;

// Hero offset (adaptive positioning)
const HERO_OFFSET = { x: -54, y: -196, scale: 1.23 };

// ============================================================
//  SCENE OBJECTS
// ============================================================

let hero;
let cityHero;
let spineHero;
let heroStartX;
let heroStartY;
let isAttacking = false;

// UI overlays
let uiBottomPanel;

// Panels
let inventoryPanel, inventoryPanelText;
let statsPanel, statsPanelText;
let statsSkillsButton, statsSkillsButtonText;
let questsPanel, questsPanelText;
let shopPanel, shopPanelText, shopBuyButton, shopBuyButtonText;
let mapPanel, mapPanelText, mapGoButton, mapGoButtonText;
let arenaPanel, arenaText, arenaFightButton, arenaFightButtonText;
let arenaBackButton, arenaBackButtonText;
let dungeonPanel, dungeonPanelText, dungeonStartButton, dungeonStartButtonText;

// Panel states
let isInventoryOpen = false;
let isStatsOpen = false;
let isForgeOpen = false;
let isQuestsOpen = false;
let isShopOpen = false;
let isMapOpen = false;
let isArenaOpen = false;
let isDungeonOpen = false;

// Camp (auto-hunt)
let campTent = null;
let campText = null;

// Inventory buttons (for inventoryPanel.js)
let inventoryEquipBestButton = null;
let inventoryEquipBestButtonText = null;
let inventoryUnequipAllButton = null;
let inventoryUnequipAllButtonText = null;

// Enemy attacks
let enemyAttackEvent = null;
const ENEMY_ATTACK_INTERVAL_MS = 1800;

// Character selection
let selectionPanel = null;
let selectionText = null;
let raceButtons = [];
let classButtons = [];
let confirmButton = null;
let confirmButtonText = null;
let selectedRaceId = null;
let selectedClassId = null;

// ============================================================
//  GAME INITIALIZATION
// ============================================================

// Set scene handlers in config
phaserConfig.scene = { preload, create, update };

// Create game instance
const game = new Phaser.Game(phaserConfig);

// Initialize handlers
game.events.once("ready", () => {
  initGameHandlers(game);
});

// ============================================================
//  HELPER FUNCTIONS
// ============================================================

function safeOn(btn, event, callback) {
  if (btn && typeof btn.on === "function") {
    btn.on(event, callback);
  }
}

function safeRecalc(scene, attempts) {
  attempts = attempts || 0;
  if (attempts > 20) return;
  if (typeof getAllEquipmentStats !== "function") {
    scene.time.delayedCall(50, () => safeRecalc(scene, attempts + 1));
    return;
  }
  recalculateHeroStats();
}

function createHeroSprite(scene, x, y, color) {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRect(-12, -15, 24, 30);
  g.fillStyle(0xffcc99, 1);
  g.fillCircle(0, -30, 14);
  g.fillStyle(0x000000, 1);
  g.fillCircle(-5, -32, 2);
  g.fillCircle(5, -32, 2);
  g.fillStyle(0x333333, 1);
  g.fillRect(-10, 15, 8, 25);
  g.fillRect(2, 15, 8, 25);
  g.fillStyle(color, 1);
  g.fillRect(-20, -12, 8, 20);
  g.fillRect(12, -12, 8, 20);
  g.fillStyle(0xaaaaaa, 1);
  g.fillRect(20, -25, 4, 35);
  g.fillStyle(0x8b4513, 1);
  g.fillRect(18, 5, 8, 8);
  const container = scene.add.container(x, y, [g]);
  container.setSize(60, 80);
  return container;
}

// ============================================================
//  PRELOAD
// ============================================================

function preload() {
  this.load.on('progress', (value) => {
    if (window.preEntry) window.preEntry.setProgress(value);
  });

  // Audio
  this.load.audio("city_theme", "assets/audio/city_theme.mp3");
  this.load.audio("battle_theme", "assets/audio/battle_theme.mp3");

  // Backgrounds
  this.load.image("talkingisland_main", "assets/backgrounds/talking_island.png");
  this.load.image("obelisk_of_victory", "assets/backgrounds/obelisk_of_victory.png");
  this.load.image("northern_territory", "assets/backgrounds/northern_territory.png");
  this.load.image("elven_ruins", "assets/backgrounds/elven_ruins.png");
  this.load.image("orc_barracks", "assets/backgrounds/orc_barracks.png");

  // UI
  this.load.image("map_world", "assets/ui/map_world.png");
  this.load.image('ui_bottom', 'assets/ui/bottom.png');
  this.load.image('ui_btn_fight', 'assets/ui/btn_fight_base.png');
  this.load.image('icon_store', 'assets/ui/icon_store.png');
  this.load.image('icon_anvil', 'assets/ui/icon_anvil.png');
  this.load.image('icon_helmet', 'assets/ui/icon_helmet.png');
  this.load.image('icon_map', 'assets/ui/icon_map.png');

  // Intro
  this.load.image("registration_bg", "assets/intro/registration.png");

  // Spine
  this.load.spine('hero', 'assets/spine/hero.json', 'assets/spine/hero.atlas');
}

// ============================================================
//  UPDATE
// ============================================================

function update(time, delta) {
  if (typeof processTick === "function") {
    processTick(delta);
  }
  if (mode === "runner" && typeof updateRunnerBattle === "function") {
    updateRunnerBattle(this, delta);
  }
}

// ============================================================
//  CREATE
// ============================================================

function create() {
  const scene = this;
  window.gameScene = this;

  loadGame();

  const w = this.scale.width;
  const h = this.scale.height;

  // AudioContext fix for TMA
  this.input.once("pointerdown", () => {
    if (this.sound?.context?.state === "suspended") {
      this.sound.context.resume();
    }
  });

  // === BACKGROUND ===
  setupBackground(this);

  // === HERO ===
  setupHero(this);

  // === CITY_CLEAN MODE ===
  if (window.UI_MODE === "CITY_CLEAN") {
    setupCityCleanMode(this);
    return;
  }

  // === CLEAN MODE ===
  if (window.UI_MODE === "CLEAN") {
    setupCleanMode(this);
    return;
  }

  // === FULL UI MODE ===
  setupFullUIMode(this);
}

// ============================================================
//  SETUP FUNCTIONS
// ============================================================

function setupBackground(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  // City background
  cityBg = scene.add.image(w / 2, h / 2, "talkingisland_main");
  fitBackground(cityBg, scene);
  cityBg.setDepth(10);
  window.cityBg = cityBg;

  // Resample for quality
  const targetWpx = Math.round(cityBg.displayWidth * dprCap);
  const targetHpx = Math.round(cityBg.displayHeight * dprCap);
  const rsKey = makeResampledBg(scene, "talkingisland_main", "talkingisland_main_rs", targetWpx, targetHpx);
  if (rsKey) {
    cityBg.setTexture(rsKey);
    cityBg.setScale(0.48);
    cityBg.setPosition(w / 2 + 2, h / 2 + 168);
  }

  // Location background
  locationBg = scene.add.image(w / 2, h / 2, "obelisk_of_victory");
  fitBackground(locationBg, scene);
  locationBg.setDepth(10);
  locationBg.setVisible(false);
}

function setupHero(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const heroX = w / 2 + HERO_OFFSET.x;
  const heroY = h + HERO_OFFSET.y;
  heroStartX = heroX;
  heroStartY = heroY;

  // Spine hero
  if (scene.spine) {
    try {
      spineHero = scene.add.spine(heroX, heroY, 'hero', 'idle', true);
      spineHero.setScale(HERO_OFFSET.scale);
      spineHero.setDepth(100);
      spineHero.setVisible(true);
      spineHero.setScrollFactor(0);
      window.spineHero = spineHero;
      hero = spineHero;
    } catch (e) {
      hero = createHeroSprite(scene, heroX, heroY, 0x3366cc);
      hero.setDepth(50);
    }
  } else {
    hero = createHeroSprite(scene, heroX, heroY, 0x3366cc);
    hero.setDepth(50);
  }

  cityHero = window.spineHero || hero;
}

function setupCityCleanMode(scene) {
  if (window.preEntry?.skip) window.preEntry.skip();

  // Bottom UI
  if (typeof createBottomUI === "function") {
    const bottomUI = createBottomUI(scene);
    window.bottomUI = bottomUI;
  }

  // TUNE mode
  if (typeof initTuneMode === "function") {
    initTuneMode(scene, cityBg, HERO_OFFSET);
  }
  if (typeof applyTuneSettings === "function") {
    applyTuneSettings(scene, cityBg, HERO_OFFSET);
  }

  // Force linear filter on textures
  const LINEAR = Phaser.Textures.FilterMode.LINEAR;
  ["talkingisland_main", "ui_bottom", "ui_btn_fight", "icon_store", "icon_anvil", "icon_helmet", "icon_map"]
    .forEach(k => {
      const t = scene.textures.get(k);
      if (t?.setFilter) t.setFilter(LINEAR);
    });
}

function setupCleanMode(scene) {
  if (window.preEntry?.skip) window.preEntry.skip();

  safeRecalc(scene);  // Recalculate stats

  // Bottom UI
  if (typeof createBottomUI === "function") {
    const bottomUI = createBottomUI(scene);
    window.bottomUI = bottomUI;
  }

  // Create panels (needed for icon clicks to work)
  if (typeof createMapUI === "function") createMapUI(scene);
  if (typeof createForgeUI === "function") createForgeUI(scene);
  if (typeof createInventoryPanel === "function") createInventoryPanel(scene);
  if (typeof createShopPanel === "function") createShopPanel(scene);
  if (typeof createArenaPanel === "function") createArenaPanel(scene);
  if (typeof createStatsPanel === "function") createStatsPanel(scene);

  // TUNE mode
  if (typeof initTuneMode === "function") {
    initTuneMode(scene, cityBg, HERO_OFFSET);
  }
  if (typeof applyTuneSettings === "function") {
    applyTuneSettings(scene, cityBg, HERO_OFFSET);
  }

  // Force linear filter on textures
  const LINEAR = Phaser.Textures.FilterMode.LINEAR;
  ["talkingisland_main", "ui_bottom", "ui_btn_fight", "icon_store", "icon_anvil", "icon_helmet", "icon_map"]
    .forEach(k => {
      const t = scene.textures.get(k);
      if (t?.setFilter) t.setFilter(LINEAR);
    });

  // Ensure hero visibility
  fixHeroVisibility(scene);

  // Initialize panel variables
  initPanelVariables();

  // Hide all panels initially
  if (typeof hideAllPanels === "function") hideAllPanels();

  console.log("[CLEAN MODE] Initialized");
}

function fixHeroVisibility(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  if (window.spineHero) {
    window.spineHero.setVisible(true);
    window.spineHero.setDepth(100);
    window.spineHero.x = w / 2 + HERO_OFFSET.x;
    window.spineHero.y = h + HERO_OFFSET.y;
  }
}

function initPanelVariables() {
  // Initialize all panel states
  isInventoryOpen = false;
  isStatsOpen = false;
  isForgeOpen = false;
  isQuestsOpen = false;
  isShopOpen = false;
  isMapOpen = false;
  isArenaOpen = false;
  isDungeonOpen = false;
}

function setupFullUIMode(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  if (window.UI_MODE !== "CITY_CLEAN") {
    safeRecalc(scene);
  }

  // Bottom UI
  const bottomUI = createBottomUI(scene);
  window.bottomUI = bottomUI;

  // Music
  cityMusic = scene.sound.add("city_theme", { loop: true, volume: 0.6 });
  battleMusic = scene.sound.add("battle_theme", { loop: true, volume: 0.6 });

  // Enemy
  const enemyX = w * 0.75;
  const enemyY = h * 0.65;
  enemy = createHeroSprite(scene, enemyX, enemyY, 0xcc3333);
  enemy.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-30, -40, 60, 80), hitAreaCallback: Phaser.Geom.Rectangle.Contains });

  enemyHpText = scene.add.text(enemyX, enemyY - 60, getEnemyHpLabel(), {
    fontFamily: "Arial",
    fontSize: "20px",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
  }).setOrigin(0.5);

  enemyAlive = true;

  // Mercenary
  merc = createHeroSprite(scene, heroStartX - 80, heroStartY, 0x6a0dad);
  merc.setVisible(false);
  merc.setScale(0.8);

  // Create UI systems
  if (typeof createProfessionUI === "function") createProfessionUI(scene);
  if (typeof createRestAndShotsUI === "function") createRestAndShotsUI(scene);
  if (typeof createPetSprite === "function") createPetSprite(scene);
  if (typeof createGameUI === "function") createGameUI(scene);
  if (typeof createMapUI === "function") createMapUI(scene);
  if (typeof createForgeUI === "function") createForgeUI(scene);
  if (typeof initRunnerBattle === "function") initRunnerBattle(scene);

  // Setup handlers
  setupNewUIHandlers(scene);

  // Hide all panels
  hideAllPanels();

  // Initial updates
  updateHeroUI();
  updateLocationLabel();
  updateSkillButtonsUI();
  updateMercStatsFromHero();

  // Event handlers
  setupEventHandlers(scene);

  // Start in city
  enterCity(scene);

  // Auto-save
  window.addEventListener("beforeunload", () => saveGame());

  // Offline progress
  applyOfflineProgress(scene);

  // Character creation flow
  setupCharacterCreation(scene);

  updateHeroUI();
}

function setupEventHandlers(scene) {
  safeOn(enemy, "pointerdown", () => {
    if (mode !== "location" || isAttacking || !enemyAlive || stats.hp <= 0) return;
    startHeroAttack(scene);
  });

  safeOn(shopBuyButton, "pointerdown", () => buyStarterPack(scene));
  safeOn(mapGoButton, "pointerdown", () => teleportToCurrentLocation(scene));
  safeOn(arenaFightButton, "pointerdown", () => runArenaBattle(scene));
  safeOn(arenaBackButton, "pointerdown", () => hideArenaPanel());
  safeOn(dungeonStartButton, "pointerdown", () => startDungeonRun(scene));

  safeOn(skillsPrevButton, "pointerdown", () => {
    if (!isSkillsOpen || availableSkills.length === 0) return;
    currentSkillIndex = (currentSkillIndex - 1 + availableSkills.length) % availableSkills.length;
    updateSkillsPanel();
  });

  safeOn(skillsNextButton, "pointerdown", () => {
    if (!isSkillsOpen || availableSkills.length === 0) return;
    currentSkillIndex = (currentSkillIndex + 1) % availableSkills.length;
    updateSkillsPanel();
  });

  safeOn(skillsLearnButton, "pointerdown", () => learnCurrentSkill(scene));
  safeOn(skillsSlot1Button, "pointerdown", () => assignCurrentSkillToSlot(scene, "slot1"));
  safeOn(skillsSlot2Button, "pointerdown", () => assignCurrentSkillToSlot(scene, "slot2"));
  safeOn(skillsCloseButton, "pointerdown", () => hideSkillsPanel());
}

function setupCharacterCreation(scene) {
  if (!profile.race || !profile.archetype) {
    if (window.preEntry) {
      window.preEntry.showIntro(() => {
        if (window.preEntry.showLoading) window.preEntry.showLoading();
        setTimeout(() => {
          window.preEntry.hide();
          if (window.characterCreation) window.characterCreation.show(scene);
        }, 300);
      });
    } else {
      if (window.characterCreation) window.characterCreation.show(scene);
    }
  } else {
    if (window.preEntry) window.preEntry.skip();
  }
}

// ============================================================
//  UI HELPERS
// ============================================================

function getHeroStatsLabel() {
  const spText = typeof stats.sp === "number" ? stats.sp : 0;
  return (
    "Герой  Lv." + stats.level + " (" + stats.exp + "/" + stats.expToNext + " EXP)\n" +
    "SP: " + spText + "\n" +
    "HP: " + stats.hp + "/" + stats.maxHp + "   MP: " + stats.mp + "/" + stats.maxMp + "\n" +
    "Атака: " + stats.minAttack + "-" + stats.maxAttack + "  Крит: " + Math.round(stats.critChance * 100) + "%\n" +
    "Мультипликатор крита: x" + stats.critMultiplier.toFixed(1)
  );
}

function getGoldLabel() { return "Адена: " + wallet.gold; }
function getKillsLabel() { return "Убийств: " + progress.kills + " (элита: " + progress.eliteKills + ")"; }
function getEtherLabel() { return "Эфир: " + wallet.ether; }

function getEnemyHpLabel() {
  if (typeof enemyStats !== "undefined" && enemyStats.hp !== undefined) {
    const mobName = enemyStats.name || "Enemy";
    const mobLvl = enemyStats.level || 1;
    return mobName + " [Lv." + mobLvl + "]\nHP: " + enemyStats.hp + "/" + enemyStats.maxHp;
  }
  return "HP: ?";
}

function updateHeroUI() {
  if (window.UI_MODE === "CITY_CLEAN") return;
  if (typeof updateSkillButtonsUI === "function") updateSkillButtonsUI();
  if (typeof updateNewUI === "function") updateNewUI();
}

function updateLocationLabel() {}

// ============================================================
//  UI HANDLERS
// ============================================================

function setupNewUIHandlers(scene) {
  if (!uiElements) return;

  uiElements.menuButtons.forEach(item => {
    item.btn.on("pointerdown", () => {
      if (item.action === "openStats") {
        isStatsOpen ? hideStatsPanel() : (hideAllPanels(), showStatsPanel());
      } else if (item.action === "openInventory") {
        isInventoryOpen ? hideInventoryPanel() : (hideAllPanels(), showInventoryPanel());
      } else if (item.action === "openQuests") {
        isQuestsOpen ? hideQuestsPanel() : (hideAllPanels(), showQuestsPanel());
      }
    });
  });

  uiElements.npcButtons.forEach(item => {
    item.btn.on("pointerdown", () => {
      if (item.action === "openMap") {
        isMapOpen ? hideMapPanel() : (hideAllPanels(), showMapPanel());
      } else if (item.action === "openForge") {
        isForgeOpen ? hideForgePanel() : (hideAllPanels(), showForgePanel());
      } else if (item.action === "openShop") {
        isShopOpen ? hideShopPanel() : (hideAllPanels(), showShopPanel());
      } else if (item.action === "openArena") {
        hideAllPanels();
        if (typeof onArenaButtonClick === "function") onArenaButtonClick(scene);
      } else if (item.action === "openDungeon") {
        isDungeonOpen ? hideDungeonPanel() : (hideAllPanels(), showDungeonPanel());
      } else if (item.action === "openMerc") {
        toggleMercenary(scene);
      }
    });
  });

  safeOn(uiElements.locPrevBtn, "pointerdown", () => {
    if (mode !== "city") return;
    changeLocation(-1);
    updateMapPanel();
    if (uiElements.locNavLabel) uiElements.locNavLabel.setText(getCurrentLocation().name);
  });

  safeOn(uiElements.locNextBtn, "pointerdown", () => {
    if (mode !== "city") return;
    changeLocation(1);
    updateMapPanel();
    if (uiElements.locNavLabel) uiElements.locNavLabel.setText(getCurrentLocation().name);
  });

  safeOn(uiElements.attackBtn, "pointerdown", () => {
    if (mode !== "location" || isAttacking || !enemyAlive || stats.hp <= 0) return;
    startHeroAttack(scene);
  });

  safeOn(uiElements.cityBtn, "pointerdown", () => {
    if (mode !== "location") return;
    enterCity(scene);
  });

  safeOn(uiElements.skill1Btn, "pointerdown", () => useSkill1(scene));
  safeOn(uiElements.skill2Btn, "pointerdown", () => useSkill2(scene));

  safeOn(uiElements.autoBtn, "pointerdown", () => {
    if (mode !== "location") return;
    autoHuntEnabled ? disableAutoHunt() : enableAutoHunt(scene);
    updateAutoButton(autoHuntEnabled);
  });

  safeOn(uiElements.sitButton, "pointerdown", () => {
    toggleRest(scene);
    updateSitButton(buffs.isResting);
  });

  safeOn(uiElements.shotsBtn, "pointerdown", () => {
    toggleShots(scene);
    updateShotsButton(buffs.soulshotsOn || buffs.spiritshotsOn);
  });

  safeOn(uiElements.hpPotionBtn, "pointerdown", () => useHpPotion(scene));
  safeOn(uiElements.mpPotionBtn, "pointerdown", () => useMpPotion(scene));
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

function updateNewUI() {
  if (window.UI_MODE === "CITY_CLEAN") return;
  if (typeof updateUIBars === "function") updateUIBars();
  if (typeof updateUIForMode === "function") updateUIForMode(mode);
  if (typeof updateSkillButtons === "function") updateSkillButtons();
}
