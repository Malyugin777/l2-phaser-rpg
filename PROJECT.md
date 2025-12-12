# Pocket Lineage: Human Saga

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler в стиле Lineage 2  
**Движок:** Phaser 3.80.0  
**Язык:** Vanilla JavaScript (ES6, strict mode)  
**Версия:** 0.5.0  
**GitHub:** https://github.com/Malugin777/l2-phaser-rpg

Браузерная RPG с автобоем, системой профессий, локаций с мобами, soulshots и офлайн-прогрессом.

---

## Архитектура

```
project/
├── index.html          # Точка входа, подключение скриптов
├── game.js             # Главный файл: create(), preload(), UI
├── state/              # Системы и данные
│   ├── heroState.js    # Данные героя, константы, SKILL_DB
│   ├── worldState.js   # Локации, мобы, enemyStats
│   ├── combatSystem.js # Бой, урон, смерть
│   ├── locationSystem.js # Переходы город/локация
│   ├── progressionSystem.js # Реген, офлайн-прогресс, levelUp
│   ├── professionSystem.js # Выбор профессии на 20 лвл
│   ├── restSystem.js   # Отдых (сесть), soulshots/spiritshots
│   ├── autoHuntSystem.js # Авто-охота с авто-отдыхом
│   ├── economySystem.js # Банки, свитки, квесты
│   ├── itemSystem.js   # Экипировка, бонусы от шмота
│   ├── mercenarySystem.js # Наёмник
│   ├── arenaSystem.js  # PvP арена
│   ├── dungeonSystem.js # Данжи
│   ├── overdriveSystem.js # Режим перегрузки
│   ├── skillSystem.js  # Использование скиллов
│   ├── spSystem.js     # SP хук (deprecated)
│   └── uiSystem.js     # UI хелперы
├── ui/                 # Панели интерфейса
│   ├── inventoryPanel.js
│   ├── statsPanel.js
│   ├── forgePanel.js
│   ├── questsPanel.js
│   ├── shopPanel.js
│   ├── arenaPanel.js
│   ├── dungeonPanel.js
│   ├── mapPanel.js
│   └── selectionScreen.js
└── assets/
    ├── audio/          # city_theme.mp3, battle_theme.mp3
    └── backgrounds/    # bg_city.png, bg_gludio.png, bg_dion.png, bg_dragon.png
```

---

## Структуры данных (heroState.js)

### stats — Боевые характеристики
```javascript
const stats = {
  level, exp, expToNext, sp,
  maxHp, hp, maxMp, mp,
  minAttack, maxAttack,
  critChance, critMultiplier,
  atkSpeed, castSpeed,
  weight, maxWeight
};
```

### profile — Профиль персонажа
```javascript
const profile = {
  race: "human" | "elf" | "darkelf",
  archetype: "fighter" | "mystic",
  profession: "knight" | "rogue" | "wizard" | null
};
```

### wallet — Валюты
```javascript
const wallet = { gold, ether };
```

### consumables — Расходники
```javascript
const consumables = { hpPotions, mpPotions, pAtkScrolls, mAtkScrolls };
```

### progress — Прогресс
```javascript
const progress = { kills, eliteKills, arenaRating, lastSessionTime };
```

### equipment — Экипировка
```javascript
const equipment = { weapon, armor, jewelry1, jewelry2 };
```

### skills — Навыки
```javascript
const skills = {
  learned: [],           // ["Power Strike", "Backstab", ...]
  slots: { slot1, slot2 } // Активные скиллы
};
```

### buffs — Бафы и состояния
```javascript
const buffs = {
  pAtkActive, mAtkActive,  // Свитки
  soulshotsOn, spiritshotsOn, // Shots
  isResting                // Отдых
};
```

### mercenary, pet, quests — Дополнительные сущности

---

## Системы (детально)

### heroState.js
**Назначение:** Единственный источник правды для данных героя.

**Экспортирует:**
- `stats`, `profile`, `wallet`, `consumables`, `progress`
- `equipment`, `inventory`, `skills`, `buffs`, `quests`
- `mercenary`, `pet`
- `SKILL_DB` — база всех скиллов
- `RACES`, `ARCHETYPES`, `PROFESSIONS` — справочники
- `LOOT_TABLE`, `LOOT_DROP_CHANCE`
- Константы: `OVERDRIVE_*`, `AUTO_HUNT_*`, `BUFF_*`, `SKILL*`

