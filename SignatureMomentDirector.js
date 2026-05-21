import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

const SYNERGY_APEX_MOMENT_ID = 'synergy.apex.network-resonance-surge';
const CASCADE_RECONSTRUCTION_MOMENT_ID = 'cascade.reconstruction.beacon';
const MEMORY_RECOVERY_MOMENT_ID = 'memory.recovery.archive-reassembly';
const CONSCIOUSNESS_BLOOM_MOMENT_ID = 'consciousness.bloom.thought-aurora';
const HARMONY_CONVERGENCE_MOMENT_ID = 'harmony.convergence.ascension-platform';
const LEGENDARY_BOND_MOMENT_ID = 'legendary.bond.manifestation.covenant-lattice';
const MYTHIC_SIGNAL_MOMENT_ID = 'mythic.signal.dimensional-gateway';
const WORLD_PERSONALITY_SHIFT_MOMENT_ID = 'personality.world-temperament-shift';
const GRAND_CORRUPTION_BREACH_MOMENT_ID = 'corruption.grand-breach.veil-fracture';
const HEROIC_STABILIZATION_MOMENT_ID = 'heroic.stabilization.before-collapse';

const RELEASE_SIGNATURE_WORLD_IDS = Object.freeze(new Set(['quantum', 'desert']));
const RELEASE_SIGNATURE_ALLOWLIST = Object.freeze(new Set([
  LEGENDARY_BOND_MOMENT_ID,
  CASCADE_RECONSTRUCTION_MOMENT_ID,
  SYNERGY_APEX_MOMENT_ID,
  CONSCIOUSNESS_BLOOM_MOMENT_ID,
  WORLD_PERSONALITY_SHIFT_MOMENT_ID,
  HEROIC_STABILIZATION_MOMENT_ID,
  GRAND_CORRUPTION_BREACH_MOMENT_ID
]));
const RELEASE_WORLD_SKIN_PROFILES = Object.freeze({
  quantum: Object.freeze({
    key: 'quantum',
    paletteTag: 'quantum-electric',
    worldSignature: 'probability-veil',
    dominantMix: '#C8FAFF',
    accentMix: '#7AA8FF',
    glowMix: '#FFF9DA',
    intensityBoost: 0.08,
    telegraphBias: 0.86,
    crestBias: 1.08,
    atmosphere: Object.freeze({
      signalBias: 0.16,
      canopyBoost: 0.14,
      horizonBoost: 0.1,
      driftBoost: 0.08,
      foldBias: 0.18
    })
  }),
  desert: Object.freeze({
    key: 'desert',
    paletteTag: 'desert-mirage',
    worldSignature: 'mirage-bloom',
    dominantMix: '#FFD99A',
    accentMix: '#76E9D8',
    glowMix: '#FFF3D0',
    intensityBoost: 0.02,
    telegraphBias: 1.08,
    crestBias: 0.94,
    atmosphere: Object.freeze({
      signalBias: 0.1,
      canopyBoost: 0.08,
      horizonBoost: 0.18,
      driftBoost: 0.14,
      foldBias: 0.08
    })
  })
});

const DEFAULT_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 650,
  crestMs: 900,
  afterglowMs: 3200
});

const CASCADE_RECONSTRUCTION_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 760,
  crestMs: 980,
  afterglowMs: 3800
});

const MEMORY_RECOVERY_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 820,
  crestMs: 1080,
  afterglowMs: 4400
});

const CONSCIOUSNESS_BLOOM_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 720,
  crestMs: 960,
  afterglowMs: 5000
});

const HARMONY_CONVERGENCE_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 840,
  crestMs: 1180,
  afterglowMs: 5000
});

const LEGENDARY_BOND_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 780,
  crestMs: 1120,
  afterglowMs: 6400
});

const MYTHIC_SIGNAL_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 960,
  crestMs: 1320,
  afterglowMs: 7600
});

const WORLD_PERSONALITY_SHIFT_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 920,
  crestMs: 1320,
  afterglowMs: 7600
});

const GRAND_CORRUPTION_BREACH_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 880,
  crestMs: 1240,
  afterglowMs: 8600
});

const HEROIC_STABILIZATION_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 860,
  crestMs: 1180,
  afterglowMs: 7800
});

const DEFAULT_BLUEPRINT_CONFIG = Object.freeze({
  id: SYNERGY_APEX_MOMENT_ID,
  label: 'Synergy Apex / Network Resonance Surge',
  tier: 'A',
  family: 'synergy',
  sourceEvents: Object.freeze(['global.synergy.high', 'coherenceApex', 'COSMIC_PULSE']),
  cooldownMs: 45000,
  maxConcurrent: 1,
  minScore: 0.72,
  minAnchorConfidence: 0.65,
  stageDurations: DEFAULT_STAGE_DURATIONS
});

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeMetricValue(value) {
  if (!Number.isFinite(value)) return 0;
  if (value > 1) return clamp01(value / 100);
  return clamp01(value);
}

function resolveNumeric(value) {
  return Number.isFinite(value) ? value : 0;
}

function normalizeWorldId(worldId) {
  return String(worldId || '').trim().toLowerCase();
}

function resolveReleaseSignatureProfile(worldId) {
  const normalized = normalizeWorldId(worldId);
  if (!RELEASE_SIGNATURE_WORLD_IDS.has(normalized)) return null;
  return RELEASE_WORLD_SKIN_PROFILES[normalized] || null;
}

function vectorLikeToPlain(value) {
  if (!value) return null;

  if (Array.isArray(value) && value.length >= 3) {
    const x = Number(value[0]);
    const y = Number(value[1]);
    const z = Number(value[2]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return { x, y, z };
    }
  }

  if (Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)) {
    return {
      x: Number(value.x),
      y: Number(value.y),
      z: Number(value.z)
    };
  }

  return null;
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) * 0.5,
    y: (a.y + b.y) * 0.5,
    z: (a.z + b.z) * 0.5
  };
}

function getNodePosition(node) {
  if (!node) return null;
  return vectorLikeToPlain(node.position)
    || vectorLikeToPlain(node.userData?.anchor)
    || vectorLikeToPlain(node.userData?.position)
    || vectorLikeToPlain(node.userData?.worldPosition)
    || null;
}

function getLinkAnchor(link) {
  if (!link) return null;

  const directAnchor = vectorLikeToPlain(link.userData?.anchor)
    || vectorLikeToPlain(link.anchor)
    || vectorLikeToPlain(link.userData?.burstAnchor);
  if (directAnchor) return directAnchor;

  const sourceNode = link.source || link.sourceNode || link.from || null;
  const targetNode = link.target || link.targetNode || link.to || null;
  const sourcePosition = getNodePosition(sourceNode);
  const targetPosition = getNodePosition(targetNode);

  if (sourcePosition && targetPosition) {
    return midpoint(sourcePosition, targetPosition);
  }

  return sourcePosition || targetPosition || null;
}

function getCanonicalSynergyValue(link) {
  if (!link) return 0;

  const candidates = [
    link.userData?.synergy,
    link.userData?.metrics?.synergy,
    link.userData?.metrics?.synergyNorm,
    link.userData?.metrics?.value,
    link.glowData?.synergy,
    link.synergy,
    link.score
  ];

  for (const candidate of candidates) {
    if (Number.isFinite(candidate)) {
      return normalizeMetricValue(candidate);
    }
  }

  return 0;
}

function getNodeSynergyScore(node) {
  if (!node) return 0;

  const metrics = node.userData?.metrics || node.userData || {};
  const candidates = [
    metrics.synergy,
    metrics.synergyNorm,
    metrics.harmony,
    metrics.stability,
    metrics.value
  ];

  for (const candidate of candidates) {
    if (Number.isFinite(candidate)) {
      return normalizeMetricValue(candidate);
    }
  }

  return 0;
}

function resolveCount(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function resolveActiveLinkCount(context) {
  return resolveCount(
    context?.activeLinkCount
      ?? context?.consciousness?.activeLinkCount
      ?? context?.metrics?.activeLinkCount
      ?? context?.metrics?.linkCount
      ?? context?.linkCount
      ?? 0
  );
}

function resolveNodeById(context, nodeId) {
  if (!nodeId) return null;

  const collections = [
    context?.nodes,
    context?.aiNodes?.nodes,
    context?.linkingSystem?.nodes
  ];

  for (const collection of collections) {
    if (!Array.isArray(collection)) continue;

    const found = collection.find((node) => {
      const candidateId = node?.userData?.nodeId || node?.id || node?.uuid || null;
      return candidateId === nodeId;
    });

    if (found) return found;
  }

  const linkingSystem = context?.linkingSystem || null;
  if (typeof linkingSystem?.getNodeById === 'function') {
    try {
      const node = linkingSystem.getNodeById(nodeId);
      if (node) return node;
    } catch (_) {
      /* ignore lookup failures */
    }
  }

  const aiNodes = context?.aiNodes || null;
  if (typeof aiNodes?.getNodeById === 'function') {
    try {
      const node = aiNodes.getNodeById(nodeId);
      if (node) return node;
    } catch (_) {
      /* ignore lookup failures */
    }
  }

  return null;
}

function resolveLinkById(context, linkId) {
  if (!linkId) return null;

  const links = resolveLinkCollection(context);
  for (const link of links) {
    const candidateId = link?.id || link?.uuid || link?.userData?.linkId || link?.name || null;
    if (candidateId === linkId) {
      return link;
    }
  }

  return null;
}

function isLegendaryNode(node, context) {
  if (!node) return false;

  if (node.userData?.isLegendary === true || node.userData?.legendary === true) {
    return true;
  }

  const nodeId = node?.userData?.nodeId || node?.id || node?.uuid || null;
  if (!nodeId) return false;

  const legendaryPack = context?.legendaryPack || null;
  try {
    if (typeof legendaryPack?.isLegendary === 'function' && legendaryPack.isLegendary(nodeId)) {
      return true;
    }
  } catch (_) {
    /* ignore lookup failures */
  }

  try {
    if (typeof legendaryPack?.getLegendaryInfo === 'function' && legendaryPack.getLegendaryInfo(nodeId)) {
      return true;
    }
  } catch (_) {
    /* ignore lookup failures */
  }

  const registry = legendaryPack?.registry || null;
  if (registry) {
    if (typeof registry.has === 'function' && registry.has(nodeId)) return true;
    if (registry[nodeId]) return true;
  }

  const nodes = legendaryPack?.nodes || null;
  if (nodes) {
    if (typeof nodes.has === 'function' && nodes.has(nodeId)) return true;
    if (nodes[nodeId]) return true;
  }

  return false;
}

function resolveLinkCollection(context) {
  if (Array.isArray(context?.links)) return context.links;
  if (Array.isArray(context?.linkingSystem?.links)) return context.linkingSystem.links;
  if (Array.isArray(context?.aiNodes?.links)) return context.aiNodes.links;
  return [];
}

function resolveLinkCorruptionTransmission(context) {
  return context?.linkCorruptionTransmission
    || context?.corruptionTransmission
    || context?.aiNodes?.linkCorruption
    || null;
}

function resolveCollapsedLinkCount(context) {
  const transmission = resolveLinkCorruptionTransmission(context);
  const links = resolveLinkCollection(context);
  let count = 0;

  for (const link of links) {
    const linkId = link?.id || link?.uuid || link?.name || null;
    if (!linkId) continue;

    const integrityData = transmission?.linkIntegrity?.get?.(linkId) || null;
    const collapsedViaTransmission = transmission?.collapsedLinks?.has?.(linkId) === true;
    const collapsedViaState = integrityData?.state === 'collapsed';
    const collapsedViaLink = String(link?.userData?.linkIntegrity?.state || link?.userData?.state || '').toLowerCase() === 'collapsed';

    if (collapsedViaTransmission || collapsedViaState || collapsedViaLink) {
      count += 1;
    }
  }

  return count;
}

function summarizeSignalPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const summary = {};
  const fields = [
    'source',
    'family',
    'phase',
    'eventKey',
    'eventName',
    'worldEventType',
    'metric',
    'metricKey',
    'value',
    'intensity',
    'timestamp'
  ];

  for (const field of fields) {
    if (payload[field] !== undefined) {
      summary[field] = payload[field];
    }
  }

  return Object.keys(summary).length > 0 ? summary : null;
}

function resolveReadabilityBudget(context) {
  const metrics = context?.metrics || {};
  const consciousness = context?.consciousness || {};

  const synergy = normalizeMetricValue(
    metrics.synergy
      ?? metrics.synergyNorm
      ?? metrics.globalSynergy
      ?? metrics.coherence
      ?? consciousness.coherence
      ?? 0
  );
  const harmony = normalizeMetricValue(
    metrics.harmony
      ?? metrics.harmonyNorm
      ?? consciousness.avgHarmony
      ?? 0
  );
  const loadPressure = normalizeMetricValue(
    metrics.loadPressure
      ?? metrics.loadPressureNorm
      ?? consciousness.networkPressure
      ?? 0
  );
  const corruption = normalizeMetricValue(
    metrics.corruption
      ?? metrics.corruptionNorm
      ?? consciousness.avgCorruption
      ?? 0
  );
  const volatility = normalizeMetricValue(
    metrics.volatility
      ?? consciousness.volatility
      ?? 0
  );
  const activeLinkCount = resolveActiveLinkCount(context);
  const linkFactor = clamp01(activeLinkCount / 3);

  return clamp01(
    0.46
      + synergy * 0.34
      + harmony * 0.08
      + linkFactor * 0.16
      - loadPressure * 0.14
      - corruption * 0.08
      - volatility * 0.06
  );
}

function resolveSynergyAnchor(context) {
  const focusAnchor = vectorLikeToPlain(context?.focusAnchor)
    || vectorLikeToPlain(context?.anchor)
    || null;
  if (focusAnchor) {
    return {
      position: focusAnchor,
      confidence: 1.0,
      source: 'focus-anchor'
    };
  }

  const focusLink = context?.focusLink || context?.selectedLink || context?.primaryLink || null;
  const linkAnchor = getLinkAnchor(focusLink);
  if (linkAnchor) {
    return {
      position: linkAnchor,
      confidence: 0.9,
      source: 'focus-link',
      linkId: focusLink?.id || focusLink?.userData?.linkId || null
    };
  }

  const focusNode = context?.focusNode || context?.selectedNode || context?.primaryNode || null;
  const nodePosition = getNodePosition(focusNode);
  if (nodePosition) {
    return {
      position: nodePosition,
      confidence: 0.82,
      source: 'focus-node',
      nodeId: focusNode?.userData?.nodeId || focusNode?.id || focusNode?.uuid || null
    };
  }

  const links = Array.isArray(context?.links)
    ? context.links
    : Array.isArray(context?.linkingSystem?.links)
      ? context.linkingSystem.links
      : [];

  let strongestLink = null;
  let strongestScore = -1;
  for (const link of links) {
    const anchor = getLinkAnchor(link);
    if (!anchor) continue;

    const score = getCanonicalSynergyValue(link);
    if (score >= strongestScore) {
      strongestScore = score;
      strongestLink = {
        position: anchor,
        confidence: 0.72 + score * 0.2,
        source: 'strongest-link',
        linkId: link?.id || link?.userData?.linkId || null
      };
    }
  }

  if (strongestLink) return strongestLink;

  const nodes = Array.isArray(context?.nodes)
    ? context.nodes
    : Array.isArray(context?.aiNodes?.nodes)
      ? context.aiNodes.nodes
      : [];

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let sumWeight = 0;

  for (const node of nodes) {
    const position = getNodePosition(node);
    if (!position) continue;

    const nodeWeight = 0.35 + getNodeSynergyScore(node) * 0.45 + clamp01(resolveActiveLinkCount({ metrics: node.userData?.metrics || node.userData }) / 4) * 0.2;
    sumX += position.x * nodeWeight;
    sumY += position.y * nodeWeight;
    sumZ += position.z * nodeWeight;
    sumWeight += nodeWeight;
  }

  if (sumWeight > 0) {
    return {
      position: {
        x: sumX / sumWeight,
        y: sumY / sumWeight,
        z: sumZ / sumWeight
      },
      confidence: 0.68,
      source: 'node-centroid'
    };
  }

  const cameraPosition = vectorLikeToPlain(context?.camera?.position);
  if (cameraPosition) {
    return {
      position: {
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z - 2
      },
      confidence: 0.34,
      source: 'camera-fallback'
    };
  }

  return null;
}

function resolveReconstructionReadabilityBudget(context) {
  const metrics = context?.metrics || {};
  const consciousness = context?.consciousness || {};

  const synergy = normalizeMetricValue(
    metrics.synergy
      ?? metrics.synergyNorm
      ?? metrics.globalSynergy
      ?? consciousness.coherence
      ?? 0
  );
  const harmony = normalizeMetricValue(
    metrics.harmony
      ?? metrics.harmonyNorm
      ?? consciousness.avgHarmony
      ?? 0
  );
  const stability = normalizeMetricValue(
    metrics.stability
      ?? consciousness.stability
      ?? 0
  );
  const corruption = normalizeMetricValue(
    metrics.corruption
      ?? metrics.corruptionNorm
      ?? consciousness.avgCorruption
      ?? 0
  );
  const loadPressure = normalizeMetricValue(
    metrics.loadPressure
      ?? metrics.loadPressureNorm
      ?? consciousness.networkPressure
      ?? 0
  );
  const activeLinkCount = resolveActiveLinkCount(context);
  const collapsedLinkCount = resolveCollapsedLinkCount(context);
  const healingSignal = normalizeMetricValue(
    context?.sourcePayload?.harmonyRestored
      ?? context?.sourcePayload?.effectiveAmount
      ?? context?.sourcePayload?.intensity
      ?? 0
  );

  return clamp01(
    0.34
      + harmony * 0.24
      + stability * 0.18
      + synergy * 0.14
      + healingSignal * 0.16
      + clamp01(collapsedLinkCount / 2) * 0.14
      + clamp01(activeLinkCount / 4) * 0.08
      - corruption * 0.12
      - loadPressure * 0.12
  );
}

