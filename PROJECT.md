# Pocket Lineage: Human Saga

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler в стиле Lineage 2
**Платформа:** Telegram Mini App (TMA)
**Движок:** Phaser 3.80.1 + SpinePlugin 4.1
**Язык:** Vanilla JavaScript (ES6, strict mode, модульная архитектура)
**Версия:** 2.0.0
**GitHub:** https://github.com/Malyugin777/l2-phaser-rpg
**GitHub Pages:** https://malyugin777.github.io/l2-phaser-rpg/src/
**Telegram:** @Poketlineage_bot

---

## 🏗️ Архитектура проекта (v2.0.0)

### Структура файлов

```
src/
├── arena/
│   ├── arenaScene.js      # Arena scene rendering, camera, effects (~1800 lines)
│   ├── arenaCombat.js     # Combat logic, damage, timing (189 lines)
│   ├── arenaState.js      # Arena state management (132 lines)
│   └── arenaUI.js         # HP bars, timer UI (272 lines)
├── core/
│   ├── config.js          # Phaser config, scaling, viewport
│   ├── spineAnimations.js # Hero animations
│   └── stats/
│       ├── attributes.js  # Stat attributes
│       ├── formulas.js    # Damage formulas
│       └── index.js       # Stats system entry
├── state/
│   ├── heroState.js       # Hero data (central hub)
│   ├── combatSystem.js    # PvE combat logic
│   ├── skillSystem.js     # Skills & buffs
│   ├── tickSystem.js      # Game tick & regen
│   ├── worldState.js      # World/location data
│   ├── itemSystem.js      # Items & equipment
│   ├── saveSystem.js      # Save/load
│   ├── statSystem.js      # Stats calculation
│   ├── locationSystem.js  # Locations
│   ├── forgeSystem.js     # Crafting
│   ├── progressionSystem.js # Offline progress
│   ├── uiLayout.js        # UI layout
│   └── ... (other systems)
├── ui/
│   ├── bottomUI.js        # Bottom panel UI
│   ├── tuneMode.js        # Visual positioning tool
│   ├── inventoryPanel.js  # Inventory panel
│   ├── statsPanel.js      # Stats panel
│   ├── forgePanel.js      # Forge panel
│   ├── arenaPanel.js      # Arena UI panel
│   └── ... (other panels)
├── game.js                # Main game logic
├── index.html             # Entry point
├── preEntry.js            # Loader
└── preEntry.css           # Loader styles
```

### Порядок загрузки скриптов (index.html)

```html
<!-- Phaser -->
<script src="phaser@3.80.1"></script>
<script src="SpinePlugin.js"></script>

<!-- PRE-ENTRY -->
<script src="preEntry.js"></script>

<!-- CORE STATS SYSTEM -->
<script src="core/stats/attributes.js"></script>
<script src="core/stats/formulas.js"></script>
<script src="core/stats/index.js"></script>

<!-- STATE (data & logic) -->
<script src="state/heroState.js"></script>
<script src="state/itemSystem.js"></script>
<!-- ... other state files ... -->

<!-- CORE -->
<script src="core/config.js"></script>
<script src="core/spineAnimations.js"></script>

<!-- UI PANELS -->
<script src="ui/bottomUI.js"></script>
<script src="ui/tuneMode.js"></script>
<!-- ... other UI panels ... -->

<!-- ARENA -->
<script src="arena/arenaState.js"></script>
<script src="arena/arenaCombat.js"></script>
<script src="arena/arenaUI.js"></script>
<script src="arena/arenaScene.js"></script>

<!-- MAIN -->
<script src="game.js"></script>
```

---

## ⚔️ Arena Combat System (v2.0.0)

### Обзор

PvP Арена с L2-style боевой механикой:
- Динамическая дистанция боя (зависит от оружия)
- L2-style тайминг анимаций (медленное оружие = пауза в idle)
- Эффекты ударов только на враге
- Spine skeleton.color для хит-флеша

### Arena Files

| Файл | Строк | Назначение |
|------|-------|------------|
| arenaScene.js | ~1800 | Рендеринг, камера, эффекты, анимации |
| arenaCombat.js | 189 | Логика боя, урон, тайминги |
| arenaState.js | 132 | Управление состоянием арены |
| arenaUI.js | 272 | HP бары, таймер |

### Динамическая дистанция боя

