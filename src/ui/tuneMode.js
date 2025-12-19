"use strict";

// ============================================================
//  TUNE MODE — Visual positioning tool (?tune=1)
// ============================================================

const TUNE_ENABLED = new URLSearchParams(window.location.search).has('tune');
if (TUNE_ENABLED) console.log("[TUNE] Mode ENABLED");

// Tune settings version (increment to reset saved positions)
const TUNE_VERSION = 'v12';

function getTuneSettings() {
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

  // Clear old tune settings
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

// Initialize TUNE mode controls
function initTuneMode(scene, cityBg, heroOffset) {
  if (!TUNE_ENABLED) return;

  const w = scene.scale.width;
  const h = scene.scale.height;
  const STEP = 1;
  const SCALE_STEP = 0.02;

  let selectedElement = 'bg';

  // Get current UI state
  const getUI = () => ({
    cont: window.panelContainer,
    panel: window.bottomUI?.bottomPanel,
    btn: window.bottomUI?.fightBtn,
    icons: window.bottomUI?.icons || [],
    hero: window.spineHero
  });

  // Create overlay
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

  const updateOverlay = () => {
    const { cont, panel, btn, icons, hero } = getUI();
    document.getElementById('tune-sel').style.color = selColors[selectedElement] || '#fff';
    document.getElementById('tune-sel').textContent = selectedElement;

    let html = '';
    html += `<b style="color:#0f0">1.BG:</b> ${cityBg.x.toFixed(0)},${cityBg.y.toFixed(0)} s:${cityBg.scaleX.toFixed(2)}<br>`;
    html += `<b style="color:#ff0">2.Panel:</b> cont(${cont?.x.toFixed(0)},${cont?.y.toFixed(0)}) s:${panel?.scaleX.toFixed(2)}<br>`;
    html += `<b style="color:#0ff">3.Hero:</b> ${hero?.x.toFixed(0)},${hero?.y.toFixed(0)} s:${hero?.scaleX.toFixed(2)}<br>`;
    html += `<b style="color:#f0f">4.Btn:</b> ${btn?.x.toFixed(0)},${btn?.y.toFixed(0)} s:${btn?.scaleX.toFixed(2)}<br>`;
    html += `<b style="color:#f80">5-8.Icons:</b><br>`;
    icons.forEach((ic, i) => {
      html += `  ${i}: (${ic.x.toFixed(0)},${ic.y.toFixed(0)}) s:${ic.scaleX.toFixed(2)}<br>`;
    });
    document.getElementById('tune-values').innerHTML = html;
  };

  // SAVE button
  document.getElementById('tune-save').onclick = () => {
    const { cont, panel, btn, icons, hero } = getUI();
    const settings = {
      bgX: cityBg.x,
      bgY: cityBg.y,
      bgScale: cityBg.scaleX,
      containerX: cont?.x,
      containerY: cont?.y,
      panelScale: panel?.scaleX,
      heroX: hero?.x,
      heroY: hero?.y,
      heroScale: hero?.scaleX,
      btnX: btn?.x,
      btnY: btn?.y,
      btnScale: btn?.scaleX,
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
    const { cont, btn, icons } = getUI();
    const txt = `Container: ${cont?.x},${cont?.y}\nBtn: ${btn?.x},${btn?.y} s:${btn?.scaleX}\nIcons: ${icons.map(i=>`(${i.x},${i.y})`).join(' ')} s:${icons[0]?.scaleX}`;
    navigator.clipboard?.writeText(txt);
    alert('Copied!\n' + txt);
  };

  // Drag handling
  let dragging = false, startX = 0, startY = 0;

  scene.input.on('pointerdown', (p) => {
    const { cont, panel, btn, icons, hero } = getUI();

    // Detect click target
    for (let i = 0; i < icons.length; i++) {
      const bounds = icons[i]?.getBounds();
      if (bounds?.contains(p.x, p.y)) {
        selectedElement = 'icon' + i;
        dragging = true; startX = p.x; startY = p.y;
        updateOverlay(); return;
      }
    }
    if (btn?.getBounds()?.contains(p.x, p.y)) {
      selectedElement = 'btn';
    } else if (panel?.getBounds()?.contains(p.x, p.y)) {
      selectedElement = 'panel';
    } else if (hero && Math.abs(p.x - hero.x) < 100 && Math.abs(p.y - hero.y) < 200) {
      selectedElement = 'hero';
    } else {
      selectedElement = 'bg';
    }
    dragging = true; startX = p.x; startY = p.y;
    updateOverlay();
  });

  scene.input.on('pointermove', (p) => {
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

  scene.input.on('pointerup', () => { dragging = false; });

  // Arrow keys
  const moveSelected = (dx, dy) => {
    const { cont, btn, icons, hero } = getUI();

    if (selectedElement === 'bg') {
      cityBg.x += dx; cityBg.y += dy;
    } else if (selectedElement === 'panel' && cont) {
      cont.x += dx; cont.y += dy;
    } else if (selectedElement === 'hero' && hero) {
      hero.x += dx; hero.y += dy;
    } else if (selectedElement === 'btn' && btn) {
      btn.x += dx; btn.y += dy;
    } else if (selectedElement.startsWith('icon')) {
      const idx = parseInt(selectedElement.replace('icon', ''));
      if (icons[idx]) {
        icons[idx].x += dx;
        icons[idx].y += dy;
      }
    }
    updateOverlay();
  };

  scene.input.keyboard.on('keydown-UP', () => moveSelected(0, -STEP));
  scene.input.keyboard.on('keydown-DOWN', () => moveSelected(0, STEP));
  scene.input.keyboard.on('keydown-LEFT', () => moveSelected(-STEP, 0));
  scene.input.keyboard.on('keydown-RIGHT', () => moveSelected(STEP, 0));

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
      const idx = parseInt(selectedElement.replace('icon', ''));
      if (icons[idx]) icons[idx].setScale(icons[idx].scaleX + delta);
    }
    updateOverlay();
  };

  scene.input.keyboard.on('keydown-E', () => scaleSelected(SCALE_STEP));
  scene.input.keyboard.on('keydown-Q', () => scaleSelected(-SCALE_STEP));

  // Number keys 1-8
  scene.input.keyboard.on('keydown-ONE', () => { selectedElement = 'bg'; updateOverlay(); });
  scene.input.keyboard.on('keydown-TWO', () => { selectedElement = 'panel'; updateOverlay(); });
  scene.input.keyboard.on('keydown-THREE', () => { selectedElement = 'hero'; updateOverlay(); });
  scene.input.keyboard.on('keydown-FOUR', () => { selectedElement = 'btn'; updateOverlay(); });
  scene.input.keyboard.on('keydown-FIVE', () => { selectedElement = 'icon0'; updateOverlay(); });
  scene.input.keyboard.on('keydown-SIX', () => { selectedElement = 'icon1'; updateOverlay(); });
  scene.input.keyboard.on('keydown-SEVEN', () => { selectedElement = 'icon2'; updateOverlay(); });
  scene.input.keyboard.on('keydown-EIGHT', () => { selectedElement = 'icon3'; updateOverlay(); });

  // Initial update
  setTimeout(updateOverlay, 500);

  console.log('[TUNE] Ready! Keys: 1-8 select, Arrows move, Q/E scale');
}

// Apply saved tune settings
function applyTuneSettings(scene, cityBg, heroOffset) {
  const tune = getTuneSettings();
  const w = scene.scale.width;
  const h = scene.scale.height;

  console.log("[TUNE] Applying settings:", JSON.stringify(tune, null, 2));

  setTimeout(() => {
    // Background
    if (window.cityBg) {
      const baseScale = window.cityBg.scaleX / (tune.bgZoom || 1);
      window.cityBg.setScale(baseScale * tune.bgZoom);
      window.cityBg.y += tune.bgPanY;
      window.cityBg.x += tune.bgPanX;
    }

    // Hero - only in tune mode
    if (window.spineHero && TUNE_ENABLED) {
      const baseX = w / 2 + heroOffset.x;
      const baseY = h + heroOffset.y;
      window.spineHero.x = baseX + tune.heroX;
      window.spineHero.y = baseY + tune.heroY;
      window.spineHero.setScale(heroOffset.scale * tune.heroScale);
    }

    // Container
    if (window.panelContainer) {
      window.panelContainer.x += tune.panelX;
      window.panelContainer.y -= tune.panelY;
    }

    console.log("[TUNE] Settings applied");
  }, 150);
}

console.log("[TuneMode] Module loaded");
