"use strict";

// ----- ГЕРОЙ: ГЛОБАЛЬНЫЕ СТАТЫ -----
const heroStats = {
  level: 1,
  exp: 0,
  expToNext: 100,
  sp: 0,
  maxHp: 100,
  hp: 100,
  maxMp: 50,
  mp: 50,

  // Боевые статы
  minAttack: 10,
  maxAttack: 20,
  critChance: 0.25,
  critMultiplier: 2.0,

  // Skill Points (SP)
  sp: 0,

  // Под будущее (cast/atk speed, вес и т.п.)
  castSpeed: 100,
  atkSpeed: 100,
  weight: 0,
  maxWeight: 1000,
};

// ----- МЕТА: РАСА / КЛАСС -----
const heroMeta = {
  race: null,        // "human", "elf", "darkelf"
  heroClass: null,   // "knight", "mage", "rogue"

  // Архетип и профа под GDD
  archetype: null,   // "fighter" / "mystic"
  profession: null,  // "knight" / "rogue" / "wizard" (после 20 лвл)
};

// ----- СПРАВОЧНИКИ -----
const RACES = [
  { id: "human", label: "Человек" },
  { id: "elf", label: "Эльф" },
  { id: "darkelf", label: "Тёмный эльф" },
];

const CLASSES = [
  { id: "knight", label: "Рыцарь" },
  { id: "mage", label: "Маг" },
  { id: "rogue", label: "Рога" },
];

// ----- РЕСУРСЫ ГЕРОЯ -----
let heroGold = 0;
let heroKills = 0;
let heroEliteKills = 0;

// ----- ЭФИР / ОВЕРДРАЙВ / АВТО-ОХОТА -----
let heroEther = 50;
const OVERDRIVE_ETHER_COST = 5;
const OVERDRIVE_DURATION_MS = 10000;
const AUTO_HUNT_DURATION_MS = 60000;
const ETHER_KILL_DROP_CHANCE = 1.0; // сейчас всегда 1 эфир с моба
const ELITE_KILL_CHANCE = 0.2;      // шанс, что убийство считается "элитным"

// ----- БАНКИ / БАФЫ -----
let heroHpPotions = 5;
let heroMpPotions = 3;
let heroPAtkScrolls = 2;
let heroMAtkScrolls = 2;

let buffPActive = false;
let buffMActive = false;
let buffPTimer = null;
let buffMTimer = null;
const BUFF_DURATION_MS = 30000;

// ----- СКИЛЛЫ (кнопки 1/2) -----
const SKILL1_MP_COST = 10;
const SKILL2_MP_COST = 15;
const SKILL1_COOLDOWN_MS = 4000;
const SKILL2_COOLDOWN_MS = 6000;
let skill1Ready = true;
let skill2Ready = true;

// ----- РЕГЕН -----
let hpRegenAcc = 0;
let mpRegenAcc = 0;
const REGEN_TICKS_TO_FULL = 600; // 10 минут

// ----- АРЕНА (СТАТ ГЕРОЯ) -----
let heroArenaRating = 0;

// ====== БАЗА СКИЛЛОВ (SKILL DB) ======
const SKILL_DB = {
  // --- 1 ПРОФА (FIGHTER) ---
  "Power Strike": {
    id: "power_strike",
    name: "Power Strike",
    type: "physical",
    power: 1.5,
    mp: 10,
    cd: 4000,
    spCost: 1, // стоит 1 SP
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
    spCost: 1, // тоже дешёвый стартовый
    desc: "Летал x2.5 (Шанс 70%)",
  },

  // --- 1 ПРОФА (MYSTIC) ---
  "Wind Strike": {
    id: "wind_strike",
    name: "Wind Strike",
    type: "magical",
    power: 2.0,
    mp: 12,
    cd: 3000,
    castTime: 1500,
    spCost: 1, // базовый нук
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
    spCost: 1, // стартовый дрейн
    desc: "Дрейн ХП (40%)",
  },

  // --- 2 ПРОФА (KNIGHT - 20+) ---
  "Shield Stun": {
    id: "shield_stun",
    name: "Shield Stun",
    type: "physical",
    power: 1.2,
    mp: 20,
    cd: 8000,
    stun: true,
    spCost: 3,
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
    spCost: 3,
    desc: "P.Def x3 (УД)",
  },

  // --- 2 ПРОФА (ROGUE - 20+) ---
  "Backstab": {
    id: "backstab",
    name: "Backstab",
    type: "physical",
    power: 4.0,
    mp: 30,
    cd: 10000,
    chance: 0.5,
    spCost: 3,
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
    spCost: 2,
    desc: "Скор. Атк +30%",
  },

  // --- 2 ПРОФА (WIZARD - 20+) ---
  "Blaze": {
    id: "blaze",
    name: "Blaze",
    type: "magical",
    power: 3.0,
    mp: 25,
    cd: 4000,
    castTime: 2000,
    spCost: 3,
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
    spCost: 4, // спам-нюк, пусть дороже
    desc: "Быстрая вспышка (Спам)",
  },
};

