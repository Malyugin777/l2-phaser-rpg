"use strict";

// ============================================================
//  ARENA SCENE — 3-Screen Wide World (IIFE to avoid conflicts)
//  Studio Quality: Cinematic camera, proper ground positioning
//  With Tune Mode for visual adjustments
// ============================================================

(function() {

let arenaActive = false;
let arenaState = "NONE"; // NONE, INTRO, TUNING, INTRO_PLAYER, INTRO_ENEMY, READY, RUN_IN, ENGAGE, FIGHT

let arenaBgSprite = null;
let arenaPlayerSprite = null;
let arenaEnemySprite = null;
let arenaExitBtnSprite = null;

const ARENA_CONFIG = {
  worldMultiplier: 10,     // World = 10x screen width (7800px)
  fightOffset: 150,        // Distance from center for each fighter
  engageDistance: 300,     // Stop when this close
  groundY: 0.90,           // LOCKED at 90%
  runSpeed: 2500,          // Slower for drama
  vsScreenDuration: 1500,
  fadeTime: 300,
  engagePause: 300,
  fighterScale: 1.14,      // LOCKED at 1.14
  // Spawn positions (% of world width)
  playerSpawnX: 0.10,      // LOCKED at 10%
  enemySpawnX: 0.90,       // 90% for wider world
  // BG position
  bgOffsetX: 465,          // LOCKED
  // Camera settings
  camera: {
    lerpSpeed: 0.06,       // Smooth follow (0.01=slow, 0.1=fast)
    lockOnEngage: true,    // Lock camera when fighters meet
    startZoom: 1.4,        // Zoomed in on fighters during intro
    endZoom: 1.0,          // Zoom out to show both fighters
    zoomLerpSpeed: 0.03    // Zoom interpolation speed
  },
  // Cinematic intro timings (ms)
  cinematic: {
    introPlayerDuration: 1500,  // Show player close-up
    panToEnemyDuration: 800,    // Pan camera to enemy
    introEnemyDuration: 1000,   // Show enemy close-up
    readyDuration: 500,         // "READY" moment before run
    zoomOutDuration: 600        // Zoom out transition
  }
};

let BASE_W, BASE_H, WORLD_W, WORLD_H, GROUND_Y;

// Cinematic camera tracking
let cinematicTarget = { x: 0, zoom: 1.0 };
let cinematicStartTime = 0;

// ============================================================
//  ARENA TUNE MODE
// ============================================================

const ARENA_TUNE_ENABLED = new URLSearchParams(window.location.search).has('arena_tune');
if (ARENA_TUNE_ENABLED) console.log("[ARENA] Tune mode ENABLED");

// Tunable values (saved to localStorage)
function getArenaTuneSettings() {
  const defaults = {
    bgX: ARENA_CONFIG.bgOffsetX,  // LOCKED at 465
    bgY: 0,
    bgScale: 1.0,
    groundY: ARENA_CONFIG.groundY,        // LOCKED at 0.90
    fighterScale: ARENA_CONFIG.fighterScale,  // LOCKED at 1.14
    fightOffset: ARENA_CONFIG.fightOffset,
    cameraStartX: 0,
    playerStartX: ARENA_CONFIG.playerSpawnX,  // LOCKED at 10%
    enemyStartX: ARENA_CONFIG.enemySpawnX,    // 90%
  };

  if (!ARENA_TUNE_ENABLED) return defaults;

  try {
    const saved = localStorage.getItem('ARENA_TUNE');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate spawn positions
      if (parsed.playerStartX > 0.5) parsed.playerStartX = defaults.playerStartX;
      if (parsed.enemyStartX < 0.5) parsed.enemyStartX = defaults.enemyStartX;
      // Validate groundY (must be 0.3 to 0.95)
      if (parsed.groundY > 0.95) parsed.groundY = 0.90;
      if (parsed.groundY < 0.3) parsed.groundY = 0.50;
      return { ...defaults, ...parsed };
    }
  } catch(e) {}
  return defaults;
}

let arenaTuneSettings = getArenaTuneSettings();

function saveArenaTuneSettings() {
  localStorage.setItem('ARENA_TUNE', JSON.stringify(arenaTuneSettings));
  console.log("[ARENA TUNE] Saved:", arenaTuneSettings);
}

// Tune overlay UI
let tuneOverlay = null;
let selectedTuneElement = 'ground';
let groundLine = null;
let tuneScene = null;  // Reference for camera access

function createArenaTuneUI(scene) {
  if (!ARENA_TUNE_ENABLED) return;

  tuneScene = scene;  // Save reference

  const overlay = document.createElement('div');
  overlay.id = 'arena-tune-overlay';
  overlay.style.cssText = `
    position: fixed; top: 10px; left: 10px;
    background: rgba(0,0,0,0.85); color: #0f0;
    padding: 15px; font: 12px monospace;
    z-index: 99999; border-radius: 8px;
    min-width: 280px; pointer-events: auto;
  `;
  overlay.innerHTML = `
    <b>🎬 ARENA TUNE</b> [<span id="arena-sel" style="color:#ff0">ground</span>]
    <hr style="border-color:#333;margin:8px 0">
    <div id="arena-tune-values"></div>
    <hr style="border-color:#333;margin:8px 0">
    <small style="color:#888">
    🖱️ <b style="color:#0f0">Drag</b> fighters | <b style="color:#0f0">RMB</b> pan<br>
    <b>Q/E:</b> Scale | <b>A/D:</b> Pan cam<br>
    <b>Z/X:</b> Zoom | <b>0:</b> Zoom=1 | <b>9:</b> Zoom=1.3<br>
    <b>C:</b> Cam→Player | <b>V:</b> Center | <b>B:</b> Cam→Enemy<br>
    <span style="color:#0f0">SPACE: Run</span> | <b>R:</b> Reset | <b>S:</b> Save
    </small>
    <div style="margin-top:10px;display:flex;gap:5px;">
      <button id="arena-tune-save" style="flex:1;padding:8px;cursor:pointer">💾 SAVE</button>
      <button id="arena-tune-reset" style="padding:8px;cursor:pointer">🔄</button>
      <button id="arena-tune-copy" style="padding:8px;cursor:pointer">📋</button>
    </div>
  `;
  document.body.appendChild(overlay);
  tuneOverlay = overlay;

  // Buttons
  document.getElementById('arena-tune-save').onclick = () => {
    saveArenaTuneSettings();
    alert('Saved!\n\n' + JSON.stringify(arenaTuneSettings, null, 2));
  };

  document.getElementById('arena-tune-reset').onclick = () => {
    localStorage.removeItem('ARENA_TUNE');
    alert('Reset! Reload page.');
    location.reload();
  };

  document.getElementById('arena-tune-copy').onclick = () => {
    navigator.clipboard?.writeText(JSON.stringify(arenaTuneSettings, null, 2));
    alert('Copied to clipboard!');
  };

  // Keyboard controls
  setupArenaTuneKeys(scene);

  // Update display
  updateArenaTuneDisplay();
}

function updateArenaTuneDisplay() {
  if (!tuneOverlay) return;

  const el = document.getElementById('arena-tune-values');
  if (!el) return;

  const s = arenaTuneSettings;
  const cam = tuneScene?.cameras?.main;
  const camInfo = cam ? `x:${cam.scrollX.toFixed(0)} z:${cam.zoom.toFixed(2)}` : '';

  el.innerHTML = `
    <b style="color:${selectedTuneElement === 'bg' ? '#ff0' : '#888'}">BG:</b>
    x:${s.bgX.toFixed(0)} y:${s.bgY.toFixed(0)} s:${s.bgScale.toFixed(2)}<br>
    <b style="color:${selectedTuneElement === 'ground' ? '#ff0' : '#888'}">Ground:</b>
    ${(s.groundY * 100).toFixed(0)}% (${(BASE_H * s.groundY).toFixed(0)}px)<br>
    <b style="color:${selectedTuneElement === 'player' ? '#ff0' : '#888'}">Player:</b>
    x:${(s.playerStartX * 100).toFixed(0)}% s:${s.fighterScale.toFixed(2)}<br>
    <b style="color:${selectedTuneElement === 'enemy' ? '#ff0' : '#888'}">Enemy:</b>
    x:${(s.enemyStartX * 100).toFixed(0)}% s:${s.fighterScale.toFixed(2)}<br>
    <b style="color:${selectedTuneElement === 'fight' ? '#ff0' : '#888'}">Fight:</b>
    offset:${s.fightOffset.toFixed(0)}px<br>
    <hr style="border-color:#333;margin:5px 0">
    <span style="color:#0ff">Cam: ${camInfo}</span> |
    <span style="color:#f80">${arenaState}</span>
  `;

  document.getElementById('arena-sel').textContent = selectedTuneElement;
}

function setupArenaTuneKeys(scene) {
  const STEP = 5;
  const SCALE_STEP = 0.02;

  scene.input.keyboard.on('keydown-ONE', () => { selectedTuneElement = 'bg'; updateArenaTuneDisplay(); });
  scene.input.keyboard.on('keydown-TWO', () => { selectedTuneElement = 'ground'; updateArenaTuneDisplay(); });
  scene.input.keyboard.on('keydown-THREE', () => { selectedTuneElement = 'player'; updateArenaTuneDisplay(); });
  scene.input.keyboard.on('keydown-FOUR', () => { selectedTuneElement = 'enemy'; updateArenaTuneDisplay(); });
  scene.input.keyboard.on('keydown-FIVE', () => { selectedTuneElement = 'fight'; updateArenaTuneDisplay(); });

  scene.input.keyboard.on('keydown-UP', () => {
    if (selectedTuneElement === 'bg') {
      arenaTuneSettings.bgY -= STEP;
      applyArenaTuneSettings(scene);
    } else if (selectedTuneElement === 'ground' || selectedTuneElement === 'player' || selectedTuneElement === 'enemy') {
      arenaTuneSettings.groundY -= 0.01;
      GROUND_Y = BASE_H * arenaTuneSettings.groundY;
      if (arenaPlayerSprite) arenaPlayerSprite.y = GROUND_Y;
      if (arenaEnemySprite) arenaEnemySprite.y = GROUND_Y;
      drawGroundLine(scene);
    }
    updateArenaTuneDisplay();
  });

  scene.input.keyboard.on('keydown-DOWN', () => {
    if (selectedTuneElement === 'bg') {
      arenaTuneSettings.bgY += STEP;
      applyArenaTuneSettings(scene);
    } else if (selectedTuneElement === 'ground' || selectedTuneElement === 'player' || selectedTuneElement === 'enemy') {
      arenaTuneSettings.groundY += 0.01;
      GROUND_Y = BASE_H * arenaTuneSettings.groundY;
      if (arenaPlayerSprite) arenaPlayerSprite.y = GROUND_Y;
      if (arenaEnemySprite) arenaEnemySprite.y = GROUND_Y;
      drawGroundLine(scene);
    }
    updateArenaTuneDisplay();
  });

  scene.input.keyboard.on('keydown-LEFT', () => {
    if (selectedTuneElement === 'bg') {
      arenaTuneSettings.bgX -= STEP;
      applyArenaTuneSettings(scene);
    } else if (selectedTuneElement === 'player' && arenaPlayerSprite) {
      arenaPlayerSprite.x -= 50;
      arenaTuneSettings.playerStartX = arenaPlayerSprite.x / WORLD_W;
    } else if (selectedTuneElement === 'enemy' && arenaEnemySprite) {
      arenaEnemySprite.x -= 50;
      arenaTuneSettings.enemyStartX = arenaEnemySprite.x / WORLD_W;
    } else if (selectedTuneElement === 'fight') {
      arenaTuneSettings.fightOffset -= 10;
      applyArenaTuneSettings(scene);
    }
    updateArenaTuneDisplay();
  });

  scene.input.keyboard.on('keydown-RIGHT', () => {
    if (selectedTuneElement === 'bg') {
      arenaTuneSettings.bgX += STEP;
      applyArenaTuneSettings(scene);
    } else if (selectedTuneElement === 'player' && arenaPlayerSprite) {
      arenaPlayerSprite.x += 50;
      arenaTuneSettings.playerStartX = arenaPlayerSprite.x / WORLD_W;
    } else if (selectedTuneElement === 'enemy' && arenaEnemySprite) {
      arenaEnemySprite.x += 50;
      arenaTuneSettings.enemyStartX = arenaEnemySprite.x / WORLD_W;
    } else if (selectedTuneElement === 'fight') {
      arenaTuneSettings.fightOffset += 10;
      applyArenaTuneSettings(scene);
    }
    updateArenaTuneDisplay();
  });

  scene.input.keyboard.on('keydown-Q', () => {
    if (selectedTuneElement === 'bg') arenaTuneSettings.bgScale -= SCALE_STEP;
    else if (selectedTuneElement === 'player' || selectedTuneElement === 'enemy')
      arenaTuneSettings.fighterScale -= SCALE_STEP;
    applyArenaTuneSettings(scene);
  });

  scene.input.keyboard.on('keydown-E', () => {
    if (selectedTuneElement === 'bg') arenaTuneSettings.bgScale += SCALE_STEP;
    else if (selectedTuneElement === 'player' || selectedTuneElement === 'enemy')
      arenaTuneSettings.fighterScale += SCALE_STEP;
    applyArenaTuneSettings(scene);
  });

  // Space = start/restart run
  scene.input.keyboard.on('keydown-SPACE', () => {
    if (arenaState === 'TUNING') {
      // First run from tuning state
      startRunIn(scene);
    } else if (arenaState === 'FIGHT' || arenaState === 'ENGAGE') {
      // Reset and run again
      resetFighterPositions(scene);
      scene.time.delayedCall(100, () => startRunIn(scene));
    }
  });

  // R = reset to start positions (TUNING state, no run)
  scene.input.keyboard.on('keydown-R', () => {
    resetFighterPositions(scene);
    arenaState = 'TUNING';
    console.log("[ARENA TUNE] Reset to start - ready to adjust");
  });

  // S = save
  scene.input.keyboard.on('keydown-S', () => {
    saveArenaTuneSettings();
  });

  // === CAMERA CONTROLS ===

  // C = camera to player (center player on screen)
  scene.input.keyboard.on('keydown-C', () => {
    if (arenaPlayerSprite) {
      const camX = Math.max(0, Math.min(arenaPlayerSprite.x - BASE_W / 2, WORLD_W - BASE_W));
      scene.cameras.main.scrollX = camX;
      updateArenaTuneDisplay();
    }
  });

  // V = center camera (world center)
  scene.input.keyboard.on('keydown-V', () => {
    scene.cameras.main.scrollX = (WORLD_W - BASE_W) / 2;
    updateArenaTuneDisplay();
  });

  // B = camera to enemy (center enemy on screen)
  scene.input.keyboard.on('keydown-B', () => {
    if (arenaEnemySprite) {
      const camX = Math.max(0, Math.min(arenaEnemySprite.x - BASE_W / 2, WORLD_W - BASE_W));
      scene.cameras.main.scrollX = camX;
      updateArenaTuneDisplay();
    }
  });

  // A/D = pan camera left/right (NO LIMITS in tune mode)
  const PAN_STEP = 150;
  scene.input.keyboard.on('keydown-A', () => {
    scene.cameras.main.scrollX -= PAN_STEP;
    console.log("[TUNE] Camera X:", scene.cameras.main.scrollX);
    updateArenaTuneDisplay();
  });
  scene.input.keyboard.on('keydown-D', () => {
    scene.cameras.main.scrollX += PAN_STEP;
    console.log("[TUNE] Camera X:", scene.cameras.main.scrollX);
    updateArenaTuneDisplay();
  });

  // Helper: zoom camera centered on a target X position
  function zoomToTarget(targetX, newZoom, label) {
    const cam = scene.cameras.main;
    cam.setZoom(newZoom);

    // Calculate scroll to center target in zoomed view
    const viewWidth = BASE_W / newZoom;
    const scrollX = targetX - viewWidth / 2;

    // Clamp to world bounds
    const maxScroll = WORLD_W - viewWidth;
    cam.scrollX = Math.max(0, Math.min(scrollX, maxScroll));

    console.log("[TUNE ZOOM]", label, "targetX:", targetX.toFixed(0), "zoom:", newZoom.toFixed(2), "scrollX:", cam.scrollX.toFixed(0));
    updateArenaTuneDisplay();
  }

  // Z = zoom OUT, centered on selected object
  scene.input.keyboard.on('keydown-Z', () => {
    const newZoom = Math.max(0.5, scene.cameras.main.zoom - 0.1);

    // Get target based on selection
    let targetX = scene.cameras.main.scrollX + BASE_W / 2; // default: center of current view
    let label = "center";

    if (selectedTuneElement === 'player' && arenaPlayerSprite) {
      targetX = arenaPlayerSprite.x;
      label = "PLAYER x=" + arenaPlayerSprite.x.toFixed(0);
    } else if (selectedTuneElement === 'enemy' && arenaEnemySprite) {
      targetX = arenaEnemySprite.x;
      label = "ENEMY x=" + arenaEnemySprite.x.toFixed(0);
    }

    console.log("[TUNE] Z pressed, selected:", selectedTuneElement, "sprite exists:", !!arenaPlayerSprite, !!arenaEnemySprite);
    zoomToTarget(targetX, newZoom, label);
  });

  // X = zoom IN, centered on selected object
  scene.input.keyboard.on('keydown-X', () => {
    const newZoom = Math.min(2.0, scene.cameras.main.zoom + 0.1);

    // Get target based on selection
    let targetX = scene.cameras.main.scrollX + BASE_W / 2; // default: center of current view
    let label = "center";

    if (selectedTuneElement === 'player' && arenaPlayerSprite) {
      targetX = arenaPlayerSprite.x;
      label = "PLAYER x=" + arenaPlayerSprite.x.toFixed(0);
    } else if (selectedTuneElement === 'enemy' && arenaEnemySprite) {
      targetX = arenaEnemySprite.x;
      label = "ENEMY x=" + arenaEnemySprite.x.toFixed(0);
    }

    console.log("[TUNE] X pressed, selected:", selectedTuneElement, "sprite exists:", !!arenaPlayerSprite, !!arenaEnemySprite);
    zoomToTarget(targetX, newZoom, label);
  });

  // 0 = reset zoom to 1.0
  scene.input.keyboard.on('keydown-ZERO', () => {
    scene.cameras.main.setZoom(1.0);
    updateArenaTuneDisplay();
  });

  // 9 = zoom to start (1.3)
  scene.input.keyboard.on('keydown-NINE', () => {
    const startZoom = ARENA_CONFIG.camera?.startZoom || 1.3;
    scene.cameras.main.setZoom(startZoom);
    updateArenaTuneDisplay();
  });
}

function applyArenaTuneSettings(scene) {
  const s = arenaTuneSettings;

  // Apply BG position/scale (COVER mode)
  if (arenaBgSprite) {
    const texW = arenaBgSprite.texture.source[0].width;
    const texH = arenaBgSprite.texture.source[0].height;
    const scaleW = WORLD_W / texW;
    const scaleH = BASE_H / texH;
    const baseScale = Math.max(scaleW, scaleH);  // COVER
    arenaBgSprite.setScale(baseScale * s.bgScale);
    arenaBgSprite.setPosition(WORLD_W / 2 + s.bgX, BASE_H / 2 + s.bgY);
  }

  // Apply ground Y
  GROUND_Y = BASE_H * s.groundY;

  // Apply fighter positions
  if (arenaPlayerSprite) {
    arenaPlayerSprite.y = GROUND_Y;
    arenaPlayerSprite.setScale(s.fighterScale);
  }
  if (arenaEnemySprite) {
    arenaEnemySprite.y = GROUND_Y;
    arenaEnemySprite.setScale(-s.fighterScale, s.fighterScale);
  }

  // Update fight offset
  ARENA_CONFIG.fightOffset = s.fightOffset;

  updateArenaTuneDisplay();

  // Draw ground line helper
  drawGroundLine(scene);
}

function drawGroundLine(scene) {
  if (!ARENA_TUNE_ENABLED) return;

  if (groundLine) groundLine.destroy();

  groundLine = scene.add.line(0, 0, 0, GROUND_Y, WORLD_W, GROUND_Y, 0xff0000, 0.5);
  groundLine.setOrigin(0, 0);
  groundLine.setDepth(999);
  groundLine.setScrollFactor(1);
}

function resetFighterPositions(scene) {
  const s = arenaTuneSettings;
  // Use saved tune positions (or defaults from config)
  const playerStartX = WORLD_W * (s.playerStartX || ARENA_CONFIG.playerSpawnX);
  const enemyStartX = WORLD_W * (s.enemyStartX || ARENA_CONFIG.enemySpawnX);

  GROUND_Y = BASE_H * s.groundY;

  // Stop any running tweens
  scene.tweens.killTweensOf(arenaPlayerSprite);
  scene.tweens.killTweensOf(arenaEnemySprite);

  if (arenaPlayerSprite) {
    arenaPlayerSprite.setPosition(playerStartX, GROUND_Y);
    arenaPlayerSprite.setScale(s.fighterScale);
    if (arenaPlayerSprite.play) arenaPlayerSprite.play('idle', true);
  }
  if (arenaEnemySprite) {
    arenaEnemySprite.setPosition(enemyStartX, GROUND_Y);
    arenaEnemySprite.setScale(-s.fighterScale, s.fighterScale);
    if (arenaEnemySprite.play) arenaEnemySprite.play('idle', true);
  }

  // Reset camera with start zoom (center on player)
  const startZoom = ARENA_CONFIG.camera?.startZoom || 1.3;
  scene.cameras.main.setZoom(startZoom);
  const viewWidth = BASE_W / startZoom;
  const cameraStartX = Math.max(0, Math.min(arenaPlayerSprite.x - viewWidth / 2, WORLD_W - BASE_W));
  scene.cameras.main.scrollX = cameraStartX;

  console.log("[ARENA TUNE] Reset - Player:", playerStartX.toFixed(0), "Enemy:", enemyStartX.toFixed(0));
}

function destroyTuneUI() {
  if (tuneOverlay) {
    tuneOverlay.remove();
    tuneOverlay = null;
  }
  if (groundLine) {
    groundLine.destroy();
    groundLine = null;
  }
}

// ============================================================
//  START ARENA
// ============================================================

function startArena(scene, enemyData) {
  if (arenaActive) return;
  arenaActive = true;
  arenaState = "INTRO";

  BASE_W = scene.scale.width;
  BASE_H = scene.scale.height;
  WORLD_W = BASE_W * ARENA_CONFIG.worldMultiplier;
  WORLD_H = BASE_H;

  console.log("[ARENA] WORLD_W:", WORLD_W, "BASE_W:", BASE_W);

  hideCity();

  // Lazy load arena assets before starting
  lazyLoadArenaAssets(scene, () => {
    showVSScreen(scene, enemyData, () => {
      setupArenaWorld(scene);
      spawnFighters(scene, enemyData);

      // === TUNE MODE: Don't auto-run, wait for SPACE ===
      if (ARENA_TUNE_ENABLED) {
        arenaState = "TUNING";
        console.log("[ARENA] Tune mode - press SPACE to start run");
        if (arenaPlayerSprite.play) arenaPlayerSprite.play('idle', true);
        if (arenaEnemySprite.play) arenaEnemySprite.play('idle', true);
      } else {
        startCinematicIntro(scene);
      }
    });
  });  // end lazyLoadArenaAssets
}

// Lazy load arena assets (background + battle audio)
function lazyLoadArenaAssets(scene, onComplete) {
  let loaded = 0;
  const toLoad = 2;  // arena_village + battle_theme

  const checkDone = () => {
    loaded++;
    if (loaded >= toLoad && onComplete) onComplete();
  };

  // Load arena background
  if (scene.textures.exists('arena_village')) {
    checkDone();
  } else {
    console.log("[ARENA] Lazy loading arena_village...");
    scene.load.image('arena_village', 'assets/backgrounds/arena_village.png');
    scene.load.once('filecomplete-image-arena_village', checkDone);
  }

  // Load battle theme
  if (scene.cache.audio.exists('battle_theme')) {
    checkDone();
  } else {
    console.log("[ARENA] Lazy loading battle_theme...");
    scene.load.audio('battle_theme', 'assets/audio/battle_theme.mp3');
    scene.load.once('filecomplete-audio-battle_theme', checkDone);
  }

  scene.load.start();
}

function hideCity() {
  if (window.cityBg) window.cityBg.setVisible(false);
  if (window.spineHero) window.spineHero.setVisible(false);
  if (window.panelContainer) window.panelContainer.setVisible(false);
  if (window.locationBg) window.locationBg.setVisible(false);
}

function showCity() {
  if (window.cityBg) window.cityBg.setVisible(true);
  if (window.spineHero) window.spineHero.setVisible(true);
  if (window.panelContainer) window.panelContainer.setVisible(true);
}

// ============================================================
//  VS SCREEN
// ============================================================

function showVSScreen(scene, enemyData, onComplete) {
  const w = BASE_W, h = BASE_H;

  const vsOverlay = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9);
  vsOverlay.setDepth(500).setScrollFactor(0).setAlpha(0);

  const playerName = window.profile?.name || "Игрок";
  const playerLevel = window.stats?.level || 1;
  const enemyName = enemyData?.name || "Противник";
  const enemyLevel = enemyData?.level || 1;

  const vsText = scene.add.text(w/2, h/2,
    `${playerName}  Lv.${playerLevel}\n\n VS \n\n${enemyName}  Lv.${enemyLevel}`, {
    fontFamily: 'Arial', fontSize: '32px', color: '#ffffff',
    align: 'center', stroke: '#000000', strokeThickness: 4
  });
  vsText.setOrigin(0.5).setDepth(501).setScrollFactor(0).setAlpha(0);

  scene.tweens.add({
    targets: [vsOverlay, vsText],
    alpha: 1,
    duration: ARENA_CONFIG.fadeTime,
    onComplete: () => {
      scene.time.delayedCall(ARENA_CONFIG.vsScreenDuration, () => {
        scene.tweens.add({
          targets: [vsOverlay, vsText],
          alpha: 0,
          duration: ARENA_CONFIG.fadeTime,
          onComplete: () => {
            vsOverlay.destroy();
            vsText.destroy();
            if (onComplete) onComplete();
          }
        });
      });
    }
  });
}

