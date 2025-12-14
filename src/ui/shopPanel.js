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

  if (shopPanel) shopPanel.setVisible(true);
  if (shopPanelText) shopPanelText.setVisible(true);
  if (shopBuyButton) shopBuyButton.setVisible(true);
  if (shopBuyButtonText) shopBuyButtonText.setVisible(true);

  updateShopPanel();
}

function hideShopPanel() {
  isShopOpen = false;
  if (shopPanel) shopPanel.setVisible(false);
  if (shopPanelText) shopPanelText.setVisible(false);
  if (shopBuyButton) shopBuyButton.setVisible(false);
  if (shopBuyButtonText) shopBuyButtonText.setVisible(false);
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
    "Текущий баланс: " + (wallet.gold || 0) + " адены.",
    "",
    'Нажми "Купить набор",',
    "чтобы сразу усилиться.",
  ];
  shopPanelText.setText(lines.join("\n"));
}