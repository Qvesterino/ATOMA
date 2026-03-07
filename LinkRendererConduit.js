import * as THREE from 'three';
import { debugWarn } from './Engine/Debug/DebugLog.js';
import { TransparentStateAuthority } from './TransparentStateAuthority.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { LinkBeadVisualizer } from './LinkBeadSystem.js';
import { LinkSparkSystem } from './LinkSparkSystem.js';
import { LinkBeadTrailSystem } from './LinkBeadTrailSystem.js';
import { LinkEnergyRingSystem } from './LinkEnergyRingSystem.js';
import { LinkPulseRing } from './LinkPulseRing.js';
import { LinkPulseDustEmitter } from './LinkPulseDustEmitter.js';
import { LinkEnergyWave } from './LinkEnergyWave.js';
import { LinkRingArcDischarges } from './LinkRingArcDischarges.js';
import { LinkVisualStateAdapter } from './LinkVisualStateAdapter.js';
import { NodeInterferenceManager } from './NodeInterferenceManager.js';
import { NodeHarmonicManager } from './NodeHarmonicManager.js';
import { LinkDirectionalStreaks } from './LinkDirectionalStreaks.js';
import { LinkCorruptionSpreadAnimator } from './LinkCorruptionSpreadAnimator.js';
import { LinkCorruptionParticleSystem } from './LinkCorruptionParticleSystem.js';
import { createLinkAuraMaterial, createLinkAuraGeometry } from './shaders/LinkAuraShader.js';
import { LinkStateVisualLanguageIntegration } from './LinkStateVisualLanguageIntegration.js';
import { linkStateVertexShaderSimple, linkStateFragmentShaderSimple } from './shaders/LinkStateVisualLanguage.js';
import { LinkTrailParticleSystem, LinkTrailEmitter } from './LinkTrailParticleSystem.js';
import { LinkHealingParticleSystem, LinkHealingEmitter } from './LinkHealingParticleSystem.js';
import { LinkExtensionConfig } from './LinkExtensionConfig.js';
import { ImpactManagerCollection } from './NodeImpactManager.js';
import VisualTime from './src/time/VisualTime.js';
import { LinkSemanticPictogramSystem_Enhanced } from './LinkSemanticPictogramSystem_Enhanced.js';

if (typeof window !== 'undefined' && !window.__PicDiagConduitModuleLoaded__) {
    console.info('[PicDiag] LinkRendererConduit module loaded');
    window.__PicDiagConduitModuleLoaded__ = true;
}

function computeSegmentsFromLength(curve, density = 8, minSeg = 12, maxSeg = 200) {
    if (!curve?.getLength) return minSeg;
    const length = curve.getLength();
    const segments = Math.floor(length * density);
    return Math.max(minSeg, Math.min(maxSeg, segments));
}

// Utility helpers (no allocations)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const remap = (v, in0, in1, out0, out1) => {
    if (in1 === in0) return out0;
    const t = clamp01((v - in0) / (in1 - in0));
    return out0 + (out1 - out0) * t;
};

