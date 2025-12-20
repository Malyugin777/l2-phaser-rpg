"use strict";

// ============================================================
//  ARENA SCENE — 2-Screen Wide World (IIFE to avoid conflicts)
//  Studio Quality: Cinematic camera, proper ground positioning
//  With Tune Mode for visual adjustments
// ============================================================

(function() {

let arenaActive = false;
let arenaState = "NONE"; // NONE, INTRO, RUN_IN, ENGAGE, FIGHT

let arenaBgSprite = null;
let arenaPlayerSprite = null;
let arenaEnemySprite = null;
let arenaExitBtnSprite = null;

const ARENA_CONFIG = {
  worldMultiplier: 2,      // World = 2x screen width
  fightOffset: 150,        // Distance from center for each fighter
  engageDistance: 300,     // Stop when this close
  spawnMargin: 0.30,       // Spawn at 30% from edge
  groundY: 0.38,           // Ground at 38% from top (fence line)
  runSpeed: 2500,          // Slower for drama
  vsScreenDuration: 1500,
  fadeTime: 300,
  engagePause: 300,
  fighterScale: 0.8,       // Slightly smaller
  // Camera settings
  camera: {
    lerpSpeed: 0.06,       // Smooth follow (0.01=slow, 0.1=fast)
    startDelay: 300,       // Wait before camera starts moving (ms)
    lockOnEngage: true     // Lock camera when fighters meet
  }
};

let BASE_W, BASE_H, WORLD_W, WORLD_H, GROUND_Y;

// ============================================================
//  ARENA TUNE MODE
// ============================================================

const ARENA_TUNE_ENABLED = new URLSearchParams(window.location.search).has('arena_tune');
if (ARENA_TUNE_ENABLED) console.log("[ARENA] Tune mode ENABLED");

// Tunable values (saved to localStorage)
function getArenaTuneSettings() {
  const defaults = {
    bgX: 0,
    bgY: 0,
    bgScale: 1.0,
    groundY: 0.38,
    fighterScale: 0.8,
    fightOffset: 150,
    cameraStartX: 0,
  };

  if (!ARENA_TUNE_ENABLED) return defaults;

  try {
    const saved = localStorage.getItem('ARENA_TUNE');
    if (saved) return { ...defaults, ...JSON.parse(saved) };
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

function createArenaTuneUI(scene) {
  if (!ARENA_TUNE_ENABLED) return;

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
    <b>ARENA TUNE</b> [<span id="arena-sel" style="color:#ff0">ground</span>]
    <hr style="border-color:#333;margin:8px 0">
    <div id="arena-tune-values"></div>
    <hr style="border-color:#333;margin:8px 0">
    <small>
    1: BG | 2: Ground | 3: Player | 4: Enemy | 5: Fight<br>
    Up/Down: Move Y | Left/Right: Move X | Q/E: Scale<br>
    SPACE: Test run | R: Reset positions<br>
    C: Camera to player | V: Camera center<br>
    S: SAVE
    </small>
    <div style="margin-top:10px;display:flex;gap:5px;">
      <button id="arena-tune-save" style="flex:1;padding:8px;cursor:pointer">SAVE</button>
      <button id="arena-tune-reset" style="padding:8px;cursor:pointer">RESET</button>
      <button id="arena-tune-copy" style="padding:8px;cursor:pointer">COPY</button>
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
  el.innerHTML = `
    <b style="color:${selectedTuneElement === 'bg' ? '#ff0' : '#888'}">1.BG:</b>
    x:${s.bgX.toFixed(0)} y:${s.bgY.toFixed(0)} s:${s.bgScale.toFixed(2)}<br>
    <b style="color:${selectedTuneElement === 'ground' ? '#ff0' : '#888'}">2.Ground:</b>
    ${(s.groundY * 100).toFixed(0)}%<br>
    <b style="color:${selectedTuneElement === 'player' ? '#ff0' : '#888'}">3.Player:</b>
    scale:${s.fighterScale.toFixed(2)}<br>
    <b style="color:${selectedTuneElement === 'enemy' ? '#ff0' : '#888'}">4.Enemy:</b>
    scale:${s.fighterScale.toFixed(2)}<br>
    <b style="color:${selectedTuneElement === 'fight' ? '#ff0' : '#888'}">5.Fight:</b>
    offset:${s.fightOffset.toFixed(0)}px<br>
    <hr style="border-color:#333;margin:5px 0">
    <span style="color:#0ff">Ground line: ${(BASE_H * s.groundY).toFixed(0)}px</span>
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
    if (selectedTuneElement === 'bg') arenaTuneSettings.bgY -= STEP;
    else if (selectedTuneElement === 'ground') arenaTuneSettings.groundY -= 0.01;
    applyArenaTuneSettings(scene);
  });

  scene.input.keyboard.on('keydown-DOWN', () => {
    if (selectedTuneElement === 'bg') arenaTuneSettings.bgY += STEP;
    else if (selectedTuneElement === 'ground') arenaTuneSettings.groundY += 0.01;
    applyArenaTuneSettings(scene);
  });

  scene.input.keyboard.on('keydown-LEFT', () => {
    if (selectedTuneElement === 'bg') arenaTuneSettings.bgX -= STEP;
    else if (selectedTuneElement === 'fight') arenaTuneSettings.fightOffset -= 10;
    applyArenaTuneSettings(scene);
  });

  scene.input.keyboard.on('keydown-RIGHT', () => {
    if (selectedTuneElement === 'bg') arenaTuneSettings.bgX += STEP;
    else if (selectedTuneElement === 'fight') arenaTuneSettings.fightOffset += 10;
    applyArenaTuneSettings(scene);
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

  // Space = test run
  scene.input.keyboard.on('keydown-SPACE', () => {
    if (arenaState === 'FIGHT' || arenaState === 'ENGAGE') {
      resetFighterPositions(scene);
      startRunIn(scene);
    }
  });

  // R = reset positions (no run)
  scene.input.keyboard.on('keydown-R', () => {
    resetFighterPositions(scene);
  });

  // S = save
  scene.input.keyboard.on('keydown-S', () => {
    saveArenaTuneSettings();
  });

  // C = camera to player
  scene.input.keyboard.on('keydown-C', () => {
    if (arenaPlayerSprite) {
      const camX = Math.max(0, arenaPlayerSprite.x - BASE_W * 0.35);
      scene.cameras.main.scrollX = camX;
      console.log("[ARENA TUNE] Camera to player:", camX.toFixed(0));
    }
  });

  // V = center camera
  scene.input.keyboard.on('keydown-V', () => {
    scene.cameras.main.scrollX = (WORLD_W - BASE_W) / 2;
    console.log("[ARENA TUNE] Camera centered");
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
  const playerStartX = BASE_W * 0.3;
  const enemyStartX = WORLD_W - BASE_W * 0.3;

  GROUND_Y = BASE_H * s.groundY;

  if (arenaPlayerSprite) {
    arenaPlayerSprite.setPosition(playerStartX, GROUND_Y);
    if (arenaPlayerSprite.play) arenaPlayerSprite.play('idle', true);
  }
  if (arenaEnemySprite) {
    arenaEnemySprite.setPosition(enemyStartX, GROUND_Y);
    if (arenaEnemySprite.play) arenaEnemySprite.play('idle', true);
  }

  scene.cameras.main.scrollX = 0;
  arenaState = 'FIGHT';

  console.log("[ARENA TUNE] Reset positions");
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

  showVSScreen(scene, enemyData, () => {
    setupArenaWorld(scene);
    spawnFighters(scene, enemyData);
    startRunIn(scene);
  });
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

  // Camera bounds = world size
  scene.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  // IMPORTANT: Reset camera zoom to 1
  scene.cameras.main.setZoom(1);

  // Background centered in world, scaled to COVER
  arenaBgSprite = scene.add.image(WORLD_W / 2, BASE_H / 2, 'arena_village');

  // COVER: background must cover BOTH world width AND screen height
  const scaleW = WORLD_W / arenaBgSprite.width;   // fit world width
  const scaleH = BASE_H / arenaBgSprite.height;   // fit screen height
  const bgScale = Math.max(scaleW, scaleH);       // cover = max of both
  arenaBgSprite.setScale(bgScale);
  arenaBgSprite.setOrigin(0.5, 0.5);
  arenaBgSprite.setDepth(10);
  arenaBgSprite.setScrollFactor(1);

  console.log("[ARENA] BG scale:", bgScale.toFixed(3),
    "(scaleW:", scaleW.toFixed(2), "scaleH:", scaleH.toFixed(2), ")",
    "size:", arenaBgSprite.displayWidth.toFixed(0), "x", arenaBgSprite.displayHeight.toFixed(0));

  // Exit button (fixed to screen)
  arenaExitBtnSprite = scene.add.text(BASE_W / 2, BASE_H - 100, '[ Выход ]', {
    fontSize: '28px', color: '#ffffff', backgroundColor: '#222222',
    padding: { x: 24, y: 12 }
  });
  arenaExitBtnSprite.setOrigin(0.5).setDepth(300).setScrollFactor(0);
  arenaExitBtnSprite.setInteractive({ useHandCursor: true });
  arenaExitBtnSprite.on('pointerdown', () => exitArena(scene));

  // Initialize tune mode
  if (ARENA_TUNE_ENABLED) {
    createArenaTuneUI(scene);
    applyArenaTuneSettings(scene);
    console.log("[ARENA] Tune mode enabled - press 1-5 to select, arrows to adjust");
  }
}

// ============================================================
//  SPAWN FIGHTERS
// ============================================================

function spawnFighters(scene, enemyData) {
  const playerStartX = BASE_W * ARENA_CONFIG.spawnMargin;
  const enemyStartX = WORLD_W - BASE_W * ARENA_CONFIG.spawnMargin;

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

  // === CINEMATIC CAMERA START ===
  // Start camera focused on player (left side, player in center-left of screen)
  const cameraStartX = Math.max(0, arenaPlayerSprite.x - BASE_W * 0.35);
  scene.cameras.main.scrollX = cameraStartX;

  console.log("[ARENA] Spawned at Player:", playerStartX.toFixed(0), "Enemy:", enemyStartX.toFixed(0));
  console.log("[ARENA] Camera start X:", cameraStartX.toFixed(0));

  // Draw ground line in tune mode
  if (ARENA_TUNE_ENABLED) {
    drawGroundLine(scene);
  }
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

  if (arenaState === "RUN_IN") {
    // Calculate midpoint between fighters
    const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;

    // Target: center camera on midpoint
    const targetScrollX = midX - BASE_W / 2;

    // Clamp to world bounds
    const clampedX = Math.max(0, Math.min(targetScrollX, WORLD_W - BASE_W));

    // Smooth lerp (cinematic feel)
    const currentX = scene.cameras.main.scrollX;
    const lerpSpeed = ARENA_CONFIG.camera?.lerpSpeed || 0.06;
    const newX = currentX + (clampedX - currentX) * lerpSpeed;

    scene.cameras.main.scrollX = newX;

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

  // === LOCK CAMERA at final position ===
  const midX = (arenaPlayerSprite.x + arenaEnemySprite.x) / 2;
  const finalScrollX = Math.max(0, Math.min(midX - BASE_W / 2, WORLD_W - BASE_W));
  scene.cameras.main.scrollX = finalScrollX;
  console.log("[ARENA] Camera locked at:", finalScrollX.toFixed(0));

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
