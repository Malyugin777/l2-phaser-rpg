# Pocket Lineage: Human Saga

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler в стиле Lineage 2
**Платформа:** Telegram Mini App (TMA)
**Движок:** Phaser 3.80.1 + SpinePlugin 4.1
**Язык:** Vanilla JavaScript (ES6, strict mode, модульная архитектура)
**Версия:** 1.7.0
**GitHub:** https://github.com/Malyugin777/l2-phaser-rpg
**GitHub Pages:** https://malyugin777.github.io/l2-phaser-rpg/src/
**Telegram:** @Poketlineage_bot

---

## 🏗️ Архитектура проекта (v1.7.0)

### Структура файлов

```
src/
├── core/
│   ├── config.js           # Phaser config, scaling, viewport (132 lines)
│   └── spineAnimations.js  # Hero animations (118 lines)
├── state/
│   ├── heroState.js        # Hero data
│   ├── itemSystem.js       # Items & equipment
│   ├── saveSystem.js       # Save/load
│   ├── statSystem.js       # Stats calculation
│   ├── tickSystem.js       # Game tick
│   ├── worldState.js       # World state
│   ├── combatSystem.js     # Combat logic
│   ├── skillSystem.js      # Skills
│   ├── locationSystem.js   # Locations
│   ├── uiSystem.js         # UI state
│   ├── uiLayout.js         # UI layout
│   └── ... (other systems)
├── ui/
│   ├── bottomUI.js         # Bottom panel UI (83 lines)
│   ├── tuneMode.js         # Visual positioning tool (304 lines)
│   ├── inventoryPanel.js   # Inventory panel
│   ├── statsPanel.js       # Stats panel
│   ├── forgePanel.js       # Forge panel
│   └── ... (other panels)
├── game.js                 # Main game logic (563 lines)
├── index.html              # Entry point
├── preEntry.js             # Loader
└── preEntry.css            # Loader styles
```

### Порядок загрузки скриптов (index.html)

```html
<!-- Phaser -->
<script src="phaser@3.80.1"></script>
<script src="SpinePlugin.js"></script>

<!-- PRE-ENTRY -->
<script src="preEntry.js"></script>

<!-- STATE (data & logic) -->
<script src="state/heroState.js"></script>
<script src="state/itemSystem.js"></script>
<!-- ... other state files ... -->

<!-- CORE (must load before game.js) -->
<script src="core/config.js"></script>
<script src="core/spineAnimations.js"></script>

<!-- UI PANELS -->
<script src="ui/bottomUI.js"></script>
<script src="ui/tuneMode.js"></script>
<!-- ... other UI panels ... -->

<!-- MAIN -->
<script src="game.js"></script>
```

---

## 📱 TMA Platform

### Размеры экрана

| Параметр | Значение | Описание |
|----------|----------|----------|
| BASE_W | 780 | Базовая ширина игры |
| BASE_H | 1688 | Базовая высота игры |
| RESOLUTION | DPR | devicePixelRatio для ретина |

### Phaser Config (core/config.js)

```javascript
const BASE_W = 780;
const BASE_H = 1688;
const RESOLUTION = window.devicePixelRatio || 1;

const phaserConfig = {
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  resolution: RESOLUTION,
  parent: "game-container",
  backgroundColor: 0x0a0a12,
  fps: { target: 60, forceSetTimeOut: true },
  render: { antialias: true, antialiasGL: true, pixelArt: false, roundPixels: false },
  scale: { mode: Phaser.Scale.ENVELOP, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: null, // Set in game.js
  plugins: {
    scene: [{ key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" }]
  }
};
```

### Viewport Sync (core/config.js)

```javascript
function syncAppHeight() {
  const tg = window.Telegram?.WebApp;
  const h = tg?.viewportHeight || window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${Math.round(h)}px`);
}

// Request fullscreen in TMA
window.Telegram?.WebApp?.expand?.();
syncAppHeight();
window.visualViewport?.addEventListener("resize", syncAppHeight);
```

### Game Handlers (core/config.js)

```javascript
function initGameHandlers(game) {
  window.addEventListener("resize", () => {
    syncAppHeight();
    game.scale?.refresh();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) game.loop.sleep();
    else game.loop.wake();
  });
}
```

---

## 🎮 Game.js Structure (v1.7.0)

### Инициализация

```javascript
// Set scene handlers
phaserConfig.scene = { preload, create, update };

// Create game
const game = new Phaser.Game(phaserConfig);

