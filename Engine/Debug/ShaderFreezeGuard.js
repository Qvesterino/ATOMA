import * as THREE from 'three';
import { EnhancedNodeModels } from '../../EnhancedNodeModels.js';
import { materialRegistry } from '../../src/metrics/rendering/MaterialRegistry_v1.js';
import {
    initShaderVariantDetector,
    integrateWithAllSystems,
    setupDebugAPI
} from './ShaderVariantDetector.js';
import { debugLog } from './DebugLog.js';

const shaderDebugFlag = () => (typeof window !== 'undefined' && window.ATOMA_DEBUG_SHADER === true);

const shaderDebugEnabled = () => (typeof window !== 'undefined' && window.ATOMA_DEBUG === true && window.ATOMA_DEBUG_SHADER === true);

function shaderLog(...args) {
    debugLog(shaderDebugFlag(), ...args);
}

function shaderError(...args) {
    if (shaderDebugEnabled()) {
        console.error(...args);
    }
}

/**
 * Dev-only shader variant mutation tracer.
 * Patches Material property setters to log when variant-critical fields mutate
 * after a material has been "locked" (first render / warmup).
 */
const VARIANT_TRACE_PROPS = [
    'transparent',
    'blending',
    'side',
    'depthWrite',
    'depthTest',
    'fog',
    'lights',
    'defines'
];

function patchMaterialVariantSetters() {
    if (!THREE?.Material || THREE.Material.__variantSettersPatched) return;

    const proto = THREE.Material.prototype;
    VARIANT_TRACE_PROPS.forEach((prop) => {
        const desc = Object.getOwnPropertyDescriptor(proto, prop);
        if (!desc || typeof desc.set !== 'function' || typeof desc.get !== 'function') return;

        const originalSetter = desc.set;
        Object.defineProperty(proto, prop, {
            ...desc,
            set(value) {
                if (typeof window !== 'undefined' &&
                    window.__ATOMA_SHADER_TRACE &&
                    this.__variantLocked === true) {
                    shaderError(
                        '[ShaderVariantLeak]',
                        prop,
                        'changed to',
                        value,
                        'Material:',
                        this.type,
                        'UUID:',
                        this.uuid,
                        'Stack:',
                        new Error().stack
                    );
                }
                return originalSetter.call(this, value);
            }
        });
    });

    THREE.Material.__variantSettersPatched = true;
}

function lockSceneMaterials(scene) {
    if (!scene?.traverse) return;
    scene.traverse((obj) => {
        const mat = obj?.material;
        if (!mat) return;
        if (Array.isArray(mat)) {
            mat.forEach((m) => {
                if (m) m.__variantLocked = true;
            });
        } else {
            mat.__variantLocked = true;
        }
    });
}

function patchRendererRender(renderer) {
    if (!renderer || renderer.__variantRenderPatched) return;
    const originalRender = renderer.render?.bind(renderer);
    if (typeof originalRender !== 'function') return;

    renderer.render = (scene, camera) => {
        // Lock materials before first render so subsequent mutations are traced
        lockSceneMaterials(scene);
        return originalRender(scene, camera);
    };

    renderer.__variantRenderPatched = true;
}

function getProgramCount(renderer) {
    if (!renderer?.info) return 0;
    const programs = renderer.info.programs;
    return Array.isArray(programs) ? programs.length : (programs ?? 0);
}

