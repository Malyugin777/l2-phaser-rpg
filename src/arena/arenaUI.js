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
  console.log("[ArenaUI] Creating UI");

  const w = scene.scale.width;
  const h = scene.scale.height;
  const centerX = w / 2;

  // === HP BARS ===
  const barW = 280;
  const barH = 36;
  const barY = h * 0.38;  // ~38% from top
  const gap = 60;

  // PLAYER HP — left
  arenaUIElements.playerHpBg = scene.add.rectangle(centerX - gap - barW/2, barY, barW, barH, 0x111111)
    .setScrollFactor(0).setDepth(999).setStrokeStyle(3, 0x44ff44);

  arenaUIElements.playerHpBar = scene.add.rectangle(centerX - gap - barW/2, barY, barW - 8, barH - 8, 0x22dd22)
    .setScrollFactor(0).setDepth(1000);

  arenaUIElements.playerNameText = scene.add.text(centerX - gap - barW/2, barY - 30, "ВЫ", {
    fontSize: "24px", color: "#44ff44", fontFamily: "Arial", fontStyle: "bold"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

  arenaUIElements.playerHpText = scene.add.text(centerX - gap - barW/2, barY, "100%", {
    fontSize: "20px", color: "#ffffff", fontFamily: "Arial", fontStyle: "bold"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

  // ENEMY HP — right
  arenaUIElements.enemyHpBg = scene.add.rectangle(centerX + gap + barW/2, barY, barW, barH, 0x111111)
    .setScrollFactor(0).setDepth(999).setStrokeStyle(3, 0xff4444);

  arenaUIElements.enemyHpBar = scene.add.rectangle(centerX + gap + barW/2, barY, barW - 8, barH - 8, 0xdd2222)
    .setScrollFactor(0).setDepth(1000);

  arenaUIElements.enemyNameText = scene.add.text(centerX + gap + barW/2, barY - 30, "ВРАГ", {
    fontSize: "24px", color: "#ff4444", fontFamily: "Arial", fontStyle: "bold"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

  arenaUIElements.enemyHpText = scene.add.text(centerX + gap + barW/2, barY, "100%", {
    fontSize: "20px", color: "#ffffff", fontFamily: "Arial", fontStyle: "bold"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

  // === TIMER — center between HP bars ===
  arenaUIElements.timerBg = scene.add.rectangle(centerX, barY, 100, 50, 0x000000, 0.9)
    .setScrollFactor(0).setDepth(999).setStrokeStyle(3, 0xffaa00);

  arenaUIElements.timerText = scene.add.text(centerX, barY, "30", {
    fontSize: "36px", color: "#ffffff", fontFamily: "Arial", fontStyle: "bold"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

  console.log("[ArenaUI] UI created, barY:", barY);
}

function updateArenaUI(state) {
  if (!arenaUIElements.playerHpBar || !arenaUIElements.enemyHpBar) {
    console.warn("[ArenaUI] HP bars not created yet");
    return;
  }

  const barW = 280 - 8;

  // Player HP
  const playerPct = Math.max(0, Math.min(1, state.playerHealth / state.playerMaxHealth));
  arenaUIElements.playerHpBar.setSize(barW * playerPct, 28);
  arenaUIElements.playerHpText.setText(Math.round(playerPct * 100) + "%");

  // Enemy HP
  const enemyPct = Math.max(0, Math.min(1, state.enemyHealth / state.enemyMaxHealth));
  arenaUIElements.enemyHpBar.setSize(barW * enemyPct, 28);
  arenaUIElements.enemyHpText.setText(Math.round(enemyPct * 100) + "%");

  // Timer
  if (arenaUIElements.timerText) {
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

  // Apply rewards to heroState
  if (window.heroState) {
    window.heroState.exp = (window.heroState.exp || 0) + rewards.expReward;
    window.heroState.gold = (window.heroState.gold || 0) + rewards.goldReward;
    window.heroState.rating = rewards.newRating;
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
    if (arenaUIElements[key]) {
      arenaUIElements[key].destroy();
      arenaUIElements[key] = null;
    }
  });
  console.log("[ArenaUI] Destroyed");
}

// Expose globally
window.createArenaUI = createArenaUI;
window.updateArenaUI = updateArenaUI;
window.showArenaResult = showArenaResult;
window.hideArenaResult = hideArenaResult;
window.destroyArenaUI = destroyArenaUI;
window.arenaUIElements = arenaUIElements;

console.log("[ArenaUI] Module loaded v2");
