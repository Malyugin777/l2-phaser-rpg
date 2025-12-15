"use strict";

// ====== LOCATION & MUSIC SYSTEM ======

// Смена выбранной локации (по стрелкам в городе)
function changeLocation(direction) {
  const max = locations.length;
  currentLocationIndex += direction;
  if (currentLocationIndex < 0) currentLocationIndex = max - 1;
  if (currentLocationIndex >= max) currentLocationIndex = 0;
  updateLocationLabel();
  saveGame();
}

// [LEGACY] locationText removed - function is overridden in game.js
function updateLocationLabel() {
  // No-op - locationText no longer exists
  // Location info now handled by uiLayout.js
}

// Смена фона под текущую локацию
function updateLocationBackgroundTexture() {
  if (!locationBg) return;
  const loc = getCurrentLocation();
  
  // Используем bgKey из локации если есть
  let key = loc.bgKey || "obelisk_of_victory";
  
  // Fallback для старых локаций
  if (!loc.bgKey) {
    if (currentLocationIndex === 1) key = "northern_territory";
    else if (currentLocationIndex === 2) key = "elven_ruins";
    else if (currentLocationIndex >= 3) key = "orc_barracks";
  }
  
  locationBg.setTexture(key);
}

// Музыка под режим (город / локация)
function startMusicForMode(modeName) {
  if (!cityMusic || !battleMusic) return;
  if (musicMuted) return;
  if (currentMusicMode === modeName) return;

  if (cityMusic.isPlaying) cityMusic.stop();
  if (battleMusic.isPlaying) battleMusic.stop();

  if (modeName === "city") {
    cityMusic.play();
  } else if (modeName === "location") {
    battleMusic.play();
  }
  currentMusicMode = modeName;
}

// [LEGACY] updateMusicToggleLabel() removed - musicToggleButtonText no longer exists

function toggleMusicMute() {
  musicMuted = !musicMuted;

  if (musicMuted) {
    if (cityMusic && cityMusic.isPlaying) cityMusic.stop();
    if (battleMusic && battleMusic.isPlaying) battleMusic.stop();
  } else {
    startMusicForMode(mode);
  }
}

// Лагерь (появляется по окончании авто-охоты)
function hideCamp() {
  if (campTent) {
    campTent.destroy();
    campTent = null;
  }
  if (campText) {
    campText.destroy();
    campText = null;
  }
}

function showCamp(scene) {
  hideCamp();
  if (!hero) return;

  campTent = scene.add.rectangle(hero.x + 50, hero.y + 10, 40, 30, 0x8b4513);
  campText = scene.add
    .text(hero.x + 50, hero.y - 40, "⛺ Сессия окончена", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center",
    })
    .setOrigin(0.5);

  campTent.setDepth(20);
  campText.setDepth(21);
}

// Стоп авто-атаки моба по таймеру
function stopEnemyAttack() {
  if (enemyAttackEvent) {
    enemyAttackEvent.remove(false);
    enemyAttackEvent = null;
  }
}

// Вход в город
function enterCity(scene) {
  scene = scene || window.gameScene;

  mode = "city";
  progress.lastMode = "city";
  isDungeonRun = false;
  dungeonKills = 0;

  startMusicForMode("city");

  if (cityBg) cityBg.setVisible(true);
  if (locationBg) locationBg.setVisible(false);

  disableAutoHunt();
  hideCamp();
  hideForgePanel();
  hideQuestsPanel();
  hideShopPanel();
  hideMapPanel();
  hideArenaPanel();
  hideDungeonPanel();
  endOverdrive(scene);
  stopEnemyAttack();
  stopMercAttack();

  // Скрываем кнопки отдыха и shots
  stopRest();
  hideRestAndShotsUI();
  hidePet();

  if (cityHero) cityHero.setVisible(false); // Скрываем старый спрайт
  if (hero) {
    hero.setVisible(false);
    hero.alpha = 1;
  }

  // Spine герой в городе
  if (window.spineHero) {
    var w = scene && scene.scale ? scene.scale.width : 400;
    var h = scene && scene.scale ? scene.scale.height : 700;
    window.spineHero.setPosition(w * 0.25, h / 2 + 40);
    window.spineHero.setVisible(true);
    window.spineHero.setDepth(5);
    if (typeof heroIdle === 'function') heroIdle();
  }

  if (enemy) enemy.setVisible(false);
  if (enemyHpText) enemyHpText.setVisible(false);
  if (merc) merc.setVisible(false);

  // [LEGACY UI REMOVED - autoButton, locationPrevButton, locationNextButton, modeButtonText, NPC rectangles]

  updateLocationLabel();
  updateHeroUI();

  // Обновляем новый UI для города
  if (typeof updateUIForMode === "function") {
    updateUIForMode("city");
  }

  // Хук для tickSystem: сброс боя, meters
  if (typeof onEnterCity === "function") {
    onEnterCity();
  }
}

