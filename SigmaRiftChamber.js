import * as THREE from 'three';
import { CONFIG } from './config.js';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

/**
 * Sigma Rift Chamber - Boss-level arena
 * An ancient, sacred AI chamber built around a gigantic glowing Rift
 */
export class SigmaRiftChamber {
  constructor(scene, camera = null) {
    this.scene = scene;
    this.camera = camera;
    this.animatedObjects = [];
    this.chamberRadius = 60;
    this.chamberHeight = 50;
    this.riftHeight = 18;
    
    // Session 112+: Initialize map configuration and reference plane
    this.initializeMapConfig();
    this.initializeReferencePlane();
    
    this.createCeiling();
    this.createWalls();
    this.createFloor();
    this.createCentralRift();
    this.createFloatingMonoliths();
    this.createHolographicRings();
    this.createNeonPaths();
    this.createParticleDrift();
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('SigmaRiftChamber');
    console.log(
      `[MAP INIT] ${this.mapConfig.mapId} | theme: ${this.mapConfig.theme} | referencePlane: ${this.mapConfig.referencePlane}`
    );
  }
  
  /**
   * Initialize reference plane from map config
   */
  initializeReferencePlane() {
    try {
      this.referencePlane = initMapReferencePlane(
        this.scene,
        this.camera,
        this.mapConfig.referencePlane
      );
      
      console.log(
        `[REFERENCE PLANE] ${this.mapConfig.referencePlane} initialized for ${this.mapConfig.mapId}`
      );
    } catch (err) {
      console.warn(
        `[REFERENCE PLANE] Failed to initialize ${this.mapConfig.referencePlane}:`,
        err
      );
      this.referencePlane = null;
    }
  }
  
  createCeiling() {
    const starfieldGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];
    
