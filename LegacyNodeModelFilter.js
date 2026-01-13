/**
 * LEGACY NODE MODEL FILTER v1.0
 * 
 * Prevents legacy node models that use aura-as-body visuals from spawning.
 * These models would visually collapse into a full aura after linking, violating
 * core dominance rules.
 * 
 * PROBLEM MODELS (Historical):
 * - 'sigma' (old naming): Full-disk aura, no distinct core
 * - Any model using old aura-body fusion approach
 * 
 * SOLUTION:
 * - Redirect 'sigma' to 'quantum' (enhanced version with proper core)
 * - Block any attempt to spawn unstable models
 * - Log redirects for debugging
 */

export class LegacyNodeModelFilter {
  // Maps of problematic models and their safe replacements
  static LEGACY_MODEL_MAPPING = {
    'sigma': 'quantum',           // Old sigma → quantum (enhanced)
  };

  // Models marked as unstable (complete core/aura collapse)
  static UNSTABLE_MODELS = new Set([
    // Empty - all problematic models have safe replacements
  ]);

  /**
   * Check if a category is a legacy model that needs redirection
   * @param {string} category - Node category to check
   * @returns {object} { isLegacy, redirect, reason }
   */
  static checkLegacyModel(category) {
    const normalized = (category || '').toLowerCase().trim();

    // Check if it's a known legacy model
    if (this.LEGACY_MODEL_MAPPING[normalized]) {
      return {
        isLegacy: true,
        redirect: this.LEGACY_MODEL_MAPPING[normalized],
        reason: `Legacy model '${normalized}' redirected to '${this.LEGACY_MODEL_MAPPING[normalized]}'`,
        stable: true  // Has safe replacement
      };
    }

    // Check if it's an unstable model (no replacement)
    if (this.UNSTABLE_MODELS.has(normalized)) {
      return {
        isLegacy: true,
        blocked: true,
        reason: `Model '${normalized}' is unstable and cannot spawn`,
        stable: false
      };
    }

    // Not a legacy model
    return {
      isLegacy: false,
      category: normalized,
      stable: true
    };
  }

  /**
   * Get safe category for a potentially problematic model
   * @param {string} category - Requested category
   * @returns {string} Safe category to use
   */
  static getSafeCategory(category) {
    const check = this.checkLegacyModel(category);

    if (check.isLegacy && check.redirect) {
      return check.redirect;
    }

    if (check.isLegacy && check.blocked) {
      // Fallback to 'input' for completely blocked models
      return 'input';
    }

    return category;
  }

  /**
   * Validate and log a spawn attempt
   * @param {string} category - Requested category
   * @param {boolean} verbose - Log to console
   * @returns {object} Validation result
   */
  static validateSpawn(category, verbose = true) {
    const check = this.checkLegacyModel(category);

    if (check.isLegacy) {
      if (check.redirect) {
        if (verbose) {
          console.log(
            `[LegacyNodeModelFilter] ✓ ${check.reason}`
          );
        }
        return {
          valid: true,
          redirected: true,
          category: check.redirect,
          reason: check.reason
        };
      }

      if (check.blocked) {
        if (verbose) {
          console.warn(
            `[LegacyNodeModelFilter] ⚠️ ${check.reason}. Falling back to 'input' model.`
          );
        }
        return {
          valid: false,
          blocked: true,
          category: 'input',
          reason: check.reason
        };
      }
    }

    // Not legacy, safe to use
    return {
      valid: true,
      category: category,
      reason: 'Standard model'
    };
  }

  /**
   * Get list of all safe modern node categories
   * @returns {string[]} Array of safe categories
   */
  static getSafeCategories() {
    return [
      'input',
      'process',
      'integration',
      'analytics',
      'storage',
      'control',
      'quantum',   // Quantum (replaces old sigma)
      'mythic',
      'prime',
      'error',
      'emotional'
    ];
  }

  /**
   * Get list of legacy categories
   * @returns {string[]} Array of legacy categories
   */
  static getLegacyCategories() {
    return Object.keys(this.LEGACY_MODEL_MAPPING);
  }

  /**
   * Get list of unstable categories (cannot spawn)
   * @returns {string[]} Array of unstable categories
   */
  static getUnstableCategories() {
    return Array.from(this.UNSTABLE_MODELS);
  }

  /**
   * Setup debugging console API
   */
  static setupConsoleAPI() {
    if (!window.legacyModelDebug) {
      window.legacyModelDebug = {
        filter: this,

        check: (category) => {
          const result = LegacyNodeModelFilter.checkLegacyModel(category);
          console.table(result);
          return result;
        },

        getSafe: (category) => {
          const safe = LegacyNodeModelFilter.getSafeCategory(category);
          console.log(`Safe category for '${category}': '${safe}'`);
          return safe;
        },

        validate: (category, verbose = true) => {
          const result = LegacyNodeModelFilter.validateSpawn(category, verbose);
          console.table(result);
          return result;
        },

        listLegacy: () => {
          console.log('📋 Legacy Categories:', LegacyNodeModelFilter.getLegacyCategories());
        },

        listSafe: () => {
          console.log('✅ Safe Categories:', LegacyNodeModelFilter.getSafeCategories());
        },

        listUnstable: () => {
          const unstable = LegacyNodeModelFilter.getUnstableCategories();
          if (unstable.length === 0) {
            console.log('✅ No unstable categories (all legacy models have safe replacements)');
          } else {
            console.log('⚠️ Unstable Categories:', unstable);
          }
        },

        help: () => {
          console.log(`
🔧 LEGACY NODE MODEL FILTER DEBUG API
═══════════════════════════════════════

legacyModelDebug.check(category)       - Check if model is legacy
legacyModelDebug.getSafe(category)     - Get safe replacement
legacyModelDebug.validate(category)    - Validate spawn
legacyModelDebug.listLegacy()          - Show legacy models
legacyModelDebug.listSafe()            - Show safe models
legacyModelDebug.listUnstable()        - Show unstable models
legacyModelDebug.help()                - Show this help

MAPPINGS:
---------
'sigma' → 'quantum' (modern enhanced model with proper core)
          `);
        }
      };

      console.log('💡 Legacy Model Filter debugging API available at: legacyModelDebug');
    }
  }
}

// Initialize console API on module load
LegacyNodeModelFilter.setupConsoleAPI();
