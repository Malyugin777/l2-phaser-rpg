# Pocket Lineage: Human Saga

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler в стиле Lineage 2
**Платформа:** Telegram Mini App (TMA)
**Движок:** Phaser 3.80.1 + SpinePlugin 4.1
**Язык:** Vanilla JavaScript (ES6, strict mode, глобальные переменные)
**Версия:** 1.1.0
**GitHub:** https://github.com/Malyugin777/l2-phaser-rpg
**GitHub Pages:** https://malyugin777.github.io/l2-phaser-rpg/src/
**Telegram:** @Poketlineage_bot

---

## 📱 TMA Platform

### Размеры экрана

| Параметр | Значение | Описание |
|----------|----------|----------|
| UI_WIDTH | 390 | Ширина игры |
| UI_HEIGHT | 844 | Высота игры |
| SAFE_TOP | 67px (8%) | Отступ под шапку Telegram |
| SAFE_BOTTOM | 84px (10%) | Отступ под жесты/кнопку |
| SAFE_LEFT/RIGHT | 16px (4%) | Боковые отступы |

### Phaser Config (АКТУАЛЬНЫЙ!)

```javascript
const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: "game-container",
  backgroundColor: 0x0a0a12,
  resolution: window.devicePixelRatio || 1,  // ВАЖНО для Retina!
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 360, height: 640 },
    max: { width: 430, height: 932 }
  },
  scene: { preload, create, update },
  plugins: {
    scene: [
      { key: 'SpinePlugin', plugin: window.SpinePlugin, mapping: 'spine' }
    ]
  }
};
```

### CSS для чёткого рендера (index.html)

```css
canvas {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
```

---

## 🎭 Spine Анимации (НОВОЕ!)

### Доступные анимации в hero.json

| Анимация | Loop | Использование |
|----------|------|---------------|
| `idle` | Yes | Стоит (город, локация) |
| `attack` | No | Атака |
| `fall` | No | Получение урона / смерть |
| `crouch` | Yes | Сидит (отдых) |
| `run` | Yes | Бежит |
| `walk` | Yes | Идёт |
| `jump` | No | Прыжок (крит) |
| `head-turn` | No | Поворот головы (случайный в городе) |

### Функции анимаций (game.js)

```javascript
// Базовая функция
function playAnim(animName, loop) {
  if (!window.spineHero) return false;
  try {
    window.spineHero.play(animName, loop);
    return true;
  } catch(e) { return false; }
}

// Готовые функции
heroIdle()           // idle loop
heroAttack()         // attack → idle (400ms)
heroHit()            // fall → idle (200ms)
heroDeath()          // fall (остаётся)
heroRun()            // run loop
heroWalk()           // walk loop
heroCrouch()         // crouch loop (отдых)
heroJump()           // jump → idle (500ms)
heroCriticalHit()    // jump → attack → idle
heroEnterLocation()  // run → idle (1000ms)
heroHeadTurn()       // head-turn → idle (1500ms)
```

### Интеграция анимаций

| Файл | Событие | Анимация |
|------|---------|----------|
| combatSystem.js | Обычная атака | `heroAttack()` |
| combatSystem.js | Критический удар | `heroCriticalHit()` |
| combatSystem.js | Использование скилла | `heroCriticalHit()` |
| combatSystem.js | Получение урона | `heroHit()` |
| combatSystem.js | Смерть героя | `heroDeath()` |
| tickSystem.js | Сесть (sitDown) | `heroCrouch()` |
| tickSystem.js | Встать (standUp) | `heroIdle()` |
| locationSystem.js | Вход в город | `heroIdle()` |
| locationSystem.js | Вход в локацию | `heroEnterLocation()` |
| arenaSystem.js | Атака на арене | `heroAttack()` |
| arenaSystem.js | Урон на арене | `heroHit()` |

### Случайные анимации в городе (tickSystem.js)

```javascript
// Каждые 5 сек, 10% шанс head-turn
const CITY_ANIM_INTERVAL_MS = 5000;
const CITY_ANIM_CHANCE = 0.1;
```

