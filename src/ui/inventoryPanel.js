// ================== ПАНЕЛЬ: ИНВЕНТАРЬ ==================

function showInventoryPanel() {
  isInventoryOpen = true;
  inventoryPanel.setVisible(true);
  inventoryPanelText.setVisible(true);
  if (inventoryEquipBestButton) inventoryEquipBestButton.setVisible(true);
  if (inventoryEquipBestButtonText)
    inventoryEquipBestButtonText.setVisible(true);
  if (inventoryUnequipAllButton) inventoryUnequipAllButton.setVisible(true);
  if (inventoryUnequipAllButtonText)
    inventoryUnequipAllButtonText.setVisible(true);
  updateInventoryPanel();
}

function hideInventoryPanel() {
  isInventoryOpen = false;
  inventoryPanel.setVisible(false);
  inventoryPanelText.setVisible(false);
  if (inventoryEquipBestButton) inventoryEquipBestButton.setVisible(false);
  if (inventoryEquipBestButtonText)
    inventoryEquipBestButtonText.setVisible(false);
  if (inventoryUnequipAllButton) inventoryUnequipAllButton.setVisible(false);
  if (inventoryUnequipAllButtonText)
    inventoryUnequipAllButtonText.setVisible(false);
}

function updateInventoryPanel() {
  const lines = [
    "ИНВЕНТАРЬ",
    "----------------------",
    "Раса: " + (profile.race || "не выбрана"),
    "Архетип: " + (profile.archetype || "не выбран"),
    "",
    "Экипировка:",
    "  Оружие: " + (equipment.weapon || "нет"),
    "  Броня: " + (equipment.armor || "нет"),
    "  Украшение 1: " + (equipment.jewelry1 || "нет"),
    "  Украшение 2: " + (equipment.jewelry2 || "нет"),
    "",
    "Адена: " + (wallet.gold || 0),
    "Эфир: " + wallet.ether,
    "",
    "Банки / Свитки:",
    "  HP банки: " + consumables.hpPotions,
    "  MP банки: " + consumables.mpPotions,
    "  Свитки +P.ATK: " + consumables.pAtkScrolls,
    "  Свитки +M.ATK: " + consumables.mAtkScrolls,
    "",
    "ПРЕДМЕТЫ В РЮКЗАКЕ:",
  ];
  if (inventory.length === 0) {
    lines.push("Пока что у тебя нет предметов.");
  } else {
    inventory.forEach((item, idx) => {
      lines.push(idx + 1 + ". " + item);
    });
  }
  lines.push("");
  lines.push('Кнопка "Надеть лучшее" — авто-экипировка по силе.');
  lines.push('Кнопка "Снять всё" — вернуть шмот в инвентарь.');
  inventoryPanelText.setText(lines.join("\n"));
}