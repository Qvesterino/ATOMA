/**
 * ============================================================================
 * GLYPH FUSION ZONE
 * ============================================================================
 * 
 * Manages procedural glyph fusion at node convergence zones.
 * 
 * CORE CONCEPT:
 * When multiple links converge at a node, their glyphs synthesize
 * into a composite semantic expression representing higher-order intent.
 * 
 * PHASES:
 * 1. Approach: Glyphs slow, compress, align
 * 2. Morph: Shapes soften/interlock
 * 3. Synthesis: Merge into composite glyph
 * 
 * FUSION IS REVERSIBLE:
 * When conditions change, glyphs separate gracefully.
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { getLinkSynergy, getNodeCanonicalMetrics } from './SemanticMetricAdapter.js';
import { NeuralConvergenceSingularity } from './NeuralConvergenceSingularity.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Zone detection
    FUSION_RADIUS: 1.5,
    CONVERGENCE_THRESHOLD: 2,  // Min glyphs to trigger fusion
    
    // Timing
    APPROACH_DURATION: 1.2,    // Slowing + compression phase
    MORPH_DURATION: 0.8,       // Shape morphing phase
    SYNTHESIS_DURATION: 0.6,   // Merging phase
    TOTAL_FUSION_DURATION: 2.6, // Total time to complete
    
    // Approach phase
    APPROACH_SPEED_FACTOR: 0.25,     // Slow to 25%
    COMPRESSION_FACTOR: 0.6,          // Compress spacing to 60%
    ALIGNMENT_STRENGTH: 0.9,          // 90% alignment
    
    // Synthesis
    COMPOSITE_OPACITY: 0.85,  // Slightly more opaque than layer glyphs
    COMPOSITE_SIZE_MULTIPLIER: 1.3,  // 30% larger
    COMPOSITE_ROTATION_SPEED: 0.3,   // Very slow rotation
    
    // Persistence
    COMPOSITE_LIFETIME: 8.0,          // 8 seconds
    HARMONIC_HUB_MULTIPLIER: 1.5,     // Lasts 1.5× longer in hubs
    
    // Separation
    SEPARATION_TRIGGER_THRESHOLD: 2,  // Links must be < 2 to separate
    
    // Performance
    MAX_ZONES_PER_SCENE: 20,
    POOL_SIZE: 20  // Composite glyphs
};

// ============================================================================
// FUSION ZONE STATE
// ============================================================================

class FusionZoneState {
    constructor() {
        this.active = false;
        this.node = null;
        this.sourceGlyphs = [];
        this.convergedLinks = [];
        
        // Fusion state
        this.phase = 'IDLE';  // IDLE, APPROACHING, MORPHING, SYNTHESIZED, SEPARATING
        this.phaseProgress = 0.0;
        this.age = 0.0;
        this.lifetime = CONFIG.COMPOSITE_LIFETIME;
        
        // Composite glyph
        this.compositeGlyph = null;
        this.compositeMesh = null;
        
        // Context
        this.harmonBalance = 0.5;
        this.averageSynergy = 0.5;
        this.isInHarmonicHub = false;
        
        // History (memory layer for hub)
        this.memoryTraces = [];
    }

    reset() {
        if (this.compositeGlyph?.reset) {
            this.compositeGlyph.reset();
        }
        this.active = false;
        this.node = null;
        this.sourceGlyphs.length = 0;
        this.convergedLinks.length = 0;
        this.phase = 'IDLE';
        this.phaseProgress = 0.0;
        this.age = 0.0;
        this.compositeGlyph = null;
        if (this.compositeMesh) {
            this.compositeMesh.visible = false;
        }
        this.compositeMesh = null;
        this.memoryTraces.length = 0;
    }

    initiateFusion(node, glyphs, links, context) {
        this.active = true;
        this.node = node;
        this.sourceGlyphs = glyphs.slice();
        this.convergedLinks = links.slice();
        this.phase = 'APPROACHING';
        this.phaseProgress = 0.0;
        this.age = 0.0;
        this.harmonBalance = context.harmonyBalance;
        this.averageSynergy = context.averageSynergy;
        this.isInHarmonicHub = context.isInHarmonicHub;
        
        // Adjust lifetime for harmonic hubs
        this.lifetime = CONFIG.COMPOSITE_LIFETIME;
        if (this.isInHarmonicHub) {
            this.lifetime *= CONFIG.HARMONIC_HUB_MULTIPLIER;
        }
    }
}

// ============================================================================
// COMPOSITE GLYPH INSTANCE
// ============================================================================

class CompositeGlyphInstance {
    constructor(singularity) {
        this.singularity = singularity;  // NeuralConvergenceSingularity instance
        this.mesh = singularity.group;   // Reference to group for compatibility
        this.active = false;
        this.state = null;  // Reference to parent FusionZoneState
        this.progress = 0.0;  // 0-1 fade in
        this.rotationPhase = 0.0;
    }

    reset() {
        this.active = false;
        this._clearGeneratedCompositeVisual();
        if (this.singularity) {
            this.singularity.deactivate();
        }
        this.state = null;
        this.generatedVisual = null;
    }

    _clearGeneratedCompositeVisual() {
        if (!this.mesh) return;

        const generatedRoot = this.mesh.getObjectByName('GeneratedCompositeGlyph');
        if (!generatedRoot) return;

        generatedRoot.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((material) => material?.dispose?.());
                } else {
                    child.material.dispose?.();
                }
            }
        });

        generatedRoot.parent?.remove(generatedRoot);
    }

    spawn(position, state) {
        this.active = true;
        this.state = state;
        this.progress = 0.0;
        this.rotationPhase = Math.random() * Math.PI * 2;
        
        // Activate singularity with context
        if (this.singularity) {
            const context = {
                harmony: state?.harmonyBalance ?? 0.5,
                corruption: state?.corruptionBalance ?? 0,
                synergy: state?.averageSynergy ?? 0.5,
                connectedNodes: state?.nodes ?? []
            };
            this.singularity.activate(position, context);
        }
    }

    update(deltaTime, cameraPosition = null) {
        if (!this.active || !this.state) return;
        if (this.frameScheduler?.shouldRunSimulation && !this.frameScheduler.shouldRunSimulation()) return;
        
        // Fade in during synthesis
        if (this.progress < 1.0) {
            this.progress += deltaTime / CONFIG.SYNTHESIS_DURATION;
        }

        // Update singularity
        if (this.singularity) {
            const context = {
                harmony: this.state?.harmonyBalance ?? 0.5,
                corruption: this.state?.corruptionBalance ?? 0,
                synergy: this.state?.averageSynergy ?? 0.5,
                cameraPosition
            };
            this.singularity.update(deltaTime, context);
        }

        if (this.generatedVisual?.userData?.updateCompositeVisual) {
            this.generatedVisual.userData.updateCompositeVisual(deltaTime, cameraPosition);
        }
    }
}

// ============================================================================
// MAIN FUSION ZONE MANAGER
// ============================================================================

export class GlyphFusionZoneManager {
    
    constructor(scene, worldRoot, compositeGlyphGenerator) {
        this.scene = scene;
        this.worldRoot = worldRoot;
        this._attachRoot = worldRoot || scene;
        this.compositeGlyphGenerator = compositeGlyphGenerator;

        // Fusion zones
        this.zones = [];
        for (let i = 0; i < CONFIG.MAX_ZONES_PER_SCENE; i++) {
            this.zones.push(new FusionZoneState());
        }

        // Composite glyph pool
        this.compositeGlyphs = [];
        this.initializeCompositeGlyphPool();

        // Node-to-zone mapping
        this.nodeZoneMap = new Map();  // nodeId -> zone

        // Update timer
        this.updateTimer = 0.0;

        console.log('[GlyphFusionZoneManager] Initialized');
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    initializeCompositeGlyphPool() {
        const container = new THREE.Group();
        container.name = 'CompositeGlyphPool';
        container.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE);
        this._attachRoot.add(container);
        this.container = container;
        this.root = container;

        for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
            // NEW: Neural Convergence Singularity instead of placeholder plane
            const singularity = new NeuralConvergenceSingularity(this.scene, {
                coreRadius: 0.12,
                coreDetail: 3,
                orbitalStreams: 4,
                orbitalParticlesPerStream: 16,
                tendrilCount: 3,
                tendrilLength: 0.8,
                riftOuterRadius: 0.5,
                pulseInterval: 3.0,
                enableOrbitalStreams: true,
                enableTendrils: true,
                enableRift: true,
                enablePulses: true
            });
            
            singularity.group.visible = false;
            container.add(singularity.group);

            const instance = new CompositeGlyphInstance(singularity);
            this.compositeGlyphs.push(instance);
        }
    }

    resetForWorldSwitch({ scene = this.scene, worldRoot = this.worldRoot, camera = null, linkingSystem = null, aiNodes = null } = {}) {
        this.scene = scene || this.scene;
        this.worldRoot = worldRoot || this.worldRoot;
        this._attachRoot = this.worldRoot || this.scene;

        if (this.container && this._attachRoot && this.container.parent !== this._attachRoot) {
            this.container.parent?.remove(this.container);
            this._attachRoot.add(this.container);
        }

        if (this.compositeGlyphGenerator?.resetForWorldSwitch) {
            this.compositeGlyphGenerator.resetForWorldSwitch(
                this.scene,
                camera || this.compositeGlyphGenerator.camera || null,
                { linkingSystem, aiNodes }
            );
        }

        return this;
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    update(deltaTime, pictograms, linkingSystem, aiNodes) {
        // Detect convergence zones
        this.detectConvergenceZones(pictograms, linkingSystem, aiNodes);

        // Update active zones
        this.updateActiveFusionZones(deltaTime);

        // Update composite glyphs
        this.updateCompositeGlyphs(deltaTime);
    }

    // ========================================================================
    // CONVERGENCE DETECTION
    // ========================================================================

    detectConvergenceZones(pictograms, linkingSystem, aiNodes) {
        if (!linkingSystem || !aiNodes) return;

        // Build node-to-glyphs map
        const nodeGlyphMap = new Map();

        pictograms.forEach(pictogram => {
            if (!pictogram.active || !pictogram.link) return;

            const nodeA = pictogram.link.userData?.nodeA;
            const nodeB = pictogram.link.userData?.nodeB;

            // Check proximity to nodes
            if (nodeA) {
                const dist = pictogram.mesh.position.distanceTo(nodeA.position);
                if (dist < CONFIG.FUSION_RADIUS) {
                    if (!nodeGlyphMap.has(nodeA.uuid)) {
                        nodeGlyphMap.set(nodeA.uuid, []);
                    }
                    nodeGlyphMap.get(nodeA.uuid).push({
                        glyph: pictogram,
                        node: nodeA,
                        link: pictogram.link,
                        distance: dist
                    });
                }
            }

            if (nodeB) {
                const dist = pictogram.mesh.position.distanceTo(nodeB.position);
                if (dist < CONFIG.FUSION_RADIUS) {
                    if (!nodeGlyphMap.has(nodeB.uuid)) {
                        nodeGlyphMap.set(nodeB.uuid, []);
                    }
                    nodeGlyphMap.get(nodeB.uuid).push({
                        glyph: pictogram,
                        node: nodeB,
                        link: pictogram.link,
                        distance: dist
                    });
                }
            }
        });

        // Check fusion conditions
        nodeGlyphMap.forEach((glyphsAtNode, nodeId) => {
            if (glyphsAtNode.length < CONFIG.CONVERGENCE_THRESHOLD) return;

            const node = glyphsAtNode[0].node;
            const links = glyphsAtNode.map(g => g.link);

            // Check if node is in collapse state
            if (node.userData?.isolated || node.userData?.failureCountdown) return;

            // Find or create zone
            let zone = this.nodeZoneMap.get(nodeId);
            if (!zone) {
                zone = this.zones.find(z => !z.active);
                if (!zone) return;

                this.nodeZoneMap.set(nodeId, zone);
            }

            // Initiate fusion
            const context = this.calculateFusionContext(glyphsAtNode);
            zone.initiateFusion(node, glyphsAtNode.map(g => g.glyph), links, context);
        });
    }

    calculateFusionContext(glyphsAtNode) {
        let harmonySum = 0;
        let corruptionSum = 0;
        let synergySum = 0;
        let count = 0;

        glyphsAtNode.forEach(g => {
            const link = g.link;
            if (!link || !link.userData) return;

            const nodeA = link.userData.nodeA;
            const nodeB = link.userData.nodeB;

            const nodeAMetrics = getNodeCanonicalMetrics(nodeA) ?? {};
            const nodeBMetrics = getNodeCanonicalMetrics(nodeB) ?? {};
            const avgHarmony = ((nodeAMetrics.harmony ?? 0) + (nodeBMetrics.harmony ?? 0)) / 2;
            const avgCorruption = ((nodeAMetrics.corruption ?? 0) + (nodeBMetrics.corruption ?? 0)) / 2;
            const avgStability = ((nodeAMetrics.stability ?? 0.5) + (nodeBMetrics.stability ?? 0.5)) / 2;
            const synergy = getLinkSynergy(link);

            harmonySum += avgHarmony;
            corruptionSum += avgCorruption;
            synergySum += synergy;
            count += 1;
        });

        const harmonyBalance = harmonySum / Math.max(count, 1);
        const corruptionBalance = corruptionSum / Math.max(count, 1);
        const averageSynergy = synergySum / Math.max(count, 1);

        // Check if in harmonic hub (high harmony, low corruption)
        const isInHarmonicHub = harmonyBalance > 0.7 && corruptionBalance < 0.3;

        return {
            harmonyBalance: harmonyBalance,
            corruptionBalance: corruptionBalance,
            averageSynergy: averageSynergy,
            isInHarmonicHub: isInHarmonicHub,
            harmony: harmonyBalance,
            corruption: corruptionBalance,
            synergy: averageSynergy,
            stability: avgStability,
            loadPressure: Math.max(0, Math.min(1, 1.0 - harmonyBalance))
        };
    }

    // ========================================================================
    // FUSION ZONE UPDATE
    // ========================================================================

    updateActiveFusionZones(deltaTime) {
        this.zones.forEach(zone => {
            if (!zone.active) return;

            zone.phaseProgress += deltaTime;
            zone.age += deltaTime;

            // Update phases
            if (zone.phase === 'APPROACHING' && zone.phaseProgress >= CONFIG.APPROACH_DURATION) {
                zone.phase = 'MORPHING';
                zone.phaseProgress = 0.0;
            }

            if (zone.phase === 'MORPHING' && zone.phaseProgress >= CONFIG.MORPH_DURATION) {
                zone.phase = 'SYNTHESIZED';
                zone.phaseProgress = 0.0;
                this.createCompositeGlyph(zone);
            }

            // Update source glyph behavior
            this.updateSourceGlyphBehavior(zone, deltaTime);

            // Check if should separate
            if (zone.age >= zone.lifetime) {
                this.initiateSeparation(zone);
            }

            // Check if conditions changed
            if (zone.phase === 'SYNTHESIZED' && zone.convergedLinks.length < CONFIG.CONVERGENCE_THRESHOLD) {
                this.initiateSeparation(zone);
            }
        });
    }

    updateSourceGlyphBehavior(zone, deltaTime) {
        const progress = Math.min(zone.phaseProgress / CONFIG.APPROACH_DURATION, 1.0);

        zone.sourceGlyphs.forEach((glyph, index) => {
            if (!glyph.active) return;

            const total = zone.sourceGlyphs.length;

            if (zone.phase === 'APPROACHING') {
                // Slow down
                glyph.baseSpeed *= CONFIG.APPROACH_SPEED_FACTOR;

                // Compress spacing
                const spacing = 1.0 - (progress * (1.0 - CONFIG.COMPRESSION_FACTOR));
                glyph.linkProgress += (index / total - glyph.linkProgress) * spacing * progress;

                // Align toward center
                const alignment = Math.sin(progress * Math.PI) * CONFIG.ALIGNMENT_STRENGTH;
                glyph.lateralPhase += alignment * deltaTime;

            } else if (zone.phase === 'MORPHING') {
                // Fade out source glyphs
                const fadeProgress = zone.phaseProgress / CONFIG.MORPH_DURATION;
                const fadeOpacity = 1.0 - fadeProgress * 0.7;
                glyph.mesh.material.opacity *= fadeOpacity;

            } else if (zone.phase === 'SYNTHESIZED') {
                // Hide source glyphs
                glyph.mesh.visible = false;
            }
        });
    }

    // ========================================================================
    // COMPOSITE GLYPH CREATION
    // ========================================================================

    createCompositeGlyph(zone) {
        if (!zone.sourceGlyphs || zone.sourceGlyphs.length < 2) return;

        // Extract source glyph types
        const sourceTypes = zone.sourceGlyphs
            .map((glyph, index) =>
                glyph?.currentState ||
                glyph?.semanticState ||
                glyph?.glyphType ||
                glyph?.link?.userData?.semanticType ||
                glyph?.link?.userData?.type ||
                `GLYPH_${index + 1}`
            )
            .filter(Boolean);

        // Generate composite geometry
        const harmonyBalance = zone.harmonBalance ?? zone.harmonyBalance ?? 0.5;
        const context = {
            harmonyBalance,
            harmony: harmonyBalance,
            corruption: 1.0 - harmonyBalance,
            synergy: zone.averageSynergy,
            stability: Math.max(0, Math.min(1, 1.0 - (zone.corruptionBalance ?? (1.0 - harmonyBalance)))),
            loadPressure: Math.max(0, Math.min(1, zone.corruptionBalance ?? (1.0 - harmonyBalance)))
        };

        // Get or create composite glyph (now NeuralConvergenceSingularity)
        const composite = this.compositeGlyphs.find(c => !c.active);
        if (!composite) return;

        const compositeId = zone.node?.uuid || zone.node?.userData?.id || zone.node?.id || `composite-${Date.now().toString(36)}`;
        const sourceNodeIds = zone.sourceGlyphs
            .map((glyph) => glyph?.node?.uuid || glyph?.node?.userData?.id || glyph?.link?.userData?.nodeA?.uuid || glyph?.link?.userData?.nodeB?.uuid)
            .filter(Boolean);

        // Position/orbit anchor for singularity
        const anchorPosition = zone.node.position.clone();
        anchorPosition.y += 0.5;  // Keep the orbit centered above the node

        // Prepare context for singularity activation
        const singularityContext = {
            harmony: harmonyBalance,
            corruption: context.corruption,
            synergy: zone.averageSynergy ?? 0.5,
            connectedNodes: zone.nodes ?? [],
            orbitAnchor: anchorPosition,
            orbitRadius: zone.orbitRadius ?? 0.42,
            orbitHeight: zone.orbitHeight ?? 0.08,
            orbitSpeed: zone.orbitSpeed ?? 0.6,
            orbitPhase: zone.orbitPhase ?? Math.random() * Math.PI * 2
        };

        // Store metadata
        composite.id = compositeId;
        composite.sourceNodeIds = sourceNodeIds;
        composite.glyphData = {
            harmony: harmonyBalance,
            harmonyDominance: harmonyBalance,
            corruption: 1.0 - harmonyBalance,
            corruptionLevel: 1.0 - harmonyBalance,
            synergyCoherence: zone.averageSynergy ?? 0.5,
            stabilityIndex: context.stability ?? 0.5
        };

        // Activate the Neural Convergence Singularity
        composite.spawn(anchorPosition, {
            ...zone,
            ...singularityContext,
            harmonyBalance,
            ...context
        });

        // Attach the generated composite geometry so the fusion result is visible in runtime.
        const generatedCompositeVisual =
            this.compositeGlyphGenerator?.generateCompositeVisual?.(sourceTypes, context)
            || this.compositeGlyphGenerator?.generateComposite?.(sourceTypes, context)
            || null;
        if (generatedCompositeVisual && composite.mesh) {
            this._attachGeneratedCompositeVisual(composite, generatedCompositeVisual, harmonyBalance, context);
        }

        zone.compositeGlyph = composite;
        zone.compositeMesh = composite.mesh;

        this.compositeGlyphGenerator?.resonanceFeedback?.registerCompositeGlyph?.(composite);
    }

    _attachGeneratedCompositeVisual(composite, visualOrGeometry, harmonyBalance, context) {
        if (!composite?.mesh || !visualOrGeometry) return;

        composite._clearGeneratedCompositeVisual?.();

        if (visualOrGeometry.isObject3D) {
            const generatedRoot = visualOrGeometry;
            generatedRoot.name = generatedRoot.name || 'GeneratedCompositeGlyph';
            generatedRoot.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE);
            generatedRoot.userData ??= {};
            generatedRoot.userData.isGeneratedCompositeVisual = true;
            generatedRoot.userData.spinPhase = Math.random() * Math.PI * 2;
            generatedRoot.userData.spinSpeed = 0.28 + (context.averageSynergy ?? context.synergy ?? 0.5) * 0.12;
            generatedRoot.userData.updateCompositeVisual = (deltaTime) => {
                generatedRoot.userData.spinPhase += deltaTime * generatedRoot.userData.spinSpeed;
                generatedRoot.rotation.y += deltaTime * generatedRoot.userData.spinSpeed;
                generatedRoot.rotation.z = Math.sin(generatedRoot.userData.spinPhase * 0.7) * 0.05;
            };
            generatedRoot.traverse?.((child) => {
                if (child?.isMesh) {
                    child.userData ??= {};
                    child.userData.isGeneratedCompositeVisual = true;
                    child.renderOrder = generatedRoot.renderOrder;
                }
            });
            composite.mesh.add(generatedRoot);
            composite.generatedVisual = generatedRoot;
            return;
        }

        const geometry = visualOrGeometry;
        const generatedRoot = new THREE.Group();
        generatedRoot.name = 'GeneratedCompositeGlyph';
        generatedRoot.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE);
        generatedRoot.userData.isGeneratedCompositeVisual = true;

        const runtimeGeometry = geometry.clone();
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: this.getCompositeColor(harmonyBalance),
            transparent: true,
            opacity: CONFIG.COMPOSITE_OPACITY,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });
        const fillMesh = new THREE.Mesh(runtimeGeometry, fillMaterial);
        fillMesh.position.y = 0.02;
        fillMesh.renderOrder = generatedRoot.renderOrder;
        fillMesh.userData.isGeneratedCompositeVisual = true;
        generatedRoot.add(fillMesh);

        this._decorateCompositeGlyph(generatedRoot, runtimeGeometry, harmonyBalance, context);

        composite.mesh.add(generatedRoot);
        composite.generatedVisual = generatedRoot;
    }

    _decorateCompositeGlyph(mesh, geometry, harmonyBalance, context) {
        if (!mesh || !geometry) return;

        const outlineColor = this.getCompositeAccentColor(harmonyBalance);
        const shellGeometry = geometry.clone();
        const shellMaterial = new THREE.MeshBasicMaterial({
            color: outlineColor,
            transparent: true,
            opacity: 0.14,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.scale.setScalar(1.06);
        shell.position.z = -0.012;
        shell.renderOrder = mesh.renderOrder - 1;
        shell.userData.isCompositeShell = true;
        mesh.add(shell);

        const edgesGeometry = new THREE.EdgesGeometry(geometry, 18);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: outlineColor,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
            toneMapped: false
        });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edges.renderOrder = mesh.renderOrder + 1;
        edges.userData.isCompositeOutline = true;
        mesh.add(edges);

        const k = this._createCompositeKeystone(context, harmonyBalance, outlineColor);
        if (k) {
            mesh.add(k);
        }
    }

    _resolveContextMetrics(context = {}) {
        const clamp01 = (value) => Math.max(0, Math.min(1, value));
        const read = (fallback, ...values) => {
            for (const value of values) {
                if (typeof value === 'number' && Number.isFinite(value)) return value;
            }
            return fallback;
        };

        return {
            harmony: clamp01(read(0.5,
                context.harmony,
                context.harmonyBalance,
                context.harmonyLevel,
                context.harmonyFlow,
                context.avgHarmony
            )),
            corruption: clamp01(read(0,
                context.corruption,
                context.corruptionLevel,
                context.corruptionNorm,
                context.avgCorruption
            )),
            synergy: clamp01(read(0.5,
                context.synergy,
                context.synergyNorm,
                context.networkSynergy,
                context.averageSynergy,
                context.avgSynergy
            ))
        };
    }

    getCompositeAccentColor(harmonyBalance) {
        const baseColor = new THREE.Color(this.getCompositeColor(harmonyBalance));
        const highlight = harmonyBalance >= 0.5
            ? new THREE.Color(0xeef7ff)
            : new THREE.Color(0xfff0d6);
        return baseColor.lerp(highlight, 0.62).getHex();
    }

    _createCompositeKeystone(context, harmonyBalance, color) {
        const metrics = this._resolveContextMetrics(context);
        const group = new THREE.Group();
        const bladeCount = metrics.harmony > metrics.corruption ? 4 : 3;
        const bladeMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.22 + harmonyBalance * 0.08,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });
        const bladeGeometry = new THREE.BoxGeometry(0.025, 0.16, 0.03);

        for (let i = 0; i < bladeCount; i++) {
            const angle = (i / bladeCount) * Math.PI * 2 + (metrics.synergy * Math.PI * 0.25);
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.set(Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, 0.03);
            blade.rotation.z = angle;
            group.add(blade);
        }

        group.userData.isCompositeKeystone = true;
        return group;
    }

    getCompositeColor(harmonyBalance) {
        // Blend from red (corruption) to blue (harmony)
        const harmonyFactor = harmonyBalance;
        const r = (1 - harmonyFactor) * 200 + 120;  // Red tone for corruption
        const b = harmonyFactor * 200 + 120;        // Blue tone for harmony
        const g = 150;  // Base green

        return new THREE.Color(r / 255, g / 255, b / 255).getHex();
    }

    // ========================================================================
    // SEPARATION
    // ========================================================================

    initiateSeparation(zone) {
        if (zone.phase === 'SEPARATED') return;

        zone.phase = 'SEPARATING';
        zone.phaseProgress = 0.0;

        // Restore source glyph visibility
        zone.sourceGlyphs.forEach(glyph => {
            if (glyph.active) {
                glyph.mesh.visible = true;
                glyph.mesh.material.opacity = 0.7;  // Restore opacity
            }
        });

        // Hide composite glyph
        if (zone.compositeMesh) {
            zone.compositeMesh.visible = false;
        }

        if (zone.compositeGlyph?.id) {
            this.compositeGlyphGenerator?.resonanceFeedback?.unregisterCompositeGlyph?.(zone.compositeGlyph.id);
        }

        // Reset zone after separation
        setTimeout(() => {
            if (zone.phase === 'SEPARATING') {
                zone.reset();
                if (zone.node) {
                    this.nodeZoneMap.delete(zone.node.uuid);
                }
            }
        }, 500);  // 500ms separation animation
    }

    // ========================================================================
    // COMPOSITE GLYPH UPDATE
    // ========================================================================

    updateCompositeGlyphs(deltaTime) {
        // Get camera position for LOD
        const cameraPosition = this.scene?.camera?.position ?? null;
        
        this.compositeGlyphs.forEach(composite => {
            if (!composite.active) return;
            composite.update(deltaTime, cameraPosition);
        });
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose() {
        this.zones.forEach(z => z.reset());
        
        // Dispose singularities properly
        this.compositeGlyphs.forEach(c => {
            if (c.singularity) {
                c.singularity.dispose();
            }
            c.reset();
        });
        
        this.nodeZoneMap.clear();

        if (this.root?.parent) {
            this.root.parent.remove(this.root);
        }
        this.root?.clear?.();

        console.log('[GlyphFusionZoneManager] Disposed');
    }
}