// Initialize handlers
game.events.once("ready", () => {
  initGameHandlers(game);
});
```

### Create() - Модульная структура

```javascript
function create() {
  window.gameScene = this;
  loadGame();

  // AudioContext fix for TMA
  this.input.once("pointerdown", () => {
    if (this.sound?.context?.state === "suspended") {
      this.sound.context.resume();
    }
  });

  // === BACKGROUND ===
  setupBackground(this);

  // === HERO ===
  setupHero(this);

  // === MODE SELECTION ===
  if (window.UI_MODE === "CITY_CLEAN") {
    setupCityCleanMode(this);
    return;
  }

  setupFullUIMode(this);
}
```

### Setup Functions

| Функция | Описание |
|---------|----------|
| `setupBackground(scene)` | Фоны города и локаций |
| `setupHero(scene)` | Spine герой + fallback |
| `setupCityCleanMode(scene)` | Минимальный UI режим |
| `setupFullUIMode(scene)` | Полный UI режим |
| `setupEventHandlers(scene)` | Обработчики событий |
| `setupCharacterCreation(scene)` | Создание персонажа |

---

## 🎭 Spine Animations (core/spineAnimations.js)

### Доступные функции

```javascript
heroIdle()           // idle loop
heroAttack()         // attack → idle (400ms)
heroHit()            // fall → idle (200ms)
heroDeath()          // fall (остаётся)
heroCriticalHit()    // jump → attack → idle
heroEnterLocation()  // run → idle (1000ms)
heroRun()            // run loop
heroWalk()           // walk loop
heroCrouch()         // crouch loop (rest)
heroJump()           // jump → idle
heroHeadTurn()       // head-turn → idle (random city animation)
moveHeroTo(x, y, anim) // Move + optional animation
hideHero()           // Hide hero sprite
```

### Анимации

| Анимация | Loop | Использование |
|----------|------|---------------|
| `idle` | Yes | Стоит |
| `attack` | No | Атака |
| `fall` | No | Урон / смерть |
| `crouch` | Yes | Отдых |
| `run` | Yes | Бежит |
| `walk` | Yes | Идёт |
| `jump` | No | Крит |
| `head-turn` | No | Случайный в городе |

---

## 🎛️ Bottom UI (ui/bottomUI.js)

### UI_LAYOUT Config

```javascript
const UI_LAYOUT = {
  container: { offsetY: 3 },  // from bottom (h + offset)
  panel: { scale: 0.574 },
  button: { x: 0, y: -214, scale: 0.54 },
  icons: {
    scale: 0.65,
    positions: [
      { x: 42, y: -68, scale: 0.65 },   // helmet
      { x: 17, y: -68, scale: 0.61 },   // anvil
      { x: -22, y: -71, scale: 0.65 },  // store
      { x: -41, y: -66, scale: 0.65 }   // map
    ]
  }
};
```

### createBottomUI()

```javascript
function createBottomUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  // Container (adaptive positioning)
  const panelContainer = scene.add.container(w / 2, h + UI_LAYOUT.container.offsetY);
  panelContainer.setDepth(200);
  panelContainer.setScrollFactor(0);

  // Panel
  const bottomPanel = scene.add.image(0, 0, 'ui_bottom');
  bottomPanel.setOrigin(0.5, 1);
  bottomPanel.setScale(UI_LAYOUT.panel.scale);
  panelContainer.add(bottomPanel);

  // Fight button
  const fightBtn = scene.add.image(btnCfg.x, btnCfg.y, 'ui_btn_fight');
  fightBtn.setScale(btnCfg.scale);
  panelContainer.add(fightBtn);

  // Icons
  const icons = iconsCfg.positions.map((pos, i) => {
    return scene.add.image(pos.x, pos.y, iconKeys[i])
      .setScale(pos.scale || iconsCfg.scale);
  });
  panelContainer.add(icons);

  return { bottomPanel, fightBtn, icons, container: panelContainer };
}
```

---

## 🔧 Tune Mode (ui/tuneMode.js)

### Описание

Режим визуального позиционирования UI элементов. Включается через `?tune` в URL.

### Использование

```
https://malyugin777.github.io/l2-phaser-rpg/src/?tune=1
```

### Управление

| Клавиша | Действие |
|---------|----------|
| 1 | Выбрать Background |
| 2 | Выбрать Panel |
| 3 | Выбрать Hero |
| 4 | Выбрать Fight Button |
| 5-8 | Выбрать Icons |
| Стрелки | Двигать выбранный элемент |
| Q/E | Масштабировать |
| Drag | Перетаскивать мышью |

### Кнопки

| Кнопка | Действие |
|--------|----------|
| SAVE | Сохранить в localStorage + clipboard |
| RESET | Сбросить все смещения |
| COPY | Скопировать JSON в clipboard |

### TUNE_VERSION

При изменении позиций в коде нужно обновить версию для сброса localStorage:

```javascript
const TUNE_VERSION = 'v12';  // Bump to clear localStorage
```

### API

```javascript
// Check if tune mode enabled
const TUNE_ENABLED = new URLSearchParams(window.location.search).has('tune');

// Get settings (defaults or localStorage in tune mode)
getTuneSettings()

// Initialize tune controls (only in tune mode)
initTuneMode(scene, cityBg, HERO_OFFSET)