// Lightweight dock spray system (per-link, instanced points)
function createDockSpraySystem(scene, renderOrder = 0, maxParticles = 48) {
    const positions = new Float32Array(maxParticles * 3);
    const velocities = new Float32Array(maxParticles * 3);
    const life = new Float32Array(maxParticles * 2); // birth, duration

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('aLife', new THREE.BufferAttribute(life, 2));
    geometry.attributes.position.usage = THREE.DynamicDrawUsage;
    geometry.attributes.aVelocity.usage = THREE.DynamicDrawUsage;
    geometry.attributes.aLife.usage = THREE.DynamicDrawUsage;

    const vertexShader = `
        attribute vec3 aVelocity;
        attribute vec2 aLife;
        uniform float uTime;
        uniform vec3 uColor;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
            float age = uTime - aLife.x;
            if (age < 0.0 || age > aLife.y) {
                vAlpha = 0.0;
                gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
                return;
            }
            float t = age / aLife.y;
            vec3 pos = position + aVelocity * age;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            // True perspective attenuation: no minimum screen-space floor.
            gl_PointSize = clamp(80.0 * (1.0 - t) / -mvPosition.z, 1.0, 20.0);
            vColor = uColor;
            vAlpha = 0.8 * (1.0 - t);
        }
    `;

    const fragmentShader = `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
            if (vAlpha <= 0.01) discard;
            vec2 c = gl_PointCoord - vec2(0.5);
            float d = length(c);
            if (d > 0.5) discard;
            float glow = 1.0 - smoothstep(0.3, 0.5, d);
            gl_FragColor = vec4(vColor, vAlpha * glow);
        }
    `;

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        sizeAttenuation: true,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xffffff) }
        }
    });

    const mesh = new THREE.Points(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = renderOrder;

    const randRange = (min, max) => min + Math.random() * (max - min);
    const randomUnit = () => {
        const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        if (v.lengthSq() < 1e-4) v.set(0, 0, 1);
        return v.normalize();
    };

    let writeIndex = 0;

    function spawnBurst(origin, surfaceDir, color, time = 0) {
        // Sync time so freshly spawned particles start at age 0
        material.uniforms.uTime.value = time;
        const count = Math.min(40, maxParticles);
        if (color) material.uniforms.uColor.value.copy(color);
        for (let i = 0; i < count; i++) {
            const idx = writeIndex;
            const i3 = idx * 3;
            // Spawn with slight positional jitter to widen spray footprint
            const jitterDir = randomUnit();
            const jitterMag = randRange(0, 0.12);
            positions[i3] = origin.x + jitterDir.x * jitterMag;
            positions[i3 + 1] = origin.y + jitterDir.y * jitterMag;
            positions[i3 + 2] = origin.z + jitterDir.z * jitterMag;

            const dir = randomUnit().lerp(surfaceDir, 0.6).normalize();
            const speed = randRange(0.6, 1.4);
            velocities[i3] = dir.x * speed;
            velocities[i3 + 1] = dir.y * speed;
            velocities[i3 + 2] = dir.z * speed;

            const i2 = idx * 2;
            life[i2] = material.uniforms.uTime.value;
            life[i2 + 1] = 0.45;

            writeIndex = (writeIndex + 1) % maxParticles;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.aVelocity.needsUpdate = true;
        geometry.attributes.aLife.needsUpdate = true;
    }

    function update(time) {
        material.uniforms.uTime.value = time;
    }

    function dispose() {
        if (mesh.parent) mesh.parent.remove(mesh);
        geometry.dispose();
        material.dispose();
    }

    return { mesh, spawnBurst, update, dispose };
}

const makeDebugId = (prefix = 'pic') => {
    const rand = Math.random().toString(36).slice(2, 6);
    const ts = Date.now().toString(36);
    return `${prefix}-${rand}-${ts}`;
};

// Merge and apply material patch in deterministic order
function applyMaterialPatch(material, patch = {}) {
    if (!material) return;
    const ownerTag = patch.owner || 'conduit';
    const ensureOwner = (prop) => {
        material.userData = material.userData || {};
        material.userData._propOwner = material.userData._propOwner || {};
        const current = material.userData._propOwner[prop];
        if (current && current !== ownerTag) {
            if (typeof window !== 'undefined' && window.__DEBUG_LINK_MATERIAL_OWNER__ === true) {
                console.warn('[LinkMaterialOwner]', prop, 'current:', current, 'new:', ownerTag, material.uuid);
            }
        }
        material.userData._propOwner[prop] = material.userData._propOwner[prop] || ownerTag;
    };

    if (patch.color instanceof THREE.Color && material.color) {
        ensureOwner('color');
        material.color.copy(patch.color);
    }
    if (patch.emissive instanceof THREE.Color && material.emissive) {
        ensureOwner('emissive');
        material.emissive.copy(patch.emissive);
    }
    if (typeof patch.opacity === 'number' && material.opacity !== patch.opacity) {
        ensureOwner('opacity');
        material.opacity = patch.opacity;
    }
    if (typeof patch.emissiveIntensity === 'number' && material.emissiveIntensity !== undefined) {
        ensureOwner('emissiveIntensity');
        material.emissiveIntensity = patch.emissiveIntensity;
    }
    if (typeof patch.linewidth === 'number' && material.linewidth !== undefined) {
        ensureOwner('linewidth');
        material.linewidth = patch.linewidth;
    }
}

// Merge patches (last wins) for a mesh
function mergePatch(map, mesh, patch) {
    if (!mesh) return;
    const existing = map.get(mesh) || {};
    const merged = { ...existing, ...patch };
    map.set(mesh, merged);
}

// Safe userData helper (avoids reassigning potentially frozen descriptor)
const ensureUserData = (obj) => {
    if (!obj) return {};
    if (!obj.userData) {
        Object.defineProperty(obj, 'userData', { value: {}, writable: true, configurable: true });
    }
    return obj.userData;
};

const VARIANT_CRITICAL_PROPS = [
    'transparent',
    'blending',
    'depthWrite',
    'depthTest',
    'alphaTest'
];

const variantDebugEnabled = () => (typeof window !== 'undefined' && window.ATOMA_DEBUG_VARIANT_LOCK === true);

function isCoreNodeMesh(mesh) {
    return mesh?.userData?.isNodeCore === true ||
           mesh?.userData?.nodeId !== undefined;
}

function freezeMaterialFlags(material, owner = 'LinkRenderer') {
    if (!material) return;
    const ud = ensureUserData(material);
    ud.__frozenVariantProps = ud.__frozenVariantProps || new Set();
    ud.__warnedVariantProp = ud.__warnedVariantProp || new Set();

    VARIANT_CRITICAL_PROPS.forEach((prop) => {
        if (ud.__frozenVariantProps.has(prop)) return;

        const desc = Object.getOwnPropertyDescriptor(material, prop);
        if (desc && desc.configurable === false) {
            if (variantDebugEnabled() && !ud.__warnedVariantProp.has(prop)) {
                debugWarn(true, '[VariantLock] Prop already locked, skip redefine', prop, material.uuid);
                ud.__warnedVariantProp.add(prop);
            }
            ud.__frozenVariantProps.add(prop);
            return;
        }

        const cachedValue = material[prop];
        try {
            Object.defineProperty(material, prop, {
                configurable: true,
                enumerable: true,
                get() {
                    return cachedValue;
                },
                set(value) {
                    if (cachedValue === value) return;
                    if (variantDebugEnabled() && !ud.__warnedVariantProp.has(prop)) {
                        console.error('[VariantLock]', prop, 'modified after lock');
                        ud.__warnedVariantProp.add(prop);
                    }
                }
            });
            ud.__frozenVariantProps.add(prop);
        } catch (err) {
            if (variantDebugEnabled() && !ud.__warnedVariantProp.has(prop)) {
                debugWarn(true, '[VariantLock] Failed to lock prop', prop, material.uuid, err?.message);
                ud.__warnedVariantProp.add(prop);
            }
        }
    });

    ud.__owner = ud.__owner || owner;
    ud.__flagsFrozen = true;
    material.__variantLocked = true; // backwards compatibility with existing checks
}

/**
 * BRAIDED SYNERGY ROPE LINK RENDERER
 * ============================================================================
 * Enforces a unified visual contract:
 * 1. Braided Rope Base (3-5 strands)
 * 2. Flow Carrier Effect (Pulse Ring)
 * 3. Unified Visual Consistency (No fallbacks)
 *
 * // Phase B.2: render state delegated to TransparentStateAuthority
 */
export class LinkRendererConduit {
    constructor(scene, linkingSystem = null, camera = null, parentGroup = null) {
        this.scene = scene;
        this.linkSystem = linkingSystem;
        this.camera = camera;
        this.conduitRoot = new THREE.Group();
        this.conduitRoot.name = 'LinkRendererConduitRoot';
        (parentGroup || this.scene)?.add(this.conduitRoot);
        this._picDiagCount = 0;
        if (typeof window !== 'undefined') {
            console.info('[PicDiag] Conduit constructed');
            window.__ConduitRenderer__ = this;
        }

        this.config = {
            baseRadius: 0.06,
            strandRadius: 0.025,
            twistSpacing: 2.0, // Units per full twist (normalized to link length)
            segments: 45,
 // +++++++ REPLACE
            radialSegments: 5,
            colorVariation: 0.15,
            breathingSpeed: 0.8,
            twistSpeed: 0.2,

            // Glow Skin (Ghostly Envelope)
            skinOpacity: 0.05,
            skinRadiusScale: 1.5
        };
 // +++++++ REPLACE

        // Central toggles for visual modules
        this.modules = {
            thickness: true,
            flow: true,
            beads: true,
            sparks: true,
            trails: true,
            corruptionFX: true,
            healingFX: true,
            streaks: true,
            aura: true,
            dissolve: true
        };

        // Reusable texture
        this.flowTexture = this.generateFlowTexture();

        // Math cache to reduce allocations
        this._vec3 = new THREE.Vector3();
        this._pulseDustWorldPos = new THREE.Vector3();

        // Node interference management (visual only)
        this.nodeInterferenceManager = new NodeInterferenceManager(scene);

        // Harmonic synchronization management (visual only)
        this.nodeHarmonicManager = new NodeHarmonicManager(scene);

        // Directional energy streaks system (visual only)
        this.directionalStreaks = new LinkDirectionalStreaks(scene);

        // Corruption spread animation system (visual only)
        this.corruptionAnimator = new LinkCorruptionSpreadAnimator();

        // Corruption particle system (visual only)
        this.corruptionParticles = new LinkCorruptionParticleSystem(scene);

        // Trail particle system (visual only) - uses same noise as aura systems
        this.trailParticles = new LinkTrailParticleSystem(scene, 300);

        // Trail emitters per link
        this.trailEmitters = new Map();

        // Healing particle system (visual only) - reverse flow, harmony-driven
        this.healingParticles = new LinkHealingParticleSystem(scene, 250);

        // Healing emitters per link
        this.healingEmitters = new Map();

        // Particle impact manager (for visual feedback when particles reach nodes)
        this.impactManager = new ImpactManagerCollection();

        // Semantic pictograms (global pool, attached to conduit root)
        this.pictogramSystem = new LinkSemanticPictogramSystem_Enhanced(
            scene,
            this.linkSystem,
            this.camera,
            this.conduitRoot
        );
        this.pictogramSystem.__debugId = this.pictogramSystem.__debugId || makeDebugId('pictos');
        // Ensure pictogram system always uses live linkSystem (in case linkSystem is swapped later)
        this.pictogramSystem.linkingSystem = this.linkSystem;

        if (typeof window !== 'undefined') {
            if (window.__PIC_SYSTEM__ && window.__PIC_SYSTEM__ !== this.pictogramSystem) {
                if (!window.__PIC_SYSTEM_OVERWRITE_WARNED__) {
                    console.warn('[PicDiag] __PIC_SYSTEM__ overwritten (new conduit instance)');
                    window.__PIC_SYSTEM_OVERWRITE_WARNED__ = true;
                }
            }
            window.__PIC_SYSTEM__ = this.pictogramSystem;
            window.__CONDUIT__ = this;
        }

        // Dissolve effects (link removal bursts)
        this._dissolveEffects = [];

        // Setup particle arrival callbacks
        this._setupParticleCallbacks();

        // Cached VFX input (reused each frame)
        this._vfxInput = {
            baseIntensity: 0.2,
            beadsIntensity: 0.1,
            sparksIntensity: 0.05,
            widthMul: 1.0,
            speedMul: 1.0,
            colorBias: 0.0
        };
        this._lastVfxDebugTime = 0;

        // Impact material pool (colorHex -> stack of materials)
        this._impactMaterialPool = new Map();
        this._impactPoolMaxSize = 20;

        // Link State Visual Language Integration
        this.linkStateVisualLanguage = null;
    }

    /**
     * Update all links (canonical list) - ensures beads/sparks tick every frame
     */
    updateAll(links, deltaTime, time) {
        if (this._picDiagCount < 3) {
            console.log('[PicDiag] updateAll tick', this._picDiagCount + 1);
            this._picDiagCount += 1;
        }
        const list = links
            || this.linkSystem?.links
            || this.links
            || [];

        // Garbage collect orphaned trail emitters (links removed without dispose)
        if (this.trailEmitters?.size && this.trailParticles) {
            const liveIds = new Set();
            for (const l of list) {
                if (l?.id !== undefined) liveIds.add(l.id);
            }
            for (const [id, emitter] of this.trailEmitters) {
                if (!liveIds.has(id)) {
                    emitter?.disable?.();
                    this.trailEmitters.delete(id);
                    this.trailParticles.clearLink?.(id);
                }
            }
        }

        if (!list.length && typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
            console.warn('[LinkRendererConduit] updateAll called with empty link list');
        }

        // Feed pictogram system with the actual list we render (even if linkSystem.links is empty)
        if (this.pictogramSystem) {
            this.pictogramSystem._externalLinks = list;
        }

        // Debug heartbeat: log once per second to confirm animator runs
        if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
            const now = performance.now();
            if (!this._dbgLastLog || now - this._dbgLastLog > 1000) {
                console.debug('[ConduitUpdate]', 'links:', list.length, 'dt:', deltaTime.toFixed(4));
                this._dbgLastLog = now;
            }
        }

        for (const link of list) {
            this.update(link, deltaTime, time);
        }

        if (!this._picDiagLogged) {
            if (!this.pictogramSystem) {
                console.warn('[PicDiag] pictogramSystem missing');
                this._picDiagLogged = true;
            } else if (!this.pictogramSystem.enabled) {
                console.warn('[PicDiag] pictogramSystem disabled');
                this._picDiagLogged = true;
            }
        }
        if (this.pictogramSystem?.enabled) {
            if (!this._picDiagLogged) {
                const ps = this.pictogramSystem;
                const pictos = ps?.pictograms || [];
                const active = pictos.filter(p => p.active).length;
                const firstActive = pictos.find(p => p.active);
                console.log('[PicDiag] links:', list.length,
                    'pool:', pictos.length,
                    'active:', active,
                    'containerChildren:', ps?.container?.children?.length,
                    'spiralRadius:', firstActive?.spiralRadius,
                    'envelope:', firstActive?.link?.visualEnvelopeRadius);
                this._picDiagLogged = true;
            }
            this.pictogramSystem.update(deltaTime, time, this.camera);
        }
    }

    /**
     * Setup callbacks for when particles arrive at destination nodes
     */
    _setupParticleCallbacks() {
      // Trail particles (corruption) arrive at target nodes
      this.trailParticles.setArrivalCallback((particle, link, _time) => {
        if (link?.target?.userData?.nodeId !== undefined) {
          const targetNodeId = link.target.userData.nodeId;

          // Calculate incoming direction (source → target)
          // This biases the aura deformation toward the incoming link
          const incomingDir = new THREE.Vector3()
            .subVectors(link.target.position, link.source.position)
            .normalize();

          // Trigger corruption impact at target
          this.impactManager.triggerImpact(
            targetNodeId,
            'corruption',
            VisualTime.now, // Time source: VisualTime (canonical)
            0.8,    // Intensity: 80% strength
            0.18,   // Duration: 180ms (polished timing)
            incomingDir  // ← Pass incoming direction for bias
          );
        }
      });

      // Healing particles (harmony) arrive at source nodes
      this.healingParticles.setArrivalCallback((particle, link, _time) => {
        if (link?.source?.userData?.nodeId !== undefined) {
          const sourceNodeId = link.source.userData.nodeId;

          // Calculate incoming direction (target → source, reversed)
          // Healing flows backward, so reverse the direction
          const incomingDir = new THREE.Vector3()
            .subVectors(link.source.position, link.target.position)
            .normalize();

          // Trigger harmony impact at source
          this.impactManager.triggerImpact(
            sourceNodeId,
            'harmony',
            VisualTime.now, // Time source: VisualTime (canonical)
            0.75,   // Intensity: 75% strength
            0.19,   // Duration: 190ms (polished timing)
            incomingDir  // ← Pass incoming direction for bias
          );
        }
      });
    }

    /**
     * Emit a pulse wave from a node into all connected links
     * Called by application when a node should emit energy pulses
     *
     * @param {Object} sourceNode - Source node
     * @param {Array} connectedLinks - Links connected to this node
     * @param {number} time - Current time
     */
    emitNodePulse(sourceNode, connectedLinks, _time = 0) {
        if (this.directionalStreaks) {
            // Get hub controller if this node is a harmonic hub
            const hubController = this.nodeHarmonicManager?.nodeControllers.get(sourceNode);

            this.directionalStreaks.pulseInjector.injectNodePulse(
                sourceNode,
                connectedLinks,
                VisualTime.now, // Time source: VisualTime (canonical)
                hubController,
                this.nodeHarmonicManager?.nodeControllers
            );
        }
    }

    /**
     * Register a harmonic hub for pulse phase synchronization
     * Called when a node becomes a harmonic hub
     *
     * @param {Object} node - Hub node
     * @param {Object} hubController - NodeHarmonicSyncController
     * @param {Array} connectedLinks - Links connected to hub
     */
    registerHarmonicHub(node, hubController, connectedLinks = []) {
        if (this.directionalStreaks) {
            this.directionalStreaks.pulseInjector.phaseSync.registerHubNode(node, hubController, connectedLinks);
        }
    }

    /**
     * Unregister a harmonic hub
     * Called when a node stops being a harmonic hub
     *
     * @param {Object} node - Former hub node
     * @param {Array} connectedLinks - Links that were connected
     */
    unregisterHarmonicHub(node, connectedLinks = []) {
        if (this.directionalStreaks) {
            this.directionalStreaks.pulseInjector.phaseSync.unregisterHubNode(node, connectedLinks);
        }
    }

    /**
     * Build cascade network for pulse propagation
     * Called when hub configuration changes
     */
    buildCascadeNetwork() {
        if (this.directionalStreaks && this.nodeHarmonicManager) {
            this.directionalStreaks.pulseInjector.buildCascadeNetwork(
                this.nodeHarmonicManager.nodeControllers
            );
        }
    }

    /**
     * Update cascade pulse propagation
     * Called from main update loop (after all link updates)
     *
     * @param {number} deltaTime - Frame delta
     * @param {number} time - Current time
     * @param {number} harmony - Harmony level (0-1)
     * @param {number} corruption - Corruption level (0-1)
     * @param {number} instability - Instability level (0-1)
     * @param {number} synergy - Synergy level (0-1)
     * @param {Array} links - All links
     */
    updateCascadePropagation(deltaTime, time, harmony = 1.0, corruption = 0.0, instability = 0.0, synergy = 0.5, links = []) {
        const visualDelta = VisualTime.delta;
        const visualNow = VisualTime.now;
        if (this.directionalStreaks && this.nodeHarmonicManager) {
            this.directionalStreaks.pulseInjector.updateCascadePropagation(
                visualDelta,
                visualNow,
                harmony,
                corruption,
                instability,
                synergy,
                this.nodeHarmonicManager.nodeControllers,
                links
            );
        }
    }

    /**
     * Get the node interference manager
     * Used by the application to register nodes and links with the interference system
     */
    getNodeInterferenceManager() {
        return this.nodeInterferenceManager;
    }

    /**
     * Get the node harmonic manager
     * Used by the application to register nodes and links with the harmonic sync system
     */
    getNodeHarmonicManager() {
        return this.nodeHarmonicManager;
    }

    /**
     * Update all interference effects
     * Call this from the main render loop after all individual link updates
     */
    updateNodeInterference(links, harmony = 1.0, corruption = 0.0, instability = 0.0) {
        this.nodeInterferenceManager.update(links, harmony, corruption, instability);
    }

    /**
     * Update all harmonic sync effects
     * Call this from the main render loop after all individual link updates
     */
    updateNodeHarmonySync(links, harmony = 1.0, corruption = 0.0, instability = 0.0) {
        this.nodeHarmonicManager.update(links, harmony, corruption, instability);
    }

    /**
     * Update all trail particles
     * Call this from the main render loop after all individual link updates
     */
    updateTrailParticles(deltaTime, time) {
        const visualDelta = VisualTime.delta;
        const visualNow = VisualTime.now;
        if (this.trailParticles) {
            this.trailParticles.update(visualDelta, visualNow);
        }
    }

    /**
     * Update all healing particles
     * Call this from the main render loop after all individual link updates
     */
    updateHealingParticles(deltaTime, time) {
        const visualDelta = VisualTime.delta;
        const visualNow = VisualTime.now;
        if (this.healingParticles) {
            this.healingParticles.update(visualDelta, visualNow);
        }
    }

    /**
     * Generate procedural gradient texture
     */
    generateFlowTexture() {
        if (typeof document === 'undefined') return null;

        const width = 256;
        const height = 1;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#666666';
        ctx.fillRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        return texture;
    }

    /**
     * Create the unified link visual group
     */
    createLinkVisuals(link) {
        const group = new THREE.Group();
        Object.assign(ensureUserData(group), { isLinkVisual: true });
        const conduitState = group.userData.conduitState || (group.userData.conduitState = {});
        const state = conduitState;

        const sourceCat = link.source.userData.category || 'input';
        const targetCat = link.target.userData.category || 'input';
        const baseColor = this.getCategoryColor(sourceCat);
        const colorA = new THREE.Color(this.getCategoryColor(sourceCat));
        const colorB = new THREE.Color(this.getCategoryColor(targetCat));

        // 1. Determine Structure (Stable Randomization)
        // Ensure 3-5 strands based on ID to maintain consistency per link
        const linkIdChar = (link.id || 'a').charCodeAt(0);
        const strandCount = 3 + (linkIdChar % 3); // 3, 4, or 5 strands

        // 2. Create Strands (The Rope)
        const strands = [];
        const strandOverlays = [];
        for (let i = 0; i < strandCount; i++) {
            const categoryColor = (i % 2 === 0) ? colorA : colorB;

            const flowMap = this.flowTexture ? this.flowTexture.clone() : null;
            if (flowMap) {
                flowMap.wrapS = THREE.RepeatWrapping;
                flowMap.needsUpdate = true;
                flowMap.offset.x = Math.random();
            }

            const material = new THREE.ShaderMaterial({
                vertexShader: linkStateVertexShaderSimple,
                fragmentShader: linkStateFragmentShaderSimple,
                transparent: true,
                depthWrite: false,
                depthTest: true,
                side: THREE.DoubleSide,
                uniforms: {
                    uNetworkStress: { value: 0.0 },
                    uLocalLoad: { value: 0.0 },
                    uCorruption: { value: 0.0 },
                    uTime: { value: 0.0 },
                    uBaseColor: { value: categoryColor.clone() }
                }
            });
            ensureUserData(material);
            material.userData.__owner = 'LinkRenderer';
            material.userData.__domain = 'link';
            material.userData.__flagsFrozen = material.userData.__flagsFrozen || false;

            const geometry = new THREE.BufferGeometry();
            const mesh = new THREE.Mesh(geometry, material);
            Object.assign(ensureUserData(mesh), { strandIndex: i });
            mesh.frustumCulled = false;
            geometry.computeBoundingSphere();
            geometry.computeBoundingBox();
            const strandOrder = VisualHierarchyRegistry.getRenderOrder('LINK_STRANDS');
            mesh.renderOrder = strandOrder;
            TransparentStateAuthority.apply(mesh, 'link', { renderOrder: strandOrder, depthWrite: true, depthTest: true, blending: THREE.NormalBlending });
            freezeMaterialFlags(material, 'LinkRenderer');
            material.userData.__flagsFrozen = true;
            ensureUserData(mesh);
            mesh.userData.__depthAuthorityLocked = true;
            mesh.raycast = () => null; // prevent blocking node raycasts

            group.add(mesh);
            strands.push(mesh);

            // Overlay (glow/detail) shares uniforms, but does not write depth
            const overlayMat = material.clone();
            overlayMat.transparent = true;
            overlayMat.depthWrite = true;
            overlayMat.depthTest = true;
            overlayMat.blending = THREE.AdditiveBlending;
            overlayMat.opacity = 0.02;
            overlayMat.side = THREE.DoubleSide;
            overlayMat.uniforms = material.uniforms; // share uniforms so updates propagate
            // Dim the base color contribution on overlay
            if (overlayMat.uniforms?.uBaseColor?.value) {
                overlayMat.uniforms.uBaseColor.value = overlayMat.uniforms.uBaseColor.value.clone().multiplyScalar(0.5);
            }
            const overlayMesh = new THREE.Mesh(geometry, overlayMat);
            overlayMesh.frustumCulled = false;
            overlayMesh.renderOrder = strandOrder;
            TransparentStateAuthority.apply(overlayMesh, 'link', { renderOrder: strandOrder, depthWrite: false, depthTest: true, blending: THREE.NormalBlending });
            ensureUserData(overlayMesh);
            overlayMesh.userData.strandOverlay = true;
            group.add(overlayMesh);
            strandOverlays.push(overlayMesh);
        }
        state.strandOverlays = strandOverlays;

        // 3. Create Aura Skin (Unified with Node Aura - Shader-based)
        // PHASE S-5: Variant properties set at creation time, then frozen
        // NO runtime mutations to transparent, depthWrite, depthTest, side, blending allowed
        const skinMaterial = createLinkAuraMaterial({
            baseDisplacement: 0.15,     // 60% of node aura
            noiseScale: 2.0,            // Same scale as node
            timeScale: 0.5,             // Same rhythm as node
            baseOpacity: 0.12,          // Lower than node (node ≈ 0.25)
            harmonyInfluence: 0.8,      // Identical harmony response
            corruptionInfluence: 0.9,   // Slightly less than node (1.2)
            // Variant properties (frozen after creation):
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const skinGeometry = createLinkAuraGeometry(0.4, 16);
        const skinMesh = new THREE.Mesh(skinGeometry, skinMaterial);
        skinMesh.frustumCulled = false;
        skinGeometry.computeBoundingSphere();
        skinGeometry.computeBoundingBox();
        ensureUserData(skinMaterial);
        skinMaterial.userData.__owner = 'LinkRenderer';
        skinMaterial.userData.__domain = 'link';
        // Freeze variant properties immediately after material creation
        freezeMaterialFlags(skinMaterial, 'LinkRenderer');
        const skinOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SKIN');
        TransparentStateAuthority.apply(skinMesh, 'link', { renderOrder: skinOrder, depthWrite: false });
        ensureUserData(skinMesh);
        skinMesh.userData.__depthAuthorityLocked = true;
        group.add(skinMesh);

        if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
            console.log('[LinkRendererConduit] LINK GROUP PARENT:', group.parent);
        }

        // 4. Initialize Subsystems (Defensive)
        let beadVisualizer = new LinkBeadVisualizer(link, this.scene);
        group.add(beadVisualizer.getGroup());

        let sparkSystem = new LinkSparkSystem(this.scene);
        group.add(sparkSystem.getMesh());

        // AUDIT: Verify spark mesh is added to scene
        const sparkMesh = sparkSystem.getMesh();
        this.scene.add(sparkMesh);
        console.log("SPARK MESH ADDED", sparkMesh);

        let trailSystem = null;
        try { if (LinkBeadTrailSystem) trailSystem = new LinkBeadTrailSystem(this.scene); } catch(e){ throw e; }
        if(trailSystem) group.add(trailSystem.getMesh());

        let linkTrailEmitter = null;
        try {
            if (LinkTrailEmitter && window.game?.linkTrailParticles) {
                linkTrailEmitter = new LinkTrailEmitter(link, window.game.linkTrailParticles);
                console.log('[LinkRendererConduit] LinkTrailEmitter SUCCESSFULLY created for link:', link.id);
                console.log('[LinkRendererConduit] LinkTrailParticles available:', !!window.game?.linkTrailParticles);
                console.log('[LinkRendererConduit] LinkTrailEmitter stored in state.trails for link:', link.id);
            }
        } catch(e) {
            console.warn('[LinkRendererConduit] LinkTrailEmitter creation failed:', e);
        }

        // Store LinkTrailEmitter in state for consistency with other subsystems
        if (linkTrailEmitter) {
            state.trails = linkTrailEmitter;
            console.log('[LinkRendererConduit] LinkTrailEmitter stored in state.trails for link:', link.id);
        }

        let ringSystem = null;
        try { if (LinkEnergyRingSystem) ringSystem = new LinkEnergyRingSystem(this.scene); } catch(e){ throw e; }

        // 5. Flow Carrier (Mandatory)
        let pulseRing = null;
        let pulseDust = null;
        try {
            if (LinkPulseRing) {
                pulseRing = new LinkPulseRing(this.scene);
                group.add(pulseRing.getMesh());
                // Pridať trail meshy do group po pulseRing.getMesh()
                if (pulseRing.getTrailMeshes) {
                    const trailMeshes = pulseRing.getTrailMeshes();
                    if (Array.isArray(trailMeshes)) {
                        trailMeshes.forEach(mesh => group.add(mesh));
                    }
                }
                if (LinkPulseDustEmitter) {
                    pulseDust = new LinkPulseDustEmitter(160);
                    this.conduitRoot.add(pulseDust.getObject3D());
                }
            }
        } catch (e) { throw e; }

        // 6. Energy Wave System (Mandatory)
        let energyWave = null;
        try {
            if (LinkEnergyWave) {
                energyWave = new LinkEnergyWave();
            }
        } catch (e) { throw e; }

        // 7. Arc Discharge System (Ring Enhancement)
        let arcDischarges = null;
        try {
            if (LinkRingArcDischarges) {
                arcDischarges = new LinkRingArcDischarges(this.scene);
                group.add(arcDischarges.getGroup());
            }
        } catch (e) { throw e; }

        // 8. Visual State Adapter (Harmony/Corruption Bridge)
        let visualStateAdapter = null;
        try {
            if (LinkVisualStateAdapter) {
                visualStateAdapter = new LinkVisualStateAdapter();
            }
        } catch (e) { throw e; }

        // 9. Directional Energy Streaks (Adapter-only flow visualization)
        let directionalStreaks = null;
        try {
            if (LinkDirectionalStreaks && this.directionalStreaks) {
                directionalStreaks = this.directionalStreaks;
                // Initialize streaks with deterministic randomization based on link ID
                const linkIdHash = (link.id || link.uuid || `link-unknown`)
                    .split('')
                    .reduce((h, c) => h * 31 + c.charCodeAt(0), 0);

                // Get harmonic hub controller if this link is connected to a hub
                const sourceController = this.nodeHarmonicManager?.nodeControllers.get(link.source);
                const hubController = sourceController?.isActive ? sourceController : null;

                directionalStreaks.initialize(group, linkIdHash, link, link.source, link.target, hubController);
                conduitState.__streaksInit = true;

                // ALWAYS log initialization (for debugging visibility issues)
                if (typeof window !== 'undefined') {
                    console.log('[DirectionalStreaks] INITIALIZED for link:', link.id, 'hash:', linkIdHash);
                }
            } else {
                if (typeof window !== 'undefined') {
                    console.warn('[DirectionalStreaks] NOT INITIALIZED - missing LinkDirectionalStreaks or this.directionalStreaks');
                }
            }
        } catch (e) {
            console.error('[DirectionalStreaks] INITIALIZATION FAILED:', e);
            debugWarn(window.ATOMA_DEBUG_LINK, 'LinkRenderer: Failed to init directional streaks', e);
        }

        // Store unified state
        Object.assign(conduitState, {
            strands: strands,
            strandCount: strandCount, // Store for update loop
            skinMesh: skinMesh,
            beads: beadVisualizer,
            sparks: sparkSystem,
            trails: trailSystem,
            rings: ringSystem,
            pulseRing: pulseRing,
            pulseDust: pulseDust,
            energyWave: energyWave,
            arcDischarges: arcDischarges,
            visualStateAdapter: visualStateAdapter,
            directionalStreaks: conduitState.directionalStreaks || null, // Per-link streak state
            directionalStreaksManager: directionalStreaks, // Manager reference
            phaseOffset: Math.random() * Math.PI * 2,
            baseColor: baseColor,
            impacts: []
        });

        // Initialize corruption animation state for this link
        if (this.corruptionAnimator && link.id) {
            this.corruptionAnimator.initializeLink(link);
        }

        // Initialize trail particle emitter for this link
        if (this.trailParticles && link.id) {
            const emitter = new LinkTrailEmitter(link, this.trailParticles);
            this.trailEmitters.set(link.id, emitter);
        }

        // Initialize healing particle emitter for this link
        if (this.healingParticles && link.id) {
            const emitter = new LinkHealingEmitter(link, this.healingParticles);
            this.healingEmitters.set(link.id, emitter);
        }

        return group;
    }

    /**
     * Update the geometry and materials of the link
     */
    update(link, deltaTime, time, frameStateOverride = null) {
        if (!link.group || !link.group.userData.conduitState) return;

        // Canonical RAF time source (behavior-preserving Phase 2A)
        const visualTime = frameStateOverride?.time?.visualTime ?? VisualTime.now;
        const visualDelta = frameStateOverride?.time?.visualDelta ?? VisualTime.delta;
        const metrics = frameStateOverride?.metrics ?? this._readLinkMetrics(link);
        const frameState = frameStateOverride || {
            time: { visualTime, visualDelta, deltaTime, time },
            metrics
        };

        const state = link.group.userData.conduitState;
        if (!state) {
            // If conduit state missing, rebuild visuals inline
            const rebuilt = this.createLinkVisuals(link);
            link.group = rebuilt;
            if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
                console.warn('[ConduitUpdate] Missing conduitState; rebuilt visuals for', link.id);
            }
            return;
        }

        // --- LINK ANCHORING FIX ---
        // Compute anchored start/end points at node surfaces (not centers)
        const sourceCenter = link.source.position.clone();
        const targetCenter = link.target.position.clone();

        // Direction from source → target
        const linkVec = new THREE.Vector3().subVectors(targetCenter, sourceCenter);
        const linkDist = linkVec.length();
        const linkDir = linkDist > 0.0001 ? linkVec.clone().normalize() : new THREE.Vector3(1, 0, 0);

        // Surface radii (prefer cached boundingSphere)
        const sourceRadius =
          link.source.userData?.boundingSphere?.radius ??
          link.source.geometry?.boundingSphere?.radius ??
          1.0;
        const targetRadius =
          link.target.userData?.boundingSphere?.radius ??
          link.target.geometry?.boundingSphere?.radius ??
          1.0;

        // Dock start/end on node surfaces with scaled radii (bounding spheres are often larger than visible mesh)
        const RADIUS_SCALE = 0.26;
        const start = sourceCenter.clone().addScaledVector(linkDir, sourceRadius * RADIUS_SCALE);
        const end = targetCenter.clone().addScaledVector(linkDir, -targetRadius * RADIUS_SCALE);

        frameState.geometry = { start: start.clone(), end: end.clone(), linkDir: linkDir.clone(), linkDist };

         // --- Dock ring pulse (visual cue when link reaches node surface) ---
        const dockPos = end.clone();
        const distToTarget = dockPos.distanceTo(targetCenter);
        const dockThreshold = targetRadius * 1.1;

        if (distToTarget < dockThreshold) {
            const surfaceDir = end.clone().sub(targetCenter).normalize();
            const dockOffset = targetCenter.clone().addScaledVector(
                surfaceDir,
                targetRadius * 0.35
            );
            if (!state.dockRing) {
                const sourceColor = new THREE.Color(state.baseColor || 0xffffff);
                const targetColor = new THREE.Color(this.getCategoryColor(link.target.userData?.category));
                const ringColor = sourceColor.lerp(targetColor, 0.5);
                const ring = new THREE.Group();
                ring.position.copy(dockOffset);
                const forward = new THREE.Vector3(0, 0, 1);
                const dir = linkDir.clone().normalize();
                if (dir.lengthSq() === 0) dir.set(0, 0, 1);
                ring.quaternion.setFromUnitVectors(forward, dir);
               // ring.scale.setScalar(0.8);
                const linkThickness = Math.max(
                    link.userData?.visualThickness ??
                    frameState?.linkThickness ??
                    0.12,
                    0.02
                );
                const baseRadius = THREE.MathUtils.clamp(linkThickness * 6.0, 0.25, 1.2) * 0.5;
                const radiusStep = baseRadius * 0.25;
                const layerRadii = [
                    baseRadius + radiusStep * 2,
                    baseRadius + radiusStep,
                    baseRadius * 0.7
                ];
                const layerSpeed = [0.20, -0.30, 0.45];
                const layerOpacity = [0.14, 0.17, 0.2];
                const baseTubeRadius = Math.max(linkThickness * 0.28, 0.028);
                const layerGroups = [];

                for (let layerIndex = 0; layerIndex < layerRadii.length; layerIndex++) {
                    const layerGroup = new THREE.Group();
                    const layerRadius = layerRadii[layerIndex];
                    const segmentCount = 7;
                    const shellSpacing = linkThickness * 1.2;
                    layerGroup.position.set(
                        0,
                        0,
                        (layerRadii.length - 1 - layerIndex) * shellSpacing
                    );
                    layerGroup.userData.baseZ = (layerRadii.length - 1 - layerIndex) * shellSpacing;
                    layerGroup.rotation.z = layerIndex * 0.08;
                    const mat = new THREE.MeshBasicMaterial({
                        color: ringColor,
                        transparent: true,
                        opacity: layerOpacity[layerIndex] ?? 0.5,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                        side: THREE.DoubleSide
                    });
                    layerGroup.userData.baseOpacity = layerOpacity[layerIndex] ?? 0.5;
                    const shellTilt = 0.16 + layerIndex * 0.06;
                    const shellLift = baseTubeRadius * (0.7 + layerIndex * 0.2);

                    for (let i = 0; i < segmentCount; i++) {
                        const startAngle = (i / segmentCount) * Math.PI * 2;
                        const arcLength = (Math.PI * 2) / segmentCount * 0.75;
                        const geo = new THREE.TorusGeometry(
                            layerRadius,
                            baseTubeRadius,
                            8,
                            24,
                            arcLength
                        );
                        const segmentPivot = new THREE.Group();
                        segmentPivot.rotation.z = startAngle;
                        const mesh = new THREE.Mesh(geo, mat);
                        mesh.position.y = shellLift;
                        mesh.rotation.x = shellTilt;
                        mesh.scale.set(1.6, 1.6, 0.35);
                        segmentPivot.add(mesh);
                        layerGroup.add(segmentPivot);
                    }

                    const trailMat = new THREE.MeshBasicMaterial({
                        color: ringColor,
                        transparent: true,
                        opacity: (layerOpacity[layerIndex] ?? 0.5) * 0.32,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                        side: THREE.DoubleSide
                    });
                    const trailGeo = new THREE.TorusGeometry(
                        layerRadius * (1.0 + layerIndex * 0.015),
                        baseTubeRadius * 0.42,
                        6,
                        20,
                        Math.PI * 0.68
                    );
                    for (let i = 0; i < 3; i++) {
                        const trailPivot = new THREE.Group();
                        trailPivot.rotation.z = (i / 3) * Math.PI * 2 + layerIndex * 0.18;
                        const trail = new THREE.Mesh(trailGeo, trailMat);
                        trail.position.y = shellLift * 0.72;
                        trail.rotation.x = shellTilt * 0.85;
                        trail.scale.set(1.35, 1.35, 0.45);
                        trail.userData.isDockTrailPath = true;
                        trailPivot.add(trail);
                        layerGroup.add(trailPivot);
                    }

                    ring.add(layerGroup);
                    layerGroups.push(layerGroup);
                }

                ring.userData.layerGroups = layerGroups;
                ring.userData.layerSpeed = layerSpeed;
                ring.userData.sprayInterval = 0.12;
                ring.userData.nextSprayTime = visualTime;
                ring.userData.sprayPayload = {
                    origin: dockPos.clone().lerp(dockOffset, 0.24),
                    direction: surfaceDir.clone().negate(),
                    color: ringColor.clone()
                };
                this.scene?.add(ring);
                state.dockRing = ring;
                state.dockRingColor = ringColor.clone();
                state.dockRingRadii = layerRadii.slice();
                state.dockRingSpeeds = layerSpeed.slice();
                state.dockRingThickness = linkThickness;
                state.dockGhostPending = {
                    time: visualTime + 0.08,
                    color: ringColor.clone(),
                    layerRadii: layerRadii.slice(),
                    layerSpeed: layerSpeed.map(s => s * 0.8),
                    thickness: linkThickness
                };

                // Spawn a light spray burst at dock point
                if (!state.dockSpray) {
                    const sprayOrder = VisualHierarchyRegistry.getRenderOrder('LINK_IMPACTS');
                    state.dockSpray = createDockSpraySystem(this.scene, sprayOrder, 48);
                    this.scene?.add(state.dockSpray.mesh);
                }
            }
        }

        // Spawn ghost ring when pending
        if (state.dockGhostPending && visualTime >= state.dockGhostPending.time && !state.dockGhost) {
            const pg = state.dockGhostPending;
            const ringColor = pg.color.clone();
            const ring = new THREE.Group();
            ring.position.copy(dockPos);
            const forward = new THREE.Vector3(0, 0, 1);
            const dir = linkDir.clone().normalize();
            if (dir.lengthSq() === 0) dir.set(0, 0, 1);
            ring.quaternion.setFromUnitVectors(forward, dir);
            const layerGroups = [];
            const layerOpacity = [0.05, 0.07, 0.09];
            const baseTubeRadius = Math.max(pg.thickness * 0.28, 0.024);
            for (let layerIndex = 0; layerIndex < pg.layerRadii.length; layerIndex++) {
                const layerGroup = new THREE.Group();
                const layerRadius = pg.layerRadii[layerIndex] * 1.15;
                const segmentCount = 7;
                const shellSpacing = pg.thickness * 1.2;
                layerGroup.position.set(
                    0,
                    0,
                    (pg.layerRadii.length - 1 - layerIndex) * shellSpacing
                );
                layerGroup.userData.baseZ = (pg.layerRadii.length - 1 - layerIndex) * shellSpacing;
                layerGroup.rotation.z = layerIndex * 0.08;
                const mat = new THREE.MeshBasicMaterial({
                    color: ringColor,
                    transparent: true,
                    opacity: layerOpacity[layerIndex] ?? (0.5 * 0.35),
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });
                layerGroup.userData.baseOpacity = layerOpacity[layerIndex] ?? (0.5 * 0.35);
                const shellTilt = 0.16 + layerIndex * 0.06;
                const shellLift = baseTubeRadius * (0.65 + layerIndex * 0.18);

                for (let i = 0; i < segmentCount; i++) {
                    const startAngle = (i / segmentCount) * Math.PI * 2;
                    const arcLength = (Math.PI * 2) / segmentCount * 0.75;
                    const geo = new THREE.TorusGeometry(
                        layerRadius,
                        baseTubeRadius,
                        8,
                        24,
                        arcLength
                    );
                    const segmentPivot = new THREE.Group();
                    segmentPivot.rotation.z = startAngle;
                    const mesh = new THREE.Mesh(geo, mat);
                    mesh.position.y = shellLift;
                    mesh.rotation.x = shellTilt;
                    mesh.scale.set(1.35, 1.35, 0.45);
                    segmentPivot.add(mesh);
                    layerGroup.add(segmentPivot);
                }

                const trailMat = new THREE.MeshBasicMaterial({
                    color: ringColor,
                    transparent: true,
                    opacity: (layerOpacity[layerIndex] ?? 0.12) * 0.22,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });
                const trailGeo = new THREE.TorusGeometry(
                    layerRadius * 1.02,
                    baseTubeRadius * 0.36,
                    6,
                    16,
                    Math.PI * 0.58
                );
                for (let i = 0; i < 2; i++) {
                    const trailPivot = new THREE.Group();
                    trailPivot.rotation.z = (i * Math.PI) + layerIndex * 0.24;
                    const trail = new THREE.Mesh(trailGeo, trailMat);
                    trail.position.y = shellLift * 0.72;
                    trail.rotation.x = shellTilt * 0.85;
                    trail.scale.set(1.35, 1.35, 0.45);
                    trail.userData.isDockTrailPath = true;
                    trailPivot.add(trail);
                    layerGroup.add(trailPivot);
                }

                ring.add(layerGroup);
                layerGroups.push(layerGroup);
            }
            ring.userData.layerGroups = layerGroups;
            ring.userData.layerSpeed = pg.layerSpeed;
            this.scene?.add(ring);
            state.dockGhost = ring;
            state.dockGhostPending = null;
        }

        const updateDockRing = (ring) => {
            if (!ring) return false;
            if (ring.userData.layerGroups && ring.userData.layerSpeed) {
                for (let i = 0; i < ring.userData.layerGroups.length; i++) {
                    const layerGroup = ring.userData.layerGroups[i];
                    const speed = ring.userData.layerSpeed[i] || 0;
                    const baseZ = layerGroup.userData?.baseZ ?? 0;
                    layerGroup.rotation.z += speed * visualDelta;
                    layerGroup.position.set(0, 0, baseZ);
                }
            }
            return false;
        };

        const cleanupRing = (ringRefName) => {
            const ring = state[ringRefName];
            if (!ring) return;
            this.scene?.remove(ring);
            const geometrySet = new Set();
            const materialSet = new Set();
            ring.traverse((obj) => {
                if (obj?.geometry) geometrySet.add(obj.geometry);
                if (obj?.material) materialSet.add(obj.material);
            });
            geometrySet.forEach((geo) => geo?.dispose?.());
            materialSet.forEach((material) => material?.dispose?.());
            state[ringRefName] = null;
        };

        if (distToTarget >= dockThreshold) {
            cleanupRing('dockRing');
            cleanupRing('dockGhost');
            state.dockGhostPending = null;
            if (state.dockSpray) {
                state.dockSpray.dispose();
                state.dockSpray = null;
            }
        }

        if (state.dockRing) {
            updateDockRing(state.dockRing);
            if (state.dockSpray) {
                state.dockSpray.update(visualTime);
                const sprayInterval = state.dockRing.userData.sprayInterval ?? 0.12;
                const nextSprayTime = state.dockRing.userData.nextSprayTime ?? visualTime;
                if (visualTime >= nextSprayTime) {
                    const payload = state.dockRing.userData.sprayPayload;
                    if (payload) {
                        state.dockSpray.spawnBurst(payload.origin, payload.direction, payload.color, visualTime);
                    }
                    state.dockRing.userData.nextSprayTime = visualTime + sprayInterval;
                }
            }
        }

        if (state.dockGhost) {
            updateDockRing(state.dockGhost);
        }
        // --- 1. Curve Calculation ---
        const dist = start.distanceTo(end);

        // Slight arc for rope slack effect
        const arcHeight = Math.min(1.5, dist * 0.1);
        const mid = this._vec3.lerpVectors(start, end, 0.5); // Use cache
        mid.y += arcHeight;

        // Reusing curve object would be ideal but QuadraticBezierCurve3 is light
        const mainCurve = new THREE.QuadraticBezierCurve3(start.clone(), mid.clone(), end.clone());

        link.curve = mainCurve;
        frameState.geometry.curve = mainCurve;

        // Store link direction for aura modulation later
        const linkUD = ensureUserData(link);
        linkUD.linkDirection = linkDir.clone();

        const segments = computeSegmentsFromLength(mainCurve);
        const frames = mainCurve.computeFrenetFrames(segments, false);
        frameState.geometry.frames = frames;

        // --- 2. Dynamic Parameters ---
        const synergy = metrics.synergy;
        const trafficLoad = metrics.loadPressure ?? metrics.traffic ?? 0;

        // Collect per-link material patches to apply once per frame (last-wins per property)
        const materialPatches = {
            skin: {},
            strands: new Map() // mesh -> patch
        };

        // Compute normalized VFX inputs (always on; no gating)
        const vfx = this.computeLinkVfxInput(frameState);

        const breathing = Math.sin(visualTime * this.config.breathingSpeed + state.phaseOffset) * 0.05 + 1.0;
        const twistPhase = visualTime * this.config.twistSpeed;

        const activeRadius = this.config.baseRadius * breathing * (1.0 - synergy * 0.2 + trafficLoad * 0.2) * vfx.widthMul;

        // Cache geometry params for downstream systems (directional streaks)
        state.linkLength = linkDist || 10.0;
        state.linkTwists = state.linkLength / this.config.twistSpacing;
        state.twistPhase = twistPhase;
        state.strandSegments = segments;
        state.activeRadius = activeRadius;
        linkUD.visualEnvelopeRadius = activeRadius;

        // --- 3. Strand Update (The Braid) ---
        // Optimization: Pre-calculate loop invariants
        const flowSpeed = (0.2 + (synergy * 1.2)) * vfx.speedMul;
        const noiseBase = 0.005 * (1.0 - synergy);

        state.strands.forEach((mesh, i) => {
            if (isCoreNodeMesh(mesh)) {
                // Phase LRC-SAFE-CORE
                // Do NOT modify core node material
                return;
            }
            // Shader uniforms (simple link state shader)
            const mat = mesh.material;
            if (mat?.uniforms) {
                mat.uniforms.uTime.value = visualTime;
                mat.uniforms.uNetworkStress.value = metrics.loadPressure ?? 0;
                mat.uniforms.uLocalLoad.value = metrics.traffic ?? 0;
                mat.uniforms.uCorruption.value = metrics.corruption ?? 0;
            }
            // Flow texture
            if (mesh.material && mesh.material.emissiveMap) {
                mesh.material.emissiveMap.offset.x -= flowSpeed * visualDelta * 0.5;
                const pulse = Math.sin(visualTime * 2.0 + i) * 0.2 + 0.8;
                const emissiveIntensity = 0.5 * pulse * (1 + trafficLoad) * (0.6 + vfx.baseIntensity);
                mergePatch(materialPatches.strands, mesh, { opacity: mesh.material.opacity, emissiveIntensity, owner: 'opacityStage' });
            }

            // Generate helical path
            const points = [];
            const angleOffset = (i / state.strandCount) * Math.PI * 2;

            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const pointOnMain = mainCurve.getPointAt(t);
                const N = frames.normals[j];
                const B = frames.binormals[j];

                // Calculate normalized twists based on link length
                const linkLength = linkDist || 10.0;
                const twists = linkLength / this.config.twistSpacing;
                const currentTwist = t * Math.PI * 2 * twists + twistPhase;
                const angle = angleOffset + currentTwist;
  // +++++++ REPLACE

                const flare = 1.0 + Math.pow(2.0 * (t - 0.5), 2) * 0.2;
                const noise = Math.sin(t * 40 + i * 10) * noiseBase;
                let r = (activeRadius * flare) + noise;

                // Gentle taper near docking end
                const taperStart = 0.95;
                if (t > taperStart) {
                    const fade = (t - taperStart) / (1 - taperStart);
                    r *= (1.0 - fade * 0.6);
                }

                const offsetX = Math.cos(angle) * r;
                const offsetY = Math.sin(angle) * r;

                const pos = pointOnMain.clone(); // Clone to avoid mutation issues in curve gen
                pos.addScaledVector(N, offsetX);
                pos.addScaledVector(B, offsetY);
                points.push(pos);
            }

            // Dispose & Recreate Geometry
            // Note: Efficient buffer updates for TubeGeometry are complex.
            // We accept reallocation to ensure visual correctness of the braid.
            if (mesh.geometry) mesh.geometry.dispose();
            mesh.geometry = new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3(points),
                segments,
                this.config.strandRadius,
                this.config.radialSegments,
                false
            );
            if (state.strandOverlays && state.strandOverlays[i]) {
                state.strandOverlays[i].geometry = mesh.geometry;
            }

            // Color/tint patch (synergy-based)
            if (mesh.material?.color) {
                const colorPatch = new THREE.Color(state.baseColor).lerp(new THREE.Color(state.targetColor || state.baseColor), 0.0);
                mergePatch(materialPatches.strands, mesh, { color: colorPatch, owner: 'colorStage' });
            }
            // Linewidth (if supported by material type)
            if (mesh.material && mesh.material.linewidth !== undefined) {
                mergePatch(materialPatches.strands, mesh, { linewidth: mesh.material.linewidth, owner: 'thicknessStage' });
            }
        });

        // --- 4. Aura Skin Update (Unified Shader Material) ---
        if (state.skinMesh && this.modules.aura) {
             if (isCoreNodeMesh(state.skinMesh)) {
                 // Phase LRC-SAFE-CORE
                 // Do NOT modify core node material
                 return;
             }
             const skin = state.skinMesh;
             if (skin.geometry) skin.geometry.dispose();
             skin.geometry = new THREE.TubeGeometry(
                 mainCurve,
                 segments,
                 activeRadius * this.config.skinRadiusScale,
                 8,
                 false
             );

             // Update shader material uniforms for node state
             if (skin.material && skin.material.uniforms) {
        const material = skin.material;

                 // Time-sync with node aura
                 material.uniforms.uTime.value = visualTime;

                 // Link direction for directional noise bias
                 if (linkDir) {
                     material.uniforms.uLinkDirection.value = linkDir.clone();
                 }

                 // Harmony/corruption influence (from link or global state)
                const linkHarmony = metrics.harmony ?? 0.5;
                const linkCorruption = metrics.corruption ?? 0.2;
                material.uniforms.uHarmony.value = linkHarmony;
                material.uniforms.uCorruption.value = linkCorruption;

                 // Desaturation (if link is corrupted)
                 const desaturation = Math.min(1.0, linkCorruption * 1.2);
                 material.uniforms.uDesaturation.value = desaturation;

                 // Link birth/removal effects (synced with node aura)
                 // Birth: ramp up to 1.0, then decay over ~400ms
                 if (link.justLinked) {
                     const currentBirth = material.uniforms.uLinkBirthIntensity.value || 0.0;
                     const targetBirth = Math.min(1.0, currentBirth + visualDelta * 4.0); // Ramp up
                     material.uniforms.uLinkBirthIntensity.value = targetBirth;
                 } else {
                     // Decay when flag is cleared
                     const currentBirth = material.uniforms.uLinkBirthIntensity.value || 0.0;
                     material.uniforms.uLinkBirthIntensity.value = Math.max(0.0, currentBirth - visualDelta * 3.0);
                 }

                 // Removal: similar to birth but opposite effect
                 if (link.justUnlinked) {
                     const currentRemoval = material.uniforms.uLinkRemovalIntensity.value || 0.0;
                     const targetRemoval = Math.min(1.0, currentRemoval + visualDelta * 4.0); // Ramp up
                     material.uniforms.uLinkRemovalIntensity.value = targetRemoval;
                 } else {
                     // Decay when flag is cleared
                     const currentRemoval = material.uniforms.uLinkRemovalIntensity.value || 0.0;
                     material.uniforms.uLinkRemovalIntensity.value = Math.max(0.0, currentRemoval - visualDelta * 3.0);
                 }

                // Stage opacity patch (deterministic write once)
                materialPatches.skin.opacity = material.opacity;
                materialPatches.skin.owner = 'opacityStage';
            }
       }

        // --- 4.5. CORRUPTION SPREAD ANIMATION ---
        // Animate color shift from source to target as corruption spreads
        if (this.corruptionAnimator && state.strands && this.modules.corruptionFX) {
            this.corruptionAnimator.update(link, visualDelta, state.strands);
        }

        // --- 4.6. CORRUPTION PARTICLE EFFECTS ---
        // Emit particles that flow along link from source to target
        if (this.corruptionParticles && this.modules.corruptionFX) {
            this.corruptionParticles.updateLinkParticles(link, visualDelta);
        }

        // --- 4.7. TRAIL PARTICLE EFFECTS ---
        // Emit organic trail particles using same noise as aura systems
        if (this.trailParticles && this.trailEmitters && link.id && this.modules.trails) {
            const emitter = this.trailEmitters.get(link.id);
            if (emitter) {
                const linkHarmony = metrics.harmony ?? 0.5;
                const linkCorruption = metrics.corruption ?? 0.2;

                emitter.update(
                    visualDelta,
                    visualTime,
                    mainCurve,
                    linkDir,
                    linkHarmony,
                    linkCorruption
                );
            }
        }

        // --- 4.8. HEALING PARTICLE EFFECTS ---
        // Emit healing particles flowing backwards (target → source) when harmony is high
        if (this.healingParticles && this.healingEmitters && link.id && this.modules.healingFX) {
            const emitter = this.healingEmitters.get(link.id);
            if (emitter) {
                const linkHarmony = metrics.harmony ?? 0.5;
                const linkCorruption = metrics.corruption ?? 0.2;

                emitter.update(
                    visualDelta,
                    visualTime,
                    mainCurve,
                    linkDir,
                    linkHarmony,
                    linkCorruption
                );
            }
        }

        // --- 5. Subsystems Update ---
        this._beadsUpdateCalls = (this._beadsUpdateCalls || 0) + (state.beads ? 1 : 0);
        if (state.beads && this.modules.beads) {
            // Re-assert render state to bypass global depth clamps
            if (state.beads.forceRenderState) {
                state.beads.forceRenderState();
            }
            if (state.beads.setIntensity) {
                state.beads.setIntensity(vfx.beadsIntensity);
            }
            this._beadsUpdateCalls = (this._beadsUpdateCalls || 0) + 1;
            state.beads.update(visualDelta, (bead) => {
                this.triggerNodeImpact(state, link.target, bead);
                if (bead.size === 'large' && state.rings) {
                    const targetColor = this.getCategoryColor(link.target.userData?.category);
                    state.rings.emitRing(link.target.position, new THREE.Color(targetColor), visualTime);
                }
            });
            if (state.trails) state.trails.update(visualTime, visualDelta, state.beads.beadToMesh);
        }

        if (state.rings) state.rings.update(visualTime);

        if (state.sparks && this.modules.sparks) {
            const baseCol = (state.strands[0]?.material?.color) || state.baseColor || 0xffffff;
            const currentColor = baseCol.isColor ? baseCol : new THREE.Color(baseCol);
            this._sparksUpdateCalls = (this._sparksUpdateCalls || 0) + 1;

            // [DEBUG] Log sparks update for visibility debugging
            if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
                console.log('[LinkRendererConduit] Sparks update:', {
                    linkId: link.id,
                    sparksIntensity: vfx.sparksIntensity,
                    synergy,
                    trafficLoad
                });
            }

            state.sparks.update(visualTime, visualDelta, mainCurve, { synergy, traffic: trafficLoad, intensity: vfx.sparksIntensity }, currentColor);
            state.sparks.uniforms.uThickness.value = activeRadius * 2 * vfx.widthMul;
        }

