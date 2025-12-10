"use strict";

// ----- Арена: расчёт урона и бой -----

function arenaCalcDamage(attacker, defender) {
  let base = Phaser.Math.Between(attacker.minAttack, attacker.maxAttack);
  const isCrit = Math.random() < (attacker.critChance || 0);
  if (isCrit) base = Math.round(base * (attacker.critMultiplier || 1.5));
  if (base < 1) base = 1;
  return { damage: base, isCrit };
}

function runArenaBattle(scene) {
  const baseHp = heroStats.maxHp;
  const effMinAtk = getEffectiveMinAttack();
  const effMaxAtk = getEffectiveMaxAttack();
  const effCrit = getEffectiveCritChance();
  const baseCritMult = heroStats.critMultiplier;

  const shadowHpMul = Phaser.Math.FloatBetween(0.9, 1.1);
  const shadowAtkMul = Phaser.Math.FloatBetween(0.9, 1.1);

  const heroA = {
    hp: baseHp,
    maxHp: baseHp,
    minAttack: effMinAtk,
    maxAttack: effMaxAtk,
    critChance: effCrit,
    critMultiplier: baseCritMult,
  };
  const shadowA = {
    hp: Math.round(baseHp * shadowHpMul),
    maxHp: Math.round(baseHp * shadowHpMul),
    minAttack: Math.round(effMinAtk * shadowAtkMul),
    maxAttack: Math.round(effMaxAtk * shadowAtkMul),
    critChance: effCrit,
    critMultiplier: baseCritMult,
  };

  let rounds = 0;
  const maxRounds = 30;

  while (heroA.hp > 0 && shadowA.hp > 0 && rounds < maxRounds) {
    rounds++;

    const heroHit = arenaCalcDamage(heroA, shadowA);
    shadowA.hp -= heroHit.damage;
    if (shadowA.hp < 0) shadowA.hp = 0;
    if (shadowA.hp <= 0) break;

    const shadowHit = arenaCalcDamage(shadowA, heroA);
    heroA.hp -= shadowHit.damage;
    if (heroA.hp < 0) heroA.hp = 0;
  }

  let result;
  if (heroA.hp > 0 && shadowA.hp <= 0) result = "win";
  else if (shadowA.hp > 0 && heroA.hp <= 0) result = "lose";
  else result = "draw";

  const loc = getCurrentLocation();
  let rewardGold = 0;
  let rewardExp = 0;
  let ratingDelta = 0;

  if (result === "win") {
    rewardGold = loc.goldReward * 2;
    rewardExp = loc.expReward * 2;
    ratingDelta = 10;
  } else if (result === "lose") {
    rewardGold = Math.floor(loc.goldReward * 0.5);
    rewardExp = 0;
    ratingDelta = -5;
  } else {
    rewardGold = loc.goldReward;
    rewardExp = Math.floor(loc.expReward * 0.5);
    ratingDelta = 0;
  }

  heroGold += rewardGold;
  if (rewardExp > 0) gainExp(rewardExp, scene);
  heroArenaRating += ratingDelta;

  checkQuestCompletion(scene);
  updateHeroUI();
  saveGame();

  let resultText;
  if (result === "win") resultText = "Победа";
  else if (result === "lose") resultText = "Поражение";
  else resultText = "Ничья";

  const shadowPowerText =
    shadowHpMul > 1.05
      ? "Тень была сильнее тебя."
      : shadowHpMul < 0.95
      ? "Тень была слабее тебя."
      : "Тень была примерно равна тебе.";

  const lines = [
    "АРЕНА: бой завершён за " + rounds + " ходов.",
    "",
    "Результат: " + resultText,
    "",
    "Твои HP: " + heroA.hp + " / " + heroA.maxHp,
    "HP Тени: " + shadowA.hp + " / " + shadowA.maxHp,
    "",
    "Награда:",
    "  +" +
      rewardGold +
      " адены" +
      (rewardExp > 0 ? ", +" + rewardExp + " EXP" : ""),
    "  Рейтинг: " +
      (ratingDelta > 0 ? "+" + ratingDelta : ratingDelta.toString()),
    "  Текущий рейтинг: " + heroArenaRating,
    "",
    shadowPowerText,
    "",
    "Можешь запускать бой сколько угодно раз.",
  ];

  arenaText.setText(lines.join("\n"));
}
