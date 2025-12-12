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

// ----- ПЕРЕСЧЁТ СТАТОВ ГЕРОЯ -----
function recalculateHeroStats() {
  if (typeof profile === "undefined" || typeof stats === "undefined") {
    console.warn("[StatSystem] Cannot recalculate - globals not ready");
    return;
  }
  if (typeof heroModifiers === "undefined") {
    console.warn("[StatSystem] Cannot recalculate - heroModifiers not ready");
    return;
  }
  if (typeof getAllEquipmentStats !== "function") {
    console.warn("[StatSystem] Cannot recalculate - getAllEquipmentStats not ready");
    return;
  }
  if (!profile.race || !profile.archetype) return;

  const safeLevel = Math.max(1, Math.min(99, Number(stats.level) || 1));

  const hero = {
    race: profile.race,
    archetype: profile.archetype,
    level: safeLevel,
    tattooBonus: heroModifiers.tattoo,
    setBonus: heroModifiers.set,
    equipStats: getAllEquipmentStats()
  };

  const derived = calcDerivedStats(hero);
  if (!derived) return;

  const oldMaxHp = Number(stats.maxHp) || 1;
  const oldMaxMp = Number(stats.maxMp) || 1;

  stats.maxHp = derived.maxHp;
  stats.maxMp = derived.maxMp;
  stats.pAtk = derived.pAtk;
  stats.mAtk = derived.mAtk;
  stats.pDef = derived.pDef;
  stats.mDef = derived.mDef;
  stats.atkSpd = derived.atkSpd;
  stats.castSpd = derived.castSpd;
  stats.critChance = derived.critChance;
  stats.critMultiplier = derived.critMultiplier;

  // Legacy совместимость
  stats.minAttack = Math.floor(stats.pAtk * 0.8);
  stats.maxAttack = Math.floor(stats.pAtk * 1.2);

  // Корректируем текущие HP/MP пропорционально
  if (oldMaxHp > 0) {
    stats.hp = Math.floor(stats.hp * (stats.maxHp / oldMaxHp));
  }
  if (oldMaxMp > 0) {
    stats.mp = Math.floor(stats.mp * (stats.maxMp / oldMaxMp));
  }

  // Ограничиваем
  stats.hp = Math.min(Math.max(0, stats.hp), stats.maxHp);
  stats.mp = Math.min(Math.max(0, stats.mp), stats.maxMp);
}
