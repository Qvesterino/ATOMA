/**
 * NETWORK STATE AI REASONER (READ-ONLY, ADVISORY ONLY)
 *
 * Purpose:
 * - Build an immutable snapshot of the current network state for AI reasoning.
 * - Provide advisory insights, risks, and recommendations without any authority.
 *
 * Guarantees:
 * - Read-only: never calls createLink/removeLink or mutates live state.
 * - Non-authoritative: outputs are hints only; system behavior is unchanged if unused.
 * - Guarded: does not bypass arbiters (collapse/recovery remain externally controlled).
 */

function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key]);
  }
  return obj;
}

/**
 * Build a read-only snapshot from the linking system.
 * Only copies safe, derived data needed for reasoning.
 *
 * @param {Object} linkingSystem - NodeLinkingSystem instance
 * @returns {Object} frozen snapshot
 */
export function buildNetworkStateSnapshot(linkingSystem) {
  if (!linkingSystem) return deepFreeze({ links: [], collapseDecisions: [], recoveryCandidates: [] });

  const links = Array.isArray(linkingSystem.links)
    ? linkingSystem.links.map(link => ({
        id: link.id || `${link.source?.id ?? 'src'}-${link.target?.id ?? 'tgt'}`,
        priority: link.prioritySnapshot || null,
        integrity: link.userData?.integrity,
        corruption: link.userData?.corruption,
        load: link.userData?.load,
        collapseState: link.userData?.collapseActive ? 'collapsed' : (link.userData?.collapseCritical ? 'critical' : (link.userData?.collapseWarning ? 'warning' : 'stable')),
      }))
    : [];

  const collapseDecisions = [];
  if (linkingSystem.lastCollapseDecisions instanceof Map) {
    for (const [linkId, decision] of linkingSystem.lastCollapseDecisions.entries()) {
      collapseDecisions.push({ linkId, ...decision });
    }
  }

  const recoveryCandidates = Array.isArray(linkingSystem.recoveryCandidates)
    ? linkingSystem.recoveryCandidates.map(c => ({ ...c }))
    : [];

  const snapshot = {
    collectedAt: Date.now(),
    links,
    collapseDecisions,
    recoveryCandidates,
  };

  return deepFreeze(snapshot);
}

/**
 * AI reasoning: analyze network stability, collapse causes, and recovery viability.
 * All outputs are advisory only.
 */
export class NetworkStateAIReasoner {
  analyze(snapshot) {
    if (!snapshot) return { insights: [], risks: [], recommendations: [] };

    const insights = [];
    const risks = [];
    const recommendations = [];

    // Stability signal: average priority + corruption spread
    const activeLinks = snapshot.links || [];
    const priorities = activeLinks.map(l => l.priority?.score ?? 0);
    const avgPriority = priorities.length ? priorities.reduce((a, b) => a + b, 0) / priorities.length : 0;
    insights.push(`Average priority score: ${avgPriority.toFixed(3)}`);

    const highCorruption = activeLinks.filter(l => (l.corruption ?? 0) >= 80);
    if (highCorruption.length > 0) {
      risks.push(`${highCorruption.length} link(s) at critical corruption (>=80).`);
    }

    // Collapse trend: count allows/executions
    const allowDecisions = (snapshot.collapseDecisions || []).filter(d => d.decision === 'allow');
    const executed = allowDecisions.filter(d => d.executedAt);
    if (executed.length > 0) {
      insights.push(`${executed.length} collapse(s) executed recently.`);
    }
    if (allowDecisions.length > executed.length) {
      risks.push(`Pending allowed collapses awaiting execution: ${allowDecisions.length - executed.length}.`);
    }

    // Recovery viability: candidates whose conditions are met
    const readyRecoveries = (snapshot.recoveryCandidates || []).filter(c => {
      const now = snapshot.collectedAt;
      const cooldownOk = now >= (c.earliestRecoveryAt ?? now + 1);
      return cooldownOk;
    });
    if (readyRecoveries.length > 0) {
      recommendations.push(`${readyRecoveries.length} recovery candidate(s) past cooldown; consider explicit relink if corruption/integrity allow.`);
    }

    return { insights, risks, recommendations };
  }
}

export default NetworkStateAIReasoner;
