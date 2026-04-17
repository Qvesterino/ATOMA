import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const TAU = Math.PI * 2;
const WORLD_OVERLAY_ORDER = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_OVERLAY);

/**
 * CANONICAL TEMPLATE #3: NETWORK STRESS & LOAD PRESSURE VISUALS
 *
 * Foundation pressure layer for the whole world:
 * - global ambient pressure field
 * - horizon seams / canopy veils / lattice contours
 * - fog, light, and mood modulation
 * - node-local pulse bias for downstream visuals
 *
 * Contract preserved:
 * - constructor(scene, config)
 * - updateNetworkStress(...)
 * - registerNode(...) / unregisterNode(...)
 * - updateNodeLoadPressure(...)
 * - update(...)
 * - getNetworkStress() / getNodeLoadPressure(...)
 * - reset() / dispose()
 */
export class CanonicalTemplate3_StressVisuals {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.debugMode = config.debugMode || false;

    this.networkStress = 0;
    this.nodeStressMap = new Map();

    // Legacy-compatible placeholders retained for older call sites.
    this.ambientStressMaterial = null;
    this.nodeStressOverlay = null;

    this.elapsedTime = 0;
    this.updateInterval = 1 / 60;

    this.pressureState = {
      targetPressure: 0,
      currentPressure: 0,
      targetLoadBias: 0,
      currentLoadBias: 0,
      averageNodeLoad: 0,
      stressedNodeRatio: 0,
      pulse: 0,
      turbulence: 0,
      phase: 'detection',
      phaseTime: 0,
      lastPressure: 0,
      burstHold: 0,
      residueHold: 0,
      burstEcho: 0
    };

    this.palette = {
      calmDeep: new THREE.Color(0x071722),
      calmCyan: new THREE.Color(0x63dff6),
      calmMint: new THREE.Color(0x7bf4d5),
      pressureAmber: new THREE.Color(0xffb06b),
      pressureRose: new THREE.Color(0xff78bd),
      pressureViolet: new THREE.Color(0xd07bff),
      ruptureRed: new THREE.Color(0xff534f),
      ritualWhite: new THREE.Color(0xf7fbff),
      fogBase: new THREE.Color(0x152634)
    };

    this.stressColorLow = { r: 0.2, g: 0.4, b: 0.6 };
    this.stressColorMid = { r: 0.8, g: 0.5, b: 0.2 };
    this.stressColorHigh = { r: 1.0, g: 0.2, b: 0.2 };

    this._colorScratchA = new THREE.Color();
    this._colorScratchB = new THREE.Color();
    this._vectorScratch = new THREE.Vector3();
    this._ambientLightBaselines = new Map();
    this._lightColorScratch = new THREE.Color();
    this._fogBaseline = null;
    this.semanticBus = this._resolveSemanticBus();

    this.config = {
      rootRadius: 170,
      canopyDistance: 66,
      horizonDistance: 84,
      baseFogDensity: 0.0045,
      maxFogDensity: 0.028,
      ambientDimStrength: 0.24,
      pressureSmoothing: 0.055,
      loadSmoothing: 0.075,
      dustOpacity: 0.18,
      contourOpacity: 0.16,
      veilOpacity: 0.11,
      witnessOpacity: 0.085,
      riftVeinOpacity: 0.095
    };

    this.root = null;
    this.fieldLayers = {
      canopy: [],
      horizon: [],
      lattice: [],
      seamCrowns: [],
      witnessArcs: [],
      riftVeins: [],
      dust: null,
      shell: null
    };

    this._initializePressureField();

