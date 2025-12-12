"use strict";

// ----- ОПИСАНИЕ ПРЕДМЕТОВ (ЭКИПИРОВКА) -----
const ITEM_DEFINITIONS = {
  "Меч новичка": {
    slot: "weapon",
    attackMin: 3,
    attackMax: 5,
    critChance: 0.0,
  },
  "Кинжал охотника": {
    slot: "weapon",
    attackMin: 2,
    attackMax: 7,
    critChance: 0.05,
  },
  "Кольцо ученика": {
    slot: "jewelry",
    attackMin: 1,
    attackMax: 2,
    critChance: 0.03,
  },
  "Серьга путешественника": {
    slot: "jewelry",
    attackMin: 1,
    attackMax: 1,
    critChance: 0.02,
  },
  "Кольчуга гнома": {
    slot: "armor",
    attackMin: 2,
    attackMax: 3,
    critChance: 0.0,
  },
  "Талисман ветра": {
    slot: "jewelry",
    attackMin: 0,
    attackMax: 3,
    critChance: 0.04,
  },
};

// ----- Парс имени предмета -----

function parseItemName(fullName) {
  let locationTag = "";
  let basePart = fullName;
  const bracketIndex = fullName.indexOf("[");
  if (bracketIndex !== -1) {
    basePart = fullName.slice(0, bracketIndex).trim();
    locationTag = fullName.slice(bracketIndex).trim();
  }
  let enchant = 0;
  let baseName = basePart;
  const plusIndex = basePart.lastIndexOf("+");
  if (plusIndex !== -1) {
    const withoutPlus = basePart.slice(0, plusIndex).trim();
    const numStr = basePart.slice(plusIndex + 1).trim();
    const parsed = parseInt(numStr, 10);
    if (!isNaN(parsed)) {
      enchant = parsed;
      baseName = withoutPlus;
    }
  }
  return { baseName, enchant, locationTag };
}

function buildItemName(baseName, locationTag, enchant) {
  let result = baseName;
  if (enchant > 0) result += " +" + enchant;
  if (locationTag) result += " " + locationTag;
  return result;
}

// ----- ЭКИПИРОВКА: ХЕЛПЕРЫ -----

function getItemDefinition(baseName) {
  return ITEM_DEFINITIONS[baseName] || null;
}

function getItemEffectiveBonus(fullName) {
  const parsed = parseItemName(fullName);
  const def = getItemDefinition(parsed.baseName);
  if (!def) {
    return {
      attackMinBonus: 0,
      attackMaxBonus: 0,
      critChanceBonus: 0,
      slot: null,
    };
  }
  const enchant = parsed.enchant || 0;
  const attackMul = 1 + enchant * 0.2;
  const critMul = 1 + enchant * 0.1;

  const attackMinBonus = Math.round((def.attackMin || 0) * attackMul);
  const attackMaxBonus = Math.round((def.attackMax || 0) * attackMul);
  const critChanceBonus = (def.critChance || 0) * critMul;

  return {
    attackMinBonus,
    attackMaxBonus,
    critChanceBonus,
    slot: def.slot,
  };
}

function getAllEquipmentBonuses() {
  let totalMin = 0;
  let totalMax = 0;
  let totalCrit = 0;

  [equipment.weapon, equipment.armor, equipment.jewelry1, equipment.jewelry2].forEach(
    (itemName) => {
      if (!itemName) return;
      const bonus = getItemEffectiveBonus(itemName);
      totalMin += bonus.attackMinBonus;
      totalMax += bonus.attackMaxBonus;
      totalCrit += bonus.critChanceBonus;
    }
  );

  return {
    attackMinBonus: totalMin,
    attackMaxBonus: totalMax,
    critChanceBonus: totalCrit,
  };
}

function getEffectiveMinAttack() {
  const b = getAllEquipmentBonuses();
  return Math.max(1, stats.minAttack + b.attackMinBonus);
}

function getEffectiveMaxAttack() {
  const b = getAllEquipmentBonuses();
  return Math.max(1, stats.maxAttack + b.attackMaxBonus);
}

function getEffectiveCritChance() {
  const b = getAllEquipmentBonuses();
  let crit = stats.critChance + b.critChanceBonus;
  if (crit < 0) crit = 0;
  if (crit > 0.9) crit = 0.9;
  return crit;
}

// ----- ЭКИПИРОВКА: АВТОЭКИП И СБРОС -----

function autoEquipBestItems() {
  // собрать все предметы (инвентарь + надетые)
  const allItems = inventory.slice();
  if (equipment.weapon) allItems.push(equipment.weapon);
  if (equipment.armor) allItems.push(equipment.armor);
  if (equipment.jewelry1) allItems.push(equipment.jewelry1);
  if (equipment.jewelry2) allItems.push(equipment.jewelry2);

  let bestWeapon = null;
  let bestWeaponScore = -Infinity;
  let bestArmor = null;
  let bestArmorScore = -Infinity;
  let bestJewelry1 = null;
  let bestJewelry1Score = -Infinity;
  let bestJewelry2 = null;
  let bestJewelry2Score = -Infinity;

  allItems.forEach((name) => {
    const parsed = parseItemName(name);
    const def = getItemDefinition(parsed.baseName);
    if (!def) return;
    const bonus = getItemEffectiveBonus(name);
    const score =
      bonus.attackMinBonus +
      bonus.attackMaxBonus +
      bonus.critChanceBonus * 50;

    switch (def.slot) {
      case "weapon":
        if (score > bestWeaponScore) {
          bestWeaponScore = score;
          bestWeapon = name;
        }
        break;
      case "armor":
        if (score > bestArmorScore) {
          bestArmorScore = score;
          bestArmor = name;
        }
        break;
      case "jewelry":
        if (score > bestJewelry1Score) {
          bestJewelry2 = bestJewelry1;
          bestJewelry2Score = bestJewelry1Score;
          bestJewelry1 = name;
          bestJewelry1Score = score;
        } else if (score > bestJewelry2Score) {
          bestJewelry2 = name;
          bestJewelry2Score = score;
        }
        break;
    }
  });

  const newInventory = allItems.slice();

  function removeFromInventoryByName(itemName) {
    if (!itemName) return;
    const idx = newInventory.indexOf(itemName);
    if (idx !== -1) newInventory.splice(idx, 1);
  }

  removeFromInventoryByName(bestWeapon);
  removeFromInventoryByName(bestArmor);
  removeFromInventoryByName(bestJewelry1);
  removeFromInventoryByName(bestJewelry2);

  equipment.weapon = bestWeapon;
  equipment.armor = bestArmor;
  equipment.jewelry1 = bestJewelry1;
  equipment.jewelry2 = bestJewelry2;
  inventory = newInventory;
}

function unequipAllItems() {
  const toReturn = [];
  if (equipment.weapon) toReturn.push(equipment.weapon);
  if (equipment.armor) toReturn.push(equipment.armor);
  if (equipment.jewelry1) toReturn.push(equipment.jewelry1);
  if (equipment.jewelry2) toReturn.push(equipment.jewelry2);

  inventory = inventory.concat(toReturn);

  equipment.weapon = null;
  equipment.armor = null;
  equipment.jewelry1 = null;
  equipment.jewelry2 = null;
}