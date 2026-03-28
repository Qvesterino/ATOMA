import * as THREE from 'three';
import { CONFIG } from './config.js';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

const WORLD_DECOR_NODE_IMPERSONATORS = false;

/**
 * Node-Space Chamber - Core AI simulation environment
 * Minimal, precise, cinematic holographic space
 */
export class World {
  constructor({ scene, worldRoot }) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.worldDecorations = [];
    this.ripples = [];
    this.collisionObjects = [];
    
    this.createChamberFloor();
    this.createSingularity();
    this.createFloatingPlatforms();
    this.createArchStructure();
    this.createHolographicGrid();
    this.createDataWires();
    this.createDecorativeWorldProps();
    this.createParticleDrift();
  }
  
  /**
   * Create circular holographic floor beneath center
   */
  createChamberFloor() {
    // Main floor circle - dark matte
    const floorGeometry = new THREE.CircleGeometry(CONFIG.chamber.radius, 64);
    const floorMaterial = materialRegistry.getStandard('world.world.floor', {
      color: CONFIG.colors.matte,
      metalness: 0.3,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.worldRoot.add(floor);
    this.collisionObjects.push(floor);
    
    // Thin holographic ring at edge
    const ringGeometry = new THREE.RingGeometry(
      CONFIG.chamber.radius - 0.1,
      CONFIG.chamber.radius,
      64
    );
    const ringMaterial = materialRegistry.getBasic('world.world.floorRing', {
      color: CONFIG.colors.primary,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.worldRoot.add(ring);
    
    // Inner circle accent
    const innerCircle = new THREE.RingGeometry(11.8, 12, 64);
    const innerMaterial = materialRegistry.getBasic('world.world.floorInner', {
      color: CONFIG.colors.accent,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const inner = new THREE.Mesh(innerCircle, innerMaterial);
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.02;
    this.worldRoot.add(inner);
  }
  
  /**
   * Create the central singularity - soft glowing sphere
   */
  createSingularity() {
    // Core sphere - subtle glow
    const coreGeometry = new THREE.SphereGeometry(CONFIG.singularity.radius, 32, 32);
    const coreMaterial = materialRegistry.getStandard('world.world.singularityCore', {
      color: CONFIG.colors.singularity,
      emissive: CONFIG.colors.singularity,
      emissiveIntensity: CONFIG.singularity.glowIntensity,
      transparent: true,
      opacity: 0.7,
      metalness: 0.1,
      roughness: 0.4
    });
    this.singularity = new THREE.Mesh(coreGeometry, coreMaterial);
    this.singularity.position.y = CONFIG.chamber.coreHeight;
    this.worldRoot.add(this.singularity);
    
    // Add point light at singularity
    const coreLight = new THREE.PointLight(
      CONFIG.colors.singularity,
      CONFIG.lighting.coreIntensity,
      30
    );
    coreLight.position.copy(this.singularity.position);
    this.worldRoot.add(coreLight);
    this.coreLight = coreLight;
    
    // Create ripple rings (will animate outward)
    for (let i = 0; i < CONFIG.singularity.rippleCount; i++) {
      const rippleGeometry = new THREE.TorusGeometry(0.5, 0.02, 8, 32);
      const rippleMaterial = materialRegistry.getBasic('world.world.singularityRipple', {
        color: CONFIG.colors.primary,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
      ripple.position.copy(this.singularity.position);
      ripple.rotation.x = Math.PI / 2;
      
      ripple.userData = {
        phase: (i / CONFIG.singularity.rippleCount) * Math.PI * 2,
        baseRadius: 0.5
      };
      
      this.worldRoot.add(ripple);
      this.ripples.push(ripple);
    }
  }
  
  /**
   * Create floating rectangular platforms with neon edges
   */
  createFloatingPlatforms() {
    for (let i = 0; i < CONFIG.platforms.count; i++) {
      const angle = (i / CONFIG.platforms.count) * Math.PI * 2;
      const distance = 15 + Math.random() * 10;
      const height = 2 + Math.random() * 8;
      
      // Platform body - dark matte
      const platformGeometry = new THREE.BoxGeometry(
        CONFIG.platforms.width,
        CONFIG.platforms.depth,
        CONFIG.platforms.width * 0.6
      );
      const platformMaterial = materialRegistry.getStandard('world.world.platform', {
        color: CONFIG.colors.matte,
        metalness: 0.4,
        roughness: 0.7
      });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      
      platform.position.x = Math.cos(angle) * distance;
      platform.position.y = height;
      platform.position.z = Math.sin(angle) * distance;
      platform.rotation.y = angle + Math.PI / 2;
      
      this.worldRoot.add(platform);
      this.collisionObjects.push(platform);
      
      // Add thin neon edge
      const edgeGeometry = new THREE.EdgesGeometry(platformGeometry);
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
        color: CONFIG.colors.primary,
        transparent: true,
        opacity: 0.5
      });
      const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      platform.add(edge);
      
      // Floating animation data
      platform.userData = {
        originalY: height,
        floatSpeed: 0.3 + Math.random() * 0.2,
        floatOffset: Math.random() * Math.PI * 2
      };
    }
  }

  getCollisionObjects() {
    return this.collisionObjects;
  }

  getMovementBounds() {
    return {
      type: 'circle',
      center: new THREE.Vector3(0, 0, 0),
      radius: Math.max(1, CONFIG.chamber.radius - 0.75)
    };
  }
  
  /**
   * Create single clean arch structure
   */
  createArchStructure() {
    // Single vertical ring arc
    const arcGeometry = new THREE.TorusGeometry(18, 0.08, 8, 64, Math.PI);
    const arcMaterial = materialRegistry.getStandard('world.world.arch', {
      color: CONFIG.colors.secondary,
      emissive: CONFIG.colors.secondary,
      emissiveIntensity: 0.2,
      metalness: 0.8,
      roughness: 0.2
    });
    const arc = new THREE.Mesh(arcGeometry, arcMaterial);
    arc.rotation.x = Math.PI / 2;
    arc.position.y = CONFIG.chamber.coreHeight;
    this.worldRoot.add(arc);
    
    this.arc = arc;
  }
  
  /**
   * Create thin holographic grid lines on walls/floor
   */
  createHolographicGrid() {
    // Vertical lines rising from floor
    const lineCount = 12;
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const radius = CONFIG.chamber.radius * 0.95;
      
      const points = [
        new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ),
        new THREE.Vector3(
          Math.cos(angle) * radius,
          CONFIG.chamber.height,
          Math.sin(angle) * radius
        )
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: CONFIG.colors.primary,
        transparent: true,
        opacity: 0.15
      });
      
      const line = new THREE.Line(geometry, material);
      this.worldRoot.add(line);
    }
  }
  
  /**
   * Create thin data wires extending into background
   */
  createDataWires() {
    const wireCount = 8;
    
    for (let i = 0; i < wireCount; i++) {
      const angle = (i / wireCount) * Math.PI * 2 + Math.PI / 8;
      
      // Create curved wire path
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, CONFIG.chamber.coreHeight, 0),
        new THREE.Vector3(
          Math.cos(angle) * 15,
          CONFIG.chamber.coreHeight + 5,
          Math.sin(angle) * 15
        ),
        new THREE.Vector3(
          Math.cos(angle) * 35,
          CONFIG.chamber.height - 5,
          Math.sin(angle) * 35
        )
      );
      
      const points = curve.getPoints(20);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: CONFIG.colors.accent,
        transparent: true,
        opacity: 0.2
      });
      
      const wire = new THREE.Line(geometry, material);
      this.worldRoot.add(wire);
    }
  }
  
  /**
   * Create AI nodes - clean geometric shapes
   */
  createDecorativeWorldProps() {
    if (!WORLD_DECOR_NODE_IMPERSONATORS) {
      console.warn('[Policy] World node-like decor disabled:', { system: 'World' });
      return;
    }
    const geometries = [
      new THREE.OctahedronGeometry(0.8),
      new THREE.TetrahedronGeometry(0.9),
      new THREE.IcosahedronGeometry(0.7)
    ];
    
    for (let i = 0; i < CONFIG.nodes.count; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const color = i % 3 === 0 ? CONFIG.colors.primary : 
                    i % 3 === 1 ? CONFIG.colors.secondary : 
                    CONFIG.colors.accent;
      
      const material = materialRegistry.getStandard('world.world.node', {
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.75
      });
      
      const node = new THREE.Mesh(geometry, material);
      
      // Position in open volume around center
      const angle = Math.random() * Math.PI * 2;
      const distance = CONFIG.nodes.minDistance + 
                      Math.random() * (CONFIG.nodes.maxDistance - CONFIG.nodes.minDistance);
      
      node.position.x = Math.cos(angle) * distance;
      node.position.z = Math.sin(angle) * distance;
      node.position.y = CONFIG.nodes.minHeight + 
                       Math.random() * (CONFIG.nodes.maxHeight - CONFIG.nodes.minHeight);
      
      node.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      node.userData = {
        rotationSpeed: 0.05 + Math.random() * 0.1,
        floatSpeed: 0.3 + Math.random() * 0.2,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: node.position.y,
        pulseOffset: Math.random() * Math.PI * 2
      };
      
      this.worldRoot.add(node);
      this.worldDecorations.push(node);
      
      // Add subtle connection lines to nearby nodes
      if (this.worldDecorations.length > 1 && Math.random() > 0.6) {
        const prevNode = this.worldDecorations[this.worldDecorations.length - 2];
        const distance = node.position.distanceTo(prevNode.position);
        
        if (distance < 15) {
          const points = [prevNode.position.clone(), node.position.clone()];
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: CONFIG.colors.accent,
            transparent: true,
            opacity: 0.15
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          this.worldRoot.add(line);
        }
      }
    }
  }
  
  /**
   * Create gentle particle drift - very low density
   */
  createParticleDrift() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];
    
    const color1 = new THREE.Color(CONFIG.colors.primary);
    const color2 = new THREE.Color(CONFIG.colors.secondary);
    
    for (let i = 0; i < CONFIG.particles.count; i++) {
      // Random position in chamber volume
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 30;
      const x = Math.cos(angle) * radius;
      const y = Math.random() * CONFIG.chamber.height;
      const z = Math.sin(angle) * radius;
      
      positions.push(x, y, z);
      
      const color = color1.clone().lerp(color2, Math.random());
      colors.push(color.r, color.g, color.b);
      
      velocities.push(
        (Math.random() - 0.5) * CONFIG.particles.speed,
        Math.random() * CONFIG.particles.speed * 0.3,
        (Math.random() - 0.5) * CONFIG.particles.speed
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: CONFIG.particles.size,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.worldRoot.add(this.particles);
  }
  
  /**
   * Update world animations - subtle and smooth
   */
  update(deltaTime, time) {
    // Singularity gentle pulse
    if (this.singularity) {
      const pulse = Math.sin(time * 0.5) * 0.05 + 1;
      this.singularity.scale.setScalar(pulse);
      this.singularity.material.emissiveIntensity = 
        CONFIG.singularity.glowIntensity + Math.sin(time) * 0.05;
    }
    
    // Ripples expanding from singularity
    this.ripples.forEach(ripple => {
      const phase = (time * CONFIG.singularity.rippleSpeed + ripple.userData.phase) % (Math.PI * 2);
      const radius = ripple.userData.baseRadius + Math.sin(phase) * 8;
      const opacity = Math.max(0, Math.sin(phase) * 0.3);
      
      ripple.scale.set(radius / 0.5, radius / 0.5, 1);
      ripple.material.opacity = opacity;
    });
    
    // Arc slow rotation
    if (this.arc) {
      this.arc.rotation.z += deltaTime * 0.1;
    }
    
    // Decorative props gentle float and rotate
    this.worldDecorations.forEach(node => {
      const data = node.userData;
      
      node.rotation.x += data.rotationSpeed * deltaTime;
      node.rotation.y += data.rotationSpeed * deltaTime * 0.7;
      
      node.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 0.8;
      
      // Subtle pulse
      const pulse = Math.sin(time * 1.5 + data.pulseOffset) * 0.1 + 0.9;
      node.material.emissiveIntensity = 0.25 * pulse;
    });
    
    // Particle drift
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime * 5;
        positions[i + 1] += velocities[i + 1] * deltaTime * 5;
        positions[i + 2] += velocities[i + 2] * deltaTime * 5;
        
        // Reset if out of bounds
        const distance = Math.sqrt(
          positions[i] * positions[i] + 
          positions[i + 2] * positions[i + 2]
        );
        
        if (distance > 35 || positions[i + 1] > CONFIG.chamber.height || positions[i + 1] < 0) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 25;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = Math.random() * CONFIG.chamber.height;
          positions[i + 2] = Math.sin(angle) * radius;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
