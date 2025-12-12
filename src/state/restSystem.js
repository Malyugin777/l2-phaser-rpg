"use strict";

// ============================================================
//  REST & SHOTS SYSTEM — Отдых и Soulshots/Spiritshots
// ============================================================

// UI элементы (ОТКЛЮЧЕНЫ — используется uiLayout.js)
let restButton = null, restButtonText = null;
let shotsButton = null, shotsButtonText = null;

// Создание UI (ОТКЛЮЧЕНО — кнопки в uiLayout.js)
function createRestAndShotsUI(scene) {
  // НЕ СОЗДАЁМ — UI теперь в uiLayout.js
  console.log("[RestSystem] UI creation disabled, using uiLayout.js");
}

// Показать/скрыть кнопки в локации (ОТКЛЮЧЕНО)
function showRestAndShotsUI() {
  // НЕ ПОКАЗЫВАЕМ старые кнопки
}

function hideRestAndShotsUI() {
  // НЕ СКРЫВАЕМ — кнопок нет
}

// ============================================================
//  ОТДЫХ (Сесть)
// ============================================================

function toggleRest(scene) {
  // Используем новую систему stance из tickSystem
  if (typeof toggleSit === "function") {
    toggleSit();
    updateRestButtonUI();

    if (buffs.isResting) {
      spawnRestText(scene, true);
    } else {
      spawnRestText(scene, false);
    }
  } else {
    // Fallback на старую логику
    buffs.isResting = !buffs.isResting;
    updateRestButtonUI();

    if (buffs.isResting) {
      spawnRestText(scene, true);
    } else {
      spawnRestText(scene, false);
    }
  }
}

function startRest() {
  // Используем новую систему stance
  if (typeof sitDown === "function") {
    sitDown();
  } else {
    buffs.isResting = true;
  }
  updateRestButtonUI();
}

function stopRest() {
  // Используем новую систему stance
  if (typeof standUp === "function") {
    standUp();
  } else {
    buffs.isResting = false;
  }
  updateRestButtonUI();
}

function updateRestButtonUI() {
  // Старые кнопки отключены — обновляем через uiLayout
  if (typeof updateSitButton === "function") {
    updateSitButton(buffs.isResting);
  }
}

function spawnRestText(scene, isStarting) {
  if (!hero) return;
  
  const msg = isStarting ? "Отдых... (реген x5)" : "Встал!";
  const color = isStarting ? "#88ff88" : "#ffffff";
  
  const text = scene.add
    .text(hero.x, hero.y - 60, msg, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: color,
      stroke: "#000000",
      strokeThickness: 3,
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

// ============================================================
//  SOULSHOTS / SPIRITSHOTS
// ============================================================

function toggleShots(scene) {
  const arch = profile.archetype;
  
  if (arch === "fighter") {
    buffs.soulshotsOn = !buffs.soulshotsOn;
    buffs.spiritshotsOn = false;
  } else if (arch === "mystic") {
    buffs.spiritshotsOn = !buffs.spiritshotsOn;
    buffs.soulshotsOn = false;
  }
  
  updateShotsButtonUI();
  spawnShotsText(scene);
}

function updateShotsButtonUI() {
  // Старые кнопки отключены — обновляем через uiLayout
  const arch = profile.archetype;
  const isOn = (arch === "fighter" && buffs.soulshotsOn) || 
               (arch === "mystic" && buffs.spiritshotsOn);
  
  if (typeof updateShotsButton === "function") {
    updateShotsButton(isOn);
  }
}

function spawnShotsText(scene) {
  if (!hero) return;
  
  const arch = profile.archetype;
  const isOn = (arch === "fighter" && buffs.soulshotsOn) || 
               (arch === "mystic" && buffs.spiritshotsOn);
  const shotName = arch === "fighter" ? "Soulshots" : "Spiritshots";
  
  const msg = isOn ? shotName + " ON!" : shotName + " OFF";
  const color = isOn ? "#ffdd00" : "#888888";
  
  const text = scene.add
    .text(hero.x, hero.y - 90, msg, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: color,
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

// Проверка и расход эфира для shots
function useShotIfEnabled() {
  const arch = profile.archetype;
  
  if (arch === "fighter" && buffs.soulshotsOn && wallet.ether > 0) {
    wallet.ether -= 1;
    return { used: true, type: "soulshot", multiplier: 2.0 };
  }
  
  if (arch === "mystic" && buffs.spiritshotsOn && wallet.ether > 0) {
    wallet.ether -= 1;
    return { used: true, type: "spiritshot", multiplier: 1.5 };
  }
  
  return { used: false, type: null, multiplier: 1.0 };
}