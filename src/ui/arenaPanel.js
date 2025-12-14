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

  if (arenaPanel) arenaPanel.setVisible(true);
  if (arenaText) arenaText.setVisible(true);
  if (arenaFightButton) arenaFightButton.setVisible(true);
  if (arenaFightButtonText) arenaFightButtonText.setVisible(true);
  if (arenaBackButton) arenaBackButton.setVisible(true);
  if (arenaBackButtonText) arenaBackButtonText.setVisible(true);

  updateArenaPanel();
}

function hideArenaPanel() {
  isArenaOpen = false;
  if (arenaPanel) arenaPanel.setVisible(false);
  if (arenaText) arenaText.setVisible(false);
  if (arenaFightButton) arenaFightButton.setVisible(false);
  if (arenaFightButtonText) arenaFightButtonText.setVisible(false);
  if (arenaBackButton) arenaBackButton.setVisible(false);
  if (arenaBackButtonText) arenaBackButtonText.setVisible(false);
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
