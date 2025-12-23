"use strict";

// ============================================================
//  ARENA COMBAT — логика PvP боя
// ============================================================

const arenaCombat = {
  player: null,
  enemy: null,

  playerDamageDealt: 0,
  enemyDamageDealt: 0,

  playerNextAttack: 0,
  enemyNextAttack: 0,

  timeLimit: 30000,  // 30 секунд
  timeLeft: 30000,
  isFinished: false,
  isPaused: false,

  events: [],  // Очередь событий для визуала

  // Инициализация боя
  init(playerStats, enemyStats) {
    this.player = {
      health: playerStats.maxHealth,
      maxHealth: playerStats.maxHealth,
      physicalPower: playerStats.physicalPower,
      physicalDefense: playerStats.physicalDefense,
      attackSpeed: playerStats.attackSpeed,
      critChance: playerStats.critChance,
      critMultiplier: playerStats.critMultiplier
    };

    this.enemy = {
      health: enemyStats.maxHealth,
      maxHealth: enemyStats.maxHealth,
      physicalPower: enemyStats.physicalPower,
      physicalDefense: enemyStats.physicalDefense,
      attackSpeed: enemyStats.attackSpeed,
      critChance: enemyStats.critChance,
      critMultiplier: enemyStats.critMultiplier
    };

    this.playerDamageDealt = 0;
    this.enemyDamageDealt = 0;
    this.timeLeft = this.timeLimit;
    this.isFinished = false;
    this.isPaused = false;
    this.events = [];

    // Первые атаки
    const now = Date.now();
    this.playerNextAttack = now + this.getAttackInterval(this.player.attackSpeed);
    this.enemyNextAttack = now + this.getAttackInterval(this.enemy.attackSpeed);

    console.log("[ArenaCombat] Init - Player:", this.player, "Enemy:", this.enemy);
  },

  getAttackInterval(attackSpeed) {
    return Math.floor(300000 / Math.max(100, attackSpeed));
  },

  // Вызывается каждый кадр
  update(delta) {
    if (this.isFinished || this.isPaused) return [];

    this.timeLeft -= delta;
    const events = [];
    const now = Date.now();

    // Player атакует
    if (now >= this.playerNextAttack) {
      const result = this.doAttack(this.player, this.enemy);
      this.playerDamageDealt += result.damage;
      this.playerNextAttack = now + this.getAttackInterval(this.player.attackSpeed);

      events.push({
        type: "attack",
        attacker: "player",
        damage: result.damage,
        isCrit: result.isCrit,
        targetHealth: this.enemy.health,
        targetMaxHealth: this.enemy.maxHealth
      });
    }

    // Enemy атакует
    if (now >= this.enemyNextAttack) {
      const result = this.doAttack(this.enemy, this.player);
      this.enemyDamageDealt += result.damage;
      this.enemyNextAttack = now + this.getAttackInterval(this.enemy.attackSpeed);

      events.push({
        type: "attack",
        attacker: "enemy",
        damage: result.damage,
        isCrit: result.isCrit,
        targetHealth: this.player.health,
        targetMaxHealth: this.player.maxHealth
      });
    }

    // Проверка конца боя
    if (this.player.health <= 0 || this.enemy.health <= 0 || this.timeLeft <= 0) {
      this.isFinished = true;
      events.push({ type: "end", result: this.getResult() });
    }

    return events;
  },

  doAttack(attacker, defender) {
    const power = attacker.physicalPower;
    const defense = defender.physicalDefense;

    // Base damage ±20%
    const variance = 0.2;
    const rawDamage = power * (1 + (Math.random() * variance * 2 - variance));

    // Defense reduction
    const defReduction = defense / (defense + 100);
    let damage = Math.floor(rawDamage * (1 - defReduction * 0.5));

    // Crit
    const isCrit = Math.random() < attacker.critChance;
    if (isCrit) {
      damage = Math.floor(damage * attacker.critMultiplier);
    }

    damage = Math.max(1, damage);
    defender.health = Math.max(0, defender.health - damage);

    return { damage, isCrit };
  },

  getResult() {
    let winner = "draw";

    if (this.enemy.health <= 0) {
      winner = "player";
    } else if (this.player.health <= 0) {
      winner = "enemy";
    } else if (this.timeLeft <= 0) {
      // Время вышло — кто больше урона
      winner = this.playerDamageDealt > this.enemyDamageDealt ? "player" :
               this.playerDamageDealt < this.enemyDamageDealt ? "enemy" : "draw";
    }

    return {
      winner,
      playerDamageDealt: this.playerDamageDealt,
      enemyDamageDealt: this.enemyDamageDealt,
      playerHealthLeft: Math.max(0, this.player.health),
      enemyHealthLeft: Math.max(0, this.enemy.health),
      timeLeft: Math.max(0, this.timeLeft)
    };
  },

  // Получить состояние для UI
  getState() {
    return {
      playerHealth: this.player?.health || 0,
      playerMaxHealth: this.player?.maxHealth || 1,
      enemyHealth: this.enemy?.health || 0,
      enemyMaxHealth: this.enemy?.maxHealth || 1,
      timeLeft: this.timeLeft,
      isFinished: this.isFinished
    };
  }
};

console.log("[ArenaCombat] Module loaded");
