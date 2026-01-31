/**
 * Simplified SpawnCycleValidator
 * - No cycle tracking or geometry ownership
 * - Only validates category membership and returns a random pool element
 */
export class SpawnCycleValidator {
  constructor() {}

  getRandomFromPool(pool) {
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  validateCategory(category, availableCategories = []) {
    if (!category || !availableCategories.includes(category)) {
      return 'input';
    }
    return category;
  }
}

export const spawnCycleValidator = new SpawnCycleValidator();
