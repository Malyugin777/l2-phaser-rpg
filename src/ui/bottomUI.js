"use strict";

// ============================================================
//  BOTTOM UI — Panel, button, icons (Container-based)
//  With click handlers for panels
// ============================================================

// UI Layout config for optimized textures
// Panel: 800x188, Button: 240x240, Icons: 140x140
const UI_LAYOUT = {
  container: { offsetY: 3 },
  panel: { scale: 1.0 },
  button: { x: 0, y: -110, scale: 0.45 },
  icons: {
    // Icons 140x140, scale 0.5 = 70px on screen
    positions: [
      { x: 280, y: -50, scale: 0.5 },   // helmet (rightmost)
      { x: 140, y: -50, scale: 0.5 },   // anvil
      { x: -140, y: -50, scale: 0.5 },  // store
      { x: -280, y: -50, scale: 0.5 }   // map (leftmost)
    ]
  }
};

// Icon config - left to right on screen:
// map(x:-280) → store(x:-140) → [FIGHT] → anvil(x:140) → helmet(x:280)
const ICON_CONFIG = [
  { key: 'icon_helmet', action: 'inventory' },  // pos[0] x:280 (right)
  { key: 'icon_anvil',  action: 'forge' },      // pos[1] x:140
  { key: 'icon_store',  action: 'shop' },       // pos[2] x:-140
  { key: 'icon_map',    action: 'map' }         // pos[3] x:-280 (left)
];

function createBottomUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  console.log("[BOTTOMUI] Creating UI, screen:", w, "x", h);

  // === CONTAINER ===
  const panelContainer = scene.add.container(w / 2, h + UI_LAYOUT.container.offsetY);
  panelContainer.setDepth(200);
  panelContainer.setScrollFactor(0);

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

  console.log("[BOTTOMUI] Created:", icons.length, "icons");

  return { bottomPanel, fightBtn, icons, container: panelContainer };
}

// ============================================================
//  CLICK HANDLERS
// ============================================================

function onFightButtonClick(scene) {
  console.log('[UI] Fight button → Arena');
  if (typeof hideAllPanels === 'function') hideAllPanels();

  if (typeof isArenaOpen !== 'undefined' && isArenaOpen) {
    if (typeof hideArenaPanel === 'function') hideArenaPanel();
  } else {
    if (typeof showArenaPanel === 'function') {
      showArenaPanel();
    } else if (typeof onArenaButtonClick === 'function') {
      onArenaButtonClick(scene);
    }
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
