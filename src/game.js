"use strict";
console.log("GAMEJS BUILD: 2025-12-31-BOY2");

const UI_MODE = "CLEAN";  // CLEAN = new UI only, LEGACY = old UI, CITY_CLEAN = minimal
window.UI_MODE = UI_MODE;

// ============================================================
//  SAFE AREA — iPhone Notch / Home Indicator support
//  Hardcoded values for 1688px game height
// ============================================================

function initSafeArea(scene) {
  // ============================================================
  // CANONICAL SAFE AREA for Phaser ENVELOP + CENTER_BOTH
  // ============================================================

  const simulateIOS = new URLSearchParams(window.location.search).has('simios');

  // 1. Get sizes from Phaser's scale manager (canonical way)
  const gameW = scene.scale.gameSize.width;     // 780
  const gameH = scene.scale.gameSize.height;    // 1688
  const displayW = scene.scale.displaySize.width;
  const displayH = scene.scale.displaySize.height;
  const parentW = scene.scale.parentSize.width;
  const parentH = scene.scale.parentSize.height;

  console.log('='.repeat(50));
  console.log('[SAFE] 📐 PHASER SCALE MANAGER:');
  console.log(`  gameSize: ${gameW}×${gameH}`);
  console.log(`  displaySize: ${displayW}×${displayH}`);
  console.log(`  parentSize: ${parentW}×${parentH}`);

  // 2. Calculate actual scale factor
  const scaleX = displayW / gameW;
  const scaleY = displayH / gameH;
  const actualScale = Math.min(scaleX, scaleY);  // For ENVELOP it's max, but display might differ

  console.log(`  Scale factors: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`);
  if (simulateIOS) console.log('  🔧 SIMULATE iOS: ON');

  // 5. Источники Safe Area
  const tg = window.Telegram?.WebApp;
  let cssTop = 0, cssBottom = 0;
  let source = 'none';

  console.log('[SAFE] 📱 TELEGRAM SDK:');
  console.log(`  WebApp exists: ${!!tg}`);
  console.log(`  contentSafeAreaInset: ${JSON.stringify(tg?.contentSafeAreaInset || 'N/A')}`);
  console.log(`  safeAreaInset: ${JSON.stringify(tg?.safeAreaInset || 'N/A')}`);

  if (tg?.contentSafeAreaInset?.top !== undefined) {
    cssTop = tg.contentSafeAreaInset.top;
    cssBottom = tg.contentSafeAreaInset.bottom || 0;
    source = 'TG.contentSafeAreaInset';
  }
  else if (tg?.safeAreaInset?.top !== undefined) {
    cssTop = tg.safeAreaInset.top;
    cssBottom = tg.safeAreaInset.bottom || 0;
    source = 'TG.safeAreaInset';
  }
  else {
    const sensor = document.getElementById('safe-area-sensor');
    if (sensor) {
      const style = getComputedStyle(sensor);
      cssTop = parseInt(style.paddingTop) || 0;
      cssBottom = parseInt(style.paddingBottom) || 0;
      if (cssTop > 0) source = 'CSS env()';
    }
  }

  // Override safe area based on context
  // Detect Telegram via multiple methods (SDK may not be ready yet)
  const urlParams = new URLSearchParams(window.location.search);
  const hasTgParams = urlParams.has('tgWebAppData') ||
                      urlParams.has('tgWebAppVersion') ||
                      urlParams.has('tgWebAppPlatform');
  const hasTgHash = window.location.hash.includes('tgWebAppData');
  const hasTgSDK = !!window.Telegram?.WebApp;
  const inTelegram = hasTgSDK || hasTgParams || hasTgHash;

  console.log(`[SAFE] 🔍 TG Detection: SDK=${hasTgSDK}, params=${hasTgParams}, hash=${hasTgHash} → inTG=${inTelegram}`);

  if (inTelegram) {
    // In Telegram - header bar already covers notch, ignore CSS env() values
    cssTop = 0;
    cssBottom = 0;
    source = 'TG header (no offset)';
  } else if (simulateIOS) {
    // Simulate iOS on desktop with ?simios
    cssTop = 59;
    cssBottom = 34;
    source = 'iOS SIMULATED';
  } else if (cssTop === 0 && isIOS()) {
    // iOS Safari outside Telegram - use fallback
    cssTop = 59;
    cssBottom = 34;
    source = 'iOS fallback';
  }

  console.log(`[SAFE] 📊 SOURCE: ${source} → CSS: top=${cssTop}, bottom=${cssBottom}`);
  window.SAFE_AREA_SOURCE = source;
  window.SAFE_AREA_IN_TG = inTelegram;

  // 3. Calculate scale for CSS to game conversion
  // displaySize is the actual rendered size, gameSize is internal
  const scale = displayH / gameH;  // Use Y scale for ENVELOP (height determines scale)

  // 4. Convert CSS safe area to game pixels
  // Safe area is in CSS pixels, we need game pixels
  const safeTopGame = cssTop / scale;
  const safeBottomGame = cssBottom / scale;

  window.SAFE_ZONE_TOP = Math.round(safeTopGame);
  window.SAFE_ZONE_BOTTOM = Math.round(safeBottomGame);

  // With CENTER_BOTH, Phaser centers the canvas
  // The crop offset is handled by Phaser, we just need safe area offset
  // Calculate crop for reference (how much is cut off top/bottom)
  const cropTopCSS = (displayH - parentH) / 2;
  const cropTopGame = cropTopCSS > 0 ? cropTopCSS / scale : 0;
  window.ENVELOP_CROP_TOP = Math.round(cropTopGame);

  console.log('[SAFE] 🎯 FINAL (game pixels):');
  console.log(`  Scale: ${scale.toFixed(3)}`);
  console.log(`  Safe Top: ${cssTop} CSS → ${window.SAFE_ZONE_TOP} game px`);
  console.log(`  Safe Bottom: ${cssBottom} CSS → ${window.SAFE_ZONE_BOTTOM} game px`);
  console.log(`  Crop Top: ${cropTopCSS.toFixed(0)} CSS → ${window.ENVELOP_CROP_TOP} game px`);
  console.log('='.repeat(50));
}

