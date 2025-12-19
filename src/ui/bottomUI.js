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
      { x: 68, y: -62, scale: 0.70 },   // helmet (rightmost)
      { x: 17, y: -68, scale: 0.60 },   // anvil
      { x: -22, y: -71, scale: 0.66 },  // store
      { x: -41, y: -66, scale: 0.66 }   // map (leftmost)
    ]
  }
};

// Icon config - matches visual layout left to right
// Visual: [helmet] [anvil] [FIGHT] [store] [map]
//         LEFT                              RIGHT
// Positions array order: [0]=x:68, [1]=x:17, [2]=x:-22, [3]=x:-41
const ICON_CONFIG = [
  { key: 'icon_map',    action: 'map',       name: 'map' },       // pos[0] x:68 (right)
  { key: 'icon_store',  action: 'shop',      name: 'store' },     // pos[1] x:17
  { key: 'icon_anvil',  action: 'forge',     name: 'anvil' },     // pos[2] x:-22
  { key: 'icon_helmet', action: 'inventory', name: 'helmet' }     // pos[3] x:-41 (left)
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
  fightBtn.setDepth(205);

  const btnHitSize = 80;
  fightBtn.setInteractive({
    useHandCursor: true,
    hitArea: new Phaser.Geom.Rectangle(-btnHitSize/2, -btnHitSize/2, btnHitSize, btnHitSize),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains
  });
  panelContainer.add(fightBtn);

  fightBtn.on('pointerdown', () => {
    console.log('[UI] Fight button clicked!');
    onFightButtonClick(scene);
  });

  // === ICONS ===
  const iconsCfg = UI_LAYOUT.icons;
  const icons = [];
  const iconHitSize = 50;

  console.log("[BOTTOMUI] Creating icons (right to left)...");

  ICON_CONFIG.forEach((cfg, i) => {
    const pos = iconsCfg.positions[i];
    
    console.log("[BOTTOMUI] Icon", i, cfg.key, "at x:", pos.x, "→", cfg.name);

    const icon = scene.add.image(pos.x, pos.y, cfg.key);
    icon.setScale(pos.scale || iconsCfg.scale);
    icon.setDepth(210 + i);

    icon.setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(-iconHitSize/2, -iconHitSize/2, iconHitSize, iconHitSize),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });

    icon.setData('action', cfg.action);
    icon.setData('name', cfg.name);
    icon.setData('index', i);

    // Click handler
    icon.on('pointerdown', () => {
      console.log('[UI] Clicked:', cfg.name, '→ panel:', cfg.action);
      onIconClick(scene, cfg.action);
    });

    // Hover effects
    icon.on('pointerover', () => {
      icon.setTint(0xaaaaaa);
    });
    icon.on('pointerout', () => icon.clearTint());

    icons.push(icon);
  });

  icons.forEach(icon => panelContainer.add(icon));

  window.panelContainer = panelContainer;

  console.log("[BOTTOMUI] Created - Panel + Button + Icons:", icons.length);
  console.log("[BOTTOMUI] Icon order (R→L): map, shop, forge, inventory");

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
