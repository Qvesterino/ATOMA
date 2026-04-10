import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

/**
 * ============================================================================
 * COGNITIVE HORIZON PLANE (Session 112)
 * ============================================================================
 * A semi-transparent dream-like reference plane that provides spatial context
 * without being a physical terrain.
 * 
 * VISUAL DESIGN:
 * - Subtle procedural grid/lattice pattern
 * - Slow energy waves across surface
 * - Soft glow gradients toward horizon
 * - Very faint node reflections
 * - Deep blue to teal with cyan/violet hints
 * - Semi-transparent, minimal emissive
 * 
 * FUNCTIONAL ROLE:
 * - Provides scale and orientation
 * - Anchors nodes in shared dream-space
 * - Never visually competes with nodes
 * - Feels like collective subconscious surface
 */

export class CognitiveHorizonPlane {
  constructor(parent, camera) {
    this.parent = parent;
    this.camera = camera;
    this.time = 0;
    this._timeOrigin = undefined;
    this._targetMemoryPressure = 0;
    this._currentMemoryPressure = 0;
    this._lastMemoryScarTime = -Infinity;
    this._memoryScars = [];
    this._horizonCrownMeshes = [];
    this._horizonCrownRing = null;
    
    // Plane configuration
    this.config = {
      size: 420,
      segments: 128,
      surfaceY: -10,
      distortion: 0.18,
      waveSpeed: 0.08,
      waveAmplitude: 0.024,
      opacity: 0.24,
      emissiveIntensity: 0.14,
      gridOpacity: 0.08,
      reflectionOpacity: 0.065,
      memoryScarLifetime: 8.5,
      memoryScarCooldown: 0.85,
      memoryScarLimit: 16,
      crownRadiusScale: 0.43,
      crownCount: 12,
      crownHeight: 18,
      crownPulse: 0.22
    };
    
    // Create materials
    this.materials = this.createMaterials();
    
    // Create plane
    this.planeGroup = new THREE.Group();
    this.planeGroup.userData = { isCognitiveHorizonRoot: true };
    this.memoryScarsGroup = new THREE.Group();
    this.memoryScarsGroup.userData = { isMemoryScars: true };
    this.memoryScarsGroup.renderOrder = -197;
    this.planeGroup.add(this.memoryScarsGroup);
    this.createHorizonPlane();
    this.createGridOverlay();
    this.createGlowGradient();
    this.createHorizonCrown();
    
    this.parent.add(this.planeGroup);
  }
  
