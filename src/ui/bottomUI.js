"use strict";

// ============================================================
//  BOTTOM UI — Panel, button, icons (Container-based)
//  With click handlers for panels
// ============================================================

// Текстуры оптимизированы:
// - bottom.png: 800×188
// - btn_fight_base.png: 240×240
// - icons: 140×140

const UI_LAYOUT = {
  container: { offsetY: -9 },
  panel: { scale: 0.98 },
  button: { x: 0, y: -104, scale: 0.41 },
  icons: {
    // Tuned positions - icons 140x140, scale 0.86
    positions: [
      { x: -301, y: -91, scale: 0.86 },  // helmet (слева)
      { x: -153, y: -94, scale: 0.86 },  // anvil
      { x: 150, y: -89, scale: 0.86 },   // store (справа)
      { x: 301, y: -92, scale: 0.86 }    // map (справа)
    ]
  }
};

// Icon config - left to right on screen:
// map(x:-44) → store(x:-14) → [FIGHT] → anvil(x:18) → helmet(x:98)
const ICON_CONFIG = [
  { key: 'icon_helmet', action: 'inventory' },  // pos[0] x:98 (right)
  { key: 'icon_anvil',  action: 'forge' },      // pos[1] x:18
  { key: 'icon_store',  action: 'shop' },       // pos[2] x:-14
  { key: 'icon_map',    action: 'map' }         // pos[3] x:-44 (left)
];

function createBottomUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  console.log("[BOTTOMUI] Creating UI, screen:", w, "x", h);

  // === CONTAINER === (account for ENVELOP crop at bottom)
  // ENVELOP crops equally from top and bottom when centered
  const cropBottom = window.ENVELOP_CROP_TOP || 0;  // same as cropTop for centered canvas
  const containerY = h - cropBottom + UI_LAYOUT.container.offsetY;

  console.log('[BOTTOMUI] Crop bottom:', cropBottom, '→ containerY:', containerY);

  const panelContainer = scene.add.container(w / 2, containerY);
  panelContainer.setDepth(200);
  panelContainer.setScrollFactor(0);

  // === DARK BACKGROUND ===
  // Простой подход: фон с origin снизу, тянется от контейнера до низа экрана
  const distanceToBottom = h - containerY;  // Расстояние от контейнера до низа экрана
  const bottomBg = scene.add.rectangle(
    0,
    0,
    w + 100,
    250 + distanceToBottom,  // Высота панели + расстояние до низа
    0x3a3a4a,
    0.92
  );
  bottomBg.setOrigin(0.5, 0);      // Origin сверху
  bottomBg.setY(-125);             // Сдвигаем вверх на половину панели
  panelContainer.add(bottomBg);

  console.log('[BOTTOMUI_BG] containerY:', containerY, 'distanceToBottom:', distanceToBottom);

  // === PANEL ===
  const tex = scene.textures.get('ui_bottom');
  if (tex) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);

  const bottomPanel = scene.add.image(0, 0, 'ui_bottom');
  bottomPanel.setOrigin(0.5, 1);
  bottomPanel.setScale(UI_LAYOUT.panel.scale);
  panelContainer.add(bottomPanel);

  // === FIGHT BUTTON ===
  const btnCfg = UI_LAYOUT.button;
  const fightBtn = scene.add.image(btnCfg.x, btnCfg.y, 'ui_btn_fight');
  fightBtn.setScale(btnCfg.scale);
  fightBtn.setInteractive({ useHandCursor: true });
  panelContainer.add(fightBtn);

  fightBtn.on('pointerdown', () => {
    console.log('[UI] Fight button clicked!');
    onFightButtonClick(scene);
  });

  // === ICONS ===
  const iconsCfg = UI_LAYOUT.icons;
  const icons = [];

  console.log("[BOTTOMUI] Creating icons...");

  ICON_CONFIG.forEach((cfg, i) => {
    const pos = iconsCfg.positions[i];

    console.log("[BOTTOMUI] Icon", i, cfg.key, "x:", pos.x, "→", cfg.action);

    const icon = scene.add.image(pos.x, pos.y, cfg.key);
    icon.setScale(pos.scale || iconsCfg.scale);

    icon.setInteractive({ useHandCursor: true });

    icon.setData('action', cfg.action);

    icon.on('pointerdown', () => {
      console.log('[UI] CLICK:', cfg.key, '→', cfg.action);
      onIconClick(scene, cfg.action);
    });

    icon.on('pointerover', () => icon.setTint(0xaaaaaa));
    icon.on('pointerout', () => icon.clearTint());

    panelContainer.add(icon); // Add immediately
    icons.push(icon);
  });

  window.panelContainer = panelContainer;

  // Diagnostic: check texture sizes
  console.log("[BOTTOMUI] === TEXTURE SIZES ===");
  ICON_CONFIG.forEach((cfg) => {
    const tex = scene.textures.get(cfg.key);
    const src = tex?.getSourceImage();
    console.log('[BOTTOMUI]', cfg.key, ':', src?.width, 'x', src?.height);
  });
  const btnTex = scene.textures.get('ui_btn_fight');
  const btnSrc = btnTex?.getSourceImage();
  console.log('[BOTTOMUI] ui_btn_fight:', btnSrc?.width, 'x', btnSrc?.height);
  const panelTex = scene.textures.get('ui_bottom');
  const panelSrc = panelTex?.getSourceImage();
  console.log('[BOTTOMUI] ui_bottom:', panelSrc?.width, 'x', panelSrc?.height);

  console.log("[BOTTOMUI] Created:", icons.length, "icons");

  return { bottomPanel, fightBtn, icons, container: panelContainer };
}

