# Pocket Lineage: Human Saga

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler в стиле Lineage 2
**Платформа:** Telegram Mini App (TMA)
**Движок:** Phaser 3.80.0
**Язык:** Vanilla JavaScript (ES6, strict mode, глобальные переменные)
**Версия:** 1.0.0
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

### Целевые устройства

| Устройство | Размер | Приоритет |
|------------|--------|-----------|
| iPhone 12/13/14 | 390×844 | ⭐ Основной |
| Android средний | 360×800 | ✅ Проверять |
| Android большой | 412×915 | ✅ Проверять |

### Phaser Config

```javascript
const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: "game-container",
  backgroundColor: 0x0a0a12,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 360, height: 640 },
    max: { width: 430, height: 932 }
  }
};
```

### UI Константы (state/uiConstants.js)

```javascript
// Размеры
var UI_WIDTH = 390;
var UI_HEIGHT = 844;
var CENTER_X = 195;
var CENTER_Y = 422;

// Safe Areas
var SAFE_TOP = 67;
var SAFE_BOTTOM = 84;
var SAFE_LEFT = 16;
var SAFE_RIGHT = 16;

// Рабочие зоны
var GAME_AREA_TOP = 147;
var GAME_AREA_BOTTOM = 690;
var GAME_AREA_HEIGHT = 543;
var BOTTOM_DOCK_Y = 690;

// Панели
var PANEL_WIDTH = 350;
var PANEL_HEIGHT = 400;
```

### Важные правила TMA

1. **AudioContext** — музыку стартовать ТОЛЬКО после клика пользователя
2. **Touch events** — использовать `pointerdown` + `pointerup` для надёжности
3. **Viewport** — не доверять `100vh`, использовать фиксированные размеры
4. **Safe Area** — ничего интерактивного в зонах SAFE_TOP и SAFE_BOTTOM

### TMA Touch Fix

```javascript
function addReliableClick(gameObject, callback) {
  var wasPressed = false;
  gameObject.on("pointerdown", function() {
    wasPressed = true;
    callback();
  });
  gameObject.on("pointerup", function() {
    if (!wasPressed) callback();
    wasPressed = false;
  });
}
```

---

## 🎨 UI Стиль (Золотая тема)

### Цветовая палитра

| Элемент | Цвет | HEX |
|---------|------|-----|
| Золото (акцент) | 🟡 | #d4af37 |
| Золото яркое | 🟡 | #ffd700 |
| Тёмный фон | ⚫ | #1a1a2e / #0a0a12 |
| Кнопка обычная | ⬛ | #333333 |
| Кнопка выделенная | 🟤 | #4a3a1a |
| Текст белый | ⚪ | #ffffff |
| Текст серый | 🔘 | #666666 |
| HP красный | 🔴 | #cc3333 |
| MP синий | 🔵 | #3366cc |
| EXP жёлтый | 🟡 | #cccc33 |

### Стиль кнопок

```javascript
// Обычная кнопка
fillColor: 0x333333
strokeColor: 0xd4af37

// Выделенная кнопка
fillColor: 0x4a3a1a
strokeColor: 0xffd700

// Заблокированная кнопка
fillColor: 0x222222
strokeColor: 0x555555
textColor: "#666666"
```

---

## 📁 Архитектура проекта

