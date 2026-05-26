/**
 * COLLAPSE READABILITY DIRECTOR
 * ==============================
 * Single source of truth for predictive collapse readability.
 * Subscribes to existing systems, classifies threats into 3 states,
 * and drives HUD hints + FX semantic labels.
 *
 * States: strained → critical → fracturing
 */

import { eventRegistrationRegistry } from '../../Engine/EventRegistrationRegistry.js';

// ---------------------------------------------------------------------------
// REASON REGISTRY — consistent semantic treatment across text, debug, FX
// ---------------------------------------------------------------------------
export const REASON_REGISTRY = Object.freeze({
  'quality-degraded': {
    text: 'Link quality degraded',
    action: 'Reinforce or reroute',
    fxFamily: 'link-strain-pulse'
  },
  'corruption-spike': {
    text: 'Corruption spike detected',
    action: 'Break chain or isolate',
    fxFamily: 'link-critical-glow'
  },
  'chokepoint-overload': {
    text: 'Chokepoint overloaded',
    action: 'Add alternate route',
    fxFamily: 'link-critical-glow'
  },
  'node-countdown': {
    text: 'Node structural failure imminent',
    action: 'Sever or brace',
    fxFamily: 'link-fracture-burst'
  },
  'cascade-propagating': {
    text: 'Cascade propagating through corridor',
    action: 'Isolate rupture zone',
    fxFamily: 'link-fracture-burst'
  },
  'hub-overload': {
    text: 'Harmonic hub overloading',
    action: 'Reroute load or reinforce',
    fxFamily: 'link-critical-glow'
  }
});

// ---------------------------------------------------------------------------
// THRESHOLDS
// ---------------------------------------------------------------------------
const THRESHOLDS = Object.freeze({
  STRAINED_QUALITY: 0.40,
  STRAINED_STABILITY: 0.35,
  CRITICAL_QUALITY: 0.20,
  CRITICAL_STABILITY: 0.20,
  CRITICAL_CORRUPTION: 0.60,
  MAX_TOP_THREATS: 3,
  HINT_COOLDOWN_MS: 6000,
  THREAT_DECAY_MS: 8000
});

// ---------------------------------------------------------------------------
// CLASSIFICATION HELPERS
// ---------------------------------------------------------------------------
function classifyLinkThreat(link) {
  if (!link || !link.userData) return null;

  const quality = link.userData?.quality?.score ?? link.userData?.quality ?? 1.0;
  const corruption = link.userData?.corruption ?? 0;
  const sourceNode = link.source ?? link.sourceNode ?? link.from ?? link.userData?.nodeA;
  const targetNode = link.target ?? link.targetNode ?? link.to ?? link.userData?.nodeB;
  const sourceCountdown = sourceNode?.userData?.failureCountdown ?? false;
  const targetCountdown = targetNode?.userData?.failureCountdown ?? false;
  const isCascade = link.userData?.cascadeAffected ?? false;

  const id = link.userData?.id ?? link.id ?? link.uuid ?? null;
  if (id === null) return null;

  if (sourceCountdown || targetCountdown || isCascade) {
    return {
      id,
      type: 'link',
      state: 'fracturing',
      reason: isCascade ? 'cascade-propagating' : 'node-countdown',
      quality,
      corruption,
      entity: link
    };
  }

  if (quality < THRESHOLDS.CRITICAL_QUALITY || corruption > THRESHOLDS.CRITICAL_CORRUPTION) {
    return {
      id,
      type: 'link',
      state: 'critical',
      reason: corruption > THRESHOLDS.CRITICAL_CORRUPTION ? 'corruption-spike' : 'quality-degraded',
      quality,
      corruption,
      entity: link
    };
  }

  if (quality < THRESHOLDS.STRAINED_QUALITY) {
    return {
      id,
      type: 'link',
      state: 'strained',
      reason: 'quality-degraded',
      quality,
      corruption,
      entity: link
    };
  }

  return null;
}

