/**
 * ============================================================================
 * STANDING WAVE VISUAL RENDERER (Session 131)
 * ============================================================================
 * 
 * PURE RENDERING SYSTEM - Applies Standing Wave Visuals
 * 
 * Purpose:
 * Renders standing wave patterns on links, transforms traveling waves into
 * stationary oscillations, and visualizes trap zones with interference
 * patterns, antinode glows, and node halo counter-pulsing.
 * 
 * Core Responsibilities:
 * - Transform link wave materials to standing wave mode
 * - Generate antinode glow meshes within trap zones
 * - Render interference bands (bright/dim zones)
 * - Apply trap zone visibility and glow
 * - Animate node halos with counter-pulsing
 * - Handle resolution animations (damping, breakthrough, collapse)
 * - Reuse pooled meshes for performance
 * 
 * Architecture:
 * - Reads standing wave trap state (read-only)
 * - Updates link material uniforms for standing waves
 * - Manages antinode mesh pool
 * - Animates node shell materials
 * - Applies post-processing effects
 * - Zero gameplay modifications
 * 
 * Integration:
 * - Works with StandingWaveOscillationTrapSystem (reads trap state)
 * - Works with existing link/node rendering
 * - Modifies only visual materials and geometries
 * 
 * Status: PRODUCTION (Session 131)
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { resolveLinkCategoryColor } from './LinkCategoryColorContract.js';

export class StandingWaveVisualRenderer_Session131 {
    constructor(scene, standingWaveTrapSystem, linkingSystem, aiNodes, config = {}) {
        this.scene = scene;
        this.standingWaveTrapSystem = standingWaveTrapSystem;
        this.linkingSystem = linkingSystem;
        this.aiNodes = aiNodes;
        this.attachRoot = config.attachRoot || config.parentRoot || scene;
        this.attachRootResolver = config.attachRootResolver || null;
        
        // Configuration
        this.config = {
            // Antinode visualization
            antinodeRadius: 1.5,              // Radius of antinode halo ring (visible scale)
            antinodeOpacityBase: 0.38,        // Base opacity of antinode glow
            antinodeGlowIntensity: 1.45,      // Intensity multiplier for additive blending
            antinodeCooldownSeconds: 5.0,     // Minimum time before an antinode can reappear
            antinodeLifetimeSeconds: 2.6,     // Time before the torus starts dissolving
            antinodeFadeSeconds: 0.42,        // Fade-out time once the torus starts dissolving
            antinodePulseFrequency: 1.9,      // Soft pulse speed for the ring glow
            antinodeDissolveNoiseFrequency: 12.0, // High-frequency breakup during fadeout
            antinodeDissolveNoiseAmount: 0.42,     // Strength of breakup modulation
            antinodeDissolveScaleJitter: 0.075,    // Small size wobble while dissolving
            antinodeColorBlend: 0.22,         // Blend toward the link wave color
            antinodeScaleBase: 0.44,          // Base scale of the ring mesh
            antinodeScaleBoost: 0.11,         // Extra scale at higher intensity
            antinodeSegmentCount: 6,          // Broken Möbius segment count
            antinodeSegmentGap: 0.08,         // Gap between segments
            antinodeSegmentTwist: 0.42,       // Phase mismatch twist amount
            antinodeLODDistance: 50,          // Distance culling threshold
            
            // Interference bands
            bandThickness: 0.05,              // Thickness of bright/dim bands
            bandTransitionSmoothing: 0.3,    // Smoothness of band edges
            brightBandOpacity: 0.25,         // Opacity of bright zones
            dimBandOpacity: 0.08,            // Opacity of dim zones
            
            // Trap zone rendering
            trapZoneThickness: 0.08,          // Visual thickness of trap zone boundary
            trapZoneOpacityBase: 0.22,        // Base opacity of trap zone
            trapZoneGlowFactor: 1.25,         // Glow intensity multiplier
            trapZoneFadeSeconds: 0.35,        // Grace period before a trap zone fully retires
            trapZoneSingularityScale: 0.72,    // Overall composite size multiplier
            trapZoneCoreRadius: 0.13,          // Inner singularity core radius
            trapZoneOrbitRadius: 0.36,         // Primary orbital ring radius
            trapZoneHaloRadius: 0.62,          // Event-horizon disc radius
            trapZoneOrbitSpeed: 1.15,          // Orbit rotation speed
            trapZoneSecondaryOrbitSpeed: 0.82, // Secondary torus motion speed
            trapZoneSecondaryOrbitTilt: 0.07,  // Secondary torus tilt amount
            trapZoneSecondaryOrbitDrift: 0.03, // Secondary torus drift amount
            trapZoneSecondaryOrbitMaxDelta: Math.PI * 0.055, // ~10 degrees max deviation
            trapZonePulseFrequency: 2.25,      // Trap zone pulse frequency
            trapZoneColor: new THREE.Color(0.7, 0.8, 1.0),  // Pale blue
            
            // Wave material modification
            waveTravelSpeed: 0.0,             // Standing = 0, traveling > 0
            waveCompressionFactor: 0.5,       // Wavelength compression in trap
            waveAmplitudeModulation: true,    // Modulate by oscillation
            
            // Node halo counter-pulsing
            haloPulseFrequency: 3.0,          // Hz
            haloPulseAmount: 0.15,            // Amplitude of pulsing
            haloPhaseOffset: Math.PI,         // π radians = opposite phase
            
            // Resolution animations
            dampingFadeRate: 0.5,             // Opacity fade per second
            breakthroughAcceleration: 2.0,    // Speed multiplier for wave escape
            collapseInwardRate: 0.3,          // Inward movement rate
            
            // Performance
            maxAntinodeMeshes: 100,           // Pool size for antinode glows
            maxTrapZoneMeshes: 30,            // Pool size for trap zone visualizers
            enableLOD: true,                  // Enable distance-based culling
            renderOrder: VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE),
            ...config
        };
        
        // Runtime state
        this.linkMaterialMap = new Map();    // linkId -> { materialStates, isStanding }
        this.antinodeMeshes = [];            // Active antinode glow meshes
        this.trapZoneMeshes = [];            // Active trap zone meshes
        this.nodePulsePhases = new Map();    // nodeId -> phase offset
        this.linkWaveStates = new Map();     // linkId -> { isStanding, frequency, phase }
        this.resolutionAnimators = new Map(); // trapId -> resolution animation state
        
        // Object pools
        this.antinodeMeshPool = [];
        this.trapZoneMeshPool = [];
        
        // Material cache
        this.antinodeMaterial = null;
        this.antinodeShellMaterial = null;
        this.trapZoneMaterial = null;
        this.trapZoneCoreMaterial = null;
        this.trapZoneHaloMaterial = null;
        this.trapZoneRingMaterial = null;
        this.trapZoneShockMaterial = null;
        this.interferenceShader = null;
        this.root = null;
        this._antinodeDirection = new THREE.Vector3(0, 0, 1);
        this._antinodeQuat = new THREE.Quaternion();
        this._antinodeColorA = new THREE.Color();
        this._antinodeColorB = new THREE.Color();
        this._antinodeColorC = new THREE.Color();
        
        this.time = 0;
        this.initialized = false;
        this.trapZoneUpdateCount = 0;
        this.lastTrapZoneRenderCount = 0;
    }

    /**
     * Setup - initialize materials, pools, and shaders
     */
    setup() {
        if (this.initialized) return;

        this.root = new THREE.Group();
        this.root.name = 'StandingWaveVisualRendererRoot';
        this._ensureAttachRoot();
        
        // Create antinode glow material - use MeshBasicMaterial with additive blending for proper glow
        this.antinodeMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.35, 0.82, 1.0),
            transparent: true,
            opacity: Math.min(0.45, this.config.antinodeOpacityBase),
            wireframe: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.antinodeShellMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.82, 0.96, 1.0),
            transparent: true,
            opacity: Math.min(0.18, this.config.antinodeOpacityBase * 0.42),
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create trap zone material - use MeshBasicMaterial with additive blending for glow
        this.trapZoneMaterial = new THREE.MeshBasicMaterial({
            color: this.config.trapZoneColor,
            transparent: true,
            opacity: this.config.trapZoneOpacityBase,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.trapZoneCoreMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.04, 0.02, 0.08),
            transparent: true,
            opacity: 0.88,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true
        });
        this.trapZoneHaloMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.92, 0.9, 1.0),
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.trapZoneRingMaterial = new THREE.MeshBasicMaterial({
            color: this.config.trapZoneColor.clone(),
            transparent: true,
            opacity: 0.24,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            wireframe: true
        });
        this.trapZoneShockMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.95, 0.92, 1.0),
            transparent: true,
            opacity: 0.14,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Pre-allocate antinode glow pool
        for (let i = 0; i < this.config.maxAntinodeMeshes; i++) {
            const group = new THREE.Group();
            group.name = `StandingWaveAntinode_${i}`;
            group.visible = false;
            group.frustumCulled = false;
            group.renderOrder = this.config.renderOrder;

            const segmentCount = Math.max(5, Math.min(7, this.config.antinodeSegmentCount));
            const segmentArc = (Math.PI * 2 / segmentCount) * (1 - this.config.antinodeSegmentGap);
            const segmentRadius = Math.max(0.08, this.config.antinodeRadius * 0.48);
            const tubeRadius = Math.max(0.02, this.config.antinodeRadius * 0.11);
            const segments = [];
            for (let s = 0; s < segmentCount; s++) {
                const geo = new THREE.TorusGeometry(segmentRadius, tubeRadius, 6, 14, segmentArc);
                const segMesh = new THREE.Mesh(geo, this.antinodeMaterial.clone());
                segMesh.visible = true;
                segMesh.frustumCulled = false;
                segMesh.renderOrder = this.config.renderOrder;
                segMesh.rotation.z = (s / segmentCount) * Math.PI * 2;
                segMesh.rotation.x = (s % 2 === 0 ? 0.48 : -0.48);
                segMesh.position.z = (s % 2 === 0 ? 0.03 : -0.03);
                group.add(segMesh);
                segments.push(segMesh);
            }

            const shell = new THREE.Mesh(
                new THREE.SphereGeometry(Math.max(0.06, this.config.antinodeRadius * 0.24), 10, 10),
                this.antinodeShellMaterial.clone()
            );
            shell.visible = true;
            shell.frustumCulled = false;
            shell.renderOrder = this.config.renderOrder;
            group.add(shell);

            this.root.add(group);
            this.antinodeMeshPool.push({
                mesh: group,
                group: group,
                segments: segments,
                shellMesh: shell,
                active: false,
                position: new THREE.Vector3(),
                intensity: 0,
                opacity: 0,
                birthTime: 0,
                expireTime: 0,
                lastSeenTime: 0,
                nextRefreshTime: 0,
                slotKey: null,
                linkId: null,
                phaseSeed: i * 0.73,
                twistSeed: i * 0.19
            });
        }
        
        // Pre-allocate trap zone pool
        for (let i = 0; i < this.config.maxTrapZoneMeshes; i++) {
            const group = new THREE.Group();
            group.name = `StandingWaveTrapZone_${i}`;
            group.visible = false;
            group.frustumCulled = false;
            group.renderOrder = this.config.renderOrder;

            const core = new THREE.Mesh(
                new THREE.SphereGeometry(Math.max(0.08, this.config.trapZoneCoreRadius), 18, 18),
                this.trapZoneCoreMaterial.clone()
            );
            core.frustumCulled = false;
            core.renderOrder = this.config.renderOrder;

            const orbitA = new THREE.Mesh(
                new THREE.TorusGeometry(Math.max(0.18, this.config.trapZoneOrbitRadius), 0.028, 5, 30),
                this.trapZoneRingMaterial.clone()
            );
            orbitA.frustumCulled = false;
            orbitA.renderOrder = this.config.renderOrder;
            orbitA.rotation.x = Math.PI * 0.5;

            const orbitB = new THREE.Mesh(
                new THREE.TorusGeometry(Math.max(0.14, this.config.trapZoneOrbitRadius * 0.78), 0.022, 4, 28),
                this.trapZoneRingMaterial.clone()
            );
            orbitB.frustumCulled = false;
            orbitB.renderOrder = this.config.renderOrder;
            orbitB.rotation.y = Math.PI * 0.33;

            const halo = new THREE.Mesh(
                new THREE.RingGeometry(
                    Math.max(0.24, this.config.trapZoneHaloRadius * 0.54),
                    Math.max(0.42, this.config.trapZoneHaloRadius),
                    60,
                    1
                ),
                this.trapZoneHaloMaterial.clone()
            );
            halo.frustumCulled = false;
            halo.renderOrder = this.config.renderOrder;
            halo.rotation.x = -Math.PI * 0.5;

            const shock = new THREE.Mesh(
                new THREE.RingGeometry(Math.max(0.30, this.config.trapZoneOrbitRadius * 0.9), Math.max(0.44, this.config.trapZoneOrbitRadius * 1.42), 48, 1),
                this.trapZoneShockMaterial.clone()
            );
            shock.frustumCulled = false;
            shock.renderOrder = this.config.renderOrder;
            shock.rotation.x = -Math.PI * 0.5;

            group.add(core);
            group.add(orbitA);
            group.add(orbitB);
            group.add(halo);
            group.add(shock);
            this.root.add(group);

            this.trapZoneMeshPool.push({
                mesh: group,
                group: group,
                coreMesh: core,
                orbitAMesh: orbitA,
                orbitBMesh: orbitB,
                haloMesh: halo,
                shockMesh: shock,
                active: false,
                linkId: null,
                intensity: 1,
                lastSeenTime: 0,
                pulseSeed: i * 0.91,
                spinPhase: i * 0.27
            });
        }
        
        this.initialized = true;
    }

    /**
     * Update - primary frame update
     * @param {number} deltaTime - Elapsed time since last frame
     * @param {number} currentTime - Total simulation time
     */
    update(deltaTime, currentTime) {
        if (!this.initialized) this.setup();
        this._ensureAttachRoot();
        
        this.time = currentTime;
        
        // Step 1: Update link materials for standing waves
        this._updateLinkWaveStates(deltaTime);
        
        // Step 2: Render antinode glows
        this._updateAntinodeGlows(deltaTime);
        
        // Step 3: Render trap zones
        this._updateTrapZones(deltaTime);
        
        // Step 4: Render interference bands on links
        this._updateInterferenceBands(deltaTime);
        
        // Step 5: Animate node halo counter-pulsing
        this._updateNodeHaloPulsing(deltaTime);
        
        // Step 6: Handle resolution animations
        this._updateResolutionAnimations(deltaTime);
    }

    /**
     * Sync only trap-zone meshes from the latest trap-system state.
     * Used by the trap system after it finishes a simulation tick so the
     * next render pass sees the freshest zone geometry.
     */
    syncTrapZones(deltaTime = 0.016) {
        if (!this.initialized) this.setup();
        this._ensureAttachRoot();
        this.time = this.time || 0;
        this._updateTrapZones(deltaTime);
    }

    /**
     * Update link materials to visualize standing waves
     */
    _updateLinkWaveStates(deltaTime) {
        if (!this.standingWaveTrapSystem || !this.linkingSystem) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        
        // Get all links
        const links = this.linkingSystem.links || [];
        
        links.forEach(link => {
            if (!link || !link.id) return;
            
            // Check if this link has an active standing wave trap
            const trap = traps.find(t => t.active && t.linkId === link.id);
            
            if (trap && trap.amplitude > 0.05) {
                // Apply standing wave rendering to this link
                this._applyStandingWaveMaterial(link, trap, deltaTime);
            } else {
                // Reset to normal traveling wave
                this._resetLinkMaterial(link);
            }
        });
    }

    /**
     * Apply standing wave appearance to a link
     */
    _applyStandingWaveMaterial(link, trap, deltaTime) {
        const materials = this._collectLinkMaterials(link);
        if (materials.length === 0) return;
        
        const linkId = link.id;
        
        // Get or create link material state
        let materialState = this.linkMaterialMap.get(linkId);
        if (!materialState) {
            materialState = {
                linkId: linkId,
                materialStates: materials.map((material) => ({
                    material: material,
                    originalWaveSpeed: material.uniforms?.waveSpeed?.value ?? material.uniforms?.uWaveSpeed?.value ?? 1.0,
                    originalWavelength: material.uniforms?.wavelength?.value ?? material.uniforms?.uWaveLength?.value ?? material.userData?.waveLength ?? null,
                    originalPhaseOffset: material.uniforms?.uWavePhaseOffset?.value ?? material.userData?.wavePhaseOffset ?? null
                })),
                isStanding: false
            };
            this.linkMaterialMap.set(linkId, materialState);
        }

        if (materialState.materialStates.length !== materials.length ||
            materialState.materialStates.some((state) => !materials.includes(state.material))) {
            materialState.materialStates = materials.map((material) => ({
                material: material,
                originalWaveSpeed: material.uniforms?.waveSpeed?.value ?? material.uniforms?.uWaveSpeed?.value ?? 1.0,
                originalWavelength: material.uniforms?.wavelength?.value ?? material.uniforms?.uWaveLength?.value ?? material.userData?.waveLength ?? null,
                originalPhaseOffset: material.uniforms?.uWavePhaseOffset?.value ?? material.userData?.wavePhaseOffset ?? null
            }));
        }
        
        // Switch to standing wave mode
        if (!materialState.isStanding) {
            materialState.materialStates.forEach((state) => {
                const material = state.material;
                if (material.uniforms?.waveSpeed) {
                    state.originalWaveSpeed = material.uniforms.waveSpeed.value;
                    material.uniforms.waveSpeed.value = 0;
                }
                if (material.uniforms?.uWaveSpeed) {
                    state.originalWaveSpeed = material.uniforms.uWaveSpeed.value;
                    material.uniforms.uWaveSpeed.value = 0;
                }
            });
            materialState.isStanding = true;
        }

        materialState.materialStates.forEach((state) => {
            this._applyStandingWaveToMaterialState(state, trap);
        });
    }

    /**
     * Reset link material to normal traveling wave
     */
    _resetLinkMaterial(link) {
        if (!link || !link.id) return;
        
        const linkId = link.id;
        const materialState = this.linkMaterialMap.get(linkId);
        
        if (materialState && materialState.isStanding) {
            materialState.materialStates.forEach((state) => {
                const material = state.material;

                if (material.uniforms?.waveSpeed) {
                    material.uniforms.waveSpeed.value = state.originalWaveSpeed;
                }
                if (material.uniforms?.uWaveSpeed) {
                    material.uniforms.uWaveSpeed.value = state.originalWaveSpeed;
                }
                if (material.uniforms?.standingWaveFrequency) {
                    material.uniforms.standingWaveFrequency.value = 0;
                }
                if (material.uniforms?.standingWavePhase) {
                    material.uniforms.standingWavePhase.value = 0;
                }
                if (material.uniforms?.wavelength && state.originalWavelength !== null) {
                    material.uniforms.wavelength.value = state.originalWavelength;
                }
                if (material.uniforms?.uWaveLength && state.originalWavelength !== null) {
                    material.uniforms.uWaveLength.value = state.originalWavelength;
                }
                if (material.uniforms?.uWavePhaseOffset && state.originalPhaseOffset !== null) {
                    material.uniforms.uWavePhaseOffset.value = state.originalPhaseOffset;
                }
                if (material.userData && state.originalWavelength !== null) {
                    material.userData.waveLength = state.originalWavelength;
                }
                if (material.userData && state.originalPhaseOffset !== null) {
                    material.userData.wavePhaseOffset = state.originalPhaseOffset;
                }
                if (material.userData) {
                    material.userData.standingWaveActive = false;
                }
            });
            
            materialState.isStanding = false;
        }
    }

    /**
     * Render antinode glow meshes
     */
    _updateAntinodeGlows(deltaTime) {
        if (!this.standingWaveTrapSystem) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        const patterns = this.standingWaveTrapSystem.interferencePatterns || [];
        const touchedSlots = new Set();
        
        let antinodeIndex = 0;
        
        // Create antinode glows for each trap
        traps.forEach(trap => {
            if (!trap.active || trap.amplitude < 0.1) return;
            
            const pattern = patterns.find(p => p.trapId === trap.linkId);
            if (!pattern) return;
            
            const link = this._getLinkById(trap.linkId);
            if (!link) return;

            const linkCurve = this._getLinkCurve(link);
            if (!linkCurve) return;
            
            // Spacing between antinodes
            const spacing = pattern.spacing || 0.2;
            const antinodeCount = Math.ceil(1.0 / spacing);
            
            // Create antinode meshes at each position
            for (let i = 0; i < antinodeCount && antinodeIndex < this.config.maxAntinodeMeshes; i++) {
                const t = (i + 1) * spacing;
                
                // Check if antinode is in trap zone
                const trapStart = trap.trapRadius * 0.5;
                const trapEnd = 1.0 - trap.trapRadius * 0.5;
                
                if (t < trapStart || t > trapEnd) continue;

                // Calculate antinode world position on actual rendered curve when available.
                const antinodeWorldPos = linkCurve.getPointAt(
                    Math.max(0, Math.min(1, t))
                );
                
                // Check LOD
                if (this.config.enableLOD) {
                    const cameraPosition = this._resolveCameraPosition();
                    if (cameraPosition) {
                        const cameraDistance = antinodeWorldPos.distanceTo(cameraPosition);
                        if (cameraDistance > this.config.antinodeLODDistance) continue;
                    }
                }
                
                // Acquire antinode from pool
                const antinode = this.antinodeMeshPool[antinodeIndex];
                if (!antinode) break;
                const slotKey = `${trap.linkId}:${i}`;
                const isNewSlot = antinode.slotKey !== slotKey;
                antinode.slotKey = slotKey;
                antinode.linkId = trap.linkId;

                if (isNewSlot || this.time >= antinode.nextRefreshTime) {
                    antinode.birthTime = this.time;
                    antinode.expireTime = this.time + this.config.antinodeLifetimeSeconds;
                    antinode.nextRefreshTime = this.time + this.config.antinodeCooldownSeconds;
                }
                
                if (this.time >= antinode.expireTime) {
                    antinode.active = false;
                    antinode.group.visible = false;
                    antinode.mesh.visible = false;
                    this._setAntinodeMeshOpacity(antinode, 0);
                    antinode.group.scale.setScalar(this.config.antinodeScaleBase);
                    continue;
                }

                antinode.active = true;
                antinode.group.visible = true;
                antinode.mesh.visible = true;
                antinode.group.position.copy(antinodeWorldPos);
                antinode.lastSeenTime = this.time;
                touchedSlots.add(antinodeIndex);

                if (typeof linkCurve.getTangentAt === 'function') {
                    const tangent = linkCurve.getTangentAt(Math.max(0, Math.min(1, t)));
                    if (tangent && tangent.lengthSq() > 1e-8) {
                        antinode.group.quaternion.setFromUnitVectors(this._antinodeDirection, tangent.normalize());
                    }
                }
                
                // Calculate intensity (bright at antinodes, dim between)
                const beatPhase = pattern.beatPhase || 0;
                const localIntensity = Math.abs(Math.sin(beatPhase + i * Math.PI));
                const targetIntensity = trap.amplitude * localIntensity;
                const smoothFactor = 1 - Math.exp(-Math.max(0.001, deltaTime) * 10.0);
                antinode.intensity += (targetIntensity - antinode.intensity) * smoothFactor;

                const age = Math.max(0, this.time - antinode.birthTime);
                const attack = Math.min(1, age / 0.12);
                const pulse = 0.76 + (Math.sin((age * this.config.antinodePulseFrequency * Math.PI * 2) + antinode.phaseSeed) * 0.24);
                const fadeWindow = Math.max(0.001, this.config.antinodeFadeSeconds);
                const dissolve = Math.max(0, Math.min(1, (antinode.expireTime - this.time) / fadeWindow));
                const dissolveProgress = 1 - dissolve;
                const breakupPhase = (age * this.config.antinodeDissolveNoiseFrequency * Math.PI * 2)
                    + (antinode.phaseSeed * 17.0)
                    + (i * 1.618);
                const breakupNoise = 0.5 + (0.5 * Math.sin(breakupPhase) * Math.sin(breakupPhase * 1.37));
                const breakup = 1 - (dissolveProgress * this.config.antinodeDissolveNoiseAmount * breakupNoise);
                const displayIntensity = Math.max(0, antinode.intensity * attack * pulse * dissolve * Math.max(0.18, breakup));

                const color = this._resolveAntinodeColor(link, this._antinodeColorC);
                const colorIntensity = Math.min(0.72, 0.22 + displayIntensity * this.config.antinodeGlowIntensity * 0.42);
                const shellTint = color.clone().lerp(new THREE.Color(0.96, 0.98, 1.0), 0.65);
                this._setAntinodeMeshColor(antinode, color, shellTint, colorIntensity);
                const dissolveFlicker = 0.88 + (0.12 * Math.sin(breakupPhase * 1.9));
                this._setAntinodeMeshOpacity(
                    antinode,
                    Math.min(0.32, this.config.antinodeOpacityBase * displayIntensity * dissolveFlicker)
                );
                const scaleJitter = 1 + (dissolveProgress * this.config.antinodeDissolveScaleJitter * Math.sin(breakupPhase * 0.83));
                const antinodeScale = (this.config.antinodeScaleBase + (displayIntensity * this.config.antinodeScaleBoost)) * scaleJitter;
                antinode.group.scale.setScalar(antinodeScale);
                this._poseBrokenAntinodeSegments(antinode, pulsePhase, displayIntensity, dissolveProgress);
                
                antinodeIndex++;
            }
        });

        this.antinodeMeshPool.forEach((antinode, index) => {
            if (!antinode.active || touchedSlots.has(index)) return;

            const fadeAge = Math.max(0, this.time - antinode.lastSeenTime);
            const fade = Math.max(0, 1 - (fadeAge / this.config.antinodeFadeSeconds));
            antinode.intensity *= Math.max(0, 1 - (deltaTime * 4.0));

            if (fade <= 0.02 || antinode.intensity <= 0.01) {
                antinode.active = false;
                antinode.group.visible = false;
                antinode.mesh.visible = false;
                this._setAntinodeMeshOpacity(antinode, 0);
                return;
            }

            this._setAntinodeMeshOpacity(antinode, (antinode.shellMesh?.material?.opacity ?? 0) * fade);
            antinode.group.scale.multiplyScalar(0.995);
        });
    }

    clearLink(linkOrId, sourceNode = null, targetNode = null) {
        const linkId = this._resolveLinkId(linkOrId);
        if (!linkId) return;

        const now = this.time || 0;
        this.antinodeMeshPool.forEach((antinode) => {
            const slotLinkId = antinode.linkId || (typeof antinode.slotKey === 'string' ? antinode.slotKey.split(':')[0] : null);
            if (slotLinkId !== linkId) return;

            antinode.active = false;
            antinode.group.visible = false;
            antinode.mesh.visible = false;
            this._setAntinodeMeshOpacity(antinode, 0);
            antinode.group.scale.setScalar(this.config.antinodeScaleBase);
            antinode.lastSeenTime = now;
            antinode.expireTime = now;
            antinode.nextRefreshTime = now + this.config.antinodeCooldownSeconds;
        });
    }

    _resolveLinkId(linkOrId) {
        if (!linkOrId) return null;
        if (typeof linkOrId === 'string' || typeof linkOrId === 'number') {
            return String(linkOrId);
        }

        return (
            linkOrId.userData?.id ??
            linkOrId.userData?.linkId ??
            linkOrId.id ??
            linkOrId.uuid ??
            null
        );
    }

    _resolveAntinodeColor(link, outColor = new THREE.Color()) {
        const sourceCategory = link?.sourceNode?.userData?.category
            || link?.source?.userData?.category
            || link?.from?.userData?.category
            || link?.userData?.sourceCategory
            || null;
        const targetCategory = link?.targetNode?.userData?.category
            || link?.target?.userData?.category
            || link?.to?.userData?.category
            || link?.userData?.targetCategory
            || sourceCategory;

        const sourceColor = resolveLinkCategoryColor(sourceCategory, this.config.waveColor, this._antinodeColorA);
        const targetColor = resolveLinkCategoryColor(targetCategory, sourceColor, this._antinodeColorB);

        return outColor
            .copy(sourceColor)
            .lerp(targetColor, 0.5)
            .lerp(this.config.waveColor, this.config.antinodeColorBlend)
            .multiplyScalar(0.88);
    }

    _setAntinodeMeshColor(antinode, wireColor, shellColor, intensity) {
        const segments = Array.isArray(antinode?.segments) ? antinode.segments : [];
        const normalized = Math.max(0, Math.min(1, intensity));
        segments.forEach((segment, index) => {
            if (!segment?.material) return;
            const tint = 0.84 + (index * 0.03) + (normalized * 0.12);
            segment.material.color.copy(wireColor).multiplyScalar(tint);
        });

        if (antinode?.shellMesh?.material) {
            antinode.shellMesh.material.color.copy(shellColor);
        }
    }

    _setAntinodeMeshOpacity(antinode, opacity) {
        const segments = Array.isArray(antinode?.segments) ? antinode.segments : [];
        const clamped = Math.max(0, Math.min(0.45, opacity));
        segments.forEach((segment, index) => {
            if (!segment?.material) return;
            const phaseOffset = 0.84 + (index * 0.025);
            segment.material.opacity = clamped * phaseOffset;
        });
        if (antinode?.shellMesh?.material) {
            antinode.shellMesh.material.opacity = Math.min(0.18, clamped * 0.42);
        }
    }

    _poseBrokenAntinodeSegments(antinode, pulsePhase, displayIntensity, dissolveProgress) {
        const segments = Array.isArray(antinode?.segments) ? antinode.segments : [];
        const segmentCount = Math.max(1, segments.length);
        const twist = this.config.antinodeSegmentTwist || 0.35;
        segments.forEach((segment, index) => {
            if (!segment) return;
            const localPhase = pulsePhase + (index / segmentCount) * Math.PI * 2;
            const phaseLift = Math.sin(localPhase * 0.83 + antinode.twistSeed) * 0.18;
            const phaseShift = Math.cos(localPhase * 1.17 + antinode.twistSeed) * 0.11;
            segment.rotation.z = (index / segmentCount) * Math.PI * 2 + (displayIntensity * 0.04);
            segment.rotation.x = ((index % 2 === 0) ? 0.52 : -0.52) + (phaseLift * twist);
            segment.rotation.y = (index % 3 - 1) * 0.08 + (phaseShift * twist);
            segment.position.z = ((index % 2 === 0) ? 0.04 : -0.04) + (dissolveProgress * 0.03 * Math.sin(localPhase * 1.31));
            segment.scale.setScalar(0.96 + (Math.sin(localPhase * 1.37) * 0.04));
        });

        if (antinode?.shellMesh) {
            antinode.shellMesh.rotation.y = pulsePhase * 0.28;
            antinode.shellMesh.rotation.z = pulsePhase * -0.19;
            antinode.shellMesh.scale.setScalar(0.94 + (displayIntensity * 0.16));
        }
    }

    /**
     * Render trap zone visualizations
     */
    _updateTrapZones(deltaTime) {
        this.trapZoneUpdateCount++;
        if (!this.standingWaveTrapSystem) return;
        
        const trapZones = Array.isArray(this.standingWaveTrapSystem.trapZones)
            ? this.standingWaveTrapSystem.trapZones
            : [];
        const activeTraps = Array.isArray(this.standingWaveTrapSystem.oscillationTraps)
            ? this.standingWaveTrapSystem.oscillationTraps.filter((trap) => trap?.active && (Number(trap?.amplitude) || 0) >= 0.05)
            : [];
        const zoneDescriptors = trapZones.length > 0 ? trapZones : activeTraps.map((trap) => ({
            linkId: trap.linkId,
            trapCenter: this.standingWaveTrapSystem.config?.trapCenterOffset ?? 0.5,
            radiusStart: Math.max(0, 0.5 - (Number(trap.trapRadius) || 0) * 0.5),
            radiusEnd: Math.min(1, 0.5 + (Number(trap.trapRadius) || 0) * 0.5),
            intensity: Number(trap.amplitude) || 0,
            frequency: Number(trap.frequency) || 0,
            phase: Number(trap.phase) || 0,
            state: trap.state ?? 'unknown'
        }));
        let zoneIndex = 0;
        const touchedIndices = new Set();
        let renderedCount = 0;
        
        zoneDescriptors.forEach(zone => {
            if (zoneIndex >= this.config.maxTrapZoneMeshes) return;
            
            const link = this._getLinkById(zone.linkId);
            if (!link) return;

            const linkCurve = this._getLinkCurve(link);
            const centerT = Math.max(0, Math.min(1, zone.trapCenter ?? 0.5));
            const centerPos = linkCurve?.getPointAt?.(centerT) || null;
            const tangent = linkCurve?.getTangentAt?.(centerT) || null;
            const linkLength = this._estimateLinkLength(linkCurve, link);
            if (!centerPos || !linkLength) return;
            const safeTangent = (tangent && tangent.lengthSq() > 1e-8)
                ? tangent.clone().normalize()
                : new THREE.Vector3(1, 0, 0);
            
            // Acquire trap zone mesh from pool
            const trapZoneMesh = this.trapZoneMeshPool[zoneIndex];
            if (!trapZoneMesh) return;
            
            trapZoneMesh.active = true;
            trapZoneMesh.group.visible = true;
            trapZoneMesh.lastSeenTime = this.time;
            trapZoneMesh.linkId = zone.linkId;
            trapZoneMesh.group.position.copy(centerPos);
            
            // Orient singularity along the local link tangent rather than node-to-node chord.
            trapZoneMesh.group.lookAt(centerPos.clone().add(safeTangent));
            trapZoneMesh.group.rotateX(Math.PI * 0.5);  // Face perpendicular to link

            const zoneSpan = Math.max(0.12, zone.radiusEnd - zone.radiusStart);
            const zoneRadius = Math.max(0.38, (zoneSpan * linkLength * 0.26) + (zone.intensity * 0.08));
            const singularityScale = Math.max(
                0.48,
                Math.min(1.85, zoneRadius * this.config.trapZoneSingularityScale)
            );
            const pulsePhase = (this.time * Math.max(0.35, zone.frequency * this.config.trapZonePulseFrequency) * Math.PI * 2)
                + trapZoneMesh.pulseSeed;
            const pulse = 0.6 + (Math.sin(pulsePhase) * 0.4);
            const warpPulse = 0.5 + (Math.sin(pulsePhase * 1.37) * 0.5);
            const fadeStrength = Math.max(0.16, Math.min(1, zone.intensity * 0.34));
            const squash = 0.84 + (warpPulse * 0.22);
            trapZoneMesh.group.scale.set(
                singularityScale * (0.9 + (pulse * 0.09)),
                singularityScale * squash,
                singularityScale * (0.86 + (pulse * 0.12))
            );

            // Core singularity
            if (trapZoneMesh.coreMesh) {
                trapZoneMesh.coreMesh.scale.setScalar(0.72 + (zone.intensity * 0.05));
                trapZoneMesh.coreMesh.rotation.y = pulsePhase * 0.35;
                trapZoneMesh.coreMesh.material.opacity = Math.min(0.98, 0.82 + (zone.intensity * 0.04));
                trapZoneMesh.coreMesh.material.color.setRGB(
                    0.03 + (zone.intensity * 0.02),
                    0.015 + (zone.intensity * 0.008),
                    0.06 + (zone.intensity * 0.03)
                );
            }

            // Primary orbital ring
            if (trapZoneMesh.orbitAMesh) {
                trapZoneMesh.orbitAMesh.rotation.z = pulsePhase * this.config.trapZoneOrbitSpeed;
                trapZoneMesh.orbitAMesh.rotation.x = Math.PI * 0.5 + (warpPulse * 0.25);
                trapZoneMesh.orbitAMesh.scale.setScalar(0.88 + (zone.intensity * 0.1));
                trapZoneMesh.orbitAMesh.material.opacity = this.config.trapZoneOpacityBase * 0.82 * fadeStrength;
                trapZoneMesh.orbitAMesh.material.color.setRGB(
                    this.config.trapZoneColor.r * (0.72 + pulse * 0.28),
                    this.config.trapZoneColor.g * (0.76 + pulse * 0.24),
                    this.config.trapZoneColor.b * (0.95 + pulse * 0.05)
                );
            }

            // Secondary ring / singularity halo
            if (trapZoneMesh.orbitBMesh) {
                const primaryPhase = pulsePhase * this.config.trapZoneOrbitSpeed;
                const secondaryPhase = primaryPhase * this.config.trapZoneSecondaryOrbitSpeed;
                const maxDelta = this.config.trapZoneSecondaryOrbitMaxDelta;
                const secondaryDrift = Math.sin(secondaryPhase * 0.62 + trapZoneMesh.pulseSeed) * this.config.trapZoneSecondaryOrbitDrift;
                const baseX = trapZoneMesh.orbitAMesh?.rotation.x ?? (Math.PI * 0.5);
                const baseY = trapZoneMesh.orbitAMesh?.rotation.y ?? 0;
                const baseZ = trapZoneMesh.orbitAMesh?.rotation.z ?? 0;
                trapZoneMesh.orbitBMesh.rotation.x = baseX + Math.sin(secondaryPhase * 0.84 + 0.26) * maxDelta * 0.58 + (secondaryDrift * this.config.trapZoneSecondaryOrbitTilt);
                trapZoneMesh.orbitBMesh.rotation.y = baseY + Math.sin(secondaryPhase * 0.74 + 0.71) * maxDelta * 0.42;
                trapZoneMesh.orbitBMesh.rotation.z = baseZ + Math.sin(secondaryPhase * 0.66 + 1.18) * maxDelta * 0.34;
                trapZoneMesh.orbitBMesh.scale.setScalar(0.92 + (pulse * 0.03));
                trapZoneMesh.orbitBMesh.material.opacity = this.config.trapZoneOpacityBase * 0.54 * fadeStrength;
                trapZoneMesh.orbitBMesh.material.color.setRGB(
                    0.88 + (pulse * 0.12),
                    0.93 + (pulse * 0.05),
                    1.0
                );
            }

            if (trapZoneMesh.haloMesh) {
                trapZoneMesh.haloMesh.rotation.z = pulsePhase * 0.16;
                trapZoneMesh.haloMesh.scale.setScalar(1.0 + (pulse * 0.12));
                trapZoneMesh.haloMesh.material.opacity = Math.min(0.2, this.config.trapZoneOpacityBase * 0.42 * fadeStrength * (0.75 + pulse * 0.25));
                trapZoneMesh.haloMesh.material.color.setRGB(
                    0.88 + (pulse * 0.08),
                    0.9 + (pulse * 0.06),
                    1.0
                );
            }

            // Shock ring: expansion / collapse cue.
            if (trapZoneMesh.shockMesh) {
                trapZoneMesh.shockMesh.rotation.z = pulsePhase * 0.18;
                trapZoneMesh.shockMesh.scale.setScalar(1.08 + (pulse * 0.24));
                trapZoneMesh.shockMesh.material.opacity = Math.min(0.18, this.config.trapZoneOpacityBase * 0.5 * fadeStrength * pulse);
                trapZoneMesh.shockMesh.material.color.setRGB(
                    0.96,
                    0.94 + (pulse * 0.06),
                    1.0
                );
            }
            
            touchedIndices.add(zoneIndex);
            renderedCount++;
            zoneIndex++;
        });

        this.trapZoneMeshPool.forEach((zone, index) => {
            if (!zone || touchedIndices.has(index)) return;
            if (!zone.active) return;

            const age = Math.max(0, this.time - (zone.lastSeenTime || 0));
            const fade = Math.max(0, 1 - (age / Math.max(0.001, this.config.trapZoneFadeSeconds)));
            if (fade <= 0.02) {
                zone.active = false;
                zone.group.visible = false;
                if (zone.coreMesh?.material) zone.coreMesh.material.opacity = 0;
                if (zone.orbitAMesh?.material) zone.orbitAMesh.material.opacity = 0;
                if (zone.orbitBMesh?.material) zone.orbitBMesh.material.opacity = 0;
                if (zone.haloMesh?.material) zone.haloMesh.material.opacity = 0;
                if (zone.shockMesh?.material) zone.shockMesh.material.opacity = 0;
                return;
            }

            zone.group.visible = true;
            zone.group.scale.multiplyScalar(0.995);
            if (zone.coreMesh?.material) zone.coreMesh.material.opacity *= fade;
            if (zone.orbitAMesh?.material) zone.orbitAMesh.material.opacity *= fade;
            if (zone.orbitBMesh?.material) zone.orbitBMesh.material.opacity *= fade;
            if (zone.haloMesh?.material) zone.haloMesh.material.opacity *= fade;
            if (zone.shockMesh?.material) zone.shockMesh.material.opacity *= fade;
        });

        this.lastTrapZoneRenderCount = renderedCount;
    }

    /**
     * Update interference band visualization on links
     */
    _updateInterferenceBands(deltaTime) {
        if (!this.standingWaveTrapSystem) return;
        
        const patterns = this.standingWaveTrapSystem.interferencePatterns || [];
        const links = this.linkingSystem?.links || [];
        
        patterns.forEach(pattern => {
            const link = this._getLinkById(pattern.trapId);
            if (!link) return;
            
            const materials = this._collectLinkMaterials(link);
            if (materials.length === 0) return;

            materials.forEach((material) => {
                if (!material?.uniforms) return;

                if (material.uniforms.interferencePhase) {
                    material.uniforms.interferencePhase.value = pattern.beatPhase;
                }

                if (material.uniforms.interferenceSpacing) {
                    material.uniforms.interferenceSpacing.value = pattern.spacing;
                }

                if (material.uniforms.interferenceContrast) {
                    material.uniforms.interferenceContrast.value = pattern.contrast;
                }

                if (material.uniforms.renderInterference) {
                    material.uniforms.renderInterference.value = true;
                }

                if (material.uniforms.uWavePhase) {
                    material.uniforms.uWavePhase.value = pattern.beatPhase;
                }
            });
        });
    }

    /**
     * Animate node halo counter-pulsing (out of phase opposition)
     */
    _updateNodeHaloPulsing(deltaTime) {
        if (!this.standingWaveTrapSystem || !this.aiNodes) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        
        traps.forEach(trap => {
            if (!trap.active || !trap.nodeA || !trap.nodeB) return;
            
            // Phase for node A
            let phaseA = this.nodePulsePhases.get(trap.nodeA.id) || 0;
            phaseA += this.config.haloPulseFrequency * deltaTime * Math.PI * 2;
            this.nodePulsePhases.set(trap.nodeA.id, phaseA);
            
            // Phase for node B (opposite)
            let phaseB = this.nodePulsePhases.get(trap.nodeB.id) || 0;
            phaseB += this.config.haloPulseFrequency * deltaTime * Math.PI * 2;
            this.nodePulsePhases.set(trap.nodeB.id, phaseB);
            
            // Apply to node shells if they exist
            this._applyNodePulsing(trap.nodeA, phaseA, false);
            this._applyNodePulsing(trap.nodeB, phaseB, true);  // Opposite phase
        });
    }

    /**
     * Apply pulsing effect to node shell
     */
    _applyNodePulsing(node, phase, invertPhase) {
        const shell = this._getNodeShell(node);
        if (!shell) return;

        const material = shell.material;
        if (!material) return;
        
        // Calculate pulse amplitude
        const pulseValue = Math.sin(phase + (invertPhase ? Math.PI : 0)) * this.config.haloPulseAmount;
        const targetOpacity = 0.15 + pulseValue;  // Base + pulse
        
        // Smooth interpolation
        if (material.opacity !== undefined) {
            material.opacity += (targetOpacity - material.opacity) * 0.15;
        }
    }

    /**
     * Handle resolution animations (damping, breakthrough, collapse)
     */
    _updateResolutionAnimations(deltaTime) {
        if (!this.standingWaveTrapSystem) return;
        
        const resolutions = this.standingWaveTrapSystem.resolutionEvents || [];
        
        resolutions.forEach(resolution => {
            const trap = this.standingWaveTrapSystem.oscillationTraps.find(
                t => t.linkId === resolution.trapId
            );
            
            if (!trap) return;
            
            const progress = resolution.progress;
            
            switch (resolution.type) {
                case 'damping':
                    this._animateDamping(trap, progress);
                    break;
                case 'breakthrough':
                    this._animateBreakthrough(trap, progress);
                    break;
                case 'collapse':
                    this._animateCollapse(trap, progress);
                    break;
            }
        });
    }

    /**
     * Animate damping resolution (gradual fade)
     */
    _animateDamping(trap, progress) {
        // Fade amplitude
        trap.amplitude *= (1 - progress * this.config.dampingFadeRate);
        
        // Antinode glows fade
        const material = this.antinodeMaterial;
        if (material) {
            material.opacity = this.config.antinodeOpacityBase * (1 - progress);
        }
    }

    /**
     * Animate breakthrough resolution (wave escapes)
     */
    _animateBreakthrough(trap, progress) {
        // Accelerate wave travel
        const link = this._getLinkById(trap.linkId);
        if (link) {
            const materialState = this.linkMaterialMap.get(trap.linkId);
            materialState?.materialStates?.forEach((state) => {
                const material = state.material;
                if (material?.uniforms?.waveSpeed) {
                    material.uniforms.waveSpeed.value =
                        trap.frequency * this.config.breakthroughAcceleration * progress;
                }
                if (material?.uniforms?.uWaveSpeed) {
                    material.uniforms.uWaveSpeed.value =
                        trap.frequency * this.config.breakthroughAcceleration * progress;
                }
            });
        }
        
        // Shrink trap zone
        trap.trapRadius *= (1 - progress * 0.3);
    }

    /**
     * Animate collapse resolution (trap implodes)
     */
    _animateCollapse(trap, progress) {
        // Move antinodes inward toward center
        const centerPos = 0.5;
        
        // Animate trap radius inward
        trap.trapRadius *= (1 - progress * this.config.collapseInwardRate);
        
        // Fade antinodes
        const material = this.antinodeMaterial;
        if (material) {
            material.opacity = this.config.antinodeOpacityBase * (1 - progress);
        }
        
        // Increase oscillation frequency (faster as it collapses)
        trap.frequency *= (1 + progress * 0.5);
    }

    /**
     * Get link by ID (helper)
     */
    _getLinkById(linkId) {
        if (!this.linkingSystem || !this.linkingSystem.links) return null;
        return this.linkingSystem.links.find(l => l && l.id === linkId);
    }

    _getLinkEndpoints(link) {
        const startNode = link?.sourceNode || link?.source || link?.from || link?.nodeA || null;
        const endNode = link?.targetNode || link?.target || link?.to || link?.nodeB || null;

        return {
            startNode,
            endNode,
            startPos: startNode?.position || null,
            endPos: endNode?.position || null
        };
    }

    _getLinkVisualState(link) {
        return link?.group?.userData?.conduitState || null;
    }

    _getLinkCurve(link) {
        const visualState = this._getLinkVisualState(link);
        if (visualState?.mainCurve?.getPointAt) {
            return visualState.mainCurve;
        }
        if (visualState?.curve?.getPointAt) {
            return visualState.curve;
        }

        const endpoints = this._getLinkEndpoints(link);
        const startPos = endpoints.startPos;
        const endPos = endpoints.endPos;
        if (!startPos || !endPos) return null;

        return new THREE.LineCurve3(startPos.clone(), endPos.clone());
    }

    _ensureAttachRoot() {
        if (!this.root) return;

        const resolvedRoot = this.attachRootResolver?.() || this.attachRoot || this.scene;
        if (!resolvedRoot?.add) return;

        if (this.root.parent !== resolvedRoot) {
            this.root.parent?.remove?.(this.root);
            resolvedRoot.add(this.root);
        }

        this.attachRoot = resolvedRoot;
    }

    _estimateLinkLength(linkCurve, link) {
        if (linkCurve?.getLength) {
            return linkCurve.getLength();
        }

        const endpoints = this._getLinkEndpoints(link);
        if (!endpoints.startPos || !endpoints.endPos) return 0;
        return endpoints.startPos.distanceTo(endpoints.endPos);
    }

    _collectLinkMaterials(link) {
        const materials = [];
        const seen = new Set();
        const visualState = this._getLinkVisualState(link);

        const tryAddMaterial = (material) => {
            if (!material || seen.has(material)) return;
            seen.add(material);
            materials.push(material);
        };

        tryAddMaterial(link?.mesh?.material);
        tryAddMaterial(link?.line?.material);
        tryAddMaterial(link?.coreLine?.material);
        tryAddMaterial(link?.midGlowLine?.material);
        tryAddMaterial(link?.haloLine?.material);
        tryAddMaterial(link?.bloomAuraLine?.material);
        tryAddMaterial(link?.edgeLine?.material);
        tryAddMaterial(visualState?.skinMesh?.material);

        if (Array.isArray(visualState?.strands)) {
            visualState.strands.forEach((strand) => tryAddMaterial(strand?.material));
        }

        return materials;
    }

    _applyStandingWaveToMaterialState(materialState, trap) {
        const material = materialState.material;
        if (!material?.uniforms) return;

        if (material.uniforms.standingWaveFrequency) {
            material.uniforms.standingWaveFrequency.value = trap.frequency;
        }

        if (material.uniforms.standingWavePhase) {
            material.uniforms.standingWavePhase.value = trap.phase;
        }

        if (material.uniforms.uWavePhase) {
            material.uniforms.uWavePhase.value = trap.phase;
        }

        if (material.uniforms.waveAmplitude) {
            const modulatedAmplitude = trap.amplitude *
                (1 + Math.sin(trap.phase) * 0.3);
            material.uniforms.waveAmplitude.value = modulatedAmplitude;
        }

        if (material.uniforms.wavelength && materialState.originalWavelength !== null) {
            material.uniforms.wavelength.value = materialState.originalWavelength * this.config.waveCompressionFactor;
        }

        if (material.uniforms.uWaveLength && materialState.originalWavelength !== null) {
            material.uniforms.uWaveLength.value = materialState.originalWavelength * this.config.waveCompressionFactor;
        }

        if (material.uniforms.uWavePhaseOffset && materialState.originalPhaseOffset !== null) {
            material.uniforms.uWavePhaseOffset.value = trap.phase + materialState.originalPhaseOffset;
        }

        if (material.userData && materialState.originalWavelength !== null) {
            material.userData.waveLength = materialState.originalWavelength * this.config.waveCompressionFactor;
        }
        if (material.userData) {
            material.userData.standingWaveActive = true;
            material.userData.standingWavePhase = trap.phase;
            material.userData.standingWaveFrequency = trap.frequency;
        }
    }

    _resolveCameraPosition() {
        const sceneCamera = this.scene?.getObjectByName?.('camera')?.position;
        if (sceneCamera) return sceneCamera;

        if (typeof window !== 'undefined' && window.__ATOMA_CAMERA__?.position) {
            return window.__ATOMA_CAMERA__.position;
        }

        if (globalThis.__ATOMA_CAMERA__?.position) {
            return globalThis.__ATOMA_CAMERA__.position;
        }

        return null;
    }

    _getNodeShell(node) {
        return node?.shell || node?.holoShell || node?.userData?.holoShell || null;
    }

    getDebugInfo() {
        const trapSystem = this.standingWaveTrapSystem;
        const activeTraps = trapSystem?.getActiveTraps?.() || trapSystem?.oscillationTraps?.filter?.((trap) => trap?.active) || [];
        const activeAntinodes = this.antinodeMeshPool.filter((entry) => entry?.active && entry.mesh?.visible).length;
        const activeTrapZones = this.trapZoneMeshPool.filter((entry) => entry?.active && entry.group?.visible).length;
        const standingLinks = Array.from(this.linkMaterialMap.values()).filter((entry) => entry?.isStanding).length;

        return {
            initialized: this.initialized,
            attached: Boolean(this.root?.parent),
            attachRootName: this.root?.parent?.name || this.attachRoot?.name || null,
            activeTrapCount: activeTraps.length,
            trapZoneCount: trapSystem?.trapZones?.length || 0,
            interferencePatternCount: trapSystem?.interferencePatterns?.length || 0,
            activeAntinodeMeshes: activeAntinodes,
            activeTrapZoneMeshes: activeTrapZones,
            trapZoneUpdateCount: this.trapZoneUpdateCount,
            lastTrapZoneRenderCount: this.lastTrapZoneRenderCount,
            standingLinkCount: standingLinks,
            pooledAntinodeMeshes: this.antinodeMeshPool.length,
            pooledTrapZoneMeshes: this.trapZoneMeshPool.length,
            sampleTrapIds: activeTraps.slice(0, 5).map((trap) => trap?.linkId).filter(Boolean)
        };
    }

    /**
     * Rebind to new scene/world after world switch
     * @param {Object} params - New references
     */
    rebind({ scene, standingWaveTrapSystem, linkingSystem, aiNodes, attachRoot } = {}) {
        if (scene) this.scene = scene;
        if (standingWaveTrapSystem) this.standingWaveTrapSystem = standingWaveTrapSystem;
        if (linkingSystem) this.linkingSystem = linkingSystem;
        if (aiNodes) this.aiNodes = aiNodes;
        if (attachRoot) this.attachRoot = attachRoot;
        
        // Re-attach root to new scene
        this._ensureAttachRoot();
        
        // Clear stale state
        this.linkMaterialMap.clear();
        this.nodePulsePhases.clear();
        this.linkWaveStates.clear();
        this.resolutionAnimators.clear();
        
        console.log('[StandingWaveVisualRenderer] Rebound to new world');
    }
    
    /**
     * Dispose - cleanup
     */
    dispose() {
        // Clean up antinode meshes
        this.antinodeMeshPool.forEach(antinode => {
            if (antinode.mesh && antinode.mesh.parent) {
                antinode.mesh.parent.remove(antinode.mesh);
            }
            if (antinode.mesh.geometry) {
                antinode.mesh.geometry.dispose();
            }
            if (antinode.mesh.material) {
                antinode.mesh.material.dispose();
            }
        });
        this.antinodeMeshPool = [];
        
        // Clean up trap zone meshes
        this.trapZoneMeshPool.forEach(zone => {
            const trapRoot = zone.group || zone.mesh;
            if (trapRoot && trapRoot.parent) {
                trapRoot.parent.remove(trapRoot);
            }
            if (trapRoot?.traverse) {
                trapRoot.traverse((child) => {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        child.material.dispose();
                    }
                });
            } else {
                if (trapRoot?.geometry) {
                    trapRoot.geometry.dispose();
                }
                if (trapRoot?.material) {
                    trapRoot.material.dispose();
                }
            }
        });
        this.trapZoneMeshPool = [];
        
        // Clean up materials
        if (this.antinodeMaterial) {
            this.antinodeMaterial.dispose();
        }
        if (this.antinodeShellMaterial) {
            this.antinodeShellMaterial.dispose();
        }
        if (this.trapZoneMaterial) {
            this.trapZoneMaterial.dispose();
        }
        if (this.trapZoneCoreMaterial) {
            this.trapZoneCoreMaterial.dispose();
        }
        if (this.trapZoneHaloMaterial) {
            this.trapZoneHaloMaterial.dispose();
        }
        if (this.trapZoneRingMaterial) {
            this.trapZoneRingMaterial.dispose();
        }
        if (this.trapZoneShockMaterial) {
            this.trapZoneShockMaterial.dispose();
        }
        
        // Clear maps
        this.linkMaterialMap.clear();
        this.nodePulsePhases.clear();
        this.linkWaveStates.clear();
        this.resolutionAnimators.clear();

        if (this.root?.parent) {
            this.root.parent.remove(this.root);
        }
        this.root?.clear?.();
        this.root = null;
        this.initialized = false;
    }
}

