"use strict";

// ====== МИР / ЛОКАЦИИ / ДАНЖ / МУЗЫКА / ОФФЛАЙН ======

// ============================================================
//  ЛОКАЦИИ С МОБАМИ
// ============================================================

const locations = [
  {
    id: 0,
    name: "Obelisk of Victory",
    description: "Стартовая зона Talking Island. Слабые мобы для новичков.",
    bgKey: "obelisk_of_victory",
    recommendedLevel: 1,
    teleportCost: 0,
    mobs: [
      {
        name: "Young Keltir",
        level: 1,
        maxHp: 35,
        defense: 1,
        minAttack: 3,
        maxAttack: 5,
        exp: 12,
        sp: 1,
        gold: [4, 8],
        drop: []
      },
      {
        name: "Keltir",
        level: 2,
        maxHp: 45,
        defense: 1,
        minAttack: 4,
        maxAttack: 6,
        exp: 18,
        sp: 2,
        gold: [6, 12],
        drop: [
          { item: "Кольцо ученика", chance: 0.03 }
        ]
      },
      {
        name: "Grey Wolf",
        level: 3,
        maxHp: 60,
        defense: 2,
        minAttack: 5,
        maxAttack: 8,
        exp: 25,
        sp: 3,
        gold: [8, 15],
        drop: [
          { item: "Wolf Fang", chance: 0.15, questItem: true },
          { item: "Меч новичка", chance: 0.05 }
        ]
      }
    ]
  },
  {
    id: 1,
    name: "Northern Territory",
    description: "Орки и оборотни. Ресурс: Varnish.",
    bgKey: "northern_territory",
    recommendedLevel: 5,
    teleportCost: 50,
    mobs: [
      {
        name: "Orc",
        level: 5,
        maxHp: 90,
        defense: 3,
        minAttack: 7,
        maxAttack: 11,
        exp: 35,
        sp: 4,
        gold: [12, 20],
        drop: [
          { item: "Varnish", chance: 0.2, material: true }
        ]
      },
      {
        name: "Orc Fighter",
        level: 7,
        maxHp: 120,
        defense: 4,
        minAttack: 9,
        maxAttack: 14,
        exp: 45,
        sp: 5,
        gold: [15, 25],
        drop: [
          { item: "Кинжал охотника", chance: 0.06 },
          { item: "Varnish", chance: 0.15, material: true }
        ]
      },
      {
        name: "Werewolf",
        level: 8,
        maxHp: 140,
        defense: 4,
        minAttack: 10,
        maxAttack: 16,
        exp: 55,
        sp: 6,
        gold: [18, 30],
        drop: [
          { item: "Кольчуга гнома", chance: 0.04 },
          { item: "Werewolf Claw", chance: 0.1, questItem: true }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Elven Ruins",
    description: "Скелеты и пауки. Medallion of Courage для квеста профы.",
    bgKey: "elven_ruins",
    recommendedLevel: 10,
    teleportCost: 100,
    mobs: [
      {
        name: "Skeleton",
        level: 10,
        maxHp: 180,
        defense: 5,
        minAttack: 12,
        maxAttack: 18,
        exp: 70,
        sp: 7,
        gold: [22, 35],
        drop: [
          { item: "Bone", chance: 0.25, material: true }
        ]
      },
      {
        name: "Skeleton Archer",
        level: 12,
        maxHp: 160,
        defense: 4,
        minAttack: 15,
        maxAttack: 22,
        exp: 85,
        sp: 9,
        gold: [28, 42],
        drop: [
          { item: "Серьга путешественника", chance: 0.05 },
          { item: "Bone", chance: 0.2, material: true }
        ]
      },
      {
        name: "Giant Spider",
        level: 14,
        maxHp: 220,
        defense: 6,
        minAttack: 14,
        maxAttack: 20,
        exp: 100,
        sp: 10,
        gold: [32, 50],
        drop: [
          { item: "Spider Silk", chance: 0.18, material: true },
          { item: "Талисман ветра", chance: 0.04 }
        ]
      },
      {
        name: "Skeleton Lord",
        level: 16,
        maxHp: 300,
        defense: 8,
        minAttack: 18,
        maxAttack: 26,
        exp: 130,
        sp: 13,
        gold: [40, 60],
        elite: true,
        drop: [
          { item: "Medallion of Courage", chance: 0.08, questItem: true },
          { item: "Bone", chance: 0.3, material: true }
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Orc Barracks",
    description: "Данж 20+. D-grade шмот, орки-рейдеры.",
    bgKey: "orc_barracks",
    recommendedLevel: 20,
    teleportCost: 200,
    mobs: [
      {
        name: "Orc Raider",
        level: 20,
        maxHp: 400,
        defense: 10,
        minAttack: 22,
        maxAttack: 32,
        exp: 180,
        sp: 18,
        gold: [50, 80],
        drop: [
          { item: "Leather", chance: 0.2, material: true },
          { item: "D-Grade Sword Fragment", chance: 0.05, material: true }
        ]
      },
      {
        name: "Orc Captain",
        level: 22,
        maxHp: 500,
        defense: 12,
        minAttack: 26,
        maxAttack: 38,
        exp: 220,
        sp: 22,
        gold: [60, 100],
        elite: true,
        drop: [
          { item: "Leather", chance: 0.25, material: true },
          { item: "D-Grade Armor Fragment", chance: 0.06, material: true },
          { item: "Orc Warchief Skull", chance: 0.03, questItem: true }
        ]
      },
      {
        name: "Orc Shaman",
        level: 21,
        maxHp: 350,
        defense: 8,
        minAttack: 30,
        maxAttack: 45,
        exp: 200,
        sp: 25,
        gold: [55, 90],
        drop: [
          { item: "Spirit Ore", chance: 0.15, material: true }
        ]
      }
    ]
  }
];

// ============================================================
//  ТЕКУЩИЙ МОБ
// ============================================================

let currentMob = null;

// Выбрать случайного моба из локации (с учётом уровня героя)
function selectRandomMob() {
  const loc = getCurrentLocation();
  if (!loc.mobs || loc.mobs.length === 0) {
    // Fallback на старую систему (если мобов нет)
    currentMob = {
      name: "Unknown Mob",
      level: 1,
      maxHp: 50,
      defense: 1,
      minAttack: 5,
      maxAttack: 10,
      exp: 20,
      sp: 2,
      gold: [5, 15],
      drop: []
    };
    return currentMob;
  }
  
  // Фильтруем мобов по уровню героя (не более +5 уровней)
  const heroLvl = stats.level;
  let availableMobs = loc.mobs.filter(m => m.level <= heroLvl + 5);
  
  // Если ничего не подходит — берём всех
  if (availableMobs.length === 0) {
    availableMobs = loc.mobs;
  }
  
  // Случайный выбор
  const idx = Math.floor(Math.random() * availableMobs.length);
  currentMob = availableMobs[idx];
  return currentMob;
}

// Получить текущего моба
function getCurrentMob() {
  return currentMob;
}

// ============================================================
//  СТАТЫ ВРАГА (обновляется из currentMob)
// ============================================================

const enemyStats = {
  name: "Mob",
  level: 1,
  maxHp: 50,
  hp: 50,
  defense: 1,
  minAttack: 5,
  maxAttack: 10,
  critChance: 0.05,
  critMultiplier: 1.5
};

let enemy = null;
let enemyHpText = null;
let enemyAlive = true;

// Применить данные моба к enemyStats
function applyMobToEnemy(mob) {
  if (!mob) return;
  
  enemyStats.name = mob.name || "Mob";
  enemyStats.level = mob.level || 1;
  enemyStats.maxHp = mob.maxHp || 50;
  enemyStats.hp = enemyStats.maxHp;
  enemyStats.defense = mob.defense || 1;
  enemyStats.minAttack = mob.minAttack || 5;
  enemyStats.maxAttack = mob.maxAttack || 10;
  
  // Элитные мобы имеют повышенный крит
  if (mob.elite) {
    enemyStats.critChance = 0.15;
    enemyStats.critMultiplier = 2.0;
  } else {
    enemyStats.critChance = 0.05;
    enemyStats.critMultiplier = 1.5;
  }
}

// ============================================================
//  ЛУТА И НАГРАДЫ
// ============================================================

// Получить случайное золото от моба
function getMobGoldReward(mob) {
  if (!mob || !mob.gold) return 10;
  const min = mob.gold[0] || 5;
  const max = mob.gold[1] || 15;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Попробовать дропнуть предмет от моба
function tryMobDrop(mob) {
  if (!mob || !mob.drop || mob.drop.length === 0) return null;
  
  const drops = [];
  
  for (const dropEntry of mob.drop) {
    const roll = Math.random();
    if (roll < dropEntry.chance) {
      drops.push({
        item: dropEntry.item,
        questItem: dropEntry.questItem || false,
        material: dropEntry.material || false
      });
    }
  }
  
  // Возвращаем первый дроп (или null)
  // Можно расширить для множественного дропа
  return drops.length > 0 ? drops[0] : null;
}

// ============================================================
//  ХЕЛПЕРЫ ЛОКАЦИЙ
// ============================================================

let currentLocationIndex = 0;

function getCurrentLocation() {
  return locations[currentLocationIndex] || locations[0];
}

// Для обратной совместимости — получить награды из локации
// (deprecated, используй currentMob)
function getLocationRewards() {
  const loc = getCurrentLocation();
  // Усреднённые значения для совместимости
  if (loc.mobs && loc.mobs.length > 0) {
    const avgMob = loc.mobs[Math.floor(loc.mobs.length / 2)];
    return {
      goldReward: Math.floor((avgMob.gold[0] + avgMob.gold[1]) / 2),
      expReward: avgMob.exp
    };
  }
  return { goldReward: 10, expReward: 25 };
}

// ============================================================
//  ДАНЖ
// ============================================================

let isDungeonRun = false;
let dungeonKills = 0;
const DUNGEON_KILL_TARGET = 10;

// ============================================================
//  ОФФЛАЙН-ПРОГРЕСС
// ============================================================

const OFFLINE_MIN_THRESHOLD_MS = 60 * 1000;
const OFFLINE_MAX_MINUTES = 12 * 60;

// ============================================================
//  МУЗЫКА И ФОНЫ
// ============================================================

let cityMusic = null;
let battleMusic = null;
let musicMuted = false;
let musicToggleButton = null;
let musicToggleButtonText = null;
let currentMusicMode = null;
let cityBg = null;
let locationBg = null;

// ============================================================
//  РЕЖИМ ЭКРАНА
// ============================================================

let mode = "city"; // "city" | "location"

// ============================================================
//  ЭФИР ЗА УБИЙСТВО
// ============================================================

// ETHER_KILL_DROP_CHANCE и ELITE_KILL_CHANCE определены в heroState.js

// ============================================================
//  ХЕЛПЕРЫ HP ВРАГА (бывший enemyState.js)
// ============================================================

function getEnemyHpLabel() {
  const mobName = currentMob ? currentMob.name : "Враг";
  const mobLvl = currentMob ? currentMob.level : "?";
  return mobName + " [Lv." + mobLvl + "]  HP: " + enemyStats.hp + "/" + enemyStats.maxHp;
}

function updateEnemyHpText() {
  if (enemyHpText) {
    enemyHpText.setText(getEnemyHpLabel());
  }
}