// Определение iOS
function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Hero offset (adaptive positioning)
// Hero final position (hardcoded from tune mode)
const HERO_OFFSET = { x: -62, y: -235, scale: 0.37 };  // 328, 1453 on 780x1688

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

// Panel states (inventory now uses InventoryScene)
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

  // Add InventoryScene as overlay (parallel scene)
  if (typeof InventoryScene !== 'undefined') {
    game.scene.add('InventoryScene', InventoryScene, false);
    console.log('[GAME] InventoryScene added');
  }

  // Add LeaderboardScene
  if (typeof LeaderboardScene !== 'undefined') {
    game.scene.add('LeaderboardScene', LeaderboardScene, false);
    console.log('[GAME] LeaderboardScene added');
  }
});

// Global stubs for legacy inventory panel calls
window.hideInventoryPanel = function() {
  if (game && game.scene) {
    const mainScene = game.scene.getScene('MainScene');
    if (mainScene && mainScene.scene.isActive('InventoryScene')) {
      mainScene.scene.stop('InventoryScene');
    }
  }
};
window.showInventoryPanel = function() {
  if (game && game.scene) {
    const mainScene = game.scene.getScene('MainScene');
    if (mainScene) {
      mainScene.scene.launch('InventoryScene');
    }
  }
};
window.toggleInventoryPanel = function() {
  if (game && game.scene) {
    const mainScene = game.scene.getScene('MainScene');
    if (mainScene) {
      if (mainScene.scene.isActive('InventoryScene')) {
        mainScene.scene.stop('InventoryScene');
      } else {
        mainScene.scene.launch('InventoryScene');
      }
    }
  }
};

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

  // === CRITICAL ASSETS ONLY (fast initial load) ===

  // Audio - only city theme (~2 MB), battle loads later
  this.load.audio("city_theme", "assets/audio/city_theme.mp3");

  // Main background only (~6 MB) - others lazy loaded
  this.load.image("talkingisland_main", "assets/backgrounds/talking_island.png");

  // UI essentials
  this.load.image('ui_bottom', 'assets/ui/bottom.png');
  this.load.image('ui_btn_fight', 'assets/ui/btn_fight_base.png');
  this.load.image('icon_store', 'assets/ui/icon_store.png');
  this.load.image('icon_anvil', 'assets/ui/icon_anvil.png');
  this.load.image('icon_helmet', 'assets/ui/icon_helmet.png');
  this.load.image('icon_map', 'assets/ui/icon_map.png');

  // Leaderboard
  this.load.image('btn_rating', 'assets/ui/raiting.png');
  this.load.image('icon_golden_cup', 'assets/ui/golden_cup.png');
  this.load.image('icon_silver_cup', 'assets/ui/silver_cup.png');
  this.load.image('icon_bronze_cup', 'assets/ui/bronze_cup.png');
  this.load.image('icon_pvp', 'assets/ui/pvp 1.png');

  // Player Header UI
  this.load.image('ui_top_panel', 'assets/ui/top_ui.png');
  this.load.image('ui_exp_ring_full', 'assets/ui/ui_exp_ring_full.png');
  this.load.image('ui_avatar_placeholder', 'assets/ui/avatar_placeholder.png');

  // Inventory UI
  this.load.image('btn_close', 'assets/ui/btn_close.png');
  this.load.image('inv_slot_frame', 'assets/ui/invertory_slot_frame.png');
  this.load.image('inv_helmet', 'assets/ui/helmet_inv.png');
  this.load.image('inv_armor', 'assets/ui/armor_inv.png');
  this.load.image('inv_legg', 'assets/ui/legg_inv.png');
  this.load.image('inv_gloves', 'assets/ui/gloves_inv.png');
  this.load.image('inv_boots', 'assets/ui/boots_inv.png');
  this.load.image('inv_sword', 'assets/ui/sword_inv.png');
  this.load.image('inv_shield', 'assets/ui/shield_inv_.png');
  this.load.image('inv_necklace', 'assets/ui/necklase_inv.png');
  this.load.image('inv_ring', 'assets/ui/ring_inv.png');
  this.load.image('icon_hp', 'assets/ui/hp.png');
  this.load.image('icon_atk', 'assets/ui/atk.png');
  this.load.image('icon_def', 'assets/ui/def.png');

  // Spine hero (Boy_1)
  this.load.spine('hero', 'assets/spine-main/Boy_1.json', 'assets/spine-main/Boy_1.atlas');

  // === LAZY LOADED (on demand): ===
  // - arena_village (8 MB) - loads when Fight clicked
  // - map_world (6 MB) - loads when Map opened
  // - battle_theme (7 MB) - loads when arena starts
  // - registration_bg - loads if needed
}

