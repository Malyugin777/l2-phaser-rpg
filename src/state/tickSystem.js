"use strict";

// ============================================================
//  TICK SYSTEM — Реген L2-стиля (финал v6)
// ============================================================

const REGEN_TICK_MS = 3000;
const ACTION_TICK_MS = 250;
const COMBAT_TIMEOUT_MS = 10000;
const MAX_REGEN_TICKS_PER_FRAME = 3;
const MAX_STORED_REGEN_MS = 30000;

const REGEN_CONFIG = {
  hpPct: 0.01,
  hpFlat: 2,
  mpPct: 0.015,
  mpFlat: 1
};

const STANCE_MULT = {
  standing: { hp: 1.0, mp: 1.0 },
  sitting:  { hp: 2.0, mp: 1.5 }
};

const ZONE_MULT = {
  city:     { hp: 1.5, mp: 1.5 },
  location: { hp: 1.0, mp: 1.0 }
};

const COMBAT_MULT = {
  inCombat:  { hp: 0.3, mp: 0.5 },
  outCombat: { hp: 1.0, mp: 1.0 }
};

let regenAccumulator = 0;
let actionAccumulator = 0;
let tickCount = 0;

let inCombat = false;
let combatTimer = 0;

let currentStance = "standing";

let heroActionMeter = 0;
let enemyActionMeter = 0;
const ACTION_THRESHOLD = 1000;

function initTickSystem() {
  regenAccumulator = 0;
  actionAccumulator = 0;
  tickCount = 0;
  inCombat = false;
  combatTimer = 0;
  currentStance = "standing";
  heroActionMeter = 0;
  enemyActionMeter = 0;
}

function processTick(delta) {
  // Guard: ждём глобалы
  if (typeof stats === "undefined" || typeof mode === "undefined" || typeof buffs === "undefined") {
    return;
  }

  // === REGEN TICK ===
  regenAccumulator += delta;
  if (regenAccumulator > MAX_STORED_REGEN_MS) {
    regenAccumulator = MAX_STORED_REGEN_MS;
  }

  // Обрабатываем тики (max 3 за кадр, остаток сохраняется)
  let regenTicksThisFrame = 0;
  while (regenAccumulator >= REGEN_TICK_MS && regenTicksThisFrame < MAX_REGEN_TICKS_PER_FRAME) {
    regenAccumulator -= REGEN_TICK_MS;
    regenTicksThisFrame++;
    tickCount++;
    processRegenTick();
  }

  // === COMBAT ===
  if (mode === "city" && inCombat) {
    exitCombat();
  }

  if (inCombat && combatTimer > 0) {
    combatTimer -= delta;
    if (combatTimer <= 0) {
      exitCombat();
    }
  }

  // === ACTION TICK (только location + враг + жив) ===
  actionAccumulator += delta;
  while (actionAccumulator >= ACTION_TICK_MS) {
    actionAccumulator -= ACTION_TICK_MS;

    // Action meters тикают ТОЛЬКО в бою
    if (mode === "location" && typeof enemyAlive !== "undefined" && enemyAlive && stats.hp > 0) {
      processActionMeters();
    }

    processSkillCooldowns(ACTION_TICK_MS);
  }
}

function processRegenTick() {
  stats.hp = Number(stats.hp) || 0;
  stats.mp = Number(stats.mp) || 0;
  stats.maxHp = Math.max(1, Number(stats.maxHp) || 1);
  stats.maxMp = Math.max(1, Number(stats.maxMp) || 1);

  // === СМЕРТЬ ===
  if (stats.hp <= 0) {
    if (mode === "city") {
      // Воскрешение: min 1, inCombat гарантированно false
      stats.hp = Math.max(1, Math.floor(stats.maxHp * 0.1));
      stats.mp = Math.max(1, Math.floor(stats.maxMp * 0.1));
      currentStance = "standing";
      buffs.isResting = false;
      inCombat = false;
      combatTimer = 0;
      console.log("[Regen] Воскрешение: HP/MP 10% (min 1)");
      updateRegenUI();
    }
    return;
  }

  // === МНОЖИТЕЛИ ===
  const stanceMult = STANCE_MULT[currentStance] || STANCE_MULT.standing;
  const zoneMult = ZONE_MULT[mode] || ZONE_MULT.location;
  const combatMult = inCombat ? COMBAT_MULT.inCombat : COMBAT_MULT.outCombat;

  // === HP ===
  if (stats.hp < stats.maxHp) {
    const hpBase = Math.floor(stats.maxHp * REGEN_CONFIG.hpPct + REGEN_CONFIG.hpFlat);
    const hpGain = Math.floor(hpBase * stanceMult.hp * zoneMult.hp * combatMult.hp);
    const hpFinal = Math.max(1, hpGain);
    stats.hp = Math.min(stats.maxHp, stats.hp + hpFinal);
  }

  // === MP ===
  if (stats.mp < stats.maxMp) {
    const mpBase = Math.floor(stats.maxMp * REGEN_CONFIG.mpPct + REGEN_CONFIG.mpFlat);
    const mpGain = Math.floor(mpBase * stanceMult.mp * zoneMult.mp * combatMult.mp);
    const mpFinal = Math.max(1, mpGain);
    stats.mp = Math.min(stats.maxMp, stats.mp + mpFinal);
  }

  updateRegenUI();
}

