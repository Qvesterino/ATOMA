/**
 * HarmonicHubCascade.js
 * ============================================================================
 * BACKWARD-COMPATIBLE BARREL FILE
 *
 * Re-exports all cascade subsystem classes from the `harmonic/` folder.
 * This preserves existing imports in main.js, HarmonicCascadeAmplification,
 * and other consumers.
 *
 * MIGRATION NOTE (2026-05-14):
 * The original merged file was split into 3 individual files:
 *   - harmonic/HubProximityDetector.js
 *   - harmonic/HarmonicPhaseSynchronization_Session146.js
 *   - harmonic/CascadingHarmonicResonanceAmplification.js
 *
 * This barrel exists for backward compatibility. New code may import
 * directly from the individual files.
 */

export { HubProximityDetector } from '../harmonic/HubProximityDetector.js';
export { HarmonicPhaseSynchronization_Session146, setupPhaseSyncConsoleAPI } from '../harmonic/HarmonicPhaseSynchronization_Session146.js';
export { CascadingHarmonicResonanceAmplification, setupCascadingResonanceConsoleAPI } from '../harmonic/CascadingHarmonicResonanceAmplification.js';
