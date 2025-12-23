"use strict";

// ============================================================
//  ARENA STATE — энергия, рейтинг, лиги
// ============================================================

const arenaData = {
  energy: 30,
  maxEnergy: 30,
  energyCost: 5,
  energyRegenMs: 60000,  // 1 минута = 1 энергия
  lastRegenTime: Date.now(),

  rating: 1000,
  wins: 0,
  losses: 0,

  // Лиги
  leagues: {
    bronze: { min: 0, max: 999, name: "Бронза", icon: "🥉" },
    silver: { min: 1000, max: 2499, name: "Серебро", icon: "🥈" },
    gold: { min: 2500, max: 99999, name: "Золото", icon: "🥇" }
  }
};

function getLeague(rating) {
  if (rating >= 2500) return arenaData.leagues.gold;
  if (rating >= 1000) return arenaData.leagues.silver;
  return arenaData.leagues.bronze;
}

function updateArenaEnergy() {
  const now = Date.now();
  const elapsed = now - arenaData.lastRegenTime;
  const regenAmount = Math.floor(elapsed / arenaData.energyRegenMs);

  if (regenAmount > 0) {
    arenaData.energy = Math.min(arenaData.maxEnergy, arenaData.energy + regenAmount);
    arenaData.lastRegenTime = now - (elapsed % arenaData.energyRegenMs);
  }
}

function canStartArenaBattle() {
  updateArenaEnergy();
  return arenaData.energy >= arenaData.energyCost;
}

function spendArenaEnergy() {
  if (!canStartArenaBattle()) return false;
  arenaData.energy -= arenaData.energyCost;
  return true;
}

function applyArenaResult(isWin, enemyRating) {
  const myRating = arenaData.rating;
  const diff = enemyRating - myRating;
  const base = 15;
  const bonus = Math.max(-5, Math.min(5, Math.round(diff / 50)));

  let ratingChange;
  let expReward;
  let goldReward;

  if (isWin) {
    arenaData.wins++;
    ratingChange = base + bonus;
    expReward = 30 + stats.progression.level * 5;
    goldReward = 50 + Math.floor(Math.random() * 50);
  } else {
    arenaData.losses++;
    ratingChange = -(base - bonus);
    expReward = 10;
    goldReward = 10;
  }

  arenaData.rating = Math.max(0, arenaData.rating + ratingChange);

  return { ratingChange, expReward, goldReward, newRating: arenaData.rating };
}

console.log("[ArenaState] Module loaded");
