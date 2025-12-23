"use strict";

// ============================================================
//  STAT SYSTEM — Расчёт характеристик в стиле Lineage 2
// ============================================================

// ----- БАЗОВЫЕ СТАТЫ РАС/КЛАССОВ -----
const BASE_STATS = {
  human_fighter: {
    str: 40, dex: 30, con: 43,
    int: 21, wit: 11, men: 25
  },
  human_mystic: {
    str: 22, dex: 21, con: 27,
    int: 41, wit: 20, men: 39
  }
};

// ----- CLASS TEMPLATES (формулы роста HP/MP) -----
const CLASS_TEMPLATES = {
  human_fighter: {
    baseHpMax: 80,  lvlHpAdd: 12.0,  lvlHpMod: 0.37,
    baseMpMax: 30,  lvlMpAdd: 5.5,   lvlMpMod: 0.16,
    basePAtk: 4,    baseMAtk: 2,
    basePDef: 40,   baseMDef: 25,
    baseAtkSpd: 300, baseCastSpd: 200
  },
  human_mystic: {
    baseHpMax: 50,  lvlHpAdd: 8.0,   lvlHpMod: 0.20,
    baseMpMax: 80,  lvlMpAdd: 8.5,   lvlMpMod: 0.22,
    basePAtk: 2,    baseMAtk: 5,
    basePDef: 25,   baseMDef: 40,
    baseAtkSpd: 250, baseCastSpd: 300
  }
};

// ----- ГЕНЕРАЦИЯ LUT МОДИФИКАТОРОВ -----
function buildModTable(base, min = 1, max = 99, offset = 40) {
  const table = {};
  for (let s = min; s <= max; s++) {
    table[s] = Math.pow(base, s - offset);
  }
  return table;
}

const STR_MOD = buildModTable(1.036);
const DEX_MOD = buildModTable(1.009);
const CON_MOD = buildModTable(1.030);
const INT_MOD = buildModTable(1.020);
const WIT_MOD = buildModTable(1.050);
const MEN_MOD = buildModTable(1.010);

// ----- HELPER: ограничение статов для LUT -----
function clampStat(val) {
  return Math.max(1, Math.min(99, Math.round(Number(val) || 1)));
}

// ----- ФОРМУЛЫ РАСЧЁТА HP/MP ПО УРОВНЮ -----
function calcBaseHp(level, template) {
  const L = level;
  return template.baseHpMax
       + template.lvlHpAdd * (L - 1)
       + template.lvlHpMod * ((L - 1) * (L - 2) / 2);
}

function calcBaseMp(level, template) {
  const L = level;
  return template.baseMpMax
       + template.lvlMpAdd * (L - 1)
       + template.lvlMpMod * ((L - 1) * (L - 2) / 2);
}

// ----- ПОЛУЧЕНИЕ EFFECTIVE STATS -----
function getEffectiveStats(baseStats, tattooBonus, setBonus) {
  const tb = tattooBonus || {};
  const sb = setBonus || {};

  return {
    str: baseStats.str + (tb.str || 0) + (sb.str || 0),
    dex: baseStats.dex + (tb.dex || 0) + (sb.dex || 0),
    con: baseStats.con + (tb.con || 0) + (sb.con || 0),
    int: baseStats.int + (tb.int || 0) + (sb.int || 0),
    wit: baseStats.wit + (tb.wit || 0) + (sb.wit || 0),
    men: baseStats.men + (tb.men || 0) + (sb.men || 0)
  };
}

