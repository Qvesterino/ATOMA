/**
 * LinkRenderer.ts - Bezier Link Visualization for ATOMA
 * 
 * Renders directional links between nodes using Bezier curves with custom
 * shader materials and dynamic animation.
 * 
 * Features:
 * - Dynamic Bezier curve computation
 * - Custom shader material support
 * - Automatic animation with useFrame
 * - Efficient geometry caching
 * - Real-time position updates
 * - Multiple render modes (lines, meshes, etc.)
 */

import * as THREE from 'three';
import { useFrame, useThree } from '@react-three-fiber/web';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Link, Node } from './LinkEngine';

// [B.3-D2] Pooled link materials keyed by static shader-affecting flags
const LINK_MATERIAL_POOL = new Map<string, THREE.ShaderMaterial>();

// [B.3-D2] Build a stable cache key from profile + shader-relevant flags
function buildLinkMaterialKey(options: {
  profileId: string;
  transparent: boolean;
  blending: number;
  side: number;
  depthWrite: boolean;
  depthTest: boolean;
  defines?: Record<string, any> | null;
}) {
  const definesHash = options.defines
    ? JSON.stringify(
        Object.keys(options.defines)
          .sort()
          .reduce((acc, k) => {
            acc[k] = (options.defines as any)[k];
            return acc;
          }, {} as Record<string, any>)
      )
    : 'nodef';

  return [
    options.profileId,
    `t=${options.transparent ? 1 : 0}`,
    `b=${options.blending}`,
    `s=${options.side}`,
    `dw=${options.depthWrite ? 1 : 0}`,
    `dt=${options.depthTest ? 1 : 0}`,
    `def=${definesHash}`,
  ].join('|');
}

