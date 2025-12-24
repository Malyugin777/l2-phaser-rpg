"use strict";

// ============================================================
//  ARENA UI — HP бары, таймер, экран результата
// ============================================================

let arenaUIElements = {
  // HP bars
  playerHpBg: null,
  playerHpBar: null,
  playerHpText: null,
  playerNameText: null,

  enemyHpBg: null,
  enemyHpBar: null,
  enemyHpText: null,
  enemyNameText: null,

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

const ARENA_UI_CONFIG = {
  hpBar: {
    width: 320,       // Wider
    height: 32,       // Taller
    playerX: 40,
    enemyX: null,     // calculated from screen width
    y: 60,            // Lower from top
    bgColor: 0x111111,
    fillColor: 0x22dd22,       // Brighter green
    enemyFillColor: 0xdd2222,  // Brighter red
    borderColor: 0xffffff,
    borderWidth: 3
  },
  timer: {
    y: 50,
    fontSize: "36px"  // Bigger
  }
};

function createArenaUI(scene) {
  console.log("[ArenaUI] Creating UI for scene:", scene ? "exists" : "null");

  const w = scene.scale.width;
  const h = scene.scale.height;
  const cfg = ARENA_UI_CONFIG.hpBar;

  console.log("[ArenaUI] Screen size:", w, "x", h);

  cfg.enemyX = w - cfg.width - 40;

  // === PLAYER HP BAR ===
  arenaUIElements.playerHpBg = scene.add.rectangle(
    cfg.playerX, cfg.y, cfg.width, cfg.height, cfg.bgColor
  ).setOrigin(0, 0).setDepth(500).setScrollFactor(0);

  arenaUIElements.playerHpBar = scene.add.rectangle(
    cfg.playerX, cfg.y, cfg.width, cfg.height, cfg.fillColor
  ).setOrigin(0, 0).setDepth(501).setScrollFactor(0);

  arenaUIElements.playerNameText = scene.add.text(
    cfg.playerX, cfg.y - 22, "YOU", {
      fontSize: "18px",
      color: "#44ff44",
      fontFamily: "Arial"
    }
  ).setDepth(502).setScrollFactor(0);

  arenaUIElements.playerHpText = scene.add.text(
    cfg.playerX + cfg.width / 2, cfg.y + cfg.height / 2, "100%", {
      fontSize: "14px",
      color: "#ffffff",
      fontFamily: "Arial"
    }
  ).setOrigin(0.5).setDepth(502).setScrollFactor(0);

  // === ENEMY HP BAR ===
  arenaUIElements.enemyHpBg = scene.add.rectangle(
    cfg.enemyX, cfg.y, cfg.width, cfg.height, cfg.bgColor
  ).setOrigin(0, 0).setDepth(500).setScrollFactor(0);

  arenaUIElements.enemyHpBar = scene.add.rectangle(
    cfg.enemyX, cfg.y, cfg.width, cfg.height, cfg.enemyFillColor
  ).setOrigin(0, 0).setDepth(501).setScrollFactor(0);

  arenaUIElements.enemyNameText = scene.add.text(
    cfg.enemyX + cfg.width, cfg.y - 22, "ENEMY", {
      fontSize: "18px",
      color: "#ff4444",
      fontFamily: "Arial"
    }
  ).setOrigin(1, 0).setDepth(502).setScrollFactor(0);

  arenaUIElements.enemyHpText = scene.add.text(
    cfg.enemyX + cfg.width / 2, cfg.y + cfg.height / 2, "100%", {
      fontSize: "14px",
      color: "#ffffff",
      fontFamily: "Arial"
    }
  ).setOrigin(0.5).setDepth(502).setScrollFactor(0);

  // === TIMER ===
  arenaUIElements.timerBg = scene.add.rectangle(
    w / 2, ARENA_UI_CONFIG.timer.y, 80, 40, 0x000000, 0.7
  ).setDepth(500).setScrollFactor(0);

  arenaUIElements.timerText = scene.add.text(
    w / 2, ARENA_UI_CONFIG.timer.y, "30", {
      fontSize: ARENA_UI_CONFIG.timer.fontSize,
      color: "#ffffff",
      fontFamily: "Arial"
    }
  ).setOrigin(0.5).setDepth(501).setScrollFactor(0);

  console.log("[ArenaUI] Created elements:", {
    playerHpBar: !!arenaUIElements.playerHpBar,
    enemyHpBar: !!arenaUIElements.enemyHpBar,
    timerText: !!arenaUIElements.timerText
  });
}

function updateArenaUI(state) {
  if (!arenaUIElements.playerHpBar) return;

  const cfg = ARENA_UI_CONFIG.hpBar;

  // Player HP
  const playerPct = Math.max(0, state.playerHealth / state.playerMaxHealth);
  arenaUIElements.playerHpBar.setSize(cfg.width * playerPct, cfg.height);
  arenaUIElements.playerHpText.setText(Math.round(playerPct * 100) + "%");

  // Enemy HP
  const enemyPct = Math.max(0, state.enemyHealth / state.enemyMaxHealth);
  arenaUIElements.enemyHpBar.setSize(cfg.width * enemyPct, cfg.height);
  arenaUIElements.enemyHpText.setText(Math.round(enemyPct * 100) + "%");

  // Timer
  const seconds = Math.ceil(state.timeLeft / 1000);
  arenaUIElements.timerText.setText(seconds.toString());

  // Timer color warning
  if (seconds <= 10) {
    arenaUIElements.timerText.setColor("#ff4444");
  } else if (seconds <= 20) {
    arenaUIElements.timerText.setColor("#ffaa00");
  } else {
    arenaUIElements.timerText.setColor("#ffffff");
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
    "Ваш урон: " + battleResult.playerDamageDealt,
    "Урон врага: " + battleResult.enemyDamageDealt,
    "Ваше HP: " + battleResult.playerHealthLeft,
    "HP врага: " + battleResult.enemyHealthLeft
  ].join("\n");

  arenaUIElements.resultStats = scene.add.text(
    w / 2, h / 2 - 50, statsText, {
      fontSize: "18px",
      color: "#aaaaaa",
      fontFamily: "Arial",
      align: "center",
      lineSpacing: 6
    }
  ).setOrigin(0.5).setDepth(602).setScrollFactor(0);

  // Rewards
  const league = getLeague(rewards.newRating);
  const ratingSign = rewards.ratingChange > 0 ? "+" : "";

  const rewardsText = [
    "─────────────",
    league.icon + " Рейтинг: " + ratingSign + rewards.ratingChange + " (" + rewards.newRating + ")",
    "EXP: +" + rewards.expReward,
    "Адена: +" + rewards.goldReward
  ].join("\n");

  arenaUIElements.resultRewards = scene.add.text(
    w / 2, h / 2 + 60, rewardsText, {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Arial",
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
      fontFamily: "Arial"
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

  // Apply rewards
  if (stats.progression) {
    stats.progression.xp += rewards.expReward;
  }
  if (wallet) {
    wallet.gold += rewards.goldReward;
  }
  if (typeof saveGame === "function") {
    saveGame();
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
    if (arenaUIElements[key]) {
      arenaUIElements[key].destroy();
      arenaUIElements[key] = null;
    }
  });
  console.log("[ArenaUI] Destroyed");
}

console.log("[ArenaUI] Module loaded");
