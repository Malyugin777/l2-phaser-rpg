"use strict";

// ===============================================
// RUNNER BATTLE SYSTEM — Side-scrolling auto-battler
// ===============================================

// --- Состояние раннера ---
const runnerState = {
  isRunning: false,
  isPaused: false,
  scrollSpeed: 3,           // скорость скролла фона
  heroX: 200,               // позиция героя (фиксирована)
  heroY: 400,               // позиция по Y
  groundY: 450,             // линия земли
  
  // Враги
  enemies: [],
  enemySpawnTimer: 0,
  enemySpawnInterval: 2000, // мс между спавнами
  
  // Бой
  inCombat: false,
  currentTarget: null,
  
  // Фон
  bgFarSpeed: 0.5,
  bgNearSpeed: 2,
};

// --- Инициализация раннера ---
function initRunnerBattle(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  
  // Фон - градиент (небо)
  runnerState.bgSky = scene.add.rectangle(w/2, h/3, w, h * 0.7, 0x87ceeb)
    .setDepth(0);
  
  // Горы (дальний план) - простые треугольники
  runnerState.bgFar = scene.add.graphics();
  runnerState.bgFar.fillStyle(0x6b8e23, 1);
  runnerState.bgFar.fillTriangle(0, h * 0.6, 200, h * 0.3, 400, h * 0.6);
  runnerState.bgFar.fillTriangle(300, h * 0.6, 500, h * 0.25, 700, h * 0.6);
  runnerState.bgFar.fillTriangle(600, h * 0.6, 850, h * 0.35, 1100, h * 0.6);
  runnerState.bgFar.fillTriangle(1000, h * 0.6, 1200, h * 0.3, 1400, h * 0.6);
  runnerState.bgFar.setDepth(1);
  runnerState.bgFarX = 0;
  
  // Земля (ближний план)
  runnerState.bgNear = scene.add.rectangle(w/2, h * 0.75, w, h * 0.5, 0x3d5c1f)
    .setDepth(2);
  
  // Дорога
  runnerState.road = scene.add.rectangle(w/2, runnerState.groundY + 20, w, 60, 0x8b7355)
    .setDepth(3);
  
  // Герой
  runnerState.hero = createRunnerHero(scene, runnerState.heroX, runnerState.heroY);
  
  // Контейнер для врагов
  runnerState.enemyGroup = scene.add.group();
  
  // UI элементы раннера
  createRunnerUI(scene);
  
  // Скрываем по умолчанию
  hideRunnerElements();
  
  console.log("Runner battle system initialized");
}

// --- Создание героя раннера ---
function createRunnerHero(scene, x, y) {
  const container = scene.add.container(x, y);
  
  // Временный спрайт (квадрат с деталями)
  const body = scene.add.graphics();
  
  // Тело
  body.fillStyle(0x3366cc, 1);
  body.fillRoundedRect(-25, -40, 50, 60, 8);
  
  // Голова
  body.fillStyle(0xffcc99, 1);
  body.fillCircle(0, -55, 20);
  
  // Глаза
  body.fillStyle(0x000000, 1);
  body.fillCircle(-7, -58, 3);
  body.fillCircle(7, -58, 3);
  
  // Ноги
  body.fillStyle(0x333333, 1);
  body.fillRoundedRect(-18, 20, 14, 30, 4);
  body.fillRoundedRect(4, 20, 14, 30, 4);
  
  // Меч
  body.fillStyle(0xcccccc, 1);
  body.fillRect(28, -50, 6, 50);
  body.fillStyle(0x8b4513, 1);
  body.fillRect(25, -5, 12, 15);
  
  container.add(body);
  container.setDepth(10);
  container.setSize(50, 100);
  
  // Состояние анимации
  container.animState = "idle";
  container.animFrame = 0;
  container.animTimer = 0;
  
  return container;
}

