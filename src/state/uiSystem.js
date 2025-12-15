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

// [LEGACY] updateEtherUI() removed - etherText no longer exists
// [LEGACY] updateHeroUI() moved to game.js - uses new UI system