```javascript
// arenaCombat.js - каждый боец имеет attackRange
this.player = {
  attackRange: playerStats.attackRange || 40,  // Default 40px (fists)
  // ... other stats
};

// Weapon ranges (planned):
// Fists: 40px
// Dagger: 60px
// Sword: 80px
// Spear: 120px
// Bow: 200px

// arenaScene.js - расчет дистанции
function calculateFightDistance() {
  const playerRange = arenaCombat.player?.attackRange || 40;
  const enemyRange = arenaCombat.enemy?.attackRange || 40;
  return playerRange + enemyRange + 20;  // +20 buffer
  // Fists: 40 + 40 + 20 = 100px offset → 200px total distance
}
```

### L2-Style Animation Timing

```javascript
// Animation constants
const ANIM_DURATIONS = {
  attack: 800,   // Base attack animation duration (ms)
  idle: 1000,
  fall: 400,
  run: 600
};

// Calculate timing based on attackSpeed stat
function getAttackAnimationParams(attackSpeed) {
  const attackInterval = Math.floor(300000 / Math.max(100, attackSpeed));
  const baseAnimDuration = ANIM_DURATIONS.attack;

  let timeScale = 1.0;
  let idlePause = 0;

  if (attackInterval > baseAnimDuration) {
    // SLOW ATTACK: Normal animation + idle pause
    timeScale = 1.0;
    idlePause = attackInterval - baseAnimDuration;
  } else {
    // FAST ATTACK: Speed up animation
    timeScale = baseAnimDuration / attackInterval;
    idlePause = 0;
  }

  timeScale = Math.max(0.5, Math.min(3.0, timeScale));
  return { timeScale, idlePause, attackInterval };
}

// Example:
// attackSpeed: 300 → interval: 1000ms → timeScale: 1.0, idlePause: 200ms
// attackSpeed: 500 → interval: 600ms → timeScale: 1.33, idlePause: 0ms
```

### Hit Effects System

```javascript
// Effects only on ENEMY when player attacks
function playHitEffects(scene, target, isCrit, isPlayer) {
  // Skip effects when player is hit
  if (isPlayer) return;

  const x = target.x;
  const y = target.y - 200;  // Chest level

  // Flash - Spine skeleton.color (brightens entire character)
  flashSpineSprite(scene, target);

  // Particles
  spawnHitParticles(scene, x, y, isCrit);

  // Slash arc
  spawnSlashEffect(scene, x, y, true, isCrit);

  // Camera shake on crit
  if (isCrit) scene.cameras.main.shake(150, 0.01);
}

// Spine flash using skeleton.color
function flashSpineSprite(scene, sprite) {
  if (sprite.skeleton?.color) {
    const original = { r: sprite.skeleton.color.r, g: sprite.skeleton.color.g, b: sprite.skeleton.color.b };

    // Brighten (multiply colors by 10)
    sprite.skeleton.color.r = 10;
    sprite.skeleton.color.g = 10;
    sprite.skeleton.color.b = 10;

    // Restore after 80ms
    scene.time.delayedCall(80, () => {
      sprite.skeleton.color.r = original.r;
      sprite.skeleton.color.g = original.g;
      sprite.skeleton.color.b = original.b;
    });
  }
}
```

### Combat Stats (arenaCombat.js)

```javascript
// Player/Enemy stats structure
{
  health: maxHealth,
  maxHealth: maxHealth,
  physicalPower: physicalPower,
  physicalDefense: physicalDefense,
  attackSpeed: attackSpeed,      // Affects attack interval
  attackRange: attackRange || 40, // Affects fight distance
  critChance: critChance,
  critMultiplier: critMultiplier
}

// Attack interval formula
getAttackInterval(attackSpeed) {
  return Math.floor(300000 / Math.max(100, attackSpeed));
}
// attackSpeed 300 → 1000ms between attacks
// attackSpeed 500 → 600ms between attacks

// Damage formula
const rawDamage = power * (1 + (Math.random() * 0.4 - 0.2));  // ±20% variance
const defReduction = defense / (defense + 100);
let damage = Math.floor(rawDamage * (1 - defReduction * 0.5));
if (isCrit) damage = Math.floor(damage * critMultiplier);
```

### ARENA_CONFIG (arenaScene.js)