// --- Создание врага ---
function createRunnerEnemy(scene, x, y, type) {
  const container = scene.add.container(x, y);
  
  const colors = {
    orc: 0x4a7c23,
    skeleton: 0xcccccc,
    wolf: 0x666666,
    boss: 0x8b0000
  };
  
  const color = colors[type] || 0xff0000;
  
  const body = scene.add.graphics();
  
  // Тело врага
  body.fillStyle(color, 1);
  body.fillRoundedRect(-20, -35, 40, 50, 6);
  
  // Голова
  body.fillStyle(color, 1);
  body.fillCircle(0, -50, 18);
  
  // Глаза (красные для врагов)
  body.fillStyle(0xff0000, 1);
  body.fillCircle(-6, -52, 4);
  body.fillCircle(6, -52, 4);
  
  // Ноги
  body.fillStyle(0x222222, 1);
  body.fillRoundedRect(-15, 15, 12, 25, 3);
  body.fillRoundedRect(3, 15, 12, 25, 3);
  
  container.add(body);
  container.setDepth(9);
  container.setSize(40, 90);
  
  // HP бар над врагом
  const hpBg = scene.add.rectangle(0, -80, 50, 8, 0x333333).setOrigin(0.5);
  const hpFill = scene.add.rectangle(-25, -80, 50, 8, 0xcc3333).setOrigin(0, 0.5);
  container.add(hpBg);
  container.add(hpFill);
  container.hpFill = hpFill;
  
  // Имя
  const nameText = scene.add.text(0, -95, type.toUpperCase(), {
    fontSize: "12px",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 2
  }).setOrigin(0.5);
  container.add(nameText);
  
  // Данные врага
  container.enemyType = type;
  container.hp = 100;
  container.maxHp = 100;
  container.damage = 10;
  container.speed = 1.5;
  container.isAlive = true;
  container.inCombat = false;
  
  return container;
}

// --- Спавн врага ---
function spawnEnemy(scene) {
  const types = ["orc", "skeleton", "wolf"];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const x = scene.scale.width + 50;
  const y = runnerState.heroY;
  
  const enemy = createRunnerEnemy(scene, x, y, type);
  runnerState.enemies.push(enemy);
  runnerState.enemyGroup.add(enemy);
  
  return enemy;
}

// --- UI раннера ---
function createRunnerUI(scene) {
  const w = scene.scale.width;
  
  // Кнопка паузы
  runnerState.pauseBtn = scene.add.rectangle(w - 50, 50, 60, 40, 0x333333)
    .setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .setDepth(100);
  
  runnerState.pauseText = scene.add.text(w - 50, 50, "||", {
    fontSize: "20px",
    color: "#ffffff"
  }).setOrigin(0.5).setDepth(101);
  
  runnerState.pauseBtn.on("pointerdown", () => {
    toggleRunnerPause();
  });
  
  // Счётчик убийств (под HP баром)
  runnerState.killsText = scene.add.text(20, 90, "Kills: 0", {
    fontSize: "16px",
    color: "#ffff00",
    stroke: "#000000",
    strokeThickness: 3
  }).setDepth(100);
  
  // Дистанция
  runnerState.distanceText = scene.add.text(20, 115, "Distance: 0m", {
    fontSize: "16px",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 3
  }).setDepth(100);
  
  runnerState.kills = 0;
  runnerState.distance = 0;
}

// --- Главный update раннера ---
function updateRunnerBattle(scene, delta) {
  if (!runnerState.isRunning || runnerState.isPaused) return;
  
  // Скролл фонов (параллакс)
  if (runnerState.bgFar) {
    runnerState.bgFar.tilePositionX += runnerState.bgFarSpeed;
  }
  if (runnerState.bgNear) {
    runnerState.bgNear.tilePositionX += runnerState.bgNearSpeed;
  }
  
  // Дистанция
  runnerState.distance += runnerState.scrollSpeed * 0.1;
  if (runnerState.distanceText) {
    runnerState.distanceText.setText("Distance: " + Math.floor(runnerState.distance) + "m");
  }
  
  // Спавн врагов
  runnerState.enemySpawnTimer += delta;
  if (runnerState.enemySpawnTimer >= runnerState.enemySpawnInterval) {
    runnerState.enemySpawnTimer = 0;
    spawnEnemy(scene);
  }
  
  // Обновление врагов
  updateEnemies(scene, delta);
  
  // Анимация героя
  updateHeroAnimation(scene, delta);
  
  // Проверка боя
  checkCombat(scene);
}

