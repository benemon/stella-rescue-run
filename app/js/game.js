/**
 * game.js - Game state machine
 * Manages transitions between: mission → planning → launching → results
 */

import { getLevels, getLevel } from './missions.js';
import { initMap, clearMap, setPlanningMode, setLaunchMode } from './map.js';
import { createMissionRocket } from './rocket.js';
import { calibrateFuel, calculateStarRating } from './scoring.js';

// Game state
let currentLevelIndex = 0;
let currentLevel = null;
let currentGeneratedPlanets = null; // Store generated planets for random levels (for replay)
let gameState = 'mission'; // mission | planning | launching | results
let plannedRoute = []; // Array of planet indices
let completedRoute = null; // Last successful route for ghost trail
let fuelCostPerPixel = 0;
let fuelStart = 1.0;
let bestDist = 0;
let worstDist = 0;

// DOM elements
const titleScreen = document.getElementById('title-screen');
const missionScreen = document.getElementById('mission-screen');
const mapScreen = document.getElementById('map-screen');
const resultsScreen = document.getElementById('results-screen');
const failureOverlay = document.getElementById('failure-overlay');
const infoModal = document.getElementById('info-modal');

const titleRocketContainer = document.getElementById('title-rocket');
const startGameBtn = document.getElementById('start-game-btn');
const titleInfoBtn = document.getElementById('title-info-btn');

const missionText = document.getElementById('mission-text');
const missionLevelIndicator = document.getElementById('mission-level-indicator');
const astronautRow = document.getElementById('astronaut-row');
const fuelWarning = document.getElementById('fuel-warning');
const startPlanningBtn = document.getElementById('start-planning-btn');
const closeInfoBtn = document.getElementById('close-info-btn');
const mapLevelIndicator = document.getElementById('map-level-indicator');

const launchBtn = document.getElementById('launch-btn');
const replayBtn = document.getElementById('replay-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const startOverBtn = document.getElementById('start-over-btn');
const tryAgainBtn = document.getElementById('try-again-btn');

/**
 * Initialize the game
 */
export function initGame() {
  console.log('[Game] Initializing game...');
  currentLevelIndex = 0;
  attachEventListeners();
  showTitleScreen();
  console.log('[Game] Game initialized');
}

/**
 * Attach global event listeners
 */
function attachEventListeners() {
  startGameBtn.addEventListener('click', () => loadLevel(0));
  titleInfoBtn.addEventListener('click', showInfoModal);
  startPlanningBtn.addEventListener('click', startPlanning);
  launchBtn.addEventListener('click', launchRocket);
  replayBtn.addEventListener('click', replayLevel);
  nextLevelBtn.addEventListener('click', loadNextLevel);
  startOverBtn.addEventListener('click', startOver);
  tryAgainBtn.addEventListener('click', dismissFailure);
  closeInfoBtn.addEventListener('click', hideInfoModal);
  // Close modal when clicking outside
  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) hideInfoModal();
  });
}

/**
 * Show the title screen
 */
function showTitleScreen() {
  titleScreen.classList.remove('hidden');
  missionScreen.classList.add('hidden');
  mapScreen.classList.add('hidden');
  resultsScreen.classList.add('hidden');
  failureOverlay.classList.add('hidden');

  // Render title rocket
  titleRocketContainer.innerHTML = '';
  const rocketSVG = createMissionRocket();
  titleRocketContainer.appendChild(rocketSVG);
}

/**
 * Load a level and show mission screen
 */
function loadLevel(levelIndex, forceRegenerate = true, skipMission = false) {
  // Clear state if moving to a different level
  if (levelIndex !== currentLevelIndex) {
    completedRoute = null;
    currentGeneratedPlanets = null;
  }

  // Generate new planets for random levels, or reuse existing
  if (forceRegenerate) {
    currentGeneratedPlanets = null; // Force regeneration
  }

  currentLevel = getLevel(levelIndex, currentGeneratedPlanets);

  // Store generated planets for random levels
  if (currentLevel.wasGenerated) {
    currentGeneratedPlanets = currentLevel.planets;
  }

  currentLevelIndex = levelIndex;
  gameState = 'mission';
  plannedRoute = [];
  fuelStart = currentLevel.fuelStart;

  if (skipMission) {
    // Skip mission briefing, go straight to planning
    startPlanning();
  } else {
    showMissionScreen();
  }
}