function resolveCascadeReconstructionAnchor(context) {
  const sourcePayloadAnchor = vectorLikeToPlain(context?.sourcePayload?.position)
    || vectorLikeToPlain(context?.sourcePayload?.anchor)
    || null;
  if (sourcePayloadAnchor) {
    return {
      position: sourcePayloadAnchor,
      confidence: context?.sourceEvent === 'topology.healing' ? 0.98 : 0.86,
      source: context?.sourceEvent === 'topology.healing' ? 'topology-healing' : 'cascade-payload'
    };
  }

  const transmission = resolveLinkCorruptionTransmission(context);
  const links = resolveLinkCollection(context);
  let bestCollapsed = null;

  for (const link of links) {
    const anchor = getLinkAnchor(link);
    if (!anchor) continue;

    const linkId = link?.id || link?.uuid || link?.name || null;
    if (!linkId) continue;

    const integrityData = transmission?.linkIntegrity?.get?.(linkId) || null;
    const collapsed = transmission?.collapsedLinks?.has?.(linkId) === true
      || integrityData?.state === 'collapsed'
      || String(link?.userData?.linkIntegrity?.state || link?.userData?.state || '').toLowerCase() === 'collapsed';
    if (!collapsed) continue;

    const canRebuild = typeof transmission?.canRebuildLink === 'function'
      ? transmission.canRebuildLink(link)
      : null;
    const corruptionData = transmission?.linkCorruption?.get?.(linkId) || null;
    const integrityScore = normalizeMetricValue(
      integrityData?.integrity
        ?? link?.userData?.linkIntegrity?.integrity
        ?? link?.userData?.metrics?.integrity
        ?? 0
    );
    const corruptionScore = normalizeMetricValue(
      corruptionData?.level
        ?? link?.userData?.corruptionLevel
        ?? link?.userData?.metrics?.corruptionLevel
        ?? 0
    );
    const score = (canRebuild?.canRebuild === true ? 1.0 : 0.72)
      + corruptionScore * 0.18
      + (1 - integrityScore) * 0.1;

    if (!bestCollapsed || score > bestCollapsed.score) {
      bestCollapsed = {
        position: anchor,
        confidence: canRebuild?.canRebuild === true ? 0.96 : 0.78,
        source: canRebuild?.canRebuild === true ? 'reconstructible-link' : 'collapsed-link',
        linkId,
        score
      };
    }
  }

  if (bestCollapsed) return bestCollapsed;

  const focusLink = context?.focusLink || context?.selectedLink || context?.primaryLink || null;
  const focusLinkAnchor = getLinkAnchor(focusLink);
  if (focusLinkAnchor) {
    return {
      position: focusLinkAnchor,
      confidence: 0.82,
      source: 'focus-link',
      linkId: focusLink?.id || focusLink?.userData?.linkId || null
    };
  }

  const focusNode = context?.focusNode || context?.selectedNode || context?.primaryNode || null;
  const focusNodePosition = getNodePosition(focusNode);
  if (focusNodePosition) {
    return {
      position: focusNodePosition,
      confidence: 0.72,
      source: 'focus-node',
      nodeId: focusNode?.userData?.nodeId || focusNode?.id || focusNode?.uuid || null
    };
  }

  const collapsedLinkCount = resolveCollapsedLinkCount(context);
  const nodes = Array.isArray(context?.nodes)
    ? context.nodes
    : Array.isArray(context?.aiNodes?.nodes)
      ? context.aiNodes.nodes
      : [];

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let sumWeight = 0;

  for (const node of nodes) {
    const position = getNodePosition(node);
    if (!position) continue;

    const nodeWeight = 0.28
      + getNodeSynergyScore(node) * 0.34
      + clamp01(resolveActiveLinkCount({ metrics: node.userData?.metrics || node.userData }) / 4) * 0.14
      + clamp01(collapsedLinkCount / 3) * 0.12;
    sumX += position.x * nodeWeight;
    sumY += position.y * nodeWeight;
    sumZ += position.z * nodeWeight;
    sumWeight += nodeWeight;
  }

  if (sumWeight > 0) {
    return {
      position: {
        x: sumX / sumWeight,
        y: sumY / sumWeight,
        z: sumZ / sumWeight
      },
      confidence: 0.66,
      source: 'reconstruction-centroid'
    };
  }

  const cameraPosition = vectorLikeToPlain(context?.camera?.position);
  if (cameraPosition) {
    return {
      position: {
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z - 2
      },
      confidence: 0.32,
      source: 'camera-fallback'
    };
  }

  return null;
}

function resolveChronicleEntryCount(context) {
  const stats = context?.chronicleStats
    || context?.networkChronicle?.getStats?.()
    || null;

  if (Number.isFinite(stats?.entries)) {
    return resolveCount(stats.entries);
  }

  const entries = context?.networkChronicle?.getChronicle?.();
  return Array.isArray(entries) ? entries.length : 0;
}

function resolveMemoryWorldActive(context) {
  if (context?.memoryWorldActive === true) return true;

  const worldId = String(context?.worldId || '').toLowerCase();
  const currentMode = String(context?.currentMode || '').toLowerCase();
  const worldName = String(context?.currentWorldName || context?.worldName || '').toLowerCase();

  return worldId === 'memory' || currentMode === 'memory' || worldName.includes('memory lane');
}

function resolveMemoryPressureSignal(context) {
  const payload = context?.sourcePayload || {};
  const metrics = context?.metrics || {};
  const consciousness = context?.consciousness || {};

  return normalizeMetricValue(
    payload.memoryPressure
      ?? payload.pressure
      ?? payload.archivePressure
      ?? context?.memoryPressure
      ?? metrics.memoryPressure
      ?? metrics.memoryPressureNorm
      ?? metrics.loadPressure
      ?? metrics.loadPressureNorm
      ?? consciousness.memoryPressure
      ?? consciousness.networkPressure
      ?? 0
  );
}

function resolveMemoryRecoveryReadabilityBudget(context) {
  const metrics = context?.metrics || {};
  const consciousness = context?.consciousness || {};
  const chronicleDepth = resolveChronicleEntryCount(context);
  const chronicleFactor = clamp01(chronicleDepth / 10);
  const memoryPressure = resolveMemoryPressureSignal(context);
  const memoryWorldFactor = resolveMemoryWorldActive(context) ? 0.14 : 0;

  const synergy = normalizeMetricValue(
    metrics.synergy
      ?? metrics.synergyNorm
      ?? metrics.globalSynergy
      ?? consciousness.coherence
      ?? 0
  );
  const harmony = normalizeMetricValue(
    metrics.harmony
      ?? metrics.harmonyNorm
      ?? consciousness.avgHarmony
      ?? 0
  );
  const stability = normalizeMetricValue(
    metrics.stability
      ?? consciousness.stability
      ?? 0
  );
  const corruption = normalizeMetricValue(
    metrics.corruption
      ?? metrics.corruptionNorm
      ?? consciousness.avgCorruption
      ?? 0
  );
  const loadPressure = normalizeMetricValue(
    metrics.loadPressure
      ?? metrics.loadPressureNorm
      ?? consciousness.networkPressure
      ?? 0
  );

  return clamp01(
    0.31
      + harmony * 0.18
      + stability * 0.2
      + synergy * 0.08
      + chronicleFactor * 0.18
      + memoryPressure * 0.12
      + memoryWorldFactor
      - corruption * 0.1
      - loadPressure * 0.08
  );
}

function resolveMemoryRecoveryAnchor(context) {
  const focusAnchor = vectorLikeToPlain(context?.focusAnchor)
    || vectorLikeToPlain(context?.anchor)
    || null;
  if (focusAnchor) {
    return {
      position: focusAnchor,
      confidence: 1.0,
      source: 'focus-anchor'
    };
  }

  const memoryLane = context?.memoryLane || null;
  const memoryCore = vectorLikeToPlain(memoryLane?.coreLight?.position)
    || vectorLikeToPlain(memoryLane?.innerCore?.position)
    || vectorLikeToPlain(memoryLane?.coreActivityColumn?.position)
    || vectorLikeToPlain(memoryLane?.floorRing?.position);
  if (memoryCore) {
    return {
      position: memoryCore,
      confidence: resolveMemoryWorldActive(context) ? 0.98 : 0.86,
      source: resolveMemoryWorldActive(context) ? 'memory-core' : 'memory-archive-core'
    };
  }

  const focusLink = context?.focusLink || context?.selectedLink || context?.primaryLink || null;
  const linkAnchor = getLinkAnchor(focusLink);
  if (linkAnchor) {
    return {
      position: linkAnchor,
      confidence: 0.8,
      source: 'focus-link',
      linkId: focusLink?.id || focusLink?.userData?.linkId || null
    };
  }

  const focusNode = context?.focusNode || context?.selectedNode || context?.primaryNode || null;
  const nodePosition = getNodePosition(focusNode);
  if (nodePosition) {
    return {
      position: nodePosition,
      confidence: 0.76,
      source: 'focus-node',
      nodeId: focusNode?.userData?.nodeId || focusNode?.id || focusNode?.uuid || null
    };
  }

  const nodes = Array.isArray(context?.nodes)
    ? context.nodes
    : Array.isArray(context?.aiNodes?.nodes)
      ? context.aiNodes.nodes
      : [];

  const chronicleFactor = clamp01(resolveChronicleEntryCount(context) / 8);

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let sumWeight = 0;

  for (const node of nodes) {
    const position = getNodePosition(node);
    if (!position) continue;

    const nodeWeight = 0.24
      + getNodeSynergyScore(node) * 0.24
      + chronicleFactor * 0.2
      + clamp01(resolveActiveLinkCount({ metrics: node.userData?.metrics || node.userData }) / 4) * 0.12;
    sumX += position.x * nodeWeight;
    sumY += position.y * nodeWeight;
    sumZ += position.z * nodeWeight;
    sumWeight += nodeWeight;
  }

  if (sumWeight > 0) {
    return {
      position: {
        x: sumX / sumWeight,
        y: sumY / sumWeight,
        z: sumZ / sumWeight
      },
      confidence: 0.66,
      source: 'archive-centroid'
    };
  }

  const cameraPosition = vectorLikeToPlain(context?.camera?.position);
  if (cameraPosition) {
    return {
      position: {
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z - 2
      },
      confidence: 0.34,
      source: 'camera-fallback'
    };
  }

  return null;
}

function resolveWorldMoodState(context) {
  return context?.worldMoodState
    || context?.worldPersonalityController?.getMoodState?.()
    || null;
}

function resolveWorldMoodSnapshot(context) {
  const worldMoodState = resolveWorldMoodState(context);
  const mood = worldMoodState?.mood || null;
  const payload = context?.sourcePayload || {};
  const visualContext = mood?.visualContext
    || payload.visualContext
    || null;

  return {
    worldMoodState,
    mood,
    payload,
    visualContext,
    moodLabel: String(mood?.label || payload.label || '').toUpperCase(),
    dominantSignature: String(visualContext?.dominantSignature || payload.dominantSignature || 'neutral_balance'),
    intensity: normalizeMetricValue(mood?.intensity ?? payload.intensity ?? 0),
    transitionProgress: resolve01(worldMoodState?.transitionProgress ?? 0),
    activeVisuals: resolveCount(worldMoodState?.activeVisuals?.length ?? 0),
    clusterCount: resolveCount(worldMoodState?.clusterCount ?? 0),
    moodChanged: payload?.moodChanged === true,
  };
}

function resolveWorldPersonalityShiftReadabilityBudget(context) {
  const snapshot = resolveWorldMoodSnapshot(context);
  const visualContext = snapshot.visualContext || {};
  const core = clamp01(Number(visualContext.core) || 0);
  const surface = clamp01(Number(visualContext.surface) || 0);
  const overlay = clamp01(Number(visualContext.overlay) || 0);
  const atmosphere = clamp01(Number(visualContext.atmosphere) || 0);

  const signatureBonus = snapshot.dominantSignature && snapshot.dominantSignature !== 'neutral_balance' ? 0.16 : 0;
  const nonNeutralBonus = snapshot.moodLabel && snapshot.moodLabel !== 'NEUTRAL' ? 0.12 : 0;

  return clamp01(
    0.28
      + snapshot.intensity * 0.32
      + snapshot.transitionProgress * 0.12
      + clamp01(snapshot.activeVisuals / 4) * 0.08
      + clamp01(snapshot.clusterCount / 6) * 0.06
      + core * 0.06
      + surface * 0.05
      + overlay * 0.05
      + atmosphere * 0.05
      + signatureBonus
      + nonNeutralBonus
      - (snapshot.moodLabel === 'NEUTRAL' ? 0.2 : 0)
  );
}

function resolveWorldPersonalityShiftAnchor(context) {
  const focusAnchor = vectorLikeToPlain(context?.focusAnchor)
    || vectorLikeToPlain(context?.anchor)
    || null;
  if (focusAnchor) {
    return {
      position: focusAnchor,
      confidence: 0.98,
      source: 'focus-anchor'
    };
  }

  const controller = context?.worldPersonalityController || null;
  const controllerAnchor = vectorLikeToPlain(controller?.root?.position)
    || vectorLikeToPlain(controller?.worldRoot?.position)
    || vectorLikeToPlain(context?.scene?.position);
  if (controllerAnchor) {
    return {
      position: controllerAnchor,
      confidence: 0.95,
      source: 'world-personality-root'
    };
  }

  const cameraPosition = vectorLikeToPlain(context?.camera?.position);
  if (cameraPosition) {
    return {
      position: {
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z - 1.5
      },
      confidence: 0.34,
      source: 'camera-fallback'
    };
  }

  return null;
}

function resolveWorldPersonalityShiftAudioProfile(context) {
  const snapshot = resolveWorldMoodSnapshot(context);
  const moodLabel = snapshot.moodLabel;

  switch (moodLabel) {
    case 'ASCENDED_ALIGNMENT':
      return {
        family: 'ritual',
        telegraphCue: 'dramaturgy-ritual-telegraph',
        crestCue: 'dramaturgy-ritual-escalation',
        afterglowCue: 'dramaturgy-ritual-payoff',
        audioLayer: 'halo-choir'
      };
    case 'HARMONIC_CALM':
      return {
        family: 'resonance',
        telegraphCue: 'dramaturgy-resonance-telegraph',
        crestCue: 'dramaturgy-resonance-escalation',
        afterglowCue: 'dramaturgy-resonance-payoff',
        audioLayer: 'halo-choir'
      };
    case 'FOCUSED_ANALYSIS':
      return {
        family: 'resonance',
        telegraphCue: 'dramaturgy-resonance-telegraph',
        crestCue: 'dramaturgy-resonance-escalation',
        afterglowCue: 'dramaturgy-resonance-payoff',
        audioLayer: 'sigil-bells'
      };
    case 'RADIANT_STORM':
      return {
        family: 'hazard',
        telegraphCue: 'dramaturgy-hazard-telegraph',
        crestCue: 'dramaturgy-hazard-escalation',
        afterglowCue: 'dramaturgy-hazard-payoff',
        audioLayer: 'pressure-rumble'
      };
    case 'QUANTUM_CHAOS':
      return {
        family: 'corruption',
        telegraphCue: 'dramaturgy-corruption-telegraph',
        crestCue: 'dramaturgy-corruption-escalation',
        afterglowCue: 'dramaturgy-corruption-payoff',
        audioLayer: 'residue-choir'
      };
    case 'UMBRA_PRESSURE':
      return {
        family: 'corruption',
        telegraphCue: 'dramaturgy-corruption-telegraph',
        crestCue: 'dramaturgy-corruption-escalation',
        afterglowCue: 'dramaturgy-corruption-payoff',
        audioLayer: 'pressure-rumble'
      };
    case 'ECHO_DRIFT':
      return {
        family: 'cascade',
        telegraphCue: 'dramaturgy-chrono-telegraph',
        crestCue: 'dramaturgy-chrono-bloom',
        afterglowCue: 'dramaturgy-chrono-afterglow',
        audioLayer: 'memory-winds'
      };
    default:
      return {
        family: 'resonance',
        telegraphCue: 'dramaturgy-resonance-telegraph',
        crestCue: 'dramaturgy-resonance-escalation',
        afterglowCue: 'dramaturgy-resonance-payoff',
        audioLayer: 'halo-choir'
      };
  }
}

function resolveWorldPersonalityShiftModulation(context) {
  const snapshot = resolveWorldMoodSnapshot(context);

  switch (snapshot.moodLabel) {
    case 'ASCENDED_ALIGNMENT':
      return { dominantFamily: 'resonance', dominantPhase: 'escalation', dominantIntensity: snapshot.intensity };
    case 'HARMONIC_CALM':
      return { dominantFamily: 'resonance', dominantPhase: 'payoff', dominantIntensity: snapshot.intensity };
    case 'FOCUSED_ANALYSIS':
      return { dominantFamily: 'resonance', dominantPhase: 'telegraph', dominantIntensity: snapshot.intensity };
    case 'RADIANT_STORM':
      return { dominantFamily: 'hazard', dominantPhase: 'escalation', dominantIntensity: snapshot.intensity };
    case 'QUANTUM_CHAOS':
      return { dominantFamily: 'corruption', dominantPhase: 'escalation', dominantIntensity: snapshot.intensity };
    case 'UMBRA_PRESSURE':
      return { dominantFamily: 'hazard', dominantPhase: 'telegraph', dominantIntensity: snapshot.intensity };
    case 'ECHO_DRIFT':
      return { dominantFamily: 'cascade', dominantPhase: 'telegraph', dominantIntensity: snapshot.intensity };
    default:
      return { dominantFamily: 'resonance', dominantPhase: 'telegraph', dominantIntensity: snapshot.intensity };
  }
}