// ============================================================
//  SETUP ARENA WORLD
// ============================================================

function setupArenaWorld(scene) {
  console.log("[ARENA] Setup world");

  // Camera bounds
  if (ARENA_TUNE_ENABLED) {
    // NO BOUNDS in tune mode - free camera movement
    scene.cameras.main.removeBounds();
    console.log("[ARENA] Tune mode - NO camera bounds, WORLD_W:", WORLD_W);
  } else {
    scene.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    console.log("[ARENA] Camera max scroll:", WORLD_W - BASE_W);
  }

  // IMPORTANT: Reset camera zoom to 1
  scene.cameras.main.setZoom(1);

  // Background with offset, scaled to COVER world
  const bgOffsetX = arenaTuneSettings.bgX || ARENA_CONFIG.bgOffsetX || 0;
  arenaBgSprite = scene.add.image(WORLD_W / 2 + bgOffsetX, BASE_H / 2, 'arena_village');

  // COVER: background must cover BOTH world width AND screen height
  const scaleW = WORLD_W / arenaBgSprite.width;   // fit world width
  const scaleH = BASE_H / arenaBgSprite.height;   // fit screen height
  const bgScale = Math.max(scaleW, scaleH);       // cover = max of both
  arenaBgSprite.setScale(bgScale * (arenaTuneSettings.bgScale || 1.0));
  arenaBgSprite.setOrigin(0.5, 0.5);
  arenaBgSprite.setDepth(10);
  arenaBgSprite.setScrollFactor(1);

  console.log("[ARENA] BG scale:", bgScale.toFixed(2), "WORLD_W:", WORLD_W, "offsetX:", bgOffsetX);

  // Exit button (fixed to screen, high depth)
  arenaExitBtnSprite = scene.add.text(BASE_W / 2, BASE_H - 120, '[ ВЫХОД ]', {
    fontSize: '32px',
    fontFamily: 'Arial',
    color: '#ffffff',
    backgroundColor: '#333333',
    padding: { x: 30, y: 15 }
  });
  arenaExitBtnSprite.setOrigin(0.5);
  arenaExitBtnSprite.setDepth(500);        // Higher than everything
  arenaExitBtnSprite.setScrollFactor(0);   // Fixed to screen!
  arenaExitBtnSprite.setInteractive({ useHandCursor: true });
  arenaExitBtnSprite.on('pointerdown', () => exitArena(scene));
  arenaExitBtnSprite.on('pointerover', () => arenaExitBtnSprite.setStyle({ backgroundColor: '#555555' }));
  arenaExitBtnSprite.on('pointerout', () => arenaExitBtnSprite.setStyle({ backgroundColor: '#333333' }));

  // Initialize tune mode
  if (ARENA_TUNE_ENABLED) {
    createArenaTuneUI(scene);
    applyArenaTuneSettings(scene);
    setupCameraDrag(scene);
    console.log("[ARENA] Tune mode enabled - drag fighters, right-drag to pan camera");
  }
}