---

## 🖼️ Ассеты

### Backgrounds (src/assets/backgrounds/)

| Файл | Формат | Размер | Использование |
|------|--------|--------|---------------|
| talking_island.webp | WebP | 1080×1935 | Город (cityBg) |
| obelisk_of_victory.png | PNG | - | Локация 0 |
| northern_territory.png | PNG | - | Локация 1 |
| elven_ruins.png | PNG | - | Локация 2 |
| orc_barracks.png | PNG | - | Локация 3 |

### UI (src/assets/ui/)

| Файл | Формат | Использование |
|------|--------|---------------|
| Bottom_panel.webp | WebP | Нижняя UI панель |
| map_world.png | PNG | Карта телепорта |

### Spine (src/assets/spine/)

| Файл | Описание |
|------|----------|
| hero.json | Skeleton data |
| hero.atlas | Atlas |
| hero.png | Texture |

### Загрузка ассетов (preload)

```javascript
// Фоны
this.load.image("talkingisland_main", "assets/backgrounds/talking_island.webp");
this.load.image("obelisk_of_victory", "assets/backgrounds/obelisk_of_victory.png");
// ...

// UI
this.load.image("ui_bottom_panel", "assets/ui/Bottom_panel.webp");
this.load.image("map_world", "assets/ui/map_world.png");

// Spine
this.load.spine('hero', 'assets/spine/hero.json', 'assets/spine/hero.atlas');
```

---

## 🎨 UI Layout

### Bottom Panel (create)

```javascript
uiBottomPanel = this.add.image(w / 2, h, "ui_bottom_panel");
uiBottomPanel.setOrigin(0.5, 1);           // Привязка к низу
uiBottomPanel.setScale(w / uiBottomPanel.width); // Fit width
uiBottomPanel.setDepth(100);               // Поверх фона
uiBottomPanel.setScrollFactor(0);          // Фиксированная
uiBottomPanel.setAlpha(0.92);              // Чуть прозрачнее
```

### fitBackground (cover mode)

```javascript
function fitBackground(bg, scene) {
  if (!bg || !scene) return;
  var w = scene.scale.width;
  var h = scene.scale.height;
  var scale = Math.max(w / bg.width, h / bg.height);
  bg.setScale(scale);
  bg.setPosition(w / 2, h / 2);
  bg.setOrigin(0.5, 0.5);
  bg.setScrollFactor(0);
}
```

---

## ⚔️ Combat System

### Эфир и Soulshots (ВАЖНО!)

**Правильная логика:**
- Эфир тратится ТОЛЬКО на Soulshots
- Soulshots — опциональное усиление (+100% fighter / +50% mystic)
- Без эфира — обычные атаки работают
- Бой НИКОГДА не останавливается из-за эфира

```javascript
// restSystem.js - useShotIfEnabled()
function useShotIfEnabled() {
  if (arch === "fighter" && buffs.soulshotsOn && wallet.ether > 0) {
    wallet.ether -= 1;
    return { used: true, multiplier: 2.0 };  // +100%
  }
  if (arch === "mystic" && buffs.spiritshotsOn && wallet.ether > 0) {
    wallet.ether -= 1;
    return { used: true, multiplier: 1.5 };  // +50%
  }
  return { used: false, multiplier: 1.0 };   // Обычная атака
}
```

### Авто-охота

- Сессия ограничена по времени (AUTO_HUNT_DURATION_MS)
- По окончании показывается лагерь "Сессия окончена"
- НЕ связано с эфиром!

---

## 🏟️ PvE Арена

### Spine интеграция

```javascript
// createArenaUI() - Герой на арене
if (window.spineHero) {
  window.spineHero.setPosition(120, h/2 + 50);
  window.spineHero.setVisible(true);
  window.spineHero.setDepth(151);
  heroIdle();
  arenaMyChar = window.spineHero;
}

// arenaBattleStep() - Анимации боя
if (arenaMyTurn) {
  heroAttack();  // Мой ход
} else {
  heroHit();     // Враг бьёт меня
}
```

