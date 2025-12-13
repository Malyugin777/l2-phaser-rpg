"use strict";

// ============================================================
//  ARENA SYSTEM — PvE Арена (полноэкранный режим боя)
// ============================================================

// ----- ЭНЕРГИЯ -----
function applyArenaEnergyRegen() {
  var now = Date.now();
  var passed = now - arenaState.lastEnergyTs;
  var gained = Math.floor(passed / ARENA_ENERGY_REGEN_MS);

  if (gained > 0) {
    arenaState.energy = Math.min(arenaState.energyMax, arenaState.energy + gained);
    arenaState.lastEnergyTs += gained * ARENA_ENERGY_REGEN_MS;
  }

  if (arenaState.energy >= arenaState.energyMax) {
    arenaState.lastEnergyTs = now;
  }
}

function canStartArenaFight() {
  applyArenaEnergyRegen();
  return arenaState.energy >= ARENA_ENERGY_COST;
}

function consumeArenaEnergy() {
  arenaState.energy -= ARENA_ENERGY_COST;
  saveGame();
}

// ----- ГЕНЕРАЦИЯ БОТА -----
function generateArenaBot() {
  var mult = 0.9 + Math.random() * 0.2;
  var levelDiff = Math.floor(Math.random() * 3) - 1;

  var botLevel = Math.max(1, stats.level + levelDiff);
  var botRating = arenaState.rating + Math.floor(Math.random() * 160) - 80;

  var bot = {
    name: "Gladiator Lv" + botLevel,
    level: botLevel,
    rating: Math.max(100, botRating),
    stats: {
      maxHp: Math.round(stats.maxHp * mult),
      hp: Math.round(stats.maxHp * mult),
      maxMp: Math.round(stats.maxMp * mult),
      mp: Math.round(stats.maxMp * mult),
      minAttack: Math.round(stats.minAttack * mult),
      maxAttack: Math.round(stats.maxAttack * mult),
      pDef: Math.round((stats.pDef || 10) * mult),
      critChance: Math.min(0.35, Math.max(0.05, stats.critChance + (Math.random() * 0.04 - 0.02))),
      critMultiplier: stats.critMultiplier || 1.5
    }
  };

  return bot;
}

// ----- РЕЙТИНГ -----
function calcArenaRatingDelta(myRating, enemyRating, isWin) {
  var diff = enemyRating - myRating;
  var base = 14;
  var bonus = Math.max(-6, Math.min(6, Math.round(diff / 40)));
  var delta = Math.max(8, Math.min(20, base + bonus));
  return isWin ? delta : -delta;
}

// ----- НАГРАДЫ -----
function applyArenaRewards(isWin, enemy) {
  var ratingDelta = calcArenaRatingDelta(arenaState.rating, enemy.rating, isWin);

  arenaState.rating = Math.max(0, arenaState.rating + ratingDelta);

  var expGain = 0;
  var honorGain = 0;

  if (isWin) {
    arenaState.wins++;
    expGain = 30 + stats.level * 5;
    honorGain = 10;
  } else {
    arenaState.losses++;
    expGain = 10;
    honorGain = 0;
  }

  arenaState.honor += honorGain;

  if (typeof gainExp === "function") {
    gainExp(expGain, null);
  } else {
    stats.exp += expGain;
  }

  saveGame();

  return {
    isWin: isWin,
    ratingDelta: ratingDelta,
    expGain: expGain,
    honorGain: honorGain
  };
}

// ----- ARENA UI (поиск и запуск) -----

var arenaSearchOverlay = null;
var arenaSearchText = null;

function onArenaButtonClick(scene) {
  applyArenaEnergyRegen();

  if (!canStartArenaFight()) {
    showArenaNotification(scene, "Не хватает энергии! (" + arenaState.energy + "/" + ARENA_ENERGY_COST + ")");
    return;
  }

  showArenaSearchPopup(scene);
}

