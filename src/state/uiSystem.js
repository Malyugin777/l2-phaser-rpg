"use strict";

// ====== HUD / TOP UI SYSTEM ======

// Лейбл героя (статы + экспа)
function getHeroStatsLabel() {
  const effMin = getEffectiveMinAttack();
  const effMax = getEffectiveMaxAttack();
  const effCrit = getEffectiveCritChance();
  return (
    "Герой: Lvl " +
    heroStats.level +
    " | HP " +
    heroStats.hp +
    " / " +
    heroStats.maxHp +
    " | MP " +
    heroStats.mp +
    " / " +
    heroStats.maxMp +
    " | ATK " +
    effMin +
    "-" +
    effMax +
    " | CRIT " +
    Math.round(effCrit * 100) +
    "% | EXP " +
    heroStats.exp +
    "/" +
    heroStats.expToNext
  );
}

function getGoldLabel() {
  return "Адена: " + heroGold;
}

function getKillsLabel() {
  return "Убийств: " + heroKills + " (Элитных: " + heroEliteKills + ")";
}

function getEtherLabel() {
  return "Эфир: " + heroEther;
}

function updateEtherUI() {
  if (etherText) etherText.setText(getEtherLabel());
}

// Централизованное обновление всего HUD
function updateHeroUI() {
  if (heroStatsText) heroStatsText.setText(getHeroStatsLabel());
  if (goldText) goldText.setText(getGoldLabel());
  if (killsText) killsText.setText(getKillsLabel());
  updateEtherUI();
  updateSkillButtonsUI();

  if (isInventoryOpen) updateInventoryPanel();
  if (isStatsOpen) updateStatsPanel();
  // updateForgePanel удалён — forgePanel.js обновляется через rebuildForgeContent
  if (isQuestsOpen) updateQuestsPanel();
  if (isShopOpen) updateShopPanel();
  if (isMapOpen) updateMapPanel();
  if (isArenaOpen) updateArenaPanel();
  if (isDungeonOpen) updateDungeonPanel();
}
