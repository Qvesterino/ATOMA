 /**
 * ============================================================================
 * RESONANCE RUPTURE VISUAL SYSTEM (Session 133)
 * ============================================================================
 * 
 * PURE RENDERING SYSTEM - Visualizes Standing Wave Collapse
 * 
 * Purpose:
 * Detects when standing waves exceed stability limits and rupture,
 * releasing trapped energy in a controlled, visually coherent manner.
 * Creates pre-rupture stress indicators, rupture events, propagation paths,
 * and aftermath scars—all visual-only with zero gameplay modifications.
 * 
 * Core Philosophy:
 * - Rupture is consequence of unresolved pressure
 * - Not random; deterministic from standing wave state
 * - Violent but structured (coherence breaking, not explosion)
 * - Energy releases directionally along network topology
 * - Aftermath shows visual memory of structural failure
 * 
 * Architecture:
 * - Monitors standing wave conditions (amplitude, frequency, persistence)
 * - Calculates stress accumulation (escalation metrics)
 * - Detects rupture triggers (corruption, instability, phase divergence)
 * - Manages pre-rupture phase (visual strain indicators)
 * - Executes rupture event (phase discontinuity, energy release)
 * - Propagates energy along network paths (directional bursts)
 * - Creates and fades resonance scars (visual memory)
 * - Triggers node reactions (halo destabilization)
 * - Manages resolution paths (damping, reformation, absorption)
 * 
 * Integration:
 * - Works with StandingWaveOscillationTrapSystem (reads trap state)
 * - Works with InfluenceReflectionBackPressureSystem (reads reflections)
 * - Works with AINodes (reads node state)
 * - Visual-only, no gameplay logic changes
 * 
 * Status: PRODUCTION (Session 133)
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// DESIGN: Stress indicator shader — pulsing red-orange warning glow on approaching-rupture links
const STRESS_INDICATOR_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const STRESS_INDICATOR_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uStress;     // 0.5 to 1.0
uniform float uIntensity;  // sharpened stress visual intensity
uniform vec3 uColor;

varying vec2 vUv;

void main() {
    vec2 p = vUv - vec2(0.5);
    float dist = length(p) * 2.0;
    if (dist > 1.0) discard;

    // Stress-normalized pulse: faster as stress approaches rupture
    float stressNorm = clamp((uStress - 0.5) * 2.0, 0.0, 1.0);
    float pulseFreq = 2.0 + stressNorm * 12.0;  // 2Hz at 50% → 14Hz at 100%
    float pulse = 0.6 + 0.4 * sin(uTime * pulseFreq + dist * 4.0);

    // Multi-band glow: hot core + tension ring + outer halo
    float core = (1.0 - smoothstep(0.0, 0.25, dist)) * 0.5;
    float tensionRing = smoothstep(0.3, 0.45, dist) * (1.0 - smoothstep(0.45, 0.6, dist));
    float halo = (1.0 - smoothstep(0.2, 0.9, dist)) * 0.3;

    // Angular flicker — chaotic energy pattern
    float angle = atan(p.y, p.x);
    float flicker = 0.85 + 0.15 * sin(angle * 8.0 + uTime * stressNorm * 15.0);

    float alpha = (core + tensionRing * 0.8 * stressNorm + halo) * pulse * flicker * uIntensity;
    alpha *= (1.0 - smoothstep(0.7, 1.0, dist));  // outer fade

    // Color: shift from deep red to hot orange-white at high stress
    vec3 hotColor = mix(uColor, vec3(1.0, 0.6, 0.2), stressNorm * 0.7);
    hotColor = mix(hotColor, vec3(1.0, 0.9, 0.8), core * stressNorm);  // white-hot center

    gl_FragColor = vec4(hotColor, alpha);
}
`;

function getAtomaVisualDebugMode() {
    const mode = (typeof window !== 'undefined' && window.__ATOMA_VISUAL_DEBUG_MODE__)
        || globalThis.__ATOMA_VISUAL_DEBUG_MODE__
        || 'all';
    return `${mode}`.toLowerCase();
}

export class ResonanceRuptureVisualSystem_Session133 {
    constructor(scene, standingWaveTrapSystem, reflectionSystem, linkingSystem, aiNodes, config = {}, semanticBus = null) {
        this.scene = scene;
        this.standingWaveTrapSystem = standingWaveTrapSystem;
        this.reflectionSystem = reflectionSystem;
        this.linkingSystem = linkingSystem;
        this.aiNodes = aiNodes;
        this.semanticBus = semanticBus;
        
        // Configuration
        this.config = {
            // Rupture detection thresholds
            stressAccumulationRate: 0.3,      // Stress buildup per second
            stressRuptureThreshold: 0.85,     // Stress level triggering rupture (0-1)
            corruptionRuptureBoost: 0.4,      // Corruption increases threshold (negative)
            instabilityRuptureBoost: 0.3,     // Instability increases threshold (negative)
            phaseDivergenceThreshold: 0.6,    // Phase incoherence triggering rupture
            amplitudeRuptureThreshold: 0.9,   // Max amplitude before rupture
            minTrapLifetime: 1.0,             // Min seconds before rupture possible

            // Event-driven rupture pressure
            eventPressureDecayRate: 0.18,     // Decay per second for per-link event pressure (slower = longer trigger memory)
            globalStressBiasDecayRate: 0.14,  // Decay per second for network-level stress bias (slower)
            eventPressureWeight: 0.55,        // Total pressure weight for event pressure
            trapStressWeight: 0.30,           // Total pressure weight for trap stress
            amplitudeWeight: 0.15,            // Total pressure weight for normalized amplitude
            amplitudeNormalizationScale: 1.2, // Amplitude value mapped to normalized 1.0
            hardAmplitudeTrigger: 1.15,       // Failsafe amplitude trigger
            ruptureCooldownSec: 7.0,          // Global rupture cooldown per link

            // Weighted score trigger (replaces strict hard-gate style conditions)
            scoreEventWeight: 0.45,
            scoreStressWeight: 0.30,
            scoreAmplitudeWeight: 0.15,
            scoreCorruptionWeight: 0.06,
            scoreInstabilityWeight: 0.04,
            ruptureScoreThresholdOffset: -0.05, // Slightly easier than raw threshold
            softAmplitudeAssistFactor: 0.85,    // Near-threshold amplitude assistance
            
            // Pre-rupture stress visualization
            stressIndicatorOpacity: 0.3,      // Base opacity of stress bands
            stressCompressionFactor: 1.3,     // Link compression under stress
            stressColorIntensity: 0.7,        // Stress band brightness (red-ish)
            stressFrequencyIncrease: 1.5,     // Oscillation frequency multiplier
            stressSharpness: 0.4,             // Band edge sharpness (0=soft, 1=sharp)
            
            // Rupture event
            ruptureDuration: 1.5,             // Rupture event lifetime (seconds)
            ruptureBurst: 0.8,                // Energy burst intensity
            ruptureBurstWidth: 0.2,           // Width of rupture wavefront
            ruptureBurstColor: new THREE.Color(1.0, 0.4, 0.0),  // Orange-red
            ruptureBurstGlow: 2.5,            // Emissive intensity at rupture
            fractureBloomExtraShardCount: 6,  // Additional chaotic shards in bloom burst
            fractureBloomRotationVariance: 0.42,
            fractureBloomDriftRate: 0.26,
            
            // Rupture propagation
            propagationSpeed: 2.0,            // Relative to normal wave speed
            propagationDistance: 3.0,         // Maximum links to propagate through
            propagationDamping: 0.85,         // Energy retention per link (0.85 = 85% retained)
            propagationPaths: 2,              // Max directional paths from rupture
            propagationDuration: 1.0,         // Visible time budget per propagation pulse (seconds)
            
            // Resonance scar
            scarOpacity: 0.15,                // Base scar visibility
            scarDuration: 120.0,              // Scar fade time (seconds)
            scarColor: new THREE.Color(0.5, 0.3, 0.4),  // Purple-bruise
            scarDeformation: 0.1,             // Geometric deformation amount
            scarFrequencyDamping: 0.4,        // Oscillation damping in scar
            
            // Node reaction
            haloDestabilizationAmount: 0.3,   // Halo flicker magnitude
            haloDestabilizationDuration: 0.5, // Recovery time (seconds)
            haloRecoveryRate: 0.8,            // How fast halo recovers
            
            // State modulation
            harmonyRupturePrevention: 0.6,    // Harmony reduces rupture probability
            corruptionRuptureAcceleration: 0.4, // Corruption speeds rupture
            instabilityRuptureEarlier: 0.5,   // Instability triggers sooner
            synergyRuptureClarity: 0.7,       // Synergy makes rupture sharper
            
            // Resolution paths
            postRuptureDamping: 0.5,          // Oscillation damping after rupture
            reformationThreshold: 0.4,        // Harmony threshold for reformation
            absorptionThreshold: 0.7,         // Corruption threshold for absorption
            
            // Performance
            maxConcurrentRuptures: 5,         // Simultaneous ruptures allowed
            maxRupturePropagations: 20,       // Propagation pulses tracked
            maxResonanceScarsMeshes: 20,      // Scar mesh pool size
            debugVisualBoost: true,
            forceRuptureVfx: false,
            renderOrder: VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE),
            enableLOD: true,
            lodDistance: 40,
            ...config
        };
        
        // Runtime state
        this.stressAccumulation = new Map();  // trapId -> stress level (0-1)
        this.ruptures = [];                   // Active rupture events
        this.propagationPulses = [];          // Energy pulses propagating
        this.resonanceScars = [];             // Scar zones on links
        this.nodeReactions = new Map();       // nodeId -> reaction state
        this.preRuptureZones = [];            // Stress indicator zones
        
        // UNIFIED CLEANUP CONTRACT - Track all created objects
        this._createdObjects = [];
        
        // Tracking
        this.trapLifetimes = new Map();       // trapId -> time since creation
        this.trapPhaseDivergence = new Map(); // trapId -> { lastPhase, divergence }
        this.ruptureOccurrences = new Map();  // linkId -> last rupture time
        this.eventPressureByLink = new Map(); // linkId -> event pressure (0-1)
        this.globalStressBias = 0;            // network-level event pressure bias
        this.semanticUnsubscribers = [];      // semantic bus unsubscriber callbacks
        this.boundSemanticBus = null;
        this.debugStats = {
            ruptureTriggers: 0,
            propagationBursts: 0,
            scarSpawns: 0,
            semanticHits: Object.create(null),
            lastTrigger: null
        };
        
        // Object pools
        this.ruptureEventPool = [];
        this.propagationPulsePool = [];
        this.scarMeshPool = [];
        this.stressIndicatorPool = [];  // DESIGN: visual stress warning meshes
        this._burstGeometryCache = new Map();
        this._propagationGeometryCache = new Map();
        
        // Material cache
        this.stressMaterial = null;
        this.stressShaderMaterial = null;  // DESIGN: shader-based stress indicator
        this.ruptureMaterial = null;
        this.propagationMaterial = null;
        this.scarMaterial = null;
        
        this.time = 0;
        this.initialized = false;
        this.neutralCascadeParticleColor = new THREE.Color(0.75, 0.8, 0.9);
    }

    /**
     * Setup - initialize materials, pools, and resources
     */
    setup() {
        if (this.initialized) return;
        
        // Create stress indicator material (red, tension) - additive blending for glow
        this.stressMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xff2f00),  // Neon red-orange
            transparent: true,
            opacity: this.config.debugVisualBoost ? Math.min(0.8, this.config.stressIndicatorOpacity + 0.2) : this.config.stressIndicatorOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create rupture burst material (bright orange-red) - additive blending for glow
        this.ruptureMaterial = new THREE.MeshBasicMaterial({
            color: this.config.debugVisualBoost ? new THREE.Color(0xff00ff) : this.config.ruptureBurstColor,
            transparent: true,
            opacity: this.config.debugVisualBoost ? 0.85 : 0.6,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create propagation pulse material - additive blending for glow
        this.propagationMaterial = new THREE.MeshBasicMaterial({
            color: this.config.debugVisualBoost ? new THREE.Color(0x00ffff) : this.config.ruptureBurstColor,
            transparent: true,
            opacity: this.config.debugVisualBoost ? 0.7 : 0.4,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create resonance scar material (purple-bruise) - additive blending for subtle glow
        this.scarMaterial = new THREE.MeshBasicMaterial({
            color: this.config.debugVisualBoost ? new THREE.Color(0xffff33) : this.config.scarColor,
            transparent: true,
            opacity: this.config.debugVisualBoost ? Math.max(this.config.scarOpacity, 0.28) : this.config.scarOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Pre-allocate rupture event pool
        for (let i = 0; i < this.config.maxConcurrentRuptures; i++) {
            const rupture = {
                active: false,
                linkId: null,
                trapId: null,
                convergencePoint: new THREE.Vector3(),
                life: 0,
                maxLife: this.config.ruptureDuration,
                intensity: 1,
                burstMesh: null,
                phase: 0
            };
            rupture.burstMesh = this._createRuptureBurst({
                linkId: `rupture-pool-${i}`,
                trapId: `rupture-pool-${i}`,
                convergencePoint: new THREE.Vector3(),
                intensity: 0.0
            });
            if (rupture.burstMesh) {
                rupture.burstMesh.visible = false;
            }
            this.ruptureEventPool.push(rupture);
        }
        
        // Pre-allocate propagation pulse pool
        for (let i = 0; i < this.config.maxRupturePropagations; i++) {
            const pulse = {
                active: false,
                startLink: null,
                currentLink: null,
                pathDistance: 0,
                life: 0,
                intensity: 1,
                direction: new THREE.Vector3(),
                mesh: null
            };
            pulse.mesh = this._createPropagationPulseMesh();
            if (pulse.mesh) {
                pulse.mesh.visible = false;
            }
            this.propagationPulsePool.push(pulse);
        }
        
        // Pre-allocate scar mesh pool - use proper base geometry, scale at runtime
        const maxScarMeshes = this.config.maxResonanceScarsMeshes ?? 20;
        for (let i = 0; i < maxScarMeshes; i++) {
            const mesh = this._createScarParticleBurstRoot();
            mesh.visible = false;
            this.scarMeshPool.push({
                mesh: mesh,
                active: false,
                scarData: null,
                birthTime: 0
            });
        }

        // DESIGN: Pre-allocate stress indicator pool — shader-based pulsing warning glow
        this.stressShaderMaterial = new THREE.ShaderMaterial({
            vertexShader: STRESS_INDICATOR_VERTEX_SHADER,
            fragmentShader: STRESS_INDICATOR_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uStress: { value: 0.5 },
                uIntensity: { value: 0 },
                uColor: { value: new THREE.Color(0xff2f00) }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            toneMapped: false
        });

        const stressGeo = new THREE.PlaneGeometry(1, 1);
        const maxStressIndicators = this.config.maxConcurrentRuptures * 2;
        for (let i = 0; i < maxStressIndicators; i++) {
            const mesh = new THREE.Mesh(stressGeo, this.stressShaderMaterial.clone());
            mesh.visible = false;
            mesh.rotation.x = -Math.PI / 2;
            mesh.renderOrder = this.config.renderOrder - 1;  // below rupture visuals
            this.scene.add(mesh);
            this.stressIndicatorPool.push({ mesh, active: false, linkId: null });
        }
        
        this.initialized = true;
        this._ensureSemanticBindings();
    }

    /**
     * Update - primary frame update
     * @param {number} deltaTime - Elapsed time since last frame
     * @param {number} currentTime - Total simulation time
     */
    update(deltaTime, currentTime) {
        const mode = getAtomaVisualDebugMode();
        if (mode !== 'all' && mode !== 'rupture') return;
        if (!this.initialized) this.setup();

        this.time = currentTime;
        this._ensureSemanticBindings();
        this._ensureCanonicalLinkDefaults();
        this._ensureScarMeshesAttached();

        // Step 1: Monitor standing waves for stress accumulation
        this._updateStressAccumulation(deltaTime);

        // Step 1.5: Decay semantic event pressure
        this._updateEventPressure(deltaTime);
        
        // Step 2: Detect rupture conditions
        this._detectRuptureConditions(deltaTime);
        
        // Step 3: Update pre-rupture stress zones
        this._updatePreRuptureIndicators(deltaTime);
        
        // Step 4: Execute rupture events
        this._executeRuptureEvents(deltaTime);
        
        // Step 5: Manage rupture propagation
        this._updateRupturePropagation(deltaTime);
        
        // Step 6: Manage resonance scars
        this._updateResonanceScars(deltaTime);

        // Step 6.5: Write rupture canonical link metrics
        this._updateRuptureCanonicalLinkMetrics(deltaTime);
        
        // Step 7: Handle node reactions
        this._updateNodeReactions(deltaTime);
        
        // Step 8: Apply state modulation
        this._modulateByNetworkState(deltaTime);
    }

    /**
     * Monitor standing waves and accumulate stress
     */
    _updateStressAccumulation(deltaTime) {
        if (!this.standingWaveTrapSystem) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        
        traps.forEach(trap => {
            if (!trap.active) return;
            
            const trapId = trap.linkId;
            const phaseDivergence = this._calculateTrapPhaseDivergence(trapId, trap.phase ?? 0);
            
            // Track trap lifetime
            let lifetime = this.trapLifetimes.get(trapId) || 0;
            lifetime += deltaTime;
            this.trapLifetimes.set(trapId, lifetime);
            
            // Get or initialize stress level
            let stress = this.stressAccumulation.get(trapId) || 0;
            
            // Only accumulate stress if trap is mature
            if (lifetime > this.config.minTrapLifetime) {
                // Base stress accumulation
                let stressIncrease = this.config.stressAccumulationRate * deltaTime;
                
                // Increase stress with amplitude
                stressIncrease *= (trap.amplitude + 0.5);
                
                // Increase stress with reflection count
                stressIncrease *= Math.min(1, (trap.reflectionCount || 1) * 0.2);

                // Phase divergence increases accumulated strain once it exceeds the configured threshold.
                if (phaseDivergence > this.config.phaseDivergenceThreshold) {
                    stressIncrease *= 1 + (phaseDivergence - this.config.phaseDivergenceThreshold);
                }
                
                stress = Math.min(1, stress + stressIncrease);
            }
            
            this.stressAccumulation.set(trapId, stress);
        });
        
        // Clean up stress for inactive traps
        this.stressAccumulation.forEach((stress, trapId) => {
            const trapActive = traps.some(t => t.active && t.linkId === trapId);
            if (!trapActive) {
                this.stressAccumulation.delete(trapId);
                this.trapLifetimes.delete(trapId);
                this.trapPhaseDivergence.delete(trapId);
            }
        });
    }

    /**
     * Detect rupture conditions and trigger ruptures
     */
    _detectRuptureConditions(deltaTime) {
        if (!this.standingWaveTrapSystem) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        const forceRupture = this.config.forceRuptureVfx === true;
        
        traps.forEach(trap => {
            if (!trap.active) return;
            
            const trapId = trap.linkId;
            const stress = this.stressAccumulation.get(trapId) || 0;
            const phaseDivergenceState = this.trapPhaseDivergence.get(trapId);
            const phaseDivergence = phaseDivergenceState?.divergence || 0;
            const phaseDivergenceBoost = phaseDivergence > this.config.phaseDivergenceThreshold ? phaseDivergence : 0;
            const link = this._getLinkById(trapId);
            const canonicalPressure = this._readCanonicalLinkPressure(link);
            const eventPressure = Math.max(
                this.eventPressureByLink.get(String(trapId)) || 0,
                canonicalPressure
            );
            
            // Get node metrics for modulation
            const nodeA = trap.nodeA || {};
            const nodeB = trap.nodeB || {};
            const avgCorruption =
                (this._readNodeMetric(nodeA, 'corruption', 0.5) + this._readNodeMetric(nodeB, 'corruption', 0.5)) * 0.5;
            const avgInstability =
                (this._readNodeMetric(nodeA, 'instability', 0) + this._readNodeMetric(nodeB, 'instability', 0)) * 0.5;
            
            // Calculate effective rupture threshold
            let threshold = this.config.stressRuptureThreshold;
            threshold -= avgCorruption * this.config.corruptionRuptureBoost;
            threshold -= avgInstability * this.config.instabilityRuptureBoost;
            threshold = Math.max(0.3, Math.min(1.0, threshold));
            
            // Check rupture conditions
            const normalizedAmplitude = THREE.MathUtils.clamp(
                (trap.amplitude || 0) / this.config.amplitudeNormalizationScale,
                0,
                1
            );
            const totalPressure = THREE.MathUtils.clamp(
                eventPressure * this.config.eventPressureWeight +
                stress * this.config.trapStressWeight +
                normalizedAmplitude * this.config.amplitudeWeight +
                this.globalStressBias,
                0,
                1
            );
            const ruptureScore = THREE.MathUtils.clamp(
                eventPressure * this.config.scoreEventWeight +
                stress * this.config.scoreStressWeight +
                normalizedAmplitude * this.config.scoreAmplitudeWeight +
                phaseDivergenceBoost * 0.12 +
                avgCorruption * this.config.scoreCorruptionWeight +
                avgInstability * this.config.scoreInstabilityWeight +
                this.globalStressBias,
                0,
                1
            );
            const scoreThreshold = THREE.MathUtils.clamp(
                threshold + this.config.ruptureScoreThresholdOffset,
                0.25,
                1.0
            );

            const scoreExceeds = ruptureScore > scoreThreshold;
            const softAmplitudeAssist =
                normalizedAmplitude > (this.config.amplitudeRuptureThreshold * this.config.softAmplitudeAssistFactor) &&
                ruptureScore > (scoreThreshold * 0.9);
            const amplitudeHardExceeds = (trap.amplitude || 0) > Math.max(
                this.config.amplitudeRuptureThreshold,
                this.config.hardAmplitudeTrigger
            );
            const ruptureRecent = this._isRuptureRecent(trapId);

            if ((forceRupture || scoreExceeds || softAmplitudeAssist || amplitudeHardExceeds) && !ruptureRecent) {
                // Trigger rupture
                const forcedIntensity = Math.max(
                    stress,
                    totalPressure,
                    ruptureScore,
                    normalizedAmplitude
                );
                this._triggerRupture(trap, forceRupture ? Math.max(0.6, forcedIntensity) : Math.max(stress, totalPressure, ruptureScore), deltaTime);
            }
        });
    }

    /**
     * Check if rupture occurred recently (cooldown)
     */
    _isRuptureRecent(trapId) {
        const lastRupture = this.ruptureOccurrences.get(trapId) || -10;
        return this.time - lastRupture < this.config.ruptureCooldownSec;
    }

    _getBurstGeometry(debugBurst = false) {
        const key = debugBurst ? 'debug' : 'standard';
        if (this._burstGeometryCache.has(key)) {
            return this._burstGeometryCache.get(key);
        }

        const geometry = debugBurst
            ? new THREE.OctahedronGeometry(0.18, 0)
            : new THREE.IcosahedronGeometry(0.3, 3);
        this._burstGeometryCache.set(key, geometry);
        return geometry;
    }

    _getPropagationGeometry() {
        const key = this.config.debugVisualBoost ? 'debug' : 'standard';
        if (this._propagationGeometryCache.has(key)) {
            return this._propagationGeometryCache.get(key);
        }

        const geometry = this.config.debugVisualBoost
            ? new THREE.OctahedronGeometry(0.18, 0)
            : new THREE.SphereGeometry(0.15, 6, 6);
        this._propagationGeometryCache.set(key, geometry);
        return geometry;
    }

    _createPropagationPulseMesh() {
        const geometry = this._getPropagationGeometry();
        const material = this.propagationMaterial.clone();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = this.config.renderOrder;
        mesh.visible = false;
        this.scene.add(mesh);
        if (!this._createdObjects.includes(mesh)) {
            this._createdObjects.push(mesh);
        }
        return mesh;
    }

    _prepareRuptureBurstMesh(rupture) {
        const burstMesh = rupture?.burstMesh;
        if (!burstMesh) return null;

        burstMesh.visible = true;
        burstMesh.renderOrder = this.config.renderOrder;

        const burstSeed = this._hashBurstSeed(
            rupture.linkId ?? rupture.trapId ?? `${this.time.toFixed(3)}:${rupture.intensity.toFixed(3)}`
        );
        burstMesh.userData.burstSpin = new THREE.Vector3(
            ((burstSeed.x * 2 - 1) * 0.42) * 0.34,
            ((burstSeed.y * 2 - 1) * 0.42) * 0.34,
            ((burstSeed.z * 2 - 1) * 0.42) * 0.28
        );
        burstMesh.userData.burstDrift = this.config.fractureBloomDriftRate || 0.26;

        if (burstMesh.userData?.fractureBloom) {
            const link = this._getLinkById(rupture.linkId);
            const startPos = link ? this._getLinkSource(link)?.position : null;
            const endPos = link ? this._getLinkTarget(link)?.position : null;
            if (startPos && endPos) {
                this._layoutFractureBloomScar(burstMesh, startPos, endPos, rupture.intensity, rupture.linkId);
            } else {
                burstMesh.position.copy(rupture.convergencePoint);
            }
            return burstMesh;
        }

        burstMesh.position.copy(rupture.convergencePoint);
        burstMesh.scale.setScalar(1);
        if (burstMesh.material) {
            burstMesh.material.opacity = this.config.debugVisualBoost ? 0.85 : 0.6;
            burstMesh.material.color.set(this.config.debugVisualBoost ? 0xff00ff : this.config.ruptureBurstColor);
        }
        return burstMesh;
    }

    /**
     * Trigger a rupture event
     */
    _triggerRupture(trap, stress, deltaTime) {
        const trapId = trap.linkId;
        
        // Acquire rupture event from pool
        const rupture = this.ruptureEventPool.find(r => !r.active);
        if (!rupture) return;
        
        // Find convergence point
        const link = this._getLinkById(trapId);
        if (!link) return;
        
        const convergencePoint = this._getLinkTarget(link)?.position;
        const rupturePoint = this._getLinkCenterPosition(link) || convergencePoint;
        if (!rupturePoint) return;
        
        // Set up rupture
        rupture.active = true;
        rupture.linkId = trapId;
        rupture.trapId = trapId;
        rupture.convergencePoint.copy(rupturePoint);
        rupture.life = 0;
        rupture.maxLife = this.config.ruptureDuration;
        rupture.intensity = Math.min(1, stress * 1.2);
        this.debugStats.ruptureTriggers += 1;
        this.debugStats.lastTrigger = {
            trapId: String(trapId),
            time: this.time,
            intensity: rupture.intensity
        };

        this._prepareRuptureBurstMesh(rupture);
        
        this.ruptures.push(rupture);
        this.ruptureOccurrences.set(trapId, this.time);
        
        // Reset stress
        this.stressAccumulation.set(trapId, 0);
        this.eventPressureByLink.set(String(trapId), 0);
        
        // Trigger node reactions
        this._triggerNodeReactions(trap.nodeA, rupture.intensity);
        this._triggerNodeReactions(trap.nodeB, rupture.intensity);

        // PATCH 1: Trigger cascading rupture if available
        if (this.cascadingRuptureSystem && trap.nodeA && this.cascadingRuptureSystem.enabled) {
            this.cascadingRuptureSystem.initiateCascade(trap.nodeA, this.time, rupture.intensity);
        }

        // Initiate propagation
        this._initiatePropagation(link, rupture.intensity);
        
        // Create resonance scar
        this._createResonanceScar(trapId, trap, rupture.intensity);

        // Emit topology rupture event for HarmonicTopologyLearningSystem
        if (this.semanticBus && rupturePoint) {
            this.semanticBus.emit('topology.rupture', {
                position: rupturePoint,
                intensity: rupture.intensity
            });
        }

        // Cascade trigger is handled above via initiateCascade() to avoid duplicate/invalid calls.
    }

    /**
     * Update pre-rupture stress indicator zones
     * DESIGN: Now renders visual stress glow on approaching-rupture links
     */
    _updatePreRuptureIndicators(deltaTime) {
        // Reset all pool items
        for (const item of this.stressIndicatorPool) {
            item.active = false;
            item.linkId = null;
            item.mesh.visible = false;
        }

        this.preRuptureZones = [];
        
        if (!this.standingWaveTrapSystem) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        
        traps.forEach(trap => {
            if (!trap.active) return;
            
            const trapId = trap.linkId;
            const stress = this.stressAccumulation.get(trapId) || 0;
            
            // Only show stress zones when stress > 50%
            if (stress > 0.5) {
                const intensity = Math.pow(stress - 0.5, 1.5);  // Sharpen at higher stress
                this.preRuptureZones.push({
                    linkId: trapId,
                    stress: stress,
                    intensity: intensity
                });

                // DESIGN: Position and activate a stress indicator mesh on this link
                const poolItem = this.stressIndicatorPool.find(item => !item.active);
                if (!poolItem) return;

                const link = this._getLinkById(trapId);
                const startPos = link ? this._getLinkSource(link)?.position : null;
                const endPos = link ? this._getLinkTarget(link)?.position : null;
                if (!startPos || !endPos) return;

                const center = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
                const linkDir = new THREE.Vector3().subVectors(endPos, startPos);
                const linkLength = linkDir.length();

                poolItem.active = true;
                poolItem.linkId = trapId;
                poolItem.mesh.visible = true;
                poolItem.mesh.position.copy(center);
                poolItem.mesh.position.y += 0.05;

                // Scale: wider and taller at higher stress
                const stressScale = 0.5 + stress * 1.5;
                poolItem.mesh.scale.set(
                    Math.max(0.5, linkLength * 0.6),
                    Math.max(0.5, linkLength * 0.6),
                    stressScale
                );

                // Orient along link (flat on ground)
                const yaw = linkDir.lengthSq() > 1e-6 ? Math.atan2(linkDir.z, linkDir.x) : 0;
                poolItem.mesh.rotation.set(-Math.PI / 2, 0, yaw);

                // Update shader uniforms
                poolItem.mesh.material.uniforms.uTime.value = this.time;
                poolItem.mesh.material.uniforms.uStress.value = stress;
                poolItem.mesh.material.uniforms.uIntensity.value = intensity;
            }
        });
    }

    /**
     * Execute active rupture events
     */
    _executeRuptureEvents(deltaTime) {
        let writeIdx = 0;
        for (let i = 0; i < this.ruptures.length; i++) {
            const rupture = this.ruptures[i];
            rupture.life += deltaTime;
            const progress = rupture.maxLife > 0 ? rupture.life / rupture.maxLife : 1;
            
            // Create visual burst
            if (rupture.burstMesh && !rupture.burstMesh.visible) {
                this._prepareRuptureBurstMesh(rupture);
            }
            
            // Update burst appearance
            if (rupture.burstMesh) {
                const scale = 1 + progress * 2;
                if (rupture.burstMesh.userData?.fractureBloom) {
                    const burstSpin = rupture.burstMesh.userData?.burstSpin;
                    if (burstSpin) {
                        rupture.burstMesh.rotation.x += (burstSpin.x || 0) * deltaTime;
                        rupture.burstMesh.rotation.y += (burstSpin.y || 0) * deltaTime;
                        rupture.burstMesh.rotation.z += (burstSpin.z || 0) * deltaTime;
                    }
                    this._setFractureBloomOpacity(rupture.burstMesh, rupture.intensity * (1 - progress));
                    rupture.burstMesh.scale.setScalar(scale);
                } else {
                    rupture.burstMesh.material.opacity = rupture.intensity * (1 - progress);
                    // For MeshBasicMaterial with additive blending, modulate color intensity
                    const colorIntensity = Math.min(1, this.config.ruptureBurstGlow * (1 - progress));
                    rupture.burstMesh.material.color.setRGB(
                        this.config.ruptureBurstColor.r * colorIntensity,
                        this.config.ruptureBurstColor.g * colorIntensity,
                        this.config.ruptureBurstColor.b * colorIntensity
                    );
                    
                    // Scale burst outward
                    rupture.burstMesh.scale.set(scale, scale, scale);
                }
            }
            
            if (rupture.life >= rupture.maxLife) {
                // FIX 1: Reset pooled burst mesh and return the rupture slot to the pool
                if (rupture.burstMesh) {
                    this._disposeBurstMesh(rupture.burstMesh);
                }
                rupture.active = false;
                continue;
            }
            
            this.ruptures[writeIdx++] = rupture;
        }
        this.ruptures.length = writeIdx;
    }

    /**
     * Create visual burst mesh for rupture
     */
    _createRuptureBurst(rupture) {
        if (this.config.debugVisualBoost || this.config.forceRuptureVfx) {
            const bloom = this._createFractureBloomScarRoot();
            bloom.renderOrder = this.config.renderOrder;
            bloom.userData.ruptureBurst = true;
            const burstSeed = this._hashBurstSeed(rupture.linkId ?? rupture.trapId ?? `${this.time.toFixed(3)}:${rupture.intensity.toFixed(3)}`);
            const driftRate = this.config.fractureBloomDriftRate || 0.26;

            // DESIGN: Orient fracture bloom along the ruptured link direction
            const link = this._getLinkById(rupture.linkId);
            const startPos = link ? this._getLinkSource(link)?.position : null;
            const endPos = link ? this._getLinkTarget(link)?.position : null;
            if (startPos && endPos) {
                this._layoutFractureBloomScar(bloom, startPos, endPos, rupture.intensity, rupture.linkId);
            } else {
                bloom.position.copy(rupture.convergencePoint);
            }

            bloom.userData.burstSpin = new THREE.Vector3(
                ((burstSeed.x * 2 - 1) * 0.42) * 0.34,
                ((burstSeed.y * 2 - 1) * 0.42) * 0.34,
                ((burstSeed.z * 2 - 1) * 0.42) * 0.28
            );
            bloom.userData.burstDrift = driftRate;
            this.scene.add(bloom);
            if (!this._createdObjects.includes(bloom)) {
                this._createdObjects.push(bloom);  // UNIFIED CLEANUP CONTRACT
            }
            return bloom;
        }

        const geometry = this._getBurstGeometry(false);
        const mesh = new THREE.Mesh(geometry, this.ruptureMaterial.clone());
        mesh.position.copy(rupture.convergencePoint);
        mesh.renderOrder = this.config.renderOrder;
        this.scene.add(mesh);
        this._createdObjects.push(mesh);  // UNIFIED CLEANUP CONTRACT
        return mesh;
    }

    /**
     * Initiate rupture propagation along network
     */
    _initiatePropagation(originLink, intensity) {
        if (!originLink || !this.linkingSystem) return;
        
        // Find adjacent links
        const targetNode = this._getLinkTarget(originLink);
        if (!targetNode) return;
        
        const adjacentLinks = this._findAdjacentLinks(targetNode, originLink);
        
        // Propagate up to maxPropagationPaths
        const pathsToPropagate = Math.min(
            this.config.propagationPaths,
            adjacentLinks.length
        );
        
        for (let i = 0; i < pathsToPropagate; i++) {
            const pulse = this.propagationPulsePool.find(p => !p.active);
            if (!pulse) break;
            
            pulse.active = true;
            pulse.startLink = adjacentLinks[i];
            pulse.currentLink = adjacentLinks[i];
            pulse.pathDistance = 0;
            pulse.life = 0;
            pulse.intensity = intensity * this.config.propagationDamping;
            if (pulse.mesh) {
                pulse.mesh.visible = true;
                pulse.mesh.renderOrder = this.config.renderOrder;
                pulse.mesh.scale.setScalar(1);
                pulse.mesh.material.opacity = pulse.intensity * 0.6;
            }
            
            this.propagationPulses.push(pulse);
            this.debugStats.propagationBursts += 1;
        }
    }

    /**
     * Find adjacent links from a node
     */
    _findAdjacentLinks(node, excludeLink) {
        if (!this.linkingSystem) return [];
        
        const links = this.linkingSystem.links || [];
        const adjacent = [];
        
        links.forEach(link => {
            if (!link || link.id === excludeLink.id) return;
            
            const sourceNode = this._getLinkSource(link);
            const targetNode = this._getLinkTarget(link);
            const sourceId = this._getNodeId(sourceNode);
            const targetId = this._getNodeId(targetNode);
            const currentNodeId = this._getNodeId(node);
            const isAdjacentSource = sourceId === currentNodeId;
            const isAdjacentTarget = targetId === currentNodeId;
            
            if (isAdjacentSource || isAdjacentTarget) {
                adjacent.push(link);
            }
        });
        
        return adjacent;
    }

    /**
     * Update rupture propagation pulses
     */
    _updateRupturePropagation(deltaTime) {
        let writeIdx = 0;
        for (let i = 0; i < this.propagationPulses.length; i++) {
            const pulse = this.propagationPulses[i];
            pulse.life += deltaTime;
            
            const propagationDuration = this.config.propagationDuration || 0.3;  // Duration of propagation per link
            const linkProgress = (pulse.life % propagationDuration) / propagationDuration;
            
            // Advance to next link if progress exceeds threshold
            if (pulse.life > propagationDuration * (pulse.pathDistance + 1)) {
                const nextNode = this._getLinkTarget(pulse.currentLink);
                const nextLinks = this._findAdjacentLinks(nextNode, pulse.currentLink);
                
                if (nextLinks.length > 0 && pulse.pathDistance < this.config.propagationDistance) {
                    pulse.currentLink = nextLinks[0];
                    pulse.pathDistance++;
                    pulse.intensity *= this.config.propagationDamping;
                } else {
                    this._disposePropagationPulse(pulse);
                    continue;
                }
            }

            // FIX 2: Update pulse mesh position along current link
            if (pulse.mesh) {
                const src = this._getLinkSource(pulse.currentLink)?.position;
                const tgt = this._getLinkTarget(pulse.currentLink)?.position;
                if (src && tgt) {
                    pulse.mesh.position.lerpVectors(src, tgt, linkProgress);
                }
                pulse.mesh.material.opacity = pulse.intensity * 0.6;
            }

            if (pulse.life >= propagationDuration * this.config.propagationDistance) {
                // FIX 4: Reset pool item and remove mesh
                this._disposePropagationPulse(pulse);
                continue;
            }
            
            this.propagationPulses[writeIdx++] = pulse;
        }
        this.propagationPulses.length = writeIdx;
    }

    _disposePropagationPulse(pulse) {
        if (pulse.mesh) {
            pulse.mesh.visible = false;
            pulse.mesh.position.set(0, 0, 0);
            pulse.mesh.scale.setScalar(1);
            if (pulse.mesh.material) {
                pulse.mesh.material.opacity = 0;
            }
        }
        pulse.active = false;
        pulse.startLink = null;
        pulse.currentLink = null;
        pulse.pathDistance = 0;
        pulse.life = 0;
        pulse.intensity = 0;
    }

    _disposeBurstMesh(mesh) {
        if (!mesh) return;
        mesh.visible = false;
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.setScalar(1);
        if (mesh.userData?.fractureBloom) {
            this._setFractureBloomOpacity(mesh, 0);
            return;
        }
        if (mesh.material) {
            mesh.material.opacity = 0;
        }
    }

    _getScarParticleTexture() {
        if (this._scarParticleTexture) return this._scarParticleTexture;
        const canvas = (typeof document !== 'undefined')
            ? document.createElement('canvas')
            : null;
        if (!canvas) return null;

        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
        gradient.addColorStop(0.0, 'rgba(255,255,240,1.0)');
        gradient.addColorStop(0.18, 'rgba(255,160,100,0.95)');
        gradient.addColorStop(0.42, 'rgba(220,40,35,0.68)');
        gradient.addColorStop(0.72, 'rgba(120,10,22,0.25)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0.0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this._scarParticleTexture = texture;
        return texture;
    }

    _createScarParticleBurstRoot() {
        const root = new THREE.Points();
        root.renderOrder = this.config.renderOrder + 1;
        root.frustumCulled = false;
        root.userData.particleScar = true;
        root.userData.pointCloud = true;
        root.userData.particles = [];
        root.userData.tempPos = new THREE.Vector3();
        root.userData.tempRight = new THREE.Vector3();
        root.userData.tempUp = new THREE.Vector3();
        root.userData.tempForward = new THREE.Vector3();
        root.userData.baseOpacity = this.config.debugVisualBoost ? 0.90 : 0.76;
        root.userData.particleCount = this.config.debugVisualBoost ? 32 : 24;
        root.userData.sizeScale = this.config.debugVisualBoost ? 176.0 : 144.0;
        root.userData.texture = this._getScarParticleTexture();

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(root.userData.particleCount * 3);
        const colors = new Float32Array(root.userData.particleCount * 3);
        const sizes = new Float32Array(root.userData.particleCount);
        const alphas = new Float32Array(root.userData.particleCount);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
        geometry.setDrawRange(0, root.userData.particleCount);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uMap: { value: root.userData.texture },
                uOpacity: { value: root.userData.baseOpacity },
                uSizeScale: { value: root.userData.sizeScale }
            },
            vertexShader: `
                attribute vec3 aColor;
                attribute float aSize;
                attribute float aAlpha;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uSizeScale;
                void main() {
                    vColor = aColor;
                    vAlpha = aAlpha;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    float distScale = max(0.45, -mvPosition.z);
                    gl_PointSize = aSize * uSizeScale / distScale;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D uMap;
                uniform float uOpacity;
                varying vec3 vColor;
                varying float vAlpha;
                void main() {
                    vec4 tex = texture2D(uMap, gl_PointCoord);
                    float alpha = tex.a * vAlpha * uOpacity;
                    if (alpha < 0.02) discard;
                    vec3 color = vColor * tex.rgb;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.NormalBlending,
            vertexColors: true,
            toneMapped: false
        });

        root.geometry = geometry;
        root.material = material;

        const tierSpecs = [
            { count: 4, size: 5.6, color: [1.0, 0.96, 0.90], opacity: 1.0, rise: 0.12, spread: 0.05, velocity: 0.10, jitter: 0.02 },
            { count: 10, size: 3.8, color: [1.0, 0.42, 0.14], opacity: 0.92, rise: 0.18, spread: 0.10, velocity: 0.14, jitter: 0.03 },
            { count: 10, size: 2.8, color: [0.58, 0.09, 0.15], opacity: 0.82, rise: 0.28, spread: 0.16, velocity: 0.18, jitter: 0.04 },
            { count: 8, size: 2.0, color: [0.34, 0.03, 0.08], opacity: 0.66, rise: 0.36, spread: 0.22, velocity: 0.22, jitter: 0.05 }
        ];

        let index = 0;
        for (const tier of tierSpecs) {
            for (let i = 0; i < tier.count && index < root.userData.particleCount; i++, index++) {
                const angle = (index / root.userData.particleCount) * Math.PI * 2 + Math.random() * 0.8;
                const ringRadius = tier.spread + Math.random() * (tier.spread * 0.8);
                const radial = Math.cos(angle) * ringRadius;
                const lateral = (Math.random() - 0.35) * (tier.spread * 0.75);
                const depth = Math.sin(angle) * ringRadius;
                root.userData.particles.push({
                    offset: new THREE.Vector3(radial, lateral, depth),
                    velocity: new THREE.Vector3(
                        Math.cos(angle) * tier.velocity + (Math.random() - 0.5) * tier.jitter,
                        tier.rise + Math.random() * (tier.rise * 0.65),
                        Math.sin(angle) * tier.velocity + (Math.random() - 0.5) * tier.jitter
                    ),
                    color: new THREE.Color().setRGB(tier.color[0], tier.color[1], tier.color[2]),
                    size: tier.size + Math.random() * 0.8,
                    alpha: tier.opacity,
                    flutter: 0.007 + Math.random() * 0.022,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        this.scene.add(root);
        this._createdObjects.push(root);  // UNIFIED CLEANUP CONTRACT
        return root;
    }

    /**
     * Create resonance scar on affected link
     */
    _createResonanceScar(linkId, trap, intensity) {
        const link = this._getLinkById(linkId);
        if (!link) return;
        
        // Acquire scar mesh from pool
        const scarMesh = this.scarMeshPool.find(s => !s.active);
        if (!scarMesh) return;
        
        scarMesh.active = true;
        scarMesh.birthTime = this.time;
        scarMesh.mesh.visible = true;
        
        // Position scar at link center
        const startPos = this._getLinkSource(link)?.position;
        const endPos = this._getLinkTarget(link)?.position;
        
        if (startPos && endPos) {
            const scarCenter = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
            scarMesh.mesh.position.copy(scarCenter);

            if (scarMesh.mesh.userData?.particleScar) {
                this._layoutScarParticleBurst(scarMesh.mesh, startPos, endPos, intensity, linkId);
            } else {
                // Orient along link
                scarMesh.mesh.lookAt(endPos);
                scarMesh.mesh.rotateX(Math.PI * 0.5);

                // Scale to link length with proper world-space dimensions
                const linkLength = startPos.distanceTo(endPos);
                // X = width along link, Y = thickness (perpendicular), Z = height
                scarMesh.mesh.scale.set(Math.max(1, linkLength * 0.8), Math.max(0.5, linkLength * 0.1), 1);
            }
        }
        
        this.resonanceScars.push({
            mesh: scarMesh,
            linkId: linkId,
            intensity: intensity,
            birthTime: this.time
        });
        this.debugStats.scarSpawns += 1;
    }

    /**
     * Update resonance scars (fade over time)
     */
    _updateResonanceScars(deltaTime) {
        this.resonanceScars = this.resonanceScars.filter(scar => {
            const age = this.time - scar.birthTime;
            const progress = age / this.config.scarDuration;
            
            if (progress >= 1) {
                scar.mesh.active = false;
                scar.mesh.mesh.visible = false;
                return false;
            }
            
            // Fade scar
            const opacity = this.config.debugVisualBoost
                ? Math.max(0.16, scar.intensity * (1 - progress) * 0.72)
                : this.config.scarOpacity * scar.intensity * (1 - progress);
            if (scar.mesh.mesh.userData?.particleScar) {
                this._updateScarParticleBurst(scar.mesh.mesh, scar, deltaTime);
                this._setScarParticleOpacity(scar.mesh.mesh, opacity);
            } else if (scar.mesh.mesh.material) {
                scar.mesh.mesh.material.opacity = opacity;
            }
            
            return true;
        });
    }

    /**
     * Trigger node halo reaction
     */
    _triggerNodeReactions(node, intensity) {
        const nodeId = this._getNodeId(node);
        if (!node || nodeId === undefined || nodeId === null) return;
        
        const existing = this.nodeReactions.get(nodeId);
        
        if (existing) {
            existing.intensity = Math.max(existing.intensity, intensity);
            existing.startTime = this.time;
        } else {
            this.nodeReactions.set(nodeId, {
                node: node,
                startTime: this.time,
                intensity: intensity,
                phase: 0
            });
        }
    }

    /**
     * Update node halo reactions
     */
    _updateNodeReactions(deltaTime) {
        this.nodeReactions.forEach((reaction, nodeId) => {
            const elapsed = this.time - reaction.startTime;
            const progress = elapsed / this.config.haloDestabilizationDuration;
            
            if (progress >= 1) {
                const finishedShell = reaction.node?.shell || reaction.node?.holoShell || reaction.node?.userData?.holoShell || null;
                const finishedMaterial = finishedShell?.material;
                if (finishedMaterial?.userData?.__ruptureBaseOpacity !== undefined) {
                    finishedMaterial.opacity = finishedMaterial.userData.__ruptureBaseOpacity;
                }
                this.nodeReactions.delete(nodeId);
                return;
            }
            
            // Apply destabilization to node
            if (reaction.node) {
                const shell = reaction.node.shell || reaction.node.holoShell || reaction.node.userData?.holoShell || null;
                const material = shell?.material;
                if (material) {
                    // Destabilize with jitter
                    const jitter = Math.sin(this.time * 8) * this.config.haloDestabilizationAmount;
                    const recovery = 1 - progress * this.config.haloRecoveryRate;

                    material.userData ??= {};
                    if (material.userData.__ruptureBaseOpacity === undefined) {
                        material.userData.__ruptureBaseOpacity = Number.isFinite(material.opacity)
                            ? material.opacity
                            : 0.15;
                    }

                    material.opacity = THREE.MathUtils.clamp(
                        material.userData.__ruptureBaseOpacity + jitter * recovery,
                        0,
                        1
                    );
                }
            }
        });
    }

    _createFractureBloomScarRoot() {
        const root = new THREE.Group();
        root.renderOrder = this.config.renderOrder;
        root.userData.fractureBloom = true;
        root.userData.shards = [];
        root.userData.extraShards = [];

        const shardSpecs = [
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.06,
                    shoulderWidth: 0.22,
                    baseWidth: 0.42,
                    topThickness: 0.04,
                    shoulderThickness: 0.16,
                    baseThickness: 0.24,
                    topY: 0.94,
                    midY: 0.10,
                    baseY: -0.96,
                    skewX: 0.03,
                    skewZ: -0.04,
                    twist: 0.32
                }),
                color: 0xffffff,
                opacity: 0.98,
                blending: THREE.NormalBlending,
                pos: [0.0, 0.0, 0.0],
                rot: [0.02, 0.0, 0.0],
                scale: [0.52, 1.16, 0.46]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.05,
                    shoulderWidth: 0.18,
                    baseWidth: 0.34,
                    topThickness: 0.03,
                    shoulderThickness: 0.14,
                    baseThickness: 0.20,
                    topY: 0.88,
                    midY: 0.06,
                    baseY: -0.90,
                    skewX: -0.02,
                    skewZ: 0.05,
                    twist: -0.28
                }),
                color: 0x00ffff,
                opacity: 0.88,
                blending: THREE.AdditiveBlending,
                pos: [0.0, 0.0, 0.0],
                rot: [0.0, 0.0, Math.PI * 0.43],
                scale: [0.44, 1.02, 0.38]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.05,
                    shoulderWidth: 0.16,
                    baseWidth: 0.31,
                    topThickness: 0.035,
                    shoulderThickness: 0.12,
                    baseThickness: 0.18,
                    topY: 0.84,
                    midY: 0.04,
                    baseY: -0.84,
                    skewX: 0.04,
                    skewZ: 0.03,
                    twist: 0.46
                }),
                color: 0xff00ff,
                opacity: 0.86,
                blending: THREE.AdditiveBlending,
                pos: [0.0, 0.0, 0.0],
                rot: [Math.PI * 0.54, 0.0, 0.0],
                scale: [0.38, 0.90, 0.34]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.04,
                    shoulderWidth: 0.15,
                    baseWidth: 0.29,
                    topThickness: 0.02,
                    shoulderThickness: 0.10,
                    baseThickness: 0.16,
                    topY: 0.76,
                    midY: 0.00,
                    baseY: -0.86,
                    skewX: 0.10,
                    skewZ: -0.02,
                    twist: 0.14
                }),
                color: 0xffffff,
                opacity: 0.94,
                blending: THREE.NormalBlending,
                pos: [0.40, 0.24, 0.12],
                rot: [0.42, 0.12, 1.18],
                scale: [0.58, 1.32, 0.42]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.04,
                    shoulderWidth: 0.14,
                    baseWidth: 0.27,
                    topThickness: 0.02,
                    shoulderThickness: 0.10,
                    baseThickness: 0.16,
                    topY: 0.74,
                    midY: -0.02,
                    baseY: -0.84,
                    skewX: -0.12,
                    skewZ: 0.02,
                    twist: -0.16
                }),
                color: 0x66f7ff,
                opacity: 0.88,
                blending: THREE.NormalBlending,
                pos: [-0.42, -0.20, -0.14],
                rot: [-0.36, -0.14, -1.42],
                scale: [0.54, 1.18, 0.40]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.035,
                    shoulderWidth: 0.13,
                    baseWidth: 0.25,
                    topThickness: 0.02,
                    shoulderThickness: 0.09,
                    baseThickness: 0.14,
                    topY: 0.70,
                    midY: -0.05,
                    baseY: -0.78,
                    skewX: 0.06,
                    skewZ: 0.10,
                    twist: 0.52
                }),
                color: 0xff66cc,
                opacity: 0.82,
                blending: THREE.AdditiveBlending,
                pos: [0.20, -0.34, 0.24],
                rot: [0.18, 0.26, 2.02],
                scale: [0.50, 1.06, 0.36]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.035,
                    shoulderWidth: 0.11,
                    baseWidth: 0.24,
                    topThickness: 0.02,
                    shoulderThickness: 0.08,
                    baseThickness: 0.13,
                    topY: 0.68,
                    midY: -0.06,
                    baseY: -0.76,
                    skewX: -0.08,
                    skewZ: -0.06,
                    twist: -0.38
                }),
                color: 0x00d6ff,
                opacity: 0.78,
                blending: THREE.AdditiveBlending,
                pos: [-0.22, 0.34, 0.18],
                rot: [-0.24, 0.12, -2.10],
                scale: [0.48, 0.98, 0.34]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.03,
                    shoulderWidth: 0.10,
                    baseWidth: 0.20,
                    topThickness: 0.02,
                    shoulderThickness: 0.08,
                    baseThickness: 0.12,
                    topY: 0.62,
                    midY: -0.08,
                    baseY: -0.72,
                    skewX: 0.09,
                    skewZ: -0.01,
                    twist: 0.26
                }),
                color: 0xffffff,
                opacity: 0.76,
                blending: THREE.NormalBlending,
                pos: [0.54, 0.08, -0.10],
                rot: [0.86, 0.18, 0.62],
                scale: [0.42, 0.86, 0.30]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.03,
                    shoulderWidth: 0.09,
                    baseWidth: 0.18,
                    topThickness: 0.02,
                    shoulderThickness: 0.07,
                    baseThickness: 0.10,
                    topY: 0.60,
                    midY: -0.08,
                    baseY: -0.68,
                    skewX: -0.10,
                    skewZ: 0.03,
                    twist: -0.30
                }),
                color: 0xb066ff,
                opacity: 0.74,
                blending: THREE.NormalBlending,
                pos: [-0.50, 0.02, 0.16],
                rot: [-0.90, -0.16, -0.94],
                scale: [0.38, 0.80, 0.28]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.025,
                    shoulderWidth: 0.08,
                    baseWidth: 0.16,
                    topThickness: 0.015,
                    shoulderThickness: 0.06,
                    baseThickness: 0.10,
                    topY: 0.58,
                    midY: -0.10,
                    baseY: -0.66,
                    skewX: 0.04,
                    skewZ: 0.07,
                    twist: 0.58
                }),
                color: 0x00ffff,
                opacity: 0.80,
                blending: THREE.AdditiveBlending,
                pos: [0.10, 0.52, -0.06],
                rot: [0.22, 0.30, 1.76],
                scale: [0.34, 0.92, 0.26]
            },
            {
                geometry: this._createFractureShardGeometry({
                    topWidth: 0.025,
                    shoulderWidth: 0.08,
                    baseWidth: 0.16,
                    topThickness: 0.015,
                    shoulderThickness: 0.06,
                    baseThickness: 0.10,
                    topY: 0.56,
                    midY: -0.10,
                    baseY: -0.64,
                    skewX: -0.04,
                    skewZ: -0.07,
                    twist: -0.60
                }),
                color: 0xff00ff,
                opacity: 0.78,
                blending: THREE.AdditiveBlending,
                pos: [-0.10, -0.50, 0.06],
                rot: [-0.28, -0.18, -2.22],
                scale: [0.32, 0.90, 0.26]
            }
        ];

        shardSpecs.forEach((spec, index) => {
            const material = this.scarMaterial.clone();
            material.color = new THREE.Color(spec.color);
            material.opacity = this.config.debugVisualBoost ? spec.opacity : this.config.scarOpacity;
            material.transparent = true;
            material.depthWrite = false;
            material.blending = spec.blending ?? THREE.AdditiveBlending;

            const shard = new THREE.Mesh(spec.geometry, material);
            shard.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
            shard.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
            shard.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
            shard.renderOrder = this.config.renderOrder;
            root.add(shard);
            root.userData.shards.push(shard);
        });

        const extraShardCount = Math.max(0, this.config.fractureBloomExtraShardCount ?? 0);
        for (let i = 0; i < extraShardCount; i++) {
            const extraSeed = this._hashBurstSeed(`fracture-bloom-extra:${i}`);
            const extraMaterial = this.scarMaterial.clone();
            extraMaterial.color = new THREE.Color().setHSL(
                0.02 + extraSeed.x * 0.12,
                0.85,
                0.60 + extraSeed.y * 0.16
            );
            extraMaterial.opacity = this.config.debugVisualBoost ? 0.62 + extraSeed.z * 0.24 : this.config.scarOpacity * 0.85;
            extraMaterial.transparent = true;
            extraMaterial.depthWrite = false;
            extraMaterial.blending = extraSeed.x > 0.55 ? THREE.AdditiveBlending : THREE.NormalBlending;

            const extraShard = new THREE.Mesh(
                this._createFractureShardGeometry({
                    topWidth: 0.025 + extraSeed.x * 0.01,
                    shoulderWidth: 0.08 + extraSeed.y * 0.03,
                    baseWidth: 0.16 + extraSeed.z * 0.05,
                    topThickness: 0.015 + extraSeed.y * 0.005,
                    shoulderThickness: 0.06 + extraSeed.z * 0.02,
                    baseThickness: 0.10 + extraSeed.x * 0.03,
                    topY: 0.58 + extraSeed.x * 0.12,
                    midY: -0.10 + extraSeed.y * 0.05,
                    baseY: -0.66 - extraSeed.z * 0.08,
                    skewX: (extraSeed.x - 0.5) * 0.18,
                    skewZ: (extraSeed.z - 0.5) * 0.18,
                    twist: (extraSeed.y - 0.5) * 0.9
                }),
                extraMaterial
            );
            extraShard.renderOrder = this.config.renderOrder;
            extraShard.userData.extraShard = true;
            root.add(extraShard);
            root.userData.shards.push(extraShard);
            root.userData.extraShards.push(extraShard);
        }

        this.scene.add(root);
        this._createdObjects.push(root);  // UNIFIED CLEANUP CONTRACT
        return root;
    }

    _layoutScarParticleBurst(root, startPos, endPos, intensity, seed = 0) {
        if (!root || !startPos || !endPos) return;
        const center = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        const linkVector = new THREE.Vector3().subVectors(endPos, startPos);
        const linkLength = linkVector.length();
        if (linkLength <= 0) return;

        root.position.copy(center);
        root.position.y += 0.09 + intensity * 0.05;
        root.userData.linkId = seed !== undefined && seed !== null ? String(seed) : root.userData.linkId;
        root.userData.birthTime = this.time;
        root.userData.intensity = intensity;
        root.userData.linkLength = linkLength;
        root.userData.center = center;
        root.visible = true;
        this._updateScarParticleBurst(root, {
            linkId: root.userData.linkId,
            birthTime: this.time,
            intensity
        }, 0);
    }

    _updateScarParticleBurst(root, scar, deltaTime) {
        if (!root || !scar) return;
        const particles = root.userData?.particles || [];
        const geometry = root.geometry;
        const positionAttr = geometry?.attributes?.position;
        const colorAttr = geometry?.attributes?.aColor;
        const sizeAttr = geometry?.attributes?.aSize;
        const alphaAttr = geometry?.attributes?.aAlpha;
        if (!positionAttr || !colorAttr || !sizeAttr || !alphaAttr || particles.length === 0) return;

        const link = this._getLinkById(scar.linkId);
        const startPos = this._getLinkSource(link)?.position;
        const endPos = this._getLinkTarget(link)?.position;
        const center = root.userData?.center || new THREE.Vector3();
        if (startPos && endPos) {
            center.copy(startPos).add(endPos).multiplyScalar(0.5);
            root.userData.center = center;
            root.position.copy(center);
            root.position.y += 0.09 + (scar.intensity || 1) * 0.05;
        }

        const age = Math.max(0, this.time - (scar.birthTime || this.time));
        const progress = this.config.scarDuration > 0
            ? THREE.MathUtils.clamp(age / this.config.scarDuration, 0, 1)
            : 1;
        const intensity = THREE.MathUtils.clamp(scar.intensity || 1, 0.1, 2.0);
        const rise = 0.18 + intensity * 0.16;
        const tempPos = root.userData.tempPos;
        const tempRight = root.userData.tempRight;
        const tempUp = root.userData.tempUp;
        const tempForward = root.userData.tempForward;
        const forward = new THREE.Vector3(0, 0, 1);
        const referenceUp = Math.abs(forward.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(forward, referenceUp).normalize();
        const up = new THREE.Vector3().crossVectors(right, forward).normalize();
        const positionArray = positionAttr.array;
        const colorArray = colorAttr.array;
        const sizeArray = sizeAttr.array;
        const alphaArray = alphaAttr.array;

        particles.forEach((particle, index) => {
            const phase = Number.isFinite(particle.phase) ? particle.phase : 0;
            const drift = particle.offset.clone().addScaledVector(particle.velocity, age);
            const pulse = Math.sin(age * (particle.flutter * 80 + 2.4) + phase);
            const lift = age * rise + pulse * (0.03 + intensity * 0.015);
            const lateral = pulse * (0.015 + particle.size * 0.0025);
            const spiral = Math.cos(age * (particle.flutter * 55 + 1.8) + phase) * 0.02;

            tempRight.copy(right).multiplyScalar(drift.x + lateral);
            tempUp.copy(up).multiplyScalar(drift.y + lift);
            tempForward.copy(forward).multiplyScalar(drift.z + spiral);
            tempPos.copy(center).add(tempRight).add(tempUp).add(tempForward);

            const base = index < 4 ? 1.25 : index < 14 ? 1.0 : 0.82;
            const scale = Math.max(0.45, particle.size * (1 + Math.min(age * 0.06, 0.9)) * (1 - progress * 0.38) * base);
            positionArray[index * 3 + 0] = tempPos.x - center.x;
            positionArray[index * 3 + 1] = tempPos.y - center.y;
            positionArray[index * 3 + 2] = tempPos.z - center.z;
            colorArray[index * 3 + 0] = particle.color.r * (0.84 + intensity * 0.08);
            colorArray[index * 3 + 1] = particle.color.g * (0.84 + intensity * 0.08);
            colorArray[index * 3 + 2] = particle.color.b * (0.84 + intensity * 0.08);
            sizeArray[index] = scale;
            alphaArray[index] = THREE.MathUtils.clamp(
                particle.alpha * (1 - progress) * (index < 4 ? 1.0 : 0.82),
                0.06,
                1
            );
        });

        positionAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
        alphaAttr.needsUpdate = true;
        if (root.material?.uniforms?.uOpacity) {
            root.material.uniforms.uOpacity.value = this.config.debugVisualBoost
                ? Math.max(0.20, intensity * (1 - progress) * 0.70)
                : Math.max(0.14, intensity * (1 - progress) * 0.55);
        }
        root.visible = true;
    }

    _setScarParticleOpacity(root, opacity) {
        if (!root) return;
        if (!root.material?.uniforms?.uOpacity) return;
        root.material.uniforms.uOpacity.value = THREE.MathUtils.clamp(opacity, 0, 1);
    }

    _createFractureShardGeometry(options = {}) {
        const topWidth = options.topWidth ?? 0.04;
        const shoulderWidth = options.shoulderWidth ?? 0.14;
        const baseWidth = options.baseWidth ?? 0.26;
        const topThickness = options.topThickness ?? 0.02;
        const shoulderThickness = options.shoulderThickness ?? 0.08;
        const baseThickness = options.baseThickness ?? 0.14;
        const topY = options.topY ?? 0.8;
        const midY = options.midY ?? 0.0;
        const baseY = options.baseY ?? -0.8;
        const skewX = options.skewX ?? 0;
        const skewZ = options.skewZ ?? 0;
        const twist = options.twist ?? 0;

        const buildSlice = (radius, thickness, y, twistWeight) => {
            const rotation = twist * twistWeight;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const raw = [
                [-radius * 0.90, y, thickness * 0.22],
                [radius * 0.24, y, -thickness * 0.88],
                [radius * 0.72, y, thickness * 0.36]
            ];

            return raw.map(([x, sy, z]) => {
                const rx = x * cos - z * sin;
                const rz = x * sin + z * cos;
                return [
                    rx + skewX * sy,
                    sy,
                    rz + skewZ * sy
                ];
            });
        };

        const top = buildSlice(topWidth, topThickness, topY, 0.05);
        const mid = buildSlice(shoulderWidth, shoulderThickness, midY, 0.5);
        const base = buildSlice(baseWidth, baseThickness, baseY, 1.0);

        const positions = [
            ...top[0], ...top[1], ...top[2],
            ...mid[0], ...mid[1], ...mid[2],
            ...base[0], ...base[1], ...base[2]
        ];

        const indices = [
            0, 1, 2,
            3, 5, 4,
            6, 7, 8,
            0, 1, 4, 0, 4, 3,
            1, 2, 5, 1, 5, 4,
            2, 0, 3, 2, 3, 5,
            3, 4, 7, 3, 7, 6,
            4, 5, 8, 4, 8, 7,
            5, 3, 6, 5, 6, 8
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        return geometry;
    }

    _hashBurstSeed(seed = '') {
        const text = String(seed);
        let hash = 2166136261;
        for (let i = 0; i < text.length; i += 1) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }

        const base = hash >>> 0;
        return {
            x: ((base & 0xff) / 255),
            y: (((base >>> 8) & 0xff) / 255),
            z: (((base >>> 16) & 0xff) / 255)
        };
    }

    _layoutFractureBloomScar(root, startPos, endPos, intensity, seed = 0) {
        if (!root) return;

        const center = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        const linkVector = new THREE.Vector3().subVectors(endPos, startPos);
        const linkLength = linkVector.length();
        if (linkLength <= 0) return;

        const forward = linkVector.clone().normalize();
        const referenceUp = Math.abs(forward.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(forward, referenceUp).normalize();
        const up = new THREE.Vector3().crossVectors(right, forward).normalize();
        const seedValue = Number(seed || 0);
        const swirl = (Math.sin(this.time * 7.0 + seedValue * 0.017) * 0.5 + 0.5);
        const spread = Math.max(0.82, linkLength * 0.30);
        const axialScale = Math.max(0.86, linkLength * 0.16);
        const burstSeed = this._hashBurstSeed(`${seedValue}|${Math.floor(this.time * 1000)}|${Math.floor(intensity * 1000)}`);
        const twist = (burstSeed.x - 0.5) * 0.52;
        const pitch = (burstSeed.y - 0.5) * 0.30;
        const yaw = (burstSeed.z - 0.5) * 0.30;

        root.position.copy(center);
        root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);
        root.rotateOnAxis(new THREE.Vector3(0, 1, 0), twist);
        root.rotateOnAxis(new THREE.Vector3(1, 0, 0), pitch);
        root.rotateOnAxis(new THREE.Vector3(0, 0, 1), yaw);
        root.scale.set(
            Math.max(0.70, linkLength * 0.16),
            axialScale,
            Math.max(0.70, linkLength * 0.16)
        );
        root.userData.burstSpin = new THREE.Vector3(pitch * 0.22, yaw * 0.22, twist * 0.18);

        const shards = root.userData?.shards || [];
        shards.forEach((shard, index) => {
            const angle = (index / Math.max(1, shards.length)) * Math.PI * 2 + swirl * Math.PI * 1.35;
            const radius = spread * (0.52 + (index % 4) * 0.14);
            const depth = (index % 3 - 1) * 0.28;
            const lift = (index - (shards.length - 1) * 0.5) * 0.082;
            const offset = new THREE.Vector3()
                .addScaledVector(right, Math.cos(angle) * radius)
                .addScaledVector(up, Math.sin(angle) * radius * 0.88)
                .addScaledVector(forward, lift + depth * 0.42);
            shard.position.copy(offset);
            shard.rotation.x = (index % 3 - 1) * 0.55 + swirl * 0.24;
            shard.rotation.y = angle * 0.44 + (index % 2 === 0 ? 0.58 : -0.50);
            shard.rotation.z = angle + (index % 2 === 0 ? 0.92 : -1.02);
            shard.scale.set(
                0.96 + intensity * 0.68 + (index % 3) * 0.08,
                1.10 + swirl * 0.72 + intensity * 0.42 + (index % 4) * 0.05,
                0.82 + intensity * 0.28 + (index % 2) * 0.08
            );

            if (index < 3) {
                shard.scale.y *= 1.18 + intensity * 0.14;
                shard.scale.x *= 0.90;
                shard.scale.z *= 0.90;
            }

            if (index >= 7) {
                shard.scale.multiplyScalar(0.80 + intensity * 0.10);
            }
        });

        const extraShards = root.userData?.extraShards || [];
        const extraShardCount = extraShards.length;
        extraShards.forEach((extraShard, i) => {
            const extraSeed = this._hashBurstSeed(`${seedValue}:extra:${i}`);
            const ringAngle = (i / Math.max(1, extraShardCount)) * Math.PI * 2 + swirl * Math.PI * 1.75;
            const ringRadius = spread * (0.68 + extraSeed.x * 0.46);
            extraShard.position.copy(
                new THREE.Vector3()
                    .addScaledVector(right, Math.cos(ringAngle) * ringRadius)
                    .addScaledVector(up, Math.sin(ringAngle) * ringRadius * 0.92)
                    .addScaledVector(forward, (extraSeed.y - 0.5) * 0.42)
            );
            extraShard.rotation.set(
                (extraSeed.x - 0.5) * 1.6,
                (extraSeed.y - 0.5) * 1.2,
                (extraSeed.z - 0.5) * 2.4
            );
            extraShard.scale.set(
                0.24 + extraSeed.x * 0.18,
                0.58 + extraSeed.y * 0.42,
                0.18 + extraSeed.z * 0.16
            );
            if (extraShard.material) {
                extraShard.material.opacity = this.config.debugVisualBoost ? 0.62 + extraSeed.z * 0.24 : this.config.scarOpacity * 0.85;
                extraShard.material.transparent = true;
                extraShard.material.depthWrite = false;
                extraShard.material.blending = extraSeed.x > 0.55 ? THREE.AdditiveBlending : THREE.NormalBlending;
            }
        });

        root.visible = true;
    }

    _setFractureBloomOpacity(root, opacity) {
        if (!root) return;
        const clamped = THREE.MathUtils.clamp(opacity, 0, 1);
        const shards = root.userData?.shards || [];
        shards.forEach((shard, index) => {
            if (shard?.material) {
                const alpha = clamped * (0.66 + (index % 4) * 0.08);
                shard.material.opacity = alpha;
            }
        });
    }

    /**
     * Modulate rupture visuals by network state
     */
    _modulateByNetworkState(deltaTime) {
        if (!this.aiNodes) return;
        
        const nodes = Array.isArray(this.aiNodes) ? this.aiNodes :
                      this.aiNodes.nodes ? this.aiNodes.nodes :
                      Object.values(this.aiNodes);
        
        // Calculate network averages
        let avgHarmony = 0, avgCorruption = 0, avgSynergy = 0;
        let nodeCount = 0;
        
        nodes.forEach(node => {
            if (!node) return;
            avgHarmony += this._readNodeMetric(node, 'harmony', 0.5);
            avgCorruption += this._readNodeMetric(node, 'corruption', 0.5);
            avgSynergy += this._readNodeMetric(node, 'synergy', 0.5);
            nodeCount++;
        });
        
        if (nodeCount > 0) {
            avgHarmony /= nodeCount;
            avgCorruption /= nodeCount;
            avgSynergy /= nodeCount;
        }
        
        // Modulate active ruptures
        this.ruptures.forEach(rupture => {
            if (!rupture.burstMesh) return;
            
            // Harmony weakens rupture visibility
            const harmonyFactor = 1 - avgHarmony * this.config.harmonyRupturePrevention;
            
            // Corruption strengthens rupture
            const corruptionFactor = 1 + avgCorruption * this.config.corruptionRuptureAcceleration;
            
            // Synergy clarifies rupture appearance
            const synergyFactor = 1 + avgSynergy * this.config.synergyRuptureClarity;
            
            const modulation = harmonyFactor * corruptionFactor * synergyFactor;
            const progress = rupture.maxLife > 0 ? THREE.MathUtils.clamp(rupture.life / rupture.maxLife, 0, 1) : 0;
            if (rupture.burstMesh.userData?.fractureBloom) {
                this._setFractureBloomOpacity(rupture.burstMesh, rupture.intensity * (1 - progress) * modulation);
            } else {
                // For MeshBasicMaterial with additive blending, modulate color intensity
                const baseColor = this.config.ruptureBurstColor;
                const currentIntensity = rupture.burstMesh.material.opacity;
                const colorIntensity = Math.min(1, currentIntensity * modulation);
                rupture.burstMesh.material.color.setRGB(
                    baseColor.r * colorIntensity,
                    baseColor.g * colorIntensity,
                    baseColor.b * colorIntensity
                );
            }
        });
        
        // Modulate scars — opacity is managed by _updateResonanceScars; skip per-frame multiplication here
    }

    getDebugStats() {
        return {
            ...this.debugStats,
            activeRuptures: this.ruptures.length,
            activePropagationPulses: this.propagationPulses.length,
            activeScars: this.resonanceScars.length
        };
    }

    setForceRuptureVfx(enabled = true) {
        this.config.forceRuptureVfx = enabled === true;
        return this.config.forceRuptureVfx;
    }

    /**
     * Get link by ID (helper)
     */
    _getLinkById(linkId) {
        if (!this.linkingSystem || !this.linkingSystem.links) return null;
        return this.linkingSystem.links.find(l => l && l.id === linkId);
    }

    _getNodeId(node) {
        return node?.id ?? node?.userData?.nodeId ?? node?.userData?.id;
    }

    _getLinkSource(link) {
        return link?.source ?? link?.sourceNode ?? link?.from ?? link?.nodeA ?? null;
    }

    _getLinkTarget(link) {
        return link?.target ?? link?.targetNode ?? link?.to ?? link?.nodeB ?? null;
    }

    _getLinkCenterPosition(link) {
        const sourcePosition = this._getLinkSource(link)?.position;
        const targetPosition = this._getLinkTarget(link)?.position;

        if (!sourcePosition || !targetPosition) return null;

        return new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5);
    }

    _normalizePhase(phase = 0) {
        const fullTurn = Math.PI * 2;
        const normalized = phase % fullTurn;
        return normalized < 0 ? normalized + fullTurn : normalized;
    }

    _calculateTrapPhaseDivergence(trapId, phase) {
        const normalizedPhase = this._normalizePhase(phase);
        const previousState = this.trapPhaseDivergence.get(trapId);
        const previousPhase = typeof previousState?.lastPhase === 'number'
            ? previousState.lastPhase
            : null;

        let divergence = 0;
        if (previousPhase !== null) {
            const delta = Math.abs(normalizedPhase - previousPhase);
            const wrappedDelta = Math.min(delta, (Math.PI * 2) - delta);
            divergence = THREE.MathUtils.clamp(wrappedDelta / Math.PI, 0, 1);
        }

        this.trapPhaseDivergence.set(trapId, {
            lastPhase: normalizedPhase,
            divergence
        });

        return divergence;
    }

    _readNodeMetric(node, metric, fallback = 0) {
        if (!node) return fallback;
        const direct = node[metric];
        if (typeof direct === 'number') return direct;
        const userValue = node.userData?.[metric];
        if (typeof userValue === 'number') return userValue;
        const metricsValue = node.userData?.metrics?.[metric];
        if (typeof metricsValue === 'number') return metricsValue;
        return fallback;
    }

    _readCanonicalLinkPressure(link) {
        const flowState = link?.userData?.flowState || {};
        if (Number.isFinite(flowState.intensity)) {
            return THREE.MathUtils.clamp(flowState.intensity, 0, 1);
        }
        if (Number.isFinite(flowState.energy)) {
            return THREE.MathUtils.clamp(flowState.energy, 0, 1);
        }

        const cascadeIntensity = Number.isFinite(link?.userData?.cascadeIntensity)
            ? link.userData.cascadeIntensity
            : null;
        if (cascadeIntensity !== null) {
            return THREE.MathUtils.clamp(cascadeIntensity, 0, 1);
        }

        const conflictIntensity = Number.isFinite(link?.userData?.conflictIntensity)
            ? link.userData.conflictIntensity
            : null;
        if (conflictIntensity !== null) {
            return THREE.MathUtils.clamp(conflictIntensity, 0, 1);
        }

        return 0;
    }

    _getSemanticBus() {
        return this.semanticBus || globalThis?.semanticBus || globalThis?.game?.semanticBus || null;
    }

    _ensureSemanticBindings() {
        const bus = this._getSemanticBus();
        if (!bus) return;
        if (this.boundSemanticBus === bus && this.semanticUnsubscribers.length > 0) return;

        this._unbindSemanticEvents();
        this.boundSemanticBus = bus;
        this._bindSemanticEvents(bus);
    }

    _bindSemanticEvents(bus) {
        const subscribe = bus?.subscribe?.bind(bus);
        const on = bus?.on?.bind(bus);
        const unsubscribe = bus?.unsubscribe?.bind(bus);
        const off = bus?.off?.bind(bus);

        const bind = (tag) => {
            const handler = (payload = {}) => this._ingestSemanticPressure(tag, payload);
            if (typeof on === 'function') {
                on(tag, handler, { priority: bus?.priority?.NORMAL });
                this.semanticUnsubscribers.push(() => off?.(tag, handler));
                return;
            }
            if (typeof subscribe === 'function') {
                const unsub = subscribe(tag, handler, { priority: bus?.priority?.NORMAL });
                if (typeof unsub === 'function') {
                    this.semanticUnsubscribers.push(unsub);
                } else if (typeof unsubscribe === 'function') {
                    this.semanticUnsubscribers.push(() => unsubscribe(tag, handler));
                }
            }
        };

        bind('link:collapsed');
        bind('link.created');
        bind('cascade.hop');
        bind('node.corruption.high');
        bind('global.stability.low');
        bind('global.loadPressure.high');
        bind('network:stressRise');
    }

    _unbindSemanticEvents() {
        for (const unsub of this.semanticUnsubscribers) {
            try {
                if (typeof unsub === 'function') unsub();
            } catch (_err) {
                // no-op
            }
        }
        this.semanticUnsubscribers = [];
        this.boundSemanticBus = null;
    }

    _ingestSemanticPressure(tag, payload = {}) {
        const semanticPayload = payload?.detail && typeof payload.detail === 'object'
            ? payload.detail
            : payload;
        this.debugStats.semanticHits[tag] = (this.debugStats.semanticHits[tag] || 0) + 1;

        switch (tag) {
            case 'link.created': {
                const linkId = this._resolveLinkId(semanticPayload);
                if (linkId !== null) this._createResonanceScar(linkId, null, 1.0);
                break;
            }
            case 'link:collapsed': {
                const linkId = this._resolveLinkId(semanticPayload);
                if (linkId !== null) this._addEventPressureToLink(linkId, 1.0, tag);
                break;
            }
            case 'cascade.hop': {
                const linkId = this._resolveLinkId(semanticPayload);
                if (linkId !== null) this._addEventPressureToLink(linkId, 0.45, tag);
                break;
            }
            case 'node.corruption.high': {
                this._addNodeIncidentLinkPressure(semanticPayload, 0.35, tag);
                break;
            }
            case 'global.stability.low': {
                this._addPressureToTopTrapLinks(0.2, tag, 4);
                break;
            }
            case 'global.loadPressure.high': {
                this._addPressureToTopTrapLinks(0.22, tag, 4);
                break;
            }
            case 'network:stressRise': {
                this.globalStressBias = THREE.MathUtils.clamp(this.globalStressBias + 0.18, 0, 0.5);
                break;
            }
            default:
                break;
        }
    }

    _resolveLinkId(payload = {}) {
        const id = payload?.linkId ?? payload?.link?.id ?? payload?.link?.userData?.id ?? null;
        return id !== undefined && id !== null ? String(id) : null;
    }

    _addEventPressureToLink(linkId, amount, tag) {
        if (linkId === null || linkId === undefined) return;
        const key = String(linkId);
        const current = this.eventPressureByLink.get(key) || 0;
        this.eventPressureByLink.set(key, THREE.MathUtils.clamp(current + amount, 0, 1));
    }

    _addNodeIncidentLinkPressure(payload, amount, tag) {
        const nodeIdRaw =
            payload?.nodeId ??
            payload?.sourceNodeId ??
            payload?.sourceId ??
            payload?.targetNodeId ??
            payload?.targetId ??
            null;
        if (nodeIdRaw === null || nodeIdRaw === undefined) return;
        const nodeId = String(nodeIdRaw);

        const links = this.linkingSystem?.links || [];
        links.forEach((link) => {
            if (!link) return;
            const sourceId = this._getNodeId(this._getLinkSource(link));
            const targetId = this._getNodeId(this._getLinkTarget(link));
            const sourceMatches = sourceId !== undefined && sourceId !== null && String(sourceId) === nodeId;
            const targetMatches = targetId !== undefined && targetId !== null && String(targetId) === nodeId;
            if (!sourceMatches && !targetMatches) return;
            const linkId = link?.id ?? link?.userData?.id ?? null;
            if (linkId !== null && linkId !== undefined) {
                this._addEventPressureToLink(linkId, amount, tag);
            }
        });
    }

    _addPressureToTopTrapLinks(amount, tag, maxLinks = 4) {
        if (!this.standingWaveTrapSystem) return;
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        const ranked = traps
            .filter((trap) => trap?.active && trap?.linkId !== undefined && trap?.linkId !== null)
            .sort((a, b) => (b?.amplitude || 0) - (a?.amplitude || 0))
            .slice(0, Math.max(0, maxLinks));

        ranked.forEach((trap) => this._addEventPressureToLink(trap.linkId, amount, tag));
    }

    _updateEventPressure(deltaTime) {
        const pressureDecay = this.config.eventPressureDecayRate * deltaTime;
        this.eventPressureByLink.forEach((value, linkId) => {
            const next = Math.max(0, value - pressureDecay);
            if (next <= 0.0001) {
                this.eventPressureByLink.delete(linkId);
                return;
            }
            this.eventPressureByLink.set(linkId, next);
        });

        const biasDecay = this.config.globalStressBiasDecayRate * deltaTime;
        this.globalStressBias = Math.max(0, this.globalStressBias - biasDecay);
    }

    _updateRuptureCanonicalLinkMetrics(deltaTime) {
        const links = this.linkingSystem?.links || [];

        // Baseline decay + guaranteed field existence for all links every frame.
        links.forEach((link) => {
            if (!link) return;
            link.userData ??= {};
            const prevTear = Number(link.userData.visualTear) || 0;
            const prevLoss = Number(link.userData.visualCoherenceLoss) || 0;
            link.userData.visualTear = Math.max(0, prevTear * 0.9);
            link.userData.visualCoherenceLoss = Math.max(0, prevLoss * 0.92);

            // Stamp canonical writes for rupture fields
            link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
            link.userData.__canonicalWriteAt.visualTear = Date.now();
            link.userData.__canonicalWriteAt.visualCoherenceLoss = Date.now();
        });

        // Active rupture contribution.
        this.ruptures.forEach((rupture) => {
            const link = this._getLinkById(rupture.linkId);
            if (!link) return;
            link.userData ??= {};

            const progress = rupture.maxLife > 0 ? THREE.MathUtils.clamp(rupture.life / rupture.maxLife, 0, 1) : 0;
            const oscillation = Math.abs(Math.sin(this.time * 20));
            const tear = THREE.MathUtils.clamp((rupture.intensity || 0) * (0.5 + 0.5 * oscillation) * (1 - progress), 0, 1);
            const coherenceLoss = THREE.MathUtils.clamp((rupture.intensity || 0) * (1 - progress), 0, 1);

            link.userData.visualTear = Math.max(link.userData.visualTear || 0, tear);
            link.userData.visualCoherenceLoss = Math.max(link.userData.visualCoherenceLoss || 0, coherenceLoss);

            // Stamp canonical writes for rupture fields
            link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
            link.userData.__canonicalWriteAt.visualTear = Date.now();
            link.userData.__canonicalWriteAt.visualCoherenceLoss = Date.now();
        });

        // Scar contribution keeps slight coherence loss memory.
        this.resonanceScars.forEach((scar) => {
            const link = this._getLinkById(scar.linkId);
            if (!link) return;
            link.userData ??= {};
            const age = this.time - scar.birthTime;
            const progress = this.config.scarDuration > 0
                ? THREE.MathUtils.clamp(age / this.config.scarDuration, 0, 1)
                : 1;
            const scarLoss = THREE.MathUtils.clamp((scar.intensity || 0) * (1 - progress) * 0.6, 0, 1);
            link.userData.visualCoherenceLoss = Math.max(link.userData.visualCoherenceLoss || 0, scarLoss);

            // Stamp canonical writes for rupture fields
            link.userData.__canonicalWriteAt = link.userData.__canonicalWriteAt || {};
            link.userData.__canonicalWriteAt.visualTear = Date.now();
            link.userData.__canonicalWriteAt.visualCoherenceLoss = Date.now();
        });
    }

    _ensureScarMeshesAttached() {
        if (!this.scene || !Array.isArray(this.scarMeshPool)) return;
        this.scarMeshPool.forEach((item) => {
            const mesh = item?.mesh;
            if (!mesh) return;
            if (mesh.parent !== this.scene) {
                this.scene.add(mesh);
                // UNIFIED CLEANUP CONTRACT - Avoid duplicates
                if (!this._createdObjects.includes(mesh)) {
                    this._createdObjects.push(mesh);
                }
            }
            mesh.renderOrder = this.config.renderOrder + 2;
        });
    }

    clearWorldState() {
        this.ruptures.forEach((rupture) => {
            if (rupture?.burstMesh) {
                if (rupture.burstMesh.parent) {
                    rupture.burstMesh.parent.remove(rupture.burstMesh);
                }
                this._disposeBurstMesh(rupture.burstMesh);
                const createdIndex = this._createdObjects.indexOf(rupture.burstMesh);
                if (createdIndex >= 0) {
                    this._createdObjects.splice(createdIndex, 1);
                }
                rupture.burstMesh = null;
            }
            rupture.active = false;
        });

        this.propagationPulses.forEach((pulse) => {
            if (pulse?.mesh) {
                if (pulse.mesh.parent) {
                    pulse.mesh.parent.remove(pulse.mesh);
                }
                if (pulse.mesh.geometry) {
                    pulse.mesh.geometry.dispose();
                }
                if (pulse.mesh.material) {
                    pulse.mesh.material.dispose();
                }
                const createdIndex = this._createdObjects.indexOf(pulse.mesh);
                if (createdIndex >= 0) {
                    this._createdObjects.splice(createdIndex, 1);
                }
                pulse.mesh = null;
            }
            pulse.active = false;
            pulse.startLink = null;
            pulse.currentLink = null;
            pulse.pathDistance = 0;
            pulse.life = 0;
        });

        this.scarMeshPool.forEach((item) => {
            if (!item) return;
            item.active = false;
            item.scarData = null;
            item.birthTime = 0;
            if (item.mesh) {
                item.mesh.visible = false;
            }
        });

        this.stressIndicatorPool.forEach((item) => {
            if (!item) return;
            item.active = false;
            item.linkId = null;
            if (item.mesh) {
                item.mesh.visible = false;
            }
        });

        this.ruptures = [];
        this.propagationPulses = [];
        this.resonanceScars = [];
        this.preRuptureZones = [];
        this.nodeReactions.clear();
        this.stressAccumulation.clear();
        this.trapLifetimes.clear();
        this.trapPhaseDivergence.clear();
        this.ruptureOccurrences.clear();
        this.eventPressureByLink.clear();
        this.globalStressBias = 0;
    }

    _ensureCanonicalLinkDefaults() {
        const links = this.linkingSystem?.links || [];
        links.forEach((link) => {
            if (!link) return;
            if (!link.userData) link.userData = {};
            const userData = link.userData;

            if (!userData.flowState) {
                userData.flowState = {
                    intensity: 0,
                    direction: 1,
                    type: 'neutral',
                    energy: 0
                };
            }

            if (typeof userData.cascadeIntensity !== 'number') userData.cascadeIntensity = 0;
            if (typeof userData.cascadeConflictType !== 'string' || !userData.cascadeConflictType) {
                userData.cascadeConflictType = 'neutral';
            }
            if (typeof userData.conflictIntensity !== 'number') userData.conflictIntensity = 0;
            if (typeof userData.particleIntensity !== 'number') userData.particleIntensity = 0;
            if (typeof userData.particleUrgency !== 'number') userData.particleUrgency = 0;
            if (typeof userData.visualTear !== 'number') userData.visualTear = 0;
            if (typeof userData.visualCoherenceLoss !== 'number') userData.visualCoherenceLoss = 0;
            if (!(userData.cascadeParticleColor instanceof THREE.Color)) {
                userData.cascadeParticleColor = this.neutralCascadeParticleColor.clone();
            }
        });
    }

    /**
     * Dispose - cleanup
     */
    dispose() {
        this._unbindSemanticEvents();

        // UNIFIED CLEANUP CONTRACT - Remove and dispose all created objects
        const disposedGeometries = new Set();
        const disposedMaterials = new Set();
        this._createdObjects.forEach(obj => {
            this.scene.remove(obj);
            obj.traverse?.((child) => {
                if (child.geometry && !disposedGeometries.has(child.geometry)) {
                    disposedGeometries.add(child.geometry);
                    child.geometry.dispose();
                }
                if (child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach((material) => {
                        if (!material || disposedMaterials.has(material)) return;
                        disposedMaterials.add(material);
                        material.dispose();
                    });
                }
            });
        });
        this._createdObjects = [];
        this._burstGeometryCache.clear();
        this._propagationGeometryCache.clear();

        // Clean up burst meshes
        this.ruptures.forEach(rupture => {
            if (rupture.burstMesh && rupture.burstMesh.parent) {
                rupture.burstMesh.parent.remove(rupture.burstMesh);
            }
        });
        this.ruptures = [];
        
        // Clean up scar meshes
        this.scarMeshPool.forEach(item => {
            if (item.mesh && item.mesh.parent) {
                item.mesh.parent.remove(item.mesh);
            }
            this._disposeScarMesh(item.mesh);
        });
        this.scarMeshPool = [];
        
        // DESIGN: Clean up stress indicator pool
        this.stressIndicatorPool.forEach(item => {
            if (item.mesh) {
                this.scene.remove(item.mesh);
                item.mesh.geometry.dispose();
                item.mesh.material.dispose();
            }
        });
        this.stressIndicatorPool = [];
        if (this.stressShaderMaterial) this.stressShaderMaterial.dispose();

        // Clean up materials
        if (this.stressMaterial) this.stressMaterial.dispose();
        if (this.ruptureMaterial) this.ruptureMaterial.dispose();
        if (this.propagationMaterial) this.propagationMaterial.dispose();
        if (this.scarMaterial) this.scarMaterial.dispose();
        if (this._scarParticleTexture) {
            this._scarParticleTexture.dispose();
            this._scarParticleTexture = null;
        }
        
        // Clear maps
        this.stressAccumulation.clear();
        this.trapLifetimes.clear();
        this.ruptureOccurrences.clear();
        this.nodeReactions.clear();
        this.eventPressureByLink.clear();
        this.globalStressBias = 0;
    }

    _disposeScarMesh(mesh) {
        if (!mesh) return;
        if (mesh.isGroup || mesh.isObject3D) {
            mesh.traverse((child) => {
                if (child?.geometry) {
                    child.geometry.dispose();
                }
                if (child?.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => mat?.dispose?.());
                    } else {
                        child.material.dispose?.();
                    }
                }
            });
            return;
        }
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }
        if (mesh.material) {
            mesh.material.dispose();
        }
    }

    /**
     * Rebind after world switch (updates linkingSystem, aiNodes, semanticBus)
     */
    rebind(config = {}) {
        this.clearWorldState();

        // Update references if provided
        if (config.linkingSystem !== undefined) {
            this.linkingSystem = config.linkingSystem;
        }
        if (config.aiNodes !== undefined) {
            this.aiNodes = config.aiNodes;
        }
        if (config.semanticBus !== undefined) {
            this.semanticBus = config.semanticBus;
        }

        // Re-ensure semantic bindings
        this._ensureSemanticBindings();
    }
}

/**
 * ============================================================================
 * INTEGRATION NOTES
 * ============================================================================
 * 
 * In main.js:
 * 
 *   import { ResonanceRuptureVisualSystem_Session133 } 
 *     from './ResonanceRuptureVisualSystem_Session133.js';
 *   
 *   // In World constructor:
 *   this.resonanceRupture = new ResonanceRuptureVisualSystem_Session133(
 *       this.scene,
 *       this.standingWaveTrap,       // Trap system (required)
 *       this.influenceReflection,    // Reflection system (optional)
 *       this.linkingSystem,
 *       this.aiNodes
 *   );
 *   
 *   // In setup section:
 *   this.resonanceRupture.setup();
 *   
 *   // In animate loop (AFTER all wave systems):
 *   if (this.resonanceRupture) {
 *       this.resonanceRupture.update(deltaTime, this.time);
 *   }
 * 
 * ============================================================================
 * SEMANTIC LANGUAGE EXTENSION (13 → 14 Dimensions)
 * ============================================================================
 * 
 * Dimension 14: Resonance Rupture & Structural Failure
 * Encodes: Coherence breakdown, pressure release, aftermath memory
 * Visual: Red stress zones, orange rupture bursts, purple scars
 * 
 * This system completes the wave visualization:
 * - Waves can fail under pressure
 * - Failure is visible, not hidden
 * - Aftermath remains (scars) as network memory
 * - Nodes react to structural failure
 * - Visual consequence makes network feel alive and fragile
 * 
 * ============================================================================
 */