// Lazy load asset helper
function lazyLoadAsset(scene, type, key, path, onComplete) {
  if (scene.textures.exists(key) || scene.cache.audio.exists(key)) {
    if (onComplete) onComplete();
    return;
  }

  console.log("[LAZY] Loading:", key);

  if (type === 'image') {
    scene.load.image(key, path);
  } else if (type === 'audio') {
    scene.load.audio(key, path);
  }

  scene.load.once('complete', () => {
    console.log("[LAZY] Loaded:", key);
    if (onComplete) onComplete();
  });

  scene.load.start();
}

// ============================================================
//  UPDATE
// ============================================================

function update(time, delta) {
  if (typeof processTick === "function") {
    processTick(delta);
  }
  if (typeof updateArena === "function") {
    updateArena(this);
  }
}

// ============================================================
//  AUTH
// ============================================================

async function initAuth() {
  console.log('[Game] Starting auth...');

  if (typeof window.apiAuth !== 'function') {
    console.warn('[Game] apiAuth not available, skipping auth');
    return;
  }

  const result = await window.apiAuth();

  if (result.success && result.user) {
    console.log('[Game] Auth success:', result.user);

    // Сохранить данные пользователя (username приоритетнее first_name)
    window.currentUser = result.user;
    window.playerName = result.user.username || result.user.first_name || 'Warrior';
    window.playerAvatar = result.user.photo_url || null;

    // Обновить header UI (имя и аватар)
    if (typeof updatePlayerHeader === 'function') {
      updatePlayerHeader(window.playerName, window.playerAvatar);
    }

    // Загрузить прогресс с сервера
    const profile = await window.apiGetProfile();
    if (profile.success && profile.progress) {
      // Инициализировать heroState если не существует
      window.heroState = window.heroState || {};
      window.heroState.level = profile.progress.level || 1;
      window.heroState.rating = profile.progress.rating || 0;
      window.heroState.kills = profile.progress.kills || 0;
      window.heroState.energy = profile.progress.energy || 100;
      window.heroState.maxEnergy = 100;
      window.heroState.gold = profile.progress.gold || 0;
      window.heroState.gems = profile.progress.gems || 0;
      window.heroState.exp = profile.progress.exp || 0;
      // maxExp = 100 * level (100 for level 1, 200 for level 2, etc)
      window.heroState.maxExp = 100 * (window.heroState.level || 1);
      window.heroState.lastEnergyRegen = Date.now();
      console.log('[Game] Progress loaded from server:', window.heroState);

      // Обновить header с реальными данными
      if (typeof window.updateHeaderStats === 'function') {
        window.updateHeaderStats();
      }
    } else {
      // Нет прогресса — инициализировать дефолтные значения
      window.heroState = window.heroState || {};
      window.heroState.level = window.heroState.level || 1;
      window.heroState.energy = window.heroState.energy || 100;
      window.heroState.maxEnergy = 100;
      window.heroState.rating = window.heroState.rating || 0;
      window.heroState.kills = window.heroState.kills || 0;
      window.heroState.gold = window.heroState.gold || 0;
      window.heroState.gems = window.heroState.gems || 0;
      window.heroState.exp = window.heroState.exp || 0;
      // maxExp = 100 * level (100 for level 1, 200 for level 2, etc)
      window.heroState.maxExp = 100 * (window.heroState.level || 1);
      window.heroState.lastEnergyRegen = Date.now();
      console.log('[Game] No server progress, using defaults:', window.heroState);
    }

    // Автосохранение каждые 60 секунд
    setInterval(() => {
      const isAuth = typeof window.apiIsAuthenticated === 'function' && window.apiIsAuthenticated();
      const hasHero = !!window.heroState;

      if (isAuth && hasHero) {
        const data = {
          level: window.heroState.level || 1,
          rating: window.heroState.rating || 0,
          kills: window.heroState.kills || 0,
          energy: window.heroState.energy || 100,
          gold: window.heroState.gold || 0,
          gems: window.heroState.gems || 0,
          exp: window.heroState.exp || 0
        };
        console.log('[Autosave] Sending:', data);
        window.apiSaveProgress(data);

        // Обновить header после сохранения
        if (typeof window.updateHeaderStats === 'function') {
          window.updateHeaderStats();
        }
      }
    }, 60000);
    console.log('[Game] Autosave enabled (60s interval)');

  } else if (result.offline) {
    console.log('[Game] Offline mode - no save');
    // Инициализировать дефолтные значения для offline
    window.heroState = window.heroState || {};
    window.heroState.level = window.heroState.level || 1;
    window.heroState.energy = window.heroState.energy || 100;
    window.heroState.maxEnergy = 100;
  } else {
    console.log('[Game] Auth failed, playing as guest');
  }
}

