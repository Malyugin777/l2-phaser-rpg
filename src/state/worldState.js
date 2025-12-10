"use strict";

// ====== МИР / ЛОКАЦИИ / ДАНЖ / МУЗЫКА / ОФФЛАЙН ======

// ----- ЛОКАЦИИ -----
const locations = [
  {
    id: 0,
    name: "Поля Глудио",
    description: "Новичковая локация рядом с Глудио.",
    enemyMaxHp: 60,
    enemyDefense: 2,
    enemyMinAttack: 5,
    enemyMaxAttack: 8,
    goldReward: 10,
    expReward: 25,
    recommendedLevel: 1,
    teleportCost: 0,
  },
  {
    id: 1,
    name: "Земли Орков (Дион)",
    description: "Орки потолще, но и награда жирнее.",
    enemyMaxHp: 120,
    enemyDefense: 4,
    enemyMinAttack: 8,
    enemyMaxAttack: 14,
    goldReward: 20,
    expReward: 40,
    recommendedLevel: 3,
    teleportCost: 50,
  },
  {
    id: 2,
    name: "Долина Драконов",
    description: "Опасная зона, но вкусный лут.",
    enemyMaxHp: 250,
    enemyDefense: 8,
    enemyMinAttack: 15,
    enemyMaxAttack: 25,
    goldReward: 40,
    expReward: 80,
    recommendedLevel: 5,
    teleportCost: 120,
  },
];

let currentLocationIndex = 0;

// Удобный хелпер, которым пользуются game.js, arena, dungeon, combat
function getCurrentLocation() {
  return locations[currentLocationIndex];
}

// ----- ДАНЖ -----
let isDungeonRun = false;
let dungeonKills = 0;
const DUNGEON_KILL_TARGET = 10;

// ----- ОФФЛАЙН-ПРОГРЕСС -----
let lastSessionTime = null;
const OFFLINE_MIN_THRESHOLD_MS = 60 * 1000;
const OFFLINE_MAX_MINUTES = 12 * 60;

// ----- МУЗЫКА И ФОНЫ -----
let cityMusic = null;
let battleMusic = null;
let musicMuted = false;
let musicToggleButton = null;
let musicToggleButtonText = null;
let currentMusicMode = null;
let cityBg = null;
let locationBg = null;

// ----- РЕЖИМ ЭКРАНА -----
let mode = "city"; // "city" | "location"
