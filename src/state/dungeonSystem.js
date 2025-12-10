"use strict";

// ----- Данж: запуск и завершение забега -----

function startDungeonRun(scene) {
  isDungeonRun = true;
  dungeonKills = 0;
  hideDungeonPanel();
  enterLocation(scene);
  updateLocationLabel();
  saveGame();
}

function endDungeonRun(scene) {
  if (!isDungeonRun) return;
  isDungeonRun = false;

  const loc = getCurrentLocation();
  const bonusGold = loc.goldReward * 5;
  const bonusEther = 5;

  heroGold += bonusGold;
  heroEther += bonusEther;

  updateHeroUI();
  saveGame();

  const w = scene.scale.width;
  const h = scene.scale.height;
  const lines = [
    "ДАНЖ ПРОЙДЕН!",
    "",
    "Ты завершил забег:",
    " • Локация: " + loc.name,
    " • Убито: " + dungeonKills + " / " + DUNGEON_KILL_TARGET,
    "",
    "Доп. награда:",
    " +" + bonusGold + " адены",
    " +" + bonusEther + " Эфира",
    "",
    "Тебя возвращают в город.",
  ];

  const panel = scene.add
    .rectangle(w / 2, h / 2, 520, 260, 0x000000, 0.9)
    .setStrokeStyle(2, 0xffffff);
  const text = scene.add
    .text(w / 2, h / 2, lines.join("\n"), {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5);

  panel.setDepth(32);
  text.setDepth(33);

  scene.time.delayedCall(
    1800,
    () => {
      panel.destroy();
      text.destroy();
      enterCity(scene);
    },
    null,
    scene
  );
}