// === Camera Pan with Right-Click Drag ===
function setupCameraDrag(scene) {
  let isDraggingCamera = false;
  let dragStartX = 0;
  let cameraStartX = 0;

  // Right-click or middle-click drag = pan camera
  scene.input.on('pointerdown', (pointer) => {
    if (pointer.rightButtonDown() || pointer.middleButtonDown()) {
      isDraggingCamera = true;
      dragStartX = pointer.x;
      cameraStartX = scene.cameras.main.scrollX;
    }
  });

  scene.input.on('pointermove', (pointer) => {
    if (isDraggingCamera) {
      const deltaX = dragStartX - pointer.x;
      // NO LIMITS in tune mode
      scene.cameras.main.scrollX = cameraStartX + deltaX;
    }
  });

  scene.input.on('pointerup', () => {
    isDraggingCamera = false;
  });

  // Disable context menu on canvas
  scene.game.canvas.oncontextmenu = (e) => e.preventDefault();
}

// ============================================================
//  SPAWN FIGHTERS
// ============================================================

function spawnFighters(scene, enemyData) {
  // Use tune settings for positions (or defaults from config)
  const playerStartX = WORLD_W * (arenaTuneSettings.playerStartX || ARENA_CONFIG.playerSpawnX);
  const enemyStartX = WORLD_W * (arenaTuneSettings.enemyStartX || ARENA_CONFIG.enemySpawnX);

  // Use tune settings for ground Y
  GROUND_Y = BASE_H * arenaTuneSettings.groundY;

  console.log("[ARENA] Ground Y:", GROUND_Y.toFixed(0));

  // Player (left side)
  if (scene.spine) {
    try {
      arenaPlayerSprite = scene.add.spine(playerStartX, GROUND_Y, 'hero', 'idle', true);
      arenaPlayerSprite.setScale(arenaTuneSettings.fighterScale);
    } catch(e) {
      arenaPlayerSprite = scene.add.rectangle(playerStartX, GROUND_Y, 60, 120, 0x3366cc);
    }
  } else {
    arenaPlayerSprite = scene.add.rectangle(playerStartX, GROUND_Y, 60, 120, 0x3366cc);
  }
  arenaPlayerSprite.setDepth(100).setScrollFactor(1);

  // Enemy (right side, flipped)
  if (scene.spine) {
    try {
      arenaEnemySprite = scene.add.spine(enemyStartX, GROUND_Y, 'hero', 'idle', true);
      arenaEnemySprite.setScale(-arenaTuneSettings.fighterScale, arenaTuneSettings.fighterScale);
    } catch(e) {
      arenaEnemySprite = scene.add.rectangle(enemyStartX, GROUND_Y, 60, 120, 0xcc3333);
    }
  } else {
    arenaEnemySprite = scene.add.rectangle(enemyStartX, GROUND_Y, 60, 120, 0xcc3333);
  }
  arenaEnemySprite.setDepth(100).setScrollFactor(1);

  // === TUNE MODE: Make fighters draggable ===
  if (ARENA_TUNE_ENABLED) {
    setupFighterDrag(scene);
  }

  // === CINEMATIC CAMERA START ===
  // Start zoomed in on player (center player on screen)
  const startZoom = ARENA_CONFIG.camera?.startZoom || 1.3;
  scene.cameras.main.setZoom(startZoom);

  // Camera focused on player (center in viewport)
  const viewWidth = BASE_W / startZoom;
  const cameraStartX = Math.max(0, Math.min(arenaPlayerSprite.x - viewWidth / 2, WORLD_W - BASE_W));
  scene.cameras.main.scrollX = cameraStartX;

  console.log("[ARENA] Spawned at Player:", playerStartX.toFixed(0), "Enemy:", enemyStartX.toFixed(0));
  console.log("[ARENA] Camera start - X:", cameraStartX.toFixed(0), "Zoom:", startZoom);

  // Draw ground line in tune mode
  if (ARENA_TUNE_ENABLED) {
    drawGroundLine(scene);
  }
}

