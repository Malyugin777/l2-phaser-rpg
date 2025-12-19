# Pocket Lineage: Human Saga

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler в стиле Lineage 2
**Платформа:** Telegram Mini App (TMA)
**Движок:** Phaser 3.80.1 + SpinePlugin 4.1
**Язык:** Vanilla JavaScript (ES6, strict mode, глобальные переменные)
**Версия:** 1.6.0
**GitHub:** https://github.com/Malyugin777/l2-phaser-rpg
**GitHub Pages:** https://malyugin777.github.io/l2-phaser-rpg/src/
**Telegram:** @Poketlineage_bot

---

## 📱 TMA Platform

### Размеры экрана

| Параметр | Значение | Описание |
|----------|----------|----------|
| BASE_W | 780 | Базовая ширина игры |
| BASE_H | 1688 | Базовая высота игры |
| RESOLUTION | DPR | devicePixelRatio для ретина |

### Phaser Config (АКТУАЛЬНЫЙ v1.5.0!)

```javascript
const BASE_W = 780;
const BASE_H = 1688;
const RESOLUTION = window.devicePixelRatio || 1;

const config = {
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  resolution: RESOLUTION,
  parent: "game-container",
  backgroundColor: 0x0a0a12,
  fps: { target: 60, forceSetTimeOut: true },
  render: { antialias: true, antialiasGL: true, pixelArt: false, roundPixels: false },
  scale: { mode: Phaser.Scale.ENVELOP, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: { preload, create, update },
  plugins: {
    scene: [{ key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" }]
  }
};

// Sleep когда вкладка скрыта
document.addEventListener("visibilitychange", () => {
  if (document.hidden) game.loop.sleep();
  else game.loop.wake();
});
```

**Важные моменты:**
- **Фиксированный BASE:** 780×1688 для всех устройств
- **ENVELOP режим:** заполняет экран, может обрезать края
- **resolution: DPR** — качество для Retina
- `fps.target: 60` + `forceSetTimeOut` — стабильный FPS
- `visibilitychange` — экономия ресурсов при скрытой вкладке

### CSS (index.html)

```css
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #0a0a12;
  overflow: hidden;
}

#game-container {
  width: 100vw;
  height: 100vh;
  max-width: 430px;           /* ограничение для десктопа */
  margin: 0 auto;
  position: fixed;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  background: #0a0a12;
  overflow: hidden;
}

/* На мобиле — fullscreen */
@media (max-width: 520px) {
  #game-container {
    max-width: none;
    left: 0;
    transform: none;
  }
}

canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
  image-rendering: auto;
}
```

### Логические координаты в create()

```javascript
// Делим на DPR для одинаковой работы на всех устройствах
const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
const w = this.scale.width / dpr;   // 390
const h = this.scale.height / dpr;  // 844

// Позиционирование героя
heroStartX = w * 0.25;
heroStartY = h * 0.65;
spineHero.setScale(0.7);
```

---

## 🧪 UI_MODE: Режимы отображения

### Флаг режима (game.js)

```javascript
const UI_MODE = "CITY_CLEAN"; // "LEGACY" | "CITY_CLEAN"
window.UI_MODE = UI_MODE;
```

### CITY_CLEAN Mode

Минимальный режим — только фон + герой + FPS диагностика:

```javascript
if (window.UI_MODE === "CITY_CLEAN") {
  if (window.preEntry?.skip) window.preEntry.skip();

  // FPS счётчик для диагностики
  fpsText = this.add.text(10, 10, 'FPS: --', {
    fontSize: '16px',
    fill: '#00ff00',
    backgroundColor: '#000000'
  }).setDepth(9999).setScrollFactor(0);

  // Лог производительности
  console.log('[PERF] DPR:', window.devicePixelRatio);
  console.log('[PERF] Canvas:', this.game.canvas.width, 'x', this.game.canvas.height);
  console.log('[PERF] Textures loaded:', Object.keys(this.textures.list).length);
  console.log('[PERF] Children count:', this.children.list.length);

  return; // пропускаем весь UI
}
```

**uiLayout.js** также пропускает создание UI:
```javascript
function createGameUI(scene) {
  if (window.UI_MODE === "CITY_CLEAN") return;
  // ...
}
```

---

## 🎭 Spine Анимации

### Доступные анимации

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

### Функции анимаций

