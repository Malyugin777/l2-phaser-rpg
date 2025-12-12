"use strict";

// ============================================================
//  PET SYSTEM — Питомец-волк
// ============================================================

let petSprite = null;
let petAttackEvent = null;

// Квест на волка
const WOLF_QUEST = {
  item: "Wolf Fang",
  required: 5,
  reward: "Wolf Pet"
};

// Подсчёт Wolf Fang в инвентаре
function countWolfFangs() {
  return inventory.filter(item => item.includes("Wolf Fang")).length;
}

// Проверка выполнения квеста
function canCompleteWolfQuest() {
  return countWolfFangs() >= WOLF_QUEST.required && !pet.obtained;
}

// Завершить квест и получить волка
function completeWolfQuest(scene) {
  if (!canCompleteWolfQuest()) return false;
  
  // Убираем клыки из инвентаря
  let removed = 0;
  inventory = inventory.filter(item => {
    if (item.includes("Wolf Fang") && removed < WOLF_QUEST.required) {
      removed++;
      return false;
    }
    return true;
  });
  
  // Получаем волка
  pet.obtained = true;
  pet.active = true;
  pet.name = "Grey Wolf";
  pet.level = 1;
  pet.minAttack = 5;
  pet.maxAttack = 12;
  
  spawnPetObtainedText(scene);
  saveGame();
  return true;
}

function spawnPetObtainedText(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  
  const text = scene.add
    .text(w / 2, h / 2, "🐺 Волк теперь с тобой!", {
      fontFamily: "Arial",
      fontSize: "32px",
      color: "#ffdd00",
      stroke: "#000000",
      strokeThickness: 5,
    })
    .setOrigin(0.5);
  text.setDepth(50);

  scene.tweens.add({
    targets: text,
    y: text.y - 50,
    alpha: 0,
    duration: 2500,
    onComplete: () => text.destroy(),
  });
}

// Создать спрайт волка
function createPetSprite(scene) {
  if (!pet.obtained) return;
  
  petSprite = scene.add.rectangle(0, 0, 30, 25, 0x888888);
  petSprite.setDepth(3);
  petSprite.setVisible(false);
}

// Показать волка в локации
function showPetInLocation() {
  if (!pet.obtained || !pet.active) return;
  if (!petSprite || !hero) return;
  
  petSprite.setVisible(true);
  petSprite.x = hero.x - 60;
  petSprite.y = hero.y + 20;
}

function hidePet() {
  if (petSprite) petSprite.setVisible(false);
  stopPetAttack();
}

// Атака питомца
function startPetAttack(scene) {
  if (!pet.obtained || !pet.active) return;
  
  stopPetAttack();
  
  petAttackEvent = scene.time.addEvent({
    delay: 2000,
    loop: true,
    callback: () => {
      if (mode !== "location") return;
      if (!enemyAlive) return;
      if (stats.hp <= 0) return;
      if (buffs.isResting) return;
      petAttackEnemy(scene);
    }
  });
}

function stopPetAttack() {
  if (petAttackEvent) {
    petAttackEvent.remove(false);
    petAttackEvent = null;
  }
}

function petAttackEnemy(scene) {
  if (!pet.active || !enemyAlive) return;
  
  const damage = Phaser.Math.Between(pet.minAttack, pet.maxAttack);
  enemyStats.hp -= damage;
  if (enemyStats.hp < 0) enemyStats.hp = 0;
  
  if (petSprite) {
    scene.tweens.add({
      targets: petSprite,
      x: petSprite.x + 20,
      duration: 100,
      yoyo: true,
    });
  }
  
  spawnPetDamageText(scene, damage);
  updateEnemyHpText();
  
  if (enemyStats.hp <= 0) {
    killEnemy(scene);
  }
}

function spawnPetDamageText(scene, value) {
  if (!enemy) return;
  const text = scene.add
    .text(enemy.x + 30, enemy.y - 60, "-" + value, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#aaaaaa",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: text,
    y: text.y - 30,
    alpha: 0,
    duration: 500,
    onComplete: () => text.destroy(),
  });
}

// Переключить активность питомца
function togglePet() {
  if (!pet.obtained) return;
  pet.active = !pet.active;
  saveGame();
}