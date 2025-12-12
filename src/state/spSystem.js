"use strict";

/**
 * Сколько SP даём за EXP.
 * По GDD: 10% от EXP.
 */
const SP_FROM_EXP_RATE = 0.1;

(function setupSpSystem() {
  if (typeof window === "undefined") {
    console.warn("[SP System] Окно (window) недоступно, SP-система не активна.");
    return;
  }

  if (typeof window.gainExp !== "function") {
    console.warn(
      "[SP System] gainExp ещё не определён. Убедись, что spSystem.js подключён ПОСЛЕ combatSystem.js."
    );
    return;
  }

  const originalGainExp = window.gainExp;

  window.gainExp = function (amount, scene) {
    if (typeof stats.sp !== "number") {
      stats.sp = 0;
    }

    const spGain = Math.floor(amount * SP_FROM_EXP_RATE);

    if (spGain > 0) {
      stats.sp += spGain;
    }

    return originalGainExp(amount, scene);
  };

  console.log("[SP System] SP-хук включён. 10% EXP → SP.");
})();