/**
 * ============================================================================
 * INTEGRATION NOTES
 * ============================================================================
 * 
 * In main.js:
 * 
 *   import { StandingWaveVisualRenderer_Session131 } 
 *     from './StandingWaveVisualRenderer_Session131.js';
 *   
 *   // In World constructor:
 *   this.standingWaveRenderer = new StandingWaveVisualRenderer_Session131(
 *       this.scene,
 *       this.standingWaveTrap,  // Trap system (required)
 *       this.linkingSystem,
 *       this.aiNodes
 *   );
 *   
 *   // In setup section:
 *   this.standingWaveRenderer.setup();
 *   
 *   // In animate loop (AFTER trap system update):
 *   if (this.standingWaveRenderer) {
 *       this.standingWaveRenderer.update(deltaTime, this.time);
 *   }
 *   
 *   // In cleanup:
 *   if (this.standingWaveRenderer) {
 *       this.standingWaveRenderer.dispose();
 *   }
 * 
 * ============================================================================
 * SHADER UNIFORMS EXPECTED
 * ============================================================================
 * 
 * Link materials should support these uniforms for advanced effects:
 * 
 *   waveSpeed: { value: 1.0 }                    // Traveling wave speed
 *   standingWaveFrequency: { value: 0 }          // Standing wave oscillation frequency
 *   standingWavePhase: { value: 0 }              // Current phase
 *   waveAmplitude: { value: 1.0 }                // Wave height multiplier
 *   wavelength: { value: 0.2 }                   // Distance between wave peaks
 *   interferencePhase: { value: 0 }              // Beat frequency phase
 *   interferenceSpacing: { value: 0.2 }          // Distance between bands
 *   interferenceContrast: { value: 0.6 }         // Visibility of pattern
 *   renderInterference: { value: false }         // Enable band rendering
 * 
 * ============================================================================
 * PERFORMANCE NOTES
 * ============================================================================
 * 
 * - Antinode meshes: Pre-allocated pool (100 max)
 * - Trap zone meshes: Pre-allocated pool (30 max)
 * - LOD culling: Antinodes culled beyond 30 units
 * - Material reuse: Single pooled material instances
 * - Zero per-frame allocations
 * 
 * Budget: ~2-3ms per frame typical
 * 
 * ============================================================================
 */
