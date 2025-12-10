// ----- Панель: Карта мира -----
function showMapPanel() {
  isMapOpen = true;
  hideInventoryPanel();
  hideStatsPanel();
  hideForgePanel();
  hideQuestsPanel();
  hideShopPanel();
  hideArenaPanel();
  hideDungeonPanel();
  mapPanel.setVisible(true);
  mapPanelText.setVisible(true);
  mapGoButton.setVisible(true);
  mapGoButtonText.setVisible(true);
  updateMapPanel();
}

function hideMapPanel() {
  isMapOpen = false;
  mapPanel.setVisible(false);
  mapPanelText.setVisible(false);
  mapGoButton.setVisible(false);
  mapGoButtonText.setVisible(false);
}

function updateMapPanel() {
  const current = getCurrentLocation();
  const lines = [
    "КАРТА МИРА",
    "----------------------",
    "Локации:",
    "  1) Поля Глудио (старт)",
    "  2) Земли Орков (Дион)",
    "  3) Долина Драконов",
    "",
    "Текущая выбранная локация:",
    "  " + current.name,
    "",
    current.description,
    "",
    "Рекомендованный уровень: " + current.recommendedLevel,
    "Стоимость телепорта: " + current.teleportCost + " адены",
    "",
    "Стрелки < и > вверху меняют выбранную локацию.",
    'Кнопка "В путь" спишет адену и активирует телепорт.',
  ];
  mapPanelText.setText(lines.join("\n"));
}