// ----- РАСЧЁТ DERIVED STATS -----
function calcDerivedStats(hero) {
  const classKey = hero.race + "_" + hero.archetype;
  const template = CLASS_TEMPLATES[classKey];
  const baseStats = BASE_STATS[classKey];

  if (!template || !baseStats) {
    console.warn("[StatSystem] Unknown class:", classKey);
    return null;
  }

  const eff = getEffectiveStats(baseStats, hero.tattooBonus, hero.setBonus);
  const level = Math.max(1, Math.min(99, Number(hero.level) || 1));

  const baseStr = clampStat(baseStats.str);
  const baseDex = clampStat(baseStats.dex);
  const baseCon = clampStat(baseStats.con);
  const baseInt = clampStat(baseStats.int);
  const baseWit = clampStat(baseStats.wit);
  const baseMen = clampStat(baseStats.men);

  const conMult = CON_MOD[clampStat(eff.con)] / CON_MOD[baseCon];
  const menMult = MEN_MOD[clampStat(eff.men)] / MEN_MOD[baseMen];
  const strMult = STR_MOD[clampStat(eff.str)] / STR_MOD[baseStr];
  const intMult = INT_MOD[clampStat(eff.int)] / INT_MOD[baseInt];
  const dexMult = DEX_MOD[clampStat(eff.dex)] / DEX_MOD[baseDex];
  const witMult = WIT_MOD[clampStat(eff.wit)] / WIT_MOD[baseWit];

  const baseHp = calcBaseHp(level, template);
  const baseMp = calcBaseMp(level, template);

  const maxHp = Math.floor(baseHp * conMult);
  const maxMp = Math.floor(baseMp * menMult);

  const weaponPAtk = hero.equipStats?.pAtk || 0;
  const weaponMAtk = hero.equipStats?.mAtk || 0;
  const weaponAtkSpd = hero.equipStats?.atkSpd || 0;

  const pAtk = Math.floor((template.basePAtk + weaponPAtk) * strMult);
  const mAtk = Math.floor((template.baseMAtk + weaponMAtk) * intMult);
  const atkSpd = Math.floor((template.baseAtkSpd + weaponAtkSpd) * dexMult);
  const castSpd = Math.floor(template.baseCastSpd * witMult);

  const armorPDef = hero.equipStats?.pDef || 0;
  const armorMDef = hero.equipStats?.mDef || 0;
  const pDef = template.basePDef + armorPDef;
  const mDef = template.baseMDef + armorMDef;

  const baseCrit = 0.05;
  const dexCritBonus = (clampStat(eff.dex) - baseDex) * 0.002;
  const weaponCrit = hero.equipStats?.critChance || 0;
  const critChance = Math.min(0.5, Math.max(0, baseCrit + dexCritBonus + weaponCrit));

  return {
    maxHp, maxMp, pAtk, mAtk, pDef, mDef,
    atkSpd, castSpd, critChance, critMultiplier: 2.0,
    effectiveStats: eff
  };
}

// ----- ПЕРЕСЧЁТ СТАТОВ ГЕРОЯ (v2 — использует новую систему) -----
function recalculateHeroStats() {
  if (typeof stats === "undefined") {
    console.warn("[StatSystem] Cannot recalculate - stats not ready");
    return;
  }

  // Поддержка старого формата (profile.race) и нового (stats.build.race)
  const race = stats.build?.race || profile?.race;
  const classId = stats.build?.classId || profile?.archetype;

  if (!race || !classId) {
    // Fallback для старых сейвов без класса
    return;
  }

  // Синхронизируем build с profile (для обратной совместимости)
  if (stats.build) {
    stats.build.race = race;
    stats.build.classId = classId;
  }

  const templateKey = race + "_" + classId;

  // Используем новую систему если доступна
  const baseAttr = typeof CLASS_BASE_ATTRIBUTES !== "undefined"
    ? CLASS_BASE_ATTRIBUTES[templateKey]
    : null;
  const template = typeof CLASS_TEMPLATES !== "undefined"
    ? CLASS_TEMPLATES[templateKey]
    : null;

  if (!baseAttr || !template) {
    // Fallback на старую систему
    console.warn("[StatSystem] Unknown class:", templateKey, "- using legacy");
    return recalculateHeroStatsLegacy();
  }

  // Merge base + flat bonuses from equipment/buffs
  const effectiveAttr = {
    power: baseAttr.power + (stats.bonuses?.flat?.power || 0),
    agility: baseAttr.agility + (stats.bonuses?.flat?.agility || 0),
    vitality: baseAttr.vitality + (stats.bonuses?.flat?.vitality || 0),
    intellect: baseAttr.intellect + (stats.bonuses?.flat?.intellect || 0),
    concentration: baseAttr.concentration + (stats.bonuses?.flat?.concentration || 0),
    spirit: baseAttr.spirit + (stats.bonuses?.flat?.spirit || 0)
  };

  // Calculate derived using new formulas
  const derived = calculateDerived(
    effectiveAttr,
    stats.progression?.level || stats.level || 1,
    template,
    stats.bonuses
  );

  // Save old values for proportional scaling
  const oldMaxHealth = stats.derived?.maxHealth || 100;
  const oldMaxMana = stats.derived?.maxMana || 50;

  // Update derived stats
  if (stats.derived) {
    Object.assign(stats.derived, derived);
  }

  // Scale current resources proportionally
  if (stats.resources) {
    stats.resources.health = Math.floor(stats.resources.health * (derived.maxHealth / oldMaxHealth));
    stats.resources.mana = Math.floor(stats.resources.mana * (derived.maxMana / oldMaxMana));

    // Clamp
    stats.resources.health = Math.min(Math.max(0, stats.resources.health), derived.maxHealth);
    stats.resources.mana = Math.min(Math.max(0, stats.resources.mana), derived.maxMana);
  }
}

