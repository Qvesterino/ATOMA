/**
 * HarmonicHubLifecycle.js
 * ============================================================================
 * BACKWARD-COMPATIBLE BARREL FILE
 *
 * Re-exports all lifecycle controllers from the `harmonic/` folder.
 * This preserves existing imports in HarmonicHubSync.js and other consumers.
 *
 * MIGRATION NOTE (2026-05-14):
 * The original merged file was split into 3 individual files:
 *   - harmonic/HarmonicHubCollapseController.js
 *   - harmonic/HarmonicHubRecoveryController.js
 *   - harmonic/HarmonicHubResilienceController.js
 *
 * This barrel exists for backward compatibility. New code may import
 * directly from the individual files.
 */

export { HarmonicHubCollapseController } from './harmonic/HarmonicHubCollapseController.js';
export { HarmonicHubRecoveryController } from './harmonic/HarmonicHubRecoveryController.js';
export { HarmonicHubResilienceController } from './harmonic/HarmonicHubResilienceController.js';