```
src/
├── index.html              # Точка входа
├── preEntry.css            # Стили загрузочного экрана
├── preEntry.js             # Loader + Intro overlay
├── game.js                 # Phaser: preload(), create(), update()
│
├── state/                  # Данные и системы
│   ├── uiConstants.js      # ⭐ UI константы (ПЕРВЫЙ!)
│   ├── heroState.js        # ⭐ Данные героя (ВТОРОЙ!)
│   ├── itemSystem.js       # Экипировка, getAllEquipmentStats
│   ├── saveSystem.js       # save/load/migrate
│   ├── statSystem.js       # recalculateHeroStats
│   ├── tickSystem.js       # Реген тики
│   ├── worldState.js       # Локации, мобы
│   ├── combatSystem.js     # Бой, урон
│   ├── locationSystem.js   # Город ↔ локация
│   ├── progressionSystem.js# Офлайн-прогресс, levelUp
│   ├── arenaSystem.js      # PvE арена (полноэкранный бой)
│   ├── forgeSystem.js      # Кузница (ресурсы, крафт)
│   ├── skillSystem.js      # Скиллы
│   ├── professionSystem.js # Профессии 20 лвл
│   ├── restSystem.js       # Отдых, soulshots
│   ├── autoHuntSystem.js   # Авто-охота
│   ├── petSystem.js        # Питомец
│   ├── economySystem.js    # Банки, свитки
│   ├── mercenarySystem.js  # Наёмник
│   ├── dungeonSystem.js    # Данжи
│   ├── overdriveSystem.js  # Перегрузка
│   ├── spSystem.js         # SP система
│   ├── uiSystem.js         # UI хелперы
│   ├── uiLayout.js         # Лейаут (Lineage M стиль)
│   └── runnerBattle.js     # Runner UI (эксперимент)
│
├── ui/                     # Панели интерфейса
│   ├── selectionScreen.js  # Выбор расы/класса (мобильный)
│   ├── characterCreation.js# Создание персонажа (fullscreen)
│   ├── inventoryPanel.js   # Инвентарь
│   ├── statsPanel.js       # Статы
│   ├── forgePanel.js       # Кузница UI
│   ├── questsPanel.js      # Квесты
│   ├── shopPanel.js        # Магазин
│   ├── arenaPanel.js       # Арена (старая панель)
│   ├── dungeonPanel.js     # Данж
│   ├── mapPanel.js         # Карта мира
│   └── skillsPanel.js      # Панель навыков
│
└── assets/
    ├── intro/
    │   └── registration.png # Фон создания персонажа
    ├── backgrounds/
    │   ├── talkingisland_main.png
    │   ├── obelisk_of_victory.png
    │   ├── northern_territory.png
    │   ├── elven_ruins.png
    │   └── orc_barracks.png
    ├── ui/
    │   └── map_world.png
    └── audio/
        ├── city_theme.mp3
        └── battle_theme.mp3
```

### Порядок скриптов в index.html (КРИТИЧНО!)

```html
<!-- 1. Phaser -->
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js"></script>

<!-- 2. Pre-Entry -->
<script src="preEntry.js"></script>

<!-- 3. State (порядок важен!) -->
<script src="state/uiConstants.js"></script>   <!-- ПЕРВЫЙ -->
<script src="state/heroState.js"></script>      <!-- ВТОРОЙ -->
<script src="state/itemSystem.js"></script>     <!-- ДО statSystem! -->
<script src="state/saveSystem.js"></script>
<script src="state/statSystem.js"></script>
<!-- ... остальные state ... -->

<!-- 4. UI Panels -->
<script src="ui/inventoryPanel.js"></script>
<script src="ui/selectionScreen.js"></script>
<script src="ui/characterCreation.js"></script>
<!-- ... остальные ui ... -->

<!-- 5. Main -->
<script src="game.js"></script>                 <!-- ПОСЛЕДНИЙ -->
```

---

## 📊 Структуры данных (heroState.js)

### stats
```javascript
const stats = {
  level: 1,
  exp: 0,
  expToNext: 100,
  sp: 0,
  maxHp: 140,
  hp: 140,
  maxMp: 40,
  mp: 40,
  minAttack: 12,
  maxAttack: 20,
  critChance: 0.15,
  critMultiplier: 1.8,
  atkSpeed: 1.0,
  pDef: 10
};
```

### profile
```javascript
const profile = {
  race: "human" | null,           // elf, darkelf — заблокированы
  archetype: "fighter" | null,    // mystic — доступен
  profession: null                // knight, rogue, wizard — на 20 лвл
};
```

### wallet
```javascript
const wallet = {
  gold: 0,
  ether: 50,
  crystals: 0
};
```

### resources (Кузница)
```javascript
const resources = {
  // Base (падают с мобов)
  ore: 0,
  coal: 0,
  thread: 0,
  leather: 0,

  // Refined (крафт 100%)
  ironIngot: 0,
  cloth: 0,
  leatherSheet: 0,

  // Catalyst
  enchantDust: 0
};
```

### equipment
```javascript
const equipment = {
  weapon: null,
  armor: null,
  jewelry1: null,
  jewelry2: null
};
```

