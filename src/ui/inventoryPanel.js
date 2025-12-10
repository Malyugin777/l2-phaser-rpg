// ================== ПАНЕЛЬ: ИНВЕНТАРЬ ==================
//
// Здесь лежат только функции управления UI-инвентаря.
// Они используют глобальные переменные из game.js:
// isInventoryOpen, inventoryPanel, inventoryPanelText,
// inventoryEquipBestButton, inventoryEquipBestButtonText,
// inventoryUnequipAllButton, inventoryUnequipAllButtonText,
// heroMeta, equippedWeapon/Armor/Jewelry, heroGold, heroEther,
// heroHpPotions, heroMpPotions, heroPAtkScrolls, heroMAtkScrolls,
// inventoryItems.
//

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
    "Раса: " + (heroMeta.race || "не выбрана"),
    "Класс: " + (heroMeta.heroClass || "не выбран"),
    "",
    "Экипировка:",
    "  Оружие: " + (equippedWeapon || "нет"),
    "  Броня: " + (equippedArmor || "нет"),
    "  Украшение 1: " + (equippedJewelry1 || "нет"),
    "  Украшение 2: " + (equippedJewelry2 || "нет"),
    "",
    "Адена: " + heroGold,
    "Эфир: " + heroEther,
    "",
    "Банки / Свитки:",
    "  HP банки: " + heroHpPotions,
    "  MP банки: " + heroMpPotions,
    "  Свитки +P.ATK: " + heroPAtkScrolls,
    "  Свитки +M.ATK: " + heroMAtkScrolls,
    "",
    "ПРЕДМЕТЫ В РЮКЗАКЕ:",
  ];
  if (inventoryItems.length === 0) {
    lines.push("Пока что у тебя нет предметов.");
  } else {
    inventoryItems.forEach((item, idx) => {
      lines.push(idx + 1 + ". " + item);
    });
  }
  lines.push("");
  lines.push('Кнопка "Надеть лучшее" — авто-экипировка по силе.');
  lines.push('Кнопка "Снять всё" — вернуть шмот в инвентарь.');
  inventoryPanelText.setText(lines.join("\n"));
}
