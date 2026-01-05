# Pocket Chronicles

## Обзор проекта

**Жанр:** Idle RPG / Auto-battler
**Платформа:** Telegram Mini App (TMA)
**Движок:** Phaser 3.80.1 + SpinePlugin 4.1
**Язык:** Vanilla JavaScript (ES6, strict mode)
**Версия:** 3.0.0
**GitHub:** https://github.com/Malyugin777/l2-phaser-rpg
**Vercel:** https://l2-phaser-rpg.vercel.app
**API Server:** https://pocketchronicle.ru
**Telegram:** @PocketChronicles_bot

---

## Архитектура проекта (v3.0.0)

### Структура файлов

```
src/
├── arena/
│   ├── arenaScene.js      # Arena scene rendering, camera, effects
│   ├── arenaCombat.js     # Combat logic, damage, timing
│   ├── arenaState.js      # Arena state management
│   └── arenaUI.js         # HP bars, timer UI
├── core/
│   ├── config.js          # Phaser config, scaling, viewport
│   ├── spineAnimations.js # Hero animations
│   └── stats/
│       ├── attributes.js  # Stat attributes
│       ├── formulas.js    # Damage formulas
│       └── index.js       # Stats system entry
├── services/
│   └── apiClient.js       # API client for pocketchronicle.ru
├── state/
│   ├── heroState.js       # Hero data (central hub)
│   ├── combatSystem.js    # PvE combat logic
│   ├── skillSystem.js     # Skills & buffs
│   ├── tickSystem.js      # Game tick & regen
│   ├── worldState.js      # World/location data
│   ├── itemSystem.js      # Items & equipment
│   ├── saveSystem.js      # Save/load (pocketChroniclesSave)
│   ├── statSystem.js      # Stats calculation
│   ├── locationSystem.js  # Locations
│   ├── forgeSystem.js     # Crafting
│   ├── progressionSystem.js # Offline progress
│   ├── uiLayout.js        # UI layout
│   └── ... (other systems)
├── ui/
│   ├── bottomUI.js        # Bottom panel UI
│   ├── tuneMode.js        # Visual positioning tool
│   ├── inventoryScene.js  # Inventory (Phaser Scene, v9+)
│   ├── leaderboardScene.js # Leaderboard (v11, Press Start 2P)
│   ├── statsPanel.js      # Stats panel
│   ├── forgePanel.js      # Forge panel
│   ├── arenaPanel.js      # Arena UI panel
│   └── ... (other panels)
├── game.js                # Main game logic + initAuth()
├── index.html             # Entry point
├── preEntry.js            # Loader
└── preEntry.css           # Loader styles
```

### Порядок загрузки скриптов (index.html)

```html
<!-- Phaser -->
<script src="phaser@3.80.1"></script>
<script src="SpinePlugin.js"></script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap">

<!-- PRE-ENTRY -->
<script src="preEntry.js"></script>

<!-- CORE STATS SYSTEM -->
<script src="core/stats/attributes.js"></script>
<script src="core/stats/formulas.js"></script>
<script src="core/stats/index.js"></script>

<!-- STATE -->
<script src="state/heroState.js"></script>
<script src="state/itemSystem.js"></script>
<!-- ... other state files ... -->

<!-- CORE -->
<script src="core/config.js"></script>
<script src="core/spineAnimations.js"></script>

<!-- UI PANELS -->
<script src="ui/bottomUI.js"></script>
<script src="ui/inventoryScene.js?v=9"></script>
<script src="ui/leaderboardScene.js?v=11"></script>
<!-- ... other UI panels ... -->

<!-- ARENA -->
<script src="arena/arenaState.js"></script>
<script src="arena/arenaCombat.js"></script>
<script src="arena/arenaUI.js"></script>
<script src="arena/arenaScene.js"></script>

<!-- API CLIENT -->
<script src="services/apiClient.js"></script>

<!-- MAIN -->
<script src="game.js"></script>
```

---

## API Integration (v3.0.0)

### API Client (services/apiClient.js)

