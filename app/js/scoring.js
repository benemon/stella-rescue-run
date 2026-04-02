/**
 * scoring.js - Fuel model and star rating
 */

import { computeBestWorstDistances } from './missions.js';

const HOME_X = 100;
const HOME_Y = 300;

/**
 * Calibrate fuel cost per pixel for a level
 */
export function calibrateFuel(level, plannedRoute) {
  const planets = level.planets;
  const fuelStart = level.fuelStart;
  const allowFuelFailure = level.allowFuelFailure || false;

  // Compute best and worst possible distances
  const { bestDist, worstDist } = computeBestWorstDistances(planets, HOME_X, HOME_Y);

  let fuelCostPerPixel;

  if (fuelStart === 1.0) {
    // Training levels: worst route barely completes (~5% remaining)
    fuelCostPerPixel = (fuelStart * 0.95) / worstDist;
  } else {
    // Constrained levels: calibrate to create meaningful star differentiation
    // Best route uses 60% of fuel (leaves 40% = 5 stars)
    fuelCostPerPixel = (fuelStart * 0.60) / bestDist;

    // Safety check: ensure worst route can still complete (unless failure is allowed)
    if (!allowFuelFailure) {
      const worstFuelRemaining = fuelStart - worstDist * fuelCostPerPixel;
      if (worstFuelRemaining < 0.05 * fuelStart) {
        // If worst route would use >95% fuel, scale back to guarantee 5% remaining
        fuelCostPerPixel = (fuelStart * 0.95) / worstDist;
      }
    }
  }

  return {
    fuelCostPerPixel,
    bestDist,
    worstDist
  };
}

/**
 * Calculate fuel usage for a given distance
 */
export function calculateFuelUsage(distanceTraveled, fuelCostPerPixel) {
  return distanceTraveled * fuelCostPerPixel;
}

/**
 * Calculate current fuel remaining
 */
export function calculateCurrentFuel(fuelStart, distanceTraveled, fuelCostPerPixel) {
  return Math.max(0, fuelStart - distanceTraveled * fuelCostPerPixel);
}

/**
 * Calculate star rating based on fuel remaining
 * Uses relative performance: best possible route = 5 stars, worst = 1 star
 */
export function calculateStarRating(finalFuel, fuelStart, bestDist, worstDist, fuelCostPerPixel) {
  // Calculate fuel remaining for best and worst possible routes
  const bestFuelRemaining = fuelStart - bestDist * fuelCostPerPixel;
  const worstFuelRemaining = fuelStart - worstDist * fuelCostPerPixel;

  console.log('[Scoring] Star rating calculation:', {
    finalFuel,
    fuelStart,
    bestDist,
    worstDist,
    fuelCostPerPixel,
    bestFuelRemaining,
    worstFuelRemaining
  });

  // Edge case: if routes don't vary much, give bonus for completion
  const range = bestFuelRemaining - worstFuelRemaining;
  if (range < 0.01 * fuelStart) {
    console.log('[Scoring] Low variation between routes, giving completion bonus');
    return finalFuel > worstFuelRemaining ? 5 : 3;
  }

  // Player's performance as a percentage between worst (0%) and best (100%)
  const performance = (finalFuel - worstFuelRemaining) / range;

  console.log('[Scoring] Performance:', performance, 'Range:', range);

  // Map performance to star rating
  // Give some tolerance - don't require perfection for 5 stars
  if (performance >= 0.90) return 5; // Within 10% of optimal
  if (performance >= 0.70) return 4; // Within 30% of optimal
  if (performance >= 0.45) return 3; // Better than halfway
  if (performance >= 0.20) return 2; // At least made progress
  return 1; // Completed but poor route
}

/**
 * Calculate distance of a complete route
 */
export function calculateRouteDistance(planets, routeIndices, homeX = HOME_X, homeY = HOME_Y) {
  let totalDist = 0;
  let prevX = homeX;
  let prevY = homeY;

  // Visit each planet in route order
  for (const idx of routeIndices) {
    const planet = planets[idx];
    totalDist += Math.hypot(planet.x - prevX, planet.y - prevY);
    prevX = planet.x;
    prevY = planet.y;
  }

  // Return home
  totalDist += Math.hypot(homeX - prevX, homeY - prevY);

  return totalDist;
}