function classifyNodeThreat(node) {
  if (!node || !node.userData) return null;

  const stability = node.userData?.metrics?.stability ?? node.userData?.stability ?? 1.0;
  const corruption = node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0;
  const isCountdown = node.userData?.failureCountdown ?? false;
  const isCascade = node.userData?.cascadeAffected ?? false;

  const id = node.userData?.nodeId ?? node.id ?? node.uuid ?? null;
  if (id === null) return null;

  if (isCountdown || isCascade) {
    return {
      id,
      type: 'node',
      state: 'fracturing',
      reason: isCascade ? 'cascade-propagating' : 'node-countdown',
      stability,
      corruption,
      entity: node
    };
  }

  if (stability < THRESHOLDS.CRITICAL_STABILITY || corruption > THRESHOLDS.CRITICAL_CORRUPTION) {
    return {
      id,
      type: 'node',
      state: 'critical',
      reason: corruption > THRESHOLDS.CRITICAL_CORRUPTION ? 'corruption-spike' : 'chokepoint-overload',
      stability,
      corruption,
      entity: node
    };
  }

  if (stability < THRESHOLDS.STRAINED_STABILITY) {
    return {
      id,
      type: 'node',
      state: 'strained',
      reason: 'chokepoint-overload',
      stability,
      corruption,
      entity: node
    };
  }

  return null;
}

function resolveThreatLabel(threat) {
  const reg = REASON_REGISTRY[threat.reason];
  if (!reg) return 'Unknown threat';
  if (threat.type === 'link') {
    return `Corridor ${String(threat.id).slice(0, 6)}: ${reg.text.toLowerCase()} — ${reg.action}`;
  }
  return `Node ${String(threat.id).slice(0, 6)}: ${reg.text.toLowerCase()} — ${reg.action}`;
}

// ---------------------------------------------------------------------------
// DIRECTOR
// ---------------------------------------------------------------------------
export class CollapseReadabilityDirector {
  constructor({ semanticBus = null, gameplayHintLayer = null, linkingSystem = null } = {}) {
    this.semanticBus = semanticBus;
    this.gameplayHintLayer = gameplayHintLayer;
    this.linkingSystem = linkingSystem;

    this.enabled = true;
    this._regDisposers = [];

    // Threat state
    this.threats = new Map(); // id -> threat object
    this.topThreats = [];       // sorted array (max 3)

    // Hint cooldowns
    this._lastHintAt = new Map(); // threat id -> timestamp
    this._lastHintState = new Map(); // threat id -> last hinted state

    // World context
    this._worldId = 'global';

    // FX semantic label cache (for external systems to read)
    this.fxSemanticLabels = new Map(); // entity id -> { state, reason, fxFamily }

    this._bindEvents();
  }

  // ========================================================================
  // EVENT BINDING
  // ========================================================================
  _bindEvents() {
    if (!this.semanticBus) return;

    const reg = (tag, handler) => {
      const disposer = eventRegistrationRegistry.register(
        'CollapseReadabilityDirector', tag, handler, this.semanticBus
      );
      this._regDisposers.push(disposer);
    };

    // Existing cascade / rupture events
    reg('topology.rupture', (payload = {}) => {
      this._onTopologyRupture(payload);
    });

    // New predictive warning events
    reg('node.failure.warning', (payload = {}) => {
      this._onNodeFailureWarning(payload);
    });

    reg('hub.overload', (payload = {}) => {
      this._onHubOverload(payload);
    });

    // Corruption events (if available)
    reg('link.corruption.high', (payload = {}) => {
      this._onLinkCorruptionHigh(payload);
    });

    // Counterplay verb events
    reg('network:corridorReinforced', (payload = {}) => {
      this._onCorridorReinforced(payload);
    });
    reg('network:corridorRerouted', (payload = {}) => {
      this._onCorridorRerouted(payload);
    });
    reg('network:corridorAbandoned', (payload = {}) => {
      this._onCorridorAbandoned(payload);
    });
  }

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  _onTopologyRupture(payload) {
    const nodeId = payload?.nodeId ?? payload?.originNodeId ?? null;
    if (!nodeId) return;
    this._markNodeCascadeAffected(nodeId);
  }

  _onNodeFailureWarning(payload) {
    const nodeId = payload?.nodeId ?? null;
    if (!nodeId) return;
    // Pre-emptively register a fracturing threat so the player gets the hint
    // before the countdown completes
    this._ensureThreatFromNodeId(nodeId, 'fracturing', 'node-countdown');
  }

  _onHubOverload(payload) {
    const node = payload?.node ?? null;
    if (!node) return;
    const nodeId = node.userData?.nodeId ?? node.id ?? node.uuid ?? null;
    if (!nodeId) return;
    this._ensureThreatFromNodeId(nodeId, 'critical', 'hub-overload');
  }

  _onLinkCorruptionHigh(payload) {
    const linkId = payload?.linkId ?? null;
    if (!linkId) return;
    this._ensureThreatFromLinkId(linkId, 'critical', 'corruption-spike');
  }

