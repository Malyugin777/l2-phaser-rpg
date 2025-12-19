"use strict";

// ============================================================
//  UI CONSTANTS — Константы для мобильного экрана 780×1688
// ============================================================

// Размеры экрана (2x от iPhone 14 Pro)
var UI_WIDTH = 780;
var UI_HEIGHT = 1688;

// Safe Area (отступы от краёв для TMA) - doubled
var SAFE_TOP = 134;      // отступ сверху (шапка Telegram)
var SAFE_BOTTOM = 168;   // отступ снизу (жесты/кнопка)
var SAFE_LEFT = 32;      // отступ слева
var SAFE_RIGHT = 32;     // отступ справа

// Центры
var CENTER_X = 390;      // UI_WIDTH / 2
var CENTER_Y = 844;      // UI_HEIGHT / 2

// Игровая область (между safe areas)
var GAME_AREA_TOP = 294;     // SAFE_TOP + 160 (место для HP/MP баров)
var GAME_AREA_BOTTOM = 1380; // UI_HEIGHT - SAFE_BOTTOM - 140
var GAME_AREA_HEIGHT = 1086; // GAME_AREA_BOTTOM - GAME_AREA_TOP
var GAME_AREA_CENTER_Y = 837; // (GAME_AREA_TOP + GAME_AREA_BOTTOM) / 2

// Нижний док (кнопки управления)
var BOTTOM_DOCK_Y = 1380;
var BOTTOM_DOCK_HEIGHT = 140;

// Панели
var PANEL_WIDTH = 700;
var PANEL_HEIGHT = 800;
var PANEL_X = CENTER_X;
var PANEL_Y = GAME_AREA_CENTER_Y;

// Кнопки нижнего дока
var DOCK_BTN_WIDTH = 220;
var DOCK_BTN_HEIGHT = 80;
var DOCK_BTN_GAP = 20;

// Скилл кнопки (над доком)
var SKILL_BTN_Y = BOTTOM_DOCK_Y - 120;
var SKILL_BTN_WIDTH = 160;
var SKILL_BTN_HEIGHT = 100;

// Верхний бар (статы)
var TOP_BAR_Y = SAFE_TOP + 20;
var TOP_BAR_LINE_HEIGHT = 40;

// Location навигация
var LOC_NAV_Y = SAFE_TOP + 160;
var LOC_ARROW_OFFSET = 300; // от центра

// NPC кнопки в городе
var NPC_BTN_WIDTH = 200;
var NPC_BTN_HEIGHT = 90;
