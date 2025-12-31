# Pocket Lineage: Human Saga

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler в стиле Lineage 2
**Платформа:** Telegram Mini App (TMA)
**Движок:** Phaser 3.80.1 + SpinePlugin 4.1
**Язык:** Vanilla JavaScript (ES6, strict mode, модульная архитектура)
**Версия:** 1.9.0
**GitHub:** https://github.com/Malyugin777/l2-phaser-rpg
**GitHub Pages:** https://malyugin777.github.io/l2-phaser-rpg/src/
**Telegram:** @Poketlineage_bot

---

## 🏗️ Архитектура проекта (v1.8.0)

### Структура файлов

```
src/
├── arena/
│   └── arenaScene.js       # PvP Arena scene (1160 lines) ⭐ NEW
├── core/
│   ├── config.js           # Phaser config, scaling, viewport
│   └── spineAnimations.js  # Hero animations
├── state/
│   ├── heroState.js        # Hero data (central hub)
│   ├── combatSystem.js     # Combat logic
│   ├── skillSystem.js      # Skills & buffs
│   ├── tickSystem.js       # Game tick & regen
│   ├── worldState.js       # World/location data
│   ├── itemSystem.js       # Items & equipment
│   ├── saveSystem.js       # Save/load
│   ├── statSystem.js       # Stats calculation
│   ├── locationSystem.js   # Locations
│   ├── forgeSystem.js      # Crafting
│   ├── arenaSystem.js      # Arena logic
│   ├── progressionSystem.js# Offline progress
│   ├── uiLayout.js         # UI layout
│   └── ... (18 more systems)
├── ui/
│   ├── bottomUI.js         # Bottom panel UI
│   ├── tuneMode.js         # Visual positioning tool
│   ├── inventoryPanel.js   # Inventory panel
│   ├── statsPanel.js       # Stats panel
│   ├── forgePanel.js       # Forge panel
│   ├── arenaPanel.js       # Arena UI panel
│   └── ... (6 more panels)
├── game.js                 # Main game logic
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

## 🎭 Spine: Boy_1 (v1.9.0)

### Файлы

```
src/assets/spine-main/
├── Boy_1.json      # Skeleton data
├── Boy_1.atlas     # Texture atlas
└── Boy_1.png       # Texture
```

### Анимации Boy_1

| Анимация | Loop | Описание |
|----------|------|----------|
| `idle` | Yes | Стоит |
| `attack` | No | Удар кулаком (одной рукой) |
| `attack_sword` | No | Удар мечом (двуручный) |

### Загрузка (game.js)

```javascript
this.load.spine('hero', 'assets/spine-main/Boy_1.json', 'assets/spine-main/Boy_1.atlas');
```

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
| 1.8.0 | 23.12.2024 | **Arena Phase 1** |
| | | - New: arena/arenaScene.js (1160 lines) |
| | | - 2-part BG (2×2048×2048) для мобильных GPU |
| | | - Cinematic camera: zoom 1.2 → 0.86 |
| | | - Arena Tune Mode (?arena_tune=1) |
| | | - State machine: INTRO → RUN_IN → FIGHT |
| | | - Smooth lerp camera + clamp to BG |
| 1.9.0 | 31.12.2024 | **Boy_1 Spine + Arena Combat** |
| | | - Replaced hero spine with Boy_1 (spine-main/) |
| | | - Boy_1 animations: idle, attack, attack_sword |
| | | - Hero in city: x:328 y:1453 scale:0.37 |
| | | - Hero hidden until positioned (no flash) |
| | | - Arena fighters: scale 0.38 |
| | | - Arena animation speed: 0.75x (natural) |
| | | - Arena attack speed: 800ms (animation completes) |
| | | - F key: pause/resume arena (works everywhere) |
| | | - A/D keys: pan camera when paused |
| | | - Enemy mirrored (facing player) |

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

## ⚔️ Arena Scene (v1.8.0)

### Описание

PvP Арена — отдельная боевая сцена с кинематографической камерой.

### Финальные значения Phase 1

```
═══════════════════════════════════════
ARENA v1.9.0 - ФИНАЛЬНЫЕ ЗНАЧЕНИЯ
═══════════════════════════════════════

BG: x:0, y:5, scale:0.96
Ground: 88% (1485px)
Player: x:26%, scale:0.38 (Boy_1)
Enemy: x:73%, scale:-0.38 (mirrored)

Camera:
  startZoom: 1.2 (интро на игроке)
  endZoom: 0.86 (бой, без черных полос)

Combat:
  animationSpeed: 0.75x
  attackSpeed: 800ms (default)

World: 4095px (5.25 экранов)
BG: 2 части по 2048×2048

═══════════════════════════════════════
```

### ARENA_CONFIG (arenaScene.js)

```javascript
const ARENA_CONFIG = {
  worldMultiplier: 5.25,

  // Positions (v1.9.0)
  groundY: 0.88,           // 88% от высоты экрана
  fighterScale: 0.38,      // Boy_1 scale
  playerSpawnX: 0.26,      // 26% от ширины мира
  enemySpawnX: 0.73,       // 73% от ширины мира
  bgOffsetX: 0,
  bgOffsetY: 5,
  bgScale: 0.96,

  // Combat
  fightOffset: 180,        // Расстояние между бойцами
  engageDistance: 420,     // Триггер для ENGAGE
  runSpeed: 2500,          // Время пробежки (ms)

  // Camera
  camera: {
    lerpSpeed: 0.06,
    startZoom: 1.2,        // Крупный план на игроке
    endZoom: 0.86,         // Боевой вид
    zoomLerpSpeed: 0.02
  }
};

