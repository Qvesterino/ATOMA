/**
 * shared/harmonyHelpers.js
 * ============================================================================
 * Centralized utility functions for harmonic / healing / harmony subsystems.
 *
 * PURPOSE:
 * Eliminate duplicated helper patterns (clamp01, readNodeMetric, lerpPhase,
 * etc.) that were copy-pasted across ~8+ subsystem files.
 *
 * ADOPTION RULE:
 * New and refactored files import from here. Legacy files may migrate
 * incrementally — do NOT mass-replace across the entire codebase in one pass.
 *
 * CONSTRAINTS:
 * ✅ Zero dependencies (no THREE, no bus, no engine)
 * ✅ Zero per-frame allocations
 * ✅ Deterministic, pure functions
 * ✅ Graceful fallback on missing data
 */

// ============================================================================
// MATH UTILITIES
// ============================================================================

/** Clamp value to [0, 1]. Handles non-finite input. */
export function clamp01(value) {
    if (!Number.isFinite(value)) return 0;
    return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Clamp value to [min, max]. */
export function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return value < min ? min : value > max ? max : value;
}

/** Linear interpolation: a + (b - a) * t. */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/** Smoothstep: smooth Hermite interpolation between edge0 and edge1. */
export function smoothstep(edge0, edge1, x) {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

/** Wrap phase to [-π, π]. */
export function normalizePhase(phase) {
    while (phase > Math.PI) phase -= Math.PI * 2;
    while (phase < -Math.PI) phase += Math.PI * 2;
    return phase;
}

/** Phase-aware lerp: interpolates across the shortest angular distance. */
export function lerpPhase(current, target, t) {
    let diff = target - current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * t;
}

// ============================================================================
// HASH UTILITIES
// ============================================================================

/** Simple string hash (FNV-1a style). Returns 32-bit signed integer. */
export function hashString(str) {
    let hash = 0;
    if (!str || typeof str !== 'string') return hash;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32-bit integer
    }
    return hash;
}

/** Hash string to [0, 1] float. */
export function hashToUnit(str) {
    const h = hashString(str);
    return Math.abs(h) / 2147483648; // 2^31
}

// ============================================================================
// NODE METRIC READERS
// ============================================================================

/**
 * Read a metric from a node object with deep fallback chain.
 * Tries: node.userData.metrics → node.userData → node[metric] → fallback
 */
export function readNodeMetric(node, metric, fallback = 0) {
    if (!node) return fallback;
    const userData = node.userData || {};
    const metrics = userData.metrics || {};
    const value = metrics[metric] ?? userData[metric] ?? node[metric] ?? fallback;
    return clamp01(value);
}

/** Read harmony from node (canonical metric). */
export function readNodeHarmony(node, fallback = 0.5) {
    return readNodeMetric(node, 'harmony', fallback);
}

/** Read corruption from node (canonical metric). */
export function readNodeCorruption(node, fallback = 0) {
    return readNodeMetric(node, 'corruption', fallback);
}

/** Read stability from node (canonical metric). */
export function readNodeStability(node, fallback = 1) {
    return readNodeMetric(node, 'stability', fallback);
}

/** Read synergy from node (canonical metric). */
export function readNodeSynergy(node, fallback = 0.5) {
    return readNodeMetric(node, 'synergy', fallback);
}

/** Read instability from node (canonical metric). */
export function readNodeInstability(node, fallback = 0) {
    return readNodeMetric(node, 'instability', fallback);
}

/** Read loadPressure from node (canonical metric). */
export function readNodeLoadPressure(node, fallback = 0) {
    return readNodeMetric(node, 'loadPressure', fallback);
}

// ============================================================================
// LINK METRIC READERS
// ============================================================================

/**
 * Read a metric from a link object with deep fallback chain.
 * Tries: link.userData.metrics → link.userData → link[metric] → fallback
 */
export function readLinkMetric(link, metric, fallback = 0) {
    if (!link) return fallback;
    const userData = link.userData || {};
    const metrics = userData.metrics || {};
    const value = metrics[metric] ?? userData[metric] ?? link[metric] ?? fallback;
    return clamp01(value);
}