  /**
   * Create custom shader materials for the horizon
   */
  createMaterials() {
    const horizonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        waveAmplitude: { value: this.config.waveAmplitude },
        waveSpeed: { value: this.config.waveSpeed },
        distortion: { value: this.config.distortion },
        surfaceRadius: { value: this.config.size * 0.5 },
        opacity: { value: this.config.opacity },
        emissiveIntensity: { value: this.config.emissiveIntensity },
        memoryPressure: { value: this._currentMemoryPressure },
        baseColor: { value: new THREE.Color(0x071c26) },
        horizonColor: { value: new THREE.Color(0x2f7ea5) },
        memoryColor: { value: new THREE.Color(0x66f6ff) },
        scarColor: { value: new THREE.Color(0x8d5cff) }
      },
      vertexShader: `
        uniform float time;
        uniform float waveAmplitude;
        uniform float waveSpeed;
        uniform float distortion;
        uniform float surfaceRadius;
        uniform float memoryPressure;

        varying float vRadial;
        varying float vBand;
        varying vec3 vPosition;

        void main() {
          vPosition = position;
          float radial = length(position.xz) / surfaceRadius;
          radial = clamp(radial, 0.0, 1.0);
          vRadial = radial;

          float phase = time * waveSpeed;
          float ring = sin(radial * 10.0 - phase * 2.0);
          float weave = sin(position.x * 0.022 + phase) * cos(position.z * 0.026 - phase * 0.72);
          float basin = pow(radial, 2.0) * distortion * 4.8;
          float edgeLift = smoothstep(0.52, 1.0, radial) * distortion * 0.45;
          float pulse = ring * waveAmplitude * 0.8 + weave * waveAmplitude * 0.45;
          float memoryRipple = sin((position.x + position.z) * 0.05 + phase * 3.0) * memoryPressure * 0.06;

          vec3 displaced = position;
          displaced.y += pulse + memoryRipple;
          displaced.y -= basin;
          displaced.y += edgeLift;

          vBand = ring;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float opacity;
        uniform float emissiveIntensity;
        uniform float memoryPressure;
        uniform vec3 baseColor;
        uniform vec3 horizonColor;
        uniform vec3 memoryColor;
        uniform vec3 scarColor;

        varying float vRadial;
        varying float vBand;
        varying vec3 vPosition;

        void main() {
          float radialFade = smoothstep(0.0, 1.0, vRadial);
          float coreGlow = 1.0 - smoothstep(0.0, 0.4, vRadial);
          float ringPulse = 0.5 + 0.5 * sin(vRadial * 16.0 - time * 0.9);
          float gridX = abs(fract(vPosition.x * 0.075) - 0.5);
          float gridZ = abs(fract(vPosition.z * 0.075) - 0.5);
          float grid = max(1.0 - smoothstep(0.46, 0.5, gridX), 1.0 - smoothstep(0.46, 0.5, gridZ));
          float memoryBand = smoothstep(0.25, 0.95, abs(vBand));

          vec3 color = mix(baseColor, horizonColor, radialFade);
          color += vec3(0.0, 0.12, 0.16) * grid * (1.0 - radialFade);
          color += memoryColor * memoryPressure * (0.08 + coreGlow * 0.12);
          color += scarColor * memoryBand * memoryPressure * 0.06;
          color += horizonColor * ringPulse * coreGlow * emissiveIntensity * 0.12;

          float alpha = opacity * (0.52 + radialFade * 0.48);
          alpha += memoryPressure * 0.06;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        gridOpacity: { value: this.config.gridOpacity },
        surfaceRadius: { value: this.config.size * 0.5 },
        memoryPressure: { value: this._currentMemoryPressure }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying float vDistance;
        
        void main() {
          vPosition = position;
          vDistance = length(position.xz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float gridOpacity;
        uniform float surfaceRadius;
        uniform float memoryPressure;
        varying vec3 vPosition;
        varying float vDistance;
        
        void main() {
          float normalizedDistance = clamp(vDistance / surfaceRadius, 0.0, 1.0);
          float cellX = abs(fract(vPosition.x * 0.06) - 0.5);
          float cellZ = abs(fract(vPosition.z * 0.06) - 0.5);
          float line = 1.0 - smoothstep(0.42, 0.5, min(cellX, cellZ));
          float wave = 0.5 + 0.5 * sin((vPosition.x - vPosition.z) * 0.05 + time * 0.9);
          float fade = smoothstep(0.98, 0.18, normalizedDistance);
          float pulse = gridOpacity * (0.42 + wave * 0.3 + memoryPressure * 0.55);

          vec3 gridColor = mix(vec3(0.0, 0.21, 0.25), vec3(0.16, 0.82, 0.88), wave * 0.35 + memoryPressure * 0.15);
          float opacity = line * pulse * fade * 0.72;

          gl_FragColor = vec4(gridColor, opacity);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(0x66f6ff) },
        glowIntensity: { value: 0.15 },
        surfaceRadius: { value: this.config.size * 0.5 },
        memoryPressure: { value: this._currentMemoryPressure }
      },
      vertexShader: `
        varying float vDistance;
        