// Animation (v1.9.0)
const BASE_ANIM_SPEED = 0.75;  // Natural fist animation
const DEFAULT_ATTACK_SPEED = 800;  // ms between attacks
```

### Состояния арены (arenaState)

| State | Описание |
|-------|----------|
| NONE | Арена не активна |
| INTRO | Показ VS экрана |
| TUNING | Tune mode (ждёт SPACE) |
| INTRO_PLAYER | Камера на игроке |
| INTRO_ENEMY | Камера панорамирует к врагу |
| READY | Камера по центру, пауза |
| RUN_IN | Бойцы бегут + zoom out |
| ENGAGE | Остановка, переход в бой |
| FIGHT | Бой |

### Кинематика

1. **Start**: Камера zoom 1.2 на игроке
2. **INTRO_PLAYER**: Показ игрока (1000ms)
3. **INTRO_ENEMY**: Панорама к врагу (600ms + 800ms)
4. **READY**: Камера по центру (300ms)
5. **RUN_IN**: Бойцы бегут, zoom плавно 1.2 → 0.86
6. **ENGAGE**: Камера фиксируется на центре боя

### 2-Part Background

```javascript
// Мобильные GPU: max texture 4096px
// Решение: 2 части по 2048×2048

// LEFT part (0 to 2048)
arenaBgLeft = scene.add.image(bgX, bgY, 'arena_village_left');
arenaBgLeft.setOrigin(0, 0);
arenaBgLeft.setScale(bgScale);

// RIGHT part - overlap 1px для скрытия шва
arenaBgRight = scene.add.image(bgX + 2048 * bgScale - 1, bgY, 'arena_village_right');
```

### Arena Tune Mode

```
URL: ?arena_tune=1

Управление (tune mode):
- 1-5: Выбор элемента (bg, ground, player, enemy, fight)
- Drag: Перетаскивание бойцов
- RMB: Панорама камеры
- Q/E: Масштаб
- A/D: Камера влево/вправо
- Z/X: Zoom
- F: Запуск боя / пауза / продолжить
- R: Сброс позиций
- S: Сохранить

Управление (обычный режим):
- F: Пауза / продолжить бой
- A/D: Камера влево/вправо (только на паузе)
```

### API

```javascript
window.startArena(scene, enemyData)  // Запуск арены
window.exitArena(scene)              // Выход из арены
window.updateArena(scene)            // Вызывать в update()
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
- [x] **Arena Phase 1** - кинематика, zoom, 2-part BG

## 📋 TODO

- [x] ~~Arena Phase 2: боевая логика~~ (v1.9.0)
- [x] ~~Spine для врагов в арене~~ (Boy_1)
- [ ] Улучшить анимацию атаки (двуручная?)
- [ ] Эффекты ударов (particles)
- [ ] Звуки боя
- [ ] Привязать attackSpeed к системе статов

---

## 📊 Анализ State файлов (25 файлов)

### Tier 1: Core (используются активно)

| Файл | Строк | Назначение |
|------|-------|------------|
| heroState.js | 442 | Центральный хаб данных |
| combatSystem.js | 450+ | PvE боевая механика |
| skillSystem.js | 351 | Скиллы, поты, баффы |
| tickSystem.js | 250+ | Tick/regen система |
| worldState.js | 444 | Локации, мобы |
| uiLayout.js | 600+ | UI позиционирование |
| saveSystem.js | 176 | Сохранение |

### Tier 2: Systems (нужны для геймплея)

| Файл | Строк | Назначение |
|------|-------|------------|
| progressionSystem.js | 214 | Офлайн прогресс |
| statSystem.js | 207 | Расчет статов |
| forgeSystem.js | 266 | Крафт/энчант |
| itemSystem.js | 237 | Экипировка |
| locationSystem.js | 264 | Смена локаций |
| arenaSystem.js | 200+ | Арена логика |
| runnerBattle.js | 600+ | Runner mode (прототип?) |

### Tier 3: Features (второстепенные)

| Файл | Строк | Назначение |
|------|-------|------------|
| autoHuntSystem.js | 151 | Авто-охота |
| professionSystem.js | 293 | Классы |
| restSystem.js | 183 | Отдых/shots |
| mercenarySystem.js | 78 | Наёмник |
| petSystem.js | 177 | Питомец волк |
| economySystem.js | 196 | Магазин/квесты |
| dungeonSystem.js | 69 | Подземелья |

### Tier 4: Minimal/Legacy (кандидаты на удаление)

| Файл | Строк | Статус |
|------|-------|--------|
| uiSystem.js | 48 | ⚠️ Заменён uiLayout.js |
| uiConstants.js | 58 | Константы UI |
| spSystem.js | 39 | SP hook |
| overdriveSystem.js | 63 | Overdrive механика |

### 🧹 Рекомендации по чистке

**Можно удалить/объединить:**

1. **uiSystem.js** (48 строк) → перенести в uiLayout.js
   - Содержит только label-функции: `getHeroStatsLabel()`, `getGoldLabel()` и т.д.

2. **runnerBattle.js** (600+ строк) → оценить использование
   - Альтернативный режим игры
   - Если не используется — удалить

**Дублирование функционала:**

- Stance management: tickSystem.js + restSystem.js
- Potion usage: skillSystem.js + autoHuntSystem.js
- Text spawning: разбросан по 5+ файлам

**Legacy код:**

- restSystem.js — disabled UI code
- mercenarySystem.js — внешняя зависимость `mercAttackEnemy()`

---

## 🔴 ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### 1. Мыльная картинка (ЧАСТИЧНО РЕШЕНО)

**Проблема:** Phaser 3.80.1 игнорирует `resolution` config.

**Частичное решение:** `antialias: true` + LINEAR filter на текстурах.

### 2. Spine plugin несовместим с Phaser < 3.60

**Решение:** Остаёмся на Phaser 3.80.1