    if (this.debugMode) {
      console.log('%c[CanonicalTemplate3_StressVisuals] Initialized', 'color: #ff9900; font-weight: bold;');
    }
  }

  updateNetworkStress(stressValue) {
    const numericStress = Number(stressValue ?? 0);
    if (!Number.isFinite(numericStress)) {
      this.networkStress = 0;
      return;
    }
    const normalizedStress = numericStress > 1 ? (numericStress / 100) : numericStress;
    this.networkStress = Math.max(0, Math.min(1, normalizedStress));
  }

  registerNode(node) {
    if (!node) return;
    const nodeId = node.id || node.uuid || `node_${Math.random()}`;
    if (!this.nodeStressMap.has(nodeId)) {
      this.nodeStressMap.set(nodeId, {
        loadPressure: 0,
        node
      });
    }
  }

  unregisterNode(node) {
    if (!node) return;
    const nodeId = node.id || node.uuid || `node_${Math.random()}`;
    if (!this.nodeStressMap.has(nodeId)) return;

    if (node.userData) {
      delete node.userData.stressPulseRate;
      delete node.userData.stressPulsePhase;
      delete node.userData.stressIntensity;
      delete node.userData.stressFieldBias;
      delete node.userData.stressFieldTension;
      delete node.userData.stressFieldColor;
    }

    this.nodeStressMap.delete(nodeId);
  }

  updateNodeLoadPressure(node, loadPressure) {
    if (!node) return;

    const nodeId = node.id || node.uuid || `node_${Math.random()}`;
    const clampedLoad = Math.max(0, Math.min(1, Number(loadPressure ?? 0)));

    if (!this.nodeStressMap.has(nodeId)) {
      this.nodeStressMap.set(nodeId, {
        loadPressure: 0,
        node
      });
    }

    const stressData = this.nodeStressMap.get(nodeId);
    stressData.loadPressure = clampedLoad;
    stressData.node = node;
  }

  update(deltaTime = 1 / 60, currentTime = 0) {
    this.elapsedTime = currentTime;
    this._setFieldVisibility(true);
    this._refreshLightRegistry();
    this._updatePressureTargets();
    this._updatePressurePhaseState(deltaTime);
    this._updateAmbientStressField(deltaTime);
    this._updateFieldLayers(deltaTime);
    this.updateNodeStressOverlays(deltaTime);
  }

  _initializePressureField() {
    if (!this.scene) return;

    this.root = new THREE.Group();
    this.root.name = 'CanonicalTemplate3_StressVisualsRoot';
    this.root.renderOrder = WORLD_OVERLAY_ORDER;
    this.root.userData = this.root.userData || {};
    this.root.userData.isStressPressureField = true;
    this.root.userData.__environmentLayerId = 'CanonicalTemplate3_StressVisuals';
    this.root.userData.__environmentOwner = 'CanonicalTemplate3_StressVisuals';
    this.root.userData.pressurePhase = this.pressureState.phase;
    this.scene.add(this.root);

    this._createCanopyVeils();
    this._createHorizonSeams();
    this._createLatticeContours();
    this._createSeamCrowns();
    this._createWitnessArcs();
    this._createRiftVeins();
    this._createPressureShell();
    this._createShardDust();

    this.ambientStressMaterial = this.fieldLayers.shell?.material ?? null;
    this.nodeStressOverlay = this.fieldLayers.dust ?? null;
  }

  _createCanopyVeils() {
    const specs = [
      { width: 170, height: 46, y: 42, z: -58, rotX: -0.84, rotY: -0.1, opacity: 0.085, key: 'calm' },
      { width: 152, height: 38, y: 30, z: -44, rotX: -0.76, rotY: 0.12, opacity: 0.095, key: 'mid' },
      { width: 126, height: 32, y: 20, z: -36, rotX: -0.7, rotY: -0.18, opacity: 0.11, key: 'pressure' }
    ];

    specs.forEach((spec, index) => {
      const geometry = this._createVeilStripGeometry(spec.width, spec.height, 28, 8 + index * 2, index * 1.17);
      const material = new THREE.MeshBasicMaterial({
        color: this.palette.calmCyan.clone(),
        transparent: true,
        opacity: spec.opacity,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, spec.y, spec.z);
      mesh.rotation.set(spec.rotX, spec.rotY, index % 2 === 0 ? -0.12 : 0.09);
      mesh.renderOrder = this._getWorldRenderOrder(-4 + index);
      mesh.userData = { isStressField: true, type: 'pressure_canopy_veil', key: spec.key, basePosition: mesh.position.clone() };
      this.root.add(mesh);
      this.fieldLayers.canopy.push(mesh);
    });
  }

  _createHorizonSeams() {
    const specs = [
      { radiusX: 110, radiusY: 24, y: 6, z: -84, opacity: 0.12 },
      { radiusX: 132, radiusY: 29, y: 11, z: -96, opacity: 0.09 },
      { radiusX: 90, radiusY: 18, y: 2, z: -70, opacity: 0.14 }
    ];

    specs.forEach((spec, index) => {
      const geometry = this._createBrokenLoopGeometry(spec.radiusX, spec.radiusY, 54, index * 0.82, 0.12 + index * 0.03);
      const material = new THREE.LineBasicMaterial({
        color: this.palette.calmMint.clone(),
        transparent: true,
        opacity: spec.opacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      const line = new THREE.LineLoop(geometry, material);
      line.position.set(0, spec.y, spec.z);
      line.rotation.x = Math.PI * 0.49;
      line.rotation.z = index === 1 ? 0.07 : -0.04;
      line.renderOrder = this._getWorldRenderOrder(-2 + index);
      line.userData = { isStressField: true, type: 'pressure_horizon_seam', basePosition: line.position.clone() };
      this.root.add(line);
      this.fieldLayers.horizon.push(line);
    });
  }

  _createLatticeContours() {
    const specs = [
      { radius: 36, y: 18, z: -20, rotX: 0.88, rotY: 0.1, opacity: 0.1 },
      { radius: 48, y: 10, z: -28, rotX: 1.08, rotY: -0.08, opacity: 0.08 },
      { radius: 58, y: 2, z: -36, rotX: 1.18, rotY: 0.14, opacity: 0.06 }
    ];

    specs.forEach((spec, index) => {
      const geometry = this._createBrokenLoopGeometry(spec.radius, spec.radius * 0.46, 42, index * 1.31, 0.16);
      const material = new THREE.LineBasicMaterial({
        color: this.palette.pressureViolet.clone(),
        transparent: true,
        opacity: spec.opacity,
        depthWrite: false,
        depthTest: true,
        fog: false
      });
      const line = new THREE.LineLoop(geometry, material);
      line.position.set(0, spec.y, spec.z);
      line.rotation.set(spec.rotX, spec.rotY, index * 0.2);
      line.renderOrder = this._getWorldRenderOrder(2 + index);
      line.userData = { isStressField: true, type: 'pressure_lattice_contour' };
      this.root.add(line);
      this.fieldLayers.lattice.push(line);
    });
  }

  _createSeamCrowns() {
    for (let i = 0; i < 4; i++) {
      const geometry = this._createCrownGeometry(14 + i * 3, 22 + i * 4, i * 0.71);
      const material = new THREE.LineBasicMaterial({
        color: this.palette.ritualWhite.clone(),
        transparent: true,
        opacity: 0.06 + i * 0.012,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      const line = new THREE.Line(geometry, material);
      line.position.set((i - 1.5) * 16, 2 + i * 4, -24 - i * 6);
      line.rotation.y = -0.16 + i * 0.12;
      line.renderOrder = this._getWorldRenderOrder(8 + i);
      line.userData = { isStressField: true, type: 'pressure_seam_crown', basePosition: line.position.clone() };
      this.root.add(line);
      this.fieldLayers.seamCrowns.push(line);
    }
  }

  _createWitnessArcs() {
    const specs = [
      { radiusX: 62, radiusY: 18, y: 24, z: -30, rotX: 1.02, rotY: 0.28, rotZ: -0.12, opacity: 0.085 },
      { radiusX: 74, radiusY: 22, y: 12, z: -38, rotX: 1.18, rotY: -0.22, rotZ: 0.18, opacity: 0.072 },
      { radiusX: 88, radiusY: 26, y: 4, z: -48, rotX: 1.28, rotY: 0.14, rotZ: -0.2, opacity: 0.064 }
    ];

    specs.forEach((spec, index) => {
      const geometry = this._createBrokenLoopGeometry(spec.radiusX, spec.radiusY, 46 + index * 6, index * 0.93, 0.11 + index * 0.02);
      const material = new THREE.LineBasicMaterial({
        color: this.palette.ritualWhite.clone(),
        transparent: true,
        opacity: spec.opacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      const line = new THREE.LineLoop(geometry, material);
      line.position.set(0, spec.y, spec.z);
      line.rotation.set(spec.rotX, spec.rotY, spec.rotZ);
      line.renderOrder = this._getWorldRenderOrder(12 + index);
      line.userData = { isStressField: true, type: 'pressure_witness_arc', basePosition: line.position.clone() };
      this.root.add(line);
      this.fieldLayers.witnessArcs.push(line);
    });
  }

  _createRiftVeins() {
    const specs = [
      { width: 38, height: 42, x: -18, y: 14, z: -18, rotX: 0.36, rotY: -0.28, rotZ: -0.22, opacity: 0.11 },
      { width: 44, height: 56, x: 22, y: 6, z: -26, rotX: 0.48, rotY: 0.24, rotZ: 0.16, opacity: 0.1 },
      { width: 52, height: 68, x: 0, y: -2, z: -34, rotX: 0.58, rotY: -0.08, rotZ: -0.08, opacity: 0.084 }
    ];

    specs.forEach((spec, index) => {
      const geometry = this._createFractureSpineGeometry(spec.width, spec.height, index * 0.77, 6 + index);
      const material = new THREE.LineBasicMaterial({
        color: this.palette.pressureRose.clone(),
        transparent: true,
        opacity: spec.opacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      const line = new THREE.Line(geometry, material);
      line.position.set(spec.x, spec.y, spec.z);
      line.rotation.set(spec.rotX, spec.rotY, spec.rotZ);
      line.renderOrder = this._getWorldRenderOrder(16 + index);
      line.userData = { isStressField: true, type: 'pressure_rift_vein', basePosition: line.position.clone() };
      this.root.add(line);
      this.fieldLayers.riftVeins.push(line);
    });
  }

  _createPressureShell() {
    const geometry = this._createBrokenLoopGeometry(76, 38, 60, 0.4, 0.09);
    const material = new THREE.LineBasicMaterial({
      color: this.palette.calmCyan.clone(),
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    const shell = new THREE.LineLoop(geometry, material);
    shell.position.set(0, 12, -18);
    shell.rotation.x = Math.PI * 0.92;
    shell.rotation.z = 0.14;
    shell.renderOrder = this._getWorldRenderOrder(20);
    shell.userData = { isStressField: true, type: 'pressure_shell' };
    this.root.add(shell);
    this.fieldLayers.shell = shell;
  }

  _createShardDust() {
    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU;
      const radius = 18 + (i % 17) * 2.8 + Math.sin(i * 0.77) * 4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -6 + (i % 23) * 0.7;
      positions[i * 3 + 2] = -18 - Math.sin(angle * 1.6) * 26 - (i % 11) * 1.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: this.palette.calmMint.clone(),
      size: 1.3,
      transparent: true,
      opacity: this.config.dustOpacity,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      fog: false
    });

    const points = new THREE.Points(geometry, material);
    points.position.set(0, 0, 0);
    points.renderOrder = this._getWorldRenderOrder(24);
    points.userData = { isStressField: true, type: 'pressure_shard_dust' };
    this.root.add(points);
    this.fieldLayers.dust = points;
  }

  _getWorldRenderOrder(offset = 0) {
    return WORLD_OVERLAY_ORDER + offset;
  }

  _resolveSemanticBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }
    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _createVeilStripGeometry(width, height, segments, amplitude, seed) {
    const positions = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * width;
      const curve = Math.sin(t * Math.PI * 2 + seed) * amplitude;
      const secondary = Math.sin(t * Math.PI * 5 + seed * 0.7) * amplitude * 0.24;
      positions.push(x, height * 0.5 + curve, secondary);
      positions.push(x, -height * 0.5 + curve * 0.4, secondary - amplitude * 0.16);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  _createBrokenLoopGeometry(radiusX, radiusY, segments, seed = 0, breakBias = 0.14) {
    const points = [];
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const angle = t * TAU;
      const bias = 1 + Math.sin(angle * 3 + seed) * 0.06 + Math.cos(angle * 5 + seed * 0.7) * 0.04;
      const x = Math.cos(angle) * radiusX * bias;
      const y = Math.sin(angle) * radiusY * (1 + Math.cos(angle * 2.4 + seed) * 0.08);
      if ((i + Math.floor(seed * 10)) % Math.max(5, Math.round(segments * breakBias)) === 0) {
        points.push(new THREE.Vector3(x * 0.92, y * 0.92, 0));
      }
      points.push(new THREE.Vector3(x, y, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  _createCrownGeometry(width, height, seed = 0) {
    const points = [];
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const x = (t - 0.5) * width;
      const y = Math.sin(t * Math.PI) * height * (0.55 + Math.sin(seed + t * TAU) * 0.08);
      points.push(new THREE.Vector3(x, y, Math.cos(seed + t * 3.4) * 0.8));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  _createFractureSpineGeometry(width, height, seed = 0, segments = 7) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = Math.sin(seed + t * 6.2) * width * (0.12 + t * 0.28) + Math.cos(seed * 1.7 + t * 10.0) * width * 0.04;
      const y = (t - 0.5) * height;
      const z = Math.cos(seed + t * 5.3) * width * 0.06;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  _refreshLightRegistry() {
    if (!this.scene?.children) return;

    for (const child of this.scene.children) {
      if (!child?.isLight) continue;
      if (this._ambientLightBaselines.has(child)) continue;
      this._ambientLightBaselines.set(child, {
        intensity: child.intensity,
        color: child.color ? child.color.clone() : null
      });
    }

    if (!this._fogBaseline && this.scene.fog) {
      this._fogBaseline = {
        color: this.scene.fog.color.clone(),
        density: typeof this.scene.fog.density === 'number' ? this.scene.fog.density : this.config.baseFogDensity
      };
    }
  }

  _updatePressureTargets() {
    let totalLoad = 0;
    let activeCount = 0;
    let stressedNodes = 0;
    const staleNodeIds = [];

    for (const [nodeId, stressData] of this.nodeStressMap.entries()) {
      const node = stressData.node;
      if (!node || !node.parent) {
        staleNodeIds.push(nodeId);
        continue;
      }

      const loadPressure = Math.max(0, Math.min(1, stressData.loadPressure || 0));
      totalLoad += loadPressure;
      activeCount++;
      if (loadPressure > 0.58) stressedNodes++;
    }

    for (const nodeId of staleNodeIds) {
      this.nodeStressMap.delete(nodeId);
    }

    const averageNodeLoad = activeCount > 0 ? totalLoad / activeCount : 0;
    const stressedNodeRatio = activeCount > 0 ? stressedNodes / activeCount : 0;
    const loadBias = Math.min(1, averageNodeLoad * 0.78 + stressedNodeRatio * 0.32);
    const targetPressure = Math.min(1, this.networkStress * 0.68 + loadBias * 0.32);

    this.pressureState.averageNodeLoad = averageNodeLoad;
    this.pressureState.stressedNodeRatio = stressedNodeRatio;
    this.pressureState.targetLoadBias = loadBias;
    this.pressureState.targetPressure = targetPressure;

    this.pressureState.currentPressure += (targetPressure - this.pressureState.currentPressure) * this.config.pressureSmoothing;
    this.pressureState.currentLoadBias += (loadBias - this.pressureState.currentLoadBias) * this.config.loadSmoothing;

    const time = this.elapsedTime || 0;
    this.pressureState.pulse = Math.sin(time * (0.42 + this.pressureState.currentPressure * 0.38) + this.pressureState.currentLoadBias * Math.PI * 1.7);
    this.pressureState.turbulence = Math.cos(time * 0.26 + this.pressureState.currentPressure * Math.PI * 1.1);
  }

  _setPressurePhase(nextPhase) {
    if (this.pressureState.phase !== nextPhase) {
      this.pressureState.phase = nextPhase;
      this.pressureState.phaseTime = 0;
    }
  }

  _emitPressurePhaseEvent(phase) {
    const bus = this.semanticBus || this._resolveSemanticBus();
    this.semanticBus = bus;
    if (!bus || (phase !== 'burst' && phase !== 'residue')) return;

    const pressure = this.pressureState.currentPressure;
    const loadBias = this.pressureState.currentLoadBias;
    const payload = {
      type: 'stressPressureField',
      phase,
      title: phase === 'burst' ? 'Pressure Burst' : 'Pressure Residue',
      subtitle: phase === 'burst'
        ? 'The world shell tears open under accumulated pressure.'
        : 'Afterimages of the rupture remain suspended in the air.',
      visualTone: phase === 'burst' ? 'pressure-burst' : 'pressure-residue',
      intensity: Math.max(0.2, Math.min(1.4, pressure * 1.1 + loadBias * 0.4)),
      radius: this.config.rootRadius,
      source: 'CanonicalTemplate3_StressVisuals',
      timestamp: performance.now?.() ?? Date.now(),
      semanticSubtitle: phase === 'burst'
        ? 'A global pressure front is rupturing through the environment foundation layer.'
        : 'The pressure field is settling into a pale interdimensional afterglow.',
      semanticTags: [
        'environment.pressure',
        `pressure.phase.${phase}`,
        phase === 'burst' ? 'signal.pressure.rupture' : 'signal.pressure.afterglow'
      ],
      audioCue: phase === 'burst' ? 'pressure.burst.world-shell' : 'pressure.residue.afterglow',
      audioLayer: phase === 'burst' ? 'pressure-rumble' : 'residue-choir',
      audioIntensity: Math.max(0.2, Math.min(1.2, pressure * 0.95 + loadBias * 0.3))
    };

    if (typeof bus.emit === 'function') {
      bus.emit('environment.pressure.phase', payload);
      return;
    }
    if (typeof bus.publish === 'function') {
      bus.publish('environment.pressure.phase', payload);
    }
  }

  _updatePressurePhaseState(deltaTime) {
    const previousPhase = this.pressureState.phase;
    const pressure = this.pressureState.currentPressure;
    const loadBias = this.pressureState.currentLoadBias;
    const pressureDelta = pressure - this.pressureState.lastPressure;
    const burstTrigger =
      pressure > 0.76 &&
      (pressureDelta > 0.008 || loadBias > 0.64 || Math.abs(this.pressureState.pulse) > 0.92);

    this.pressureState.phaseTime += deltaTime;
    this.pressureState.burstHold = Math.max(0, this.pressureState.burstHold - deltaTime);
    this.pressureState.residueHold = Math.max(0, this.pressureState.residueHold - deltaTime);
    this.pressureState.burstEcho = Math.max(0, this.pressureState.burstEcho - deltaTime * 0.55);

    if (burstTrigger && this.pressureState.burstHold <= 0) {
      this.pressureState.burstHold = 0.55 + pressure * 0.35;
      this.pressureState.residueHold = 1.4 + pressure * 0.9;
      this.pressureState.burstEcho = 1;
      this._setPressurePhase('burst');
    } else if (this.pressureState.burstHold > 0) {
      this._setPressurePhase('burst');
    } else if (this.pressureState.residueHold > 0 && (pressure > 0.22 || loadBias > 0.18)) {
      this._setPressurePhase('residue');
    } else if (pressure > 0.3 || loadBias > 0.24) {
      this._setPressurePhase('escalation');
    } else {
      this._setPressurePhase('detection');
    }

    this.pressureState.lastPressure = pressure;
    if (this.root?.userData) {
      this.root.userData.pressurePhase = this.pressureState.phase;
    }
    if (previousPhase !== this.pressureState.phase) {
      this._emitPressurePhaseEvent(this.pressureState.phase);
    }
  }

  _getPressurePhaseMix() {
    const phase = this.pressureState.phase;
    return {
      detection: phase === 'detection' ? 1 : 0,
      escalation: phase === 'escalation' ? 1 : 0,
      burst: phase === 'burst' ? 1 : 0,
      residue: phase === 'residue' ? 1 : 0
    };
  }

  _updateAmbientStressField(deltaTime) {
    if (!this.scene) return;

    const pressure = this.pressureState.currentPressure;
    const loadBias = this.pressureState.currentLoadBias;
    const pulse = this.pressureState.pulse;
    const turbulence = this.pressureState.turbulence;
    const phaseMix = this._getPressurePhaseMix();
    const burstEcho = this.pressureState.burstEcho;

    const fogColor = this.palette.fogBase.clone()
      .lerp(this.palette.calmCyan, pressure * 0.14)
      .lerp(this.palette.pressureAmber, Math.max(0, pressure - 0.18) * 0.34)
      .lerp(this.palette.pressureRose, Math.max(0, pressure - 0.42) * 0.3)
      .lerp(this.palette.pressureViolet, Math.max(0, loadBias - 0.28) * 0.42)
      .lerp(this.palette.ruptureRed, Math.max(0, pressure - 0.72) * 0.52 + phaseMix.burst * 0.18)
      .lerp(this.palette.ritualWhite, phaseMix.residue * 0.06 + burstEcho * 0.04);

    if (this.scene.fog) {
      this.scene.fog.color.copy(fogColor);
      const baselineDensity = this._fogBaseline?.density ?? this.config.baseFogDensity;
      const densityBoost = this.config.maxFogDensity - this.config.baseFogDensity;
      this.scene.fog.density = Math.max(
        baselineDensity,
        this.config.baseFogDensity + pressure * densityBoost + Math.abs(pulse) * 0.0024 + loadBias * 0.0032 + Math.max(0, pressure - 0.68) * 0.0035 + phaseMix.burst * 0.003 + phaseMix.residue * 0.0012
      );
    }

    for (const [light, baseline] of this._ambientLightBaselines.entries()) {
      if (!light) continue;
      const baseIntensity = baseline.intensity ?? light.intensity ?? 1;
      const baseColor = baseline.color ?? light.color ?? this.palette.ritualWhite;

      if (light.isAmbientLight) {
        light.intensity = Math.max(0.12, baseIntensity * (1 - pressure * (this.config.ambientDimStrength + 0.05) - phaseMix.burst * 0.06));
        this._lightColorScratch.copy(baseColor)
          .lerp(this.palette.calmCyan, pressure * 0.08)
          .lerp(this.palette.pressureRose, Math.max(0, pressure - 0.46) * 0.12)
          .lerp(this.palette.pressureViolet, Math.max(0, loadBias - 0.4) * 0.08)
          .lerp(this.palette.ritualWhite, phaseMix.residue * 0.05);
        light.color.copy(this._lightColorScratch);
      } else {
        light.intensity = Math.max(0.12, baseIntensity * (1 - pressure * 0.16 - phaseMix.burst * 0.04 + Math.abs(pulse) * 0.04 + phaseMix.residue * 0.02));
        if (light.color) {
          this._lightColorScratch.copy(baseColor)
            .lerp(this.palette.pressureAmber, pressure * 0.08)
            .lerp(this.palette.pressureViolet, Math.max(0, loadBias - 0.38) * 0.1)
            .lerp(this.palette.ruptureRed, Math.max(0, pressure - 0.78) * 0.06 + phaseMix.burst * 0.08)
            .lerp(this.palette.ritualWhite, phaseMix.residue * 0.04);
          light.color.copy(this._lightColorScratch);
        }
      }
    }
  }

  _updateFieldLayers(deltaTime) {
    if (!this.root) return;

    const pressure = this.pressureState.currentPressure;
    const loadBias = this.pressureState.currentLoadBias;
    const pulse = this.pressureState.pulse;
    const turbulence = this.pressureState.turbulence;
    const time = this.elapsedTime || 0;
    const phaseMix = this._getPressurePhaseMix();
    const burstEcho = this.pressureState.burstEcho;

    const calm = this.palette.calmMint;
    const seam = this.palette.calmCyan;
    const tension = this.palette.pressureAmber;
    const fracture = this.palette.pressureRose;
    const voidViolet = this.palette.pressureViolet;
    const rupture = this.palette.ruptureRed;

    this.root.position.y = Math.sin(time * 0.16 + turbulence * 0.4) * (0.12 + pressure * 0.34 + phaseMix.burst * 0.2);
    this.root.rotation.z = Math.sin(time * 0.07 + loadBias * 1.3) * (0.008 + pressure * 0.018 + phaseMix.escalation * 0.008);
    this.root.rotation.y = Math.sin(time * 0.05 + burstEcho * 0.8) * (pressure * 0.02 + phaseMix.residue * 0.03);

    this.fieldLayers.canopy.forEach((veil, index) => {
      const basePosition = veil.userData?.basePosition;
      const opacity = this.config.veilOpacity + pressure * 0.14 + loadBias * 0.055 + index * 0.014 + phaseMix.escalation * 0.03 + phaseMix.burst * 0.045;
      const color = calm.clone()
        .lerp(seam, 0.32 + index * 0.08)
        .lerp(tension, pressure * 0.32)
        .lerp(fracture, Math.max(0, pressure - 0.5) * 0.34)
        .lerp(voidViolet, loadBias * 0.28)
        .lerp(rupture, phaseMix.burst * 0.14)
        .lerp(this.palette.ritualWhite, phaseMix.residue * 0.06);
      veil.material.color.copy(color);
      veil.material.opacity = Math.min(0.42, opacity);
      veil.rotation.z += deltaTime * (0.022 + index * 0.007 + pressure * 0.01 + phaseMix.burst * 0.014);
      veil.rotation.y = Math.sin(time * 0.13 + index * 1.1) * (0.06 + pressure * 0.16);
      veil.position.y = (basePosition?.y ?? veil.position.y) + Math.sin(time * 0.22 + index * 1.8) * (0.015 + pressure * 0.02);
      veil.position.z = (basePosition?.z ?? veil.position.z) + Math.cos(time * 0.12 + index) * (1.2 + pressure * 2.8);
      veil.position.x = (basePosition?.x ?? 0) + Math.sin(time * 0.08 + index) * (2.8 + pressure * 4.2 + loadBias * 2.2);
      veil.scale.set(1 + pressure * 0.08, 1 + loadBias * 0.12 + Math.abs(turbulence) * 0.05, 1);
    });

    this.fieldLayers.horizon.forEach((line, index) => {
      const basePosition = line.userData?.basePosition;
      const opacity = 0.05 + pressure * 0.26 + Math.abs(pulse) * 0.04 + index * 0.016 + phaseMix.burst * 0.06 + phaseMix.residue * 0.02;
      const color = seam.clone()
        .lerp(calm, 0.18)
        .lerp(tension, pressure * 0.32)
        .lerp(rupture, Math.max(0, pressure - 0.64) * 0.4)
        .lerp(voidViolet, loadBias * 0.16)
        .lerp(this.palette.ritualWhite, phaseMix.residue * 0.08);
      line.material.color.copy(color);
      line.material.opacity = Math.min(0.44, opacity);
      line.rotation.z += deltaTime * (0.014 + index * 0.006 + pressure * 0.008 + phaseMix.burst * 0.015);
      line.position.x = (basePosition?.x ?? 0) + Math.sin(time * 0.09 + index * 1.7) * (0.8 + pressure * 2.8);
      line.scale.x = 1 + pressure * 0.09 + index * 0.018;
      line.scale.y = 1 + loadBias * 0.14 + Math.abs(turbulence) * 0.08 + Math.max(0, pressure - 0.6) * 0.1;
    });

    this.fieldLayers.lattice.forEach((line, index) => {
      const opacity = 0.04 + pressure * 0.15 + loadBias * 0.08 + index * 0.01 + phaseMix.escalation * 0.03;
      const color = voidViolet.clone()
        .lerp(seam, 0.14)
        .lerp(fracture, Math.max(0, pressure - 0.42) * 0.4)
        .lerp(rupture, Math.max(0, pressure - 0.76) * 0.18 + phaseMix.burst * 0.12)
        .lerp(this.palette.ritualWhite, phaseMix.residue * 0.04);
      line.material.color.copy(color);
      line.material.opacity = Math.min(0.34, opacity);
      line.rotation.z += deltaTime * (0.06 + index * 0.02 + pressure * 0.02);
      line.rotation.y += deltaTime * (0.026 + loadBias * 0.04);
      line.scale.setScalar(1 + pressure * 0.08 + loadBias * 0.06 + phaseMix.escalation * 0.05);
    });

    this.fieldLayers.seamCrowns.forEach((line, index) => {
      const basePosition = line.userData?.basePosition;
      const opacity = 0.03 + pressure * 0.12 + index * 0.01 + phaseMix.burst * 0.04;
      const color = this.palette.ritualWhite.clone()
        .lerp(seam, 0.18)
        .lerp(fracture, Math.max(0, pressure - 0.58) * 0.34)
        .lerp(voidViolet, loadBias * 0.18)
        .lerp(this.palette.ritualWhite, phaseMix.residue * 0.08);
      line.material.color.copy(color);
      line.material.opacity = Math.min(0.28, opacity);
      line.rotation.z = Math.sin(time * 0.18 + index * 1.2) * (0.08 + pressure * 0.16 + phaseMix.burst * 0.18);
      line.rotation.y = Math.cos(time * 0.11 + index) * (0.03 + loadBias * 0.06);
      line.position.y = (basePosition?.y ?? line.position.y) + Math.sin(time * 0.42 + index) * (0.02 + pressure * 0.03);
    });

    this.fieldLayers.witnessArcs.forEach((line, index) => {
      const basePosition = line.userData?.basePosition;
      const opacity = this.config.witnessOpacity + pressure * 0.11 + loadBias * 0.05 + index * 0.012 + phaseMix.residue * 0.05;
      const color = this.palette.ritualWhite.clone()
        .lerp(seam, 0.24)
        .lerp(voidViolet, loadBias * 0.32)
        .lerp(fracture, Math.max(0, pressure - 0.52) * 0.28)
        .lerp(this.palette.ritualWhite, phaseMix.residue * 0.16 + burstEcho * 0.08);
      line.material.color.copy(color);
      line.material.opacity = Math.min(0.3, opacity);
      line.rotation.z += deltaTime * (0.018 + index * 0.008 + loadBias * 0.01 + phaseMix.residue * 0.01);
      line.rotation.y += deltaTime * (0.01 + pressure * 0.014);
      line.scale.set(1 + pressure * 0.08, 1 + loadBias * 0.12, 1);
      line.position.x = (basePosition?.x ?? 0) + Math.sin(time * 0.12 + index * 1.7) * (4 + pressure * 10);
    });

    this.fieldLayers.riftVeins.forEach((line, index) => {
      const basePosition = line.userData?.basePosition;
      const opacity = this.config.riftVeinOpacity + pressure * 0.16 + loadBias * 0.04 + index * 0.008 + phaseMix.escalation * 0.03 + phaseMix.burst * 0.06;
      const color = fracture.clone()
        .lerp(voidViolet, loadBias * 0.28)
        .lerp(rupture, Math.max(0, pressure - 0.7) * 0.28)
        .lerp(this.palette.ritualWhite, Math.max(0, pressure - 0.84) * 0.12 + phaseMix.residue * 0.08);
      line.material.color.copy(color);
      line.material.opacity = Math.min(0.36, opacity);
      line.rotation.z += deltaTime * (0.022 + index * 0.012 + pressure * 0.014 + phaseMix.burst * 0.024);
      line.rotation.y += deltaTime * (0.014 + loadBias * 0.01);
      line.position.x = (basePosition?.x ?? line.position.x) + Math.sin(time * 0.16 + index * 2.2) * (0.014 + pressure * 0.03);
      line.scale.setScalar(1 + pressure * 0.12 + loadBias * 0.08 + phaseMix.burst * 0.1);
    });

    if (this.fieldLayers.shell) {
      const shell = this.fieldLayers.shell;
      shell.material.color.copy(
        seam.clone()
          .lerp(voidViolet, loadBias * 0.3)
          .lerp(fracture, Math.max(0, pressure - 0.5) * 0.18)
          .lerp(rupture, Math.max(0, pressure - 0.72) * 0.24 + phaseMix.burst * 0.16)
          .lerp(this.palette.ritualWhite, phaseMix.residue * 0.08)
      );
      shell.material.opacity = Math.min(0.42, 0.06 + pressure * 0.14 + Math.abs(pulse) * 0.03 + loadBias * 0.03 + phaseMix.burst * 0.08);
      shell.rotation.z += deltaTime * (0.016 + pressure * 0.008 + phaseMix.burst * 0.018);
      shell.rotation.y = Math.sin(time * 0.08 + loadBias * 2.0) * (0.04 + pressure * 0.1);
      shell.scale.set(1 + pressure * 0.08 + Math.abs(pulse) * 0.03 + phaseMix.burst * 0.12, 1 + loadBias * 0.16 + phaseMix.residue * 0.06, 1);
    }

    if (this.fieldLayers.dust) {
      const dust = this.fieldLayers.dust;
      dust.material.color.copy(
        calm.clone()
          .lerp(seam, 0.22)
          .lerp(tension, pressure * 0.22)
          .lerp(voidViolet, loadBias * 0.18)
          .lerp(fracture, Math.max(0, pressure - 0.7) * 0.18 + phaseMix.burst * 0.08)
          .lerp(this.palette.ritualWhite, phaseMix.residue * 0.06)
      );
      dust.material.opacity = Math.min(0.38, this.config.dustOpacity + pressure * 0.11 + loadBias * 0.06 + phaseMix.burst * 0.04);
      dust.material.size = 1.15 + pressure * 0.65 + Math.abs(turbulence) * 0.22 + phaseMix.burst * 0.25;
      dust.rotation.y += deltaTime * (0.03 + pressure * 0.03 + phaseMix.escalation * 0.02);
      dust.rotation.z -= deltaTime * (0.02 + loadBias * 0.018 + phaseMix.residue * 0.01);
    }
  }

  updateNodeStressOverlays(deltaTime) {
    const staleNodeIds = [];
    const globalPressure = this.pressureState.currentPressure;

    for (const [nodeId, stressData] of this.nodeStressMap.entries()) {
      const { node, loadPressure } = stressData;

      if (!node || !node.parent) {
        staleNodeIds.push(nodeId);
        continue;
      }

      if (!node.userData) continue;

      const localLoad = Math.max(0, Math.min(1, loadPressure || 0));
      const localPressure = Math.min(1, localLoad * 0.72 + globalPressure * 0.28);
      const basePulseRate = 0.85 + globalPressure * 0.65;
      const maxPulseRate = 3.2;
      const pulseRate = basePulseRate + localLoad * (maxPulseRate - basePulseRate);
      const phase = (this.elapsedTime * pulseRate) % TAU;

      node.userData.stressPulseRate = pulseRate;
      node.userData.stressPulsePhase = phase;
      node.userData.stressIntensity = localLoad;
      node.userData.stressFieldBias = localPressure;
      node.userData.stressFieldTension = globalPressure;
      node.userData.stressFieldColor = this._getNodeStressColorHex(localPressure);

      if (this.debugMode && Math.random() < 0.01) {
        console.log(`[Template3] Node ${nodeId.substring(0, 8)}... load=${localLoad.toFixed(2)} field=${localPressure.toFixed(2)}`);
      }
    }

    for (const nodeId of staleNodeIds) {
      this.nodeStressMap.delete(nodeId);
      if (this.debugMode) {
        console.warn(`[Template3] Removed stale node: ${nodeId.substring(0, 8)}...`);
      }
    }
  }

  _getNodeStressColorHex(intensity) {
    const color = this.palette.calmCyan.clone()
      .lerp(this.palette.pressureAmber, intensity * 0.58)
      .lerp(this.palette.pressureRose, Math.max(0, intensity - 0.55) * 0.5)
      .lerp(this.palette.ruptureRed, Math.max(0, intensity - 0.82) * 0.7);
    return color.getHex();
  }

  lerpColor(colorA, colorB, t) {
    return {
      r: colorA.r + (colorB.r - colorA.r) * t,
      g: colorA.g + (colorB.g - colorA.g) * t,
      b: colorA.b + (colorB.b - colorA.b) * t
    };
  }

  getNetworkStress() {
    return this.networkStress;
  }

  getPressureFieldState() {
    return {
      pressure: this.pressureState.currentPressure,
      loadBias: this.pressureState.currentLoadBias,
      averageNodeLoad: this.pressureState.averageNodeLoad,
      stressedNodeRatio: this.pressureState.stressedNodeRatio,
      phase: this.pressureState.phase,
      burstEcho: this.pressureState.burstEcho
    };
  }

  getNodeLoadPressure(node) {
    if (!node) return 0;
    const nodeId = node.id || node.uuid || `node_${Math.random()}`;
    return this.nodeStressMap.get(nodeId)?.loadPressure ?? 0;
  }

  debugPrintStress() {
    console.log('%c[CanonicalTemplate3] NETWORK STRESS DEBUG', 'color: #ff9900; font-weight: bold;');
    console.log(`Global Network Stress: ${this.networkStress.toFixed(3)}`);
    console.log(`Current Pressure: ${this.pressureState.currentPressure.toFixed(3)}`);
    console.log(`Average Node Load: ${this.pressureState.averageNodeLoad.toFixed(3)}`);
    console.log(`Tracked Nodes: ${this.nodeStressMap.size}`);

    for (const [nodeId, data] of this.nodeStressMap.entries()) {
      console.log(`  ${nodeId.substring(0, 8)}... load=${data.loadPressure.toFixed(3)}`);
    }
  }

  reset() {
    for (const [, stressData] of this.nodeStressMap.entries()) {
      const node = stressData.node;
      if (node?.userData) {
        delete node.userData.stressPulseRate;
        delete node.userData.stressPulsePhase;
        delete node.userData.stressIntensity;
        delete node.userData.stressFieldBias;
        delete node.userData.stressFieldTension;
        delete node.userData.stressFieldColor;
      }
    }

    this.nodeStressMap.clear();
    this.networkStress = 0;
    this.elapsedTime = 0;
    this.pressureState.targetPressure = 0;
    this.pressureState.currentPressure = 0;
    this.pressureState.targetLoadBias = 0;
    this.pressureState.currentLoadBias = 0;
    this.pressureState.averageNodeLoad = 0;
    this.pressureState.stressedNodeRatio = 0;
    this.pressureState.pulse = 0;
    this.pressureState.turbulence = 0;
    this.pressureState.phase = 'detection';
    this.pressureState.phaseTime = 0;
    this.pressureState.lastPressure = 0;
    this.pressureState.burstHold = 0;
    this.pressureState.residueHold = 0;
    this.pressureState.burstEcho = 0;

    this._restoreSceneBaselines();
    this._setFieldVisibility(false);

    if (this.debugMode) {
      console.log('%c[CanonicalTemplate3] System reset', 'color: #ff9900; font-weight: bold;');
    }
  }

  dispose() {
    this.reset();

    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this._disposeObject(this.root);

    this.root = null;
    this.scene = null;
    this._ambientLightBaselines.clear();
    this._fogBaseline = null;
    this.fieldLayers = {
      canopy: [],
      horizon: [],
      lattice: [],
      seamCrowns: [],
      witnessArcs: [],
      riftVeins: [],
      dust: null,
      shell: null
    };

    if (this.debugMode) {
      console.log('%c[CanonicalTemplate3] System disposed', 'color: #ff9900; font-weight: bold;');
    }
  }

  _restoreSceneBaselines() {
    if (this.scene?.fog && this._fogBaseline) {
      this.scene.fog.color.copy(this._fogBaseline.color);
      if (typeof this.scene.fog.density === 'number') {
        this.scene.fog.density = this._fogBaseline.density;
      }
    }

    for (const [light, baseline] of this._ambientLightBaselines.entries()) {
      if (!light) continue;
      if (typeof baseline.intensity === 'number') {
        light.intensity = baseline.intensity;
      }
      if (baseline.color && light.color) {
        light.color.copy(baseline.color);
      }
    }
  }

  _setFieldVisibility(visible) {
    if (!this.root) return;
    this.root.visible = visible;

    if (!visible) {
      this.root.traverse((child) => {
        if (!child?.material) return;
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            if (material && typeof material.opacity === 'number') material.opacity = 0;
          });
          return;
        }
        if (typeof child.material.opacity === 'number') {
          child.material.opacity = 0;
        }
      });
    }
  }

  _disposeObject(object) {
    if (!object) return;
    object.traverse((child) => {
      if (child.geometry?.dispose) {
        child.geometry.dispose();
      }
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material?.dispose?.());
      } else if (child.material?.dispose) {
        child.material.dispose();
      }
    });
  }
}