    const constellationCount = 200;
    for (let i = 0; i < constellationCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.chamberRadius;
      const height = this.chamberHeight - Math.random() * 5;
      
      starPositions.push(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      
      const intensity = Math.random();
      starColors.push(
        0.2 + intensity * 0.3,
        0.8 + intensity * 0.2,
        0.3 + intensity * 0.4
      );
    }
    
    starfieldGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starfieldGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    
    const starfieldMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });
    
    this.starfield = new THREE.Points(starfieldGeometry, starfieldMaterial);
    this.scene.add(this.starfield);
    
    this.createSigmaRuneLights();
  }
  
  createSigmaRuneLights() {
    const runeCount = 6;
    
    for (let r = 0; r < runeCount; r++) {
      const baseAngle = (r / runeCount) * Math.PI * 2;
      const runeDistance = 35 + Math.random() * 10;
      const centerX = Math.cos(baseAngle) * runeDistance;
      const centerZ = Math.sin(baseAngle) * runeDistance;
      const centerY = this.chamberHeight - 3;
      
      const zigzagPoints = [
        new THREE.Vector3(centerX - 2, centerY, centerZ),
        new THREE.Vector3(centerX, centerY + 1, centerZ - 2),
        new THREE.Vector3(centerX + 2, centerY, centerZ),
        new THREE.Vector3(centerX, centerY - 1, centerZ + 2)
      ];
      
      for (let i = 0; i < zigzagPoints.length - 1; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          zigzagPoints[i],
          zigzagPoints[i + 1]
        ]);
        
        const material = new THREE.LineBasicMaterial({
          color: 0x00ff88,
          transparent: true,
          opacity: 0.3
        });
        
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        
        this.animatedObjects.push({
          object: line,
          type: 'sigmaRune',
          baseOpacity: 0.3,
          pulseSpeed: 0.8,
          phaseOffset: Math.random() * Math.PI * 2
        });
      }
    }
  }
  
  createWalls() {
    const wallSegments = 12;
    
    for (let i = 0; i < wallSegments; i++) {
      const angle1 = (i / wallSegments) * Math.PI * 2;
      const angle2 = ((i + 1) / wallSegments) * Math.PI * 2;
      
      const points = [
        new THREE.Vector3(Math.cos(angle1) * this.chamberRadius, 0, Math.sin(angle1) * this.chamberRadius),
        new THREE.Vector3(Math.cos(angle2) * this.chamberRadius, 0, Math.sin(angle2) * this.chamberRadius),
        new THREE.Vector3(Math.cos(angle2) * this.chamberRadius, this.chamberHeight, Math.sin(angle2) * this.chamberRadius),
        new THREE.Vector3(Math.cos(angle1) * this.chamberRadius, this.chamberHeight, Math.sin(angle1) * this.chamberRadius)
      ];
      
      const wallGeometry = new THREE.BufferGeometry();
      const positions = [];
      
      positions.push(...points[0].toArray());
      positions.push(...points[1].toArray());
      positions.push(...points[2].toArray());
      positions.push(...points[0].toArray());
      positions.push(...points[2].toArray());
      positions.push(...points[3].toArray());
      
      wallGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      wallGeometry.computeVertexNormals();
      
      const wallMaterial = materialRegistry.getStandard('world.sigmariftchamber.wall', {
        color: 0x0d0d1a,
        metalness: 0.3,
        roughness: 0.8,
        side: THREE.DoubleSide
      });
      
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      this.scene.add(wall);
      
      const symbolAngle = (i + 0.5) / wallSegments * Math.PI * 2;
      const symbolX = Math.cos(symbolAngle) * this.chamberRadius;
      const symbolZ = Math.sin(symbolAngle) * this.chamberRadius;
      const symbolY = this.chamberHeight * 0.6;
      
      this.createWallSymbol(symbolX, symbolY, symbolZ, angle1);
    }
    
    const verticalLineCount = 16;
    for (let i = 0; i < verticalLineCount; i++) {
      const angle = (i / verticalLineCount) * Math.PI * 2;
      const x = Math.cos(angle) * this.chamberRadius;
      const z = Math.sin(angle) * this.chamberRadius;
      
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x, this.chamberHeight, z)
      ]);
      
      const material = new THREE.LineBasicMaterial({
        color: 0x00ccdd,
        transparent: true,
        opacity: 0.1
      });
      
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }
  }
  
  createWallSymbol(x, y, z, rotation) {
    const symbolScale = 1.5;
    const trianglePoints = [
      new THREE.Vector3(0, 1, 0).multiplyScalar(symbolScale),
      new THREE.Vector3(-1, -1, 0).multiplyScalar(symbolScale),
      new THREE.Vector3(1, -1, 0).multiplyScalar(symbolScale),
      new THREE.Vector3(0, 1, 0).multiplyScalar(symbolScale)
    ];
    
    trianglePoints.forEach(p => {
      const rotatedX = p.x * Math.cos(rotation) - p.y * Math.sin(rotation);
      const rotatedY = p.x * Math.sin(rotation) + p.y * Math.cos(rotation);
      p.set(x + rotatedX, y + rotatedY, z);
    });
    
    const geometry = new THREE.BufferGeometry().setFromPoints(trianglePoints);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.4
    });
    
    const symbol = new THREE.Line(geometry, material);
    this.scene.add(symbol);
    
    this.animatedObjects.push({
      object: symbol,
      type: 'wallSymbol',
      baseOpacity: 0.4,
      pulseSpeed: 0.6,
      phaseOffset: Math.random() * Math.PI * 2
    });
  }
  
  createFloor() {
    const floorGeometry = new THREE.CircleGeometry(this.chamberRadius, 64);
    const floorMaterial = materialRegistry.getStandard('world.sigmariftchamber.floor', {
      color: 0x0a0a14,
      metalness: 0.2,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);
    
    const patternRadius = this.chamberRadius * 0.8;
    const hexRadius = 2;
    const hexCount = 8;
    for (let i = 0; i < hexCount; i++) {
      const angle = (i / hexCount) * Math.PI * 2;
      const x = Math.cos(angle) * patternRadius * 0.6;
      const z = Math.sin(angle) * patternRadius * 0.6;
      this.createHexagon(x, 0.01, z, hexRadius, 0x00aa99, 0.3);
    }
    
    const ringCount = 5;
    for (let ring = 1; ring <= ringCount; ring++) {
      const ringRadius = (patternRadius / ringCount) * ring;
      const triangleCount = 3 + ring * 2;
      
      for (let t = 0; t < triangleCount; t++) {
        const angle = (t / triangleCount) * Math.PI * 2;
        const nextAngle = ((t + 1) / triangleCount) * Math.PI * 2;
        
        const points = [
          new THREE.Vector3(0, 0.01, 0),
          new THREE.Vector3(Math.cos(angle) * ringRadius, 0.01, Math.sin(angle) * ringRadius),
          new THREE.Vector3(Math.cos(nextAngle) * ringRadius, 0.01, Math.sin(nextAngle) * ringRadius),
          new THREE.Vector3(0, 0.01, 0)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0x00ccdd,
          transparent: true,
          opacity: 0.15 + (ring * 0.05)
        });
        
        const triangle = new THREE.Line(geometry, material);
        this.scene.add(triangle);
      }
    }
  }
  
  createHexagon(x, y, z, radius, color, opacity) {
    const points = [];
    for (let i = 0; i < 7; i++) {
      const angle = (i / 6) * Math.PI * 2;
      points.push(new THREE.Vector3(x + Math.cos(angle) * radius, y, z + Math.sin(angle) * radius));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity
    });
    
    const hexagon = new THREE.Line(geometry, material);
    this.scene.add(hexagon);
    
    if (Math.random() > 0.5) {
      this.animatedObjects.push({
        object: hexagon,
        type: 'floorPattern',
        baseOpacity: opacity,
        pulseSpeed: 0.3,
        phaseOffset: Math.random() * Math.PI * 2
      });
    }
  }
  
  createCentralRift() {
    const riftRadius = 8;
    this.createRiftCore(riftRadius);
    this.createRiftEdges(riftRadius);
    this.createRiftParticleStream(riftRadius);
    this.createRiftDistortionField(riftRadius);
  }
  
  createRiftCore(radius) {
    const geometry = new THREE.CylinderGeometry(radius, radius, this.riftHeight, 32, 32, true);
    
    const vertShader = 'varying vec3 vPos; varying float vHeight; void main() { vPos = position; vHeight = (position.y + 9.0) / 18.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
    
    const fragShader = 'uniform float time; uniform vec3 color; varying vec3 vPos; varying float vHeight; float fractal(vec3 p) { float f = 0.0; float amp = 1.0; float freq = 1.0; for(int i = 0; i < 4; i++) { f += amp * sin(p.x * freq + time) * cos(p.z * freq + time); amp *= 0.5; freq *= 2.0; } return f; } void main() { float f = fractal(vPos * 3.0); float pattern = sin(vPos.x * 5.0 + time) * cos(vPos.z * 5.0 + time); vec3 finalColor = mix(vec3(0.0, 0.3, 0.2), color * 0.8, (pattern + 1.0) * 0.5 + f * 0.3); float intensity = 0.4 + vHeight * 0.6; gl_FragColor = vec4(finalColor * intensity, 0.8); }';
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x00ffaa) }
      },
      vertexShader: vertShader,
      fragmentShader: fragShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    this.riftCore = new THREE.Mesh(geometry, material);
    this.riftCore.position.y = this.riftHeight / 2;
    this.scene.add(this.riftCore);
    
    this.animatedObjects.push({
      object: this.riftCore,
      type: 'riftCore',
      shader: true
    });
  }
  
  createRiftEdges(radius) {
    for (let y of [0, this.riftHeight]) {
      const rimGeometry = new THREE.TorusGeometry(radius, 0.3, 16, 32);
      const rimMaterial = materialRegistry.getStandard('world.sigmariftchamber.rim', {
        color: 0x00ffaa,
        emissive: 0x00ffaa,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2
      });
      
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.position.y = y;
      rim.rotation.x = Math.PI / 2;
      this.scene.add(rim);
      
      const rimLight = new THREE.PointLight(0x00ffaa, 1, 25);
      rimLight.position.y = y;
      this.scene.add(rimLight);
    }
    
    const verticalLineCount = 16;
    for (let i = 0; i < verticalLineCount; i++) {
      const angle = (i / verticalLineCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const points = [
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x, this.riftHeight, z)
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6,
        linewidth: 2
      });
      
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      
      this.animatedObjects.push({
        object: line,
        type: 'riftEdgeLine',
        pulseSpeed: 1.2,
        phaseOffset: (i / verticalLineCount) * Math.PI * 2
      });
    }
  }
  
  createRiftParticleStream(riftRadius) {
    const particleCount = 500;
    const positions = [];
    const velocities = [];
    const ages = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * riftRadius * 0.8;
      const height = Math.random() * this.riftHeight;
      
      positions.push(Math.cos(angle) * distance, height, Math.sin(angle) * distance);
      
      const direction = Math.random() > 0.5 ? 1 : -1;
      const speed = 2 + Math.random() * 3;
      
      velocities.push(
        Math.cos(angle) * direction * speed,
        (Math.random() - 0.5) * speed,
        Math.sin(angle) * direction * speed
      );
      
      ages.push(Math.random());
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('age', new THREE.Float32BufferAttribute(ages, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.2,
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.riftParticles = new THREE.Points(geometry, material);
    this.scene.add(this.riftParticles);
    
    this.riftParticleData = {
      velocities: velocities,
      ages: ages,
      positions: positions,
      maxAge: 3.0
    };
  }
  
  createRiftDistortionField(riftRadius) {
    const ringCount = 4;
    
    for (let r = 1; r <= ringCount; r++) {
      const radius = riftRadius + r * 1.5;
      const ringGeometry = new THREE.TorusGeometry(radius, 0.1, 16, 64);
      
      const vertShader = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
      const fragShader = 'uniform float time; uniform float ringIndex; varying vec2 vUv; void main() { float wave = sin(vUv.x * 10.0 + time * 2.0) * 0.5 + 0.5; float alpha = wave * 0.2 + (0.3 - ringIndex * 0.05); gl_FragColor = vec4(0.0, 1.0, 0.7, alpha); }';
      
      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          ringIndex: { value: r }
        },
        vertexShader: vertShader,
        fragmentShader: fragShader,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = this.riftHeight / 2;
      ring.rotation.x = Math.PI / 2;
      this.scene.add(ring);
      
      this.animatedObjects.push({
        object: ring,
        type: 'distortionRing',
        shader: true
      });
    }
  }
  
  createFloatingMonoliths() {
    const monolithCount = 5;
    
    for (let i = 0; i < monolithCount; i++) {
      const angle = (i / monolithCount) * Math.PI * 2;
      const distance = 20 + Math.random() * 5;
      const height = this.riftHeight * 0.5 + Math.random() * 8;
      
      this.createMonolith(Math.cos(angle) * distance, height, Math.sin(angle) * distance, angle);
    }
  }
  
  createMonolith(x, y, z, angle) {
    const width = 1.2;
    const height = 6 + Math.random() * 3;
    const depth = 0.4;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = materialRegistry.getStandard('world.sigmariftchamber.monolith', {
      color: 0x1a1a2e,
      emissive: 0x1a1a2e,
      emissiveIntensity: 0.1,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const monolith = new THREE.Mesh(geometry, material);
    monolith.position.set(x, y, z);
    monolith.rotation.y = angle;
    this.scene.add(monolith);
    
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const pos = edgeGeometry.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edgeGeometry);
          break;
        }
      }
    }
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.6
    });
    const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    monolith.add(edge);
    
    monolith.userData = {
      baseX: x,
      baseZ: z,
      orbitRadius: Math.sqrt(x * x + z * z),
      orbitSpeed: 0.1 + Math.random() * 0.2,
      orbitPhase: angle,
      floatSpeed: 0.4 + Math.random() * 0.2,
      floatOffset: Math.random() * Math.PI * 2
    };
    
    this.animatedObjects.push({
      object: monolith,
      type: 'monolith'
    });
  }
  
  createHolographicRings() {
    const ringCount = 8;
    
    for (let i = 0; i < ringCount; i++) {
      const height = (i / ringCount) * this.chamberHeight;
      const radius = 15 + Math.random() * 10;
      
      const ringGeometry = new THREE.TorusGeometry(radius, 0.15, 8, 64);
      const vertShader = 'varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
      const fragShader = 'uniform float time; varying vec3 vPos; void main() { float pulse = sin(time * 1.5) * 0.5 + 0.5; gl_FragColor = vec4(0.0, 0.8 + pulse * 0.2, 0.8, 0.3); }';
      
      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: vertShader,
        fragmentShader: fragShader,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = height;
      ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      this.scene.add(ring);
      
      this.animatedObjects.push({
        object: ring,
        type: 'holographicRing',
        shader: true,
        rotationSpeed: 0.1 + Math.random() * 0.1,
        rotationAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
      });
    }
  }
  
  createNeonPaths() {
    const pathCount = 6;
    
    for (let p = 0; p < pathCount; p++) {
      const angle = (p / pathCount) * Math.PI * 2;
      const startDistance = this.chamberRadius * 0.9;
      const endDistance = 10;
      
      const startX = Math.cos(angle) * startDistance;
      const startZ = Math.sin(angle) * startDistance;
      const endX = Math.cos(angle) * endDistance;
      const endZ = Math.sin(angle) * endDistance;
      
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(startX, 0, startZ),
        new THREE.Vector3((startX + endX) * 0.5, this.riftHeight * 0.3, (startZ + endZ) * 0.5),
        new THREE.Vector3(endX, 0, endZ)
      );
      
      const points = curve.getPoints(30);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ccdd,
        transparent: true,
        opacity: 0.4,
        linewidth: 3
      });
      
      const path = new THREE.Line(geometry, material);
      this.scene.add(path);
      
      this.createPathParticles(curve);
    }
  }
  
  createPathParticles(curve) {
    const particleCount = 10;
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
      const point = curve.getPoint(i / particleCount);
      positions.push(point.x, point.y, point.z);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.25,
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    this.animatedObjects.push({
      object: particles,
      type: 'pathParticles',
      curve: curve,
      speed: 1.2 + Math.random() * 0.5
    });
  }
  
  createParticleDrift() {
    const particleCount = 300;
    const positions = [];
    const colors = [];
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.chamberRadius;
      
      positions.push(Math.cos(angle) * radius, Math.random() * this.chamberHeight, Math.sin(angle) * radius);
      colors.push(0.1, 0.6 + Math.random() * 0.3, 0.3);
      velocities.push((Math.random() - 0.5) * 0.1, Math.random() * 0.05, (Math.random() - 0.5) * 0.1);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    
    this.driftParticles = new THREE.Points(geometry, material);
    this.scene.add(this.driftParticles);
    
    this.driftData = {
      velocities: velocities,
      positions: positions
    };
  }
  
  update(deltaTime, time) {
    // Update reference plane (if created via canonical contract)
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    
    this.animatedObjects.forEach(obj => {
      if (obj.type === 'riftCore' && obj.object.material.uniforms) {
        obj.object.material.uniforms.time.value = time;
      }
      
      if (obj.type === 'distortionRing' && obj.object.material.uniforms) {
        obj.object.material.uniforms.time.value = time;
      }
      
      if (obj.type === 'holographicRing') {
        if (obj.object.material.uniforms) {
          obj.object.material.uniforms.time.value = time;
        }
        const axis = obj.rotationAxis;
        obj.object.rotateOnWorldAxis(axis, obj.rotationSpeed * deltaTime);
      }
      
      if ((obj.type === 'sigmaRune' || obj.type === 'wallSymbol' || obj.type === 'floorPattern') && obj.baseOpacity !== undefined) {
        const pulse = Math.sin(time * obj.pulseSpeed + obj.phaseOffset) * 0.5 + 0.5;
        obj.object.material.opacity = obj.baseOpacity * (0.5 + pulse * 0.5);
      }
      
      if (obj.type === 'riftEdgeLine') {
        const pulse = Math.sin(time * obj.pulseSpeed + obj.phaseOffset) * 0.5 + 0.5;
        obj.object.material.opacity = 0.3 + pulse * 0.3;
      }
      
      if (obj.type === 'monolith') {
        const data = obj.object.userData;
        const orbitPhase = time * data.orbitSpeed + data.orbitPhase;
        obj.object.position.x = Math.cos(orbitPhase) * data.orbitRadius;
        obj.object.position.z = Math.sin(orbitPhase) * data.orbitRadius;
        const floatPhase = time * data.floatSpeed + data.floatOffset;
        obj.object.position.y += Math.sin(floatPhase) * deltaTime * 0.5;
      }
      
      if (obj.type === 'pathParticles') {
        const t = (time * obj.speed) % 1.0;
        const positions = obj.object.geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {
          const pathT = (i / (positions.length / 3) + t) % 1.0;
          const point = obj.curve.getPoint(pathT);
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }
        obj.object.geometry.attributes.position.needsUpdate = true;
      }
    });
    
    if (this.riftParticles && this.riftParticleData) {
      const positions = this.riftParticles.geometry.attributes.position.array;
      const velocities = this.riftParticleData.velocities;
      const ages = this.riftParticles.geometry.attributes.age.array;
      const maxAge = this.riftParticleData.maxAge;
      
      for (let i = 0; i < positions.length / 3; i++) {
        ages[i] += deltaTime / maxAge;
        
        if (ages[i] >= 1.0) {
          ages[i] = 0;
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 8;
          const height = Math.random() * this.riftHeight;
          positions[i * 3] = Math.cos(angle) * distance;
          positions[i * 3 + 1] = height;
          positions[i * 3 + 2] = Math.sin(angle) * distance;
        } else {
          positions[i * 3] += velocities[i * 3] * deltaTime;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime;
          positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime;
        }
      }
      
      this.riftParticles.geometry.attributes.position.needsUpdate = true;
      this.riftParticles.geometry.attributes.age.needsUpdate = true;
    }
    
    if (this.driftParticles && this.driftData) {
      const positions = this.driftParticles.geometry.attributes.position.array;
      const velocities = this.driftData.velocities;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * deltaTime * 5;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime * 5;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime * 5;
        
        const distance = Math.sqrt(positions[i * 3] * positions[i * 3] + positions[i * 3 + 2] * positions[i * 3 + 2]);
        
        if (distance > this.chamberRadius || positions[i * 3 + 1] > this.chamberHeight || positions[i * 3 + 1] < 0) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * this.chamberRadius;
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = Math.random() * this.chamberHeight;
          positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
      }
      
      this.driftParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    if (this.starfield) {
      const starColors = this.starfield.geometry.attributes.color.array;
      for (let i = 0; i < starColors.length / 3; i++) {
        const twinkle = Math.sin(time * 2 + i) * 0.3 + 0.7;
        starColors[i * 3] *= twinkle;
        starColors[i * 3 + 1] *= twinkle;
        starColors[i * 3 + 2] *= twinkle;
      }
      this.starfield.geometry.attributes.color.needsUpdate = true;
    }
  }
}
