"use strict";

// ----- Панель: Карта мира (графическая) -----

// Дополнительные элементы карты
let mapImage = null;
let mapLocationButtons = [];
let mapCloseButton = null;
let mapCloseButtonText = null;
let mapInfoText = null;
let selectedMapLocation = 0;

// Координаты локаций на карте (относительно центра панели)
const MAP_LOCATIONS = [
  { id: 0, name: "Obelisk of Victory", x: -20, y: 90, level: "1-5", cost: 0 },
  { id: 1, name: "Northern Territory", x: -100, y: 50, level: "5-10", cost: 50 },
  { id: 2, name: "Elven Ruins", x: -180, y: 100, level: "10-18", cost: 100 },
  { id: 3, name: "Orc Barracks", x: 130, y: -20, level: "20+", cost: 200 },
];

function showMapPanel() {
  isMapOpen = true;
  hideInventoryPanel();
  hideStatsPanel();
  hideForgePanel();
  hideQuestsPanel();
  hideShopPanel();
  hideArenaPanel();
  hideDungeonPanel();
  
  if (mapPanel) mapPanel.setVisible(true);
  if (mapImage) mapImage.setVisible(true);
  if (mapCloseButton) mapCloseButton.setVisible(true);
  if (mapCloseButtonText) mapCloseButtonText.setVisible(true);
  if (mapInfoText) mapInfoText.setVisible(true);
  
  mapLocationButtons.forEach(btn => {
    btn.circle.setVisible(true);
    btn.text.setVisible(true);
  });
  
  // Скрываем старые элементы
  if (mapPanelText) mapPanelText.setVisible(false);
  if (mapGoButton) mapGoButton.setVisible(false);
  if (mapGoButtonText) mapGoButtonText.setVisible(false);
  
  selectedMapLocation = currentLocationIndex;
  updateMapInfo();
  highlightSelectedLocation();
}

function hideMapPanel() {
  isMapOpen = false;
  if (mapPanel) mapPanel.setVisible(false);
  if (mapImage) mapImage.setVisible(false);
  if (mapCloseButton) mapCloseButton.setVisible(false);
  if (mapCloseButtonText) mapCloseButtonText.setVisible(false);
  if (mapInfoText) mapInfoText.setVisible(false);
  
  mapLocationButtons.forEach(btn => {
    btn.circle.setVisible(false);
    btn.text.setVisible(false);
  });
  
  if (mapPanelText) mapPanelText.setVisible(false);
  if (mapGoButton) mapGoButton.setVisible(false);
  if (mapGoButtonText) mapGoButtonText.setVisible(false);
}

function createMapUI(scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const panelX = w / 2;
  const panelY = h / 2;
  
  // Размер карты — 70% экрана
  const mapW = w * 0.7;
  const mapH = h * 0.7;
  
  // Картинка карты (depth 30+ чтобы быть поверх кнопок)
  mapImage = scene.add.image(panelX, panelY, "map_world");
  mapImage.setDisplaySize(mapW, mapH);
  mapImage.setDepth(30);
  mapImage.setVisible(false);
  
  // Масштаб для координат точек
  const scaleX = mapW / 500;
  const scaleY = mapH / 350;
  
  // Точки локаций
  MAP_LOCATIONS.forEach((loc, i) => {
    const x = panelX + loc.x * scaleX;
    const y = panelY + loc.y * scaleY;
    
    const circle = scene.add.circle(x, y, 20, 0x333333, 0.8)
      .setStrokeStyle(3, 0xffd700)
      .setInteractive({ useHandCursor: true })
      .setDepth(31);
    
    const text = scene.add.text(x, y + 30, loc.name, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(31);
    
    // Клик по точке
    circle.on("pointerdown", () => {
      handleLocationClick(i, scene);
    });
    
    circle.on("pointerover", () => {
      circle.setScale(1.2);
    });
    
    circle.on("pointerout", () => {
      circle.setScale(1);
    });
    
    mapLocationButtons.push({ circle, text, locId: i });
  });
  
  // Инфо внизу
  mapInfoText = scene.add.text(panelX, panelY + mapH / 2 - 30, "", {
    fontFamily: "Arial",
    fontSize: "16px",
    color: "#ffffff",
    align: "center",
    stroke: "#000000",
    strokeThickness: 4
  }).setOrigin(0.5).setDepth(32).setVisible(false);
  
  // Кнопка закрыть
  mapCloseButton = scene.add.rectangle(panelX + mapW / 2 - 25, panelY - mapH / 2 + 25, 40, 40, 0x880000)
    .setStrokeStyle(2, 0xff0000)
    .setInteractive({ useHandCursor: true })
    .setDepth(32);
  
  mapCloseButtonText = scene.add.text(panelX + mapW / 2 - 25, panelY - mapH / 2 + 25, "✕", {
    fontFamily: "Arial",
    fontSize: "22px",
    color: "#ffffff"
  }).setOrigin(0.5).setDepth(33);
  
  mapCloseButton.on("pointerdown", () => {
    hideMapPanel();
  });
  
  mapCloseButton.setVisible(false);
  mapCloseButtonText.setVisible(false);
  
  // Скрываем все точки
  mapLocationButtons.forEach(btn => {
    btn.circle.setVisible(false);
    btn.text.setVisible(false);
  });
}

function updateMapInfo() {
  if (!mapInfoText) return;
  
  const loc = MAP_LOCATIONS[selectedMapLocation];
  const gold = wallet.gold || 0;
  const canAfford = gold >= loc.cost;
  
  let info = loc.name + " (Lv." + loc.level + ")\n";
  info += "Телепорт: " + loc.cost + " адены";
  
  if (canAfford) {
    info += "\n[Двойной клик — телепорт]";
    mapInfoText.setColor("#00ff00");
  } else {
    info += "\n[Недостаточно адены: " + gold + "/" + loc.cost + "]";
    mapInfoText.setColor("#ff6666");
  }
  
  mapInfoText.setText(info);
}

function highlightSelectedLocation() {
  mapLocationButtons.forEach((btn, i) => {
    if (i === selectedMapLocation) {
      btn.circle.setStrokeStyle(3, 0x00ff00);
      btn.circle.fillColor = 0x005500;
    } else {
      btn.circle.setStrokeStyle(3, 0xffd700);
      btn.circle.fillColor = 0x333333;
    }
  });
}

// Двойной клик для телепорта
let lastClickedLocation = -1;
let lastClickTime = 0;

function handleLocationClick(locId, scene) {
  const now = Date.now();
  
  if (lastClickedLocation === locId && now - lastClickTime < 500) {
    // Двойной клик — телепорт
    teleportToLocation(locId, window.gameScene);
    lastClickedLocation = -1;
  } else {
    // Первый клик — выбор
    selectedMapLocation = locId;
    updateMapInfo();
    highlightSelectedLocation();
    lastClickedLocation = locId;
    lastClickTime = now;
  }
}

function teleportToLocation(locId, scene) {
  const loc = MAP_LOCATIONS[locId];
  const gold = wallet.gold || 0;
  
  if (gold < loc.cost) {
    if (typeof spawnForgeResultText === "function") {
      spawnForgeResultText(scene, "Недостаточно адены!", false, true);
    }
    return;
  }
  
  wallet.gold = gold - loc.cost;
  currentLocationIndex = locId;
  
  hideMapPanel();
  enterLocation(scene);
  
  if (typeof spawnForgeResultText === "function") {
    spawnForgeResultText(scene, "Телепорт в " + loc.name, true, true);
  }
}

// Старая функция для совместимости
function updateMapPanel() {
  updateMapInfo();
}