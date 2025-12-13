"use strict";

// ============================================================
//  FORGE PANEL — UI Кузницы (MVP v1)
// ============================================================

// Переменные UI кузницы
let forgeContainer = null;
let forgeRefineContainer = null;

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

  // Табы (пока только Переплавка активна)
  const tabY = panelY - panelH / 2 + 70;
  const tabNames = ["Переплавка", "Крафт", "Разбор"];
  const tabWidth = 100;

  tabNames.forEach((name, i) => {
    const tabX = panelX - tabWidth + (i * tabWidth);
    const isActive = i === 0;

    const tabBg = scene.add.rectangle(tabX, tabY, tabWidth - 4, 30, isActive ? 0x3a3a5e : 0x2a2a4e)
      .setStrokeStyle(1, 0x4a4a6e)
      .setInteractive({ useHandCursor: true });

    const tabText = scene.add.text(tabX, tabY, name, {
      fontSize: "12px",
      color: isActive ? "#d4af37" : "#888888"
    }).setOrigin(0.5);

    // TODO: переключение табов в Части 2
    if (i > 0) {
      tabBg.setAlpha(0.5);
      tabText.setAlpha(0.5);
    }

    forgeContainer.add(tabBg);
    forgeContainer.add(tabText);
  });

  // Контейнер для контента переплавки
  forgeRefineContainer = scene.add.container(0, 0);
  forgeContainer.add(forgeRefineContainer);

  createRefineContent(scene, panelX, panelY, panelW, panelH);
}

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
    haveText.setData("recipeId", recipe.id); // для обновления
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
            showForgeResult(scene, `+${result.amount} ${result.recipeName}`);
            updateForgeUI(scene);
          }
        });
      }

      forgeRefineContainer.add(btn);
      forgeRefineContainer.add(btnText);
    });
  });
}

function showForgeResult(scene, message) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  const text = scene.add.text(w / 2, h / 2 - 50, message, {
    fontSize: "20px",
    color: "#4aff4a",
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
  if (!forgeRefineContainer) return;
  // Пересоздаём контент (простой способ)
  forgeRefineContainer.removeAll(true);
  const w = scene.scale.width;
  const h = scene.scale.height;
  createRefineContent(scene, w / 2, h / 2, 360, 500);
}

function showForgePanel() {
  isForgeOpen = true;
  if (forgeContainer) {
    forgeContainer.setVisible(true);
    // Обновляем UI при открытии
    if (window.gameScene) {
      updateForgeUI(window.gameScene);
    }
  }
}

function hideForgePanel() {
  isForgeOpen = false;
  if (forgeContainer) forgeContainer.setVisible(false);
}