        void main() {
          vDistance = length(position.xz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        uniform float glowIntensity;
        uniform float surfaceRadius;
        uniform float memoryPressure;
        varying float vDistance;
        
        void main() {
          float normalizedDistance = clamp(vDistance / surfaceRadius, 0.0, 1.0);
          float horizonGlow = smoothstep(0.92, 0.35, normalizedDistance);
          float pulse = 0.84 + 0.16 * sin(time * 0.9 + vDistance * 0.04);
          float alpha = glowIntensity * horizonGlow * pulse;
          alpha += memoryPressure * 0.08;
          
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    
    return {
      horizon: horizonMaterial,
      grid: gridMaterial,
      glow: glowMaterial
    };
  }
  
  /**
   * Create the main horizon plane
   */
  createHorizonPlane() {
    const geometry = this._buildMembraneGeometry(this.config.size, this.config.segments, 1.0);
    const plane = new THREE.Mesh(geometry, this.materials.horizon);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = this.config.surfaceY;
    plane.userData = {
      isCognitiveHorizon: true,
      isCognitiveMembrane: true
    };
    plane.renderOrder = -200;
    plane.layers.set(0);

    this.planeGroup.add(plane);
    this.horizonPlane = plane;
  }
  
  /**
   * Create subtle grid overlay
   */
  createGridOverlay() {
    const geometry = this._buildMembraneGeometry(this.config.size, this.config.segments, 0.9);
    
    const grid = new THREE.Mesh(geometry, this.materials.grid);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = this.config.surfaceY + 0.02;
    grid.userData = { isGridOverlay: true };
    grid.renderOrder = -199;
    
    this.planeGroup.add(grid);
    this.gridMesh = grid;
  }
  
  /**
   * Create glow gradient effect
   */
  createGlowGradient() {
    const geometry = this._buildMembraneGeometry(this.config.size * 1.02, 96, 0.7);
    
    const glow = new THREE.Mesh(geometry, this.materials.glow);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = this.config.surfaceY + 0.035;
    glow.userData = { isGlowGradient: true };
    glow.renderOrder = -198;
    
    this.planeGroup.add(glow);
    this.glowMesh = glow;
  }
  
  /**
   * Animate the horizon plane
   */
  animate(deltaTime, time) {
    const currentTime = this._getCurrentTimeSeconds();
    const safeDelta = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    this.time = currentTime;

    this._targetMemoryPressure = Math.max(0, this._targetMemoryPressure - safeDelta * 0.03);
    this._currentMemoryPressure += (this._targetMemoryPressure - this._currentMemoryPressure) * Math.min(1, safeDelta * 4.5);

    // Update horizon shader uniforms
    if (this.materials.horizon.uniforms) {
      this.materials.horizon.uniforms.time.value = currentTime;
      this.materials.horizon.uniforms.waveSpeed.value = this.config.waveSpeed;
      this.materials.horizon.uniforms.waveAmplitude.value = this.config.waveAmplitude;
      this.materials.horizon.uniforms.distortion.value = this.config.distortion;
      this.materials.horizon.uniforms.opacity.value = this.config.opacity;
      this.materials.horizon.uniforms.emissiveIntensity.value = this.config.emissiveIntensity;
      this.materials.horizon.uniforms.memoryPressure.value = this._currentMemoryPressure;
    }
    
    // Update grid shader uniforms
    if (this.materials.grid.uniforms) {
      this.materials.grid.uniforms.time.value = currentTime;
      this.materials.grid.uniforms.gridOpacity.value = this.config.gridOpacity;
      this.materials.grid.uniforms.memoryPressure.value = this._currentMemoryPressure;
    }

    // Update glow shader uniforms
    if (this.materials.glow.uniforms) {
      this.materials.glow.uniforms.time.value = currentTime;
      this.materials.glow.uniforms.glowIntensity.value = 0.15 + this._currentMemoryPressure * 0.12;
      this.materials.glow.uniforms.memoryPressure.value = this._currentMemoryPressure;
    }

    this._updateMemoryScars(safeDelta, currentTime);
    this._updateHorizonCrown(safeDelta, currentTime);

    // Very subtle rotation for dreamlike quality
    this.planeGroup.rotation.z = currentTime * 0.003;
    this.planeGroup.rotation.y = Math.sin(currentTime * 0.012) * 0.004;
  }
  
  /**
   * Update configuration
   */
  setConfig(configUpdate) {
    Object.assign(this.config, configUpdate);
    
    // Update uniforms
    if (this.materials.horizon.uniforms) {
      this.materials.horizon.uniforms.waveSpeed.value = this.config.waveSpeed;
      this.materials.horizon.uniforms.waveAmplitude.value = this.config.waveAmplitude;
      this.materials.horizon.uniforms.distortion.value = this.config.distortion;
      this.materials.horizon.uniforms.opacity.value = this.config.opacity;
      this.materials.horizon.uniforms.emissiveIntensity.value = this.config.emissiveIntensity;
      this.materials.horizon.uniforms.surfaceRadius.value = this.config.size * 0.5;
    }
    
    if (this.materials.grid.uniforms) {
      this.materials.grid.uniforms.gridOpacity.value = this.config.gridOpacity;
      this.materials.grid.uniforms.surfaceRadius.value = this.config.size * 0.5;
    }

    if (this.materials.glow.uniforms) {
      this.materials.glow.uniforms.surfaceRadius.value = this.config.size * 0.5;
    }

    if (typeof configUpdate.surfaceY === 'number') {
      if (this.horizonPlane) this.horizonPlane.position.y = this.config.surfaceY;
      if (this.gridMesh) this.gridMesh.position.y = this.config.surfaceY + 0.02;
      if (this.glowMesh) this.glowMesh.position.y = this.config.surfaceY + 0.035;
      if (this.horizonCrownGroup) this.horizonCrownGroup.position.y = this.config.surfaceY;
      for (const scar of this._memoryScars) {
        if (scar) scar.position.y = this.config.surfaceY + 0.03;
      }
    }
  }
  
  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * React to nearby nodes (slight glow intensification)
   */
  reactToNodes(nodes, influenceRadius = 30) {
    if (!nodes || nodes.length === 0) return;
    
    const currentTime = this._getCurrentTimeSeconds();
    const focusPoint = new THREE.Vector3();
    let totalWeight = 0;
    let maxInfluence = 0;
    let influencedCount = 0;
    
    for (const node of nodes) {
      if (!node.position) continue;
      
      const distance = Math.sqrt(
        node.position.x ** 2 + node.position.z ** 2
      );
      
      if (distance < influenceRadius) {
        const influence = 1 - (distance / influenceRadius);
        maxInfluence = Math.max(maxInfluence, influence);
        const weight = Math.max(0.05, influence * influence);
        focusPoint.addScaledVector(node.position, weight);
        totalWeight += weight;
        influencedCount++;
      }
    }
    
    const density = nodes.length > 0 ? Math.min(1, influencedCount / Math.max(1, nodes.length * 0.35)) : 0;
    const targetPressure = Math.min(1, (maxInfluence * 0.82) + (density * 0.18));
    this._targetMemoryPressure = Math.max(this._targetMemoryPressure * 0.92, targetPressure);
    this._currentMemoryPressure += (targetPressure - this._currentMemoryPressure) * 0.15;

    // Modulate wave amplitude based on nearby node activity
    const targetAmplitude = 0.02 + maxInfluence * 0.038 + density * 0.012;
    this.config.waveAmplitude += (targetAmplitude - this.config.waveAmplitude) * 0.08;
    
    if (this.materials.horizon.uniforms) {
      this.materials.horizon.uniforms.waveAmplitude.value = this.config.waveAmplitude;
      this.materials.horizon.uniforms.memoryPressure.value = this._currentMemoryPressure;
    }

    if (this.materials.grid.uniforms) {
      this.materials.grid.uniforms.memoryPressure.value = this._currentMemoryPressure;
    }

    if (this.materials.glow.uniforms) {
      this.materials.glow.uniforms.memoryPressure.value = this._currentMemoryPressure;
    }

    if (totalWeight > 0) {
      focusPoint.multiplyScalar(1 / totalWeight);
      focusPoint.y = this.config.surfaceY + 0.03;

      if (maxInfluence >= 0.2 && (currentTime - this._lastMemoryScarTime) >= this.config.memoryScarCooldown) {
        this._spawnMemoryScar(focusPoint, maxInfluence, this._selectMemoryScarColor(nodes, maxInfluence));
        this._lastMemoryScarTime = currentTime;
      }
    }
  }
  
  _getCurrentTimeSeconds() {
    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    return VisualTime.now - this._timeOrigin;
  }

  _buildMembraneGeometry(size, segments, distortionScale = 1) {
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const positions = geometry.attributes.position;
    const halfSize = size * 0.5;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const radial = Math.min(1, Math.sqrt(x * x + z * z) / halfSize);
      const basin = Math.pow(radial, 2.05) * this.config.distortion * 4.2 * distortionScale;
      const ridge = Math.sin(radial * 9.0) * 0.014 * distortionScale;
      const edgeLift = Math.pow(radial, 5.0) * 0.03 * distortionScale;

      positions.setY(i, -basin + ridge + edgeLift);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }

  _selectMemoryScarColor(nodes, influence) {
    const palette = new THREE.Color(0x66f6ff);
    const categoryBlob = (nodes || [])
      .map((node) => `${node?.userData?.category || ''} ${node?.userData?.state || ''} ${node?.userData?.rareType || ''}`.toLowerCase())
      .join(' ');

    if (categoryBlob.includes('corrupt') || categoryBlob.includes('rupture') || categoryBlob.includes('chaos')) {
      palette.lerp(new THREE.Color(0x8d5cff), 0.58);
    } else if (categoryBlob.includes('harmony') || categoryBlob.includes('stable') || categoryBlob.includes('control')) {
      palette.lerp(new THREE.Color(0xffd166), 0.52);
    } else if (categoryBlob.includes('synergy') || categoryBlob.includes('process')) {
      palette.lerp(new THREE.Color(0x89ffe4), 0.42);
    }

    if (influence > 0.78) {
      palette.lerp(new THREE.Color(0xffffff), 0.08);
    }

    return palette;
  }

  _spawnMemoryScar(center, influence, color) {
    if (!this.memoryScarsGroup) return;

    if (this._memoryScars.length >= this.config.memoryScarLimit) {
      const oldest = this._memoryScars.shift();
      this._disposeMesh(oldest);
    }

    const radius = 2.4 + influence * 6.5;
    const thickness = 0.14 + influence * 0.22;
    const geometry = new THREE.RingGeometry(Math.max(0.35, radius - thickness), radius + thickness, 48);
    const material = new THREE.MeshBasicMaterial({
      color: color.clone ? color.clone() : color,
      transparent: true,
      opacity: this.config.reflectionOpacity + influence * 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const scar = new THREE.Mesh(geometry, material);
    scar.rotation.x = -Math.PI / 2;
    scar.position.set(center.x, this.config.surfaceY + 0.03, center.z);
    scar.renderOrder = -197;
    scar.userData = {
      isMemoryScar: true,
      birthTime: this.time,
      lifetime: this.config.memoryScarLifetime,
      baseScale: 0.95 + influence * 0.5,
      pulsePhase: Math.random() * Math.PI * 2,
      driftPhase: Math.random() * Math.PI * 2
    };

    this.memoryScarsGroup.add(scar);
    this._memoryScars.push(scar);
  }

  _updateMemoryScars(deltaTime, currentTime) {
    if (!this._memoryScars.length) return;

    for (let i = this._memoryScars.length - 1; i >= 0; i--) {
      const scar = this._memoryScars[i];
      if (!scar || !scar.userData) {
        this._memoryScars.splice(i, 1);
        continue;
      }

      const age = currentTime - (scar.userData.birthTime ?? currentTime);
      const life = Math.max(0.1, scar.userData.lifetime ?? this.config.memoryScarLifetime);
      const life01 = Math.max(0, Math.min(1, age / life));

      if (life01 >= 1) {
        this._disposeMesh(scar);
        this._memoryScars.splice(i, 1);
        continue;
      }

      const pulse = 1.0 + Math.sin(currentTime * 2.2 + scar.userData.pulsePhase) * 0.05;
      const drift = Math.sin(currentTime * 0.7 + scar.userData.driftPhase) * 0.03;
      const fadeIn = Math.min(1, life01 / 0.16);
      const fadeOut = 1.0 - Math.max(0, (life01 - 0.62) / 0.38);

      scar.scale.setScalar((scar.userData.baseScale ?? 1) * (0.92 + life01 * 0.55) * pulse);
      scar.position.y = this.config.surfaceY + 0.03 + drift;
      if (scar.material) {
        scar.material.opacity = (this.config.reflectionOpacity + (1.0 - life01) * 0.18) * fadeIn * fadeOut;
      }
      scar.rotation.z += deltaTime * 0.08;
    }
  }

  _createHorizonCrown() {
    const crownGroup = new THREE.Group();
    crownGroup.userData = { isHorizonCrown: true };
    crownGroup.renderOrder = -196;
    crownGroup.position.y = this.config.surfaceY;

    const radius = this.config.size * this.config.crownRadiusScale;
    const count = this.config.crownCount;

    const ringGeometry = new THREE.TorusGeometry(radius, 1.25, 8, 88);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x66f6ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.25;
    ring.renderOrder = -196;
    crownGroup.add(ring);
    this._horizonCrownRing = ring;

    this._horizonCrownMeshes = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const phase = angle * 2.7 + i * 0.31;
      const height = this.config.crownHeight * (0.58 + 0.36 * Math.sin(phase) + 0.12 * Math.cos(phase * 0.5));
      const cylinder = new THREE.CylinderGeometry(0.38, 1.05, height, 6, 1, false);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.53 + i * 0.012, 0.68, 0.58),
        transparent: true,
        opacity: 0.26,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });

      const spire = new THREE.Mesh(cylinder, material);
      spire.position.set(
        Math.cos(angle) * radius,
        height * 0.5,
        Math.sin(angle) * radius
      );
      spire.rotation.y = angle + Math.PI * 0.5;
      spire.rotation.z = Math.sin(phase) * 0.12;
      spire.renderOrder = -195;
      spire.userData = {
        isHorizonSpire: true,
        baseHeight: height,
        pulsePhase: phase,
        anchorRadius: radius
      };

      crownGroup.add(spire);
      this._horizonCrownMeshes.push(spire);
    }

    this.horizonCrownGroup = crownGroup;
    this.planeGroup.add(crownGroup);
  }

