"use strict";

// ============================================================
//  TUNE MODE — Visual positioning tool (?tune=1)
// ============================================================

const TUNE_ENABLED = new URLSearchParams(window.location.search).has('tune');
if (TUNE_ENABLED) console.log("[TUNE] Mode ENABLED");

// Tune settings version (increment to reset saved positions)
const TUNE_VERSION = 'v17';

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
    hero: window.spineHero,
    headerCont: window.playerHeader?.container,
    headerAvatar: window.playerHeaderAvatar,
    headerRing: window.playerHeaderExpRing,
    headerPanel: window.playerHeaderPanel,
    headerDarkBg: window.playerHeaderDarkBg,
    txtLevel: window.headerTextLevel,
    txtNickname: window.headerTextNickname,
    txtEnergy: window.headerTextEnergy,
    txtStars: window.headerTextStars,
    txtGems: window.headerTextGems,
    txtAdena: window.headerTextAdena
  });

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'tune-overlay';
  overlay.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.9);color:#0f0;padding:12px;font:11px monospace;z-index:99999;border-radius:5px;min-width:240px;';
  overlay.addEventListener('pointerdown', e => e.stopPropagation());
  overlay.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <b>🎮 TUNE MODE</b>
      <button id="tune-toggle" style="padding:2px 6px;cursor:pointer;background:#333;color:#0f0;border:1px solid #0f0;border-radius:3px;">−</button>
    </div>
    <div id="tune-content">
      <div>[<span id="tune-sel" style="color:#ff0">bg</span>]</div>
      <hr style="border-color:#333;margin:5px 0">
      <div id="tune-values" style="line-height:1.4"></div>
      <hr style="border-color:#333;margin:5px 0">
      <small>1-9,0,-,=: select | Arrows: move | Q/E: scale</small><br>
      <small>Drag: move | Click: select</small>
      <div style="margin-top:10px;display:flex;gap:5px;">
        <button id="tune-save" style="flex:1;padding:5px;cursor:pointer">💾 SAVE</button>
        <button id="tune-reset" style="padding:5px;cursor:pointer">🔄</button>
        <button id="tune-copy" style="padding:5px;cursor:pointer">📋</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Toggle collapse/expand
  let isCollapsed = false;
  const toggleBtn = document.getElementById('tune-toggle');
  const content = document.getElementById('tune-content');

  toggleBtn.onclick = () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      content.style.display = 'none';
      toggleBtn.textContent = '+';
    } else {
      content.style.display = 'block';
      toggleBtn.textContent = '−';
    }
  };

  const selColors = { bg:'#0f0', panel:'#ff0', hero:'#0ff', btn:'#f0f', icon0:'#f80', icon1:'#f80', icon2:'#f80', icon3:'#f80', header:'#0af', avatar:'#fa0', hpanel:'#f0a', darkbg:'#aaa', txtLevel:'#f88', txtNickname:'#8f8', txtEnergy:'#ff8', txtStars:'#8ff', txtGems:'#f8f', txtAdena:'#fa8' };

  const updateOverlay = () => {
    const { cont, panel, btn, icons, hero, headerCont, headerAvatar, headerRing, headerPanel, headerDarkBg, txtLevel, txtNickname, txtEnergy, txtStars, txtGems, txtAdena } = getUI();
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
    html += `<b style="color:#0af">9.HeaderCont:</b> ${headerCont?.x.toFixed(0)},${headerCont?.y.toFixed(0)} s:${headerCont?.scaleX.toFixed(2)}<br>`;
    html += `<b style="color:#fa0">0.Avatar:</b> ${headerAvatar?.x.toFixed(0)},${headerAvatar?.y.toFixed(0)} s:${headerAvatar?.scaleX.toFixed(2)}<br>`;
    html += `<b style="color:#f0a">=.HPanel:</b> ${headerPanel?.x.toFixed(0)},${headerPanel?.y.toFixed(0)} s:${headerPanel?.scaleX.toFixed(2)}<br>`;
    html += `<b style="color:#aaa">B.DarkBG:</b> ${headerDarkBg?.x.toFixed(0)},${headerDarkBg?.y.toFixed(0)} w:${headerDarkBg?.width.toFixed(0)} h:${headerDarkBg?.height.toFixed(0)}<br>`;
    html += `<b style="color:#f88">L.TxtLvl:</b> ${txtLevel?.x.toFixed(0)},${txtLevel?.y.toFixed(0)} sz:${parseInt(txtLevel?.style.fontSize) || 20}<br>`;
    html += `<b style="color:#8f8">N.TxtName:</b> ${txtNickname?.x.toFixed(0)},${txtNickname?.y.toFixed(0)} sz:${parseInt(txtNickname?.style.fontSize) || 18}<br>`;
    html += `<b style="color:#ff8">R.TxtEnrgy:</b> ${txtEnergy?.x.toFixed(0)},${txtEnergy?.y.toFixed(0)} sz:${parseInt(txtEnergy?.style.fontSize) || 18}<br>`;
    html += `<b style="color:#8ff">S.TxtStars:</b> ${txtStars?.x.toFixed(0)},${txtStars?.y.toFixed(0)} sz:${parseInt(txtStars?.style.fontSize) || 18}<br>`;
    html += `<b style="color:#f8f">G.TxtGems:</b> ${txtGems?.x.toFixed(0)},${txtGems?.y.toFixed(0)} sz:${parseInt(txtGems?.style.fontSize) || 18}<br>`;
    html += `<b style="color:#fa8">A.TxtAdena:</b> ${txtAdena?.x.toFixed(0)},${txtAdena?.y.toFixed(0)} sz:${parseInt(txtAdena?.style.fontSize) || 18}<br>`;
    document.getElementById('tune-values').innerHTML = html;
  };

  // SAVE button
  document.getElementById('tune-save').onclick = () => {
    const { cont, panel, btn, icons, hero, headerCont, headerAvatar, headerRing, headerPanel, headerDarkBg, txtLevel, txtNickname, txtEnergy, txtStars, txtGems, txtAdena } = getUI();
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
      icon3: { x: icons[3]?.x, y: icons[3]?.y },
      headerX: headerCont?.x,
      headerY: headerCont?.y,
      headerScale: headerCont?.scaleX,
      avatarX: headerAvatar?.x,
      avatarY: headerAvatar?.y,
      avatarScale: headerAvatar?.scaleX,
      hpanelX: headerPanel?.x,
      hpanelY: headerPanel?.y,
      hpanelScale: headerPanel?.scaleX,
      darkBgX: headerDarkBg?.x,
      darkBgY: headerDarkBg?.y,
      darkBgWidth: headerDarkBg?.width,
      darkBgHeight: headerDarkBg?.height,
      txtLevelX: txtLevel?.x,
      txtLevelY: txtLevel?.y,
      txtLevelSize: parseInt(txtLevel?.style.fontSize) || 20,
      txtNicknameX: txtNickname?.x,
      txtNicknameY: txtNickname?.y,
      txtNicknameSize: parseInt(txtNickname?.style.fontSize) || 18,
      txtEnergyX: txtEnergy?.x,
      txtEnergyY: txtEnergy?.y,
      txtEnergySize: parseInt(txtEnergy?.style.fontSize) || 18,
      txtStarsX: txtStars?.x,
      txtStarsY: txtStars?.y,
      txtStarsSize: parseInt(txtStars?.style.fontSize) || 18,
      txtGemsX: txtGems?.x,
      txtGemsY: txtGems?.y,
      txtGemsSize: parseInt(txtGems?.style.fontSize) || 18,
      txtAdenaX: txtAdena?.x,
      txtAdenaY: txtAdena?.y,
      txtAdenaSize: parseInt(txtAdena?.style.fontSize) || 18
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
    const { cont, panel, btn, icons, hero, headerCont, headerAvatar, headerRing, headerPanel, headerDarkBg, txtLevel, txtNickname, txtEnergy, txtStars, txtGems, txtAdena } = getUI();

    // TELEPORT MODE: If clicking on empty space, teleport selected element to click position
    let clickedOnElement = false;

    // Detect click target
    for (let i = 0; i < icons.length; i++) {
      const bounds = icons[i]?.getBounds();
      if (bounds?.contains(p.x, p.y)) {
        selectedElement = 'icon' + i;
        clickedOnElement = true;
        dragging = true; startX = p.x; startY = p.y;
        updateOverlay(); return;
      }
    }

    // Check header container (approximate bounds check)
    if (headerCont && Math.abs(p.x - headerCont.x) < 350 && Math.abs(p.y - headerCont.y) < 100) {
      selectedElement = 'header';
      clickedOnElement = true;
    } else if (btn?.getBounds()?.contains(p.x, p.y)) {
      selectedElement = 'btn';
      clickedOnElement = true;
    } else if (panel?.getBounds()?.contains(p.x, p.y)) {
      selectedElement = 'panel';
      clickedOnElement = true;
    } else if (hero && Math.abs(p.x - hero.x) < 100 && Math.abs(p.y - hero.y) < 200) {
      selectedElement = 'hero';
      clickedOnElement = true;
    }

    // If clicked on empty space, TELEPORT selected element
    if (!clickedOnElement) {
      // Teleport selected element to click position
      if (selectedElement === 'header' && headerCont) {
        headerCont.x = p.x;
        headerCont.y = p.y;
      } else if (selectedElement === 'avatar' && headerAvatar) {
        // Avatar is relative to container, so calculate offset
        const offsetX = p.x - headerCont.x;
        const offsetY = p.y - headerCont.y;
        headerAvatar.x = offsetX;
        headerAvatar.y = offsetY;
      } else if (selectedElement === 'hpanel' && headerPanel) {
        // Panel is relative to container
        const offsetX = p.x - headerCont.x;
        const offsetY = p.y - headerCont.y;
        headerPanel.x = offsetX;
        headerPanel.y = offsetY;
      } else if (selectedElement === 'darkbg' && headerDarkBg) {
        // DarkBG is relative to container
        const offsetX = p.x - headerCont.x;
        const offsetY = p.y - headerCont.y;
        headerDarkBg.x = offsetX;
        headerDarkBg.y = offsetY;
      } else if (selectedElement === 'txtLevel' && txtLevel) {
        // Text is relative to container
        const offsetX = p.x - headerCont.x;
        const offsetY = p.y - headerCont.y;
        txtLevel.x = offsetX;
        txtLevel.y = offsetY;
      } else if (selectedElement === 'txtNickname' && txtNickname) {
        const offsetX = p.x - headerCont.x;
        const offsetY = p.y - headerCont.y;
        txtNickname.x = offsetX;
        txtNickname.y = offsetY;
      } else if (selectedElement === 'txtEnergy' && txtEnergy) {
        const offsetX = p.x - headerCont.x;
        const offsetY = p.y - headerCont.y;
        txtEnergy.x = offsetX;
        txtEnergy.y = offsetY;
      } else if (selectedElement === 'txtStars' && txtStars) {
        const offsetX = p.x - headerCont.x;
        const offsetY = p.y - headerCont.y;
        txtStars.x = offsetX;
        txtStars.y = offsetY;
      } else if (selectedElement === 'txtGems' && txtGems) {
        const offsetX = p.x - headerCont.x;
        const offsetY = p.y - headerCont.y;
        txtGems.x = offsetX;
        txtGems.y = offsetY;
      } else if (selectedElement === 'txtAdena' && txtAdena) {
        const offsetX = p.x - headerCont.x;
        const offsetY = p.y - headerCont.y;
        txtAdena.x = offsetX;
        txtAdena.y = offsetY;
      } else if (selectedElement === 'panel' && cont) {
        cont.x = p.x;
        cont.y = p.y;
      } else if (selectedElement === 'hero' && hero) {
        hero.x = p.x;
        hero.y = p.y;
      } else if (selectedElement === 'btn' && btn) {
        btn.x = p.x - cont.x;
        btn.y = p.y - cont.y;
      } else if (selectedElement === 'bg') {
        cityBg.x = p.x;
        cityBg.y = p.y;
      }
      updateOverlay();
    }

    dragging = true; startX = p.x; startY = p.y;
    updateOverlay();
  });

  scene.input.on('pointermove', (p) => {
    if (!dragging) return;
    const { cont, btn, icons, hero, headerCont, headerAvatar, headerRing, headerPanel, headerDarkBg, txtLevel, txtNickname, txtEnergy, txtStars, txtGems, txtAdena } = getUI();
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
    } else if (selectedElement === 'header' && headerCont) {
      headerCont.x += dx; headerCont.y += dy;
    } else if (selectedElement === 'avatar' && headerAvatar) {
      headerAvatar.x += dx; headerAvatar.y += dy;
    } else if (selectedElement === 'hpanel' && headerPanel) {
      headerPanel.x += dx; headerPanel.y += dy;
    } else if (selectedElement === 'darkbg' && headerDarkBg) {
      headerDarkBg.x += dx; headerDarkBg.y += dy;
    } else if (selectedElement === 'txtLevel' && txtLevel) {
      txtLevel.x += dx; txtLevel.y += dy;
    } else if (selectedElement === 'txtNickname' && txtNickname) {
      txtNickname.x += dx; txtNickname.y += dy;
    } else if (selectedElement === 'txtEnergy' && txtEnergy) {
      txtEnergy.x += dx; txtEnergy.y += dy;
    } else if (selectedElement === 'txtStars' && txtStars) {
      txtStars.x += dx; txtStars.y += dy;
    } else if (selectedElement === 'txtGems' && txtGems) {
      txtGems.x += dx; txtGems.y += dy;
    } else if (selectedElement === 'txtAdena' && txtAdena) {
      txtAdena.x += dx; txtAdena.y += dy;
    } else if (selectedElement.startsWith('icon')) {
      const i = parseInt(selectedElement[4]);
      if (icons[i]) { icons[i].x += dx; icons[i].y += dy; }
    }
    updateOverlay();
  });

  scene.input.on('pointerup', () => { dragging = false; });

  // Arrow keys
  const moveSelected = (dx, dy) => {
    const { cont, btn, icons, hero, headerCont, headerAvatar, headerRing, headerPanel, headerDarkBg, txtLevel, txtNickname, txtEnergy, txtStars, txtGems, txtAdena } = getUI();

    if (selectedElement === 'bg') {
      cityBg.x += dx; cityBg.y += dy;
    } else if (selectedElement === 'panel' && cont) {
      cont.x += dx; cont.y += dy;
    } else if (selectedElement === 'hero' && hero) {
      hero.x += dx; hero.y += dy;
    } else if (selectedElement === 'btn' && btn) {
      btn.x += dx; btn.y += dy;
    } else if (selectedElement === 'header' && headerCont) {
      headerCont.x += dx; headerCont.y += dy;
    } else if (selectedElement === 'avatar' && headerAvatar) {
      headerAvatar.x += dx; headerAvatar.y += dy;
    } else if (selectedElement === 'hpanel' && headerPanel) {
      headerPanel.x += dx; headerPanel.y += dy;
    } else if (selectedElement === 'darkbg' && headerDarkBg) {
      headerDarkBg.x += dx; headerDarkBg.y += dy;
    } else if (selectedElement === 'txtLevel' && txtLevel) {
      txtLevel.x += dx; txtLevel.y += dy;
    } else if (selectedElement === 'txtNickname' && txtNickname) {
      txtNickname.x += dx; txtNickname.y += dy;
    } else if (selectedElement === 'txtEnergy' && txtEnergy) {
      txtEnergy.x += dx; txtEnergy.y += dy;
    } else if (selectedElement === 'txtStars' && txtStars) {
      txtStars.x += dx; txtStars.y += dy;
    } else if (selectedElement === 'txtGems' && txtGems) {
      txtGems.x += dx; txtGems.y += dy;
    } else if (selectedElement === 'txtAdena' && txtAdena) {
      txtAdena.x += dx; txtAdena.y += dy;
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

  // Q/E for scale (or width/height for rectangles, fontSize for texts)
  const scaleSelected = (delta) => {
    const { panel, btn, icons, hero, headerCont, headerAvatar, headerRing, headerPanel, headerDarkBg, txtLevel, txtNickname, txtEnergy, txtStars, txtGems, txtAdena } = getUI();
    if (selectedElement === 'bg') {
      cityBg.setScale(cityBg.scaleX + delta);
    } else if (selectedElement === 'panel' && panel) {
      panel.setScale(panel.scaleX + delta);
    } else if (selectedElement === 'hero' && hero) {
      hero.setScale(hero.scaleX + delta);
    } else if (selectedElement === 'btn' && btn) {
      window.fightBtnTween?.stop();
      btn.setScale(btn.scaleX + delta);
    } else if (selectedElement === 'header' && headerCont) {
      headerCont.setScale(headerCont.scaleX + delta);
    } else if (selectedElement === 'avatar' && headerAvatar) {
      headerAvatar.setScale(headerAvatar.scaleX + delta);
    } else if (selectedElement === 'hpanel' && headerPanel) {
      headerPanel.setScale(headerPanel.scaleX + delta);
    } else if (selectedElement === 'darkbg' && headerDarkBg) {
      // For rectangle, change width/height instead of scale
      headerDarkBg.width += delta * 100;
      headerDarkBg.height += delta * 50;
    } else if (selectedElement === 'txtLevel' && txtLevel) {
      // For text, change fontSize (delta * 20 for 2px steps)
      const currentSize = parseInt(txtLevel.style.fontSize) || 20;
      txtLevel.setFontSize(currentSize + delta * 20);
    } else if (selectedElement === 'txtNickname' && txtNickname) {
      const currentSize = parseInt(txtNickname.style.fontSize) || 18;
      txtNickname.setFontSize(currentSize + delta * 20);
    } else if (selectedElement === 'txtEnergy' && txtEnergy) {
      const currentSize = parseInt(txtEnergy.style.fontSize) || 18;
      txtEnergy.setFontSize(currentSize + delta * 20);
    } else if (selectedElement === 'txtStars' && txtStars) {
      const currentSize = parseInt(txtStars.style.fontSize) || 18;
      txtStars.setFontSize(currentSize + delta * 20);
    } else if (selectedElement === 'txtGems' && txtGems) {
      const currentSize = parseInt(txtGems.style.fontSize) || 18;
      txtGems.setFontSize(currentSize + delta * 20);
    } else if (selectedElement === 'txtAdena' && txtAdena) {
      const currentSize = parseInt(txtAdena.style.fontSize) || 18;
      txtAdena.setFontSize(currentSize + delta * 20);
    } else if (selectedElement.startsWith('icon')) {
      const idx = parseInt(selectedElement.replace('icon', ''));
      if (icons[idx]) icons[idx].setScale(icons[idx].scaleX + delta);
    }
    updateOverlay();
  };

  scene.input.keyboard.on('keydown-E', () => scaleSelected(SCALE_STEP));
  scene.input.keyboard.on('keydown-Q', () => scaleSelected(-SCALE_STEP));

  // Number keys 1-9, 0, -, =, B
  scene.input.keyboard.on('keydown-ONE', () => { selectedElement = 'bg'; updateOverlay(); });
  scene.input.keyboard.on('keydown-TWO', () => { selectedElement = 'panel'; updateOverlay(); });
  scene.input.keyboard.on('keydown-THREE', () => { selectedElement = 'hero'; updateOverlay(); });
  scene.input.keyboard.on('keydown-FOUR', () => { selectedElement = 'btn'; updateOverlay(); });
  scene.input.keyboard.on('keydown-FIVE', () => { selectedElement = 'icon0'; updateOverlay(); });
  scene.input.keyboard.on('keydown-SIX', () => { selectedElement = 'icon1'; updateOverlay(); });
  scene.input.keyboard.on('keydown-SEVEN', () => { selectedElement = 'icon2'; updateOverlay(); });
  scene.input.keyboard.on('keydown-EIGHT', () => { selectedElement = 'icon3'; updateOverlay(); });
  scene.input.keyboard.on('keydown-NINE', () => { selectedElement = 'header'; updateOverlay(); });
  scene.input.keyboard.on('keydown-ZERO', () => { selectedElement = 'avatar'; updateOverlay(); });
  // MINUS key removed - ring position is FIXED
  scene.input.keyboard.on('keydown-PLUS', () => { selectedElement = 'hpanel'; updateOverlay(); });
  scene.input.keyboard.on('keydown-B', () => { selectedElement = 'darkbg'; updateOverlay(); });

  // Text element shortcuts
  scene.input.keyboard.on('keydown-L', () => { selectedElement = 'txtLevel'; updateOverlay(); });
  scene.input.keyboard.on('keydown-N', () => { selectedElement = 'txtNickname'; updateOverlay(); });
  scene.input.keyboard.on('keydown-R', () => { selectedElement = 'txtEnergy'; updateOverlay(); });
  scene.input.keyboard.on('keydown-S', () => { selectedElement = 'txtStars'; updateOverlay(); });
  scene.input.keyboard.on('keydown-G', () => { selectedElement = 'txtGems'; updateOverlay(); });
  scene.input.keyboard.on('keydown-A', () => { selectedElement = 'txtAdena'; updateOverlay(); });

  // Initial update
  setTimeout(updateOverlay, 500);

  console.log('[TUNE] Ready! Keys: 1-8 select, Arrows move, Q/E scale');
}

// Apply saved tune settings
function applyTuneSettings(scene, cityBg, heroOffset) {
  const settings = getTuneSettings();
  const w = scene.scale.width;
  const h = scene.scale.height;

  console.log("[TUNE] Applying settings:", JSON.stringify(settings, null, 2));

  setTimeout(() => {
    // Background
    if (window.cityBg && settings.bgX !== undefined) {
      window.cityBg.x = settings.bgX;
      window.cityBg.y = settings.bgY;
      if (settings.bgScale) window.cityBg.setScale(settings.bgScale);
    }

    // Hero
    if (window.spineHero && settings.heroX !== undefined) {
      window.spineHero.x = settings.heroX;
      window.spineHero.y = settings.heroY;
      if (settings.heroScale) window.spineHero.setScale(settings.heroScale);
    }

    // Bottom Container
    if (window.panelContainer && settings.containerX !== undefined) {
      window.panelContainer.x = settings.containerX;
      window.panelContainer.y = settings.containerY;
    }

    // Header Container
    if (window.playerHeader?.container && settings.headerX !== undefined) {
      window.playerHeader.container.x = settings.headerX;
      window.playerHeader.container.y = settings.headerY;
      if (settings.headerScale) window.playerHeader.container.setScale(settings.headerScale);
    }

    // Header Avatar
    if (window.playerHeaderAvatar && settings.avatarX !== undefined) {
      window.playerHeaderAvatar.x = settings.avatarX;
      window.playerHeaderAvatar.y = settings.avatarY;
      if (settings.avatarScale) window.playerHeaderAvatar.setScale(settings.avatarScale);
    }

    // Ring position is FIXED in config, not loaded from settings

    // Header Panel
    if (window.playerHeaderPanel && settings.hpanelX !== undefined) {
      window.playerHeaderPanel.x = settings.hpanelX;
      window.playerHeaderPanel.y = settings.hpanelY;
      if (settings.hpanelScale) window.playerHeaderPanel.setScale(settings.hpanelScale);
    }

    // Header Dark Background
    if (window.playerHeaderDarkBg && settings.darkBgX !== undefined) {
      window.playerHeaderDarkBg.x = settings.darkBgX;
      window.playerHeaderDarkBg.y = settings.darkBgY;
      if (settings.darkBgWidth) window.playerHeaderDarkBg.width = settings.darkBgWidth;
      if (settings.darkBgHeight) window.playerHeaderDarkBg.height = settings.darkBgHeight;
    }

    // Text elements
    if (window.headerTextLevel && settings.txtLevelX !== undefined) {
      window.headerTextLevel.x = settings.txtLevelX;
      window.headerTextLevel.y = settings.txtLevelY;
      if (settings.txtLevelSize) window.headerTextLevel.setFontSize(settings.txtLevelSize);
    }
    if (window.headerTextNickname && settings.txtNicknameX !== undefined) {
      window.headerTextNickname.x = settings.txtNicknameX;
      window.headerTextNickname.y = settings.txtNicknameY;
      if (settings.txtNicknameSize) window.headerTextNickname.setFontSize(settings.txtNicknameSize);
    }
    if (window.headerTextEnergy && settings.txtEnergyX !== undefined) {
      window.headerTextEnergy.x = settings.txtEnergyX;
      window.headerTextEnergy.y = settings.txtEnergyY;
      if (settings.txtEnergySize) window.headerTextEnergy.setFontSize(settings.txtEnergySize);
    }
    if (window.headerTextStars && settings.txtStarsX !== undefined) {
      window.headerTextStars.x = settings.txtStarsX;
      window.headerTextStars.y = settings.txtStarsY;
      if (settings.txtStarsSize) window.headerTextStars.setFontSize(settings.txtStarsSize);
    }
    if (window.headerTextGems && settings.txtGemsX !== undefined) {
      window.headerTextGems.x = settings.txtGemsX;
      window.headerTextGems.y = settings.txtGemsY;
      if (settings.txtGemsSize) window.headerTextGems.setFontSize(settings.txtGemsSize);
    }
    if (window.headerTextAdena && settings.txtAdenaX !== undefined) {
      window.headerTextAdena.x = settings.txtAdenaX;
      window.headerTextAdena.y = settings.txtAdenaY;
      if (settings.txtAdenaSize) window.headerTextAdena.setFontSize(settings.txtAdenaSize);
    }

    console.log("[TUNE] Settings applied");
  }, 150);
}

console.log("[TuneMode] Module loaded");
