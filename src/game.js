"use strict";
console.log("GAMEJS BUILD: 2025-12-15-CITY-CLEAN-HOTFIX");

const UI_MODE = "CITY_CLEAN"; // "LEGACY" | "CITY_CLEAN"
window.UI_MODE = UI_MODE;

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

// Telegram-aware isMobile detection
const tg = window.Telegram?.WebApp;
const tgPlatform = tg?.platform;
const isTgMobile = tgPlatform === "ios" || tgPlatform === "android";

const _isCoarse = window.matchMedia("(pointer: coarse)").matches;
const _isSmall = window.matchMedia("(max-width: 520px)").matches;

const isMobile = isTgMobile || _isCoarse || _isSmall;
console.log("[ENV]", { tgPlatform, isTgMobile, _isCoarse, _isSmall, isMobile });

const getScaleMode = () => {
  return Phaser.Scale.ENVELOP;
};

const RESOLUTION = isMobile ? (window.devicePixelRatio || 1) : 1;

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

// Retina backing + runtime fallback
function applyResolutionSafe(game, res) {
  try {
    try { game.config.resolution = res; } catch (_) {}
    try { if (game.renderer && "resolution" in game.renderer) game.renderer.resolution = res; } catch (_) {}
    if (game?.renderer?.resize) {
      try { game.renderer.resize(BASE_W, BASE_H, res); } catch (_) {}
    }
  } catch (_) {}
  game.scale?.refresh();
}

