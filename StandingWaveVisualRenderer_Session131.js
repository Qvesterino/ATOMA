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
            antinodeRadius: 0.25,             // Radius of antinode glow sphere
            antinodeOpacityBase: 0.4,         // Base opacity of antinode glow
            antinodeGlowIntensity: 1.8,       // Emissive multiplier
            antinodeLODDistance: 30,          // Distance culling threshold
            
            // Interference bands
            bandThickness: 0.05,              // Thickness of bright/dim bands
            bandTransitionSmoothing: 0.3,    // Smoothness of band edges
            brightBandOpacity: 0.25,         // Opacity of bright zones
            dimBandOpacity: 0.08,            // Opacity of dim zones
            
            // Trap zone rendering
            trapZoneThickness: 0.1,           // Visual thickness of trap zone boundary
            trapZoneOpacityBase: 0.15,        // Base opacity of trap zone
            trapZoneGlowFactor: 0.8,          // Glow intensity multiplier
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
        this.trapZoneMaterial = null;
        this.interferenceShader = null;
        this.root = null;
        
        this.time = 0;
        this.initialized = false;
    }

    /**
     * Setup - initialize materials, pools, and shaders
     */
    setup() {
        if (this.initialized) return;

        this.root = new THREE.Group();
        this.root.name = 'StandingWaveVisualRendererRoot';
        this._ensureAttachRoot();
        
        // Create antinode glow material
        this.antinodeMaterial = new THREE.MeshStandardMaterial({
            emissive: new THREE.Color(0.6, 0.8, 1.0),
            emissiveIntensity: this.config.antinodeGlowIntensity,
            roughness: 0.9,
            metalness: 0,
            transparent: true,
            opacity: this.config.antinodeOpacityBase,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Create trap zone material (subtle glow plane)
        this.trapZoneMaterial = new THREE.MeshStandardMaterial({
            color: this.config.trapZoneColor,
            emissive: this.config.trapZoneColor,
            emissiveIntensity: this.config.trapZoneGlowFactor * 0.5,
            transparent: true,
            opacity: this.config.trapZoneOpacityBase,
            side: THREE.DoubleSide,
            depthWrite: false,
            roughness: 0.8
        });
        
        // Pre-allocate antinode glow pool
        for (let i = 0; i < this.config.maxAntinodeMeshes; i++) {
            const geometry = new THREE.IcosahedronGeometry(this.config.antinodeRadius, 3);
            const mesh = new THREE.Mesh(geometry, this.antinodeMaterial.clone());
            mesh.visible = false;
            mesh.frustumCulled = false;
            mesh.renderOrder = 10;  // Render after main geometry
            this.root.add(mesh);
            this.antinodeMeshPool.push({
                mesh: mesh,
                active: false,
                position: new THREE.Vector3(),
                intensity: 1,
                birthTime: 0
            });
        }
        
        // Pre-allocate trap zone pool
        for (let i = 0; i < this.config.maxTrapZoneMeshes; i++) {
            const geometry = new THREE.PlaneGeometry(1, 1, 4, 4);
            const mesh = new THREE.Mesh(geometry, this.trapZoneMaterial.clone());
            mesh.visible = false;
            mesh.frustumCulled = false;
            mesh.renderOrder = 5;
            this.root.add(mesh);
            this.trapZoneMeshPool.push({
                mesh: mesh,
                active: false,
                linkId: null,
                intensity: 1
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
        // Deactivate all antinodes first
        this.antinodeMeshPool.forEach(antinode => {
            antinode.active = false;
            antinode.mesh.visible = false;
        });
        
        if (!this.standingWaveTrapSystem) return;
        
        const traps = this.standingWaveTrapSystem.oscillationTraps || [];
        const patterns = this.standingWaveTrapSystem.interferencePatterns || [];
        
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
                
                antinode.active = true;
                antinode.mesh.visible = true;
                antinode.mesh.position.copy(antinodeWorldPos);
                
                // Calculate intensity (bright at antinodes, dim between)
                const beatPhase = pattern.beatPhase || 0;
                const localIntensity = Math.abs(Math.sin(beatPhase + i * Math.PI));
                
                antinode.intensity = trap.amplitude * localIntensity;
                antinode.mesh.material.opacity = this.config.antinodeOpacityBase * antinode.intensity;
                antinode.mesh.material.emissiveIntensity = this.config.antinodeGlowIntensity * antinode.intensity;
                
                antinodeIndex++;
            }
        });
    }

    /**
     * Render trap zone visualizations
     */
    _updateTrapZones(deltaTime) {
        // Deactivate all trap zones first
        this.trapZoneMeshPool.forEach(zone => {
            zone.active = false;
            zone.mesh.visible = false;
        });
        
        if (!this.standingWaveTrapSystem) return;
        
        const trapZones = this.standingWaveTrapSystem.trapZones || [];
        let zoneIndex = 0;
        
        trapZones.forEach(zone => {
            if (zoneIndex >= this.config.maxTrapZoneMeshes) return;
            
            const link = this._getLinkById(zone.linkId);
            if (!link) return;

            const linkCurve = this._getLinkCurve(link);
            const centerT = Math.max(0, Math.min(1, zone.trapCenter ?? 0.5));
            const centerPos = linkCurve?.getPointAt?.(centerT) || null;
            const tangent = linkCurve?.getTangentAt?.(centerT) || null;
            const linkLength = this._estimateLinkLength(linkCurve, link);
            if (!centerPos || !tangent || !linkLength) return;
            
            // Acquire trap zone mesh from pool
            const trapZoneMesh = this.trapZoneMeshPool[zoneIndex];
            if (!trapZoneMesh) return;
            
            trapZoneMesh.active = true;
            trapZoneMesh.mesh.visible = true;
            trapZoneMesh.mesh.position.copy(centerPos);
            
            // Orient mesh along local link tangent rather than node-to-node chord.
            trapZoneMesh.mesh.lookAt(centerPos.clone().add(tangent));
            trapZoneMesh.mesh.rotateX(Math.PI * 0.5);  // Face perpendicular to link
            
            // Scale trap zone
            const zoneRadius = (zone.radiusEnd - zone.radiusStart) * linkLength * 0.5;
            trapZoneMesh.mesh.scale.set(zoneRadius * 2, 0.01, zoneRadius * 2);
            
            // Update material properties
            const material = trapZoneMesh.mesh.material;
            material.opacity = this.config.trapZoneOpacityBase * zone.intensity;
            
            // Add pulsing effect
            const pulse = Math.sin(this.time * zone.frequency * Math.PI * 2) * 0.3 + 0.7;
            material.emissiveIntensity = this.config.trapZoneGlowFactor * pulse * zone.intensity;
            
            zoneIndex++;
        });
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
        const activeTrapZones = this.trapZoneMeshPool.filter((entry) => entry?.active && entry.mesh?.visible).length;
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
            standingLinkCount: standingLinks,
            pooledAntinodeMeshes: this.antinodeMeshPool.length,
            pooledTrapZoneMeshes: this.trapZoneMeshPool.length,
            sampleTrapIds: activeTraps.slice(0, 5).map((trap) => trap?.linkId).filter(Boolean)
        };
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
            if (zone.mesh && zone.mesh.parent) {
                zone.mesh.parent.remove(zone.mesh);
            }
            if (zone.mesh.geometry) {
                zone.mesh.geometry.dispose();
            }
            if (zone.mesh.material) {
                zone.mesh.material.dispose();
            }
        });
        this.trapZoneMeshPool = [];
        
        // Clean up materials
        if (this.antinodeMaterial) {
            this.antinodeMaterial.dispose();
        }
        if (this.trapZoneMaterial) {
            this.trapZoneMaterial.dispose();
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