function showArenaSearchPopup(scene) {
  var w = scene.scale.width;
  var h = scene.scale.height;

  arenaSearchOverlay = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.7).setDepth(200);
  arenaSearchText = scene.add.text(w/2, h/2, "Поиск соперника...", {
    fontSize: "22px",
    color: "#ffffff",
    fontFamily: "Arial"
  }).setOrigin(0.5).setDepth(201);

  scene.time.delayedCall(2000, function() {
    if (arenaSearchText) {
      arenaSearchText.setText("Соперник найден!");
    }

    scene.time.delayedCall(800, function() {
      if (arenaSearchOverlay) {
        arenaSearchOverlay.destroy();
        arenaSearchOverlay = null;
      }
      if (arenaSearchText) {
        arenaSearchText.destroy();
        arenaSearchText = null;
      }

      consumeArenaEnergy();
      var enemy = generateArenaBot();
      startArenaMode(scene, enemy);
    });
  });
}

// ----- ARENA MODE -----

var arenaEnemy = null;
var arenaMyStats = null;
var arenaBattleRunning = false;
var arenaBattleTick = 0;
var arenaMaxTicks = 300;
var arenaMyTurn = true;
var arenaBattleTimer = null;

// UI элементы арены
var arenaBg = null;
var arenaTitle = null;
var arenaMyHpBg = null;
var arenaMyHpBar = null;
var arenaMyLabel = null;
var arenaEnemyHpBg = null;
var arenaEnemyHpBar = null;
var arenaEnemyLabel = null;
var arenaMyChar = null;
var arenaEnemyChar = null;
var arenaCountText = null;
var arenaBattleLog = null;
var arenaResultOverlay = null;
var arenaResultPanel = null;
var arenaResultTitle = null;
var arenaResultRewards = null;
var arenaResultBtn = null;
var arenaResultBtnText = null;

function startArenaMode(scene, enemy) {
  arenaEnemy = enemy;

  arenaMyStats = JSON.parse(JSON.stringify(stats));
  arenaMyStats.hp = arenaMyStats.maxHp;
  arenaMyStats.mp = arenaMyStats.maxMp;

  hideGameUIForArena();
  createArenaUI(scene);
  startArenaCountdown(scene);
}