```javascript
const ARENA_CONFIG = {
  worldMultiplier: 5.25,

  // Positions (v2.0.0)
  groundY: 0.88,           // 88% screen height
  fighterScale: 0.38,      // Boy_1 scale
  playerSpawnX: 0.26,      // 26% world width
  enemySpawnX: 0.73,       // 73% world width
  bgOffsetX: 0,
  bgOffsetY: 5,
  bgScale: 0.96,

  // Combat (DEPRECATED - now dynamic)
  fightOffset: 180,        // Old fixed distance
  engageDistance: 420,     // Old trigger (now uses targetDistance)
  runSpeed: 2500,          // Run-in duration (ms)

  // Camera
  camera: {
    lerpSpeed: 0.06,
    startZoom: 1.2,        // Close-up on player
    endZoom: 0.86,         // Combat view
    zoomLerpSpeed: 0.02
  },

  // Cinematic
  cinematic: {
    introPlayerDuration: 1000,
    introEnemyPanDuration: 600,
    introEnemyHoldDuration: 800,
    readyDuration: 300
  }
};
```

### Arena States

| State | Описание |
|-------|----------|
| NONE | Арена не активна |
| INTRO_PLAYER | Камера на игроке |
| INTRO_ENEMY | Камера панорамирует к врагу |
| READY | Камера по центру, пауза |
| RUN_IN | Бойцы бегут навстречу |
| ENGAGE | Остановка перед боем |
| COUNTDOWN | 3-2-1 отсчет |
| FIGHT | Активный бой |
| END | Бой завершен |

### Keyboard Controls

| Клавиша | Действие |
|---------|----------|
| F | Пауза/продолжить бой |
| A/D | Камера влево/вправо (на паузе) |
| Z/X | Zoom in/out (на паузе) |
| 1-9 | Zoom presets (tune mode) |

---

## 🎭 Spine: Boy_1 (v2.0.0)

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
| `attack` | No | Удар кулаком |
| `attack_sword` | No | Удар мечом |
| `run` | Yes | Бег |
| `walk` | Yes | Ходьба |
| `fall` | No | Получение урона |
| `crouch` | Yes | Присел (смерть) |
| `jump` | No | Прыжок |

### Загрузка (game.js)

```javascript
this.load.spine('hero', 'assets/spine-main/Boy_1.json', 'assets/spine-main/Boy_1.atlas');
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
  plugins: {
    scene: [{ key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" }]
  }
};
```

---

## 🎛️ Bottom UI (ui/bottomUI.js)

### UI_LAYOUT Config

```javascript
const UI_LAYOUT = {
  container: { offsetY: 3 },
  panel: { scale: 0.574 },
  button: { x: 0, y: -214, scale: 0.54 },
  icons: {
    scale: 0.65,
    positions: [
      { x: 42, y: -68, scale: 0.65 },   // helmet (inventory)
      { x: 17, y: -68, scale: 0.61 },   // anvil (forge)
      { x: -22, y: -71, scale: 0.65 },  // store (shop)
      { x: -41, y: -66, scale: 0.65 }   // map
    ]
  }
};
```

---

## 🔧 Tune Mode (ui/tuneMode.js)

### Использование

```
URL: ?tune=1
Arena Tune: ?arena_tune=1
```

### Управление

| Клавиша | Действие |
|---------|----------|
| 1-8 | Выбор элемента |
| Стрелки | Двигать |
| Q/E | Масштаб |
| Drag | Перетаскивание |

---

## 📅 История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0.0 | 14.12.2024 | PvE Арена, TMA Touch Fix |
| 1.5.0 | 19.12.2024 | Tune Mode + Resolution |
| 1.7.0 | 19.12.2024 | Modular Architecture |
| 1.8.0 | 23.12.2024 | Arena Phase 1 - Cinematic camera |
| 1.9.0 | 31.12.2024 | Boy_1 Spine + Arena animations |
| **2.0.0** | **31.12.2024** | **Arena Combat Overhaul** |
| | | - Dynamic weapon range (attackRange stat) |
| | | - L2-style animation timing (timeScale + idlePause) |
| | | - Hit effects only on enemy target |
| | | - Spine skeleton.color for flash effect |
| | | - Closer fist distance (200px vs 360px old) |
| | | - Dynamic engage distance trigger |
| | | - Particles, slash arc, camera shake on crit |

---

## 🐛 Debug

### Консольные логи при загрузке

```
[Attributes] Module loaded
[Formulas] Module loaded
[StatsSystem] Module loaded
[Config] Module loaded
[SpineAnimations] Module loaded
[BottomUI] Module loaded
[TuneMode] Module loaded
[ArenaState] Module loaded
[ArenaCombat] Module loaded
[ArenaUI] Module loaded
[ArenaScene] Module loaded
GAMEJS BUILD: 2025-12-31-BOY2
```

### Консольные команды

```javascript
// Сброс сейва
localStorage.clear(); location.reload();

// Тест Spine
window.spineHero.play('attack', false);

// Arena state
arenaCombat.getState()
```

---

## ✅ Готово (v2.0.0)