// ============================================================
//  CREATE
// ============================================================

function create() {
  const scene = this;
  window.gameScene = this;

  // Initialize Safe Area zones for iPhone Notch/Home Indicator
  initSafeArea(this);

  loadGame();

  // Авторизация через API при старте
  initAuth();

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

  // City background (no resampling - use Phaser's built-in scaling)
  cityBg = scene.add.image(w / 2, h / 2, "talkingisland_main");
  fitBackground(cityBg, scene);
  cityBg.setDepth(10);
  window.cityBg = cityBg;

  // Location background (lazy loaded later)
  locationBg = null;
}

function setupHero(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const heroX = w / 2 + HERO_OFFSET.x;
  const heroY = h + HERO_OFFSET.y;
  heroStartX = heroX;
  heroStartY = heroY;

  // Spine hero
  console.log("[HERO] scene.spine exists:", !!scene.spine);
  console.log("[HERO] scene.add?.spine exists:", !!scene.add?.spine);
  console.log("[HERO] cache has 'hero':", scene.cache?.custom?.spine?.has('hero'));

  let spineCreated = false;
  if (scene.add?.spine) {
    try {
      console.log("[HERO] Creating spine at", heroX, heroY);
      spineHero = scene.add.spine(heroX, heroY, 'hero', 'idle', true);
      console.log("[HERO] Spine created:", spineHero);
      spineHero.setScale(HERO_OFFSET.scale);
      spineHero.setDepth(100);
      spineHero.setVisible(false);  // Hidden until final positioning
      spineHero.setScrollFactor(0);
      spineHero.timeScale = 0.45;  // Замедляем анимации (убирает тряску)
      window.spineHero = spineHero;
      hero = spineHero;
      spineCreated = true;
    } catch (e) {
      console.error("[HERO] Spine error:", e.message, e);
    }
  }

  if (!spineCreated) {
    console.warn("[HERO] Using fallback sprite");
    hero = createHeroSprite(scene, heroX, heroY, 0x3366cc);
    hero.setDepth(50);
    window.spineHero = null;
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
  ["talkingisland_main", "ui_bottom", "ui_btn_fight", "icon_store", "icon_anvil", "icon_helmet", "icon_map",
   "ui_top_panel", "ui_exp_ring_full", "ui_avatar_placeholder"]
    .forEach(k => {
      const t = scene.textures.get(k);
      if (t?.setFilter) t.setFilter(LINEAR);
    });
}

function setupCleanMode(scene) {
  if (window.preEntry?.skip) window.preEntry.skip();

  safeRecalc(scene);  // Recalculate stats

  const h = scene.scale.height;

  // Bottom UI
  if (typeof createBottomUI === "function") {
    const bottomUI = createBottomUI(scene);
    window.bottomUI = bottomUI;
  }

  // Version text at bottom-left (account for ENVELOP crop)
  const BUILD_VERSION = 'v2065';
  const cropTop = window.ENVELOP_CROP_TOP || 0;
  const versionY = h - cropTop - 150;  // above bottom panel
  const versionText = scene.add.text(cropTop + 10, versionY, BUILD_VERSION, {
    fontSize: '14px',
    color: '#ffffff',
    fontFamily: 'monospace',
    backgroundColor: '#000000aa',
    padding: { x: 4, y: 2 }
  });
  versionText.setOrigin(0, 1);
  versionText.setScrollFactor(0);
  versionText.setDepth(9999);
  window.versionText = versionText;  // Store globally for arena hide

  // Player Header (Top UI)
  if (typeof createPlayerHeader === "function") {
    const playerHeader = createPlayerHeader(scene);
    window.playerHeader = playerHeader;

    // Initialize with example data
    playerHeader.setLevel(1);
    playerHeader.setNickname('Warrior');
    playerHeader.setExp(0.75);  // 75% to next level
    playerHeader.setResources(30, 150, 5000, 125000);  // Energy/Stars/Gems/Adena

    // Start energy timer (updates every second)
    if (typeof window.startEnergyTimer === 'function') {
      window.startEnergyTimer();
    }
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
  ["talkingisland_main", "ui_bottom", "ui_btn_fight", "icon_store", "icon_anvil", "icon_helmet", "icon_map",
   "ui_top_panel", "ui_exp_ring_full", "ui_avatar_placeholder"]
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

  // Apply final hardcoded positions (200ms delay to override tune mode's 150ms)
  setTimeout(() => applyFinalPositions(scene), 200);

  // Rating button (right side) — PROPORTIONAL SCALE
  // Image is 597×368 px, preserve aspect ratio
  if (scene.textures.exists('btn_rating')) {
    const ratingBtn = scene.add.image(scene.scale.width - 130, scene.scale.height - 400, 'btn_rating');

    // Proportional sizing: target height 120, calculate width from ratio
    const targetHeight = 120;
    const ratio = 597 / 368;  // ~1.62
    ratingBtn.setDisplaySize(targetHeight * ratio, targetHeight);  // ~194 × 120

    // Save BASE scale AFTER setDisplaySize!
    const ratingBaseScaleX = ratingBtn.scaleX;
    const ratingBaseScaleY = ratingBtn.scaleY;

    ratingBtn.setInteractive({ useHandCursor: true });

    ratingBtn.on('pointerover', () => {
      ratingBtn.setScale(ratingBaseScaleX * 1.05, ratingBaseScaleY * 1.05);
    });

    ratingBtn.on('pointerout', () => {
      ratingBtn.setScale(ratingBaseScaleX, ratingBaseScaleY);
    });

    ratingBtn.on('pointerdown', () => {
      ratingBtn.setScale(ratingBaseScaleX * 0.95, ratingBaseScaleY * 0.95);
      scene.scene.launch('LeaderboardScene');
    });

    ratingBtn.on('pointerup', () => {
      ratingBtn.setScale(ratingBaseScaleX, ratingBaseScaleY);
    });

    ratingBtn.setDepth(200);
    console.log('[GAME] Rating button added (proportional), baseScale:', ratingBaseScaleX.toFixed(3));
  }

  console.log("[CLEAN MODE] Initialized");
}

// HARDCODED FINAL POSITIONS (from tune mode)
function applyFinalPositions(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  // Background position
  if (window.cityBg) {
    window.cityBg.x = w / 2;
    window.cityBg.y = h / 2 + 100;  // moved up ~44px from previous
    window.cityBg.setScale(0.412);
  }

  // Hero position (from tune mode)
  if (window.spineHero) {
    window.spineHero.x = 328;
    window.spineHero.y = 1353;  // moved up 100px for iPhone
    window.spineHero.setScale(0.37);
    window.spineHero.setVisible(true);  // Now show hero
  }
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
  // isInventoryOpen removed - now handled by InventoryScene
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
  if (window.UI_MODE === "CITY_CLEAN" || window.UI_MODE === "CLEAN") return;
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
        // Use InventoryScene instead of old panel
        if (scene.scene.isActive('InventoryScene')) {
          scene.scene.stop('InventoryScene');
        } else {
          scene.scene.launch('InventoryScene');
        }
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
        // Check energy
        if (typeof canStartArenaBattle === "function" && !canStartArenaBattle()) {
          const msg = scene.add.text(scene.scale.width / 2, scene.scale.height / 2,
            "Не хватает энергии! (" + arenaData.energy + "/" + arenaData.energyCost + ")", {
            fontSize: "20px", color: "#ffcc00", backgroundColor: "#000000",
            padding: { x: 12, y: 8 }
          }).setOrigin(0.5).setDepth(300);
          scene.tweens.add({ targets: msg, alpha: 0, y: msg.y - 30, duration: 2000, delay: 1000, onComplete: () => msg.destroy() });
          return;
        }
        // Spend energy and start new arena
        if (typeof spendArenaEnergy === "function") spendArenaEnergy();
        if (typeof startArena === "function") {
          startArena(scene, null);
        }
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
  if (window.UI_MODE === "CITY_CLEAN" || window.UI_MODE === "CLEAN") return;
  if (typeof updateUIBars === "function") updateUIBars();
  if (typeof updateUIForMode === "function") updateUIForMode(mode);
  if (typeof updateSkillButtons === "function") updateSkillButtons();
}