// === DRAG & DROP for Tune Mode ===
function setupFighterDrag(scene) {
  // Make player draggable
  arenaPlayerSprite.setInteractive({ draggable: true, useHandCursor: true });
  scene.input.setDraggable(arenaPlayerSprite);

  // Make enemy draggable
  arenaEnemySprite.setInteractive({ draggable: true, useHandCursor: true });
  scene.input.setDraggable(arenaEnemySprite);

  // Drag events
  scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
    // Move object (convert from screen to world coords)
    const worldX = dragX + scene.cameras.main.scrollX;
    const worldY = dragY;

    gameObject.x = worldX;
    gameObject.y = worldY;

    // Update tune settings
    if (gameObject === arenaPlayerSprite) {
      arenaTuneSettings.playerStartX = worldX / WORLD_W;
      arenaTuneSettings.groundY = worldY / BASE_H;
    }
    if (gameObject === arenaEnemySprite) {
      arenaTuneSettings.enemyStartX = worldX / WORLD_W;
      arenaTuneSettings.groundY = worldY / BASE_H;
    }

    // Sync both Y positions (same ground)
    GROUND_Y = worldY;
    if (gameObject === arenaPlayerSprite && arenaEnemySprite) {
      arenaEnemySprite.y = worldY;
    }
    if (gameObject === arenaEnemySprite && arenaPlayerSprite) {
      arenaPlayerSprite.y = worldY;
    }

    // Update visuals
    drawGroundLine(scene);
    updateArenaTuneDisplay();
  });

  // Visual feedback on hover (Spine doesn't have setTint)
  scene.input.on('gameobjectover', (pointer, gameObject) => {
    if (gameObject === arenaPlayerSprite || gameObject === arenaEnemySprite) {
      if (typeof gameObject.setTint === 'function') {
        gameObject.setTint(0x44ff44);
      } else {
        // Scale up for Spine
        gameObject.setScale(gameObject.scaleX * 1.05, gameObject.scaleY * 1.05);
      }
    }
  });

  scene.input.on('gameobjectout', (pointer, gameObject) => {
    if (gameObject === arenaPlayerSprite || gameObject === arenaEnemySprite) {
      if (typeof gameObject.clearTint === 'function') {
        gameObject.clearTint();
      } else {
        // Restore scale for Spine
        const s = arenaTuneSettings.fighterScale || ARENA_CONFIG.fighterScale;
        if (gameObject === arenaPlayerSprite) {
          gameObject.setScale(s, s);
        } else {
          gameObject.setScale(-s, s);
        }
      }
    }
  });

  console.log("[ARENA TUNE] Fighters are now draggable");
}