// Вход в боевую локацию
function enterLocation(scene) {
  console.log("[Location] Entering location, previous mode:", mode);
  mode = "location";
  progress.lastMode = "location";
  progress.lastLocationIndex = currentLocationIndex;
  console.log("[Location] Mode set to:", mode);

  startMusicForMode("location");

  if (cityBg) cityBg.setVisible(false);
  if (locationBg) {
    updateLocationBackgroundTexture();
    locationBg.setVisible(true);
  }

  disableAutoHunt();
  hideCamp();
  hideForgePanel();
  hideQuestsPanel();
  hideShopPanel();
  hideMapPanel();
  hideArenaPanel();
  hideDungeonPanel();
  
  // Сбрасываем отдых при входе в локацию
  stopRest();
  showRestAndShotsUI();
  
  // Сбрасываем флаг атаки
  isAttacking = false;
  
  // Показываем питомца
  showPetInLocation();

  // ============================================
  // НОВАЯ СИСТЕМА: выбираем случайного моба
  // ============================================
  const mob = selectRandomMob();
  applyMobToEnemy(mob);
  enemyAlive = true;

  if (cityHero) cityHero.setVisible(false);

  if (hero) {
    hero.setVisible(true);
    hero.x = heroStartX;
    hero.y = heroStartY;
    hero.alpha = 1;
    hero.fillColor = isOverdriveActive ? 0xffff00 : 0x0000ff;
  }

  // Spine герой в локации (run → idle)
  if (window.spineHero) {
    window.spineHero.setPosition(heroStartX, heroStartY + 40);
    window.spineHero.setVisible(true);
    if (typeof heroEnterLocation === 'function') {
      heroEnterLocation();
    } else if (typeof heroIdle === 'function') {
      heroIdle();
    }
  }
  if (enemy) {
    enemy.setVisible(true);
    enemy.alpha = 1;
  }
  if (enemyHpText) {
    enemyHpText.setVisible(true);
    enemyHpText.alpha = 1;
    updateEnemyHpText();
  }

  if (merc) {
    if (mercenary.active) {
      merc.setVisible(true);
      merc.x = heroStartX - 80;
      merc.y = heroStartY;
    } else {
      merc.setVisible(false);
    }
  }

  // [LEGACY UI REMOVED - autoButton, locationPrevButton, locationNextButton, modeButtonText, NPC rectangles]

  stopEnemyAttack();
  enemyAttackEvent = scene.time.addEvent({
    delay: ENEMY_ATTACK_INTERVAL_MS,
    loop: true,
    callback: function () {
      if (mode !== "location") return;
      if (!enemyAlive) return;
      if (stats.hp <= 0) return;
      enemyAttackHero(scene);
    },
  });

  stopMercAttack();
  if (mercenary.active) {
    mercAttackEvent = scene.time.addEvent({
      delay: 1500,
      loop: true,
      callback: function () {
        if (!mercenary.active) return;
        if (mode !== "location") return;
        if (!enemyAlive) return;
        if (stats.hp <= 0) return;
        mercAttackEnemy(scene);
      },
    });
  }

  // Запускаем атаку питомца
  startPetAttack(scene);

  updateLocationLabel();
  updateHeroUI();
  
  console.log("[Location] Entry complete! hero:", !!hero, "enemy:", !!enemy, "enemyAlive:", enemyAlive, "isAttacking:", isAttacking);
  
  // Обновляем новый UI для локации
  if (typeof updateUIForMode === "function") {
    updateUIForMode("location");
  }

  // Хук для tickSystem: сброс stance, meters
  if (typeof onEnterLocation === "function") {
    onEnterLocation();
  }
}