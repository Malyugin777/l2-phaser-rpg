"use strict";

// ============================================================
//  UI CONSTANTS — Константы для мобильного экрана 390×844
// ============================================================

// Размеры экрана
var UI_WIDTH = 390;
var UI_HEIGHT = 844;

// Safe Area (отступы от краёв для TMA)
var SAFE_TOP = 67;      // отступ сверху (шапка Telegram)
var SAFE_BOTTOM = 84;   // отступ снизу (жесты/кнопка)
var SAFE_LEFT = 16;     // отступ слева
var SAFE_RIGHT = 16;    // отступ справа

// Центры
var CENTER_X = 195;     // UI_WIDTH / 2
var CENTER_Y = 422;     // UI_HEIGHT / 2

// Игровая область (между safe areas)
var GAME_AREA_TOP = 147;    // SAFE_TOP + 80 (место для HP/MP баров)
var GAME_AREA_BOTTOM = 690; // UI_HEIGHT - SAFE_BOTTOM - 70
var GAME_AREA_HEIGHT = 543; // GAME_AREA_BOTTOM - GAME_AREA_TOP
var GAME_AREA_CENTER_Y = 418; // (GAME_AREA_TOP + GAME_AREA_BOTTOM) / 2

// Нижний док (кнопки управления)
var BOTTOM_DOCK_Y = 690;
var BOTTOM_DOCK_HEIGHT = 70;

// Панели
var PANEL_WIDTH = 350;
var PANEL_HEIGHT = 400;
var PANEL_X = CENTER_X;
var PANEL_Y = GAME_AREA_CENTER_Y;

// Кнопки нижнего дока
var DOCK_BTN_WIDTH = 110;
var DOCK_BTN_HEIGHT = 40;
var DOCK_BTN_GAP = 10;

// Скилл кнопки (над доком)
var SKILL_BTN_Y = BOTTOM_DOCK_Y - 60;
var SKILL_BTN_WIDTH = 80;
var SKILL_BTN_HEIGHT = 50;

// Верхний бар (статы)
var TOP_BAR_Y = SAFE_TOP + 10;
var TOP_BAR_LINE_HEIGHT = 20;

// Location навигация
var LOC_NAV_Y = SAFE_TOP + 80;
var LOC_ARROW_OFFSET = 150; // от центра

// NPC кнопки в городе
var NPC_BTN_WIDTH = 100;
var NPC_BTN_HEIGHT = 45;