/**
 * Show the mission briefing screen
 */
function showMissionScreen() {
  // Show/hide screens
  titleScreen.classList.add('hidden');
  missionScreen.classList.remove('hidden');
  mapScreen.classList.add('hidden');
  resultsScreen.classList.add('hidden');
  failureOverlay.classList.add('hidden');

  // Fuel warning
  if (currentLevel.fuelStart < 1.0) {
    fuelWarning.classList.remove('hidden');
    const percentage = Math.round(currentLevel.fuelStart * 100);
    fuelWarning.querySelector('.warning-text').textContent =
      `Tank is ${percentage}% full!`;
  } else {
    fuelWarning.classList.add('hidden');
  }

  // Level indicator
  missionLevelIndicator.textContent = `Mission ${currentLevelIndex + 1}: ${currentLevel.name}`;

  // Mission text
  missionText.textContent = currentLevel.missionText ||
    `Rescue ${currentLevel.planets.length} stranded astronauts!`;

  // Astronaut badges
  astronautRow.innerHTML = '';
  currentLevel.planets.forEach(planet => {
    const badge = document.createElement('div');
    badge.className = 'astronaut-badge';
    badge.innerHTML = `
      <div class="astronaut-icon" style="background: ${planet.color || '#64a0ff'}22; border-color: ${planet.color || '#64a0ff'}">
        👨‍🚀
      </div>
      <div class="astronaut-name">${planet.crew}</div>
    `;
    astronautRow.appendChild(badge);
  });
}

/**
 * Start planning phase
 */
function startPlanning() {
  console.log('[Game] Starting planning phase...', currentLevel);
  gameState = 'planning';

  missionScreen.classList.add('hidden');
  mapScreen.classList.remove('hidden');
  resultsScreen.classList.add('hidden');
  failureOverlay.classList.add('hidden');

  // Level indicator
  mapLevelIndicator.textContent = `Mission ${currentLevelIndex + 1}: ${currentLevel.name}`;

  // Initialize the map
  initMap(currentLevel, {
    onPlanetClick: handlePlanetClick,
    onUndo: handleUndo,
    onClear: handleClear,
    ghostTrail: completedRoute,
    fuelStart: fuelStart
  });

  setPlanningMode();
  console.log('[Game] Planning mode active');
}

/**
 * Handle planet click during planning
 */
function handlePlanetClick(planetIndex) {
  console.log('[Game] Planet clicked:', planetIndex, 'gameState:', gameState);
  if (gameState !== 'planning') return;

  // Check if planet already in route
  if (plannedRoute.includes(planetIndex)) {
    console.log('[Game] Planet already in route');
    return;
  }

  plannedRoute.push(planetIndex);
  console.log('[Game] Route updated:', plannedRoute);

  // Update UI - this will be handled by map.js
  // Enable launch button when all planets visited
  if (plannedRoute.length === currentLevel.planets.length) {
    launchBtn.disabled = false;
    console.log('[Game] All planets visited, launch enabled');
  }
}

/**
 * Handle undo last planet
 */
function handleUndo() {
  if (gameState !== 'planning' || plannedRoute.length === 0) return;

  plannedRoute.pop();
  launchBtn.disabled = true;
}

/**
 * Handle clear route
 */
function handleClear() {
  if (gameState !== 'planning') return;

  plannedRoute = [];
  launchBtn.disabled = true;
}

/**
 * Launch the rocket
 */
function launchRocket() {
  if (gameState !== 'planning') return;
  if (plannedRoute.length !== currentLevel.planets.length) return;

  gameState = 'launching';

  // Calibrate fuel for this level
  const calibration = calibrateFuel(currentLevel, plannedRoute);
  fuelCostPerPixel = calibration.fuelCostPerPixel;
  bestDist = calibration.bestDist;
  worstDist = calibration.worstDist;

  // Switch to launch mode
  setLaunchMode(plannedRoute, {
    fuelCostPerPixel,
    fuelStart,
    onComplete: handleFlightComplete,
    onFuelFailure: handleFuelFailure
  });
}

/**
 * Handle successful flight completion
 */