// Update LinkTrailEmitter (if available)
if (state.trails && state.beads && state.beads.beadToMesh) {
    state.trails.update(visualTime, visualDelta, state.beads.beadToMesh);
    console.log('[LinkRendererConduit] state.trails.update called for link:', link.id);
} else if (state.trails) {
    console.warn('[LinkRendererConduit] state.trails.update SKIPPED - beadToMesh missing for link:', link.id);
}

        if (state.pulseRing && this.modules.flow) {
            const targetCat = link.target.userData?.category || 'input';
            const targetColor = new THREE.Color(this.getCategoryColor(targetCat));
            const sourceColor = new THREE.Color(state.baseColor);

            state.pulseRing.update(
                mainCurve,
                synergy,
                trafficLoad,
                visualDelta,
                sourceColor,
                targetColor
            );

            if (state.pulseDust) {
                state.pulseRing.mesh.getWorldPosition(this._pulseDustWorldPos);
                state.pulseDust.update({
                    position: this._pulseDustWorldPos,
                    tangent: state.pulseRing.currentTangent,
                    ringScale: state.pulseRing.mesh.scale.x,
                    splitGap: state.pulseRing.currentSplitGap,
                    pulsePhase: state.pulseRing.currentPulsePhase,
                    spinAngle: state.pulseRing.currentSpinAngle,
                    progress: state.pulseRing.progress,
                    dt: visualDelta,
                    sourceColor,
                    targetColor
                });
            }
        }

        // --- 6. Energy Wave Update (Unified Wave Through Strands) ---
        if (state.energyWave && this.modules.flow) {
            // Pass base emissive intensity from strand material
            const baseEmissiveIntensity = state.strands[0]?.material?.emissiveIntensity || 1.2;
            state.energyWave.update(
                state.strands,
                visualDelta,
                synergy,
                trafficLoad,
                baseEmissiveIntensity
            );
        }

        // --- 7. Arc Discharge Update (Ring-triggered Electric Sparks) ---
        if (state.arcDischarges && state.pulseRing && this.modules.flow) {
                const targetCat = link.target.userData?.category || 'input';
                const targetColor = new THREE.Color(this.getCategoryColor(targetCat));
                const ringColor = new THREE.Color(state.baseColor).lerp(targetColor, state.pulseRing.progress);

            // Ring scale from pulse ring oscillation
            const ringScale = state.pulseRing.mesh.scale.x;

            state.arcDischarges.update(
                mainCurve,
                state.pulseRing.progress,
                synergy,
                trafficLoad,
                visualDelta,
                ringColor,
                ringScale,
                frameState
            );
        }

        // --- 8. Visual State Adaptation (Harmony/Corruption/Instability/Synergy Bridge) ---
        if (state.visualStateAdapter) {
            // Extract harmony/corruption/instability/synergy from pre-read metrics
            const harmonyLevel = metrics.harmony;
            const corruptionLevel = metrics.corruption;
            const instability = metrics.instability;
            const synergyLevel = metrics.synergy;

            state.visualStateAdapter.update(
                link.group,
                harmonyLevel,
                corruptionLevel,
                instability,
                visualDelta,
                synergyLevel,
                frameState
            );
        }

        // Throttled aggregate update-call metrics (1/sec) under audit flag
        if (typeof window !== 'undefined' && window.__DEBUG_LINK_CURVE_AUDIT__ === true) {
            const now = Date.now();
            if (now - (this._conduitUpdateLastLog || 0) >= 1000) {
                const beadsCalls = this._beadsUpdateCalls || 0;
                const sparksCalls = this._sparksUpdateCalls || 0;
                console.log(`[ConduitUpdate] beadsCalls=${beadsCalls} sparksCalls=${sparksCalls}`);
                this._beadsUpdateCalls = 0;
                this._sparksUpdateCalls = 0;
                this._conduitUpdateLastLog = now;
            }
        }

        // --- 9. Directional Energy Streaks (Synergy-driven flow visualization) ---
        if (state.directionalStreaks && this.directionalStreaks && this.modules.streaks) {
            const harmonyLevel = metrics.harmony;
            const corruptionLevel = metrics.corruption;
            const instability = metrics.instability;
            const synergyLevel = metrics.synergy;

            const sourceColor = new THREE.Color(state.baseColor);
            const targetCat = link.target.userData?.category || 'input';
            const targetColor = new THREE.Color(this.getCategoryColor(targetCat));

            try {
                this.directionalStreaks.update(
                    link.group,
                    mainCurve,
                    visualDelta, // Phase 2A: canonical VisualTime delta
                    synergyLevel,
                    harmonyLevel,
                    corruptionLevel,
                    instability,
                    sourceColor,
                    targetColor,
                    link,
                    visualTime,  // Time source: VisualTime (canonical)
                    frameState
                );
                if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
                    console.debug('[StreaksTick]', link.id, 'synergy:', synergyLevel, 'harmony:', harmonyLevel, 'corruption:', corruptionLevel, 'instability:', instability);
                }
            } catch (err) {
                if (typeof window !== 'undefined') {
                    console.error('[DirectionalStreaks][EXCEPTION]', err);
                }
            }
        } else {
            if (typeof window !== 'undefined') {
                console.warn('[DirectionalStreaks] NOT UPDATING - state:', !!state.directionalStreaks, 'manager:', !!this.directionalStreaks, 'link:', link.id);
            }
        }

        // Debug hook: log one sample link per second when enabled
        if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
            if (!this._lastVfxDebugTime || (visualTime - this._lastVfxDebugTime) > 1.0) {
                const beadStats = state.beads?.getStats ? state.beads.getStats() : null;
                const sparkStats = state.sparks?.getDebugStats ? state.sparks.getDebugStats() : null;
                console.log('[LinkParticles]', {
                    linkId: link.id || link.uuid,
                    beadsIntensity: vfx.beadsIntensity,
                    sparksIntensity: vfx.sparksIntensity,
                    beadsActive: beadStats?.active,
                    beadsActivity: beadStats?.activity,
                    sparksSpawned: sparkStats?.spawned
                });
                this._lastVfxDebugTime = visualTime;
            }
        }

        this.updateImpacts(state, visualDelta);

        // Update dissolve particles (if any)
        this.updateDissolves(visualDelta);

        // Apply accumulated material patches deterministically (once per frame)
        if (state.skinMesh?.material) {
            applyMaterialPatch(state.skinMesh.material, materialPatches.skin);
        }
        for (const [strandMesh, patch] of materialPatches.strands.entries()) {
            applyMaterialPatch(strandMesh.material, patch);
        }
    }

    /**
     * Compute normalized VFX inputs with baseline minimums (no gating)
     */
    computeLinkVfxInput(frameState) {
        const metrics = frameState?.metrics || {};
        const synergy = metrics.synergy ?? 0.5;
        const harmony = metrics.harmony ?? 0.5;
        const corruption = metrics.corruption ?? 0.0;
        const load = metrics.loadPressure ?? metrics.traffic ?? 0.0;

        const out = this._vfxInput;
        // Raise baselines so VFX stay visible even at low activity
        out.baseIntensity = Math.max(0.25,
            0.35 * synergy +
            0.25 * harmony +
            0.15 * (1 - corruption) +
            0.15 * load);

        out.beadsIntensity = Math.max(0.20,
            0.5 * synergy +
            0.2 * harmony +
            0.2 * load +
            0.1 * corruption);

        const corrLoad = Math.max(corruption, load);
        out.sparksIntensity = Math.max(0.3,
            0.4 * corrLoad +
            0.2 * (synergy || 0.15)); // [FIX] Minimum 0.15 synergy for new links to show sparks

        out.widthMul = remap(out.baseIntensity, 0.15, 1.0, 0.9, 1.3);
        out.speedMul = remap(out.baseIntensity, 0.15, 1.0, 0.8, 1.4);
        out.colorBias = clamp01(corruption * 0.8);

        return out;
    }

    /**
     * Spawn dissolve particle burst on link removal.
     */
    _spawnDissolveEffect(link, state) {
        const curve = link.curve;
        if (!curve || !this.scene) return;

        const pointCount = 48;
        const positions = new Float32Array(pointCount * 3);
        const velocities = new Float32Array(pointCount * 3);
        for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const p = curve.getPoint(t);
            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;
            // Velocity: along tangent + random spread
            const dir = curve.getTangent(t);
            dir.normalize().multiplyScalar(0.6);
            dir.x += (Math.random() - 0.5) * 0.6;
            dir.y += (Math.random() - 0.5) * 0.6;
            dir.z += (Math.random() - 0.5) * 0.6;
            velocities[i * 3] = dir.x;
            velocities[i * 3 + 1] = dir.y;
            velocities[i * 3 + 2] = dir.z;
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const color = new THREE.Color(state?.baseColor || 0x00ffcc);
        const mat = new THREE.PointsMaterial({
            color,
            size: 0.05,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        const points = new THREE.Points(geom, mat);
        points.userData = {
            velocities,
            age: 0,
            maxAge: 0.6
        };

        this.conduitRoot.add(points);
        this._dissolveEffects.push(points);
    }

    /**
     * Update dissolve particle bursts.
     */
    updateDissolves(dt) {
        if (!this._dissolveEffects.length) return;
        const toRemove = [];
        for (const pts of this._dissolveEffects) {
            const ud = pts.userData || {};
            ud.age += dt;
            const positions = pts.geometry.attributes.position.array;
            const velocities = ud.velocities;
            const lifeT = Math.min(1, ud.age / ud.maxAge);
            const fade = 1 - lifeT;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * dt;
                positions[i + 1] += velocities[i + 1] * dt;
                positions[i + 2] += velocities[i + 2] * dt;
            }
            pts.geometry.attributes.position.needsUpdate = true;
            pts.material.opacity = 0.85 * fade;
            pts.material.size = 0.05 * (0.5 + fade);
            if (ud.age >= ud.maxAge) {
                toRemove.push(pts);
            }
        }
        for (const pts of toRemove) {
            this.scene.remove(pts);
            pts.geometry.dispose();
            pts.material.dispose();
        }
        this._dissolveEffects = this._dissolveEffects.filter(p => !toRemove.includes(p));
    }

    /**
     * Read link metrics once per frame into a canonical structure.
     * Returns safe defaults if fields are missing.
     */
    _readLinkMetrics(link) {
        const traffic = link.traffic?.load ?? 0;
        const loadPressure = link.loadPressure ?? traffic ?? 0;
        return {
            synergy: link.synergyScore ?? link.synergy ?? link.synergyLevel ?? link.flow ?? 0.5,
            harmony: link.harmonyLevel ?? link.harmony ?? 1.0,
            corruption: link.corruptionLevel ?? link.corruption ?? 0.0,
            instability: link.instability ?? link.instabilityLevel ?? 0.0,
            traffic,
            loadPressure,
            quality: link.quality ?? link.userData?.quality?.score
        };
    }

    getCategoryColor(category) {
        const colors = {
            'input': 0x00ddff, 'process': 0xffaa00, 'integration': 0x00ff88,
            'analytics': 0xaa00ff, 'storage': 0x88ccff, 'control': 0xff0088,
            'quantum': 0x00ffff, 'sigma': 0x00ff00, 'emotional': 0xff8800
        };
        return colors[category] || 0xcccccc;
    }

    _getImpactMaterial(colorHex) {
        const key = colorHex >>> 0;
        const stack = this._impactMaterialPool.get(key);
        if (stack && stack.length > 0) {
            const mat = stack.pop();
            mat.opacity = 0.6; // reset to default
            return mat;
        }

        const mat = new THREE.MeshBasicMaterial({
            color: key,
            opacity: 0.6,
            wireframe: true,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide
        });
        ensureUserData(mat);
        mat.userData.__owner = 'LinkRenderer';
        mat.userData.__domain = 'link';
        freezeMaterialFlags(mat, 'LinkRenderer');
        return mat;
    }

    _returnImpactMaterial(mat) {
        if (!mat) return;
        const key = mat.color?.getHex ? mat.color.getHex() >>> 0 : 0;
        if (!this._impactMaterialPool.has(key)) {
            this._impactMaterialPool.set(key, []);
        }
        const stack = this._impactMaterialPool.get(key);
        if (stack.length < this._impactPoolMaxSize) {
            mat.opacity = 0.6;
            stack.push(mat);
        } else {
            mat.dispose();
        }
    }

    triggerNodeImpact(state, node, bead) {
        if (!node) return;
        const category = node.userData?.category || 'input';
        const color = this.getCategoryColor(category);
        const beadSize = bead?.size || 'medium';

        // Create impact geometry based on category
        const group = new THREE.Group();
        let geometry;

        switch (category) {
            case 'input': geometry = new THREE.TorusGeometry(0.5, 0.05, 8, 16); break;
            case 'process': geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); break;
            case 'control': geometry = new THREE.OctahedronGeometry(0.6, 0); break;
            default: geometry = new THREE.IcosahedronGeometry(0.6, 1);
        }

        // PHASE S-5: Variant properties set at creation time, then frozen
        // NO runtime mutations to transparent, depthWrite, depthTest, side, blending allowed
        const meshMaterial = this._getImpactMaterial(color);
        const mesh = new THREE.Mesh(geometry, meshMaterial);
        mesh.frustumCulled = false;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        const impactOrder = VisualHierarchyRegistry.getRenderOrder('LINK_IMPACTS');
        TransparentStateAuthority.apply(mesh, 'additive', { renderOrder: impactOrder });
        ensureUserData(mesh);
        mesh.userData.__depthAuthorityLocked = true;

        group.add(mesh);
        group.position.copy(node.position);

        const scaleMult = beadSize === 'large' ? 1.5 : (beadSize === 'small' ? 0.5 : 1.0);
        group.scale.setScalar(0.1); // Start small

        Object.assign(ensureUserData(group), { age: 0, duration: 0.5, maxScale: 2.0 * scaleMult, mesh: mesh });

        this.conduitRoot.add(group);
        state.impacts.push(group);
    }

    updateImpacts(state, dt) {
        if (!state.impacts) return;
        for (let i = state.impacts.length - 1; i >= 0; i--) {
            const grp = state.impacts[i];
            const data = grp.userData;
            data.age += dt;
            const p = data.age / data.duration;

            if (p >= 1) {
                if (grp.parent) grp.parent.remove(grp);
                grp.traverse(o => {
                    if(o.geometry) o.geometry.dispose();
                    if(o.material) this._returnImpactMaterial(o.material);
                });
                state.impacts.splice(i, 1);
            } else {
                const ease = 1 - Math.pow(1 - p, 3);
                grp.scale.setScalar(data.maxScale * ease);
                if (data.mesh) data.mesh.material.opacity = 0.6 * (1 - ease);
                grp.rotation.z += dt * 2;
                grp.rotation.y += dt;
            }
        }
    }

    disposeLinkVisuals(linkGroup, link = null) {
        if (!linkGroup || !linkGroup.userData.conduitState) return;
        const state = linkGroup.userData.conduitState;

        // Spawn dissolve burst before tearing down
        if (this.modules.dissolve && link && link.curve) {
            this._spawnDissolveEffect(link, state);
        }

        // Unregister from interference manager if link provided
        if (link && this.nodeInterferenceManager) {
            this.nodeInterferenceManager.unregisterLinkFromNodes(link, link.source, link.target);
        }

        // Dispose corruption animation state
        if (link && this.corruptionAnimator && link.id) {
            this.corruptionAnimator.disposeLinkAnimation(link.id);
        }

        // Clear corruption particles for this link
        if (link && this.corruptionParticles && link.id) {
            this.corruptionParticles.clearLinkParticles(link.id);
        }

        // Dispose trail particle emitter for this link
        if (link && this.trailEmitters && link.id) {
            const emitter = this.trailEmitters.get(link.id);
            if (emitter) {
                emitter.disable();
            }
            this.trailEmitters.delete(link.id);
        }
        // Clear trail particles still in the shared system
        if (link && this.trailParticles && link.id) {
            this.trailParticles.clearLink(link.id);
        }

        // Dispose healing particle emitter for this link
        if (link && this.healingEmitters && link.id) {
            const emitter = this.healingEmitters.get(link.id);
            if (emitter) {
                emitter.disable();
            }
            this.healingEmitters.delete(link.id);
        }

        state.strands.forEach(m => {
            if(m.geometry) m.geometry.dispose();
            if(m.material) m.material.dispose();
        });

        if (state.skinMesh) {
            if(state.skinMesh.geometry) state.skinMesh.geometry.dispose();
            if(state.skinMesh.material) state.skinMesh.material.dispose();
        }

        if (state.beads) state.beads.dispose();
        if (state.sparks) state.sparks.dispose();
        if (state.trails) state.trails.dispose();
        if (state.rings) state.rings.dispose();

        if (state.pulseRing) state.pulseRing.dispose();
        if (state.pulseDust) state.pulseDust.dispose();
        if (state.energyWave) state.energyWave = null;
        if (state.arcDischarges) state.arcDischarges.dispose();
        if (state.visualStateAdapter) state.visualStateAdapter.dispose();

        if (state.directionalStreaks && this.directionalStreaks) {
            this.directionalStreaks.dispose(state.directionalStreaks);
        }

        state.impacts.forEach(g => {
            if (g.parent) g.parent.remove(g);
            g.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material) this._returnImpactMaterial(o.material); });
        });
        state.impacts = [];

        // Final cleanup: remove the link group from scene graph and dispose remaining geometries/materials
        if (linkGroup?.parent) {
            linkGroup.parent.remove(linkGroup);
        }
        linkGroup.traverse(obj => {
            if (obj.geometry) { obj.geometry.dispose?.(); }
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
                else obj.material.dispose?.();
            }
        });
    }

    /**
     * Global pictogram tick (once per frame, outside per-link loop)
     */
    updatePictograms(deltaTime, time) {
        if (this.pictogramSystem?.enabled) {
            if (!this._picDiagTicked) {
                console.error('[PicDiag] updatePictograms entry');
                this._picDiagTicked = true;
            }
            try {
                this.pictogramSystem.update(deltaTime || 0.016, time || performance.now(), this.camera);
            } catch (err) {
                console.error('[PicDiag] pictogram update error', err);
            }
        }
    }

    /**
     * Dispose and cleanup the renderer
     */
    dispose() {
        if (this.nodeInterferenceManager) {
            this.nodeInterferenceManager.dispose();
        }
        if (this.nodeHarmonicManager) {
            this.nodeHarmonicManager.dispose();
        }
        if (this.corruptionAnimator) {
            this.corruptionAnimator.dispose();
        }
        if (this.corruptionParticles) {
            this.corruptionParticles.dispose();
        }
        if (this.trailParticles) {
            this.trailParticles.dispose();
        }
        if (this.trailEmitters) {
            this.trailEmitters.clear();
        }
        if (this.healingParticles) {
            this.healingParticles.dispose();
        }
        if (this.healingEmitters) {
            this.healingEmitters.clear();
        }
        if (this.flowTexture) {
            this.flowTexture.dispose();
        }
        if (this.pictogramSystem) {
            this.pictogramSystem.dispose?.();
        }
        if (this.conduitRoot?.parent) {
            this.conduitRoot.parent.remove(this.conduitRoot);
        }
    }
}
