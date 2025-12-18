# Pocket Lineage: Human Saga

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler в стиле Lineage 2
**Платформа:** Telegram Mini App (TMA)
**Движок:** Phaser 3.80.1 + SpinePlugin 4.1
**Язык:** Vanilla JavaScript (ES6, strict mode, глобальные переменные)
**Версия:** 1.3.0
**GitHub:** https://github.com/Malyugin777/l2-phaser-rpg
**GitHub Pages:** https://malyugin777.github.io/l2-phaser-rpg/src/
**Telegram:** @Poketlineage_bot

---

## 📱 TMA Platform

### Размеры экрана

| Параметр | Значение | Описание |
|----------|----------|----------|
| UI_WIDTH | 390 | Логическая ширина |
| UI_HEIGHT | 844 | Логическая высота |
| Canvas | 780×1688 | При DPR=2 |

### Phaser Config (АКТУАЛЬНЫЙ!)

```javascript
const isMobile = window.matchMedia("(max-width: 520px)").matches;

// На десктопе DPR=1 (иначе GPU перегрузка)
const _dpr = isMobile
  ? Math.max(1, Math.round(window.devicePixelRatio || 1))
  : 1;

const config = {
  type: Phaser.AUTO,
  width: 390 * _dpr,   // 780 при DPR=2 (мобиль), 390 (десктоп)
  height: 844 * _dpr,  // 1688 при DPR=2 (мобиль), 844 (десктоп)
  parent: "game-container",
  backgroundColor: 0x0a0a12,
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  scale: {
    mode: isMobile ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
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
- **Мобиль (<520px):** ENVELOP fullscreen, DPR=2 (ретина)
- **Десктоп:** FIT в рамке 430px, DPR=1 (GPU ~5-10% вместо 61%)
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
GAMEJS BUILD: 2025-12-15-RETINA-FIX
[Render] DPR: 2
[Render] Config size: 780 x 1688
[Render] Canvas size: 780 x 1688
[Render] Antialias: true
[Scale] mode: 3 expected ENVELOP= 3
[Scale] parent size: 390 x 844
[Scale] Canvas CSS: 390 x 844
[Spine] Hero created at: 97.5 548.6 scale: 0.7
[UI] NUKE mode: only bg + hero visible
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

---

## 🎛️ Tune Mode (v1.4.0)

### Описание

Режим визуального позиционирования UI элементов. Включается через `?tune=1` в URL.

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
// Базовые позиции героя (фиксированные)
const HERO_BASE = { x: 150, y: 500, scale: 0.7 };

// Базовые позиции кнопки (захватываются при создании UI)
let FIGHTBTN_BASE = null; // { x, y, scale }
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

### createBottomUI() (game.js)

```javascript
function createBottomUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const panelScale = w / 1408;  // ≈ 0.277

  const bottomPanel = scene.add.image(w / 2, h, 'ui_bottom')
    .setOrigin(0.5, 1)
    .setDepth(100)
    .setScale(panelScale);

  const fightBtn = scene.add.image(fightBtnX, fightBtnY, 'ui_btn_fight')
    .setDepth(110)
    .setScale(panelScale * 1.2)
    .setInteractive({ useHandCursor: true });

  // Пульсация кнопки боя
  scene.tweens.add({
    targets: fightBtn,
    scale: panelScale * 1.25,
    yoyo: true,
    repeat: -1,
    duration: 800,
    ease: 'Sine.easeInOut'
  });
}
```
