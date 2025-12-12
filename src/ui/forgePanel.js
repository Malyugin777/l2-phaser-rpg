// ----- Панель: Кузница -----
function showForgePanel() {
  isForgeOpen = true;
  forgePanel.setVisible(true);
  forgePanelText.setVisible(true);
  forgeDoButton.setVisible(true);
  forgeDoButtonText.setVisible(true);
}

function hideForgePanel() {
  isForgeOpen = false;
  forgePanel.setVisible(false);
  forgePanelText.setVisible(false);
  forgeDoButton.setVisible(false);
  forgeDoButtonText.setVisible(false);
}

function updateForgePanel() {
  const lines = [
    "КУЗНИЦА",
    "----------------------",
    "Точим случайный предмет из инвентаря.",
    "Успех: предмет получает +1.",
    "Провал: предмет ломается.",
    "  (D-grade → кристаллы)",
    "",
    "Шанс успеха:",
    "  +0–+2: 80%",
    "  +3–+5: 50%",
    "  +6–+9: 30%",
    "  +10+: 10%",
    "",
    "Кристаллы: " + wallet.crystals,
    "",
    "Предметы:",
  ];
  if (inventory.length === 0) {
    lines.push("   (нет предметов)");
  } else {
    inventory.forEach((item, idx) => {
      lines.push("  " + (idx + 1) + ". " + item);
    });
  }
  lines.push("");
  lines.push('Нажми кнопку "Точить", чтобы попытаться.');
  forgePanelText.setText(lines.join("\n"));
}