  _updateHorizonCrown(deltaTime, currentTime) {
    if (!this.horizonCrownGroup) return;

    this.horizonCrownGroup.rotation.y = currentTime * 0.0015;
    this.horizonCrownGroup.rotation.z = Math.sin(currentTime * 0.008) * 0.01;

    if (this._horizonCrownRing?.material) {
      this._horizonCrownRing.material.opacity = 0.05 + this._currentMemoryPressure * 0.08;
    }

    for (const spire of this._horizonCrownMeshes) {
      if (!spire?.userData) continue;
      const pulse = 1.0 + Math.sin(currentTime * 1.8 + spire.userData.pulsePhase) * (0.04 + this._currentMemoryPressure * 0.05);
      const lift = 1.0 + this._currentMemoryPressure * 0.18;
      spire.scale.setScalar(pulse * lift);
      spire.material.opacity = 0.18 + this._currentMemoryPressure * 0.18;
      spire.rotation.z = Math.sin(currentTime * 0.4 + spire.userData.pulsePhase) * 0.11;
    }
  }

  _disposeMesh(mesh) {
    if (!mesh) return;

    if (mesh.parent) {
      mesh.parent.remove(mesh);
    }

    if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
      mesh.geometry.dispose();
    }

    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        if (material && typeof material.dispose === 'function') {
          material.dispose();
        }
      }
    } else if (mesh.material && typeof mesh.material.dispose === 'function') {
      mesh.material.dispose();
    }
  }

  /**
   * Dispose resources
   */
  dispose() {
    if (this.planeGroup) {
      const meshesToDispose = [];
      this.planeGroup.traverse((object) => {
        if (object.isMesh) {
          meshesToDispose.push(object);
        }
      });

      for (const mesh of meshesToDispose) {
        this._disposeMesh(mesh);
      }
    }

    if (this.planeGroup?.parent) {
      this.planeGroup.parent.remove(this.planeGroup);
    }

    this.planeGroup?.clear?.();

    this._memoryScars.length = 0;
    this._horizonCrownMeshes.length = 0;
    this._horizonCrownRing = null;
    this.memoryScarsGroup = null;
    this.horizonCrownGroup = null;
    this.horizonPlane = null;
    this.gridMesh = null;
    this.glowMesh = null;
    this.materials = {};
  }
}