### arenaState
```javascript
const arenaState = {
  rating: 1000,
  honor: 0,
  wins: 0,
  losses: 0,
  energy: 30,
  energyMax: 30,
  lastEnergyTs: Date.now()
};

const ARENA_ENERGY_COST = 5;
const ARENA_ENERGY_REGEN_MS = 10 * 60 * 1000; // 10 минут
```

### progress
```javascript
const progress = {
  kills: 0,
  eliteKills: 0,
  arenaRating: 0,
  lastSessionTime: 0,
  lastMode: "city",           // для офлайн-прогресса
  lastLocationIndex: 0        // для офлайн-прогресса
};
```

### buffs
```javascript
const buffs = {
  pAtkActive: false,
  mAtkActive: false,
  soulshotsOn: false,
  spiritshotsOn: false,
  isResting: false
};
```

---

## 🏟️ PvE Арена

### Концепция
- Полноэкранный режим боя
- Авто-бой против бота (позже — слепки игроков)
- Исход зависит от билда (статы, экипировка)

### Энергия
```
energyMax = 30
energyCostPerFight = 5
energyRegenInterval = 10 минут (+1)
```

### Flow
```
Город → NPC "Арена" → onArenaButtonClick() →
ArenaScene (fullscreen) → 3-2-1-FIGHT → Авто-бой →
Результат (popup) → "В город"
```

### Награды
| Результат | Награда |
|-----------|---------|
| Победа | +EXP, +Honor, +Rating (8-20), +Gold |
| Поражение | +EXP (мало), -Rating, нет Gold |

### Рейтинг (ELO-lite)
```javascript
base = 14;
bonus = clamp(diff / 40, -6, +6);
deltaWin = clamp(base + bonus, 8, 20);
```

---

## 🔨 Система кузницы

### Ресурсы

| Тип | Ресурсы | Источник |
|-----|---------|----------|
| Base | ore, coal, thread, leather | Дроп с мобов |
| Refined | ironIngot, cloth, leatherSheet | Переплавка 100% |
| Catalyst | enchantDust | Разбор экипировки |

### Рецепты переплавки (100%)

| Результат | Ингредиенты |
|-----------|-------------|
| Iron Ingot | 10 ore + 2 coal |
| Cloth | 10 thread |
| Leather Sheet | 5 leather |

**Lucky x2:** 5% шанс получить x2 результата

### Рецепты крафта (100%)

| Предмет | Ингредиенты | Статы |
|---------|-------------|-------|
| Bastard Sword [D] | 10 ingot + 2 sheet + 3 dust | pAtk: 74 |
| Apprentice Robe [D] | 10 cloth + 2 sheet + 3 dust | pDef: 45 |
| Traveler Boots [D] | 4 sheet + 2 cloth + 2 dust | pDef: 20 |

### Разбор (Crystallize)

| Предмет | Enchant Dust |
|---------|--------------|
| Weapon D | 20-35 |
| Armor D | 15-28 |
| Boots D | 10-20 |

---

## 🎮 Офлайн-прогресс v2

### Правила

| Режим | Награды |
|-------|---------|
| Город | ❌ Нет (герой отдыхал) |
| Локация | ✅ 15% от онлайна |

### Формула

```javascript
CAP_SECONDS = 3 * 3600;      // Макс 3 часа
OFFLINE_MULT = 0.15;         // 15%
AVG_KILL_TIME = 20;          // сек на моба

effectiveSeconds = min(elapsed, CAP_SECONDS);
kills = floor(effectiveSeconds / AVG_KILL_TIME);

expGain = kills * avgExp * OFFLINE_MULT;
goldGain = kills * avgGold * OFFLINE_MULT;
spGain = kills * avgSp * OFFLINE_MULT;
```

---

## 🧑 Создание персонажа

### Flow (preEntry → selectionScreen)

```
PreEntry (loader) → "НАЧАТЬ ПУТЬ" →
selectionScreen (fullscreen overlay) →
Выбор расы → Выбор класса → "Играть" → Город
```

### UI спецификация (selectionScreen.js)

