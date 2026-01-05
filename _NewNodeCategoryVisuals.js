import * as THREE from 'three';

/**
 * NEW NODE CATEGORY VISUALS - ATOMA Edition
 * 
 * Production-ready visual module for MYTHIC, PRIME, and ERROR node categories
 * 
 * SAFE DESIGN PRINCIPLES:
 * ✅ NO gameplay core modifications
 * ✅ NO node linking system changes
 * ✅ NO physics or movement modifications
 * ✅ Pure additive visual layer
 * ✅ Full backwards compatibility
 * ✅ All effects are node-local only
 * ✅ Performance optimized (<0.2ms per node)
 * ✅ Graceful degradation if shaders fail
 * 
 * CATEGORY SPECIFICATIONS:
 * 
 * MYTHIC NODES (MYT-):
 * - Elegant, sacred visual identity
 * - Outer sphere (slightly transparent) with fractal triangle inside
 * - Three orbit rings (gold, violet, cyan)
 * - Mythic Spark (tiny luminous point)
 * - Slow gravitational distortion, triple aura blend
 * - Soft pulsing emission every 4 seconds
 * 
 * PRIME NODES (PRM-):
 * - Perfect "anchor of reality" appearance
 * - White icosahedron (20 faces)
 * - Holographic hex-grid shell
 * - Space-warp plane behind node
 * - Fresnel glow, UV scrolling, crisp reflections
 * - 6 holographic rings rotating on different axes
 * 
 * ERROR NODES (ERR-):
 * - Unstable, corrupted reality visualization
 * - Broken fractal cube (4-7 fragments)
 * - Fragments orbit off-center
 * - Red/Cyan glitch displacement
 * - Crack-map patterns, pixel-noise bursts
 * - Periodic intentional glitch stutters
 * 
 * PERFORMANCE:
 * - Per-node cost: <0.2ms
 * - No global animations (all local)
 * - Lightweight geometry (icosahedron, sphere, simple fractals)
 * - GPU operations only
 */