// ============================================================
//  CINEMATIC INTRO SEQUENCE
// ============================================================

function startCinematicIntro(scene) {
  const cfg = ARENA_CONFIG.cinematic;
  const cam = ARENA_CONFIG.camera;

  console.log("[ARENA] Starting cinematic intro...");

  // Fighters in idle during intro
  if (arenaPlayerSprite.play) arenaPlayerSprite.play('idle', true);
  if (arenaEnemySprite.play) arenaEnemySprite.play('idle', true);

  // === PHASE 1: INTRO_PLAYER ===
  // Camera zoomed on player
  arenaState = "INTRO_PLAYER";
  cinematicStartTime = Date.now();

  const startZoom = cam.startZoom || 1.4;
  scene.cameras.main.setZoom(startZoom);

  // Center camera on player
  const viewWidth = BASE_W / startZoom;
  const playerCamX = Math.max(0, Math.min(arenaPlayerSprite.x - viewWidth / 2, WORLD_W - viewWidth));
  scene.cameras.main.scrollX = playerCamX;

  cinematicTarget = { x: playerCamX, zoom: startZoom };

  console.log("[ARENA] INTRO_PLAYER - zoom:", startZoom, "camX:", playerCamX.toFixed(0));

  // After delay, transition to INTRO_ENEMY
  scene.time.delayedCall(cfg.introPlayerDuration, () => {
    startIntroEnemy(scene);
  });
}