// --- Обновление врагов ---
function updateEnemies(scene, delta) {
  for (let i = runnerState.enemies.length - 1; i >= 0; i--) {
    const enemy = runnerState.enemies[i];
    
    if (!enemy.isAlive) {
      // Удаляем мёртвого врага
      enemy.destroy();
      runnerState.enemies.splice(i, 1);
      continue;
    }
    
    // Движение врага влево (навстречу герою)
    if (!enemy.inCombat) {
      enemy.x -= enemy.speed + runnerState.scrollSpeed;
    }
    
    // Удаляем если ушёл за экран
    if (enemy.x < -100) {
      enemy.destroy();
      runnerState.enemies.splice(i, 1);
    }
  }
}

// --- Проверка столкновения для боя ---
function checkCombat(scene) {
  const hero = runnerState.hero;
  if (!hero) return;
  
  const heroHitbox = {
    x: hero.x - 25,
    y: hero.y - 50,
    width: 80,
    height: 100
  };
  
  for (const enemy of runnerState.enemies) {
    if (!enemy.isAlive || enemy.inCombat) continue;
    
    const enemyHitbox = {
      x: enemy.x - 20,
      y: enemy.y - 50,
      width: 40,
      height: 90
    };
    
    // Проверка пересечения
    if (heroHitbox.x < enemyHitbox.x + enemyHitbox.width &&
        heroHitbox.x + heroHitbox.width > enemyHitbox.x) {
      // Столкновение — начинаем бой
      enemy.inCombat = true;
      runnerState.inCombat = true;
      runnerState.currentTarget = enemy;
      
      // Останавливаем скролл во время боя
      runnerState.scrollSpeed = 0;
      
      startCombatSequence(scene, enemy);
      break;
    }
  }
}

// --- Боевая последовательность ---
function startCombatSequence(scene, enemy) {
  // Герой атакует
  attackEnemy(scene, enemy);
}

function attackEnemy(scene, enemy) {
  if (!enemy.isAlive) return;
  
  // Урон
  const damage = Math.floor(Math.random() * 20) + 15;
  enemy.hp -= damage;
  
  // Обновляем HP бар
  const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
  if (enemy.hpFill) {
    enemy.hpFill.setScale(hpRatio, 1);
  }
  
  // Текст урона
  showDamageText(scene, enemy.x, enemy.y - 60, damage);
  
  // Враг умер?
  if (enemy.hp <= 0) {
    killRunnerEnemy(scene, enemy);
  } else {
    // Враг атакует в ответ
    scene.time.delayedCall(500, () => {
      enemyAttack(scene, enemy);
    });
  }
}

function enemyAttack(scene, enemy) {
  if (!enemy.isAlive) return;
  if (stats.hp <= 0) return; // Герой уже мёртв
  
  // Урон герою
  const damage = enemy.damage;
  stats.hp -= damage;
  if (stats.hp < 0) stats.hp = 0; // Не уходим в минус!
  
  showDamageText(scene, runnerState.heroX, runnerState.heroY - 60, damage, true);
  
  // Обновляем UI
  if (typeof updateUIBars === "function") {
    updateUIBars();
  }
  
  // Герой умер?
  if (stats.hp <= 0) {
    heroDeathInRunner(scene);
    return;
  }
  
  // Продолжаем бой
  scene.time.delayedCall(500, () => {
    if (enemy.isAlive && stats.hp > 0) {
      attackEnemy(scene, enemy);
    }
  });
}

