"use strict";

// ============================================================
//  BOTTOM UI — Panel, button, icons (Container-based)
// ============================================================

// UI Layout config (offsets from base positions)
const UI_LAYOUT = {
  container: { offsetY: 3 },
  panel: { scale: 0.58 },
  button: { x: 0, y: -215, scale: 0.54 },
  icons: {
    scale: 0.66,
    positions: [
      { x: 64, y: -62, scale: 0.70 },   // helmet
      { x: 17, y: -68, scale: 0.60 },   // anvil
      { x: -22, y: -71, scale: 0.66 },  // store
      { x: -41, y: -66, scale: 0.66 }   // map
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
  bottomPanel.setOrigin(0.5, 1);
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
      .setScale(pos.scale || iconsCfg.scale)
      .setInteractive();
  });
  panelContainer.add(icons);

  // Store container reference
  window.panelContainer = panelContainer;

  // === DEBUG LOGS ===
  console.log("[BOTTOMUI] Container:", w/2, h + UI_LAYOUT.container.offsetY);
  console.log("[BOTTOMUI] Button:", btnCfg.x, btnCfg.y, "scale:", btnCfg.scale);
  console.log("[BOTTOMUI] Icons:", icons.length);

  return {
    bottomPanel,
    fightBtn,
    icons,
    container: panelContainer
  };
}

console.log("[BottomUI] Module loaded");
