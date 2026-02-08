import * as THREE from 'three';
import { debugWarn } from './Engine/Debug/DebugLog.js';
import { TransparentStateAuthority } from './TransparentStateAuthority.js';
import { LinkBeadVisualizer } from './LinkBeadSystem.js';
import { LinkSparkSystem } from './LinkSparkSystem.js';
import { LinkBeadTrailSystem } from './LinkBeadTrailSystem.js';
import { LinkEnergyRingSystem } from './LinkEnergyRingSystem.js';
import { LinkPulseRing } from './LinkPulseRing.js';
import { LinkEnergyWave } from './LinkEnergyWave.js';
import { LinkRingArcDischarges } from './LinkRingArcDischarges.js';
import { LinkVisualStateAdapter } from './LinkVisualStateAdapter.js';
import { NodeInterferenceManager } from './NodeInterferenceManager.js';
import { NodeHarmonicManager } from './NodeHarmonicManager.js';
import { LinkDirectionalStreaks } from './LinkDirectionalStreaks.js';
import { LinkCorruptionSpreadAnimator } from './LinkCorruptionSpreadAnimator.js';
import { LinkCorruptionParticleSystem } from './LinkCorruptionParticleSystem.js';
import { createLinkAuraMaterial, createLinkAuraGeometry } from './shaders/LinkAuraShader.js';
import { LinkTrailParticleSystem, LinkTrailEmitter } from './LinkTrailParticleSystem.js';
import { LinkHealingParticleSystem, LinkHealingEmitter } from './LinkHealingParticleSystem.js';
import { LinkExtensionConfig } from './LinkExtensionConfig.js';
import { ImpactManagerCollection } from './NodeImpactManager.js';
import VisualTime from './src/time/VisualTime.js';

