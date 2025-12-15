# Pocket Lineage: Human Saga

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler в стиле Lineage 2
**Платформа:** Telegram Mini App (TMA)
**Движок:** Phaser 3.80.1 + SpinePlugin 4.1
**Язык:** Vanilla JavaScript (ES6, strict mode, глобальные переменные)
**Версия:** 1.2.0
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
const _dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));

const config = {
  type: Phaser.AUTO,
  width: 390 * _dpr,   // 780 при DPR=2
  height: 844 * _dpr,  // 1688 при DPR=2
  parent: "game-container",
  backgroundColor: 0x0a0a12,

  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },

  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  scene: { preload, create, update },
  plugins: {
    scene: [{ key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" }]
  }
};
```

**Важные моменты:**
- `Math.round(_dpr)` — iOS отдаёт дробные значения (2.000000596)
- `ENVELOP` — заполняет весь экран без чёрных полос
- `antialias: true` — сглаживание для мультяшной графики

### CSS Fullscreen (index.html)

```css
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #0a0a12;
  overflow: hidden;  /* убрать скролл на iOS */
}

#game-container {
  width: 100vw;
  height: 100vh;
  max-width: none;
  margin: 0;
  position: fixed;
  left: 0;
  top: 0;
  background: #0a0a12;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
  image-rendering: auto;  /* НЕ crisp-edges для мультяшки */
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

### CITY_CLEAN Mode (NUKE)

Скрывает ВСЁ кроме фона и героя:

```javascript
if (window.UI_MODE === "CITY_CLEAN") {
  const keep = new Set([window.cityBg, window.spineHero]);

  const nukeUI = () => {
    this.children.list.forEach((obj) => {
      if (!obj || keep.has(obj)) return;
      obj.setVisible(false);
      if (obj.disableInteractive) obj.disableInteractive();
    });
  };

  nukeUI();
  this.time.addEvent({ delay: 50, repeat: 100, callback: nukeUI });

  window.cityBg?.setDepth(-1000);
  window.spineHero?.setDepth(1000);
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
| 1.2.0 | 15.12.2024 | **Fullscreen + CITY_CLEAN mode** |
| | | - ENVELOP scale mode |
| | | - Rounded DPR для iOS |
| | | - CSS fullscreen (no black borders) |
| | | - antialias: true (не pixelArt) |
| | | - UI_MODE флаг |
| | | - NUKE mode для чистого города |
| | | - Логические координаты (w/dpr) |
| | | - Hero scale 0.7, position 25%×65% |

---

## ✅ Готово

- [x] Spine анимации
- [x] Retina support (DPR × size)
- [x] Fullscreen без чёрных полос
- [x] CITY_CLEAN mode
- [x] Antialias для мультяшки
- [x] Логические координаты

## 📋 TODO

- [ ] Пересохранить фоны в WebP
- [ ] Spine для врагов
- [ ] Эффекты ударов (particles)
- [ ] Звуки

---

## 🔴 ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### 1. Мыльная картинка (РЕШЕНО)

**Решение:** `width * DPR` + `ENVELOP` + `antialias: true`

### 2. Чёрные полосы (РЕШЕНО)

**Решение:** CSS `max-width: none`, `left: 0`, `overflow: hidden`

### 3. iOS дробный DPR

**Решение:** `Math.round(devicePixelRatio)`
