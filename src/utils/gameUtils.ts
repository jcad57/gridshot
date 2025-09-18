/**
 * Game utility functions for coordinate generation and score calculation
 */

export interface Coordinate {
  x: number;
  y: number;
}

export interface ScoreResult {
  distance: number;
  score: number;
}

/**
 * Generate a random coordinate within the given grid size
 * @param maxCoord - Maximum coordinate value (grid size)
 * @returns Random coordinate object
 */
export function getRandomCoord(maxCoord: number): Coordinate {
  // Range: 1 to maxCoord (inclusive)
  const x = Math.floor(Math.random() * maxCoord) + 1;
  const y = Math.floor(Math.random() * maxCoord) + 1;
  return { x, y };
}

/**
 * Calculate score based on distance from target
 * @param clicked - The coordinate that was clicked
 * @param target - The target coordinate
 * @returns Score result with distance and score
 */
export function calculateScore(clicked: Coordinate, target: Coordinate): ScoreResult {
  // Euclidean distance
  const dx = clicked.x - target.x;
  const dy = clicked.y - target.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  // Score: 100 if perfect, 0 if distance >= 100, linear in between
  const score = Math.max(0, Math.round(100 - distance));
  return { distance, score };
}

/**
 * Generate a fun message based on the score
 * @param score - The score achieved
 * @returns Fun message string
 */
export function getScoreMessage(score: number): string {
  if (score === 100) {
    return "🎯 Bullseye! You nailed it!";
  } else if (score >= 90) {
    return "🔥 So close! You're a gridshot pro!";
  } else if (score >= 70) {
    return "👍 Great shot! Just a bit off.";
  } else if (score >= 40) {
    return "😅 Not bad! Try to get closer next time.";
  } else if (score > 0) {
    return "🧐 Oof! That was a tough one. Keep trying!";
  } else {
    return "💥 Way off! But don't give up!";
  }
}

/**
 * Check if a score qualifies as a high score
 * @param score - The score to check
 * @returns True if score is 90 or higher
 */
export function isHighScore(score: number): boolean {
  return score >= 90;
}

/**
 * Check if a score qualifies as a bullseye
 * @param score - The score to check
 * @returns True if score is exactly 100
 */
export function isBullseye(score: number): boolean {
  return score === 100;
}

/**
 * Check if a score qualifies for streak freeze
 * @param score - The score to check
 * @returns True if score is 95 or higher
 */
export function qualifiesForStreakFreeze(score: number): boolean {
  return score >= 95;
}

/**
 * Check if a score qualifies for level jump powerup
 * @param score - The score to check
 * @returns True if score is 97 or higher
 */
export function qualifiesForLevelJump(score: number): boolean {
  return score >= 97;
}