// [B.3-D2] Return pooled ShaderMaterial; create once per static profile key
function getPooledLinkShaderMaterial(profileId = 'default'): THREE.ShaderMaterial {
  const key = buildLinkMaterialKey({
    profileId,
    transparent: false,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
    depthWrite: true,
    depthTest: true,
    defines: null,
  });

  const existing = LINK_MATERIAL_POOL.get(key);
  if (existing) return existing;

  const mat = createLinkShaderMaterial();
  (mat as any).__b3d2Pooled = true; // flag to avoid disposal on per-link teardown
  LINK_MATERIAL_POOL.set(key, mat);

  if (typeof window !== 'undefined') {
    (window as any).__LINK_MATERIAL_POOL_SIZE = LINK_MATERIAL_POOL.size;
  }

  return mat;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Link renderer props
 */
export interface LinkRendererProps {
  links: Link[];
  nodes: Map<string, Node>;
  material?: THREE.ShaderMaterial | THREE.Material;
  resolution?: number;
  curvature?: number;
  animateShaderUniforms?: boolean;
  colorMap?: Map<string, THREE.Color>;
  selectedLinkId?: string | null;
  oneLinkHighlight?: boolean;
}

/**
 * Cached geometry data for a link
 */
export interface LinkGeometryCache {
  linkId: string;
  geometry: THREE.BufferGeometry;
  lastUpdateFrame: number;
  isDirty: boolean;
}

/**
 * Shader uniform options for link rendering
 */
export interface LinkShaderUniforms {
  time: THREE.Uniform<number>;
  energy: THREE.Uniform<number>;
  intensity: THREE.Uniform<number>;
  linkType: THREE.Uniform<number>;
  selected: THREE.Uniform<number>;
  color: THREE.Uniform<THREE.Color>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compute cubic Bezier curve points
 */
export function computeBezierPoints(
  from: THREE.Vector3,
  to: THREE.Vector3,
  resolution: number = 32,
  curvature: number = 0.5
): THREE.Vector3[] {
  const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

  // Control points: offset vertically
  const p1 = new THREE.Vector3().copy(midpoint);
  p1.y += curvature;

  const p2 = new THREE.Vector3().copy(midpoint);
  p2.y -= curvature;

  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution;
    const point = new THREE.Vector3();

    // Cubic Bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    point.copy(from).multiplyScalar(mt3);
    point.addScaledVector(p1, 3 * mt2 * t);
    point.addScaledVector(p2, 3 * mt * t2);
    point.addScaledVector(to, t3);

    points.push(point);
  }

  return points;
}

/**
 * Create BufferGeometry from curve points
 */
export function createGeometry(points: THREE.Vector3[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(points.length * 3);

  points.forEach((point, i) => {
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return geometry;
}

/**
 * Create a line geometry with optional width attribute for MeshLine
 */
export function createLineGeometry(
  points: THREE.Vector3[],
  includeWidth: boolean = false
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(points.length * 3);
  const widths = includeWidth ? new Float32Array(points.length) : null;

  points.forEach((point, i) => {
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;

    if (widths) {
      // Width varies: wider in middle, thinner at ends
      const t = i / (points.length - 1);
      widths[i] = Math.sin(t * Math.PI);
    }
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  if (widths) {
    geometry.setAttribute('width', new THREE.BufferAttribute(widths, 1));
  }

  return geometry;
}

/**
 * Create shader uniforms for link rendering
 */
export function createShaderUniforms(
  color: THREE.Color = new THREE.Color(0x00ddff)
): LinkShaderUniforms {
  return {
    time: new THREE.Uniform(0),
    energy: new THREE.Uniform(1),
    intensity: new THREE.Uniform(1),
    linkType: new THREE.Uniform(0),
    selected: new THREE.Uniform(0),
    color: new THREE.Uniform(color)
  };
}

/**
 * UPGRADE: Setup multi-strand conduit attributes on geometry
 * Adds strand-specific attributes for the conduit shader
 */
export function setupConduitGeometryAttributes(
  geometry: THREE.BufferGeometry,
  strandCount: number = 5
): void {
  const positionAttr = geometry.getAttribute('position');
  if (!positionAttr) return;
  
  const vertexCount = (positionAttr as THREE.BufferAttribute).count;
  
  // Create strand attributes
  const aStrand = new Float32Array(vertexCount);
  const aRadius = new Float32Array(vertexCount);
  const aSeed = new Float32Array(vertexCount);
  const aFlow = new Float32Array(vertexCount);
  // [B.3-B] WebGL1-safe parametric index (0..1) to replace gl_VertexID usage
  const aVertexIndex = new Float32Array(vertexCount);
  
  for (let i = 0; i < vertexCount; i++) {
    // Distribute vertices across strands
    aStrand[i] = (i % strandCount) / strandCount;
    
    // Radius varies by strand (outer strands thicker)
    const strandIdx = i % strandCount;
    const radiusBase = 1.0 - (strandIdx / strandCount) * 0.5;
    aRadius[i] = radiusBase;
    
    // Random seed for variation
    aSeed[i] = Math.random();
    
    // Flow direction (alternating)
    aFlow[i] = ((i / vertexCount) % 2) > 0.5 ? 1.0 : -1.0;
    
    // Parametric position along curve
    aVertexIndex[i] = vertexCount > 1 ? (i / (vertexCount - 1)) : 0.0;
  }
  
  // Set attributes
  geometry.setAttribute('aStrand', new THREE.BufferAttribute(aStrand, 1));
  geometry.setAttribute('aRadius', new THREE.BufferAttribute(aRadius, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  geometry.setAttribute('aFlow', new THREE.BufferAttribute(aFlow, 1));
  geometry.setAttribute('aVertexIndex', new THREE.BufferAttribute(aVertexIndex, 1));
}

// ============================================================================
// LINK RENDERER COMPONENT
// ============================================================================

/**
 * LinkRenderer - React Three Fiber component for rendering links
 * 
 * Renders Bezier curves connecting nodes with custom shader materials.
 * Handles animation, caching, and real-time updates.
 */
export const LinkRenderer = React.forwardRef<
  THREE.Group,
  LinkRendererProps
>((props, ref) => {
  const {
    links,
    nodes,
    material,
    resolution = 32,
    curvature = 0.5,
    animateShaderUniforms = true,
    colorMap,
    selectedLinkId,
    oneLinkHighlight = false
  } = props;

  const groupRef = useRef<THREE.Group>(null);
  const geometryCacheRef = useRef<Map<string, LinkGeometryCache>>(new Map());
  const linesRef = useRef<Map<string, THREE.Line>>(new Map());

  const { camera } = useThree();

  // ========================================================================
  // EFFECT: Initialize and manage geometries
  // ========================================================================

  useEffect(() => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    const geometryCache = geometryCacheRef.current;
    const lines = linesRef.current;

    // Remove lines for deleted links
    const linkIds = new Set(links.map(l => l.id));
    for (const [cachedId, line] of lines.entries()) {
      if (!linkIds.has(cachedId)) {
        group.remove(line);
        lines.delete(cachedId);
        geometryCache.delete(cachedId);
      }
    }

    // Add or update lines for current links
    links.forEach(link => {
      const fromNode = nodes.get(link.from);
      const toNode = nodes.get(link.to);

      if (!fromNode || !toNode) return;

      // Compute Bezier points
      const points = computeBezierPoints(
        fromNode.position,
        toNode.position,
        resolution,
        curvature
      );

      if (points.length === 0) return;

      // Get or create line
      let line = lines.get(link.id);

      if (!line) {
        // Create new line with conduit geometry
        const geometry = createLineGeometry(points, true);
        
        // UPGRADE: Setup multi-strand attributes
        setupConduitGeometryAttributes(geometry, 5);
        
        const lineMaterial = material?.clone?.() ?? getPooledLinkShaderMaterial();
        
        // SAFETY: Ensure fully opaque material
        if (lineMaterial instanceof THREE.ShaderMaterial) {
          lineMaterial.transparent = false;
          lineMaterial.opacity = 1.0;
          lineMaterial.depthWrite = true;
          lineMaterial.depthTest = true;
          lineMaterial.blending = THREE.NormalBlending;
          
          // Set initial colors from colorMap
          if (lineMaterial.uniforms.color) {
            lineMaterial.uniforms.color.value = colorMap?.get(link.id) ?? new THREE.Color(0x00ddff);
          }
          if (lineMaterial.uniforms.uColorA) {
            lineMaterial.uniforms.uColorA.value = colorMap?.get(link.id) ?? new THREE.Color(0x00ddff);
          }
        }

        line = new THREE.Line(geometry, lineMaterial);
        line.userData.linkId = link.id;
        
        // SAFETY: Disable raycasting on link meshes
        line.raycast = () => [];

        group.add(line);
        lines.set(link.id, line);

        geometryCache.set(link.id, {
          linkId: link.id,
          geometry,
          lastUpdateFrame: 0,
          isDirty: false
        });
      } else {
        // Update existing line
        const cached = geometryCache.get(link.id);
        if (cached) {
          const geometry = createLineGeometry(points, true);
          setupConduitGeometryAttributes(geometry, 5);
          line.geometry.dispose();
          line.geometry = geometry;
          cached.isDirty = false;
        }
      }

      // [B.3-D2] Per-link uniform storage; applied in onBeforeRender to shared material
      const perLinkUniforms = (line.userData.__b3d2Uniforms =
        line.userData.__b3d2Uniforms || {});
      perLinkUniforms.color =
        colorMap?.get(link.id) ?? new THREE.Color(0x00ddff);
      perLinkUniforms.uColorA =
        colorMap?.get(link.id) ?? new THREE.Color(0x00ddff);
      perLinkUniforms.selected = selectedLinkId === link.id ? 1 : 0;
      perLinkUniforms.uLoad = 0.3 + Math.random() * 0.2;
      perLinkUniforms.uStress = 0.0;
      perLinkUniforms.uCorruption = 0.0;

      // [B.3-D2] Apply per-link uniforms just before render to avoid shared-material bleed
      line.onBeforeRender = (_renderer, _scene, _camera, _geometry, mat) => {
        const uniforms = (mat as any).uniforms as LinkShaderUniforms;
        const src = line.userData.__b3d2Uniforms;
        if (!uniforms || !src) return;

        if (uniforms.color && src.color) uniforms.color.value = src.color;
        if (uniforms.uColorA && src.uColorA) uniforms.uColorA.value = src.uColorA;
        if (uniforms.uColorB && src.uColorB) uniforms.uColorB.value = src.uColorB;
        if (uniforms.uColorC && src.uColorC) uniforms.uColorC.value = src.uColorC;
        if (uniforms.selected !== undefined && src.selected !== undefined) {
          uniforms.selected.value = src.selected;
        }
        if (uniforms.uLoad !== undefined && src.uLoad !== undefined) {
          uniforms.uLoad.value = src.uLoad;
        }
        if (uniforms.uStress !== undefined && src.uStress !== undefined) {
          uniforms.uStress.value = src.uStress;
        }
        if (
          uniforms.uCorruption !== undefined &&
          src.uCorruption !== undefined
        ) {
          uniforms.uCorruption.value = src.uCorruption;
        }
        if (uniforms.energy !== undefined && src.energy !== undefined) {
          uniforms.energy.value = src.energy;
        }
        if (uniforms.intensity !== undefined && src.intensity !== undefined) {
          uniforms.intensity.value = src.intensity;
        }
        if (uniforms.time !== undefined && src.time !== undefined) {
          uniforms.time.value = src.time;
        }
        if (uniforms.uTime !== undefined && src.uTime !== undefined) {
          uniforms.uTime.value = src.uTime;
        }
      };
    });

    return () => {
      // Cleanup on unmount
      for (const line of lines.values()) {
        line.geometry.dispose();
        if (line.material instanceof THREE.Material) {
          const pooled = (line.material as any).__b3d2Pooled;
          if (!pooled && typeof line.material.dispose === 'function') {
            line.material.dispose();
          }
        }
      }
      lines.clear();
      geometryCache.clear();
    };
  }, [links, nodes, resolution, curvature, material, colorMap, selectedLinkId, animateShaderUniforms]);

  // ========================================================================
  // EFFECT: Assign reference
  // ========================================================================

  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(groupRef.current);
      } else {
        ref.current = groupRef.current;
      }
    }
  }, [ref]);

  // ========================================================================
  // ANIMATION FRAME: Update shader uniforms
  // ========================================================================

  useFrame((state, delta) => {
    if (!animateShaderUniforms) return;

    const lines = linesRef.current;

    for (const [, line] of lines.entries()) {
      const u = line.userData.__b3d2Uniforms || (line.userData.__b3d2Uniforms = {});

      u.time = (u.time ?? 0) + delta;
      u.uTime = (u.uTime ?? 0) + delta;

      // Legacy: pulse intensity (now affects strand alpha multiplier)
      u.intensity = 0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 2);

      // Legacy: energy based on link activity (affects load glow)
      u.energy = Math.random() * 0.5 + 0.5;
    }
  });

  return <group ref={groupRef} />;
});

LinkRenderer.displayName = 'LinkRenderer';

// ============================================================================
// LINK BATCH RENDERER
// ============================================================================

/**
 * Optimized renderer for large numbers of links using instancing or batching
 */
export interface LinkBatchRendererProps extends Omit<LinkRendererProps, 'links'> {
  links: Link[];
  batchSize?: number;
  useInstancing?: boolean;
}

/**
 * LinkBatchRenderer - Optimized for many links
 */
export const LinkBatchRenderer = React.forwardRef<
  THREE.Group,
  LinkBatchRendererProps
>((props, ref) => {
  const {
    links,
    nodes,
    material,
    resolution = 32,
    curvature = 0.5,
    animateShaderUniforms = true,
    colorMap,
    selectedLinkId,
    batchSize = 100,
    useInstancing = false
  } = props;

  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // For instancing: create combined geometry and use InstancedMesh
  const instanceDataRef = useRef<{
    positions: Float32Array;
    colors: Float32Array;
    count: number;
  }>({ positions: new Float32Array(), colors: new Float32Array(), count: 0 });

  const { camera } = useThree();

  // ========================================================================
  // EFFECT: Build instanced geometry if enabled
  // ========================================================================

  useEffect(() => {
    if (!useInstancing || !groupRef.current || !meshRef.current) return;

    const totalPoints = links.length * resolution;
    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);

    let vertexIndex = 0;

    links.forEach((link, linkIndex) => {
      const fromNode = nodes.get(link.from);
      const toNode = nodes.get(link.to);

      if (!fromNode || !toNode) return;

      const points = computeBezierPoints(
        fromNode.position,
        toNode.position,
        resolution,
        curvature
      );

      const color = colorMap?.get(link.id) ?? new THREE.Color(0x00ddff);

      points.forEach(point => {
        positions[vertexIndex * 3] = point.x;
        positions[vertexIndex * 3 + 1] = point.y;
        positions[vertexIndex * 3 + 2] = point.z;

        colors[vertexIndex * 3] = color.r;
        colors[vertexIndex * 3 + 1] = color.g;
        colors[vertexIndex * 3 + 2] = color.b;

        vertexIndex++;
      });
    });

    instanceDataRef.current = {
      positions,
      colors,
      count: vertexIndex
    };

    // Update geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    meshRef.current.geometry.dispose();
    meshRef.current.geometry = geometry;
  }, [links, nodes, resolution, curvature, colorMap, useInstancing]);

  // ========================================================================
  // RENDER
  // ========================================================================

  if (useInstancing) {
    return (
      <group ref={groupRef}>
        <lineSegments>
          <bufferGeometry ref={(geom) => { if (!meshRef.current) return; meshRef.current.geometry = geom as any; }} />
          <lineBasicMaterial vertexColors color={0xffffff} linewidth={2} />
        </lineSegments>
      </group>
    );
  }

  // Fallback to standard renderer
  return (
    <LinkRenderer
      ref={ref}
      links={links}
      nodes={nodes}
      material={material}
      resolution={resolution}
      curvature={curvature}
      animateShaderUniforms={animateShaderUniforms}
      colorMap={colorMap}
      selectedLinkId={selectedLinkId}
    />
  );
});

LinkBatchRenderer.displayName = 'LinkBatchRenderer';

// ============================================================================
// SHADER MATERIAL HELPER
// ============================================================================

/**
 * UPGRADED: Multi-strand conduit shader material (IN-PLACE)
 * 
 * Replaced simple link shader with world-class multi-strand conduit.
 * All existing uniforms preserved. New capabilities:
 * - Multi-strand composition (3-7 strands)
 * - Directional flow animation via UV.y
 * - State-driven color (stable/stress/corruption)
 * - Mechanical micro-segmentation
 * - Fully opaque rendering (no transparency)
 */
export function createLinkShaderMaterial(): THREE.ShaderMaterial {
  const uniforms = {
    // Timing & animation
    time: { value: 0 },
    uTime: { value: 0 },
    
    // Network state (normalized 0-1)
    uLoad: { value: 0.3 },
    uStress: { value: 0.0 },
    uCorruption: { value: 0.0 },
    
    // Colors: stable → stress → corruption progression
    color: { value: new THREE.Color(0x00ddff) },      // Default stable color
    uColorA: { value: new THREE.Color(0x00ddff) },    // Stable (cyan)
    uColorB: { value: new THREE.Color(0xff6b35) },    // Stress (orange)
    uColorC: { value: new THREE.Color(0xff1744) },    // Corruption (red)
    
    // Shader configuration
    uFlowStrength: { value: 1.0 },      // Flow animation intensity (0-1)
    uStrandCount: { value: 5.0 },       // Number of strands (3-7)
    uCoreMix: { value: 0.7 },           // Core vs outer blend (0-1)
    uSegmentCount: { value: 16.0 },     // Mechanical segments
    
    // Legacy uniforms (backward compatibility)
    energy: { value: 1 },
    intensity: { value: 1 },
    linkType: { value: 0 },
    selected: { value: 0 }
  };

  const vertexShader = `
    // Input attributes
    attribute float aStrand;       // Strand index (0-strandCount)
    attribute float aRadius;       // Strand outer radius
    attribute float aSeed;         // Per-vertex noise seed
    attribute float aFlow;         // Flow direction
    attribute float aVertexIndex;  // [B.3-B] WebGL1-safe parametric position 0..1
    
    // Varyings to fragment
    varying vec3 vPosition;
    varying float vT;           // Parametric position (0-1)
    varying float vStrand;      // Strand index
    varying float vRadius;      // Strand radius
    varying float vFlow;        // Flow modifier
    varying vec3 vNormal;
    
    void main() {
      vPosition = position;
      
      // [B.3-B] Use explicit attribute to avoid gl_VertexID dependency
      vT = aVertexIndex;
      
      // Strand data
      vStrand = aStrand;
      vRadius = aRadius;
      vFlow = aFlow;
      vNormal = normalize(normal);
      
      // Standard transformation
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    
    // Uniforms
    uniform float time;
    uniform float uTime;
    uniform float uLoad;
    uniform float uStress;
    uniform float uCorruption;
    uniform vec3 color;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform float uFlowStrength;
    uniform float uStrandCount;
    uniform float uCoreMix;
    uniform float uSegmentCount;
    uniform float energy;
    uniform float intensity;
    uniform float linkType;
    uniform float selected;
    
    // Varyings
    varying vec3 vPosition;
    varying float vT;
    varying float vStrand;
    varying float vRadius;
    varying float vFlow;
    varying vec3 vNormal;
    
    // Pseudo-random
    float random(float x) {
      return fract(sin(x * 12.9898) * 43758.5453);
    }
    
    // Get color based on network state
    vec3 getStateColor(float t, float load, float stress, float corruption) {
      vec3 baseColor = uColorA;
      
      // Color progression: stable → stress → corruption
      if (corruption > 0.5) {
        // Corruption dominant
        baseColor = mix(uColorA, uColorC, corruption);
      } else if (stress > 0.3) {
        // Stress visible
        baseColor = mix(uColorA, uColorB, min(1.0, stress / 0.3));
      }
      
      // Load adds glow
      float glowIntensity = 0.2 + load * 0.3;
      baseColor += glowIntensity;
      
      return baseColor;
    }
    
    // Mechanical micro-segmentation
    float getMicroSegmentation(float t) {
      float segPattern = mod(t * uSegmentCount, 1.0);
      float boundaryWidth = 0.15;
      float boundary = smoothstep(0.0, boundaryWidth, segPattern) * 
                       smoothstep(1.0, 1.0 - boundaryWidth, segPattern);
      return mix(0.75, 1.0, boundary);
    }
    
    // Directional flow animation
    float getFlowAnimation(float t) {
      float scrollSpeed = uFlowStrength * 2.0;
      float flowPhase = mod(uTime * scrollSpeed + t * vFlow, 1.0);
      float flowWave = sin(flowPhase * 3.14159 * 2.0) * 0.5 + 0.5;
      return mix(1.0, 1.1, flowWave * uFlowStrength);
    }
    
    // Multi-strand opacity
    float getStrandOpacity(float strand) {
      if (strand < 1.0) return 1.0;  // Core filament
      
      float outerIdx = strand - 1.0;
      float outerOpacity = mix(uCoreMix, 0.3, 
        min(1.0, outerIdx / (uStrandCount - 1.0)));
      return outerOpacity;
    }
    
    void main() {
      float t = vT;
      float load = uLoad;
      float stress = uStress;
      float corruption = uCorruption;
      
      // === CORE RENDERING ===
      
      // Get base color from state
      vec3 finalColor = getStateColor(t, load, stress, corruption);
      
      // Apply micro-segmentation
      finalColor *= getMicroSegmentation(t);
      
      // Apply flow animation
      finalColor *= getFlowAnimation(t);
      
      // Strand opacity
      float strandAlpha = getStrandOpacity(vStrand);
      
      // Legacy intensity
      strandAlpha *= intensity;
      
      // Selection highlight
      if (selected > 0.5) {
        finalColor *= 1.2;
        strandAlpha = min(1.0, strandAlpha * 1.1);
      }
      
      // === MANDATORY: FULLY OPAQUE OUTPUT ===
      // Always render fully opaque (alpha = 1.0)
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    
    // === SAFETY CONSTRAINTS (IN-PLACE UPGRADE) ===
    transparent: false,             // MANDATORY: No transparency
    opacity: 1.0,                   // MANDATORY: Full opacity
    depthWrite: true,               // MANDATORY: Write depth
    depthTest: true,                // MANDATORY: Test depth
    blending: THREE.NormalBlending, // MANDATORY: Normal blending only
    
    // Rendering
    side: THREE.DoubleSide,
    wireframe: false,
    vertexColors: false,
    linewidth: 2
  });

  // Enforce single program cache key for all link shaders
  material.customProgramCacheKey = () => 'ATOMA_LINK_CANONICAL_v1';

  return material;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default LinkRenderer;
