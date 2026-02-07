import * as THREE from 'three';

/**
 * SHADER VARIANT DETECTOR
 * =======================
 * Detects runtime shader variant creation causes by monitoring material property changes.
 * 
 * Dev-only. No behavior changes - only logging.
 * 
 * Tracks:
 * - setValues() calls with forbidden properties (transparent, blending, side, fog, lights, defines)
 * - Direct property writes to monitored materials via Proxy wrapper
 */

// Dev-only flag (can be toggled with window.__ATOMA_SHADER_TRACE)
const DEV_MODE = true;
const loggedVariantWarnings = new Set();

function devTraceEnabled() {
    if (!DEV_MODE) return false;
    if (typeof window === 'undefined') return true;
    return window.__ATOMA_SHADER_TRACE !== false;
}

function shouldLogMaterial(material) {
    const uuid = material?.uuid;
    if (!uuid) return devTraceEnabled();
    if (!devTraceEnabled()) return false;
    if (loggedVariantWarnings.has(uuid)) return false;
    loggedVariantWarnings.add(uuid);
    return true;
}

// Forbidden properties that trigger shader variant compilation
const FORBIDDEN_PROPERTIES = [
    'transparent',
    'blending',
    'side',
    'fog',
    'lights',
    'defines'
];

// Track patched state
let setValuesPatched = false;

// Track materials wrapped with Proxy
const wrappedMaterials = new WeakSet();
const materialOrigins = new WeakMap();

/**
 * Patch THREE.Material.prototype.setValues to detect forbidden property changes
 */
function patchMaterialSetValues() {
    if (setValuesPatched) return;
    
    const originalSetValues = THREE.Material.prototype.setValues;
    
    THREE.Material.prototype.setValues = function(values) {
        if (!devTraceEnabled()) {
            return originalSetValues.call(this, values);
        }
        
        if (!values || typeof values !== 'object') {
            return originalSetValues.call(this, values);
        }
        
        // Check for forbidden properties
        for (const key of FORBIDDEN_PROPERTIES) {
            if (key in values && shouldLogMaterial(this)) {
                const origin = materialOrigins.get(this) || 'unknown';
                console.warn(
                    '[ShaderVariantChange]',
                    {
                        type: this.type || 'unknown',
                        property: key,
                        value: values[key],
                        uuid: this.uuid,
                        origin
                    }
                );
                console.trace();
            }
        }
        
        return originalSetValues.call(this, values);
    };
    
    setValuesPatched = true;
    console.log('[ShaderVariantDetector] THREE.Material.prototype.setValues patched');
}

/**
 * Create a Proxy wrapper for a material to detect direct property writes
 */
function wrapMaterialWithProxy(material, origin = 'unknown') {
    if (!devTraceEnabled()) return material;
    if (wrappedMaterials.has(material)) return material;
    
    // Store origin for logging
    materialOrigins.set(material, origin);
    
    // Create proxy handler
    const handler = {
        set(target, property, value, receiver) {
            const oldValue = target[property];
            
            // Allow assignment if value hasn't changed
            if (oldValue === value) {
                target[property] = value;
                return true;
            }
            
            // Check for forbidden properties
            if (FORBIDDEN_PROPERTIES.includes(property) && shouldLogMaterial(target)) {
                console.warn(
                    '[ShaderVariantChange]',
                    {
                        type: target.type || 'unknown',
                        property,
                        value,
                        uuid: target.uuid,
                        origin
                    }
                );
                console.trace();
            }
            
            target[property] = value;
            return true;
        }
    };
    
    const proxy = new Proxy(material, handler);
    wrappedMaterials.add(material);
    
    return proxy;
}

/**
 * Get material origin string for logging
 */
function getMaterialOrigin(systemName) {
    const originMap = {
        'MaterialRegistry': 'MaterialRegistry_v1',
        'RareNodeSpawner': '_RareNodeSpawner',
        'LegendaryPack': '_SafeLegendaryNodePack',
        'LegendaryLinkFX': '_SafeLegendaryLinkFX',
        'LegendaryWorldEvents': '_SafeLegendaryWorldEvents',
        'LinkSystem': 'NodeLinkingSystem',
        'LinkVisuals': 'NeonLinkVisuals',
        'NeuralCurveLinkVisuals': '_NeuralCurveLinkVisuals',
        'ExtremeLinkVisuals4_0': '_ExtremeLinkVisuals4_0'
    };
    
    return originMap[systemName] || systemName;
}

/**
 * Initialize the shader variant detector
 */
export function initShaderVariantDetector() {
    if (!DEV_MODE) return;
    
    patchMaterialSetValues();
    
    console.log('[ShaderVariantDetector] Initialized (dev mode)');
    console.log('[ShaderVariantDetector] Monitoring properties:', FORBIDDEN_PROPERTIES.join(', '));
}