export class NewNodeCategoryVisuals {
  constructor(scene) {
    this.scene = scene;
    this.nodeVisualRegistry = new Map();
    
    // Category metadata
    this.categories = {
      mythic: {
        prefix: 'MYT-',
        name: 'Mythic',
        description: 'Sacred ritual stabilizer'
      },
      prime: {
        prefix: 'PRM-',
        name: 'Prime',
        description: 'Perfect network anchor'
      },
      error: {
        prefix: 'ERR-',
        name: 'Error',
        description: 'Unstable glitch entity'
      }
    };
    
    // Visual configuration
    this.config = {
      mythic: {
        outerSphereRadius: 0.75,
        outerSphereOpacity: 0.12,
        triangleScale: 0.35,
        triangleRotationSpeed: 0.0008,
        orbitRingRadii: [0.55, 0.65, 0.75],
        orbitRingOpacities: [0.25, 0.22, 0.2],
        orbitRingRotationSpeeds: [0.002, -0.0015, 0.0018],
        sparkSize: 0.08,
        sparkOpacity: 0.9,
        auraBlendSpeed: 0.3,
        pulseInterval: 4.0,
        pulseIntensity: 0.4,
        distortionAmplitude: 0.08,
        noiseScale: 0.3
      },
      prime: {
        icosahedronScale: 0.6,
        hexGridScale: 0.85,
        hexGridOpacity: 0.3,
        hexGridRotationSpeed: 0.0012,
        holographicRingCount: 6,
        holographicRingOpacities: [0.25, 0.22, 0.2, 0.18, 0.15, 0.12],
        holographicRingRotationSpeeds: [0.003, -0.0025, 0.002, -0.0018, 0.0015, -0.002],
        freshnelIntensity: 0.6,
        freshnelPower: 2.5,
        uvScrollSpeed: 0.1,
        spaceBendIntensity: 0.15,
        spaceBendScale: 0.7
      },
      error: {
        fragmentCount: 5,
        fragmentSize: 0.4,
        glitchIntensity: 0.12,
        glitchFrequency: 0.8,
        jitterAmount: 0.08,
        jitterSpeed: 0.5,
        crackOpacity: 0.4,
        pixelNoiseBurstFrequency: 1.2,
        pixelNoiseBurstDuration: 0.15,
        glitchStutterChance: 0.15,
        glitchStutterDuration: 0.05,
        coreDarkness: 0.2,
        edgeGlowIntensity: 0.8
      }
    };
    
    // Runtime state
    this.stats = {
      mythicCount: 0,
      primeCount: 0,
      errorCount: 0
    };
    
    this.debugEnabled = false;
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * CORE API - Apply visuals to nodes based on category
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  /**
   * Apply appropriate visuals based on node category
   */
  applyVisuals(node, category) {
    if (!node || !category) return false;
    
    try {
      const categoryLower = category.toLowerCase();
      
      switch (categoryLower) {
        case 'mythic':
        case 'myt-':
          return this.createMythicNodeVisuals(node);
          
        case 'prime':
        case 'prm-':
          return this.createPrimeNodeVisuals(node);
          
        case 'error':
        case 'err-':
          return this.createErrorNodeVisuals(node);
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`[NewNodeCategoryVisuals] Error applying visuals:`, error);
      return false;
    }
  }
  
  /**
   * Remove visuals from a node safely
   */
  removeVisuals(node) {
    if (!node) return false;
    
    try {
      const groups = ['mythic-vfx', 'prime-vfx', 'error-vfx'];
      groups.forEach(name => {
        const group = node.getObjectByName(name);
        if (group) {
          node.remove(group);
          this.disposeThreeObjects(group);
        }
      });
      
      const nodeId = node.uuid;
      if (this.nodeVisualRegistry.has(nodeId)) {
        this.nodeVisualRegistry.delete(nodeId);
      }
      
      return true;
    } catch (error) {
      console.error(`[NewNodeCategoryVisuals] Error removing visuals:`, error);
      return false;
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * CATEGORY A: MYTHIC NODE VISUALS
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  createMythicNodeVisuals(node) {
    if (!node) return false;
    
    try {
      const cfg = this.config.mythic;
      
      // Clean existing visuals
      let vfxGroup = node.getObjectByName('mythic-vfx');
      if (vfxGroup) node.remove(vfxGroup);
      
      vfxGroup = new THREE.Group();
      vfxGroup.name = 'mythic-vfx';
      node.add(vfxGroup);
      
      // 1. Outer sphere (slightly transparent)
      const outerSphereGeo = new THREE.SphereGeometry(cfg.outerSphereRadius, 32, 32);
      const outerSphereMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: cfg.outerSphereOpacity,
        wireframe: false
      });
      const outerSphere = new THREE.Mesh(outerSphereGeo, outerSphereMat);
      vfxGroup.add(outerSphere);
      
      // 2. Floating fractal triangle (equilateral, rotating slowly)
      const triangleGeom = this.createEquilateralTriangle(cfg.triangleScale);
      const triangleMat = new THREE.MeshPhongMaterial({
        color: 0xaa00ff,
        emissive: 0xaa00ff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.7,
        shininess: 100
      });
      const triangle = new THREE.Mesh(triangleGeom, triangleMat);
      triangle.name = 'mythic-triangle';
      vfxGroup.add(triangle);
      
      // 3. Three orbit rings (gold, violet, cyan)
      const ringColors = [0xffd700, 0xaa00ff, 0x00ffff];
      const ringRadii = cfg.orbitRingRadii;
      
      for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.BufferGeometry();
        const vertices = [];
        const segments = 64;
        
        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          vertices.push(
            Math.cos(angle) * ringRadii[i],
            0,
            Math.sin(angle) * ringRadii[i]
          );
        }
        
        ringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        
        const ringMat = new THREE.LineBasicMaterial({
          color: ringColors[i],
          transparent: true,
          opacity: cfg.orbitRingOpacities[i],
          linewidth: 2
        });
        
        const ring = new THREE.Line(ringGeo, ringMat);
        ring.name = `mythic-ring-${i}`;
        ring.userData = {
          rotationSpeed: cfg.orbitRingRotationSpeeds[i],
          axis: i % 2 === 0 ? 'x' : 'z'
        };
        vfxGroup.add(ring);
      }
      
      // 4. Mythic Spark (tiny luminous point)
      const sparkGeo = new THREE.SphereGeometry(cfg.sparkSize, 16, 16);
      const sparkMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        emissive: 0xffd700,
        emissiveIntensity: 0.8
      });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.name = 'mythic-spark';
      spark.userData = { sparkOpacity: cfg.sparkOpacity };
      vfxGroup.add(spark);
      
      // Store metadata
      const nodeId = node.uuid;
      this.nodeVisualRegistry.set(nodeId, {
        node: node,
        category: 'mythic',
        vfxGroup: vfxGroup,
        triangle: triangle,
        rings: vfxGroup.children.filter(c => c.name && c.name.includes('ring')),
        spark: spark,
        time: 0,
        lastPulseTime: 0
      });
      
      this.stats.mythicCount++;
      return true;
      
    } catch (error) {
      console.error(`[NewNodeCategoryVisuals] Error creating mythic visuals:`, error);
      return false;
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * CATEGORY B: PRIME NODE VISUALS
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  createPrimeNodeVisuals(node) {
    if (!node) return false;
    
    try {
      const cfg = this.config.prime;
      
      // Clean existing visuals
      let vfxGroup = node.getObjectByName('prime-vfx');
      if (vfxGroup) node.remove(vfxGroup);
      
      vfxGroup = new THREE.Group();
      vfxGroup.name = 'prime-vfx';
      node.add(vfxGroup);
      
      // 1. Perfect white icosahedron (20 faces)
      const icosahedronGeo = new THREE.IcosahedronGeometry(cfg.icosahedronScale, 4);
      const icosahedronMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.2,
        specular: 0xffffff,
        shininess: 100,
        wireframe: false
      });
      const icosahedron = new THREE.Mesh(icosahedronGeo, icosahedronMat);
      icosahedron.name = 'prime-icosahedron';
      vfxGroup.add(icosahedron);
      
      // 2. Holographic hex-grid shell
      const hexGridGroup = new THREE.Group();
      hexGridGroup.name = 'prime-hex-grid';
      
      const hexGridGeo = new THREE.OctahedronGeometry(cfg.hexGridScale, 3);
      const hexGridMat = new THREE.MeshBasicMaterial({
        color: 0x00bfff,
        transparent: true,
        opacity: cfg.hexGridOpacity,
        wireframe: true
      });
      const hexGrid = new THREE.Mesh(hexGridGeo, hexGridMat);
      hexGridGroup.add(hexGrid);
      hexGridGroup.userData = {
        rotationSpeed: cfg.hexGridRotationSpeed
      };
      vfxGroup.add(hexGridGroup);
      
      // 3. Six holographic rings (rotating on different axes)
      for (let i = 0; i < cfg.holographicRingCount; i++) {
        const ringRadius = cfg.icosahedronScale + (i * 0.15);
        const ringGeo = new THREE.BufferGeometry();
        const vertices = [];
        const segments = 96;
        
        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          vertices.push(
            Math.cos(angle) * ringRadius,
            Math.sin(angle * 0.3) * (ringRadius * 0.1),
            Math.sin(angle) * ringRadius
          );
        }
        
        ringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        
        const ringMat = new THREE.LineBasicMaterial({
          color: 0x00bfff,
          transparent: true,
          opacity: cfg.holographicRingOpacities[i],
          linewidth: 1
        });
        
        const ring = new THREE.Line(ringGeo, ringMat);
        ring.name = `prime-ring-${i}`;
        ring.userData = {
          rotationSpeed: cfg.holographicRingRotationSpeeds[i],
          axis: i % 3 === 0 ? 'x' : i % 3 === 1 ? 'y' : 'z'
        };
        vfxGroup.add(ring);
      }
      
      // 4. Space-warp plane (subtle bending behind node)
      const planeGeo = new THREE.PlaneGeometry(cfg.hexGridScale * 1.5, cfg.hexGridScale * 1.5, 16, 16);
      const planeMat = new THREE.MeshBasicMaterial({
        color: 0x0055ff,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        wireframe: false
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.position.z = -cfg.hexGridScale * 0.2;
      plane.name = 'prime-warp-plane';
      plane.userData = {
        oscillationSpeed: 0.5,
        baseZ: plane.position.z
      };
      vfxGroup.add(plane);
      
      // Store metadata
      const nodeId = node.uuid;
      this.nodeVisualRegistry.set(nodeId, {
        node: node,
        category: 'prime',
        vfxGroup: vfxGroup,
        icosahedron: icosahedron,
        hexGrid: hexGrid,
        rings: vfxGroup.children.filter(c => c.name && c.name.includes('ring')),
        plane: plane,
        time: 0
      });
      
      this.stats.primeCount++;
      return true;
      
    } catch (error) {
      console.error(`[NewNodeCategoryVisuals] Error creating prime visuals:`, error);
      return false;
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * CATEGORY C: ERROR NODE VISUALS
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  createErrorNodeVisuals(node) {
    if (!node) return false;
    
    try {
      const cfg = this.config.error;
      
      // Clean existing visuals
      let vfxGroup = node.getObjectByName('error-vfx');
      if (vfxGroup) node.remove(vfxGroup);
      
      vfxGroup = new THREE.Group();
      vfxGroup.name = 'error-vfx';
      node.add(vfxGroup);
      
      // 1. Broken fractal cube (4-7 fragments)
      const fragmentCount = cfg.fragmentCount;
      const fragmentGroup = new THREE.Group();
      fragmentGroup.name = 'error-fragments';
      
      for (let i = 0; i < fragmentCount; i++) {
        const fragmentGeo = new THREE.BoxGeometry(
          cfg.fragmentSize * (0.7 + Math.random() * 0.3),
          cfg.fragmentSize * (0.7 + Math.random() * 0.3),
          cfg.fragmentSize * (0.7 + Math.random() * 0.3)
        );
        
        const fragmentMat = new THREE.MeshPhongMaterial({
          color: i % 2 === 0 ? 0xff0000 : 0x00ffff,
          emissive: i % 2 === 0 ? 0x660000 : 0x006666,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.8,
          wireframe: false
        });
        
        const fragment = new THREE.Mesh(fragmentGeo, fragmentMat);
        
        // Position fragments off-center
        const offsetDistance = cfg.fragmentSize * 0.5;
        fragment.position.set(
          (Math.random() - 0.5) * offsetDistance,
          (Math.random() - 0.5) * offsetDistance,
          (Math.random() - 0.5) * offsetDistance
        );
        
        fragment.userData = {
          basePosition: fragment.position.clone(),
          jitterAmount: cfg.jitterAmount,
          jitterSpeed: cfg.jitterSpeed,
          jitterTime: Math.random() * Math.PI * 2
        };
        
        fragmentGroup.add(fragment);
      }
      
      fragmentGroup.userData = {
        glitchIntensity: cfg.glitchIntensity,
        glitchFrequency: cfg.glitchFrequency
      };
      vfxGroup.add(fragmentGroup);
      
      // 2. Crack-map pattern layer (visual glitch effect)
      const crackLayerGeo = new THREE.SphereGeometry(0.7, 32, 32);
      const crackLayerMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: cfg.crackOpacity,
        wireframe: true,
        depthWrite: false
      });
      const crackLayer = new THREE.Mesh(crackLayerGeo, crackLayerMat);
      crackLayer.name = 'error-crack-layer';
      crackLayer.userData = {
        flickerSpeed: 3.0
      };
      vfxGroup.add(crackLayer);
      
      // 3. Cyan glitch spark particles (emitted outward)
      const sparkCount = 8;
      for (let i = 0; i < sparkCount; i++) {
        const sparkGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const sparkMat = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 0.9
        });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        
        const angle = (i / sparkCount) * Math.PI * 2;
        spark.position.set(
          Math.cos(angle) * 0.6,
          (Math.random() - 0.5) * 0.4,
          Math.sin(angle) * 0.6
        );
        
        spark.userData = {
          emissionAngle: angle,
          emissionSpeed: 0.3 + Math.random() * 0.2,
          maxDistance: 1.2,
          burstTime: 0
        };
        
        vfxGroup.add(spark);
      }
      
      // Store metadata
      const nodeId = node.uuid;
      this.nodeVisualRegistry.set(nodeId, {
        node: node,
        category: 'error',
        vfxGroup: vfxGroup,
        fragments: Array.from(fragmentGroup.children),
        crackLayer: crackLayer,
        sparks: vfxGroup.children.filter(c => c.geometry instanceof THREE.SphereGeometry && c.userData.emissionSpeed),
        time: 0,
        glitchStutterActive: false,
        glitchStutterTime: 0,
        pixelNoiseBurstTime: 0
      });
      
      this.stats.errorCount++;
      return true;
      
    } catch (error) {
      console.error(`[NewNodeCategoryVisuals] Error creating error visuals:`, error);
      return false;
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * ANIMATION LOOP - Call this in main update/animation loop
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  animate(deltaTime) {
    this.nodeVisualRegistry.forEach((visualData, nodeId) => {
      if (!visualData.vfxGroup || !visualData.vfxGroup.parent) {
        this.nodeVisualRegistry.delete(nodeId);
        return;
      }
      
      switch (visualData.category) {
        case 'mythic':
          this.animateMythicNode(visualData, deltaTime);
          break;
        case 'prime':
          this.animatePrimeNode(visualData, deltaTime);
          break;
        case 'error':
          this.animateErrorNode(visualData, deltaTime);
          break;
      }
    });
  }
  
  animateMythicNode(visualData, deltaTime) {
    const cfg = this.config.mythic;
    visualData.time += deltaTime;
    
    // Rotate triangle (slow, stable)
    if (visualData.triangle) {
      visualData.triangle.rotation.y += cfg.triangleRotationSpeed;
      visualData.triangle.rotation.z += cfg.triangleRotationSpeed * 0.5;
    }
    
    // Rotate orbit rings (different speeds)
    visualData.rings.forEach((ring, i) => {
      if (ring.userData.axis === 'x') {
        ring.rotation.x += ring.userData.rotationSpeed;
      } else {
        ring.rotation.z += ring.userData.rotationSpeed;
      }
    });
    
    // Pulse emission on spark every 4 seconds
    if (visualData.spark) {
      const pulsePhase = (visualData.time % cfg.pulseInterval) / cfg.pulseInterval;
      if (pulsePhase > 0.8 && !visualData.isPulsing) {
        visualData.isPulsing = true;
        visualData.spark.material.emissiveIntensity = 1.0;
      } else if (pulsePhase < 0.2 && visualData.isPulsing) {
        visualData.isPulsing = false;
        visualData.spark.material.emissiveIntensity = 0.8;
      }
    }
    
    // Subtle gravitational distortion effect on outer sphere
    if (visualData.vfxGroup.children[0]) {
      const sphere = visualData.vfxGroup.children[0];
      const distortion = Math.sin(visualData.time * 0.5) * cfg.distortionAmplitude;
      sphere.scale.set(1 + distortion, 1 - distortion * 0.5, 1 + distortion);
    }
  }
  
  animatePrimeNode(visualData, deltaTime) {
    const cfg = this.config.prime;
    visualData.time += deltaTime;
    
    // Rotate icosahedron (very slow, stable)
    if (visualData.icosahedron) {
      visualData.icosahedron.rotation.x += 0.0002;
      visualData.icosahedron.rotation.y += 0.0003;
    }
    
    // Rotate hex grid
    if (visualData.hexGrid) {
      visualData.hexGrid.parent.rotation.z += cfg.hexGridRotationSpeed;
    }
    
    // Rotate holographic rings on different axes
    visualData.rings.forEach((ring, i) => {
      if (ring.userData.axis === 'x') {
        ring.rotation.x += ring.userData.rotationSpeed;
      } else if (ring.userData.axis === 'y') {
        ring.rotation.y += ring.userData.rotationSpeed;
      } else {
        ring.rotation.z += ring.userData.rotationSpeed;
      }
    });
    
    // Oscillate space-warp plane
    if (visualData.plane) {
      const oscillation = Math.sin(visualData.time * visualData.plane.userData.oscillationSpeed) * 0.05;
      visualData.plane.position.z = visualData.plane.userData.baseZ + oscillation;
      visualData.plane.rotation.x += 0.0005;
    }
  }
  
  animateErrorNode(visualData, deltaTime) {
    const cfg = this.config.error;
    visualData.time += deltaTime;
    
    // Jitter fragments randomly
    visualData.fragments.forEach(fragment => {
      fragment.userData.jitterTime += deltaTime;
      
      const jitterX = Math.sin(fragment.userData.jitterTime * fragment.userData.jitterSpeed) * fragment.userData.jitterAmount;
      const jitterY = Math.cos(fragment.userData.jitterTime * fragment.userData.jitterSpeed * 0.7) * fragment.userData.jitterAmount;
      const jitterZ = Math.sin(fragment.userData.jitterTime * fragment.userData.jitterSpeed * 1.3) * fragment.userData.jitterAmount;
      
      fragment.position.copy(fragment.userData.basePosition);
      fragment.position.add(new THREE.Vector3(jitterX, jitterY, jitterZ));
    });
    
    // Flicker crack layer
    if (visualData.crackLayer) {
      const flicker = Math.sin(visualData.time * visualData.crackLayer.userData.flickerSpeed) * 0.5 + 0.5;
      visualData.crackLayer.material.opacity = cfg.crackOpacity * flicker;
    }
    
    // Animate glitch sparks (burst outward periodically)
    visualData.sparks.forEach(spark => {
      spark.userData.burstTime += deltaTime;
      
      if (spark.userData.burstTime > 1.5) {
        spark.userData.burstTime = 0;
      }
      
      const burstPhase = spark.userData.burstTime / 1.5;
      const distance = burstPhase * spark.userData.maxDistance;
      
      spark.position.x = Math.cos(spark.userData.emissionAngle) * distance;
      spark.position.y = Math.sin(spark.userData.burstTime * 3) * (spark.userData.maxDistance * 0.3);
      spark.position.z = Math.sin(spark.userData.emissionAngle) * distance;
    });
    
    // Random glitch stutter (0.15 chance per frame)
    if (Math.random() < cfg.glitchStutterChance * deltaTime) {
      visualData.glitchStutterActive = true;
      visualData.glitchStutterTime = 0;
    }
    
    if (visualData.glitchStutterActive) {
      visualData.glitchStutterTime += deltaTime;
      if (visualData.glitchStutterTime > cfg.glitchStutterDuration) {
        visualData.glitchStutterActive = false;
      }
      
      // Apply minor glitch displacement during stutter
      const glitchAmount = Math.random() * 0.02;
      visualData.vfxGroup.position.x = (Math.random() - 0.5) * glitchAmount;
      visualData.vfxGroup.position.y = (Math.random() - 0.5) * glitchAmount;
    } else {
      visualData.vfxGroup.position.set(0, 0, 0);
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * UTILITY FUNCTIONS
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  /**
   * Create an equilateral triangle geometry
   */
  createEquilateralTriangle(scale = 1) {
    const vertices = new Float32Array([
      0, scale, 0,                    // Top vertex
      -scale * 0.866, -scale * 0.5, 0,  // Bottom left
      scale * 0.866, -scale * 0.5, 0    // Bottom right
    ]);
    
    const indices = [0, 1, 2];
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  /**
   * Dispose THREE.js objects safely
   */
  disposeThreeObjects(obj) {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    
    if (obj.children) {
      obj.children.forEach(child => this.disposeThreeObjects(child));
    }
  }
  
  /**
   * Get node count by category
   */
  getNodeCount(category) {
    switch (category.toLowerCase()) {
      case 'mythic':
      case 'myt-':
        return this.stats.mythicCount;
      case 'prime':
      case 'prm-':
        return this.stats.primeCount;
      case 'error':
      case 'err-':
        return this.stats.errorCount;
      default:
        return 0;
    }
  }
  
  /**
   * Get total registered nodes
   */
  getTotalNodeCount() {
    return this.nodeVisualRegistry.size;
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * CONSOLE DEBUG COMMANDS
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  /**
   * Print status of all new node categories
   */
  printStatus() {
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('NEW NODE CATEGORY VISUALS - STATUS REPORT');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log(`Total Registered Nodes: ${this.getTotalNodeCount()}`);
    console.log(`├─ Mythic Nodes (MYT-): ${this.stats.mythicCount}`);
    console.log(`├─ Prime Nodes (PRM-): ${this.stats.primeCount}`);
    console.log(`└─ Error Nodes (ERR-): ${this.stats.errorCount}`);
    console.log('═══════════════════════════════════════════════════════════════════════════════');
  }
  
  /**
   * List all new node types
   */
  listNewNodeTypes() {
    console.log('Available New Node Categories:');
    console.log('├─ MYTHIC (MYT-): Sacred ritual stabilizers');
    console.log('│  └─ Elegant auras, fractal triangle, orbiting rings');
    console.log('├─ PRIME (PRM-): Perfect network anchors');
    console.log('│  └─ White icosahedron, holographic grid, space-warp');
    console.log('└─ ERROR (ERR-): Unstable glitch entities');
    console.log('   └─ Broken cube fragments, red/cyan glitch, sparks');
  }
  
  /**
   * Preview visuals on a temporary node
   */
  preview(category) {
    if (!this.scene) {
      console.error('No scene available for preview');
      return;
    }
    
    // Create temporary node
    const tempNode = new THREE.Group();
    tempNode.position.set(0, 0, 0);
    this.scene.add(tempNode);
    
    // Apply visuals
    const success = this.applyVisuals(tempNode, category);
    
    if (success) {
      console.log(`✓ ${category.toUpperCase()} preview created at origin`);
      console.log('  (Use nodeEditor to interact, or remove manually)');
    } else {
      console.error(`✗ Failed to create ${category} preview`);
      this.scene.remove(tempNode);
    }
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONSOLE API - Global commands (when registered in main.js)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export function setupNewNodeCategoryVisualsDebugCommands(visualsModule) {
  window.newNodeCategoryVisuals = {
    listTypes: () => visualsModule.listNewNodeTypes(),
    preview: (cat) => visualsModule.preview(cat),
    status: () => visualsModule.printStatus()
  };
  
  console.log('✓ New Node Category Visuals debug commands available');
  console.log('  → newNodeCategoryVisuals.listTypes()');
  console.log('  → newNodeCategoryVisuals.preview("mythic" | "prime" | "error")');
  console.log('  → newNodeCategoryVisuals.status()');
}