  _onCorridorReinforced(payload) {
    if (!this.gameplayHintLayer) return;
    const linkId = payload?.linkId ?? null;
    if (!linkId) return;
    // Remove any chokepoint-fragile threat for this link since it was reinforced
    const threat = this.threats.get(linkId);
    if (threat && threat.reason === 'chokepoint-overload') {
      this.threats.delete(linkId);
    }
  }

  _onCorridorRerouted(payload) {
    if (!this.gameplayHintLayer) return;
    const relievedLinkId = payload?.relievedLinkId ?? null;
    if (!relievedLinkId) return;
    this.gameplayHintLayer.show('rerouteSuccess', {
      hotspotLabel: String(relievedLinkId).slice(0, 6)
    }, {
      fingerprint: `reroute:${relievedLinkId}`,
      cooldownMs: 6000
    });
  }

  _onCorridorAbandoned(payload) {
    if (!this.gameplayHintLayer) return;
    const linkId = payload?.linkId ?? null;
    if (!linkId) return;
    this.gameplayHintLayer.show('abandonSacrifice', {
      corridorLabel: String(linkId).slice(0, 6)
    }, {
      fingerprint: `abandon:${linkId}`,
      cooldownMs: 8000
    });
    // Remove threat for abandoned link
    this.threats.delete(linkId);
  }

  // ========================================================================
  // THREAT MANAGEMENT
  // ========================================================================
  _markNodeCascadeAffected(nodeId) {
    const threat = this.threats.get(nodeId);
    if (threat) {
      threat.state = 'fracturing';
      threat.reason = 'cascade-propagating';
      threat.updatedAt = performance.now();
    } else {
      this.threats.set(nodeId, {
        id: nodeId,
        type: 'node',
        state: 'fracturing',
        reason: 'cascade-propagating',
        updatedAt: performance.now(),
        entity: null // resolved lazily
      });
    }
    this._recomputeTopThreats();
  }

  _ensureThreatFromNodeId(nodeId, state, reason) {
    const existing = this.threats.get(nodeId);
    if (existing) {
      if (statePriority(state) > statePriority(existing.state)) {
        existing.state = state;
        existing.reason = reason;
      }
      existing.updatedAt = performance.now();
    } else {
      this.threats.set(nodeId, {
        id: nodeId,
        type: 'node',
        state,
        reason,
        updatedAt: performance.now(),
        entity: null
      });
    }
    this._recomputeTopThreats();
  }

  _ensureThreatFromLinkId(linkId, state, reason) {
    const existing = this.threats.get(linkId);
    if (existing) {
      if (statePriority(state) > statePriority(existing.state)) {
        existing.state = state;
        existing.reason = reason;
      }
      existing.updatedAt = performance.now();
    } else {
      this.threats.set(linkId, {
        id: linkId,
        type: 'link',
        state,
        reason,
        updatedAt: performance.now(),
        entity: null
      });
    }
    this._recomputeTopThreats();
  }

  // ========================================================================
  // SCANNING (called from main tick)
  // ========================================================================
  scan(linkingSystem, aiNodes) {
    if (!this.enabled) return;

    const now = performance.now();

    // Scan links
    const links = linkingSystem?.getAllLinks?.() ?? [];
    for (const link of links) {
      const threat = classifyLinkThreat(link);
      if (threat) {
        const existing = this.threats.get(threat.id);
        if (existing) {
          existing.state = threat.state;
          existing.reason = threat.reason;
          existing.quality = threat.quality;
          existing.corruption = threat.corruption;
          existing.updatedAt = now;
        } else {
          this.threats.set(threat.id, { ...threat, updatedAt: now });
        }
      }
    }

    // Scan nodes
    const nodes = aiNodes?.nodes ?? [];
    for (const node of nodes) {
      const threat = classifyNodeThreat(node);
      if (threat) {
        const existing = this.threats.get(threat.id);
        if (existing) {
          existing.state = threat.state;
          existing.reason = threat.reason;
          existing.stability = threat.stability;
          existing.corruption = threat.corruption;
          existing.updatedAt = now;
        } else {
          this.threats.set(threat.id, { ...threat, updatedAt: now });
        }
      }
    }

    // Decay stale threats
    for (const [id, threat] of this.threats) {
      if (now - threat.updatedAt > THRESHOLDS.THREAT_DECAY_MS) {
        this.threats.delete(id);
        this._lastHintAt.delete(id);
        this._lastHintState.delete(id);
      }
    }

    this._recomputeTopThreats();
    this._maybeEmitHints(now);
    this._updateFXSemanticLabels();
  }