// Смерть героя в раннере
function heroDeathInRunner(scene) {
  runnerState.isRunning = false;
  
  // Показываем результат
  const w = scene.scale.width;
  const h = scene.scale.height;
  
  const resultBg = scene.add.rectangle(w/2, h/2, 300, 200, 0x000000, 0.8)
    .setDepth(100);
  const resultText = scene.add.text(w/2, h/2 - 30, 
    "ПОРАЖЕНИЕ!\n\nУбито: " + runnerState.kills + "\nДистанция: " + Math.floor(runnerState.distance) + "m", {
    fontSize: "20px",
    color: "#ff6666",
    align: "center"
  }).setOrigin(0.5).setDepth(101);
  
  const returnBtn = scene.add.rectangle(w/2, h/2 + 60, 150, 40, 0x444444)
    .setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .setDepth(101);
  const returnText = scene.add.text(w/2, h/2 + 60, "В город", {
    fontSize: "16px",
    color: "#ffffff"
  }).setOrigin(0.5).setDepth(102);
  
  returnBtn.on("pointerdown", () => {
    resultBg.destroy();
    resultText.destroy();
    returnBtn.destroy();
    returnText.destroy();
    
    // Восстанавливаем HP
    stats.hp = Math.floor(stats.maxHp * 0.3);
    exitRunnerMode(scene);
  });
}

function killRunnerEnemy(scene, enemy) {
  enemy.isAlive = false;
  runnerState.kills++;
  
  if (runnerState.killsText) {
    runnerState.killsText.setText("Kills: " + runnerState.kills);
  }
  
  // Эффект смерти
  scene.tweens.add({
    targets: enemy,
    alpha: 0,
    y: enemy.y + 20,
    duration: 300,
    onComplete: () => {
      // Возобновляем движение
      runnerState.inCombat = false;
      runnerState.currentTarget = null;
      runnerState.scrollSpeed = 3;
    }
  });
  
  // Награда
  const gold = Math.floor(Math.random() * 10) + 5;
  wallet.gold = (wallet.gold || 0) + gold;
  progress.kills++;
  
  showRewardText(scene, enemy.x, enemy.y, "+" + gold + " gold");
}

// --- Текст урона ---
function showDamageText(scene, x, y, damage, isHero = false) {
  const color = isHero ? "#ff0000" : "#ffff00";
  
  const text = scene.add.text(x, y, "-" + damage, {
    fontSize: "24px",
    color: color,
    stroke: "#000000",
    strokeThickness: 4,
    fontStyle: "bold"
  }).setOrigin(0.5).setDepth(50);
  
  scene.tweens.add({
    targets: text,
    y: y - 50,
    alpha: 0,
    duration: 800,
    ease: "Power2",
    onComplete: () => text.destroy()
  });
}

