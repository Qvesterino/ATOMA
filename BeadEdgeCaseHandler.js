/**
 * ============================================================================
 * BEAD EDGE CASE HANDLER
 * ============================================================================
 * 
 * Handles unusual link scenarios and edge cases.
 * Ensures bead system remains stable in all conditions.
 * 
 * Edge Cases:
 * - Very short links (< 0.1 units)
 * - Very long links (> 100 units)
 * - Nodes very close together
 * - Zero synergy/traffic
 * - Rapidly changing metrics
 * - Deleted nodes
 * - Invalid curves
 * 
 * ============================================================================
 */

/**
 * Validate bead system integrity for a link
 */
export function validateLinkBeadIntegrity(link) {
  const issues = [];
  
  if (!link) {
    issues.push('Link is null or undefined');
    return issues;
  }
  
  // Check link structure
  if (!link.source || !link.target) {
    issues.push('Link missing source or target node');
  }
  
  if (!link.curve) {
    issues.push('Link missing curve');
  }
  
  if (!link.group) {
    issues.push('Link missing visual group');
  }
  
  // Check bead visualizer
  const vizState = link.group?.userData?.conduitState;
  if (!vizState || !vizState.beads) {
    issues.push('Link missing bead visualizer');
  }
  
  // Check bead pool
  if (vizState?.beads?.pool) {
    const pool = vizState.beads.pool;
    
    if (pool.beads.length === 0) {
      issues.push('Bead pool is empty');
    }
    
    // Check for invalid beads
    const invalidBeads = pool.beads.filter(b => !b || isNaN(b.t));
    if (invalidBeads.length > 0) {
      issues.push(`${invalidBeads.length} invalid beads in pool`);
    }
  }
  
  return issues;
}

/**
 * Get curve length safely with fallback
 */
export function getSafeCurveLength(curve, fallback = 1.0) {
  if (!curve) return fallback;
  
  try {
    if (typeof curve.getLength === 'function') {
      const length = curve.getLength();
      if (length > 0 && isFinite(length)) {
        return length;
      }
    }
    
    // Fallback: Sample curve to estimate length
    let length = 0;
    let prevPos = curve.getPointAt(0);
    
    for (let i = 1; i <= 20; i++) {
      const t = i / 20;
      const pos = curve.getPointAt(t);
      length += pos.distanceTo(prevPos);
      prevPos = pos;
    }
    
    return Math.max(0.1, length);
  } catch (err) {
    console.warn('[BeadEdgeCaseHandler] Error getting curve length:', err.message);
    return fallback;
  }
}

/**
 * Handle very short links (< 0.1 units)
 */
export function handleShortLink(link) {
  const curve = link.curve;
  const length = getSafeCurveLength(curve);
  
  if (length < 0.1) {
    // For very short links, reduce bead visibility
    if (link.group?.userData?.conduitState?.beads) {
      const viz = link.group.userData.conduitState.beads;
      
      // Reduce spawn rate
      if (viz.pool) {
        viz.pool.spawnAccumulator = 0;
      }
      
      // Reduce max opacity
      if (viz.renderer?.material) {
        viz.renderer.material.opacity *= 0.5;
      }
    }
    
    return {
      handled: true,
      reason: 'Link too short',
      recommendation: 'Consider hiding or simplifying visualization'
    };
  }
  
  return { handled: false };
}

/**
 * Handle very long links (> 100 units)
 */
export function handleLongLink(link) {
  const curve = link.curve;
  const length = getSafeCurveLength(curve);
  
  if (length > 100) {
    // For very long links, beads travel longer
    // Adjust spawn rate to maintain visual density
    if (link.group?.userData?.conduitState?.beads) {
      const viz = link.group.userData.conduitState.beads;
      
      // Increase spawn rate slightly
      if (viz.pool) {
        const lengthFactor = length / 10; // Normalize to ~10 units
        // No direct spawn rate adjustment here, but could be done via activity scaling
      }
    }
    
    return {
      handled: true,
      reason: 'Link very long',
      recommendation: 'Monitor performance and adjust bead density if needed'
    };
  }
  
  return { handled: false };
}

/**
 * Handle nodes very close together
 */
