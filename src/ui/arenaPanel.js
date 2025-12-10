// ----- Панель: Арена -----
function showArenaPanel() {
  isArenaOpen = true;

  // Закрываем остальные панели
  hideInventoryPanel();
  hideStatsPanel();
  hideForgePanel();
  hideQuestsPanel();
  hideShopPanel();
  hideMapPanel();
  hideDungeonPanel();

  arenaPanel.setVisible(true);
  arenaText.setVisible(true);
  arenaFightButton.setVisible(true);
  arenaFightButtonText.setVisible(true);
  arenaBackButton.setVisible(true);
  arenaBackButtonText.setVisible(true);

  updateArenaPanel();
}

function hideArenaPanel() {
  isArenaOpen = false;
  arenaPanel.setVisible(false);
  arenaText.setVisible(false);
  arenaFightButton.setVisible(false);
  arenaFightButtonText.setVisible(false);
  arenaBackButton.setVisible(false);
  arenaBackButtonText.setVisible(false);
}

function updateArenaPanel() {
  const lines = [
    "АРЕНА (логический бой)",
    "----------------------",
    "Твой герой дерётся с \"Тенью\" —",
    "копией по уровню и статам,",
    "но с небольшой рандомной форой.",
    "",
    "Текущий рейтинг Арены: " + heroArenaRating,
    "",
    "Награды за бой:",
    "  Победа: адена + EXP + рост рейтинга",
    "  Поражение: немного адены, рейтинг вниз",
    "  Ничья: небольшой опыт и адена",
    "",
    'Нажми "Начать бой" для симуляции.',
  ];
  arenaText.setText(lines.join("\n"));
}