function hideGameUIForArena() {
  if (typeof cityBg !== "undefined" && cityBg) cityBg.setVisible(false);
  if (typeof locationBg !== "undefined" && locationBg) locationBg.setVisible(false);
  if (typeof hero !== "undefined" && hero) hero.setVisible(false);
  if (typeof cityHero !== "undefined" && cityHero) cityHero.setVisible(false);
  if (typeof enemy !== "undefined" && enemy) enemy.setVisible(false);
  if (typeof enemyHpText !== "undefined" && enemyHpText) enemyHpText.setVisible(false);
  if (typeof merc !== "undefined" && merc) merc.setVisible(false);

  if (typeof uiElements !== "undefined" && uiElements) {
    if (uiElements.topBarBg) uiElements.topBarBg.setVisible(false);
    if (uiElements.hpBarBg) uiElements.hpBarBg.setVisible(false);
    if (uiElements.hpBarFill) uiElements.hpBarFill.setVisible(false);
    if (uiElements.hpBarLabel) uiElements.hpBarLabel.setVisible(false);
    if (uiElements.mpBarBg) uiElements.mpBarBg.setVisible(false);
    if (uiElements.mpBarFill) uiElements.mpBarFill.setVisible(false);
    if (uiElements.mpBarLabel) uiElements.mpBarLabel.setVisible(false);
    if (uiElements.expBarBg) uiElements.expBarBg.setVisible(false);
    if (uiElements.expBarFill) uiElements.expBarFill.setVisible(false);
    if (uiElements.levelLabel) uiElements.levelLabel.setVisible(false);
    if (uiElements.bottomBarBg) uiElements.bottomBarBg.setVisible(false);
    if (uiElements.attackBtn) uiElements.attackBtn.setVisible(false);
    if (uiElements.attackBtnLabel) uiElements.attackBtnLabel.setVisible(false);

    if (uiElements.menuButtons) {
      uiElements.menuButtons.forEach(function(item) {
        item.btn.setVisible(false);
        if (item.icon) item.icon.setVisible(false);
      });
    }

    if (uiElements.npcButtons) {
      uiElements.npcButtons.forEach(function(item) {
        item.btn.setVisible(false);
        if (item.label) item.label.setVisible(false);
      });
    }

    if (uiElements.locNavContainer) uiElements.locNavContainer.setVisible(false);
    if (uiElements.locPrevBtn) uiElements.locPrevBtn.setVisible(false);
    if (uiElements.locNextBtn) uiElements.locNextBtn.setVisible(false);
    if (uiElements.locNavLabel) uiElements.locNavLabel.setVisible(false);
    if (uiElements.skill1Btn) uiElements.skill1Btn.setVisible(false);
    if (uiElements.skill1Label) uiElements.skill1Label.setVisible(false);
    if (uiElements.skill2Btn) uiElements.skill2Btn.setVisible(false);
    if (uiElements.skill2Label) uiElements.skill2Label.setVisible(false);
    if (uiElements.autoBtn) uiElements.autoBtn.setVisible(false);
    if (uiElements.autoBtnLabel) uiElements.autoBtnLabel.setVisible(false);
    if (uiElements.sitButton) uiElements.sitButton.setVisible(false);
    if (uiElements.sitButtonLabel) uiElements.sitButtonLabel.setVisible(false);
    if (uiElements.shotsBtn) uiElements.shotsBtn.setVisible(false);
    if (uiElements.shotsBtnLabel) uiElements.shotsBtnLabel.setVisible(false);
    if (uiElements.hpPotionBtn) uiElements.hpPotionBtn.setVisible(false);
    if (uiElements.hpPotionLabel) uiElements.hpPotionLabel.setVisible(false);
    if (uiElements.mpPotionBtn) uiElements.mpPotionBtn.setVisible(false);
    if (uiElements.mpPotionLabel) uiElements.mpPotionLabel.setVisible(false);
    if (uiElements.cityBtn) uiElements.cityBtn.setVisible(false);
    if (uiElements.cityBtnLabel) uiElements.cityBtnLabel.setVisible(false);
  }
}

function showGameUIAfterArena() {
  if (typeof cityBg !== "undefined" && cityBg) cityBg.setVisible(mode === "city");
  if (typeof locationBg !== "undefined" && locationBg) locationBg.setVisible(mode === "location");
  if (typeof hero !== "undefined" && hero) hero.setVisible(mode === "location");
  if (typeof cityHero !== "undefined" && cityHero) cityHero.setVisible(mode === "city");
  if (typeof enemy !== "undefined" && enemy) enemy.setVisible(mode === "location");
  if (typeof enemyHpText !== "undefined" && enemyHpText) enemyHpText.setVisible(mode === "location");

  if (typeof uiElements !== "undefined" && uiElements) {
    if (uiElements.topBarBg) uiElements.topBarBg.setVisible(true);
    if (uiElements.hpBarBg) uiElements.hpBarBg.setVisible(true);
    if (uiElements.hpBarFill) uiElements.hpBarFill.setVisible(true);
    if (uiElements.hpBarLabel) uiElements.hpBarLabel.setVisible(true);
    if (uiElements.mpBarBg) uiElements.mpBarBg.setVisible(true);
    if (uiElements.mpBarFill) uiElements.mpBarFill.setVisible(true);
    if (uiElements.mpBarLabel) uiElements.mpBarLabel.setVisible(true);
    if (uiElements.expBarBg) uiElements.expBarBg.setVisible(true);
    if (uiElements.expBarFill) uiElements.expBarFill.setVisible(true);
    if (uiElements.levelLabel) uiElements.levelLabel.setVisible(true);
    if (uiElements.bottomBarBg) uiElements.bottomBarBg.setVisible(true);

    if (uiElements.menuButtons) {
      uiElements.menuButtons.forEach(function(item) {
        item.btn.setVisible(true);
        if (item.icon) item.icon.setVisible(true);
      });
    }

    if (uiElements.npcButtons && mode === "city") {
      uiElements.npcButtons.forEach(function(item) {
        item.btn.setVisible(true);
        if (item.label) item.label.setVisible(true);
      });
    }
  }

  if (typeof updateUIForMode === "function") {
    updateUIForMode(mode);
  }
}

