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

const COMPOSITE_GENERATOR_LOG_THROTTLE_MS = 1000;

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
        this._lifecycleLogTimes = new Map();

        if (scene || camera || network) {
            this.initializeResonanceFeedback(scene, camera, network);
        }
    }

    _logLifecycle(key, message, details = null) {
        const now = Date.now();
        const last = this._lifecycleLogTimes.get(key) || 0;
        if (now - last < COMPOSITE_GENERATOR_LOG_THROTTLE_MS) return;

        this._lifecycleLogTimes.set(key, now);
        if (details) {
            console.error(`[CompositeGlyphGenerator] ${message}`, details);
        } else {
            console.error(`[CompositeGlyphGenerator] ${message}`);
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
            this._logLifecycle(`geometry:${sig}`, 'composite geometry generated', {
                sourceTypes,
                harmony: context.harmony,
                corruption: context.corruption,
                synergy: context.synergy,
                stability: context.stability,
                loadPressure: context.loadPressure
            });
        }

        return geometry;
    }

    /**
     * Generate a live composite glyph group that preserves orbital structure.
     * This is used by the fusion zone so composite glyphs stay animated instead
     * of being flattened into a static merged buffer geometry.
     */
    generateCompositeVisual(sourceTypes, semanticContext) {
        if (!sourceTypes || sourceTypes.length < 2) return null;

        const context = this._resolveContextMetrics(semanticContext);
        let group = null;

        if (sourceTypes.length === 2) {
            group = this.generateDualFusion(sourceTypes, context, true);
        } else if (sourceTypes.length === 3) {
            group = this.generateTripleFusion(sourceTypes, context, true);
        } else {
            group = this.generateMultipleFusion(sourceTypes, context, true);
        }

        if (group) {
            this._tagCompositeGroup(group, context, sourceTypes);
            this._logLifecycle(`visual:${sourceTypes.join('|')}`, 'composite visual generated', {
                sourceTypes,
                harmony: context.harmony,
                corruption: context.corruption,
                synergy: context.synergy,
                stability: context.stability,
                loadPressure: context.loadPressure
            });
        }

        return group;
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

    generateDualFusion(sources, context, live = false) {
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

        // Outer silhouette and internal detail ribs
        const silhouette = this.createSilhouetteDetailGroup(sources, context);
        group.add(silhouette);

        // Merge into single geometry
        return live ? group : this._mergeCompositeGroup(group, context);
    }

    // ========================================================================
    // TRIPLE FUSION (3 Sources)
    // ========================================================================

    generateTripleFusion(sources, context, live = false) {
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

        const silhouette = this.createSilhouetteDetailGroup(sources, context);
        group.add(silhouette);

        // Merge
        return live ? group : this._mergeCompositeGroup(group, context);
    }

    // ========================================================================
    // MULTIPLE FUSION (4+ Sources)
    // ========================================================================

    generateMultipleFusion(sources, context, live = false) {
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

        const silhouette = this.createSilhouetteDetailGroup(sources, context);
        group.add(silhouette);

        // Merge
        return live ? group : this._mergeCompositeGroup(group, context);
    }

    // ========================================================================
    // CORE GLYPH (Central Symbol)
    // ========================================================================

    createCoreGlyph(sources, context) {
        // Create blended symbol from source glyphs
        const metrics = this._resolveContextMetrics(context);
        const points = [];
        const segments = 40;

        // Blend between circular and more complex shapes based on harmony
        const harmonyFactor = metrics.harmony - metrics.corruption;
        const signature = this.hashFromContext(metrics);

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            
            // Base radius
            let radius = 0.32;

            // Add complexity based on synergy
            const synergy = metrics.synergy || 0;
            const ripple = Math.sin(angle * 4 + signature * Math.PI * 2) * synergy * 0.11;
            radius += ripple;

            // Source-retained silhouette asymmetry
            radius += Math.cos(angle * 6 + signature * 7.0) * 0.025;
            radius += Math.sin(angle * 8 + signature * 3.0) * 0.015;

            // Harmony creates smooth curves, corruption creates angular
            if (harmonyFactor > 0) {
                // Smooth: circular with soft modulation
                radius *= (1 + Math.sin(angle * 2) * 0.18 + Math.sin(angle * 6) * 0.05);
            } else {
                // Angular: pointy modulation
                radius *= (1 + Math.cos(angle * 4) * 0.22 + Math.sin(angle * 8) * 0.04);
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
        const segments = 20;

        // Smaller radius (quarter size of core)
        const radius = 0.16;
        const orbitRadius = 0.37;
        const sourceLabel = String(sourceType || '').toUpperCase();

        if (sourceLabel.includes('RING') || sourceLabel.includes('CIRCLE')) {
            const outer = new THREE.Shape();
            const outerRadius = radius * 1.1;
            const innerRadius = radius * 0.52;
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                const modulation = 1 + Math.sin(theta * 4 + this.hashFromContext(metrics)) * 0.08;
                const x = Math.cos(theta) * outerRadius * modulation;
                const y = Math.sin(theta) * outerRadius * modulation;
                if (i === 0) {
                    outer.moveTo(x, y);
                } else {
                    outer.lineTo(x, y);
                }
            }
            const hole = new THREE.Path();
            for (let i = segments; i >= 0; i--) {
                const theta = (i / segments) * Math.PI * 2;
                const modulation = 1 + Math.cos(theta * 3 + this.hashFromContext(metrics)) * 0.05;
                const x = Math.cos(theta) * innerRadius * modulation;
                const y = Math.sin(theta) * innerRadius * modulation;
                if (i === segments) {
                    hole.moveTo(x, y);
                } else {
                    hole.lineTo(x, y);
                }
            }
            outer.holes.push(hole);

            const geometry = new THREE.ShapeGeometry(outer);
            const mesh = new THREE.Mesh(geometry);
            mesh.position.x = Math.cos(angle) * orbitRadius;
            mesh.position.z = Math.sin(angle) * orbitRadius;
            mesh.userData.compositeContext = metrics;
            return mesh;
        }

        if (sourceLabel.includes('CHEVRON') || sourceLabel.includes('ARROW')) {
            const tip = radius * 1.35;
            const base = radius * 0.95;
            points.push(new THREE.Vector2(-base * 0.85, -base * 0.65));
            points.push(new THREE.Vector2(0, -base * 0.15));
            points.push(new THREE.Vector2(tip, 0));
            points.push(new THREE.Vector2(0, base * 0.15));
            points.push(new THREE.Vector2(-base * 0.85, base * 0.65));

            const shape = new THREE.Shape(points);
            const geometry = new THREE.ShapeGeometry(shape);
            const mesh = new THREE.Mesh(geometry);
            mesh.position.x = Math.cos(angle) * orbitRadius;
            mesh.position.z = Math.sin(angle) * orbitRadius;
            mesh.userData.compositeContext = metrics;
            return mesh;
        }

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

            const modulation = Math.cos(theta * 3) * shapeModulation + 1 + Math.sin(theta * 5 + this.hashFromContext(metrics)) * 0.05;
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

    createSilhouetteDetailGroup(sources, context) {
        const group = new THREE.Group();
        const metrics = this._resolveContextMetrics(context);
        const sourceCount = Math.max(2, Array.isArray(sources) ? sources.length : 2);
        const shellRadius = 0.44 + metrics.synergy * 0.05;
        const shellThickness = 0.055 + metrics.harmony * 0.015;
        const accentColor = this.getCompositeAccentColor(metrics.harmony);

        const shellGeometry = new THREE.RingGeometry(shellRadius - shellThickness, shellRadius, Math.max(12, sourceCount * 2));
        const shellMaterial = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.16 + metrics.harmony * 0.06,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.position.z = 0.01;
        group.add(shell);

        const ribMaterial = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });

        const ribLength = shellRadius * 1.08;
        const ribWidth = 0.026;
        const ribDepth = 0.03;
        const ribGeometry = new THREE.BoxGeometry(ribLength, ribWidth, ribDepth);
        const ribCount = metrics.harmony > metrics.corruption ? 4 : 3;

        for (let i = 0; i < ribCount; i++) {
            const angle = (i / ribCount) * Math.PI * 2 + (this.hashFromContext(metrics) * Math.PI * 0.5);
            const rib = new THREE.Mesh(ribGeometry, ribMaterial);
            rib.position.set(Math.cos(angle) * 0.08, Math.sin(angle) * 0.08, 0.02);
            rib.rotation.z = angle;
            group.add(rib);
        }

        return group;
    }

    getCompositeAccentColor(harmonyBalance) {
        const baseColor = new THREE.Color(this.getCompositeColor(harmonyBalance));
        const highlight = harmonyBalance >= 0.5
            ? new THREE.Color(0xeef7ff)
            : new THREE.Color(0xfff0d6);
        return baseColor.lerp(highlight, 0.62).getHex();
    }

    getCompositeColor(harmonyBalance) {
        // Blend from warm corruption tones to cool harmony tones.
        const harmonyFactor = Math.max(0, Math.min(1, harmonyBalance ?? 0.5));
        const r = (1 - harmonyFactor) * 200 + 120;
        const b = harmonyFactor * 200 + 120;
        const g = 150;
        return new THREE.Color(r / 255, g / 255, b / 255).getHex();
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
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

        return geometry;
    }

    _tagCompositeGroup(group, context, sourceTypes = []) {
        if (!group) return null;

        group.userData ??= {};
        group.userData.layerId = VisualHierarchyRegistry.LAYER_GLYPH_COMPOSITE;
        group.userData.renderOrder = this.renderOrder;
        group.userData.semanticContext = this._resolveContextMetrics(context);
        group.userData.sourceTypes = Array.isArray(sourceTypes) ? sourceTypes.slice() : [];
        group.renderOrder = this.renderOrder;

        group.traverse?.((child) => {
            if (child?.isMesh) {
                child.renderOrder = this.renderOrder;
            }
        });

        return group;
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
