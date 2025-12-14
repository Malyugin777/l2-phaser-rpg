// ----- Панель: Статы -----
function showStatsPanel() {
  isStatsOpen = true;
  if (statsPanel) statsPanel.setVisible(true);
  if (statsPanelText) statsPanelText.setVisible(true);
  if (statsSkillsButton) statsSkillsButton.setVisible(true);
  if (statsSkillsButtonText) statsSkillsButtonText.setVisible(true);
  updateStatsPanel();
  updateProfessionButton();
}

function hideStatsPanel() {
  isStatsOpen = false;
  if (statsPanel) statsPanel.setVisible(false);
  if (statsPanelText) statsPanelText.setVisible(false);
  if (statsSkillsButton) statsSkillsButton.setVisible(false);
  if (statsSkillsButtonText) statsSkillsButtonText.setVisible(false);
  if (typeof hideProfessionPanel === "function") hideProfessionPanel();
  if (typeof updateProfessionButton === "function") updateProfessionButton();
}

function updateStatsPanel() {
  const effMin = getEffectiveMinAttack();
  const effMax = getEffectiveMaxAttack();
  const effCrit = getEffectiveCritChance();

  const lines = [
    "СТАТЫ ГЕРОЯ",
    "----------------------",
    "Раса: " + (profile.race || "не выбрана"),
    "Архетип: " + (profile.archetype || "не выбран"),
    "Профессия: " + (profile.profession || "нет"),
    "",
    "Уровень: " + stats.level,
    "Опыт: " + stats.exp + " / " + stats.expToNext,
    "SP: " + stats.sp,
    "",
    "HP: " + stats.hp + " / " + stats.maxHp,
    "MP: " + stats.mp + " / " + stats.maxMp,
    "Атака (база): " + stats.minAttack + "-" + stats.maxAttack,
    "Атака (снаряжение): " + effMin + "-" + effMax,
    "Крит (база): " +
      Math.round(stats.critChance * 100) +
      "% x" +
      stats.critMultiplier,
    "Крит (снаряжение): " +
      Math.round(effCrit * 100) +
      "% x" +
      stats.critMultiplier,
    "",
    "Экипировка:",
    "  Оружие: " + (equipment.weapon || "нет"),
    "  Броня: " + (equipment.armor || "нет"),
    "  Украшение 1: " + (equipment.jewelry1 || "нет"),
    "  Украшение 2: " + (equipment.jewelry2 || "нет"),
    "",
    "Адена: " + wallet.gold,
    "Эфир: " + wallet.ether,
    "Кристаллы: " + wallet.crystals,
    "",
    "Убийств всего: " + progress.kills,
    "Элитных убийств: " + progress.eliteKills,
    "",
    "Бафы:",
    "  +P.ATK: " + (buffs.pAtkActive ? "активен" : "нет"),
    "  +M.ATK: " + (buffs.mAtkActive ? "активен" : "нет"),
    "",
    "Банки / Свитки:",
    "  HP банки: " + consumables.hpPotions,
    "  MP банки: " + consumables.mpPotions,
    "  Свитки +P.ATK: " + consumables.pAtkScrolls,
    "  Свитки +M.ATK: " + consumables.mAtkScrolls,
    "",
    "Рейтинг Арены: " + progress.arenaRating,
    "Наёмник: " + (mercenary.active ? "с тобой" : "нет"),
  ];

  statsPanelText.setText(lines.join("\n"));
}