/** Read synergy from link (canonical metric). */
export function readLinkSynergy(link, fallback = 0.5) {
    return readLinkMetric(link, 'synergy', fallback);
}

/** Read harmony from link (canonical metric). */
export function readLinkHarmony(link, fallback = 0.5) {
    return readLinkMetric(link, 'harmony', fallback);
}

// ============================================================================
// HUB METRIC READERS
// ============================================================================

/**
 * Read a metric from a hub object with deep fallback chain.
 * Tries: hub.userData.metrics → hub.primaryNode.userData.metrics → hub[metric] → fallback
 */
export function readHubMetric(hub, metric, fallback = 0) {
    if (!hub) return fallback;
    const hubMetrics = hub?.userData?.metrics;
    const primaryNode = hub?.primaryNode ?? hub?.nodes?.[0] ?? null;
    const primaryMetrics = primaryNode?.userData?.metrics;
    const value =
        hubMetrics?.[metric] ??
        hub?.[metric] ??
        primaryMetrics?.[metric] ??
        primaryNode?.userData?.[metric] ??
        fallback;
    return clamp01(value);
}

// ============================================================================
// GEOMETRY UTILITIES
// ============================================================================

/** Get node position as {x, y, z} or null. */
export function getNodePosition(node) {
    if (!node) return null;
    if (node.position) {
        return { x: node.position.x ?? 0, y: node.position.y ?? 0, z: node.position.z ?? 0 };
    }
    return null;
}

/** Get source and target positions from a link. */
export function getLinkEndpoints(link) {
    if (!link) return { source: null, target: null };
    const source = link.source || link.nodeA || link.a || null;
    const target = link.target || link.nodeB || link.b || null;
    return {
        source: getNodePosition(source),
        target: getNodePosition(target),
    };
}

/** Distance between two 3D points {x,y,z}. */
export function distance3D(a, b) {
    if (!a || !b) return Infinity;
    const dx = (a.x ?? 0) - (b.x ?? 0);
    const dy = (a.y ?? 0) - (b.y ?? 0);
    const dz = (a.z ?? 0) - (b.z ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ============================================================================
// COOLDOWN UTILITIES
// ============================================================================

/** Check if cooldown has expired. `map` is a Map<string, number> of timestamps. */
export function checkCooldown(map, key, cooldownMs, nowMs = performance.now()) {
    const last = map?.get?.(key);
    if (!last) return true;
    return (nowMs - last) >= cooldownMs;
}

/** Set cooldown timestamp. */
export function setCooldown(map, key, nowMs = performance.now()) {
    if (map && typeof map.set === 'function') {
        map.set(key, nowMs);
    }
}

// ============================================================================
// WRITE UTILITIES (for systems that write metrics)
// ============================================================================

/** Write a metric to node.userData.metrics (creates objects if missing). */
export function writeNodeMetric(node, metric, value) {
    if (!node) return;
    if (!node.userData) node.userData = {};
    if (!node.userData.metrics) node.userData.metrics = {};
    node.userData.metrics[metric] = clamp01(value);
}

/** Write a metric to link.userData.metrics (creates objects if missing). */
export function writeLinkMetric(link, metric, value) {
    if (!link) return;
    if (!link.userData) link.userData = {};
    if (!link.userData.metrics) link.userData.metrics = {};
    link.userData.metrics[metric] = clamp01(value);
}

// ============================================================================
// RESOLVE UTILITIES
// ============================================================================

/** Resolve node ID from various node reference shapes. */
export function resolveNodeId(nodeOrId) {
    if (!nodeOrId) return null;
    if (typeof nodeOrId === 'string' || typeof nodeOrId === 'number') return String(nodeOrId);
    return nodeOrId.id ?? nodeOrId.nodeId ?? null;
}

/** Resolve link ID from various link reference shapes. */
export function resolveLinkId(linkOrId) {
    if (!linkOrId) return null;
    if (typeof linkOrId === 'string' || typeof linkOrId === 'number') return String(linkOrId);
    return linkOrId.id ?? linkOrId.linkId ?? null;
}
