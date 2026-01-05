// ============================================================
//  LEADERBOARD BUTTON — Добавить в game.js
// ============================================================

// 1. Загрузка текстуры (добавь в preload):
// this.load.image('btn_rating', 'assets/ui/raiting.png');

// 2. Создание кнопки (добавь в create после bottomUI):
function createLeaderboardButton(scene) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  
  // Позиция — справа, выше bottomUI
  const btnX = W - 80;
  const btnY = H - 350;  // Над bottomUI
  
  // Кнопка
  if (scene.textures.exists('btn_rating')) {
    const btn = scene.add.image(btnX, btnY, 'btn_rating');
    btn.setDisplaySize(120, 120);
    btn.setInteractive({ useHandCursor: true });
    
    // Hover эффект
    btn.on('pointerover', () => {
      btn.setScale(1.1);
    });
    btn.on('pointerout', () => {
      btn.setScale(1);
    });
    
    // Клик — открываем Leaderboard
    btn.on('pointerdown', () => {
      btn.setScale(0.95);
      scene.scene.launch('LeaderboardScene');
    });
    btn.on('pointerup', () => {
      btn.setScale(1.1);
    });
    
    // Shadow/glow эффект (опционально)
    btn.setDepth(50);
    
    console.log('[GAME] Leaderboard button created');
    return btn;
  } else {
    console.warn('[GAME] btn_rating texture not found!');
    return null;
  }
}

// 3. Регистрация сцены (добавь в game config или после создания игры):
// game.scene.add('LeaderboardScene', LeaderboardScene);

// ============================================================
//  ПОЛНЫЙ ПРИМЕР ИНТЕГРАЦИИ В game.js:
// ============================================================
/*

// В preload():
this.load.image('btn_rating', 'assets/ui/raiting.png');
this.load.image('icon_golden_cup', 'assets/ui/golden_cup.png');
this.load.image('icon_pvp', 'assets/ui/pvp_1.png');

// После создания игры:
game.scene.add('LeaderboardScene', LeaderboardScene);

// В create(), после bottomUI:
createLeaderboardButton(this);

// Или inline:
const ratingBtn = this.add.image(this.scale.width - 80, this.scale.height - 350, 'btn_rating');
ratingBtn.setDisplaySize(120, 120);
ratingBtn.setInteractive({ useHandCursor: true });
ratingBtn.on('pointerdown', () => {
  this.scene.launch('LeaderboardScene');
});

*/

// Export
window.createLeaderboardButton = createLeaderboardButton;
console.log('[LeaderboardButton] Helper loaded');