```javascript
heroIdle()           // idle loop
heroAttack()         // attack → idle (400ms)
heroHit()            // fall → idle (200ms)
heroDeath()          // fall (остаётся)
heroCriticalHit()    // jump → attack → idle
heroEnterLocation()  // run → idle (1000ms)
```

---

## 🐛 Debug

### Консольные логи при загрузке

```javascript
GAMEJS BUILD: 2025-12-19-ICONS-RELATIVE
[MOBCHK] BASE 780 1688 scale 780 1688 disp 390 844
[BOTTOMUI] Dimensions: w=780 h=1688
[BOTTOMUI] Game config: 780x1688
[BOTTOMUI] Icons: panelMidY=1475 iconY=1475 iconScale=0.0832 panelScale=0.2773
[UI] Panel aspect-correct: 780 x 426 aspect: 1.83
[ICON-DIAG] === FINAL ICON STATE ===
[ICON-DIAG] Canvas: 780 x 1688
[ICON-DIAG] Icon 0: { key: 'icon_helmet', pos: [310, 1475], visible: true, alpha: 1 }
```

### Консольные команды

```javascript
// Сброс сейва
localStorage.clear(); location.reload();

// Переключить UI mode
window.UI_MODE = "LEGACY"; location.reload();

// Тест Spine
window.spineHero.play('attack', false);
```

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
| 1.3.0 | 16.12.2024 | **GPU оптимизация + Bottom UI** |
| | | - Desktop: FIT mode, DPR=1, max-width 430px |
| | | - Mobile: ENVELOP fullscreen, DPR=2 |
| | | - GPU: 61% → ~5-10% на десктопе |
| | | - fps.target: 60 + forceSetTimeOut |
| | | - visibilitychange sleep/wake |
| | | - FPS счётчик в CITY_CLEAN mode |
| | | - Bottom панель UI (bottom.png) |
| | | - Кнопка боя + слоты иконок |
| 1.4.0 | 19.12.2024 | **Tune Mode + Resolution эксперименты** |
| | | - Tune Mode для визуального позиционирования UI |
| | | - HERO_BASE / FIGHTBTN_BASE константы |
| | | - localStorage сохранение настроек tune |
| | | - Эксперименты с Phaser 3.55.2 (откат) |
| | | - Попытки resample для качества (убрано) |
| 1.5.0 | 19.12.2024 | **Фикс иконок + относительное позиционирование** |
| | | - BASE_W=780, BASE_H=1688 фиксированные |
| | | - HERO_BASE: 300,1000,1.4 для нового разрешения |
| | | - Иконки теперь позиционируются ОТНОСИТЕЛЬНО панели |
| | | - Удалён код repositioning иконок из layoutUI() |
| | | - getTuneSettings() с hardcoded defaults |
| | | - Texture diagnostics и LINEAR filter для UI |
| 1.6.0 | 19.12.2024 | **Container-based Adaptive UI** |
| | | - UI в контейнере (panelContainer) - panel, button, icons |
| | | - HERO_OFFSET: адаптивное позиционирование (w/2 + x, h + y) |
| | | - UI_LAYOUT: конфиг всех UI элементов |
| | | - Индивидуальный scale для каждой иконки |
| | | - TUNE_VERSION для сброса localStorage |
| | | - Позиции адаптируются под разные экраны |

---

## 🏗️ Container-based Adaptive UI (v1.6.0)

### Архитектура

Все UI элементы находятся в контейнере `panelContainer`:
- **Container** позиционируется относительно низа экрана (h + offsetY)
- **Panel, Button, Icons** - дети контейнера с относительными координатами
- Позиции адаптируются под любой размер экрана

### Конфиг позиций (game.js)

```javascript
// Hero position (adaptive offsets from center/bottom)
// x: w/2 + offsetX, y: h + offsetY
const HERO_OFFSET = { x: -54, y: -196, scale: 1.23 };

// UI Layout config
const UI_LAYOUT = {
  container: { offsetY: 3 },  // from bottom (h + offset)
  panel: { scale: 0.574 },
  button: { x: 0, y: -214, scale: 0.54 },
  icons: {
    scale: 0.65,  // default scale
    positions: [
      { x: 42, y: -68, scale: 0.65 },   // helmet
      { x: 17, y: -68, scale: 0.61 },   // anvil (smaller)
      { x: -22, y: -71, scale: 0.65 },  // store
      { x: -41, y: -66, scale: 0.65 }   // map
    ]
  }
};

// Background position (center + offset)
cityBg.setScale(0.48);
cityBg.setPosition(w / 2 + 2, h / 2 + 168);
```