---

## 🐛 Debug

### Проверка качества рендера (консоль)

```javascript
// Автоматически выводится при загрузке:
[Render] DPR: 2
[Render] Game resolution: 2
[Render] Canvas real size: 780 x 1688
[Render] BG original size: 1080 x 1935
[Render] BG scale: 0.87
[Render] Scale size: 390 x 844
```

**Если resolution = 1 при DPR > 1 — проблема с кэшем!**

### Консольные команды

```javascript
// Сброс сейва
localStorage.clear(); location.reload();

// Тест профессий
stats.level = 20; updateHeroUI();

// Тест арены
arenaState.energy = 30;

// Дать ресурсы
wallet.gold = 10000;
wallet.ether = 100;
resources.ore = 100;

// Тест Spine
window.spineHero.play('attack', false);
```

---

## 📁 Архитектура проекта

```
src/
├── index.html              # Точка входа + CSS crisp-edges
├── preEntry.css            # Loader стили
├── preEntry.js             # Loader + Intro
├── game.js                 # Phaser main + Spine анимации
│
├── state/
│   ├── uiConstants.js      # UI константы
│   ├── heroState.js        # Данные героя
│   ├── combatSystem.js     # Бой + анимации атаки/урона
│   ├── locationSystem.js   # Город ↔ локация + Spine позиция
│   ├── tickSystem.js       # Реген + случайные анимации
│   ├── restSystem.js       # Отдых + Soulshots
│   ├── arenaSystem.js      # Арена + Spine интеграция
│   └── ...
│
├── ui/
│   └── ...
│
└── assets/
    ├── backgrounds/
    │   └── talking_island.webp  # Новый город 1080×1935
    ├── ui/
    │   └── Bottom_panel.webp    # Нижняя панель
    └── spine/
        ├── hero.json
        ├── hero.atlas
        └── hero.png
```

---

## 📅 История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0.0 | 14.12.2024 | PvE Арена, TMA Touch Fix |
| 1.0.1 | 14.12.2024 | fitBackground, gold buttons |
| 1.0.2 | 14.12.2024 | Spine setup, SpinePlugin CDN |
| 1.1.0 | 15.12.2024 | **Spine анимации полностью интегрированы** |
| | | - Все анимации: idle, attack, hit, death, crouch, run, walk, jump |
| | | - Интеграция в combat, arena, rest, location transitions |
| | | - Случайный head-turn в городе |
| | | - Новый фон talking_island.webp (1080×1935) |
| | | - Bottom UI panel (Bottom_panel.webp) |
| | | - resolution: devicePixelRatio для Retina |
| | | - CSS crisp-edges |
| | | - Fix эфир логики (бой не останавливается) |

---

## ✅ Готово

- [x] Spine анимации (все 12 функций)
- [x] Интеграция в бой (атака, крит, урон, смерть)
- [x] Интеграция в арену (Spine вместо квадрата)
- [x] Интеграция в отдых (crouch/idle)
- [x] Случайные анимации в городе
- [x] Новый фон города (WebP, 1080×1935)
- [x] Bottom UI panel
- [x] Retina support (devicePixelRatio)
- [x] CSS crisp-edges
- [x] Правильная логика эфира

## 📋 TODO

- [ ] Пересохранить остальные фоны в WebP quality 90
- [ ] Spine для врагов
- [ ] Эффекты ударов (particles)
- [ ] Звуки для анимаций

---

## 🔴 ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### 1. Мыльная картинка

**Причина:** Кэш браузера/Telegram

**Решение:**
1. Очистить кэш браузера
2. Закрыть и открыть Telegram
3. Проверить консоль: `[Render] Game resolution: X` должен равняться DPR

### 2. Spine не загружается

**Проверить:**
- SpinePlugin CDN: `phaser@3.80.1/plugins/spine4.1/dist/SpinePlugin.js`
- Файлы в assets/spine/: hero.json, hero.atlas, hero.png
- Консоль: `[Spine] Hero created successfully`
