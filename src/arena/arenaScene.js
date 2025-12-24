"use strict";

// ============================================================
//  ARENA SCENE — 3-Screen Wide World (IIFE to avoid conflicts)
//  Studio Quality: Cinematic camera, proper ground positioning
//  With Tune Mode for visual adjustments
// ============================================================

(function() {

let arenaActive = false;
let arenaState = "NONE"; // NONE, INTRO, TUNING, INTRO_PLAYER, INTRO_ENEMY, READY, RUN_IN, ENGAGE, COUNTDOWN, FIGHT, RESULT

let arenaBgLeft = null;
let arenaBgRight = null;
let arenaPlayerSprite = null;
let arenaEnemySprite = null;

// Attack state tracking
let playerAttacking = false;
let enemyAttacking = false;

// Current match data for history
let currentMatchData = null;
let matchStartTime = 0;

const ARENA_CONFIG = {
  worldMultiplier: 5.25,

  // FINAL HARDCODED VALUES
  groundY: 0.88,             // 88%
  fighterScale: 1.38,
  playerSpawnX: 0.26,        // 26%
  enemySpawnX: 0.73,         // 73%
  bgOffsetX: 0,
  bgOffsetY: 5,
  bgScale: 0.96,

  // Combat
  fightOffset: 180,
  engageDistance: 420,  // Must be > fightOffset * 2 to trigger before tweens end
  runSpeed: 2500,

  // Transitions
  vsScreenDuration: 1500,
  fadeTime: 300,
  engagePause: 300,

  camera: {
    lerpSpeed: 0.06,
    lockOnEngage: true,
    startZoom: 1.2,      // Intro - close up on player
    endZoom: 0.86,       // Battle - no black edges (0.8 showed bottom bar)
    zoomLerpSpeed: 0.02  // Slower for smooth transition
  },
  cinematic: {
    introArenaDuration: 1200,
    zoomToPlayerDuration: 400,
    introPlayerDuration: 1000,
    panToEnemyDuration: 600,
    introEnemyDuration: 800,
    readyDuration: 300,
    zoomOutDuration: 500
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

// Version check - clear old settings on version change
const ARENA_TUNE_VERSION = 'v8';
const savedVersion = localStorage.getItem('ARENA_TUNE_VERSION');
if (savedVersion !== ARENA_TUNE_VERSION) {
  localStorage.removeItem('ARENA_TUNE');
  localStorage.setItem('ARENA_TUNE_VERSION', ARENA_TUNE_VERSION);
  console.log("[ARENA] Cleared old settings (version " + savedVersion + " → " + ARENA_TUNE_VERSION + ")");
}

// Tunable values (saved to localStorage)
function getArenaTuneSettings() {
  const defaults = {
    bgX: 0,
    bgY: 5,
    bgScale: 0.96,
    groundY: 0.88,         // 88%
    fighterScale: 1.38,
    fightOffset: 180,
    cameraStartX: 0,
    playerStartX: 0.26,    // 26%
    enemyStartX: 0.73,     // 73%
    cameraStartZoom: 1.2,  // Close up on player
    cameraEndZoom: 0.86,   // Battle view (no black edges)
  };

  if (!ARENA_TUNE_ENABLED) return defaults;

  try {
    const saved = localStorage.getItem('ARENA_TUNE');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log("[ARENA] Loaded settings:", parsed);
      return { ...defaults, ...parsed };
    }
  } catch(e) {
    console.warn("[ARENA] Failed to load settings");
  }
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

  // Apply BG position/scale (2-part background)
  if (arenaBgLeft && arenaBgRight) {
    const bgX = s.bgX || 0;
    const bgY = s.bgY || 0;
    const bgScale = s.bgScale || 1.0;

    arenaBgLeft.setPosition(bgX, bgY);
    arenaBgLeft.setScale(bgScale);

    arenaBgRight.setPosition(bgX + 2048 * bgScale - 1, bgY);
    arenaBgRight.setScale(bgScale);
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

  groundLine = scene.add.line(0, 0, 0, GROUND_Y, WORLD_W * 2, GROUND_Y, 0xff0000, 0.5);
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

  // Reset camera (zoom 1.0, center on player)
  scene.cameras.main.setZoom(1.0);
  scene.cameras.main.scrollY = 0;
  const cameraStartX = Math.max(0, Math.min(arenaPlayerSprite.x - BASE_W / 2, WORLD_W - BASE_W));
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

// Lazy load arena assets (2-part background + battle audio)
function lazyLoadArenaAssets(scene, onComplete) {
  let loaded = 0;
  const toLoad = 3;  // arena_village_left + arena_village_right + battle_theme

  const checkDone = () => {
    loaded++;
    if (loaded >= toLoad && onComplete) onComplete();
  };

  // Load arena background LEFT part
  if (scene.textures.exists('arena_village_left')) {
    checkDone();
  } else {
    console.log("[ARENA] Lazy loading arena_village_left...");
    scene.load.image('arena_village_left', 'assets/backgrounds/arena_village_left.png');
    scene.load.once('filecomplete-image-arena_village_left', checkDone);
  }

  // Load arena background RIGHT part
  if (scene.textures.exists('arena_village_right')) {
    checkDone();
  } else {
    console.log("[ARENA] Lazy loading arena_village_right...");
    scene.load.image('arena_village_right', 'assets/backgrounds/arena_village_right.png');
    scene.load.once('filecomplete-image-arena_village_right', checkDone);
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
//  CLAMP CAMERA TO BG (prevents black edges with zoom)
// ============================================================

function clampCameraToBG(scene) {
  const cam = scene.cameras.main;
  const bgScale = arenaTuneSettings.bgScale || 1.0;
  const bgX = arenaTuneSettings.bgX || 0;
  const bgY = arenaTuneSettings.bgY || 0;
  const bgWidth = 4096 * bgScale;
  const bgHeight = 2048 * bgScale;
  const viewWidth = BASE_W / cam.zoom;
  const viewHeight = BASE_H / cam.zoom;

  // Clamp X
  const minScrollX = bgX;
  const maxScrollX = Math.max(bgX, bgX + bgWidth - viewWidth);
  cam.scrollX = Math.max(minScrollX, Math.min(cam.scrollX, maxScrollX));

  // Clamp Y
  const minScrollY = bgY;
  const maxScrollY = Math.max(bgY, bgY + bgHeight - viewHeight);
  cam.scrollY = Math.max(minScrollY, Math.min(cam.scrollY, maxScrollY));
}

// ============================================================
//  SETUP ARENA WORLD
// ============================================================

function setupArenaWorld(scene) {
  console.log("[ARENA] Setup world - native BG size approach");

  // Camera bounds = world size (no zoom, no extended height)
  if (ARENA_TUNE_ENABLED) {
    scene.cameras.main.removeBounds();
    console.log("[ARENA] Tune mode - NO camera bounds");
  } else {
    scene.cameras.main.setBounds(0, 0, WORLD_W, BASE_H);
    console.log("[ARENA] Camera bounds:", WORLD_W, "x", BASE_H);
  }

  // Reset camera with standard zoom
  scene.cameras.main.setZoom(0.8);
  scene.cameras.main.scrollX = 0;
  scene.cameras.main.scrollY = 0;

  // Debug: show actual loaded texture sizes
  const bgLeftTex = scene.textures.get('arena_village_left');
  const bgRightTex = scene.textures.get('arena_village_right');
  const bgLeftSrc = bgLeftTex?.getSourceImage();
  const bgRightSrc = bgRightTex?.getSourceImage();
  console.log("[ARENA] BG LEFT texture:", bgLeftSrc?.width, "x", bgLeftSrc?.height);
  console.log("[ARENA] BG RIGHT texture:", bgRightSrc?.width, "x", bgRightSrc?.height);

  // Tune settings
  const bgX = arenaTuneSettings.bgX || 0;
  const bgY = arenaTuneSettings.bgY || 0;
  const bgScale = arenaTuneSettings.bgScale || 1.0;

  // LEFT part (0 to 2048)
  arenaBgLeft = scene.add.image(bgX, bgY, 'arena_village_left');
  arenaBgLeft.setOrigin(0, 0);
  arenaBgLeft.setDepth(-100);
  arenaBgLeft.setScrollFactor(1);
  arenaBgLeft.setScale(bgScale);

  // RIGHT part - overlap by 1px to hide seam
  arenaBgRight = scene.add.image(bgX + 2048 * bgScale - 1, bgY, 'arena_village_right');
  arenaBgRight.setOrigin(0, 0);
  arenaBgRight.setDepth(-100);
  arenaBgRight.setScrollFactor(1);
  arenaBgRight.setScale(bgScale);

  console.log("[ARENA] BG LEFT pos:", arenaBgLeft.x, ",", arenaBgLeft.y, "size:", arenaBgLeft.width, "x", arenaBgLeft.height);
  console.log("[ARENA] BG RIGHT pos:", arenaBgRight.x, ",", arenaBgRight.y, "size:", arenaBgRight.width, "x", arenaBgRight.height);
  console.log("[ARENA] WORLD_W:", WORLD_W, "BASE_H:", BASE_H);

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
//  WEAPON SKIN ACTIVATION
// ============================================================

function activateWeaponSkin(sprite, name) {
  if (!sprite || !sprite.skeleton) return;

  const skeleton = sprite.skeleton;
  const skeletonData = skeleton.data;

  // Log all skins
  const skinNames = skeletonData.skins.map(s => s.name);
  console.log("[ARENA]", name, "skins:", skinNames);

  // Try weapon/sword skin first, then fallback
  const tryNames = ["weapon/sword", "sword", "default"];

  for (const skinName of tryNames) {
    try {
      skeleton.setSkinByName(skinName);
      skeleton.setSlotsToSetupPose();
      console.log("[ARENA]", name, "skin set to:", skinName);
      return;
    } catch(e) {
      // Try next
    }
  }

  console.warn("[ARENA]", name, "no valid skin found!");
}

// ============================================================
//  SPAWN FIGHTERS
// ============================================================

function spawnFighters(scene, enemyData) {
  // Fighter positions (percentage of world width)
  const playerStartX = WORLD_W * (arenaTuneSettings.playerStartX || ARENA_CONFIG.playerSpawnX);
  const enemyStartX = WORLD_W * (arenaTuneSettings.enemyStartX || ARENA_CONFIG.enemySpawnX);

  // Ground Y (percentage of screen height)
  GROUND_Y = BASE_H * (arenaTuneSettings.groundY || ARENA_CONFIG.groundY);

  console.log("[ARENA] Spawning fighters at groundY:", GROUND_Y.toFixed(0), "px (", (arenaTuneSettings.groundY * 100).toFixed(0), "%)");

  // Player (left side)
  if (scene.spine) {
    try {
      arenaPlayerSprite = scene.add.spine(playerStartX, GROUND_Y, 'hero', 'idle', true);
      arenaPlayerSprite.setScale(arenaTuneSettings.fighterScale);

      // Activate weapon via skin
      activateWeaponSkin(arenaPlayerSprite, "Player");

    } catch(e) {
      console.warn("[ARENA] Player spine error:", e);
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

      // Activate weapon via skin
      activateWeaponSkin(arenaEnemySprite, "Enemy");

    } catch(e) {
      console.warn("[ARENA] Enemy spine error:", e);
      arenaEnemySprite = scene.add.rectangle(enemyStartX, GROUND_Y, 60, 120, 0xcc3333);
    }
  } else {
    arenaEnemySprite = scene.add.rectangle(enemyStartX, GROUND_Y, 60, 120, 0xcc3333);
  }
  arenaEnemySprite.setDepth(100).setScrollFactor(1);

  // Tune mode: make fighters draggable
  if (ARENA_TUNE_ENABLED) {
    setupFighterDrag(scene);
  }

  // Camera: start zoomed in on player (1.2), will zoom out to 0.8 during RUN_IN
  const startZoom = ARENA_CONFIG.camera.startZoom;
  scene.cameras.main.setZoom(startZoom);
  scene.cameras.main.scrollY = 0;

  // At zoom 1.2, visible width = BASE_W / 1.2
  // Center on player, clamp to prevent black edges
  const viewWidth = BASE_W / startZoom;
  const playerCamX = playerStartX - viewWidth / 2;

  // Clamp to BG bounds
  const bgScale = arenaTuneSettings.bgScale || 1.0;
  const bgWidth = 4096 * bgScale;
  const maxScrollX = Math.max(0, bgWidth - viewWidth);
  const clampedCamX = Math.max(0, Math.min(playerCamX, maxScrollX));

  scene.cameras.main.scrollX = clampedCamX;

  console.log("[ARENA] Player:", playerStartX.toFixed(0), "Enemy:", enemyStartX.toFixed(0));
  console.log("[ARENA] Camera: zoom", startZoom, "scrollX:", clampedCamX.toFixed(0), "(viewWidth:", viewWidth.toFixed(0), ")");

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

  // Drag events - NO CLAMPING (allow any position)
  scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
    // Convert to world coordinates
    const worldX = dragX + scene.cameras.main.scrollX;
    const worldY = dragY;

    gameObject.x = worldX;
    gameObject.y = worldY;

    // Save percentage (no clamping)
    if (gameObject === arenaPlayerSprite) {
      arenaTuneSettings.playerStartX = worldX / WORLD_W;
      console.log("[TUNE] Player X:", (arenaTuneSettings.playerStartX * 100).toFixed(0) + "%");
    }

    if (gameObject === arenaEnemySprite) {
      arenaTuneSettings.enemyStartX = worldX / WORLD_W;
      console.log("[TUNE] Enemy X:", (arenaTuneSettings.enemyStartX * 100).toFixed(0) + "%");
    }

    // Ground Y (no clamping)
    arenaTuneSettings.groundY = worldY / BASE_H;

    // Sync both Y positions (same ground)
    GROUND_Y = worldY;
    if (arenaPlayerSprite) arenaPlayerSprite.y = worldY;
    if (arenaEnemySprite) arenaEnemySprite.y = worldY;

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
  const startZoom = ARENA_CONFIG.camera.startZoom;

  console.log("[ARENA] Starting cinematic intro (zoom:", startZoom, "→", ARENA_CONFIG.camera.endZoom, ")");

  // Fighters in idle during intro
  if (arenaPlayerSprite.play) arenaPlayerSprite.play('idle', true);
  if (arenaEnemySprite.play) arenaEnemySprite.play('idle', true);

  // Camera: start zoom 1.2 (close up on player), no Y scrolling
  scene.cameras.main.setZoom(startZoom);
  scene.cameras.main.scrollY = 0;

  // === PHASE 1: INTRO_PLAYER ===
  arenaState = "INTRO_PLAYER";
  cinematicStartTime = Date.now();

  // Center camera on player at start zoom (viewWidth = BASE_W / zoom)
  const viewWidth = BASE_W / startZoom;
  const playerCamX = arenaPlayerSprite.x - viewWidth / 2;

  // Clamp to BG bounds
  const bgScale = arenaTuneSettings.bgScale || 1.0;
  const bgWidth = 4096 * bgScale;
  const maxScrollX = Math.max(0, bgWidth - viewWidth);
  const clampedCamX = Math.max(0, Math.min(playerCamX, maxScrollX));

  scene.cameras.main.scrollX = clampedCamX;
  cinematicTarget = { x: clampedCamX };

  console.log("[ARENA] INTRO_PLAYER - zoom:", startZoom, "camX:", clampedCamX.toFixed(0));

  // After hold, transition to enemy
  scene.time.delayedCall(cfg.introPlayerDuration, () => {
    startIntroEnemy(scene);
  });
}

function startIntroEnemy(scene) {
  const cfg = ARENA_CONFIG.cinematic;
  const startZoom = ARENA_CONFIG.camera.startZoom;

  arenaState = "INTRO_ENEMY";
  cinematicStartTime = Date.now();

  // Target: center on enemy (camera will lerp there in updateArena)
  // Calculate at current zoom level
  const viewWidth = BASE_W / startZoom;
  const enemyCamX = arenaEnemySprite.x - viewWidth / 2;

  // Clamp to BG bounds
  const bgScale = arenaTuneSettings.bgScale || 1.0;
  const bgWidth = 4096 * bgScale;
  const maxScrollX = Math.max(0, bgWidth - viewWidth);
  const clampedCamX = Math.max(0, Math.min(enemyCamX, maxScrollX));

  cinematicTarget = { x: clampedCamX };

  console.log("[ARENA] INTRO_ENEMY - panning to camX:", clampedCamX.toFixed(0));

  // After pan + hold, transition to READY
  scene.time.delayedCall(cfg.panToEnemyDuration + cfg.introEnemyDuration, () => {
    startReadyPhase(scene);
  });
}

function startReadyPhase(scene) {
  const cfg = ARENA_CONFIG.cinematic;
  const startZoom = ARENA_CONFIG.camera.startZoom;

  arenaState = "READY";
  cinematicStartTime = Date.now();

  // Target: center between both fighters at current zoom
  const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;
  const viewWidth = BASE_W / startZoom;
  const midCamX = midX - viewWidth / 2;

  // Clamp to BG bounds
  const bgScale = arenaTuneSettings.bgScale || 1.0;
  const bgWidth = 4096 * bgScale;
  const maxScrollX = Math.max(0, bgWidth - viewWidth);
  const clampedCamX = Math.max(0, Math.min(midCamX, maxScrollX));

  cinematicTarget = { x: clampedCamX };

  console.log("[ARENA] READY - panning to center, camX:", clampedCamX.toFixed(0));

  // After brief pause, start run
  scene.time.delayedCall(cfg.readyDuration, () => {
    startRunIn(scene);
  });
}

// ============================================================
//  RUN-IN SEQUENCE
// ============================================================

let runInTimeout = null;

function startRunIn(scene) {
  arenaState = "RUN_IN";
  console.log("[ARENA] State: RUN_IN");

  const targetPlayerX = WORLD_W / 2 - ARENA_CONFIG.fightOffset;
  const targetEnemyX = WORLD_W / 2 + ARENA_CONFIG.fightOffset;
  const targetDistance = ARENA_CONFIG.fightOffset * 2;

  console.log("[ARENA] RUN_IN targets - Player:", targetPlayerX.toFixed(0), "Enemy:", targetEnemyX.toFixed(0), "Final distance:", targetDistance);

  // Start run animations
  if (arenaPlayerSprite.play) arenaPlayerSprite.play('run', true);
  if (arenaEnemySprite.play) arenaEnemySprite.play('run', true);

  // Move fighters with smooth easing
  scene.tweens.add({
    targets: arenaPlayerSprite,
    x: targetPlayerX,
    duration: ARENA_CONFIG.runSpeed,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      console.log("[ARENA] Player tween complete, x:", arenaPlayerSprite?.x?.toFixed(0));
      // If still in RUN_IN after tween completes, force engage
      if (arenaState === "RUN_IN") {
        console.log("[ARENA] Forcing ENGAGE after player tween complete");
        onEngageDistance(scene);
      }
    }
  });

  scene.tweens.add({
    targets: arenaEnemySprite,
    x: targetEnemyX,
    duration: ARENA_CONFIG.runSpeed,
    ease: 'Sine.easeInOut'
  });

  // Safety timeout - force ENGAGE if stuck
  if (runInTimeout) {
    runInTimeout.destroy();
  }
  runInTimeout = scene.time.delayedCall(6000, () => {
    if (arenaState === "RUN_IN") {
      console.warn("[ARENA] RUN_IN timeout! Forcing ENGAGE");
      onEngageDistance(scene);
    }
  });
}

// ============================================================
//  UPDATE (Camera Follow Midpoint with LERP)
// ============================================================

function updateArena(scene) {
  if (!arenaActive) return;

  const cam = scene.cameras.main;
  const lerpSpeed = ARENA_CONFIG.camera?.lerpSpeed || 0.06;

  // === CINEMATIC INTRO STATES ===
  // Smooth horizontal camera pan during intro phases
  if (arenaState === "INTRO_PLAYER" || arenaState === "INTRO_ENEMY" || arenaState === "READY") {
    const currentX = cam.scrollX;
    const targetX = cinematicTarget.x;
    const newX = currentX + (targetX - currentX) * lerpSpeed;
    cam.scrollX = newX;
    // No Y scrolling - stays at 0
  }

  // === RUN_IN STATE ===
  if (arenaState === "RUN_IN") {
    // Follow midpoint between fighters (horizontal only)
    const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;

    // Smooth zoom out from startZoom (1.2) to endZoom (0.8)
    const startZoom = ARENA_CONFIG.camera.startZoom;
    const endZoom = ARENA_CONFIG.camera.endZoom;
    const zoomLerpSpeed = ARENA_CONFIG.camera.zoomLerpSpeed;

    const currentZoom = cam.zoom;
    const newZoom = currentZoom + (endZoom - currentZoom) * zoomLerpSpeed;
    cam.setZoom(newZoom);

    // Calculate view width at current zoom for proper scroll calculation
    const viewWidth = BASE_W / newZoom;
    const targetScrollX = midX - viewWidth / 2;

    // Clamp to BG bounds
    const bgScale = arenaTuneSettings.bgScale || 1.0;
    const bgWidth = 4096 * bgScale;
    const maxScrollX = Math.max(0, bgWidth - viewWidth);
    const clampedScrollX = Math.max(0, Math.min(targetScrollX, maxScrollX));

    // Smooth lerp for X position
    const currentX = cam.scrollX;
    const newX = currentX + (clampedScrollX - currentX) * lerpSpeed;
    cam.scrollX = newX;

    // Check engage distance
    const distance = Math.abs(arenaEnemySprite.x - arenaPlayerSprite.x);
    const targetDistance = ARENA_CONFIG.fightOffset * 2;

    // Trigger engage when close enough OR when reaching target
    if (distance <= ARENA_CONFIG.engageDistance || distance <= targetDistance + 50) {
      console.log("[ARENA] Engage triggered - distance:", distance.toFixed(0), "engageDistance:", ARENA_CONFIG.engageDistance, "target:", targetDistance);
      onEngageDistance(scene);
    }
  }

  // === FIGHT STATE ===
  if (arenaState === "FIGHT") {
    const delta = scene.game.loop.delta;
    const events = arenaCombat.update(delta);

    // Process events
    events.forEach(event => {
      if (event.type === "attack") {
        if (event.attacker === "player") {
          // Player attacks enemy
          playAttackAnimation(arenaPlayerSprite, true, scene);
          playHitEffects(scene, arenaEnemySprite, event.isCrit, false);
          spawnArenaDamageText(scene, arenaEnemySprite, event.damage, event.isCrit);
        } else {
          // Enemy attacks player
          playAttackAnimation(arenaEnemySprite, false, scene);
          playHitEffects(scene, arenaPlayerSprite, event.isCrit, true);
          spawnArenaDamageText(scene, arenaPlayerSprite, event.damage, event.isCrit);
        }

        // Update HP bars
        updateArenaUI(arenaCombat.getState());
      }

      if (event.type === "end") {
        handleArenaEnd(scene, event.result);
      }
    });

  }

  // Clamp camera to prevent black edges
  clampCameraToBG(scene);
}

// ============================================================
//  ENGAGE
// ============================================================

function onEngageDistance(scene) {
  if (arenaState !== "RUN_IN") return;
  arenaState = "ENGAGE";
  console.log("[ARENA] State: ENGAGE");

  // Clear safety timeout
  if (runInTimeout) {
    runInTimeout.destroy();
    runInTimeout = null;
  }

  // Stop fighter tweens
  scene.tweens.killTweensOf(arenaPlayerSprite);
  scene.tweens.killTweensOf(arenaEnemySprite);

  // Switch to idle
  if (arenaPlayerSprite.play) arenaPlayerSprite.play('idle', true);
  if (arenaEnemySprite.play) arenaEnemySprite.play('idle', true);

  // Lock camera centered on fighters (no zoom change)
  const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;
  const finalScrollX = Math.max(0, Math.min(midX - BASE_W / 2, WORLD_W - BASE_W));

  scene.cameras.main.scrollX = finalScrollX;
  scene.cameras.main.scrollY = 0;
  console.log("[ARENA] Camera locked - X:", finalScrollX.toFixed(0));

  // Pause, then countdown
  scene.time.delayedCall(ARENA_CONFIG.engagePause, () => {
    startFightCountdown(scene);
  });
}

function startFightCountdown(scene) {
  arenaState = "COUNTDOWN";
  console.log("[ARENA] State: COUNTDOWN");

  const w = scene.scale.width;
  const h = scene.scale.height;

  let count = 3;
  const countText = scene.add.text(w / 2, h / 2, "3", {
    fontSize: "120px",
    color: "#ffffff",
    fontFamily: "Georgia",
    stroke: "#000000",
    strokeThickness: 8
  }).setOrigin(0.5).setDepth(350).setScrollFactor(0);

  const countEvent = scene.time.addEvent({
    delay: 800,
    repeat: 3,
    callback: () => {
      count--;
      if (count > 0) {
        countText.setText(count.toString());
        countText.setScale(1.2);
        scene.tweens.add({ targets: countText, scale: 1, duration: 200 });
      } else if (count === 0) {
        countText.setText("FIGHT!");
        countText.setColor("#ff4444");
        countText.setScale(1.5);
        scene.cameras.main.shake(300, 0.015);
      } else {
        countText.destroy();
        startArenaFight(scene);
      }
    }
  });
}

function startArenaFight(scene) {
  arenaState = "FIGHT";
  console.log("[ARENA] State: FIGHT");

  // Record start time
  matchStartTime = Date.now();

  // Initialize combat with player and enemy stats
  const playerStats = {
    maxHealth: stats.derived?.maxHealth || 100,
    physicalPower: stats.derived?.physicalPower || 10,
    physicalDefense: stats.derived?.physicalDefense || 40,
    attackSpeed: stats.derived?.attackSpeed || 300,
    critChance: stats.derived?.critChance || 0.05,
    critMultiplier: stats.derived?.critMultiplier || 2.0
  };

  // Generate enemy stats based on player level
  const enemyLevel = (stats.progression?.level || 1) + Math.floor(Math.random() * 3) - 1;
  const enemyStats = {
    maxHealth: Math.floor(playerStats.maxHealth * (0.8 + Math.random() * 0.4)),
    physicalPower: Math.floor(playerStats.physicalPower * (0.8 + Math.random() * 0.4)),
    physicalDefense: Math.floor(playerStats.physicalDefense * (0.8 + Math.random() * 0.4)),
    attackSpeed: Math.floor(playerStats.attackSpeed * (0.9 + Math.random() * 0.2)),
    critChance: 0.05 + Math.random() * 0.05,
    critMultiplier: 2.0
  };

  // Generate enemy name/rating for match history
  const enemyNames = ["Knight", "Warrior", "Paladin", "Gladiator", "Berserker", "Champion", "Duelist", "Fighter"];
  const randomName = enemyNames[Math.floor(Math.random() * enemyNames.length)] + Math.floor(Math.random() * 1000);
  const enemyRating = arenaData.rating + Math.floor(Math.random() * 200) - 100;

  currentMatchData = {
    enemyName: randomName,
    enemyRating: enemyRating,
    myRatingBefore: arenaData.rating
  };

  arenaCombat.init(playerStats, enemyStats);

  // Set animation speed based on attack speed
  setAnimationSpeed(arenaPlayerSprite, playerStats.attackSpeed);
  setAnimationSpeed(arenaEnemySprite, enemyStats.attackSpeed);

  // Create arena UI for the fight
  createArenaUI(scene);

  console.log("[ARENA] Fight started - Player speed:", playerStats.attackSpeed, "Enemy speed:", enemyStats.attackSpeed);
}

// ============================================================
//  ARENA COMBAT HELPERS (Animations, Effects, End Handler)
// ============================================================

// ============================================================
//  DEATH ANIMATION (fall → crouch)
// ============================================================

function playDeathAnimation(scene, sprite) {
  if (!sprite || !sprite.play) return;

  // Fall first (hit reaction)
  sprite.play("fall", false);

  // Then crouch (stay down)
  scene.time.delayedCall(400, () => {
    if (sprite && sprite.play) {
      sprite.play("crouch", true);  // Loop crouch = stay down
    }
  });
}

// ============================================================
//  ATTACK ANIMATION (with state tracking)
// ============================================================

function playAttackAnimation(sprite, isPlayer, scene) {
  if (!sprite || !sprite.play) return;

  if (isPlayer) playerAttacking = true;
  else enemyAttacking = true;

  sprite.play("attack", false);

  // Return to idle after attack animation
  scene.time.delayedCall(500, () => {
    if (isPlayer) playerAttacking = false;
    else enemyAttacking = false;

    if (sprite && sprite.play && arenaState === "FIGHT") {
      sprite.play("idle", true);
    }
  });
}

// ============================================================
//  HIT ANIMATION (disabled - using visual effects only)
// ============================================================

function playHitAnimation(scene, sprite, isPlayer) {
  // Disabled - we only use visual effects (flash, particles, slash)
  // No fall animation = cleaner combat
  return;
}

// ============================================================
//  ANIMATION SPEED CONTROL
// ============================================================

function setAnimationSpeed(sprite, attackSpeed) {
  if (!sprite || !sprite.state) return;

  // Base 500 = 1.0x speed (300 = 0.6x, 600 = 1.2x)
  const timeScale = Math.max(0.4, Math.min(1.5, attackSpeed / 500));
  sprite.state.timeScale = timeScale;

  console.log("[ARENA] Animation speed:", timeScale.toFixed(2) + "x for attackSpeed:", attackSpeed);
}

// ============================================================
//  HIT VISUAL EFFECTS
// ============================================================

// Flash effect — white overlay that fades out
function flashSprite(scene, sprite) {
  if (!sprite) return;

  // Create white overlay flash at sprite position
  const flash = scene.add.rectangle(sprite.x, sprite.y - 60, 100, 150, 0xffffff, 0.7)
    .setDepth(245);

  // Fade out quickly
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 100,
    ease: "Power2",
    onComplete: () => flash.destroy()
  });
}

// Slash effect — arc from weapon swing
function spawnSlashEffect(scene, x, y, facingRight, isCrit) {
  const slashColor = isCrit ? 0xffdd00 : 0xffffff;
  const slashAlpha = isCrit ? 0.9 : 0.6;

  // Create arc using graphics
  const graphics = scene.add.graphics();
  graphics.setDepth(240);

  const startAngle = facingRight ? -0.5 : 2.6;
  const endAngle = facingRight ? 0.8 : 3.9;

  graphics.lineStyle(isCrit ? 6 : 4, slashColor, slashAlpha);
  graphics.beginPath();
  graphics.arc(x, y - 50, isCrit ? 80 : 60, startAngle, endAngle);
  graphics.strokePath();

  // Fade out
  scene.tweens.add({
    targets: graphics,
    alpha: 0,
    scaleX: 1.3,
    scaleY: 1.3,
    duration: 200,
    ease: "Power2",
    onComplete: () => graphics.destroy()
  });
}

// Combined hit effects
function playHitEffects(scene, target, isCrit, isPlayer) {
  console.log("[ARENA] Hit effects - isCrit:", isCrit, "isPlayer:", isPlayer);

  if (!target) {
    console.warn("[ARENA] No target for hit effects!");
    return;
  }

  const x = target.x;
  const y = target.y - 80;

  // Flash (creates white overlay since Spine doesn't support tint)
  flashSprite(scene, target);

  // Particles
  spawnHitParticles(scene, x, y, isCrit);

  // Slash (from attacker direction)
  const facingRight = !isPlayer;  // If player attacks, slash goes right
  spawnSlashEffect(scene, x, y, facingRight, isCrit);

  // Camera shake on crit
  if (isCrit) {
    scene.cameras.main.shake(150, 0.008);
  }
}

function spawnArenaDamageText(scene, target, damage, isCrit) {
  if (!target) return;

  const color = isCrit ? "#ffdd00" : "#ffffff";
  const size = isCrit ? "72px" : "56px";  // MUCH BIGGER

  const text = scene.add.text(target.x, target.y - 180, "-" + damage, {
    fontSize: size,
    color: color,
    fontFamily: "Arial Black, Arial",
    fontStyle: "bold",
    stroke: "#000000",
    strokeThickness: 8,  // THICK stroke
    shadow: {
      offsetX: 3,
      offsetY: 3,
      color: "#000000",
      blur: 5,
      fill: true
    }
  }).setOrigin(0.5).setDepth(350);

  // Animate: pop up, scale, fade
  text.setScale(0.5);

  scene.tweens.add({
    targets: text,
    y: text.y - 100,
    scale: isCrit ? 1.4 : 1.0,
    duration: 150,
    ease: "Back.easeOut",
    onComplete: () => {
      scene.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 600,
        delay: 200,
        ease: "Power2",
        onComplete: () => text.destroy()
      });
    }
  });

  // Crit gets extra tint
  if (isCrit) {
    text.setTint(0xffdd00);
  }
}

function spawnHitParticles(scene, x, y, isCrit) {
  const count = isCrit ? 15 : 8;
  const colors = isCrit ? [0xffdd00, 0xffaa00, 0xff6600] : [0xffffff, 0xcccccc, 0xaaaaaa];

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = isCrit ? Phaser.Math.Between(4, 8) : Phaser.Math.Between(3, 6);

    const particle = scene.add.circle(x, y, size, color)
      .setDepth(250)
      .setAlpha(1);

    const angle = Math.random() * Math.PI * 2;
    const speed = Phaser.Math.Between(80, 180);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 80;  // Bias upward

    scene.tweens.add({
      targets: particle,
      x: particle.x + vx * 0.4,
      y: particle.y + vy * 0.4,
      alpha: 0,
      scale: 0.3,
      duration: Phaser.Math.Between(300, 500),
      ease: "Power2",
      onComplete: () => particle.destroy()
    });
  }
}

function handleArenaEnd(scene, result) {
  arenaState = "RESULT";
  console.log("[ARENA] Battle ended:", result);

  // Reset attack states
  playerAttacking = false;
  enemyAttacking = false;

  const isWin = result.winner === "player";
  const isDraw = result.winner === "draw";

  // Play death/victory animations
  if (isWin) {
    // Player wins - victory idle, enemy dies (fall → crouch)
    if (arenaPlayerSprite?.play) arenaPlayerSprite.play("idle", true);
    playDeathAnimation(scene, arenaEnemySprite);
  } else if (isDraw) {
    // Draw - both idle
    if (arenaPlayerSprite?.play) arenaPlayerSprite.play("idle", true);
    if (arenaEnemySprite?.play) arenaEnemySprite.play("idle", true);
  } else {
    // Player loses - player dies (fall → crouch), enemy victory
    playDeathAnimation(scene, arenaPlayerSprite);
    if (arenaEnemySprite?.play) arenaEnemySprite.play("idle", true);
  }

  // Use enemy rating from currentMatchData (set at fight start)
  const enemyRating = currentMatchData?.enemyRating || (arenaData.rating + Math.floor(Math.random() * 200) - 100);
  const rewards = applyArenaResult(isWin, enemyRating);

  // Calculate match duration
  const duration = Date.now() - matchStartTime;

  // Record match to history
  if (typeof addMatchToHistory === "function" && currentMatchData) {
    addMatchToHistory({
      timestamp: Date.now(),
      result: isDraw ? "draw" : (isWin ? "win" : "loss"),
      myRating: arenaData.rating,
      ratingChange: rewards.ratingChange,
      enemyName: currentMatchData.enemyName,
      enemyRating: currentMatchData.enemyRating,
      myDamageDealt: result.playerDamageDealt || 0,
      enemyDamageDealt: result.enemyDamageDealt || 0,
      duration: duration,
      expGained: rewards.expReward || 0,
      goldGained: rewards.goldReward || 0
    });
  }

  // Clear current match data
  currentMatchData = null;

  // Show result screen after brief delay
  scene.time.delayedCall(1000, () => {
    showArenaResult(scene, isWin, rewards, result);
  });
}

// ============================================================
//  EXIT ARENA
// ============================================================

function exitArena(scene) {
  if (!arenaActive) return;
  console.log("[ARENA] Exit");

  // Reset combat state
  if (typeof arenaCombat !== "undefined" && arenaCombat) {
    arenaCombat.player = null;
    arenaCombat.enemy = null;
    arenaCombat.isFinished = false;
  }

  // Destroy arena UI
  destroyArenaUI();

  // Destroy tune UI
  destroyTuneUI();

  if (arenaBgLeft) { arenaBgLeft.destroy(); arenaBgLeft = null; }
  if (arenaBgRight) { arenaBgRight.destroy(); arenaBgRight = null; }
  if (arenaPlayerSprite) { arenaPlayerSprite.destroy(); arenaPlayerSprite = null; }
  if (arenaEnemySprite) { arenaEnemySprite.destroy(); arenaEnemySprite = null; }

  scene.cameras.main.setBounds(0, 0, BASE_W, BASE_H);
  scene.cameras.main.scrollX = 0;
  scene.cameras.main.scrollY = 0;
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
