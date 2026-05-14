/**
 * HarmonicHubSync.js
 * ============================================================================
 * BACKWARD-COMPATIBLE BARREL FILE
 *
 * Re-exports all sync subsystem classes from the `harmonic/` folder.
 * This preserves existing imports in LinkRendererConduit.js and other consumers.
 *
 * MIGRATION NOTE (2026-05-14):
 * The original merged file was split into 3 individual files:
 *   - harmonic/NodeHarmonicSyncController.js
 *   - harmonic/HarmonicSyncEffectApplier.js
 *   - harmonic/NodeHarmonicManager.js
 *
 * This barrel exists for backward compatibility. New code may import
 * directly from the individual files.
 */

export { NodeHarmonicSyncController } from './harmonic/NodeHarmonicSyncController.js';
export { HarmonicSyncEffectApplier } from './harmonic/HarmonicSyncEffectApplier.js';
export { NodeHarmonicManager } from './harmonic/NodeHarmonicManager.js';