function createArenaUI(scene) {
  var w = scene.scale.width;
  var h = scene.scale.height;

  arenaBg = scene.add.rectangle(w/2, h/2, w, h, 0x1a0a0a).setDepth(150);

  arenaTitle = scene.add.text(w/2, 60, "АРЕНА", {
    fontSize: "28px",
    color: "#ff4444",
    fontFamily: "Georgia"
  }).setOrigin(0.5).setDepth(151);

  arenaMyHpBg = scene.add.rectangle(30, 120, 150, 20, 0x333333).setOrigin(0, 0.5).setDepth(151);
  arenaMyHpBar = scene.add.rectangle(30, 120, 150, 20, 0x00cc00).setOrigin(0, 0.5).setDepth(152);
  arenaMyLabel = scene.add.text(30, 95, "Ты (Lv" + arenaMyStats.level + ")", {
    fontSize: "14px",
    color: "#ffffff",
    fontFamily: "Arial"
  }).setDepth(151);

  arenaEnemyHpBg = scene.add.rectangle(w - 30, 120, 150, 20, 0x333333).setOrigin(1, 0.5).setDepth(151);
  arenaEnemyHpBar = scene.add.rectangle(w - 30, 120, 150, 20, 0xcc0000).setOrigin(1, 0.5).setDepth(152);
  arenaEnemyLabel = scene.add.text(w - 30, 95, arenaEnemy.name, {
    fontSize: "14px",
    color: "#ffffff",
    fontFamily: "Arial"
  }).setOrigin(1, 0).setDepth(151);

  arenaMyChar = scene.add.rectangle(100, h/2, 60, 100, 0x4488ff).setDepth(151);
  arenaEnemyChar = scene.add.rectangle(w - 100, h/2, 60, 100, 0xff4444).setDepth(151);

  arenaBattleLog = scene.add.text(w/2, h - 100, "", {
    fontSize: "14px",
    color: "#cccccc",
    align: "center",
    fontFamily: "Arial"
  }).setOrigin(0.5).setDepth(151);
}

function startArenaCountdown(scene) {
  var w = scene.scale.width;
  var h = scene.scale.height;

  arenaCountText = scene.add.text(w/2, h/2, "3", {
    fontSize: "72px",
    color: "#ffffff",
    fontFamily: "Georgia"
  }).setOrigin(0.5).setDepth(160);

  var count = 3;
  scene.time.addEvent({
    delay: 800,
    repeat: 3,
    callback: function() {
      count--;
      if (count > 0) {
        arenaCountText.setText(count.toString());
      } else if (count === 0) {
        arenaCountText.setText("FIGHT!");
        arenaCountText.setColor("#ff4444");
      } else {
        if (arenaCountText) {
          arenaCountText.destroy();
          arenaCountText = null;
        }
        startArenaBattle(scene);
      }
    }
  });
}

function startArenaBattle(scene) {
  arenaBattleRunning = true;
  arenaBattleTick = 0;
  arenaMyTurn = Math.random() < 0.5;

  arenaBattleTimer = scene.time.addEvent({
    delay: 600,
    loop: true,
    callback: function() {
      arenaBattleStep(scene);
    }
  });
}