function resolveConsciousnessBloomState(context) {
  const metrics = context?.metrics || {};
  const consciousness = context?.consciousness || {};
  const payload = context?.sourcePayload || {};
  const consciousnessLayer = context?.consciousnessLayer || null;
  const storms = context?.thoughtStorms || consciousnessLayer?.storms || null;
  const stormState = storms?.stormState || null;

  const networkMood = String(payload.networkMood || consciousness.networkMood || '').toUpperCase();
  const heroPhase = String(payload.heroPhase || consciousness.heroPhase || '').toUpperCase();
  const expressiveMood = ['SYNERGIC', 'BALANCED', 'FOCUSED'].includes(networkMood);
  const expressivePhase = ['AWAKENING', 'CONDUCTING', 'RITUAL', 'SURGE'].includes(heroPhase);
  const stormActive = !!stormState?.activeStorm && stormState.activeStorm !== 'none' && stormState.activeStorm !== 'NONE';
  const stormMood = String(stormState?.currentMood || '').toUpperCase();
  const stormType = String(stormState?.activeStorm || '').toUpperCase();

  return {
    metrics,
    consciousness,
    payload,
    consciousnessLayer,
    storms,
    stormState,
    networkMood,
    heroPhase,
    expressiveMood,
    expressivePhase,
    stormActive,
    stormMood,
    stormType,
    stormIntensity: normalizeMetricValue(stormState?.intensity ?? stormState?.stormIntensity ?? 0),
    networkHealth: normalizeMetricValue(
      payload.networkHealth
        ?? consciousness.networkHealth
        ?? 0
    ),
    networkPressure: normalizeMetricValue(
      payload.networkPressure
        ?? consciousness.networkPressure
        ?? metrics.loadPressure
        ?? 0
    ),
    trafficIntensity: normalizeMetricValue(
      payload.trafficIntensity
        ?? consciousness.trafficIntensity
        ?? metrics.trafficIntensity
        ?? 0
    ),
    ritualIntensity: normalizeMetricValue(
      payload.ritualIntensity
        ?? consciousness.ritualIntensity
        ?? 0
    ),
    patternDensity: normalizeMetricValue(
      payload.patternDensity
        ?? consciousness.patternDensity
        ?? 0
    ),
    coherence: normalizeMetricValue(
      payload.coherence
        ?? consciousness.coherence
        ?? 0
    ),
    volatility: normalizeMetricValue(
      payload.volatility
        ?? consciousness.volatility
        ?? 0
    ),
    heroIntensity: normalizeMetricValue(
      payload.heroIntensity
        ?? consciousness.heroIntensity
        ?? 0
    ),
    activeLinkCount: resolveActiveLinkCount(context),
    activeLinkRatio: normalizeMetricValue(consciousness.activeLinkRatio ?? 0),
    linkCount: resolveCount(consciousness.linkCount ?? context?.linkCount ?? 0),
    patternCount: resolveCount(consciousness.patternCount ?? 0),
    stormBoost: stormActive ? 0.14 : 0,
  };
}

function resolveConsciousnessBloomReadabilityBudget(context) {
  const state = resolveConsciousnessBloomState(context);
  return clamp01(
    0.22
      + state.networkHealth * 0.1
      + state.coherence * 0.18
      + state.heroIntensity * 0.14
      + state.patternDensity * 0.16
      + state.ritualIntensity * 0.1
      + state.trafficIntensity * 0.08
      + state.activeLinkRatio * 0.08
      + clamp01(state.activeLinkCount / 4) * 0.08
      + state.stormIntensity * 0.12
      + state.stormBoost
      + (state.expressiveMood ? 0.08 : 0)
      + (state.expressivePhase ? 0.1 : 0)
      + (state.stormActive && state.stormMood !== 'CALM' ? 0.06 : 0)
      - state.networkPressure * 0.08
      - state.volatility * 0.05
  );
}

function resolveConsciousnessBloomAnchor(context) {
  const state = resolveConsciousnessBloomState(context);
  const globalAnchor = vectorLikeToPlain(state.consciousnessLayer?.globalFieldMesh?.position)
    || vectorLikeToPlain(state.consciousnessLayer?.consciousnessGroup?.position)
    || vectorLikeToPlain(context?.scene?.position);

  if (globalAnchor) {
    return {
      position: globalAnchor,
      confidence: 0.98,
      source: 'global-consciousness-field'
    };
  }

  const focusAnchor = vectorLikeToPlain(context?.focusAnchor)
    || vectorLikeToPlain(context?.anchor)
    || null;
  if (focusAnchor) {
    return {
      position: focusAnchor,
      confidence: 0.9,
      source: 'focus-anchor'
    };
  }

  const focusLink = context?.focusLink || context?.selectedLink || context?.primaryLink || null;
  const linkAnchor = getLinkAnchor(focusLink);
  if (linkAnchor) {
    return {
      position: linkAnchor,
      confidence: 0.8,
      source: 'focus-link',
      linkId: focusLink?.id || focusLink?.userData?.linkId || null
    };
  }

  const focusNode = context?.focusNode || context?.selectedNode || context?.primaryNode || null;
  const nodePosition = getNodePosition(focusNode);
  if (nodePosition) {
    return {
      position: nodePosition,
      confidence: 0.74,
      source: 'focus-node',
      nodeId: focusNode?.userData?.nodeId || focusNode?.id || focusNode?.uuid || null
    };
  }

  const cameraPosition = vectorLikeToPlain(context?.camera?.position);
  if (cameraPosition) {
    return {
      position: {
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z - 1.5
      },
      confidence: 0.36,
      source: 'camera-fallback'
    };
  }

  return null;
}

function resolveConsciousnessBloomAudioProfile(context) {
  const state = resolveConsciousnessBloomState(context);

  return {
    family: 'resonance',
    telegraphCue: 'dramaturgy-resonance-telegraph',
    crestCue: 'dramaturgy-resonance-escalation',
    afterglowCue: 'dramaturgy-resonance-payoff',
    audioLayer: state.stormActive ? 'halo-choir' : 'sigil-bells'
  };
}

function resolveConsciousnessBloomModulation(context) {
  const state = resolveConsciousnessBloomState(context);
  const stage = String(context?.stage || 'telegraph');

  return {
    dominantFamily: 'resonance',
    dominantPhase: stage === 'afterglow'
      ? 'payoff'
      : stage === 'crest'
        ? 'escalation'
        : 'telegraph',
    dominantIntensity: clamp01(Math.max(
      state.coherence,
      state.heroIntensity,
      state.patternDensity,
      state.stormIntensity + state.stormBoost
    )),
    motif: 'consciousness-bloom'
  };
}

function resolveRitualMomentState(context, ritualTypes = []) {
  const metrics = context?.metrics || {};
  const consciousness = context?.consciousness || {};
  const payload = context?.sourcePayload || {};
  const worldMood = payload.worldMood || {};
  const ritualType = String(payload.ritualType || context?.ritual?.activeRitual || '');
  const ritualTypeAllowed = ritualTypes.length === 0 || ritualTypes.includes(ritualType);
  const phase = String(payload.phase || 'INIT');
  const phaseIntensity = normalizeMetricValue(payload.phaseIntensity ?? 0);
  const progress = normalizeMetricValue(payload.progress ?? 0);
  const harmony = normalizeMetricValue(
    worldMood.avgHarmony
      ?? worldMood.harmony
      ?? metrics.harmony
      ?? metrics.harmonyNorm
      ?? 0
  );
  const clarity = normalizeMetricValue(
    worldMood.avgClarity
      ?? worldMood.clarity
      ?? consciousness.coherence
      ?? 0
  );
  const stability = normalizeMetricValue(
    worldMood.avgStability
      ?? worldMood.stability
      ?? metrics.stability
      ?? metrics.stabilityNorm
      ?? 0
  );
  const energy = normalizeMetricValue(
    worldMood.avgEnergy
      ?? worldMood.energy
      ?? consciousness.trafficIntensity
      ?? 0
  );
  const loadPressure = normalizeMetricValue(
    worldMood.avgLoadPressure
      ?? metrics.loadPressure
      ?? consciousness.networkPressure
      ?? 0
  );
  const ascendedCount = resolveCount(worldMood.ascendedCount ?? payload.nodes?.length ?? 0);
  const balanceScore = clamp01(1 - ((Math.abs(harmony - 0.6) + Math.abs(clarity - 0.6) + Math.abs(energy - 0.6)) / 1.8));

  return {
    metrics,
    consciousness,
    payload,
    worldMood,
    ritualType,
    ritualTypeAllowed,
    phase,
    phaseIntensity,
    progress,
    harmony,
    clarity,
    stability,
    energy,
    loadPressure,
    ascendedCount,
    balanceScore,
    ritualIntensity: normalizeMetricValue(payload.ritualIntensity ?? payload.intensity ?? 0),
    sourceEvent: String(context?.sourceEvent || ''),
  };
}

function resolveRitualMomentAnchor(context, state, sourceLabel = 'ritual') {
  const payload = state?.payload || context?.sourcePayload || {};
  const payloadAnchor = vectorLikeToPlain(payload.anchor)
    || vectorLikeToPlain(payload.position)
    || vectorLikeToPlain(payload.worldPosition);
  if (payloadAnchor) {
    return {
      position: payloadAnchor,
      confidence: 0.98,
      source: `${sourceLabel}-payload-anchor`
    };
  }

  const nodeIds = Array.isArray(payload.nodes) ? payload.nodes : [];
  const positions = [];
  for (const nodeId of nodeIds) {
    const node = resolveNodeById(context, nodeId);
    const position = getNodePosition(node);
    if (position) positions.push(position);
  }

  if (!positions.length && payload.targetNodeId) {
    const targetNode = resolveNodeById(context, payload.targetNodeId);
    const targetPosition = getNodePosition(targetNode);
    if (targetPosition) {
      positions.push(targetPosition);
    }
  }

  if (positions.length > 0) {
    const centroid = positions.reduce((sum, position) => ({
      x: sum.x + position.x,
      y: sum.y + position.y,
      z: sum.z + position.z
    }), { x: 0, y: 0, z: 0 });
    const scale = 1 / positions.length;
    return {
      position: {
        x: centroid.x * scale,
        y: centroid.y * scale,
        z: centroid.z * scale
      },
      confidence: positions.length > 1 ? 0.9 : 0.88,
      source: `${sourceLabel}-node-centroid`
    };
  }

  const focusNode = context?.focusNode || context?.selectedNode || context?.primaryNode || null;
  const focusNodePosition = getNodePosition(focusNode);
  if (focusNodePosition) {
    return {
      position: focusNodePosition,
      confidence: 0.76,
      source: `${sourceLabel}-focus-node`
    };
  }

  const focusLink = context?.focusLink || context?.selectedLink || context?.primaryLink || null;
  const linkAnchor = getLinkAnchor(focusLink);
  if (linkAnchor) {
    return {
      position: linkAnchor,
      confidence: 0.72,
      source: `${sourceLabel}-focus-link`
    };
  }

  const cameraPosition = vectorLikeToPlain(context?.camera?.position);
  if (cameraPosition) {
    return {
      position: {
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z - 2
      },
      confidence: 0.34,
      source: `${sourceLabel}-camera-fallback`
    };
  }

  return null;
}

function resolveHarmonyConvergenceState(context) {
  return resolveRitualMomentState(context, ['HARMONY_CONVERGENCE', 'ASCENSION_RITUAL']);
}

function resolveHarmonyConvergenceReadabilityBudget(context) {
  const state = resolveHarmonyConvergenceState(context);
  return clamp01(
    0.32
      + state.harmony * 0.26
      + state.clarity * 0.2
      + state.stability * 0.12
      + state.phaseIntensity * 0.14
      + state.progress * 0.08
      + clamp01(state.ascendedCount / 4) * 0.12
      + state.balanceScore * 0.16
  );
}

function resolveHarmonyConvergenceAnchor(context) {
  return resolveRitualMomentAnchor(context, resolveHarmonyConvergenceState(context), 'harmony');
}

function resolveHarmonyConvergenceAudioProfile() {
  return {
    family: 'resonance',
    telegraphCue: 'dramaturgy-resonance-telegraph',
    crestCue: 'dramaturgy-resonance-escalation',
    afterglowCue: 'dramaturgy-resonance-payoff',
    audioLayer: 'halo-choir'
  };
}

function resolveHarmonyConvergenceModulation(context) {
  const state = resolveHarmonyConvergenceState(context);
  const stage = String(context?.stage || 'telegraph');

  return {
    dominantFamily: 'harmony',
    dominantPhase: stage === 'afterglow'
      ? 'ascension'
      : stage === 'crest'
        ? 'convergence'
        : 'telegraph',
    dominantIntensity: clamp01(Math.max(
      state.harmony,
      state.clarity,
      state.stability,
      state.phaseIntensity,
      state.balanceScore
    )),
    motif: 'ascension-platform'
  };
}

function resolveMythicSignalState(context) {
  const state = resolveRitualMomentState(context, ['MYTHIC_SIGNAL']);
  const gatewayCharge = clamp01(
    (state.balanceScore * 0.44)
      + (state.stability * 0.2)
      + (state.phaseIntensity * 0.16)
      + (state.progress * 0.1)
      + ((1 - state.loadPressure) * 0.1)
  );

  return {
    ...state,
    gatewayCharge,
    balanceGap: clamp01(1 - state.balanceScore),
    dimensionalAlignment: clamp01((state.harmony + state.clarity + state.energy + state.stability) * 0.25)
  };
}

function resolveMythicSignalReadabilityBudget(context) {
  const state = resolveMythicSignalState(context);
  return clamp01(
    0.34
      + state.gatewayCharge * 0.3
      + state.balanceScore * 0.18
      + state.dimensionalAlignment * 0.1
      + state.phaseIntensity * 0.06
      + state.progress * 0.06
  );
}

function resolveMythicSignalAnchor(context) {
  return resolveRitualMomentAnchor(context, resolveMythicSignalState(context), 'mythic');
}

function resolveMythicSignalAudioProfile() {
  return {
    family: 'ritual',
    telegraphCue: 'dramaturgy-ritual-telegraph',
    crestCue: 'dramaturgy-ritual-escalation',
    afterglowCue: 'dramaturgy-ritual-payoff',
    audioLayer: 'sigil-bells'
  };
}

function resolveMythicSignalModulation(context) {
  const state = resolveMythicSignalState(context);
  const stage = String(context?.stage || 'telegraph');

  return {
    dominantFamily: 'mythic',
    dominantPhase: stage === 'afterglow'
      ? 'gateway'
      : stage === 'crest'
        ? 'opening'
        : 'telegraph',
    dominantIntensity: clamp01(Math.max(
      state.gatewayCharge,
      state.balanceScore,
      state.dimensionalAlignment
    )),
    motif: 'dimensional-gateway'
  };
}

function resolveGrandCorruptionFieldPressure(context) {
  const transmission = resolveLinkCorruptionTransmission(context);
  const links = resolveLinkCollection(context);
  const nodes = Array.isArray(context?.nodes)
    ? context.nodes
    : Array.isArray(context?.aiNodes?.nodes)
      ? context.aiNodes.nodes
      : [];

  let corruptedLinkCount = 0;
  let corruptedNodeCount = 0;
  let totalLinkCorruption = 0;
  let totalNodeCorruption = 0;
  let topCorruption = 0;

  for (const link of links) {
    const linkId = link?.id || link?.uuid || link?.name || link?.userData?.linkId || null;
    if (!linkId) continue;

    const corruptionData = transmission?.linkCorruption?.get?.(linkId) || null;
    const corruptionLevel = normalizeMetricValue(
      corruptionData?.level
        ?? link?.userData?.metrics?.corruption
        ?? link?.userData?.corruption
        ?? link?.userData?.corruptionLevel
        ?? 0
    );

    if (corruptionLevel <= 0) continue;
    corruptedLinkCount += 1;
    totalLinkCorruption += corruptionLevel;
    if (corruptionLevel > topCorruption) topCorruption = corruptionLevel;
  }

  for (const node of nodes) {
    const corruptionLevel = normalizeMetricValue(
      node?.userData?.metrics?.corruption
        ?? node?.userData?.corruption
        ?? node?.corruption
        ?? 0
    );

    if (corruptionLevel <= 0) continue;
    corruptedNodeCount += 1;
    totalNodeCorruption += corruptionLevel;
    if (corruptionLevel > topCorruption) topCorruption = corruptionLevel;
  }

  return {
    corruptedLinkCount,
    corruptedNodeCount,
    averageLinkCorruption: corruptedLinkCount > 0 ? totalLinkCorruption / corruptedLinkCount : 0,
    averageNodeCorruption: corruptedNodeCount > 0 ? totalNodeCorruption / corruptedNodeCount : 0,
    topCorruption,
    collapsedLinkCount: resolveCollapsedLinkCount(context)
  };
}

function resolveGrandCorruptionState(context) {
  const metrics = context?.metrics || {};
  const consciousness = context?.consciousness || {};
  const payload = context?.sourcePayload || {};
  const sourceEvent = String(context?.sourceEvent || '');
  const fieldPressure = resolveGrandCorruptionFieldPressure(context);

  const corruption = normalizeMetricValue(
    payload.value
      ?? payload.corruptionLevel
      ?? payload.corruption
      ?? payload.intensity
      ?? metrics.corruption
      ?? metrics.corruptionLevel
      ?? metrics.corruptionNorm
      ?? consciousness.avgCorruption
      ?? 0
  );
  const stability = normalizeMetricValue(
    metrics.stability
      ?? metrics.stabilityNorm
      ?? consciousness.stability
      ?? 0
  );
  const loadPressure = normalizeMetricValue(
    metrics.loadPressure
      ?? metrics.loadPressureNorm
      ?? consciousness.networkPressure
      ?? 0
  );
  const volatility = normalizeMetricValue(
    metrics.volatility
      ?? consciousness.volatility
      ?? 0
  );
  const sourceBoost = sourceEvent === 'global.corruption.high'
    ? 0.14
    : sourceEvent === 'node.corruption.high'
      ? 0.1
      : sourceEvent === 'network:corruptionSpread'
        ? 0.08
        : sourceEvent === 'link.collapse.collapse'
          ? 0.12
          : sourceEvent === 'topology.rupture'
            ? 0.1
            : 0.04;

  return {
    metrics,
    consciousness,
    payload,
    sourceEvent,
    corruption,
    stability,
    loadPressure,
    volatility,
    fieldPressure,
    sourceBoost
  };
}

function resolveGrandCorruptionReadabilityBudget(context) {
  const state = resolveGrandCorruptionState(context);
  const fieldPressure = state.fieldPressure;

  return clamp01(
    0.26
      + state.corruption * 0.4
      + (1 - state.stability) * 0.14
      + state.loadPressure * 0.1
      + state.volatility * 0.06
      + clamp01(fieldPressure.corruptedLinkCount / 2) * 0.12
      + clamp01(fieldPressure.corruptedNodeCount / 3) * 0.08
      + clamp01(fieldPressure.topCorruption) * 0.1
      + clamp01(fieldPressure.collapsedLinkCount / 2) * 0.1
      + state.sourceBoost
  );
}

