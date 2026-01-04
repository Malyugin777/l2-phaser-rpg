"use strict";

// ============================================================
//  INVENTORY SCENE — FINAL v8
//  Phaser Native | L2 Dark Fantasy | PNG Slots | Spine Hero
//  
//  Запуск: scene.launch('InventoryScene')
//  Закрытие: scene.stop('InventoryScene')
// ============================================================

class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });
    
    // ===== КОНФИГ L2 STYLE =====
    // ВСЕ размеры в GAME PIXELS (display = game / 2)
    this.CFG = {
      padding: 32,      // 16 display
      gap: 16,          // 8 display
      gridCols: 6,
      gridRows: 6,      // Увеличил для скролла
      
      // Цвета L2 Dark Fantasy (hex для Phaser)
      bgTop: 0x232730,
      bgBottom: 0x0f1116,
      panelBg: 0x1a1d24,
      footerBg: 0x111318,
      border: 0x4b5563,
      borderLight: 0x6b7280,
      
      // Текст
      textColor: '#e2e8f0',
      textMuted: '#64748b',
      gold: '#D6B36A',
      blue: '#4FA3FF',
      red: '#E05252',
      
      // Tint для слотов
      slotTintEmpty: 0x667788,
      slotTintFilled: 0xffffff,
      
      // Редкость
      rarity: {
        common:    { color: 0x4b5563, glow: null },
        uncommon:  { color: 0x22c55e, glow: 0x22c55e },
        rare:      { color: 0x3b82f6, glow: 0x3b82f6 },
        epic:      { color: 0xa855f7, glow: 0xa855f7 },
        legendary: { color: 0xD6B36A, glow: 0xD6B36A },
      }
    };
    
    // Данные
    this.ICONS = {
      helmet: "⛑️", chest: "🎽", pants: "👖", gloves: "🧤",
      boots: "👢", mainHand: "🗡️", offHand: "🛡️", necklace: "📿",
      earring1: "💎", earring2: "💎", ring1: "💍", ring2: "💍"
    };
    
    this.LABELS = {
      helmet: "Шлем", chest: "Броня", pants: "Штаны", gloves: "Перчатки",
      boots: "Ботинки", mainHand: "Оружие", offHand: "Щит", necklace: "Ожерелье",
      earring1: "Серьга", earring2: "Серьга", ring1: "Кольцо", ring2: "Кольцо"
    };
    
    // Состояние
    this.items = [];
    this.equipped = {};
    this.slotSprites = {};
    this.gridSlots = [];
    this.selectedItem = null;
  }

  // ============================================================
  //  INIT — получаем данные извне
  // ============================================================
  init(data) {
    this.items = data?.items || this.getTestItems();
    this.equipped = data?.equipped || {};
  }

  // ============================================================
  //  CREATE — строим UI
  // ============================================================
  create() {
    const W = this.scale.width;   // 780
    const H = this.scale.height;  // 1688
    const C = this.CFG;
    
    // Проверяем загружена ли PNG рамка
    if (!this.textures.exists('inv_slot_frame')) {
      // Пробуем загрузить динамически
      this.load.image('inv_slot_frame', 'assets/ui/invertory_slot_frame.png');
      this.load.once('complete', () => {
        console.log('[INV] PNG slot frame loaded dynamically');
        this.buildUI(W, H, C);
      });
      this.load.start();
      return;
    }
    
    this.buildUI(W, H, C);
  }
  
  buildUI(W, H, C) {
    // Логируем доступные текстуры для слотов
    console.log('[INV] Textures: inv_slot_frame=', this.textures.exists('inv_slot_frame'));
    
    // ===== ФИКСИРОВАННЫЕ РАЗМЕРЫ =====
    // Game pixels! Display = Game / 2
    // Чтобы выглядело как 60px на экране, нужно 120 game px
    C.equipSlot = 150;   // 75 display px
    C.gridSlot = 105;    // ~52 display px (было 120)
    C.heroBoxW = 280;    // 140 display px
    C.heroBoxH = 360;    // 180 display px
    C.gridVisibleRows = 2;
    
    console.log(`[INV] Screen: ${W}×${H}`);
    console.log(`[INV] FIXED sizes (game px): equipSlot=${C.equipSlot}, gridSlot=${C.gridSlot}, hero=${C.heroBoxW}×${C.heroBoxH}`);
    
    // Контейнер для всего UI
    this.container = this.add.container(0, 0);
    
    // 1. Затемнение фона
    this.createDimmer(W, H);
    
    // 2. Основная панель с градиентом
    this.createMainPanel(W, H);
    
    // 3. Header
    this.createHeader(W);
    
    // 4. Зона экипировки + герой
    this.createEquipmentZone(W);
    
    // 5. Статы
    this.createStatsBar(W);
    
    // 6. Сетка предметов
    this.createGrid(W, H);
    
    // 7. Popup (скрыт по умолчанию)
    this.createPopup(W, H);
    
    // Кнопка закрытия по Escape
    this.input.keyboard.on('keydown-ESC', () => this.closeInventory());
    
    console.log('[InventoryScene] Created');
  }

  // ============================================================
  //  DIMMER — затемнение
  // ============================================================
  createDimmer(W, H) {
    this.dimmer = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.85);
    this.dimmer.setInteractive();
    this.dimmer.on('pointerdown', () => this.closeInventory());
    this.container.add(this.dimmer);
  }

  // ============================================================
  //  MAIN PANEL — градиентный фон
  // ============================================================
  createMainPanel(W, H) {
    const C = this.CFG;
    const panelW = W;      // На всю ширину
    const panelH = H;      // На всю высоту
    const panelX = 0;
    const panelY = 0;
    
    this.panelBounds = { x: panelX, y: panelY, w: panelW, h: panelH };
    
    // Фон с градиентом
    const bg = this.add.graphics();
    
    // Градиент сверху вниз
    bg.fillGradientStyle(C.bgTop, C.bgTop, C.bgBottom, C.bgBottom, 1);
    bg.fillRect(panelX, panelY, panelW, panelH);
    
    // Внутренний блик сверху
    bg.lineStyle(1, 0xffffff, 0.05);
    bg.lineBetween(panelX, panelY + 1, panelX + panelW, panelY + 1);
    
    this.container.add(bg);
    this.panelBg = bg;
    
    // Блокируем клики на панели (чтобы не закрывалось)
    const blocker = this.add.rectangle(panelX + panelW/2, panelY + panelH/2, panelW, panelH, 0x000000, 0);
    blocker.setInteractive();
    this.container.add(blocker);
  }

  // ============================================================
  //  HEADER
  // ============================================================
  createHeader(W) {
    const C = this.CFG;
    const P = this.panelBounds;
    const headerH = 120;  // 60 display × 2
    
    // Фон хедера
    const headerBg = this.add.graphics();
    headerBg.fillGradientStyle(0x2a2f3a, 0x2a2f3a, C.panelBg, C.panelBg, 1);
    headerBg.fillRect(P.x, P.y, P.w, headerH);
    
    // Линия снизу
    headerBg.lineStyle(6, C.border, 1);
    headerBg.lineBetween(P.x, P.y + headerH, P.x + P.w, P.y + headerH);
    this.container.add(headerBg);
    
    // Заголовок
    const title = this.add.text(P.x + C.padding, P.y + 45, 'ИНВЕНТАРЬ', {
      fontFamily: '"Press Start 2P", Verdana, Arial',
      fontSize: '32px',
      fontStyle: 'bold',
      color: C.gold,
    });
    title.setShadow(0, 4, '#000000', 6);
    this.container.add(title);
    
    // Subtitle убран
    
    // Кнопка закрытия
    const closeBtnX = P.x + P.w - 70;
    const closeBtnY = P.y + 60;
    
    if (this.textures.exists('btn_close')) {
      const closeBtn = this.add.image(closeBtnX, closeBtnY, 'btn_close');
      closeBtn.setDisplaySize(80, 80);
      closeBtn.setInteractive({ useHandCursor: true });
      closeBtn.on('pointerdown', () => this.closeInventory());
      closeBtn.on('pointerover', () => closeBtn.setScale(1.1));
      closeBtn.on('pointerout', () => closeBtn.setScale(1));
      this.container.add(closeBtn);
    } else {
      // Fallback — красивая кнопка
      const closeBtn = this.add.graphics();
      closeBtn.fillStyle(0xdc2626, 1);
      closeBtn.fillCircle(closeBtnX, closeBtnY, 36);
      closeBtn.lineStyle(4, 0xef4444, 1);
      closeBtn.strokeCircle(closeBtnX, closeBtnY, 36);
      this.container.add(closeBtn);
      
      const closeX = this.add.text(closeBtnX, closeBtnY, '✕', {
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5);
      closeX.setInteractive({ useHandCursor: true });
      closeX.on('pointerdown', () => this.closeInventory());
      this.container.add(closeX);
    }
    
    this.headerH = headerH;
  }

  // ============================================================
  //  EQUIPMENT ZONE — слоты + герой
  // ============================================================
  createEquipmentZone(W) {
    const C = this.CFG;
    const P = this.panelBounds;
    const startY = P.y + this.headerH + 20;
    
    const leftSlots = ['helmet', 'chest', 'pants', 'gloves', 'boots', 'mainHand'];
    const rightSlots = ['offHand', 'necklace', 'earring1', 'earring2', 'ring1', 'ring2'];
    
    // Gap между слотами = 4px display = 8 game
    const slotGap = 4;
    const slotWithLabel = C.equipSlot + 32;  // слот + label (16 display)
    
    // Левая колонка — светлые PNG рамки
    const leftX = P.x + C.padding + C.equipSlot/2;
    leftSlots.forEach((type, i) => {
      const y = startY + i * (slotWithLabel + slotGap) + C.equipSlot/2;
      this.createEquipSlot(leftX, y, type);
    });
    
    // Правая колонка — светлые PNG рамки
    const rightX = P.x + P.w - C.padding - C.equipSlot/2;
    rightSlots.forEach((type, i) => {
      const y = startY + i * (slotWithLabel + slotGap) + C.equipSlot/2;
      this.createEquipSlot(rightX, y, type);
    });
    
    // Центр — герой (по центру между колонками)
    const centerX = P.x + P.w/2;
    const equipColH = 6 * (slotWithLabel + slotGap);
    const centerY = startY + equipColH / 2;
    this.createHeroPreview(centerX, centerY);
    
    this.equipZoneEndY = startY + equipColH + 10;
  }

  // ============================================================
  //  EQUIP SLOT — PNG с tint
  // ============================================================
  createEquipSlot(x, y, type) {
    const C = this.CFG;
    const item = this.equipped[type];
    
    // Контейнер слота
    const container = this.add.container(x, y);
    
    // 1. ЧЕРНАЯ ПОДЛОЖКА (эффект глубины)
    const depth = this.add.graphics();
    depth.fillStyle(0x000000, 1);
    depth.fillRoundedRect(-C.equipSlot/2 + 8, -C.equipSlot/2 + 8, C.equipSlot - 16, C.equipSlot - 16, 8);
    container.add(depth);
    
    // 2. PNG РАМКА
    const hasSlotFrame = this.textures.exists('inv_slot_frame');
    let slotBg;
    
    if (hasSlotFrame) {
      slotBg = this.add.image(0, 0, 'inv_slot_frame');
      slotBg.setDisplaySize(C.equipSlot, C.equipSlot);
      
      // Цветная рамка ТОЛЬКО для редких предметов
      if (item && item.rarity !== 'common' && C.rarity[item.rarity]?.color) {
        slotBg.setTint(C.rarity[item.rarity].color);
      }
      // Иначе — светлый камень (без tint)
    } else {
      // Fallback — рисуем
      slotBg = this.add.graphics();
      const borderColor = (item && item.rarity !== 'common') ? C.rarity[item.rarity]?.color || C.border : C.border;
      slotBg.fillStyle(0x2a2a35, 1);
      slotBg.fillRoundedRect(-C.equipSlot/2, -C.equipSlot/2, C.equipSlot, C.equipSlot, 16);
      slotBg.lineStyle(6, borderColor, 1);
      slotBg.strokeRoundedRect(-C.equipSlot/2, -C.equipSlot/2, C.equipSlot, C.equipSlot, 16);
    }
    container.add(slotBg);
    
    // 3. ИКОНКА
    const icon = this.add.text(0, -4, this.ICONS[type], {
      fontSize: `${Math.round(C.equipSlot * 0.4)}px`,
    }).setOrigin(0.5);
    // Пустой слот — еле видная иконка
    icon.setAlpha(item ? 1 : 0.15);
    container.add(icon);
    
    // Уровень предмета
    if (item) {
      const lvl = this.add.text(C.equipSlot/2 - 16, C.equipSlot/2 - 24, item.level, {
        fontFamily: 'Verdana',
        fontSize: '22px',
        fontStyle: 'bold',
        color: C.gold,
      }).setOrigin(0.5);
      lvl.setShadow(0, 2, '#000000', 4);
      container.add(lvl);
    }
    
    // Подпись
    const label = this.add.text(0, C.equipSlot/2 + 20, this.LABELS[type], {
      fontFamily: 'Verdana',
      fontSize: '18px',
      color: C.textMuted,
    }).setOrigin(0.5);
    container.add(label);
    
    // Интерактив
    const hitArea = this.add.rectangle(0, 0, C.equipSlot, C.equipSlot, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      if (item) this.showPopup(item, 'unequip');
    });
    hitArea.on('pointerover', () => container.setScale(1.05));
    hitArea.on('pointerout', () => container.setScale(1));
    container.add(hitArea);
    
    this.container.add(container);
    this.slotSprites[type] = { container, slotBg, icon };
  }

  // ============================================================
  //  HERO PREVIEW — Spine или fallback
  // ============================================================
  createHeroPreview(x, y) {
    const C = this.CFG;
    const boxW = C.heroBoxW;
    const boxH = C.heroBoxH;
    
    // Только подиум (тень под ногами) - БЕЗ рамки
    const pedestal = this.add.graphics();
    pedestal.fillStyle(0x000000, 0.4);
    pedestal.fillEllipse(x, y + 80, 120, 30);
    this.container.add(pedestal);
    
    // Spine герой - больше (+20%) и ниже
    if (this.game.cache?.custom?.spine?.has('hero') || this.cache?.custom?.spine?.get('hero')) {
      try {
        this.heroSpine = this.add.spine(x, y + 80, 'hero', 'idle', true);
        this.heroSpine.setScale(0.38);  // Было 0.32, +20%
        this.container.add(this.heroSpine);
      } catch (e) {
        console.warn('[INV] Spine hero failed, using fallback');
        this.createHeroFallback(x, y);
      }
    } else {
      this.createHeroFallback(x, y);
    }
    
    // Текст Warrior/Level убран
  }
  
  createHeroFallback(x, y) {
    const emoji = this.add.text(x, y + 40, '🧙‍♂️', {
      fontSize: '120px',
    }).setOrigin(0.5);
    this.container.add(emoji);
  }

  // ============================================================
  //  STATS BAR
  // ============================================================
  createStatsBar(W) {
    const C = this.CFG;
    const P = this.panelBounds;
    const barH = 100;  // 50 × 2
    const y = this.equipZoneEndY;
    
    // Фон
    const bg = this.add.graphics();
    bg.fillStyle(C.footerBg, 1);
    bg.fillRect(P.x, y, P.w, barH);
    bg.lineStyle(2, 0x1f2937, 1);
    bg.lineBetween(P.x, y, P.x + P.w, y);
    bg.lineBetween(P.x, y + barH, P.x + P.w, y + barH);
    this.container.add(bg);
    
    // Статы
    const stats = this.calculateStats();
    const statsData = [
      { icon: '❤️', value: stats.hp, label: 'HP', color: C.red },
      { icon: '⚔️', value: stats.atk, label: 'ATK', color: C.gold },
      { icon: '🛡️', value: stats.def, label: 'DEF', color: C.blue },
    ];
    
    const statW = P.w / 3;
    statsData.forEach((stat, i) => {
      const sx = P.x + statW * i + statW/2;
      const sy = y + barH/2;
      
      const val = this.add.text(sx, sy - 12, `${stat.icon} ${stat.value}`, {
        fontFamily: 'Verdana',
        fontSize: '30px',
        fontStyle: 'bold',
        color: stat.color,
      }).setOrigin(0.5);
      val.setShadow(0, 2, '#000000', 4);
      this.container.add(val);
      
      const lbl = this.add.text(sx, sy + 24, stat.label, {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: C.textMuted,
      }).setOrigin(0.5);
      this.container.add(lbl);
    });
    
    this.statsBarEndY = y + barH;
  }
  
  calculateStats() {
    let hp = 850, atk = 120, def = 75;
    Object.values(this.equipped).forEach(item => {
      if (item) {
        hp += item.hp || 0;
        atk += item.atk || 0;
        def += item.def || 0;
      }
    });
    return { hp, atk, def };
  }

  // ============================================================
  //  GRID — сетка предметов
  // ============================================================
  createGrid(W, H) {
    const C = this.CFG;
    const P = this.panelBounds;
    const startY = this.statsBarEndY + C.padding;
    
    // Заголовок
    const title = this.add.text(P.x + C.padding, startY, 'Предметы', {
      fontFamily: 'Verdana',
      fontSize: '28px',
      fontStyle: 'bold',
      color: C.textColor,
    });
    this.container.add(title);
    
    const totalSlots = C.gridCols * C.gridRows;
    const count = this.add.text(P.x + P.w - C.padding, startY, `${this.items.length}/${totalSlots}`, {
      fontFamily: 'Verdana',
      fontSize: '24px',
      color: C.textMuted,
    }).setOrigin(1, 0);
    this.container.add(count);
    this.gridCountText = count;
    
    // ===== СКРОЛЛ СЕТКА =====
    const gridStartY = startY + 50;
    const gridSlot = C.gridSlot;
    const gridGap = 8;
    
    // Видимая область (от gridStartY до низа экрана)
    const visibleH = H - gridStartY - 20;
    const visibleRows = Math.floor(visibleH / (gridSlot + gridGap));
    
    // Всего рядов для отрисовки (минимум 6)
    const totalRows = Math.max(6, Math.ceil(totalSlots / C.gridCols));
    const contentH = totalRows * (gridSlot + gridGap);
    
    // Центрируем сетку по X
    const contentW = P.w - C.padding * 2;
    const actualGridW = C.gridCols * gridSlot + (C.gridCols - 1) * gridGap;
    const gridOffsetX = (contentW - actualGridW) / 2;
    const gridStartX = P.x + C.padding + gridOffsetX + gridSlot / 2;
    
    console.log(`[INV] Grid: slot=${gridSlot}, totalRows=${totalRows}, visibleH=${visibleH}, contentH=${contentH}`);
    
    // КОНТЕЙНЕР для скролла
    this.gridContainer = this.add.container(0, gridStartY);
    
    this.gridSlots = [];
    
    // Рисуем ВСЕ ряды
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < C.gridCols; col++) {
        const i = row * C.gridCols + col;
        const x = gridStartX + col * (gridSlot + gridGap);
        const y = row * (gridSlot + gridGap) + gridSlot / 2;
        
        const item = this.items[i] || null;
        this.createGridSlot(x, y, item, i, gridSlot);
      }
    }
    
    // МАСКА (видимая область)
    const maskShape = this.add.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(P.x, gridStartY, P.w, visibleH);
    const mask = maskShape.createGeometryMask();
    this.gridContainer.setMask(mask);
    
    this.container.add(this.gridContainer);
    
    // ЗОНА для touch/drag скролла
    const scrollZone = this.add.zone(P.x + P.w/2, gridStartY + visibleH/2, P.w, visibleH);
    scrollZone.setInteractive();
    this.container.add(scrollZone);
    
    // Лимиты скролла
    const minY = gridStartY - (contentH - visibleH); // Максимум вверх
    const maxY = gridStartY; // Начальная позиция
    
    // Переменные для drag
    let isDragging = false;
    let dragStartY = 0;
    let containerStartY = 0;
    
    scrollZone.on('pointerdown', (pointer) => {
      isDragging = true;
      dragStartY = pointer.y;
      containerStartY = this.gridContainer.y;
    });
    
    this.input.on('pointermove', (pointer) => {
      if (!isDragging) return;
      
      const deltaY = pointer.y - dragStartY;
      let newY = containerStartY + deltaY;
      
      // Clamp
      newY = Phaser.Math.Clamp(newY, minY, maxY);
      this.gridContainer.y = newY;
    });
    
    this.input.on('pointerup', () => {
      isDragging = false;
    });
    
    // Mouse wheel для ПК
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      let newY = this.gridContainer.y - deltaY * 0.5;
      newY = Phaser.Math.Clamp(newY, minY, maxY);
      this.gridContainer.y = newY;
    });
  }

  // ============================================================
  //  GRID SLOT
  // ============================================================
  createGridSlot(x, y, item, index, slotSize) {
    const C = this.CFG;
    const size = slotSize || C.gridSlot;
    
    const container = this.add.container(x, y);
    
    // 1. ЧЕРНАЯ ПОДЛОЖКА (эффект глубины)
    const depth = this.add.graphics();
    depth.fillStyle(0x000000, 1);
    depth.fillRoundedRect(-size/2 + 6, -size/2 + 6, size - 12, size - 12, 6);
    container.add(depth);
    
    // 2. PNG РАМКА
    const hasSlotFrame = this.textures.exists('inv_slot_frame');
    let slotBg;
    
    if (hasSlotFrame) {
      slotBg = this.add.image(0, 0, 'inv_slot_frame');
      slotBg.setDisplaySize(size, size);
      
      // Цветная рамка ТОЛЬКО для редких предметов
      if (item && item.rarity !== 'common' && C.rarity[item.rarity]?.color) {
        slotBg.setTint(C.rarity[item.rarity].color);
      }
    } else {
      // Fallback
      slotBg = this.add.graphics();
      const borderColor = (item && item.rarity !== 'common') ? C.rarity[item.rarity]?.color || C.border : C.border;
      slotBg.fillStyle(0x2a2a35, 1);
      slotBg.fillRoundedRect(-size/2, -size/2, size, size, 12);
      slotBg.lineStyle(4, borderColor, 1);
      slotBg.strokeRoundedRect(-size/2, -size/2, size, size, 12);
    }
    container.add(slotBg);
    
    if (item) {
      // 3. ИКОНКА предмета
      const icon = this.add.text(0, -4, this.ICONS[item.type], {
        fontSize: `${Math.round(size * 0.4)}px`,
      }).setOrigin(0.5);
      container.add(icon);
      
      // 4. Уровень
      const lvl = this.add.text(size/2 - 12, size/2 - 16, item.level, {
        fontFamily: 'Verdana',
        fontSize: '20px',
        fontStyle: 'bold',
        color: C.gold,
      }).setOrigin(0.5);
      lvl.setShadow(0, 2, '#000000', 4);
      container.add(lvl);
      
      // 5. Интерактив
      const hitArea = this.add.rectangle(0, 0, size, size, 0xffffff, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this.showPopup(item, 'equip'));
      hitArea.on('pointerover', () => container.setScale(1.08));
      hitArea.on('pointerout', () => container.setScale(1));
      container.add(hitArea);
    }
    
    // Добавляем в gridContainer (для скролла)
    this.gridContainer.add(container);
    this.gridSlots.push({ container, slotBg, index });
  }

  // ============================================================
  //  POPUP
  // ============================================================
  createPopup(W, H) {
    this.popupContainer = this.add.container(W/2, H/2);
    this.popupContainer.setVisible(false);
    this.popupContainer.setDepth(100);
    
    // Создадим при показе
  }
  
  showPopup(item, action) {
    const C = this.CFG;
    const W = this.scale.width;
    const H = this.scale.height;
    
    // Очищаем старый попап
    if (this.popupContainer) this.popupContainer.destroy();
    
    this.popupContainer = this.add.container(0, 0);
    this.popupContainer.setDepth(100);
    
    // Затемнение
    const dim = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6);
    dim.setInteractive();
    dim.on('pointerdown', () => this.hidePopup());
    this.popupContainer.add(dim);
    
    // Панель попапа - БОЛЬШЕ
    const popupW = Math.min(W * 0.92, 680);
    const popupH = 280;
    const popupX = (W - popupW) / 2;
    const popupY = H - popupH - 60;
    
    const rarity = C.rarity[item.rarity] || C.rarity.common;
    
    // Фон
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x252a33, 0x252a33, C.panelBg, C.panelBg, 1);
    bg.fillRoundedRect(popupX, popupY, popupW, popupH, 24);
    bg.lineStyle(6, rarity.color, 1);
    bg.strokeRoundedRect(popupX, popupY, popupW, popupH, 24);
    this.popupContainer.add(bg);
    
    // Иконка предмета
    const iconBg = this.add.graphics();
    iconBg.fillStyle(0x1a1d24, 1);
    iconBg.fillRoundedRect(popupX + 28, popupY + 28, 100, 100, 16);
    iconBg.lineStyle(4, rarity.color, 1);
    iconBg.strokeRoundedRect(popupX + 28, popupY + 28, 100, 100, 16);
    this.popupContainer.add(iconBg);
    
    const icon = this.add.text(popupX + 78, popupY + 78, this.ICONS[item.type], {
      fontSize: '48px',
    }).setOrigin(0.5);
    this.popupContainer.add(icon);
    
    // Название
    const name = this.add.text(popupX + 150, popupY + 35, item.name, {
      fontFamily: 'Verdana',
      fontSize: '28px',
      fontStyle: 'bold',
      color: `#${rarity.color.toString(16).padStart(6, '0')}`,
    });
    name.setShadow(0, 2, '#000000', 4);
    this.popupContainer.add(name);
    
    // Мета
    const rarityNames = { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный' };
    const meta = this.add.text(popupX + 150, popupY + 72, `${rarityNames[item.rarity]} • ${this.LABELS[item.type]} • Ур.${item.level}`, {
      fontFamily: 'Verdana',
      fontSize: '18px',
      color: C.textMuted,
    });
    this.popupContainer.add(meta);
    
    // Статы предмета
    let statsStr = '';
    if (item.atk) statsStr += `⚔️+${item.atk}  `;
    if (item.def) statsStr += `🛡️+${item.def}  `;
    if (item.hp) statsStr += `❤️+${item.hp}`;
    
    if (statsStr) {
      const stats = this.add.text(popupX + 150, popupY + 105, statsStr.trim(), {
        fontFamily: 'Verdana',
        fontSize: '24px',
        color: C.textColor,
      });
      this.popupContainer.add(stats);
    }
    
    // Кнопки
    const btnY = popupY + popupH - 80;
    const btnW = (popupW - 80) / 2;
    const btnH = 60;
    
    // Кнопка действия (Надеть/Снять)
    this.createButton(
      popupX + 28, btnY, btnW, btnH,
      action === 'equip' ? '✨ Надеть' : '📤 Снять',
      0x2d6a4f, 0x40916c,
      () => action === 'equip' ? this.equipItem(item) : this.unequipItem(item)
    );
    
    // Кнопка продать
    this.createButton(
      popupX + 28 + btnW + 24, btnY, btnW, btnH,
      '💰 Продать',
      0x1a1d24, 0xD6B36A,
      () => this.sellItem(item),
      true
    );
  }
  
  createButton(x, y, w, h, text, bgColor, borderColor, callback, outline = false) {
    const btn = this.add.graphics();
    
    if (outline) {
      btn.fillStyle(0x000000, 0);
      btn.lineStyle(4, borderColor, 1);
      btn.strokeRoundedRect(x, y, w, h, 12);
    } else {
      btn.fillStyle(bgColor, 1);
      btn.fillRoundedRect(x, y, w, h, 12);
      btn.lineStyle(4, borderColor, 1);
      btn.strokeRoundedRect(x, y, w, h, 12);
    }
    this.popupContainer.add(btn);
    
    const label = this.add.text(x + w/2, y + h/2, text, {
      fontFamily: 'Verdana',
      fontSize: '24px',
      fontStyle: 'bold',
      color: outline ? `#${borderColor.toString(16).padStart(6, '0')}` : '#ffffff',
    }).setOrigin(0.5);
    this.popupContainer.add(label);
    
    const hitArea = this.add.rectangle(x + w/2, y + h/2, w, h, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', callback);
    this.popupContainer.add(hitArea);
  }
  
  hidePopup() {
    if (this.popupContainer) {
      this.popupContainer.destroy();
      this.popupContainer = null;
    }
  }

  // ============================================================
  //  ACTIONS
  // ============================================================
  equipItem(item) {
    // Если что-то надето — в инвентарь
    if (this.equipped[item.type]) {
      this.items.push(this.equipped[item.type]);
    }
    this.equipped[item.type] = item;
    this.items = this.items.filter(i => i.id !== item.id);
    
    this.hidePopup();
    this.refreshUI();
    console.log('[INV] Equipped:', item.name);
  }
  
  unequipItem(item) {
    delete this.equipped[item.type];
    this.items.push(item);
    
    this.hidePopup();
    this.refreshUI();
    console.log('[INV] Unequipped:', item.name);
  }
  
  sellItem(item) {
    this.items = this.items.filter(i => i.id !== item.id);
    Object.keys(this.equipped).forEach(type => {
      if (this.equipped[type]?.id === item.id) delete this.equipped[type];
    });
    
    this.hidePopup();
    this.refreshUI();
    console.log('[INV] Sold:', item.name);
  }
  
  refreshUI() {
    // Пересоздаём UI
    this.container.destroy();
    this.create();
  }

  // ============================================================
  //  CLOSE
  // ============================================================
  closeInventory() {
    this.hidePopup();
    this.scene.stop();
    console.log('[INV] Closed');
  }

  // ============================================================
  //  TEST DATA
  // ============================================================
  getTestItems() {
    return [
      { id: "1", type: "mainHand", rarity: "common", level: 5, name: "Железный меч", atk: 15 },
      { id: "2", type: "helmet", rarity: "rare", level: 8, name: "Шлем мага", def: 12, hp: 50 },
      { id: "3", type: "boots", rarity: "uncommon", level: 3, name: "Сапоги следопыта", def: 8 },
      { id: "4", type: "chest", rarity: "epic", level: 15, name: "Доспех дракона", def: 45, hp: 120 },
      { id: "5", type: "pants", rarity: "uncommon", level: 6, name: "Стальные поножи", def: 18 },
      { id: "6", type: "ring1", rarity: "legendary", level: 20, name: "Кольцо Феникса", atk: 30, hp: 200 },
      { id: "7", type: "gloves", rarity: "common", level: 4, name: "Перчатки воина", def: 5 },
      { id: "8", type: "necklace", rarity: "rare", level: 12, name: "Амулет мудрости", hp: 80 },
      // Дополнительные для скролла
      { id: "9", type: "offHand", rarity: "uncommon", level: 7, name: "Щит стража", def: 25 },
      { id: "10", type: "earring1", rarity: "rare", level: 10, name: "Серьга удачи", atk: 8 },
      { id: "11", type: "mainHand", rarity: "epic", level: 18, name: "Меч бури", atk: 55 },
      { id: "12", type: "helmet", rarity: "common", level: 2, name: "Кожаный шлем", def: 5 },
      { id: "13", type: "boots", rarity: "legendary", level: 25, name: "Сапоги ветра", def: 20, atk: 15 },
      { id: "14", type: "chest", rarity: "uncommon", level: 9, name: "Кольчуга", def: 30 },
      { id: "15", type: "gloves", rarity: "rare", level: 11, name: "Перчатки вора", atk: 12 },
      { id: "16", type: "ring2", rarity: "epic", level: 16, name: "Кольцо силы", atk: 25 },
    ];
  }
}

// ============================================================
//  EXPORT
// ============================================================
window.InventoryScene = InventoryScene;

console.log('[InventoryScene] v14 SCROLL+PNG loaded');