function updateRegenUI() {
  if (typeof updateHeroUI === "function") {
    updateHeroUI();
  }
}

// ----- COMBAT -----
function enterCombat() {
  if (mode === "city") return;

  const wasInCombat = inCombat;
  inCombat = true;
  combatTimer = COMBAT_TIMEOUT_MS;

  if (currentStance === "sitting") {
    forceStandUp();
  }

  if (!wasInCombat) {
    console.log("[Combat] Вошёл в бой");
  }
}

function exitCombat() {
  if (!inCombat) return;
  inCombat = false;
  combatTimer = 0;
  console.log("[Combat] Вышел из боя");
}

function isInCombat() {
  return inCombat;
}

// ----- STANCE -----
function sitDown() {
  if (inCombat) {
    console.log("[Stance] Нельзя сесть в бою!");
    return false;
  }

  // В city сидеть можно всегда, в location — только без врага
  if (mode === "location" && typeof enemyAlive !== "undefined" && enemyAlive) {
    console.log("[Stance] Нельзя сесть — враг рядом!");
    return false;
  }

  currentStance = "sitting";
  buffs.isResting = true;
  console.log("[Stance] Сел (HP x2, MP x1.5)");
  return true;
}

function standUp() {
  if (currentStance === "standing") return;
  currentStance = "standing";
  buffs.isResting = false;
  console.log("[Stance] Встал");
}

function forceStandUp() {
  if (currentStance === "sitting") {
    currentStance = "standing";
    buffs.isResting = false;
    console.log("[Stance] Принудительно встал");
  }
}

function toggleSit() {
  if (currentStance === "sitting") {
    standUp();
  } else {
    sitDown();
  }
}

function isSitting() {
  return currentStance === "sitting";
}

function canPerformAction() {
  if (currentStance === "sitting") {
    forceStandUp();
    console.log("[Combat] Встаём — действие отменено");
    return false;
  }
  return true;
}

// ----- ACTION METERS -----
function processActionMeters() {
  const heroSpeed = stats.atkSpd || 300;
  heroActionMeter += heroSpeed;

  if (heroActionMeter >= ACTION_THRESHOLD) {
    heroActionMeter -= ACTION_THRESHOLD;
    if (canPerformAction()) {
      if (typeof onHeroAutoAttack === "function") {
        onHeroAutoAttack();
      }
    }
  }

  const enemySpeed = (typeof currentEnemy !== "undefined" && currentEnemy?.atkSpd) || 200;
  enemyActionMeter += enemySpeed;

  if (enemyActionMeter >= ACTION_THRESHOLD) {
    enemyActionMeter -= ACTION_THRESHOLD;
    if (typeof onEnemyAutoAttack === "function") {
      onEnemyAutoAttack();
    }
  }
}

function resetActionMeters() {
  heroActionMeter = 0;
  enemyActionMeter = 0;
}

function processSkillCooldowns(deltaMs) {
  if (typeof skill1Cooldown !== "undefined" && skill1Cooldown > 0) {
    skill1Cooldown = Math.max(0, skill1Cooldown - deltaMs);
  }
  if (typeof skill2Cooldown !== "undefined" && skill2Cooldown > 0) {
    skill2Cooldown = Math.max(0, skill2Cooldown - deltaMs);
  }
}

// ----- СОБЫТИЯ -----
function onEnterCity() {
  exitCombat();
  resetActionMeters();
}

function onEnterLocation() {
  standUp();
  resetActionMeters();
}
