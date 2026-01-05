"use strict";

// ============================================================
//  ARENA UI v3 — HP бары, таймер, экран результата
//  Фиксы: реальные имена, HP в формате 800/800, без % у врага
// ============================================================

let arenaUIElements = {
  // HP bars
  playerHpBg: null,
  playerHpBar: null,
  playerHpText: null,
  playerNameText: null,
  playerMaxHp: 800,

  enemyHpBg: null,
  enemyHpBar: null,
  enemyNameText: null,
  enemyLevelText: null,

  // Timer
  timerBg: null,
  timerText: null,

  // Result screen
  resultOverlay: null,
  resultPanel: null,
  resultTitle: null,
  resultStats: null,
  resultRewards: null,
  resultButton: null,
  resultButtonText: null
};

/**
 * Создать Arena UI
 * @param {Phaser.Scene} scene
 * @param {Object} playerData - { name, maxHealth }
 * @param {Object} enemyData - { name, level }
 */
function createArenaUI(scene, playerData, enemyData) {
  console.log("[ArenaUI] Creating UI v3");

  const w = scene.scale.width;
  const h = scene.scale.height;
  const centerX = w / 2;

  // === HP BARS ===
  const barW = 280;
  const barH = 36;
  const barY = h * 0.38;
  const gap = 60;

  // === PLAYER (left) ===
  arenaUIElements.playerHpBg = scene.add.rectangle(centerX - gap - barW/2, barY, barW, barH, 0x111111)
    .setScrollFactor(0).setDepth(999).setStrokeStyle(3, 0x44ff44);

  arenaUIElements.playerHpBar = scene.add.rectangle(centerX - gap - barW/2, barY, barW - 8, barH - 8, 0x22dd22)
    .setScrollFactor(0).setDepth(1000);

  // Player name — реальное имя
  const playerName = playerData?.name || window.playerName || 'Player';
  arenaUIElements.playerNameText = scene.add.text(centerX - gap - barW/2, barY - 30, playerName, {
    fontSize: "22px", color: "#44ff44", fontFamily: "Verdana", fontStyle: "bold"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

  // Player HP — формат "800/800"
  const maxHp = playerData?.maxHealth || 800;
  arenaUIElements.playerMaxHp = maxHp;
  arenaUIElements.playerHpText = scene.add.text(centerX - gap - barW/2, barY, maxHp + "/" + maxHp, {
    fontSize: "16px", color: "#ffffff", fontFamily: "Verdana", fontStyle: "bold"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

  // === ENEMY (right) ===
  arenaUIElements.enemyHpBg = scene.add.rectangle(centerX + gap + barW/2, barY, barW, barH, 0x111111)
    .setScrollFactor(0).setDepth(999).setStrokeStyle(3, 0xff4444);

  arenaUIElements.enemyHpBar = scene.add.rectangle(centerX + gap + barW/2, barY, barW - 8, barH - 8, 0xdd2222)
    .setScrollFactor(0).setDepth(1000);

  // Enemy name — реальное имя противника
  const enemyName = enemyData?.name || window.currentOpponent?.name || 'Enemy';
  arenaUIElements.enemyNameText = scene.add.text(centerX + gap + barW/2, barY - 30, enemyName, {
    fontSize: "22px", color: "#ff4444", fontFamily: "Verdana", fontStyle: "bold"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

  // Enemy level (под именем, мелко)
  const enemyLevel = enemyData?.level || 1;
  arenaUIElements.enemyLevelText = scene.add.text(centerX + gap + barW/2, barY + 30, "Lv." + enemyLevel, {
    fontSize: "14px", color: "#ff8888", fontFamily: "Verdana"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

  // БЕЗ enemyHpText — враг не видит свои HP числами!

  // === TIMER (center) ===
  arenaUIElements.timerBg = scene.add.rectangle(centerX, barY, 100, 50, 0x000000, 0.9)
    .setScrollFactor(0).setDepth(999).setStrokeStyle(3, 0xffaa00);

  arenaUIElements.timerText = scene.add.text(centerX, barY, "30", {
    fontSize: "36px", color: "#ffffff", fontFamily: "Verdana", fontStyle: "bold"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

  // Сохранить данные для VS screen
  window.currentOpponent = enemyData;

  console.log("[ArenaUI] Created: player=" + playerName + ", enemy=" + enemyName);
}

function updateArenaUI(state) {
  if (!arenaUIElements.playerHpBar || !arenaUIElements.enemyHpBar) {
    return;
  }

  const barW = 280 - 8;

  // Player HP bar + text "currentHp/maxHp"
  const playerPct = Math.max(0, Math.min(1, state.playerHealth / state.playerMaxHealth));
  arenaUIElements.playerHpBar.setSize(barW * playerPct, 28);

  if (arenaUIElements.playerHpText) {
    const currentHp = Math.max(0, Math.round(state.playerHealth));
    const maxHp = Math.round(state.playerMaxHealth);
    arenaUIElements.playerHpText.setText(currentHp + "/" + maxHp);
  }

  // Enemy HP bar ONLY (no text!)
  const enemyPct = Math.max(0, Math.min(1, state.enemyHealth / state.enemyMaxHealth));
  arenaUIElements.enemyHpBar.setSize(barW * enemyPct, 28);

  // Timer
  if (arenaUIElements.timerText && state.timeLeft !== undefined) {
    const seconds = Math.max(0, Math.ceil(state.timeLeft / 1000));
    arenaUIElements.timerText.setText(seconds.toString());

    if (seconds <= 10) {
      arenaUIElements.timerText.setColor("#ff4444");
    } else if (seconds <= 20) {
      arenaUIElements.timerText.setColor("#ffaa00");
    } else {
      arenaUIElements.timerText.setColor("#ffffff");
    }
  }
}

function showArenaResult(scene, isWin, rewards, battleResult) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  // Overlay
  arenaUIElements.resultOverlay = scene.add.rectangle(
    w / 2, h / 2, w, h, 0x000000, 0.8
  ).setDepth(600).setScrollFactor(0);

  // Panel
  arenaUIElements.resultPanel = scene.add.rectangle(
    w / 2, h / 2, 350, 400, 0x1a1a2e, 0.95
  ).setStrokeStyle(4, isWin ? 0x44ff44 : 0xff4444)
  .setDepth(601).setScrollFactor(0);

  // Title
  const titleText = isWin ? "ПОБЕДА!" : "ПОРАЖЕНИЕ";
  const titleColor = isWin ? "#44ff44" : "#ff4444";

  arenaUIElements.resultTitle = scene.add.text(
    w / 2, h / 2 - 150, titleText, {
      fontSize: "42px",
      color: titleColor,
      fontFamily: "Georgia"
    }
  ).setOrigin(0.5).setDepth(602).setScrollFactor(0);

  // Battle stats
  const statsText = [
    "Ваш урон: " + (battleResult?.playerDamageDealt || 0),
    "Урон врага: " + (battleResult?.enemyDamageDealt || 0),
    "Ваше HP: " + (battleResult?.playerHealthLeft || 0),
    "HP врага: " + (battleResult?.enemyHealthLeft || 0)
  ].join("\n");

  arenaUIElements.resultStats = scene.add.text(
    w / 2, h / 2 - 50, statsText, {
      fontSize: "18px",
      color: "#aaaaaa",
      fontFamily: "Verdana",
      align: "center",
      lineSpacing: 6
    }
  ).setOrigin(0.5).setDepth(602).setScrollFactor(0);

  // Rewards
  const league = typeof getLeague === 'function' ? getLeague(rewards?.newRating || 0) : { icon: '🏆' };
  const ratingSign = (rewards?.ratingChange || 0) > 0 ? "+" : "";

  const rewardsText = [
    "─────────────",
    league.icon + " Рейтинг: " + ratingSign + (rewards?.ratingChange || 0) + " (" + (rewards?.newRating || 0) + ")",
    "EXP: +" + (rewards?.expReward || 0),
    "Адена: +" + (rewards?.goldReward || 0)
  ].join("\n");

  arenaUIElements.resultRewards = scene.add.text(
    w / 2, h / 2 + 60, rewardsText, {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Verdana",
      align: "center",
      lineSpacing: 8
    }
  ).setOrigin(0.5).setDepth(602).setScrollFactor(0);

  // Button
  arenaUIElements.resultButton = scene.add.rectangle(
    w / 2, h / 2 + 160, 180, 50, 0x4a6a4a
  ).setStrokeStyle(2, 0x6a8a6a)
  .setInteractive({ useHandCursor: true })
  .setDepth(602).setScrollFactor(0);

  arenaUIElements.resultButtonText = scene.add.text(
    w / 2, h / 2 + 160, "В ГОРОД", {
      fontSize: "22px",
      color: "#ffffff",
      fontFamily: "Verdana"
    }
  ).setOrigin(0.5).setDepth(603).setScrollFactor(0);

  // Button hover
  arenaUIElements.resultButton.on("pointerover", () => {
    arenaUIElements.resultButton.setFillStyle(0x5a7a5a);
  });
  arenaUIElements.resultButton.on("pointerout", () => {
    arenaUIElements.resultButton.setFillStyle(0x4a6a4a);
  });

  // Button click
  arenaUIElements.resultButton.on("pointerdown", () => {
    hideArenaResult();
    if (typeof exitArena === "function") {
      exitArena(scene);
    }
  });

  // Apply rewards to heroState
  if (window.heroState && rewards) {
    window.heroState.exp = (window.heroState.exp || 0) + (rewards.expReward || 0);
    window.heroState.gold = (window.heroState.gold || 0) + (rewards.goldReward || 0);
    window.heroState.rating = rewards.newRating || window.heroState.rating;
    console.log("[ArenaUI] Rewards applied:", rewards);
  }

  // Update header UI
  if (typeof window.updateHeaderStats === "function") {
    window.updateHeaderStats();
  }

  // Save to server
  if (typeof window.apiSaveProgress === "function" && typeof window.apiIsAuthenticated === "function" && window.apiIsAuthenticated()) {
    window.apiSaveProgress({
      level: window.heroState?.level || 1,
      rating: window.heroState?.rating || 0,
      kills: window.heroState?.kills || 0,
      energy: window.heroState?.energy || 100,
      gold: window.heroState?.gold || 0,
      gems: window.heroState?.gems || 0,
      exp: window.heroState?.exp || 0
    });
  }
}

function hideArenaResult() {
  Object.keys(arenaUIElements).forEach(key => {
    if (key.startsWith("result") && arenaUIElements[key]) {
      arenaUIElements[key].destroy();
      arenaUIElements[key] = null;
    }
  });
}

function destroyArenaUI() {
  Object.keys(arenaUIElements).forEach(key => {
    if (arenaUIElements[key] && arenaUIElements[key].destroy) {
      arenaUIElements[key].destroy();
      arenaUIElements[key] = null;
    }
  });
  arenaUIElements.playerMaxHp = 800;
  console.log("[ArenaUI] Destroyed");
}

// Expose globally
window.createArenaUI = createArenaUI;
window.updateArenaUI = updateArenaUI;
window.showArenaResult = showArenaResult;
window.hideArenaResult = hideArenaResult;
window.destroyArenaUI = destroyArenaUI;
window.arenaUIElements = arenaUIElements;

console.log("[ArenaUI] Module loaded v3");