### Depth слои

| Элемент | Depth | Описание |
|---------|-------|----------|
| cityBg | 10 | Фон города |
| locationBg | 10 | Фон локации |
| spineHero | 100 | Герой |
| panelContainer | 200 | UI контейнер |

### TUNE_VERSION

При изменении позиций в коде, нужно обновить `TUNE_VERSION` чтобы сбросить старые localStorage настройки:

```javascript
const TUNE_VERSION = 'v12';  // Bump this to clear localStorage
```

---

## 🎛️ Tune Mode (v1.4.0)

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
| Q/E | Масштабировать (hero) |
| Drag | Перетаскивать мышью |

### Кнопки

| Кнопка | Действие |
|--------|----------|
| 💾 SAVE | Сохранить в localStorage + clipboard |
| 🔄 RESET | Сбросить все смещения |
| 📋 COPY | Скопировать JSON в clipboard |

### Константы (game.js)

```javascript
// Базовые позиции героя (для 780×1688)
const HERO_BASE = { x: 300, y: 1000, scale: 1.4 };

// Базовые позиции кнопки (захватываются при создании UI)
let FIGHTBTN_BASE = null; // { x, y, scale }

// Дефолтные настройки tune (hardcoded для production)
function getTuneSettings() {
  const defaults = {
    bgZoom: 0.95,
    bgPanX: 0,
    bgPanY: 238,
    panelX: 0,
    panelY: 0,
    panelScale: 1.0,
    heroX: 36,
    heroY: 477,
    heroScale: 1.77,
    btnX: -246,
    btnY: 4
  };
  if (!TUNE_ENABLED) return defaults;
  // В tune mode читаем из localStorage
  const saved = localStorage.getItem('TUNE_SETTINGS');
  if (saved) return { ...defaults, ...JSON.parse(saved) };
  return defaults;
}
```

### Формат настроек

```javascript
{
  bgZoom: 1.0, bgPanX: 0, bgPanY: 0,
  panelX: 0, panelY: 0, panelScale: 1.0,
  heroX: 0, heroY: 0, heroScale: 1.0,  // OFFSETS от HERO_BASE
  btnX: 0, btnY: 0,                     // OFFSETS от FIGHTBTN_BASE
  icon0X: 0, icon0Y: 0,
  icon1X: 0, icon1Y: 0,
  icon2X: 0, icon2Y: 0,
  icon3X: 0, icon3Y: 0
}
```

### Как работает позиционирование

```javascript
// Hero: base + offset
spineHero.x = HERO_BASE.x + tune.heroX;
spineHero.y = HERO_BASE.y + tune.heroY;
spineHero.setScale(HERO_BASE.scale * tune.heroScale);

// Button: base + offset
fightBtn.x = FIGHTBTN_BASE.x + tune.btnX;
fightBtn.y = FIGHTBTN_BASE.y + tune.btnY;
```

---

## 🔬 Эксперименты с качеством (19.12.2024)

### Проблема

Phaser 3.80.1 игнорирует `resolution` в config. Canvas всегда 390×844 независимо от DPR.
На Retina экранах (DPR=2) изображение выглядит мыльным.

### Попытка 1: Resample через RenderTexture

```javascript
function makeResampledBg(scene, srcKey, outKey, targetW, targetH) {
  const rt = scene.make.renderTexture({ width: targetW, height: targetH });
  rt.draw(srcKey, 0, 0);
  rt.saveTexture(outKey);
  rt.destroy();
  return outKey;
}
```

**Результат:** Текстуры получаются слишком маленькие (displayWidth × dprCap), качество плохое.

### Попытка 2: Resample 50% от оригинала

```javascript
const origTex = scene.textures.get("ui_bottom");
const origW = origTex.source[0].width;   // 1408
const targetW = Math.round(origW * 0.5); // 704
```

**Результат:** Качество лучше, но не идеально. Код усложняется.

### Попытка 3: Downgrade до Phaser 3.55.2

```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"></script>
```

**Результат:** `resolution` работает! Canvas становится 780×1688. НО Spine plugin несовместим - ошибки при загрузке.

### Итог

Остались на **Phaser 3.80.1**. Качество "как есть". Возможные решения:
- Ждать фикс в Phaser
- Использовать более крупные текстуры
- Canvas downscale через CSS (не помогает)

---

## ✅ Готово

