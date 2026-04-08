import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';

/**
 * Dream Desert 2.0 - Dream Realism Edition
 * High-fidelity ATOMA Dreamscape with realistic atmosphere
 * Synthetic geometric dunes with soft realistic lighting
 * Maintains surreal AI aesthetic through material design and color palette
 * Separate invisible collision layer for physics
 * NOTE: Keep the analytic terrain sampler in sync with the visible dunes so the player controller can avoid raycast probes.
 */
export class DreamDesert2 {
  constructor(scene, worldRoot, camera = null) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.visualObjects = [];
    this.collisionObjects = [];
    this.animatedObjects = [];
    this.particleSystems = [];
    this.fragmentLinkLines = null;
    this.fragmentGlowTexture = null;
    this.fragmentOuterGlowTexture = null;
    this.fragmentTrailSystem = null;
    this.sandTrailSystem = null;
    this.pointLights = [];
    this.sunLight = null;
    this.sunGlow = null;
    this.moon = null;
    this.stars = null;
    this.cloudLayers = [];
    this.sunOrbitRadius = 120;
    this.sunOrbitSpeed = (Math.PI * 2) / 300; // one full rotation in ~5 minutes
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.renderer = null;
    this.playerGroundOffset = 1;
    
    // Wind system for particle distortion
    this.windDirection = new THREE.Vector3(1.0, 0.1, 0.3).normalize();
    this.windStrength = 0.015;
    this.windTime = 0;
    
    // Session 112+: Initialize map configuration and reference plane
    this.initializeMapConfig();
    this.initializeReferencePlane();
    
    // Build environment with dream realism
    this.createSkyAndAtmosphere();
    this.createMainDunes();
    this.createFractalRidges();
    this.createFloatingFragments();
    this.createVolumetricEffects();
    this.createAdvancedLighting();
    this.createParticleSystems();
    this.createAtmosphericScattering();
    this.createCollisionLayer();
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('DreamDesert2');
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
        this.worldRoot,
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
  
  /**
   * Setup sky, background, and atmospheric conditions
   */
  createSkyAndAtmosphere() {
    if (this.scene) {
      this.scene.fog = new THREE.FogExp2(0xffd0e0, 0.0038);
      this.scene.background = new THREE.Color(0x1a0a15);
    }

    const skyGeometry = new THREE.SphereGeometry(520, 32, 15);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTopColor: { value: new THREE.Color(0xffb8d8) },
        uBottomColor: { value: new THREE.Color(0xff8b4c) },
        uSunPosition: { value: new THREE.Vector3(0, 65, 120) }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        uniform vec3 uSunPosition;
        uniform float uTime;

        void main() {
          float t = normalize(vWorldPosition).y * 0.5 + 0.5;
          vec3 color = mix(uBottomColor, uTopColor, smoothstep(0.0, 1.0, t));
          
          // Sun glow effect
          vec3 sunDir = normalize(uSunPosition);
          vec3 viewDir = normalize(vWorldPosition);
          float sunDot = max(0.0, dot(viewDir, sunDir));
          float sunGlow = pow(sunDot, 64.0) * 0.3;
          
          // Horizon glow
          float horizonGlow = exp(-abs(t - 0.5) * 8.0) * 0.15;
          
          color += vec3(1.0, 0.9, 0.8) * sunGlow;
          color += vec3(1.0, 0.8, 0.9) * horizonGlow;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });

    const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    skySphere.name = 'dreamSkySphere';
    skySphere.renderOrder = -1;
    this.worldRoot.add(skySphere);
    