function resolveGrandCorruptionAnchor(context) {
  const state = resolveGrandCorruptionState(context);
  const payload = state.payload || {};

  const payloadAnchor = vectorLikeToPlain(payload.position)
    || vectorLikeToPlain(payload.anchor)
    || vectorLikeToPlain(payload.worldPosition);
  if (payloadAnchor) {
    return {
      position: payloadAnchor,
      confidence: 0.98,
      source: 'corruption-payload'
    };
  }

  const payloadNodeAnchor = getNodePosition(payload.node || null);
  if (payloadNodeAnchor) {
    return {
      position: payloadNodeAnchor,
      confidence: 0.97,
      source: 'corruption-node-payload',
      nodeId: payload.node?.userData?.nodeId || payload.node?.id || payload.node?.uuid || null
    };
  }

  const payloadLinkId = payload.linkId || payload.link?.id || payload.link?.userData?.linkId || null;
  const payloadNodeId = payload.nodeId || payload.targetNodeId || payload.node?.userData?.nodeId || payload.node?.id || payload.node?.uuid || null;
  const transmission = resolveLinkCorruptionTransmission(context);
  const links = resolveLinkCollection(context);
  let best = null;

  for (const link of links) {
    const anchor = getLinkAnchor(link);
    if (!anchor) continue;

    const linkId = link?.id || link?.uuid || link?.name || link?.userData?.linkId || null;
    const corruptionData = transmission?.linkCorruption?.get?.(linkId) || null;
    const corruptionLevel = normalizeMetricValue(
      corruptionData?.level
        ?? link?.userData?.metrics?.corruption
        ?? link?.userData?.corruption
        ?? link?.userData?.corruptionLevel
        ?? 0
    );

    if (corruptionLevel <= 0) continue;

    const stabilityScore = normalizeMetricValue(link?.userData?.metrics?.stability ?? 0);
    const collapsed = transmission?.collapsedLinks?.has?.(linkId) === true
      || String(link?.userData?.linkIntegrity?.state || link?.userData?.state || '').toLowerCase() === 'collapsed';

    let score = corruptionLevel * 0.82 + (1 - stabilityScore) * 0.08 + (collapsed ? 0.08 : 0);
    if (payloadLinkId && linkId && payloadLinkId === linkId) score += 0.12;
    if (state.sourceEvent === 'network:corruptionSpread') score += 0.04;
    if (state.sourceEvent === 'global.corruption.high') score += 0.05;

    if (!best || score > best.score) {
      best = {
        position: anchor,
        confidence: clamp01(0.58 + score * 0.34),
        source: collapsed ? 'collapsed-corrupted-link' : 'corrupted-link',
        linkId,
        corruptionLevel,
        score
      };
    }
  }

  const nodes = Array.isArray(context?.nodes)
    ? context.nodes
    : Array.isArray(context?.aiNodes?.nodes)
      ? context.aiNodes.nodes
      : [];

  for (const node of nodes) {
    const position = getNodePosition(node);
    if (!position) continue;

    const nodeId = node?.userData?.nodeId || node?.id || node?.uuid || null;
    const corruptionLevel = normalizeMetricValue(
      node?.userData?.metrics?.corruption
        ?? node?.userData?.corruption
        ?? node?.corruption
        ?? 0
    );

    if (corruptionLevel <= 0) continue;

    const stabilityScore = normalizeMetricValue(node?.userData?.metrics?.stability ?? 0);
    const activeLinkCount = resolveActiveLinkCount({ metrics: node.userData?.metrics || node.userData });
    let score = corruptionLevel * 0.86 + (1 - stabilityScore) * 0.06 + clamp01(activeLinkCount / 4) * 0.04;
    if (payloadNodeId && nodeId && payloadNodeId === nodeId) score += 0.12;
    if (state.sourceEvent === 'node.corruption.high') score += 0.06;

    if (!best || score > best.score) {
      best = {
        position,
        confidence: clamp01(0.62 + score * 0.3),
        source: 'corrupted-node',
        nodeId,
        corruptionLevel,
        score
      };
    }
  }

  if (best) return best;

  const focusLink = context?.focusLink || context?.selectedLink || context?.primaryLink || null;
  const focusLinkAnchor = getLinkAnchor(focusLink);
  if (focusLinkAnchor) {
    return {
      position: focusLinkAnchor,
      confidence: 0.82,
      source: 'focus-link',
      linkId: focusLink?.id || focusLink?.userData?.linkId || null
    };
  }

  const focusNode = context?.focusNode || context?.selectedNode || context?.primaryNode || null;
  const focusNodePosition = getNodePosition(focusNode);
  if (focusNodePosition) {
    return {
      position: focusNodePosition,
      confidence: 0.72,
      source: 'focus-node',
      nodeId: focusNode?.userData?.nodeId || focusNode?.id || focusNode?.uuid || null
    };
  }

  const cameraPosition = vectorLikeToPlain(context?.camera?.position);
  if (cameraPosition) {
    return {
      position: {
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z - 2
      },
      confidence: 0.32,
      source: 'camera-fallback'
    };
  }

  return null;
}

function resolveGrandCorruptionAudioProfile(context) {
  const state = resolveGrandCorruptionState(context);
  const collapseCount = state.fieldPressure.collapsedLinkCount;

  return {
    family: 'corruption',
    telegraphCue: 'dramaturgy-corruption-telegraph',
    crestCue: 'dramaturgy-corruption-escalation',
    afterglowCue: 'dramaturgy-corruption-payoff',
    audioLayer: collapseCount > 0 ? 'veil-scar' : 'breach-rumble'
  };
}

function resolveGrandCorruptionModulation(context) {
  const state = resolveGrandCorruptionState(context);
  const stage = String(context?.stage || 'telegraph');

  return {
    dominantFamily: 'corruption',
    dominantPhase: stage === 'afterglow'
      ? 'payoff'
      : stage === 'crest'
        ? 'escalation'
        : 'telegraph',
    dominantIntensity: clamp01(Math.max(state.corruption, state.fieldPressure.topCorruption))
  };
}

function resolveHeroicStabilizationState(context) {
  const metrics = context?.metrics || {};
  const consciousness = context?.consciousness || {};
  const payload = context?.sourcePayload || {};
  const sourceEvent = String(context?.sourceEvent || '');
  const collapseSystem = context?.linkCollapseSystem || null;
  const collapseStats = typeof collapseSystem?.getCollapseStatistics === 'function'
    ? collapseSystem.getCollapseStatistics()
    : null;

  const loadPressure = normalizeMetricValue(
    payload.loadPressure
      ?? payload.load
      ?? metrics.loadPressure
      ?? consciousness.networkPressure
      ?? 0
  );
  const stability = normalizeMetricValue(
    payload.stability
      ?? metrics.stability
      ?? metrics.stabilityNorm
      ?? consciousness.stability
      ?? 0
  );
  const harmony = normalizeMetricValue(
    payload.harmony
      ?? metrics.harmony
      ?? metrics.harmonyNorm
      ?? consciousness.avgHarmony
      ?? 0
  );
  const corruption = normalizeMetricValue(
    payload.corruption
      ?? metrics.corruption
      ?? metrics.corruptionNorm
      ?? consciousness.avgCorruption
      ?? 0
  );
  const networkHealth = normalizeMetricValue(
    consciousness.networkHealth
      ?? metrics.networkHealth
      ?? 0
  );
  const heroIntensity = normalizeMetricValue(
    payload.heroIntensity
      ?? consciousness.heroIntensity
      ?? 0
  );
  const healingSignal = normalizeMetricValue(
    payload.harmonyRestored
      ?? payload.effectiveAmount
      ?? payload.intensity
      ?? 0
  );
  const collapseProgress = normalizeMetricValue(
    collapseStats?.averageCollapseProgress
      ?? collapseSystem?.getAverageCollapseProgress?.()
      ?? 0
  );
  const criticalLinkCount = resolveCount(collapseStats?.criticalLinks ?? collapseSystem?.getCriticalLinks?.()?.length ?? 0);
  const warningLinkCount = resolveCount(collapseStats?.warningLinks ?? collapseSystem?.getWarningLinks?.()?.length ?? 0);
  const recoverySignal = Math.max(
    healingSignal,
    sourceEvent === 'topology.healing' ? 0.18 : 0,
    sourceEvent === 'global.stability.high' ? 0.14 : 0,
    sourceEvent === 'node.stability.high' ? 0.1 : 0
  );
  const collapseRisk = clamp01(
    Math.max(
      loadPressure,
      collapseProgress,
      clamp01(criticalLinkCount / 2) * 0.9,
      clamp01(warningLinkCount / 4) * 0.6,
      consciousness.networkPressure ?? 0
    )
  );
  const rescueWindow = clamp01(
    stability * 0.32
      + harmony * 0.22
      + networkHealth * 0.16
      + heroIntensity * 0.12
      + recoverySignal * 0.2
  );
  const activeLinkCount = resolveActiveLinkCount(context);
  const sourceBoost = sourceEvent === 'topology.healing'
    ? 0.16
    : sourceEvent === 'global.stability.high'
      ? 0.12
      : sourceEvent === 'node.stability.high'
        ? 0.1
        : sourceEvent === 'link.collapse.collapse'
          ? 0.14
          : sourceEvent === 'link.collapse.critical'
            ? 0.12
            : sourceEvent === 'link.collapse.warning'
              ? 0.1
              : 0.06;

  return {
    metrics,
    consciousness,
    payload,
    sourceEvent,
    collapseSystem,
    collapseStats,
    loadPressure,
    stability,
    harmony,
    corruption,
    networkHealth,
    heroIntensity,
    healingSignal,
    recoverySignal,
    collapseProgress,
    criticalLinkCount,
    warningLinkCount,
    collapseRisk,
    rescueWindow,
    activeLinkCount,
    sourceBoost,
  };
}

function resolveHeroicStabilizationReadabilityBudget(context) {
  const state = resolveHeroicStabilizationState(context);

  return clamp01(
    0.28
      + state.collapseRisk * 0.26
      + state.recoverySignal * 0.24
      + state.rescueWindow * 0.18
      + state.stability * 0.12
      + state.harmony * 0.08
      + state.heroIntensity * 0.08
      + clamp01(state.criticalLinkCount / 2) * 0.1
      + clamp01(state.warningLinkCount / 4) * 0.05
      - state.corruption * 0.06
  );
}

function resolveHeroicStabilizationAnchor(context) {
  const state = resolveHeroicStabilizationState(context);
  const collapseSystem = state.collapseSystem || null;
  const links = resolveLinkCollection(context);
  const payload = state.payload || {};
  const payloadLinkId = payload.linkId || payload.link?.id || payload.link?.userData?.linkId || null;
  const payloadNodeId = payload.nodeId || payload.sourceNodeId || payload.targetNodeId || payload.node?.userData?.nodeId || null;
  let best = null;

  for (const link of links) {
    const anchor = getLinkAnchor(link);
    if (!anchor) continue;

    const linkId = link?.id || link?.uuid || link?.name || link?.userData?.linkId || null;
    const collapseState = typeof collapseSystem?.getCollapseState === 'function'
      ? collapseSystem.getCollapseState(link)
      : null;
    const collapseProgress = normalizeMetricValue(
      collapseState?.stressAccumulation
        ?? collapseState?.progress
        ?? link?.userData?.collapseProgress
        ?? link?.userData?.collapseIntensity
        ?? collapseSystem?.getCollapseProgress?.(link)
        ?? 0
    );
    const stage = String(collapseState?.collapseStage || link?.userData?.collapseStage || link?.userData?.collapseState || '').toLowerCase();
    const critical = stage === 'critical'
      || collapseSystem?.linkCriticalStates?.has?.(linkId) === true
      || link?.userData?.collapseCritical === true;
    const warning = stage === 'warning'
      || collapseSystem?.linkWarningStates?.has?.(linkId) === true
      || link?.userData?.collapseWarning === true;
    const sourceNodeId = link?.source?.userData?.nodeId || link?.source?.userData?.id || link?.source?.uuid || null;
    const targetNodeId = link?.target?.userData?.nodeId || link?.target?.userData?.id || link?.target?.uuid || null;

    let score = collapseProgress * 0.78 + (critical ? 0.16 : 0) + (warning ? 0.08 : 0);
    if (payloadLinkId && linkId && payloadLinkId === linkId) score += 0.12;
    if (payloadNodeId && (payloadNodeId === sourceNodeId || payloadNodeId === targetNodeId)) score += 0.08;
    if (state.collapseRisk > 0.7) score += 0.04;
    if (state.recoverySignal > 0.08) score += 0.03;

    if (score <= 0.08 && !critical && !warning) continue;

    if (!best || score > best.score) {
      best = {
        position: anchor,
        confidence: clamp01(0.74 + score * 0.2),
        source: critical ? 'heroic-critical-link' : warning ? 'heroic-warning-link' : 'heroic-link',
        linkId,
        score
      };
    }
  }

  if (best) return best;

  const centroidLinks = [];
  if (typeof collapseSystem?.getCriticalLinks === 'function') {
    centroidLinks.push(...(collapseSystem.getCriticalLinks() || []));
  }
  if (typeof collapseSystem?.getWarningLinks === 'function') {
    centroidLinks.push(...(collapseSystem.getWarningLinks() || []));
  }

  if (centroidLinks.length > 0) {
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let sumWeight = 0;

    for (const link of centroidLinks) {
      const anchor = getLinkAnchor(link);
      if (!anchor) continue;

      const linkId = link?.id || link?.uuid || link?.name || link?.userData?.linkId || null;
      const collapseState = typeof collapseSystem?.getCollapseState === 'function'
        ? collapseSystem.getCollapseState(link)
        : null;
      const collapseProgress = normalizeMetricValue(
        collapseState?.stressAccumulation
          ?? collapseState?.progress
          ?? link?.userData?.collapseProgress
          ?? collapseSystem?.getCollapseProgress?.(link)
          ?? 0
      );
      const weight = 0.42 + collapseProgress * 0.5 + (linkId && payloadLinkId === linkId ? 0.1 : 0);
      sumX += anchor.x * weight;
      sumY += anchor.y * weight;
      sumZ += anchor.z * weight;
      sumWeight += weight;
    }

    if (sumWeight > 0) {
      return {
        position: {
          x: sumX / sumWeight,
          y: sumY / sumWeight,
          z: sumZ / sumWeight
        },
        confidence: 0.84,
        source: 'heroic-collapse-centroid'
      };
    }
  }

  const fallbackAnchor = resolveCascadeReconstructionAnchor(context)
    || resolveSynergyAnchor(context)
    || null;
  if (fallbackAnchor?.position) {
    return {
      position: { ...fallbackAnchor.position },
      confidence: Math.max(0.72, fallbackAnchor.confidence || 0),
      source: fallbackAnchor.source || 'heroic-fallback',
      linkId: fallbackAnchor.linkId || null,
      nodeId: fallbackAnchor.nodeId || null
    };
  }

  return null;
}

function resolveHeroicStabilizationAudioProfile(context) {
  const state = resolveHeroicStabilizationState(context);
  return {
    family: 'resonance',
    telegraphCue: 'dramaturgy-hazard-telegraph',
    crestCue: 'dramaturgy-resonance-escalation',
    afterglowCue: 'dramaturgy-resonance-payoff',
    audioLayer: state.collapseRisk > 0.78 ? 'halo-choir' : 'sigil-bells'
  };
}

function resolveHeroicStabilizationModulation(context) {
  const state = resolveHeroicStabilizationState(context);
  const stage = String(context?.stage || 'telegraph');

  return {
    dominantFamily: 'resonance',
    dominantPhase: stage === 'afterglow'
      ? 'payoff'
      : stage === 'crest'
        ? 'escalation'
        : 'telegraph',
    dominantIntensity: clamp01(Math.max(
      state.collapseRisk,
      state.recoverySignal,
      state.rescueWindow,
      state.stability,
      state.heroIntensity
    )),
    motif: 'heroic-stabilization'
  };
}

function resolveSignatureMomentModulation(moment, context) {
  if (moment?.family === 'personality') {
    return resolveWorldPersonalityShiftModulation(context);
  }

  if (moment?.family === 'consciousness') {
    return resolveConsciousnessBloomModulation(context);
  }

  if (moment?.family === 'harmony' || moment?.id === HARMONY_CONVERGENCE_MOMENT_ID) {
    return resolveHarmonyConvergenceModulation(context);
  }

  if (moment?.family === 'mythic' || moment?.id === MYTHIC_SIGNAL_MOMENT_ID) {
    return resolveMythicSignalModulation(context);
  }

  if (moment?.family === 'bond' || moment?.id === LEGENDARY_BOND_MOMENT_ID) {
    return resolveLegendaryBondModulation(context);
  }

  if (moment?.family === 'stability' || moment?.id === HEROIC_STABILIZATION_MOMENT_ID) {
    return resolveHeroicStabilizationModulation(context);
  }

  if (moment?.family === 'corruption') {
    return resolveGrandCorruptionModulation({ ...context, stage: context?.stage || moment?.stage || 'telegraph' });
  }

  return null;
}

