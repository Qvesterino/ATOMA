/**
 * Canonical node corruption accessors.
 * Synchronize legacy field `userData.corruption` with metrics field (if present).
 */
export function getNodeCorruption(node) {
    return node?.userData?.corruption ??
           node?.userData?.metrics?.corruption ??
           0;
}

export function setNodeCorruption(node, value) {
    if (!node) return;
    if (!node.userData) node.userData = {};
    node.userData.corruption = value;
    if (node.userData.metrics) {
        node.userData.metrics.corruption = value;
    }
}
