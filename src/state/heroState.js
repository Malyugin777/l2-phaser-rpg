"use strict";

// ============================================================
//  heroState.js — ЕДИНСТВЕННЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ ДАННЫХ ГЕРОЯ
// ============================================================

const SAVE_VERSION = 3;

// ----- БОЕВЫЕ ХАРАКТЕРИСТИКИ -----
const stats = {
  level: 1,
  exp: 0,
  expToNext: 100,
  sp: 0,

  // Derived stats (рассчитываются через statSystem)
  maxHp: 80,
  hp: 80,
  maxMp: 30,
  mp: 30,

  pAtk: 4,
  mAtk: 2,
  pDef: 40,
  mDef: 25,
  atkSpd: 300,
  castSpd: 200,

  critChance: 0.05,
  critMultiplier: 2.0,

  // Legacy (для совместимости)
  minAttack: 10,
  maxAttack: 20,
  atkSpeed: 100,
  castSpeed: 100,
  weight: 0,
  maxWeight: 1000,
};

// ----- ПРОФИЛЬ ПЕРСОНАЖА -----
const profile = {
  race: null,
  archetype: null,
  profession: null,
};

// ----- МОДИФИКАТОРЫ СТАТОВ -----
const heroModifiers = {
  tattoo: {
    str: 0, dex: 0, con: 0,
    int: 0, wit: 0, men: 0
  },
  set: {
    str: 0, dex: 0, con: 0,
    int: 0, wit: 0, men: 0
  }
};

// ----- КОШЕЛЁК -----
const wallet = {
  gold: 0,
  ether: 50,
  crystals: 0,
};

// ----- РЕСУРСЫ ДЛЯ КУЗНИЦЫ -----
const resources = {
  // Base (падают с мобов)
  ore: 100,       // тест: 100
  coal: 50,       // тест: 50
  thread: 100,    // тест: 100
  leather: 50,    // тест: 50

  // Refined (только крафт)
  ironIngot: 0,
  cloth: 0,
  leatherSheet: 0,

  // Catalyst
  enchantDust: 20 // тест: 20
};

// ----- РАСХОДНИКИ -----
const consumables = {
  hpPotions: 5,
  mpPotions: 3,
  pAtkScrolls: 2,
  mAtkScrolls: 2,
};

// ----- ПРОГРЕСС -----
const progress = {
  kills: 0,
  eliteKills: 0,
  arenaRating: 0,
  lastSessionTime: 0,
  lastMode: "city",        // "city" | "location" — где был при выходе
  lastLocationIndex: 0,    // индекс локации при выходе
};

// ----- ЭКИПИРОВКА -----
const equipment = {
  weapon: null,
  armor: null,
  jewelry1: null,
  jewelry2: null,
};

// ----- ИНВЕНТАРЬ -----
let inventory = [];

// ----- НАВЫКИ -----
const skills = {
  learned: [],
  slots: {
    slot1: null,
    slot2: null,
  },
};

// ----- БАФЫ -----
const buffs = {
  pAtkActive: false,
  mAtkActive: false,
  soulshotsOn: false,
  spiritshotsOn: false,
  isResting: false,
};

let buffPTimer = null;
let buffMTimer = null;

// ----- КВЕСТЫ -----
const quests = {
  killQuestDone: false,
  goldQuestDone: false,
  eliteQuestDone: false,
};

// ----- НАЁМНИК -----
const mercenary = {
  active: false,
  maxHp: 80,
  hp: 80,
  minAttack: 8,
  maxAttack: 15,
  critChance: 0.15,
  critMultiplier: 1.5,
};

// ----- ПЕТ -----
const pet = {
  obtained: false,
  active: false,
  name: "",
  level: 1,
  exp: 0,
  minAttack: 5,
  maxAttack: 10,
};

// ----- АРЕНА -----
const arenaState = {
  rating: 1000,
  honor: 0,
  wins: 0,
  losses: 0,
  energy: 30,
  energyMax: 30,
  lastEnergyTs: Date.now()
};

// ============================================================
//  КОНСТАНТЫ
// ============================================================

const ARENA_ENERGY_COST = 5;
const ARENA_ENERGY_REGEN_MS = 10 * 60 * 1000; // 10 минут

const OVERDRIVE_ETHER_COST = 5;
const OVERDRIVE_DURATION_MS = 10000;
const AUTO_HUNT_DURATION_MS = 60000;
const ETHER_KILL_DROP_CHANCE = 1.0;
const ELITE_KILL_CHANCE = 0.2;
const BUFF_DURATION_MS = 30000;

const SKILL1_MP_COST = 10;
const SKILL2_MP_COST = 15;
const SKILL1_COOLDOWN_MS = 4000;
const SKILL2_COOLDOWN_MS = 6000;

let skill1Ready = true;
let skill2Ready = true;

let hpRegenAcc = 0;
let mpRegenAcc = 0;
const REGEN_TICKS_TO_FULL = 600;

// ============================================================
//  СПРАВОЧНИКИ
// ============================================================

const RACES = [
  { id: "human", label: "Человек" },
  { id: "elf", label: "Эльф" },
  { id: "darkelf", label: "Тёмный эльф" },
];

const ARCHETYPES = [
  { id: "fighter", label: "Воин" },
  { id: "mystic", label: "Мистик" },
];

const PROFESSIONS = [
  { id: "knight", label: "Рыцарь", archetype: "fighter" },
  { id: "rogue", label: "Разбойник", archetype: "fighter" },
  { id: "wizard", label: "Волшебник", archetype: "mystic" },
];

