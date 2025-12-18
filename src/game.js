"use strict";
console.log("GAMEJS BUILD: 2025-12-19-QUALITY-DIAG");

const UI_MODE = "CITY_CLEAN"; // "LEGACY" | "CITY_CLEAN"
window.UI_MODE = UI_MODE;

// === TUNE MODE (enabled via ?tune=1) ===
const TUNE_ENABLED = new URLSearchParams(window.location.search).has('tune');
if (TUNE_ENABLED) console.log("[TUNE] Mode ENABLED");

// Base positions for tune mode calculations
const HERO_BASE = { x: 150, y: 500, scale: 0.7 };
let FIGHTBTN_BASE = null; // Set when bottomUI is created

function getTuneSettings() {
  const defaults = {
    bgZoom: 1.0, bgPanX: 0, bgPanY: 0,
    panelX: 0, panelY: 0, panelScale: 1.0,
    heroX: 0, heroY: 0, heroScale: 1.0,
    btnX: 0, btnY: 0,
    icon0X: 0, icon0Y: 0,
    icon1X: 0, icon1Y: 0,
    icon2X: 0, icon2Y: 0,
    icon3X: 0, icon3Y: 0
  };

  // Only load from localStorage when in tune mode
  if (!TUNE_ENABLED) return defaults;

  try {
    const saved = localStorage.getItem('TUNE_SETTINGS');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log("[TUNE] Loaded from localStorage:", parsed);
      return { ...defaults, ...parsed };
    }
  } catch (e) {
    console.log("[TUNE] Error loading settings:", e);
  }
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
const BASE_W = 390;
const BASE_H = 844;

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

  cityBg.setDepth(-5);
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
    cityBg.setScale(1 / dprCap);
    cityBg.setPosition(this.cameras.main.centerX, this.cameras.main.centerY);
    cityBg.x = Math.round(cityBg.x);
    cityBg.y = Math.round(cityBg.y);

    // STEP 4: After resample
    console.log("[BG] step4 - after resample scale:", cityBg.scaleX.toFixed(4), cityBg.scaleY.toFixed(4));
    console.log("[BG] step4 - display:", cityBg.displayWidth.toFixed(1), "x", cityBg.displayHeight.toFixed(1));
    console.log("[BG] step4 - ratio:", (cityBg.displayWidth / cityBg.displayHeight).toFixed(4));
  }

  // === TUNE MODE CONTROLS ===
  if (TUNE_ENABLED) {
    const tune = getTuneSettings();
    const baseScale = cityBg.scaleX;
    let selectedElement = 'bg'; // 'bg', 'panel', 'hero', 'btn', 'icon0', 'icon1', 'icon2', 'icon3'

    // Store BASE positions (will be set after bottomUI exists)
    const basePositions = {
      bgX: this.cameras.main.centerX,
      bgY: this.cameras.main.centerY,
      panelX: this.scale.width / 2,
      panelY: this.scale.height,
      heroX: heroStartX,
      heroY: heroStartY,
      btnX: 0, btnY: 0, // Set later
      icon0X: 0, icon0Y: 0,
      icon1X: 0, icon1Y: 0,
      icon2X: 0, icon2Y: 0,
      icon3X: 0, icon3Y: 0
    };
    window.tuneBasePositions = basePositions;

    // Store references for tune mode
    window.tuneRefs = { cityBg, baseScale, tune };

    // Overlay - create once, update text only
    const overlay = document.createElement('div');
    overlay.id = 'tune-overlay';
    overlay.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.8);color:#0f0;padding:10px;font:12px monospace;z-index:99999;border-radius:5px;max-width:220px;';
    overlay.addEventListener('pointerdown', (e) => e.stopPropagation());
    overlay.addEventListener('click', (e) => e.stopPropagation());

    // Static HTML with spans for dynamic values
    overlay.innerHTML = `
      <b>TUNE</b> [<span id="tune-sel">bg</span>]<br>
      <hr style="border-color:#333">
      <span id="tune-values"></span>
      <hr style="border-color:#333">
      <small>1-8: select | Arrows: move | Q/E: scale</small>
      <div style="margin-top:8px;">
        <button id="tune-save">💾 SAVE</button>
        <button id="tune-reset">🔄</button>
        <button id="tune-copy">📋</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Button handlers - SAVE to localStorage + clipboard
    document.getElementById('tune-save').onclick = () => {
      const json = JSON.stringify(tune, null, 2);
      localStorage.setItem('TUNE_SETTINGS', JSON.stringify(tune));
      navigator.clipboard?.writeText(json);
      console.log("[TUNE] Saved to localStorage and clipboard:\n" + json);
      alert("Saved to localStorage!\n\n" + json);
    };
    document.getElementById('tune-reset').onclick = () => {
      // Reset tune values to defaults and clear localStorage
      Object.assign(tune, {bgZoom:1, bgPanX:0, bgPanY:0, panelX:0, panelY:0, panelScale:1, heroX:0, heroY:0, heroScale:1, btnX:0, btnY:0, icon0X:0, icon0Y:0, icon1X:0, icon1Y:0, icon2X:0, icon2Y:0, icon3X:0, icon3Y:0});
      localStorage.removeItem('TUNE_SETTINGS');
      applyTune();
      console.log("[TUNE] Reset to defaults, localStorage cleared");
      alert('Reset to defaults!');
    };
    document.getElementById('tune-copy').onclick = () => {
      const json = JSON.stringify(tune, null, 2);
      navigator.clipboard?.writeText(json);
      alert('Copied!\n' + json);
    };

    const selColors = { bg: '#0f0', panel: '#ff0', hero: '#0ff', btn: '#f0f', icon0: '#f80', icon1: '#f80', icon2: '#f80', icon3: '#f80' };

    const updateOverlay = () => {
      const hero = window.spineHero;
      const btn = window.bottomUI?.fightBtn;
      const icons = window.bottomUI?.icons || [];

      document.getElementById('tune-sel').innerHTML = `<span style="color:${selColors[selectedElement] || '#fff'}">${selectedElement}</span>`;
      document.getElementById('tune-values').innerHTML = `
        <b style="color:#0f0">1.BG:</b> z:${tune.bgZoom.toFixed(2)} pos:${cityBg?.x?.toFixed(0)},${cityBg?.y?.toFixed(0)}<br>
        <b style="color:#ff0">2.Panel:</b> ${window.bottomUI?.bottomPanel?.x?.toFixed(0) || '?'},${window.bottomUI?.bottomPanel?.y?.toFixed(0) || '?'}<br>
        <b style="color:#0ff">3.Hero:</b> ${hero?.x?.toFixed(0) || '?'},${hero?.y?.toFixed(0) || '?'} s:${(HERO_BASE.scale * tune.heroScale).toFixed(2)}<br>
        <small>&nbsp;base:${HERO_BASE.x},${HERO_BASE.y} ofs:${tune.heroX},${tune.heroY}</small><br>
        <b style="color:#f0f">4.Btn:</b> ${btn?.x?.toFixed(0) || '?'},${btn?.y?.toFixed(0) || '?'}<br>
        <small>&nbsp;base:${FIGHTBTN_BASE?.x?.toFixed(0) || '?'},${FIGHTBTN_BASE?.y?.toFixed(0) || '?'} ofs:${tune.btnX},${tune.btnY}</small><br>
        <b style="color:#f80">5-8.Icons:</b><br>
        &nbsp;🪖${icons[0]?.x?.toFixed(0) || '?'},${icons[0]?.y?.toFixed(0) || '?'} ⚒️${icons[1]?.x?.toFixed(0) || '?'},${icons[1]?.y?.toFixed(0) || '?'}<br>
        &nbsp;🏪${icons[2]?.x?.toFixed(0) || '?'},${icons[2]?.y?.toFixed(0) || '?'} 🗺️${icons[3]?.x?.toFixed(0) || '?'},${icons[3]?.y?.toFixed(0) || '?'}
      `;
    };

    const applyTune = () => {
      const bp = window.tuneBasePositions;

      // Capture base positions for btn/icons on first run (after bottomUI exists)
      if (window.bottomUI && bp.btnX === 0 && bp.btnY === 0) {
        bp.btnX = window.bottomUI.fightBtn?.x || 0;
        bp.btnY = window.bottomUI.fightBtn?.y || 0;
        const icons = window.bottomUI.icons || [];
        icons.forEach((icon, i) => {
          bp[`icon${i}X`] = icon?.x || 0;
          bp[`icon${i}Y`] = icon?.y || 0;
        });
      }

      // Background
      cityBg.setScale(baseScale * tune.bgZoom);
      cityBg.x = Math.round(bp.bgX + tune.bgPanX);
      cityBg.y = Math.round(bp.bgY + tune.bgPanY);

      // Panel
      if (window.bottomUI?.bottomPanel) {
        const p = window.bottomUI.bottomPanel;
        p.x = Math.round(bp.panelX + tune.panelX);
        p.y = Math.round(bp.panelY + tune.panelY);
      }

      // Hero - use HERO_BASE constants (offset-based positioning)
      if (window.spineHero) {
        window.spineHero.x = Math.round(HERO_BASE.x + tune.heroX);
        window.spineHero.y = Math.round(HERO_BASE.y + tune.heroY);
        window.spineHero.setScale(HERO_BASE.scale * tune.heroScale);
        window.spineHero.setVisible(true);
        window.spineHero.setDepth(50);
      }

      // Fight button - use FIGHTBTN_BASE (offset-based positioning)
      if (window.bottomUI?.fightBtn && FIGHTBTN_BASE) {
        window.fightBtnTween?.stop();
        window.bottomUI.fightBtn.x = Math.round(FIGHTBTN_BASE.x + tune.btnX);
        window.bottomUI.fightBtn.y = Math.round(FIGHTBTN_BASE.y + tune.btnY);
      }

      // Icons
      const icons = window.bottomUI?.icons || [];
      icons.forEach((icon, i) => {
        if (icon && bp[`icon${i}X`] !== 0) {
          icon.x = Math.round(bp[`icon${i}X`] + tune[`icon${i}X`]);
          icon.y = Math.round(bp[`icon${i}Y`] + tune[`icon${i}Y`]);
        }
      });

      updateOverlay();
    };

    // Click to select element
    let dragging = false, startX, startY;

    this.input.on('pointerdown', (p) => {
      // Check what was clicked (in order of depth - highest first)
      const icons = window.bottomUI?.icons || [];
      let iconClicked = -1;
      for (let i = 0; i < icons.length; i++) {
        if (icons[i]?.getBounds()?.contains(p.x, p.y)) {
          iconClicked = i;
          break;
        }
      }

      if (iconClicked >= 0) {
        selectedElement = 'icon' + iconClicked;
      } else if (window.bottomUI?.fightBtn?.getBounds()?.contains(p.x, p.y)) {
        selectedElement = 'btn';
      } else if (window.bottomUI?.bottomPanel?.getBounds()?.contains(p.x, p.y)) {
        selectedElement = 'panel';
      } else if (window.spineHero?.getBounds()?.contains(p.x, p.y)) {
        selectedElement = 'hero';
      } else {
        selectedElement = 'bg';
      }
      updateOverlay();
      dragging = true;
      startX = p.x;
      startY = p.y;
    });

    this.input.on('pointermove', (p) => {
      if (!dragging) return;
      const dx = Math.round(p.x - startX);
      const dy = Math.round(p.y - startY);
      startX = p.x;
      startY = p.y;

      if (selectedElement === 'bg') {
        tune.bgPanX += dx;
        tune.bgPanY += dy;
        cityBg.x += dx;
        cityBg.y += dy;
      } else if (selectedElement === 'panel' && window.bottomUI?.bottomPanel) {
        tune.panelX += dx;
        tune.panelY += dy;
        window.bottomUI.bottomPanel.x += dx;
        window.bottomUI.bottomPanel.y += dy;
      } else if (selectedElement === 'hero' && window.spineHero) {
        tune.heroX += dx;
        tune.heroY += dy;
        window.spineHero.x += dx;
        window.spineHero.y += dy;
      } else if (selectedElement === 'btn' && window.bottomUI?.fightBtn) {
        tune.btnX += dx;
        tune.btnY += dy;
        window.bottomUI.fightBtn.x += dx;
        window.bottomUI.fightBtn.y += dy;
      } else if (selectedElement.startsWith('icon')) {
        const iconIdx = parseInt(selectedElement.replace('icon', ''));
        const icon = window.bottomUI?.icons?.[iconIdx];
        if (icon) {
          tune[`icon${iconIdx}X`] += dx;
          tune[`icon${iconIdx}Y`] += dy;
          icon.x += dx;
          icon.y += dy;
        }
      }
      updateOverlay();
    });

    this.input.on('pointerup', () => { dragging = false; });

    // Helper to move icon
    const STEP = 1; // Arrow key step size in pixels
    const moveIcon = (delta, axis) => {
      if (selectedElement.startsWith('icon')) {
        const idx = parseInt(selectedElement.replace('icon', ''));
        const icon = window.bottomUI?.icons?.[idx];
        if (icon) {
          tune[`icon${idx}${axis}`] += delta;
          icon[axis.toLowerCase()] += delta;
        }
      }
    };

    // Arrow keys for fine tune selected element (1px steps)
    this.input.keyboard.on('keydown-UP', () => {
      if (selectedElement === 'bg') { tune.bgPanY -= STEP; cityBg.y -= STEP; }
      else if (selectedElement === 'panel' && window.bottomUI?.bottomPanel) { tune.panelY -= STEP; window.bottomUI.bottomPanel.y -= STEP; }
      else if (selectedElement === 'hero' && window.spineHero) { tune.heroY -= STEP; window.spineHero.y -= STEP; }
      else if (selectedElement === 'btn' && window.bottomUI?.fightBtn) { tune.btnY -= STEP; window.bottomUI.fightBtn.y -= STEP; }
      else moveIcon(-STEP, 'Y');
      updateOverlay();
    });
    this.input.keyboard.on('keydown-DOWN', () => {
      if (selectedElement === 'bg') { tune.bgPanY += STEP; cityBg.y += STEP; }
      else if (selectedElement === 'panel' && window.bottomUI?.bottomPanel) { tune.panelY += STEP; window.bottomUI.bottomPanel.y += STEP; }
      else if (selectedElement === 'hero' && window.spineHero) { tune.heroY += STEP; window.spineHero.y += STEP; }
      else if (selectedElement === 'btn' && window.bottomUI?.fightBtn) { tune.btnY += STEP; window.bottomUI.fightBtn.y += STEP; }
      else moveIcon(STEP, 'Y');
      updateOverlay();
    });
    this.input.keyboard.on('keydown-LEFT', () => {
      if (selectedElement === 'bg') { tune.bgPanX -= STEP; cityBg.x -= STEP; }
      else if (selectedElement === 'panel' && window.bottomUI?.bottomPanel) { tune.panelX -= STEP; window.bottomUI.bottomPanel.x -= STEP; }
      else if (selectedElement === 'hero' && window.spineHero) { tune.heroX -= STEP; window.spineHero.x -= STEP; }
      else if (selectedElement === 'btn' && window.bottomUI?.fightBtn) { tune.btnX -= STEP; window.bottomUI.fightBtn.x -= STEP; }
      else moveIcon(-STEP, 'X');
      updateOverlay();
    });
    this.input.keyboard.on('keydown-RIGHT', () => {
      if (selectedElement === 'bg') { tune.bgPanX += STEP; cityBg.x += STEP; }
      else if (selectedElement === 'panel' && window.bottomUI?.bottomPanel) { tune.panelX += STEP; window.bottomUI.bottomPanel.x += STEP; }
      else if (selectedElement === 'hero' && window.spineHero) { tune.heroX += STEP; window.spineHero.x += STEP; }
      else if (selectedElement === 'btn' && window.bottomUI?.fightBtn) { tune.btnX += STEP; window.bottomUI.fightBtn.x += STEP; }
      else moveIcon(STEP, 'X');
      updateOverlay();
    });

    // Q/E for scale (+ and - don't work in Phaser)
    this.input.keyboard.on('keydown-E', () => {
      if (selectedElement === 'bg') { tune.bgZoom += 0.05; cityBg.setScale(baseScale * tune.bgZoom); }
      else if (selectedElement === 'panel' && window.bottomUI?.bottomPanel) {
        tune.panelScale += 0.05;
        const p = window.bottomUI.bottomPanel;
        p.setScale(p.scaleX * 1.05, p.scaleY * 1.05);
      }
      else if (selectedElement === 'hero' && window.spineHero) {
        tune.heroScale += 0.05;
        const hbScale = window.HERO_BASE?.scale || 0.7;
        window.spineHero.setScale(hbScale * tune.heroScale);
      }
      else if (selectedElement === 'btn' && window.bottomUI?.fightBtn) {
        window.fightBtnTween?.stop(); // Stop animation
        const btn = window.bottomUI.fightBtn;
        btn.setScale(btn.scaleX * 1.05, btn.scaleY * 1.05);
      }
      else if (selectedElement.startsWith('icon')) {
        const idx = parseInt(selectedElement.replace('icon', ''));
        const icon = window.bottomUI?.icons?.[idx];
        if (icon) icon.setScale(icon.scaleX * 1.05, icon.scaleY * 1.05);
      }
      updateOverlay();
    });
    this.input.keyboard.on('keydown-Q', () => {
      if (selectedElement === 'bg') { tune.bgZoom -= 0.05; cityBg.setScale(baseScale * tune.bgZoom); }
      else if (selectedElement === 'panel' && window.bottomUI?.bottomPanel) {
        tune.panelScale -= 0.05;
        const p = window.bottomUI.bottomPanel;
        p.setScale(p.scaleX * 0.95, p.scaleY * 0.95);
      }
      else if (selectedElement === 'hero' && window.spineHero) {
        tune.heroScale -= 0.05;
        const hbScale = window.HERO_BASE?.scale || 0.7;
        window.spineHero.setScale(hbScale * tune.heroScale);
      }
      else if (selectedElement === 'btn' && window.bottomUI?.fightBtn) {
        window.fightBtnTween?.stop(); // Stop animation
        const btn = window.bottomUI.fightBtn;
        btn.setScale(btn.scaleX * 0.95, btn.scaleY * 0.95);
      }
      else if (selectedElement.startsWith('icon')) {
        const idx = parseInt(selectedElement.replace('icon', ''));
        const icon = window.bottomUI?.icons?.[idx];
        if (icon) icon.setScale(icon.scaleX * 0.95, icon.scaleY * 0.95);
      }
      updateOverlay();
    });

    // Number keys 1-8 to select element directly
    this.input.keyboard.on('keydown-ONE', () => { selectedElement = 'bg'; updateOverlay(); });
    this.input.keyboard.on('keydown-TWO', () => { selectedElement = 'panel'; updateOverlay(); });
    this.input.keyboard.on('keydown-THREE', () => { selectedElement = 'hero'; updateOverlay(); });
    this.input.keyboard.on('keydown-FOUR', () => { selectedElement = 'btn'; updateOverlay(); });
    this.input.keyboard.on('keydown-FIVE', () => { selectedElement = 'icon0'; updateOverlay(); });
    this.input.keyboard.on('keydown-SIX', () => { selectedElement = 'icon1'; updateOverlay(); });
    this.input.keyboard.on('keydown-SEVEN', () => { selectedElement = 'icon2'; updateOverlay(); });
    this.input.keyboard.on('keydown-EIGHT', () => { selectedElement = 'icon3'; updateOverlay(); });

    // Make applyTune globally accessible for later call
    window.applyTune = applyTune;

    applyTune();
    console.log('[TUNE] Mode enabled. 1-8=select, drag=move, arrows=fine, Q/E=scale');
  }

  locationBg = this.add.image(w / 2, h / 2, "obelisk_of_victory");
  fitBackground(locationBg, this);
  locationBg.setDepth(-5);
  locationBg.setVisible(false);

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

  // герой/враг для локации - FIXED POSITION (no tune mode)
  // Hero position (working values)
  heroStartX = 150;
  heroStartY = 500;

  // Создаём Spine героя
  if (this.spine) {
    try {
      spineHero = this.add.spine(150, 500, 'hero', 'idle', true);
      spineHero.setScale(0.7);
      spineHero.setDepth(50);
      spineHero.setVisible(true);
      window.spineHero = spineHero;
      hero = spineHero;
    } catch (e) {
      console.warn("[Spine] Failed:", e.message);
      hero = createHeroSprite(this, 150, 500, 0x3366cc);
      hero.setDepth(50);
    }
  } else {
    hero = createHeroSprite(this, 150, 500, 0x3366cc);
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

      // Apply tune settings after UI is created
      if (TUNE_ENABLED && window.applyTune) {
        setTimeout(() => window.applyTune(), 100);
      }

      // 1) Set depth/scrollFactor FIRST
      [bottomUI.bottomPanel, bottomUI.fightBtn, ...(bottomUI.icons || [])].forEach(obj => {
        if (obj) {
          obj.setScrollFactor?.(0);
          if (obj === bottomUI.bottomPanel) obj.setDepth?.(100);
          else obj.setDepth?.(110);
        }
      });

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

        const ui = window.bottomUI;
        if (!ui) return;

        const { bottomPanel, fightBtn, icons } = ui;

        // === PANEL (Image with origin 0.5, 1) ===
        if (bottomPanel) {
          bottomPanel.setOrigin(0.5, 1);
          bottomPanel.x = Math.round(safe.centerX);
          bottomPanel.y = Math.round(safe.bottom - pad);
        }

        // Получаем реальные границы панели после scale
        const panelB = bottomPanel?.getBounds?.();
        const panelMidY = panelB ? (panelB.top + panelB.bottom) / 2 : (safe.bottom - 60);

        // === FIGHT BTN (pixel-snapped) ===
        if (fightBtn && panelB) {
          const rightPad = 80;
          fightBtn.setOrigin(0.5, 0.5);
          fightBtn.x = Math.round(panelB.right - rightPad);
          fightBtn.y = Math.round(panelMidY);
        }

        // === ICONS (слева до fightBtn) ===
        if (icons?.length && panelB) {
          const leftPad = 70;
          const gapToFight = 140;
          const startX = panelB.left + leftPad;
          const endX = Math.max(startX, (fightBtn?.x ?? panelB.right) - gapToFight);

          const usable = Math.max(0, endX - startX);
          const step = usable / Math.max(1, icons.length - 1);

          icons.forEach((ic, i) => {
            if (!ic) return;
            ic.setOrigin(0.5, 0.5);
            ic.x = Math.round(startX + step * i);
            ic.y = Math.round(panelMidY);
          });
        }

        console.log("[UI] layoutUI done");
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

function createBottomUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  // Apply LINEAR filter for slightly better quality
  const tex = scene.textures.get('ui_bottom');
  if (tex) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);

  // Get texture dimensions for aspect ratio
  const texW = tex?.source[0]?.width || 1408;
  const texH = tex?.source[0]?.height || 768;
  const aspect = texW / texH;  // ~1.83

  // Keep aspect ratio: scale to fit width
  const finalW = w;                    // 390 (screen width)
  const finalH = Math.round(finalW / aspect);  // ~213

  // Simple Image panel with correct aspect ratio
  const bottomPanel = scene.add.image(w / 2, h, 'ui_bottom');
  bottomPanel.setOrigin(0.5, 1);  // Bottom center origin
  bottomPanel.setDisplaySize(finalW, finalH);
  bottomPanel.setDepth(100);
  bottomPanel.setScrollFactor(0);

  console.log("[UI] Panel aspect-correct:", finalW, "x", finalH, "aspect:", aspect.toFixed(2));
  console.log("[UI] Panel visible:", bottomPanel.visible, "alpha:", bottomPanel.alpha, "depth:", bottomPanel.depth);
  console.log("[UI] Panel bounds:", JSON.stringify(bottomPanel.getBounds()));

  const panelHeight = finalH;
  const panelCenterX = w / 2;
  const panelScale = finalH / texH;  // For button/icon scaling

  // === КРАСНАЯ КНОПКА БОЯ ===
  const fightBtnScale = panelScale * 1.2;
  const fightBtnX = Math.round(panelCenterX + 123 * panelScale * 3.6);
  const fightBtnY = Math.round(h - panelHeight / 2);

  const fightBtn = scene.add.image(fightBtnX, fightBtnY, 'ui_btn_fight')
    .setOrigin(0.5, 0.5)
    .setDepth(110)
    .setScrollFactor(0)
    .setScale(fightBtnScale)
    .setInteractive({ useHandCursor: true });

  console.log("[UI] FightBtn: pos=", fightBtnX, fightBtnY, "scale=", fightBtnScale.toFixed(3));

  const fightBtnTween = scene.tweens.add({
    targets: fightBtn,
    scale: fightBtnScale * 1.05,
    yoyo: true,
    repeat: -1,
    duration: 800,
    ease: 'Sine.easeInOut'
  });
  window.fightBtnTween = fightBtnTween;

  fightBtn.on('pointerdown', () => {
    console.log('[UI] Fight button clicked!');
  });

  // === ИКОНКИ В СЛОТАХ (слева на панели) ===
  const iconScale = panelScale * 1.5;
  const iconY = Math.round(h - panelHeight * 0.5);
  const slotOffsets = [-380, -230, -80, 70];

  const icons = [
    { key: 'icon_helmet', action: 'inventory' },
    { key: 'icon_anvil', action: 'forge' },
    { key: 'icon_store', action: 'shop' },
    { key: 'icon_map', action: 'map' },
  ];

  const createdIcons = icons.map((iconData, i) => {
    const x = Math.round(panelCenterX + slotOffsets[i] * panelScale);
    const icon = scene.add.image(x, iconY, iconData.key)
      .setDepth(110)
      .setScrollFactor(0)
      .setScale(iconScale)
      .setInteractive({ useHandCursor: true });

    icon.on('pointerdown', () => {
      console.log(`[UI] Icon clicked: ${iconData.action}`);
    });

    return icon;
  });

  console.log("[UI] Icons created at y=", iconY, "scale=", iconScale.toFixed(3));

  // NOTE: UI resample removed - Phaser 3.55.2 handles resolution properly

  return { bottomPanel, fightBtn, icons: createdIcons };
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
