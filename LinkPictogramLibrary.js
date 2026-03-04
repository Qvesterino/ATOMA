/**
 * ============================================================================
 * LINK PICTOGRAM LIBRARY
 * ============================================================================
 * 
 * Procedural pictogram geometry for semantic link visualization.
 * 
 * DESIGN PHILOSOPHY:
 * - Minimalist sci-fi pictograms
 * - High-contrast silhouettes
 * - Simple geometry (lines, dots, arcs)
 * - Consistent visual language
 * 
 * PICTOGRAM TYPES:
 * - Harmony: Circle with inner ring, soft waves, interlocking arcs
 * - Corruption: Broken circle, offset shards, fractured triangle
 * - Synergy: Directional chevrons, triple arrows, braided lines
 * - Instability: Offset dots, phase-shifted bars, incomplete symbols
 * - Healing: Re-forming ring, closing gap, soft spiral
 * - Standing Wave: Oscillation icon, back-and-forth arrows, looping wave
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Fallback when BufferGeometryUtils is unavailable in runtime/bundle
const mergeSafe = (geometries) => {
    if (BufferGeometryUtils && typeof BufferGeometryUtils.mergeGeometries === 'function') {
        return BufferGeometryUtils.mergeGeometries(geometries);
    }
    const first = geometries?.[0];
    return first?.clone ? first.clone() : first || null;
};

// ============================================================================
// PICTOGRAM GEOMETRY GENERATORS
// ============================================================================

/**
 * Generate circle with inner ring (harmony symbol)
 */
function createCircleRingPictogram(size = 1.0) {
    const shape = new THREE.Shape();
    
    // Outer circle
    shape.absarc(0, 0, size * 0.5, 0, Math.PI * 2, false);
    
    // Inner hole (ring effect)
    const hole = new THREE.Path();
    hole.absarc(0, 0, size * 0.35, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2); // Face up
    
    return geometry;
}

/**
 * Generate soft wave symbol (harmony flow)
 */
function createWavePictogram(size = 1.0) {
    const points = [];
    const segments = 16;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * size;
        const y = Math.sin(t * Math.PI * 2) * size * 0.2;
        points.push(new THREE.Vector2(x, y));
    }
    
    const shape = new THREE.Shape(points);
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.02,
        bevelEnabled: false
    });
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
}

/**
 * Generate interlocking arcs (harmony connection)
 */
function createInterlockingArcsPictogram(size = 1.0) {
    const group = new THREE.Group();
    
    // Create two partial circles that interlock
    for (let i = 0; i < 2; i++) {
        const shape = new THREE.Shape();
        const startAngle = i * Math.PI;
        const endAngle = startAngle + Math.PI * 0.8;
        
        shape.absarc(0, 0, size * 0.4, startAngle, endAngle, false);
        
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate((i === 0 ? -0.1 : 0.1) * size, 0, 0);
        
        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);
    }
    
    // Merge group into single geometry
    const mergedGeometry = new THREE.BufferGeometry();
    const geometries = [];
    group.children.forEach(child => {
        if (child.geometry) {
            geometries.push(child.geometry);
        }
    });
    
    return mergeSafe(geometries);
}

/**
 * Generate broken circle (corruption symbol)
 */
function createBrokenCirclePictogram(size = 1.0) {
    const group = new THREE.Group();
    
    // Create 3 arc segments with gaps
    const gaps = [0, Math.PI * 0.7, Math.PI * 1.5];
    const gapSize = Math.PI * 0.2;
    
    gaps.forEach((startAngle, i) => {
        const shape = new THREE.Shape();
        const endAngle = startAngle + (Math.PI * 2 / 3) - gapSize;
        
        shape.absarc(0, 0, size * 0.4, startAngle, endAngle, false);
        
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        
        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);
    });
    
    const geometries = group.children.map(c => c.geometry);
    return mergeSafe(geometries);
}

/**
 * Generate offset shards (corruption fragments)
 */
function createOffsetShardsPictogram(size = 1.0) {
    
    const group = new THREE.Group();
    
    // Create 4 offset triangular shards
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const shape = new THREE.Shape();
        
        shape.moveTo(0, 0);
        shape.lineTo(size * 0.2, 0);
        shape.lineTo(size * 0.15, size * 0.3);
        shape.closePath();
        
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        geometry.rotateZ(angle);
        geometry.translate(
            Math.cos(angle) * size * 0.15,
            0,
            Math.sin(angle) * size * 0.15
        );
        
        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);
    }
    
    const geometries = group.children.map(c => c.geometry);
    return mergeSafe(geometries);
}

/**
 * Generate fractured triangle (corruption instability)
 */
