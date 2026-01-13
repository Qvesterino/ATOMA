/**
 * LinkExtensionConfig.js
 * ============================================================================
 * VISUAL LINK EXTENSION CONFIGURATION
 * 
 * Configures how deeply links penetrate into node auras, making them feel
 * rooted and embedded in the energy field rather than just attached.
 * 
 * This is a VISUAL-ONLY configuration. No gameplay logic changes.
 * 
 * Design Principle:
 * - Links should feel physically embedded in the aura field
 * - Penetration is proportional to aura size
 * - Never clips into node core material
 * - Respects visual hierarchy: link < aura < core
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

/**
 * LINK PENETRATION CONFIGURATION
 * Controls how deeply links extend into node auras
 */
export const LinkExtensionConfig = {
  /**
   * Penetration factor: how much beyond aura surface to extend
   * Range: 0.0 (no penetration) to 0.3 (30%)
   * Recommended: 0.15 (15%)
   * 
   * Formula:
   * actualPenetration = auraRadius * penetrationFactor
   * 
   * @type {number}
   */
  penetrationFactor: 0.15,

  /**
   * Original surface offset (from LinkRendererConduit)
   * Links start at this % of node radius from center
   * @type {number}
   */
  sourceSurfaceOffset: 0.85,
  targetSurfaceOffset: 0.85,

  /**
   * Calculated total offset (surface + penetration)
   * This is what gets used in link positioning
   * 
   * @type {number}
   */
  get sourceOffsetWithPenetration() {
    // sourceOffset - penetration = go deeper
    // 0.85 - 0.15 = 0.70 (penetrate 15% deeper)
    return this.sourceSurfaceOffset - this.penetrationFactor;
  },

  get targetOffsetWithPenetration() {
    return this.targetSurfaceOffset - this.penetrationFactor;
  },

  /**
   * Describe this configuration
   */
  describe() {
    return `
LinkExtensionConfig - Visual Link Penetration
==============================================

PENETRATION:
  Factor: ${(this.penetrationFactor * 100).toFixed(1)}%
  Original Surface Offset: ${this.sourceSurfaceOffset}
  New Offset (with penetration): ${this.sourceOffsetWithPenetration}

EFFECT:
  Links extend ${(this.penetrationFactor * 100).toFixed(1)}% deeper into aura
  Example: 1.0 radius aura → links penetrate 0.15 units
  
RESULT:
  Links feel rooted and embedded, not just attached
    `;
  },
};

export default LinkExtensionConfig;