function handleFlightComplete(finalFuel) {
  gameState = 'results';
  completedRoute = [...plannedRoute]; // Save for ghost trail

  // Calculate star rating (relative to level difficulty)
  const stars = calculateStarRating(finalFuel, fuelStart, bestDist, worstDist, fuelCostPerPixel);

  showResultsScreen(stars, finalFuel);
}

/**
 * Handle fuel failure
 */
function handleFuelFailure(planetsReached) {
  gameState = 'failure';
  showFailureScreen(planetsReached);
}

/**
 * Show results screen
 */
function showResultsScreen(stars, finalFuel) {
  mapScreen.classList.add('hidden');
  resultsScreen.classList.remove('hidden');

  const resultsTitle = document.getElementById('results-title');
  const starRating = document.getElementById('star-rating');
  const resultsMessage = document.getElementById('results-message');
  const levels = getLevels();
  const isFinalLevel = currentLevelIndex >= levels.length - 1;

  if (isFinalLevel) {
    // Special victory message for completing all levels
    resultsTitle.textContent = 'All Missions Complete! 🎉';
    starRating.textContent = '⭐'.repeat(stars);
    resultsMessage.textContent =
      `Congratulations! You've learned to find the shortest path! ` +
      `By finding efficient routes that minimise distance, you've mastered a skill that ` +
      `helps plan delivery routes, design circuit boards, and sequence DNA in the real world. ` +
      `Every route you optimised made you a better problem solver!`;

    // Show start over button instead of next level
    nextLevelBtn.classList.add('hidden');
    startOverBtn.classList.remove('hidden');
  } else {
    // Normal level completion
    resultsTitle.textContent = 'Mission Complete!';
    starRating.textContent = '⭐'.repeat(stars);

    // Messages based on stars
    const messages = [
      '', // 0 stars (shouldn't happen)
      'You made it! Try finding a shorter route next time.',
      'Good job! Can you save even more fuel?',
      'Great work! That was a smart route.',
      'Excellent! Stella used very little fuel.',
      'Perfect! You found the best route possible!'
    ];
    resultsMessage.textContent = messages[stars] || messages[3];

    // Show next level button
    nextLevelBtn.classList.remove('hidden');
    startOverBtn.classList.add('hidden');
  }
}

/**
 * Show failure screen
 */
function showFailureScreen(planetsReached) {
  failureOverlay.classList.remove('hidden');

  const crewStatus = document.getElementById('crew-status');
  crewStatus.innerHTML = '';

  currentLevel.planets.forEach((planet, index) => {
    const rescued = planetsReached.includes(index);
    const item = document.createElement('div');
    item.className = 'crew-item';
    item.innerHTML = `
      <span class="crew-icon">${rescued ? '✓' : '✗'}</span>
      <span class="crew-name" style="color: ${rescued ? '#2ecc71' : '#e74c3c'}">${planet.crew}</span>
      <span class="crew-planet">${planet.name}</span>
    `;
    crewStatus.appendChild(item);
  });
}

/**
 * Dismiss failure overlay and return to planning
 */
function dismissFailure() {
  failureOverlay.classList.add('hidden');
  plannedRoute = [];
  gameState = 'planning';

  // Reinitialize map in planning mode
  initMap(currentLevel, {
    onPlanetClick: handlePlanetClick,
    onUndo: handleUndo,
    onClear: handleClear,
    ghostTrail: completedRoute,
    fuelStart: fuelStart
  });
  setPlanningMode();
}

/**
 * Replay current level (keep same planet layout)
 */
function replayLevel() {
  loadLevel(currentLevelIndex, false, true); // Don't regenerate, skip mission
}

/**
 * Load next level (generate fresh planet layout)
 */
function loadNextLevel() {
  const levels = getLevels();
  if (currentLevelIndex < levels.length - 1) {
    loadLevel(currentLevelIndex + 1, true); // Force regenerate
  }
}

/**
 * Start over from level 0
 */
function startOver() {
  loadLevel(0, true, false); // Load level 0, regenerate, show mission
}

/**
 * Show info modal
 */
function showInfoModal() {
  infoModal.classList.remove('hidden');
}

/**
 * Hide info modal
 */
function hideInfoModal() {
  infoModal.classList.add('hidden');
}

/**
 * Export current state for map module
 */
export function getGameState() {
  return gameState;
}

export function getPlannedRoute() {
  return plannedRoute;
}