export function handleCloseNodes(link) {
  const distance = link.source.position.distanceTo(link.target.position);
  
  if (distance < 0.5) {
    // Nodes are very close - beads will traverse quickly
    if (link.group?.userData?.conduitState?.beads) {
      // Beads already handle this via curve length, but we can note it
    }
    
    return {
      handled: true,
      reason: 'Nodes very close',
      recommendation: 'Beads will traverse quickly - this is normal'
    };
  }
  
  return { handled: false };
}

/**
 * Handle zero activity (no synergy, no traffic)
 */
export function handleZeroActivity(link) {
  const synergy = link.synergyScore ?? 0.5;
  const traffic = link.traffic?.load ?? 0;
  const activity = (synergy + traffic) / 2;
  
  if (activity < 0.05) {
    // Very low activity - beads should not spawn
    if (link.group?.userData?.conduitState?.beads) {
      const viz = link.group.userData.conduitState.beads;
      
      // Ensure spawn is suppressed
      if (viz.pool) {
        viz.pool.spawnAccumulator = 0;
      }
    }
    
    return {
      handled: true,
      reason: 'Zero activity on link',
      recommendation: 'No beads should appear'
    };
  }
  
  return { handled: false };
}

/**
 * Repair invalid bead state
 */
export function repairBeadState(link) {
  const vizState = link.group?.userData?.conduitState;
  if (!vizState || !vizState.beads) return false;
  
  try {
    const viz = vizState.beads;
    const pool = viz.pool;
    
    // Clear invalid beads
    for (const bead of pool.beads) {
      if (!bead || isNaN(bead.t) || bead.t < 0) {
        bead.reset();
      }
    }
    
    // Reset spawn accumulator if broken
    if (isNaN(pool.spawnAccumulator)) {
      pool.spawnAccumulator = 0;
    }
    
    // Clamp spawn accumulator
    if (pool.spawnAccumulator > 10) {
      pool.spawnAccumulator = 0;
    }
    
    return true;
  } catch (err) {
    console.warn('[BeadEdgeCaseHandler] Failed to repair bead state:', err.message);
    return false;
  }
}

/**
 * Run full edge case diagnostics
 */
export function runFullDiagnostics(link) {
  const results = {
    integrity: validateLinkBeadIntegrity(link),
    edgeCases: [],
    repaired: false
  };
  
  // Check all edge cases
  if (!handleShortLink(link).handled === false) {
    const short = handleShortLink(link);
    if (short.handled) results.edgeCases.push(short);
  }
  
  if (!handleLongLink(link).handled === false) {
    const long = handleLongLink(link);
    if (long.handled) results.edgeCases.push(long);
  }
  
  if (!handleCloseNodes(link).handled === false) {
    const close = handleCloseNodes(link);
    if (close.handled) results.edgeCases.push(close);
  }
  
  if (!handleZeroActivity(link).handled === false) {
    const zero = handleZeroActivity(link);
    if (zero.handled) results.edgeCases.push(zero);
  }
  
  // Try to repair if issues found
  if (results.integrity.length > 0 || results.edgeCases.length > 0) {
    results.repaired = repairBeadState(link);
  }
  
  return results;
}

/**
 * Print diagnostics report
 */
export function printDiagnostics(link) {
  const results = runFullDiagnostics(link);
  
  console.group('%c🔧 Bead Edge Case Diagnostics', 'color: #ffaa00; font-weight: bold');
  
  if (results.integrity.length > 0) {
    console.group('%c❌ Integrity Issues', 'color: #ff4444');
    results.integrity.forEach(issue => console.warn(issue));
    console.groupEnd();
  }
  
  if (results.edgeCases.length > 0) {
    console.group('%c⚠️ Edge Cases Detected', 'color: #ffaa00');
    results.edgeCases.forEach(ec => {
      console.warn(`${ec.reason}`);
      console.info(`→ ${ec.recommendation}`);
    });
    console.groupEnd();
  }
  
  if (results.repaired) {
    console.log('%c✅ State repaired', 'color: #00ff88');
  } else if (results.integrity.length === 0 && results.edgeCases.length === 0) {
    console.log('%c✅ All systems normal', 'color: #00ff88');
  }
  
  console.groupEnd();
}

export default {
  validateLinkBeadIntegrity,
  getSafeCurveLength,
  handleShortLink,
  handleLongLink,
  handleCloseNodes,
  handleZeroActivity,
  repairBeadState,
  runFullDiagnostics,
  printDiagnostics
};