```javascript
// Fullscreen overlay
fillColor: 0x000000, alpha: 0.85

// Координаты (фиксированные Y)
title: Y = 120        // "СОЗДАНИЕ ГЕРОЯ"
subtitle1: Y = 180    // "Выбери расу"
races: Y = 260        // 3 кнопки в ряд
subtitle2: Y = 340    // "Выбери класс"
classes: Y = 410      // 2 кнопки в ряд
confirm: Y = 520      // Кнопка "Играть"

// Кнопки рас
width: 100px, height: 50px, gap: 110px

// Кнопки классов
width: 130px, height: 50px, gap: 140px

// Цвета
border: #d4af37 (золото)
highlight: #ffd700 (яркое золото)
selected bg: #4a3a1a
```

### Расы (открыта только Human)

| Раса | Статус | Множители |
|------|--------|-----------|
| Human | ✅ Открыта | Базовые |
| Elf | 🔒 Скоро | HP×0.9, MP×1.15, Crit×1.1 |
| Dark Elf | 🔒 Скоро | HP×1.05, ATK×1.15 |

### Архетипы

| Архетип | Статус | Базовые статы |
|---------|--------|---------------|
| Fighter | ✅ Открыт | HP: 140, MP: 40, ATK: 12-20 |
| Mystic | ✅ Открыт | HP: 80, MP: 110, ATK: 18-26 |

---

## ⚔️ SKILL_DB

```javascript
{
  "Power Strike":     { type: "physical", power: 1.5, mp: 10, cd: 4000 },
  "Mortal Blow":      { type: "physical", power: 2.5, mp: 15, cd: 6000, chance: 0.7 },
  "Wind Strike":      { type: "magical", power: 2.0, mp: 12, cd: 3000, castTime: 1500 },
  "Vampiric Touch":   { type: "magical", power: 1.2, mp: 20, cd: 8000, healPercent: 0.4 },
  "Shield Stun":      { type: "physical", power: 1.2, mp: 20, cd: 8000, stun: true },
  "Ultimate Defense": { type: "buff", mp: 50, cd: 60000, effect: { pDef: 3.0 } },
  "Backstab":         { type: "physical", power: 3.0, mp: 18, cd: 5000 },
  "Dash":             { type: "buff", mp: 10, cd: 15000, effect: { atkSpeed: 1.5 } },
  "Blaze":            { type: "magical", power: 3.0, mp: 25, cd: 4000, castTime: 2000 },
  "Aura Flare":       { type: "magical", power: 1.5, mp: 30, cd: 500, castTime: 500 }
}
```

---

## 🗺️ Локации и мобы

### Obelisk of Victory (lv 1-5)
| Моб | Lv | HP | ATK | EXP | SP | Gold |
|-----|----|----|-----|-----|----|------|
| Young Keltir | 1 | 35 | 3-5 | 12 | 1 | 4-8 |
| Keltir | 2 | 45 | 4-6 | 18 | 2 | 6-12 |
| Grey Wolf | 3 | 60 | 5-8 | 25 | 3 | 8-15 |

### Northern Territory (lv 5-10)
| Моб | Lv | HP | ATK | EXP | SP | Gold |
|-----|----|----|-----|-----|----|------|
| Orc | 5 | 90 | 7-11 | 35 | 4 | 12-20 |
| Orc Fighter | 7 | 120 | 9-14 | 45 | 5 | 15-25 |
| Werewolf | 8 | 140 | 10-16 | 55 | 6 | 18-30 |

### Elven Ruins (lv 10-18)
| Моб | Lv | HP | ATK | EXP | SP | Gold |
|-----|----|----|-----|-----|----|------|
| Skeleton | 10 | 180 | 12-18 | 70 | 7 | 22-35 |
| Skeleton Archer | 12 | 160 | 15-22 | 85 | 9 | 28-42 |
| Giant Spider | 14 | 220 | 14-20 | 100 | 10 | 32-50 |
| **Skeleton Lord** ⭐ | 16 | 300 | 18-26 | 130 | 13 | 40-60 |

### Orc Barracks (lv 20+)
| Моб | Lv | HP | ATK | EXP | SP | Gold |
|-----|----|----|-----|-----|----|------|
| Orc Raider | 20 | 400 | 22-32 | 180 | 18 | 50-80 |
| **Orc Captain** ⭐ | 22 | 500 | 26-38 | 220 | 22 | 60-100 |
| Orc Shaman | 21 | 350 | 30-45 | 200 | 25 | 55-90 |

⭐ = Elite mob

---

## 👤 Профессии (20 уровень)

