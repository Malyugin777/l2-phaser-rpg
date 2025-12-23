"use strict";

// ============================================================
//  CORE ATTRIBUTES — базовые характеристики
// ============================================================

const ATTRIBUTE_DEFAULTS = {
  power: 10,         // → Physical Power
  agility: 10,       // → Attack Speed, Crit Chance
  vitality: 10,      // → Max Health
  intellect: 10,     // → Magic Power
  concentration: 10, // → Cast Speed
  spirit: 10         // → Max Mana
};

// Базовые статы по классам
const CLASS_BASE_ATTRIBUTES = {
  human_fighter: {
    power: 40, agility: 30, vitality: 43,
    intellect: 21, concentration: 11, spirit: 25
  },
  human_mage: {
    power: 22, agility: 21, vitality: 27,
    intellect: 41, concentration: 20, spirit: 39
  },
  elf_fighter: {
    power: 36, agility: 36, vitality: 36,
    intellect: 23, concentration: 14, spirit: 25
  },
  elf_mage: {
    power: 21, agility: 24, vitality: 25,
    intellect: 37, concentration: 23, spirit: 40
  },
  darkelf_fighter: {
    power: 41, agility: 34, vitality: 32,
    intellect: 25, concentration: 12, spirit: 26
  },
  darkelf_mage: {
    power: 23, agility: 23, vitality: 24,
    intellect: 44, concentration: 19, spirit: 37
  }
};

// Шаблоны роста по уровням
const CLASS_TEMPLATES = {
  human_fighter: {
    baseHealth: 80, lvlHealthAdd: 12.0, lvlHealthMod: 0.37,
    baseMana: 30, lvlManaAdd: 5.5, lvlManaMod: 0.16,
    basePhysicalPower: 4, baseMagicPower: 2,
    basePhysicalDef: 40, baseMagicDef: 25,
    baseAttackSpeed: 300, baseCastSpeed: 200
  },
  human_mage: {
    baseHealth: 50, lvlHealthAdd: 8.0, lvlHealthMod: 0.20,
    baseMana: 80, lvlManaAdd: 8.5, lvlManaMod: 0.22,
    basePhysicalPower: 2, baseMagicPower: 5,
    basePhysicalDef: 25, baseMagicDef: 40,
    baseAttackSpeed: 250, baseCastSpeed: 300
  },
  elf_fighter: null,
  elf_mage: null,
  darkelf_fighter: null,
  darkelf_mage: null
};

// Fill elf/darkelf with same values
CLASS_TEMPLATES.elf_fighter = { ...CLASS_TEMPLATES.human_fighter };
CLASS_TEMPLATES.elf_mage = { ...CLASS_TEMPLATES.human_mage };
CLASS_TEMPLATES.darkelf_fighter = { ...CLASS_TEMPLATES.human_fighter };
CLASS_TEMPLATES.darkelf_mage = { ...CLASS_TEMPLATES.human_mage };

console.log("[Attributes] Module loaded");