// Apply tune settings
applyTuneSettings(scene, cityBg, HERO_OFFSET)
```

---

## 🧪 UI_MODE: Режимы отображения

### Флаг режима (game.js)

```javascript
const UI_MODE = "CITY_CLEAN"; // "LEGACY" | "CITY_CLEAN"
window.UI_MODE = UI_MODE;
```

### CITY_CLEAN Mode

Минимальный режим — фон + герой + нижняя панель:

```javascript
function setupCityCleanMode(scene) {
  if (window.preEntry?.skip) window.preEntry.skip();

  // Bottom UI
  if (typeof createBottomUI === "function") {
    const bottomUI = createBottomUI(scene);
    window.bottomUI = bottomUI;
  }

  // TUNE mode
  if (typeof initTuneMode === "function") {
    initTuneMode(scene, cityBg, HERO_OFFSET);
  }
  if (typeof applyTuneSettings === "function") {
    applyTuneSettings(scene, cityBg, HERO_OFFSET);
  }

  // Force linear filter on textures
  const LINEAR = Phaser.Textures.FilterMode.LINEAR;
  ["talkingisland_main", "ui_bottom", "ui_btn_fight", ...]
    .forEach(k => scene.textures.get(k)?.setFilter(LINEAR));
}
```

---

## 🎨 Depth слои

| Элемент | Depth | Описание |
|---------|-------|----------|
| cityBg | 10 | Фон города |
| locationBg | 10 | Фон локации |
| spineHero | 100 | Герой |
| panelContainer | 200 | UI контейнер |

---

## 🎨 UI Ассеты

### Bottom Panel (src/assets/ui/)

| Файл | Размер | Описание |
|------|--------|----------|
| bottom.png | 1408×768 | Основная панель |
| btn_fight_base.png | - | Красная кнопка боя |
| icon_helmet.png | - | Инвентарь |
| icon_anvil.png | - | Кузница |
| icon_store.png | - | Магазин |
| icon_map.png | - | Карта |

---

## 📅 История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0.0 | 14.12.2024 | PvE Арена, TMA Touch Fix |
| 1.0.1 | 14.12.2024 | fitBackground, gold buttons |
| 1.0.2 | 14.12.2024 | Spine setup, SpinePlugin CDN |
| 1.1.0 | 15.12.2024 | Spine анимации интегрированы |
| 1.1.1 | 15.12.2024 | Retina fix (zoom) |
| 1.2.0 | 15.12.2024 | Fullscreen + CITY_CLEAN mode |
| 1.3.0 | 16.12.2024 | GPU оптимизация + Bottom UI |
| 1.4.0 | 19.12.2024 | Tune Mode + Resolution эксперименты |
| 1.5.0 | 19.12.2024 | Фикс иконок + относительное позиционирование |
| 1.6.0 | 19.12.2024 | Container-based Adaptive UI |
| 1.7.0 | 19.12.2024 | **Modular Architecture** |
| | | - game.js: 2026 → 563 lines (-72%) |
| | | - New: core/config.js (Phaser config, scaling) |
| | | - New: core/spineAnimations.js (hero animations) |
| | | - New: ui/bottomUI.js (bottom panel) |
| | | - New: ui/tuneMode.js (visual positioning) |
| | | - Removed 200+ diagnostic console.logs |
| | | - Split create() into logical functions |
| | | - Clean, readable code structure |

---

## 🐛 Debug

### Консольные логи при загрузке

```
[Config] Module loaded
[SpineAnimations] Module loaded
[BottomUI] Module loaded
[TuneMode] Module loaded
GAMEJS BUILD: 2025-12-19-REFACTOR-FINAL
```

### Консольные команды

```javascript
// Сброс сейва
localStorage.clear(); location.reload();

// Переключить UI mode
window.UI_MODE = "LEGACY"; location.reload();

// Тест Spine
window.spineHero.play('attack', false);

// Проверка UI
window.bottomUI
window.panelContainer
window.cityBg
```

---

## ✅ Готово

- [x] Spine анимации
- [x] Retina support (DPR × size)
- [x] Fullscreen без чёрных полос
- [x] CITY_CLEAN mode
- [x] Antialias для мультяшки
- [x] GPU оптимизация (desktop)
- [x] Bottom UI панель
- [x] Tune Mode для позиционирования
- [x] Modular architecture
- [x] Clean code without diagnostics

## 📋 TODO

- [ ] Подключить bottom панель к логике (открытие панелей)
- [ ] Spine для врагов
- [ ] Эффекты ударов (particles)
- [ ] Звуки

---

## 🔴 ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### 1. Мыльная картинка (ЧАСТИЧНО РЕШЕНО)

**Проблема:** Phaser 3.80.1 игнорирует `resolution` config.

**Частичное решение:** `antialias: true` + LINEAR filter на текстурах.

### 2. Spine plugin несовместим с Phaser < 3.60

**Решение:** Остаёмся на Phaser 3.80.1
