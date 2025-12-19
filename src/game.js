"use strict";
console.log("GAMEJS BUILD: 2025-12-19-ADAPTIVE");

const UI_MODE = "CITY_CLEAN"; // "LEGACY" | "CITY_CLEAN"
window.UI_MODE = UI_MODE;

// === TUNE MODE (enabled via ?tune=1) ===
const TUNE_ENABLED = new URLSearchParams(window.location.search).has('tune');
if (TUNE_ENABLED) console.log("[TUNE] Mode ENABLED");

// Base positions for tune mode calculations (scaled for 780×1688)
// Hero position (adaptive offsets from center/bottom)
// x: w/2 + offsetX, y: h + offsetY
const HERO_OFFSET = { x: -54, y: -196, scale: 1.23 };
let FIGHTBTN_BASE = null; // Set when bottomUI is created

function getTuneSettings() {
  // All positions are now hardcoded - tune offsets should be 0
  const defaults = {
    bgZoom: 1,
    bgPanX: 0,
    bgPanY: 0,
    panelX: 0,
    panelY: 0,
    panelScale: 1.0,
    heroX: 0,
    heroY: 0,
    heroScale: 1,
    btnX: 0,
    btnY: 0,
    btnScale: 1,
    iconScale: 1,
    icon0X: 0, icon0Y: 0,
    icon1X: 0, icon1Y: 0,
    icon2X: 0, icon2Y: 0,
    icon3X: 0, icon3Y: 0
  };

  // Clear old tune settings - now adaptive (v6)
  const TUNE_VERSION = 'v10';
  const savedVersion = localStorage.getItem('TUNE_VERSION');
  if (savedVersion !== TUNE_VERSION) {
    localStorage.removeItem('TUNE_SETTINGS');
    localStorage.setItem('TUNE_VERSION', TUNE_VERSION);
    console.log('[TUNE] Cleared old settings, now using hardcoded positions');
  }

  if (!TUNE_ENABLED) return defaults;

  try {
    const saved = localStorage.getItem('TUNE_SETTINGS');
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch (e) {}
  return defaults;
}

// ============================================================
//  game.js — ГЛАВНЫЙ ФАЙЛ ИГРЫ
//  Все данные героя теперь в heroState.js
// ============================================================

// ----- ОБЪЕКТЫ СЦЕНЫ -----
let hero;
let cityHero;
let spineHero; // Spine анимация героя
let heroStartX;
let heroStartY;
let isAttacking = false;

// ----- UI ОВЕРЛЕИ -----
let uiBottomPanel; // Нижняя панель поверх фона

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

// ----- FIX B: Restored globals expected by ui panel files -----
// Expected by inventoryPanel.js
let inventoryEquipBestButton = null;
let inventoryEquipBestButtonText = null;
let inventoryUnequipAllButton = null;
let inventoryUnequipAllButtonText = null;

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

// ----- PHASER CONFIG (TMA + Desktop stable scaling) -----
const BASE_W = 780;
const BASE_H = 1688;

const dprCap = Math.min(window.devicePixelRatio || 1, 2);
console.log("[DPI] dprCap", dprCap);

// Telegram-aware isMobile detection
const tg = window.Telegram?.WebApp;
const tgPlatform = tg?.platform;
const isTgMobile = tgPlatform === "ios" || tgPlatform === "android";

const _isCoarse = window.matchMedia("(pointer: coarse)").matches;
const _isSmall = window.matchMedia("(max-width: 520px)").matches;

const isMobile = isTgMobile || _isCoarse || _isSmall;
console.log("[ENV]", { tgPlatform, isTgMobile, _isCoarse, _isSmall, isMobile });

const getScaleMode = () => {
  return Phaser.Scale.ENVELOP;  // ENVELOP fills screen, crops edges (no black bars)
};

const RESOLUTION = window.devicePixelRatio || 1;  // Phaser 3.55.2 handles this properly

// --- Viewport height sync (fixes Telegram/WebView "bottom clipped") ---
function syncAppHeight() {
  const tg = window.Telegram?.WebApp;
  const h =
    (tg && typeof tg.viewportHeight === "number" && tg.viewportHeight) ||
    (window.visualViewport?.height) ||
    window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${Math.round(h)}px`);
}

try {
  // Telegram Mini App: ask for full height if available
  window.Telegram?.WebApp?.expand?.();
} catch (_) {}

syncAppHeight();
window.visualViewport?.addEventListener("resize", syncAppHeight);

const config = {
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  resolution: RESOLUTION,
  parent: "game-container",
  backgroundColor: 0x0a0a12,
  fps: { target: 60, forceSetTimeOut: true },
  render: { antialias: true, antialiasGL: true, pixelArt: false, roundPixels: false },
  scale: { mode: getScaleMode(), autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: { preload, create, update },
  plugins: { scene: [{ key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" }] }
};

const game = new Phaser.Game(config);

// Phaser 3.55.2 handles resolution properly - just log for debugging
game.events.once("ready", () => {
  const c = game.canvas;
  console.log("[RESOLUTION] Phaser 3.55.2 - canvas:", c?.width, "x", c?.height, "DPR:", RESOLUTION);
});

// GPU auto-guard: prevent render surface blow-up (DESKTOP ONLY)
setTimeout(() => {
  if (isMobile) {
    console.log("[GPU] skip guard on mobile");
    return;
  }

  const c = game.canvas;
  if (!c) return;

  const backing = c.width * c.height;
  const maxSafe = 2000 * 2000;

  if (backing > maxSafe) {
    console.warn("[GPU] Too large backing:", c.width, "x", c.height, "=> forcing resolution=1");
    game.config.resolution = 1;
    if (game.renderer) game.renderer.resolution = 1;
    game.scale?.refresh();
    console.log("[GPU] after guard backing", c.width, c.height);
  } else {
    console.log("[GPU] Render surface OK:", c.width, "x", c.height);
  }
}, 200);

window.addEventListener("resize", () => {
  syncAppHeight();
  const nextMode = getScaleMode();
  if (game.scale && game.scale.scaleMode !== nextMode) game.scale.scaleMode = nextMode;
  game.scale?.refresh();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) { game.loop.sleep(); console.log("[PERF] Game sleeping"); }
  else { game.loop.wake(); console.log("[PERF] Game waking"); }
});

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
  }
  // Silently ignore missing buttons
}

// ----- SAFE RECALC (ждёт готовности itemSystem) -----
function safeRecalc(scene, attempts) {
  attempts = attempts || 0;

  if (attempts > 20) {
    console.warn("[StatSystem] Gave up after 20 attempts");
    return;
  }

  if (typeof getAllEquipmentStats !== "function") {
    scene.time.delayedCall(50, () => safeRecalc(scene, attempts + 1));
    return;
  }

  recalculateHeroStats();
  console.log("[StatSystem] Stats recalculated successfully");
}

// Масштабирование фона (cover, без чёрных полос)
function fitBackground(bg, scene) {
  if (!bg || !scene) return;
  var w = scene.scale.width;
  var h = scene.scale.height;

  // ENVELOP: uniform scale, fills screen (may crop)
  var scale = Math.max(w / bg.width, h / bg.height);
  bg.setScale(scale, scale);  // uniform scale

  // Snap to whole pixels (retina fix)
  bg.setPosition(Math.round(w / 2), Math.round(h / 2));
  bg.setOrigin(0.5, 0.5);
  bg.setScrollFactor(0);
}

// === BG PRE-RESAMPLE (iOS-safe, no mipmaps needed) ===
function makeResampledBg(scene, srcKey, outKey, targetW, targetH) {
  const tex = scene.textures.get(srcKey);
  const srcImg = tex?.getSourceImage?.();
  if (!srcImg) { console.log("[RESAMPLE] no src", srcKey); return null; }

  const W = Math.max(2, Math.round(targetW));
  const H = Math.max(2, Math.round(targetH));

  // Remove if already exists
  if (scene.textures.exists(outKey)) scene.textures.remove(outKey);

  const ctex = scene.textures.createCanvas(outKey, W, H);
  const ctx = ctex.getContext();

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(srcImg, 0, 0, W, H);

  ctex.refresh();
  try { ctex.setFilter(Phaser.Textures.FilterMode.LINEAR); } catch (e) {}

  console.log("[RESAMPLE] built", outKey, W, H);
  return outKey;
}

// ================== SPINE АНИМАЦИИ ==================
// Доступные анимации в hero.json:
// attack, crouch, crouch-from fall, fall, head-turn,
// idle, idle-from fall, jump, morningstar pose,
// run, run-from fall, walk

// Проиграть анимацию
function playAnim(animName, loop) {
  if (!window.spineHero) return false;
  try {
    window.spineHero.play(animName, loop);
    return true;
  } catch(e) {
    console.warn("[Spine] Animation not found:", animName);
    return false;
  }
}

// Атака героя
function heroAttack() {
  if (!window.spineHero) return;
  if (playAnim('attack', false)) {
    setTimeout(function() { heroIdle(); }, 400);
  }
}

// Герой получает урон (используем fall кратко)
function heroHit() {
  if (!window.spineHero) return;
  if (playAnim('fall', false)) {
    setTimeout(function() { heroIdle(); }, 200);
  }
}

// Герой умирает
function heroDeath() {
  if (!window.spineHero) return;
  playAnim('fall', false);
}

// Герой бежит
function heroRun() {
  if (!window.spineHero) return;
  playAnim('run', true);
}

// Герой идёт
function heroWalk() {
  if (!window.spineHero) return;
  playAnim('walk', true);
}

// Герой в покое
function heroIdle() {
  if (!window.spineHero) return;
  playAnim('idle', true);
}

// Герой сидит/отдыхает
function heroCrouch() {
  if (!window.spineHero) return;
  playAnim('crouch', true);
}

// Герой прыгает
function heroJump() {
  if (!window.spineHero) return;
  if (playAnim('jump', false)) {
    setTimeout(function() { heroIdle(); }, 500);
  }
}

// Критический удар (jump → attack → idle)
function heroCriticalHit() {
  if (!window.spineHero) return;
  if (playAnim('jump', false)) {
    setTimeout(function() {
      if (playAnim('attack', false)) {
        setTimeout(function() { heroIdle(); }, 400);
      }
    }, 300);
  }
}

// Герой входит на локацию (run → idle)
function heroEnterLocation() {
  if (!window.spineHero) return;
  playAnim('run', true);
  setTimeout(function() { heroIdle(); }, 1000);
}

// Поворот головы (для города)
function heroHeadTurn() {
  if (!window.spineHero) return;
  if (playAnim('head-turn', false)) {
    setTimeout(function() { heroIdle(); }, 1500);
  }
}

// Переместить героя
function moveHeroTo(x, y, anim) {
  if (window.spineHero) {
    window.spineHero.setPosition(x, y);
    window.spineHero.setVisible(true);
    if (anim) {
      playAnim(anim, true);
    } else {
      heroIdle();
    }
  }
}

// Скрыть героя
function hideHero() {
  if (window.spineHero) window.spineHero.setVisible(false);
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

  // Фоны (город - высокое разрешение PNG)
  this.load.image("talkingisland_main", "assets/backgrounds/talking_island.png");
  this.load.image("obelisk_of_victory", "assets/backgrounds/obelisk_of_victory.png");
  this.load.image("northern_territory", "assets/backgrounds/northern_territory.png");
  this.load.image("elven_ruins", "assets/backgrounds/elven_ruins.png");
  this.load.image("orc_barracks", "assets/backgrounds/orc_barracks.png");

  // UI
  this.load.image("map_world", "assets/ui/map_world.png");
  // this.load.image("ui_bottom_panel", "assets/ui/Bottom_panel.webp"); // REMOVED: file deleted

  // Новая нижняя панель
  this.load.image('ui_bottom', 'assets/ui/bottom.png');
  this.load.image('ui_btn_fight', 'assets/ui/btn_fight_base.png');
  this.load.image('icon_store', 'assets/ui/icon_store.png');
  this.load.image('icon_anvil', 'assets/ui/icon_anvil.png');
  this.load.image('icon_helmet', 'assets/ui/icon_helmet.png');
  this.load.image('icon_map', 'assets/ui/icon_map.png');

  // Экран регистрации
  this.load.image("registration_bg", "assets/intro/registration.png");

  // Spine анимация героя
  this.load.spine('hero', 'assets/spine/hero.json', 'assets/spine/hero.atlas');
}

// FPS текст для диагностики (создаётся в create)
let fpsText = null;

function update(time, delta) {
  // FPS диагностика
  if (fpsText) {
    fpsText.setText('FPS: ' + Math.round(this.game.loop.actualFps));
  }

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

  // === RENDER DIAG (pixelated root-cause) ===
  const canvas = this.game?.canvas;
  if (canvas) {
    const cs = window.getComputedStyle(canvas);
    console.log("[RENDER][CSS]", {
      imageRendering: cs.imageRendering,
      transform: cs.transform,
      width: cs.width,
      height: cs.height,
    });
  } else {
    console.warn("[RENDER] canvas missing in create()");
  }

  console.log("[RENDER][CFG]", {
    rendererType: this.game?.renderer?.type, // 2=WebGL, 1=Canvas
    antialiasCfg: this.game?.config?.render?.antialias,
    pixelArtCfg: this.game?.config?.render?.pixelArt,
    roundPixelsCfg: this.game?.config?.render?.roundPixels,
    cameraRoundPixels: this.cameras?.main?.roundPixels,
  });

  // Helper to inspect texture filter modes
  function logTexFilter(scene, key) {
    const t = scene.textures?.get(key);
    if (!t) return console.warn("[TEX] missing:", key);
    // Phaser stores filterMode on Texture in WebGL builds
    console.log("[TEX][FILTER]", key, {
      filterMode: t.filterMode, // expect LINEAR (1) not NEAREST (0)
      source: t.source?.[0] ? [t.source[0].width, t.source[0].height] : "na",
    });
  }

  // Canvas reference (with null check)
  const c = this.game.canvas;
  if (!c) {
    console.error("[FATAL] canvas is null/undefined in create()");
    return;
  }
  const r = c.getBoundingClientRect();

  // === COMPACT MOBILE DIAGNOSTIC ===
  console.log("[MOBCHK]",
    "BASE", BASE_W, BASE_H,
    "scale", this.scale.width, this.scale.height,
    "disp", this.scale.displaySize?.width, this.scale.displaySize?.height,
    "canvasWH", c?.width, c?.height,
    "css", r ? r.width.toFixed(0) + "x" + r.height.toFixed(0) : "na",
    "parent", c?.parentElement?.clientWidth, c?.parentElement?.clientHeight,
    "dpr", window.devicePixelRatio
  );

  // === WEBGL CONTEXT LOST DETECTION ===
  const cv = this.game.canvas;
  cv?.addEventListener("webglcontextlost", (e) => { e.preventDefault(); console.error("[WEBGL] context lost"); });
  cv?.addEventListener("webglcontextrestored", () => console.log("[WEBGL] context restored"));

  // === DIAGNOSTIC LOGS (DPI CHECK) ===
  console.log("[DPI CHECK]", {
    dpr: window.devicePixelRatio,
    isMobile,
    desiredRes: RESOLUTION,
    backing: [c.width, c.height],
    css: [r.width.toFixed(1), r.height.toFixed(1)],
    cfgRes: this.game.config?.resolution,
    rCfgRes: this.game.renderer?.config?.resolution,
    hasGL: !!this.game.renderer?.gl,
  });
  console.log("[BACKING] actual:", this.game.canvas.width, this.game.canvas.height);
  console.log("[RESOLUTION] config:", this.game.config.resolution, "renderer:", this.game.renderer.resolution);

  // === QUALITY DIAGNOSTIC ===
  const dpr = window.devicePixelRatio || 1;
  const cssW = r.width;
  const cssH = r.height;
  const physicalPixelsNeeded = Math.round(cssW * dpr);
  const qualityRatio = (c.width / physicalPixelsNeeded * 100).toFixed(0);
  console.log("[QUALITY] Canvas backing:", c.width, "x", c.height);
  console.log("[QUALITY] CSS size:", Math.round(cssW), "x", Math.round(cssH));
  console.log("[QUALITY] Physical pixels needed:", physicalPixelsNeeded, "(DPR:", dpr + ")");
  console.log("[QUALITY] Quality ratio:", qualityRatio + "% ← " + (qualityRatio < 80 ? "LOW QUALITY!" : "OK"));

  // === DIAGNOSTIC LOGS (SCALE MODE) ===
  console.log("[SCALE MODE]", this.scale.scaleMode);

  // === DIAGNOSTIC LOGS (VIEWPORT) ===
  const p = c.parentElement;
  const vv = window.visualViewport;
  console.log("[VIEWPORT]",
    "parent", p?.clientWidth, p?.clientHeight,
    "inner", window.innerWidth, window.innerHeight,
    "vv", vv ? [vv.width, vv.height, vv.offsetTop] : null
  );

  console.log("[VIEWPORT] container styles:", {
    width: document.getElementById('game-container')?.style.width,
    height: document.getElementById('game-container')?.style.height,
    cssWidth: document.getElementById('game-container')?.clientWidth,
    cssHeight: document.getElementById('game-container')?.clientHeight,
  });

  console.log("[VIEWPORT] canvas styles:", {
    canvasWidth: this.game.canvas?.style.width,
    canvasHeight: this.game.canvas?.style.height,
    canvasClientW: this.game.canvas?.clientWidth,
    canvasClientH: this.game.canvas?.clientHeight,
  });

  // === FORCE SMOOTHING ===
  if (canvas) {
    canvas.style.imageRendering = "auto";
    canvas.style.setProperty("image-rendering", "auto");
    canvas.style.setProperty("-ms-interpolation-mode", "bicubic");
  }

  if (this.cameras?.main) {
    this.cameras.main.roundPixels = false;
  }

  loadGame();

  // FIX C: safeRecalc only in non-CITY_CLEAN mode
  if (window.UI_MODE !== "CITY_CLEAN") {
    safeRecalc(this);
  }

  const scene = this;
  window.gameScene = this; // для доступа из панелей

  // Логические координаты (теперь без деления на DPR - resolution в config)
  const w = this.scale.width;
  const h = this.scale.height;
  const centerX = w / 2;
  const centerY = h / 2;

  // AudioContext fix для TMA (resume после первого клика)
  this.input.once("pointerdown", () => {
    if (this.sound && this.sound.context && this.sound.context.state === "suspended") {
      this.sound.context.resume();
    }
  });

  // фоны
  cityBg = this.add.image(w / 2, h / 2, "talkingisland_main");

  // STEP 1: Before any scaling
  console.log("[BG] step1 - texture:", cityBg.texture.source[0].width, "x", cityBg.texture.source[0].height);
  console.log("[BG] step1 - natural size:", cityBg.width, "x", cityBg.height);

  fitBackground(cityBg, this);

  // STEP 2: After fit scale
  console.log("[BG] step2 - after fit scale:", cityBg.scaleX.toFixed(4), cityBg.scaleY.toFixed(4));
  console.log("[BG] step2 - scaleX === scaleY?", cityBg.scaleX === cityBg.scaleY);
  console.log("[BG] step2 - display:", cityBg.displayWidth.toFixed(1), "x", cityBg.displayHeight.toFixed(1));

  cityBg.setDepth(10);  // Background behind UI
  window.cityBg = cityBg;

  // STEP 3: Before resample
  console.log("[BG] step3 - before resample display:", cityBg.displayWidth.toFixed(1), "x", cityBg.displayHeight.toFixed(1));
  console.log("[BG] step3 - ratio:", (cityBg.displayWidth / cityBg.displayHeight).toFixed(4));

  // Resample in DEVICE PIXELS
  const targetWpx = Math.round(cityBg.displayWidth * dprCap);
  const targetHpx = Math.round(cityBg.displayHeight * dprCap);
  console.log("[RESAMPLE] target device px:", targetWpx, targetHpx);

  const rsKey = makeResampledBg(this, "talkingisland_main", "talkingisland_main_rs", targetWpx, targetHpx);
  if (rsKey) {
    cityBg.setTexture(rsKey);
    cityBg.setScale(0.48);  // Tuned scale
    // Adaptive background position (center + offset)
    // offset: +2 X, +225 Y from center
    cityBg.setPosition(w / 2 + 2, h / 2 + 225);

    // STEP 4: After resample
    console.log("[BG] step4 - after resample scale:", cityBg.scaleX.toFixed(4), cityBg.scaleY.toFixed(4));
    console.log("[BG] step4 - display:", cityBg.displayWidth.toFixed(1), "x", cityBg.displayHeight.toFixed(1));
    console.log("[BG] step4 - ratio:", (cityBg.displayWidth / cityBg.displayHeight).toFixed(4));
  }

  // === TUNE MODE CONTROLS ===
  if (TUNE_ENABLED) {
    const bgBaseScale = cityBg.scaleX;
    let selectedElement = 'bg'; // 'bg', 'panel', 'hero', 'btn', 'icon0'-'icon3'
    const STEP = 1;
    const SCALE_STEP = 0.02;

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'tune-overlay';
    overlay.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.9);color:#0f0;padding:12px;font:11px monospace;z-index:99999;border-radius:5px;min-width:240px;';
    overlay.addEventListener('pointerdown', e => e.stopPropagation());
    overlay.innerHTML = `
      <b>🎮 TUNE MODE</b> [<span id="tune-sel" style="color:#ff0">bg</span>]<br>
      <hr style="border-color:#333;margin:5px 0">
      <div id="tune-values" style="line-height:1.4"></div>
      <hr style="border-color:#333;margin:5px 0">
      <small>1-8: select | Arrows: move | Q/E: scale</small><br>
      <small>Drag: move | Click: select</small>
      <div style="margin-top:10px;display:flex;gap:5px;">
        <button id="tune-save" style="flex:1;padding:5px;cursor:pointer">💾 SAVE</button>
        <button id="tune-reset" style="padding:5px;cursor:pointer">🔄</button>
        <button id="tune-copy" style="padding:5px;cursor:pointer">📋</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const selColors = { bg:'#0f0', panel:'#ff0', hero:'#0ff', btn:'#f0f', icon0:'#f80', icon1:'#f80', icon2:'#f80', icon3:'#f80' };

    // Get current UI state (call fresh each time)
    const getUI = () => ({
      cont: window.panelContainer,
      panel: window.bottomUI?.bottomPanel,
      btn: window.bottomUI?.fightBtn,
      icons: window.bottomUI?.icons || [],
      hero: window.spineHero
    });

    const updateOverlay = () => {
      const { cont, panel, btn, icons, hero } = getUI();
      document.getElementById('tune-sel').style.color = selColors[selectedElement] || '#fff';
      document.getElementById('tune-sel').textContent = selectedElement;

      let h = '';
      h += `<b style="color:#0f0">1.BG:</b> ${cityBg.x.toFixed(0)},${cityBg.y.toFixed(0)} s:${cityBg.scaleX.toFixed(2)}<br>`;
      h += `<b style="color:#ff0">2.Panel:</b> cont(${cont?.x.toFixed(0)},${cont?.y.toFixed(0)}) s:${panel?.scaleX.toFixed(2)}<br>`;
      h += `<b style="color:#0ff">3.Hero:</b> ${hero?.x.toFixed(0)},${hero?.y.toFixed(0)} s:${hero?.scaleX.toFixed(2)}<br>`;
      h += `<b style="color:#f0f">4.Btn:</b> ${btn?.x.toFixed(0)},${btn?.y.toFixed(0)} s:${btn?.scaleX.toFixed(2)}<br>`;
      h += `<b style="color:#f80">5-8.Icons:</b><br>`;
      icons.forEach((ic, i) => {
        h += `  ${i}: (${ic.x.toFixed(0)},${ic.y.toFixed(0)}) s:${ic.scaleX.toFixed(2)}<br>`;
      });
      document.getElementById('tune-values').innerHTML = h;
    };

    // SAVE - captures ACTUAL current positions
    document.getElementById('tune-save').onclick = () => {
      const { cont, panel, btn, icons, hero } = getUI();
      const settings = {
        // Background
        bgX: cityBg.x,
        bgY: cityBg.y,
        bgScale: cityBg.scaleX,
        // Container position
        containerX: cont?.x,
        containerY: cont?.y,
        // Panel scale (inside container)
        panelScale: panel?.scaleX,
        // Hero
        heroX: hero?.x,
        heroY: hero?.y,
        heroScale: hero?.scaleX,
        // Button (relative to container)
        btnX: btn?.x,
        btnY: btn?.y,
        btnScale: btn?.scaleX,
        // Icons (relative to container)
        iconScale: icons[0]?.scaleX,
        icon0: { x: icons[0]?.x, y: icons[0]?.y },
        icon1: { x: icons[1]?.x, y: icons[1]?.y },
        icon2: { x: icons[2]?.x, y: icons[2]?.y },
        icon3: { x: icons[3]?.x, y: icons[3]?.y }
      };
      const json = JSON.stringify(settings, null, 2);
      localStorage.setItem('TUNE_SETTINGS', json);
      navigator.clipboard?.writeText(json);
      console.log("[TUNE] SAVED:\n" + json);
      alert("SAVED!\n\n" + json);
    };

    document.getElementById('tune-reset').onclick = () => {
      localStorage.removeItem('TUNE_SETTINGS');
      alert('localStorage cleared! Reload page.');
      location.reload();
    };

    document.getElementById('tune-copy').onclick = () => {
      const { cont, panel, btn, icons, hero } = getUI();
      const txt = `Container: ${cont?.x},${cont?.y}\nBtn: ${btn?.x},${btn?.y} s:${btn?.scaleX}\nIcons: ${icons.map(i=>`(${i.x},${i.y})`).join(' ')} s:${icons[0]?.scaleX}`;
      navigator.clipboard?.writeText(txt);
      alert('Copied!\n' + txt);
    };

    // Drag handling
    let dragging = false, startX = 0, startY = 0;

    this.input.on('pointerdown', (p) => {
      const { cont, panel, btn, icons, hero } = getUI();
      console.log('[TUNE] Click at', p.x, p.y, 'icons:', icons.length);

      // Detect what was clicked
      for (let i = 0; i < icons.length; i++) {
        const bounds = icons[i]?.getBounds();
        if (bounds?.contains(p.x, p.y)) {
          selectedElement = 'icon' + i;
          console.log('[TUNE] Selected icon' + i);
          dragging = true; startX = p.x; startY = p.y;
          updateOverlay(); return;
        }
      }
      if (btn?.getBounds()?.contains(p.x, p.y)) {
        selectedElement = 'btn';
      } else if (panel?.getBounds()?.contains(p.x, p.y)) {
        selectedElement = 'panel';
      } else if (hero && Math.abs(p.x - hero.x) < 100 && Math.abs(p.y - hero.y) < 200) {
        // Spine doesn't have getBounds, use simple distance check
        selectedElement = 'hero';
      } else {
        selectedElement = 'bg';
      }
      console.log('[TUNE] Selected', selectedElement);
      dragging = true; startX = p.x; startY = p.y;
      updateOverlay();
    });

    this.input.on('pointermove', (p) => {
      if (!dragging) return;
      const { cont, btn, icons, hero } = getUI();
      const dx = p.x - startX, dy = p.y - startY;
      startX = p.x; startY = p.y;

      if (selectedElement === 'bg') {
        cityBg.x += dx; cityBg.y += dy;
      } else if (selectedElement === 'panel' && cont) {
        cont.x += dx; cont.y += dy;
      } else if (selectedElement === 'hero' && hero) {
        hero.x += dx; hero.y += dy;
      } else if (selectedElement === 'btn' && btn) {
        btn.x += dx; btn.y += dy;
      } else if (selectedElement.startsWith('icon')) {
        const i = parseInt(selectedElement[4]);
        if (icons[i]) { icons[i].x += dx; icons[i].y += dy; }
      }
      updateOverlay();
    });

    this.input.on('pointerup', () => { dragging = false; });

    // Arrow keys move selected element
    const moveSelected = (dx, dy) => {
      const { cont, btn, icons, hero } = getUI();

      if (selectedElement === 'bg') {
        cityBg.x += dx; cityBg.y += dy;
      }
      else if (selectedElement === 'panel' && cont) {
        cont.x += dx; cont.y += dy;
      }
      else if (selectedElement === 'hero' && hero) {
        hero.x += dx; hero.y += dy;
      }
      else if (selectedElement === 'btn' && btn) {
        btn.x += dx; btn.y += dy;
      }
      else if (selectedElement.startsWith('icon')) {
        const idx = parseInt(selectedElement.replace('icon', ''));
        console.log('[TUNE] Moving icon', idx, 'icons:', icons.length);
        if (icons[idx]) {
          icons[idx].x += dx;
          icons[idx].y += dy;
          console.log('[TUNE] Icon', idx, 'new pos:', icons[idx].x, icons[idx].y);
        }
      }
      updateOverlay();
    };

    this.input.keyboard.on('keydown-UP', () => moveSelected(0, -STEP));
    this.input.keyboard.on('keydown-DOWN', () => moveSelected(0, STEP));
    this.input.keyboard.on('keydown-LEFT', () => moveSelected(-STEP, 0));
    this.input.keyboard.on('keydown-RIGHT', () => moveSelected(STEP, 0));

    // Q/E for scale
    const scaleSelected = (delta) => {
      const { panel, btn, icons, hero } = getUI();
      if (selectedElement === 'bg') {
        cityBg.setScale(cityBg.scaleX + delta);
      } else if (selectedElement === 'panel' && panel) {
        panel.setScale(panel.scaleX + delta);
      } else if (selectedElement === 'hero' && hero) {
        hero.setScale(hero.scaleX + delta);
      } else if (selectedElement === 'btn' && btn) {
        window.fightBtnTween?.stop();
        btn.setScale(btn.scaleX + delta);
      } else if (selectedElement.startsWith('icon')) {
        // Scale single icon
        const idx = parseInt(selectedElement.replace('icon', ''));
        if (icons[idx]) icons[idx].setScale(icons[idx].scaleX + delta);
      }
      updateOverlay();
    };

    this.input.keyboard.on('keydown-E', () => scaleSelected(SCALE_STEP));
    this.input.keyboard.on('keydown-Q', () => scaleSelected(-SCALE_STEP));

    // Number keys 1-8 to select
    this.input.keyboard.on('keydown-ONE', () => { selectedElement = 'bg'; updateOverlay(); });
    this.input.keyboard.on('keydown-TWO', () => { selectedElement = 'panel'; updateOverlay(); });
    this.input.keyboard.on('keydown-THREE', () => { selectedElement = 'hero'; updateOverlay(); });
    this.input.keyboard.on('keydown-FOUR', () => { selectedElement = 'btn'; updateOverlay(); });
    this.input.keyboard.on('keydown-FIVE', () => { selectedElement = 'icon0'; updateOverlay(); });
    this.input.keyboard.on('keydown-SIX', () => { selectedElement = 'icon1'; updateOverlay(); });
    this.input.keyboard.on('keydown-SEVEN', () => { selectedElement = 'icon2'; updateOverlay(); });
    this.input.keyboard.on('keydown-EIGHT', () => { selectedElement = 'icon3'; updateOverlay(); });

    // Initial overlay update after UI loads
    setTimeout(updateOverlay, 500);

    console.log('[TUNE] Ready! Keys: 1-8 select, Arrows move, Q/E scale, Drag to move');
  }

  locationBg = this.add.image(w / 2, h / 2, "obelisk_of_victory");
  fitBackground(locationBg, this);
  locationBg.setDepth(10);  // Same as cityBg
  locationBg.setVisible(false);

  console.log("[DEPTH] cityBg:", cityBg.depth, "locationBg:", locationBg.depth);

  // === RENDER DIAGNOSTICS ===
  console.log("[RENDER] Scene children:", this.children?.list?.length);
  console.log("[RENDER] Background:", typeof cityBg, "visible:", cityBg?.visible, "alpha:", cityBg?.alpha);
  console.log("[RENDER] cityBg position:", cityBg?.x, cityBg?.y, "scale:", cityBg?.scaleX, cityBg?.scaleY);

  // === DIAGNOSTIC: Background scaling ===
  const bgTex = this.textures.get("talkingisland_main");
  const bgSrc = bgTex?.getSourceImage();
  console.log("[BG]", {
    texSize: [bgSrc?.width, bgSrc?.height],
    scaleX: cityBg.scaleX.toFixed(3),
    scaleY: cityBg.scaleY.toFixed(3),
    uniform: cityBg.scaleX === cityBg.scaleY,
    displaySize: [cityBg.displayWidth.toFixed(1), cityBg.displayHeight.toFixed(1)],
    pos: [cityBg.x.toFixed(1), cityBg.y.toFixed(1)],
    filterMode: bgTex?.filterMode,
  });

  // Hero position (adaptive: center-X + offset, bottom + offset)
  const heroX = w / 2 + HERO_OFFSET.x;
  const heroY = h + HERO_OFFSET.y;
  heroStartX = heroX;
  heroStartY = heroY;

  // Создаём Spine героя
  if (this.spine) {
    try {
      spineHero = this.add.spine(heroX, heroY, 'hero', 'idle', true);
      spineHero.setScale(HERO_OFFSET.scale);
      spineHero.setDepth(100);  // Above background (10), below UI (200)
      spineHero.setVisible(true);
      spineHero.setScrollFactor(0);  // Fixed on screen
      window.spineHero = spineHero;
      hero = spineHero;
      console.log("[HERO] Adaptive pos:", heroX, heroY, "scale:", HERO_OFFSET.scale);
    } catch (e) {
      console.warn("[Spine] Failed:", e.message);
      hero = createHeroSprite(this, heroX, heroY, 0x3366cc);
      hero.setDepth(50);
    }
  } else {
    hero = createHeroSprite(this, heroX, heroY, 0x3366cc);
    hero.setDepth(50);
  }

  // герой в городе
  cityHero = window.spineHero || hero;

  // === CITY_CLEAN MODE: Skip all UI, baseline only ===
  if (window.UI_MODE === "CITY_CLEAN") {
    if (window.preEntry?.skip) window.preEntry.skip();

    // FPS счётчик для диагностики
    fpsText = this.add.text(10, 10, 'FPS: --', {
      fontSize: '16px',
      fill: '#00ff00',
      backgroundColor: '#000000'
    }).setDepth(9999).setScrollFactor(0);

    // Лог производительности
    console.log('[PERF] DPR:', window.devicePixelRatio);
    console.log('[PERF] Canvas:', this.game.canvas.width, 'x', this.game.canvas.height);
    console.log('[PERF] Textures loaded:', this.textures.list ? Object.keys(this.textures.list).length : 'N/A');
    console.log('[PERF] Children count:', this.children.list.length);

    // === BOTTOM BAR (even in CITY_CLEAN) ===
    if (typeof createBottomUI === "function") {
      const bottomUI = createBottomUI(this);
      window.bottomUI = bottomUI;

      // Capture FIGHTBTN_BASE for tune mode (before any modifications)
      if (bottomUI.fightBtn && !FIGHTBTN_BASE) {
        FIGHTBTN_BASE = {
          x: bottomUI.fightBtn.x,
          y: bottomUI.fightBtn.y,
          scale: bottomUI.fightBtn.scaleX
        };
        console.log("[TUNE] FIGHTBTN_BASE captured:", FIGHTBTN_BASE);
      }

      // Apply tune settings after UI is created (works for both production and tune mode)
      const tune = getTuneSettings();
      console.log("[TUNE] Applied settings:", JSON.stringify(tune, null, 2));

      // Apply production settings with delay (wait for elements to be positioned)
      setTimeout(() => {
        // Background
        if (window.cityBg) {
          const baseScale = window.cityBg.scaleX / (tune.bgZoom || 1);
          window.cityBg.setScale(baseScale * tune.bgZoom);
          window.cityBg.y += tune.bgPanY;
          window.cityBg.x += tune.bgPanX;
        }

        // Hero - only apply tune offsets in tune mode
        if (window.spineHero && TUNE_ENABLED) {
          const baseX = w / 2 + HERO_OFFSET.x;
          const baseY = h + HERO_OFFSET.y;
          window.spineHero.x = baseX + tune.heroX;
          window.spineHero.y = baseY + tune.heroY;
          window.spineHero.setScale(HERO_OFFSET.scale * tune.heroScale);
          console.log("[TUNE] Hero adjusted by:", tune.heroX, tune.heroY);
        }

        // Container position (moves panel + button + icons together)
        // NOTE: Don't modify children directly, container handles positioning!
        if (window.panelContainer) {
          window.panelContainer.x += tune.panelX;
          window.panelContainer.y -= tune.panelY;
        }

        console.log("[TUNE] Production settings applied");
      }, 150);

      // Also trigger applyTune in tune mode for interactive adjustments
      if (TUNE_ENABLED && window.applyTune) {
        setTimeout(() => window.applyTune(), 200);
      }

      // Container handles depth/scrollFactor - no need to set on children

      // 2) getSafeRect — вычисляет видимую область в game-координатах
      const getSafeRect = () => {
        const s = this.scale;
        const parent = this.game.canvas.parentElement;

        const cssPerGameY = s.displaySize.height / s.height || 1;
        const cssPerGameX = s.displaySize.width / s.width || 1;

        const vhCss = parent?.clientHeight || window.innerHeight || 1;
        const vwCss = parent?.clientWidth || window.innerWidth || 1;

        const visibleH = vhCss / cssPerGameY;
        const visibleW = vwCss / cssPerGameX;

        const cropY = Math.max(0, (s.height - visibleH) / 2);
        const cropX = Math.max(0, (s.width - visibleW) / 2);

        return {
          left: cropX,
          right: s.width - cropX,
          top: cropY,
          bottom: s.height - cropY,
          width: s.width - cropX * 2,
          height: s.height - cropY * 2,
          centerX: s.width / 2,
          centerY: s.height / 2
        };
      };

      // 3) layoutUI — позиционирует элементы от bounds панели
      const scene = this;
      const layoutUI = () => {
        const safe = getSafeRect();

        // Base pad
        const basePad = 8;

        // Extra safe-bottom (iOS/Telegram bottom chrome)
        const vv = window.visualViewport;
        const eatenCss = vv ? Math.max(0, (window.innerHeight - vv.height - vv.offsetTop)) : 0;

        // Convert CSS px -> game px
        const s = scene.scale;
        const cssPerGameY = (s.displaySize.height / s.height) || 1;
        const extraPadGame = eatenCss / cssPerGameY;

        // Final pad
        const pad = basePad + extraPadGame;

        console.log("[UI] safeBottom", {
          eatenCss: Math.round(eatenCss),
          extraPadGame: extraPadGame.toFixed(1),
          pad: pad.toFixed(1)
        });

        // Container position is hardcoded - don't move it
        // const cont = window.panelContainer;
        // if (cont) {
        //   cont.x = Math.round(safe.centerX);
        //   cont.y = Math.round(safe.bottom - pad);
        // }
        console.log("[UI] layoutUI - skipped (positions hardcoded)");
      };

      layoutUI();

      if (!window.__uiLayoutBound) {
        this.scale.on("resize", layoutUI);
        window.visualViewport?.addEventListener("resize", layoutUI);
        window.__uiLayoutBound = true;
      }

      console.log("[UI] Bottom bar elements:",
        "panel:", !!bottomUI.bottomPanel,
        "btn:", !!bottomUI.fightBtn,
        "icons:", bottomUI.icons?.length || 0
      );
    } else {
      console.warn("[UI] createBottomUI not found");
    }

    console.log("[UI] CITY_CLEAN baseline ready");

    // === TEXTURE DIAGNOSTICS (with effective device pixels) ===
    const RES = this.game?.config?.resolution || window.devicePixelRatio || 1;

    const logTex = (key, obj) => {
      const t = this.textures.get(key);
      const img = t?.getSourceImage?.();
      const sw = img?.width, sh = img?.height;

      const dw = obj?.displayWidth ?? obj?.width;
      const dh = obj?.displayHeight ?? obj?.height;

      const effW = (dw && RES) ? dw * RES : null;
      const effH = (dh && RES) ? dh * RES : null;

      const upX = (sw && effW) ? (effW / sw).toFixed(2) : "na";
      const upY = (sh && effH) ? (effH / sh).toFixed(2) : "na";

      console.log("[TEX]", key, {
        source: [sw, sh],
        displayGame: [dw?.toFixed?.(1), dh?.toFixed?.(1)],
        res: RES,
        displayDevicePx: [effW?.toFixed?.(0), effH?.toFixed?.(0)],
        upscale: [upX, upY],
      });

      // CHANGE 4: Warn if asset is being upscaled significantly
      if (parseFloat(upX) > 1.1 || parseFloat(upY) > 1.1) {
        console.warn("[TEX] UPSCALE detected -> asset too small for retina:", key);
      }
    };

    // Log all loaded textures
    console.log("[TEX] === Texture Analysis ===");

    // Background - find the key used for city background
    this.textures.list && Object.keys(this.textures.list).forEach(key => {
      if (key.includes('bg') || key.includes('city') || key.includes('island') || key.includes('panel') || key.includes('bottom') || key.includes('btn')) {
        const t = this.textures.get(key);
        const img = t?.getSourceImage?.();
        if (img) {
          console.log("[TEX]", key, "source:", img.width + "x" + img.height);
        }
      }
    });

    // === FORCE LINEAR FILTER for bg + UI ===
    const LINEAR = Phaser.Textures.FilterMode.LINEAR;

    const smoothKeys = [
      "talkingisland_main",   // background
      "ui_bottom",            // bottom panel
      "ui_btn_fight",         // fight button
      "icon_store",           // icons
      "icon_anvil",
      "icon_helmet",
      "icon_map",
    ];

    smoothKeys.forEach((k) => {
      const t = this.textures.get(k);
      if (t?.setFilter) {
        t.setFilter(LINEAR);
        console.log("[FILTER] LINEAR set:", k);
      } else {
        console.warn("[FILTER] cannot setFilter for:", k, "type:", t?.constructor?.name);
      }
      logTexFilter(this, k);
    });

    // === DIAGNOSTIC: UI panel scaling ===
    if (window.bottomUI?.bottomPanel) {
      const p = window.bottomUI.bottomPanel;
      const pTex = this.textures.get("ui_bottom");
      const pSrc = pTex?.getSourceImage();
      console.log("[UI-PANEL]", {
        texSize: [pSrc?.width, pSrc?.height],
        scaleX: p.scaleX.toFixed(3),
        scaleY: p.scaleY.toFixed(3),
        uniform: Math.abs(p.scaleX - p.scaleY) < 0.001,
        displaySize: [p.displayWidth.toFixed(1), p.displayHeight.toFixed(1)],
        pos: [p.x.toFixed(1), p.y.toFixed(1)],
        filterMode: pTex?.filterMode,
      });
    }

    if (window.bottomUI?.fightBtn) {
      const btn = window.bottomUI.fightBtn;
      const btnTex = this.textures.get("ui_btn_fight");
      const btnSrc = btnTex?.getSourceImage();
      console.log("[UI-BTN]", {
        texSize: [btnSrc?.width, btnSrc?.height],
        scaleX: btn.scaleX.toFixed(3),
        scaleY: btn.scaleY.toFixed(3),
        uniform: Math.abs(btn.scaleX - btn.scaleY) < 0.001,
        displaySize: [btn.displayWidth.toFixed(1), btn.displayHeight.toFixed(1)],
        pos: [btn.x.toFixed(1), btn.y.toFixed(1)],
        filterMode: btnTex?.filterMode,
      });
    }

    // Log specific objects
    if (window.cityBg) logTex("talkingisland_main", window.cityBg);
    if (window.bottomUI?.bottomPanel) logTex("ui_bottom", window.bottomUI.bottomPanel);
    if (window.bottomUI?.fightBtn) logTex("ui_btn_fight", window.bottomUI.fightBtn);

    // === TEXTURE SIZE ANALYSIS ===
    console.log("[TEX-SIZE] === Texture Optimization Report ===");

    const analyzeTexture = (key, displayObj) => {
      const tex = this.textures.get(key);
      const srcW = tex?.source?.[0]?.width || 0;
      const srcH = tex?.source?.[0]?.height || 0;

      const dispW = displayObj?.displayWidth || 0;
      const dispH = displayObj?.displayHeight || 0;

      const optimalW = Math.ceil(dispW * 1.5);  // 1.5x for quality headroom
      const optimalH = Math.ceil(dispH * 1.5);

      const ratio = srcW / Math.max(1, dispW);
      const wastedKB = Math.round((srcW * srcH - optimalW * optimalH) * 4 / 1024);

      const status = ratio > 3 ? '🔴 OVERSIZED' : ratio > 2 ? '🟡 BIG' : '🟢 OK';

      console.log(`[TEX-SIZE] ${key}:`);
      console.log(`  Source: ${srcW}×${srcH}`);
      console.log(`  Display: ${dispW.toFixed(0)}×${dispH.toFixed(0)}`);
      console.log(`  Optimal: ${optimalW}×${optimalH}`);
      console.log(`  Ratio: ${ratio.toFixed(1)}x ${status}`);
      if (wastedKB > 100) console.log(`  Wasted GPU memory: ~${wastedKB} KB`);
    };

    const ui = window.bottomUI;
    if (ui) {
      if (ui.bottomPanel) analyzeTexture('ui_bottom', ui.bottomPanel);
      if (ui.fightBtn) analyzeTexture('ui_btn_fight', ui.fightBtn);
      if (ui.icons?.[0]) analyzeTexture('icon_helmet', ui.icons[0]);
      if (ui.icons?.[1]) analyzeTexture('icon_anvil', ui.icons[1]);
    }

    // Background too
    if (window.cityBg) analyzeTexture('talkingisland_main', window.cityBg);

    // === ICON VISIBILITY DIAGNOSTIC ===
    console.log("[ICON-DIAG] === FINAL ICON STATE ===");
    const canvas = this.game.canvas;
    const cam = this.cameras.main;
    console.log("[ICON-DIAG] Canvas:", canvas.width, "x", canvas.height);
    console.log("[ICON-DIAG] Game config:", this.game.config.width, "x", this.game.config.height);
    console.log("[ICON-DIAG] Camera bounds:", cam.x, cam.y, cam.width, cam.height);
    console.log("[ICON-DIAG] Camera scroll:", cam.scrollX, cam.scrollY);
    console.log("[ICON-DIAG] Camera zoom:", cam.zoom);

    if (window.bottomUI?.icons) {
      window.bottomUI.icons.forEach((ic, i) => {
        const tex = this.textures.get(ic.texture?.key);
        const srcImg = tex?.getSourceImage?.();
        console.log(`[ICON-DIAG] Icon ${i}:`, {
          key: ic.texture?.key,
          pos: [ic.x, ic.y],
          scale: ic.scale,
          displaySize: [ic.displayWidth?.toFixed(1), ic.displayHeight?.toFixed(1)],
          visible: ic.visible,
          alpha: ic.alpha,
          depth: ic.depth,
          scrollFactor: [ic.scrollFactorX, ic.scrollFactorY],
          active: ic.active,
          parent: ic.parentContainer ? 'CONTAINER' : 'scene',
          texLoaded: !!srcImg,
          texSize: srcImg ? [srcImg.width, srcImg.height] : null,
        });
      });

      // Check if icons are within visible area
      const icon0 = window.bottomUI.icons[0];
      if (icon0) {
        const inBounds = icon0.y >= 0 && icon0.y <= this.game.config.height;
        console.log("[ICON-DIAG] Icon0 y=" + icon0.y + " vs game height=" + this.game.config.height + " -> " + (inBounds ? "IN BOUNDS" : "OUT OF BOUNDS"));
      }
    } else {
      console.error("[ICON-DIAG] NO ICONS FOUND in window.bottomUI!");
    }

    // Check panel position
    if (window.bottomUI?.bottomPanel) {
      const p = window.bottomUI.bottomPanel;
      console.log("[ICON-DIAG] Panel pos:", p.x, p.y, "visible:", p.visible, "alpha:", p.alpha);
    }

    return;
  }

  // ============================================================
  // FIX A: All UI code below ONLY runs when NOT CITY_CLEAN
  // ============================================================

  // Новая нижняя панель UI (bottom.png)
  const bottomUI = createBottomUI(this);
  window.bottomUI = bottomUI;

  // Нижняя UI панель (поверх фона, всегда видна)
  uiBottomPanel = this.add.image(w / 2, h, "ui_bottom_panel");
  uiBottomPanel.setOrigin(0.5, 1);
  var panelScale = w / uiBottomPanel.width;
  uiBottomPanel.setScale(panelScale);
  uiBottomPanel.setDepth(100);
  uiBottomPanel.setScrollFactor(0);
  uiBottomPanel.setAlpha(0.92);

  // музыка
  cityMusic = scene.sound.add("city_theme", { loop: true, volume: 0.6 });
  battleMusic = scene.sound.add("battle_theme", { loop: true, volume: 0.6 });

  const enemyX = w * 0.75;
  const enemyY = h * 0.65;

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

  // НАЁМНИК
  merc = createHeroSprite(this, heroStartX - 80, heroStartY, 0x6a0dad);
  merc.setVisible(false);
  merc.setScale(0.8);

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

  // первые обновления UI
  updateHeroUI();
  updateLocationLabel();
  updateSkillButtonsUI();
  updateMercStatsFromHero();

  // Enemy click handler
  safeOn(enemy, "pointerdown", function () {
    if (mode !== "location") return;
    if (isAttacking) return;
    if (!enemyAlive) return;
    if (stats.hp <= 0) return;
    startHeroAttack(scene);
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

  // оффлайн-прогресс
  applyOfflineProgress(scene);

  // Интеграция с preEntry
  if (!profile.race || !profile.archetype) {
    // Новый игрок — показываем интро
    if (window.preEntry) {
      window.preEntry.showIntro(function() {
        if (window.preEntry.showLoading) {
          window.preEntry.showLoading();
        }
        setTimeout(function() {
          window.preEntry.hide();
          if (window.characterCreation) {
            window.characterCreation.show(scene);
          }
        }, 300);
      });
    } else {
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

// ================== НИЖНЯЯ ПАНЕЛЬ UI (bottom.png) ==================

// UI Layout config (offsets from base positions)
const UI_LAYOUT = {
  container: { offsetY: 3 },  // from bottom (h + offset)
  panel: { scale: 0.574 },
  button: { x: 0, y: -214, scale: 0.54 },
  icons: {
    scale: 0.65,
    // positions relative to container center
    positions: [
      { x: 42, y: -68, scale: 0.65 },   // helmet
      { x: 17, y: -68, scale: 0.61 },   // anvil (smaller texture)
      { x: -22, y: -71, scale: 0.65 },  // store
      { x: -41, y: -66, scale: 0.65 }   // map
    ]
  }
};

function createBottomUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  console.log("[BOTTOMUI] Screen:", w, "x", h);

  // === CONTAINER (adaptive: center-X, bottom + offset) ===
  const panelContainer = scene.add.container(
    w / 2,
    h + UI_LAYOUT.container.offsetY
  );
  panelContainer.setDepth(200);
  panelContainer.setScrollFactor(0);

  // === PANEL (relative to container) ===
  const tex = scene.textures.get('ui_bottom');
  if (tex) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);

  const bottomPanel = scene.add.image(0, 0, 'ui_bottom');
  bottomPanel.setOrigin(0.5, 1);  // Draws UP from container
  bottomPanel.setScale(UI_LAYOUT.panel.scale);
  panelContainer.add(bottomPanel);

  // === FIGHT BUTTON (relative to container) ===
  const btnCfg = UI_LAYOUT.button;
  const fightBtn = scene.add.image(btnCfg.x, btnCfg.y, 'ui_btn_fight');
  fightBtn.setScale(btnCfg.scale);
  fightBtn.setInteractive({ useHandCursor: true });
  panelContainer.add(fightBtn);

  fightBtn.on('pointerdown', () => {
    console.log('[UI] Fight button clicked!');
  });

  // === ICONS (relative to container) ===
  const iconsCfg = UI_LAYOUT.icons;
  const iconKeys = ['icon_helmet', 'icon_anvil', 'icon_store', 'icon_map'];
  const icons = iconsCfg.positions.map((pos, i) => {
    return scene.add.image(pos.x, pos.y, iconKeys[i])
      .setScale(pos.scale || iconsCfg.scale)  // individual scale or default
      .setInteractive();
  });
  panelContainer.add(icons);

  // Store container reference
  window.panelContainer = panelContainer;

  // === DEBUG LOGS ===
  console.log("[BOTTOMUI] Adaptive container:", w/2, h + UI_LAYOUT.container.offsetY);
  console.log("[BOTTOMUI] Button:", btnCfg.x, btnCfg.y, "scale:", btnCfg.scale);
  console.log("[BOTTOMUI] Icons:", icons.length, "scale:", iconsCfg.scale);

  return {
    bottomPanel,
    fightBtn,
    icons,
    container: panelContainer
  };
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
  if (window.UI_MODE === "CITY_CLEAN") return;

  if (typeof updateSkillButtonsUI === "function") {
    updateSkillButtonsUI();
  }

  if (typeof updateNewUI === "function") {
    updateNewUI();
  }
}

function updateLocationLabel() {
  // No-op - location info handled by uiLayout.js
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

  // Атака
  safeOn(uiElements.attackBtn, "pointerdown", () => {
    if (mode !== "location") return;
    if (isAttacking) return;
    if (!enemyAlive) return;
    if (stats.hp <= 0) return;
    startHeroAttack(scene);
  });

  // Кнопка "В город"
  safeOn(uiElements.cityBtn, "pointerdown", () => {
    if (mode !== "location") return;
    enterCity(scene);
  });

  // Скиллы
  safeOn(uiElements.skill1Btn, "pointerdown", () => {
    useSkill1(scene);
  });

  safeOn(uiElements.skill2Btn, "pointerdown", () => {
    useSkill2(scene);
  });

  // Auto
  safeOn(uiElements.autoBtn, "pointerdown", () => {
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
  safeOn(uiElements.sitButton, "pointerdown", () => {
    toggleRest(scene);
    updateSitButton(buffs.isResting);
  });

  // Shots
  safeOn(uiElements.shotsBtn, "pointerdown", () => {
    toggleShots(scene);
    updateShotsButton(buffs.soulshotsOn || buffs.spiritshotsOn);
  });

  // Банки
  safeOn(uiElements.hpPotionBtn, "pointerdown", () => {
    useHpPotion(scene);
  });

  safeOn(uiElements.mpPotionBtn, "pointerdown", () => {
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

// Интеграция с updateHeroUI
function updateNewUI() {
  if (window.UI_MODE === "CITY_CLEAN") return;

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