/**
 * Register a material for monitoring with Proxy wrapper
 * @param {THREE.Material} material - The material to monitor
 * @param {string} origin - The system creating the material
 */
export function monitorMaterial(material, origin = 'unknown') {
    if (!DEV_MODE) return material;
    
    if (!material || typeof material !== 'object') {
        return material;
    }
    
    // Handle arrays of materials
    if (Array.isArray(material)) {
        return material.map(m => monitorMaterial(m, origin));
    }
    
    return wrapMaterialWithProxy(material, getMaterialOrigin(origin));
}

/**
 * Integrate with known material creation systems
 * @param {Object} systems - Object containing system instances
 */
export function integrateWithAllSystems(systems = {}) {
    if (!DEV_MODE) return;
    
    let integrationCount = 0;
    
    // MaterialRegistry
    if (systems.MaterialRegistry || typeof window !== 'undefined' && window.materialRegistry) {
        const registry = systems.MaterialRegistry || window.materialRegistry;
        
        // Hook getShader/create methods if they exist
        if (registry && typeof registry.getShader === 'function') {
            const originalGetShader = registry.getShader.bind(registry);
            registry.getShader = function(...args) {
                const material = originalGetShader(...args);
                return monitorMaterial(material, 'MaterialRegistry');
            };
            integrationCount++;
        }
        
        if (registry && typeof registry.create === 'function') {
            const originalCreate = registry.create.bind(registry);
            registry.create = function(...args) {
                const material = originalCreate(...args);
                return monitorMaterial(material, 'MaterialRegistry');
            };
            integrationCount++;
        }
    }
    
    // RareNodeSpawner
    if (systems.RareNodeSpawner || typeof window !== 'undefined' && window.rareNodeSpawner) {
        const spawner = systems.RareNodeSpawner || window.rareNodeSpawner;
        
        // Materials are created in EnhancedNodeModels, not spawner directly
        // Log that spawner is registered
        integrationCount++;
    }
    
    // Legendary Pack
    if (systems.LegendaryPack || typeof window !== 'undefined' && window.legendaryPack) {
        const pack = systems.LegendaryPack || window.legendaryPack;
        integrationCount++;
    }
    
    // Legendary Link FX
    if (systems.LegendaryLinkFX || typeof window !== 'undefined' && window.legendaryLinkFX) {
        const linkFX = systems.LegendaryLinkFX || window.legendaryLinkFX;
        integrationCount++;
    }
    
    // Link System
    if (systems.linkingSystem || typeof window !== 'undefined' && window.linkingSystem) {
        const linkingSystem = systems.linkingSystem || window.linkingSystem;
        
        // Monitor link materials if visual system exists
        if (linkingSystem && linkingSystem.visuals) {
            // Link materials are created by visual system
            integrationCount++;
        }
    }
    
    // Link Visual Systems
    if (systems.neonLinkVisuals || typeof window !== 'undefined' && window.neonLinkVisuals) {
        const neonLinkVisuals = systems.neonLinkVisuals || window.neonLinkVisuals;
        integrationCount++;
    }
    
    if (systems.neuralCurveLinkVisuals || typeof window !== 'undefined' && window.neuralCurveLinkVisuals) {
        const neuralCurve = systems.neuralCurveLinkVisuals || window.neuralCurveLinkVisuals;
        integrationCount++;
    }
    
    if (systems.extremeLinkVisuals4_0 || typeof window !== 'undefined' && window.extremeLinkVisuals4_0) {
        const extremeVisuals = systems.extremeLinkVisuals4_0 || window.extremeLinkVisuals4_0;
        integrationCount++;
    }
    
    console.log('[ShaderVariantDetector] Integrated with', integrationCount, 'systems');
}

/**
 * Get statistics about monitored materials
 */
export function getDetectionStats() {
    return {
        setValuesPatched,
        monitoredMaterials: wrappedMaterials.size,
        forbiddenProperties: FORBIDDEN_PROPERTIES
    };
}

/**
 * Console API for debugging
 */
export function setupDebugAPI() {
    if (typeof window === 'undefined') return;
    
    window.__ATOMA_SHADER_VARIANT_DETECTOR = {
        getStats: getDetectionStats,
        getForbiddenProperties: () => [...FORBIDDEN_PROPERTIES],
        addForbiddenProperty: (prop) => {
            if (!FORBIDDEN_PROPERTIES.includes(prop)) {
                FORBIDDEN_PROPERTIES.push(prop);
                console.log('[ShaderVariantDetector] Added forbidden property:', prop);
            }
        },
        removeForbiddenProperty: (prop) => {
            const index = FORBIDDEN_PROPERTIES.indexOf(prop);
            if (index > -1) {
                FORBIDDEN_PROPERTIES.splice(index, 1);
                console.log('[ShaderVariantDetector] Removed forbidden property:', prop);
            }
        }
    };
}
