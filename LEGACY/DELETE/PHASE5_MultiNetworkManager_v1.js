/**
 * ============================================================================
 * @deprecated PHASE5_MultiNetworkManager_v1.js
 * 
 * This file has been CONSOLIDATED into PHASE5_MultiNetworkCore.js (2026-03-26)
 * 
 * MIGRATION:
 * - OLD: import PHASE5_MultiNetworkManager from './PHASE5_MultiNetworkManager_v1.js';
 * - NEW: import { PHASE5_MultiNetworkManager } from './PHASE5_MultiNetworkCore.js';
 * 
 * This file re-exports from the consolidated module for backward compatibility.
 * ============================================================================
 */

// Re-export from consolidated file for backward compatibility
export { PHASE5_MultiNetworkManager } from './PHASE5_MultiNetworkCore.js';

// Default export for backward compatibility with `import X from './PHASE5_MultiNetworkManager_v1.js'`
import { PHASE5_MultiNetworkManager } from './PHASE5_MultiNetworkCore.js';
export default PHASE5_MultiNetworkManager;
