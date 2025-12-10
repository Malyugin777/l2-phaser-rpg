"use strict";

// ====== ПРОТИВНИК / ВРАГ: СОСТОЯНИЕ ======

// Спрайт врага и текст его HP (создаются в game.js:create)
let enemy = null;
let enemyHpText = null;

// Статы врага
let enemyStats = {
  maxHp: 60,
  hp: 60,
  defense: 2,
  minAttack: 5,
  maxAttack: 8,
  critChance: 0.1,
  critMultiplier: 1.5,
};

// Флаг, жив ли враг
let enemyAlive = true;

// ====== ХЕЛПЕРЫ HP ВРАГА ======

function getEnemyHpLabel() {
  // строка такая же, как была в старом варианте
  return "HP врага: " + enemyStats.hp + " / " + enemyStats.maxHp;
}

function updateEnemyHpText() {
  if (enemyHpText) {
    enemyHpText.setText(getEnemyHpLabel());
  }
}
