"use strict";

// ============================================================
//  SPINE ANIMATIONS — Hero animation system
// ============================================================

// Play animation on Spine hero
function playAnim(animName, loop) {
  if (!window.spineHero) return false;
  try {
    window.spineHero.play(animName, loop);
    return true;
  } catch(e) {
    console.warn("[Spine] Animation not found:", animName);
    return false;
  }
}

// Hero attack animation
function heroAttack() {
  if (!window.spineHero) return;
  if (playAnim('attack', false)) {
    setTimeout(function() { heroIdle(); }, 400);
  }
}

// Hero hit (damage received)
function heroHit() {
  if (!window.spineHero) return;
  if (playAnim('fall', false)) {
    setTimeout(function() { heroIdle(); }, 200);
  }
}

// Hero death
function heroDeath() {
  if (!window.spineHero) return;
  playAnim('fall', false);
}

// Hero running
function heroRun() {
  if (!window.spineHero) return;
  playAnim('run', true);
}

// Hero walking
function heroWalk() {
  if (!window.spineHero) return;
  playAnim('walk', true);
}

// Hero idle
function heroIdle() {
  if (!window.spineHero) return;
  playAnim('idle', true);
}

// Hero sitting/resting
function heroCrouch() {
  if (!window.spineHero) return;
  playAnim('crouch', true);
}

// Hero jump
function heroJump() {
  if (!window.spineHero) return;
  if (playAnim('jump', false)) {
    setTimeout(function() { heroIdle(); }, 500);
  }
}

// Critical hit combo (jump → attack → idle)
function heroCriticalHit() {
  if (!window.spineHero) return;
  if (playAnim('jump', false)) {
    setTimeout(function() {
      if (playAnim('attack', false)) {
        setTimeout(function() { heroIdle(); }, 400);
      }
    }, 300);
  }
}

// Enter location animation (run → idle)
function heroEnterLocation() {
  if (!window.spineHero) return;
  playAnim('run', true);
  setTimeout(function() { heroIdle(); }, 1000);
}

// Head turn (for city idle)
function heroHeadTurn() {
  if (!window.spineHero) return;
  if (playAnim('head-turn', false)) {
    setTimeout(function() { heroIdle(); }, 1500);
  }
}

// Move hero to position
function moveHeroTo(x, y, anim) {
  if (window.spineHero) {
    window.spineHero.setPosition(x, y);
    window.spineHero.setVisible(true);
    if (anim) {
      playAnim(anim, true);
    } else {
      heroIdle();
    }
  }
}

// Hide hero
function hideHero() {
  if (window.spineHero) window.spineHero.setVisible(false);
}

console.log("[SpineAnimations] Module loaded");
