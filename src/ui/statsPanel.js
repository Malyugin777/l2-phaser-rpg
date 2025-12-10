// ----- Панель: Статы -----
function showStatsPanel() {
  isStatsOpen = true;
  statsPanel.setVisible(true);
  statsPanelText.setVisible(true);
  updateStatsPanel();
}

function hideStatsPanel() {
  isStatsOpen = false;
  statsPanel.setVisible(false);
  statsPanelText.setVisible(false);
}

function updateStatsPanel() {
  const effMin = getEffectiveMinAttack();
  const effMax = getEffectiveMaxAttack();
  const effCrit = getEffectiveCritChance();

  const lines = [
    "СТАТЫ ГЕРОЯ",
    "----------------------",
    "Раса: " + (heroMeta.race || "не выбрана"),
    "Класс: " + (heroMeta.heroClass || "не выбран"),
    "",
    "Уровень: " + heroStats.level,
    "Опыт: " + heroStats.exp + " / " + heroStats.expToNext,
    "",
    "HP: " + heroStats.hp + " / " + heroStats.maxHp,
    "MP: " + heroStats.mp + " / " + heroStats.maxMp,
    "Атака (база): " + heroStats.minAttack + "-" + heroStats.maxAttack,
    "Атака (снаряжение): " + effMin + "-" + effMax,
    "Крит (база): " +
      Math.round(heroStats.critChance * 100) +
      "% x" +
      heroStats.critMultiplier,
    "Крит (снаряжение): " +
      Math.round(effCrit * 100) +
      "% x" +
      heroStats.critMultiplier,
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
    "Убийств всего: " + heroKills,
    "Элитных убийств: " + heroEliteKills,
    "",
    "Бафы:",
    "  +P.ATK: " + (buffPActive ? "активен" : "нет"),
    "  +M.ATK: " + (buffMActive ? "активен" : "нет"),
    "",
    "Банки / Свитки:",
    "  HP банки: " + heroHpPotions,
    "  MP банки: " + heroMpPotions,
    "  Свитки +P.ATK: " + heroPAtkScrolls,
    "  Свитки +M.ATK: " + heroMAtkScrolls,
    "",
    "Рейтинг Арены: " + heroArenaRating,
    "Наёмник: " + (mercActive ? "с тобой" : "нет"),
  ];

  statsPanelText.setText(lines.join("\n"));
}