/**
 * Console API for debugging and live parameter adjustment
 */
export function setupCognitiveHorizonConsoleAPI(horizonPlane) {
  window.CognitiveHorizonDebug = {
    /**
     * Get current configuration
     */
    getConfig() {
      return horizonPlane.getConfig();
    },
    
    /**
     * Update configuration
     */
    setConfig(configUpdate) {
      horizonPlane.setConfig(configUpdate);
      console.log('🌊 Cognitive Horizon config updated:', configUpdate);
    },
    
    /**
     * Set wave speed
     */
    setWaveSpeed(speed) {
      horizonPlane.setConfig({ waveSpeed: speed });
      console.log(`🌊 Wave speed: ${speed}`);
    },
    
    /**
     * Set wave amplitude
     */
    setWaveAmplitude(amplitude) {
      horizonPlane.setConfig({ waveAmplitude: amplitude });
      console.log(`🌊 Wave amplitude: ${amplitude}`);
    },
    
    /**
     * Set opacity
     */
    setOpacity(opacity) {
      horizonPlane.setConfig({ opacity });
      console.log(`🌊 Opacity: ${opacity}`);
    },
    
    /**
     * Set grid opacity
     */
    setGridOpacity(gridOpacity) {
      horizonPlane.setConfig({ gridOpacity });
      console.log(`🌊 Grid opacity: ${gridOpacity}`);
    },
    
    /**
     * Enable/disable wave animation
     */
    enableWaves(enabled) {
      horizonPlane.setConfig({ waveSpeed: enabled ? 0.08 : 0 });
      console.log(`🌊 Waves ${enabled ? 'enabled' : 'disabled'}`);
    },
    
    /**
     * Reset to defaults
     */
    reset() {
      horizonPlane.setConfig({
        waveSpeed: 0.08,
        waveAmplitude: 0.024,
        opacity: 0.24,
        gridOpacity: 0.08
      });
      horizonPlane._targetMemoryPressure = 0;
      horizonPlane._currentMemoryPressure = 0;
      if (Array.isArray(horizonPlane._memoryScars)) {
        const scars = [...horizonPlane._memoryScars];
        horizonPlane._memoryScars.length = 0;
        for (const scar of scars) {
          horizonPlane._disposeMesh(scar);
        }
      }
      console.log('🌊 Cognitive Horizon reset to defaults');
    },

    /**
     * Manually set memory pressure for live testing
     */
    setMemoryPressure(level) {
      const pressure = Math.max(0, Math.min(1, Number(level) || 0));
      horizonPlane._targetMemoryPressure = pressure;
      horizonPlane._currentMemoryPressure = pressure;
      console.log(`🌊 Memory pressure: ${pressure.toFixed(2)}`);
    }
  };
  
  console.log('🌊 Cognitive Horizon Console API ready: window.CognitiveHorizonDebug');
}
