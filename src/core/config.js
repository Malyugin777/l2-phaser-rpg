"use strict";

// ============================================================
//  PHASER CONFIG — Game configuration and scaling
//
//  ⚠️  ВНИМАНИЕ! НЕ МЕНЯТЬ SCALE MODE! ⚠️
//  ENVELOP — растягивает на весь экран БЕЗ чёрных полос
//  FIT — создаёт letterbox (чёрные полосы) — НЕ ИСПОЛЬЗОВАТЬ!
//
// ============================================================

const BASE_W = 780;
const BASE_H = 1688;

// DPR handling
const dprCap = Math.min(window.devicePixelRatio || 1, 2);

// Telegram-aware mobile detection
const tg = window.Telegram?.WebApp;
const tgPlatform = tg?.platform;
const isTgMobile = tgPlatform === "ios" || tgPlatform === "android";
const _isCoarse = window.matchMedia("(pointer: coarse)").matches;
const _isSmall = window.matchMedia("(max-width: 520px)").matches;
const isMobile = isTgMobile || _isCoarse || _isSmall;

const RESOLUTION = window.devicePixelRatio || 1;

// Viewport height sync (fixes Telegram/WebView bottom clipping)
function syncAppHeight() {
  const tg = window.Telegram?.WebApp;
  const h =
    (tg && typeof tg.viewportHeight === "number" && tg.viewportHeight) ||
    (window.visualViewport?.height) ||
    window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${Math.round(h)}px`);
}

// Request fullscreen in TMA
try {
  window.Telegram?.WebApp?.expand?.();
} catch (_) {}

syncAppHeight();
window.visualViewport?.addEventListener("resize", syncAppHeight);

// Scale mode — ENVELOP (fullscreen without black bars)
// ⚠️ НЕ МЕНЯТЬ! FIT создаёт чёрные полосы!
const getScaleMode = () => Phaser.Scale.ENVELOP;

// Safe area for TMA
const SAFE_AREA = {
  top: 0.08,
  bottom: 0.10,
  left: 0.04,
  right: 0.04
};

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

// Phaser game config
const phaserConfig = {
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  resolution: RESOLUTION,
  parent: "game-container",
  backgroundColor: 0x0a0a12,
  fps: { target: 60, forceSetTimeOut: true },
  render: { antialias: true, antialiasGL: true, pixelArt: false, roundPixels: false },
  scale: { mode: getScaleMode(), autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: null, // Set in game.js
  plugins: { scene: [{ key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" }] }
};

// Background scaling (cover, no black bars)
function fitBackground(bg, scene) {
  if (!bg || !scene) return;
  const w = scene.scale.width;
  const h = scene.scale.height;
  const scale = Math.max(w / bg.width, h / bg.height);
  bg.setScale(scale, scale);
  bg.setPosition(Math.round(w / 2), Math.round(h / 2));
  bg.setOrigin(0.5, 0.5);
  bg.setScrollFactor(0);
}

// Background pre-resample for iOS
function makeResampledBg(scene, srcKey, outKey, targetW, targetH) {
  const tex = scene.textures.get(srcKey);
  const srcImg = tex?.getSourceImage?.();
  if (!srcImg) return null;

  const W = Math.max(2, Math.round(targetW));
  const H = Math.max(2, Math.round(targetH));

  if (scene.textures.exists(outKey)) scene.textures.remove(outKey);

  const ctex = scene.textures.createCanvas(outKey, W, H);
  const ctx = ctex.getContext();

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(srcImg, 0, 0, W, H);

  ctex.refresh();
  try { ctex.setFilter(Phaser.Textures.FilterMode.LINEAR); } catch (e) {}

  return outKey;
}

// Initialize game with resize handlers
function initGameHandlers(game) {
  window.addEventListener("resize", () => {
    syncAppHeight();
    const nextMode = getScaleMode();
    if (game.scale && game.scale.scaleMode !== nextMode) game.scale.scaleMode = nextMode;
    game.scale?.refresh();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) game.loop.sleep();
    else game.loop.wake();
  });
}

console.log("[Config] Module loaded");
