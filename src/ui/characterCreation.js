"use strict";

// ============================================================
//  CHARACTER CREATION — Полноэкранный экран создания персонажа
// ============================================================

(function() {
  // ----- СОСТОЯНИЕ -----
  let container = null;
  let isProcessing = false;
  let selectedRace = null;
  let selectedArchetype = null;
  let visibilityCache = {};

  // ----- UI ЭЛЕМЕНТЫ -----
  let bgImage = null;
  let titleText = null;
  let subtitleText = null;
  let raceButtons = [];
  let archetypeButtons = [];
  let confirmBtn = null;
  let confirmBtnText = null;
  let backBtn = null;
  let backBtnText = null;

  // Текущий шаг: "race" | "archetype"
  let currentStep = "race";

  // ================== СКРЫТИЕ/ПОКАЗ ИГРОВОГО UI ==================

  function hideGameUI() {
    visibilityCache = {};

    // Скрываем новый UI (uiElements)
    if (typeof uiElements !== "undefined" && uiElements) {
      // Верхний бар
      if (uiElements.topBarBg) {
        visibilityCache["topBarBg"] = uiElements.topBarBg.visible;
        uiElements.topBarBg.setVisible(false);
      }
      if (uiElements.hpBarBg) {
        visibilityCache["hpBarBg"] = uiElements.hpBarBg.visible;
        uiElements.hpBarBg.setVisible(false);
      }
      if (uiElements.hpBarFill) {
        visibilityCache["hpBarFill"] = uiElements.hpBarFill.visible;
        uiElements.hpBarFill.setVisible(false);
      }
      if (uiElements.hpBarLabel) {
        visibilityCache["hpBarLabel"] = uiElements.hpBarLabel.visible;
        uiElements.hpBarLabel.setVisible(false);
      }
      if (uiElements.mpBarBg) {
        visibilityCache["mpBarBg"] = uiElements.mpBarBg.visible;
        uiElements.mpBarBg.setVisible(false);
      }
      if (uiElements.mpBarFill) {
        visibilityCache["mpBarFill"] = uiElements.mpBarFill.visible;
        uiElements.mpBarFill.setVisible(false);
      }
      if (uiElements.mpBarLabel) {
        visibilityCache["mpBarLabel"] = uiElements.mpBarLabel.visible;
        uiElements.mpBarLabel.setVisible(false);
      }
      if (uiElements.expBarBg) {
        visibilityCache["expBarBg"] = uiElements.expBarBg.visible;
        uiElements.expBarBg.setVisible(false);
      }
      if (uiElements.expBarFill) {
        visibilityCache["expBarFill"] = uiElements.expBarFill.visible;
        uiElements.expBarFill.setVisible(false);
      }
      if (uiElements.levelLabel) {
        visibilityCache["levelLabel"] = uiElements.levelLabel.visible;
        uiElements.levelLabel.setVisible(false);
      }

      // Кнопки меню
      if (uiElements.menuButtons) {
        uiElements.menuButtons.forEach((item, i) => {
          visibilityCache["menuBtn_" + i] = item.btn.visible;
          item.btn.setVisible(false);
          if (item.icon) {
            visibilityCache["menuIcon_" + i] = item.icon.visible;
            item.icon.setVisible(false);
          }
        });
      }

      // NPC кнопки
      if (uiElements.npcButtons) {
        uiElements.npcButtons.forEach((item, i) => {
          visibilityCache["npcBtn_" + i] = item.btn.visible;
          item.btn.setVisible(false);
          if (item.label) {
            visibilityCache["npcLabel_" + i] = item.label.visible;
            item.label.setVisible(false);
          }
        });
      }

      // Нижний бар
      if (uiElements.bottomBarBg) {
        visibilityCache["bottomBarBg"] = uiElements.bottomBarBg.visible;
        uiElements.bottomBarBg.setVisible(false);
      }
      if (uiElements.attackBtn) {
        visibilityCache["attackBtn"] = uiElements.attackBtn.visible;
        uiElements.attackBtn.setVisible(false);
      }
      if (uiElements.attackBtnLabel) {
        visibilityCache["attackBtnLabel"] = uiElements.attackBtnLabel.visible;
        uiElements.attackBtnLabel.setVisible(false);
      }

      // Навигация локаций
      if (uiElements.locNavContainer) {
        visibilityCache["locNavContainer"] = uiElements.locNavContainer.visible;
        uiElements.locNavContainer.setVisible(false);
      }
      if (uiElements.locPrevBtn) {
        visibilityCache["locPrevBtn"] = uiElements.locPrevBtn.visible;
        uiElements.locPrevBtn.setVisible(false);
      }
      if (uiElements.locNextBtn) {
        visibilityCache["locNextBtn"] = uiElements.locNextBtn.visible;
        uiElements.locNextBtn.setVisible(false);
      }
      if (uiElements.locNavLabel) {
        visibilityCache["locNavLabel"] = uiElements.locNavLabel.visible;
        uiElements.locNavLabel.setVisible(false);
      }

      // Skill кнопки
      if (uiElements.skill1Btn) {
        visibilityCache["skill1Btn"] = uiElements.skill1Btn.visible;
        uiElements.skill1Btn.setVisible(false);
      }
      if (uiElements.skill1Label) {
        visibilityCache["skill1Label"] = uiElements.skill1Label.visible;
        uiElements.skill1Label.setVisible(false);
      }
      if (uiElements.skill2Btn) {
        visibilityCache["skill2Btn"] = uiElements.skill2Btn.visible;
        uiElements.skill2Btn.setVisible(false);
      }
      if (uiElements.skill2Label) {
        visibilityCache["skill2Label"] = uiElements.skill2Label.visible;
        uiElements.skill2Label.setVisible(false);
      }

      // Auto/Sit/Shots
      if (uiElements.autoBtn) {
        visibilityCache["autoBtn"] = uiElements.autoBtn.visible;
        uiElements.autoBtn.setVisible(false);
      }
      if (uiElements.autoBtnLabel) {
        visibilityCache["autoBtnLabel"] = uiElements.autoBtnLabel.visible;
        uiElements.autoBtnLabel.setVisible(false);
      }
      if (uiElements.sitButton) {
        visibilityCache["sitButton"] = uiElements.sitButton.visible;
        uiElements.sitButton.setVisible(false);
      }
      if (uiElements.sitButtonLabel) {
        visibilityCache["sitButtonLabel"] = uiElements.sitButtonLabel.visible;
        uiElements.sitButtonLabel.setVisible(false);
      }
      if (uiElements.shotsBtn) {
        visibilityCache["shotsBtn"] = uiElements.shotsBtn.visible;
        uiElements.shotsBtn.setVisible(false);
      }
      if (uiElements.shotsBtnLabel) {
        visibilityCache["shotsBtnLabel"] = uiElements.shotsBtnLabel.visible;
        uiElements.shotsBtnLabel.setVisible(false);
      }

      // HP/MP potion
      if (uiElements.hpPotionBtn) {
        visibilityCache["hpPotionBtn"] = uiElements.hpPotionBtn.visible;
        uiElements.hpPotionBtn.setVisible(false);
      }
      if (uiElements.hpPotionLabel) {
        visibilityCache["hpPotionLabel"] = uiElements.hpPotionLabel.visible;
        uiElements.hpPotionLabel.setVisible(false);
      }
      if (uiElements.mpPotionBtn) {
        visibilityCache["mpPotionBtn"] = uiElements.mpPotionBtn.visible;
        uiElements.mpPotionBtn.setVisible(false);
      }
      if (uiElements.mpPotionLabel) {
        visibilityCache["mpPotionLabel"] = uiElements.mpPotionLabel.visible;
        uiElements.mpPotionLabel.setVisible(false);
      }

      // City btn
      if (uiElements.cityBtn) {
        visibilityCache["cityBtn"] = uiElements.cityBtn.visible;
        uiElements.cityBtn.setVisible(false);
      }
      if (uiElements.cityBtnLabel) {
        visibilityCache["cityBtnLabel"] = uiElements.cityBtnLabel.visible;
        uiElements.cityBtnLabel.setVisible(false);
      }
    }

    // Скрываем фоны и героев
    if (typeof cityBg !== "undefined" && cityBg) {
      visibilityCache["cityBg"] = cityBg.visible;
      cityBg.setVisible(false);
    }
    if (typeof locationBg !== "undefined" && locationBg) {
      visibilityCache["locationBg"] = locationBg.visible;
      locationBg.setVisible(false);
    }
    if (typeof hero !== "undefined" && hero) {
      visibilityCache["hero"] = hero.visible;
      hero.setVisible(false);
    }
    if (typeof cityHero !== "undefined" && cityHero) {
      visibilityCache["cityHero"] = cityHero.visible;
      cityHero.setVisible(false);
    }
    if (typeof enemy !== "undefined" && enemy) {
      visibilityCache["enemy"] = enemy.visible;
      enemy.setVisible(false);
    }
    if (typeof enemyHpText !== "undefined" && enemyHpText) {
      visibilityCache["enemyHpText"] = enemyHpText.visible;
      enemyHpText.setVisible(false);
    }
    if (typeof merc !== "undefined" && merc) {
      visibilityCache["merc"] = merc.visible;
      merc.setVisible(false);
    }
  }

  function showGameUI() {
    // Восстанавливаем uiElements
    if (typeof uiElements !== "undefined" && uiElements) {
      if (uiElements.topBarBg && visibilityCache["topBarBg"] !== undefined) {
        uiElements.topBarBg.setVisible(visibilityCache["topBarBg"]);
      }
      if (uiElements.hpBarBg && visibilityCache["hpBarBg"] !== undefined) {
        uiElements.hpBarBg.setVisible(visibilityCache["hpBarBg"]);
      }
      if (uiElements.hpBarFill && visibilityCache["hpBarFill"] !== undefined) {
        uiElements.hpBarFill.setVisible(visibilityCache["hpBarFill"]);
      }
      if (uiElements.hpBarLabel && visibilityCache["hpBarLabel"] !== undefined) {
        uiElements.hpBarLabel.setVisible(visibilityCache["hpBarLabel"]);
      }
      if (uiElements.mpBarBg && visibilityCache["mpBarBg"] !== undefined) {
        uiElements.mpBarBg.setVisible(visibilityCache["mpBarBg"]);
      }
      if (uiElements.mpBarFill && visibilityCache["mpBarFill"] !== undefined) {
        uiElements.mpBarFill.setVisible(visibilityCache["mpBarFill"]);
      }
      if (uiElements.mpBarLabel && visibilityCache["mpBarLabel"] !== undefined) {
        uiElements.mpBarLabel.setVisible(visibilityCache["mpBarLabel"]);
      }
      if (uiElements.expBarBg && visibilityCache["expBarBg"] !== undefined) {
        uiElements.expBarBg.setVisible(visibilityCache["expBarBg"]);
      }
      if (uiElements.expBarFill && visibilityCache["expBarFill"] !== undefined) {
        uiElements.expBarFill.setVisible(visibilityCache["expBarFill"]);
      }
      if (uiElements.levelLabel && visibilityCache["levelLabel"] !== undefined) {
        uiElements.levelLabel.setVisible(visibilityCache["levelLabel"]);
      }

      if (uiElements.menuButtons) {
        uiElements.menuButtons.forEach((item, i) => {
          if (visibilityCache["menuBtn_" + i] !== undefined) {
            item.btn.setVisible(visibilityCache["menuBtn_" + i]);
          }
          if (item.icon && visibilityCache["menuIcon_" + i] !== undefined) {
            item.icon.setVisible(visibilityCache["menuIcon_" + i]);
          }
        });
      }

      if (uiElements.npcButtons) {
        uiElements.npcButtons.forEach((item, i) => {
          if (visibilityCache["npcBtn_" + i] !== undefined) {
            item.btn.setVisible(visibilityCache["npcBtn_" + i]);
          }
          if (item.label && visibilityCache["npcLabel_" + i] !== undefined) {
            item.label.setVisible(visibilityCache["npcLabel_" + i]);
          }
        });
      }

      if (uiElements.bottomBarBg && visibilityCache["bottomBarBg"] !== undefined) {
        uiElements.bottomBarBg.setVisible(visibilityCache["bottomBarBg"]);
      }
      if (uiElements.attackBtn && visibilityCache["attackBtn"] !== undefined) {
        uiElements.attackBtn.setVisible(visibilityCache["attackBtn"]);
      }
      if (uiElements.attackBtnLabel && visibilityCache["attackBtnLabel"] !== undefined) {
        uiElements.attackBtnLabel.setVisible(visibilityCache["attackBtnLabel"]);
      }

      if (uiElements.locNavContainer && visibilityCache["locNavContainer"] !== undefined) {
        uiElements.locNavContainer.setVisible(visibilityCache["locNavContainer"]);
      }
      if (uiElements.locPrevBtn && visibilityCache["locPrevBtn"] !== undefined) {
        uiElements.locPrevBtn.setVisible(visibilityCache["locPrevBtn"]);
      }
      if (uiElements.locNextBtn && visibilityCache["locNextBtn"] !== undefined) {
        uiElements.locNextBtn.setVisible(visibilityCache["locNextBtn"]);
      }
      if (uiElements.locNavLabel && visibilityCache["locNavLabel"] !== undefined) {
        uiElements.locNavLabel.setVisible(visibilityCache["locNavLabel"]);
      }

      if (uiElements.skill1Btn && visibilityCache["skill1Btn"] !== undefined) {
        uiElements.skill1Btn.setVisible(visibilityCache["skill1Btn"]);
      }
      if (uiElements.skill1Label && visibilityCache["skill1Label"] !== undefined) {
        uiElements.skill1Label.setVisible(visibilityCache["skill1Label"]);
      }
      if (uiElements.skill2Btn && visibilityCache["skill2Btn"] !== undefined) {
        uiElements.skill2Btn.setVisible(visibilityCache["skill2Btn"]);
      }
      if (uiElements.skill2Label && visibilityCache["skill2Label"] !== undefined) {
        uiElements.skill2Label.setVisible(visibilityCache["skill2Label"]);
      }

      if (uiElements.autoBtn && visibilityCache["autoBtn"] !== undefined) {
        uiElements.autoBtn.setVisible(visibilityCache["autoBtn"]);
      }
      if (uiElements.autoBtnLabel && visibilityCache["autoBtnLabel"] !== undefined) {
        uiElements.autoBtnLabel.setVisible(visibilityCache["autoBtnLabel"]);
      }
      if (uiElements.sitButton && visibilityCache["sitButton"] !== undefined) {
        uiElements.sitButton.setVisible(visibilityCache["sitButton"]);
      }
      if (uiElements.sitButtonLabel && visibilityCache["sitButtonLabel"] !== undefined) {
        uiElements.sitButtonLabel.setVisible(visibilityCache["sitButtonLabel"]);
      }
      if (uiElements.shotsBtn && visibilityCache["shotsBtn"] !== undefined) {
        uiElements.shotsBtn.setVisible(visibilityCache["shotsBtn"]);
      }
      if (uiElements.shotsBtnLabel && visibilityCache["shotsBtnLabel"] !== undefined) {
        uiElements.shotsBtnLabel.setVisible(visibilityCache["shotsBtnLabel"]);
      }

      if (uiElements.hpPotionBtn && visibilityCache["hpPotionBtn"] !== undefined) {
        uiElements.hpPotionBtn.setVisible(visibilityCache["hpPotionBtn"]);
      }
      if (uiElements.hpPotionLabel && visibilityCache["hpPotionLabel"] !== undefined) {
        uiElements.hpPotionLabel.setVisible(visibilityCache["hpPotionLabel"]);
      }
      if (uiElements.mpPotionBtn && visibilityCache["mpPotionBtn"] !== undefined) {
        uiElements.mpPotionBtn.setVisible(visibilityCache["mpPotionBtn"]);
      }
      if (uiElements.mpPotionLabel && visibilityCache["mpPotionLabel"] !== undefined) {
        uiElements.mpPotionLabel.setVisible(visibilityCache["mpPotionLabel"]);
      }

      if (uiElements.cityBtn && visibilityCache["cityBtn"] !== undefined) {
        uiElements.cityBtn.setVisible(visibilityCache["cityBtn"]);
      }
      if (uiElements.cityBtnLabel && visibilityCache["cityBtnLabel"] !== undefined) {
        uiElements.cityBtnLabel.setVisible(visibilityCache["cityBtnLabel"]);
      }
    }

    // Восстанавливаем фоны и героев
    if (typeof cityBg !== "undefined" && cityBg && visibilityCache["cityBg"] !== undefined) {
      cityBg.setVisible(visibilityCache["cityBg"]);
    }
    if (typeof locationBg !== "undefined" && locationBg && visibilityCache["locationBg"] !== undefined) {
      locationBg.setVisible(visibilityCache["locationBg"]);
    }
    if (typeof hero !== "undefined" && hero && visibilityCache["hero"] !== undefined) {
      hero.setVisible(visibilityCache["hero"]);
    }
    if (typeof cityHero !== "undefined" && cityHero && visibilityCache["cityHero"] !== undefined) {
      cityHero.setVisible(visibilityCache["cityHero"]);
    }
    if (typeof enemy !== "undefined" && enemy && visibilityCache["enemy"] !== undefined) {
      enemy.setVisible(visibilityCache["enemy"]);
    }
    if (typeof enemyHpText !== "undefined" && enemyHpText && visibilityCache["enemyHpText"] !== undefined) {
      enemyHpText.setVisible(visibilityCache["enemyHpText"]);
    }
    if (typeof merc !== "undefined" && merc && visibilityCache["merc"] !== undefined) {
      merc.setVisible(visibilityCache["merc"]);
    }

    visibilityCache = {};
  }

  // ================== ПОКАЗ ЭКРАНА РАСЫ ==================

  function showRaceStep(scene) {
    currentStep = "race";
    selectedRace = null;

    const w = scene.scale.width;
    const h = scene.scale.height;

    // Очищаем предыдущие кнопки архетипов
    archetypeButtons.forEach(btn => {
      if (btn.rect) btn.rect.destroy();
      if (btn.txt) btn.txt.destroy();
    });
    archetypeButtons = [];

    // Заголовок
    if (titleText) titleText.setText("СОЗДАНИЕ ГЕРОЯ");
    if (subtitleText) subtitleText.setText("Выбери расу");

    // Кнопки рас
    const raceY = h * 0.45;
    const raceStartX = w / 2 - 120;
    const raceGapX = 120;

    raceButtons.forEach(btn => {
      if (btn.rect) btn.rect.destroy();
      if (btn.txt) btn.txt.destroy();
    });
    raceButtons = [];

    RACES.forEach((race, index) => {
      const x = raceStartX + raceGapX * index;
      const isLocked = race.id !== "human";

      const rect = scene.add.rectangle(x, raceY, 100, 80, isLocked ? 0x222222 : 0x1a1a2e, 0.9)
        .setStrokeStyle(2, isLocked ? 0x444444 : 0x4a4a6a)
        .setDepth(101);

      if (!isLocked) {
        rect.setInteractive({ useHandCursor: true });
      }

      const label = isLocked ? race.label + "\n(скоро)" : race.label;
      const txt = scene.add.text(x, raceY, label, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: isLocked ? "#555555" : "#e0e0ff",
        align: "center"
      }).setOrigin(0.5).setDepth(102);

      if (!isLocked) {
        rect.on("pointerdown", () => {
          if (isProcessing) return;
          selectRace(race.id);
        });
      }

      raceButtons.push({ id: race.id, rect, txt, isLocked });
    });

    // Кнопка "Далее"
    if (confirmBtn) confirmBtn.destroy();
    if (confirmBtnText) confirmBtnText.destroy();

    confirmBtn = scene.add.rectangle(w / 2, h * 0.75, 180, 50, 0x1a1a2e, 0.9)
      .setStrokeStyle(2, 0xd4af37)
      .setInteractive({ useHandCursor: true })
      .setDepth(101);

    confirmBtnText = scene.add.text(w / 2, h * 0.75, "Далее", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#d4af37"
    }).setOrigin(0.5).setDepth(102);

    confirmBtn.on("pointerdown", () => {
      if (isProcessing) return;
      if (!selectedRace) {
        showError(scene, "Выбери расу!");
        return;
      }
      isProcessing = true;
      scene.time.delayedCall(100, () => {
        showArchetypeStep(scene);
        isProcessing = false;
      });
    });

    // Скрываем кнопку "Назад" на первом шаге
    if (backBtn) backBtn.setVisible(false);
    if (backBtnText) backBtnText.setVisible(false);
  }

  function selectRace(raceId) {
    selectedRace = raceId;
    raceButtons.forEach(btn => {
      if (btn.isLocked) return;
      btn.rect.fillColor = btn.id === raceId ? 0x2a2a1e : 0x1a1a2e;
      btn.rect.setStrokeStyle(2, btn.id === raceId ? 0xffd700 : 0x4a4a6a);
    });
  }

  // ================== ПОКАЗ ЭКРАНА АРХЕТИПА ==================

  function showArchetypeStep(scene) {
    currentStep = "archetype";
    selectedArchetype = null;

    const w = scene.scale.width;
    const h = scene.scale.height;

    // Заголовок
    if (titleText) titleText.setText("СОЗДАНИЕ ГЕРОЯ");
    if (subtitleText) subtitleText.setText("Выбери класс");

    // Скрываем кнопки рас
    raceButtons.forEach(btn => {
      if (btn.rect) btn.rect.setVisible(false);
      if (btn.txt) btn.txt.setVisible(false);
    });

    // Кнопки архетипов
    const archY = h * 0.45;
    const archStartX = w / 2 - 80;
    const archGapX = 160;

    archetypeButtons.forEach(btn => {
      if (btn.rect) btn.rect.destroy();
      if (btn.txt) btn.txt.destroy();
    });
    archetypeButtons = [];

    ARCHETYPES.forEach((arch, index) => {
      const x = archStartX + archGapX * index;

      const rect = scene.add.rectangle(x, archY, 120, 80, 0x1a1a2e, 0.9)
        .setStrokeStyle(2, 0x4a4a6a)
        .setInteractive({ useHandCursor: true })
        .setDepth(101);

      const txt = scene.add.text(x, archY, arch.label, {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#e0e0ff",
        align: "center"
      }).setOrigin(0.5).setDepth(102);

      rect.on("pointerdown", () => {
        if (isProcessing) return;
        selectArchetype(arch.id);
      });

      archetypeButtons.push({ id: arch.id, rect, txt });
    });

    // Кнопка "Играть"
    if (confirmBtn) confirmBtn.destroy();
    if (confirmBtnText) confirmBtnText.destroy();

    confirmBtn = scene.add.rectangle(w / 2, h * 0.75, 180, 50, 0x1a1a2e, 0.9)
      .setStrokeStyle(2, 0xd4af37)
      .setInteractive({ useHandCursor: true })
      .setDepth(101);

    confirmBtnText = scene.add.text(w / 2, h * 0.75, "Играть", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#d4af37"
    }).setOrigin(0.5).setDepth(102);

    confirmBtn.on("pointerdown", () => {
      if (isProcessing) return;
      if (!selectedArchetype) {
        showError(scene, "Выбери класс!");
        return;
      }
      isProcessing = true;
      completeCreation(scene);
    });

    // Кнопка "Назад"
    if (!backBtn) {
      backBtn = scene.add.rectangle(w / 2, h * 0.85, 120, 40, 0x2e2e4e, 0.9)
        .setStrokeStyle(2, 0x5a5a7a)
        .setInteractive({ useHandCursor: true })
        .setDepth(101);

      backBtnText = scene.add.text(w / 2, h * 0.85, "Назад", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#a0a0c0"
      }).setOrigin(0.5).setDepth(102);

      backBtn.on("pointerdown", () => {
        if (isProcessing) return;
        isProcessing = true;
        scene.time.delayedCall(100, () => {
          showRaceStep(scene);
          isProcessing = false;
        });
      });
    }

    backBtn.setVisible(true);
    backBtnText.setVisible(true);
  }

  function selectArchetype(archId) {
    selectedArchetype = archId;
    archetypeButtons.forEach(btn => {
      btn.rect.fillColor = btn.id === archId ? 0x2a2a1e : 0x1a1a2e;
      btn.rect.setStrokeStyle(2, btn.id === archId ? 0xffd700 : 0x4a4a6a);
    });
  }

  // ================== ЗАВЕРШЕНИЕ СОЗДАНИЯ ==================

  function completeCreation(scene) {
    // Применяем пресет героя
    if (typeof applyHeroPreset === "function") {
      applyHeroPreset(selectedRace, selectedArchetype);
    } else {
      profile.race = selectedRace;
      profile.archetype = selectedArchetype;
    }

    // Сохраняем
    if (typeof saveGame === "function") {
      saveGame();
    }

    // Скрываем экран создания
    hide();

    // Показываем игровой UI
    showGameUI();

    // Входим в город
    if (typeof enterCity === "function") {
      enterCity(scene);
    }

    // Обновляем UI
    if (typeof updateHeroUI === "function") {
      updateHeroUI();
    }

    isProcessing = false;
  }

  // ================== ПОКАЗ ОШИБКИ ==================

  function showError(scene, message) {
    const w = scene.scale.width;
    const h = scene.scale.height;

    const errorText = scene.add.text(w / 2, h * 0.65, message, {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ff6666"
    }).setOrigin(0.5).setDepth(103);

    scene.time.delayedCall(1500, () => {
      errorText.destroy();
    });
  }

  // ================== ПУБЛИЧНЫЕ МЕТОДЫ ==================

  function show(scene) {
    if (container) return; // уже показан

    isProcessing = false;
    selectedRace = null;
    selectedArchetype = null;
    currentStep = "race";

    const w = scene.scale.width;
    const h = scene.scale.height;

    // Скрываем игровой UI
    hideGameUI();

    // Фон (cover mode — без чёрных полос)
    bgImage = scene.add.image(w / 2, h / 2, "registration_bg");
    var scaleX = w / bgImage.width;
    var scaleY = h / bgImage.height;
    var scale = Math.max(scaleX, scaleY);
    bgImage.setScale(scale);
    bgImage.setDepth(100);

    // Затемнение
    const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5);
    overlay.setDepth(100);

    // Заголовок
    titleText = scene.add.text(w / 2, h * 0.15, "СОЗДАНИЕ ГЕРОЯ", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(101);

    subtitleText = scene.add.text(w / 2, h * 0.25, "Выбери расу", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#e0e0ff"
    }).setOrigin(0.5).setDepth(101);

    // Создаём контейнер для удобного уничтожения
    container = scene.add.container(0, 0, [bgImage, overlay, titleText, subtitleText]);
    container.setDepth(100);

    // Показываем первый шаг
    showRaceStep(scene);
  }

  function hide() {
    if (!container) return;

    // Уничтожаем все элементы
    raceButtons.forEach(btn => {
      if (btn.rect) btn.rect.destroy();
      if (btn.txt) btn.txt.destroy();
    });
    raceButtons = [];

    archetypeButtons.forEach(btn => {
      if (btn.rect) btn.rect.destroy();
      if (btn.txt) btn.txt.destroy();
    });
    archetypeButtons = [];

    if (confirmBtn) {
      confirmBtn.destroy();
      confirmBtn = null;
    }
    if (confirmBtnText) {
      confirmBtnText.destroy();
      confirmBtnText = null;
    }
    if (backBtn) {
      backBtn.destroy();
      backBtn = null;
    }
    if (backBtnText) {
      backBtnText.destroy();
      backBtnText = null;
    }

    container.destroy();
    container = null;
    bgImage = null;
    titleText = null;
    subtitleText = null;
  }

  function isCreated() {
    return profile.race && profile.archetype;
  }

  // ================== ЭКСПОРТ ==================

  window.characterCreation = {
    show: show,
    hide: hide,
    isCreated: isCreated
  };
})();
