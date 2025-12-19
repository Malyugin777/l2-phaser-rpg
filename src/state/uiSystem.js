"use strict";

// ====== HUD / TOP UI SYSTEM ======

// Лейбл героя (статы + экспа)
function getHeroStatsLabel() {
  const effMin = getEffectiveMinAttack();
  const effMax = getEffectiveMaxAttack();
  const effCrit = getEffectiveCritChance();
  return (
    "Герой: Lvl " +
    stats.level +
    " | HP " +
    stats.hp +
    " / " +
    stats.maxHp +
    " | MP " +
    stats.mp +
    " / " +
    stats.maxMp +
    " | ATK " +
    effMin +
    "-" +
    effMax +
    " | CRIT " +
    Math.round(effCrit * 100) +
    "% | EXP " +
    stats.exp +
    "/" +
    stats.expToNext
  );
}

function getGoldLabel() {
  return "Адена: " + wallet.gold;
}

function getKillsLabel() {
  return "Убийств: " + progress.kills + " (Элитных: " + progress.eliteKills + ")";
}

function getEtherLabel() {
  return "Эфир: " + wallet.ether;
}

// [LEGACY] updateEtherUI() removed - etherText no longer exists
// [LEGACY] updateHeroUI() moved to game.js - uses new UI system