function createFracturedTrianglePictogram(size = 1.0) {
    
    const group = new THREE.Group();
    
    // Main triangle broken into 3 pieces
    const points = [
        [0, size * 0.4],
        [-size * 0.35, -size * 0.2],
        [size * 0.35, -size * 0.2]
    ];
    
    for (let i = 0; i < 3; i++) {
        const shape = new THREE.Shape();
        const p1 = points[i];
        const p2 = points[(i + 1) % 3];
        
        // Create a piece of the triangle with a gap
        shape.moveTo(p1[0] * 0.9, p1[1] * 0.9);
        shape.lineTo(p2[0] * 0.9, p2[1] * 0.9);
        shape.lineTo(0, 0);
        shape.closePath();
        
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        
        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);
    }
    
    const geometries = group.children.map(c => c.geometry);
    return mergeSafe(geometries);
}

/**
 * Generate directional chevrons (synergy flow)
 */
function createChevronPictogram(size = 1.0) {
    const shape = new THREE.Shape();
    
    // Single chevron arrow
    shape.moveTo(-size * 0.3, -size * 0.2);
    shape.lineTo(0, size * 0.3);
    shape.lineTo(size * 0.3, -size * 0.2);
    shape.lineTo(size * 0.15, -size * 0.15);
    shape.lineTo(0, size * 0.1);
    shape.lineTo(-size * 0.15, -size * 0.15);
    shape.closePath();
    
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
}

/**
 * Generate triple line arrows (synergy momentum)
 */
function createTripleArrowPictogram(size = 1.0) {
    
    const group = new THREE.Group();
    
    for (let i = 0; i < 3; i++) {
        const shape = new THREE.Shape();
        const offset = (i - 1) * size * 0.25;
        
        shape.moveTo(offset - size * 0.2, -size * 0.1);
        shape.lineTo(offset + size * 0.2, 0);
        shape.lineTo(offset - size * 0.2, size * 0.1);
        
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        
        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);
    }
    
    const geometries = group.children.map(c => c.geometry);
    return mergeSafe(geometries);
}

/**
 * Generate braided line icon (synergy entanglement)
 */
function createBraidedLinePictogram(size = 1.0) {
    const points = [];
    const segments = 20;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * size;
        const y = Math.sin(t * Math.PI * 4) * size * 0.15;
        points.push(new THREE.Vector2(x, y));
    }
    
    const shape = new THREE.Shape(points);
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.02,
        bevelEnabled: false
    });
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
}

/**
 * Generate offset dots (instability marker)
 */
function createOffsetDotsPictogram(size = 1.0) {
    
    const group = new THREE.Group();
    
    // 5 dots in offset positions
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = size * 0.3;
        const offsetVariation = Math.sin(i * 1.7) * 0.1;
        
        const geometry = new THREE.CircleGeometry(size * 0.08, 8);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(
            Math.cos(angle) * radius * (1 + offsetVariation),
            0,
            Math.sin(angle) * radius * (1 + offsetVariation)
        );
        
        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);
    }
    
    const geometries = group.children.map(c => c.geometry);
    return mergeSafe(geometries);
}

/**
 * Generate phase-shifted bars (instability rhythm)
 */
function createPhaseShiftedBarsPictogram(size = 1.0) {
    
    const group = new THREE.Group();
    
    for (let i = 0; i < 3; i++) {
        const shape = new THREE.Shape();
        const offset = (i - 1) * size * 0.3;
        const height = size * 0.4 * (1 - Math.abs(i - 1) * 0.3);
        
        shape.moveTo(offset - size * 0.06, -height / 2);
        shape.lineTo(offset + size * 0.06, -height / 2);
        shape.lineTo(offset + size * 0.06, height / 2);
        shape.lineTo(offset - size * 0.06, height / 2);
        shape.closePath();
        
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, 0, Math.sin(i * 1.3) * size * 0.1);
        
        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);
    }
    
    const geometries = group.children.map(c => c.geometry);
    return mergeSafe(geometries);
}

/**
 * Generate incomplete symbol (instability fragmentation)
 */
function createIncompleteSymbolPictogram(size = 1.0) {
    const shape = new THREE.Shape();
    
    // Square with missing corner
    shape.moveTo(-size * 0.3, -size * 0.3);
    shape.lineTo(size * 0.3, -size * 0.3);
    shape.lineTo(size * 0.3, size * 0.1);
    shape.lineTo(size * 0.1, size * 0.3);
    shape.lineTo(-size * 0.3, size * 0.3);
    shape.closePath();
    
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
}

/**
 * Generate re-forming ring (healing symbol)
 */
function createReformingRingPictogram(size = 1.0) {
    
    const group = new THREE.Group();
    
    // Almost complete circle with a small gap that's "healing"
    const shape = new THREE.Shape();
    shape.absarc(0, 0, size * 0.4, 0, Math.PI * 1.85, false);
    
    const geometry1 = new THREE.ShapeGeometry(shape);
    geometry1.rotateX(-Math.PI / 2);
    
    // Small completing segment
    const completingShape = new THREE.Shape();
    completingShape.absarc(0, 0, size * 0.4, Math.PI * 1.85, Math.PI * 2, false);
    
    const geometry2 = new THREE.ShapeGeometry(completingShape);
    geometry2.rotateX(-Math.PI / 2);
    
    return mergeSafe([geometry1, geometry2]);
}

/**
 * Generate closing gap symbol (healing progression)
 */
