"use strict";

// ============================================================
//  FORGE PANEL — UI Кузницы (MVP v2)
// ============================================================

// Переменные UI кузницы
let forgeContainer = null;
let forgeRefineContainer = null;
let forgeCraftContainer = null;
let forgeDismantleContainer = null;
let forgeTabButtons = [];
let currentForgeTab = "refine"; // "refine" | "craft" | "dismantle"

function getResourceName(id) {
  const names = {
    ore: "руды",
    coal: "угля",
    thread: "ниток",
    leather: "кожи",
    ironIngot: "слитков",
    cloth: "ткани",
    leatherSheet: "кожи выд.",
    enchantDust: "пыли"
  };
  return names[id] || id;
}

function createForgeUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  // Основной контейнер (скрыт по умолчанию)
  forgeContainer = scene.add.container(0, 0).setDepth(100).setVisible(false);

  // Затемнение фона
  const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8);
  overlay.setInteractive(); // блокирует клики
  forgeContainer.add(overlay);

  // Панель
  const panelW = 360;
  const panelH = 500;
  const panelX = w / 2;
  const panelY = h / 2;

  const panel = scene.add.rectangle(panelX, panelY, panelW, panelH, 0x1a1a2e, 0.95)
    .setStrokeStyle(2, 0xd4af37);
  forgeContainer.add(panel);

  // Заголовок
  const title = scene.add.text(panelX, panelY - panelH / 2 + 30, "КУЗНИЦА", {
    fontSize: "24px",
    color: "#d4af37",
    fontFamily: "Arial"
  }).setOrigin(0.5);
  forgeContainer.add(title);

  // Кнопка закрытия
  const closeBtn = scene.add.text(panelX + panelW / 2 - 25, panelY - panelH / 2 + 15, "X", {
    fontSize: "24px",
    color: "#ffffff"
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });
  closeBtn.on("pointerdown", () => hideForgePanel());
  forgeContainer.add(closeBtn);

  // Создаём табы
  createForgeTabs(scene, panelX, panelY, panelW, panelH);

  // Контейнеры для контента
  forgeRefineContainer = scene.add.container(0, 0);
  forgeCraftContainer = scene.add.container(0, 0);
  forgeDismantleContainer = scene.add.container(0, 0);

  forgeContainer.add(forgeRefineContainer);
  forgeContainer.add(forgeCraftContainer);
  forgeContainer.add(forgeDismantleContainer);

  // Показать контент по умолчанию
  rebuildForgeContent(scene);
}

function createForgeTabs(scene, panelX, panelY, panelW, panelH) {
  const tabY = panelY - panelH / 2 + 70;
  const tabConfigs = [
    { id: "refine", name: "Переплавка" },
    { id: "craft", name: "Крафт" },
    { id: "dismantle", name: "Разбор" }
  ];
  const tabWidth = 100;

  forgeTabButtons = [];

  tabConfigs.forEach((tab, i) => {
    const tabX = panelX - tabWidth + (i * tabWidth);
    const isActive = tab.id === currentForgeTab;

    const tabBg = scene.add.rectangle(tabX, tabY, tabWidth - 4, 30, isActive ? 0x3a3a5e : 0x2a2a4e)
      .setStrokeStyle(1, 0x4a4a6e)
      .setInteractive({ useHandCursor: true });

    const tabText = scene.add.text(tabX, tabY, tab.name, {
      fontSize: "12px",
      color: isActive ? "#d4af37" : "#888888"
    }).setOrigin(0.5);

    tabBg.on("pointerdown", () => {
      currentForgeTab = tab.id;
      updateTabStyles(scene);
      rebuildForgeContent(scene);
    });

    forgeContainer.add(tabBg);
    forgeContainer.add(tabText);

    forgeTabButtons.push({ bg: tabBg, text: tabText, id: tab.id });
  });
}

function updateTabStyles(scene) {
  forgeTabButtons.forEach(tab => {
    const isActive = tab.id === currentForgeTab;
    tab.bg.setFillStyle(isActive ? 0x3a3a5e : 0x2a2a4e);
    tab.text.setColor(isActive ? "#d4af37" : "#888888");
  });
}

function rebuildForgeContent(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const panelX = w / 2;
  const panelY = h / 2;
  const panelW = 360;
  const panelH = 500;

  // Очистить все контейнеры
  if (forgeRefineContainer) forgeRefineContainer.removeAll(true);
  if (forgeCraftContainer) forgeCraftContainer.removeAll(true);
  if (forgeDismantleContainer) forgeDismantleContainer.removeAll(true);

  // Показать нужный контент
  if (currentForgeTab === "refine") {
    createRefineContent(scene, panelX, panelY, panelW, panelH);
  } else if (currentForgeTab === "craft") {
    createCraftContent(scene, panelX, panelY, panelW, panelH);
  } else if (currentForgeTab === "dismantle") {
    createDismantleContent(scene, panelX, panelY, panelW, panelH);
  }
}

