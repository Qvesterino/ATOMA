/**
 * LEGACY LINK-STATE NEUTRALIZATION v1.0
 * 
 * All legacy link-state visual mutation code is converted to NO-OP.
 * Linking can update metadata/UI/effects, but NEVER visuals.
 * Visual response is handled ONLY by VisualAuthority.
 */

/**
 * 🚫 LIST OF DANGEROUS FUNCTIONS TO NEUTRALIZE
 */
const DANGEROUS_FUNCTIONS = [
  // Ghost / dimming
  { name: 'applyGhost', reason: 'Would dim node opacity' },
  { name: 'ghostMode', reason: 'Would hide node' },
  { name: 'dimNode', reason: 'Would reduce visibility' },
  { name: 'unghostNode', reason: 'Would restore opacity unsafely' },
  
  // Opacity mutations
  { name: 'setOpacity', reason: 'Direct opacity mutation' },
  { name: 'applyOpacity', reason: 'Opacity modification' },
  { name: 'dimLink', reason: 'Link dimming' },
  
  // Scale mutations
  { name: 'boostCore', reason: 'Would mutate core scale' },
  { name: 'scaleNode', reason: 'Scale mutation' },
  
  // Link state
  { name: 'applyLinkState', reason: 'Generic link-state mutation' },
  { name: 'applyLinkVisuals', reason: 'Link visual modification' },
  { name: 'mutateNodeVisuals', reason: 'Generic node visual mutation' },
  
  // Hide/show
  { name: 'hideNode', reason: 'Would set visible=false' },
  { name: 'showNode', reason: 'Would set visible=true improperly' },
  { name: 'toggleNodeVisibility', reason: 'Visibility mutation' }
];

/**
 * 🔒 NEUTRALIZE: Convert function to harmless NO-OP
 * 
 * @param {string} functionName - Name of function to neutralize
 * @param {string} reason - Why it's being neutralized
 */
function neutralizeFunction(functionName, reason) {
  if (!window[functionName]) {
    return;  // Function doesn't exist, nothing to neutralize
  }
  
  const original = window[functionName];
  
  window[functionName] = function(...args) {
    console.warn(`[LegacyShutdown] Function neutralized: ${functionName}`, {
      reason: reason,
      calledWith: args.length,
      stack: new Error().stack.split('\n').slice(1, 2).join('')
    });
    return null;  // NO-OP
  };
  
  // Mark as neutralized
  window[functionName].__legacyNeutralized = true;
  window[functionName].__originalReason = reason;
}

/**
 * 📋 DANGEROUS PATTERNS TO NEUTRALIZE (in code)
 */
const DANGEROUS_PATTERNS = [
  {
    pattern: /\.material\.opacity\s*=/,
    type: 'OPACITY_MUTATION',
    reason: 'Direct opacity assignment'
  },
  {
    pattern: /\.material\.transparent\s*=/,
    type: 'TRANSPARENT_MUTATION',
    reason: 'Transparent property mutation'
  },
  {
    pattern: /\.visible\s*=/,
    type: 'VISIBILITY_MUTATION',
    reason: 'Visibility mutation'
  },
  {
    pattern: /\.scale\s*\.multiplyScalar/,
    type: 'SCALE_MUTATION',
    reason: 'Scale modification'
  }
];

/**
 * 🔍 SCAN CODE: Find dangerous patterns
 * 
 * @param {string} code - Source code to scan
 * @returns {Array} Found patterns
 */
export function scanForDangerousPatterns(code) {
  const findings = [];
  
  for (const item of DANGEROUS_PATTERNS) {
    const matches = code.match(item.pattern);
    if (matches) {
      findings.push({
        type: item.type,
        reason: item.reason,
        count: matches.length,
        pattern: item.pattern.source
      });
    }
  }
  
  return findings;
}

/**
 * ✅ ACTIVATE: Neutralize all legacy link-state functions
 * 
 * Call this at startup to disable all dangerous functions
 */
export function neutralizeAllLegacyLinkState() {
  console.group('[LegacyShutdown] Neutralizing legacy link-state functions...');
  
  let count = 0;
  
  for (const item of DANGEROUS_FUNCTIONS) {
    if (window[item.name]) {
      neutralizeFunction(item.name, item.reason);
      console.log(`  ✓ Neutralized: ${item.name}`);
      count++;
    }
  }
  
  console.log(`✅ Neutralized ${count} legacy functions`);
  console.groupEnd();
}

/**
 * 📊 CHECK: Verify which functions are neutralized
 */
export function checkNeutralizationStatus() {
  const status = {
    totalDangerous: DANGEROUS_FUNCTIONS.length,
    neutralized: 0,
    remaining: [],
    details: []
  };
  
  for (const item of DANGEROUS_FUNCTIONS) {
    if (window[item.name]) {
      if (window[item.name].__legacyNeutralized) {
        status.neutralized++;
        status.details.push({
          name: item.name,
          status: 'NEUTRALIZED',
          reason: item.reason
        });
      } else {
        status.remaining.push(item.name);
        status.details.push({
          name: item.name,
          status: 'ACTIVE (DANGEROUS)',
          reason: item.reason
        });
      }
    }
  }
  
  return status;
}

/**
 * 🎬 CONSOLE API
 */
export function setupLegacyShutdownConsoleAPI() {
  if (!window.__legacyShutdown) {
    window.__legacyShutdown = {};
  }
  
  Object.assign(window.__legacyShutdown, {
    /**
     * Check status: window.__legacyShutdown.status()
     */
    status: () => {
      return checkNeutralizationStatus();
    },
    
    /**
     * Scan code: window.__legacyShutdown.scan(code)
     */
    scan: (code) => {
      if (!code) {
        console.error('Please provide source code to scan');
        return;
      }
      const findings = scanForDangerousPatterns(code);
      console.table(findings);
      return findings;
    },
    
    /**
     * Neutralize now: window.__legacyShutdown.neutralizeNow()
     */
    neutralizeNow: () => {
      neutralizeAllLegacyLinkState();
    }
  });
  
  console.log('✅ Legacy Shutdown console API: window.__legacyShutdown');
}

export const LegacyShutdown = {
  neutralizeFunction,
  scanForDangerousPatterns,
  neutralizeAllLegacyLinkState,
  checkNeutralizationStatus,
  setupLegacyShutdownConsoleAPI
};
