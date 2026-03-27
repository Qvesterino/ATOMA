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
    constructor(mesh) {
        this.mesh = mesh;
        this.active = false;
        this.state = null;  // Reference to parent FusionZoneState
        this.progress = 0.0;  // 0-1 fade in
        this.rotationPhase = 0.0;
    }

    reset() {
        this.active = false;
        this.mesh.visible = false;
        this.state = null;
    }

    spawn(mesh, state) {
        this.active = true;
        this.state = state;
        this.mesh = mesh;
        this.progress = 0.0;
        this.rotationPhase = Math.random() * Math.PI * 2;
        this.mesh.visible = true;
    }

    update(deltaTime) {
        if (!this.active || !this.state) return;
        if (this.frameScheduler?.shouldRunSimulation && !this.frameScheduler.shouldRunSimulation()) return;
        // Fade in during synthesis
        if (this.progress < 1.0) {
            this.progress += deltaTime / CONFIG.SYNTHESIS_DURATION;
        }

        // Update material opacity
        const opacity = CONFIG.COMPOSITE_OPACITY * this.progress;
        this.mesh.material.opacity = opacity;

        // Slow rotation
        this.rotationPhase += deltaTime * CONFIG.COMPOSITE_ROTATION_SPEED;
        this.mesh.rotation.z = Math.sin(this.rotationPhase) * 0.02;
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
            // Placeholder geometry (will be replaced on fusion)
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshBasicMaterial({
                color: 0xb0b0b0,
                transparent: true,
                opacity: 0.85,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE);

            container.add(mesh);

            const instance = new CompositeGlyphInstance(mesh);
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
            this.updateSourceGlyphBehavior(zone);

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

    updateSourceGlyphBehavior(zone) {
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
        const sourceTypes = zone.sourceGlyphs.map(g => g.currentState).filter(s => s);

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

        const geometry = this.compositeGlyphGenerator.generateComposite(sourceTypes, context);
        if (!geometry) return;

        // Get or create composite glyph mesh
        const composite = this.compositeGlyphs.find(c => !c.active);
        if (!composite) return;

        const compositeId = zone.node?.uuid || zone.node?.userData?.id || zone.node?.id || `composite-${Date.now().toString(36)}`;
        const sourceNodeIds = zone.sourceGlyphs
            .map((glyph) => glyph?.node?.uuid || glyph?.node?.userData?.id || glyph?.link?.userData?.nodeA?.uuid || glyph?.link?.userData?.nodeB?.uuid)
            .filter(Boolean);

        // Create new mesh with generated geometry
        const material = new THREE.MeshBasicMaterial({
            color: this.getCompositeColor(harmonyBalance),
            transparent: true,
            opacity: 0.0,  // Will fade in
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(zone.node.position);
        mesh.position.y += 0.9;  // Center above node
        mesh.renderOrder = geometry.userData?.renderOrder ?? VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE);
        mesh.userData.visualLayer = geometry.userData?.layerId ?? VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE;
        mesh.userData.isCompositeGlyph = true;
        mesh.userData.compositeId = compositeId;

        this.container.add(mesh);

        // Replace placeholder mesh
        const oldMesh = composite.mesh;
        composite.mesh = mesh;
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
        if (oldMesh && oldMesh.parent) {
            oldMesh.parent.remove(oldMesh);
        }

        composite.spawn(mesh, zone);
        zone.compositeMesh = mesh;
        zone.compositeGlyph = composite;

        this.compositeGlyphGenerator?.resonanceFeedback?.registerCompositeGlyph?.(composite);
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
        this.compositeGlyphs.forEach(composite => {
            if (!composite.active) return;
            composite.update(deltaTime);
        });
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose() {
        this.zones.forEach(z => z.reset());
        this.compositeGlyphs.forEach(c => c.reset());
        this.nodeZoneMap.clear();

        if (this.root?.parent) {
            this.root.parent.remove(this.root);
        }
        this.root?.clear?.();

        console.log('[GlyphFusionZoneManager] Disposed');
    }
}
