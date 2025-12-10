"use strict";

/**
 * Сколько SP даём за EXP.
 * По GDD: 10% от EXP.
 *
 * Пример:
 *  - Моб дал 50 EXP → 5 SP.
 *  - Моб дал 7 EXP → floor(0.7) = 0 SP (ок, мелочь).
 */
const SP_FROM_EXP_RATE = 0.1;

(function setupSpSystem() {
  // Проверяем, что база уже есть
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

  /**
   * Переопределяем gainExp:
   * 1) Считаем SP.
   * 2) Потом вызываем оригинальную логику.
   */
  window.gainExp = function (amount, scene) {
    // Подстраховка: вдруг sp ещё не было
    if (typeof heroStats.sp !== "number") {
      heroStats.sp = 0;
    }

    const spGain = Math.floor(amount * SP_FROM_EXP_RATE);

    if (spGain > 0) {
      heroStats.sp += spGain;

      // TODO: позже сделаем красивый текст типа "+5 SP"
      // Сейчас просто копим в стейте.
      // Можно дебажить через console.log:
      // console.log(`[SP] +${spGain} SP (всего: ${heroStats.sp})`);
    }

    // Вызов оригинальной функции
    return originalGainExp(amount, scene);
  };

  console.log("[SP System] SP-хук включён. 10% EXP → SP.");
})();