function startIntroEnemy(scene) {
  const cfg = ARENA_CONFIG.cinematic;
  const cam = ARENA_CONFIG.camera;

  arenaState = "INTRO_ENEMY";
  cinematicStartTime = Date.now();

  console.log("[ARENA] INTRO_ENEMY - panning to enemy...");

  // Target: center on enemy (camera will lerp there in updateArena)
  const startZoom = cam.startZoom || 1.4;
  const viewWidth = BASE_W / startZoom;
  const enemyCamX = Math.max(0, Math.min(arenaEnemySprite.x - viewWidth / 2, WORLD_W - viewWidth));

  cinematicTarget = { x: enemyCamX, zoom: startZoom };

  // After pan + hold, transition to READY
  scene.time.delayedCall(cfg.panToEnemyDuration + cfg.introEnemyDuration, () => {
    startReadyPhase(scene);
  });
}

function startReadyPhase(scene) {
  const cfg = ARENA_CONFIG.cinematic;
  const cam = ARENA_CONFIG.camera;

  arenaState = "READY";
  cinematicStartTime = Date.now();

  console.log("[ARENA] READY - zooming out...");

  // Target: zoom out to show both fighters, center between them
  const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;
  const endZoom = cam.endZoom || 1.0;
  const viewWidth = BASE_W / endZoom;
  const midCamX = Math.max(0, Math.min(midX - viewWidth / 2, WORLD_W - viewWidth));

  cinematicTarget = { x: midCamX, zoom: endZoom };

  // After zoom out, start run
  scene.time.delayedCall(cfg.readyDuration + cfg.zoomOutDuration, () => {
    startRunIn(scene);
  });
}