function arenaBattleStep(scene) {
  if (!arenaBattleRunning) return;

  arenaBattleTick++;

  if (arenaBattleTick > arenaMaxTicks) {
    var myPct = arenaMyStats.hp / arenaMyStats.maxHp;
    var enemyPct = arenaEnemy.stats.hp / arenaEnemy.stats.maxHp;
    endArenaBattle(scene, myPct >= enemyPct);
    return;
  }

  if (arenaMyTurn) {
    var dmg = calcArenaDamage(arenaMyStats, arenaEnemy.stats);
    arenaEnemy.stats.hp -= dmg;
    showArenaDamage(scene, arenaEnemyChar, dmg, false);
    updateArenaHpBars();

    if (arenaEnemy.stats.hp <= 0) {
      endArenaBattle(scene, true);
      return;
    }
  } else {
    var dmg = calcArenaDamage(arenaEnemy.stats, arenaMyStats);
    arenaMyStats.hp -= dmg;
    showArenaDamage(scene, arenaMyChar, dmg, true);
    updateArenaHpBars();

    if (arenaMyStats.hp <= 0) {
      endArenaBattle(scene, false);
      return;
    }
  }

  arenaMyTurn = !arenaMyTurn;
}

function calcArenaDamage(attacker, defender) {
  var atk = attacker.minAttack + Math.random() * (attacker.maxAttack - attacker.minAttack);
  var def = defender.pDef || 10;
  var dmg = Math.max(1, Math.floor((atk * 100000) / (100000 + def)));

  if (Math.random() < (attacker.critChance || 0.05)) {
    dmg = Math.floor(dmg * (attacker.critMultiplier || 1.5));
  }

  return dmg;
}

function showArenaDamage(scene, target, dmg, isMe) {
  var text = scene.add.text(target.x, target.y - 50, "-" + dmg, {
    fontSize: "20px",
    color: isMe ? "#ff4444" : "#44ff44",
    fontFamily: "Arial"
  }).setOrigin(0.5).setDepth(155);

  scene.tweens.add({
    targets: text,
    y: text.y - 40,
    alpha: 0,
    duration: 800,
    onComplete: function() { text.destroy(); }
  });
}

function updateArenaHpBars() {
  var myPct = Math.max(0, arenaMyStats.hp / arenaMyStats.maxHp);
  var enemyPct = Math.max(0, arenaEnemy.stats.hp / arenaEnemy.stats.maxHp);

  if (arenaMyHpBar) arenaMyHpBar.setScale(myPct, 1);
  if (arenaEnemyHpBar) arenaEnemyHpBar.setScale(enemyPct, 1);
}

function endArenaBattle(scene, isWin) {
  arenaBattleRunning = false;

  if (arenaBattleTimer) {
    arenaBattleTimer.remove();
    arenaBattleTimer = null;
  }

  var result = applyArenaRewards(isWin, arenaEnemy);
  showArenaResult(scene, result);
}

