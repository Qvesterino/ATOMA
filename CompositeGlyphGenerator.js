/**
 * ============================================================================
 * COMPOSITE GLYPH GENERATOR
 * ============================================================================
 * 
 * Procedurally generates composite glyph geometry from source glyphs.
 * 
 * DESIGN PHILOSOPHY:
 * - Composite glyphs retain recognizable elements of sources
 * - No literal icon stacking
 * - Built through layering, interweaving, nesting
 * - Smooth and stable (not chaotic)
 * 
 * TECHNIQUES:
 * 1. Outline layering: Source glyph outlines at different radii
 * 2. Stroke interweaving: Paths interlock without collision
 * 3. Symbol nesting: Smaller glyphs orbit larger one
 * 4. Contour blending: Edge softening between sources
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from './src/utils/BufferGeometryUtils.js';
import { CompositeGlyphResonanceFeedback } from './CompositeGlyphResonanceFeedback.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// ============================================================================
// COMPOSITE GEOMETRY BUILDER
// ============================================================================

export class CompositeGlyphGenerator {
    constructor(scene = null, camera = null, network = null) {
        this.scene = scene;
        this.camera = camera;
        this.network = network;
        this.cache = new Map(); // compositeSig -> geometry
        this.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE);
        this.resonanceFeedback = new CompositeGlyphResonanceFeedback();

        if (scene || camera || network) {
            this.initializeResonanceFeedback(scene, camera, network);
        }
    }

    initializeResonanceFeedback(scene, camera, network = null) {
        this.scene = scene ?? this.scene;
        this.camera = camera ?? this.camera;
        this.network = network ?? this.network;

        if (!this.resonanceFeedback) {
            this.resonanceFeedback = new CompositeGlyphResonanceFeedback();
        }

        this.resonanceFeedback.initialize(this.scene, this.camera, this.network);
        return this.resonanceFeedback;
    }

    resetForWorldSwitch(scene, camera, network = null) {
        return this.initializeResonanceFeedback(scene, camera, network);
    }

    /**
     * Generate composite glyph from source glyph types
     */
    generateComposite(sourceTypes, semanticContext) {
        if (!sourceTypes || sourceTypes.length < 2) return null;

        const context = this._resolveContextMetrics(semanticContext);

        // Create signature for caching
        const sig = this.createSignature(sourceTypes, context);
        if (this.cache.has(sig)) {
            return this.cache.get(sig);
        }

        // Generate based on source count and semantic context
        let geometry = null;

        if (sourceTypes.length === 2) {
            geometry = this.generateDualFusion(sourceTypes, context);
        } else if (sourceTypes.length === 3) {
            geometry = this.generateTripleFusion(sourceTypes, context);
        } else {
            geometry = this.generateMultipleFusion(sourceTypes, context);
        }

        if (geometry) {
            this._tagCompositeGeometry(geometry, context, sourceTypes);
            this.cache.set(sig, geometry);
        }

        return geometry;
    }

    createSignature(sourceTypes, context) {
        const metrics = this._resolveContextMetrics(context);
        const types = sourceTypes.slice().sort().join('|');
        const harmony = Math.round(metrics.harmony * 10);
        const corruption = Math.round(metrics.corruption * 10);
        const synergy = Math.round(metrics.synergy * 10);
        return `${types}_h${harmony}_c${corruption}_s${synergy}`;
    }

    // ========================================================================
    // DUAL FUSION (2 Sources)
    // ========================================================================

    generateDualFusion(sources, context) {
        if (!BufferGeometryUtils) {
            console.warn("Pictogram disabled: BufferGeometryUtils missing");
            return null;
        }
        
        const group = new THREE.Group();

        // Central core: blended from both sources
        const core = this.createCoreGlyph(sources, context);
        group.add(core);

        // Orbiting sub-glyphs: smaller versions of sources
        const subGlyph1 = this.createSubGlyph(sources[0], context, 0);
        const subGlyph2 = this.createSubGlyph(sources[1], context, Math.PI);
        
        group.add(subGlyph1);
        group.add(subGlyph2);

        // Interweaving connector strokes
        const connectors = this.createConnectorStrokes(subGlyph1.position, subGlyph2.position);
        group.add(connectors);

        // Merge into single geometry
        return this._mergeCompositeGroup(group, context);
    }

    // ========================================================================
    // TRIPLE FUSION (3 Sources)
    // ========================================================================

    generateTripleFusion(sources, context) {
        if (!BufferGeometryUtils) {
            console.warn("Pictogram disabled: BufferGeometryUtils missing");
            return null;
        }
        
        const group = new THREE.Group();

        // Central core
        const core = this.createCoreGlyph(sources.slice(0, 2), context);
        group.add(core);

        // Three orbiting sub-glyphs (triangular arrangement)
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const subGlyph = this.createSubGlyph(sources[i], context, angle);
            group.add(subGlyph);
        }

        // Triangular connector frame
        const connectors = this.createTriangularFrame();
        group.add(connectors);

        // Merge
        return this._mergeCompositeGroup(group, context);
    }

    // ========================================================================
    // MULTIPLE FUSION (4+ Sources)
    // ========================================================================

    generateMultipleFusion(sources, context) {
        if (!BufferGeometryUtils) {
            console.warn("Pictogram disabled: BufferGeometryUtils missing");
            return null;
        }
        
        const group = new THREE.Group();

        // Central core from first two
        const core = this.createCoreGlyph(sources.slice(0, 2), context);
        group.add(core);

        // Circular arrangement of sub-glyphs
        const count = Math.min(sources.length, 6); // Cap at 6 for readability
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const subGlyph = this.createSubGlyph(sources[i], context, angle);
            group.add(subGlyph);
        }

        // Circular connector frame
        const connectors = this.createCircularFrame(count);
        group.add(connectors);

        // Merge
        return this._mergeCompositeGroup(group, context);
    }

    // ========================================================================
    // CORE GLYPH (Central Symbol)
    // ========================================================================

    createCoreGlyph(sources, context) {
        // Create blended symbol from source glyphs
        const metrics = this._resolveContextMetrics(context);
        const points = [];
        const segments = 32;

        // Blend between circular and more complex shapes based on harmony
        const harmonyFactor = metrics.harmony - metrics.corruption;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            
            // Base radius
            let radius = 0.3;

            // Add complexity based on synergy
            const synergy = metrics.synergy || 0;
            const ripple = Math.sin(angle * 3 + this.hashFromContext(metrics)) * synergy * 0.1;
            radius += ripple;

            // Harmony creates smooth curves, corruption creates angular
            if (harmonyFactor > 0) {
                // Smooth: circular with soft modulation
                radius *= (1 + Math.sin(angle * 2) * 0.15);
            } else {
                // Angular: pointy modulation
                radius *= (1 + Math.cos(angle * 4) * 0.2);
            }

            points.push(new THREE.Vector2(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            ));
        }

        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);

        // Slight thickness for depth
        const mesh = new THREE.Mesh(geometry);
        mesh.geometry.rotateX(-Math.PI / 2);

        return mesh;
    }

    // ========================================================================
    // SUB-GLYPH (Orbiting Symbols)
    // ========================================================================

    createSubGlyph(sourceType, context, angle) {
        const metrics = this._resolveContextMetrics(context);
        // Create simplified version of source glyph
        const points = [];
        const segments = 16;

        // Smaller radius (quarter size of core)
        const radius = 0.15;
        const orbitRadius = 0.35;

        // Create simplified shape that vaguely resembles source
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const theta = t * Math.PI * 2;

            // Vary shape based on source type
            let shapeModulation = 0.5;
            if (sourceType.includes('CIRCLE') || sourceType.includes('RING')) {
                shapeModulation = 0.7; // More circular
            } else if (sourceType.includes('CHEVRON') || sourceType.includes('ARROW')) {
                shapeModulation = 0.3; // More angular
            }

            const modulation = Math.cos(theta * 3) * shapeModulation + 1;
            const x = Math.cos(theta) * radius * modulation;
            const y = Math.sin(theta) * radius * modulation;

            points.push(new THREE.Vector2(x, y));
        }

        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);

        // Position at orbit
        const mesh = new THREE.Mesh(geometry);
        mesh.position.x = Math.cos(angle) * orbitRadius;
        mesh.position.z = Math.sin(angle) * orbitRadius;
        mesh.geometry.rotateX(-Math.PI / 2);
        mesh.userData.compositeContext = metrics;

        return mesh;
    }

    // ========================================================================
    // CONNECTOR STROKES (Interweaving Paths)
    // ========================================================================

    createConnectorStrokes(pos1, pos2) {
        const group = new THREE.Group();

        // Create interweaving paths between positions
        const pathCount = 3;

        for (let i = 0; i < pathCount; i++) {
            const offset = (i - pathCount / 2) * 0.12;
            const points = [];

            // Quadratic curve with weave
            for (let t = 0; t <= 1; t += 0.1) {
                const x = THREE.MathUtils.lerp(pos1.x, pos2.x, t);
                const y = THREE.MathUtils.lerp(pos1.y, pos2.y, t);
                const z = Math.sin(t * Math.PI) * 0.2 + offset;

                points.push(new THREE.Vector2(x, z));
            }

            const shape = new THREE.Shape(points);
            const geometry = new THREE.ExtrudeGeometry(shape, {
                depth: 0.02,
                bevelEnabled: false
            });

            const mesh = new THREE.Mesh(geometry);
            group.add(mesh);
        }

        return group;
    }

    // ========================================================================
    // CONNECTOR FRAMES (Triangular/Circular)
    // ========================================================================

    createTriangularFrame() {
        const group = new THREE.Group();

        // Triangle corners
        const corners = [
            new THREE.Vector3(0, 0, 0.35),
            new THREE.Vector3(0.3, 0, -0.175),
            new THREE.Vector3(-0.3, 0, -0.175)
        ];

        // Draw lines between corners
        for (let i = 0; i < 3; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 3];

            const curve = new THREE.LineCurve3(p1, p2);
            const geometry = new THREE.TubeGeometry(curve, 4, 0.02, 8);
            
            const mesh = new THREE.Mesh(geometry);
            group.add(mesh);
        }

        return group;
    }

    createCircularFrame(count) {
        const group = new THREE.Group();

        const radius = 0.35;
        const points = [];

        for (let i = 0; i <= count; i++) {
            const angle = (i / count) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }

        const curve = new THREE.CatmullRomCurve3(points, true);
        const geometry = new THREE.TubeGeometry(curve, 20, 0.01, 4);

        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);

        return group;
    }

    // ========================================================================
    // SEMANTIC INFLUENCE
    // ========================================================================

    applySemanticInfluence(geometry, context) {
        // Modify geometry scale/complexity based on context
        const metrics = this._resolveContextMetrics(context);
        const harmonyFactor = metrics.harmony - metrics.corruption;

        if (harmonyFactor > 0.3) {
            // Harmony-dominant: smooth, expand
            geometry.scale(1.1, 1.1, 1.1);
        } else if (harmonyFactor < -0.3) {
            // Corruption-dominant: compact, angular
            geometry.scale(0.9, 0.9, 0.9);
        }

        // Synergy influences structure coherence
        if (metrics.synergy > 0.6) {
            // High synergy: more legible
            geometry.scale(1.05, 1.05, 1.05);
        }

        return geometry;
    }

    // ========================================================================
    // UTILITY
    // ========================================================================

    hashFromContext(context) {
        // Simple hash from context for deterministic randomness
        const metrics = this._resolveContextMetrics(context);
        const h1 = Math.sin(metrics.harmony * 12.9898) * 43758.5453;
        const h2 = Math.sin(metrics.corruption * 78.233) * 43758.5453;
        return (h1 + h2) - Math.floor(h1 + h2);
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
            )),
            stability: clamp01(read(0.5,
                context.stability,
                context.stabilityNorm,
                context.avgStability
            )),
            loadPressure: clamp01(read(0,
                context.loadPressure,
                context.loadNorm,
                context.avgLoadPressure
            ))
        };
    }

    _mergeCompositeGroup(group, context) {
        if (!group) return null;

        group.updateMatrixWorld(true);

        const geometries = [];
        try {
            group.traverse((child) => {
                if (!child?.isMesh || !child.geometry) return;

                const transformedGeometry = child.geometry.clone();
                transformedGeometry.applyMatrix4(child.matrixWorld);
                geometries.push(transformedGeometry);
            });

            if (geometries.length === 0) return null;

            const merged = BufferGeometryUtils.mergeGeometries(geometries);
            if (!merged) return null;

            return this._tagCompositeGeometry(merged, context);
        } finally {
            for (const geometry of geometries) {
                geometry.dispose();
            }
        }
    }

    _tagCompositeGeometry(geometry, context, sourceTypes = []) {
        if (!geometry) return null;

        geometry.userData ??= {};
        geometry.userData.layerId = VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE;
        geometry.userData.renderOrder = this.renderOrder;
        geometry.userData.semanticContext = this._resolveContextMetrics(context);
        geometry.userData.sourceTypes = Array.isArray(sourceTypes) ? sourceTypes.slice() : [];
        geometry.rotateX(-Math.PI / 2);
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

        return geometry;
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose() {
        this.cache.forEach(geometry => {
            geometry.dispose();
        });
        this.cache.clear();
        this.resonanceFeedback?.dispose?.();
        console.log('[CompositeGlyphGenerator] Disposed');
    }
}
