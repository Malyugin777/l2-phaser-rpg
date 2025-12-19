"use strict";

// ============================================================
//  BOTTOM UI — Panel, button, icons (Container-based)
//  With click handlers for panels
// ============================================================

// UI Layout config (offsets from base positions)
const UI_LAYOUT = {
  container: { offsetY: 3 },
  panel: { scale: 0.58 },
  button: { x: 0, y: -215, scale: 0.54 },
  icons: {
    scale: 0.66,
    positions: [
      { x: 68, y: -62, scale: 0.70 },   // helmet → inventory
      { x: 17, y: -68, scale: 0.60 },   // anvil → forge
      { x: -22, y: -71, scale: 0.66 },  // store → shop
      { x: -41, y: -66, scale: 0.66 }   // map → map
    ]
  }
};

// Icon action mapping
const ICON_ACTIONS = [
  { name: 'inventory', panel: 'inventory' },
  { name: 'forge', panel: 'forge' },
  { name: 'shop', panel: 'shop' },
  { name: 'map', panel: 'map' }
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
  const iconKeys = ['icon_helmet', 'icon_anvil', 'icon_store', 'icon_map'];

  console.log("[BOTTOMUI] Creating icons...");

  const icons = [];
  iconsCfg.positions.forEach((pos, i) => {
    console.log("[BOTTOMUI] Creating icon", i, iconKeys[i], "at", pos.x, pos.y);

    const icon = scene.add.image(pos.x, pos.y, iconKeys[i]);
    icon.setScale(pos.scale || iconsCfg.scale);
    icon.setDepth(210); // Above panel and button

    // Simple interactive - full image bounds
    icon.setInteractive({ useHandCursor: true });

    icon.setData('action', ICON_ACTIONS[i]);
    icon.setData('index', i);

    // Click handler
    icon.on('pointerdown', () => {
      const action = icon.getData('action');
      console.log('[UI] Icon', i, 'clicked:', action.name);
      onIconClick(scene, action.panel);
    });

    // Hover effects
    icon.on('pointerover', () => {
      icon.setTint(0xaaaaaa);
      console.log('[UI] Hover icon', i);
    });
    icon.on('pointerout', () => icon.clearTint());

    icons.push(icon);

    console.log("[BOTTOMUI] Icon", i, "created, size:", icon.width, "x", icon.height);
  });

  // Add icons to container
  icons.forEach(icon => panelContainer.add(icon));

  console.log("[BOTTOMUI] All icons added to container");
  window.panelContainer = panelContainer;

  console.log("[BOTTOMUI] Created - Icons:", icons.length);

  return { bottomPanel, fightBtn, icons, container: panelContainer };
}

// ============================================================
//  CLICK HANDLERS
// ============================================================

function onFightButtonClick(scene) {
  console.log('[UI] Fight button → Arena');
  if (typeof hideAllPanels === 'function') hideAllPanels();

  // Open arena
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

  // Toggle behavior: if panel is open, close it; otherwise open it
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