function resolveLegendaryBondState(context) {
  const metrics = context?.metrics || {};
  const consciousness = context?.consciousness || {};
  const payload = context?.sourcePayload || {};
  const sourceEvent = String(context?.sourceEvent || '');

  const payloadLink = payload.link || payload.linkRef || context?.focusLink || context?.selectedLink || context?.primaryLink || null;
  const resolvedLink = payloadLink || resolveLinkById(context, payload.linkId || payload.link?.id || payload.linkRef?.id || null);
  const sourceNode = payload.sourceNode || resolvedLink?.sourceNode || resolvedLink?.source || resolveNodeById(context, payload.sourceNodeId || payload.sourceId || null);
  const targetNode = payload.targetNode || resolvedLink?.targetNode || resolvedLink?.target || resolveNodeById(context, payload.targetNodeId || payload.targetId || null);
  const sourcePosition = getNodePosition(sourceNode) || vectorLikeToPlain(payload.sourcePosition) || null;
  const targetPosition = getNodePosition(targetNode) || vectorLikeToPlain(payload.targetPosition) || null;
  const payloadAnchor = vectorLikeToPlain(payload.anchor)
    || vectorLikeToPlain(payload.position)
    || vectorLikeToPlain(payload.worldPosition)
    || getLinkAnchor(resolvedLink);
  const combinedAnchor = payloadAnchor || (sourcePosition && targetPosition ? midpoint(sourcePosition, targetPosition) : null);
  const synergy = normalizeMetricValue(
    payload.value
      ?? payload.synergy
      ?? payload.synergyScore
      ?? resolvedLink?.glowData?.synergy
      ?? resolvedLink?.userData?.metrics?.synergy
      ?? resolvedLink?.userData?.synergy
      ?? metrics.synergy
      ?? metrics.synergyNorm
      ?? metrics.globalSynergy
      ?? consciousness.coherence
      ?? 0
  );
  const harmony = normalizeMetricValue(
    payload.harmonicValue
      ?? payload.harmony
      ?? resolvedLink?.harmonyScore
      ?? resolvedLink?.userData?.metrics?.harmony
      ?? metrics.harmony
      ?? metrics.harmonyNorm
      ?? consciousness.avgHarmony
      ?? 0
  );
  const threshold = normalizeMetricValue(payload.threshold ?? (sourceEvent === 'link:harmonicLock' ? 0.8 : sourceEvent === 'link:synergyThreshold' ? 0.75 : 0.72));
  const completionSignal = sourceEvent === 'link:harmonicLock' ? 1 : 0;
  const bondSignal = Math.max(synergy, harmony, threshold, completionSignal * 0.12);
  const activeLinkCount = resolveActiveLinkCount(context);
  const legendaryEndpoint = isLegendaryNode(sourceNode, context) || isLegendaryNode(targetNode, context);

  return {
    metrics,
    consciousness,
    payload,
    sourceEvent,
    link: resolvedLink,
    linkId: payload.linkId || resolvedLink?.id || resolvedLink?.userData?.linkId || null,
    sourceNode,
    targetNode,
    sourceNodeId: sourceNode?.userData?.nodeId || sourceNode?.id || sourceNode?.uuid || payload.sourceNodeId || payload.sourceId || null,
    targetNodeId: targetNode?.userData?.nodeId || targetNode?.id || targetNode?.uuid || payload.targetNodeId || payload.targetId || null,
    sourcePosition,
    targetPosition,
    anchor: combinedAnchor,
    synergy,
    harmony,
    threshold,
    completionSignal,
    bondSignal,
    activeLinkCount,
    legendaryEndpoint,
    signalStrength: clamp01(Math.max(bondSignal, completionSignal * 0.18) + (legendaryEndpoint ? 0.08 : 0) + clamp01(activeLinkCount / 4) * 0.1),
  };
}

function resolveLegendaryBondReadabilityBudget(context) {
  const state = resolveLegendaryBondState(context);
  const loadPressure = normalizeMetricValue(state.metrics.loadPressure ?? state.consciousness.networkPressure ?? 0);
  const corruption = normalizeMetricValue(state.metrics.corruption ?? state.consciousness.avgCorruption ?? 0);
  const volatility = normalizeMetricValue(state.consciousness.volatility ?? 0);

  return clamp01(
    0.28
      + state.bondSignal * 0.32
      + state.synergy * 0.18
      + state.harmony * 0.14
      + clamp01(state.activeLinkCount / 3) * 0.1
      + (state.legendaryEndpoint ? 0.08 : 0)
      + (state.completionSignal > 0 ? 0.08 : 0)
      - loadPressure * 0.08
      - corruption * 0.05
      - volatility * 0.04
  );
}

function resolveLegendaryBondAnchor(context) {
  const state = resolveLegendaryBondState(context);
  if (state.anchor) {
    return {
      position: state.anchor,
      confidence: state.completionSignal > 0 ? 0.98 : 0.94,
      source: state.completionSignal > 0 ? 'legendary-bond-completion' : 'legendary-bond-manifestation',
      linkId: state.linkId,
      sourceNodeId: state.sourceNodeId,
      targetNodeId: state.targetNodeId
    };
  }

  const focusAnchor = vectorLikeToPlain(context?.focusAnchor)
    || vectorLikeToPlain(context?.anchor)
    || null;
  if (focusAnchor) {
    return {
      position: focusAnchor,
      confidence: 0.9,
      source: 'focus-anchor'
    };
  }

  const focusLink = context?.focusLink || context?.selectedLink || context?.primaryLink || state.link || null;
  const linkAnchor = getLinkAnchor(focusLink);
  if (linkAnchor) {
    return {
      position: linkAnchor,
      confidence: 0.88,
      source: 'focus-link',
      linkId: focusLink?.id || focusLink?.userData?.linkId || state.linkId || null
    };
  }

  const focusNode = context?.focusNode || context?.selectedNode || context?.primaryNode || null;
  const nodePosition = getNodePosition(focusNode);
  if (nodePosition) {
    return {
      position: nodePosition,
      confidence: 0.76,
      source: 'focus-node',
      nodeId: focusNode?.userData?.nodeId || focusNode?.id || focusNode?.uuid || null
    };
  }

  return resolveSynergyAnchor(context);
}

function resolveLegendaryBondAudioProfile(context) {
  const state = resolveLegendaryBondState(context);
  return {
    family: 'resonance',
    telegraphCue: 'dramaturgy-resonance-telegraph',
    crestCue: 'dramaturgy-resonance-escalation',
    afterglowCue: 'dramaturgy-resonance-payoff',
    audioLayer: state.completionSignal > 0 ? 'halo-choir' : 'sigil-bells'
  };
}

function resolveLegendaryBondModulation(context) {
  const state = resolveLegendaryBondState(context);
  const stage = String(context?.stage || 'telegraph');

  return {
    dominantFamily: 'resonance',
    dominantPhase: stage === 'afterglow'
      ? 'payoff'
      : stage === 'crest'
        ? 'escalation'
        : 'telegraph',
    dominantIntensity: clamp01(Math.max(
      state.bondSignal,
      state.synergy,
      state.harmony,
      state.legendaryEndpoint ? 0.14 : 0,
      state.completionSignal * 0.18
    )),
    motif: 'legendary-bond'
  };
}