function showRewardText(scene, x, y, text) {
  const reward = scene.add.text(x, y - 30, text, {
    fontSize: "18px",
    color: "#00ff00",
    stroke: "#000000",
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(50);
  
  scene.tweens.add({
    targets: reward,
    y: y - 80,
    alpha: 0,
    duration: 1000,
    onComplete: () => reward.destroy()
  });
}

// --- Анимация героя ---
function updateHeroAnimation(scene, delta) {
  const hero = runnerState.hero;
  if (!hero) return;
  
  // Простая "дышащая" анимация
  hero.animTimer += delta;
  if (hero.animTimer > 500) {
    hero.animTimer = 0;
    hero.animFrame = (hero.animFrame + 1) % 2;
    
    // Лёгкое покачивание
    const offset = hero.animFrame === 0 ? 0 : -3;
    hero.y = runnerState.heroY + offset;
  }
}

// --- Управление ---
function toggleRunnerPause() {
  runnerState.isPaused = !runnerState.isPaused;
  if (runnerState.pauseText) {
    runnerState.pauseText.setText(runnerState.isPaused ? "▶" : "||");
  }
}

function startRunner(scene) {
  runnerState.isRunning = true;
  runnerState.isPaused = false;
  runnerState.scrollSpeed = 3;
  runnerState.kills = 0;
  runnerState.distance = 0;
}

function stopRunner() {
  runnerState.isRunning = false;
  runnerState.scrollSpeed = 0;
}

// --- Очистка ---
function cleanupRunner() {
  runnerState.enemies.forEach(e => e.destroy());
  runnerState.enemies = [];
  runnerState.isRunning = false;
}

// --- Показать/скрыть элементы раннера ---
function showRunnerElements() {
  if (runnerState.bgSky) runnerState.bgSky.setVisible(true);
  if (runnerState.bgFar) runnerState.bgFar.setVisible(true);
  if (runnerState.bgNear) runnerState.bgNear.setVisible(true);
  if (runnerState.road) runnerState.road.setVisible(true);
  if (runnerState.hero) runnerState.hero.setVisible(true);
  if (runnerState.pauseBtn) runnerState.pauseBtn.setVisible(true);
  if (runnerState.pauseText) runnerState.pauseText.setVisible(true);
  if (runnerState.killsText) runnerState.killsText.setVisible(true);
  if (runnerState.distanceText) runnerState.distanceText.setVisible(true);
}

function hideRunnerElements() {
  if (runnerState.bgSky) runnerState.bgSky.setVisible(false);
  if (runnerState.bgFar) runnerState.bgFar.setVisible(false);
  if (runnerState.bgNear) runnerState.bgNear.setVisible(false);
  if (runnerState.road) runnerState.road.setVisible(false);
  if (runnerState.hero) runnerState.hero.setVisible(false);
  if (runnerState.pauseBtn) runnerState.pauseBtn.setVisible(false);
  if (runnerState.pauseText) runnerState.pauseText.setVisible(false);
  if (runnerState.killsText) runnerState.killsText.setVisible(false);
  if (runnerState.distanceText) runnerState.distanceText.setVisible(false);
  
  runnerState.enemies.forEach(e => e.setVisible(false));
}

// --- Вход в режим раннера ---
function enterRunnerMode(scene) {
  mode = "runner";
  
  // Скрываем обычные элементы
  if (locationBg) locationBg.setVisible(false);
  if (hero) hero.setVisible(false);
  if (enemy) enemy.setVisible(false);
  if (cityHero) cityHero.setVisible(false);
  if (enemyHpText) enemyHpText.setVisible(false);
  if (merc) merc.setVisible(false);
  
  // Скрываем боевой UI (раннер сам управляет)
  if (typeof uiElements !== "undefined" && uiElements) {
    if (uiElements.attackBtn) uiElements.attackBtn.setVisible(false);
    if (uiElements.attackText) uiElements.attackText.setVisible(false);
    if (uiElements.skill1Btn) uiElements.skill1Btn.setVisible(false);
    if (uiElements.skill1Text) uiElements.skill1Text.setVisible(false);
    if (uiElements.skill2Btn) uiElements.skill2Btn.setVisible(false);
    if (uiElements.skill2Text) uiElements.skill2Text.setVisible(false);
    if (uiElements.shotsBtn) uiElements.shotsBtn.setVisible(false);
    if (uiElements.shotsText) uiElements.shotsText.setVisible(false);
    if (uiElements.autoBtn) uiElements.autoBtn.setVisible(false);
    if (uiElements.autoText) uiElements.autoText.setVisible(false);
    if (uiElements.sitButton) uiElements.sitButton.setVisible(false);
    if (uiElements.sitButtonText) uiElements.sitButtonText.setVisible(false);
    if (uiElements.hpPotionBtn) uiElements.hpPotionBtn.setVisible(false);
    if (uiElements.hpPotionText) uiElements.hpPotionText.setVisible(false);
    if (uiElements.mpPotionBtn) uiElements.mpPotionBtn.setVisible(false);
    if (uiElements.mpPotionText) uiElements.mpPotionText.setVisible(false);
    if (uiElements.cityBtn) uiElements.cityBtn.setVisible(false);
    if (uiElements.cityText) uiElements.cityText.setVisible(false);
    
    // Скрываем NPC кнопки
    if (uiElements.npcButtons) {
      uiElements.npcButtons.forEach(npc => {
        npc.btn.setVisible(false);
        if (npc.icon) npc.icon.setVisible(false);
        npc.txt.setVisible(false);
      });
    }
    
    // Скрываем название локации (раннер показывает своё)
    if (uiElements.locationLabel) uiElements.locationLabel.setVisible(false);
  }
  
  // Показываем раннер
  showRunnerElements();
  startRunner(scene);
}

// --- Выход из режима раннера ---
function exitRunnerMode(scene) {
  stopRunner();
  hideRunnerElements();
  cleanupRunner();
  
  // Возврат в город
  enterCity(scene);
}