- [x] Spine анимации
- [x] Retina support (DPR × size) - частично
- [x] Fullscreen без чёрных полос
- [x] CITY_CLEAN mode
- [x] Antialias для мультяшки
- [x] Логические координаты
- [x] GPU оптимизация (desktop)
- [x] FPS диагностика
- [x] Bottom UI панель
- [x] Tune Mode для позиционирования
- [x] localStorage сохранение tune настроек

## 📋 TODO

- [ ] Подключить bottom панель к логике (открытие панелей)
- [ ] Spine для врагов
- [ ] Эффекты ударов (particles)
- [ ] Звуки
- [ ] Найти решение для качества на Retina

---

## 🔴 ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### 1. Мыльная картинка (ЧАСТИЧНО РЕШЕНО)

**Проблема:** Phaser 3.80.1 игнорирует `resolution` config. Canvas всегда 390×844.

**Частичное решение:** `antialias: true` немного помогает.

**Не работает:**
- `resolution: devicePixelRatio` - игнорируется в 3.80.1
- `renderer.resize(w, h, dpr)` - не влияет на качество
- Resample через RenderTexture - слишком сложно, не идеально

### 2. Чёрные полосы (РЕШЕНО)

**Решение:** CSS `max-width: none`, `left: 0`, `overflow: hidden`

### 3. iOS дробный DPR

**Решение:** `Math.round(devicePixelRatio)`

### 4. GPU перегрузка на десктопе (РЕШЕНО)

**Проблема:** ENVELOP на горизонтальном экране раздувал canvas до 1707×3694 → GPU 61%

**Решение:**
- Desktop: FIT mode + DPR=1 + max-width 430px
- Mobile: ENVELOP fullscreen + DPR=2

### 5. Spine plugin несовместим с Phaser < 3.60

**Проблема:** SpinePlugin 4.1 требует Phaser 3.60+. На 3.55.2 ошибки загрузки.

**Решение:** Остаёмся на Phaser 3.80.1

### 6. Иконки не видны (РЕШЕНО в v1.5.0)

**Проблема:** Иконки были захардкожены на y=1640 (для 1688px), но `scene.scale.height` может вернуть другое значение. На некоторых устройствах иконки оказывались за пределами экрана.

**Решение:** Иконки позиционируются **относительно панели**:
```javascript
const panelMidY = h - panelHeight / 2;
const iconY = panelMidY;  // Вертикальный центр панели
```

**Также исправлено:**
- Удалён код в `layoutUI()` который переопределял позиции иконок
- Добавлены диагностические логи `[BOTTOMUI]` и `[ICON-DIAG]`

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
| slot_empty.png | - | Пустой слот |

### createBottomUI() (game.js) - v1.6.0

```javascript
function createBottomUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  // === CONTAINER (adaptive: center-X, bottom + offset) ===
  const panelContainer = scene.add.container(
    w / 2,
    h + UI_LAYOUT.container.offsetY
  );
  panelContainer.setDepth(200);
  panelContainer.setScrollFactor(0);

  // === PANEL (relative to container) ===
  const bottomPanel = scene.add.image(0, 0, 'ui_bottom');
  bottomPanel.setOrigin(0.5, 1);  // Draws UP from container
  bottomPanel.setScale(UI_LAYOUT.panel.scale);
  panelContainer.add(bottomPanel);

  // === FIGHT BUTTON (relative to container) ===
  const btnCfg = UI_LAYOUT.button;
  const fightBtn = scene.add.image(btnCfg.x, btnCfg.y, 'ui_btn_fight');
  fightBtn.setScale(btnCfg.scale);
  fightBtn.setInteractive({ useHandCursor: true });
  panelContainer.add(fightBtn);

  // === ICONS (relative to container, individual scales) ===
  const iconsCfg = UI_LAYOUT.icons;
  const iconKeys = ['icon_helmet', 'icon_anvil', 'icon_store', 'icon_map'];
  const icons = iconsCfg.positions.map((pos, i) => {
    return scene.add.image(pos.x, pos.y, iconKeys[i])
      .setScale(pos.scale || iconsCfg.scale)  // individual or default
      .setInteractive();
  });
  panelContainer.add(icons);

  window.panelContainer = panelContainer;
  return { bottomPanel, fightBtn, icons, container: panelContainer };
}
```

**Важно:**
- Все UI элементы - дети контейнера с относительными координатами
- Container позиционируется адаптивно: `(w/2, h + offsetY)`
- Каждая иконка может иметь индивидуальный scale