// ============================================================
//  ПЕРЕПЛАВКА
// ============================================================

function createRefineContent(scene, panelX, panelY, panelW, panelH) {
  const startY = panelY - panelH / 2 + 120;
  const recipes = getRefineRecipes();

  recipes.forEach((recipe, index) => {
    const y = startY + index * 110;

    // Фон карточки
    const cardBg = scene.add.rectangle(panelX, y + 35, panelW - 40, 100, 0x2a2a4e)
      .setStrokeStyle(1, 0x4a4a6e);
    forgeRefineContainer.add(cardBg);

    // Название
    const nameText = scene.add.text(panelX - panelW / 2 + 30, y, recipe.name, {
      fontSize: "16px",
      color: "#ffffff"
    });
    forgeRefineContainer.add(nameText);

    // Стоимость
    const costStr = Object.entries(recipe.cost)
      .map(([k, v]) => `${v} ${getResourceName(k)}`)
      .join(" + ");
    const costText = scene.add.text(panelX - panelW / 2 + 30, y + 25, costStr, {
      fontSize: "12px",
      color: "#aaaaaa"
    });
    forgeRefineContainer.add(costText);

    // Текущее количество ресурсов
    const haveStr = Object.entries(recipe.cost)
      .map(([k, v]) => `${getResourceCount(k)}/${v}`)
      .join(", ");
    const haveText = scene.add.text(panelX - panelW / 2 + 30, y + 45, "Есть: " + haveStr, {
      fontSize: "11px",
      color: "#888888"
    });
    forgeRefineContainer.add(haveText);

    // Кнопки x1, x5, x10, MAX
    const amounts = [1, 5, 10, "MAX"];
    const btnStartX = panelX + 40;

    amounts.forEach((amt, btnIdx) => {
      const btnX = btnStartX + btnIdx * 45;
      const btnY = y + 60;

      const canDo = amt === "MAX" ? canRefine(recipe.id, 1) : canRefine(recipe.id, amt);

      const btn = scene.add.rectangle(btnX, btnY, 40, 25, canDo ? 0x4a6a4a : 0x3a3a3a)
        .setStrokeStyle(1, canDo ? 0x6a8a6a : 0x5a5a5a)
        .setInteractive({ useHandCursor: canDo });

      const btnText = scene.add.text(btnX, btnY, amt === "MAX" ? "MAX" : "x" + amt, {
        fontSize: "11px",
        color: canDo ? "#ffffff" : "#666666"
      }).setOrigin(0.5);

      if (canDo) {
        btn.on("pointerdown", () => {
          const actualAmt = amt === "MAX" ? 999 : amt;
          const result = tryRefine(recipe.id, actualAmt);
          if (result.success) {
            // Lucky x2 сообщение
            if (result.hadLucky) {
              showForgeResult(scene, "LUCKY! +" + result.totalGained + " " + result.recipeName, true);
            } else {
              showForgeResult(scene, "+" + result.totalGained + " " + result.recipeName, false);
            }
            rebuildForgeContent(scene);
          }
        });
      }

      forgeRefineContainer.add(btn);
      forgeRefineContainer.add(btnText);
    });
  });
}

// ============================================================
//  КРАФТ
// ============================================================

function createCraftContent(scene, panelX, panelY, panelW, panelH) {
  const startY = panelY - panelH / 2 + 120;
  const recipes = getCraftRecipes();

  recipes.forEach((recipe, index) => {
    const y = startY + index * 120;

    // Фон карточки
    const cardBg = scene.add.rectangle(panelX, y + 40, panelW - 40, 110, 0x2a2a4e)
      .setStrokeStyle(1, 0x4a4a6e);
    forgeCraftContainer.add(cardBg);

    // Название
    const nameText = scene.add.text(panelX - panelW / 2 + 30, y,
      recipe.name + " [" + recipe.grade + "]", {
      fontSize: "16px",
      color: "#ffffff"
    });
    forgeCraftContainer.add(nameText);

    // Статы
    const statsStr = Object.entries(recipe.stats)
      .map(([k, v]) => k + ": +" + v)
      .join(", ");
    const statsText = scene.add.text(panelX - panelW / 2 + 30, y + 22, statsStr, {
      fontSize: "12px",
      color: "#4a8a4a"
    });
    forgeCraftContainer.add(statsText);

    // Стоимость
    const costStr = Object.entries(recipe.cost)
      .map(([k, v]) => v + " " + getResourceName(k))
      .join(", ");
    const costText = scene.add.text(panelX - panelW / 2 + 30, y + 44, costStr, {
      fontSize: "11px",
      color: "#aaaaaa"
    });
    forgeCraftContainer.add(costText);

    // Текущее количество ресурсов
    const haveStr = Object.entries(recipe.cost)
      .map(([k, v]) => `${getResourceCount(k)}/${v}`)
      .join(", ");
    const haveText = scene.add.text(panelX - panelW / 2 + 30, y + 62, "Есть: " + haveStr, {
      fontSize: "10px",
      color: "#888888"
    });
    forgeCraftContainer.add(haveText);

    // Кнопка Сковать
    const canDo = canCraft(recipe.id);
    const btnX = panelX + panelW / 2 - 70;
    const btnY = y + 75;

    const btn = scene.add.rectangle(btnX, btnY, 80, 30, canDo ? 0x4a6a4a : 0x3a3a3a)
      .setStrokeStyle(1, canDo ? 0x6a8a6a : 0x5a5a5a)
      .setInteractive({ useHandCursor: canDo });

    const btnText = scene.add.text(btnX, btnY, "Сковать", {
      fontSize: "12px",
      color: canDo ? "#ffffff" : "#666666"
    }).setOrigin(0.5);

    if (canDo) {
      btn.on("pointerdown", () => {
        const result = tryCraft(recipe.id);
        if (result.success) {
          showForgeResult(scene, "Создано: " + result.item.name, false);
          rebuildForgeContent(scene);
        }
      });
    }

    forgeCraftContainer.add(btn);
    forgeCraftContainer.add(btnText);
  });
}

