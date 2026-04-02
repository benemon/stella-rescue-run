/**
 * main.js - Entry point
 * Initialises the game and registers the service worker
 */

console.log('[Main] Module loading...');

import { initGame } from './game.js';

console.log('[Main] Module loaded, imports successful');

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initGame();
});