  // ========================================================================
  // TOP THREATS
  // ========================================================================
  _recomputeTopThreats() {
    const sorted = Array.from(this.threats.values())
      .sort((a, b) => {
        const pa = statePriority(a.state);
        const pb = statePriority(b.state);
        if (pb !== pa) return pb - pa;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });

    this.topThreats = sorted.slice(0, THRESHOLDS.MAX_TOP_THREATS);
  }

  // ========================================================================
  // HINT EMISSION
  // ========================================================================
  _maybeEmitHints(now) {
    if (!this.gameplayHintLayer) return;

    for (const threat of this.topThreats) {
      const lastHint = this._lastHintAt.get(threat.id) || 0;
      const lastState = this._lastHintState.get(threat.id);
      const cooldown = THRESHOLDS.HINT_COOLDOWN_MS;

      // Hint on new threat, state escalation, or cooldown refresh
      const isNew = lastState === undefined;
      const escalated = lastState && statePriority(threat.state) > statePriority(lastState);
      const cooledDown = (now - lastHint) >= cooldown;

      if ((isNew || escalated) || (cooledDown && threat.state === 'fracturing')) {
        const context = this._buildHintContext(threat);
        const shown = this.gameplayHintLayer.show('collapseReadability', context, {
          fingerprint: `collapse:${threat.id}:${threat.state}`,
          cooldownMs: escalated ? 0 : cooldown,
          variant: threat.state === 'fracturing' ? 'major' : threat.state === 'critical' ? 'warning' : 'default'
        });
        if (shown) {
          this._lastHintAt.set(threat.id, now);
          this._lastHintState.set(threat.id, threat.state);
        }
      }
    }
  }

  _buildHintContext(threat) {
    const reg = REASON_REGISTRY[threat.reason] || {};
    return {
      state: threat.state,
      reason: threat.reason,
      action: reg.action || 'Stabilize',
      text: reg.text || 'Threat detected',
      nodeLabel: threat.type === 'node' ? String(threat.id).slice(0, 6) : undefined,
      corridorLabel: threat.type === 'link' ? String(threat.id).slice(0, 6) : undefined,
      world: this._worldId
    };
  }

  // ========================================================================
  // FX SEMANTIC LABELS
  // ========================================================================
  _updateFXSemanticLabels() {
    this.fxSemanticLabels.clear();
    for (const threat of this.topThreats) {
      const reg = REASON_REGISTRY[threat.reason];
      this.fxSemanticLabels.set(threat.id, {
        state: threat.state,
        reason: threat.reason,
        fxFamily: reg?.fxFamily || 'link-strain-pulse',
        label: resolveThreatLabel(threat)
      });
    }
  }

  getFXSemanticLabel(entityId) {
    return this.fxSemanticLabels.get(entityId) || null;
  }

  // ========================================================================
  // DEBUG SNAPSHOT
  // ========================================================================
  getDebugSnapshot() {
    return {
      enabled: this.enabled,
      world: this._worldId,
      threatCount: this.threats.size,
      topThreats: this.topThreats.map(t => ({
        id: t.id,
        type: t.type,
        state: t.state,
        reason: t.reason,
        label: resolveThreatLabel(t),
        ageMs: Math.round(performance.now() - (t.updatedAt || 0))
      })),
      fxLabels: Array.from(this.fxSemanticLabels.entries()).map(([id, label]) => ({ id, ...label }))
    };
  }

  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  setWorld(worldId) {
    this._worldId = worldId || 'global';
    this.threats.clear();
    this.topThreats = [];
    this._lastHintAt.clear();
    this._lastHintState.clear();
    this.fxSemanticLabels.clear();
  }

  dispose() {
    if (eventRegistrationRegistry && typeof eventRegistrationRegistry.disposeOwner === 'function') {
      eventRegistrationRegistry.disposeOwner('CollapseReadabilityDirector');
    }
    this._regDisposers = [];
    this.threats.clear();
    this.topThreats = [];
    this._lastHintAt.clear();
    this._lastHintState.clear();
    this.fxSemanticLabels.clear();
  }
}

// ---------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------
function statePriority(state) {
  switch (state) {
    case 'fracturing': return 3;
    case 'critical': return 2;
    case 'strained': return 1;
    default: return 0;
  }
}