    // Create celestial bodies, clouds, and sun glow
    this.createCelestialBodies();
    this.createCloudLayers();
    this.createSunGlow();
  }

  /**
   * Generate layered dune noise for organic terrain.
   */
  sampleDuneNoise(x, z) {
    const baseScale = 0.0115;
    const n0 = this._noise2D(x * baseScale, z * baseScale) * 1.0;
    const n1 = this._noise2D(x * baseScale * 2.2, z * baseScale * 2.2) * 0.52;
    const n2 = this._noise2D(x * baseScale * 4.5, z * baseScale * 4.5) * 0.26;
    const n3 = this._noise2D(x * baseScale * 9.8, z * baseScale * 9.8) * 0.12;
    return (n0 + n1 + n2 + n3) * 6.5;
  }

  _noise2D(x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const u = this._fade(fx);
    const v = this._fade(fz);

    const n00 = this._gradNoise(ix, iz, fx, fz);
    const n10 = this._gradNoise(ix + 1, iz, fx - 1, fz);
    const n01 = this._gradNoise(ix, iz + 1, fx, fz - 1);
    const n11 = this._gradNoise(ix + 1, iz + 1, fx - 1, fz - 1);

    const nx0 = this._lerp(n00, n10, u);
    const nx1 = this._lerp(n01, n11, u);
    return this._lerp(nx0, nx1, v);
  }

  _gradNoise(ix, iz, fx, fz) {
    const hash = this._pseudoRandom2D(ix, iz);
    const angle = (hash % 8) * (Math.PI * 0.25);
    const gx = Math.cos(angle);
    const gz = Math.sin(angle);
    return gx * fx + gz * fz;
  }

  _pseudoRandom2D(x, y) {
    let n = x * 374761393 + y * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return (n ^ (n >> 16)) >>> 0;
  }

  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  sampleTerrainHeight(x, z) {
    const dist = Math.sqrt(x * x + z * z);
    const falloffBase = Math.max(0, 1 - (dist * 0.0068));
    const falloff = Math.max(0.18, Math.pow(falloffBase, 1.4));
    return Math.max(0, this.sampleDuneNoise(x, z) * falloff);
  }

  getGroundLevelAt(x, z) {
    return this.sampleTerrainHeight(x, z) + this.playerGroundOffset;
  }

  createMainDunes() {
    // Higher resolution for organic dune detail
    const geometry = new THREE.PlaneGeometry(240, 240, 220, 220);
    
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array;
    const colorArray = new Float32Array(positions.length);
    const lowColor = new THREE.Color(0xffc0d0);
    const midColor = new THREE.Color(0xffd5e8);
    const highColor = new THREE.Color(0xe9d4ff);
    const edgeColor = new THREE.Color(0xffffff);

    // Create displacement texture
    const displacementSize = 512;
    const displacementCanvas = document.createElement('canvas');
    displacementCanvas.width = displacementSize;
    displacementCanvas.height = displacementSize;
    const dispCtx = displacementCanvas.getContext('2d');
    const dispImageData = dispCtx.createImageData(displacementSize, displacementSize);
    const dispData = dispImageData.data;

    for (let y = 0; y < displacementSize; y++) {
      for (let x = 0; x < displacementSize; x++) {
        const worldX = ((x / displacementSize) - 0.5) * 240;
        const worldZ = ((y / displacementSize) - 0.5) * 240;
        const dispHeight = this.sampleDuneNoise(worldX, worldZ) / 9.0;
        const brightness = Math.min(255, Math.max(0, dispHeight * 255));
        const idx = (y * displacementSize + x) * 4;
        dispData[idx] = brightness;
        dispData[idx + 1] = brightness;
        dispData[idx + 2] = brightness;
        dispData[idx + 3] = 255;
      }
    }
    dispCtx.putImageData(dispImageData, 0, 0);
    const displacementTexture = new THREE.CanvasTexture(displacementCanvas);
    displacementTexture.wrapS = THREE.ClampToEdgeWrapping;
    displacementTexture.wrapT = THREE.ClampToEdgeWrapping;
    displacementTexture.needsUpdate = true;

    // Organic multi-octave dune generation
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const height = this.sampleTerrainHeight(x, z);
      positions[i + 1] = height;
      
      const normalizedHeight = Math.min(1, height / 9);
      const color = lowColor.clone();
      if (normalizedHeight < 0.4) {
        color.lerp(midColor, normalizedHeight / 0.4);
      } else if (normalizedHeight < 0.75) {
        color.copy(midColor).lerp(highColor, (normalizedHeight - 0.4) / 0.35);
      } else {
        color.copy(highColor).lerp(edgeColor, Math.pow((normalizedHeight - 0.75) / 0.25, 0.5));
      }
      
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }
    
    positionAttribute.needsUpdate = true;
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geometry.computeVertexNormals();
    
    const normalMap = this.createSandNormalTexture();
    
    const duneMaterial = materialRegistry.getStandard('world.dreamdesert2.duneMain', {
      color: 0xffc0d0,
      roughness: 0.52,
      metalness: 0.06,
      emissive: 0xffc0d0,
      emissiveIntensity: 0.05,
      side: THREE.DoubleSide,
      envMapIntensity: 1.3,
      clearcoat: 0.22,
      clearcoatRoughness: 0.68,
      sheen: 0.12,
      sheenRoughness: 0.5,
      vertexColors: true,
      normalMap,
      normalScale: new THREE.Vector2(0.38, 0.38),
      displacementMap: displacementTexture,
      displacementScale: 0.8,
      displacementBias: -0.4
    });
    
    const dunes = new THREE.Mesh(geometry, duneMaterial);
    dunes.rotation.x = -Math.PI / 2;
    dunes.castShadow = true;
    dunes.receiveShadow = true;
    dunes.name = 'mainDunes';
    
    this.worldRoot.add(dunes);
    this.visualObjects.push(dunes);
  }

  createSandNormalTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    const heightField = new Float32Array(size * size);
    const detailScale = 11.2;
    const rippleScale = 24.0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x / size) * detailScale;
        const v = (y / size) * detailScale;
        const value = Math.sin(u * 3.4 + Math.cos(v * 2.8) * 1.1) * 0.16
          + Math.sin(v * 5.2 + u * 1.9) * 0.08
          + Math.cos(u * 8.1) * 0.04
          + Math.sin(u * 12.4 + v * 9.2) * 0.02
          + Math.cos(v * 15.6 + u * 11.8) * 0.015;
        heightField[y * size + x] = value;
      }
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const center = heightField[y * size + x];
        const left = heightField[y * size + ((x - 1 + size) % size)];
        const right = heightField[y * size + ((x + 1) % size)];
        const up = heightField[((y - 1 + size) % size) * size + x];
        const down = heightField[((y + 1) % size) * size + x];
        const dx = (right - left) * rippleScale;
        const dy = (down - up) * rippleScale;
        const nz = Math.sqrt(Math.max(0, 1 - dx * dx * 0.25 - dy * dy * 0.25));
        const nx = (dx * 0.5 + 1) * 127.5;
        const ny = (dy * 0.5 + 1) * 127.5;
        const nzByte = nz * 255;
        const index = (y * size + x) * 4;
        data[index] = Math.max(0, Math.min(255, nx));
        data[index + 1] = Math.max(0, Math.min(255, ny));
        data[index + 2] = Math.max(0, Math.min(255, nzByte));
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    texture.needsUpdate = true;
    return texture;
  }

  createFragmentGlowTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0.0, 'rgba(255, 230, 255, 0.85)');
    gradient.addColorStop(0.3, 'rgba(232, 160, 255, 0.42)');
    gradient.addColorStop(0.6, 'rgba(188, 120, 255, 0.16)');
    gradient.addColorStop(1.0, 'rgba(160, 90, 255, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  createFragmentOuterGlowTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0.0, 'rgba(200, 140, 255, 0.0)');
    gradient.addColorStop(0.35, 'rgba(180, 120, 240, 0.08)');
    gradient.addColorStop(0.65, 'rgba(150, 100, 220, 0.12)');
    gradient.addColorStop(0.85, 'rgba(120, 80, 200, 0.06)');
    gradient.addColorStop(1.0, 'rgba(100, 60, 180, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  createPrismaticFragmentMaterial(baseColor, isMonument) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(baseColor) },
        uEmissiveIntensity: { value: isMonument ? 0.5 : 0.32 },
        uCameraPosition: { value: new THREE.Vector3() },
        uRefractionStrength: { value: 0.18 },
        uDispersion: { value: 0.032 },
        uRoughness: { value: 0.08 },
        uOpacity: { value: isMonument ? 0.94 : 0.9 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vViewDirection = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;
        
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform float uEmissiveIntensity;
        uniform vec3 uCameraPosition;
        uniform float uRefractionStrength;
        uniform float uDispersion;
        uniform float uRoughness;
        uniform float uOpacity;
        
        // Fresnel effect
        float fresnel(vec3 normal, vec3 viewDir, float power) {
          float cosTheta = dot(normal, viewDir);
          return pow(1.0 - abs(cosTheta), power);
        }
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewDirection);
          
          // Fresnel rim lighting for glassy edge effect
          float fresnelTerm = fresnel(normal, viewDir, 3.5);
          
          // Prismatic dispersion - slightly different refraction for RGB channels
          vec3 refractedColors;
          float refraction = uRefractionStrength * (1.0 - fresnelTerm * 0.5);
          
          // Simulate dispersion by shifting color slightly based on normal
          vec3 dispersionShift = normal * uDispersion;
          
          // Base color with slight dispersion
          vec3 colorR = uBaseColor * (1.0 + dispersionShift.r);
          vec3 colorG = uBaseColor * (1.0 + dispersionShift.g);
          vec3 colorB = uBaseColor * (1.0 + dispersionShift.b);
          
          // Combine with prismatic effect
          vec3 prismaticColor = vec3(colorR.r, colorG.g, colorB.b);
          
          // Add subtle iridescence
          float iridescence = sin(uTime * 0.8 + dot(normal, vec3(0.5, 1.0, 0.5)) * 6.0) * 0.15;
          vec3 iridescentTint = vec3(
            0.5 + 0.5 * sin(uTime * 0.6 + vWorldPosition.x * 0.1),
            0.5 + 0.5 * sin(uTime * 0.7 + vWorldPosition.y * 0.1),
            0.5 + 0.5 * sin(uTime * 0.8 + vWorldPosition.z * 0.1)
          );
          
          // Combine all effects
          vec3 finalColor = prismaticColor * 0.7;
          finalColor += iridescentTint * iridescence * 0.25;
          finalColor += vec3(1.0, 0.95, 1.0) * fresnelTerm * 0.45; // rim glow
          finalColor += uBaseColor * uEmissiveIntensity * 0.6; // inner glow
          
          // Subtle edge highlight
          float edge = 1.0 - abs(dot(normal, viewDir));
          finalColor += vec3(1.0, 0.9, 1.0) * pow(edge, 4.0) * 0.3;
          
          // Apply opacity with fresnel falloff
          float alpha = uOpacity * (0.85 + fresnelTerm * 0.15);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  _updateFragmentConnectionLines() {
    if (!this.fragmentLinkLines || !this.fragmentLinkLines.object) {
      return;
    }
    const positions = this.fragmentLinkLines.object.geometry.attributes.position.array;
    let offset = 0;
    for (const pair of this.fragmentLinkLines.pairs) {
      const a = pair[0].position;
      const b = pair[1].position;
      positions[offset++] = a.x;
      positions[offset++] = a.y;
      positions[offset++] = a.z;
      positions[offset++] = b.x;
      positions[offset++] = b.y;
      positions[offset++] = b.z;
    }
    this.fragmentLinkLines.object.geometry.attributes.position.needsUpdate = true;
  }

  emitFragmentTrail(position, hue, size) {
    if (!this.fragmentTrailSystem) {
      return;
    }

    const trail = this.fragmentTrailSystem;
    for (let i = 0; i < trail.count; i++) {
      if (trail.age[i] <= 0) {
        const idx = i * 3;
        trail.positions[idx] = position.x;
        trail.positions[idx + 1] = position.y;
        trail.positions[idx + 2] = position.z;
        trail.sizes[i] = size * 1.6;
        trail.hues[i] = hue;
        trail.phases[i] = Math.random() * Math.PI * 2;
        trail.life[i] = 0.26;
        trail.age[i] = 0.26;
        trail.alphas[i] = 1.0;
        trail.object.geometry.attributes.position.needsUpdate = true;
        trail.object.geometry.attributes.aSize.needsUpdate = true;
        trail.object.geometry.attributes.aHue.needsUpdate = true;
        trail.object.geometry.attributes.aPhase.needsUpdate = true;
        trail.object.geometry.attributes.aAlpha.needsUpdate = true;
        break;
      }
    }
  }
  
  createCrystallineRidgeMaterial(baseColor, emissiveColor) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(baseColor) },
        uEmissiveColor: { value: new THREE.Color(emissiveColor) },
        uEmissiveIntensity: { value: 0.08 },
        uCameraPosition: { value: new THREE.Vector3() },
        uReflectionStrength: { value: 0.65 },
        uInternalGlowStrength: { value: 0.45 },
        uRoughness: { value: 0.15 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;
        varying float vHeight;
        
        void main() {
          vUv = uv;
          vHeight = position.y;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vViewDirection = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;
        varying float vHeight;
        
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uEmissiveColor;
        uniform float uEmissiveIntensity;
        uniform vec3 uCameraPosition;
        uniform float uReflectionStrength;
        uniform float uInternalGlowStrength;
        uniform float uRoughness;
        
        // Fresnel effect for edge glow
        float fresnel(vec3 normal, vec3 viewDir, float power) {
          float cosTheta = dot(normal, viewDir);
          return pow(1.0 - abs(cosTheta), power);
        }
        
        // Simple pseudo-reflection
        vec3 pseudoReflection(vec3 normal, vec3 viewDir) {
          vec3 reflectDir = reflect(-viewDir, normal);
          // Create sky-like gradient for reflection
          float skyFactor = reflectDir.y * 0.5 + 0.5;
          vec3 skyColor = mix(vec3(0.4, 0.3, 0.5), vec3(0.8, 0.7, 0.9), skyFactor);
          return skyColor;
        }
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewDirection);
          
          // Fresnel rim lighting
          float fresnelTerm = fresnel(normal, viewDir, 3.0);
          
          // Reflection component
          vec3 reflectionColor = pseudoReflection(normal, viewDir);
          
          // Internal glow - stronger at top, fades down
          float heightFactor = smoothstep(-0.5, 0.5, vHeight);
          float internalGlow = heightFactor * uInternalGlowStrength;
          
          // Pulsing internal glow
          float pulse = 0.7 + 0.3 * sin(uTime * 0.8 + vWorldPosition.x * 0.5);
          internalGlow *= pulse;
          
          // Crystalline facets - simulated with normal variation
          float facetHighlight = step(0.7, dot(normal, vec3(0.577))) * 0.3;
          
          // Combine lighting components
          vec3 finalColor = uBaseColor * 0.4;
          finalColor += reflectionColor * uReflectionStrength * (1.0 - uRoughness);
          finalColor += uEmissiveColor * uEmissiveIntensity * internalGlow;
          finalColor += vec3(1.0, 0.95, 1.0) * fresnelTerm * 0.6; // rim glow
          finalColor += vec3(0.9, 0.85, 1.0) * facetHighlight;
          
          // Subtle color variation based on height
          vec3 heightTint = mix(vec3(0.9, 0.8, 1.0), vec3(1.0, 1.0, 1.0), heightFactor);
          finalColor *= heightTint;
          
          // Add sparkle at edges
          float edgeSharpness = 1.0 - abs(dot(normal, viewDir));
          float sparkle = pow(edgeSharpness, 8.0) * 0.4;
          finalColor += vec3(1.0, 0.98, 1.0) * sparkle;
          
          gl_FragColor = vec4(finalColor, 0.95);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }
  
  /**
   * Create geometric fractal ridge formations
   */
  createFractalRidges() {
    const ridgeCount = 11;
    
    for (let r = 0; r < ridgeCount; r++) {
      const angle = (r / ridgeCount) * Math.PI * 2;
      const distance = 40 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      const length = 16 + Math.random() * 24;
      const baseHeight = 2.5 + Math.random() * 3.5;
      const topHeight = baseHeight * 0.4; // Taper to 40% at top
      
      // Create tapered cone-like ridge geometry
      const ridgeGeo = new THREE.ConeGeometry(baseHeight, length, 4, 1, false);
      ridgeGeo.rotateZ(Math.PI / 2);
      ridgeGeo.rotateX(Math.PI / 2);
      
      const hue = 0.96 - r * 0.03;
      const ridgeColor = new THREE.Color().setHSL(hue, 0.72, 0.74);
      const ridgeEmissive = ridgeColor.clone().offsetHSL(0, -0.18, -0.08);

      const ridgeMaterial = this.createCrystallineRidgeMaterial(ridgeColor.getHex(), ridgeEmissive.getHex());
      
      const ridge = new THREE.Mesh(ridgeGeo, ridgeMaterial);
      ridge.position.set(x, baseHeight * 0.5 + 0.3, z);
      ridge.rotation.y = Math.random() * Math.PI;
      ridge.rotation.z = (Math.random() - 0.5) * 0.16;
      ridge.castShadow = true;
      ridge.receiveShadow = true;
      ridge.name = 'fractalRidge';
      
      this.worldRoot.add(ridge);
      this.visualObjects.push(ridge);
      this.animatedObjects.push({
        object: ridge,
        type: 'fractalRidge',
        baseZ: ridge.rotation.z,
        baseEmissiveIntensity: 0.08,
        pulseSpeed: 0.36 + Math.random() * 0.14,
        phaseOffset: Math.random() * Math.PI * 2
      });
      
      // Add 2-3 sub-ridges around each main ridge
      const subRidgeCount = 2 + Math.floor(Math.random() * 2);
      for (let s = 0; s < subRidgeCount; s++) {
        const subAngle = angle + (Math.random() - 0.5) * 0.6;
        const subDistance = distance + 8 + Math.random() * 12;
        const subX = Math.cos(subAngle) * subDistance;
        const subZ = Math.sin(subAngle) * subDistance;
        
        const subLength = length * (0.4 + Math.random() * 0.3);
        const subBaseHeight = baseHeight * (0.35 + Math.random() * 0.25);
        const subTopHeight = subBaseHeight * 0.5;
        
        const subRidgeGeo = new THREE.ConeGeometry(subBaseHeight, subLength, 3, 1, false);
        subRidgeGeo.rotateZ(Math.PI / 2);
        subRidgeGeo.rotateX(Math.PI / 2);
        
        const subHue = hue + (Math.random() - 0.5) * 0.04;
        const subRidgeColor = new THREE.Color().setHSL(subHue, 0.68, 0.70);
        const subRidgeEmissive = subRidgeColor.clone().offsetHSL(0, -0.15, -0.06);
        
        const subRidgeMaterial = this.createCrystallineRidgeMaterial(subRidgeColor.getHex(), subRidgeEmissive.getHex());
        
        const subRidge = new THREE.Mesh(subRidgeGeo, subRidgeMaterial);
        subRidge.position.set(subX, subBaseHeight * 0.5 + 0.2, subZ);
        subRidge.rotation.y = Math.random() * Math.PI;
        subRidge.rotation.z = (Math.random() - 0.5) * 0.2;
        subRidge.castShadow = true;
        subRidge.receiveShadow = true;
        subRidge.name = 'subRidge';
        
        this.worldRoot.add(subRidge);
        this.visualObjects.push(subRidge);
        this.animatedObjects.push({
          object: subRidge,
          type: 'fractalRidge',
          baseZ: subRidge.rotation.z,
          baseEmissiveIntensity: 0.06,
          pulseSpeed: 0.4 + Math.random() * 0.2,
          phaseOffset: Math.random() * Math.PI * 2
        });
      }
    }
  }
  
  /**
   * Create floating micro-shards and fragments above dunes
   */
  createFloatingFragments() {
    const fragmentCount = 18;
    const fragments = [];
    
    if (!this.fragmentGlowTexture) {
      this.fragmentGlowTexture = this.createFragmentGlowTexture();
    }
    if (!this.fragmentOuterGlowTexture) {
      this.fragmentOuterGlowTexture = this.createFragmentOuterGlowTexture();
    }
    
    for (let f = 0; f < fragmentCount; f++) {
      const x = (Math.random() - 0.5) * 170;
      const z = (Math.random() - 0.5) * 170;
      const floatHeight = 3.5 + Math.random() * 9;
      const isMonument = f < 3;
      const size = isMonument ? 1.8 + Math.random() * 2.2 : 0.22 + Math.random() * 0.55;
      
      // Create geometric fragment with varied geometries
      let fragGeometry;
      const geoType = Math.random();
      if (geoType < 0.2) {
        fragGeometry = new THREE.OctahedronGeometry(size, 1);
      } else if (geoType < 0.4) {
        fragGeometry = new THREE.IcosahedronGeometry(size, 0);
      } else if (geoType < 0.6) {
        fragGeometry = new THREE.DodecahedronGeometry(size, 0);
      } else if (geoType < 0.8) {
        fragGeometry = new THREE.CylinderGeometry(size * 0.9, size * 0.9, size * 1.5, 4, 1, false);
      } else {
        fragGeometry = new THREE.TetrahedronGeometry(size);
      }
      
      const baseHue = 0.95 - (f / fragmentCount) * 0.18;
      const fragmentColor = new THREE.Color().setHSL(baseHue, 0.76, 0.71);
      const emissiveColor = fragmentColor.clone().offsetHSL(0, -0.18, -0.05);

      const fragMaterial = this.createPrismaticFragmentMaterial(fragmentColor.getHex(), isMonument);
      
      const fragment = new THREE.Mesh(fragGeometry, fragMaterial);
      fragment.position.set(x, floatHeight, z);
      fragment.castShadow = true;
      fragment.receiveShadow = true;
      fragment.name = 'floatingFragment';
      
      // Inner glow (brighter, closer to fragment)
      const innerGlowMaterial = new THREE.SpriteMaterial({
        map: this.fragmentGlowTexture,
        color: 0xffc8ff,
        transparent: true,
        opacity: isMonument ? 0.42 : 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const innerGlow = new THREE.Sprite(innerGlowMaterial);
      innerGlow.scale.set(size * 4.2, size * 4.2, 1);
      innerGlow.position.set(x, floatHeight - 0.02, z);
      innerGlow.renderOrder = 999;
      this.worldRoot.add(innerGlow);
      
      // Outer glow (larger, softer, more diffuse)
      const outerGlowMaterial = new THREE.SpriteMaterial({
        map: this.fragmentOuterGlowTexture,
        color: 0xc8a0ff,
        transparent: true,
        opacity: isMonument ? 0.25 : 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const outerGlow = new THREE.Sprite(outerGlowMaterial);
      outerGlow.scale.set(size * 7.5, size * 7.5, 1);
      outerGlow.position.set(x, floatHeight - 0.02, z);
      outerGlow.renderOrder = 998;
      this.worldRoot.add(outerGlow);

      const pointLight = new THREE.PointLight(fragmentColor, isMonument ? 0.18 : 0.12, size * 8, 2);
      pointLight.position.set(x, floatHeight + 0.35, z);
      pointLight.decay = 2;
      this.worldRoot.add(pointLight);
      this.pointLights.push(pointLight);

      fragment.userData = {
        baseY: floatHeight,
        floatSpeed: 0.35 + Math.random() * 0.3,
        floatAmount: 0.6 + Math.random() * 0.4,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.004,
          y: (Math.random() - 0.5) * 0.005,
          z: (Math.random() - 0.5) * 0.003
        },
        trailHue: baseHue,
        trailSize: size,
        innerGlow,
        outerGlow,
        pointLight
      };
      
      this.worldRoot.add(fragment);
      this.visualObjects.push(fragment);
      this.animatedObjects.push({
        object: fragment,
        type: 'floatFragment'
      });
      fragments.push(fragment);
    }

    const connections = [];
    const threshold = 15;
    for (let a = 0; a < fragments.length; a++) {
      for (let b = a + 1; b < fragments.length; b++) {
        const fa = fragments[a];
        const fb = fragments[b];
        const dx = fa.position.x - fb.position.x;
        const dz = fa.position.z - fb.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < threshold) {
          connections.push([fa, fb]);
        }
      }
    }

    if (connections.length > 0) {
      const linePositions = new Float32Array(connections.length * 6);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xd8a8ff,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });

      const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
      lineSegments.name = 'fragmentConnectionLines';
      this.worldRoot.add(lineSegments);
      this.fragmentLinkLines = {
        object: lineSegments,
        pairs: connections
      };
      this._updateFragmentConnectionLines();
    }
  }
  
  createVolumetricMaterial(colorA, colorB, speed, noiseScale, alpha) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) },
        uNoiseScale: { value: noiseScale },
        uSpeed: { value: speed },
        uAlpha: { value: alpha },
        uCameraPosition: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uNoiseScale;
        uniform float uSpeed;
        uniform float uAlpha;
        uniform vec3 uCameraPosition;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          float timeOffset = uTime * uSpeed;
          float n = fbm(vUv * uNoiseScale + vec2(timeOffset, timeOffset * 0.4));
          float stripe = smoothstep(0.16, 0.72, n);
          float band = 1.0 - abs(vUv.y - 0.5) * 2.0;
          band = clamp(band, 0.0, 1.0);
          vec3 color = mix(uColorA, uColorB, 0.5 + 0.5 * sin(uTime + vUv.x * 2.2 + vUv.y * 1.7));
          vec3 viewDir = normalize(uCameraPosition - vWorldPos);
          float facing = pow(clamp(dot(viewDir, vNormal), 0.0, 1.0), 0.35);
          float alpha = uAlpha * stripe * band * facing;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
  }

  createVolumetricLayer(y, size, speed, colorA, colorB, noiseScale, alpha) {
    const material = this.createVolumetricMaterial(colorA, colorB, speed, noiseScale, alpha);
    const layer = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), material);
    layer.rotation.x = -Math.PI / 2;
    layer.position.y = y;
    layer.name = `volumetricLayer_${y}`;
    this.worldRoot.add(layer);
    this.animatedObjects.push({
      object: layer,
      type: 'volumetricLayer',
      alpha,
      phase: Math.random() * Math.PI * 2
    });
  }

  createAtmosphericFogMaterial(color, noiseScale, speed, baseOpacity) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uNoiseScale: { value: noiseScale },
        uSpeed: { value: speed },
        uBaseOpacity: { value: baseOpacity }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uNoiseScale;
        uniform float uSpeed;
        uniform float uBaseOpacity;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.2;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          float noiseValue = fbm(vUv * uNoiseScale + vec2(uTime * uSpeed, uTime * uSpeed * 0.45));
          float band = smoothstep(0.14, 0.78, noiseValue);
          float vertical = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 1.8);
          float radial = 1.0 - length(vUv - 0.5) * 1.4;
          float alpha = uBaseOpacity * band * vertical * radial;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide
    });
  }

  createVolumetricEffects() {
    this.createVolumetricLayer(22, 300, 0.14, 0xffc5e8, 0xd1a3ff, 1.8, 0.10);
    this.createVolumetricLayer(28, 320, 0.20, 0xffdbf6, 0xb288ff, 2.2, 0.12);
    this.createVolumetricLayer(34, 340, 0.28, 0xffe8ff, 0x986dff, 2.8, 0.08);
  }

  /**
   * Create advanced cinematic 6-light system with realistic soft shadows
   */
  createSunGlow() {
    // Create soft glow texture for sun
    const glowSize = 256;
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowSize;
    glowCanvas.height = glowSize;
    const glowCtx = glowCanvas.getContext('2d');
    
    const glowGradient = glowCtx.createRadialGradient(
      glowSize / 2, glowSize / 2, 0,
      glowSize / 2, glowSize / 2, glowSize / 2
    );
    glowGradient.addColorStop(0.0, 'rgba(255, 250, 240, 1.0)');
    glowGradient.addColorStop(0.15, 'rgba(255, 245, 220, 0.8)');
    glowGradient.addColorStop(0.35, 'rgba(255, 235, 180, 0.5)');
    glowGradient.addColorStop(0.6, 'rgba(255, 210, 150, 0.2)');
    glowGradient.addColorStop(1.0, 'rgba(255, 180, 120, 0.0)');
    
    glowCtx.fillStyle = glowGradient;
    glowCtx.fillRect(0, 0, glowSize, glowSize);
    
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    glowTexture.minFilter = THREE.LinearFilter;
    glowTexture.magFilter = THREE.LinearFilter;
    
    // Create sun glow sprite
    const sunGlowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffffee,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const sunGlow = new THREE.Sprite(sunGlowMaterial);
    sunGlow.scale.set(40, 40, 1);
    sunGlow.name = 'sunGlow';
    this.worldRoot.add(sunGlow);
    this.sunGlow = sunGlow;
  }
  
  createCelestialBodies() {
    // Create subtle moon
    const moonGeometry = new THREE.SphereGeometry(8, 32, 32);
    const moonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0xe8e8f0) },
        uCraterColor: { value: new THREE.Color(0xc8c8d8) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uCraterColor;
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
        
        void main() {
          // Create crater-like surface texture
          float crater = noise(vUv * 8.0);
          crater += noise(vUv * 16.0) * 0.5;
          crater += noise(vUv * 32.0) * 0.25;
          crater = smoothstep(0.3, 0.7, crater);
          
          vec3 color = mix(uBaseColor, uCraterColor, crater * 0.4);
          
          // Add subtle glow
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          color += vec3(1.0, 1.0, 1.0) * fresnel * 0.15;
          
          gl_FragColor = vec4(color, 0.95);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false
    });
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(-180, 85, -200);
    moon.name = 'moon';
    this.worldRoot.add(moon);
    this.moon = moon;
    
    // Create star field
    const starCount = 400;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starBrightness = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 400 + Math.random() * 100;
      
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) + 50; // Keep above horizon
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      starSizes[i] = 1.0 + Math.random() * 2.0;
      starBrightness[i] = 0.3 + Math.random() * 0.7;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('aBrightness', new THREE.BufferAttribute(starBrightness, 1));
    
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.devicePixelRatio }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aBrightness;
        varying float vBrightness;
        uniform float uTime;
        uniform float uPixelRatio;
        
        void main() {
          vBrightness = aBrightness * (0.7 + 0.3 * sin(uTime * 0.5 + position.x * 0.01));
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vBrightness;
        
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float star = 1.0 - smoothstep(0.0, 1.0, dist);
          float glow = exp(-dist * 3.0) * 0.5;
          
          vec3 color = vec3(1.0, 0.98, 0.95) * (star + glow) * vBrightness;
          float alpha = (star + glow) * vBrightness;
          
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.name = 'starField';
    this.worldRoot.add(stars);
    this.stars = stars;
  }
  
  createCloudLayers() {
    // Create 3 cloud layers at different heights
    const cloudConfigs = [
      { y: 25, count: 5, scale: 80, speed: 0.03, opacity: 0.15 },
      { y: 32, count: 4, scale: 100, speed: 0.04, opacity: 0.12 },
      { y: 38, count: 3, scale: 120, speed: 0.02, opacity: 0.10 }
    ];
    
    this.cloudLayers = [];
    
    cloudConfigs.forEach((config, layerIndex) => {
      for (let i = 0; i < config.count; i++) {
        const cloudWidth = 60 + Math.random() * 40;
        const cloudHeight = 20 + Math.random() * 15;
        const cloudGeo = new THREE.PlaneGeometry(cloudWidth, cloudHeight, 32, 16);
        
        const cloudMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xfff5f0) },
            uSpeed: { value: config.speed + Math.random() * 0.02 },
            uNoiseScale: { value: 1.5 + Math.random() * 0.5 },
            uOpacity: { value: config.opacity },
            uPhase: { value: Math.random() * Math.PI * 2 }
          },
          vertexShader: `
            varying vec2 vUv;
            varying float vElevation;
            uniform float uTime;
            uniform float uNoiseScale;
            uniform float uPhase;
            
            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }
            
            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              float a = hash(i);
              float b = hash(i + vec2(1.0, 0.0));
              float c = hash(i + vec2(0.0, 1.0));
              float d = hash(i + vec2(1.0, 1.0));
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }
            
            void main() {
              vUv = uv;
              
              // Organic cloud shape with noise
              float n = noise(uv * uNoiseScale);
              float elevation = n * 3.0;
              vElevation = elevation;
              
              vec3 newPosition = position;
              newPosition.z += elevation;
              
              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            varying float vElevation;
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uSpeed;
            uniform float uOpacity;
            uniform float uPhase;
            
            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }
            
            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              float a = hash(i);
              float b = hash(i + vec2(1.0, 0.0));
              float c = hash(i + vec2(0.0, 1.0));
              float d = hash(i + vec2(1.0, 1.0));
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }
            
            float fbm(vec2 p) {
              float value = 0.0;
              float amplitude = 0.5;
              for (int i = 0; i < 4; i++) {
                value += amplitude * noise(p);
                p *= 2.0;
                amplitude *= 0.5;
              }
              return value;
            }
            
            void main() {
              vec2 uv = vUv;
              float time = uTime * uSpeed + uPhase;
              
              // Animated cloud texture
              float n1 = fbm(uv * 3.0 + vec2(time * 0.3, time * 0.2));
              float n2 = fbm(uv * 5.0 + vec2(time * 0.2, time * 0.4)) * 0.5;
              float n3 = fbm(uv * 8.0 + vec2(time * 0.5, time * 0.3)) * 0.25;
              
              float cloud = n1 + n2 + n3;
              
              // Soft edges
              float edge = 1.0 - length(uv - 0.5) * 2.0;
              edge = smoothstep(0.0, 0.5, edge);
              
              // Combine cloud density with edge falloff
              float density = cloud * 0.5 + 0.5;
              float alpha = uOpacity * density * edge;
              
              // Add subtle color variation
              vec3 color = uColor;
              color += vec3(0.05, 0.02, 0.0) * sin(time + uv.x * 5.0);
              
              if (alpha < 0.01) discard;
              gl_FragColor = vec4(color, alpha);
            }
          `,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.NormalBlending
        });
        
        const cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
        cloud.position.set(
          (Math.random() - 0.5) * 150,
          config.y,
          -80 - Math.random() * 60
        );
        cloud.rotation.x = -0.1;
        cloud.name = `cloud_${layerIndex}_${i}`;
        this.worldRoot.add(cloud);
        this.cloudLayers.push(cloud);
      }
    });
  }
  
  createAdvancedLighting() {
    const hemisphere = new THREE.HemisphereLight(0xffc0e8, 0xffb279, 0.7);
    this.worldRoot.add(hemisphere);

    this.sunLight = new THREE.DirectionalLight(0xffe8c4, 0.85);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.left = -150;
    this.sunLight.shadow.camera.right = 150;
    this.sunLight.shadow.camera.top = 150;
    this.sunLight.shadow.camera.bottom = -150;
    this.sunLight.shadow.bias = -0.00075;
    this.sunLight.shadow.radius = 6;
    this.sunLight.shadow.normalBias = 0.02;
    this.sunLight.target.position.set(0, 0, 0);
    this.worldRoot.add(this.sunLight.target);
    this.worldRoot.add(this.sunLight);

    const fillLight = new THREE.DirectionalLight(0x88ffff, 0.42);
    fillLight.position.set(-90, 35, -90);
    fillLight.castShadow = true;
    fillLight.shadow.mapSize.width = 2048;
    fillLight.shadow.mapSize.height = 2048;
    fillLight.shadow.radius = 3;
    this.worldRoot.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff99ff, 0.32);
    rimLight.position.set(30, 52, -110);
    rimLight.castShadow = false;
    this.worldRoot.add(rimLight);

    const bounceLight = new THREE.DirectionalLight(0xaa99ff, 0.25);
    bounceLight.position.set(-10, -30, 15);
    bounceLight.castShadow = false;
    this.worldRoot.add(bounceLight);

    const secondaryFill = new THREE.DirectionalLight(0xccffff, 0.18);
    secondaryFill.position.set(100, 18, -70);
    secondaryFill.castShadow = false;
    this.worldRoot.add(secondaryFill);

    const groundFill = new THREE.DirectionalLight(0xffe8dd, 0.1);
    groundFill.position.set(0, -50, 0);
    this.worldRoot.add(groundFill);
  }
  
  createAuroraCurtains() {
    const curtainCount = 8;
    
    for (let c = 0; c < curtainCount; c++) {
      const width = 60 + Math.random() * 40;
      const height = 25 + Math.random() * 15;
      const y = 45 + Math.random() * 15;
      const z = -80 - Math.random() * 40;
      const x = (Math.random() - 0.5) * 120;
      
      const curtainGeo = new THREE.PlaneGeometry(width, height, 40, 20);
      
      const curtainMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor1: { value: new THREE.Color(0x88ccff) },
          uColor2: { value: new THREE.Color(0x66aaff) },
          uColor3: { value: new THREE.Color(0x99ddff) },
          uSpeed: { value: 0.2 + Math.random() * 0.15 },
          uWaveAmplitude: { value: 2.0 + Math.random() * 1.5 },
          uWaveFrequency: { value: 0.1 + Math.random() * 0.05 },
          uAlpha: { value: 0.15 + Math.random() * 0.1 }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uWaveAmplitude;
          uniform float uWaveFrequency;
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            vUv = uv;
            
            // Wave distortion
            float wave1 = sin(position.x * uWaveFrequency + uTime * 2.0) * uWaveAmplitude;
            float wave2 = sin(position.x * uWaveFrequency * 1.5 + uTime * 1.5 + position.z * 0.1) * uWaveAmplitude * 0.5;
            float wave3 = cos(position.x * uWaveFrequency * 0.8 - uTime * 1.0) * uWaveAmplitude * 0.3;
            
            float waveOffset = wave1 + wave2 + wave3;
            vElevation = waveOffset;
            
            vec3 newPosition = position;
            newPosition.z += waveOffset;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          uniform float uSpeed;
          uniform float uAlpha;
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            // Horizontal flowing patterns
            float flow1 = sin(vUv.x * 10.0 + uTime * uSpeed + vElevation * 0.5) * 0.5 + 0.5;
            float flow2 = sin(vUv.x * 15.0 - uTime * uSpeed * 0.8 + vUv.y * 3.0) * 0.5 + 0.5;
            float flow3 = cos(vUv.x * 8.0 + uTime * uSpeed * 1.2 + vUv.y * 2.0) * 0.5 + 0.5;
            
            // Combine flows\n            float pattern = flow1 * 0.5 + flow2 * 0.3 + flow3 * 0.2;\            
            // Color mixing
            vec3 color = mix(uColor1, uColor2, pattern);
            color = mix(color, uColor3, flow2 * 0.5);
            
            // Vertical fade\n            float verticalFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
            
            // Horizontal fade\n            float horizontalFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
            
            // Add shimmer
            float shimmer = sin(vUv.x * 30.0 + uTime * 3.0 + vUv.y * 5.0) * 0.5 + 0.5;
            color += vec3(0.1, 0.1, 0.15) * shimmer * 0.3;
            
            float alpha = uAlpha * verticalFade * horizontalFade * (0.7 + pattern * 0.3);
            
            if (alpha < 0.01) discard;\n            gl_FragColor = vec4(color, alpha);\n          }\n        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      
      const curtain = new THREE.Mesh(curtainGeo, curtainMaterial);
      curtain.position.set(x, y, z);
      curtain.rotation.y = (Math.random() - 0.5) * 0.2;
      curtain.name = `auroraCurtain_${c}`;
      this.worldRoot.add(curtain);
      this.animatedObjects.push({
        object: curtain,
        type: 'auroraCurtain'
      });
    }
  }
  
  emitSandTrail(position, size) {
    if (!this.sandTrailSystem) {
      return;
    }

    const trail = this.sandTrailSystem;
    const emitCount = 3 + Math.floor(Math.random() * 3);
    
    for (let e = 0; e < emitCount; e++) {
      for (let i = 0; i < trail.count; i++) {
        if (trail.age[i] <= 0) {
          const idx = i * 3;
          trail.positions[idx] = position.x + (Math.random() - 0.5) * 0.3;
          trail.positions[idx + 1] = position.y + Math.random() * 0.2;
          trail.positions[idx + 2] = position.z + (Math.random() - 0.5) * 0.3;
          trail.sizes[i] = size * (0.8 + Math.random() * 0.4);
          trail.life[i] = 0.8 + Math.random() * 0.4;
          trail.age[i] = trail.life[i];
          trail.alphas[i] = 1.0;
          trail.object.geometry.attributes.position.needsUpdate = true;
          trail.object.geometry.attributes.aSize.needsUpdate = true;
          trail.object.geometry.attributes.aAlpha.needsUpdate = true;
          break;
        }
      }
    }
  }
  
  /**
   * Create advanced particle systems
   */
  createParticleShaderMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.devicePixelRatio }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aHue;
        attribute float aPhase;
        attribute float aAlpha;
        varying float vHue;
        varying float vAlpha;
        varying float vPhase;
        uniform float uTime;
        uniform float uPixelRatio;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vHue = aHue;
          vAlpha = aAlpha * (0.7 + 0.3 * sin(uTime * 3.2 + aPhase));
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float size = aSize * (1.0 + 0.35 * sin(uTime * 2.1 + aPhase));
          gl_PointSize = size * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vHue;
        varying float vAlpha;
        uniform float uTime;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float mask = smoothstep(0.85, 0.0, dist);
          float glow = pow(1.0 - dist, 2.0);
          vec3 color = hsv2rgb(vec3(vHue, 0.78, 1.0));
          float alpha = clamp(vAlpha * mask * glow, 0.0, 1.0);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: false
    });
  }

  createParticleSystems() {
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const hues = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);
    const alphas = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 220;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.011;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.011;
      
      sizes[i] = 8.0 + Math.random() * 10.0;
      hues[i] = 0.92 + Math.random() * 0.08;
      phases[i] = Math.random() * Math.PI * 2;
      alphas[i] = 0.65 + Math.random() * 0.25;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aHue', new THREE.BufferAttribute(hues, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    
    const particleMaterial = this.createParticleShaderMaterial();
    const particles = new THREE.Points(geometry, particleMaterial);
    particles.name = 'dreamParticles';
    this.worldRoot.add(particles);
    this.particleSystems.push({
      object: particles,
      positions,
      velocities,
      bounds: 120,
      count: particleCount
    });
    this.animatedObjects.push({
      object: particles,
      type: 'particles'
    });
    
    const dustDevilCount = 42;
    const dustDevilGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustDevilCount * 3);
    const dustAngles = new Float32Array(dustDevilCount);
    const dustBaseRadius = new Float32Array(dustDevilCount);
    const dustHeights = new Float32Array(dustDevilCount);
    const dustBaseHeights = new Float32Array(dustDevilCount);
    const dustHeightRanges = new Float32Array(dustDevilCount);
    const dustRiseSpeeds = new Float32Array(dustDevilCount);
    const dustSpeeds = new Float32Array(dustDevilCount);
    const dustSizes = new Float32Array(dustDevilCount);
    const dustHues = new Float32Array(dustDevilCount);
    const dustPhases = new Float32Array(dustDevilCount);
    const dustAlphas = new Float32Array(dustDevilCount);
    const dustCenterX = new Float32Array(dustDevilCount);
    const dustCenterZ = new Float32Array(dustDevilCount);

    for (let i = 0; i < dustDevilCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4.5 + Math.random() * 8.5;
      const baseHeight = 0.4 + Math.random() * 1.2;
      const heightRange = 8 + Math.random() * 10;
      const xOffset = (Math.random() - 0.5) * 6.0;
      const zOffset = (Math.random() - 0.5) * 6.0;
      const speed = 1.1 + Math.random() * 0.6;
      const riseSpeed = 0.45 + Math.random() * 0.25;
      const x = xOffset + Math.cos(angle) * radius;
      const z = zOffset + Math.sin(angle) * radius;
      dustPositions[i * 3] = x;
      dustPositions[i * 3 + 1] = baseHeight;
      dustPositions[i * 3 + 2] = z;
      dustAngles[i] = angle;
      dustBaseRadius[i] = radius;
      dustBaseHeights[i] = baseHeight;
      dustHeights[i] = baseHeight;
      dustHeightRanges[i] = heightRange;
      dustRiseSpeeds[i] = riseSpeed;
      dustSpeeds[i] = speed;
      dustSizes[i] = 6.0 + Math.random() * 6.0;
      dustHues[i] = 0.88 + Math.random() * 0.08;
      dustPhases[i] = Math.random() * Math.PI * 2;
      dustAlphas[i] = 0.4 + Math.random() * 0.2;
      dustCenterX[i] = xOffset;
      dustCenterZ[i] = zOffset;
    }
    
    dustDevilGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustDevilGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSizes, 1));
    dustDevilGeo.setAttribute('aHue', new THREE.BufferAttribute(dustHues, 1));
    dustDevilGeo.setAttribute('aPhase', new THREE.BufferAttribute(dustPhases, 1));
    dustDevilGeo.setAttribute('aAlpha', new THREE.BufferAttribute(dustAlphas, 1));

    const dustDevilMaterial = this.createParticleShaderMaterial();
    const dustDevil = new THREE.Points(dustDevilGeo, dustDevilMaterial);
    dustDevil.name = 'dustDevilParticles';
    this.worldRoot.add(dustDevil);
    this.particleSystems.push({
      object: dustDevil,
      type: 'dustDevil',
      positions: dustPositions,
      angles: dustAngles,
      baseRadius: dustBaseRadius,
      heights: dustHeights,
      baseHeights: dustBaseHeights,
      heightRanges: dustHeightRanges,
      riseSpeeds: dustRiseSpeeds,
      speeds: dustSpeeds,
      centerX: dustCenterX,
      centerZ: dustCenterZ,
      count: dustDevilCount
    });
    this.animatedObjects.push({
      object: dustDevil,
      type: 'dustDevil'
    });
    
    const trailCount = 56;
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailCount * 3);
    const trailSizes = new Float32Array(trailCount);
    const trailHues = new Float32Array(trailCount);
    const trailPhases = new Float32Array(trailCount);
    const trailAlphas = new Float32Array(trailCount);
    const trailLife = new Float32Array(trailCount);
    const trailAge = new Float32Array(trailCount);

    for (let i = 0; i < trailCount; i++) {
      trailPositions[i * 3] = 0;
      trailPositions[i * 3 + 1] = -1000;
      trailPositions[i * 3 + 2] = 0;
      trailSizes[i] = 4.0;
      trailHues[i] = 0.92;
      trailPhases[i] = Math.random() * Math.PI * 2;
      trailAlphas[i] = 0.0;
      trailLife[i] = 0.0;
      trailAge[i] = 0.0;
    }
    
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('aSize', new THREE.BufferAttribute(trailSizes, 1));
    trailGeo.setAttribute('aHue', new THREE.BufferAttribute(trailHues, 1));
    trailGeo.setAttribute('aPhase', new THREE.BufferAttribute(trailPhases, 1));
    trailGeo.setAttribute('aAlpha', new THREE.BufferAttribute(trailAlphas, 1));

    const trailMaterial = this.createParticleShaderMaterial();
    const trailPoints = new THREE.Points(trailGeo, trailMaterial);
    trailPoints.name = 'fragmentTrailParticles';
    this.worldRoot.add(trailPoints);
    this.fragmentTrailSystem = {
      object: trailPoints,
      positions: trailPositions,
      sizes: trailSizes,
      hues: trailHues,
      phases: trailPhases,
      alphas: trailAlphas,
      life: trailLife,
      age: trailAge,
      count: trailCount
    };
    this.animatedObjects.push({
      object: trailPoints,
      type: 'fragmentTrails'
    });
    
    const shimmerCount = 90;
    const shimmerGeo = new THREE.BufferGeometry();
    
    const shimmerPos = new Float32Array(shimmerCount * 3);
    const shimmerVel = new Float32Array(shimmerCount * 3);
    
    for (let i = 0; i < shimmerCount; i++) {
      shimmerPos[i * 3] = (Math.random() - 0.5) * 220;
      shimmerPos[i * 3 + 1] = 0.5 + Math.random() * 14;
      shimmerPos[i * 3 + 2] = (Math.random() - 0.5) * 220;
      
      shimmerVel[i * 3] = (Math.random() - 0.5) * 0.008;
      shimmerVel[i * 3 + 1] = (Math.random() - 0.5) * 0.006;
      shimmerVel[i * 3 + 2] = (Math.random() - 0.5) * 0.008;
    }
    
    shimmerGeo.setAttribute('position', new THREE.BufferAttribute(shimmerPos, 3));
    shimmerGeo.setAttribute('velocity', new THREE.BufferAttribute(shimmerVel, 3));
    
    const shimmerMaterial = new THREE.PointsMaterial({
      color: 0xffffcc,
      size: 0.07,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.22,
      fog: false
    });
    
    const shimmerParticles = new THREE.Points(shimmerGeo, shimmerMaterial);
    shimmerParticles.name = 'shimmerParticles';
    
    this.worldRoot.add(shimmerParticles);
    this.particleSystems.push({
      object: shimmerParticles,
      positions: shimmerPos,
      velocities: shimmerVel,
      bounds: 120
    });
    
    this.animatedObjects.push({
      object: shimmerParticles,
      type: 'shimmerParticles'
    });
    
    // Firefly system - small yellow particles near ground
    const fireflyCount = 150;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPositions = new Float32Array(fireflyCount * 3);
    const fireflySizes = new Float32Array(fireflyCount);
    const fireflyHues = new Float32Array(fireflyCount);
    const fireflyPhases = new Float32Array(fireflyCount);
    const fireflyAlphas = new Float32Array(fireflyCount);
    const fireflyHeights = new Float32Array(fireflyCount);
    const fireflyBaseHeights = new Float32Array(fireflyCount);
    
    for (let i = 0; i < fireflyCount; i++) {
      fireflyPositions[i * 3] = (Math.random() - 0.5) * 180;
      fireflyPositions[i * 3 + 1] = 0.2 + Math.random() * 2.5;
      fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 180;
      
      fireflySizes[i] = 3.0 + Math.random() * 4.0;
      fireflyHues[i] = 0.12 + Math.random() * 0.08; // Yellow-orange range
      fireflyPhases[i] = Math.random() * Math.PI * 2;
      fireflyAlphas[i] = 0.4 + Math.random() * 0.3;
      fireflyHeights[i] = fireflyPositions[i * 3 + 1];
      fireflyBaseHeights[i] = fireflyPositions[i * 3 + 1];
    }
    
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
    fireflyGeo.setAttribute('aSize', new THREE.BufferAttribute(fireflySizes, 1));
    fireflyGeo.setAttribute('aHue', new THREE.BufferAttribute(fireflyHues, 1));
    fireflyGeo.setAttribute('aPhase', new THREE.BufferAttribute(fireflyPhases, 1));
    fireflyGeo.setAttribute('aAlpha', new THREE.BufferAttribute(fireflyAlphas, 1));
    
    const fireflyMaterial = this.createParticleShaderMaterial();
    const fireflies = new THREE.Points(fireflyGeo, fireflyMaterial);
    fireflies.name = 'fireflyParticles';
    this.worldRoot.add(fireflies);
    this.particleSystems.push({
      object: fireflies,
      type: 'firefly',
      positions: fireflyPositions,
      heights: fireflyHeights,
      baseHeights: fireflyBaseHeights,
      count: fireflyCount
    });
    this.animatedObjects.push({
      object: fireflies,
      type: 'firefly'
    });
    
    // Sand particle trails system
    const sandTrailCount = 300;
    const sandTrailGeo = new THREE.BufferGeometry();
    const sandTrailPositions = new Float32Array(sandTrailCount * 3);
    const sandTrailSizes = new Float32Array(sandTrailCount);
    const sandTrailHues = new Float32Array(sandTrailCount);
    const sandTrailPhases = new Float32Array(sandTrailCount);
    const sandTrailAlphas = new Float32Array(sandTrailCount);
    const sandTrailLife = new Float32Array(sandTrailCount);
    const sandTrailAge = new Float32Array(sandTrailCount);
    
    for (let i = 0; i < sandTrailCount; i++) {
      sandTrailPositions[i * 3] = 0;
      sandTrailPositions[i * 3 + 1] = -1000;
      sandTrailPositions[i * 3 + 2] = 0;
      sandTrailSizes[i] = 2.0 + Math.random() * 2.0;
      sandTrailHues[i] = 0.08 + Math.random() * 0.04; // Sand colors
      sandTrailPhases[i] = Math.random() * Math.PI * 2;
      sandTrailAlphas[i] = 0.0;
      sandTrailLife[i] = 0.0;
      sandTrailAge[i] = 0.0;
    }
    
    sandTrailGeo.setAttribute('position', new THREE.BufferAttribute(sandTrailPositions, 3));
    sandTrailGeo.setAttribute('aSize', new THREE.BufferAttribute(sandTrailSizes, 1));
    sandTrailGeo.setAttribute('aHue', new THREE.BufferAttribute(sandTrailHues, 1));
    sandTrailGeo.setAttribute('aPhase', new THREE.BufferAttribute(sandTrailPhases, 1));
    sandTrailGeo.setAttribute('aAlpha', new THREE.BufferAttribute(sandTrailAlphas, 1));
    
    const sandTrailMaterial = this.createParticleShaderMaterial();
    const sandTrails = new THREE.Points(sandTrailGeo, sandTrailMaterial);
    sandTrails.name = 'sandTrailParticles';
    this.worldRoot.add(sandTrails);
    this.sandTrailSystem = {
      object: sandTrails,
      positions: sandTrailPositions,
      sizes: sandTrailSizes,
      hues: sandTrailHues,
      phases: sandTrailPhases,
      alphas: sandTrailAlphas,
      life: sandTrailLife,
      age: sandTrailAge,
      count: sandTrailCount
    };
    this.particleSystems.push({
      object: sandTrails,
      type: 'sandTrails'
    });
    this.animatedObjects.push({
      object: sandTrails,
      type: 'sandTrails'
    });
    
    // Aurora-like curtains at higher altitude
    this.createAuroraCurtains();
  }
  
  /**
   * Create atmospheric scattering and light shafts for dream realism
   */
  createAtmosphericScattering() {
    // Create multiple animated mist layers for organic depth
    const mistGeo1 = new THREE.PlaneGeometry(280, 280);
    const mistMat1 = this.createAtmosphericFogMaterial(0xe8c0d0, 2.4, 0.05, 0.12);
    const mist1 = new THREE.Mesh(mistGeo1, mistMat1);
    mist1.position.y = 0.5;
    mist1.rotation.x = -Math.PI / 2;
    mist1.name = 'fogLayerGround';
    this.worldRoot.add(mist1);
    this.animatedObjects.push({ object: mist1, type: 'fogLayer', phase: 0.1 });

    const mistGeo2 = new THREE.PlaneGeometry(300, 300);
    const mistMat2 = this.createAtmosphericFogMaterial(0xf0d8e8, 2.0, 0.08, 0.09);
    const mist2 = new THREE.Mesh(mistGeo2, mistMat2);
    mist2.position.y = 15;
    mist2.rotation.x = -Math.PI / 2;
    mist2.name = 'fogLayerMid';
    this.worldRoot.add(mist2);
    this.animatedObjects.push({ object: mist2, type: 'fogLayer', phase: 1.1 });

    const mistGeo3 = new THREE.PlaneGeometry(350, 350);
    const mistMat3 = this.createAtmosphericFogMaterial(0xffe8f0, 1.6, 0.12, 0.07);
    const mist3 = new THREE.Mesh(mistGeo3, mistMat3);
    mist3.position.y = 35;
    mist3.rotation.x = -Math.PI / 2;
    mist3.name = 'fogLayerHigh';
    this.worldRoot.add(mist3);
    this.animatedObjects.push({ object: mist3, type: 'fogLayer', phase: 2.4 });

    // Horizon glow ring
    const horizonGeom = new THREE.RingGeometry(76, 92, 96, 1);
    const horizonMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorInner: { value: new THREE.Color(0xffcbf0) },
        uColorOuter: { value: new THREE.Color(0x9546ff) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColorInner;
        uniform vec3 uColorOuter;

        void main() {
          float radius = length(vUv - 0.5);
          float ring = smoothstep(0.38, 0.36, radius) - smoothstep(0.46, 0.44, radius);
          float pulse = 0.6 + 0.4 * sin(uTime * 1.6 + radius * 14.0);
          vec3 color = mix(uColorOuter, uColorInner, smoothstep(0.3, 0.5, radius));
          float alpha = ring * pulse * 0.85;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const horizonRing = new THREE.Mesh(horizonGeom, horizonMat);
    horizonRing.rotation.x = 0;
    horizonRing.position.set(0, 18, -112);
    horizonRing.name = 'horizonGlowRing';
    this.worldRoot.add(horizonRing);
    this.animatedObjects.push({ object: horizonRing, type: 'fogLayer', phase: 3.5 });

    // Enhanced volumetric light shafts with shader
    const rayGeo = new THREE.PlaneGeometry(200, 200, 1, 1);
    const rayMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xffeedd) },
        uOpacity: { value: 0.08 },
        uSpeed: { value: 0.15 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uSpeed;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        void main() {
          float t = uTime * uSpeed;
          
          // Multiple noise layers for volumetric effect
          float n1 = noise(vUv * 3.0 + vec2(t * 0.5, t * 0.3));
          float n2 = noise(vUv * 6.0 + vec2(t * 0.7, t * 0.5)) * 0.5;
          float n3 = noise(vUv * 12.0 + vec2(t, t * 0.8)) * 0.25;
          
          float combined = n1 + n2 + n3;
          
          // Diagonal beam pattern
          float beam = abs(vUv.x - vUv.y * 0.6);
          beam = 1.0 - smoothstep(0.0, 0.3, beam);
          
          // Vertical fade
          float vertical = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
          
          float alpha = uOpacity * combined * beam * vertical;
          
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const rays = new THREE.Mesh(rayGeo, rayMat);
    rays.position.set(30, 20, 40);
    rays.rotation.x = -0.3;
    rays.name = 'lightShafts';
    this.worldRoot.add(rays);
    this.animatedObjects.push({
      object: rays,
      type: 'lightShafts',
      angle: 0
    });
    
    // Atmospheric haze layer near horizon
    const hazeGeo = new THREE.PlaneGeometry(320, 60, 1, 1);
    const hazeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorTop: { value: new THREE.Color(0xffd8e8) },
        uColorBottom: { value: new THREE.Color(0xffa0c0) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        void main() {
          // Vertical gradient
          float vGradient = vUv.y;
          
          // Horizontal variation
          float hNoise = noise(vUv * 2.0 + uTime * 0.1);
          
          // Subtle animation
          float pulse = 0.8 + 0.2 * sin(uTime * 0.5 + vUv.x * 6.0);
          
          vec3 color = mix(uColorBottom, uColorTop, vGradient);
          float alpha = 0.15 * vGradient * (1.0 - abs(vUv.x - 0.5) * 1.5) * pulse * (0.8 + 0.2 * hNoise);
          
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide
    });
    const haze = new THREE.Mesh(hazeGeo, hazeMat);
    haze.position.set(0, 12, -100);
    haze.rotation.x = -Math.PI / 2 + 0.15;
    haze.name = 'horizonHaze';
    this.worldRoot.add(haze);
    this.animatedObjects.push({ object: haze, type: 'fogLayer', phase: 4.2 });
  }
  
  /**
   * Create invisible collision layer
   */
  createCollisionLayer() {
    const invisibleMaterial = materialRegistry.getBasic('world.dreamdesert2.collision', {
      transparent: true,
      opacity: 0,
      wireframe: false
    });
    
    // Main terrain collision
    const collisionGeo = new THREE.PlaneGeometry(240, 240, 80, 80);
    
    const positionAttribute = collisionGeo.getAttribute('position');
    const positions = positionAttribute.array;
    
    // Match dune heights exactly
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      positions[i + 1] = this.sampleTerrainHeight(x, z);
    }
    
    positionAttribute.needsUpdate = true;
    collisionGeo.computeVertexNormals();
    
    const collisionTerrain = new THREE.Mesh(collisionGeo, invisibleMaterial);
    collisionTerrain.rotation.x = -Math.PI / 2;
    collisionTerrain.userData = {
      isWalkable: true,
      collisionEnabled: true,
      terrainType: 'mainDunes'
    };
    
    this.worldRoot.add(collisionTerrain);
    this.collisionObjects.push(collisionTerrain);
    
    // Collision for ridges (11 main + sub-ridges approximation)
    const ridgeCount = 11;
    for (let r = 0; r < ridgeCount; r++) {
      const angle = (r / ridgeCount) * Math.PI * 2;
      const distance = 40 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      const length = 18 + Math.random() * 22;
      const height = 2.5 + Math.random() * 3.5;
      
      const collider = new THREE.Mesh(
        new THREE.BoxGeometry(length, height, 0.9),
        invisibleMaterial
      );
      collider.position.set(x, height * 0.5 + 0.3, z);
      collider.rotation.y = Math.random() * Math.PI;
      collider.rotation.z = (Math.random() - 0.5) * 0.12;
      collider.userData = {
        isWalkable: true,
        collisionEnabled: true,
        terrainType: 'fractalRidge',
        height: height
      };
      
      this.worldRoot.add(collider);
      this.collisionObjects.push(collider);
      
      // Add sub-ridge collision (2-3 per main ridge)
      const subRidgeCount = 2 + Math.floor(Math.random() * 2);
      for (let s = 0; s < subRidgeCount; s++) {
        const subAngle = angle + (Math.random() - 0.5) * 0.6;
        const subDistance = distance + 8 + Math.random() * 12;
        const subX = Math.cos(subAngle) * subDistance;
        const subZ = Math.sin(subAngle) * subDistance;
        
        const subLength = length * (0.4 + Math.random() * 0.3);
        const subHeight = height * (0.35 + Math.random() * 0.25);
        
        const subCollider = new THREE.Mesh(
          new THREE.BoxGeometry(subLength, subHeight, 0.6),
          invisibleMaterial
        );
        subCollider.position.set(subX, subHeight * 0.5 + 0.2, subZ);
        subCollider.rotation.y = Math.random() * Math.PI;
        subCollider.rotation.z = (Math.random() - 0.5) * 0.15;
        subCollider.userData = {
          isWalkable: true,
          collisionEnabled: true,
          terrainType: 'subRidge',
          height: subHeight
        };
        
        this.worldRoot.add(subCollider);
        this.collisionObjects.push(subCollider);
      }
    }
    
    // Collision for fragments
    const fragmentCount = 18;
    for (let f = 0; f < fragmentCount; f++) {
      const x = (Math.random() - 0.5) * 170;
      const z = (Math.random() - 0.5) * 170;
      const floatHeight = 3.5 + Math.random() * 9;
      const size = 0.22 + Math.random() * 0.55;
      
      const collider = new THREE.Mesh(
        new THREE.BoxGeometry(size * 1.4, size * 1.4, size * 1.4),
        invisibleMaterial
      );
      collider.position.set(x, floatHeight, z);
      collider.userData = {
        isWalkable: true,
        collisionEnabled: true,
        terrainType: 'floatingFragment'
      };
      
      this.worldRoot.add(collider);
      this.collisionObjects.push(collider);
    }
  }
  
  /**
   * Get collision objects for physics
   */
  getCollisionObjects() {
    return this.collisionObjects;
  }
  
  /**
   * Get current wind direction and strength
   */
  getWind() {
    return {
      direction: this.windDirection.clone(),
      strength: this.windStrength * (0.8 + (Math.sin(this.windTime * 0.3) * 0.5 + 0.5) * 0.4)
    };
  }
  
  /**
   * Emit sand particles at position (call when moving on dunes)
   */
  emitSandParticles(position, count = 3, size = 1.0) {
    for (let i = 0; i < count; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 0.5
      );
      this.emitSandTrail(position.clone().add(offset), size);
    }
  }
  
  /**
   * Update animations and effects
   */
  update(deltaTime, time) {
    // Update reference plane (canonical contract)
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    
    // Update wind with time-varying direction
    this.windTime += deltaTime;
    const windVariation = Math.sin(this.windTime * 0.3) * 0.5 + 0.5;
    this.windDirection.set(
      Math.sin(this.windTime * 0.15) * 0.7 + 0.3,
      0.05 + Math.sin(this.windTime * 0.2) * 0.08,
      Math.cos(this.windTime * 0.12) * 0.5 + 0.5
    ).normalize();
    const currentWindStrength = this.windStrength * (0.8 + windVariation * 0.4);
    
    this.animatedObjects.forEach(obj => {
      // Float fragments with rotation
      if (obj.type === 'floatFragment') {
        const data = obj.object.userData;
        
        // Update shader uniforms if using prismatic material
        if (obj.object.material.uniforms) {
          obj.object.material.uniforms.uTime.value = time;
          obj.object.material.uniforms.uCameraPosition.value.copy(this.camera.position);
        }
        
        // Smooth bobbing motion
        const float = Math.sin(time * data.floatSpeed + data.floatOffset) * data.floatAmount;
        obj.object.position.y = data.baseY + float;
        
        // Smooth rotation
        obj.object.rotation.x += data.rotationSpeed.x;
        obj.object.rotation.y += data.rotationSpeed.y;
        obj.object.rotation.z += data.rotationSpeed.z;

        if (data.innerGlow) {
          data.innerGlow.position.set(obj.object.position.x, obj.object.position.y - 0.02, obj.object.position.z);
        }
        if (data.outerGlow) {
          data.outerGlow.position.set(obj.object.position.x, obj.object.position.y - 0.02, obj.object.position.z);
        }
        if (data.pointLight) {
          data.pointLight.position.set(obj.object.position.x, obj.object.position.y + 0.35, obj.object.position.z);
        }
        if (time - (data.lastTrailTime || 0) > 0.14) {
          data.lastTrailTime = time;
          this.emitFragmentTrail(obj.object.position, data.trailHue, data.trailSize);
        }
      }
      
      // Drifting particles with wind
      if (obj.type === 'particles') {
        const psData = this.particleSystems.find(ps => ps.object === obj.object);
        if (psData) {
          const positions = psData.object.geometry.attributes.position.array;
          const velocities = psData.velocities;
          
          for (let i = 0; i < positions.length; i += 3) {
            // Apply wind influence to velocity
            velocities[i] += this.windDirection.x * currentWindStrength * 0.1;
            velocities[i + 1] += this.windDirection.y * currentWindStrength * 0.1;
            velocities[i + 2] += this.windDirection.z * currentWindStrength * 0.1;
            
            // Apply damping
            velocities[i] *= 0.99;
            velocities[i + 1] *= 0.99;
            velocities[i + 2] *= 0.99;
            
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Wrap around with smooth falloff
            if (Math.abs(positions[i]) > psData.bounds) {
              positions[i] = -positions[i];
              velocities[i] = -velocities[i];
            }
            if (positions[i + 1] > 45) {
              positions[i + 1] = -2;
              velocities[i + 1] = Math.abs(velocities[i + 1]);
            }
            if (Math.abs(positions[i + 2]) > psData.bounds) {
              positions[i + 2] = -positions[i + 2];
              velocities[i + 2] = -velocities[i + 2];
            }
          }
          
          obj.object.geometry.attributes.position.needsUpdate = true;
        }
      }
      
      // Shimmer particles with wind
      if (obj.type === 'shimmerParticles') {
        const psData = this.particleSystems.find(ps => ps.object === obj.object);
        if (psData) {
          const positions = psData.object.geometry.attributes.position.array;
          const velocities = psData.velocities;
          
          for (let i = 0; i < positions.length; i += 3) {
            // Apply wind influence
            velocities[i] += this.windDirection.x * currentWindStrength * 0.05;
            velocities[i + 2] += this.windDirection.z * currentWindStrength * 0.05;
            
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            if (Math.abs(positions[i]) > psData.bounds) {
              positions[i] = -positions[i];
              velocities[i] = -velocities[i];
            }
            if (positions[i + 1] > 20) {
              positions[i + 1] = 0.5;
              velocities[i + 1] = Math.abs(velocities[i + 1]);
            }
            if (Math.abs(positions[i + 2]) > psData.bounds) {
              positions[i + 2] = -positions[i + 2];
              velocities[i + 2] = -velocities[i + 2];
            }
          }
          
          obj.object.geometry.attributes.position.needsUpdate = true;
        }
      }

      // Firefly particles
      if (obj.type === 'firefly') {
        const psData = this.particleSystems.find(ps => ps.object === obj.object);
        if (psData) {
          const positions = psData.object.geometry.attributes.position.array;
          
          for (let i = 0; i < psData.count; i++) {
            const idx = i * 3;
            
            // Gentle floating motion
            positions[idx + 1] = psData.baseHeights[i] + Math.sin(time * 0.8 + i * 0.5) * 0.3;
            
            // Apply wind distortion (lighter effect for fireflies)
            positions[idx] += this.windDirection.x * currentWindStrength * deltaTime * 0.5;
            positions[idx + 2] += this.windDirection.z * currentWindStrength * deltaTime * 0.5;
            
            // Wrap around
            if (Math.abs(positions[idx]) > 120) {
              positions[idx] = -positions[idx] * 0.9;
            }
            if (Math.abs(positions[idx + 2]) > 120) {
              positions[idx + 2] = -positions[idx + 2] * 0.9;
            }
          }
          
          obj.object.geometry.attributes.position.needsUpdate = true;
        }
      }

      // Sand trail particles
      if (obj.type === 'sandTrails') {
        const trails = this.sandTrailSystem;
        if (trails) {
          let changed = false;
          for (let i = 0; i < trails.count; i++) {
            if (trails.age[i] > 0) {
              trails.age[i] -= deltaTime;
              
              if (trails.age[i] <= 0) {
                trails.age[i] = 0;
                trails.alphas[i] = 0;
              } else {
                const idx = i * 3;
                const t = trails.age[i] / trails.life[i];
                trails.alphas[i] = t * t;
                
                // Apply wind distortion to sand particles
                trails.positions[idx] += this.windDirection.x * currentWindStrength * deltaTime * 2.0;
                trails.positions[idx + 1] -= deltaTime * 0.3; // Gravity
                trails.positions[idx + 2] += this.windDirection.z * currentWindStrength * deltaTime * 2.0;
                
                // Ground collision
                if (trails.positions[idx + 1] < 0.1) {
                  trails.positions[idx + 1] = 0.1;
                  trails.age[i] *= 0.8; // Fade faster on ground
                }
              }
              changed = true;
            }
          }
          if (changed) {
            obj.object.geometry.attributes.position.needsUpdate = true;
            obj.object.geometry.attributes.aAlpha.needsUpdate = true;
          }
        }
      }

      // Aurora curtains
      if (obj.type === 'auroraCurtain') {
        if (obj.object.material && obj.object.material.uniforms) {
          obj.object.material.uniforms.uTime.value = time;
        }
      }

      // Dust devil spiral particles
      if (obj.type === 'dustDevil') {
        const psData = this.particleSystems.find(ps => ps.object === obj.object);
        if (psData) {
          const positions = psData.object.geometry.attributes.position.array;
          for (let i = 0; i < psData.count; i++) {
            psData.angles[i] += psData.speeds[i] * deltaTime;
            psData.heights[i] += psData.riseSpeeds[i] * deltaTime;

            const idx = i * 3;
            const heightProgress = (psData.heights[i] - psData.baseHeights[i]) / psData.heightRanges[i];
            const t = Math.min(Math.max(heightProgress, 0.0), 1.0);
            const radius = Math.max(0.1, psData.baseRadius[i] * (1.0 - t));

            positions[idx] = psData.centerX[i] + Math.cos(psData.angles[i]) * radius;
            positions[idx + 2] = psData.centerZ[i] + Math.sin(psData.angles[i]) * radius;
            positions[idx + 1] = psData.heights[i];

            if (t >= 1.0) {
              psData.angles[i] = Math.random() * Math.PI * 2;
              psData.heights[i] = psData.baseHeights[i];
              psData.baseRadius[i] = 4.5 + Math.random() * 8.5;
              psData.centerX[i] = (Math.random() - 0.5) * 6.0;
              psData.centerZ[i] = (Math.random() - 0.5) * 6.0;
            }
          }
          obj.object.geometry.attributes.position.needsUpdate = true;
        }
      }

      // Fragment trail particles
      if (obj.type === 'fragmentTrails') {
        const trails = this.fragmentTrailSystem;
        if (trails) {
          let changed = false;
          for (let i = 0; i < trails.count; i++) {
            if (trails.age[i] > 0) {
              trails.age[i] -= deltaTime;
              if (trails.age[i] <= 0) {
                trails.age[i] = 0;
                trails.alphas[i] = 0;
              } else {
                const t = trails.age[i] / trails.life[i];
                trails.alphas[i] = t * t;
              }
              changed = true;
            }
          }
          if (changed) {
            obj.object.geometry.attributes.aAlpha.needsUpdate = true;
          }
        }
      }
      
      // Shader-based volumetric layers
      if (obj.type === 'volumetricLayer') {
        obj.object.material.uniforms.uTime.value = time + obj.phase;
        obj.object.material.uniforms.uCameraPosition.value.copy(this.camera.position);
      }

      if (obj.type === 'fogLayer') {
        if (obj.object.material && obj.object.material.uniforms) {
          obj.object.material.uniforms.uTime.value = time + obj.phase;
        }
      }

      // Animate sun orbit
      if (this.sunLight) {
        const sunAngle = time * this.sunOrbitSpeed;
        const sunX = Math.cos(sunAngle) * this.sunOrbitRadius;
        const sunZ = Math.sin(sunAngle) * this.sunOrbitRadius;
        const sunY = 65 + Math.sin(sunAngle * 0.4) * 8;
        this.sunLight.position.set(sunX, sunY, sunZ);
        this.sunLight.target.position.set(0, 0, 0);
        
        // Enhanced golden hour effect - color varies by sun height
        const sunHeight = (sunY - 57) / 16; // normalized 0-1
        const warmColor = new THREE.Color(0xffaa88);
        const coolColor = new THREE.Color(0xffe8c4);
        const sunsetColor = new THREE.Color(0xff8866);
        const noonColor = new THREE.Color(0xffffee);
        
        let sunColor;
        if (sunHeight < 0.3) {
          sunColor = warmColor.clone().lerp(coolColor, sunHeight / 0.3);
        } else if (sunHeight > 0.7) {
          sunColor = coolColor.clone().lerp(noonColor, (sunHeight - 0.7) / 0.3);
        } else {
          sunColor = coolColor.clone();
        }
        
        // Add warm glow when sun is low
        if (sunHeight < 0.2) {
          const warmBlend = (0.2 - sunHeight) / 0.2;
          sunColor.lerp(sunsetColor, warmBlend * 0.3);
        }
        
        this.sunLight.color.copy(sunColor);
        
        // Update sky sun position
        const skySphere = this.worldRoot.getObjectByName('dreamSkySphere');
        if (skySphere && skySphere.material.uniforms) {
          skySphere.material.uniforms.uSunPosition.value.copy(this.sunLight.position);
          skySphere.material.uniforms.uTime.value = time;
        }
        
        // Update sun glow sprite position
        if (this.sunGlow) {
          this.sunGlow.position.copy(this.sunLight.position);
          // Scale glow based on sun height (larger when lower)
          const sunHeight = sunY;
          const glowScale = 35 + (70 - sunHeight) * 0.3;
          this.sunGlow.scale.set(glowScale, glowScale, 1);
          // Fade based on height (brighter when higher)
          const glowOpacity = 0.5 + (sunY / 75) * 0.3;
          this.sunGlow.material.opacity = glowOpacity;
        }
        
        // Update moon shader
        if (this.moon && this.moon.material.uniforms) {
          this.moon.material.uniforms.uTime.value = time;
        }
        
        // Update stars shader
        if (this.stars && this.stars.material.uniforms) {
          this.stars.material.uniforms.uTime.value = time;
        }
        
        // Update cloud layers
        if (this.cloudLayers) {
          this.cloudLayers.forEach(cloud => {
            if (cloud.material && cloud.material.uniforms) {
              cloud.material.uniforms.uTime.value = time;
            }
          });
        }
      }
      
      // Ridge breathing effect with shader updates
      if (obj.type === 'fractalRidge') {
        // Update shader uniforms
        if (obj.object.material.uniforms) {
          obj.object.material.uniforms.uTime.value = time;
          obj.object.material.uniforms.uCameraPosition.value.copy(this.camera.position);
          
          const pulse = Math.sin(time * obj.pulseSpeed + obj.phaseOffset) * 0.33 + 0.67;
          obj.object.material.uniforms.uEmissiveIntensity.value = obj.baseEmissiveIntensity * pulse;
        } else {
          // Fallback for old material system
          const pulse = Math.sin(time * obj.pulseSpeed + obj.phaseOffset) * 0.33 + 0.67;
          obj.object.material.emissiveIntensity = obj.baseEmissiveIntensity * pulse;
        }
        obj.object.rotation.z = obj.baseZ + Math.sin(time * obj.pulseSpeed * 0.48 + obj.phaseOffset) * 0.035;
      }

      if (this.fragmentLinkLines) {
        this._updateFragmentConnectionLines();
      }
      
      // Light shafts - gentle rotation and pulsing
      if (obj.type === 'lightShafts') {
        obj.angle += 0.0002;
        obj.object.rotation.z = obj.angle;
        const pulse = Math.sin(time * 0.3) * 0.5 + 0.5;
        obj.object.material.opacity = 0.03 + (pulse * 0.05);
      }
    });
  }
}
