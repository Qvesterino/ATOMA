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

// ============================================================================
// COMPOSITE GEOMETRY BUILDER
// ============================================================================

export class CompositeGlyphGenerator {
    constructor() {
        this.cache = new Map(); // compositeSig -> geometry
    }

    /**
     * Generate composite glyph from source glyph types
     */
    generateComposite(sourceTypes, semanticContext) {
        if (!sourceTypes || sourceTypes.length < 2) return null;

        // Create signature for caching
        const sig = this.createSignature(sourceTypes, semanticContext);
        if (this.cache.has(sig)) {
            return this.cache.get(sig);
        }

        // Generate based on source count and semantic context
        let geometry = null;

        if (sourceTypes.length === 2) {
            geometry = this.generateDualFusion(sourceTypes, semanticContext);
        } else if (sourceTypes.length === 3) {
            geometry = this.generateTripleFusion(sourceTypes, semanticContext);
        } else {
            geometry = this.generateMultipleFusion(sourceTypes, semanticContext);
        }

        if (geometry) {
            this.cache.set(sig, geometry);
        }

        return geometry;
    }

    createSignature(sourceTypes, context) {
        const types = sourceTypes.slice().sort().join('|');
        const harmony = Math.round(context.harmony * 10);
        const corruption = Math.round(context.corruption * 10);
        const synergy = Math.round(context.synergy * 10);
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
        const geometries = [];
        group.traverse(child => {
            if (child.geometry) {
                geometries.push(child.geometry);
            }
        });

        if (geometries.length === 0) return null;

        const merged = BufferGeometryUtils.mergeGeometries(geometries);
        merged.rotateX(-Math.PI / 2); // Face up

        return merged;
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
        const geometries = [];
        group.traverse(child => {
            if (child.geometry) {
                geometries.push(child.geometry);
            }
        });

        if (geometries.length === 0) return null;

        return BufferGeometryUtils.mergeGeometries(geometries);
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
        const count = Math.min(sources.length, 6); // Cap at 6 for clarity
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const subGlyph = this.createSubGlyph(sources[i], context, angle);
            group.add(subGlyph);
        }

        // Circular connector frame
        const connectors = this.createCircularFrame(count);
        group.add(connectors);

        // Merge
        const geometries = [];
        group.traverse(child => {
            if (child.geometry) {
                geometries.push(child.geometry);
            }
        });

        if (geometries.length === 0) return null;

        return BufferGeometryUtils.mergeGeometries(geometries);
    }

    // ========================================================================
    // CORE GLYPH (Central Symbol)
    // ========================================================================

    createCoreGlyph(sources, context) {
        // Create blended symbol from source glyphs
        const points = [];
        const segments = 32;

        // Blend between circular and more complex shapes based on harmony
        const harmonyFactor = context.harmony - context.corruption;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            
            // Base radius
            let radius = 0.3;

            // Add complexity based on synergy
            const synergy = context.synergy || 0;
            const ripple = Math.sin(angle * 3 + this.hashFromContext(context)) * synergy * 0.1;
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
        const harmonyFactor = context.harmony - context.corruption;

        if (harmonyFactor > 0.3) {
            // Harmony-dominant: smooth, expand
            geometry.scale(1.1, 1.1, 1.1);
        } else if (harmonyFactor < -0.3) {
            // Corruption-dominant: compact, angular
            geometry.scale(0.9, 0.9, 0.9);
        }

        // Synergy influences structure coherence
        if (context.synergy > 0.6) {
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
        const h1 = Math.sin(context.harmony * 12.9898) * 43758.5453;
        const h2 = Math.sin(context.corruption * 78.233) * 43758.5453;
        return (h1 + h2) - Math.floor(h1 + h2);
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose() {
        this.cache.forEach(geometry => {
            geometry.dispose();
        });
        this.cache.clear();
        console.log('[CompositeGlyphGenerator] Disposed');
    }
}