function showArenaResult(scene, result) {
  var w = scene.scale.width;
  var h = scene.scale.height;

  arenaResultOverlay = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.7).setDepth(170);

  arenaResultPanel = scene.add.rectangle(w/2, h/2, 280, 250, 0x1a1a2e, 0.95)
    .setStrokeStyle(3, result.isWin ? 0x44ff44 : 0xff4444)
    .setDepth(171);

  var resultText = result.isWin ? "ПОБЕДА!" : "ПОРАЖЕНИЕ";
  var resultColor = result.isWin ? "#44ff44" : "#ff4444";

  arenaResultTitle = scene.add.text(w/2, h/2 - 80, resultText, {
    fontSize: "32px",
    color: resultColor,
    fontFamily: "Georgia"
  }).setOrigin(0.5).setDepth(172);

  var rewardsText = "Рейтинг: " + (result.ratingDelta > 0 ? "+" : "") + result.ratingDelta + "\n";
  rewardsText += "EXP: +" + result.expGain + "\n";
  rewardsText += "Honor: +" + result.honorGain;

  arenaResultRewards = scene.add.text(w/2, h/2, rewardsText, {
    fontSize: "18px",
    color: "#ffffff",
    align: "center",
    lineSpacing: 8,
    fontFamily: "Arial"
  }).setOrigin(0.5).setDepth(172);

  arenaResultBtn = scene.add.rectangle(w/2, h/2 + 85, 150, 45, 0x4a6a4a)
    .setStrokeStyle(2, 0x6a8a6a)
    .setInteractive({ useHandCursor: true })
    .setDepth(172);

  arenaResultBtnText = scene.add.text(w/2, h/2 + 85, "В город", {
    fontSize: "18px",
    color: "#ffffff",
    fontFamily: "Arial"
  }).setOrigin(0.5).setDepth(173);

  arenaResultBtn.on("pointerdown", function() {
    exitArenaMode(scene);
  });
}

function exitArenaMode(scene) {
  if (arenaBg) { arenaBg.destroy(); arenaBg = null; }
  if (arenaTitle) { arenaTitle.destroy(); arenaTitle = null; }
  if (arenaMyHpBg) { arenaMyHpBg.destroy(); arenaMyHpBg = null; }
  if (arenaMyHpBar) { arenaMyHpBar.destroy(); arenaMyHpBar = null; }
  if (arenaMyLabel) { arenaMyLabel.destroy(); arenaMyLabel = null; }
  if (arenaEnemyHpBg) { arenaEnemyHpBg.destroy(); arenaEnemyHpBg = null; }
  if (arenaEnemyHpBar) { arenaEnemyHpBar.destroy(); arenaEnemyHpBar = null; }
  if (arenaEnemyLabel) { arenaEnemyLabel.destroy(); arenaEnemyLabel = null; }
  if (arenaMyChar) { arenaMyChar.destroy(); arenaMyChar = null; }
  if (arenaEnemyChar) { arenaEnemyChar.destroy(); arenaEnemyChar = null; }
  if (arenaCountText) { arenaCountText.destroy(); arenaCountText = null; }
  if (arenaBattleLog) { arenaBattleLog.destroy(); arenaBattleLog = null; }
  if (arenaResultOverlay) { arenaResultOverlay.destroy(); arenaResultOverlay = null; }
  if (arenaResultPanel) { arenaResultPanel.destroy(); arenaResultPanel = null; }
  if (arenaResultTitle) { arenaResultTitle.destroy(); arenaResultTitle = null; }
  if (arenaResultRewards) { arenaResultRewards.destroy(); arenaResultRewards = null; }
  if (arenaResultBtn) { arenaResultBtn.destroy(); arenaResultBtn = null; }
  if (arenaResultBtnText) { arenaResultBtnText.destroy(); arenaResultBtnText = null; }

  arenaEnemy = null;
  arenaMyStats = null;
  arenaBattleRunning = false;

  showGameUIAfterArena();

  if (typeof enterCity === "function") {
    enterCity(scene);
  }

  if (typeof updateHeroUI === "function") {
    updateHeroUI();
  }
}

// ----- УВЕДОМЛЕНИЯ -----
function showArenaNotification(scene, message) {
  var w = scene.scale.width;
  var h = scene.scale.height;

  var notif = scene.add.text(w/2, h * 0.3, message, {
    fontSize: "16px",
    color: "#ffcc00",
    backgroundColor: "#000000",
    padding: { x: 12, y: 8 },
    fontFamily: "Arial"
  }).setOrigin(0.5).setDepth(250);

  scene.tweens.add({
    targets: notif,
    alpha: 0,
    y: notif.y - 30,
    duration: 2000,
    delay: 1000,
    onComplete: function() { notif.destroy(); }
  });
}
