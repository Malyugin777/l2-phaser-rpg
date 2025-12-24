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

// История матчей (последние 20 боёв)
const arenaHistory = {
  matches: [],
  maxMatches: 20
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

// Добавление матча в историю
function addMatchToHistory(matchData) {
  arenaHistory.matches.unshift({
    timestamp: matchData.timestamp || Date.now(),
    result: matchData.result,  // "win" | "loss" | "draw"
    myRating: matchData.myRating,
    ratingChange: matchData.ratingChange,
    enemyName: matchData.enemyName,
    enemyRating: matchData.enemyRating,
    myDamageDealt: matchData.myDamageDealt || 0,
    enemyDamageDealt: matchData.enemyDamageDealt || 0,
    duration: matchData.duration || 0,
    expGained: matchData.expGained || 0,
    goldGained: matchData.goldGained || 0
  });

  if (arenaHistory.matches.length > arenaHistory.maxMatches) {
    arenaHistory.matches.pop();
  }

  if (typeof saveGame === "function") saveGame();
}

// Получить историю матчей
function getMatchHistory() {
  return arenaHistory.matches;
}

// Статистика по истории
function getHistoryStats() {
  const matches = arenaHistory.matches;
  if (matches.length === 0) {
    return { winRate: 0, avgDuration: 0, totalMatches: 0 };
  }

  const wins = matches.filter(m => m.result === "win").length;
  const totalDuration = matches.reduce((sum, m) => sum + (m.duration || 0), 0);

  return {
    winRate: Math.round((wins / matches.length) * 100),
    avgDuration: Math.round(totalDuration / matches.length / 1000),  // секунды
    totalMatches: matches.length
  };
}

console.log("[ArenaState] Module loaded");