export function installShaderFreezeGuard(renderer, systems = {}) {
    if (!renderer) return;
    if (typeof window === "undefined") return;

    // Enable dev-only trace flag by default
    if (window.__ATOMA_SHADER_TRACE === undefined) {
        window.__ATOMA_SHADER_TRACE = true;
    }

    if (window.__ATOMA_SHADER_TRACE) {
        patchMaterialVariantSetters();
        patchRendererRender(renderer);
    }

    // Initialize shader variant detector in dev mode
    initShaderVariantDetector();
    
    // Setup debug API
    if (typeof setupDebugAPI === 'function') {
        setupDebugAPI();
    }

    if (typeof window.markAtomaWarmupComplete !== "function") {
        window.markAtomaWarmupComplete = () => {
            window.__ATOMA_WARMUP_COMPLETE = true;
            if (typeof window.__startShaderFreezeMonitor === "function") {
                window.__startShaderFreezeMonitor();
            }
        };
    }

    if (window.__shaderFreezeGuardInstalled) return;
    window.__shaderFreezeGuardInstalled = true;

    // Integrate shader variant detector with known systems
    if (typeof window.__ATOMA_SHADER_VARIANT_SYSTEMS === 'object') {
        integrateWithAllSystems(window.__ATOMA_SHADER_VARIANT_SYSTEMS);
    } else if (Object.keys(systems).length > 0) {
        integrateWithAllSystems(systems);
    }

    window.__shaderFreezeMonitorStarted = false;
    const startMonitoring = () => {
        if (window.__shaderFreezeMonitorStarted) return;
        if (!renderer) return;

        window.__shaderFreezeMonitorStarted = true;
        let baseline = 0;

        const beginMonitoring = () => {
            setInterval(() => {
                const current = getProgramCount(renderer);
                if (current > baseline) {
                    shaderError(
                        "[ShaderFreeze] NEW SHADER PROGRAM DETECTED",
                        { baseline, current }
                    );
                }
            }, 1000);
        };

        const waitForPrograms = () => {
            const count = getProgramCount(renderer);
                if (count > 0) {
                    baseline = count;
                    shaderLog("[ShaderFreeze] baseline programs:", baseline);
                    beginMonitoring();
                } else {
                requestAnimationFrame(waitForPrograms);
            }
        };

        waitForPrograms();
    };
    window.__startShaderFreezeMonitor = startMonitoring;

    if (window.__ATOMA_WARMUP_COMPLETE === true) {
        startMonitoring();
        return;
    }

    const waitForWarmup = setInterval(() => {
        if (window.__ATOMA_WARMUP_COMPLETE === true) {
            clearInterval(waitForWarmup);
            startMonitoring();
        }
    }, 250);
}

export function warmupAllVisualVariants(renderer, scene, camera) {
    if (!renderer || typeof renderer.render !== "function") return;
    if (typeof window !== "undefined" && window.__ATOMA_WARMUP_COMPLETE === true) return;
    if (typeof window !== "undefined" && window.__ATOMA_WARMUP_RUNNING) return;
    if (typeof window !== "undefined") window.__ATOMA_WARMUP_RUNNING = true;

    const tempScene = new THREE.Scene();
    const tempCamera = camera?.clone?.() || new THREE.PerspectiveCamera(60, 1, 0.1, 10);
    tempCamera.position.set(0, 0, 5);

    const disposables = [];

    const addDisposable = (obj) => {
        if (!obj) return;
        tempScene.add(obj);
        disposables.push(obj);
    };

    const categories = ['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum'];
    EnhancedNodeModels.ensureRegistryReady?.();

    for (const cat of categories) {
        const node = EnhancedNodeModels.create?.(cat, 0, 0xffffff) ||
            new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        node.position.set(9999, 9999, 9999);
        node.visible = true;
        addDisposable(node);
    }

    // Link variant: neon shader if available, fallback basic
    const linkMaterial = materialRegistry?.getShader?.('link.neon', { color: 0x00ffff }) ||
        new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const linkGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 8, 1, true);
    const linkMesh = new THREE.Mesh(linkGeometry, linkMaterial);
    linkMesh.position.set(9999, 9999, 9999);
    addDisposable(linkMesh);

    try {
        renderer.render(tempScene, tempCamera);
        renderer.render(tempScene, tempCamera);
        renderer.compile(tempScene, tempCamera);
    } catch (err) {
        // best-effort warmup; ignore errors
    }

    // Dispose temporary objects
    disposables.forEach((obj) => {
        tempScene.remove(obj);
        obj.traverse?.((child) => {
            if (child.geometry?.dispose) child.geometry.dispose();
            const mat = child.material;
            if (mat && Array.isArray(mat)) mat.forEach((m) => m?.dispose?.());
            else if (mat?.dispose) mat.dispose();
        });
        if (obj.geometry?.dispose) obj.geometry.dispose();
        if (obj.material?.dispose) obj.material.dispose();
    });

    if (typeof window !== "undefined") {
        window.__ATOMA_WARMUP_COMPLETE = true;
        window.__ATOMA_WARMUP_RUNNING = false;
        if (typeof window.markAtomaWarmupComplete === "function") {
            window.markAtomaWarmupComplete();
        }
    }
}

/**
 * Register systems for shader variant detection
 * Call this before calling installShaderFreezeGuard
 * @param {Object} systems - Object containing material systems to monitor
 */
export function registerShaderVariantSystems(systems) {
    if (typeof window === "undefined") return;
    
    window.__ATOMA_SHADER_VARIANT_SYSTEMS = {
        ...(window.__ATOMA_SHADER_VARIANT_SYSTEMS || {}),
        ...systems
    };
}