```javascript
const API_URL = 'https://pocketchronicle.ru';

// Функции:
apiAuth()              // Авторизация через Telegram initData
apiGetProfile()        // Получить профиль пользователя
apiSaveProgress(data)  // Сохранить прогресс на сервер
apiGetLeaderboard(tab) // Получить лидерборд (rating/kills)
apiGetCurrentUser()    // Получить текущего юзера
apiIsAuthenticated()   // Проверить авторизацию
```

### Auth Flow (game.js)

```javascript
async function initAuth() {
  const result = await apiAuth();

  if (result.success) {
    window.playerName = result.user.first_name;
    window.playerAvatar = result.user.photo_url;
  } else {
    console.log('[Game] Playing as guest');
  }
}

// Вызывается в create()
initAuth();
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/telegram` | POST | Auth via Telegram initData |
| `/api/v1/me` | GET | Get user profile + progress |
| `/api/v1/progress` | POST | Save game progress |
| `/api/v1/leaderboard` | GET | Get leaderboard |

---

## LeaderboardScene (v11)

### Features

- Dark Fantasy стиль
- Табы: Рейтинг / Убийства
- Press Start 2P пиксельный шрифт
- Focused row scaling (центральная строка увеличивается)
- Rubber band scroll с инерцией
- Footer с данными текущего игрока

### Config

```javascript
this.CFG = {
  // Layout
  panelMaxW: 720,
  rowH: 100,
  rowGap: 16,

  // Colors
  gold: "#D6B36A",
  bgTop: 0x2a313b,
  bgBottom: 0x0e141b,

  // Font
  fontPixel: '"Press Start 2P", monospace',
  fontReadable: 'Verdana, sans-serif',

  // Focus scaling
  focusBaseScale: 1.0,
  focusMaxScale: 1.08,
  focusRadius: 250,
  focusSmoothing: 0.15,
};
```

### Console Logs

```
[LeaderboardScene] v11 PIXEL-FONT loaded
[LeaderboardScene] v11 Created
[LEADERBOARD] 40 rows, contentH=4624, scrollMin=-3784
```

---

## InventoryScene (v9+)

### Features

- Phaser Scene (не DOM overlay)
- Dark L2 Fantasy стиль
- Spine герой в центре
- Equipment slots (PNG текстуры)
- Drag-n-drop система

### Запуск

```javascript
// bottomUI.js
scene.scene.launch('InventoryScene');
scene.scene.stop('InventoryScene');
```

---

## TMA Platform

### Размеры экрана

| Параметр | Значение |
|----------|----------|
| BASE_W | 780 |
| BASE_H | 1688 |
| Scale | 0.5 (game pixels) |

### Phaser Config

```javascript
const phaserConfig = {
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  resolution: devicePixelRatio,
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  fps: { target: 60, forceSetTimeOut: true },
};
```

---

## Console Logs (v3.0.0)

```
[ApiClient] Loaded, API_URL: https://pocketchronicle.ru
[Game] Starting auth...
[API] Auth starting... has initData
[API] Auth success: { first_name: "...", ... }
[LeaderboardScene] v11 PIXEL-FONT loaded
```

---

## История версий

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0.0 | 14.12.2024 | PvE Арена, TMA Touch Fix |
| 2.0.0 | 31.12.2024 | Arena Combat Overhaul |
| **3.0.0** | **05.01.2026** | **API Integration + Leaderboard** |
| | | - Ребрендинг: Pocket Chronicles |
| | | - API Client (pocketchronicle.ru) |
| | | - Telegram Auth integration |
| | | - LeaderboardScene v11 |
| | | - Press Start 2P pixel font |
| | | - Focused row scaling effect |
| | | - InventoryScene (Phaser native) |

---

## TODO

- [ ] Real leaderboard data from API
- [ ] Cloud save/load via API
- [ ] Push notifications
- [ ] Daily rewards
- [ ] Achievements system
- [ ] Guild system

---

## Debug Commands

```javascript
// Сброс локального сейва
localStorage.clear(); location.reload();

// Проверить auth
apiIsAuthenticated()
apiGetCurrentUser()

// Открыть лидерборд
game.scene.getScene('MainScene').scene.launch('LeaderboardScene')

// Spine тест
window.spineHero.play('attack', false);
```