function createClosingGapPictogram(size = 1.0) {
    
    const group = new THREE.Group();
    
    // Two shapes moving toward each other
    for (let i = 0; i < 2; i++) {
        const shape = new THREE.Shape();
        const xOffset = (i === 0 ? -0.15 : 0.15) * size;
        
        shape.moveTo(xOffset, -size * 0.3);
        shape.lineTo(xOffset + (i === 0 ? size * 0.2 : -size * 0.2), 0);
        shape.lineTo(xOffset, size * 0.3);
        
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        
        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);
    }
    
    const geometries = group.children.map(c => c.geometry);
    return mergeSafe(geometries);
}

/**
 * Generate soft spiral (healing energy)
 */
function createSoftSpiralPictogram(size = 1.0) {
    const points = [];
    const turns = 1.5;
    const segments = 30;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 2 * turns;
        const radius = (1 - t) * size * 0.4;
        points.push(new THREE.Vector2(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        ));
    }
    
    const shape = new THREE.Shape(points);
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.02,
        bevelEnabled: false
    });
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
}

/**
 * Generate oscillation icon (standing wave)
 */
function createOscillationPictogram(size = 1.0) {
    const points = [];
    const segments = 20;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * size;
        const y = Math.sin(t * Math.PI * 3) * size * 0.25;
        points.push(new THREE.Vector2(x, y));
    }
    
    const shape = new THREE.Shape(points);
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.02,
        bevelEnabled: false
    });
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
}

/**
 * Generate back-and-forth arrows (standing wave trap)
 */
function createBackForthArrowsPictogram(size = 1.0) {
    
    const group = new THREE.Group();
    
    // Two opposing arrows
    for (let i = 0; i < 2; i++) {
        const shape = new THREE.Shape();
        const direction = i === 0 ? 1 : -1;
        
        shape.moveTo(direction * size * 0.3, 0);
        shape.lineTo(0, size * 0.2);
        shape.lineTo(0, size * 0.1);
        shape.lineTo(direction * size * 0.2, size * 0.1);
        shape.lineTo(direction * size * 0.2, -size * 0.1);
        shape.lineTo(0, -size * 0.1);
        shape.lineTo(0, -size * 0.2);
        shape.closePath();
        
        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI / 2);
        
        const mesh = new THREE.Mesh(geometry);
        group.add(mesh);
    }
    
    const geometries = group.children.map(c => c.geometry);
    return mergeSafe(geometries);
}

/**
 * Generate looping wave mark (standing wave pattern)
 */
function createLoopingWavePictogram(size = 1.0) {
    const points = [];
    const segments = 24;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 2;
        const radius = size * 0.3 + Math.sin(t * Math.PI * 4) * size * 0.1;
        points.push(new THREE.Vector2(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        ));
    }
    
    const shape = new THREE.Shape(points);
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    
    return geometry;
}

// ============================================================================
// PICTOGRAM LIBRARY EXPORT
// ============================================================================

export const PictogramLibrary = {
    // Harmony
    CIRCLE_RING: { create: createCircleRingPictogram, category: 'harmony' },
    WAVE: { create: createWavePictogram, category: 'harmony' },
    INTERLOCKING_ARCS: { create: createInterlockingArcsPictogram, category: 'harmony' },
    
    // Corruption
    BROKEN_CIRCLE: { create: createBrokenCirclePictogram, category: 'corruption' },
    OFFSET_SHARDS: { create: createOffsetShardsPictogram, category: 'corruption' },
    FRACTURED_TRIANGLE: { create: createFracturedTrianglePictogram, category: 'corruption' },
    
    // Synergy
    CHEVRON: { create: createChevronPictogram, category: 'synergy' },
    TRIPLE_ARROW: { create: createTripleArrowPictogram, category: 'synergy' },
    BRAIDED_LINE: { create: createBraidedLinePictogram, category: 'synergy' },
    
    // Instability
    OFFSET_DOTS: { create: createOffsetDotsPictogram, category: 'instability' },
    PHASE_SHIFTED_BARS: { create: createPhaseShiftedBarsPictogram, category: 'instability' },
    INCOMPLETE_SYMBOL: { create: createIncompleteSymbolPictogram, category: 'instability' },
    
    // Healing
    REFORMING_RING: { create: createReformingRingPictogram, category: 'healing' },
    CLOSING_GAP: { create: createClosingGapPictogram, category: 'healing' },
    SOFT_SPIRAL: { create: createSoftSpiralPictogram, category: 'healing' },
    
    // Standing Wave
    OSCILLATION: { create: createOscillationPictogram, category: 'standing_wave' },
    BACK_FORTH_ARROWS: { create: createBackForthArrowsPictogram, category: 'standing_wave' },
    LOOPING_WAVE: { create: createLoopingWavePictogram, category: 'standing_wave' }
};

/**
 * Create material for pictograms
 */
export function createPictogramMaterial(color = 0xffffff, opacity = 1.0) {
    return new THREE.MeshBasicMaterial({
        color: 0xff3300,              // vivid warm red-orange for max contrast
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
    });
}
