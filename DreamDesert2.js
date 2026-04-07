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
    this.fragmentTrailSystem = null;
    this.pointLights = [];
    this.sunLight = null;
    this.sunOrbitRadius = 120;
    this.sunOrbitSpeed = (Math.PI * 2) / 300; // one full rotation in ~5 minutes
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.renderer = null;
    
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
      this.scene.fog = new THREE.FogExp2(0xffd0e0, 0.004);
      this.scene.background = new THREE.Color(0x1a0a15);
    }

    const skyGeometry = new THREE.SphereGeometry(520, 32, 15);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(0xffb8d8) },
        uBottomColor: { value: new THREE.Color(0xff8b4c) }
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
        void main() {
          float t = normalize(vWorldPosition).y * 0.5 + 0.5;
          vec3 color = mix(uBottomColor, uTopColor, smoothstep(0.0, 1.0, t));
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

  createMainDunes() {
    // Higher resolution for organic dune detail
    const geometry = new THREE.PlaneGeometry(240, 240, 220, 220);
    
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array;
    const colorArray = new Float32Array(positions.length);
    const lowColor = new THREE.Color(0xffc5d8);
    const highColor = new THREE.Color(0xe9d4ff);
    const edgeColor = new THREE.Color(0xffffff);

    // Organic multi-octave dune generation
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const dist = Math.sqrt(x * x + z * z);
      
      let height = this.sampleDuneNoise(x, z);
      
      // Shape dunes into gentle ridges and pockets
      height *= Math.max(0.18, Math.pow(1 - (dist * 0.0068), 1.4));
      height = Math.max(0, height);
      positions[i + 1] = height;
      
      const normalizedHeight = Math.min(1, height / 9);
      const color = lowColor.clone();
      color.lerp(highColor, Math.pow(normalizedHeight, 0.9));
      color.lerp(edgeColor, Math.pow(normalizedHeight, 2.2) * 0.35);
      
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }
    
    positionAttribute.needsUpdate = true;
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geometry.computeVertexNormals();
    
    const normalMap = this.createSandNormalTexture();
    
    const duneMaterial = materialRegistry.getStandard('world.dreamdesert2.duneMain', {
      color: 0xffc5d8,
      roughness: 0.55,
      metalness: 0.08,
      emissive: 0xffc5d8,
      emissiveIntensity: 0.06,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,
      clearcoat: 0.18,
      clearcoatRoughness: 0.72,
      sheen: 0.08,
      sheenRoughness: 0.55,
      vertexColors: true,
      normalMap,
      normalScale: new THREE.Vector2(0.32, 0.32)
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
    const detailScale = 7.6;
    const rippleScale = 24.0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x / size) * detailScale;
        const v = (y / size) * detailScale;
        const value = Math.sin(u * 3.4 + Math.cos(v * 2.8) * 1.1) * 0.16
          + Math.sin(v * 5.2 + u * 1.9) * 0.08
          + Math.cos(u * 8.1) * 0.04;
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
  
  /**
   * Create geometric fractal ridge formations
   */
  createFractalRidges() {
    const ridgeCount = 7;
    
    for (let r = 0; r < ridgeCount; r++) {
      const angle = (r / ridgeCount) * Math.PI * 2;
      const distance = 40 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      const length = 16 + Math.random() * 24;
      const height = 2.0 + Math.random() * 3.5;
      
      // Create wedge-like crystalline ridge geometry
      const ridgeGeo = new THREE.CylinderGeometry(0.42, 0.42, length, 4, 1, false);
      ridgeGeo.rotateZ(Math.PI / 2);
      ridgeGeo.rotateX(Math.PI / 2);
      
      const hue = 0.96 - r * 0.045;
      const ridgeColor = new THREE.Color().setHSL(hue, 0.72, 0.74);
      const ridgeEmissive = ridgeColor.clone().offsetHSL(0, -0.18, -0.08);

      const ridgeMaterial = materialRegistry.getStandard('world.dreamdesert2.ridge', {
        color: ridgeColor,
        roughness: 0.42,
        metalness: 0.16,
        emissive: ridgeEmissive,
        emissiveIntensity: 0.08,
        flatShading: true,
        side: THREE.DoubleSide,
        clearcoat: 0.16,
        clearcoatRoughness: 0.65,
        envMapIntensity: 1.2
      });
      
      const ridge = new THREE.Mesh(ridgeGeo, ridgeMaterial);
      ridge.position.set(x, height * 0.5 + 0.3, z);
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
    
    for (let f = 0; f < fragmentCount; f++) {
      const x = (Math.random() - 0.5) * 170;
      const z = (Math.random() - 0.5) * 170;
      const floatHeight = 3.5 + Math.random() * 9;
      const isMonument = f < 3;
      const size = isMonument ? 1.8 + Math.random() * 2.2 : 0.22 + Math.random() * 0.55;
      
      // Create geometric fragment with varied geometries
      let fragGeometry;
      const geoType = Math.random();
      if (geoType < 0.4) {
        fragGeometry = new THREE.OctahedronGeometry(size, 1);
      } else if (geoType < 0.7) {
        fragGeometry = new THREE.CylinderGeometry(size * 0.9, size * 0.9, size * 1.5, 4, 1, false);
      } else {
        fragGeometry = new THREE.TetrahedronGeometry(size);
      }
      
      const baseHue = 0.95 - (f / fragmentCount) * 0.18;
      const fragmentColor = new THREE.Color().setHSL(baseHue, 0.76, 0.71);
      const emissiveColor = fragmentColor.clone().offsetHSL(0, -0.18, -0.05);

      const fragMaterial = materialRegistry.getStandard('world.dreamdesert2.fragment', {
        color: fragmentColor,
        roughness: 0.22,
        metalness: 0.84,
        emissive: emissiveColor,
        emissiveIntensity: isMonument ? 0.5 : 0.32,
        transparent: true,
        opacity: isMonument ? 0.94 : 0.9,
        side: THREE.DoubleSide,
        clearcoat: 0.24,
        clearcoatRoughness: 0.56,
        envMapIntensity: 1.4
      });
      
      const fragment = new THREE.Mesh(fragGeometry, fragMaterial);
      fragment.position.set(x, floatHeight, z);
      fragment.castShadow = true;
      fragment.receiveShadow = true;
      fragment.name = 'floatingFragment';
      
      const glowMaterial = new THREE.SpriteMaterial({
        map: this.fragmentGlowTexture,
        color: 0xffc8ff,
        transparent: true,
        opacity: isMonument ? 0.42 : 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.set(size * 4.2, size * 4.2, 1);
      glow.position.set(x, floatHeight - 0.02, z);
      glow.renderOrder = 999;
      this.worldRoot.add(glow);

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
        glow,
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
  createAdvancedLighting() {
    const hemisphere = new THREE.HemisphereLight(0xffc0e8, 0xffb279, 0.65);
    this.worldRoot.add(hemisphere);

    this.sunLight = new THREE.DirectionalLight(0xffe8c4, 0.78);
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

    const fillLight = new THREE.DirectionalLight(0x88ffff, 0.36);
    fillLight.position.set(-90, 35, -90);
    fillLight.castShadow = true;
    fillLight.shadow.mapSize.width = 2048;
    fillLight.shadow.mapSize.height = 2048;
    fillLight.shadow.radius = 3;
    this.worldRoot.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff99ff, 0.28);
    rimLight.position.set(30, 52, -110);
    rimLight.castShadow = false;
    this.worldRoot.add(rimLight);

    const bounceLight = new THREE.DirectionalLight(0xaa99ff, 0.22);
    bounceLight.position.set(-10, -30, 15);
    bounceLight.castShadow = false;
    this.worldRoot.add(bounceLight);

    const secondaryFill = new THREE.DirectionalLight(0xccffff, 0.15);
    secondaryFill.position.set(100, 18, -70);
    secondaryFill.castShadow = false;
    this.worldRoot.add(secondaryFill);

    const groundFill = new THREE.DirectionalLight(0xffe8dd, 0.08);
    groundFill.position.set(0, -50, 0);
    this.worldRoot.add(groundFill);
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
  }
  
  /**
   * Create atmospheric scattering and light shafts for dream realism
   */
  createAtmosphericScattering() {
    // Create multiple animated mist layers for organic depth
    const mistGeo1 = new THREE.PlaneGeometry(280, 280);
    const mistMat1 = this.createAtmosphericFogMaterial(0xe8c0d0, 2.4, 0.05, 0.14);
    const mist1 = new THREE.Mesh(mistGeo1, mistMat1);
    mist1.position.y = 0.5;
    mist1.rotation.x = -Math.PI / 2;
    mist1.name = 'fogLayerGround';
    this.worldRoot.add(mist1);
    this.animatedObjects.push({ object: mist1, type: 'fogLayer', phase: 0.1 });

    const mistGeo2 = new THREE.PlaneGeometry(300, 300);
    const mistMat2 = this.createAtmosphericFogMaterial(0xf0d8e8, 2.0, 0.08, 0.1);
    const mist2 = new THREE.Mesh(mistGeo2, mistMat2);
    mist2.position.y = 15;
    mist2.rotation.x = -Math.PI / 2;
    mist2.name = 'fogLayerMid';
    this.worldRoot.add(mist2);
    this.animatedObjects.push({ object: mist2, type: 'fogLayer', phase: 1.1 });

    const mistGeo3 = new THREE.PlaneGeometry(350, 350);
    const mistMat3 = this.createAtmosphericFogMaterial(0xffe8f0, 1.6, 0.12, 0.08);
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
          float alpha = ring * pulse * 0.8;
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

    // Light shaft effect - moving godrays
    const rayGeo = new THREE.PlaneGeometry(200, 200);
    const rayMat = materialRegistry.getBasic('world.dreamdesert2.godray', {
      color: 0xffeedd,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const rays = new THREE.Mesh(rayGeo, rayMat);
    rays.position.set(30, 20, 40);
    rays.rotation.x = -0.3;
    this.worldRoot.add(rays);
    this.animatedObjects.push({
      object: rays,
      type: 'lightShafts',
      angle: 0
    });
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
      const dist = Math.sqrt(x * x + z * z);
      
      let height = 0;
      height += Math.sin(x * 0.032) * Math.cos(z * 0.028) * 7.5;
      height += Math.sin(x * 0.095 + z * 0.072) * Math.cos(z * 0.095) * 2.8;
      height += Math.sin(x * 0.22) * Math.cos(z * 0.22) * 1.2;
      height += Math.sin(x * 0.48 + z * 0.35) * 0.4;
      
      const falloff = Math.max(0.15, Math.pow(1 - (dist * 0.0075), 1.5));
      height *= falloff;
      
      positions[i + 1] = Math.max(0, height);
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
    
    // Collision for ridges
    const ridgeCount = 7;
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
   * Update animations and effects
   */
  update(deltaTime, time) {
    // Update reference plane (canonical contract)
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    
    this.animatedObjects.forEach(obj => {
      // Float fragments with rotation
      if (obj.type === 'floatFragment') {
        const data = obj.object.userData;
        
        // Smooth bobbing motion
        const float = Math.sin(time * data.floatSpeed + data.floatOffset) * data.floatAmount;
        obj.object.position.y = data.baseY + float;
        
        // Smooth rotation
        obj.object.rotation.x += data.rotationSpeed.x;
        obj.object.rotation.y += data.rotationSpeed.y;
        obj.object.rotation.z += data.rotationSpeed.z;

        if (data.glow) {
          data.glow.position.set(obj.object.position.x, obj.object.position.y - 0.02, obj.object.position.z);
        }
        if (data.pointLight) {
          data.pointLight.position.set(obj.object.position.x, obj.object.position.y + 0.35, obj.object.position.z);
        }
        if (time - (data.lastTrailTime || 0) > 0.14) {
          data.lastTrailTime = time;
          this.emitFragmentTrail(obj.object.position, data.trailHue, data.trailSize);
        }
      }
      
      // Drifting particles
      if (obj.type === 'particles') {
        const psData = this.particleSystems.find(ps => ps.object === obj.object);
        if (psData) {
          const positions = psData.object.geometry.attributes.position.array;
          const velocities = psData.velocities;
          
          for (let i = 0; i < positions.length; i += 3) {
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
      
      // Shimmer particles
      if (obj.type === 'shimmerParticles') {
        const psData = this.particleSystems.find(ps => ps.object === obj.object);
        if (psData) {
          const positions = psData.object.geometry.attributes.position.array;
          const velocities = psData.velocities;
          
          for (let i = 0; i < positions.length; i += 3) {
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
        const hue = 0.08 + Math.sin(sunAngle * 0.5) * 0.02;
        this.sunLight.color.setHSL(hue, 0.9, 0.86);
      }
      
      // Ridge breathing effect
      if (obj.type === 'fractalRidge') {
        const pulse = Math.sin(time * obj.pulseSpeed + obj.phaseOffset) * 0.33 + 0.67;
        obj.object.material.emissiveIntensity = obj.baseEmissiveIntensity * pulse;
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
