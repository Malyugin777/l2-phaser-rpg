"use strict";

// ============================================================
//  FORGE SYSTEM — Кузница (MVP v2)
// ============================================================

// ----- КОНСТАНТЫ -----
const LUCKY_CHANCE = 0.05; // 5% шанс x2

// ----- РЕЦЕПТЫ ПЕРЕПЛАВКИ (100% успех) -----
const REFINE_RECIPES = {
  ironIngot: {
    id: "ironIngot",
    name: "Железный слиток",
    cost: { ore: 10, coal: 2 },
    gain: { ironIngot: 1 },
    successRate: 1.0
  },
  cloth: {
    id: "cloth",
    name: "Ткань",
    cost: { thread: 10 },
    gain: { cloth: 1 },
    successRate: 1.0
  },
  leatherSheet: {
    id: "leatherSheet",
    name: "Выделанная кожа",
    cost: { leather: 5 },
    gain: { leatherSheet: 1 },
    successRate: 1.0
  }
};

// ----- РЕЦЕПТЫ КРАФТА ЭКИПЫ (100% успех) -----
const CRAFT_RECIPES = {
  bastardSword: {
    id: "bastardSword",
    name: "Bastard Sword",
    type: "weapon",
    rarity: "common",
    grade: "D",
    cost: { ironIngot: 10, leatherSheet: 2, enchantDust: 3 },
    stats: { pAtk: 74 },
    successRate: 1.0,
    crystallize: { min: 20, max: 35 }
  },
  apprenticeRobe: {
    id: "apprenticeRobe",
    name: "Apprentice Robe",
    type: "armor",
    rarity: "common",
    grade: "D",
    cost: { cloth: 10, leatherSheet: 2, enchantDust: 3 },
    stats: { pDef: 45 },
    successRate: 1.0,
    crystallize: { min: 15, max: 28 }
  },
  travelerBoots: {
    id: "travelerBoots",
    name: "Traveler Boots",
    type: "armor",
    rarity: "common",
    grade: "D",
    cost: { leatherSheet: 4, cloth: 2, enchantDust: 2 },
    stats: { pDef: 20 },
    successRate: 1.0,
    crystallize: { min: 10, max: 20 }
  }
};

// ----- ПРОВЕРКА РЕСУРСОВ -----
function hasResources(cost) {
  for (const key in cost) {
    if (resources[key] === undefined || resources[key] < cost[key]) {
      return false;
    }
  }
  return true;
}

function getMissingResources(cost) {
  const missing = [];
  for (const key in cost) {
    const have = resources[key] || 0;
    const need = cost[key];
    if (have < need) {
      missing.push({ id: key, have: have, need: need });
    }
  }
  return missing;
}

// ----- СПИСАНИЕ/НАЧИСЛЕНИЕ -----
function spendResources(cost) {
  for (const key in cost) {
    resources[key] -= cost[key];
  }
}

function gainResources(gain) {
  for (const key in gain) {
    resources[key] = (resources[key] || 0) + gain[key];
  }
}

// ----- ПЕРЕПЛАВКА (с Lucky x2) -----
function tryRefine(recipeId, amount) {
  const recipe = REFINE_RECIPES[recipeId];
  if (!recipe) {
    console.warn("[Forge] Unknown recipe:", recipeId);
    return { success: false, reason: "unknown_recipe" };
  }

  if (amount < 1) amount = 1;

  // Считаем сколько реально можем сделать
  let maxPossible = amount;
  for (const key in recipe.cost) {
    const have = resources[key] || 0;
    const need = recipe.cost[key];
    const canMake = Math.floor(have / need);
    if (canMake < maxPossible) maxPossible = canMake;
  }

  if (maxPossible <= 0) {
    return { success: false, reason: "not_enough_resources", missing: getMissingResources(recipe.cost) };
  }

  // Списываем ресурсы
  const actualAmount = Math.min(amount, maxPossible);
  for (const key in recipe.cost) {
    resources[key] -= recipe.cost[key] * actualAmount;
  }

  // Начисляем с шансом Lucky x2
  let totalGained = 0;
  let luckyCount = 0;
  for (let i = 0; i < actualAmount; i++) {
    const isLucky = Math.random() < LUCKY_CHANCE;
    const multiplier = isLucky ? 2 : 1;
    if (isLucky) luckyCount++;
    for (const key in recipe.gain) {
      resources[key] = (resources[key] || 0) + recipe.gain[key] * multiplier;
    }
    totalGained += multiplier;
  }

  saveGame();

  return {
    success: true,
    amount: actualAmount,
    totalGained: totalGained,
    hadLucky: luckyCount > 0,
    luckyCount: luckyCount,
    gained: recipe.gain,
    recipeName: recipe.name
  };
}

// ----- ХЕЛПЕРЫ ДЛЯ UI ПЕРЕПЛАВКИ -----
function getResourceCount(resourceId) {
  return resources[resourceId] || 0;
}

function getRefineRecipes() {
  return Object.values(REFINE_RECIPES);
}

function canRefine(recipeId, amount) {
  const recipe = REFINE_RECIPES[recipeId];
  if (!recipe) return false;

  for (const key in recipe.cost) {
    const have = resources[key] || 0;
    const need = recipe.cost[key] * amount;
    if (have < need) return false;
  }
  return true;
}

// ----- ФУНКЦИИ КРАФТА -----
function tryCraft(recipeId) {
  const recipe = CRAFT_RECIPES[recipeId];
  if (!recipe) {
    return { success: false, reason: "unknown_recipe" };
  }

  if (!hasResources(recipe.cost)) {
    return { success: false, reason: "not_enough_resources" };
  }

  spendResources(recipe.cost);

  const newItem = {
    id: recipe.id + "_" + Date.now(),
    baseId: recipe.id,
    name: recipe.name,
    type: recipe.type,
    rarity: recipe.rarity,
    grade: recipe.grade,
    stats: { ...recipe.stats },
    isCrystallizable: true,
    crystallize: recipe.crystallize
  };

  inventory.push(newItem);
  saveGame();

  return { success: true, item: newItem };
}

function canCraft(recipeId) {
  const recipe = CRAFT_RECIPES[recipeId];
  if (!recipe) return false;
  return hasResources(recipe.cost);
}

function getCraftRecipes() {
  return Object.values(CRAFT_RECIPES);
}

// ----- РАЗБОР (CRYSTALLIZE) -----
function tryDismantle(inventoryIndex) {
  if (inventoryIndex < 0 || inventoryIndex >= inventory.length) {
    return { success: false, reason: "invalid_index" };
  }

  const item = inventory[inventoryIndex];

  if (!item.isCrystallizable || !item.crystallize) {
    return { success: false, reason: "not_crystallizable" };
  }

  // Считаем dust (random в диапазоне)
  const dustMin = item.crystallize.min || 10;
  const dustMax = item.crystallize.max || 20;
  const dustGain = Math.floor(Math.random() * (dustMax - dustMin + 1)) + dustMin;

  // Удаляем предмет
  const itemName = item.name;
  inventory.splice(inventoryIndex, 1);

  // Начисляем dust
  resources.enchantDust = (resources.enchantDust || 0) + dustGain;

  saveGame();

  return {
    success: true,
    itemName: itemName,
    dustGain: dustGain
  };
}

function getCrystallizableItems() {
  const result = [];
  inventory.forEach((item, index) => {
    if (item && item.isCrystallizable && (item.type === "weapon" || item.type === "armor")) {
      result.push({ ...item, inventoryIndex: index });
    }
  });
  return result;
}
