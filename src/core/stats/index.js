"use strict";

// ============================================================
//  STATS SYSTEM — главный экспорт
// ============================================================

// Re-export all
// (В vanilla JS просто все файлы грузятся через <script>)

const StatsSystem = {
  // From attributes.js
  ATTRIBUTE_DEFAULTS: ATTRIBUTE_DEFAULTS,
  CLASS_BASE_ATTRIBUTES: CLASS_BASE_ATTRIBUTES,
  CLASS_TEMPLATES: CLASS_TEMPLATES,

  // From formulas.js
  calculateDerived: calculateDerived,
  getAttackInterval: getAttackInterval,
  calculateDamage: calculateDamage
};

window.StatsSystem = StatsSystem;

console.log("[StatsSystem] Module loaded");
