"use strict";

// ============================================================
//  API CLIENT — Связь игры с сервером
// ============================================================

const API_URL = 'https://pocketchronicle.ru';

let authToken = null;
let currentUser = null;

/**
 * Авторизация через Telegram
 */
async function apiAuth() {
  try {
    // Получаем initData от Telegram WebApp
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || '';

    console.log('[API] Auth starting...', initData ? 'has initData' : 'no initData');

    const response = await fetch(`${API_URL}/api/v1/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    });

    if (!response.ok) {
      throw new Error('Auth failed: ' + response.status);
    }

    const data = await response.json();
    authToken = data.token;
    currentUser = data.user;

    // Сохраняем токен
    localStorage.setItem('pc_token', authToken);

    console.log('[API] Auth success:', currentUser);
    return { success: true, user: currentUser };

  } catch (error) {
    console.error('[API] Auth error:', error);

    // Пробуем использовать сохранённый токен
    const savedToken = localStorage.getItem('pc_token');
    if (savedToken) {
      authToken = savedToken;
      return apiGetProfile();
    }

    return { success: false, error: error.message };
  }
}

/**
 * Получить профиль
 */
async function apiGetProfile() {
  try {
    const response = await fetch(`${API_URL}/api/v1/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) throw new Error('Profile failed');

    const data = await response.json();
    currentUser = data.user;

    return { success: true, user: data.user, progress: data.progress };

  } catch (error) {
    console.error('[API] Profile error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Сохранить прогресс
 */
async function apiSaveProgress(progressData) {
  try {
    const response = await fetch(`${API_URL}/api/v1/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(progressData)
    });

    if (!response.ok) throw new Error('Save failed');

    console.log('[API] Progress saved');
    return { success: true };

  } catch (error) {
    console.error('[API] Save error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Получить лидерборд
 */
async function apiGetLeaderboard(tab = 'rating') {
  try {
    const response = await fetch(`${API_URL}/api/v1/leaderboard?tab=${tab}`);

    if (!response.ok) throw new Error('Leaderboard failed');

    const data = await response.json();
    return { success: true, leaderboard: data.leaderboard };

  } catch (error) {
    console.error('[API] Leaderboard error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Получить текущего юзера
 */
function apiGetCurrentUser() {
  return currentUser;
}

/**
 * Проверить авторизован ли
 */
function apiIsAuthenticated() {
  return !!authToken;
}

// Экспорт
window.apiAuth = apiAuth;
window.apiGetProfile = apiGetProfile;
window.apiSaveProgress = apiSaveProgress;
window.apiGetLeaderboard = apiGetLeaderboard;
window.apiGetCurrentUser = apiGetCurrentUser;
window.apiIsAuthenticated = apiIsAuthenticated;

console.log('[ApiClient] Loaded, API_URL:', API_URL);
