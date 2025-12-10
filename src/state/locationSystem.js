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

// Обновление заголовка текущей локации / данжа
function updateLocationLabel() {
  if (!locationText) return;
  const loc = getCurrentLocation();
  if (mode === "city") {
    locationText.setText("Город: Глудин-хаб | Локация: " + loc.name);
  } else {
    if (isDungeonRun) {
      locationText.setText(
        "Данж: " +
          loc.name +
          " (" +
          dungeonKills +
          "/" +
          DUNGEON_KILL_TARGET +
          ")"
      );
    } else {
      locationText.setText(
        "Локация: " +
          loc.name +
          " (рек. лвл " +
          loc.recommendedLevel +
          ")"
      );
    }
  }
}

// Смена фона под текущую локацию
function updateLocationBackgroundTexture() {
  if (!locationBg) return;
  let key = "bg_gludio";
  if (currentLocationIndex === 1) key = "bg_dion";
  else if (currentLocationIndex === 2) key = "bg_dragon";
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

function updateMusicToggleLabel() {
  if (!musicToggleButtonText) return;
  musicToggleButtonText.setText("Музыка: " + (musicMuted ? "OFF" : "ON"));
}

function toggleMusicMute() {
  musicMuted = !musicMuted;
  updateMusicToggleLabel();

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
    .text(hero.x + 50, hero.y - 40, "⛺ Отдых (нет Эфира)", {
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
  mode = "city";
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

  if (cityHero) cityHero.setVisible(true);
  if (hero) {
    hero.setVisible(false);
    hero.alpha = 1;
  }
  if (enemy) enemy.setVisible(false);
  if (enemyHpText) enemyHpText.setVisible(false);
  if (merc) merc.setVisible(false);

  if (autoButton) autoButton.setVisible(false);
  if (autoButtonText) autoButtonText.setVisible(false);

  if (locationPrevButton) locationPrevButton.setVisible(true);
  if (locationPrevText) locationPrevText.setVisible(true);
  if (locationNextButton) locationNextButton.setVisible(true);
  if (locationNextText) locationNextText.setVisible(true);

  if (modeButtonText) modeButtonText.setText("В локацию");

  if (npcSmithRect) npcSmithRect.setVisible(true);
  if (npcSmithText) npcSmithText.setVisible(true);
  if (npcMapRect) npcMapRect.setVisible(true);
  if (npcMapText) npcMapText.setVisible(true);
  if (npcShopRect) npcShopRect.setVisible(true);
  if (npcShopText) npcShopText.setVisible(true);
  if (npcArenaRect) npcArenaRect.setVisible(true);
  if (npcArenaText) npcArenaText.setVisible(true);
  if (npcMercRect) npcMercRect.setVisible(true);
  if (npcMercText) npcMercText.setVisible(true);
  if (npcDungeonRect) npcDungeonRect.setVisible(true);
  if (npcDungeonText) npcDungeonText.setVisible(true);

  updateLocationLabel();
  updateHeroUI();
}

// Вход в боевую локацию
function enterLocation(scene) {
  mode = "location";

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

  const loc = getCurrentLocation();
  enemyStats.maxHp = loc.enemyMaxHp;
  enemyStats.defense = loc.enemyDefense;
  enemyStats.hp = enemyStats.maxHp;
  enemyStats.minAttack = loc.enemyMinAttack;
  enemyStats.maxAttack = loc.enemyMaxAttack;
  enemyAlive = true;

  if (cityHero) cityHero.setVisible(false);

  if (hero) {
    hero.setVisible(true);
    hero.x = heroStartX;
    hero.y = heroStartY;
    hero.alpha = 1;
    hero.fillColor = isOverdriveActive ? 0xffff00 : 0x0000ff;
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
    if (mercActive) {
      merc.setVisible(true);
      merc.x = heroStartX - 80;
      merc.y = heroStartY;
    } else {
      merc.setVisible(false);
    }
  }

  if (autoButton) autoButton.setVisible(true);
  if (autoButtonText) {
    autoButtonText.setVisible(true);
    autoButton.fillColor = 0x333333;
    autoButtonText.setText("Авто-охота: OFF");
  }

  if (locationPrevButton) locationPrevButton.setVisible(false);
  if (locationPrevText) locationPrevText.setVisible(false);
  if (locationNextButton) locationNextButton.setVisible(false);
  if (locationNextText) locationNextText.setVisible(false);

  if (modeButtonText) modeButtonText.setText("В Город");

  if (npcSmithRect) npcSmithRect.setVisible(false);
  if (npcSmithText) npcSmithText.setVisible(false);
  if (npcMapRect) npcMapRect.setVisible(false);
  if (npcMapText) npcMapText.setVisible(false);
  if (npcShopRect) npcShopRect.setVisible(false);
  if (npcShopText) npcShopText.setVisible(false);
  if (npcArenaRect) npcArenaRect.setVisible(false);
  if (npcArenaText) npcArenaText.setVisible(false);
  if (npcMercRect) npcMercRect.setVisible(false);
  if (npcMercText) npcMercText.setVisible(false);
  if (npcDungeonRect) npcDungeonRect.setVisible(false);
  if (npcDungeonText) npcDungeonText.setVisible(false);

  stopEnemyAttack();
  enemyAttackEvent = scene.time.addEvent({
    delay: ENEMY_ATTACK_INTERVAL_MS,
    loop: true,
    callback: function () {
      if (mode !== "location") return;
      if (!enemyAlive) return;
      if (heroStats.hp <= 0) return;
      enemyAttackHero(scene);
    },
  });

  stopMercAttack();
  if (mercActive) {
    mercAttackEvent = scene.time.addEvent({
      delay: 1500,
      loop: true,
      callback: function () {
        if (!mercActive) return;
        if (mode !== "location") return;
        if (!enemyAlive) return;
        if (heroStats.hp <= 0) return;
        mercAttackEnemy(scene);
      },
    });
  }

  updateLocationLabel();
  updateHeroUI();
}