// ============================================================
//  RUN-IN SEQUENCE
// ============================================================

function startRunIn(scene) {
  arenaState = "RUN_IN";
  console.log("[ARENA] State: RUN_IN");

  const targetPlayerX = WORLD_W / 2 - ARENA_CONFIG.fightOffset;
  const targetEnemyX = WORLD_W / 2 + ARENA_CONFIG.fightOffset;

  // Start run animations
  if (arenaPlayerSprite.play) arenaPlayerSprite.play('run', true);
  if (arenaEnemySprite.play) arenaEnemySprite.play('run', true);

  // Move fighters with smooth easing
  scene.tweens.add({
    targets: arenaPlayerSprite,
    x: targetPlayerX,
    duration: ARENA_CONFIG.runSpeed,
    ease: 'Sine.easeInOut'
  });

  scene.tweens.add({
    targets: arenaEnemySprite,
    x: targetEnemyX,
    duration: ARENA_CONFIG.runSpeed,
    ease: 'Sine.easeInOut'
  });
}

// ============================================================
//  UPDATE (Camera Follow Midpoint with LERP)
// ============================================================

function updateArena(scene) {
  if (!arenaActive) return;

  const cam = scene.cameras.main;
  const lerpSpeed = ARENA_CONFIG.camera?.lerpSpeed || 0.06;
  const zoomLerpSpeed = ARENA_CONFIG.camera?.zoomLerpSpeed || 0.03;

  // === CINEMATIC INTRO STATES ===
  // Smooth camera pan during INTRO_ENEMY and READY
  if (arenaState === "INTRO_ENEMY" || arenaState === "READY") {
    // Lerp camera position
    const currentX = cam.scrollX;
    const targetX = cinematicTarget.x;
    const newX = currentX + (targetX - currentX) * lerpSpeed;
    cam.scrollX = newX;

    // Lerp zoom
    const currentZoom = cam.zoom;
    const targetZoom = cinematicTarget.zoom;
    const newZoom = currentZoom + (targetZoom - currentZoom) * zoomLerpSpeed;
    cam.setZoom(newZoom);
  }

  // === RUN_IN STATE ===
  if (arenaState === "RUN_IN") {
    // Calculate midpoint between fighters
    const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;

    // Current zoom
    const currentZoom = cam.zoom;
    const endZoom = ARENA_CONFIG.camera?.endZoom || 1.0;

    // Smooth zoom out (if not already at end zoom)
    const newZoom = currentZoom + (endZoom - currentZoom) * zoomLerpSpeed;
    cam.setZoom(newZoom);

    // Target: center camera on midpoint (adjust for current zoom)
    const viewWidth = BASE_W / newZoom;
    const targetScrollX = midX - viewWidth / 2;

    // Clamp to world bounds (adjusted for zoom)
    const maxScrollX = WORLD_W - viewWidth;
    const clampedX = Math.max(0, Math.min(targetScrollX, maxScrollX));

    // Smooth lerp (cinematic feel)
    const currentX = cam.scrollX;
    const newX = currentX + (clampedX - currentX) * lerpSpeed;

    cam.scrollX = newX;

    // Check engage distance
    const distance = Math.abs(arenaEnemySprite.x - arenaPlayerSprite.x);
    if (distance <= ARENA_CONFIG.engageDistance) {
      onEngageDistance(scene);
    }
  }
}

