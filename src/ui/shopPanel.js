// ----- Панель: Магазин -----
function showShopPanel() {
  isShopOpen = true;

  // Закрываем остальные панели
  hideInventoryPanel();
  hideStatsPanel();
  hideForgePanel();
  hideQuestsPanel();
  hideMapPanel();
  hideArenaPanel();
  hideDungeonPanel();

  shopPanel.setVisible(true);
  shopPanelText.setVisible(true);
  shopBuyButton.setVisible(true);
  shopBuyButtonText.setVisible(true);

  updateShopPanel();
}

function hideShopPanel() {
  isShopOpen = false;
  shopPanel.setVisible(false);
  shopPanelText.setVisible(false);
  shopBuyButton.setVisible(false);
  shopBuyButtonText.setVisible(false);
}

function updateShopPanel() {
  const lines = [
    "МАГАЗИН",
    "----------------------",
    "Набор новичка:",
    "  +2 HP банки",
    "  +2 MP банки",
    "  +5 Эфира",
    "",
    "Цена: 50 адены.",
    "",
    "Текущий баланс: " + heroGold + " адены.",
    "",
    'Нажми "Купить набор",',
    "чтобы сразу усилиться.",
  ];
  shopPanelText.setText(lines.join("\n"));
}
