"use strict";

// ============================================================
//  FORGE SYSTEM — Кузница (MVP v1)
// ============================================================

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

// ----- ПЕРЕПЛАВКА -----
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

  // Списываем и начисляем
  const actualAmount = Math.min(amount, maxPossible);
  for (const key in recipe.cost) {
    resources[key] -= recipe.cost[key] * actualAmount;
  }
  for (const key in recipe.gain) {
    resources[key] = (resources[key] || 0) + recipe.gain[key] * actualAmount;
  }

  saveGame();

  return {
    success: true,
    amount: actualAmount,
    gained: recipe.gain,
    recipeName: recipe.name
  };
}

// ----- ХЕЛПЕРЫ ДЛЯ UI -----
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
