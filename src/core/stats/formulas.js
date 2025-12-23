"use strict";

// ============================================================
//  FORMULAS — расчёт производных характеристик
// ============================================================

// Modifier tables (pre-calculated)
function buildModTable(base, min, max, offset) {
  const table = {};
  for (let s = min; s <= max; s++) {
    table[s] = Math.pow(base, s - offset);
  }
  return table;
}

const POWER_MOD = buildModTable(1.036, 1, 99, 10);
const AGILITY_MOD = buildModTable(1.009, 1, 99, 10);
const VITALITY_MOD = buildModTable(1.030, 1, 99, 10);
const INTELLECT_MOD = buildModTable(1.020, 1, 99, 10);
const CONCENTRATION_MOD = buildModTable(1.050, 1, 99, 10);
const SPIRIT_MOD = buildModTable(1.010, 1, 99, 10);

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, Math.round(Number(val) || min)));
}

// Calculate all derived stats
function calculateDerived(attributes, level, template, bonuses) {
  const attr = attributes;
  const lvl = clamp(level, 1, 99);
  const flat = bonuses?.flat || {};
  const pct = bonuses?.pct || {};

  // Get modifiers
  const powerMod = POWER_MOD[clamp(attr.power, 1, 99)];
  const agilityMod = AGILITY_MOD[clamp(attr.agility, 1, 99)];
  const vitalityMod = VITALITY_MOD[clamp(attr.vitality, 1, 99)];
  const intellectMod = INTELLECT_MOD[clamp(attr.intellect, 1, 99)];
  const concentrationMod = CONCENTRATION_MOD[clamp(attr.concentration, 1, 99)];
  const spiritMod = SPIRIT_MOD[clamp(attr.spirit, 1, 99)];

  // Base HP/MP by level
  const baseHealth = template.baseHealth
    + template.lvlHealthAdd * (lvl - 1)
    + template.lvlHealthMod * ((lvl - 1) * (lvl - 2) / 2);

  const baseMana = template.baseMana
    + template.lvlManaAdd * (lvl - 1)
    + template.lvlManaMod * ((lvl - 1) * (lvl - 2) / 2);

  // Calculate derived
  const maxHealth = Math.floor(baseHealth * vitalityMod * (1 + (pct.healthMax || 0))) + (flat.healthMax || 0);
  const maxMana = Math.floor(baseMana * spiritMod * (1 + (pct.manaMax || 0))) + (flat.manaMax || 0);

  const physicalPower = Math.floor(template.basePhysicalPower * powerMod * (1 + (pct.physicalPower || 0))) + (flat.physicalPower || 0);
  const magicPower = Math.floor(template.baseMagicPower * intellectMod * (1 + (pct.magicPower || 0))) + (flat.magicPower || 0);

  const attackSpeed = Math.floor(template.baseAttackSpeed * agilityMod * (1 + (pct.attackSpeed || 0))) + (flat.attackSpeed || 0);
  const castSpeed = Math.floor(template.baseCastSpeed * concentrationMod * (1 + (pct.castSpeed || 0))) + (flat.castSpeed || 0);

  const physicalDefense = Math.floor(template.basePhysicalDef * (1 + (pct.physicalDefense || 0))) + (flat.physicalDefense || 0);
  const magicDefense = Math.floor(template.baseMagicDef * (1 + (pct.magicDefense || 0))) + (flat.magicDefense || 0);

  // Crit from agility
  const baseCrit = 0.05;
  const agilityCritBonus = (clamp(attr.agility, 1, 99) - 10) * 0.002;
  const critChance = Math.min(0.5, Math.max(0, baseCrit + agilityCritBonus + (flat.critChance || 0) + (pct.critChance || 0)));
  const critMultiplier = 2.0 + (flat.critMultiplier || 0) + (pct.critMultiplier || 0);

  return {
    maxHealth,
    maxMana,
    physicalPower,
    magicPower,
    physicalDefense,
    magicDefense,
    attackSpeed,
    castSpeed,
    critChance,
    critMultiplier
  };
}

// Attack interval from attackSpeed
function getAttackInterval(attackSpeed) {
  // attackSpeed 300 = 1000ms, attackSpeed 600 = 500ms
  return Math.floor(300000 / Math.max(100, attackSpeed));
}

// Damage calculation
function calculateDamage(attacker, defender, isPhysical) {
  if (isPhysical === undefined) isPhysical = true;

  const power = isPhysical ? attacker.physicalPower : attacker.magicPower;
  const defense = isPhysical ? defender.physicalDefense : defender.magicDefense;

  // Base damage with variance ±20%
  const variance = 0.2;
  const rawDamage = power * (1 + (Math.random() * variance * 2 - variance));

  // Defense reduction (soft cap)
  const defReduction = defense / (defense + 100);
  var damage = Math.floor(rawDamage * (1 - defReduction * 0.5));

  // Crit check
  const isCrit = Math.random() < attacker.critChance;
  if (isCrit) {
    damage = Math.floor(damage * attacker.critMultiplier);
  }

  return { damage: Math.max(1, damage), isCrit: isCrit };
}

console.log("[Formulas] Module loaded");