const VARIANT_CRITICAL_PROPS = [
    'transparent',
    'side',
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
    if (!material.userData) material.userData = {};
    material.userData.__frozenVariantProps = material.userData.__frozenVariantProps || new Set();
    material.userData.__warnedVariantProp = material.userData.__warnedVariantProp || new Set();

    VARIANT_CRITICAL_PROPS.forEach((prop) => {
        if (material.userData.__frozenVariantProps.has(prop)) return;

        const desc = Object.getOwnPropertyDescriptor(material, prop);
        if (desc && desc.configurable === false) {
            if (variantDebugEnabled() && !material.userData.__warnedVariantProp.has(prop)) {
                debugWarn(true, '[VariantLock] Prop already locked, skip redefine', prop, material.uuid);
                material.userData.__warnedVariantProp.add(prop);
            }
            material.userData.__frozenVariantProps.add(prop);
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
                    if (variantDebugEnabled() && !material.userData.__warnedVariantProp.has(prop)) {
                        console.error('[VariantLock]', prop, 'modified after lock');
                        material.userData.__warnedVariantProp.add(prop);
                    }
                }
            });
            material.userData.__frozenVariantProps.add(prop);
        } catch (err) {
            if (variantDebugEnabled() && !material.userData.__warnedVariantProp.has(prop)) {
                debugWarn(true, '[VariantLock] Failed to lock prop', prop, material.uuid, err?.message);
                material.userData.__warnedVariantProp.add(prop);
            }
        }
    });

    material.userData.__owner = material.userData.__owner || owner;
    material.userData.__flagsFrozen = true;
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
    constructor(scene) {
        this.scene = scene;
        
        this.config = {
            baseRadius: 0.06,
            strandRadius: 0.025,
            twists: 3.0,
            segments: 45,
            radialSegments: 5,
            colorVariation: 0.15,
            breathingSpeed: 0.8,
            twistSpeed: 0.2,
            
            // Glow Skin (Ghostly Envelope)
            skinOpacity: 0.05,
            skinRadiusScale: 1.5
        };
        
        // Reusable texture
        this.flowTexture = this.generateFlowTexture();
        
        // Math cache to reduce allocations
        this._vec3 = new THREE.Vector3();
        
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
        
        // Setup particle arrival callbacks
        this._setupParticleCallbacks();
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
        if (typeof window !== 'undefined' && window.ATOMA_LINK_VISUALS_ENABLED === false) {
            return;
        }
        const group = new THREE.Group();
        group.userData = { isLinkVisual: true };

        const sourceCat = link.source.userData.category || 'input';
        const baseColor = this.getCategoryColor(sourceCat);

        // 1. Determine Structure (Stable Randomization)
        // Ensure 3-5 strands based on ID to maintain consistency per link
        const linkIdChar = (link.id || 'a').charCodeAt(0);
        const strandCount = 3 + (linkIdChar % 3); // 3, 4, or 5 strands

        // 2. Create Strands (The Rope)
        const strands = [];
        for (let i = 0; i < strandCount; i++) {
            const color = new THREE.Color(baseColor);
            const hsl = {};
            color.getHSL(hsl);
            
            // Visual Separation
            hsl.h += (Math.random() - 0.5) * 0.08;
            hsl.l += (Math.random() - 0.5) * this.config.colorVariation;
            hsl.l = Math.min(0.9, Math.max(0.4, hsl.l));
            color.setHSL(hsl.h, hsl.s, hsl.l);

            const flowMap = this.flowTexture ? this.flowTexture.clone() : null;
            if (flowMap) {
                flowMap.wrapS = THREE.RepeatWrapping;
                flowMap.needsUpdate = true;
                flowMap.offset.x = Math.random();
            }

            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveMap: flowMap,
                emissiveIntensity: 1.2,
                roughness: 0.3,
                metalness: 0.8,
                opacity: 0.95,
                side: THREE.DoubleSide,
                transparent: false,
                depthWrite: true,
                depthTest: true,
                blending: THREE.NormalBlending
            });
            material.userData = material.userData || {};
            material.userData.__owner = 'LinkRenderer';
            material.userData.__domain = 'link';
            material.userData.__flagsFrozen = material.userData.__flagsFrozen || false;

            const geometry = new THREE.BufferGeometry();
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData = { strandIndex: i };
            TransparentStateAuthority.apply(mesh, 'link', { renderOrder: 10, depthWrite: false, depthTest: true });
            freezeMaterialFlags(material, 'LinkRenderer');
            material.userData.__flagsFrozen = true;
            mesh.userData = mesh.userData || {};
            mesh.userData.__depthAuthorityLocked = true;
            
            group.add(mesh);
            strands.push(mesh);
        }

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
        skinMaterial.userData = skinMaterial.userData || {};
        skinMaterial.userData.__owner = 'LinkRenderer';
        skinMaterial.userData.__domain = 'link';
        // Freeze variant properties immediately after material creation
        freezeMaterialFlags(skinMaterial, 'LinkRenderer');
        TransparentStateAuthority.apply(skinMesh, 'link', { renderOrder: 9, depthWrite: false });
        skinMesh.userData = skinMesh.userData || {};
        skinMesh.userData.__depthAuthorityLocked = true;
        group.add(skinMesh);

        // 4. Initialize Subsystems (Defensive)
        let beadVisualizer = null;
        try { if (LinkBeadVisualizer) beadVisualizer = new LinkBeadVisualizer(link, this.scene); } catch(e){}
        if(beadVisualizer) group.add(beadVisualizer.getGroup());

        let sparkSystem = null;
        try { if (LinkSparkSystem) sparkSystem = new LinkSparkSystem(this.scene); } catch(e){}
        if(sparkSystem) group.add(sparkSystem.getMesh());

        let trailSystem = null;
        try { if (LinkBeadTrailSystem) trailSystem = new LinkBeadTrailSystem(this.scene); } catch(e){}
        if(trailSystem) group.add(trailSystem.getMesh());

        let ringSystem = null;
        try { if (LinkEnergyRingSystem) ringSystem = new LinkEnergyRingSystem(this.scene); } catch(e){}

        // 5. Flow Carrier (Mandatory)
        let pulseRing = null;
        try {
            if (LinkPulseRing) {
                pulseRing = new LinkPulseRing(this.scene);
                group.add(pulseRing.getMesh());
            }
        } catch (e) { debugWarn(window.ATOMA_DEBUG_LINK, 'LinkRenderer: Failed to init pulse ring', e); }

        // 6. Energy Wave System (Mandatory)
        let energyWave = null;
        try {
            if (LinkEnergyWave) {
                energyWave = new LinkEnergyWave();
            }
        } catch (e) { debugWarn(window.ATOMA_DEBUG_LINK, 'LinkRenderer: Failed to init energy wave', e); }

        // 7. Arc Discharge System (Ring Enhancement)
        let arcDischarges = null;
        try {
            if (LinkRingArcDischarges) {
                arcDischarges = new LinkRingArcDischarges(this.scene);
                group.add(arcDischarges.getGroup());
            }
        } catch (e) { debugWarn(window.ATOMA_DEBUG_LINK, 'LinkRenderer: Failed to init arc discharges', e); }

        // 8. Visual State Adapter (Harmony/Corruption Bridge)
        let visualStateAdapter = null;
        try {
            if (LinkVisualStateAdapter) {
                visualStateAdapter = new LinkVisualStateAdapter();
            }
        } catch (e) { debugWarn(window.ATOMA_DEBUG_LINK, 'LinkRenderer: Failed to init visual state adapter', e); }

        // 9. Directional Energy Streaks (Adapter-only flow visualization)
        let directionalStreaks = null;
        try {
            if (LinkDirectionalStreaks && this.directionalStreaks) {
                directionalStreaks = this.directionalStreaks;
                // Initialize streaks with deterministic randomization based on link ID
                const linkIdHash = (link.id || 'default').split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
                
                // Get harmonic hub controller if this link is connected to a hub
                const sourceController = this.nodeHarmonicManager?.nodeControllers.get(link.source);
                const hubController = sourceController?.isActive ? sourceController : null;
                
                directionalStreaks.initialize(group, linkIdHash, link, link.source, link.target, hubController);
            }
        } catch (e) { debugWarn(window.ATOMA_DEBUG_LINK, 'LinkRenderer: Failed to init directional streaks', e); }

        // Store unified state
        group.userData.conduitState = {
            strands: strands,
            strandCount: strandCount, // Store for update loop
            skinMesh: skinMesh,
            beads: beadVisualizer,
            sparks: sparkSystem,
            trails: trailSystem,
            rings: ringSystem,
            pulseRing: pulseRing,
            energyWave: energyWave,
            arcDischarges: arcDischarges,
            visualStateAdapter: visualStateAdapter,
            directionalStreaks: directionalStreaks, // Reference to manager
            phaseOffset: Math.random() * Math.PI * 2,
            baseColor: baseColor,
            impacts: []
        };
        
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
    update(link, deltaTime, time) {
        if (typeof window !== 'undefined' && window.ATOMA_LINK_VISUALS_ENABLED === false) {
            return;
        }
        if (!link.group || !link.group.userData.conduitState) return;
        
        // Canonical RAF time source (behavior-preserving Phase 2A)
        const visualTime = VisualTime.now;
        const visualDelta = VisualTime.delta;

        const state = link.group.userData.conduitState;
        
        // --- LINK ANCHORING FIX ---
        // Compute anchored start/end points at node surfaces (not centers)
        const sourcePos = link.source.position.clone();
        const targetPos = link.target.position.clone();
        
        // Get visual radius (aura if available, else fallback to scale)
        const sourceRadius = link.source.userData?.auraRadius ?? link.source.scale?.x ?? 1.0;
        const targetRadius = link.target.userData?.auraRadius ?? link.target.scale?.x ?? 1.0;
        
        // Compute direction vector from source to target
        const linkDir = new THREE.Vector3().subVectors(targetPos, sourcePos);
        const linkDist = linkDir.length();
        
        // Normalize and apply surface offset WITH LINK EXTENSION PENETRATION
        let start, end;
        if (linkDist > 0.001) {
          linkDir.normalize();
          
          // Apply penetration: links extend deeper into aura field
          // This makes links feel rooted, not just attached
          const sourceOffset = sourceRadius * LinkExtensionConfig.sourceOffsetWithPenetration;
          const targetOffset = targetRadius * LinkExtensionConfig.targetOffsetWithPenetration;
          
          start = sourcePos.clone().addScaledVector(linkDir, sourceOffset);
          end = targetPos.clone().addScaledVector(linkDir, -targetOffset);
        } else {
          // Fallback if nodes are at same position
          start = sourcePos.clone();
          end = targetPos.clone();
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
        
        // Store link direction for aura modulation later
        if (!link.userData) link.userData = {};
        link.userData.linkDirection = linkDir.clone(); 
        
        const frames = mainCurve.computeFrenetFrames(this.config.segments, false);

        // --- 2. Dynamic Parameters ---
        const synergy = link.synergyScore ?? 0.5;
        const trafficLoad = link.traffic ? link.traffic.load : 0;
        
        const breathing = Math.sin(visualTime * this.config.breathingSpeed + state.phaseOffset) * 0.05 + 1.0;
        const twistPhase = visualTime * this.config.twistSpeed;
        
        const activeRadius = this.config.baseRadius * breathing * (1.0 - synergy * 0.2 + trafficLoad * 0.2);

        // --- 3. Strand Update (The Braid) ---
        // Optimization: Pre-calculate loop invariants
        const flowSpeed = 0.2 + (synergy * 1.2);
        const noiseBase = 0.005 * (1.0 - synergy);
        
        state.strands.forEach((mesh, i) => {
            if (isCoreNodeMesh(mesh)) {
                // Phase LRC-SAFE-CORE
                // Do NOT modify core node material
                return;
            }
            // Flow texture
            if (mesh.material && mesh.material.emissiveMap) {
                mesh.material.emissiveMap.offset.x -= flowSpeed * visualDelta * 0.5;
                const pulse = Math.sin(visualTime * 2.0 + i) * 0.2 + 0.8;
                mesh.material.emissiveIntensity = 0.5 * pulse * (1 + trafficLoad);
            }

            // Generate helical path
            const points = [];
            const angleOffset = (i / state.strandCount) * Math.PI * 2;
            
            for (let j = 0; j <= this.config.segments; j++) {
                const t = j / this.config.segments;
                const pointOnMain = mainCurve.getPointAt(t);
                const N = frames.normals[j];
                const B = frames.binormals[j];
                
                const currentTwist = t * Math.PI * 2 * this.config.twists + twistPhase;
                const angle = angleOffset + currentTwist;
                
                const flare = 1.0 + Math.pow(2.0 * (t - 0.5), 2) * 0.2;
                const noise = Math.sin(t * 40 + i * 10) * noiseBase;
                const r = (activeRadius * flare) + noise;

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
                this.config.segments,
                this.config.strandRadius,
                this.config.radialSegments,
                false
            );
        });

        // --- 4. Aura Skin Update (Unified Shader Material) ---
        if (state.skinMesh) {
             if (isCoreNodeMesh(state.skinMesh)) {
                 // Phase LRC-SAFE-CORE
                 // Do NOT modify core node material
                 return;
             }
             const skin = state.skinMesh;
             if (skin.geometry) skin.geometry.dispose();
             skin.geometry = new THREE.TubeGeometry(
                 mainCurve,
                 this.config.segments, 
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
                 const linkHarmony = link.harmonyLevel ?? 0.5;
                 const linkCorruption = link.corruptionLevel ?? 0.2;
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
             }
        }

        // --- 4.5. CORRUPTION SPREAD ANIMATION ---
        // Animate color shift from source to target as corruption spreads
        if (this.corruptionAnimator && state.strands) {
            this.corruptionAnimator.update(link, visualDelta, state.strands);
        }
        
        // --- 4.6. CORRUPTION PARTICLE EFFECTS ---
        // Emit particles that flow along link from source to target
        if (this.corruptionParticles) {
            this.corruptionParticles.updateLinkParticles(link, visualDelta);
        }
        
        // --- 4.7. TRAIL PARTICLE EFFECTS ---
        // Emit organic trail particles using same noise as aura systems
        if (this.trailParticles && this.trailEmitters && link.id) {
            const emitter = this.trailEmitters.get(link.id);
            if (emitter) {
                const linkHarmony = link.harmonyLevel ?? 0.5;
                const linkCorruption = link.corruptionLevel ?? 0.2;
                
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
        if (this.healingParticles && this.healingEmitters && link.id) {
            const emitter = this.healingEmitters.get(link.id);
            if (emitter) {
                const linkHarmony = link.harmonyLevel ?? 0.5;
                const linkCorruption = link.corruptionLevel ?? 0.2;
                
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
        if (state.beads) {
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
        
        if (state.sparks) {
            const currentColor = (state.strands[0]?.material?.color) || state.baseColor;
            state.sparks.update(visualTime, visualDelta, mainCurve, { synergy, traffic: trafficLoad }, currentColor);
            state.sparks.uniforms.uThickness.value = activeRadius * 2;
        }
        
        if (state.pulseRing) {
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
        }

        // --- 6. Energy Wave Update (Unified Wave Through Strands) ---
        if (state.energyWave) {
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
        if (state.arcDischarges && state.pulseRing) {
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
                ringScale
            );
        }

        // --- 8. Visual State Adaptation (Harmony/Corruption/Instability/Synergy Bridge) ---
        if (state.visualStateAdapter) {
            // Extract harmony/corruption/instability/synergy from link state
            // These properties are expected to exist on the link object
            const harmonyLevel = link.harmonyLevel ?? link.harmony ?? 1.0;
            const corruptionLevel = link.corruptionLevel ?? link.corruption ?? 0.0;
            const instability = link.instability ?? link.instabilityLevel ?? 0.0;
            const synergyLevel = link.synergy ?? link.synergyLevel ?? link.flow ?? 0.5;

            state.visualStateAdapter.update(
                link.group,
                harmonyLevel,
                corruptionLevel,
                instability,
                visualDelta,
                synergyLevel
            );
        }

        // --- 9. Directional Energy Streaks (Synergy-driven flow visualization) ---
        if (state.directionalStreaks && this.directionalStreaks) {
            const harmonyLevel = link.harmonyLevel ?? link.harmony ?? 1.0;
            const corruptionLevel = link.corruptionLevel ?? link.corruption ?? 0.0;
            const instability = link.instability ?? link.instabilityLevel ?? 0.0;
            const synergyLevel = link.synergy ?? link.synergyLevel ?? link.flow ?? 0.5;
            
            const sourceColor = new THREE.Color(state.baseColor);
            const targetCat = link.target.userData?.category || 'input';
            const targetColor = new THREE.Color(this.getCategoryColor(targetCat));

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
                visualTime  // Time source: VisualTime (canonical)
            );
        }
        
        this.updateImpacts(state, visualDelta);
    }

    getCategoryColor(category) {
        const colors = {
            'input': 0x00ddff, 'process': 0xffaa00, 'integration': 0x00ff88,
            'analytics': 0xaa00ff, 'storage': 0x88ccff, 'control': 0xff0088,
            'quantum': 0x00ffff, 'sigma': 0x00ff00, 'emotional': 0xff8800
        };
        return colors[category] || 0xcccccc;
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
        const meshMaterial = new THREE.MeshBasicMaterial({
            color: color,
            opacity: 0.6,
            wireframe: true,
            // Variant properties (frozen after creation):
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide
        });
        meshMaterial.userData = meshMaterial.userData || {};
        meshMaterial.userData.__owner = 'LinkRenderer';
        meshMaterial.userData.__domain = 'link';
        // Freeze variant properties immediately after material creation
        freezeMaterialFlags(meshMaterial, 'LinkRenderer');
        const mesh = new THREE.Mesh(geometry, meshMaterial);
        TransparentStateAuthority.apply(mesh, 'additive', { renderOrder: 40 });
        mesh.userData = mesh.userData || {};
        mesh.userData.__depthAuthorityLocked = true;
        
        group.add(mesh);
        group.position.copy(node.position);
        
        const scaleMult = beadSize === 'large' ? 1.5 : (beadSize === 'small' ? 0.5 : 1.0);
        group.scale.setScalar(0.1); // Start small
        
        group.userData = { age: 0, duration: 0.5, maxScale: 2.0 * scaleMult, mesh: mesh };
        
        this.scene.add(group);
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
                this.scene.remove(grp);
                grp.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); });
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
        if (state.energyWave) state.energyWave = null;
        if (state.arcDischarges) state.arcDischarges.dispose();
        if (state.visualStateAdapter) state.visualStateAdapter.dispose();
        
        if (state.directionalStreaks && this.directionalStreaks) {
            this.directionalStreaks.dispose(state.directionalStreaks);
        }
        
        state.impacts.forEach(g => {
            this.scene.remove(g);
            g.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); });
        });
        state.impacts = [];
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
    }
}