// ============================================================
//  ENGAGE
// ============================================================

function onEngageDistance(scene) {
  if (arenaState !== "RUN_IN") return;
  arenaState = "ENGAGE";
  console.log("[ARENA] State: ENGAGE");

  // Stop fighter tweens
  scene.tweens.killTweensOf(arenaPlayerSprite);
  scene.tweens.killTweensOf(arenaEnemySprite);

  // Switch to idle
  if (arenaPlayerSprite.play) arenaPlayerSprite.play('idle', true);
  if (arenaEnemySprite.play) arenaEnemySprite.play('idle', true);

  // === LOCK CAMERA AND ZOOM ===
  const endZoom = ARENA_CONFIG.camera?.endZoom || 1.0;
  scene.cameras.main.setZoom(endZoom);

  const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;
  const finalScrollX = Math.max(0, Math.min(midX - BASE_W / 2, WORLD_W - BASE_W));
  scene.cameras.main.scrollX = finalScrollX;
  console.log("[ARENA] Camera locked - X:", finalScrollX.toFixed(0), "Zoom:", endZoom);

  // Pause, then fight
  scene.time.delayedCall(ARENA_CONFIG.engagePause, () => {
    arenaState = "FIGHT";
    console.log("[ARENA] State: FIGHT");
  });
}

// ============================================================
//  EXIT ARENA
// ============================================================

function exitArena(scene) {
  if (!arenaActive) return;
  console.log("[ARENA] Exit");

  // Destroy tune UI
  destroyTuneUI();

  if (arenaBgSprite) { arenaBgSprite.destroy(); arenaBgSprite = null; }
  if (arenaPlayerSprite) { arenaPlayerSprite.destroy(); arenaPlayerSprite = null; }
  if (arenaEnemySprite) { arenaEnemySprite.destroy(); arenaEnemySprite = null; }
  if (arenaExitBtnSprite) { arenaExitBtnSprite.destroy(); arenaExitBtnSprite = null; }

  scene.cameras.main.setBounds(0, 0, BASE_W, BASE_H);
  scene.cameras.main.scrollX = 0;
  scene.cameras.main.setZoom(1);

  showCity();
  arenaState = "NONE";
  arenaActive = false;
}

// ============================================================
//  PUBLIC API
// ============================================================

window.startArena = startArena;
window.exitArena = exitArena;
window.updateArena = updateArena;

console.log("[ArenaScene] Module loaded");

})();
