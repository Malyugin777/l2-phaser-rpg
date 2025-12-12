// ----- Панель: Квесты -----
function showQuestsPanel() {
  isQuestsOpen = true;
  questsPanel.setVisible(true);
  questsPanelText.setVisible(true);
  
  // Авто-сдача квеста волка
  if (canCompleteWolfQuest()) {
    completeWolfQuest(window.gameScene);
  }
  
  updateQuestsPanel();
}

function hideQuestsPanel() {
  isQuestsOpen = false;
  questsPanel.setVisible(false);
  questsPanelText.setVisible(false);
}

function updateQuestsPanel() {
  const killQuestTarget = 20;
  const goldQuestTarget = 100;
  const eliteQuestTarget = 5;

  const killProgress = Math.min(progress.kills, killQuestTarget);
  const goldProgress = Math.min(wallet.gold, goldQuestTarget);
  const eliteProgress = Math.min(progress.eliteKills, eliteQuestTarget);

  const killStatus = quests.killQuestDone
    ? "   Статус: выполнен ✅"
    : "   Статус: в процессе";
  const goldStatus = quests.goldQuestDone
    ? "   Статус: выполнен ✅"
    : "   Статус: в процессе";
  const eliteStatus = quests.eliteQuestDone
    ? "   Статус: выполнен ✅"
    : "   Статус: в процессе";

  // Квест волка
  const wolfFangs = countWolfFangs();
  const wolfStatus = pet.obtained
    ? "   Статус: выполнен 🐺"
    : (wolfFangs >= 5 ? "   Статус: ГОТОВ К СДАЧЕ!" : "   Статус: в процессе");

  const lines = [
    "КВЕСТЫ / ДЕЙЛИКИ",
    "----------------------",
    "1) Охота в Глудио",
    "   Задача: убей " + killQuestTarget + " мобов",
    "   Прогресс: " + killProgress + "/" + killQuestTarget,
    "   Награда: +100 адены, +10 Эфира",
    killStatus,
    "",
    "2) Поднять капитал",
    "   Задача: накопи " + goldQuestTarget + " адены",
    "   Прогресс: " + goldProgress + "/" + goldQuestTarget,
    "   Награда: +50 адены, +5 Эфира",
    goldStatus,
    "",
    "3) Элитный охотник",
    "   Задача: убей " + eliteQuestTarget + " элитных мобов",
    "   Прогресс: " + eliteProgress + "/" + eliteQuestTarget,
    "   Награда: +150 адены, +15 Эфира",
    eliteStatus,
    "",
    "4) 🐺 Приручи волка",
    "   Задача: собери 5 Wolf Fang (Grey Wolf)",
    "   Прогресс: " + wolfFangs + "/5",
    "   Награда: питомец Волк",
    wolfStatus,
  ];
  questsPanelText.setText(lines.join("\n"));
}

function showQuestRewardPopup(scene, title, lines) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const panel = scene.add
    .rectangle(w / 2, h / 2, 520, 260, 0x000000, 0.9)
    .setStrokeStyle(2, 0xffffff);
  const text = scene.add
    .text(
      w / 2,
      h / 2,
      [title, "----------------------", ...lines].join("\n"),
      {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
      }
    )
    .setOrigin(0.5);

  panel.setDepth(35);
  text.setDepth(36);

  scene.tweens.add({
    targets: [panel, text],
    alpha: { from: 1, to: 0 },
    delay: 2000,
    duration: 800,
    ease: "Power1",
    onComplete: function () {
      panel.destroy();
      text.destroy();
    },
  });
}