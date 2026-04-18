const SYNERGY_APEX_MOMENT_ID = 'synergy.apex.network-resonance-surge';
const CASCADE_RECONSTRUCTION_MOMENT_ID = 'cascade.reconstruction.beacon';
const MEMORY_RECOVERY_MOMENT_ID = 'memory.recovery.archive-reassembly';
const WORLD_PERSONALITY_SHIFT_MOMENT_ID = 'personality.world-temperament-shift';

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

const WORLD_PERSONALITY_SHIFT_STAGE_DURATIONS = Object.freeze({
  telegraphMs: 920,
  crestMs: 1320,
  afterglowMs: 7600
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
    sourceEvents: Object.freeze(['cascade.end', 'topology.healing']),
    cooldownMs: 52000,
    maxConcurrent: 1,
    minScore: 0.58,
    minAnchorConfidence: 0.6,
    stageDurations: CASCADE_RECONSTRUCTION_STAGE_DURATIONS,
    resolveScore: resolveReconstructionReadabilityBudget,
    trigger(context) {
      const sourceEvent = String(context?.sourceEvent || '');
      const isCascadeSignal = sourceEvent.includes('cascade');
      const isHealingSignal = sourceEvent === 'topology.healing' || sourceEvent.includes('healing');

      if (!isCascadeSignal && !isHealingSignal) return false;

      const activeLinkCount = resolveActiveLinkCount(context);
      if (activeLinkCount <= 0) return false;

      const collapsedLinkCount = resolveCollapsedLinkCount(context);
      const healingSignal = normalizeMetricValue(
        context?.sourcePayload?.harmonyRestored
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
    this._initialized = false;
    this._subscriptions = [];
    this._sourceEventHandlers = new Map();
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
    this.registerBlueprint(buildWorldPersonalityShiftBlueprint());
  }

  initialize() {
    if (this._initialized) return;
    this._initialized = true;
    this._bindBlueprintSources();
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
  }

  disable(reason = 'manual') {
    this.enabled = false;
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
    this._advanceActiveMoment();
  }

  getState() {
    return {
      enabled: this.enabled,
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

    if (typeof this.semanticBus.on === 'function') {
      this.semanticBus.on(eventName, handler);
      return () => {
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
    }

    if (typeof this.semanticBus.subscribe === 'function') {
      this.semanticBus.subscribe(eventName, handler);
      return () => {
        try {
          if (typeof this.semanticBus.unsubscribe === 'function') {
            this.semanticBus.unsubscribe(eventName, handler);
          }
        } catch (_) {
          /* silent fail */
        }
      };
    }

    return null;
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
      if (this._activeMoment && this._activeMoment.blueprintId === blueprint.id) {
        return;
      }

      const startedMoment = this._startMoment(blueprint, context);
      if (startedMoment) return;
    }
  }

  _startMoment(blueprint, context, options = {}) {
    if (!blueprint || !context) return null;

    const force = options.force === true;
    const currentTime = nowMs();
    if (!force && !this.enabled) return null;
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
    const worldSkin = typeof blueprint.buildWorldSkin === 'function'
      ? blueprint.buildWorldSkin.call(blueprint, context, anchor, score)
      : null;

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
      stageDurations: durations,
      startedAt: currentTime,
      stageEnteredAt: currentTime,
      telegraphEndsAt: currentTime + durations.telegraphMs,
      crestEndsAt: currentTime + durations.telegraphMs + durations.crestMs,
      afterglowEndsAt: currentTime + durations.telegraphMs + durations.crestMs + durations.afterglowMs,
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
    const worldPersonalityController = context?.worldPersonalityController || null;

    if (audioSystem?.setDramaturgySpatialContext && anchor) {
      audioSystem.setDramaturgySpatialContext(anchor, camera);
    }

    if (stage === 'telegraph') {
      if (moment?.family === 'cascade' || moment?.family === 'memory') {
        metricReactiveEvents?.triggerCoherenceWave?.();
      } else {
        metricReactiveEvents?.triggerUnityPulse?.();
      }
      this._playAudioCue(audioSystem, moment, 'telegraph');
      return;
    }

    if (stage === 'crest') {
      if (moment?.family === 'cascade' || moment?.family === 'memory') {
        metricReactiveEvents?.triggerUnityPulse?.();
      } else {
        metricReactiveEvents?.triggerCoherenceWave?.();
      }
      this._playAudioCue(audioSystem, moment, 'crest');
      return;
    }

    if (stage === 'afterglow') {
      this._playAudioCue(audioSystem, moment, 'afterglow');
    }

    if (moment?.family === 'personality') {
      const modulation = resolveWorldPersonalityShiftModulation(context);
      if (worldPersonalityController?.setDramaturgyModulation) {
        try {
          worldPersonalityController.setDramaturgyModulation(modulation);
        } catch (error) {
          console.warn('[SignatureMomentDirector] Personality modulation failed:', error);
        }
      }

      const snapshot = resolveWorldMoodSnapshot(context);
      const moodLabel = snapshot.moodLabel;
      if (stage === 'telegraph' && moodLabel && moodLabel !== 'NEUTRAL' && typeof worldPersonalityController?.triggerMoodTransition === 'function') {
        try {
          worldPersonalityController.triggerMoodTransition(moodLabel, moodLabel);
        } catch (error) {
          console.warn('[SignatureMomentDirector] Personality transition pulse failed:', error);
        }
      }

      if (stage === 'telegraph') {
        metricReactiveEvents?.triggerUnityPulse?.();
      } else if (stage === 'crest') {
        metricReactiveEvents?.triggerCoherenceWave?.();
      }
    }
  }

  _playAudioCue(audioSystem, moment, stage) {
    if (!audioSystem) return;

    const audioIntent = moment?.audioIntent || {};
    const cue = stage === 'telegraph'
      ? audioIntent.telegraphCue || 'dramaturgy-resonance-telegraph'
      : stage === 'crest'
        ? audioIntent.crestCue || 'dramaturgy-resonance-escalation'
        : audioIntent.afterglowCue || 'dramaturgy-resonance-payoff';
    const layer = audioIntent.audioLayer || 'halo-choir';
    const intensity = stage === 'telegraph'
      ? Math.max(0.25, (audioIntent.intensity || 0.6) * 0.58)
      : stage === 'crest'
        ? Math.max(0.55, audioIntent.intensity || 0.8)
        : Math.max(0.3, (audioIntent.intensity || 0.55) * 0.52);

    try {
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
      } else if (stage === 'afterglow' && typeof audioSystem.playSynergyFade === 'function') {
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
      worldSkin: typeof blueprint.buildWorldSkin === 'function'
        ? blueprint.buildWorldSkin.call(blueprint, context, anchor, score)
        : null,
      stageDurations: durations,
      force: options.force === true,
      preview: options.preview === true
    };
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
    triggerWorldPersonalityShift: (overrides = {}) => director.trigger(WORLD_PERSONALITY_SHIFT_MOMENT_ID, overrides),
    enable: () => director.enable(),
    disable: (reason = 'manual') => director.disable(reason)
  };
}

export default SignatureMomentDirector;