// ============================================================
//  РАЗБОР
// ============================================================

function createDismantleContent(scene, panelX, panelY, panelW, panelH) {
  const startY = panelY - panelH / 2 + 120;
  const items = getCrystallizableItems();

  // Показать текущий dust
  const dustText = scene.add.text(panelX, startY - 15,
    "Enchant Dust: " + getResourceCount("enchantDust"), {
    fontSize: "14px",
    color: "#aa88ff"
  }).setOrigin(0.5);
  forgeDismantleContainer.add(dustText);

  if (items.length === 0) {
    const emptyText = scene.add.text(panelX, startY + 100,
      "Нет предметов для разбора\n\nСоздайте экипировку\nво вкладке Крафт", {
      fontSize: "14px",
      color: "#888888",
      align: "center"
    }).setOrigin(0.5);
    forgeDismantleContainer.add(emptyText);
    return;
  }

  items.forEach((item, index) => {
    if (index > 4) return; // Макс 5 предметов на экран

    const y = startY + 20 + index * 70;

    // Фон
    const cardBg = scene.add.rectangle(panelX, y + 20, panelW - 40, 60, 0x2a2a4e)
      .setStrokeStyle(1, 0x4a4a6e);
    forgeDismantleContainer.add(cardBg);

    // Название
    const nameText = scene.add.text(panelX - panelW / 2 + 30, y + 5,
      item.name + " [" + item.grade + "]", {
      fontSize: "14px",
      color: "#ffffff"
    });
    forgeDismantleContainer.add(nameText);

    // Dust range
    const dustRangeText = scene.add.text(panelX - panelW / 2 + 30, y + 25,
      "-> Dust: " + item.crystallize.min + "-" + item.crystallize.max, {
      fontSize: "11px",
      color: "#aa88ff"
    });
    forgeDismantleContainer.add(dustRangeText);

    // Кнопка
    const btnX = panelX + panelW / 2 - 55;
    const btnY = y + 20;

    const btn = scene.add.rectangle(btnX, btnY, 70, 28, 0x6a4a4a)
      .setStrokeStyle(1, 0x8a6a6a)
      .setInteractive({ useHandCursor: true });

    const btnText = scene.add.text(btnX, btnY, "Разобрать", {
      fontSize: "11px",
      color: "#ffffff"
    }).setOrigin(0.5);

    btn.on("pointerdown", () => {
      const result = tryDismantle(item.inventoryIndex);
      if (result.success) {
        showForgeResult(scene, "+" + result.dustGain + " Enchant Dust", false);
        rebuildForgeContent(scene);
      }
    });

    forgeDismantleContainer.add(btn);
    forgeDismantleContainer.add(btnText);
  });
}

// ============================================================
//  ОБЩИЕ ФУНКЦИИ
// ============================================================

function showForgeResult(scene, message, isLucky) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const color = isLucky ? "#ffff00" : "#4aff4a";

  const text = scene.add.text(w / 2, h / 2 - 50, message, {
    fontSize: isLucky ? "24px" : "20px",
    color: color,
    fontFamily: "Arial",
    stroke: "#000000",
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(150);

  scene.tweens.add({
    targets: text,
    y: text.y - 50,
    alpha: 0,
    duration: 1500,
    onComplete: () => text.destroy()
  });
}

function updateForgeUI(scene) {
  rebuildForgeContent(scene);
}

function showForgePanel() {
  isForgeOpen = true;
  currentForgeTab = "refine"; // Сброс на первую вкладку
  if (forgeContainer) {
    forgeContainer.setVisible(true);
    // Обновляем UI при открытии
    if (window.gameScene) {
      updateTabStyles(window.gameScene);
      rebuildForgeContent(window.gameScene);
    }
  }
}

function hideForgePanel() {
  isForgeOpen = false;
  if (forgeContainer) forgeContainer.setVisible(false);
}