**Функции:**
- `isSkillLearned(key)`, `addLearnedSkill(key)`
- `getAvailableSkills()`, `isSkillVisibleForHero(key)`
- `getSkillRequiredLevel(key)`
- `saveGame()`, `loadGame()` — сериализация в localStorage

---

### worldState.js
**Назначение:** Мир, локации, враги.

**Данные:**
- `locations[]` — массив локаций с мобами
- `currentLocationIndex` — текущая локация
- `currentMob` — выбранный моб
- `enemyStats` — статы текущего врага
- `enemy`, `enemyHpText`, `enemyAlive` — UI врага
- `mode` — "city" | "location"
- `isDungeonRun`, `dungeonKills`

**Структура локации:**
```javascript
{
  id, name, description, bgKey,
  recommendedLevel, teleportCost,
  mobs: [{
    name, level, maxHp, defense,
    minAttack, maxAttack,
    exp, sp, gold: [min, max],
    elite: bool,
    drop: [{ item, chance, questItem?, material? }]
  }]
}
```

**Функции:**
- `getCurrentLocation()`, `selectRandomMob()`, `applyMobToEnemy(mob)`
- `getMobGoldReward(mob)`, `tryMobDrop(mob)`
- `getEnemyHpLabel()`, `updateEnemyHpText()`

---

### combatSystem.js
**Назначение:** Вся боевая логика.

**Функции:**
- `calculateDamage(attacker, defender)` — расчёт урона с критом
- `damageEnemy(scene)` — атака героя (проверяет isResting, shots)
- `damageEnemyWithSkill(scene, multiplier)` — скилловая атака
- `enemyAttackHero(scene)` — атака врага
- `mercAttackEnemy(scene)` — атака наёмника
- `killEnemy(scene)` — смерть врага, награды из currentMob
- `respawnEnemy(scene)` — выбор нового моба
- `onHeroDeath(scene)` — смерть героя, штраф EXP
- `gainExp(amount, scene)`, `gainExpDirect(amount, scene)`
- `levelUp(scene)` — повышение уровня

**Spawn-тексты:** `spawnDamageText`, `spawnHeroDamageText`, `spawnExpText`, `spawnLevelUpText`, `spawnLootText`, `spawnSpGainText`, `spawnEliteKillText`, `spawnEtherGainText`, `spawnCannotAttackText`

---

### locationSystem.js
**Назначение:** Переходы между городом и локацией.

**Функции:**
- `enterCity(scene)` — возврат в город
- `enterLocation(scene)` — вход в локацию (выбор моба, старт атак врага)
- `changeLocation(direction)` — смена локации стрелками
- `updateLocationLabel()` — обновление заголовка
- `updateLocationBackgroundTexture()` — смена фона
- `startMusicForMode(mode)`, `toggleMusicMute()`
- `showCamp(scene)`, `hideCamp()` — палатка после авто-охоты
- `stopEnemyAttack()` — остановка таймера атак врага

---

### progressionSystem.js
**Назначение:** Реген, офлайн-прогресс.

**Функции:**
- `handleRegen()` — реген HP/MP (x5 при isResting)
- `applyOfflineProgress(scene)` — начисление наград за офлайн
- `showOfflinePopup(...)` — окно офлайн-наград

---

### professionSystem.js
**Назначение:** Выбор профессии на 20 уровне.

**UI:** `professionButton`, `professionPanel`, кнопки Knight/Rogue/Wizard

**Функции:**
- `createProfessionUI(scene)` — создание UI
- `showProfessionPanel()`, `hideProfessionPanel()`
- `applyProfession(profId, scene)` — применение профессии
- `updateProfessionButton()` — видимость кнопки

**Бонусы профессий:**
| Профессия | Архетип | Бонус | Скиллы |
|-----------|---------|-------|--------|
| Knight | fighter | +30% HP, +10 P.Def | Shield Stun, Ultimate Defense |
| Rogue | fighter | +15% крит, +0.5 множ, +20% ATK | Backstab, Dash |
| Wizard | mystic | +50% MP, +30% ATK | Blaze, Aura Flare |

