/**
 * SYNERGY HIGHWAY VISUALS 3D 1.0
 * Real-Time 3D Visualization of Network Flow Routes
 * 
 * ╔════════════════════════════════════════════════════════════════╗
 * ║              3D VISUAL HIGHWAYS FOR SYNERGY ROUTES             ║
 * ╠════════════════════════════════════════════════════════════════╣
 * ║                                                                ║
 * ║  Renders flowing 3D arcs/ribbons for each synergy highway:    ║
 * ║  - Arc geometry between node category clusters                ║
 * ║  - Width, intensity, speed, color from synergy metrics        ║
 * ║  - Animated flow effect (moving UVs)                          ║
 * ║  - Bloom/halo for critical routes                             ║
 * ║  - Real-time updates from the merged highway aggregation path ║
 * ║                                                                ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * Features:
 * - Per-highway 3D mesh generation
 * - CatmullRomCurve3 arcs with TubeGeometry
 * - Shader-based flowing animation
 * - Bloom/emissive effects at critical synergy
 * - Real-time metric synchronization
 * - Automatic lifecycle management (create/update/remove)
 * - Safe integration (null-safe, non-invasive)
 * - Performance optimized (<1ms per frame)
 * 
 * Data Dependencies:
 * - linkingSystem.links → raw links
 * - Each link uses canonical link.userData.synergy for synergy values
 * - Aggregated highways expose: id, fromCategory, toCategory, avgSynergy,
 *   maxSynergy, trend, volatility, visuals {width, intensity, speed, color, bloomActive}
 * 
 *  Visual Hierarchy:
 *  this.group (THREE.Group in scene)
 *    ├─ Highway meshes (one per route)
 *    │  ├─ Main tube (with flowing shader)
 *    │  ├─ Glow layer (optional, higher opacity)
 *    │  └─ Halo (bloom effect, if critical)
 *    ├─ Chromatic Trail particles (Points, additive blending)
 *    │  └─ Per-highway particles with source→target color gradient
 *    ├─ Cluster Fields (soft wireframe spheres at category anchors)
 *    │  └─ Breathing animation, color by aggregate synergy
 *    └─ Debug visuals (end nodes, if enabled)
 * 
 * Performance:
 * - Per-highway creation: ~2-5ms
 * - Per-frame update: <1ms (100 highways)
 * - Memory per highway: ~500KB-1MB (depending on geometry complexity)
 * - Total for 20 highways: ~5-10MB + shader uniforms
 * 
 * Integration:
 * 1. In main.js import and call init()
 * 2. In animate loop call update(deltaTime)
 * 3. Call refreshFromHighways() when highway data changes
 * 4. That's it! No modifications to core systems needed.
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const SynergyHighwayVisuals3D_1_0 = (() => {
  // ═══════════════════════════════════════════════════════════════
  // PRIVATE STATE
  // ═══════════════════════════════════════════════════════════════

  let scene = null;
  let camera = null;
  let renderer = null;
  let synergyHighwaysEngine = null;
  let linkingSystem = null;
  let historyTracker = null;
  let aiNodes = null;  // Reference to AI nodes for dynamic anchor computation

  let group = null;  // Main group containing all highway meshes
  const highwayMeshes = new Map();  // Map<highway.id, mesh>
  const highwayHaloMeshes = new Map(); // Map<highway.id, halo mesh>
  const highwayData = new Map();    // Map<highway.id, highway object>
  const highways = [];              // Aggregated highway data
  const highwayMap = new Map();     // Map<routeId, highway>

  let lastRebuildTime = 0;
  let rebuildScheduled = false;
  let cacheValid = false;

  // Dynamically computed category anchors (updated from node positions)
  const computedAnchors = new Map();

  let elapsedTime = 0;  // For animation
  let enabled = true;
  let debugEnabled = false;
  let _anchorsLastUpdate = 0;
  const _anchorUpdateInterval = 2.0;  // Re-compute anchors every 2 seconds

  // ── Chromatic Trail state ──
  const trailParticles = [];
  let trailPointsMesh = null;
  let trailGeometry = null;
  let trailMaterial = null;
  const trailSpawnTimers = new Map();  // highwayId → lastSpawnTime

  // ── Cluster Field state ──
  const clusterFieldMeshes = new Map();  // category → { mesh, material, avgSynergy }

  const config = {
    enabled: true,
    rebuildThrottleMs: 500,
    updateThrottleMs: 100,
    minLinkCount: 1,
    minAvgSynergy: 0.0,
    curveResolution: 32,        // Points along curve for tube geometry
    tubeSides: 8,               // Radial segments on tube
    minTubeRadius: 0.05,        // Minimum tube radius
    maxTubeRadius: 0.25,        // Maximum tube radius
    animationSpeed: 1.0,        // UV scrolling speed multiplier
    opacityBase: 0.4,           // Base opacity for highways
    bloomIntensityMult: 1.5,    // Bloom intensity multiplier
    enableGlowLayer: true,      // Render additional glow layer
    enableHaloEffect: true,     // Render bloom halo for critical
    categoryPositions: {},      // Will be populated with computed centers
    enableDebugNodes: false,    // Draw debug spheres at category positions
    enableDebugVisuals: false,
    enableLogging: false,

    // ── Chromatic Trails ──
    enableChromaticTrails: true,
    trailSpawnInterval: 0.12,       // seconds between spawns per highway
    trailParticleSize: 0.25,
    trailLifetime: 2.0,            // seconds
    trailSpeed: 0.3,               // units/s along curve tangent
    trailMaxParticles: 200,

    // ── Cluster Fields ──
    enableClusterFields: true,
    clusterFieldOpacity: 0.05,
    clusterFieldMinSynergy: 0.3,
    clusterFieldWireframe: true,
    clusterFieldBaseRadius: 3.0,
    clusterFieldBreathSpeed: 0.5,
    clusterFieldBreathAmount: 0.1,
  };

  const validCategories = [
    'input', 'process', 'integration', 'analytics', 'storage', 'control',
    'sigma', 'quantum', 'emotional'
  ];
  
  // Category anchor positions (will be computed from node locations)
  const categoryAnchors = {
    'input': new (THREE?.Vector3 || function() {})(-10, 5, -10),
    'process': new (THREE?.Vector3 || function() {})(-5, 5, 0),
    'integration': new (THREE?.Vector3 || function() {})(-2, 5, 10),
    'analytics': new (THREE?.Vector3 || function() {})(-5, -5, 15),
    'storage': new (THREE?.Vector3 || function() {})(-10, -5, 10),
    'control': new (THREE?.Vector3 || function() {})(-15, 0, 5),
    'sigma': new (THREE?.Vector3 || function() {})(5, 8, -5),
    'quantum': new (THREE?.Vector3 || function() {})(5, -8, 10),
    'emotional': new (THREE?.Vector3 || function() {})(-8, 2, -15)
  };

  // Category color palette for chromatic trails
  const categoryColors = {
    'input':        new (THREE.Color || function() {})(0x00ddff),
    'process':      new (THREE.Color || function() {})(0x44ff88),
    'integration':  new (THREE.Color || function() {})(0x88ff44),
    'analytics':    new (THREE.Color || function() {})(0xffdd44),
    'storage':      new (THREE.Color || function() {})(0xff8844),
    'control':      new (THREE.Color || function() {})(0xff4488),
    'sigma':        new (THREE.Color || function() {})(0xaa44ff),
    'quantum':      new (THREE.Color || function() {})(0x4488ff),
    'emotional':    new (THREE.Color || function() {})(0xff44aa),
  };

  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }

  function getHighwayId(fromCategory, toCategory) {
    return `${fromCategory}→${toCategory}`;
  }

  function getLinkSynergy(link) {
    if (!link) return 0;

    const canonicalSynergy = link.userData?.synergy;
    if (canonicalSynergy && typeof canonicalSynergy === 'object') {
      const score = canonicalSynergy.score;
      if (typeof score === 'number' && Number.isFinite(score)) {
        return Math.max(0, Math.min(1, score));
      }

      const synergyNorm = canonicalSynergy.synergyNorm;
      if (typeof synergyNorm === 'number' && Number.isFinite(synergyNorm)) {
        return Math.max(0, Math.min(1, synergyNorm));
      }
    }

    if (link.traffic?.load) {
      return Math.max(0, Math.min(1, link.traffic.load));
    }

    return 0.5;
  }

  function getLinkCascade(link) {
    if (!link) return 0;
    const rawCascade = link.userData?.cascadeStrength ?? link.userData?.cascade ?? 0;
    if (!Number.isFinite(rawCascade)) return 0;
    return Math.max(0, Math.min(1, rawCascade));
  }

  function getNodeCategory(node) {
    if (!node || !node.userData) return null;
    const category = node.userData.category || node.userData.type;
    return validCategories.includes(category) ? category : null;
  }

  function getLinkTrend(link) {
    if (!historyTracker || !link) return 'stable';
    try {
      const linkId = link._glyphId || link.id || `link_${Math.random()}`;
      const trend = historyTracker.getTrend?.(linkId);
      return trend?.direction || 'stable';
    } catch (error) {
      return 'stable';
    }
  }

  function getLinkVolatility(link) {
    if (!historyTracker || !link) return 0.3;
    try {
      const linkId = link._glyphId || link.id || `link_${Math.random()}`;
      const stats = historyTracker.getStats?.(linkId);
      return stats?.volatility ?? 0.3;
    } catch (error) {
      return 0.3;
    }
  }

  function computeVisualProfile(avgSynergy, maxSynergy, volatility) {
    if (!Number.isFinite(avgSynergy)) avgSynergy = 0.5;
    if (!Number.isFinite(maxSynergy)) maxSynergy = avgSynergy;
    if (!Number.isFinite(volatility)) volatility = 0.3;

    avgSynergy = Math.max(0, Math.min(1, avgSynergy));

    let color = 0x3d7aaa;
    if (avgSynergy >= 0.85) color = 0x99dddd;
    else if (avgSynergy >= 0.65) color = 0x00b385;
    else if (avgSynergy >= 0.4) color = 0x3d9f92;

    return {
      width: lerp(0.3, 2.0, avgSynergy),
      intensity: lerp(0.1, 0.8, avgSynergy),
      speed: lerp(0.5, 3.0, avgSynergy),
      emissiveBoost: lerp(0.1, 0.6, avgSynergy),
      color,
      bloomActive: maxSynergy > 0.85,
      volatility
    };
  }

  function computeCascadeVisualProfile(avgCascade, maxCascade) {
    if (!Number.isFinite(avgCascade)) avgCascade = 0;
    if (!Number.isFinite(maxCascade)) maxCascade = 0;
    avgCascade = Math.max(0, Math.min(1, avgCascade));
    maxCascade = Math.max(0, Math.min(1, maxCascade));

    let color = 0x3d9f92;
    if (maxCascade >= 0.66) color = 0xff3333;
    else if (maxCascade >= 0.33) color = 0xff7a33;

    return {
      width: lerp(0.3, 2.0, avgCascade),
      intensity: lerp(0.1, 0.8, maxCascade),
      speed: Math.max(0.5, avgCascade * 2.0),
      emissiveBoost: lerp(0.1, 0.6, maxCascade),
      color,
      bloomActive: maxCascade > 0.6,
      opacityMult: 1.2
    };
  }

  function aggregateTrend(links) {
    if (!links || links.length === 0) return 'stable';

    let rising = 0;
    let falling = 0;
    for (const link of links) {
      const trend = getLinkTrend(link);
      if (trend === 'rising') rising++;
      else if (trend === 'falling') falling++;
    }

    const ratio = rising / links.length;
    if (ratio > 0.6) return 'rising';
    if (ratio < 0.4) return 'falling';
    return 'stable';
  }

  function averageVolatility(links) {
    if (!links || links.length === 0) return 0.3;
    const sum = links.reduce((accumulator, link) => accumulator + getLinkVolatility(link), 0);
    return sum / links.length;
  }

  function rebuildHighways() {
    const sourceLinks = linkingSystem?.links || synergyHighwaysEngine?.links || [];

    highways.length = 0;
    highwayMap.clear();

    if (!Array.isArray(sourceLinks) || sourceLinks.length === 0) {
      cacheValid = true;
      rebuildScheduled = false;
      lastRebuildTime = performance.now();
      return;
    }

    const routeMap = new Map();

    for (const link of sourceLinks) {
      if (!link || !link.source || !link.target) continue;
      if (link.active === false) continue;

      const fromCategory = getNodeCategory(link.source);
      const toCategory = getNodeCategory(link.target);
      if (!fromCategory || !toCategory) continue;

      const routeId = getHighwayId(fromCategory, toCategory);
      if (!routeMap.has(routeId)) {
        routeMap.set(routeId, []);
      }
      routeMap.get(routeId).push(link);
    }

    for (const [routeId, routeLinks] of routeMap.entries()) {
      if (routeLinks.length < config.minLinkCount) continue;

      const [fromCategory, toCategory] = routeId.split('→');
      const synergies = routeLinks.map(getLinkSynergy);
      const avgSynergy = synergies.reduce((sum, value) => sum + value, 0) / synergies.length;
      const maxSynergy = Math.max(...synergies);
      const cascades = routeLinks.map(getLinkCascade);
      const avgCascade = cascades.reduce((sum, value) => sum + value, 0) / cascades.length;
      const maxCascade = Math.max(...cascades);

      if (avgSynergy < config.minAvgSynergy) continue;

      const trend = aggregateTrend(routeLinks);
      const volatility = averageVolatility(routeLinks);
      const highway = {
        id: routeId,
        type: 'synergy',
        fromCategory,
        toCategory,
        linkCount: routeLinks.length,
        avgSynergy,
        maxSynergy,
        avgCascade,
        maxCascade,
        trend,
        volatility,
        visuals: computeVisualProfile(avgSynergy, maxSynergy, volatility),
        links: routeLinks
      };

      highways.push(highway);
      highwayMap.set(routeId, highway);

      if (maxCascade > 0.25) {
        const cascadeHighway = {
          id: `${routeId}_cascade`,
          type: 'cascade',
          fromCategory,
          toCategory,
          linkCount: routeLinks.length,
          avgSynergy,
          maxSynergy,
          avgCascade,
          maxCascade,
          trend,
          volatility,
          visuals: computeCascadeVisualProfile(avgCascade, maxCascade),
          links: routeLinks
        };

        highways.push(cascadeHighway);
        highwayMap.set(cascadeHighway.id, cascadeHighway);
      }
    }

    cacheValid = true;
    rebuildScheduled = false;
    lastRebuildTime = performance.now();
  }

  function scheduleRebuild() {
    if (rebuildScheduled || !config.enabled) return;

    rebuildScheduled = true;
    const timeSinceLastRebuild = performance.now() - lastRebuildTime;
    const delay = Math.max(0, config.rebuildThrottleMs - timeSinceLastRebuild);

    setTimeout(() => {
      rebuildHighways();
    }, delay);
  }

  function updateHighwayData() {
    if (!config.enabled) return;
    if (!cacheValid) {
      rebuildHighways();
      return;
    }

    for (const highway of highways) {
      if (!highway.links) continue;

      const synergies = highway.links.map(getLinkSynergy);
      const cascades = highway.links.map(getLinkCascade);
      highway.avgSynergy = synergies.reduce((sum, value) => sum + value, 0) / synergies.length;
      highway.maxSynergy = Math.max(...synergies);
      highway.avgCascade = cascades.reduce((sum, value) => sum + value, 0) / cascades.length;
      highway.maxCascade = Math.max(...cascades);
      highway.trend = aggregateTrend(highway.links);
      highway.volatility = averageVolatility(highway.links);
      highway.visuals = highway.type === 'cascade'
        ? computeCascadeVisualProfile(highway.avgCascade, highway.maxCascade)
        : computeVisualProfile(highway.avgSynergy, highway.maxSynergy, highway.volatility);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SHADER DEFINITION
  // ═══════════════════════════════════════════════════════════════
  
  const highwayShader = {
    uniforms: {
      color: { value: new (THREE?.Color || function() {})(0x00ff00) },
      intensity: { value: 0.5 },
      time: { value: 0 },
      flowSpeed: { value: 1.0 },
      opacityMult: { value: 0.4 },
      trendStrength: { value: 0.0 },
      volatility: { value: 0.0 }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vProgress;
      
      attribute float progress;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normal);
        vProgress = progress;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float intensity;
      uniform float time;
      uniform float flowSpeed;
      uniform float opacityMult;
      uniform float trendStrength;
      uniform float volatility;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vProgress;
      
      void main() {
        float flow = fract(vProgress - time * flowSpeed);
        float stripe = smoothstep(0.2, 0.9, abs(sin(flow * 3.14159 * 10.0)));
        
        float edge = pow(sin(vProgress * 3.14159), 1.4) * 0.85 + 0.15;
        float pulse = 0.1 + 0.1 * trendStrength * sin(time * flowSpeed * 2.0 + vProgress * 12.0);
        float jitter = volatility * 0.18 * sin(time * 6.0 + vProgress * 18.0);
        
        float opacity = opacityMult * intensity * edge * (0.45 + stripe * 0.45 + pulse) + jitter * 0.12;
        opacity = clamp(opacity, 0.0, 1.0);
        
        vec3 baseColor = mix(color, vec3(1.0), trendStrength * 0.18);
        baseColor += volatility * 0.08;
        
        gl_FragColor = vec4(baseColor, opacity);
      }
    `
  };
  
  // ═══════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Update category anchors from actual node positions
   * Call periodically or when nodes change significantly
   */
  function updateCategoryAnchorsFromNodes() {
    if (!aiNodes) return;

    const nodes = Array.isArray(aiNodes) ? aiNodes : (aiNodes?.nodes || []);
    if (nodes.length === 0) return;

    // Group nodes by category
    const categoryNodes = new Map();
    for (const node of nodes) {
      const category = node?.userData?.category;
      if (!category) continue;

      if (!categoryNodes.has(category)) {
        categoryNodes.set(category, []);
      }
      categoryNodes.get(category).push(node);
    }

    // Compute center for each category
    for (const [category, nodeList] of categoryNodes) {
      if (nodeList.length === 0) continue;

      let centerX = 0, centerY = 0, centerZ = 0;
      for (const node of nodeList) {
        centerX += node.position.x;
        centerY += node.position.y;
        centerZ += node.position.z;
      }

      const center = new THREE.Vector3(
        centerX / nodeList.length,
        centerY / nodeList.length,
        centerZ / nodeList.length
      );

      computedAnchors.set(category, center);
    }

    if (debugEnabled) {
      console.log(`[SynergyHighwayVisuals] Updated ${computedAnchors.size} category anchors from nodes`);
    }
  }

  /**
   * Get category center position
   * Uses computed anchor if available, else falls back to static anchor
   */
  function getCategoryPosition(category) {
    // Priority 1: Use computed anchor from actual nodes
    if (computedAnchors.has(category)) {
      return computedAnchors.get(category);
    }

    // Priority 2: Fall back to static anchor
    return categoryAnchors[category] || new THREE.Vector3(0, 0, 0);
  }
  
  /**
   * Create a curved path between two points
   */
  function createCurvePath(start, end) {
    if (!start || !end) {
      return null;
    }
    
    // Create a Catmull-Rom curve with control points
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const midZ = (start.z + end.z) / 2;
    
    // Offset middle point for arc effect
    const offsetDist = start.distanceTo(end) * 0.3;
    const controlPoint1 = new (THREE.Vector3 || function() {})(
      midX - offsetDist,
      midY + offsetDist,
      midZ
    );
    const controlPoint2 = new (THREE.Vector3 || function() {})(
      midX + offsetDist,
      midY + offsetDist,
      midZ
    );
    
    const curve = new (THREE?.CatmullRomCurve3 || function() {})([
      start,
      controlPoint1,
      controlPoint2,
      end
    ]);
    
    return curve;
  }
  
  /**
   * Create tube geometry along a curve with progress attribute
   */
  function createTubeGeometry(curve, resolution, tubeRadius, tubeSides) {
    if (!curve) return null;
    
    try {
      const points = curve.getPoints(resolution);
      
      // Create custom tube with progress attribute
      const geometry = new (THREE?.TubeGeometry || function() {})(
        curve,
        resolution,
        tubeRadius,
        tubeSides,
        false
      );
      
      // Add progress attribute for flowing effect
      if (geometry.attributes) {
        const positionAttr = geometry.attributes.position;
        const progressArray = new Float32Array(positionAttr.count);
        const ringVertexCount = tubeSides + 1;
        const segmentCount = Math.max(1, resolution);

        for (let i = 0; i < positionAttr.count; i++) {
          const segmentIndex = Math.floor(i / ringVertexCount);
          progressArray[i] = Math.min(1.0, segmentIndex / segmentCount);
        }

        geometry.setAttribute('progress', new (THREE.BufferAttribute || function() {})(progressArray, 1));
      }
      
      return geometry;
    } catch (e) {
      console.warn('[SynergyHighwayVisuals] Tube geometry creation failed:', e.message);
      return null;
    }
  }
  
  /**
   * Create material for highway
   */
  function createHighwayMaterial(colorValue, intensity) {
    try {
      const material = new (THREE?.ShaderMaterial || function() {})({
        uniforms: {
          color: { value: new (THREE.Color || function() {})(colorValue) },
          intensity: { value: Math.max(0.1, Math.min(1.0, intensity)) },
          time: { value: 0 },
          flowSpeed: { value: 1.0 },
          opacityMult: { value: config.opacityBase },
          trendStrength: { value: 0.0 },
          volatility: { value: 0.0 }
        },
        vertexShader: highwayShader.vertexShader,
        fragmentShader: highwayShader.fragmentShader,
        transparent: true,
        depthWrite: true,
        side: (THREE?.DoubleSide || 2)  // THREE.DoubleSide
      });
      
      return material;
    } catch (e) {
      // Fallback to basic material if shader fails
      console.warn('[SynergyHighwayVisuals] Shader material failed, using basic:', e.message);
      return new (THREE?.MeshBasicMaterial || function() {})({
        color: colorValue,
        transparent: true,
        opacity: intensity * config.opacityBase,
        side: (THREE?.DoubleSide || 2)
      });
    }
  }
  
  /**
   * Create or update highway mesh
   */
  function createHighwayMesh(highway) {
    if (!highway || !highway.id) return null;
    
    try {
      // Get category positions
      const startPos = getCategoryPosition(highway.fromCategory);
      const endPos = getCategoryPosition(highway.toCategory);
      
      if (!startPos || !endPos) {
        return null;
      }
      
      // Create curve
      const curve = createCurvePath(startPos, endPos);
      if (!curve) return null;
      
      // Calculate tube radius from synergy
      const tubeRadius = lerp(
        config.minTubeRadius,
        config.maxTubeRadius,
        highway.avgSynergy
      );
      
      // Create geometry
      const geometry = createTubeGeometry(
        curve,
        config.curveResolution,
        tubeRadius,
        config.tubeSides
      );
      
      if (!geometry) return null;
      
      // Create material
      const material = createHighwayMaterial(
        highway.visuals.color,
        highway.visuals.intensity
      );
      
      // Create mesh
      const mesh = new (THREE?.Mesh || function() {})(geometry, material);
      if (material?.uniforms) {
        const isCascadeHighway = highway.type === 'cascade';
        const baseSpeed = Number.isFinite(highway?.visuals?.speed) ? highway.visuals.speed : 1.0;
        const cascadeSpeed = isCascadeHighway ? baseSpeed * 2.0 : baseSpeed;
        const cascadeOpacityMult = isCascadeHighway ? 1.2 : 1.0;
        const trendWeight = highway.trend === 'rising' ? 0.35 : highway.trend === 'falling' ? 0.1 : 0.2;
        material.uniforms.flowSpeed.value = cascadeSpeed;
        material.uniforms.opacityMult.value = config.opacityBase * cascadeOpacityMult;
        material.uniforms.trendStrength.value = trendWeight;
        material.uniforms.volatility.value = THREE.MathUtils.clamp(highway.volatility, 0, 1);
      }
      mesh.userData = {
        highwayId: highway.id,
        highwayData: highway,
        isHighwayMesh: true
      };
      
      return mesh;
    } catch (e) {
      console.error('[SynergyHighwayVisuals] Mesh creation failed:', e.message);
      return null;
    }
  }
  
  /**
   * Create bloom halo mesh
   */
  function createBloomHalo(highway, startPos, endPos) {
    if (!highway.visuals.bloomActive) return null;
    
    try {
      // Create a slightly larger, more transparent version
      const curve = createCurvePath(startPos, endPos);
      if (!curve) return null;
      
      const bloatRadius = lerp(
        config.minTubeRadius * 2,
        config.maxTubeRadius * 2,
        highway.avgSynergy
      );
      
      const geometry = createTubeGeometry(
        curve,
        config.curveResolution,
        bloatRadius,
        4  // Fewer sides for halo
      );
      
      if (!geometry) return null;
      
      const material = new (THREE?.MeshBasicMaterial || function() {})({
        color: highway.visuals.color,
        transparent: true,
        opacity: Math.min(0.6, 0.2 * config.bloomIntensityMult + (highway.visuals.bloomActive ? 0.12 : 0)),
        side: (THREE?.DoubleSide || 2)
      });
      
      const halo = new (THREE?.Mesh || function() {})(geometry, material);
      halo.userData = {
        isBloomHalo: true,
        highwayId: highway.id
      };
      halo.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND');
      
      return halo;
    } catch (e) {
      return null;
    }
  }

  function removeHighwayHalo(highwayId) {
    const halo = highwayHaloMeshes.get(highwayId);
    if (!halo) return;

    try {
      if (group) {
        group.remove(halo);
      }

      if (halo.geometry) {
        halo.geometry.dispose();
      }

      if (halo.material) {
        if (Array.isArray(halo.material)) {
          halo.material.forEach(material => material.dispose());
        } else {
          halo.material.dispose();
        }
      }

      highwayHaloMeshes.delete(highwayId);
    } catch (e) {
      console.warn('[SynergyHighwayVisuals] Halo removal failed:', e.message);
    }
  }
  
  /**
   * Update mesh from highway data
   */
  function updateHighwayMesh(mesh, highway) {
    if (!mesh || !mesh.material || !highway) return;
    
    try {
      // Update shader uniforms
      if (mesh.material.uniforms) {
        const isCascadeHighway = highway.type === 'cascade';
        const baseSpeed = Number.isFinite(highway?.visuals?.speed) ? highway.visuals.speed : 1.0;
        const cascadeSpeed = isCascadeHighway ? baseSpeed * 2.0 : baseSpeed;
        const cascadeOpacityMult = isCascadeHighway ? 1.2 : 1.0;
        const trendWeight = highway.trend === 'rising' ? 0.35 : highway.trend === 'falling' ? 0.1 : 0.2;
        mesh.material.uniforms.color.value = new (THREE.Color || function() {})(highway.visuals.color);
        mesh.material.uniforms.intensity.value = highway.visuals.intensity;
        mesh.material.uniforms.flowSpeed.value = cascadeSpeed;
        mesh.material.uniforms.opacityMult.value = config.opacityBase * cascadeOpacityMult;
        mesh.material.uniforms.trendStrength.value = trendWeight;
        mesh.material.uniforms.volatility.value = THREE.MathUtils.clamp(highway.volatility, 0, 1);
      }
      
      // Update material opacity/color
      if (mesh.material.opacity !== undefined) {
        const opacityMult = Number.isFinite(highway?.visuals?.opacityMult) ? highway.visuals.opacityMult : (highway.type === 'cascade' ? 1.2 : 1.0);
        mesh.material.opacity = highway.visuals.intensity * config.opacityBase * opacityMult;
      }
      if (mesh.material.color) {
        mesh.material.color.setHex(highway.visuals.color);
      }
      
      mesh.userData.highwayData = highway;
    } catch (e) {
      console.warn('[SynergyHighwayVisuals] Mesh update failed:', e.message);
    }
  }
  
  /**
   * Remove highway mesh and cleanup
   */
  function removeHighwayMesh(highwayId) {
    const mesh = highwayMeshes.get(highwayId);
    if (!mesh) return;
    
    try {
      if (group) {
        group.remove(mesh);
      }
      
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      
      highwayMeshes.delete(highwayId);
      highwayData.delete(highwayId);
      removeHighwayHalo(highwayId);
    } catch (e) {
      console.warn('[SynergyHighwayVisuals] Mesh removal failed:', e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CHROMATIC TRAILS — Particles flowing along highway curves
  //   with color gradients from source → target category
  // ═══════════════════════════════════════════════════════════════

  function initChromaticTrails() {
    if (trailPointsMesh) return;  // Already initialized

    trailGeometry = new (THREE.BufferGeometry || function() {})();
    const positions = new Float32Array(config.trailMaxParticles * 3);
    const colors = new Float32Array(config.trailMaxParticles * 3);
    trailGeometry.setAttribute('position', new (THREE.BufferAttribute || function() {})(positions, 3));
    trailGeometry.setAttribute('color', new (THREE.BufferAttribute || function() {})(colors, 3));

    trailMaterial = new (THREE.PointsMaterial || function() {})({
      size: config.trailParticleSize,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      sizeAttenuation: true,
      opacity: 0.8,
      fog: false,
    });

    trailPointsMesh = new (THREE.Points || function() {})(trailGeometry, trailMaterial);
    trailPointsMesh.frustumCulled = false;
    trailPointsMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND') + 1;

    if (group) {
      group.add(trailPointsMesh);
    }
  }

  function spawnTrailParticles() {
    if (!config.enableChromaticTrails || !trailGeometry) return;

    for (const highway of highways) {
      // Only spawn on synergy highways (not cascade overlays)
      if (highway.type === 'cascade') continue;
      if (highway.avgSynergy < 0.2) continue;

      const timer = trailSpawnTimers.get(highway.id) || 0;
      const spawnInterval = config.trailSpawnInterval / (0.5 + highway.avgSynergy);
      if (elapsedTime - timer < spawnInterval) continue;

      trailSpawnTimers.set(highway.id, elapsedTime);

      // Recreate curve for this highway
      const startPos = getCategoryPosition(highway.fromCategory);
      const endPos = getCategoryPosition(highway.toCategory);
      const curve = createCurvePath(startPos, endPos);
      if (!curve) continue;

      // Category colors for chromatic gradient
      const sourceColor = categoryColors[highway.fromCategory] || new (THREE.Color || function() {})(0x00ddff);
      const targetColor = categoryColors[highway.toCategory] || new (THREE.Color || function() {})(0xff00ff);

      // Spawn 1–2 particles depending on synergy strength
      const count = 1 + (highway.avgSynergy > 0.6 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        if (trailParticles.length >= config.trailMaxParticles) break;

        const progress = 0.1 + Math.random() * 0.8;
        const point = curve.getPoint(progress);
        const tangent = curve.getTangent(progress).normalize();

        // Color interpolated along progress
        const cr = sourceColor.r + (targetColor.r - sourceColor.r) * progress;
        const cg = sourceColor.g + (targetColor.g - sourceColor.g) * progress;
        const cb = sourceColor.b + (targetColor.b - sourceColor.b) * progress;

        trailParticles.push({
          x: point.x, y: point.y, z: point.z,
          vx: tangent.x * config.trailSpeed * (0.8 + Math.random() * 0.4),
          vy: tangent.y * config.trailSpeed * (0.8 + Math.random() * 0.4),
          vz: tangent.z * config.trailSpeed * (0.8 + Math.random() * 0.4),
          age: 0,
          life: config.trailLifetime * (0.7 + Math.random() * 0.6),
          cr, cg, cb,
        });
      }
    }
  }

  function updateChromaticTrails(deltaTime) {
    if (!config.enableChromaticTrails || !trailGeometry) return;

    // Spawn new particles
    spawnTrailParticles();

    // Update existing particles
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.age += deltaTime;
      if (p.age >= p.life) {
        trailParticles.splice(i, 1);
        continue;
      }
      // Move along tangent velocity
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.z += p.vz * deltaTime;
    }

    // Write to GPU buffer
    const posAttr = trailGeometry.attributes.position;
    const colAttr = trailGeometry.attributes.color;
    const count = Math.min(trailParticles.length, config.trailMaxParticles);

    for (let i = 0; i < config.trailMaxParticles; i++) {
      if (i < count) {
        const p = trailParticles[i];
        const fade = 1.0 - (p.age / p.life);
        posAttr.array[i * 3]     = p.x;
        posAttr.array[i * 3 + 1] = p.y;
        posAttr.array[i * 3 + 2] = p.z;
        colAttr.array[i * 3]     = p.cr * fade;
        colAttr.array[i * 3 + 1] = p.cg * fade;
        colAttr.array[i * 3 + 2] = p.cb * fade;
      } else {
        // Hide unused slots
        posAttr.array[i * 3]     = 0;
        posAttr.array[i * 3 + 1] = 0;
        posAttr.array[i * 3 + 2] = 0;
        colAttr.array[i * 3]     = 0;
        colAttr.array[i * 3 + 1] = 0;
        colAttr.array[i * 3 + 2] = 0;
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    trailGeometry.setDrawRange(0, count);
  }

  function disposeChromaticTrails() {
    trailParticles.length = 0;
    trailSpawnTimers.clear();
    if (trailPointsMesh) {
      if (group) group.remove(trailPointsMesh);
      if (trailGeometry) trailGeometry.dispose();
      if (trailMaterial) trailMaterial.dispose();
      trailPointsMesh = null;
      trailGeometry = null;
      trailMaterial = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CLUSTER FIELDS — Soft auras around category clusters
  //   driven by aggregate synergy of connected highways
  // ═══════════════════════════════════════════════════════════════

  function updateClusterFields() {
    if (!config.enableClusterFields || !group) return;

    // Compute per-category aggregate synergy from all highways
    const categorySynergy = new Map();  // category → { total, count, max }
    for (const highway of highways) {
      if (highway.type === 'cascade') continue;
      for (const cat of [highway.fromCategory, highway.toCategory]) {
        if (!categorySynergy.has(cat)) {
          categorySynergy.set(cat, { total: 0, count: 0, max: 0 });
        }
        const d = categorySynergy.get(cat);
        d.total += highway.avgSynergy;
        d.count++;
        d.max = Math.max(d.max, highway.maxSynergy);
      }
    }

    // Remove fields for categories that no longer have highways
    for (const [category, fieldData] of clusterFieldMeshes) {
      const d = categorySynergy.get(category);
      if (!d || d.count === 0) {
        group.remove(fieldData.mesh);
        fieldData.mesh.geometry.dispose();
        fieldData.material.dispose();
        clusterFieldMeshes.delete(category);
      }
    }

    // Create or update fields
    for (const [category, d] of categorySynergy) {
      const avgSynergy = d.total / d.count;

      if (avgSynergy < config.clusterFieldMinSynergy) {
        // Below threshold — remove if it exists
        if (clusterFieldMeshes.has(category)) {
          const fd = clusterFieldMeshes.get(category);
          group.remove(fd.mesh);
          fd.mesh.geometry.dispose();
          fd.material.dispose();
          clusterFieldMeshes.delete(category);
        }
        continue;
      }

      const pos = getCategoryPosition(category);
      const radius = config.clusterFieldBaseRadius * (0.5 + avgSynergy * 1.5);

      // Color by synergy level (positive / neutral / low)
      let color;
      if (avgSynergy >= 0.75)      color = new (THREE.Color || function() {})(0x4BFFC3);
      else if (avgSynergy >= 0.45) color = new (THREE.Color || function() {})(0xC09CFF);
      else                         color = new (THREE.Color || function() {})(0x3d9f92);

      if (clusterFieldMeshes.has(category)) {
        // Update existing field
        const fd = clusterFieldMeshes.get(category);
        fd.mesh.position.copy(pos);
        fd.mesh.scale.set(radius, radius, radius);
        fd.material.color.copy(color);
        fd.material.opacity = config.clusterFieldOpacity * (0.5 + avgSynergy);
        fd.avgSynergy = avgSynergy;
      } else {
        // Create new field
        const geometry = new (THREE.SphereGeometry || function() {})(1, 16, 12);
        const material = new (THREE.MeshBasicMaterial || function() {})({
          color,
          transparent: true,
          opacity: config.clusterFieldOpacity * (0.5 + avgSynergy),
          wireframe: config.clusterFieldWireframe,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          fog: false,
        });
        const mesh = new (THREE.Mesh || function() {})(geometry, material);
        mesh.position.copy(pos);
        mesh.scale.set(radius, radius, radius);
        mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND') - 1;
        group.add(mesh);
        clusterFieldMeshes.set(category, { mesh, material, avgSynergy });
      }
    }
  }

  function animateClusterFields() {
    if (!config.enableClusterFields) return;
    for (const [, fieldData] of clusterFieldMeshes) {
      const breathScale = 1.0 + Math.sin(elapsedTime * config.clusterFieldBreathSpeed * Math.PI * 2)
        * config.clusterFieldBreathAmount;
      const baseRadius = config.clusterFieldBaseRadius * (0.5 + fieldData.avgSynergy * 1.5);
      fieldData.mesh.scale.set(
        baseRadius * breathScale,
        baseRadius * breathScale,
        baseRadius * breathScale
      );
    }
  }

  function disposeClusterFields() {
    for (const [, fieldData] of clusterFieldMeshes) {
      if (group) group.remove(fieldData.mesh);
      fieldData.mesh.geometry.dispose();
      fieldData.material.dispose();
    }
    clusterFieldMeshes.clear();
  }

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════
  
  return {
    /**
     * Initialize visuals system
     * @param {THREE.Scene} sceneRef - Three.js scene
     * @param {THREE.Camera} cameraRef - Three.js camera
     * @param {THREE.Renderer} rendererRef - Three.js renderer
    * @param {Object} highwaysEngine - Linking system or compatible highway source
     * @param {Object|Array} nodesRef - Optional AI nodes for dynamic anchors
     */
    init(sceneRef, cameraRef, rendererRef, highwaysEngine, nodesRef = null) {
      scene = sceneRef;
      camera = cameraRef;
      renderer = rendererRef;
      synergyHighwaysEngine = highwaysEngine;
      linkingSystem = highwaysEngine?.links ? highwaysEngine : (highwaysEngine?.linkingSystem ?? null);
      historyTracker = highwaysEngine?.historyTracker ?? highwaysEngine?.linkHistoryTracker ?? null;
      aiNodes = nodesRef;

      if (!scene) {
        console.error('[SynergyHighwayVisuals] Scene required');
        return false;
      }

      // Create or rebind the group for all highway meshes
      if (!group) {
        group = new (THREE?.Group || function() {})();
        group.name = 'SynergyHighways';
        group.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND');
      }

      if (scene && group && group.parent !== scene) {
        scene.add(group);
      }

      if (group) {
        group.visible = enabled;
      }

      // Initial anchor computation if nodes provided
      if (aiNodes) {
        updateCategoryAnchorsFromNodes();
      }

      rebuildHighways();

      // Initialize sub-systems
      initChromaticTrails();
      updateClusterFields();

      console.log('[SynergyHighwayVisuals] Initialized');
      return true;
    },

    /**
     * Set nodes reference for dynamic category anchor computation
     */
    setNodes(nodesRef) {
      aiNodes = nodesRef;
      // Immediately compute anchors
      updateCategoryAnchorsFromNodes();
      if (debugEnabled) {
        console.log('[SynergyHighwayVisuals] Nodes reference set, anchors computed');
      }
    },

    /**
     * Update visuals (call every frame)
     */
    update(deltaTime) {
      if (!enabled || !group) return;

      elapsedTime += deltaTime * config.animationSpeed;

      // Periodically update category anchors from node positions
      _anchorsLastUpdate += deltaTime;
      if (_anchorsLastUpdate >= _anchorUpdateInterval) {
        _anchorsLastUpdate = 0;
        updateCategoryAnchorsFromNodes();
      }

      // Update all highway mesh shader times
      for (const mesh of highwayMeshes.values()) {
        if (mesh.material && mesh.material.uniforms) {
          mesh.material.uniforms.time.value = elapsedTime;
        }
      }

      // Chromatic trail particles
      updateChromaticTrails(deltaTime);

      // Cluster field breathing animation
      animateClusterFields();
    },
    
    /**
    * Refresh meshes from highway data
    * Call when aggregated highway data changes
     */
    refreshFromHighways() {
      if (!enabled || !group) return;

      if (!cacheValid) {
        rebuildHighways();
      }
      
      try {
        const highwayList = highways;
        if (!highwayList || highwayList.length === 0) {
          // Clear all visuals if no highways
          for (const highwayId of highwayMeshes.keys()) {
            removeHighwayMesh(highwayId);
          }
            for (const highwayId of Array.from(highwayHaloMeshes.keys())) {
              removeHighwayHalo(highwayId);
            }
          return;
        }
        
        // Track which highways should exist
        const currentIds = new Set(highwayList.map(hw => hw.id));
        
        // Remove highways that no longer exist
        for (const highwayId of highwayMeshes.keys()) {
          if (!currentIds.has(highwayId)) {
            removeHighwayMesh(highwayId);
          }
        }
        
        // Create or update highways
        for (const highway of highwayList) {
          if (!highway.id) continue;
          
          if (highwayMeshes.has(highway.id)) {
            // Update existing
            const mesh = highwayMeshes.get(highway.id);
            updateHighwayMesh(mesh, highway);
          } else {
            // Create new
            const mesh = createHighwayMesh(highway);
            if (mesh) {
              mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_BACKGROUND');
              group.add(mesh);
              highwayMeshes.set(highway.id, mesh);
              highwayData.set(highway.id, highway);
            }
          }

          if (config.enableHaloEffect && highway.visuals.bloomActive) {
            removeHighwayHalo(highway.id);
            const startPos = getCategoryPosition(highway.fromCategory);
            const endPos = getCategoryPosition(highway.toCategory);
            const halo = createBloomHalo(highway, startPos, endPos);
            if (halo) {
              group.add(halo);
              highwayHaloMeshes.set(highway.id, halo);
            }
          } else {
            removeHighwayHalo(highway.id);
          }
        }

        // Update cluster fields to reflect current highway state
        updateClusterFields();
      } catch (e) {
        console.warn('[SynergyHighwayVisuals] Refresh failed:', e.message);
      }
    },
    
    /**
     * Force rebuild all visuals
     */
    rebuild() {
      rebuildHighways();
      // Clear all
      for (const highwayId of Array.from(highwayMeshes.keys())) {
        removeHighwayMesh(highwayId);
      }
      
      // Recreate
      this.refreshFromHighways();
    },

    /**
     * Schedule rebuild of highway data
     */
    scheduleRebuild() {
      scheduleRebuild();
    },

    /**
     * Update highway data from the linked graph
     */
    updateVisuals() {
      updateHighwayData();
    },
    
    /**
     * Enable/disable rendering
     */
    setEnabled(flag) {
      enabled = !!flag;
      if (group) {
        group.visible = enabled;
      }
    },
    
    /**
     * Configure settings
     */
    setConfig(options) {
      Object.assign(config, options);
    },
    
    /**
     * Get current config
     */
    getConfig() {
      return { ...config };
    },

    /**
     * Get all computed highways
     */
    getHighways() {
      return [...highways];
    },

    /**
     * Get a specific highway by category pair
     */
    getHighway(fromCat, toCat) {
      return highwayMap.get(getHighwayId(fromCat, toCat)) || null;
    },
    
    /**
     * Get highway mesh count
     */
    getHighwayCount() {
      return highways.length;
    },

    /**
     * Get summary stats for the aggregated highways
     */
    getStats() {
      if (highways.length === 0) {
        return {
          highwayCount: 0,
          totalLinks: 0,
          avgSynergy: 0,
          maxSynergy: 0,
          trends: {}
        };
      }

      const totalLinks = highways.reduce((sum, highway) => sum + highway.linkCount, 0);
      const avgSynergy = highways.reduce((sum, highway) => sum + highway.avgSynergy, 0) / highways.length;
      const maxSynergy = Math.max(...highways.map(highway => highway.maxSynergy));
      const trends = {};

      for (const highway of highways) {
        trends[highway.trend] = (trends[highway.trend] || 0) + 1;
      }

      return {
        highwayCount: highways.length,
        totalLinks,
        avgSynergy,
        maxSynergy,
        trends
      };
    },

    /**
     * Get highways sorted by average synergy
     */
    getTopHighways(count = 5) {
      return [...highways]
        .sort((a, b) => b.avgSynergy - a.avgSynergy)
        .slice(0, count);
    },

    /**
     * Get highways filtered by trend
     */
    getHighwaysByTrend(trend) {
      return highways.filter(highway => highway.trend === trend);
    },

    /**
     * Check whether highway cache is valid
     */
    isCacheValid() {
      return cacheValid;
    },

    /**
     * Clear all computed highways
     */
    clear() {
      highways.length = 0;
      highwayMap.clear();
      cacheValid = false;
    },

    /**
     * Notify the system that a link changed
     */
    updateOnLinkChange() {
      cacheValid = false;
      scheduleRebuild();
    },
    
    /**
     * Get mesh for specific highway
     */
    getHighwayMesh(highwayId) {
      return highwayMeshes.get(highwayId) || null;
    },
    
    /**
     * Set category anchor position (for manual positioning)
     */
    setCategoryPosition(category, position) {
      if (position && position.x !== undefined && position.y !== undefined) {
        categoryAnchors[category] = position;
      }
    },
    
    /**
     * Debug: Print top routes
     */
    debugPrintTopRoutes() {
      if (highways.length === 0) {
        console.log('SynergyHighwaysEngine not initialized');
        return;
      }
      
      const top = this.getTopHighways(5);
      console.log('═══ Top 5 Synergy Highways ═══');
      top.forEach((hw, i) => {
        const quality = (hw.avgSynergy * 100).toFixed(0);
        const meshes = highwayMeshes.has(hw.id) ? '✓' : '✗';
        console.log(`${i+1}. ${hw.id} [${meshes}] ${hw.linkCount} links, ${quality}% quality`);
      });
    },
    
    /**
     * Debug: Print visual stats
     */
    debugPrintStats() {
      const stats = this.getStats();
      console.log('═══ Highway Visuals Stats ═══');
      console.log(`Highways: ${this.getHighwayCount()}`);
      console.log(`Total routes: ${stats.highwayCount || 0}`);
      console.log(`Enabled: ${enabled}`);
      console.log(`Computed anchors: ${computedAnchors.size}`);
      console.log(`Config:`, config);
    },

    /**
     * Debug: Print category anchor positions
     */
    debugPrintAnchors() {
      console.log('═══ Category Anchors ═══');
      if (computedAnchors.size === 0) {
        console.log('No computed anchors yet (using static fallbacks)');
      }
      for (const [category, pos] of computedAnchors) {
        console.log(`  ${category}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
      }
      console.log('Static fallbacks:');
      for (const [category, pos] of Object.entries(categoryAnchors)) {
        if (!computedAnchors.has(category)) {
          console.log(`  ${category}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}) [STATIC]`);
        }
      }
    },

    /**
     * Force immediate recomputation of category anchors
     */
    forceUpdateAnchors() {
      updateCategoryAnchorsFromNodes();
      console.log(`[SynergyHighwayVisuals] Forced anchor update: ${computedAnchors.size} categories`);
    },
    
    /**
     * Enable/disable debug logging
     */
    setDebug(flag) {
      debugEnabled = !!flag;
    },
    
    /**
     * Clean up and dispose
     */
    dispose() {
      // Dispose sub-systems first
      disposeChromaticTrails();
      disposeClusterFields();

      for (const highwayId of Array.from(highwayMeshes.keys())) {
        removeHighwayMesh(highwayId);
      }
      
      if (group && scene) {
        scene.remove(group);
      }
      
      highwayMeshes.clear();
      highwayData.clear();
      for (const highwayId of Array.from(highwayHaloMeshes.keys())) {
        removeHighwayHalo(highwayId);
      }
      highways.length = 0;
      highwayMap.clear();
      cacheValid = false;
      rebuildScheduled = false;
      lastRebuildTime = 0;
      group = null;
      scene = null;
      camera = null;
      renderer = null;
      synergyHighwaysEngine = null;
      linkingSystem = null;
      historyTracker = null;
      aiNodes = null;
    }
  };
})();

if (typeof window !== 'undefined') {
  window.SynergyHighwayVisuals3D_1_0 = window.SynergyHighwayVisuals3D_1_0 ?? SynergyHighwayVisuals3D_1_0;
}

export { SynergyHighwayVisuals3D_1_0 };
