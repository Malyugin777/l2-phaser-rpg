/**
 * ============================================================
 *  SPINE TUNE MODE - Universal Phaser 3 Spine Positioning Tool
 * ============================================================
 *
 * Usage:
 *   1. Include this file in your project
 *   2. Add ?tune to URL to enable
 *   3. Call SpineTuneMode.init(scene, spineObjects, config)
 *
 * Example:
 *   SpineTuneMode.init(scene, {
 *     player: playerSpine,
 *     enemy: enemySpine,
 *     hand: handSpine
 *   }, {
 *     groundY: 0.85,
 *     scale: 1.0
 *   });
 */

(function() {
  'use strict';

  // ============================================================
  //  CONFIG
  // ============================================================

  const TUNE_PARAM = 'tune';  // URL parameter to enable (?tune)
  const STORAGE_KEY = 'SPINE_TUNE_SETTINGS';
  const VERSION = 'v1';

  const ENABLED = new URLSearchParams(window.location.search).has(TUNE_PARAM);

  if (ENABLED) {
    console.log('[SpineTuneMode] ENABLED - Use keyboard/mouse to adjust');
  }

  // ============================================================
  //  STATE
  // ============================================================

  let scene = null;
  let objects = {};           // { name: spineObject }
  let selectedName = null;    // Currently selected object name
  let overlay = null;
  let groundLine = null;
  let baseWidth = 800;
  let baseHeight = 600;

  // Default settings
  const defaultSettings = {
    groundY: 0.85,           // 85% of screen height
    globalScale: 1.0,
    globalSpeed: 1.0,        // Global animation speed multiplier
    objects: {}              // { name: { x, y, scale, flipX, segments } }
  };

  let settings = { ...defaultSettings };

  // Timeline state
  let currentAnimDuration = 1;
  let animTime = 0;

  // ============================================================
  //  SETTINGS MANAGEMENT
  // ============================================================

  function loadSettings() {
    if (!ENABLED) return defaultSettings;

    try {
      // Version check
      const savedVersion = localStorage.getItem(STORAGE_KEY + '_VERSION');
      if (savedVersion !== VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY + '_VERSION', VERSION);
        console.log('[SpineTuneMode] Cleared old settings');
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[SpineTuneMode] Loaded:', parsed);
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.warn('[SpineTuneMode] Failed to load settings');
    }
    return { ...defaultSettings };
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    console.log('[SpineTuneMode] Saved:', settings);
  }

  function resetSettings() {
    localStorage.removeItem(STORAGE_KEY);
    alert('Settings reset! Reload page.');
    location.reload();
  }

  function exportSettings() {
    const json = JSON.stringify(settings, null, 2);
    navigator.clipboard?.writeText(json);
    console.log('[SpineTuneMode] Exported:\n', json);
    alert('Copied to clipboard!\n\n' + json);
  }

  // ============================================================
  //  UI OVERLAY
  // ============================================================

  function createOverlay() {
    if (!ENABLED) return;

    overlay = document.createElement('div');
    overlay.id = 'spine-tune-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.9);
      color: #0f0;
      padding: 15px;
      font: 12px monospace;
      z-index: 99999;
      border-radius: 8px;
      min-width: 300px;
      pointer-events: auto;
      border: 1px solid #333;
    `;

    overlay.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <b style="font-size:14px;">🎛️ SPINE TUNE MODE</b>
        <span id="tune-selected" style="color:#ff0;font-size:12px;">-</span>
      </div>
      <hr style="border-color:#333;margin:8px 0;">
      <div id="tune-objects" style="margin-bottom:10px;"></div>
      <hr style="border-color:#333;margin:8px 0;">
      <div id="tune-values"></div>
      <hr style="border-color:#333;margin:8px 0;">

      <!-- GLOBAL SPEED SLIDER -->
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span>⚡ Global Speed:</span>
          <span id="tune-speed-value" style="color:#4f8;">1.0x</span>
        </div>
        <input type="range" id="tune-speed-slider" min="0.1" max="3" step="0.05" value="1" style="width:100%;">
      </div>

      <!-- TIMELINE SPEED EDITOR -->
      <div style="background:#1a1a2e;padding:10px;border-radius:4px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <b style="color:#0ff;">⏱️ Timeline Speed Editor</b>
          <span id="tune-anim-info" style="color:#888;font-size:10px;">-</span>
        </div>
        <div id="tune-timeline" style="position:relative;height:40px;background:#333;border-radius:4px;margin-bottom:8px;cursor:crosshair;">
          <div id="tune-playhead" style="position:absolute;top:0;left:0;width:2px;height:100%;background:#f44;pointer-events:none;"></div>
        </div>
        <div id="tune-segments" style="max-height:100px;overflow-y:auto;margin-bottom:8px;"></div>
        <button id="tune-add-segment" style="width:100%;padding:6px;cursor:pointer;background:#346;color:#fff;border:none;border-radius:4px;">+ Add Segment</button>
      </div>

      <hr style="border-color:#333;margin:8px 0;">
      <div style="color:#888;font-size:11px;line-height:1.6;">
        <b style="color:#0f0;">Mouse:</b> Drag objects<br>
        <b style="color:#0f0;">1-9:</b> Select object<br>
        <b style="color:#0f0;">↑↓:</b> Move Y | <b style="color:#0f0;">←→:</b> Move X<br>
        <b style="color:#0f0;">Q/E:</b> Scale | <b style="color:#0f0;">F:</b> Flip X<br>
        <b style="color:#0f0;">W/Z:</b> Speed +/− | <b style="color:#0f0;">P:</b> Pause<br>
        <b style="color:#0f0;">R:</b> Reset | <b style="color:#0f0;">S:</b> Save<br>
      </div>
      <hr style="border-color:#333;margin:8px 0;">
      <div style="display:flex;gap:5px;">
        <button id="tune-save" style="flex:1;padding:8px;cursor:pointer;background:#2a4;color:#fff;border:none;border-radius:4px;">💾 SAVE</button>
        <button id="tune-reset" style="padding:8px;cursor:pointer;background:#633;color:#fff;border:none;border-radius:4px;">🔄</button>
        <button id="tune-export" style="padding:8px;cursor:pointer;background:#346;color:#fff;border:none;border-radius:4px;">📋</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Button events
    document.getElementById('tune-save').onclick = saveSettings;
    document.getElementById('tune-reset').onclick = resetSettings;
    document.getElementById('tune-export').onclick = exportSettings;

    // Speed slider
    const speedSlider = document.getElementById('tune-speed-slider');
    speedSlider.value = settings.globalSpeed;
    document.getElementById('tune-speed-value').textContent = settings.globalSpeed.toFixed(1) + 'x';

    speedSlider.oninput = (e) => {
      settings.globalSpeed = parseFloat(e.target.value);
      document.getElementById('tune-speed-value').textContent = settings.globalSpeed.toFixed(1) + 'x';
      applyAnimationSpeed();
    };

    // Add segment button
    document.getElementById('tune-add-segment').onclick = addSegment;

    // Initial render
    renderTimeline();
  }

  // ============================================================
  //  TIMELINE SPEED SEGMENTS
  // ============================================================

  function getSegments() {
    if (!selectedName) return [{ start: 0, end: 1, speed: 1.0 }];

    if (!settings.objects[selectedName]) {
      settings.objects[selectedName] = {};
    }
    if (!settings.objects[selectedName].segments) {
      settings.objects[selectedName].segments = [{ start: 0, end: 1, speed: 1.0 }];
    }
    return settings.objects[selectedName].segments;
  }

  function setSegments(segments) {
    if (!selectedName) return;

    if (!settings.objects[selectedName]) {
      settings.objects[selectedName] = {};
    }
    settings.objects[selectedName].segments = segments;
  }

  function renderTimeline() {
    if (!overlay) return;

    const timeline = document.getElementById('tune-timeline');
    const segmentsList = document.getElementById('tune-segments');
    if (!timeline || !segmentsList) return;

    const segments = getSegments();

    // Clear existing segments (keep playhead)
    timeline.querySelectorAll('.tune-seg').forEach(el => el.remove());
    segmentsList.innerHTML = '';

    // Render visual segments on timeline
    segments.forEach((seg, i) => {
      const div = document.createElement('div');
      div.className = 'tune-seg';
      div.style.cssText = `
        position: absolute;
        top: 0;
        left: ${seg.start * 100}%;
        width: ${(seg.end - seg.start) * 100}%;
        height: 100%;
        background: ${i % 2 === 0 ? '#4a6' : '#46a'};
        border-right: 2px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: #fff;
        min-width: 20px;
      `;
      div.textContent = seg.speed.toFixed(1) + 'x';
      timeline.insertBefore(div, document.getElementById('tune-playhead'));
    });

    // Render segment list with inputs
    segments.forEach((seg, i) => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;gap:4px;margin-bottom:4px;align-items:center;';
      item.innerHTML = `
        <span style="color:#888;width:20px;">${i + 1}.</span>
        <input type="number" value="${seg.start}" step="0.1" min="0" max="1" data-idx="${i}" data-field="start" style="width:50px;padding:3px;background:#333;border:1px solid #444;color:#fff;border-radius:3px;">
        <span style="color:#666;">→</span>
        <input type="number" value="${seg.end}" step="0.1" min="0" max="1" data-idx="${i}" data-field="end" style="width:50px;padding:3px;background:#333;border:1px solid #444;color:#fff;border-radius:3px;">
        <span style="color:#666;">@</span>
        <input type="number" value="${seg.speed}" step="0.1" min="0.1" max="5" data-idx="${i}" data-field="speed" style="width:50px;padding:3px;background:#333;border:1px solid #444;color:#fff;border-radius:3px;">
        <span style="color:#4f8;">x</span>
        <button data-idx="${i}" class="tune-del-seg" style="padding:3px 6px;background:#633;border:none;color:#fff;border-radius:3px;cursor:pointer;">✕</button>
      `;
      segmentsList.appendChild(item);
    });

    // Event listeners for inputs
    segmentsList.querySelectorAll('input').forEach(inp => {
      inp.onchange = (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const field = e.target.dataset.field;
        const segs = getSegments();
        segs[idx][field] = parseFloat(e.target.value);
        setSegments(segs);
        renderTimeline();
      };
    });

    // Delete segment buttons
    segmentsList.querySelectorAll('.tune-del-seg').forEach(btn => {
      btn.onclick = (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const segs = getSegments();
        if (segs.length > 1) {
          segs.splice(idx, 1);
          setSegments(segs);
          renderTimeline();
        }
      };
    });

    // Update anim info
    updateAnimInfo();
  }

  function addSegment() {
    const segments = getSegments();
    const last = segments[segments.length - 1];

    if (last.end < 1) {
      segments.push({ start: last.end, end: 1, speed: 1.0 });
    } else {
      // Split last segment
      const mid = (last.start + last.end) / 2;
      last.end = mid;
      segments.push({ start: mid, end: 1, speed: 1.0 });
    }

    setSegments(segments);
    renderTimeline();
  }

  function updateAnimInfo() {
    const infoEl = document.getElementById('tune-anim-info');
    if (!infoEl) return;

    if (selectedName && objects[selectedName]) {
      const obj = objects[selectedName];
      if (obj.state) {
        const track = obj.state.getCurrent(0);
        if (track && track.animation) {
          currentAnimDuration = track.animation.duration || 1;
          infoEl.textContent = `${track.animation.name} (${currentAnimDuration.toFixed(2)}s)`;
          return;
        }
      }
    }
    infoEl.textContent = '-';
  }

  function updatePlayhead() {
    const playhead = document.getElementById('tune-playhead');
    if (!playhead || !selectedName || !objects[selectedName]) return;

    const obj = objects[selectedName];
    if (!obj.state) return;

    const track = obj.state.getCurrent(0);
    if (!track) return;

    animTime = track.trackTime % currentAnimDuration;
    const progress = animTime / currentAnimDuration;

    playhead.style.left = (progress * 100) + '%';

    // Apply segment speed
    const segments = getSegments();
    const segment = segments.find(s => progress >= s.start && progress < s.end);
    if (segment && obj.state) {
      obj.state.timeScale = segment.speed * settings.globalSpeed;
    }
  }

  function applyAnimationSpeed() {
    Object.values(objects).forEach(obj => {
      if (obj && obj.state) {
        obj.state.timeScale = settings.globalSpeed;
      }
    });
  }

  function updateOverlay() {
    if (!overlay) return;

    // Objects list
    const objectsEl = document.getElementById('tune-objects');
    if (objectsEl) {
      const names = Object.keys(objects);
      objectsEl.innerHTML = names.map((name, i) => {
        const isSelected = name === selectedName;
        const color = isSelected ? '#ff0' : '#888';
        return `<span style="color:${color};margin-right:10px;">[${i + 1}] ${name}</span>`;
      }).join('');
    }

    // Selected indicator
    const selectedEl = document.getElementById('tune-selected');
    if (selectedEl) {
      selectedEl.textContent = selectedName || '-';
    }

    // Values
    const valuesEl = document.getElementById('tune-values');
    if (valuesEl && selectedName && objects[selectedName]) {
      const obj = objects[selectedName];
      const objSettings = settings.objects[selectedName] || {};

      valuesEl.innerHTML = `
        <div style="margin-bottom:5px;">
          <b style="color:#ff0;">${selectedName}</b>
        </div>
        <div>X: <span style="color:#4f8;">${obj.x?.toFixed(0) || 0}px</span> (${((obj.x / baseWidth) * 100).toFixed(0)}%)</div>
        <div>Y: <span style="color:#4f8;">${obj.y?.toFixed(0) || 0}px</span> (${((obj.y / baseHeight) * 100).toFixed(0)}%)</div>
        <div>Scale: <span style="color:#4f8;">${Math.abs(obj.scaleX || 1).toFixed(2)}</span></div>
        <div>FlipX: <span style="color:#4f8;">${(obj.scaleX || 1) < 0 ? 'YES' : 'NO'}</span></div>
        <hr style="border-color:#333;margin:8px 0;">
        <div>Ground Y: <span style="color:#0ff;">${(settings.groundY * 100).toFixed(0)}%</span></div>
      `;
    }
  }

  function destroyOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    if (groundLine) {
      groundLine.destroy();
      groundLine = null;
    }
  }

  // ============================================================
  //  GROUND LINE HELPER
  // ============================================================

  function drawGroundLine() {
    if (!ENABLED || !scene) return;

    if (groundLine) groundLine.destroy();

    const y = baseHeight * settings.groundY;
    groundLine = scene.add.line(0, 0, 0, y, baseWidth * 3, y, 0xff0000, 0.5);
    groundLine.setOrigin(0, 0);
    groundLine.setDepth(9999);
    groundLine.setScrollFactor(0);
  }

  // ============================================================
  //  KEYBOARD CONTROLS
  // ============================================================

  function setupKeyboard() {
    if (!ENABLED || !scene) return;

    const STEP_X = 10;
    const STEP_Y_PERCENT = 0.01;
    const SCALE_STEP = 0.02;

    // Number keys 1-9 to select objects
    const names = Object.keys(objects);
    for (let i = 0; i < Math.min(9, names.length); i++) {
      const key = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'][i];
      scene.input.keyboard.on('keydown-' + key, () => {
        selectedName = names[i];
        console.log('[SpineTuneMode] Selected:', selectedName);
        renderTimeline();  // Update timeline for new object
        updateOverlay();
      });
    }

    // Arrow keys - move
    scene.input.keyboard.on('keydown-UP', () => {
      settings.groundY = Math.max(0.1, settings.groundY - STEP_Y_PERCENT);
      applyGroundY();
      updateOverlay();
    });

    scene.input.keyboard.on('keydown-DOWN', () => {
      settings.groundY = Math.min(1.0, settings.groundY + STEP_Y_PERCENT);
      applyGroundY();
      updateOverlay();
    });

    scene.input.keyboard.on('keydown-LEFT', () => {
      if (selectedName && objects[selectedName]) {
        objects[selectedName].x -= STEP_X;
        saveObjectPosition(selectedName);
        updateOverlay();
      }
    });

    scene.input.keyboard.on('keydown-RIGHT', () => {
      if (selectedName && objects[selectedName]) {
        objects[selectedName].x += STEP_X;
        saveObjectPosition(selectedName);
        updateOverlay();
      }
    });

    // Q/E - scale
    scene.input.keyboard.on('keydown-Q', () => {
      if (selectedName && objects[selectedName]) {
        const obj = objects[selectedName];
        const currentScale = Math.abs(obj.scaleX || 1);
        const newScale = Math.max(0.1, currentScale - SCALE_STEP);
        const flipX = (obj.scaleX || 1) < 0;
        obj.setScale(flipX ? -newScale : newScale, newScale);
        saveObjectPosition(selectedName);
        updateOverlay();
      }
    });

    scene.input.keyboard.on('keydown-E', () => {
      if (selectedName && objects[selectedName]) {
        const obj = objects[selectedName];
        const currentScale = Math.abs(obj.scaleX || 1);
        const newScale = Math.min(5.0, currentScale + SCALE_STEP);
        const flipX = (obj.scaleX || 1) < 0;
        obj.setScale(flipX ? -newScale : newScale, newScale);
        saveObjectPosition(selectedName);
        updateOverlay();
      }
    });

    // F - flip X
    scene.input.keyboard.on('keydown-F', () => {
      if (selectedName && objects[selectedName]) {
        const obj = objects[selectedName];
        obj.scaleX *= -1;
        saveObjectPosition(selectedName);
        updateOverlay();
      }
    });

    // R - reset selected
    scene.input.keyboard.on('keydown-R', () => {
      if (selectedName && objects[selectedName]) {
        const obj = objects[selectedName];
        obj.x = baseWidth / 2;
        obj.y = baseHeight * settings.groundY;
        obj.setScale(1);
        saveObjectPosition(selectedName);
        updateOverlay();
        console.log('[SpineTuneMode] Reset:', selectedName);
      }
    });

    // S - save (Ctrl+S or just S when not typing)
    scene.input.keyboard.on('keydown-S', (e) => {
      if (!e.ctrlKey) {
        saveSettings();
      }
    });

    // W - speed up
    scene.input.keyboard.on('keydown-W', () => {
      settings.globalSpeed = Math.min(3.0, settings.globalSpeed + 0.1);
      const slider = document.getElementById('tune-speed-slider');
      if (slider) slider.value = settings.globalSpeed;
      document.getElementById('tune-speed-value').textContent = settings.globalSpeed.toFixed(1) + 'x';
      applyAnimationSpeed();
    });

    // A - speed down (using different key to not conflict with selection)
    scene.input.keyboard.on('keydown-Z', () => {
      settings.globalSpeed = Math.max(0.1, settings.globalSpeed - 0.1);
      const slider = document.getElementById('tune-speed-slider');
      if (slider) slider.value = settings.globalSpeed;
      document.getElementById('tune-speed-value').textContent = settings.globalSpeed.toFixed(1) + 'x';
      applyAnimationSpeed();
    });

    // P - play/pause animation
    scene.input.keyboard.on('keydown-P', () => {
      if (selectedName && objects[selectedName] && objects[selectedName].state) {
        const obj = objects[selectedName];
        if (obj.state.timeScale > 0) {
          obj._savedTimeScale = obj.state.timeScale;
          obj.state.timeScale = 0;
          console.log('[SpineTuneMode] Paused');
        } else {
          obj.state.timeScale = obj._savedTimeScale || 1;
          console.log('[SpineTuneMode] Playing');
        }
      }
    });
  }

  // ============================================================
  //  DRAG & DROP
  // ============================================================

  function setupDrag() {
    if (!ENABLED || !scene) return;

    Object.entries(objects).forEach(([name, obj]) => {
      if (!obj || !obj.setInteractive) return;

      obj.setInteractive({ draggable: true, useHandCursor: true });
      scene.input.setDraggable(obj);
    });

    scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      // Find which object is being dragged
      const name = Object.keys(objects).find(n => objects[n] === gameObject);
      if (!name) return;

      gameObject.x = dragX;
      gameObject.y = dragY;

      // Update ground Y based on drag
      settings.groundY = dragY / baseHeight;

      // Sync all objects to same Y (ground line)
      applyGroundY();

      saveObjectPosition(name);
      updateOverlay();
    });

    // Visual feedback
    scene.input.on('gameobjectover', (pointer, gameObject) => {
      if (gameObject.setScale) {
        gameObject.setScale(gameObject.scaleX * 1.05, gameObject.scaleY * 1.05);
      }
    });

    scene.input.on('gameobjectout', (pointer, gameObject) => {
      const name = Object.keys(objects).find(n => objects[n] === gameObject);
      if (name && settings.objects[name]) {
        const scale = settings.objects[name].scale || 1;
        const flipX = settings.objects[name].flipX || false;
        gameObject.setScale(flipX ? -scale : scale, scale);
      }
    });

    console.log('[SpineTuneMode] Drag enabled for:', Object.keys(objects).join(', '));
  }

  // ============================================================
  //  APPLY SETTINGS
  // ============================================================

  function applyGroundY() {
    const y = baseHeight * settings.groundY;

    Object.entries(objects).forEach(([name, obj]) => {
      if (obj) obj.y = y;
    });

    drawGroundLine();
  }

  function saveObjectPosition(name) {
    const obj = objects[name];
    if (!obj) return;

    if (!settings.objects[name]) {
      settings.objects[name] = {};
    }

    settings.objects[name] = {
      x: obj.x,
      xPercent: obj.x / baseWidth,
      y: obj.y,
      yPercent: obj.y / baseHeight,
      scale: Math.abs(obj.scaleX || 1),
      flipX: (obj.scaleX || 1) < 0
    };
  }

  function applyAllSettings() {
    Object.entries(settings.objects).forEach(([name, objSettings]) => {
      const obj = objects[name];
      if (!obj) return;

      // Apply position (prefer percentage)
      if (objSettings.xPercent !== undefined) {
        obj.x = baseWidth * objSettings.xPercent;
      } else if (objSettings.x !== undefined) {
        obj.x = objSettings.x;
      }

      // Y comes from groundY
      obj.y = baseHeight * settings.groundY;

      // Apply scale
      if (objSettings.scale !== undefined) {
        const scale = objSettings.scale;
        const flipX = objSettings.flipX || false;
        obj.setScale(flipX ? -scale : scale, scale);
      }
    });

    drawGroundLine();
  }

  // ============================================================
  //  PUBLIC API
  // ============================================================

  const SpineTuneMode = {
    /**
     * Check if tune mode is enabled
     */
    isEnabled: () => ENABLED,

    /**
     * Initialize tune mode
     * @param {Phaser.Scene} phaserScene - The Phaser scene
     * @param {Object} spineObjects - Object with named spine objects { name: spineObject }
     * @param {Object} config - Optional config { groundY, scale }
     */
    init: function(phaserScene, spineObjects, config = {}) {
      if (!ENABLED) {
        console.log('[SpineTuneMode] Disabled. Add ?tune to URL to enable.');
        return;
      }

      scene = phaserScene;
      objects = spineObjects || {};
      baseWidth = scene.scale.width;
      baseHeight = scene.scale.height;

      // Load saved settings
      settings = loadSettings();

      // Apply config defaults
      if (config.groundY !== undefined) {
        settings.groundY = settings.groundY || config.groundY;
      }

      // Select first object by default
      const names = Object.keys(objects);
      if (names.length > 0) {
        selectedName = names[0];
      }

      // Setup UI
      createOverlay();
      setupKeyboard();
      setupDrag();
      applyAllSettings();
      updateOverlay();

      console.log('[SpineTuneMode] Initialized with objects:', names.join(', '));
    },

    /**
     * Add an object after init
     */
    addObject: function(name, obj) {
      if (!ENABLED) return;

      objects[name] = obj;
      obj.setInteractive({ draggable: true, useHandCursor: true });
      scene.input.setDraggable(obj);
      updateOverlay();
    },

    /**
     * Remove an object
     */
    removeObject: function(name) {
      delete objects[name];
      delete settings.objects[name];
      if (selectedName === name) {
        selectedName = Object.keys(objects)[0] || null;
      }
      updateOverlay();
    },

    /**
     * Get current settings (for use in code)
     */
    getSettings: function() {
      return { ...settings };
    },

    /**
     * Get settings for a specific object
     */
    getObjectSettings: function(name) {
      return settings.objects[name] || null;
    },

    /**
     * Destroy tune mode
     */
    destroy: function() {
      destroyOverlay();
      scene = null;
      objects = {};
      selectedName = null;
    },

    /**
     * Update display (call in scene update for playhead tracking)
     */
    update: function() {
      if (ENABLED) {
        updatePlayhead();
        updateOverlay();
      }
    },

    /**
     * Get segments for an object (for use in game code)
     */
    getSegments: function(name) {
      const objName = name || selectedName;
      if (!objName || !settings.objects[objName]) return null;
      return settings.objects[objName].segments || null;
    },

    /**
     * Apply segment speed to a spine object based on current animation progress
     * @param {Object} spineObj - The spine object
     * @param {Array} segments - Array of { start, end, speed }
     * @param {number} globalSpeed - Global speed multiplier
     */
    applySegmentSpeed: function(spineObj, segments, globalSpeed = 1.0) {
      if (!spineObj || !spineObj.state || !segments) return;

      const track = spineObj.state.getCurrent(0);
      if (!track || !track.animation) return;

      const duration = track.animation.duration || 1;
      const time = track.trackTime % duration;
      const progress = time / duration;

      const segment = segments.find(s => progress >= s.start && progress < s.end);
      if (segment) {
        spineObj.state.timeScale = segment.speed * globalSpeed;
      }
    }
  };

  // Export to window
  window.SpineTuneMode = SpineTuneMode;

  console.log('[SpineTuneMode] Module loaded. Add ?tune to URL to enable.');

})();
