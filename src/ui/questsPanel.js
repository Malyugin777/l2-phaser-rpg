// ----- Панель: Квесты -----
function showQuestsPanel() {
  isQuestsOpen = true;
  questsPanel.setVisible(true);
  questsPanelText.setVisible(true);
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

  const killProgress = Math.min(heroKills, killQuestTarget);
  const goldProgress = Math.min(heroGold, goldQuestTarget);
  const eliteProgress = Math.min(heroEliteKills, eliteQuestTarget);

  const killStatus = questKillCompleted
    ? "   Статус: выполнен ✅"
    : "   Статус: в процессе";
  const goldStatus = questGoldCompleted
    ? "   Статус: выполнен ✅"
    : "   Статус: в процессе";
  const eliteStatus = questEliteCompleted
    ? "   Статус: выполнен ✅"
    : "   Статус: в процессе";

  const lines = [
    "КВЕСТЫ / ДЕЙЛИКИ",
    "----------------------",
    "1) Охота в Глудио",
    "   Задача: убей " + killQuestTarget + " мобов",
    "   Прогресс: " + killProgress + "/" + killQuestTarget,
    "   Награда: +100 адены, +10 Эфира, +3 HP, +3 MP",
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
    "   Награда: +150 адены, +15 Эфира, +3 HP, +3 MP",
    eliteStatus,
    "",
    "Квесты выполняются по одному разу,",
    "награда сохраняется между сессиями.",
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