---

### restSystem.js
**Назначение:** Отдых и Soulshots/Spiritshots.

**UI:** `restButton` (⛺ Сесть), `shotsButton` (💎 Shots)

**Функции:**
- `createRestAndShotsUI(scene)`
- `showRestAndShotsUI()`, `hideRestAndShotsUI()`
- `toggleRest(scene)`, `startRest()`, `stopRest()`
- `toggleShots(scene)`, `useShotIfEnabled()` → {used, type, multiplier}

**Механика:**
- Отдых: реген x5, нельзя атаковать
- Soulshots (fighter): урон x2.0, -1 ether
- Spiritshots (mystic): урон x1.5, -1 ether

---

### autoHuntSystem.js
**Назначение:** Автоматическая охота.

**Функции:**
- `enableAutoHunt(scene)`, `disableAutoHunt()`
- `autoPotionsDuringHunt(scene)` — авто-банки
- `autoRestDuringHunt(scene)` — авто-отдых (HP<30% сесть, HP>80% встать)
- `onAutoHuntSessionEnd(scene)` — конец сессии, показ палатки

**Константы:** `AUTO_HP_THRESHOLD=0.3`, `AUTO_MP_THRESHOLD=0.2`, `AUTO_REST_HP_LOW=0.3`, `AUTO_REST_HP_HIGH=0.8`

---

### economySystem.js
**Назначение:** Банки, свитки, квесты.

**Функции:**
- `useHpPotion(scene)`, `useMpPotion(scene)`
- `usePAtkScroll(scene)`, `useMAtkScroll(scene)`
- `checkQuestCompletion(scene)` — проверка квестов

---

### itemSystem.js
**Назначение:** Экипировка.

**Функции:**
- `equipItem(itemName)`, `unequipSlot(slot)`
- `equipBestItems()`, `unequipAll()`
- `getItemBonus(itemName)` → {minAttack, maxAttack, critChance}
- `getEffectiveMinAttack()`, `getEffectiveMaxAttack()`, `getEffectiveCritChance()`

---

### Остальные системы

| Файл | Назначение |
|------|------------|
| mercenarySystem.js | Найм/увольнение наёмника, его атаки |
| arenaSystem.js | PvP арена, рейтинг |
| dungeonSystem.js | Данжи с целью по убийствам |
| overdriveSystem.js | Режим перегрузки (урон x2) |
| skillSystem.js | Использование skill1/skill2 |
| spSystem.js | Хук SP (deprecated, SP теперь из моба) |
| uiSystem.js | updateHeroUI(), updateSkillButtonsUI() |

---

## UI Панели (ui/*.js)

| Файл | Назначение |
|------|------------|
| inventoryPanel.js | Инвентарь, экипировка |
| statsPanel.js | Статы героя |
| forgePanel.js | Кузнец (заточка) |
| questsPanel.js | Квесты |
| shopPanel.js | Магазин |
| arenaPanel.js | Арена |
| dungeonPanel.js | Данж |
| mapPanel.js | Карта/телепорт |
| selectionScreen.js | Выбор расы/класса при старте |

---

## index.html — Порядок скриптов

```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js"></script>

<!-- Данные -->
<script src="state/heroState.js"></script>
<script src="state/worldState.js"></script>

<!-- Системы -->
<script src="state/mercenarySystem.js"></script>
<script src="state/autoHuntSystem.js"></script>
<script src="state/overdriveSystem.js"></script>
<script src="state/economySystem.js"></script>
<script src="state/itemSystem.js"></script>
<script src="state/combatSystem.js"></script>
<script src="state/progressionSystem.js"></script>
<script src="state/arenaSystem.js"></script>
<script src="state/dungeonSystem.js"></script>
<script src="state/skillSystem.js"></script>
<script src="state/professionSystem.js"></script>
<script src="state/restSystem.js"></script>
<script src="state/locationSystem.js"></script>
<script src="state/uiSystem.js"></script>
<script src="state/spSystem.js"></script>

<!-- UI панели -->
<script src="ui/inventoryPanel.js"></script>
<script src="ui/statsPanel.js"></script>
<script src="ui/forgePanel.js"></script>
<script src="ui/questsPanel.js"></script>
<script src="ui/shopPanel.js"></script>
<script src="ui/arenaPanel.js"></script>
<script src="ui/dungeonPanel.js"></script>
<script src="ui/mapPanel.js"></script>
<script src="ui/selectionScreen.js"></script>

<!-- Главный файл -->
<script src="game.js"></script>
```

