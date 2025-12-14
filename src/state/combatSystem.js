"use strict";

// ================== БОЙ (PVE) ==================

function calculateDamage(attacker, defender) {
  let minA = attacker.minAttack;
  let maxA = attacker.maxAttack;
  let critChance = attacker.critChance || 0;
  let critMult = attacker.critMultiplier || 1.5;

  if (attacker === stats) {
    minA = getEffectiveMinAttack();
    maxA = getEffectiveMaxAttack();
    critChance = getEffectiveCritChance();
    critMult = stats.critMultiplier || critMult;
  }

  let base = Phaser.Math.Between(minA, maxA);
  if (attacker === stats && isOverdriveActive) base = Math.round(base * 2);

  if (attacker === stats) {
    let buffMul = 1;
    if (buffs.pAtkActive) buffMul *= 1.3;
    if (buffs.mAtkActive) buffMul *= 1.3;
    base = Math.round(base * buffMul);
  }

  const isCrit = Math.random() < critChance;
  let damage = base;
  if (isCrit) damage = Math.round(damage * critMult);

  if (defender.defense) damage -= defender.defense;
  if (damage < 1) damage = 1;

  return { damage, isCrit };
}

function spawnDamageText(scene, value, isCrit) {
  if (!enemy) return;
  const style = {
    fontFamily: "Arial",
    fontSize: isCrit ? "40px" : "28px",
    color: isCrit ? "#ffdd00" : "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
  };
  const text = scene.add
    .text(enemy.x, enemy.y - 80, "-" + value, style)
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 40,
    alpha: 0,
    duration: 600,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

function spawnHeroDamageText(scene, value, isCrit) {
  if (!hero) return;
  const style = {
    fontFamily: "Arial",
    fontSize: isCrit ? "36px" : "24px",
    color: isCrit ? "#ff5555" : "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
  };
  const text = scene.add
    .text(hero.x, hero.y - 80, "-" + value, style)
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 40,
    alpha: 0,
    duration: 600,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

function spawnEtherGainText(scene, amount) {
  if (!hero) return;
  const text = scene.add
    .text(hero.x, hero.y + 50, "+" + amount + " Эфир", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#7fffd4",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y + 30,
    alpha: 0,
    duration: 800,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

function spawnEliteKillText(scene, bonusGold, bonusEther) {
  if (!hero) return;
  const mob = getCurrentMob();
  const mobName = mob ? mob.name : "ЭЛИТНЫЙ МОБ";
  const lines = [
    mobName + " УБИТ!",
    "+ " + bonusGold + " адены",
    "+ " + bonusEther + " Эфира",
  ];
  const text = scene.add
    .text(hero.x, hero.y - 130, lines.join("\n"), {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ff00ff",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center",
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 20,
    alpha: 0,
    duration: 1200,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

// Текст SP за убийство
function spawnSpGainText(scene, amount) {
  if (!hero) return;
  const text = scene.add
    .text(hero.x + 60, hero.y - 50, "+" + amount + " SP", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#aaffff",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 30,
    alpha: 0,
    duration: 800,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

// Текст "нельзя атаковать" при отдыхе
function spawnCannotAttackText(scene) {
  if (!hero) return;
  const text = scene.add
    .text(hero.x, hero.y - 60, "Отдыхаю!", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ff8888",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 20,
    alpha: 0,
    duration: 600,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

function damageEnemy(scene, useEtherShot) {
  if (!enemy || !enemyAlive) return;

  // Нельзя атаковать сидя (встаёт и отменяет действие)
  if (typeof canPerformAction === "function" && !canPerformAction()) {
    spawnCannotAttackText(scene);
    return;
  }
  // Fallback: старая проверка
  if (buffs.isResting) {
    spawnCannotAttackText(scene);
    return;
  }

  // Проверяем shots (из restSystem.js)
  const shotResult = useShotIfEnabled();

  const result = calculateDamage(stats, enemyStats);
  let damage = result.damage;

  // Применяем множитель от shots
  if (shotResult.used) {
    damage = Math.round(damage * shotResult.multiplier);
  }

  // Spine анимация атаки (крит = jump → attack)
  if (result.isCrit && typeof heroCriticalHit === "function") {
    heroCriticalHit();
  } else if (typeof heroAttack === "function") {
    heroAttack();
  }

  enemyStats.hp -= damage;
  if (enemyStats.hp < 0) enemyStats.hp = 0;

  // Входим в бой
  if (typeof enterCombat === "function") enterCombat();

  scene.tweens.add({
    targets: enemy,
    alpha: 0.3,
    duration: 80,
    yoyo: true,
  });

  spawnDamageText(scene, damage, result.isCrit || shotResult.used);
  updateEnemyHpText();
  updateHeroUI();

  if (enemyStats.hp <= 0) {
    killEnemy(scene);
  }
}

function damageEnemyWithSkill(scene, multiplier, useEtherShot) {
  if (!enemy || !enemyAlive) return;

  // Нельзя атаковать сидя (встаёт и отменяет действие)
  if (typeof canPerformAction === "function" && !canPerformAction()) {
    spawnCannotAttackText(scene);
    return;
  }
  // Fallback: старая проверка
  if (buffs.isResting) {
    spawnCannotAttackText(scene);
    return;
  }

  // Spine анимация скилла (всегда крит анимация)
  if (typeof heroCriticalHit === "function") {
    heroCriticalHit();
  } else if (typeof heroAttack === "function") {
    heroAttack();
  }

  // Проверяем shots
  const shotResult = useShotIfEnabled();

  const result = calculateDamage(stats, enemyStats);
  let damage = Math.round(result.damage * multiplier);
  if (shotResult.used) damage = Math.round(damage * shotResult.multiplier);
  if (damage < 1) damage = 1;

  enemyStats.hp -= damage;
  if (enemyStats.hp < 0) enemyStats.hp = 0;

  // Входим в бой
  if (typeof enterCombat === "function") enterCombat();

  scene.tweens.add({
    targets: enemy,
    alpha: 0.3,
    duration: 80,
    yoyo: true,
  });

  spawnDamageText(scene, damage, true);
  updateEnemyHpText();
  updateHeroUI();

  if (enemyStats.hp <= 0) {
    killEnemy(scene);
  }
}

function enemyAttackHero(scene) {
  if (stats.hp <= 0) return;
  if (!hero) return;
  if (!enemyAlive) return; // Не атакуем если враг мёртв

  // Входим в бой и встаём (прерывает отдых)
  if (typeof enterCombat === "function") enterCombat();
  if (typeof forceStandUp === "function") forceStandUp();

  const result = calculateDamage(enemyStats, stats);
  const damage = result.damage;
  stats.hp -= damage;
  if (stats.hp < 0) stats.hp = 0;

  // Spine анимация получения урона героем
  if (typeof heroHit === "function") heroHit();

  scene.tweens.add({
    targets: hero,
    alpha: 0.3,
    duration: 80,
    yoyo: true,
  });

  spawnHeroDamageText(scene, damage, result.isCrit);
  updateHeroUI();

  if (stats.hp <= 0) onHeroDeath(scene);
}

function mercAttackEnemy(scene) {
  if (!mercenary.active) return;
  if (!merc) return;
  if (!enemyAlive) return;

  const result = calculateDamage(mercenary, enemyStats);
  let damage = result.damage;
  enemyStats.hp -= damage;
  if (enemyStats.hp < 0) enemyStats.hp = 0;

  // Входим в бой (наёмник атакует — герой тоже в бою)
  if (typeof enterCombat === "function") enterCombat();

  scene.tweens.add({
    targets: merc,
    alpha: 0.3,
    duration: 80,
    yoyo: true,
  });

  spawnDamageText(scene, damage, result.isCrit);
  updateEnemyHpText();
  updateHeroUI();

  if (enemyStats.hp <= 0) {
    killEnemy(scene);
  }
}

// ============================================================
//  УБИЙСТВО МОБА — НАГРАДЫ ИЗ currentMob
// ============================================================

function killEnemy(scene) {
  if (!enemy) return;
  if (!enemyAlive) return;

  enemyAlive = false;

  const mob = getCurrentMob();
  
  // Золото из моба (случайное в диапазоне)
  const goldReward = getMobGoldReward(mob);
  wallet.gold += goldReward;
  
  // EXP из моба
  const expReward = mob ? mob.exp : 20;
  
  // SP из моба (напрямую)
  const spReward = mob ? mob.sp : 2;
  if (spReward > 0) {
    stats.sp += spReward;
    spawnSpGainText(scene, spReward);
  }
  
  // Счётчик убийств
  progress.kills += 1;

  // Эфир за убийство (шанс)
  if (Math.random() < ETHER_KILL_DROP_CHANCE) {
    wallet.ether += 1;
    spawnEtherGainText(scene, 1);
  }

  // Элитный моб — дополнительные награды
  const isEliteMob = mob && mob.elite;
  if (isEliteMob || Math.random() < ELITE_KILL_CHANCE) {
    progress.eliteKills += 1;
    const bonusGold = Math.round(goldReward * 0.5);
    const bonusEther = 2;
    wallet.gold += bonusGold;
    wallet.ether += bonusEther;
    spawnEliteKillText(scene, bonusGold, bonusEther);
  }

  // Дроп с моба
  const dropResult = tryMobDrop(mob);
  if (dropResult) {
    const loc = getCurrentLocation();
    const lootName = dropResult.item + " [" + loc.name + "]";
    inventory.push(lootName);
    spawnLootText(scene, lootName, dropResult.questItem, dropResult.material);
  }

  // EXP (без дополнительного SP)
  gainExpDirect(expReward, scene);
  
  checkQuestCompletion(scene);

  // Прогресс данжа
  if (isDungeonRun) {
    dungeonKills++;
  }

  updateHeroUI();
  updateLocationLabel();

  scene.tweens.add({
    targets: enemy,
    alpha: 0,
    duration: 200,
    onComplete: () => {
      scene.time.delayedCall(
        1000,
        () => {
          if (isDungeonRun && dungeonKills >= DUNGEON_KILL_TARGET) {
            endDungeonRun(scene);
          } else {
            respawnEnemy(scene);
          }
        },
        [],
        scene
      );
    },
  });

  if (enemyHpText) {
    scene.tweens.add({
      targets: enemyHpText,
      alpha: 0,
      duration: 200,
    });
  }
}

// Респавн — выбираем нового моба
function respawnEnemy(scene) {
  if (!enemy) return;
  
  // Выбираем нового случайного моба
  const mob = selectRandomMob();
  applyMobToEnemy(mob);
  
  enemyAlive = true;
  enemy.alpha = 1;
  if (enemyHpText) enemyHpText.alpha = 1;
  updateEnemyHpText();
}

// ----- Смерть героя -----

function onHeroDeath(scene) {
  const penalty = Math.round(stats.expToNext * 0.1);
  stats.exp -= penalty;
  if (stats.exp < 0) stats.exp = 0;

  stats.hp = 0;
  updateHeroUI();

  // Spine анимация смерти героя
  if (typeof heroDeath === "function") heroDeath();

  disableAutoHunt();
  hideCamp();
  endOverdrive(scene);
  stopEnemyAttack();
  stopMercAttack();

  if (hero) {
    scene.tweens.add({
      targets: hero,
      alpha: 0,
      duration: 300,
    });
  }

  const w = scene.scale.width;
  const h = scene.scale.height;
  const panel = scene.add
    .rectangle(w / 2, h / 2, 420, 220, 0x000000, 0.85)
    .setStrokeStyle(2, 0xffffff);
  const text = scene.add
    .text(
      w / 2,
      h / 2,
      "Ты погиб.\nШтраф: -" +
        penalty +
        " EXP\nТебя возвращают в город.",
      {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffffff",
        align: "center",
      }
    )
    .setOrigin(0.5);

  panel.setDepth(40);
  text.setDepth(41);

  scene.time.delayedCall(
    1500,
    () => {
      panel.destroy();
      text.destroy();
      stats.hp = stats.maxHp;
      stats.mp = stats.maxMp;
      isDungeonRun = false;
      dungeonKills = 0;
      updateHeroUI();
      enterCity(scene);
      saveGame();
    },
    null,
    scene
  );
}

// ----- EXP / LEVEL -----

// Стандартная функция (используется spSystem.js для хука)
function gainExp(amount, scene) {
  stats.exp += amount;
  spawnExpText(scene, amount);

  while (stats.exp >= stats.expToNext) {
    stats.exp -= stats.expToNext;
    levelUp(scene);
  }

  updateHeroUI();
  saveGame();
}

// Прямое начисление EXP без хука SP (SP уже добавлен из моба)
function gainExpDirect(amount, scene) {
  stats.exp += amount;
  spawnExpText(scene, amount);

  while (stats.exp >= stats.expToNext) {
    stats.exp -= stats.expToNext;
    levelUp(scene);
  }

  updateHeroUI();
  saveGame();
}

function levelUp(scene) {
  stats.level += 1;
  stats.maxHp = Math.round(stats.maxHp * 1.1);
  stats.hp = stats.maxHp;
  stats.maxMp = Math.round(stats.maxMp * 1.1);
  stats.mp = stats.maxMp;
  stats.minAttack = Math.round(stats.minAttack * 1.1);
  stats.maxAttack = Math.round(stats.maxAttack * 1.1);
  stats.expToNext = Math.round(stats.expToNext * 1.2);

  updateMercStatsFromHero();
  spawnLevelUpText(scene);
}

function spawnExpText(scene, amount) {
  scene = scene || window.gameScene;
  if (!scene || !scene.add) {
    console.warn('[Combat] spawnExpText: no scene');
    return;
  }
  if (!hero) return;
  const text = scene.add
    .text(hero.x, hero.y - 70, "+" + amount + " EXP", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#66ff66",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 40,
    alpha: 0,
    duration: 800,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

function spawnLevelUpText(scene) {
  if (!hero) return;
  const text = scene.add
    .text(hero.x, hero.y - 110, "LEVEL UP!", {
      fontFamily: "Arial",
      fontSize: "32px",
      color: "#00ffff",
      stroke: "#000000",
      strokeThickness: 4,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 30,
    alpha: 0,
    duration: 1000,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

// ----- Лут -----

// Дроп с моба (новая система)
function spawnLootText(scene, lootName, isQuestItem, isMaterial) {
  if (!hero) return;
  
  let color = "#ffd700"; // обычный лут
  if (isQuestItem) color = "#ff69b4"; // квестовый
  if (isMaterial) color = "#87ceeb"; // материал
  
  const text = scene.add
    .text(hero.x, hero.y + 80, "+ " + lootName, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: color,
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y + 30,
    alpha: 0,
    duration: 1000,
    ease: "Power1",
    onComplete: () => text.destroy(),
  });
}

// Старая функция дропа (fallback)
function tryDropLoot() {
  const roll = Math.random();
  if (roll > LOOT_DROP_CHANCE) return null;
  const idx = Math.floor(Math.random() * LOOT_TABLE.length);
  const baseName = LOOT_TABLE[idx];
  const loc = getCurrentLocation();
  return baseName + " [" + loc.name + "]";
}