"use strict";

// ============================================================
//  PRE-ENTRY SYSTEM — Loader + Intro Screen
// ============================================================

(function() {
  var loadingPhrases = [
    "Полируем доспехи...",
    "Заряжаем соулшоты...",
    "Ищем баффера в пати...",
    "Телепорт в Giran готовится...",
    "Проверяем заточку...",
    "Настраиваем макросы...",
    "Торгуемся в Giran Harbor...",
    "Ждём ПК на мосту...",
    "Собираем пати на РБ...",
    "Учим новые скиллы..."
  ];

  var currentPhraseIndex = 0;
  var phraseInterval = null;

  function startPhraseRotation() {
    var textEl = document.querySelector('.pre-loading-text');
    if (!textEl) return;

    textEl.textContent = loadingPhrases[0];

    phraseInterval = setInterval(function() {
      currentPhraseIndex = (currentPhraseIndex + 1) % loadingPhrases.length;
      textEl.textContent = loadingPhrases[currentPhraseIndex];
    }, 2000);
  }

  function stopPhraseRotation() {
    if (phraseInterval) {
      clearInterval(phraseInterval);
      phraseInterval = null;
    }
  }

  function setProgress(value) {
    var fill = document.querySelector('.pre-progress-fill');
    if (fill) {
      var percent = Math.min(100, Math.max(0, value * 100));
      fill.style.width = percent + '%';
    }
  }

  function showIntro(onStartCallback) {
    stopPhraseRotation();

    var loader = document.getElementById('preLoader');
    var intro = document.getElementById('preIntro');
    var btn = document.querySelector('.pre-intro-btn');

    if (loader) loader.classList.add('hidden');
    if (intro) intro.classList.add('visible');

    if (btn && onStartCallback) {
      btn.onclick = function() {
        btn.disabled = true;
        btn.textContent = 'ЗАГРУЗКА...';
        onStartCallback();
      };
    }
  }

  function hide() {
    var overlay = document.getElementById('preEntry');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(function() {
        overlay.classList.add('removed');
      }, 500);
    }
    stopPhraseRotation();
  }

  function skip() {
    hide();
  }

  function showLoading() {
    var textEl = document.querySelector('.pre-loading-text');
    var progressContainer = document.querySelector('.pre-progress-container');
    if (textEl) textEl.textContent = 'Подготовка мира...';
    if (progressContainer) progressContainer.style.display = 'block';
  }

  function init() {
    startPhraseRotation();
  }

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.preEntry = {
    setProgress: setProgress,
    showIntro: showIntro,
    showLoading: showLoading,
    hide: hide,
    skip: skip
  };

})();