function buildSynergyApexBlueprint() {
  return Object.freeze({
    ...DEFAULT_BLUEPRINT_CONFIG,
    resolveScore: resolveReadabilityBudget,
    trigger(context) {
      const sourceEvent = String(context?.sourceEvent || '');
      const signalMatch =
        sourceEvent.includes('synergy') ||
        sourceEvent === 'coherenceApex' ||
        sourceEvent === 'COSMIC_PULSE' ||
        sourceEvent.includes('COSMIC_PULSE');

      if (!signalMatch) return false;

      const activeLinkCount = resolveActiveLinkCount(context);
      if (activeLinkCount <= 0) return false;

      const readabilityBudget = resolveReadabilityBudget(context);
      return readabilityBudget >= this.minScore;
    },
    buildAnchor(context) {
      return resolveSynergyAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.18 + score * 0.12,
        holdMs: 1400 + score * 300,
        settleMs: 2200 + score * 350,
        suppressAmbient: 0.25 + score * 0.2,
        focusStyle: 'center-weighted',
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      return {
        family: 'resonance',
        telegraphCue: 'dramaturgy-resonance-telegraph',
        crestCue: 'dramaturgy-resonance-escalation',
        afterglowCue: 'dramaturgy-resonance-payoff',
        audioLayer: 'halo-choir',
        intensity: 0.55 + score * 0.35,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      return {
        mode: 'link-afterglow',
        residue: 'coherence-afterglow',
        durationMs: 2800 + score * 1400,
        fadeMs: 1100 + score * 300,
        lingerIntensity: 0.24 + score * 0.18,
        anchor: anchor?.position ? { ...anchor.position } : null,
        worldState: 'stabilized'
      };
    },
    buildWorldSkin(context, anchor, score) {
      return {
        id: SYNERGY_APEX_MOMENT_ID,
        family: 'synergy',
        palette: 'cyan-white',
        dominantColor: '#6DEAFF',
        accentColor: '#F7FBFF',
        glowColor: '#D6FFF3',
        intensity: 0.72 + score * 0.18,
        worldMood: 'radiant-coherence',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

function buildCascadeReconstructionBlueprint() {
  return Object.freeze({
    id: CASCADE_RECONSTRUCTION_MOMENT_ID,
    label: 'Cascade Reconstruction Beacon',
    tier: 'A',
    family: 'cascade',
    sourceEvents: Object.freeze(['cascade.end', 'topology.healing', 'link.collapse.recovery']),
    cooldownMs: 52000,
    maxConcurrent: 1,
    minScore: 0.58,
    minAnchorConfidence: 0.6,
    stageDurations: CASCADE_RECONSTRUCTION_STAGE_DURATIONS,
    resolveScore: resolveReconstructionReadabilityBudget,
    trigger(context) {
      const sourceEvent = String(context?.sourceEvent || '');
      const isCascadeSignal = sourceEvent.includes('cascade');
      const isHealingSignal = sourceEvent === 'topology.healing' || sourceEvent.includes('healing') || sourceEvent === 'link.collapse.recovery';

      if (!isCascadeSignal && !isHealingSignal) return false;

      const activeLinkCount = resolveActiveLinkCount(context);
      if (activeLinkCount <= 0) return false;

      const collapsedLinkCount = resolveCollapsedLinkCount(context);
      const healingSignal = normalizeMetricValue(
        context?.sourcePayload?.recoverySignal
          ?? context?.sourcePayload?.recoveryProgress
          ?? context?.sourcePayload?.harmonyRestored
          ?? context?.sourcePayload?.effectiveAmount
          ?? context?.sourcePayload?.intensity
          ?? 0
      );

      if (isHealingSignal) {
        return healingSignal >= 0.08 || collapsedLinkCount > 0;
      }

      if (isCascadeSignal) {
        if (collapsedLinkCount <= 0 && healingSignal <= 0.05) return false;
        return resolveReconstructionReadabilityBudget(context) >= this.minScore;
      }

      return false;
    },
    buildAnchor(context) {
      return resolveCascadeReconstructionAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.22 + score * 0.15,
        holdMs: 1700 + score * 420,
        settleMs: 2500 + score * 520,
        suppressAmbient: 0.18 + score * 0.22,
        focusStyle: 'vertical-beacon',
        orbitRadius: 0.4 + score * 0.28,
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      return {
        family: 'cascade',
        telegraphCue: 'dramaturgy-cascade-telegraph',
        crestCue: 'dramaturgy-cascade-escalation',
        afterglowCue: 'dramaturgy-cascade-payoff',
        audioLayer: 'reconstruction-beacon',
        intensity: 0.48 + score * 0.42,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      return {
        mode: 'reconstruction-afterglow',
        residue: 'beacon-afterimage',
        durationMs: 3400 + score * 1500,
        fadeMs: 1200 + score * 420,
        lingerIntensity: 0.28 + score * 0.22,
        anchor: anchor?.position ? { ...anchor.position } : null,
        worldState: 'rebuilding'
      };
    },
    buildWorldSkin(context, anchor, score) {
      return {
        id: CASCADE_RECONSTRUCTION_MOMENT_ID,
        family: 'cascade',
        palette: 'ember-cyan',
        dominantColor: '#FFB36B',
        accentColor: '#EFFFFA',
        glowColor: '#74F3D3',
        intensity: 0.68 + score * 0.2,
        worldMood: 'reconstruction-beacon',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

function buildMemoryRecoveryBlueprint() {
  return Object.freeze({
    id: MEMORY_RECOVERY_MOMENT_ID,
    label: 'Memory Recovery Event / Archive Reassembly',
    tier: 'A',
    family: 'memory',
    sourceEvents: Object.freeze(['world.loaded', 'world.memoryPressure.active', 'game:won']),
    cooldownMs: 68000,
    maxConcurrent: 1,
    minScore: 0.64,
    minAnchorConfidence: 0.74,
    stageDurations: MEMORY_RECOVERY_STAGE_DURATIONS,
    resolveScore: resolveMemoryRecoveryReadabilityBudget,
    trigger(context) {
      const sourceEvent = String(context?.sourceEvent || '');
      const memoryWorldActive = resolveMemoryWorldActive(context);
      const chronicleDepth = resolveChronicleEntryCount(context);
      const memoryPressure = resolveMemoryPressureSignal(context);
      const readabilityBudget = resolveMemoryRecoveryReadabilityBudget(context);

      if (sourceEvent === 'world.loaded') {
        return memoryWorldActive && chronicleDepth >= 3 && readabilityBudget >= this.minScore;
      }

      if (sourceEvent === 'world.memoryPressure.active') {
        return (memoryPressure >= 0.2 || (memoryWorldActive && chronicleDepth >= 4))
          && readabilityBudget >= this.minScore;
      }

      if (sourceEvent === 'game:won') {
        return chronicleDepth >= 6
          && (memoryWorldActive || memoryPressure >= 0.15)
          && readabilityBudget >= this.minScore;
      }

      return false;
    },
    buildAnchor(context) {
      return resolveMemoryRecoveryAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.16 + score * 0.1,
        holdMs: 1800 + score * 360,
        settleMs: 2900 + score * 520,
        suppressAmbient: 0.14 + score * 0.16,
        focusStyle: 'archive-gather',
        orbitRadius: 0.18 + score * 0.14,
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      return {
        family: 'memory',
        telegraphCue: 'dramaturgy-chrono-telegraph',
        crestCue: 'dramaturgy-chrono-bloom',
        afterglowCue: 'dramaturgy-chrono-afterglow',
        audioLayer: 'archive-hum',
        intensity: 0.42 + score * 0.34,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      return {
        mode: 'memory-afterglow',
        residue: 'archive-recall',
        durationMs: 4200 + score * 1800,
        fadeMs: 1400 + score * 520,
        lingerIntensity: 0.2 + score * 0.18,
        anchor: anchor?.position ? { ...anchor.position } : null,
        worldState: 'remembered'
      };
    },
    buildWorldSkin(context, anchor, score) {
      return {
        id: MEMORY_RECOVERY_MOMENT_ID,
        family: 'memory',
        palette: 'archive-ivory',
        dominantColor: '#D7E8FF',
        accentColor: '#FFC98E',
        glowColor: '#8AF2E3',
        intensity: 0.68 + score * 0.16,
        worldMood: 'memory-recovered',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

function buildLegendaryBondBlueprint() {
  return Object.freeze({
    id: LEGENDARY_BOND_MOMENT_ID,
    label: 'Legendary Bond Manifestation / Covenant Lattice',
    tier: 'A',
    family: 'bond',
    sourceEvents: Object.freeze(['link.created', 'link:synergyThreshold', 'link:harmonicLock']),
    cooldownMs: 78000,
    maxConcurrent: 1,
    minScore: 0.72,
    minAnchorConfidence: 0.88,
    stageDurations: LEGENDARY_BOND_STAGE_DURATIONS,
    resolveScore: resolveLegendaryBondReadabilityBudget,
    trigger(context) {
      const sourceEvent = String(context?.sourceEvent || '');
      if (!['link.created', 'link:synergyThreshold', 'link:harmonicLock'].includes(sourceEvent)) return false;

      const state = resolveLegendaryBondState(context);
      if (!state.anchor && !state.link) return false;

      if (sourceEvent === 'link.created' && state.bondSignal < 0.72 && !state.legendaryEndpoint) {
        return false;
      }

      if (sourceEvent === 'link:synergyThreshold' && state.bondSignal < Math.max(0.75, state.threshold)) {
        return false;
      }

      if (sourceEvent === 'link:harmonicLock' && state.bondSignal < Math.max(0.8, state.threshold)) {
        return false;
      }

      return resolveLegendaryBondReadabilityBudget(context) >= this.minScore;
    },
    buildAnchor(context) {
      return resolveLegendaryBondAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.16 + score * 0.1,
        holdMs: 1600 + score * 380,
        settleMs: 2500 + score * 540,
        suppressAmbient: 0.18 + score * 0.18,
        focusStyle: 'bond-corridor',
        orbitRadius: 0.08 + score * 0.07,
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      const profile = resolveLegendaryBondAudioProfile(context);
      return {
        family: profile.family,
        telegraphCue: profile.telegraphCue,
        crestCue: profile.crestCue,
        afterglowCue: profile.afterglowCue,
        audioLayer: profile.audioLayer,
        intensity: 0.5 + score * 0.32,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      const state = resolveLegendaryBondState(context);
      return {
        mode: 'bond-afterglow',
        residue: 'golden-mark',
        durationMs: 6200 + score * 2400,
        fadeMs: 1400 + score * 420,
        lingerIntensity: 0.3 + score * 0.22,
        anchor: anchor?.position ? { ...anchor.position } : null,
        bondSignal: state.bondSignal,
        completionSignal: state.completionSignal > 0,
        worldState: 'bond-consecrated'
      };
    },
    buildWorldSkin(context, anchor, score) {
      const state = resolveLegendaryBondState(context);
      return {
        id: LEGENDARY_BOND_MOMENT_ID,
        family: 'bond',
        mode: 'COVENANT_LATTICE',
        palette: ['#061018', '#FFD66B', '#6DEAFF', '#F7F2D0'],
        dominantColor: '#FFD66B',
        accentColor: '#6DEAFF',
        glowColor: '#FFF6CC',
        intensity: 0.8 + score * 0.12,
        completionSignal: state.completionSignal > 0,
        tags: ['legendary', 'bond', 'lattice', 'golden', 'cyan'],
        worldMood: 'legendary-bond',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

function buildConsciousnessBloomBlueprint() {
  return Object.freeze({
    id: CONSCIOUSNESS_BLOOM_MOMENT_ID,
    label: 'Consciousness Bloom / Thought Aurora',
    tier: 'A',
    family: 'consciousness',
    sourceEvents: Object.freeze(['consciousness.state.changed']),
    cooldownMs: 62000,
    maxConcurrent: 1,
    minScore: 0.68,
    minAnchorConfidence: 0.9,
    stageDurations: CONSCIOUSNESS_BLOOM_STAGE_DURATIONS,
    resolveScore: resolveConsciousnessBloomReadabilityBudget,
    trigger(context) {
      if (String(context?.sourceEvent || '') !== 'consciousness.state.changed') return false;

      const state = resolveConsciousnessBloomState(context);
      if (!resolveActiveLinkCount(context)) return false;
      if (!state.expressiveMood && !state.expressivePhase && !state.stormActive) return false;

      return resolveConsciousnessBloomReadabilityBudget(context) >= this.minScore;
    },
    buildAnchor(context) {
      return resolveConsciousnessBloomAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.12 + score * 0.08,
        holdMs: 1500 + score * 320,
        settleMs: 2200 + score * 500,
        suppressAmbient: 0.12 + score * 0.12,
        focusStyle: 'neural-bloom',
        orbitRadius: 0.06 + score * 0.05,
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      const profile = resolveConsciousnessBloomAudioProfile(context);
      return {
        family: profile.family,
        telegraphCue: profile.telegraphCue,
        crestCue: profile.crestCue,
        afterglowCue: profile.afterglowCue,
        audioLayer: profile.audioLayer,
        intensity: 0.44 + score * 0.28,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      const state = resolveConsciousnessBloomState(context);
      return {
        mode: 'consciousness-afterglow',
        residue: 'thought-aurora',
        durationMs: 5000 + score * 1800,
        fadeMs: 1100 + score * 360,
        lingerIntensity: 0.28 + score * 0.22,
        anchor: anchor?.position ? { ...anchor.position } : null,
        microPulseBoost: 0.22 + score * 0.2,
        threadBloomBoost: 0.16 + score * 0.14,
        patternBloomBoost: 0.18 + score * 0.16,
        stormActive: state.stormActive,
        worldState: 'thinking-out-loud'
      };
    },
    buildWorldSkin(context, anchor, score) {
      const state = resolveConsciousnessBloomState(context);
      return {
        id: CONSCIOUSNESS_BLOOM_MOMENT_ID,
        family: 'consciousness',
        mode: 'NEURAL_BLOOM',
        palette: ['#04101A', '#6DEAFF', '#8E7DFF', '#F7FBFF'],
        dominantColor: '#8E7DFF',
        accentColor: '#6DEAFF',
        glowColor: '#F3ECFF',
        intensity: 0.76 + score * 0.12,
        stormActive: state.stormActive,
        dominantSignature: state.stormActive ? 'thought-aurora-storm' : 'neural-bloom',
        tags: ['consciousness', 'bloom', 'veil', 'aurora', 'thought-storm'],
        worldMood: 'neural-bloom',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

function buildHarmonyConvergenceBlueprint() {
  return Object.freeze({
    id: HARMONY_CONVERGENCE_MOMENT_ID,
    label: 'Harmony Convergence / Ascension Platform',
    tier: 'C',
    family: 'harmony',
    sourceEvents: Object.freeze(['semantic.ritual.started', 'ritual.prelude']),
    cooldownMs: 72000,
    maxConcurrent: 1,
    minScore: 0.78,
    minAnchorConfidence: 0.9,
    stageDurations: HARMONY_CONVERGENCE_STAGE_DURATIONS,
    resolveScore: resolveHarmonyConvergenceReadabilityBudget,
    trigger(context) {
      const sourceEvent = String(context?.sourceEvent || '');
      if (!['semantic.ritual.started', 'ritual.prelude'].includes(sourceEvent)) return false;

      const state = resolveHarmonyConvergenceState(context);
      if (!state.ritualTypeAllowed || !['HARMONY_CONVERGENCE', 'ASCENSION_RITUAL'].includes(state.ritualType)) {
        return false;
      }

      if (!state.anchor && state.ascendedCount <= 0) return false;
      if (state.harmony < 0.78 && state.clarity < 0.72 && state.phaseIntensity < 0.08) return false;

      return resolveHarmonyConvergenceReadabilityBudget(context) >= this.minScore;
    },
    buildAnchor(context) {
      return resolveHarmonyConvergenceAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.1 + score * 0.06,
        holdMs: 1500 + score * 260,
        settleMs: 2000 + score * 320,
        suppressAmbient: 0.08 + score * 0.06,
        focusStyle: 'ascension-platform',
        orbitRadius: 0.035 + score * 0.025,
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      const profile = resolveHarmonyConvergenceAudioProfile(context);
      return {
        family: profile.family,
        telegraphCue: profile.telegraphCue,
        crestCue: profile.crestCue,
        afterglowCue: profile.afterglowCue,
        audioLayer: profile.audioLayer,
        intensity: 0.64 + score * 0.28,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      const state = resolveHarmonyConvergenceState(context);
      return {
        mode: 'ascension-afterglow',
        residue: 'ascension-halo',
        durationMs: 6000 + score * 2200,
        fadeMs: 1600 + score * 420,
        lingerIntensity: 0.32 + score * 0.2,
        anchor: anchor?.position ? { ...anchor.position } : null,
        harmony: state.harmony,
        clarity: state.clarity,
        stability: state.stability,
        ascendedCount: state.ascendedCount,
        worldState: 'ascended-platform'
      };
    },
    buildWorldSkin(context, anchor, score) {
      const state = resolveHarmonyConvergenceState(context);
      return {
        id: HARMONY_CONVERGENCE_MOMENT_ID,
        family: 'harmony',
        mode: 'ASCENSION_PLATFORM',
        palette: ['#08111A', '#FFD96B', '#FFF4D2', '#6DEAFF'],
        dominantColor: '#FFD96B',
        accentColor: '#FFF4D2',
        glowColor: '#FFFBEA',
        intensity: 0.84 + score * 0.08,
        harmony: state.harmony,
        clarity: state.clarity,
        stability: state.stability,
        ascendedCount: state.ascendedCount,
        dominantSignature: state.ascendedCount >= 4 ? 'platform-crown' : 'ascension-platform',
        tags: ['harmony', 'ascension', 'platform', 'gold', 'ivory'],
        worldMood: 'ascension-platform',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

function buildMythicSignalBlueprint() {
  return Object.freeze({
    id: MYTHIC_SIGNAL_MOMENT_ID,
    label: 'Mythic Signal / Dimensional Gateway',
    tier: 'C',
    family: 'mythic',
    sourceEvents: Object.freeze(['semantic.ritual.started', 'ritual.prelude']),
    cooldownMs: 84000,
    maxConcurrent: 1,
    minScore: 0.82,
    minAnchorConfidence: 0.88,
    stageDurations: MYTHIC_SIGNAL_STAGE_DURATIONS,
    resolveScore: resolveMythicSignalReadabilityBudget,
    trigger(context) {
      const sourceEvent = String(context?.sourceEvent || '');
      if (!['semantic.ritual.started', 'ritual.prelude'].includes(sourceEvent)) return false;

      const state = resolveMythicSignalState(context);
      if (!state.ritualTypeAllowed || state.ritualType !== 'MYTHIC_SIGNAL') return false;
      if (!state.anchor && state.balanceScore < 0.78) return false;
      if (state.gatewayCharge < 0.72 && state.balanceScore < 0.68) return false;

      return resolveMythicSignalReadabilityBudget(context) >= this.minScore;
    },
    buildAnchor(context) {
      return resolveMythicSignalAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.12 + score * 0.08,
        holdMs: 1600 + score * 260,
        settleMs: 2400 + score * 360,
        suppressAmbient: 0.12 + score * 0.08,
        focusStyle: 'dimensional-gateway',
        orbitRadius: 0.06 + score * 0.04,
        impactShake: 0.02 + score * 0.02,
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      const profile = resolveMythicSignalAudioProfile(context);
      return {
        family: profile.family,
        telegraphCue: profile.telegraphCue,
        crestCue: profile.crestCue,
        afterglowCue: profile.afterglowCue,
        audioLayer: profile.audioLayer,
        intensity: 0.68 + score * 0.24,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      const state = resolveMythicSignalState(context);
      return {
        mode: 'gateway-afterglow',
        residue: 'gateway-sigil',
        durationMs: 9000 + score * 2600,
        fadeMs: 1800 + score * 520,
        lingerIntensity: 0.36 + score * 0.22,
        anchor: anchor?.position ? { ...anchor.position } : null,
        gatewayCharge: state.gatewayCharge,
        balanceScore: state.balanceScore,
        worldState: 'gateway-opened'
      };
    },
    buildWorldSkin(context, anchor, score) {
      const state = resolveMythicSignalState(context);
      return {
        id: MYTHIC_SIGNAL_MOMENT_ID,
        family: 'mythic',
        mode: 'DIMENSIONAL_GATEWAY',
        palette: ['#050615', '#A98BFF', '#6DEAFF', '#FFF1C9'],
        dominantColor: '#A98BFF',
        accentColor: '#6DEAFF',
        glowColor: '#FFF0CA',
        intensity: 0.88 + score * 0.08,
        gatewayCharge: state.gatewayCharge,
        balanceScore: state.balanceScore,
        dominantSignature: state.gatewayCharge > 0.9 ? 'gateway-bloom' : 'dimensional-gateway',
        tags: ['mythic', 'gateway', 'ritual', 'portal', 'violet'],
        worldMood: 'dimensional-gateway',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

function buildGrandCorruptionBreachBlueprint() {
  return Object.freeze({
    id: GRAND_CORRUPTION_BREACH_MOMENT_ID,
    label: 'Grand Corruption Breach / Veil Fracture',
    tier: 'A',
    family: 'corruption',
    sourceEvents: Object.freeze(['global.corruption.high', 'node.corruption.high', 'network:corruptionSpread', 'topology.rupture', 'link.collapse.collapse']),
    cooldownMs: 84000,
    maxConcurrent: 1,
    minScore: 0.74,
    minAnchorConfidence: 0.82,
    stageDurations: GRAND_CORRUPTION_BREACH_STAGE_DURATIONS,
    resolveScore: resolveGrandCorruptionReadabilityBudget,
    trigger(context) {
      const sourceEvent = String(context?.sourceEvent || '');
      if (!['global.corruption.high', 'node.corruption.high', 'network:corruptionSpread', 'topology.rupture', 'link.collapse.collapse'].includes(sourceEvent)) return false;

      const state = resolveGrandCorruptionState(context);
      if (state.corruption < 0.58 && state.fieldPressure.topCorruption < 0.72 && state.fieldPressure.collapsedLinkCount <= 0) {
        return false;
      }

      return resolveGrandCorruptionReadabilityBudget(context) >= this.minScore;
    },
    buildAnchor(context) {
      return resolveGrandCorruptionAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.24 + score * 0.14,
        holdMs: 1800 + score * 380,
        settleMs: 2400 + score * 620,
        suppressAmbient: 0.2 + score * 0.18,
        focusStyle: 'rupture-focus',
        orbitRadius: 0.1 + score * 0.08,
        impactShake: 0.05 + score * 0.05,
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      const profile = resolveGrandCorruptionAudioProfile(context);
      return {
        family: profile.family,
        telegraphCue: profile.telegraphCue,
        crestCue: profile.crestCue,
        afterglowCue: profile.afterglowCue,
        audioLayer: profile.audioLayer,
        intensity: 0.56 + score * 0.34,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      const state = resolveGrandCorruptionState(context);
      return {
        mode: 'corruption-afterglow',
        residue: 'veil-scar',
        durationMs: 8400 + score * 3000,
        fadeMs: 1800 + score * 560,
        lingerIntensity: 0.36 + score * 0.24,
        anchor: anchor?.position ? { ...anchor.position } : null,
        corruptionLevel: state.corruption,
        collapsedLinkCount: state.fieldPressure.collapsedLinkCount,
        worldState: 'veil-breached'
      };
    },
    buildWorldSkin(context, anchor, score) {
      const state = resolveGrandCorruptionState(context);
      const topCorruption = clamp01(Math.max(state.corruption, state.fieldPressure.topCorruption));
      return {
        id: GRAND_CORRUPTION_BREACH_MOMENT_ID,
        family: 'corruption',
        mode: 'VEIL_BREACH',
        palette: ['#050b12', '#ff73cf', '#6deaff', '#180913'],
        dominantColor: '#ff4fa3',
        accentColor: '#6deaff',
        glowColor: '#ff92cf',
        intensity: 0.8 + score * 0.14,
        corruptionLevel: topCorruption,
        collapsedLinkCount: state.fieldPressure.collapsedLinkCount,
        dominantSignature: state.fieldPressure.topCorruption >= 0.75 ? 'rupture-scar' : 'veil-fracture',
        tags: ['corruption', 'breach', 'veil', 'scar'],
        worldMood: 'veil-breach',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

function buildHeroicStabilizationBlueprint() {
  return Object.freeze({
    id: HEROIC_STABILIZATION_MOMENT_ID,
    label: 'Heroic Stabilization Before Collapse',
    tier: 'B',
    family: 'stability',
    sourceEvents: Object.freeze(['global.stability.high', 'node.stability.high', 'topology.healing', 'link.collapse.warning', 'link.collapse.critical', 'link.collapse.collapse']),
    cooldownMs: 76000,
    maxConcurrent: 1,
    minScore: 0.72,
    minAnchorConfidence: 0.84,
    stageDurations: HEROIC_STABILIZATION_STAGE_DURATIONS,
    resolveScore: resolveHeroicStabilizationReadabilityBudget,
    trigger(context) {
      const sourceEvent = String(context?.sourceEvent || '');
      if (!['global.stability.high', 'node.stability.high', 'topology.healing', 'link.collapse.warning', 'link.collapse.critical', 'link.collapse.collapse'].includes(sourceEvent)) return false;

      const state = resolveHeroicStabilizationState(context);
      if (sourceEvent === 'topology.healing') {
        if (state.collapseRisk < 0.42 && state.recoverySignal < 0.08 && state.criticalLinkCount <= 0) {
          return false;
        }
      } else if (state.collapseRisk < 0.58 && state.criticalLinkCount <= 0 && state.warningLinkCount <= 0) {
        return false;
      }

      return resolveHeroicStabilizationReadabilityBudget(context) >= this.minScore;
    },
    buildAnchor(context) {
      return resolveHeroicStabilizationAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.2 + score * 0.12,
        holdMs: 1900 + score * 420,
        settleMs: 2800 + score * 640,
        suppressAmbient: 0.22 + score * 0.16,
        focusStyle: 'last-stand-surge',
        orbitRadius: 0.1 + score * 0.06,
        impactShake: 0.03 + score * 0.04,
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      const profile = resolveHeroicStabilizationAudioProfile(context);
      return {
        family: profile.family,
        telegraphCue: profile.telegraphCue,
        crestCue: profile.crestCue,
        afterglowCue: profile.afterglowCue,
        audioLayer: profile.audioLayer,
        intensity: 0.62 + score * 0.3,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      const state = resolveHeroicStabilizationState(context);
      return {
        mode: 'heroic-stabilization-afterglow',
        residue: 'stability-seal',
        durationMs: 8200 + score * 2400,
        fadeMs: 1500 + score * 480,
        lingerIntensity: 0.34 + score * 0.22,
        anchor: anchor?.position ? { ...anchor.position } : null,
        collapseRisk: state.collapseRisk,
        recoverySignal: state.recoverySignal,
        rescueWindow: state.rescueWindow,
        worldState: 'stabilized-before-collapse'
      };
    },
    buildWorldSkin(context, anchor, score) {
      const state = resolveHeroicStabilizationState(context);
      return {
        id: HEROIC_STABILIZATION_MOMENT_ID,
        family: 'stability',
        mode: 'HEROIC_STABILIZATION',
        palette: ['#071018', '#FFD66B', '#8AF2E3', '#FFF8E8'],
        dominantColor: '#FFD66B',
        accentColor: '#8AF2E3',
        glowColor: '#FFF8E8',
        intensity: 0.82 + score * 0.1,
        collapseRisk: state.collapseRisk,
        recoverySignal: state.recoverySignal,
        rescueWindow: state.rescueWindow,
        dominantSignature: state.collapseRisk > 0.8 ? 'last-stand-seal' : 'stabilization-bloom',
        tags: ['heroic', 'stability', 'rescue', 'collapse', 'reward'],
        worldMood: 'heroic-stabilization',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

function buildWorldPersonalityShiftBlueprint() {
  return Object.freeze({
    id: WORLD_PERSONALITY_SHIFT_MOMENT_ID,
    label: 'World Personality Shift / Temperament Bloom',
    tier: 'A',
    family: 'personality',
    sourceEvents: Object.freeze(['world.mood.changed']),
    cooldownMs: 76000,
    maxConcurrent: 1,
    minScore: 0.68,
    minAnchorConfidence: 0.82,
    stageDurations: WORLD_PERSONALITY_SHIFT_STAGE_DURATIONS,
    resolveScore: resolveWorldPersonalityShiftReadabilityBudget,
    trigger(context) {
      if (String(context?.sourceEvent || '') !== 'world.mood.changed') return false;

      const snapshot = resolveWorldMoodSnapshot(context);
      if (!snapshot.moodChanged) return false;
      if (!snapshot.moodLabel || snapshot.moodLabel === 'NEUTRAL') return false;
      if (snapshot.intensity < 0.44) return false;
      if (snapshot.dominantSignature === 'neutral_balance') return false;

      return resolveWorldPersonalityShiftReadabilityBudget(context) >= this.minScore;
    },
    buildAnchor(context) {
      return resolveWorldPersonalityShiftAnchor(context);
    },
    buildCameraIntent(context, anchor, score) {
      return {
        mode: 'anchor-lock',
        anchor: anchor?.position ? { ...anchor.position } : null,
        emphasis: 0.1 + score * 0.08,
        holdMs: 1700 + score * 360,
        settleMs: 2600 + score * 520,
        suppressAmbient: 0.16 + score * 0.16,
        focusStyle: 'mood-wash',
        orbitRadius: 0.08 + score * 0.08,
        sourceWorld: context?.worldId || null
      };
    },
    buildAudioIntent(context, anchor, score) {
      const profile = resolveWorldPersonalityShiftAudioProfile(context);
      return {
        family: profile.family,
        telegraphCue: profile.telegraphCue,
        crestCue: profile.crestCue,
        afterglowCue: profile.afterglowCue,
        audioLayer: profile.audioLayer,
        intensity: 0.46 + score * 0.3,
        spatialAnchor: anchor?.position ? { ...anchor.position } : null,
        cameraLinked: !!context?.camera
      };
    },
    buildAftermath(context, anchor, score) {
      const snapshot = resolveWorldMoodSnapshot(context);
      return {
        mode: 'personality-afterglow',
        residue: 'mood-stain',
        durationMs: 7600 + score * 2200,
        fadeMs: 1800 + score * 620,
        lingerIntensity: 0.3 + score * 0.22,
        anchor: anchor?.position ? { ...anchor.position } : null,
        moodLabel: snapshot.moodLabel,
        dominantSignature: snapshot.dominantSignature,
        worldState: 'temperament-shifted'
      };
    },
    buildWorldSkin(context, anchor, score) {
      const snapshot = resolveWorldMoodSnapshot(context);
      const visualTone = snapshot.visualContext?.visualTone || {};
      return {
        id: WORLD_PERSONALITY_SHIFT_MOMENT_ID,
        family: 'personality',
        palette: snapshot.visualContext?.palette || visualTone.palette || [],
        dominantColor: visualTone.highlight || visualTone.primary || '#F7FBFF',
        accentColor: visualTone.accent || visualTone.secondary || '#6DEAFF',
        glowColor: visualTone.secondary || visualTone.highlight || '#FFFFFF',
        intensity: 0.74 + score * 0.16,
        moodLabel: snapshot.moodLabel,
        dominantSignature: snapshot.dominantSignature,
        tags: snapshot.visualContext?.tags || [],
        visualTone,
        worldMood: snapshot.visualContext?.description || snapshot.moodLabel || 'personality-shifted',
        anchor: anchor?.position ? { ...anchor.position } : null
      };
    }
  });
}

export class SignatureMomentDirector {
  constructor(config = {}) {
    this.semanticBus = config.semanticBus || null;
    this.getContext = typeof config.getContext === 'function' ? config.getContext : () => ({});
    this.enabled = config.enabled !== false;
    this._suppressedReason = null;
    this._initialized = false;
    this._subscriptions = [];
    this._sourceEventHandlers = new Map();
    this._interactionResponseHandlers = new Map();
    this._blueprints = new Map();
    this._activeMoment = null;
    this._cooldownUntil = 0;
    this._history = [];
    this._historyLimit = Number.isFinite(config.historyLimit) ? Math.max(1, Math.floor(config.historyLimit)) : 8;
    this._momentCounter = 0;
    this._lastSignal = null;
    this._lastSnapshot = null;

    const defaultBlueprint = config.defaultBlueprint || buildSynergyApexBlueprint();
    this.registerBlueprint(defaultBlueprint);
    this.registerBlueprint(buildCascadeReconstructionBlueprint());
    this.registerBlueprint(buildMemoryRecoveryBlueprint());
    this.registerBlueprint(buildLegendaryBondBlueprint());
    this.registerBlueprint(buildConsciousnessBloomBlueprint());
    this.registerBlueprint(buildHarmonyConvergenceBlueprint());
    this.registerBlueprint(buildMythicSignalBlueprint());
    this.registerBlueprint(buildGrandCorruptionBreachBlueprint());
    this.registerBlueprint(buildHeroicStabilizationBlueprint());
    this.registerBlueprint(buildWorldPersonalityShiftBlueprint());
  }

  initialize() {
    if (this._initialized) return;
    this._initialized = true;
    this._bindBlueprintSources();
    this._bindInteractionSources();
  }

  dispose() {
    while (this._subscriptions.length > 0) {
      const unsubscribe = this._subscriptions.pop();
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (error) {
        console.warn('[SignatureMomentDirector] Subscription cleanup failed:', error);
      }
    }

    this._sourceEventHandlers.clear();
    this._interactionResponseHandlers.clear();
    this._activeMoment = null;
    this._initialized = false;

    if (typeof window !== 'undefined') {
      if (window.signatureMomentDirector === this) {
        window.signatureMomentDirector = null;
      }
      if (window.signatureMoments && window.signatureMoments.director === this) {
        window.signatureMoments = null;
      }
    }
  }

  enable() {
    this.enabled = true;
    this._suppressedReason = null;
  }

  disable(reason = 'manual') {
    this.enabled = false;
    this._suppressedReason = reason || 'manual';
    if (this._activeMoment) {
      const moment = this._serializeMoment(this._activeMoment);
      moment.outcome = reason;
      moment.completedAt = nowMs();
      this._pushHistory(moment);
      this._activeMoment = null;
    }
  }

  update(deltaTime = 0, frameState = {}) {
    if (!this.enabled) return;
    if (!this._activeMoment) return;

    this._lastSnapshot = this._buildContext({ ...frameState, deltaTime });
    this._refreshActiveMomentModulation(this._activeMoment, this._lastSnapshot);
    this._advanceActiveMoment();
  }

  getState() {
    return {
      enabled: this.enabled,
      suppressedReason: this._suppressedReason,
      initialized: this._initialized,
      activeMoment: this._serializeMoment(this._activeMoment),
      cooldownUntil: this._cooldownUntil,
      lastSignal: this._lastSignal ? { ...this._lastSignal } : null,
      history: this.getHistory(this._historyLimit),
      blueprints: [...this._blueprints.values()].map((blueprint) => ({
        id: blueprint.id,
        label: blueprint.label,
        tier: blueprint.tier,
        family: blueprint.family,
        sourceEvents: [...(blueprint.sourceEvents || [])],
        cooldownMs: blueprint.cooldownMs,
        minScore: blueprint.minScore,
        minAnchorConfidence: blueprint.minAnchorConfidence
      }))
    };
  }

  getActiveMoment() {
    return this._serializeMoment(this._activeMoment);
  }

  getHistory(limit = 5) {
    const count = Math.max(1, Math.floor(limit));
    return this._history.slice(0, count).map((entry) => ({
      ...entry,
      anchor: entry.anchor ? { ...entry.anchor } : null,
      cameraIntent: entry.cameraIntent ? JSON.parse(JSON.stringify(entry.cameraIntent)) : null,
      audioIntent: entry.audioIntent ? JSON.parse(JSON.stringify(entry.audioIntent)) : null,
      aftermath: entry.aftermath ? JSON.parse(JSON.stringify(entry.aftermath)) : null,
      worldSkin: entry.worldSkin ? JSON.parse(JSON.stringify(entry.worldSkin)) : null
    }));
  }

  preview(momentId = SYNERGY_APEX_MOMENT_ID, overrides = {}) {
    const blueprint = this._resolveBlueprint(momentId);
    if (!blueprint) return null;

    const context = this._buildContext(overrides);
    return this._buildMomentPayload(blueprint, context, {
      sourceEvent: context.sourceEvent || overrides.sourceEvent || 'preview',
      sourcePayload: context.sourcePayload || overrides.sourcePayload || null,
      force: true,
      preview: true
    });
  }

  trigger(momentId = SYNERGY_APEX_MOMENT_ID, overrides = {}) {
    const blueprint = this._resolveBlueprint(momentId);
    if (!blueprint) return null;

    const context = this._buildContext({
      ...overrides,
      sourceEvent: overrides.sourceEvent || 'debug.manual',
      sourcePayload: overrides.sourcePayload || null,
      force: true
    });

    return this._startMoment(blueprint, context, { force: true });
  }

  registerBlueprint(definition) {
    if (!definition || typeof definition !== 'object' || !definition.id) return null;

    const normalized = {
      ...definition,
      sourceEvents: Array.isArray(definition.sourceEvents)
        ? [...new Set(definition.sourceEvents.filter(Boolean))]
        : [],
      cooldownMs: Number.isFinite(definition.cooldownMs) ? Math.max(0, Math.floor(definition.cooldownMs)) : 30000,
      maxConcurrent: Number.isFinite(definition.maxConcurrent) ? Math.max(1, Math.floor(definition.maxConcurrent)) : 1,
      minScore: Number.isFinite(definition.minScore) ? clamp01(definition.minScore) : 0.7,
      minAnchorConfidence: Number.isFinite(definition.minAnchorConfidence) ? clamp01(definition.minAnchorConfidence) : 0.6,
      stageDurations: definition.stageDurations || DEFAULT_STAGE_DURATIONS
    };

    this._blueprints.set(normalized.id, normalized);

    if (this._initialized) {
      this._registerBlueprintSources(normalized);
    }

    return normalized;
  }

  _bindBlueprintSources() {
    for (const blueprint of this._blueprints.values()) {
      this._registerBlueprintSources(blueprint);
    }
  }

  _bindInteractionSources() {
    const eventName = 'signature.moment.nudge';
    if (!this._interactionResponseHandlers.has(eventName)) {
      const handler = (payload = {}) => this._handleMomentNudge(payload);
      this._interactionResponseHandlers.set(eventName, handler);
      const unsubscribe = this._subscribe(eventName, handler);
      if (typeof unsubscribe === 'function') {
        this._subscriptions.push(unsubscribe);
      }
    }
  }

  _registerBlueprintSources(blueprint) {
    const sourceEvents = Array.isArray(blueprint?.sourceEvents) ? blueprint.sourceEvents : [];
    for (const eventName of sourceEvents) {
      if (!eventName || this._sourceEventHandlers.has(eventName)) continue;

      const handler = (payload = {}) => this._handleSignal(eventName, payload);
      this._sourceEventHandlers.set(eventName, handler);

      const unsubscribe = this._subscribe(eventName, handler);
      if (typeof unsubscribe === 'function') {
        this._subscriptions.push(unsubscribe);
      }
    }
  }

  _subscribe(eventName, handler) {
    if (!this.semanticBus || !eventName || typeof handler !== 'function') return null;

    // Registry-wrapped subscription for observability
    const regDisposer = eventRegistrationRegistry.register(
      'SignatureMomentDirector',
      eventName,
      handler,
      this.semanticBus
    );
    // Fallback: manual cleanup wrapper
    const fallbackDisposer = () => {
      try {
        if (typeof this.semanticBus.off === 'function') {
          this.semanticBus.off(eventName, handler);
        } else if (typeof this.semanticBus.unsubscribe === 'function') {
          this.semanticBus.unsubscribe(eventName, handler);
        }
      } catch (_) {
        /* silent fail */
      }
    };
    return () => {
      regDisposer();
      fallbackDisposer();
    };
  }

  _handleSignal(eventName, payload) {
    if (!this.enabled) return;
    if (!this._blueprints.size) return;

    this._lastSignal = {
      eventName,
      payload: summarizeSignalPayload(payload),
      timestamp: nowMs()
    };

    const context = this._buildContext({
      sourceEvent: eventName,
      sourcePayload: payload
    });

    this._lastSnapshot = context;

    for (const blueprint of this._blueprints.values()) {
      if (!blueprint.sourceEvents?.includes(eventName)) continue;
      if (!this._isBlueprintAllowedForContext(blueprint, context)) continue;
      if (this._activeMoment && this._activeMoment.blueprintId === blueprint.id) {
        return;
      }

      const startedMoment = this._startMoment(blueprint, context);
      if (startedMoment) return;
    }
  }

  _handleMomentNudge(payload = {}) {
    if (!this.enabled || !this._activeMoment) return;

    const active = this._activeMoment;
    if (!['harmony', 'mythic'].includes(active.family)) return;
    if (!['telegraph', 'crest', 'afterglow'].includes(active.stage)) return;

    const currentTime = nowMs();
    if (typeof active.lastNudgeAt === 'number' && currentTime - active.lastNudgeAt < 160) {
      return;
    }

    const strength = clamp01(payload.strength ?? (payload.inputKind === 'pointerdown' ? 0.26 : 0.18));
    active.lastNudgeAt = currentTime;
    active.interactionCount = (active.interactionCount || 0) + 1;
    active.interactionStrength = Math.max(active.interactionStrength || 0, strength);

    const telegraphCut = Math.round(90 + strength * 120);
    const crestCut = Math.round(70 + strength * 90);
    const afterglowBoost = Math.round(160 + strength * 240);

    if (active.stage === 'telegraph') {
      active.telegraphEndsAt = Math.max(currentTime + 180, active.telegraphEndsAt - telegraphCut);
    } else if (active.stage === 'crest') {
      active.crestEndsAt = Math.max(currentTime + 220, active.crestEndsAt - crestCut);
    }
    active.afterglowEndsAt += afterglowBoost;

    if (active.cameraIntent) {
      active.cameraIntent.emphasis = Math.max(0.08, (active.cameraIntent.emphasis || 0.12) * 0.92);
      active.cameraIntent.suppressAmbient = Math.max(0.06, (active.cameraIntent.suppressAmbient || 0.16) * 0.9);
    }

    if (active.audioIntent) {
      active.audioIntent.intensity = Math.min(1, (active.audioIntent.intensity || 0.6) + strength * 0.08);
    }

    this._emit('signature.moment.response', {
      ...this._serializeMoment(active),
      inputKind: payload.inputKind || 'unknown',
      inputCode: payload.inputCode || null,
      key: payload.key || null,
      pointerType: payload.pointerType || null,
      interactionCount: active.interactionCount,
      interactionStrength: strength
    }, 'LOW');

    if (this._lastSnapshot) {
      this._refreshActiveMomentModulation(active, this._lastSnapshot);
    }

    this._playAudioCue(this._lastSnapshot?.audioSystem || this.getContext({ sourceEvent: 'signature.moment.nudge' })?.audioSystem || null, active, 'response');
  }

  _startMoment(blueprint, context, options = {}) {
    if (!blueprint || !context) return null;

    const force = options.force === true;
    const currentTime = nowMs();
    if (!force && !this.enabled) return null;
    if (!force && !this._isBlueprintAllowedForContext(blueprint, context)) return null;
    if (!force && currentTime < this._cooldownUntil) return null;
    if (!force && this._activeMoment && this._activeMoment.blueprintId === blueprint.id) return null;

    if (!force && typeof blueprint.trigger === 'function' && !blueprint.trigger.call(blueprint, context)) {
      return null;
    }

    const scoreResolver = typeof blueprint.resolveScore === 'function'
      ? blueprint.resolveScore
      : resolveReadabilityBudget;
    const score = force ? 1 : scoreResolver.call(blueprint, context);
    if (!force && score < blueprint.minScore) return null;

    const anchor = typeof blueprint.buildAnchor === 'function'
      ? blueprint.buildAnchor.call(blueprint, context)
      : null;
    if (!anchor?.position) return null;
    if (!force && resolve01(anchor.confidence) < blueprint.minAnchorConfidence) return null;

    const durations = this._resolveStageDurations(blueprint, score);
    const cameraIntent = typeof blueprint.buildCameraIntent === 'function'
      ? blueprint.buildCameraIntent.call(blueprint, context, anchor, score)
      : null;
    const audioIntent = typeof blueprint.buildAudioIntent === 'function'
      ? blueprint.buildAudioIntent.call(blueprint, context, anchor, score)
      : null;
    const aftermath = typeof blueprint.buildAftermath === 'function'
      ? blueprint.buildAftermath.call(blueprint, context, anchor, score)
      : null;
    const rawWorldSkin = typeof blueprint.buildWorldSkin === 'function'
      ? blueprint.buildWorldSkin.call(blueprint, context, anchor, score)
      : null;
    const worldSkin = this._decorateWorldSkin(rawWorldSkin, blueprint, context, score);

    const adjustedDurations = worldSkin?.stageBias
      ? {
          telegraphMs: Math.max(220, Math.round(durations.telegraphMs * resolveNumeric(worldSkin.stageBias.telegraph || 1))),
          crestMs: Math.max(420, Math.round(durations.crestMs * resolveNumeric(worldSkin.stageBias.crest || 1))),
          afterglowMs: durations.afterglowMs,
          totalMs: 0
        }
      : { ...durations };
    adjustedDurations.totalMs = adjustedDurations.telegraphMs + adjustedDurations.crestMs + adjustedDurations.afterglowMs;

    const moment = {
      id: blueprint.id,
      label: blueprint.label,
      tier: blueprint.tier,
      family: blueprint.family,
      blueprintId: blueprint.id,
      sourceEvent: context.sourceEvent || null,
      sourcePayload: summarizeSignalPayload(context.sourcePayload),
      worldId: context.worldId || null,
      score,
      anchor: { ...anchor.position },
      anchorConfidence: resolve01(anchor.confidence),
      anchorSource: anchor.source || 'unknown',
      stage: 'telegraph',
      stageIndex: 0,
      stageDurations: adjustedDurations,
      startedAt: currentTime,
      stageEnteredAt: currentTime,
      telegraphEndsAt: currentTime + adjustedDurations.telegraphMs,
      crestEndsAt: currentTime + adjustedDurations.telegraphMs + adjustedDurations.crestMs,
      afterglowEndsAt: currentTime + adjustedDurations.telegraphMs + adjustedDurations.crestMs + adjustedDurations.afterglowMs,
      cameraIntent,
      audioIntent,
      aftermath,
      worldSkin,
      cooldownMs: blueprint.cooldownMs,
      force: force === true,
      completedAt: null,
      outcome: 'active'
    };

    this._activeMoment = moment;
    try {
      context?.worldFXPack?.applySignatureWorldSkin?.(worldSkin);
    } catch (error) {
      console.warn('[SignatureMomentDirector] Direct world skin handoff failed:', error);
    }
    this._emit('signature.moment.started', this._serializeMoment(moment), 'INTERACTIVE');
    this._emit('signature.camera.intent', cameraIntent, 'NORMAL');
    this._emit('signature.world.skin', worldSkin, 'LOW');
    this._emit('signature.audio.intent', audioIntent, 'NORMAL');
    this._emit('signature.debug.snapshot', this.getState(), 'LOW');

    this._applyStageSideEffects('telegraph', moment, context);
    return this._serializeMoment(moment);
  }

  _advanceActiveMoment() {
    const moment = this._activeMoment;
    if (!moment) return;

    const currentTime = nowMs();
    let advanced = true;

    while (advanced && this._activeMoment) {
      advanced = false;
      const active = this._activeMoment;

      if (active.stage === 'telegraph' && currentTime >= active.telegraphEndsAt) {
        active.stage = 'crest';
        active.stageIndex = 1;
        active.stageEnteredAt = currentTime;
        this._emit('signature.moment.crest', this._serializeMoment(active), 'INTERACTIVE');
        this._applyStageSideEffects('crest', active, this._buildContext({ sourceEvent: active.sourceEvent, sourcePayload: active.sourcePayload, stage: 'crest' }));
        advanced = true;
        continue;
      }

      if (active.stage === 'crest' && currentTime >= active.crestEndsAt) {
        active.stage = 'afterglow';
        active.stageIndex = 2;
        active.stageEnteredAt = currentTime;
        this._emit('signature.moment.afterglow', this._serializeMoment(active), 'LOW');
        this._applyStageSideEffects('afterglow', active, this._buildContext({ sourceEvent: active.sourceEvent, sourcePayload: active.sourcePayload, stage: 'afterglow' }));
        advanced = true;
        continue;
      }

      if (active.stage === 'afterglow' && currentTime >= active.afterglowEndsAt) {
        this._applyStageSideEffects('completed', active, this._buildContext({ sourceEvent: active.sourceEvent, sourcePayload: active.sourcePayload, stage: 'completed' }));
        this._completeActiveMoment('completed');
        advanced = false;
        continue;
      }
    }
  }

  _completeActiveMoment(reason = 'completed') {
    const moment = this._activeMoment;
    if (!moment) return;

    const currentTime = nowMs();
    const completedMoment = this._serializeMoment(moment);
    completedMoment.outcome = reason;
    completedMoment.completedAt = currentTime;
    completedMoment.stage = moment.stage;
    completedMoment.durationMs = currentTime - moment.startedAt;

    this._pushHistory(completedMoment);

    this._emit('signature.moment.completed', completedMoment, 'INTERACTIVE');
    this._emit('signature.debug.snapshot', this.getState(), 'LOW');

    this._cooldownUntil = currentTime + (moment.cooldownMs || DEFAULT_BLUEPRINT_CONFIG.cooldownMs);
    this._activeMoment = null;
  }

  _applyStageSideEffects(stage, moment, context) {
    const audioSystem = context?.audioSystem || null;
    const metricReactiveEvents = context?.metricReactiveEvents || null;
    const camera = context?.camera || null;
    const anchor = moment?.anchor || null;

    if (audioSystem?.setDramaturgySpatialContext && anchor) {
      audioSystem.setDramaturgySpatialContext(anchor, camera);
    }

    this._refreshActiveMomentModulation(moment, context);

    if (moment?.family === 'personality' && stage === 'telegraph') {
      const worldPersonalityController = context?.worldPersonalityController || null;
      const snapshot = resolveWorldMoodSnapshot(context);
      const moodLabel = snapshot.moodLabel;
      if (moodLabel && moodLabel !== 'NEUTRAL' && typeof worldPersonalityController?.triggerMoodTransition === 'function') {
        try {
          worldPersonalityController.triggerMoodTransition(moodLabel, moodLabel);
        } catch (error) {
          console.warn('[SignatureMomentDirector] Personality transition pulse failed:', error);
        }
      }
    }

    if (stage === 'telegraph') {
      if (moment?.family === 'corruption') {
        // Breach visuals are driven by the corruption modulation and audio crest.
      } else if (moment?.family === 'cascade' || moment?.family === 'memory') {
        this._safeMetricReactiveCall(metricReactiveEvents, 'triggerCoherenceWave');
      } else {
        this._safeMetricReactiveCall(metricReactiveEvents, 'triggerUnityPulse');
      }
      this._playAudioCue(audioSystem, moment, 'telegraph');
      return;
    }

    if (stage === 'crest') {
      if (moment?.family === 'corruption') {
        // Breach visuals stay anchored on the corruption field.
      } else if (moment?.family === 'cascade' || moment?.family === 'memory') {
        this._safeMetricReactiveCall(metricReactiveEvents, 'triggerUnityPulse');
      } else {
        this._safeMetricReactiveCall(metricReactiveEvents, 'triggerCoherenceWave');
      }
      this._playAudioCue(audioSystem, moment, 'crest');
      return;
    }

    if (stage === 'afterglow') {
      this._playAudioCue(audioSystem, moment, 'afterglow');
      return;
    }

    if (stage === 'response') {
      this._playAudioCue(audioSystem, moment, 'response');
      return;
    }

    if (stage === 'completed') {
      this._playAudioCue(audioSystem, moment, 'completed');
    }
  }

  _refreshActiveMomentModulation(moment, context) {
    const worldPersonalityController = context?.worldPersonalityController || null;
    const modulation = resolveSignatureMomentModulation(moment, context);
    if (!modulation || !worldPersonalityController?.setDramaturgyModulation) return;

    try {
      worldPersonalityController.setDramaturgyModulation(modulation);
    } catch (error) {
      console.warn('[SignatureMomentDirector] Modulation refresh failed:', error);
    }
  }

  _safeMetricReactiveCall(metricReactiveEvents, methodName) {
    if (!metricReactiveEvents || typeof metricReactiveEvents?.[methodName] !== 'function') return;
    try {
      metricReactiveEvents[methodName]();
    } catch (error) {
      console.warn(`[SignatureMomentDirector] ${methodName} failed:`, error);
    }
  }

  _playAudioCue(audioSystem, moment, stage) {
    if (!audioSystem) return;

    const audioIntent = moment?.audioIntent || {};
    const cue = stage === 'telegraph'
      ? audioIntent.telegraphCue || 'dramaturgy-resonance-telegraph'
      : stage === 'crest'
        ? audioIntent.crestCue || 'dramaturgy-resonance-escalation'
        : stage === 'response'
          ? audioIntent.telegraphCue || 'dramaturgy-resonance-telegraph'
        : stage === 'completed'
          ? audioIntent.completionCue || audioIntent.afterglowCue || 'dramaturgy-resonance-payoff'
          : audioIntent.afterglowCue || 'dramaturgy-resonance-payoff';
    const layer = audioIntent.audioLayer || 'halo-choir';
    const intensity = stage === 'telegraph'
      ? Math.max(0.25, (audioIntent.intensity || 0.6) * 0.58)
      : stage === 'crest'
        ? Math.max(0.55, audioIntent.intensity || 0.8)
        : stage === 'response'
          ? Math.max(0.2, (audioIntent.intensity || 0.55) * 0.3)
        : stage === 'completed'
          ? Math.max(0.2, (audioIntent.intensity || 0.55) * 0.34)
          : Math.max(0.3, (audioIntent.intensity || 0.55) * 0.52);

    try {
      if (['stability', 'harmony', 'mythic'].includes(moment?.family) && stage === 'crest' && typeof audioSystem.playScoreVictory === 'function') {
        audioSystem.playScoreVictory();
      }

      if (typeof audioSystem.playRoutedEventAudio === 'function') {
        audioSystem.playRoutedEventAudio(
          {
            audioCue: cue,
            audioLayer: layer,
            audioIntensity: intensity
          },
          `signature.${moment.family || 'moment'}`
        );
        return;
      }

      if (stage === 'telegraph' && typeof audioSystem.playDramaZoneHeartbeat === 'function') {
        audioSystem.playDramaZoneHeartbeat();
      } else if (stage === 'crest' && typeof audioSystem.playSynergyActive === 'function') {
        audioSystem.playSynergyActive();
      } else if ((stage === 'afterglow' || stage === 'completed') && typeof audioSystem.playSynergyFade === 'function') {
        audioSystem.playSynergyFade();
      }
    } catch (error) {
      console.warn('[SignatureMomentDirector] Audio cue failed:', error);
    }
  }

  _resolveStageDurations(blueprint, score) {
    const stageDurations = blueprint.stageDurations || DEFAULT_STAGE_DURATIONS;
    const telegraphMs = Math.max(220, Math.round((stageDurations.telegraphMs || DEFAULT_STAGE_DURATIONS.telegraphMs) - score * 120));
    const crestMs = Math.max(450, Math.round((stageDurations.crestMs || DEFAULT_STAGE_DURATIONS.crestMs) + score * 120));
    const afterglowMs = Math.max(1800, Math.round((stageDurations.afterglowMs || DEFAULT_STAGE_DURATIONS.afterglowMs) + score * 300));

    return Object.freeze({
      telegraphMs,
      crestMs,
      afterglowMs,
      totalMs: telegraphMs + crestMs + afterglowMs
    });
  }

  _buildMomentPayload(blueprint, context, options = {}) {
    if (!blueprint || !context) return null;

    const scoreResolver = typeof blueprint.resolveScore === 'function'
      ? blueprint.resolveScore
      : resolveReadabilityBudget;
    const score = options.force === true ? 1 : scoreResolver.call(blueprint, context);
    const anchor = typeof blueprint.buildAnchor === 'function'
      ? blueprint.buildAnchor.call(blueprint, context)
      : null;
    if (!anchor?.position) return null;

    const durations = this._resolveStageDurations(blueprint, score);
    return {
      id: blueprint.id,
      label: blueprint.label,
      tier: blueprint.tier,
      family: blueprint.family,
      sourceEvent: context.sourceEvent || options.sourceEvent || null,
      sourcePayload: summarizeSignalPayload(context.sourcePayload || options.sourcePayload || null),
      worldId: context.worldId || null,
      score,
      anchor: { ...anchor.position },
      anchorConfidence: resolve01(anchor.confidence),
      anchorSource: anchor.source || 'unknown',
      cameraIntent: typeof blueprint.buildCameraIntent === 'function'
        ? blueprint.buildCameraIntent.call(blueprint, context, anchor, score)
        : null,
      audioIntent: typeof blueprint.buildAudioIntent === 'function'
        ? blueprint.buildAudioIntent.call(blueprint, context, anchor, score)
        : null,
      aftermath: typeof blueprint.buildAftermath === 'function'
        ? blueprint.buildAftermath.call(blueprint, context, anchor, score)
        : null,
      worldSkin: this._decorateWorldSkin(
        typeof blueprint.buildWorldSkin === 'function'
          ? blueprint.buildWorldSkin.call(blueprint, context, anchor, score)
          : null,
        blueprint,
        context,
        score
      ),
      stageDurations: durations,
      force: options.force === true,
      preview: options.preview === true
    };
  }

  _isBlueprintAllowedForContext(blueprint, context) {
    if (!blueprint?.id) return false;
    const worldId = normalizeWorldId(context?.worldId || context?.currentMode || context?.worldContext?.worldId);
    if (!RELEASE_SIGNATURE_WORLD_IDS.has(worldId)) {
      return true;
    }
    return RELEASE_SIGNATURE_ALLOWLIST.has(blueprint.id);
  }

  _decorateWorldSkin(worldSkin, blueprint, context, score) {
    if (!worldSkin || !blueprint) return worldSkin;

    const releaseProfile = resolveReleaseSignatureProfile(
      context?.worldId || context?.currentMode || context?.worldContext?.worldId
    );
    const baseSkin = {
      ...worldSkin,
      releaseCurated: this._isBlueprintAllowedForContext(blueprint, context),
      foregroundClass: 'hero',
      silhouetteRole: this._resolveSilhouetteRole(blueprint.id, blueprint.family)
    };

    if (!releaseProfile) {
      return baseSkin;
    }

    return {
      ...baseSkin,
      releaseWorldProfile: releaseProfile.key,
      paletteTag: releaseProfile.paletteTag,
      worldSignature: releaseProfile.worldSignature,
      dominantColor: this._blendHexColors(baseSkin.dominantColor, releaseProfile.dominantMix, 0.3),
      accentColor: this._blendHexColors(baseSkin.accentColor, releaseProfile.accentMix, 0.34),
      glowColor: this._blendHexColors(baseSkin.glowColor, releaseProfile.glowMix, 0.24),
      intensity: clamp01(resolveNumeric(baseSkin.intensity) + releaseProfile.intensityBoost + score * 0.02),
      stageBias: {
        telegraph: releaseProfile.telegraphBias,
        crest: releaseProfile.crestBias
      },
      atmosphere: {
        ...(baseSkin.atmosphere || {}),
        ...releaseProfile.atmosphere
      }
    };
  }

  _resolveSilhouetteRole(blueprintId, family) {
    switch (blueprintId) {
      case LEGENDARY_BOND_MOMENT_ID:
        return 'bond-corridor';
      case CASCADE_RECONSTRUCTION_MOMENT_ID:
        return 'repair-beacon';
      case SYNERGY_APEX_MOMENT_ID:
        return 'surge-canopy';
      case CONSCIOUSNESS_BLOOM_MOMENT_ID:
        return 'thought-aurora';
      case WORLD_PERSONALITY_SHIFT_MOMENT_ID:
        return 'temperament-remap';
      case HEROIC_STABILIZATION_MOMENT_ID:
        return 'pressure-seal';
      case GRAND_CORRUPTION_BREACH_MOMENT_ID:
        return 'veil-fracture';
      default:
        return `${family || 'signature'}-hero`;
    }
  }

  _blendHexColors(primary, accent, amount = 0.3) {
    const base = this._hexToRgb(primary);
    const target = this._hexToRgb(accent);
    const t = clamp01(amount);
    const mix = {
      r: Math.round(base.r + (target.r - base.r) * t),
      g: Math.round(base.g + (target.g - base.g) * t),
      b: Math.round(base.b + (target.b - base.b) * t)
    };
    return this._rgbToHex(mix);
  }

  _hexToRgb(value) {
    const normalized = String(value || '#ffffff').replace('#', '').trim();
    const hex = normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized.padEnd(6, 'f').slice(0, 6);
    const int = Number.parseInt(hex, 16);
    if (!Number.isFinite(int)) {
      return { r: 255, g: 255, b: 255 };
    }
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255
    };
  }

  _rgbToHex({ r = 255, g = 255, b = 255 } = {}) {
    const toHex = (channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  _buildContext(overrides = {}) {
    let baseContext = {};

    try {
      baseContext = this.getContext({
        sourceEvent: overrides.sourceEvent || null,
        sourcePayload: overrides.sourcePayload || null,
        stage: overrides.stage || null,
        force: overrides.force === true,
        preview: overrides.preview === true
      }) || {};
    } catch (error) {
      console.warn('[SignatureMomentDirector] Context provider failed:', error);
      baseContext = {};
    }

    return {
      ...baseContext,
      ...overrides,
      sourceEvent: overrides.sourceEvent ?? baseContext.sourceEvent ?? null,
      sourcePayload: overrides.sourcePayload ?? baseContext.sourcePayload ?? null,
      force: overrides.force === true,
      preview: overrides.preview === true
    };
  }

  _resolveBlueprint(momentId) {
    return this._blueprints.get(momentId) || null;
  }

  _emit(eventName, payload, priorityName = 'NORMAL') {
    if (!this.semanticBus?.emit || !eventName) return;

    const priority = this.semanticBus.priority?.[priorityName] ?? null;
    try {
      if (priority !== null && priority !== undefined) {
        this.semanticBus.emit(eventName, payload, { priority });
      } else {
        this.semanticBus.emit(eventName, payload);
      }
    } catch (error) {
      console.warn('[SignatureMomentDirector] Event emit failed:', eventName, error);
    }
  }

  _pushHistory(moment) {
    if (!moment) return;
    this._history.unshift(moment);
    if (this._history.length > this._historyLimit) {
      this._history.length = this._historyLimit;
    }
  }

  _serializeMoment(moment) {
    if (!moment) return null;
    return {
      id: moment.id,
      label: moment.label,
      tier: moment.tier,
      family: moment.family,
      blueprintId: moment.blueprintId,
      sourceEvent: moment.sourceEvent || null,
      sourcePayload: moment.sourcePayload ? { ...moment.sourcePayload } : null,
      worldId: moment.worldId || null,
      score: moment.score,
      anchor: moment.anchor ? { ...moment.anchor } : null,
      anchorConfidence: moment.anchorConfidence,
      anchorSource: moment.anchorSource || null,
      stage: moment.stage,
      stageIndex: moment.stageIndex,
      stageDurations: moment.stageDurations ? { ...moment.stageDurations } : null,
      startedAt: moment.startedAt,
      stageEnteredAt: moment.stageEnteredAt,
      telegraphEndsAt: moment.telegraphEndsAt,
      crestEndsAt: moment.crestEndsAt,
      afterglowEndsAt: moment.afterglowEndsAt,
      interactionCount: Number.isFinite(moment.interactionCount) ? moment.interactionCount : 0,
      interactionStrength: Number.isFinite(moment.interactionStrength) ? moment.interactionStrength : 0,
      lastNudgeAt: Number.isFinite(moment.lastNudgeAt) ? moment.lastNudgeAt : null,
      cameraIntent: moment.cameraIntent ? JSON.parse(JSON.stringify(moment.cameraIntent)) : null,
      audioIntent: moment.audioIntent ? JSON.parse(JSON.stringify(moment.audioIntent)) : null,
      aftermath: moment.aftermath ? JSON.parse(JSON.stringify(moment.aftermath)) : null,
      worldSkin: moment.worldSkin ? JSON.parse(JSON.stringify(moment.worldSkin)) : null,
      cooldownMs: moment.cooldownMs,
      force: moment.force === true,
      completedAt: moment.completedAt || null,
      outcome: moment.outcome || 'active'
    };
  }
}

function resolve01(value) {
  return clamp01(Number.isFinite(value) ? value : 0);
}

export function installSignatureMomentDirectorDebugAPI(director) {
  if (typeof window === 'undefined' || !director) return;

  window.signatureMomentDirector = director;
  window.signatureMoments = {
    director,
    status: () => director.getState(),
    history: (limit = 5) => director.getHistory(limit),
    preview: (momentId = SYNERGY_APEX_MOMENT_ID, overrides = {}) => director.preview(momentId, overrides),
    trigger: (momentId = SYNERGY_APEX_MOMENT_ID, overrides = {}) => director.trigger(momentId, overrides),
    triggerSynergyApex: (overrides = {}) => director.trigger(SYNERGY_APEX_MOMENT_ID, overrides),
    triggerCascadeReconstruction: (overrides = {}) => director.trigger(CASCADE_RECONSTRUCTION_MOMENT_ID, overrides),
    triggerMemoryRecovery: (overrides = {}) => director.trigger(MEMORY_RECOVERY_MOMENT_ID, overrides),
    triggerLegendaryBondManifestation: (overrides = {}) => director.trigger(LEGENDARY_BOND_MOMENT_ID, overrides),
    triggerConsciousnessBloom: (overrides = {}) => director.trigger(CONSCIOUSNESS_BLOOM_MOMENT_ID, overrides),
    triggerHarmonyConvergence: (overrides = {}) => director.trigger(HARMONY_CONVERGENCE_MOMENT_ID, overrides),
    triggerMythicSignal: (overrides = {}) => director.trigger(MYTHIC_SIGNAL_MOMENT_ID, overrides),
    triggerGrandCorruptionBreach: (overrides = {}) => director.trigger(GRAND_CORRUPTION_BREACH_MOMENT_ID, overrides),
    triggerHeroicStabilizationBeforeCollapse: (overrides = {}) => director.trigger(HEROIC_STABILIZATION_MOMENT_ID, overrides),
    triggerWorldPersonalityShift: (overrides = {}) => director.trigger(WORLD_PERSONALITY_SHIFT_MOMENT_ID, overrides),
    enable: () => director.enable(),
    disable: (reason = 'manual') => director.disable(reason)
  };
}

export default SignatureMomentDirector;
