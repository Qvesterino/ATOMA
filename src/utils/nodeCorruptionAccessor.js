/**
 * Canonical node corruption accessors.
 * Synchronize legacy field `userData.corruption` with metrics field (if present).
 */
import { setMetric } from '../metrics/NodeMetricEngine.js';

export function getNodeCorruption(node) {
    return node?.userData?.metrics?.corruption ??
        node?.userData?.corruption ??
           node?.userData?.metrics?.corruption ??
           0;
}

export function setNodeCorruption(node, value, options = {}) {
    if (!node) return;
    if (!node.userData) node.userData = {};
    const next = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    setMetric(node, 'corruption', next, options);
    // Keep legacy mirror for backward compatibility readers.
    node.userData.corruption = next;
}
