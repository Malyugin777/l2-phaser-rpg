"use strict";

// ================== БОЙ (PVE) ==================

function calculateDamage(attacker, defender) {
  let minA = attacker.minAttack;
  let maxA = attacker.maxAttack;
  let critChance = attacker.critChance || 0;
  let critMult = attacker.critMultiplier || 1.5;

  if (attacker === heroStats) {
    minA = getEffectiveMinAttack();
    maxA = getEffectiveMaxAttack();
    critChance = getEffectiveCritChance();
    critMult = heroStats.critMultiplier || critMult;
  }

  let base = Phaser.Math.Between(minA, maxA);
  if (attacker === heroStats && isOverdriveActive) base = Math.round(base * 2);

  if (attacker === heroStats) {
    let buffMul = 1;
    if (buffPActive) buffMul *= 1.3;
    if (buffMActive) buffMul *= 1.3;
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
  const lines = [
    "ЭЛИТНЫЙ МОБ УБИТ!",
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

function damageEnemy(scene, useEtherShot) {
  if (!enemy || !enemyAlive) return;

  let etherUsed = false;
  if (useEtherShot && heroEther > 0) {
    heroEther -= 1;
    if (heroEther < 0) heroEther = 0;
    etherUsed = true;
  }

  const result = calculateDamage(heroStats, enemyStats);
  let damage = result.damage;
  if (etherUsed) damage = Math.round(damage * 1.7);

  enemyStats.hp -= damage;
  if (enemyStats.hp < 0) enemyStats.hp = 0;

  scene.tweens.add({
    targets: enemy,
    alpha: 0.3,
    duration: 80,
    yoyo: true,
  });

  spawnDamageText(scene, damage, result.isCrit || etherUsed);
  updateEnemyHpText();
  updateHeroUI();

  if (enemyStats.hp <= 0) {
    killEnemy(scene);
  }
}

function damageEnemyWithSkill(scene, multiplier, useEtherShot) {
  if (!enemy || !enemyAlive) return;

  let etherUsed = false;
  if (useEtherShot && heroEther > 0) {
    heroEther -= 1;
    if (heroEther < 0) heroEther = 0;
    etherUsed = true;
  }

  const result = calculateDamage(heroStats, enemyStats);
  let damage = Math.round(result.damage * multiplier);
  if (etherUsed) damage = Math.round(damage * 1.5);
  if (damage < 1) damage = 1;

  enemyStats.hp -= damage;
  if (enemyStats.hp < 0) enemyStats.hp = 0;

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
  if (heroStats.hp <= 0) return;
  if (!hero) return;

  const result = calculateDamage(enemyStats, heroStats);
  const damage = result.damage;
  heroStats.hp -= damage;
  if (heroStats.hp < 0) heroStats.hp = 0;

  scene.tweens.add({
    targets: hero,
    alpha: 0.3,
    duration: 80,
    yoyo: true,
  });

  spawnHeroDamageText(scene, damage, result.isCrit);
  updateHeroUI();

  if (heroStats.hp <= 0) onHeroDeath(scene);
}

function mercAttackEnemy(scene) {
  if (!mercActive) return;
  if (!merc) return;
  if (!enemyAlive) return;

  const result = calculateDamage(mercStats, enemyStats);
  let damage = result.damage;
  enemyStats.hp -= damage;
  if (enemyStats.hp < 0) enemyStats.hp = 0;

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

function killEnemy(scene) {
  if (!enemy) return;
  if (!enemyAlive) return;

  enemyAlive = false;

  const loc = getCurrentLocation();
  heroGold += loc.goldReward;
  heroKills += 1;

  // эфир за убийство
  if (Math.random() < ETHER_KILL_DROP_CHANCE) {
    heroEther += 1;
    spawnEtherGainText(scene, 1);
  }

  // шанс "элитного" убийства
  if (Math.random() < ELITE_KILL_CHANCE) {
    heroEliteKills += 1;
    const bonusGold = loc.goldReward;
    const bonusEther = 2;
    heroGold += bonusGold;
    heroEther += bonusEther;
    spawnEliteKillText(scene, bonusGold, bonusEther);
  }

  const lootName = tryDropLoot();
  if (lootName) {
    inventoryItems.push(lootName);
    spawnLootText(scene, lootName);
  }

  gainExp(loc.expReward, scene);
  checkQuestCompletion(scene);

  // прогресс данжа
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
            respawnEnemy();
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

function respawnEnemy() {
  if (!enemy) return;
  enemyStats.hp = enemyStats.maxHp;
  enemyAlive = true;
  enemy.alpha = 1;
  if (enemyHpText) enemyHpText.alpha = 1;
  updateEnemyHpText();
}

// ----- Смерть героя -----

function onHeroDeath(scene) {
  const penalty = Math.round(heroStats.expToNext * 0.1);
  heroStats.exp -= penalty;
  if (heroStats.exp < 0) heroStats.exp = 0;

  heroStats.hp = 0;
  updateHeroUI();

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
      heroStats.hp = heroStats.maxHp;
      heroStats.mp = heroStats.maxMp;
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

function gainExp(amount, scene) {
  heroStats.exp += amount;
  spawnExpText(scene, amount);

  while (heroStats.exp >= heroStats.expToNext) {
    heroStats.exp -= heroStats.expToNext;
    levelUp(scene);
  }

  updateHeroUI();
  saveGame();
}

function levelUp(scene) {
  heroStats.level += 1;
  heroStats.maxHp = Math.round(heroStats.maxHp * 1.1);
  heroStats.hp = heroStats.maxHp;
  heroStats.maxMp = Math.round(heroStats.maxMp * 1.1);
  heroStats.mp = heroStats.maxMp;
  heroStats.minAttack = Math.round(heroStats.minAttack * 1.1);
  heroStats.maxAttack = Math.round(heroStats.maxAttack * 1.1);
  heroStats.expToNext = Math.round(heroStats.expToNext * 1.2);

  updateMercStatsFromHero();
  spawnLevelUpText(scene);
}

function spawnExpText(scene, amount) {
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

function tryDropLoot() {
  const roll = Math.random();
  if (roll > LOOT_DROP_CHANCE) return null;
  const idx = Math.floor(Math.random() * lootTable.length);
  const baseName = lootTable[idx];
  const loc = getCurrentLocation();
  return baseName + " [" + loc.name + "]";
}

function spawnLootText(scene, lootName) {
  if (!hero) return;
  const text = scene.add
    .text(hero.x, hero.y + 80, "+ Лут: " + lootName, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffd700",
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