- [x] Spine анимации (Boy_1)
- [x] Retina support
- [x] Fullscreen без чёрных полос
- [x] Bottom UI панель
- [x] Tune Mode
- [x] Modular architecture
- [x] Arena Phase 1 - кинематика
- [x] Arena Phase 2 - боевая логика
- [x] **Dynamic weapon range**
- [x] **L2-style animation timing**
- [x] **Hit effects (flash, particles, slash)**
- [x] **Spine skeleton.color flash**

## 📋 TODO

- [ ] Weapon system (sword, bow, etc.)
- [ ] Attack sounds
- [ ] Victory/defeat animations
- [ ] Arena rewards
- [ ] Spine "hit" skin for better flash
- [ ] PvE combat integration

---

## 🔴 ТЕКУЩАЯ ПРОБЛЕМА (Нужна помощь!)

### Background Scrims (Градиенты) - НЕ РАБОТАЮТ

**Цель:** Добавить полупрозрачные черные градиенты сверху и снизу экрана для улучшения читаемости UI текста (как предложил Gemini).

**Что должно быть:**
- Верхний градиент: черный 80% → прозрачный 0% (150-200px высота)
- Нижний градиент: прозрачный 0% → черный 80-90% (200-300px высота)
- Depth между игрой и UI (90-150)
- Затемняет фон ЗА UI панелями, улучшая контраст текста

**Что происходит:**
- Пользователь видит ТОЛЬКО нижнюю черную полосу (не градиент, а просто черную)
- Верхнего градиента НЕ ВИДНО вообще
- Изменения не применяются даже после Ctrl+F5

**Попытки исправления (5 раз):**

1. **Попытка 1**: `scene.make.graphics()` + `generateTexture()` + `scene.add.image()` (depth 250)
   - Результат: Ничего не видно

2. **Попытка 2**: Изменен depth с 250 на 150
   - Результат: Ничего не видно

3. **Попытка 3**: `scene.add.graphics()` без generateTexture (depth 150, alpha 100%)
   - Результат: Ничего не видно

4. **Попытка 4**: Gemini код (scene.make.graphics + generateTexture, depth 90)
   - Результат: Ничего не видно

5. **Попытка 5**: `scene.add.rectangle()` (простые прямоугольники)
   - Результат: Видна только нижняя черная полоса (не градиент)

**Текущий код:** `src/ui/backgroundScrims.js`
```javascript
// Top scrim (не работает)
const topScrim = scene.add.rectangle(width / 2, 100, width, 200, 0x000000, 0.7);
topScrim.setScrollFactor(0);
topScrim.setDepth(150);

// Bottom scrim (частично работает - видна черная полоса)
const botScrim = scene.add.rectangle(width / 2, height - 150, width, 300, 0x000000, 0.8);
botScrim.setScrollFactor(0);
botScrim.setDepth(150);
```

**Depth структура:**
- cityBg (фон): depth 10
- spineHero (герой): depth 100
- **backgroundScrims: depth 150** ← ДОЛЖНЫ БЫТЬ ЗДЕСЬ
- bottomUI panel: depth 200
- playerHeader: depth 300

**Логи (всё создается):**
```
[SCRIMS] Creating background gradients for UI readability
[SCRIMS] Top scrim created: depth 150, height 200px, alpha 70%
[SCRIMS] Bottom scrim created: depth 150, height 300px, alpha 80%
```

**Вопросы для AI:**
1. Почему Rectangle создается (есть лог), но не виден на экране?
2. Почему верхний scrim не работает, а нижний хотя бы частично виден?
3. Depth 150 правильный? (между героем 100 и UI 200)
4. Может проблема в scrollFactor или origin?
5. Нужны ли градиенты или достаточно простых прямоугольников?

**Что еще было сделано:**
- EXP ring перекрашен в золотой (`setTint(0xFFD700)`) - РАБОТАЕТ
- Текст улучшен (stroke 4px, shadow) - РАБОТАЕТ
- Avatar и ring настроены через tune mode - РАБОТАЕТ

**Нужна помощь:** Сделать работающие gradient scrims для улучшения читаемости UI!

---

## 🔴 ДРУГИЕ ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### 1. Spine не поддерживает setTint()

**Проблема:** Phaser Spine plugin не имеет метода `setTint()`.

**Решение:** Используем `skeleton.color.rgb = 10` для осветления, или белый rectangle overlay как fallback.

### 2. Mobile GPU texture limit

**Проблема:** Мобильные GPU: max texture 4096px.

**Решение:** Arena BG разделен на 2 части по 2048×2048.
