import * as THREE from 'three';

// Runtime gate (default ON)
function authorityEnabled() {
    if (typeof window === 'undefined') return true;
    if (window.ATOMA_NODE_CORE_FREEZE_ENABLED === undefined) return true;
    return window.ATOMA_NODE_CORE_FREEZE_ENABLED === true;
}

const materialSnapshots = new WeakMap();
const frozenMaterials = new WeakSet();

const SNAPSHOT_PROPS = [
    'emissiveIntensity',
    'opacity',
    'transparent',
    'blending',
    'depthWrite',
    'depthTest',
    'side',
    'roughness',
    'metalness',
    'wireframe'
];

const USERDATA_KEYS = [
    '__depthAuthorityLocked',
    '__owner',
    '__domain',
    '__flagsFrozen',
    'isNodeCore',
    'nodeId'
];

function isCoreMesh(mesh) {
    if (!mesh || !mesh.isMesh) return false;
    if (mesh.userData?.isLinkVisual) return false;
    if (mesh.userData?.stateKey === 'link') return false;

    const name = (mesh.name || '').toLowerCase();
    const isCoreTagged = mesh.userData?.isCore === true || mesh.userData?.nodeCore === true;
    const nameSuggestsCore =
        name.includes('core') ||
        name.includes('body') ||
        name.includes('shell');
    const nameSuggestsOverlay =
        name.includes('aura') ||
        name.includes('halo') ||
        name.includes('glow') ||
        name.includes('ring') ||
        name.includes('outline') ||
        name.includes('glyph') ||
        name.includes('bead') ||
        name.includes('link');

    return (isCoreTagged || nameSuggestsCore) && !nameSuggestsOverlay;
}

function getCoreMeshes(nodeModel) {
    if (!nodeModel) return [];
    const meshes = [];
    const root = nodeModel.visualGroup || nodeModel;
    root.traverse?.((child) => {
        if (isCoreMesh(child)) {
            meshes.push(child);
        }
    });
    return meshes;
}

function snapshotMaterial(material) {
    if (!material || !authorityEnabled()) return null;

    const snapshot = {
        color: material.color ? material.color.clone() : null,
        emissive: material.emissive ? material.emissive.clone() : null,
        props: {},
        userData: {}
    };

    SNAPSHOT_PROPS.forEach((prop) => {
        if (prop in material) snapshot.props[prop] = material[prop];
    });

    USERDATA_KEYS.forEach((key) => {
        if (material.userData && key in material.userData) {
            snapshot.userData[key] = material.userData[key];
        }
    });

    materialSnapshots.set(material, snapshot);
    return snapshot;
}

function restoreMaterial(material) {
    if (!material || !authorityEnabled()) return;
    const snapshot = materialSnapshots.get(material);
    if (!snapshot) return;

    if (material.color && snapshot.color) material.color.copy(snapshot.color);
    if (material.emissive && snapshot.emissive) material.emissive.copy(snapshot.emissive);

    Object.entries(snapshot.props || {}).forEach(([key, value]) => {
        if (key in material) material[key] = value;
    });

    if (material.userData && snapshot.userData) {
        Object.entries(snapshot.userData).forEach(([key, value]) => {
            material.userData[key] = value;
        });
    }
}

function handleMaterial(mat, fn) {
    if (Array.isArray(mat)) {
        mat.forEach((m) => fn(m));
    } else {
        fn(mat);
    }
}

export function captureNodeCoreState(nodeModel) {
    if (!authorityEnabled()) return;
    const cores = getCoreMeshes(nodeModel);
    cores.forEach((mesh) => {
        handleMaterial(mesh.material, snapshotMaterial);
    });
}

export function restoreNodeCoreState(nodeModel) {
    if (!authorityEnabled()) return;
    const cores = getCoreMeshes(nodeModel);
    cores.forEach((mesh) => {
        handleMaterial(mesh.material, restoreMaterial);
    });
}

export function freezeNodeCoreState(nodeModel) {
    if (!authorityEnabled()) return;
    const cores = getCoreMeshes(nodeModel);
    cores.forEach((mesh) => {
        handleMaterial(mesh.material, (mat) => {
            if (frozenMaterials.has(mat)) return;
            const snap = snapshotMaterial(mat);
            if (snap) frozenMaterials.add(mat);
        });
    });
}

function lockCoreMaterial(material, freeze = true) {
    if (!material) return;

    const handle = (mat) => {
        if (!mat) return;

        // Ensure userData exists
        mat.userData = mat.userData || {};

        // Mark as core material
        mat.userData.isNodeCore = true;
        mat.userData.__depthAuthorityLocked = true;

        // Core must always participate in depth
        if ('depthWrite' in mat) mat.depthWrite = true;
        if ('depthTest' in mat) mat.depthTest = true;

        // Core should not be transparent
        if ('transparent' in mat) mat.transparent = false;

        // Optional freeze: reuse existing snapshot system if available
        if (freeze) {
            if (typeof snapshotMaterial === 'function') {
                snapshotMaterial(mat);
            }
        }
    };

    if (Array.isArray(material)) {
        material.forEach(handle);
    } else {
        handle(material);
    }
}

export class NodeCoreMaterialAuthority {
    constructor() {
        this.registeredNodes = new WeakSet();
    }

    /**
     * Register a node's core materials and lock them against mutation.
     * Idempotent per node instance.
     */
    registerNodeCore(nodeModel) {
        if (!nodeModel || this.registeredNodes.has(nodeModel)) return;
        const cores = getCoreMeshes(nodeModel);
        cores.forEach((mesh) => {
            handleMaterial(mesh.material, (mat) => lockCoreMaterial(mat, true));
        });
        this.registeredNodes.add(nodeModel);
    }

    /**
     * Re-assert core material authority after link events.
     */
    assertCoreOnLink(nodeModel) {
        if (!nodeModel) return;
        const cores = getCoreMeshes(nodeModel);
        cores.forEach((mesh) => {
            handleMaterial(mesh.material, (mat) => lockCoreMaterial(mat, true));
        });
    }

    captureNodeCoreState(nodeModel) {
        return captureNodeCoreState(nodeModel);
    }

    restoreNodeCoreState(nodeModel) {
        return restoreNodeCoreState(nodeModel);
    }

    freezeNodeCoreState(nodeModel) {
        return freezeNodeCoreState(nodeModel);
    }

    lockCoreMaterial(material, freeze = true) {
        return lockCoreMaterial(material, freeze);
    }

    // Static conveniences for existing call sites
    static captureNodeCoreState(nodeModel) {
        return captureNodeCoreState(nodeModel);
    }

    static restoreNodeCoreState(nodeModel) {
        return restoreNodeCoreState(nodeModel);
    }

    static freezeNodeCoreState(nodeModel) {
        return freezeNodeCoreState(nodeModel);
    }

    static lockCoreMaterial(material, freeze = true) {
        return lockCoreMaterial(material, freeze);
    }
}