// Legacy fallback для старых сейвов
function recalculateHeroStatsLegacy() {
  if (!profile?.race || !profile?.archetype) return;

  const classKey = profile.race + "_" + profile.archetype;
  const template = CLASS_TEMPLATES_LEGACY[classKey];
  const baseStats = BASE_STATS[classKey];

  if (!template || !baseStats) return;

  const safeLevel = Math.max(1, Math.min(99, Number(stats.level) || 1));
  const eff = getEffectiveStats(baseStats, heroModifiers?.tattoo, heroModifiers?.set);

  const conMult = CON_MOD[clampStat(eff.con)] / CON_MOD[clampStat(baseStats.con)];
  const menMult = MEN_MOD[clampStat(eff.men)] / MEN_MOD[clampStat(baseStats.men)];
  const strMult = STR_MOD[clampStat(eff.str)] / STR_MOD[clampStat(baseStats.str)];
  const intMult = INT_MOD[clampStat(eff.int)] / INT_MOD[clampStat(baseStats.int)];
  const dexMult = DEX_MOD[clampStat(eff.dex)] / DEX_MOD[clampStat(baseStats.dex)];
  const witMult = WIT_MOD[clampStat(eff.wit)] / WIT_MOD[clampStat(baseStats.wit)];

  const baseHp = calcBaseHp(safeLevel, template);
  const baseMp = calcBaseMp(safeLevel, template);

  const equipStats = typeof getAllEquipmentStats === "function" ? getAllEquipmentStats() : {};

  const oldMaxHp = stats.derived?.maxHealth || 100;
  const oldMaxMp = stats.derived?.maxMana || 50;

  // Update derived
  if (stats.derived) {
    stats.derived.maxHealth = Math.floor(baseHp * conMult);
    stats.derived.maxMana = Math.floor(baseMp * menMult);
    stats.derived.physicalPower = Math.floor((template.basePAtk + (equipStats.pAtk || 0)) * strMult);
    stats.derived.magicPower = Math.floor((template.baseMAtk + (equipStats.mAtk || 0)) * intMult);
    stats.derived.attackSpeed = Math.floor((template.baseAtkSpd + (equipStats.atkSpd || 0)) * dexMult);
    stats.derived.castSpeed = Math.floor(template.baseCastSpd * witMult);
    stats.derived.physicalDefense = template.basePDef + (equipStats.pDef || 0);
    stats.derived.magicDefense = template.baseMDef + (equipStats.mDef || 0);

    const baseCrit = 0.05;
    const dexCritBonus = (clampStat(eff.dex) - clampStat(baseStats.dex)) * 0.002;
    stats.derived.critChance = Math.min(0.5, Math.max(0, baseCrit + dexCritBonus + (equipStats.critChance || 0)));
    stats.derived.critMultiplier = 2.0;
  }

  // Scale resources
  if (stats.resources) {
    stats.resources.health = Math.floor(stats.resources.health * (stats.derived.maxHealth / oldMaxHp));
    stats.resources.mana = Math.floor(stats.resources.mana * (stats.derived.maxMana / oldMaxMp));
    stats.resources.health = Math.min(Math.max(0, stats.resources.health), stats.derived.maxHealth);
    stats.resources.mana = Math.min(Math.max(0, stats.resources.mana), stats.derived.maxMana);
  }
}

// Rename old CLASS_TEMPLATES for legacy fallback
const CLASS_TEMPLATES_LEGACY = CLASS_TEMPLATES;