| Профессия | Архетип | Бонус | Скиллы |
|-----------|---------|-------|--------|
| Knight | fighter | +30% HP, +10 pDef | Shield Stun, Ultimate Defense |
| Rogue | fighter | +15% крит, +20% ATK | Backstab, Dash |
| Wizard | mystic | +50% MP, +30% ATK | Blaze, Aura Flare |

---

## ✅ Статус разработки

### Готово ✅
- [x] Структура данных (heroState.js)
- [x] Система мобов (4 локации, 13 мобов)
- [x] Профессии на 20 лвл
- [x] Скиллы в бою (SKILL_DB)
- [x] Soulshots/Spiritshots
- [x] Отдых (сесть, реген x5)
- [x] Питомец-волк
- [x] Авто-охота
- [x] PreEntry (loader + intro)
- [x] GitHub Pages deployment
- [x] TMA адаптация (390×844)
- [x] UI константы (uiConstants.js)
- [x] UI золотая тема
- [x] Экран выбора персонажа (мобильный fullscreen)
- [x] uiLayout.js (Lineage M стиль, 2 ряда NPC)
- [x] Кузница: Переплавка (с Lucky x2)
- [x] Кузница: Крафт экипы
- [x] Кузница: Разбор (crystallize)
- [x] PvE Арена (полноэкранный режим боя)
- [x] TMA Touch Fix (reliable clicks)
- [x] Офлайн-прогресс v2 (город vs локация)

### TODO 📋

#### Приоритет 1 (MVP Polish)
- [ ] Дроп ресурсов с мобов
- [ ] Инвентарь с ресурсами
- [ ] Баланс наград арены

#### Приоритет 2 (Content)
- [ ] Spine анимация персонажа
- [ ] Больше локаций
- [ ] Daily Quests
- [ ] Данжи контент

#### Приоритет 3 (Social)
- [ ] PvP арена со слепками игроков
- [ ] Лиги и рейтинг
- [ ] Друзья (Supabase)

#### Приоритет 4 (Monetization)
- [ ] Реклама (Ad cap для офлайна)
- [ ] Premium подписка

---

## 📝 Важные правила кода

### Глобальные переменные (НЕ ПЕРЕИМЕНОВЫВАТЬ!)
```javascript
stats, profile, wallet, consumables, progress
equipment, inventory, skills, quests, resources
mercenary, buffs, mode, pet, arenaState
```

### Работа с inventory
```javascript
// ❌ НЕПРАВИЛЬНО (убивает ссылку)
inventory = [];

// ✅ ПРАВИЛЬНО
inventory.length = 0;
inventory.push(...newItems);
```

### Безопасные проверки
```javascript
// Всегда проверять существование
if (typeof someFunction === 'function') {
  someFunction();
}

if (typeof someVar !== 'undefined' && someVar) {
  // использовать someVar
}
```

### Anti-double-tap (для модальных экранов)
```javascript
let isProcessing = false;

button.on("pointerdown", () => {
  if (isProcessing) return;
  isProcessing = true;

  // действие...

  scene.time.delayedCall(100, () => {
    isProcessing = false;
  });
});
```

---

## 🔧 Команды разработки

```bash
# Локальный запуск
cd src && python -m http.server 5500
# или VS Code Live Server

# Деплой
git add .
git commit -m "message"
git push
# GitHub Pages auto-deploy

# Сброс сейва
localStorage.clear(); location.reload();

# Тест профессий
stats.level = 20; updateHeroUI();

# Тест арены
arenaState.energy = 30;

# Дать золото
wallet.gold = 10000; updateHeroUI();

# Тест ресурсов
resources.ore = 100; resources.coal = 50;
```

---

## 📝 Референсы

- **Hamster Fight Club** (@hamster_fightclub_bot) — UI/UX, экипировка
- **Lineage 2** — грейды, профессии, механики
- **Spine** (esotericsoftware.com) — анимация персонажа

---

## 📅 История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 0.5.0 | - | Базовая игра |
| 0.6.0 | - | Профессии, скиллы |
| 0.7.0 | - | Vercel deploy |
| 0.8.0 | 13.12.2024 | Кузница, preEntry, Character Creation |
| 0.9.0 | 14.12.2024 | Мобильный UI 390×844, золотая тема |
| 1.0.0 | 14.12.2024 | PvE Арена, TMA Touch Fix, UI рефакторинг |