// ============================================================
//  CLICK HANDLERS
// ============================================================

function onFightButtonClick(scene) {
  console.log('[UI] Fight button → Arena');

  // Тестовый противник
  const testEnemy = {
    name: "Тень воина",
    level: window.stats?.level || 1
  };

  if (typeof startArena === 'function') {
    startArena(scene, testEnemy);
  }
}

function onIconClick(scene, panelName) {
  console.log('[UI] Opening panel:', panelName);

  switch (panelName) {
    case 'inventory':
      if (typeof isInventoryOpen !== 'undefined' && isInventoryOpen) {
        if (typeof hideInventoryPanel === 'function') hideInventoryPanel();
      } else {
        if (typeof hideAllPanels === 'function') hideAllPanels();
        if (typeof showInventoryPanel === 'function') showInventoryPanel();
      }
      break;

    case 'forge':
      if (typeof isForgeOpen !== 'undefined' && isForgeOpen) {
        if (typeof hideForgePanel === 'function') hideForgePanel();
      } else {
        if (typeof hideAllPanels === 'function') hideAllPanels();
        if (typeof showForgePanel === 'function') showForgePanel();
      }
      break;

    case 'shop':
      if (typeof isShopOpen !== 'undefined' && isShopOpen) {
        if (typeof hideShopPanel === 'function') hideShopPanel();
      } else {
        if (typeof hideAllPanels === 'function') hideAllPanels();
        if (typeof showShopPanel === 'function') showShopPanel();
      }
      break;

    case 'map':
      if (typeof isMapOpen !== 'undefined' && isMapOpen) {
        if (typeof hideMapPanel === 'function') hideMapPanel();
      } else {
        if (typeof hideAllPanels === 'function') hideAllPanels();
        if (typeof showMapPanel === 'function') showMapPanel();
      }
      break;

    default:
      console.warn('[UI] Unknown panel:', panelName);
  }
}

// ============================================================
//  UTILITY FUNCTIONS
// ============================================================

function updateFightButton(newMode) {
  const btn = window.bottomUI?.fightBtn;
  if (!btn) return;

  if (newMode === 'city') {
    btn.clearTint();
  } else if (newMode === 'location') {
    btn.setTint(0xff8888);
  }
}

function setIconsEnabled(enabled) {
  const icons = window.bottomUI?.icons;
  if (!icons) return;

  icons.forEach(icon => {
    if (enabled) {
      icon.setAlpha(1);
      icon.setInteractive();
    } else {
      icon.setAlpha(0.5);
      icon.disableInteractive();
    }
  });
}

console.log("[BottomUI] Module loaded");