const LOOT_TABLE = [
  "Меч новичка",
  "Кинжал охотника",
  "Кольцо ученика",
  "Серьга путешественника",
  "Кольчуга гнома",
  "Талисман ветра",
];

const LOOT_DROP_CHANCE = 0.3;

// ============================================================
//  SKILL_DB — ЕДИНСТВЕННАЯ БАЗА НАВЫКОВ
// ============================================================

const SKILL_DB = {
  "Power Strike": {
    id: "power_strike",
    name: "Power Strike",
    type: "physical",
    power: 1.5,
    mp: 10,
    cd: 4000,
    costSp: 5,
    costGold: 100,
    desc: "Мощный удар x1.5",
  },
  "Mortal Blow": {
    id: "mortal_blow",
    name: "Mortal Blow",
    type: "physical",
    power: 2.5,
    mp: 15,
    cd: 6000,
    chance: 0.7,
    costSp: 8,
    costGold: 150,
    desc: "Летал x2.5 (Шанс 70%)",
  },
  "Wind Strike": {
    id: "wind_strike",
    name: "Wind Strike",
    type: "magical",
    power: 2.0,
    mp: 12,
    cd: 3000,
    castTime: 1500,
    costSp: 5,
    costGold: 100,
    desc: "Нюк ветром x2.0",
  },
  "Vampiric Touch": {
    id: "vamp_touch",
    name: "Vampiric Touch",
    type: "magical",
    power: 1.2,
    mp: 20,
    cd: 8000,
    castTime: 1500,
    healPercent: 0.4,
    costSp: 10,
    costGold: 200,
    desc: "Дрейн ХП (40%)",
  },
  "Shield Stun": {
    id: "shield_stun",
    name: "Shield Stun",
    type: "physical",
    power: 1.2,
    mp: 20,
    cd: 8000,
    stun: true,
    costSp: 15,
    costGold: 400,
    desc: "Стан врага на 2 сек.",
  },
  "Ultimate Defense": {
    id: "ult_defense",
    name: "Ultimate Defense",
    type: "buff",
    mp: 50,
    cd: 60000,
    duration: 15000,
    effect: { pDef: 3.0 },
    costSp: 20,
    costGold: 500,
    desc: "P.Def x3 (УД)",
  },
  "Backstab": {
    id: "backstab",
    name: "Backstab",
    type: "physical",
    power: 4.0,
    mp: 30,
    cd: 10000,
    chance: 0.5,
    costSp: 18,
    costGold: 450,
    desc: "Удар в спину x4.0 (Шанс 50%)",
  },
  "Dash": {
    id: "dash",
    name: "Dash",
    type: "buff",
    mp: 20,
    cd: 30000,
    duration: 10000,
    effect: { atkSpeed: 1.3 },
    costSp: 12,
    costGold: 350,
    desc: "Скор. Атк +30%",
  },
  "Blaze": {
    id: "blaze",
    name: "Blaze",
    type: "magical",
    power: 3.0,
    mp: 25,
    cd: 4000,
    castTime: 2000,
    costSp: 15,
    costGold: 450,
    desc: "Огненный шар x3.0",
  },
  "Aura Flare": {
    id: "aura_flare",
    name: "Aura Flare",
    type: "magical",
    power: 1.5,
    mp: 30,
    cd: 500,
    castTime: 500,
    costSp: 18,
    costGold: 500,
    desc: "Быстрая вспышка (спам)",
  },
};

// ============================================================
//  ХЕЛПЕРЫ ДЛЯ НАВЫКОВ
// ============================================================

function isSkillLearned(skillKey) {
  if (!Array.isArray(skills.learned)) return false;
  if (skills.learned.includes(skillKey)) return true;
  if (SKILL_DB[skillKey] && SKILL_DB[skillKey].id) {
    return skills.learned.includes(SKILL_DB[skillKey].id);
  }
  return false;
}

function addLearnedSkill(skillKey) {
  if (!Array.isArray(skills.learned)) {
    skills.learned = [];
  }
  if (!skills.learned.includes(skillKey)) {
    skills.learned.push(skillKey);
  }
}

function getAvailableSkills() {
  const result = [];
  for (const key in SKILL_DB) {
    if (Object.prototype.hasOwnProperty.call(SKILL_DB, key)) {
      if (isSkillVisibleForHero(key)) {
        result.push(key);
      }
    }
  }
  return result;
}

function isSkillVisibleForHero(skillKey) {
  const arch = profile.archetype;
  const prof = profile.profession;

  switch (skillKey) {
    case "Power Strike":
    case "Mortal Blow":
      return arch === "fighter";
    case "Wind Strike":
    case "Vampiric Touch":
      return arch === "mystic";
    case "Shield Stun":
    case "Ultimate Defense":
      return prof === "knight";
    case "Backstab":
    case "Dash":
      return prof === "rogue";
    case "Blaze":
    case "Aura Flare":
      return prof === "wizard";
    default:
      return false;
  }
}

function getSkillRequiredLevel(skillKey) {
  switch (skillKey) {
    case "Power Strike":
    case "Mortal Blow":
    case "Wind Strike":
    case "Vampiric Touch":
      return 1;
    case "Shield Stun":
    case "Ultimate Defense":
    case "Backstab":
    case "Dash":
    case "Blaze":
    case "Aura Flare":
      return 20;
    default:
      return 1;
  }
}

// ============================================================
//  АЛИАСЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
// ============================================================

const heroStats = stats;
const heroMeta = profile;