**УДАЛЕНЫ:** `enemyState.js`, `skillDb.js`

---

## Локации и мобы

### Obelisk of Victory (id: 0, lv 1-5)
| Моб | Lv | HP | ATK | EXP | SP | Gold | Дроп |
|-----|----|----|-----|-----|----|------|------|
| Young Keltir | 1 | 35 | 3-5 | 12 | 1 | 4-8 | — |
| Keltir | 2 | 45 | 4-6 | 18 | 2 | 6-12 | Кольцо ученика 3% |
| Grey Wolf | 3 | 60 | 5-8 | 25 | 3 | 8-15 | Wolf Fang 15%, Меч новичка 5% |

### Northern Territory (id: 1, lv 5-10)
| Моб | Lv | HP | ATK | EXP | SP | Gold | Дроп |
|-----|----|----|-----|-----|----|------|------|
| Orc | 5 | 90 | 7-11 | 35 | 4 | 12-20 | Varnish 20% |
| Orc Fighter | 7 | 120 | 9-14 | 45 | 5 | 15-25 | Кинжал охотника 6% |
| Werewolf | 8 | 140 | 10-16 | 55 | 6 | 18-30 | Кольчуга гнома 4% |

### Elven Ruins (id: 2, lv 10-18)
| Моб | Lv | HP | ATK | EXP | SP | Gold |
|-----|----|----|-----|-----|----|------|
| Skeleton | 10 | 180 | 12-18 | 70 | 7 | 22-35 |
| Skeleton Archer | 12 | 160 | 15-22 | 85 | 9 | 28-42 |
| Giant Spider | 14 | 220 | 14-20 | 100 | 10 | 32-50 |
| **Skeleton Lord** | 16 | 300 | 18-26 | 130 | 13 | 40-60 |

### Orc Barracks (id: 3, lv 20+)
| Моб | Lv | HP | ATK | EXP | SP | Gold |
|-----|----|----|-----|-----|----|------|
| Orc Raider | 20 | 400 | 22-32 | 180 | 18 | 50-80 |
| **Orc Captain** | 22 | 500 | 26-38 | 220 | 22 | 60-100 |
| Orc Shaman | 21 | 350 | 30-45 | 200 | 25 | 55-90 |

---

## SKILL_DB

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

## Сохранение (localStorage)

**Ключ:** `l2rpg_save`  
**Версия:** 2

```javascript
{
  version: 2,
  stats: {...},
  profile: {...},
  wallet: {...},
  consumables: {...},
  progress: {...},
  equipment: {...},
  inventory: [...],
  skills: {...},
  quests: {...},
  mercenary: {...},
  pet: {...},
  currentLocationIndex: 0
}
```

Автомиграция: version 1 → 2 при loadGame().

---

## Статус разработки

### ✅ Готово
- [x] Этап 1: Структура данных
- [x] Этап 2: Система мобов
- [x] Этап 3: Профессии
- [x] Этап 5: Soulshots/Spiritshots
- [x] Этап 6: Отдых (сесть)

### ❌ TODO
- [ ] Этап 4: Скиллы в бою (SKILL_DB → реальный урон)
- [ ] Этап 7: Питомец-волк (квест, боевой пет)
- [ ] Этап 8: UI-рефактор (углы экрана)

---

## Быстрый старт для разработки

```bash
# Тестирование профессий
stats.level = 20; updateHeroUI();
# Открыть Статы → кнопка "Выбрать профессию"

# Тестирование soulshots
wallet.ether = 100; updateHeroUI();
# В локации нажать "💎 Shots"

# Сброс сейва
localStorage.clear(); location.reload();
```