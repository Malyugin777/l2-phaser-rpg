"use strict";

// ====== ЭКОНОМИКА И КВЕСТЫ: КУЗНИЦА / МАГАЗИН / ТЕЛЕПОРТ / КВЕСТЫ ======

// ----- КУЗНИЦА: шанс заточки -----
function getEnchantChance(enchant) {
  if (enchant < 3) return 0.8;
  if (enchant < 6) return 0.5;
  if (enchant < 10) return 0.3;
  return 0.1;
}

// ----- Кузница: всплывающий текст результата -----
function spawnForgeResultText(scene, text, success, isInfo) {
  const style = {
    fontFamily: "Arial",
    fontSize: "22px",
    color: success ? "#66ff66" : isInfo ? "#ffffff" : "#ff5555",
    stroke: "#000000",
    strokeThickness: 3,
  };
  const x = scene.scale.width / 2;
  const y = scene.scale.height / 2;
  const t = scene.add.text(x, y, text, style).setOrigin(0.5);
  scene.tweens.add({
    targets: t,
    y: y - 40,
    alpha: 0,
    duration: 1200,
    ease: "Power1",
    onComplete: () => t.destroy(),
  });
}

// ----- Кузница: заточка предмета -----
function performEnchant(scene) {
  if (mode !== "city") {
    spawnForgeResultText(scene, "Точить можно только в городе", false, true);
    return;
  }
  if (inventory.length === 0) {
    spawnForgeResultText(scene, "Нет предметов для заточки", false, true);
    return;
  }

  const idx = Math.floor(Math.random() * inventory.length);
  const originalName = inventory[idx];
  const parsed = parseItemName(originalName);
  const chance = getEnchantChance(parsed.enchant);
  const roll = Math.random();

  if (roll <= chance) {
    const newEnchant = parsed.enchant + 1;
    const newName = buildItemName(
      parsed.baseName,
      parsed.locationTag,
      newEnchant
    );
    inventory[idx] = newName;
    spawnForgeResultText(scene, "Успех: " + newName, true, false);
  } else {
    inventory.splice(idx, 1);
    
    // Кристаллизация D-grade предметов (с локации Orc Barracks)
    const isDGrade = parsed.locationTag && parsed.locationTag.includes("Orc");
    if (isDGrade) {
      const crystalsGain = 5 + parsed.enchant * 2; // 5-15 кристаллов
      wallet.crystals += crystalsGain;
      spawnForgeResultText(
        scene,
        "Сломан: " + originalName + " → +" + crystalsGain + " кристаллов",
        false,
        false
      );
    } else {
      spawnForgeResultText(
        scene,
        "Провал: " + originalName + " сломан",
        false,
        false
      );
    }
  }

  updateInventoryPanel();
  saveGame();
}

// ----- Магазин: стартовый набор -----
function buyStarterPack(scene) {
  const price = 50;
  if (wallet.gold < price) {
    spawnForgeResultText(scene, "Недостаточно адены для покупки", false, true);
    return;
  }
  wallet.gold -= price;
  consumables.hpPotions += 2;
  consumables.mpPotions += 2;
  wallet.ether += 5;

  spawnForgeResultText(scene, "Набор новичка куплен", true, true);
  updateHeroUI();
  updateShopPanel();
  saveGame();
}

// ----- Карта мира: телепорт -----
function teleportToCurrentLocation(scene) {
  const loc = getCurrentLocation();
  const cost = loc.teleportCost || 0;
  if (wallet.gold < cost) {
    spawnForgeResultText(scene, "Недостаточно адены (" + cost + ")", false, true);
    return;
  }
  wallet.gold -= cost;
  hideMapPanel();
  updateHeroUI();
  saveGame();
  spawnForgeResultText(scene, "Телепорт в " + loc.name + " (-" + cost + " адены)", true, true);
  enterLocation(scene);
}

// ----- Квесты: проверка выполнения -----
function checkQuestCompletion(scene) {
  const killQuestTarget = 20;
  const goldQuestTarget = 100;
  const eliteQuestTarget = 5;
  let changed = false;

  if (!quests.killQuestDone && progress.kills >= killQuestTarget) {
    quests.killQuestDone = true;
    const rewardGold = 100;
    const rewardEther = 10;
    const rewardHp = 3;
    const rewardMp = 3;

    wallet.gold += rewardGold;
    wallet.ether += rewardEther;
    consumables.hpPotions += rewardHp;
    consumables.mpPotions += rewardMp;

    showQuestRewardPopup(scene, "Квест выполнен: Охота в Глудио", [
      "Награда:",
      " +" + rewardGold + " адены",
      " +" + rewardEther + " Эфира",
      " +" + rewardHp + " HP банок",
      " +" + rewardMp + " MP банок",
    ]);

    changed = true;
  }

  if (!quests.goldQuestDone && wallet.gold >= goldQuestTarget) {
    quests.goldQuestDone = true;
    const rewardGold = 50;
    const rewardEther = 5;
    wallet.gold += rewardGold;
    wallet.ether += rewardEther;

    showQuestRewardPopup(scene, "Квест выполнен: Поднять капитал", [
      "Награда:",
      " +" + rewardGold + " адены",
      " +" + rewardEther + " Эфира",
    ]);

    changed = true;
  }

  if (!quests.eliteQuestDone && progress.eliteKills >= eliteQuestTarget) {
    quests.eliteQuestDone = true;
    const rewardGold = 150;
    const rewardEther = 15;
    const rewardHp = 3;
    const rewardMp = 3;

    wallet.gold += rewardGold;
    wallet.ether += rewardEther;
    consumables.hpPotions += rewardHp;
    consumables.mpPotions += rewardMp;

    showQuestRewardPopup(scene, "Квест выполнен: Элитный охотник", [
      "Награда:",
      " +" + rewardGold + " адены",
      " +" + rewardEther + " Эфира",
      " +" + rewardHp + " HP банок",
      " +" + rewardMp + " MP банок",
    ]);

    changed = true;
  }

  if (changed) {
    updateHeroUI();
    saveGame();
  }
}