// Delay to ensure renderer is ready
setTimeout(() => applyResolutionSafe(game, RESOLUTION), 0);

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
  var scale = Math.max(w / bg.width, h / bg.height);
  bg.setScale(scale);
  bg.setPosition(w / 2, h / 2);
  bg.setOrigin(0.5, 0.5);
  bg.setScrollFactor(0);
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

  // Фоны (город - новый webp)
  this.load.image("talkingisland_main", "assets/backgrounds/talking_island.webp");
  this.load.image("obelisk_of_victory", "assets/backgrounds/obelisk_of_victory.png");
  this.load.image("northern_territory", "assets/backgrounds/northern_territory.png");
  this.load.image("elven_ruins", "assets/backgrounds/elven_ruins.png");
  this.load.image("orc_barracks", "assets/backgrounds/orc_barracks.png");

  // UI
  this.load.image("map_world", "assets/ui/map_world.png");
  this.load.image("ui_bottom_panel", "assets/ui/Bottom_panel.webp");

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
  // Canvas reference (with null check)
  const c = this.game.canvas;
  if (!c) {
    console.error("[FATAL] canvas is null/undefined in create()");
    return;
  }
  const r = c.getBoundingClientRect();

  // === DIAGNOSTIC LOGS (A) ===
  console.log("[DPI CHECK]",
    "dpr", window.devicePixelRatio,
    "config.resolution", this.game.config?.resolution,
    "renderer.resolution", this.game.renderer?.resolution,
    "canvas backing", c.width, c.height,
    "canvas css", r.width.toFixed(1), r.height.toFixed(1),
    "scale", { w: this.scale.width, h: this.scale.height, dw: this.scale.displaySize.width, dh: this.scale.displaySize.height }
  );

  // === DIAGNOSTIC LOGS (RENDERER) ===
  console.log("[RENDERER]", this.game.renderer?.type, this.game.renderer);

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

  // Force CSS smoothing
  c.style.imageRendering = "auto";
  c.style.setProperty("image-rendering", "auto");

  // Force LINEAR texture filtering
  try {
    this.textures.setDefaultFilter(Phaser.Textures.FilterMode.LINEAR);
  } catch (e) {
    console.warn("[DPI] setDefaultFilter not available", e);
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
  fitBackground(cityBg, this);
  cityBg.setDepth(-5);
  window.cityBg = cityBg;

  locationBg = this.add.image(w / 2, h / 2, "obelisk_of_victory");
  fitBackground(locationBg, this);
  locationBg.setDepth(-5);
  locationBg.setVisible(false);

  // герой/враг для локации (логические координаты)
  heroStartX = w * 0.25;
  heroStartY = h * 0.65;

  // Создаём Spine героя (ГЛАВНЫЙ персонаж)
  if (this.spine) {
    try {
      spineHero = this.add.spine(heroStartX, heroStartY, 'hero', 'idle', true);
      spineHero.setScale(0.7);
      spineHero.setDepth(5);
      window.spineHero = spineHero;
      hero = spineHero;
      console.log("[Spine] Hero created at:", heroStartX, heroStartY, "scale: 0.7");
    } catch (e) {
      console.warn("[Spine] Failed:", e.message);
      // Fallback на заглушку
      hero = createHeroSprite(this, heroStartX, heroStartY, 0x3366cc);
      console.log("[Hero] Fallback sprite created");
    }
  } else {
    // Spine плагин не загружен — fallback
    hero = createHeroSprite(this, heroStartX, heroStartY, 0x3366cc);
    console.log("[Hero] No Spine plugin, using fallback");
  }

  // герой в городе (используем Spine если есть)
  if (window.spineHero) {
    cityHero = window.spineHero;
  } else {
    cityHero = createHeroSprite(this, this.scale.width * 0.25, centerY, 0x3366cc);
  }

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

        // === PANEL ===
        if (bottomPanel) {
          bottomPanel.setOrigin(0.5, 1);
          bottomPanel.x = safe.centerX;
          bottomPanel.y = safe.bottom - pad;

          const baseW = bottomPanel.width || 1;
          const scale = Math.min(1, safe.width / baseW);
          bottomPanel.setScale(scale);
        }

        // Получаем реальные границы панели после scale
        const panelB = bottomPanel?.getBounds?.();
        const panelMidY = panelB ? (panelB.top + panelB.bottom) / 2 : (safe.bottom - 60);

        // === FIGHT BTN (справа ВНУТРИ панели) ===
        if (fightBtn && panelB) {
          const rightPad = 80;
          fightBtn.setOrigin(0.5, 0.5);
          fightBtn.x = panelB.right - rightPad;
          fightBtn.y = panelMidY;
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
            ic.x = startX + step * i;
            ic.y = panelMidY;
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

  // Панель — масштаб под ширину экрана
  const bottomPanel = scene.add.image(w / 2, h, 'ui_bottom')
    .setOrigin(0.5, 1)
    .setDepth(100)
    .setScrollFactor(0);

  // Масштаб: панель 1408px → экран 390px
  const panelScale = w / 1408;  // ≈ 0.277
  bottomPanel.setScale(panelScale);

  const panelHeight = 768 * panelScale;  // ≈ 213px
  const panelTop = h - panelHeight;
  const panelCenterX = w / 2;

  // === КРАСНАЯ КНОПКА БОЯ ===
  // На панели кнопка справа, примерно на X = 1150 от левого края панели
  // После масштаба: (1150 - 704) * 0.277 = 123px от центра
  const fightBtnX = panelCenterX + 123 * panelScale * 3.6;  // смещение вправо
  const fightBtnY = h - panelHeight / 2;  // по центру панели по высоте

  const fightBtn = scene.add.image(fightBtnX, fightBtnY, 'ui_btn_fight')
    .setOrigin(0.5, 0.5)
    .setDepth(110)
    .setScrollFactor(0)
    .setScale(panelScale * 1.2)  // чуть больше
    .setInteractive({ useHandCursor: true });

  scene.tweens.add({
    targets: fightBtn,
    scale: panelScale * 1.25,
    yoyo: true,
    repeat: -1,
    duration: 800,
    ease: 'Sine.easeInOut'
  });

  fightBtn.on('pointerdown', () => {
    console.log('[UI] Fight button clicked!');
  });

  // === ИКОНКИ В СЛОТАХ (слева на панели) ===
  // Слоты на панели примерно: X = 180, 350, 520, 690 (от левого края)
  // Центр панели = 704, значит смещения: -524, -354, -184, -14
  const iconY = h - panelHeight * 0.5;  // по центру панели

  const slotOffsets = [-380, -230, -80, 70];  // примерные смещения от центра

  const icons = [
    { key: 'icon_helmet', action: 'inventory' },
    { key: 'icon_anvil', action: 'forge' },
    { key: 'icon_store', action: 'shop' },
    { key: 'icon_map', action: 'map' },
  ];

  const createdIcons = icons.map((iconData, i) => {
    const x = panelCenterX + slotOffsets[i] * panelScale;
    const icon = scene.add.image(x, iconY, iconData.key)
      .setDepth(110)
      .setScrollFactor(0)
      .setScale(panelScale * 1.5)
      .setInteractive({ useHandCursor: true });

    icon.on('pointerdown', () => {
      console.log(`[UI] Icon clicked: ${iconData.action}`);
    });

    return icon;
  });

  console.log('[UI] Bottom panel created, scale:', panelScale.toFixed(3));

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
