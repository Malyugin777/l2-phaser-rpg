// ----- Панель: Данж -----
function showDungeonPanel() {
  isDungeonOpen = true;

  // Закрываем остальные панели
  hideInventoryPanel();
  hideStatsPanel();
  hideForgePanel();
  hideQuestsPanel();
  hideShopPanel();
  hideMapPanel();
  hideArenaPanel();

  dungeonPanel.setVisible(true);
  dungeonPanelText.setVisible(true);
  dungeonStartButton.setVisible(true);
  dungeonStartButtonText.setVisible(true);

  updateDungeonPanel();
}

function hideDungeonPanel() {
  isDungeonOpen = false;
  dungeonPanel.setVisible(false);
  dungeonPanelText.setVisible(false);
  dungeonStartButton.setVisible(false);
  dungeonStartButtonText.setVisible(false);
}

function updateDungeonPanel() {
  const loc = getCurrentLocation();
  const lines = [
    "ДАНЖ: МИНИ-РАУНД",
    "----------------------",
    "Ты запускаешь ограниченный забег в текущей локации:",
    "",
    "Локация: " + loc.name,
    "Цель: убить " + DUNGEON_KILL_TARGET + " мобов",
    "",
    "За каждое убийство ты получаешь обычную награду,",
    "а в конце забега — дополнительный бонус:",
    "  • +золотой бонус",
    "  • +Эфир",
    "",
    "Если погибнешь — тебя выкинет в город с штрафом EXP,",
    "как обычно, и прогресс забега сгорит.",
    "",
    'Нажми "Войти в данж", чтобы начать ран.',
  ];
  dungeonPanelText.setText(lines.join("\n"));
}
