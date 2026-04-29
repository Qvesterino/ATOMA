import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { normalizeEnvironmentGeometry } from './RoundedEnvironmentGeometry.js';
import { getEnvSpriteTexture } from './EnvironmentPointFXBase.js';

const TAU = Math.PI * 2;
const SIGNAL_LIFETIME_MS = 6000;
const HAZARD_WORLD_BACKGROUND_ORDER = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_BACKGROUND);
const HAZARD_WORLD_OVERLAY_ORDER = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_WORLD_OVERLAY);
const HAZARD_TYPE_LIMITS = {
  electricalStorm: 2,
  gravitationalAnomaly: 2,
  chronoBloom: 1
};

const HAZARD_PALETTE = {
  blackHole: 0x07040d,
  deepVoid: 0x05131a,
  softHalo: 0xe8d0ff,
  coreWhite: 0xf7fbff,
  primaryCyan: 0x6deaff,
  electricEdge: 0x67f2ff,
  quantumViolet: 0xd07bff,
  breachRose: 0xff73cf,
  ritualWhite: 0xf7fbff,
  stormShadow: 0x08101a,
  pressureAmber: 0xffd48e,
  bloomMint: 0x77f7db,
  goldSigil: 0xfff4c2
};

const HAZARD_WORLD_PROFILE = {
  default: {
    modeKey: 'default',
    tag: 'world.default',
    titlePrefix: '',
    toneSuffix: 'wildfield',
    colors: {
      stormEdge: HAZARD_PALETTE.electricEdge,
      stormAura: HAZARD_PALETTE.primaryCyan,
      stormShell: HAZARD_PALETTE.stormShadow,
      gravityPrimary: HAZARD_PALETTE.primaryCyan,
      gravitySecondary: HAZARD_PALETTE.quantumViolet,
      gravityVeil: HAZARD_PALETTE.softHalo,
      chronoPrimary: HAZARD_PALETTE.bloomMint,
      chronoSecondary: HAZARD_PALETTE.quantumViolet,
      chronoCore: HAZARD_PALETTE.ritualWhite,
      chronoGold: HAZARD_PALETTE.goldSigil
    },
    motion: {
      driftMul: 1,
      shearMul: 1,
      pulseMul: 1,
      residueMul: 1
    }
  },
  sigma: {
    modeKey: 'sigma',
    tag: 'world.sigma',
    titlePrefix: 'Sigma',
    toneSuffix: 'anomaly-rift',
    colors: {
      stormEdge: 0x36f0ff,
      stormAura: 0x7dffb3,
      stormShell: 0x040712,
      gravityPrimary: 0x2df0ff,
      gravitySecondary: 0xff5de4,
      gravityVeil: 0x8d6cff,
      chronoPrimary: 0x7dffb3,
      chronoSecondary: 0xff5de4,
      chronoCore: 0xf7fbff,
      chronoGold: 0x8ffff0
    },
    motion: {
      driftMul: 1.08,
      shearMul: 1.4,
      pulseMul: 1.15,
      residueMul: 0.84
    }
  },
  memory: {
    modeKey: 'memory',
    tag: 'world.memory',
    titlePrefix: 'Archive',
    toneSuffix: 'mnemonic-cathedral',
    colors: {
      stormEdge: 0x9feeff,
      stormAura: 0x6fd7ff,
      stormShell: 0x09131f,
      gravityPrimary: 0x88e2ff,
      gravitySecondary: 0xffd37a,
      gravityVeil: 0xc6efff,
      chronoPrimary: 0xa7f6ff,
      chronoSecondary: 0xffd37a,
      chronoCore: 0xfaf9f1,
      chronoGold: 0xffe8ad
    },
    motion: {
      driftMul: 0.82,
      shearMul: 0.74,
      pulseMul: 0.68,
      residueMul: 1.22
    }
  }
};

/**
 * Environmental Hazards System
 * Spectacular world anomalies with signal-driven hazard spawning.
 */
export class EnvironmentalHazards {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.worldProfile = this._resolveWorldProfile();
    this.root = new THREE.Group();
    this.root.name = 'EnvironmentalHazardsRoot';
    this.root.renderOrder = HAZARD_WORLD_BACKGROUND_ORDER;
    this.root.userData = this.root.userData || {};
    this.root.userData.__environmentLayerId = 'EnvironmentalHazards';
    this.root.userData.__environmentOwner = 'EnvironmentalHazards';
    this.root.userData.isWorldFX = true;
    this.root.userData.currentMode = this.worldProfile.modeKey;
    this.scene?.add?.(this.root);
    this.residueRoot = new THREE.Group();
    this.residueRoot.name = 'EnvironmentalHazardsResidueRoot';
    this.residueRoot.renderOrder = HAZARD_WORLD_BACKGROUND_ORDER;
    this.residueRoot.userData = this.residueRoot.userData || {};
    this.residueRoot.userData.__environmentLayerId = 'EnvironmentalHazards';
    this.residueRoot.userData.__environmentOwner = 'EnvironmentalHazards';
    this.residueRoot.userData.isWorldFX = true;
    this.residueRoot.userData.type = 'hazardResidue';
    this.residueRoot.userData.currentMode = this.worldProfile.modeKey;
    this.root.add(this.residueRoot);

    this.enabled = true;
    this.hazards = new Map();
    this.residueScars = [];
    this._hazardSequence = 0;
    this._hazardEffectScratch = new THREE.Vector3();
    this._hazardDirectionScratch = new THREE.Vector3();
    this._hazardOrbitScratch = new THREE.Vector3();
    this._spawnScratch = new THREE.Vector3();
    this._spawnOriginScratch = new THREE.Vector3();
    this._colorScratchA = new THREE.Color();
    this._colorScratchB = new THREE.Color();
    this.metricBus = this._resolveMetricBus();
    this.metricSignalTimes = new Map();
    this.metricSubscriptions = [];
    this.lastSpawnAtByType = new Map();
    this.lastSignalSpawnAt = new Map();
    this.metricSignalBias = 0;
    this.frameScheduler = null;

    this.hazardEnvelope = {
      birth: 0.2,
      crest: 0.45,
      decay: 0.25,
      afterglow: 0.1
    };

    this.spawnCooldownMs = {
      electricalStorm: 9000,
      gravitationalAnomaly: 11000,
      chronoBloom: 16000,
      'loadPressure.high': 7000
    };

    this.sharedUniforms = {
      uTime: { value: 0 },
      uSignalBias: { value: 0 }
    };

    this._sharedCoreGeometry = new THREE.IcosahedronGeometry(1, 1);
    this._sharedAccentGeometry = new THREE.OctahedronGeometry(1, 0);
    this._sharedMiniAccentGeometry = new THREE.IcosahedronGeometry(1, 0);
    this._sharedUnitPlaneGeometry = normalizeEnvironmentGeometry(new THREE.PlaneGeometry(1, 1), {
      panel: {
        radiusRatio: 0.18,
        curveSegments: 4
      }
    });

    this._setupMetricTriggers();
  }

  createElectricalStorm(position, radius = 18, intensity = 1) {
    const hazard = this._createHazardRecord({
      type: 'electricalStorm',
      identity: 'thunder crown',
      title: 'Thunder Crown',
      subtitle: 'Cathedral storm of high pressure',
      visualTone: 'electric',
      position,
      radius,
      intensity,
      lifetime: 22,
      signalProfile: {
        primaryTrigger: 'global.corruption.high',
        secondaryTrigger: 'global.loadPressure.high',
        pressureBoost: 0,
        spawnMode: 'rupture-field'
      },
      effectProfile: {
        hostility: 'repulsive',
        aura: 'charged',
        distortion: 0.35
      }
    });

    const palette = this._getHazardPalette(hazard.type, hazard);
    const geometryBias = this._getHazardGeometryBias(hazard);
    const layers = this._createHazardLayerSet(hazard.root);
    hazard.layers = layers;

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.48 + i * 0.17),
          heightBias: (i - 1) * radius * 0.08,
          segments: Math.max(56, Math.round(88 * geometryBias.segmentMul)),
          gapEvery: Math.max(3, Math.round((5 + i) * geometryBias.gapEveryMul)),
          gapLength: Math.max(1, 1 + (i % 2) + geometryBias.gapLengthAdd),
          radialJitter: radius * 0.06 * geometryBias.jitterMul,
          yJitter: radius * 0.03 * geometryBias.jitterMul,
          angleOffset: i * 0.36 + geometryBias.angleShear * (i - 1)
        }),
        new THREE.LineBasicMaterial({
          color: i === 2 ? HAZARD_PALETTE.breachRose : palette.edge,
          transparent: true,
          opacity: 0.16 - i * 0.03,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      ring.rotation.set(
        Math.PI * (0.28 + i * 0.11),
        i * 0.55 + geometryBias.rotationYaw * (i - 1),
        i * 0.24 + geometryBias.rotationRoll * (i - 1)
      );
      ring.userData.baseOpacity = ring.material.opacity;
      layers.silhouetteLayer.add(this._tagHazardObject(ring, hazard.type, `storm-ring-${i}`));
    }

    for (let i = 0; i < 4; i++) {
      const arc = new THREE.Line(
        this._createFilamentCurveGeometry({
          radius: radius * (0.38 + i * 0.09),
          verticalSpan: radius * (0.7 + i * 0.08) * geometryBias.verticalMul,
          lateralAmplitude: radius * 0.14 * geometryBias.lateralMul,
          turns: 1.25 + i * 0.24 + geometryBias.turnsAdd,
          segments: Math.max(24, Math.round(40 * geometryBias.segmentMul)),
          phase: i * 1.1 + geometryBias.phaseShift * i
        }),
        new THREE.LineBasicMaterial({
          color: i % 2 === 0 ? palette.edge : HAZARD_PALETTE.ritualWhite,
          transparent: true,
          opacity: 0.12 + i * 0.02,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      arc.rotation.y = i * 0.9 + geometryBias.rotationYaw * i;
      arc.rotation.z = (i % 2 === 0 ? 1 : -1) * (0.22 + geometryBias.arcRoll);
      arc.userData.baseOpacity = arc.material.opacity;
      layers.filamentLayer.add(this._tagHazardObject(arc, hazard.type, `storm-arc-${i}`));
    }

    for (let i = 0; i < 3; i++) {
      const veil = new THREE.Mesh(
        this._createVeilStripGeometry({
          width: radius * (0.72 + i * 0.18) * geometryBias.veilWidthMul,
          height: radius * (1.4 + i * 0.16) * geometryBias.veilHeightMul,
          segments: Math.max(14, Math.round(18 * geometryBias.segmentMul)),
          edgeNoise: radius * 0.08 * geometryBias.jitterMul,
          depthNoise: radius * 0.12 * geometryBias.depthMul,
          taper: Math.max(0.28, 0.72 - i * 0.08 + geometryBias.veilTaperOffset)
        }),
        this._createHazardShaderMaterial({
          colorA: i === 1 ? palette.aura : palette.edge,
          colorB: i === 2 ? HAZARD_PALETTE.breachRose : HAZARD_PALETTE.stormShadow,
          opacity: 0.12 - i * 0.015,
          bias: 0.35 + i * 0.1,
          pulse: 0.75 + i * 0.16,
          flowSpeed: 0.7 + i * 0.25,
          additive: true,
          side: THREE.DoubleSide
        })
      );
      veil.position.y = radius * (0.1 + i * 0.16);
      veil.rotation.y = i * (TAU / 3) + 0.28 + geometryBias.rotationYaw * (i - 1);
      veil.rotation.z = (i - 1) * (0.22 + geometryBias.veilRoll);
      veil.userData.baseOpacity = veil.material.uniforms.uOpacity.value;
      layers.veilLayer.add(this._tagHazardObject(veil, hazard.type, `storm-veil-${i}`));
    }

    for (let i = 0; i < 2; i++) {
      const wake = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.92 + i * 0.21),
          heightBias: -radius * 0.18 + i * radius * 0.1,
          segments: Math.max(64, Math.round(104 * geometryBias.segmentMul)),
          gapEvery: Math.max(4, Math.round((7 + i) * geometryBias.gapEveryMul)),
          gapLength: Math.max(1, 2 + geometryBias.gapLengthAdd),
          radialJitter: radius * 0.08 * geometryBias.jitterMul,
          yJitter: radius * 0.04 * geometryBias.jitterMul,
          angleOffset: i * 0.5 + geometryBias.angleShear * i
        }),
        new THREE.LineBasicMaterial({
          color: i === 0 ? palette.aura : HAZARD_PALETTE.pressureAmber,
          transparent: true,
          opacity: 0.08 - i * 0.012,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      wake.rotation.x = Math.PI * 0.45 + i * 0.18;
      wake.rotation.z = i * 0.28 + geometryBias.rotationRoll * (i + 1);
      wake.scale.y = geometryBias.wakeScaleY;
      wake.userData.baseOpacity = wake.material.opacity;
      layers.wakeLayer.add(this._tagHazardObject(wake, hazard.type, `storm-wake-${i}`));
    }

    const core = new THREE.Mesh(
      this._sharedAccentGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.ritualWhite,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    core.scale.setScalar(radius * 0.16);
    core.userData.baseOpacity = core.material.opacity;
    layers.coreAccentLayer.add(this._tagHazardObject(core, hazard.type, 'storm-core'));

    const shell = new THREE.Mesh(
      this._sharedCoreGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.stormShadow,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      })
    );
    shell.scale.setScalar(radius * 0.56);
    shell.userData.baseOpacity = shell.material.opacity;
    layers.coreAccentLayer.add(this._tagHazardObject(shell, hazard.type, 'storm-shell'));

    const shardField = this._createShardField({
      count: 46,
      radius: radius * 0.95,
      height: radius * 0.48,
      size: radius * 0.022,
      colorA: palette.edge,
      colorB: HAZARD_PALETTE.breachRose,
      opacity: 0.28
    });
    layers.shardLayer.add(this._tagHazardObject(shardField.points, hazard.type, 'storm-shards'));
    hazard.shardField = shardField;

    if (geometryBias.modeKey === 'sigma') {
      for (let i = 0; i < 2; i++) {
        const sliver = new THREE.Line(
          this._createFilamentCurveGeometry({
            radius: radius * (0.22 + i * 0.08),
            verticalSpan: radius * (1.12 + i * 0.12),
            lateralAmplitude: radius * 0.06,
            turns: 0.45 + i * 0.12,
            segments: 22,
            phase: i * 1.7 + 0.3
          }),
          new THREE.LineBasicMaterial({
            color: i === 0 ? HAZARD_PALETTE.breachRose : palette.edge,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        sliver.rotation.y = i * 0.9 + 0.2;
        sliver.rotation.z = (i === 0 ? 1 : -1) * 0.34;
        sliver.userData.baseOpacity = sliver.material.opacity;
        layers.silhouetteLayer.add(this._tagHazardObject(sliver, hazard.type, `storm-sigma-sliver-${i}`));
      }
    } else if (geometryBias.modeKey === 'memory') {
      for (let i = 0; i < 2; i++) {
        const archiveHalo = new THREE.LineSegments(
          this._createBrokenRingGeometry({
            radius: radius * (0.62 + i * 0.18),
            heightBias: radius * (0.14 + i * 0.05),
            segments: 76,
            gapEvery: 12 + i,
            gapLength: 1,
            radialJitter: radius * 0.03,
            yJitter: radius * 0.018,
            angleOffset: i * 0.18
          }),
          new THREE.LineBasicMaterial({
            color: i === 0 ? HAZARD_PALETTE.pressureAmber : HAZARD_PALETTE.ritualWhite,
            transparent: true,
            opacity: 0.08 - i * 0.012,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        archiveHalo.rotation.x = Math.PI * (0.48 + i * 0.07);
        archiveHalo.rotation.z = i * 0.1;
        archiveHalo.userData.baseOpacity = archiveHalo.material.opacity;
        layers.wakeLayer.add(this._tagHazardObject(archiveHalo, hazard.type, `storm-memory-halo-${i}`));
      }
    }

    hazard.bolts = [];
    for (let i = 0; i < 4; i++) {
      const bolt = this._createStormBolt(hazard, i);
      hazard.bolts.push(bolt);
      layers.filamentLayer.add(this._tagHazardObject(bolt.glow, hazard.type, `storm-bolt-glow-${i}`));
      layers.filamentLayer.add(this._tagHazardObject(bolt.core, hazard.type, `storm-bolt-core-${i}`));
    }

    hazard.stormGroup = hazard.root;
    hazard.group = hazard.root;
    hazard.core = core;
    hazard.shell = shell;
    hazard.ringA = layers.silhouetteLayer.children[0] || null;
    hazard.ringB = layers.silhouetteLayer.children[1] || null;
    hazard.backplate = layers.veilLayer.children[0] || null;

    return this._finalizeHazard(hazard);
  }

  createGravitationalAnomaly(position, radius = 15, strength = 1) {
    const hazard = this._createHazardRecord({
      type: 'gravitationalAnomaly',
      identity: 'singularity eclipse',
      title: 'Singularity Eclipse',
      subtitle: 'Silent gravitational authority',
      visualTone: 'cosmic',
      position,
      radius,
      intensity: strength,
      strength,
      lifetime: 24,
      signalProfile: {
        primaryTrigger: 'global.stability.low',
        secondaryTrigger: 'global.loadPressure.high',
        pressureBoost: 0,
        spawnMode: 'collapse-field'
      },
      effectProfile: {
        hostility: 'attractive',
        aura: 'collapse',
        distortion: 0.48
      }
    });

    const palette = this._getHazardPalette(hazard.type, hazard);
    const geometryBias = this._getHazardGeometryBias(hazard);
    const layers = this._createHazardLayerSet(hazard.root);
    hazard.layers = layers;

    for (let i = 0; i < 3; i++) {
      const slit = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.42 + i * 0.2),
          heightBias: (i - 1) * radius * 0.11,
          segments: Math.max(56, Math.round(92 * geometryBias.segmentMul)),
          gapEvery: Math.max(4, Math.round(8 * geometryBias.gapEveryMul)),
          gapLength: Math.max(2, 3 + geometryBias.gapLengthAdd),
          radialJitter: radius * 0.09 * geometryBias.jitterMul,
          yJitter: radius * 0.08 * geometryBias.jitterMul,
          angleOffset: i * 0.62 + geometryBias.angleShear * i
        }),
        new THREE.LineBasicMaterial({
          color: i === 0 ? palette.ringSecondary : palette.ringPrimary,
          transparent: true,
          opacity: 0.12 - i * 0.02,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      slit.rotation.x = Math.PI * (0.22 + i * 0.17) + geometryBias.slitTilt * (i - 1);
      slit.rotation.y = i * 0.8 + geometryBias.rotationYaw * (i - 1);
      slit.scale.set(1 + i * 0.06 + geometryBias.slitWidthAdd, (0.68 + i * 0.06) * geometryBias.wakeScaleY, 1);
      slit.userData.baseOpacity = slit.material.opacity;
      layers.silhouetteLayer.add(this._tagHazardObject(slit, hazard.type, `gravity-slit-${i}`));
    }

    for (let i = 0; i < 4; i++) {
      const torsion = new THREE.Line(
        this._createFilamentCurveGeometry({
          radius: radius * (0.52 + i * 0.06),
          verticalSpan: radius * 0.92 * geometryBias.verticalMul,
          lateralAmplitude: radius * (0.1 + i * 0.015) * geometryBias.lateralMul,
          turns: 1.9 + i * 0.2 + geometryBias.turnsAdd,
          segments: Math.max(28, Math.round(46 * geometryBias.segmentMul)),
          phase: i * 1.3 + geometryBias.phaseShift * i
        }),
        new THREE.LineBasicMaterial({
          color: i % 2 === 0 ? palette.ringPrimary : HAZARD_PALETTE.breachRose,
          transparent: true,
          opacity: 0.09 + i * 0.018,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      torsion.rotation.z = (i % 2 === 0 ? 1 : -1) * (0.38 + geometryBias.arcRoll);
      torsion.userData.baseOpacity = torsion.material.opacity;
      layers.filamentLayer.add(this._tagHazardObject(torsion, hazard.type, `gravity-torsion-${i}`));
    }

    for (let i = 0; i < 3; i++) {
      const veil = new THREE.Mesh(
        this._createVeilStripGeometry({
          width: radius * (0.78 + i * 0.15) * geometryBias.veilWidthMul,
          height: radius * (1.65 + i * 0.12) * geometryBias.veilHeightMul,
          segments: Math.max(16, Math.round(20 * geometryBias.segmentMul)),
          edgeNoise: radius * 0.09 * geometryBias.jitterMul,
          depthNoise: radius * 0.18 * geometryBias.depthMul,
          taper: Math.max(0.3, 0.62 + geometryBias.veilTaperOffset)
        }),
        this._createHazardShaderMaterial({
          colorA: i === 0 ? palette.ringSecondary : HAZARD_PALETTE.deepVoid,
          colorB: i === 2 ? HAZARD_PALETTE.breachRose : palette.veil,
          opacity: 0.1 - i * 0.012,
          bias: -0.2 - i * 0.08,
          pulse: 0.48 + i * 0.14,
          flowSpeed: 0.36 + i * 0.11,
          additive: true,
          side: THREE.DoubleSide
        })
      );
      veil.position.set((i - 1) * radius * 0.08, radius * 0.06, -radius * 0.1 * i);
      veil.rotation.y = i * 0.72 + 0.18 + geometryBias.rotationYaw * (i - 1);
      veil.rotation.z = (i - 1) * (0.26 + geometryBias.veilRoll);
      veil.userData.baseOpacity = veil.material.uniforms.uOpacity.value;
      layers.veilLayer.add(this._tagHazardObject(veil, hazard.type, `gravity-veil-${i}`));
    }

    for (let i = 0; i < 2; i++) {
      const wake = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.95 + i * 0.22),
          heightBias: (i - 0.5) * radius * 0.15,
          segments: Math.max(72, Math.round(112 * geometryBias.segmentMul)),
          gapEvery: Math.max(4, Math.round(9 * geometryBias.gapEveryMul)),
          gapLength: Math.max(1, 2 + i + geometryBias.gapLengthAdd),
          radialJitter: radius * 0.1 * geometryBias.jitterMul,
          yJitter: radius * 0.06 * geometryBias.jitterMul,
          angleOffset: i * 0.48 + geometryBias.angleShear * i
        }),
        new THREE.LineBasicMaterial({
          color: i === 0 ? palette.ringPrimary : HAZARD_PALETTE.softHalo,
          transparent: true,
          opacity: 0.06 - i * 0.01,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      wake.rotation.x = Math.PI * (0.62 + i * 0.11);
      wake.rotation.y = i * 0.52 + geometryBias.rotationYaw * i;
      wake.scale.y = (0.72 + i * 0.08) * geometryBias.wakeScaleY;
      wake.userData.baseOpacity = wake.material.opacity;
      layers.wakeLayer.add(this._tagHazardObject(wake, hazard.type, `gravity-wake-${i}`));
    }

    const core = new THREE.Mesh(
      this._sharedCoreGeometry,
      new THREE.MeshBasicMaterial({
        color: palette.core,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      })
    );
    core.scale.setScalar(radius * 0.16);
    core.userData.baseOpacity = core.material.opacity;
    layers.coreAccentLayer.add(this._tagHazardObject(core, hazard.type, 'gravity-core'));

    const halo = new THREE.Mesh(
      this._sharedAccentGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.softHalo,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    halo.scale.setScalar(radius * 0.32);
    halo.rotation.set(0.3, 0.6, 0.2);
    halo.userData.baseOpacity = halo.material.opacity;
    layers.coreAccentLayer.add(this._tagHazardObject(halo, hazard.type, 'gravity-halo'));

    const shardField = this._createShardField({
      count: 54,
      radius: radius * 1.08,
      height: radius * 0.62,
      size: radius * 0.018,
      colorA: palette.ringPrimary,
      colorB: HAZARD_PALETTE.breachRose,
      opacity: 0.24
    });
    layers.shardLayer.add(this._tagHazardObject(shardField.points, hazard.type, 'gravity-shards'));
    hazard.shardField = shardField;

    if (geometryBias.modeKey === 'sigma') {
      for (let i = 0; i < 2; i++) {
        const ghostSlit = new THREE.LineSegments(
          this._createBrokenRingGeometry({
            radius: radius * (0.34 + i * 0.3),
            heightBias: -radius * 0.05 + i * radius * 0.09,
            segments: 68,
            gapEvery: 5,
            gapLength: 2,
            radialJitter: radius * 0.12,
            yJitter: radius * 0.09,
            angleOffset: 0.28 + i * 0.46
          }),
          new THREE.LineBasicMaterial({
            color: i === 0 ? HAZARD_PALETTE.breachRose : palette.ringSecondary,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        ghostSlit.rotation.set(Math.PI * (0.16 + i * 0.18), i * 0.66, (i === 0 ? 1 : -1) * 0.32);
        ghostSlit.scale.set(1.18, 0.54 + i * 0.06, 1);
        ghostSlit.userData.baseOpacity = ghostSlit.material.opacity;
        layers.silhouetteLayer.add(this._tagHazardObject(ghostSlit, hazard.type, `gravity-sigma-ghost-${i}`));
      }
    } else if (geometryBias.modeKey === 'memory') {
      for (let i = 0; i < 2; i++) {
        const archiveCorridor = new THREE.Mesh(
          this._createVeilStripGeometry({
            width: radius * (0.48 + i * 0.1),
            height: radius * (1.24 + i * 0.08),
            segments: 14,
            edgeNoise: radius * 0.03,
            depthNoise: radius * 0.08,
            taper: 0.42
          }),
          this._createHazardShaderMaterial({
            colorA: i === 0 ? palette.veil : HAZARD_PALETTE.pressureAmber,
            colorB: palette.ringPrimary,
            opacity: 0.07 - i * 0.01,
            bias: -0.08 - i * 0.04,
            pulse: 0.38 + i * 0.06,
            flowSpeed: 0.18 + i * 0.04,
            additive: true,
            side: THREE.DoubleSide
          })
        );
        archiveCorridor.position.set((i === 0 ? -1 : 1) * radius * 0.12, 0, -radius * (0.08 + i * 0.04));
        archiveCorridor.rotation.y = (i === 0 ? -1 : 1) * 0.34;
        archiveCorridor.userData.baseOpacity = archiveCorridor.material.uniforms.uOpacity.value;
        layers.veilLayer.add(this._tagHazardObject(archiveCorridor, hazard.type, `gravity-memory-corridor-${i}`));
      }
    }

    hazard.group = hazard.root;
    hazard.core = core;
    hazard.accretionRing = layers.silhouetteLayer.children[0] || null;
    hazard.lensRing = layers.silhouetteLayer.children[1] || null;
    hazard.veil = layers.veilLayer.children[0] || null;
    hazard.particles = [];

    return this._finalizeHazard(hazard);
  }

  createChronoBloom(position, radius = 17, intensity = 0.9) {
    const hazard = this._createHazardRecord({
      type: 'chronoBloom',
      identity: 'chrono bloom',
      title: 'Chrono Bloom',
      subtitle: 'Majestic aperture of stable unreality',
      visualTone: 'revelation',
      position,
      radius,
      intensity,
      lifetime: 20,
      signalProfile: {
        primaryTrigger: 'global.stability.high',
        secondaryTrigger: null,
        pressureBoost: 0,
        spawnMode: 'revelation-field'
      },
      effectProfile: {
        hostility: 'low',
        aura: 'temporal',
        distortion: 0.18
      }
    });

    const palette = this._getHazardPalette(hazard.type, hazard);
    const geometryBias = this._getHazardGeometryBias(hazard);
    const layers = this._createHazardLayerSet(hazard.root);
    hazard.layers = layers;

    for (let i = 0; i < 6; i++) {
      const petal = new THREE.Mesh(
        this._createVeilStripGeometry({
          width: radius * 0.36 * geometryBias.veilWidthMul,
          height: radius * (0.88 + (i % 2) * 0.08) * geometryBias.veilHeightMul,
          segments: Math.max(12, Math.round(16 * geometryBias.segmentMul)),
          edgeNoise: radius * 0.05 * geometryBias.jitterMul,
          depthNoise: radius * 0.08 * geometryBias.depthMul,
          taper: Math.max(0.24, 0.42 + geometryBias.veilTaperOffset)
        }),
        this._createHazardShaderMaterial({
          colorA: i % 2 === 0 ? palette.ringPrimary : palette.ringSecondary,
          colorB: palette.core,
          opacity: 0.13,
          bias: 0.18,
          pulse: 0.5 + i * 0.07,
          flowSpeed: 0.28 + i * 0.06,
          additive: true,
          side: THREE.DoubleSide
        })
      );
      petal.position.y = radius * 0.18;
      petal.rotation.y = (i / 6) * TAU + geometryBias.rotationYaw * (i - 2.5);
      petal.rotation.z = Math.PI * 0.5;
      petal.rotation.x = (i % 2 === 0 ? 1 : -1) * (0.22 + geometryBias.veilRoll);
      petal.userData.baseOpacity = petal.material.uniforms.uOpacity.value;
      petal.userData.bloomOffset = i / 6;
      layers.veilLayer.add(this._tagHazardObject(petal, hazard.type, `chrono-petal-${i}`));
    }

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.46 + i * 0.18),
          heightBias: radius * 0.04 * i,
          segments: Math.max(64, Math.round(96 * geometryBias.segmentMul)),
          gapEvery: Math.max(5, Math.round(10 * geometryBias.gapEveryMul)),
          gapLength: Math.max(1, 2 + geometryBias.gapLengthAdd),
          radialJitter: radius * 0.04 * geometryBias.jitterMul,
          yJitter: radius * 0.025 * geometryBias.jitterMul,
          angleOffset: i * 0.28 + geometryBias.angleShear * i
        }),
        new THREE.LineBasicMaterial({
          color: i === 0 ? palette.ringSecondary : palette.ringPrimary,
          transparent: true,
          opacity: 0.13 - i * 0.02,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      ring.rotation.x = Math.PI * (0.5 + i * 0.08) + geometryBias.slitTilt * (i - 1);
      ring.rotation.z = i * 0.16 + geometryBias.rotationRoll * i;
      ring.userData.baseOpacity = ring.material.opacity;
      layers.silhouetteLayer.add(this._tagHazardObject(ring, hazard.type, `chrono-ring-${i}`));
    }

    for (let i = 0; i < 5; i++) {
      const sigil = new THREE.Line(
        this._createFilamentCurveGeometry({
          radius: radius * (0.2 + i * 0.08),
          verticalSpan: radius * 0.8 * geometryBias.verticalMul,
          lateralAmplitude: radius * 0.06 * geometryBias.lateralMul,
          turns: 0.8 + i * 0.12 + geometryBias.turnsAdd * 0.35,
          segments: Math.max(24, Math.round(32 * geometryBias.segmentMul)),
          phase: i * 0.72 + geometryBias.phaseShift * i
        }),
        new THREE.LineBasicMaterial({
          color: i % 2 === 0 ? palette.ringPrimary : HAZARD_PALETTE.goldSigil,
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      sigil.rotation.y = i * 0.65 + geometryBias.rotationYaw * (i - 2);
      sigil.rotation.z = (i - 2) * (0.12 + geometryBias.arcRoll * 0.35);
      sigil.userData.baseOpacity = sigil.material.opacity;
      layers.filamentLayer.add(this._tagHazardObject(sigil, hazard.type, `chrono-sigil-${i}`));
    }

    for (let i = 0; i < 2; i++) {
      const wake = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.96 + i * 0.2),
          heightBias: radius * 0.08 + i * radius * 0.04,
          segments: Math.max(64, Math.round(100 * geometryBias.segmentMul)),
          gapEvery: Math.max(5, Math.round(11 * geometryBias.gapEveryMul)),
          gapLength: Math.max(1, 2 + geometryBias.gapLengthAdd),
          radialJitter: radius * 0.05 * geometryBias.jitterMul,
          yJitter: radius * 0.02 * geometryBias.jitterMul,
          angleOffset: i * 0.33 + geometryBias.angleShear * i
        }),
        new THREE.LineBasicMaterial({
          color: i === 0 ? HAZARD_PALETTE.goldSigil : palette.ringSecondary,
          transparent: true,
          opacity: 0.07 - i * 0.01,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      wake.rotation.x = Math.PI * 0.5 + geometryBias.slitTilt * 0.5;
      wake.scale.y = geometryBias.wakeScaleY;
      wake.userData.baseOpacity = wake.material.opacity;
      layers.wakeLayer.add(this._tagHazardObject(wake, hazard.type, `chrono-wake-${i}`));
    }

    const core = new THREE.Mesh(
      this._sharedMiniAccentGeometry,
      new THREE.MeshBasicMaterial({
        color: palette.core,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    core.scale.setScalar(radius * 0.14);
    core.userData.baseOpacity = core.material.opacity;
    layers.coreAccentLayer.add(this._tagHazardObject(core, hazard.type, 'chrono-core'));

    const crown = new THREE.Mesh(
      this._sharedAccentGeometry,
      new THREE.MeshBasicMaterial({
        color: HAZARD_PALETTE.goldSigil,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    crown.scale.setScalar(radius * 0.28);
    crown.rotation.set(0.22, 0.42, 0.18);
    crown.userData.baseOpacity = crown.material.opacity;
    layers.coreAccentLayer.add(this._tagHazardObject(crown, hazard.type, 'chrono-crown'));

    const shardField = this._createShardField({
      count: 40,
      radius: radius * 0.88,
      height: radius * 0.7,
      size: radius * 0.018,
      colorA: palette.ringPrimary,
      colorB: HAZARD_PALETTE.goldSigil,
      opacity: 0.3
    });
    layers.shardLayer.add(this._tagHazardObject(shardField.points, hazard.type, 'chrono-shards'));
    hazard.shardField = shardField;

    if (geometryBias.modeKey === 'sigma') {
      for (let i = 0; i < 2; i++) {
        const breachSpine = new THREE.Line(
          this._createFilamentCurveGeometry({
            radius: radius * (0.16 + i * 0.06),
            verticalSpan: radius * (1.02 + i * 0.1),
            lateralAmplitude: radius * 0.05,
            turns: 0.42 + i * 0.08,
            segments: 20,
            phase: 0.2 + i * 1.1
          }),
          new THREE.LineBasicMaterial({
            color: i === 0 ? HAZARD_PALETTE.breachRose : palette.ringSecondary,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        breachSpine.rotation.z = (i === 0 ? 1 : -1) * 0.28;
        breachSpine.userData.baseOpacity = breachSpine.material.opacity;
        layers.filamentLayer.add(this._tagHazardObject(breachSpine, hazard.type, `chrono-sigma-spine-${i}`));
      }
    } else if (geometryBias.modeKey === 'memory') {
      for (let i = 0; i < 2; i++) {
        const recallHalo = new THREE.LineSegments(
          this._createBrokenRingGeometry({
            radius: radius * (0.56 + i * 0.22),
            heightBias: radius * (0.1 + i * 0.06),
            segments: 84,
            gapEvery: 13 + i,
            gapLength: 1,
            radialJitter: radius * 0.025,
            yJitter: radius * 0.015,
            angleOffset: i * 0.2
          }),
          new THREE.LineBasicMaterial({
            color: i === 0 ? HAZARD_PALETTE.goldSigil : palette.ringSecondary,
            transparent: true,
            opacity: 0.075 - i * 0.01,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        recallHalo.rotation.x = Math.PI * (0.5 + i * 0.04);
        recallHalo.userData.baseOpacity = recallHalo.material.opacity;
        layers.wakeLayer.add(this._tagHazardObject(recallHalo, hazard.type, `chrono-memory-halo-${i}`));
      }
    }

    hazard.group = hazard.root;
    hazard.core = core;

    return this._finalizeHazard(hazard);
  }

  getHazardEffect(position) {
    if (!this.enabled || !position) {
      return this._hazardEffectScratch.set(0, 0, 0);
    }

    const force = this._hazardEffectScratch.set(0, 0, 0);
    const direction = this._hazardDirectionScratch;
    const orbit = this._hazardOrbitScratch;
    const time = this.sharedUniforms.uTime.value;

    for (const hazard of this.hazards.values()) {
      if (!hazard.active) continue;

      const distance = position.distanceTo(hazard.position);
      if (distance >= hazard.radius || distance <= 0.0001) continue;

      const falloff = 1 - distance / hazard.radius;
      if (hazard.type === 'electricalStorm') {
        direction.subVectors(position, hazard.position).normalize();
        const strength = falloff * hazard.intensity * 0.11;
        force.addScaledVector(direction, strength);
        force.x += Math.sin(time * 4 + distance) * strength * 0.08;
        force.z += Math.cos(time * 3.4 + distance * 0.4) * strength * 0.08;
      } else if (hazard.type === 'gravitationalAnomaly') {
        direction.subVectors(hazard.position, position).normalize();
        const strength = falloff * (hazard.strength || hazard.intensity) * 0.16;
        force.addScaledVector(direction, strength);
      } else if (hazard.type === 'chronoBloom') {
        direction.subVectors(position, hazard.position).normalize();
        orbit.set(-direction.z, 0, direction.x).normalize();
        const swirl = falloff * hazard.intensity * 0.035;
        force.addScaledVector(orbit, swirl);
        force.y += Math.sin(time * 1.4 + distance * 0.2) * swirl * 0.35;
      }
    }

    return force;
  }

  update(deltaTime) {
    if (!this.enabled || !this.frameScheduler?.shouldRunVisual?.()) return;

    this.sharedUniforms.uTime.value += Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    const signals = this._getHazardSignalModifiers();
    this.metricSignalBias =
      (signals.corruptionHigh ? 0.34 : 0) +
      (signals.loadPressureHigh ? 0.24 : 0) +
      (signals.stabilityLow ? 0.18 : 0) -
      (signals.stabilityHigh ? 0.15 : 0);
    this.sharedUniforms.uSignalBias.value = this.metricSignalBias;
    this._updateResidueScars(deltaTime, signals);

    for (const hazard of Array.from(this.hazards.values())) {
      if (!hazard.active) continue;
      hazard.age += deltaTime;
      hazard.time = hazard.age;
      this._updateHazardLifecycle(hazard, deltaTime);

      if (hazard.age >= hazard.lifetime) {
        this.deactivateHazard(hazard);
        continue;
      }

      if (hazard.type === 'electricalStorm') {
        this.updateElectricalStorm(hazard, deltaTime, signals);
      } else if (hazard.type === 'gravitationalAnomaly') {
        this.updateGravitationalAnomaly(hazard, deltaTime, signals);
      } else if (hazard.type === 'chronoBloom') {
        this.updateChronoBloom(hazard, deltaTime, signals);
      }
    }
  }

  updateElectricalStorm(hazard, deltaTime, signals = this._getHazardSignalModifiers()) {
    const lodScale = this._getHazardLODScale(hazard);
    const { pulse, slowPulse } = this._getHazardPhaseWeights(hazard);
    const { attack, crest, release } = this._getHazardPhaseState(hazard);
    const palette = this._getHazardPalette(hazard.type, hazard);
    const motion = this._getHazardMotionProfile(hazard);
    const pressureBoost = this._getPressureBoost(hazard);
    const crestBias = crest + pressureBoost * 0.45;
    const hover = Math.sin(hazard.time * 0.82 * motion.pulseMul) * hazard.radius * (0.015 + pressureBoost * 0.01) * motion.driftMul;
    const lateralDrift = Math.sin(hazard.time * 0.34 * motion.pulseMul) * hazard.radius * 0.012 * motion.driftMul;

    hazard.root.position.copy(hazard.basePosition);
    hazard.root.position.y += hover;
    hazard.root.position.x += lateralDrift;

    hazard.root.scale.setScalar(1 + attack * 0.04 + crestBias * 0.08 - release * 0.03 * motion.residueMul);
    hazard.root.rotation.y += deltaTime * (0.12 + crestBias * 0.2) * motion.shearMul;
    hazard.root.rotation.x = Math.sin(hazard.time * 0.41 * motion.pulseMul) * (0.05 + pressureBoost * 0.05) * motion.shearMul;

    this._applyLayerPulse(hazard.layers.silhouetteLayer, {
      opacityScale: lodScale * (0.65 + crestBias * 0.75),
      colorA: signals.corruptionHigh ? HAZARD_PALETTE.breachRose : palette.edge,
      colorB: signals.stabilityHigh ? HAZARD_PALETTE.ritualWhite : palette.aura,
      rotationY: deltaTime * (0.14 + pressureBoost * 0.4),
      rotationZ: deltaTime * 0.05
    });

    this._applyLayerPulse(hazard.layers.filamentLayer, {
      opacityScale: lodScale * (0.8 + crestBias * 1.1),
      colorA: signals.stabilityHigh ? HAZARD_PALETTE.ritualWhite : palette.edge,
      colorB: signals.corruptionHigh ? HAZARD_PALETTE.breachRose : palette.aura,
      rotationY: -deltaTime * (0.18 + pressureBoost * 0.3)
    });

    this._applyLayerPulse(hazard.layers.wakeLayer, {
      opacityScale: lodScale * (0.52 + crestBias * 0.6),
      colorA: palette.aura,
      colorB: HAZARD_PALETTE.pressureAmber,
      rotationY: deltaTime * (0.08 + pressureBoost * 0.16)
    });

    hazard.layers.veilLayer.children.forEach((veil, index) => {
      this._updateShaderUniforms(veil.material, {
        opacity: (veil.userData.baseOpacity || 0.1) * lodScale * (0.68 + attack * 0.36 + crestBias * 0.42),
        bias: 0.25 + pressureBoost * 0.7 + index * 0.1,
        pulse: 0.9 + pulse * 0.18 + index * 0.06,
        time: this.sharedUniforms.uTime.value,
        colorA: index === 1 && signals.stabilityHigh ? HAZARD_PALETTE.ritualWhite : palette.edge,
        colorB: signals.corruptionHigh ? HAZARD_PALETTE.breachRose : HAZARD_PALETTE.stormShadow
      });
      veil.rotation.y += deltaTime * (0.2 + index * 0.06 + pressureBoost * 0.18);
    });

    hazard.layers.coreAccentLayer.children.forEach((mesh, index) => {
      if (!mesh.material) return;
      const opacity = (mesh.userData.baseOpacity || mesh.material.opacity || 0.1) * lodScale * (0.8 + crestBias * 0.7);
      mesh.material.opacity = opacity;
      mesh.material.color.setHex(index === 0
        ? (signals.stabilityHigh ? HAZARD_PALETTE.ritualWhite : palette.core)
        : (signals.corruptionHigh ? HAZARD_PALETTE.breachRose : HAZARD_PALETTE.pressureAmber));
      mesh.rotation.x += deltaTime * (0.26 + index * 0.08);
      mesh.rotation.y -= deltaTime * (0.33 + index * 0.05);
      const baseScale = index === 0 ? hazard.radius * 0.16 : hazard.radius * 0.28;
      mesh.scale.setScalar(baseScale * (0.92 + slowPulse * 0.08 + crestBias * 0.05));
    });

    hazard.bolts.forEach((bolt, index) => {
      this._updateStormBolt(hazard, bolt, deltaTime, {
        crestBias,
        lodScale,
        edgeColor: signals.corruptionHigh ? HAZARD_PALETTE.breachRose : palette.edge,
        coreColor: signals.stabilityHigh ? HAZARD_PALETTE.ritualWhite : palette.core,
        boltIndex: index
      });
    });

    this._updateShardField(hazard.shardField, hazard, deltaTime, {
      radialSpeed: 0.18 + pressureBoost * 0.18,
      verticalMotion: 0.28,
      swirl: 0.9 + crestBias * 0.4,
      mode: 'storm',
      lodScale
    });
  }

  updateGravitationalAnomaly(hazard, deltaTime, signals = this._getHazardSignalModifiers()) {
    const lodScale = this._getHazardLODScale(hazard);
    const { pulse, slowPulse } = this._getHazardPhaseWeights(hazard);
    const { attack, crest, release } = this._getHazardPhaseState(hazard);
    const palette = this._getHazardPalette(hazard.type, hazard);
    const motion = this._getHazardMotionProfile(hazard);
    const pressureBoost = this._getPressureBoost(hazard);
    const collapseBias = crest + (signals.stabilityLow ? 0.22 : 0) + pressureBoost * 0.35;
    const verticalSink = Math.sin(hazard.time * 0.46 * motion.pulseMul) * hazard.radius * 0.012 * motion.driftMul;
    const orbitDrift = Math.cos(hazard.time * 0.22 * motion.pulseMul) * hazard.radius * 0.01 * motion.driftMul;

    hazard.root.position.copy(hazard.basePosition);
    hazard.root.position.y += verticalSink;
    hazard.root.position.z += orbitDrift;

    hazard.root.scale.setScalar(1 + attack * 0.02 + collapseBias * 0.06 - release * 0.02 * motion.residueMul);
    hazard.root.rotation.y -= deltaTime * (0.07 + collapseBias * 0.08) * motion.shearMul;
    hazard.root.rotation.z = Math.sin(hazard.time * 0.33 * motion.pulseMul) * 0.04 * motion.shearMul;

    this._applyLayerPulse(hazard.layers.silhouetteLayer, {
      opacityScale: lodScale * (0.58 + collapseBias * 0.78),
      colorA: signals.corruptionHigh ? HAZARD_PALETTE.breachRose : palette.ringSecondary,
      colorB: signals.stabilityHigh ? HAZARD_PALETTE.softHalo : palette.ringPrimary,
      rotationY: -deltaTime * (0.08 + pressureBoost * 0.12),
      rotationX: deltaTime * 0.03
    });

    this._applyLayerPulse(hazard.layers.filamentLayer, {
      opacityScale: lodScale * (0.7 + collapseBias * 0.6),
      colorA: palette.ringPrimary,
      colorB: signals.corruptionHigh ? HAZARD_PALETTE.breachRose : palette.ringSecondary,
      rotationY: deltaTime * (0.05 + pressureBoost * 0.08)
    });

    this._applyLayerPulse(hazard.layers.wakeLayer, {
      opacityScale: lodScale * (0.46 + collapseBias * 0.5),
      colorA: palette.ringPrimary,
      colorB: HAZARD_PALETTE.softHalo,
      rotationY: -deltaTime * (0.04 + pressureBoost * 0.05)
    });

    hazard.layers.veilLayer.children.forEach((veil, index) => {
      this._updateShaderUniforms(veil.material, {
        opacity: (veil.userData.baseOpacity || 0.1) * lodScale * (0.76 + collapseBias * 0.38),
        bias: -0.35 - pressureBoost * 0.35 - index * 0.08,
        pulse: 0.55 + slowPulse * 0.1 + index * 0.05,
        time: this.sharedUniforms.uTime.value,
        colorA: index === 0 ? palette.ringSecondary : HAZARD_PALETTE.deepVoid,
        colorB: signals.corruptionHigh ? HAZARD_PALETTE.breachRose : palette.veil
      });
      veil.rotation.y -= deltaTime * (0.12 + index * 0.04);
      veil.position.x = Math.sin(hazard.time * (0.32 + index * 0.08)) * hazard.radius * 0.03 * (index + 1);
    });

    hazard.layers.coreAccentLayer.children.forEach((mesh, index) => {
      if (!mesh.material) return;
      const opacity = (mesh.userData.baseOpacity || mesh.material.opacity || 0.1) * lodScale * (0.88 + collapseBias * 0.42);
      mesh.material.opacity = opacity;
      mesh.material.color.setHex(index === 0 ? palette.core : palette.ringSecondary);
      const baseScale = index === 0 ? hazard.radius * 0.16 : hazard.radius * 0.32;
      mesh.scale.setScalar(baseScale * (0.95 + pulse * 0.05 - collapseBias * 0.04));
      mesh.rotation.x += deltaTime * 0.12;
      mesh.rotation.y -= deltaTime * (0.4 + index * 0.06);
    });

    this._updateShardField(hazard.shardField, hazard, deltaTime, {
      radialSpeed: -0.24 - pressureBoost * 0.1,
      verticalMotion: 0.14,
      swirl: -0.62 - collapseBias * 0.2,
      mode: 'gravity',
      lodScale
    });
  }

  updateChronoBloom(hazard, deltaTime, signals = this._getHazardSignalModifiers()) {
    const lodScale = this._getHazardLODScale(hazard);
    const { pulse, slowPulse } = this._getHazardPhaseWeights(hazard);
    const { attack, crest } = this._getHazardPhaseState(hazard);
    const palette = this._getHazardPalette(hazard.type, hazard);
    const motion = this._getHazardMotionProfile(hazard);
    const revelationBias = crest + (signals.stabilityHigh ? 0.24 : 0);
    const bloomLift = Math.sin(hazard.time * 0.64 * motion.pulseMul) * hazard.radius * 0.02 * motion.driftMul;
    const bloomDrift = Math.cos(hazard.time * 0.28 * motion.pulseMul) * hazard.radius * 0.015 * motion.driftMul;

    hazard.root.position.copy(hazard.basePosition);
    hazard.root.position.y += bloomLift;
    hazard.root.position.x += bloomDrift;

    hazard.root.scale.setScalar(1 + attack * 0.03 + revelationBias * 0.05);
    hazard.root.rotation.y += deltaTime * 0.06 * motion.shearMul;
    hazard.root.rotation.z = Math.sin(hazard.time * 0.4 * motion.pulseMul) * 0.035 * motion.shearMul;

    this._applyLayerPulse(hazard.layers.silhouetteLayer, {
      opacityScale: lodScale * (0.58 + revelationBias * 0.55),
      colorA: palette.ringSecondary,
      colorB: HAZARD_PALETTE.goldSigil,
      rotationY: deltaTime * 0.05
    });

    this._applyLayerPulse(hazard.layers.filamentLayer, {
      opacityScale: lodScale * (0.62 + revelationBias * 0.48),
      colorA: palette.ringPrimary,
      colorB: HAZARD_PALETTE.goldSigil,
      rotationY: -deltaTime * 0.06
    });

    this._applyLayerPulse(hazard.layers.wakeLayer, {
      opacityScale: lodScale * (0.4 + revelationBias * 0.34),
      colorA: HAZARD_PALETTE.goldSigil,
      colorB: palette.ringSecondary,
      rotationY: deltaTime * 0.03
    });

    hazard.layers.veilLayer.children.forEach((petal, index) => {
      this._updateShaderUniforms(petal.material, {
        opacity: (petal.userData.baseOpacity || 0.1) * lodScale * (0.82 + revelationBias * 0.38),
        bias: 0.12 + index * 0.03,
        pulse: 0.46 + slowPulse * 0.08 + index * 0.04,
        time: this.sharedUniforms.uTime.value,
        colorA: index % 2 === 0 ? palette.ringPrimary : palette.ringSecondary,
        colorB: palette.core
      });
      const bloomScale = 0.92 + pulse * 0.08 + revelationBias * 0.06;
      petal.scale.setScalar(bloomScale);
      petal.rotation.y += deltaTime * (0.08 + index * 0.004);
      petal.position.y = hazard.radius * (0.16 + Math.sin(hazard.time * 0.7 + petal.userData.bloomOffset * TAU) * 0.03);
    });

    hazard.layers.coreAccentLayer.children.forEach((mesh, index) => {
      if (!mesh.material) return;
      const opacity = (mesh.userData.baseOpacity || mesh.material.opacity || 0.1) * lodScale * (0.95 + revelationBias * 0.3);
      mesh.material.opacity = opacity;
      mesh.material.color.setHex(index === 0 ? palette.core : HAZARD_PALETTE.goldSigil);
      const baseScale = index === 0 ? hazard.radius * 0.14 : hazard.radius * 0.28;
      mesh.scale.setScalar(baseScale * (0.94 + pulse * 0.06));
      mesh.rotation.x += deltaTime * 0.18;
      mesh.rotation.y += deltaTime * 0.22;
    });

    this._updateShardField(hazard.shardField, hazard, deltaTime, {
      radialSpeed: 0.04,
      verticalMotion: 0.22,
      swirl: 0.44,
      mode: 'chrono',
      lodScale
    });
  }

  isInDangerZone(position) {
    if (!this.enabled || !position) {
      return null;
    }

    for (const hazard of this.hazards.values()) {
      if (hazard.active) {
        const distance = position.distanceTo(hazard.position);
        if (distance < hazard.radius) {
          return { hazard, distance, ratio: distance / hazard.radius };
        }
      }
    }
    return null;
  }

  deactivateHazard(hazardRef) {
    const options = arguments.length > 1 && arguments[1] ? arguments[1] : {};
    const skipScar = options.skipScar === true;
    const hazard = typeof hazardRef === 'string'
      ? this.hazards.get(hazardRef)
      : hazardRef && hazardRef.id
        ? this.hazards.get(hazardRef.id)
        : hazardRef;

    if (!hazard) return;
    if (!hazard.active) return;
    if (!skipScar) {
      this._spawnResidueScar(hazard);
    }
    hazard.active = false;
    this.root.remove(hazard.root);
    this._disposeObjectTree(hazard.root);
    this.hazards.delete(hazard.id);
  }

  setEnabled(enabled = true) {
    this.enabled = !!enabled;
    if (this.root) {
      this.root.visible = this.enabled;
    }
    return this.enabled;
  }

  enable() {
    return this.setEnabled(true);
  }

  disable() {
    return this.setEnabled(false);
  }

  dispose() {
    for (const hazard of Array.from(this.hazards.values())) {
      this.deactivateHazard(hazard, { skipScar: true });
    }

    this._clearResidueScars();
    this.hazards.clear();
    this._detachMetricTriggers();
    this.root?.removeFromParent?.();
    this._sharedCoreGeometry?.dispose?.();
    this._sharedAccentGeometry?.dispose?.();
    this._sharedMiniAccentGeometry?.dispose?.();
    this._sharedUnitPlaneGeometry?.dispose?.();
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _setupMetricTriggers() {
    this._subscribeMetricTag('global.corruption.high', 'corruption.high');
    this._subscribeMetricTag('global.loadPressure.high', 'loadPressure.high');
    this._subscribeMetricTag('global.stability.low', 'stability.low');
    this._subscribeMetricTag('global.stability.high', 'stability.high');
  }

  _subscribeMetricTag(eventName, signalKey) {
    const bus = this.metricBus;
    if (!bus || !eventName || !signalKey) return;

    const handler = () => {
      this.metricSignalTimes.set(signalKey, this._now());
      this._handleMetricSignal(signalKey);
    };

    if (typeof bus.on === 'function') {
      bus.on(eventName, handler);
      this.metricSubscriptions.push({ eventName, handler, method: 'off' });
      return;
    }

    if (typeof bus.subscribe === 'function') {
      bus.subscribe(eventName, handler);
      this.metricSubscriptions.push({ eventName, handler, method: 'unsubscribe' });
    }
  }

  _detachMetricTriggers() {
    const bus = this.metricBus;
    if (!bus) return;

    for (const subscription of this.metricSubscriptions) {
      if (subscription.method === 'off' && typeof bus.off === 'function') {
        bus.off(subscription.eventName, subscription.handler);
      } else if (subscription.method === 'unsubscribe' && typeof bus.unsubscribe === 'function') {
        bus.unsubscribe(subscription.eventName, subscription.handler);
      }
    }

    this.metricSubscriptions = [];
  }

  _handleMetricSignal(signalKey) {
    if (!this.enabled) return;
    if (signalKey === 'loadPressure.high') {
      this._amplifyPressureHazards();
    }
    this._spawnMetricHazard(signalKey);
  }

  _spawnMetricHazard(signalKey) {
    const now = this._now();
    const lastSignalSpawn = this.lastSignalSpawnAt.get(signalKey) || 0;
    const signalCooldown = this.spawnCooldownMs[signalKey] || 0;
    if ((now - lastSignalSpawn) < signalCooldown) return;
    if (this.hazards.size >= this._getMaxHazardCount()) return;

    let spawnType = null;
    if (signalKey === 'corruption.high') {
      spawnType = 'electricalStorm';
    } else if (signalKey === 'stability.low') {
      spawnType = 'gravitationalAnomaly';
    } else if (signalKey === 'stability.high') {
      spawnType = 'chronoBloom';
    } else if (signalKey === 'loadPressure.high') {
      spawnType = this._getActiveHazardCountByType('electricalStorm') <= this._getActiveHazardCountByType('gravitationalAnomaly')
        ? 'electricalStorm'
        : 'gravitationalAnomaly';
    }

    if (!spawnType) return;

    const lastTypeSpawn = this.lastSpawnAtByType.get(spawnType) || 0;
    const typeCooldown = this.spawnCooldownMs[spawnType] || 0;
    if ((now - lastTypeSpawn) < typeCooldown) return;
    if (this._getActiveHazardCountByType(spawnType) >= (HAZARD_TYPE_LIMITS[spawnType] || 1)) return;

    const position = this._sampleHazardSpawnPosition(spawnType);
    if (!position) return;

    if (spawnType === 'electricalStorm') {
      this.createElectricalStorm(position, 16 + Math.random() * 8, 0.9 + Math.random() * 0.45);
    } else if (spawnType === 'gravitationalAnomaly') {
      this.createGravitationalAnomaly(position, 14 + Math.random() * 7, 0.95 + Math.random() * 0.35);
    } else if (spawnType === 'chronoBloom') {
      this.createChronoBloom(position, 15 + Math.random() * 6, 0.8 + Math.random() * 0.25);
    }

    this.lastSignalSpawnAt.set(signalKey, now);
    this.lastSpawnAtByType.set(spawnType, now);
  }

  _amplifyPressureHazards() {
    const now = this._now();
    for (const hazard of this.hazards.values()) {
      if (!hazard.active || hazard.type === 'chronoBloom') continue;
      hazard.intensity = Math.min(1.8, hazard.intensity * 1.06 + 0.04);
      hazard.strength = Math.min(1.8, (hazard.strength || hazard.intensity) * 1.06 + 0.04);
      hazard.signalProfile.pressureBoost = now;
    }
  }

  _getActiveHazardCountByType(type) {
    let count = 0;
    for (const hazard of this.hazards.values()) {
      if (hazard.active && hazard.type === type) count += 1;
    }
    return count;
  }

  _getMaxHazardCount() {
    return 5;
  }

  _sampleHazardSpawnPosition(type) {
    const origin = this._spawnOriginScratch;
    if (this.camera?.position) {
      origin.copy(this.camera.position);
    } else {
      origin.set(0, 0, 0);
    }

    const angle = Math.random() * TAU;
    const distance = 16 + Math.random() * 26;
    const verticalBias = type === 'chronoBloom'
      ? 10 + Math.random() * 8
      : type === 'electricalStorm'
        ? 7 + Math.random() * 10
        : 5 + Math.random() * 8;

    return this._spawnScratch.set(
      origin.x + Math.cos(angle) * distance,
      Math.max(4, origin.y + verticalBias),
      origin.z + Math.sin(angle) * distance
    ).clone();
  }

  _createHazardRecord({
    type,
    identity,
    title,
    subtitle,
    visualTone,
    position,
    radius,
    intensity = 1,
    strength = intensity,
    lifetime = 20,
    signalProfile = {},
    effectProfile = {}
  }) {
    const worldProfile = this._resolveWorldProfile();
    const safePosition = position?.clone?.() || new THREE.Vector3();
    const root = new THREE.Group();
    root.name = `${type}Root`;
    root.renderOrder = HAZARD_WORLD_BACKGROUND_ORDER;
    root.position.copy(safePosition);

    const hazard = {
      id: `hazard.${this._hazardSequence++}`,
      type,
      identity,
      title,
      subtitle,
      visualTone,
      position: safePosition,
      basePosition: safePosition.clone(),
      radius,
      intensity,
      strength,
      lifetime,
      age: 0,
      time: 0,
      phase: 'detection',
      phaseTime: 0,
      phaseProgress: 0,
      phaseDurations: this._getHazardPhaseDurations(worldProfile),
      active: true,
      root,
      layers: null,
      uniforms: {},
      signalProfile,
      effectProfile,
      worldProfile,
      group: root
    };

    root.userData = root.userData || {};
    root.userData.hazardPhase = hazard.phase;
    root.userData.currentMode = worldProfile.modeKey;
    this._tagHazardObject(root, type, `${type}-root`);
    root.renderOrder = HAZARD_WORLD_BACKGROUND_ORDER;
    return hazard;
  }

  _createHazardLayerSet(root) {
    const layers = {
      silhouetteLayer: new THREE.Group(),
      filamentLayer: new THREE.Group(),
      veilLayer: new THREE.Group(),
      shardLayer: new THREE.Group(),
      wakeLayer: new THREE.Group(),
      coreAccentLayer: new THREE.Group()
    };

    Object.entries(layers).forEach(([key, group], index) => {
      group.name = key;
      group.renderOrder = HAZARD_WORLD_OVERLAY_ORDER;
      root.add(group);
    });

    return layers;
  }

  _finalizeHazard(hazard) {
    this.root.add(hazard.root);
    this.hazards.set(hazard.id, hazard);
    this._emitHazardEvent('environment.hazard.active', hazard);
    return hazard;
  }

  _createStormBolt(hazard, index) {
    const glow = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: HAZARD_PALETTE.primaryCyan,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const core = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: HAZARD_PALETTE.ritualWhite,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
      })
    );

    const bolt = {
      glow,
      core,
      life: 0,
      maxLife: 0.3 + Math.random() * 0.3,
      seed: index * 0.73 + Math.random() * 2
    };

    this._randomizeStormBolt(hazard, bolt, true);
    return bolt;
  }

  _randomizeStormBolt(hazard, bolt, resetLife = false) {
    const branchSegments = [];
    const steps = 4;
    const rootY = hazard.radius * 0.55;
    let prevX = Math.sin(bolt.seed + hazard.time) * hazard.radius * 0.12;
    let prevY = rootY;
    let prevZ = Math.cos(bolt.seed * 1.13 + hazard.time * 0.5) * hazard.radius * 0.12;

    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / steps;
      const nextX = Math.sin(bolt.seed * 1.7 + t * 2.3 + hazard.time * 2.1) * hazard.radius * (0.18 + t * 0.04);
      const nextY = rootY - t * hazard.radius * (0.48 + Math.random() * 0.18);
      const nextZ = Math.cos(bolt.seed * 1.2 + t * 2.6 - hazard.time) * hazard.radius * (0.16 + t * 0.05);
      branchSegments.push(prevX, prevY, prevZ, nextX, nextY, nextZ);
      prevX = nextX;
      prevY = nextY;
      prevZ = nextZ;
    }

    for (let i = 0; i < 2; i++) {
      const forkOriginIndex = Math.max(0, branchSegments.length - 12 - i * 6);
      const ox = branchSegments[forkOriginIndex];
      const oy = branchSegments[forkOriginIndex + 1];
      const oz = branchSegments[forkOriginIndex + 2];
      const ex = ox + Math.sin(bolt.seed + i * 1.9) * hazard.radius * 0.18;
      const ey = oy - hazard.radius * (0.16 + i * 0.06);
      const ez = oz + Math.cos(bolt.seed * 1.3 + i * 1.6) * hazard.radius * 0.18;
      branchSegments.push(ox, oy, oz, ex, ey, ez);
    }

    const positions = new Float32Array(branchSegments);
    bolt.glow.geometry.dispose();
    bolt.core.geometry.dispose();
    bolt.glow.geometry = new THREE.BufferGeometry();
    bolt.core.geometry = new THREE.BufferGeometry();
    bolt.glow.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    bolt.core.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.slice(), 3));

    bolt.life = resetLife ? bolt.maxLife : bolt.maxLife * (0.6 + Math.random() * 0.4);
  }

  _createHazardShaderMaterial({
    colorA,
    colorB,
    opacity = 0.1,
    bias = 0,
    pulse = 0.6,
    flowSpeed = 0.5,
    additive = true,
    side = THREE.DoubleSide
  }) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: this.sharedUniforms.uTime,
        uSignalBias: this.sharedUniforms.uSignalBias,
        uOpacity: { value: opacity },
        uBias: { value: bias },
        uPulse: { value: pulse },
        uFlowSpeed: { value: flowSpeed },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uBias;
        uniform float uFlowSpeed;

        void main() {
          vUv = uv;
          vec3 transformed = position;
          float waveA = sin((uv.y * 6.0) + uTime * (0.9 + uFlowSpeed) + uBias * 3.0) * 0.08;
          float waveB = cos((uv.y * 10.0) - uTime * (0.4 + uFlowSpeed * 0.6) + uBias * 2.0) * 0.05;
          transformed.x += waveA + waveB;
          transformed.z += sin((uv.y * 8.0) + uTime * (0.45 + uFlowSpeed * 0.5) - uBias * 1.4) * 0.12;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uSignalBias;
        uniform float uOpacity;
        uniform float uBias;
        uniform float uPulse;
        uniform vec3 uColorA;
        uniform vec3 uColorB;

        void main() {
          float edge = smoothstep(0.0, 0.22, vUv.x) * (1.0 - smoothstep(0.78, 1.0, vUv.x));
          float verticalFade = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.84, 1.0, vUv.y));
          float band = 0.5 + 0.5 * sin(vUv.y * 11.0 + uTime * (1.8 + uPulse) + uBias * 4.0);
          float shimmer = 0.55 + 0.45 * sin(uTime * (2.2 + uPulse * 0.5) + vUv.y * 7.0 + uSignalBias * 4.0);
          vec3 color = mix(uColorA, uColorB, clamp(band * 0.7 + uSignalBias * 0.2 + 0.2, 0.0, 1.0));
          float alpha = uOpacity * edge * verticalFade * (0.75 + shimmer * 0.25);
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
  }

  _createVeilStripGeometry({
    width = 1,
    height = 1,
    segments = 16,
    edgeNoise = 0.1,
    depthNoise = 0.1,
    taper = 0.7
  }) {
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = (t - 0.5) * height;
      const profile = 1 - Math.abs(t - 0.5) * taper;
      const leftX = (-width * 0.5 * profile) + Math.sin(t * 7.4) * edgeNoise;
      const rightX = (width * 0.5 * profile) + Math.cos(t * 6.1) * edgeNoise;
      const leftZ = Math.cos(t * 9.1) * depthNoise;
      const rightZ = Math.sin(t * 8.4) * depthNoise;

      positions.push(leftX, y, leftZ);
      positions.push(rightX, y, rightZ);
      uvs.push(0, t, 1, t);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  _createBrokenRingGeometry({
    radius = 1,
    heightBias = 0,
    segments = 72,
    gapEvery = 6,
    gapLength = 1,
    radialJitter = 0.05,
    yJitter = 0.02,
    angleOffset = 0
  }) {
    const positions = [];

    for (let i = 0; i < segments; i++) {
      if ((i % gapEvery) < gapLength) continue;

      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const angle0 = angleOffset + t0 * TAU;
      const angle1 = angleOffset + t1 * TAU;
      const radius0 = radius + Math.sin(angle0 * 3.7) * radialJitter;
      const radius1 = radius + Math.cos(angle1 * 3.1) * radialJitter;
      const y0 = heightBias + Math.sin(angle0 * 4.1) * yJitter;
      const y1 = heightBias + Math.cos(angle1 * 4.6) * yJitter;

      positions.push(
        Math.cos(angle0) * radius0, y0, Math.sin(angle0) * radius0,
        Math.cos(angle1) * radius1, y1, Math.sin(angle1) * radius1
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }

  _createFilamentCurveGeometry({
    radius = 1,
    verticalSpan = 1,
    lateralAmplitude = 0.1,
    turns = 1.5,
    segments = 32,
    phase = 0
  }) {
    const positions = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = phase + t * TAU * turns;
      const y = (t - 0.5) * verticalSpan;
      const radial = radius * (0.8 + Math.sin(t * Math.PI) * 0.2);
      const x = Math.cos(angle) * radial + Math.sin(angle * 2.1) * lateralAmplitude;
      const z = Math.sin(angle) * radial + Math.cos(angle * 1.7) * lateralAmplitude;
      positions.push(x, y, z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }

  _createShardField({ count, radius, height, size, colorA, colorB, opacity = 0.25 }) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const verticals = new Float32Array(count);
    const phases = new Float32Array(count);
    const mixColor = new THREE.Color();

    const colorStart = this._colorScratchA.set(colorA).clone();
    const colorEnd = this._colorScratchB.set(colorB).clone();

    for (let i = 0; i < count; i++) {
      const mix = count <= 1 ? 0 : i / (count - 1);
      angles[i] = Math.random() * TAU;
      radii[i] = radius * (0.55 + Math.random() * 0.45);
      verticals[i] = (Math.random() - 0.5) * height;
      phases[i] = Math.random() * TAU;
      positions[i * 3 + 0] = Math.cos(angles[i]) * radii[i];
      positions[i * 3 + 1] = verticals[i];
      positions[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
      mixColor.copy(colorStart).lerp(colorEnd, mix);
      colors[i * 3 + 0] = mixColor.r;
      colors[i * 3 + 1] = mixColor.g;
      colors[i * 3 + 2] = mixColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size,
      transparent: true,
      opacity,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      map: getEnvSpriteTexture('dust'),
      alphaTest: 0.02
    });

    const points = new THREE.Points(geometry, material);
    points.userData.baseOpacity = opacity;

    return {
      points,
      positions,
      angles,
      radii,
      verticals,
      phases,
      count,
      baseRadius: radius,
      baseHeight: height,
      baseSize: size
    };
  }

  _resolveWorldModeKey() {
    const raw = this.scene?.userData?.currentMode || 'default';
    const normalized = typeof raw === 'string' ? raw.toLowerCase() : 'default';
    if (normalized === 'sigma') return 'sigma';
    if (normalized === 'memory') return 'memory';
    return 'default';
  }

  _resolveWorldProfile() {
    const modeKey = this._resolveWorldModeKey();
    const profile = HAZARD_WORLD_PROFILE[modeKey] || HAZARD_WORLD_PROFILE.default;
    return {
      modeKey,
      tag: profile.tag,
      titlePrefix: profile.titlePrefix,
      toneSuffix: profile.toneSuffix,
      colors: { ...profile.colors },
      motion: { ...profile.motion }
    };
  }

  _getHazardPhaseDurations(worldProfile) {
    if (worldProfile?.modeKey === 'sigma') {
      return {
        detection: 0.14,
        escalation: 0.24,
        burst: 0.32,
        residue: 0.3
      };
    }
    if (worldProfile?.modeKey === 'memory') {
      return {
        detection: 0.22,
        escalation: 0.22,
        burst: 0.18,
        residue: 0.38
      };
    }
    return {
      detection: 0.18,
      escalation: 0.28,
      burst: 0.26,
      residue: 0.28
    };
  }

  _getHazardGeometryBias(hazard) {
    const modeKey = hazard?.worldProfile?.modeKey || 'default';
    if (modeKey === 'sigma') {
      return {
        modeKey,
        segmentMul: 1.12,
        gapEveryMul: 0.74,
        gapLengthAdd: 1,
        jitterMul: 1.42,
        depthMul: 1.28,
        angleShear: 0.24,
        phaseShift: 0.18,
        turnsAdd: 0.22,
        lateralMul: 0.84,
        verticalMul: 1.08,
        veilWidthMul: 0.92,
        veilHeightMul: 1.02,
        veilTaperOffset: 0.12,
        rotationYaw: 0.12,
        rotationRoll: 0.08,
        arcRoll: 0.12,
        veilRoll: 0.1,
        slitTilt: 0.08,
        slitWidthAdd: 0.12,
        wakeScaleY: 0.82
      };
    }

    if (modeKey === 'memory') {
      return {
        modeKey,
        segmentMul: 0.96,
        gapEveryMul: 1.24,
        gapLengthAdd: 0,
        jitterMul: 0.76,
        depthMul: 0.82,
        angleShear: 0.08,
        phaseShift: 0.05,
        turnsAdd: -0.06,
        lateralMul: 0.74,
        verticalMul: 1.12,
        veilWidthMul: 1.08,
        veilHeightMul: 1.16,
        veilTaperOffset: -0.1,
        rotationYaw: 0.04,
        rotationRoll: 0.03,
        arcRoll: -0.04,
        veilRoll: -0.05,
        slitTilt: 0.03,
        slitWidthAdd: -0.04,
        wakeScaleY: 1.16
      };
    }

    return {
      modeKey,
      segmentMul: 1,
      gapEveryMul: 1,
      gapLengthAdd: 0,
      jitterMul: 1,
      depthMul: 1,
      angleShear: 0,
      phaseShift: 0,
      turnsAdd: 0,
      lateralMul: 1,
      verticalMul: 1,
      veilWidthMul: 1,
      veilHeightMul: 1,
      veilTaperOffset: 0,
      rotationYaw: 0,
      rotationRoll: 0,
      arcRoll: 0,
      veilRoll: 0,
      slitTilt: 0,
      slitWidthAdd: 0,
      wakeScaleY: 1
    };
  }

  _spawnResidueScar(hazard) {
    if (!hazard?.basePosition || !this.residueRoot) return null;

    const worldProfile = hazard.worldProfile || this.worldProfile || this._resolveWorldProfile();
    const palette = this._getHazardPalette(hazard.type, hazard);
    const geometryBias = this._getHazardGeometryBias(hazard);
    const scarRoot = new THREE.Group();
    scarRoot.name = `${hazard.type}ResidueScar`;
    scarRoot.renderOrder = HAZARD_WORLD_BACKGROUND_ORDER;
    scarRoot.position.copy(hazard.basePosition);
    scarRoot.userData = scarRoot.userData || {};
    scarRoot.userData.__environmentLayerId = 'EnvironmentalHazards';
    scarRoot.userData.__environmentOwner = 'EnvironmentalHazards';
    scarRoot.userData.isWorldFX = true;
    scarRoot.userData.type = hazard.type;
    scarRoot.userData.signature = `${hazard.type}-residue-root`;
    scarRoot.userData.currentMode = worldProfile.modeKey;

    const ring = new THREE.LineSegments(
      this._createBrokenRingGeometry({
        radius: hazard.radius * (worldProfile.modeKey === 'sigma' ? 0.98 : worldProfile.modeKey === 'memory' ? 0.88 : 0.92),
        heightBias: -hazard.radius * 0.08,
        segments: Math.max(56, Math.round(88 * geometryBias.segmentMul)),
        gapEvery: Math.max(4, Math.round((worldProfile.modeKey === 'sigma' ? 6 : 11) * geometryBias.gapEveryMul)),
        gapLength: Math.max(1, (worldProfile.modeKey === 'sigma' ? 2 : 1) + geometryBias.gapLengthAdd),
        radialJitter: hazard.radius * 0.05 * geometryBias.jitterMul,
        yJitter: hazard.radius * 0.018 * geometryBias.jitterMul,
        angleOffset: geometryBias.angleShear
      }),
      new THREE.LineBasicMaterial({
        color: worldProfile.modeKey === 'sigma'
          ? palette.ringSecondary || palette.edge
          : worldProfile.modeKey === 'memory'
            ? HAZARD_PALETTE.goldSigil
            : palette.ringPrimary || palette.aura || palette.edge,
        transparent: true,
        opacity: worldProfile.modeKey === 'sigma' ? 0.09 : 0.075,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.rotation.x = Math.PI * (worldProfile.modeKey === 'sigma' ? 0.58 : 0.5);
    ring.rotation.z = worldProfile.modeKey === 'sigma' ? 0.22 : 0.08;
    ring.userData.baseOpacity = ring.material.opacity;
    scarRoot.add(this._tagHazardObject(ring, hazard.type, `${hazard.type}-residue-ring`));

    const seam = new THREE.Mesh(
      this._createVeilStripGeometry({
        width: hazard.radius * (worldProfile.modeKey === 'memory' ? 0.72 : 0.52) * geometryBias.veilWidthMul,
        height: hazard.radius * (worldProfile.modeKey === 'sigma' ? 1.34 : 1.12) * geometryBias.veilHeightMul,
        segments: 16,
        edgeNoise: hazard.radius * 0.035 * geometryBias.jitterMul,
        depthNoise: hazard.radius * 0.08 * geometryBias.depthMul,
        taper: Math.max(0.26, 0.46 + geometryBias.veilTaperOffset)
      }),
      this._createHazardShaderMaterial({
        colorA: worldProfile.modeKey === 'sigma'
          ? HAZARD_PALETTE.breachRose
          : worldProfile.modeKey === 'memory'
            ? HAZARD_PALETTE.pressureAmber
            : palette.ringSecondary || palette.aura || palette.edge,
        colorB: worldProfile.modeKey === 'memory'
          ? palette.veil || palette.core
          : palette.ringPrimary || palette.shadow || palette.edge,
        opacity: worldProfile.modeKey === 'memory' ? 0.065 : 0.075,
        bias: worldProfile.modeKey === 'sigma' ? -0.12 : 0.06,
        pulse: worldProfile.modeKey === 'memory' ? 0.28 : 0.36,
        flowSpeed: worldProfile.modeKey === 'sigma' ? 0.18 : 0.12,
        additive: true,
        side: THREE.DoubleSide
      })
    );
    seam.position.y = worldProfile.modeKey === 'memory' ? hazard.radius * 0.1 : 0;
    seam.rotation.y = worldProfile.modeKey === 'sigma' ? 0.36 : 0.18;
    seam.rotation.z = worldProfile.modeKey === 'sigma' ? 0.22 : -0.08;
    seam.userData.baseOpacity = seam.material.uniforms.uOpacity.value;
    scarRoot.add(this._tagHazardObject(seam, hazard.type, `${hazard.type}-residue-seam`));

    if (worldProfile.modeKey === 'sigma') {
      for (let i = 0; i < 2; i++) {
        const fracture = new THREE.Line(
          this._createFilamentCurveGeometry({
            radius: hazard.radius * (0.18 + i * 0.08),
            verticalSpan: hazard.radius * (1.12 + i * 0.08),
            lateralAmplitude: hazard.radius * 0.04,
            turns: 0.46 + i * 0.08,
            segments: 18,
            phase: 0.24 + i * 1.3
          }),
          new THREE.LineBasicMaterial({
            color: i === 0 ? HAZARD_PALETTE.breachRose : palette.ringPrimary || palette.edge,
            transparent: true,
            opacity: 0.075 - i * 0.01,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        fracture.rotation.z = (i === 0 ? 1 : -1) * 0.3;
        fracture.userData.baseOpacity = fracture.material.opacity;
        scarRoot.add(this._tagHazardObject(fracture, hazard.type, `${hazard.type}-residue-fracture-${i}`));
      }
    } else if (worldProfile.modeKey === 'memory') {
      const archiveHalo = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: hazard.radius * 0.64,
          heightBias: hazard.radius * 0.1,
          segments: 72,
          gapEvery: 14,
          gapLength: 1,
          radialJitter: hazard.radius * 0.018,
          yJitter: hazard.radius * 0.012,
          angleOffset: 0.14
        }),
        new THREE.LineBasicMaterial({
          color: HAZARD_PALETTE.pressureAmber,
          transparent: true,
          opacity: 0.06,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      archiveHalo.rotation.x = Math.PI * 0.48;
      archiveHalo.userData.baseOpacity = archiveHalo.material.opacity;
      scarRoot.add(this._tagHazardObject(archiveHalo, hazard.type, `${hazard.type}-residue-halo`));
    }

    const shardField = this._createShardField({
      count: worldProfile.modeKey === 'sigma' ? 18 : worldProfile.modeKey === 'memory' ? 14 : 12,
      radius: hazard.radius * (worldProfile.modeKey === 'sigma' ? 0.84 : 0.72),
      height: hazard.radius * (worldProfile.modeKey === 'memory' ? 0.3 : 0.24),
      size: hazard.radius * 0.012,
      colorA: worldProfile.modeKey === 'sigma'
        ? (palette.ringPrimary || palette.edge)
        : (palette.ringSecondary || palette.aura || palette.edge),
      colorB: worldProfile.modeKey === 'memory'
        ? HAZARD_PALETTE.pressureAmber
        : HAZARD_PALETTE.breachRose,
      opacity: worldProfile.modeKey === 'memory' ? 0.16 : 0.18
    });
    scarRoot.add(this._tagHazardObject(shardField.points, hazard.type, `${hazard.type}-residue-shards`));

    const scar = {
      id: `residue.${hazard.id}`,
      type: hazard.type,
      worldProfile,
      age: 0,
      lifetime: hazard.radius * 0.16 + (worldProfile.modeKey === 'memory' ? 6.5 : worldProfile.modeKey === 'sigma' ? 4.2 : 5.1),
      root: scarRoot,
      basePosition: hazard.basePosition.clone(),
      ring,
      seam,
      shardField
    };

    this.residueRoot.add(scarRoot);
    this.residueScars.push(scar);
    this._emitResidueScarEvent(scar, hazard);
    return scar;
  }

  _updateResidueScars(deltaTime) {
    if (!this.residueScars.length) return;

    for (let i = this.residueScars.length - 1; i >= 0; i--) {
      const scar = this.residueScars[i];
      scar.age += deltaTime;
      const t = Math.max(0, Math.min(1, scar.lifetime > 0 ? scar.age / scar.lifetime : 1));
      const fade = 1 - this._smoothstep(0, 1, t);
      const motion = scar.worldProfile?.motion || HAZARD_WORLD_PROFILE.default.motion;

      scar.root.position.copy(scar.basePosition);
      scar.root.position.y += Math.sin(this.sharedUniforms.uTime.value * (0.2 + motion.pulseMul * 0.08) + i * 0.4) * scar.root.scale.y * 0.02;
      scar.root.rotation.y += deltaTime * (scar.worldProfile?.modeKey === 'sigma' ? 0.08 : 0.035) * motion.shearMul;

      if (scar.ring?.material) {
        scar.ring.material.opacity = (scar.ring.userData.baseOpacity || 0.06) * fade;
        scar.ring.rotation.z += deltaTime * (scar.worldProfile?.modeKey === 'sigma' ? 0.06 : 0.02);
        scar.ring.scale.setScalar(1 + (1 - fade) * (scar.worldProfile?.modeKey === 'memory' ? 0.1 : 0.16));
      }

      if (scar.seam?.material) {
        this._updateShaderUniforms(scar.seam.material, {
          opacity: (scar.seam.userData.baseOpacity || 0.06) * fade,
          time: this.sharedUniforms.uTime.value,
          pulse: scar.worldProfile?.modeKey === 'memory' ? 0.24 : 0.32
        });
        scar.seam.rotation.y += deltaTime * (scar.worldProfile?.modeKey === 'sigma' ? 0.09 : 0.03) * motion.shearMul;
        scar.seam.scale.setScalar(1 + (1 - fade) * 0.08);
      }

      this._updateShardField(scar.shardField, {
        radius: scar.shardField.baseRadius,
        time: this.sharedUniforms.uTime.value
      }, deltaTime, {
        radialSpeed: scar.worldProfile?.modeKey === 'sigma' ? -0.06 : 0.02,
        verticalMotion: scar.worldProfile?.modeKey === 'memory' ? 0.06 : 0.04,
        swirl: scar.worldProfile?.modeKey === 'sigma' ? -0.18 : 0.12,
        mode: 'residue',
        lodScale: fade
      });

      if (scar.age >= scar.lifetime) {
        this._disposeResidueScarAt(i);
      }
    }
  }

  _disposeResidueScarAt(index) {
    const scar = this.residueScars[index];
    if (!scar) return;
    this.residueRoot?.remove?.(scar.root);
    this._disposeObjectTree(scar.root);
    this.residueScars.splice(index, 1);
  }

  _clearResidueScars() {
    for (let i = this.residueScars.length - 1; i >= 0; i--) {
      this._disposeResidueScarAt(i);
    }
  }

  _updateShardField(field, hazard, deltaTime, { radialSpeed, verticalMotion, swirl, mode, lodScale }) {
    if (!field?.points?.geometry?.attributes?.position) return;

    const positions = field.positions;
    for (let i = 0; i < field.count; i++) {
      field.angles[i] += deltaTime * (0.15 + i * 0.0008) * swirl;
      field.radii[i] += deltaTime * radialSpeed * (0.4 + (i % 5) * 0.05);

      if (mode === 'gravity') {
        if (field.radii[i] < hazard.radius * 0.18) {
          field.radii[i] = field.baseRadius * (0.88 + Math.random() * 0.18);
        }
      } else if (mode === 'storm') {
        if (field.radii[i] > field.baseRadius * 1.06) {
          field.radii[i] = field.baseRadius * (0.58 + Math.random() * 0.2);
        }
      } else if (mode === 'chrono') {
        field.radii[i] = field.baseRadius * (0.68 + Math.sin(hazard.time * 0.42 + field.phases[i]) * 0.12 + (i % 3) * 0.04);
      } else if (mode === 'residue') {
        field.radii[i] = THREE.MathUtils.clamp(
          field.radii[i],
          field.baseRadius * 0.36,
          field.baseRadius * 1.08
        );
      }

      const verticalWave = Math.sin(hazard.time * (0.8 + (i % 4) * 0.14) + field.phases[i]) * hazard.radius * 0.04;
      positions[i * 3 + 0] = Math.cos(field.angles[i]) * field.radii[i];
      positions[i * 3 + 1] = field.verticals[i] + verticalWave + Math.cos(hazard.time * 0.55 + field.phases[i]) * verticalMotion;
      positions[i * 3 + 2] = Math.sin(field.angles[i]) * field.radii[i];
    }

    field.points.geometry.attributes.position.needsUpdate = true;
    field.points.material.opacity = (field.points.userData.baseOpacity || field.points.material.opacity || 0.2) * lodScale;
    field.points.material.size = field.baseSize * (0.9 + Math.sin(hazard.time * 1.1) * 0.08);
  }

  _updateStormBolt(hazard, bolt, deltaTime, { crestBias, lodScale, edgeColor, coreColor }) {
    bolt.life -= deltaTime * (1.1 + crestBias * 0.5);
    if (bolt.life <= 0) {
      this._randomizeStormBolt(hazard, bolt);
    }

    const alpha = Math.max(0, (bolt.life / bolt.maxLife)) * lodScale * (0.24 + crestBias * 0.7);
    bolt.glow.material.opacity = alpha * 0.8;
    bolt.core.material.opacity = alpha;
    bolt.glow.material.color.setHex(edgeColor);
    bolt.core.material.color.setHex(coreColor);
  }

  _applyLayerPulse(group, { opacityScale = 1, colorA, colorB, rotationX = 0, rotationY = 0, rotationZ = 0 }) {
    if (!group) return;
    group.rotation.x += rotationX;
    group.rotation.y += rotationY;
    group.rotation.z += rotationZ;

    group.children.forEach((child, index) => {
      const mix = group.children.length <= 1 ? 0 : index / (group.children.length - 1);
      const tint = this._colorScratchA.set(colorA).lerp(this._colorScratchB.set(colorB), mix);
      this._applyMaterialColors(child.material, tint);
      this._applyMaterialOpacity(child.material, (child.userData.baseOpacity || 0.1) * opacityScale);
    });
  }

  _getPressureBoost(hazard) {
    const lastPressureAt = hazard?.signalProfile?.pressureBoost;
    if (!Number.isFinite(lastPressureAt)) return 0;
    const elapsed = this._now() - lastPressureAt;
    if (elapsed >= SIGNAL_LIFETIME_MS) return 0;
    return 1 - elapsed / SIGNAL_LIFETIME_MS;
  }

  _isSignalActive(signalKey, lifetimeMs = SIGNAL_LIFETIME_MS) {
    const lastAt = this.metricSignalTimes.get(signalKey);
    if (!Number.isFinite(lastAt)) return false;
    return (this._now() - lastAt) <= lifetimeMs;
  }

  _getHazardIntensityScale() {
    let scale = 1;
    if (this._isSignalActive('corruption.high')) scale += 0.25;
    if (this._isSignalActive('loadPressure.high')) scale += 0.2;
    if (this._isSignalActive('stability.low')) scale += 0.15;
    if (this._isSignalActive('stability.high')) scale -= 0.18;
    return Math.max(0.65, Math.min(1.55, scale));
  }

  _getHazardPalette(type, hazard = null) {
    const worldProfile = hazard?.worldProfile || this.worldProfile || this._resolveWorldProfile();
    const bias = worldProfile?.colors || HAZARD_WORLD_PROFILE.default.colors;
    switch (type) {
      case 'electricalStorm':
        return {
          core: HAZARD_PALETTE.coreWhite,
          edge: bias.stormEdge,
          aura: bias.stormAura,
          shadow: bias.stormShell
        };
      case 'gravitationalAnomaly':
        return {
          core: HAZARD_PALETTE.blackHole,
          ringPrimary: bias.gravityPrimary,
          ringSecondary: bias.gravitySecondary,
          veil: bias.gravityVeil
        };
      case 'chronoBloom':
        return {
          core: bias.chronoCore,
          ringPrimary: bias.chronoPrimary,
          ringSecondary: bias.chronoSecondary,
          veil: bias.chronoGold
        };
      default:
        return {
          core: HAZARD_PALETTE.coreWhite,
          edge: bias.stormEdge,
          aura: bias.stormAura,
          shadow: bias.stormShell
        };
    }
  }

  _getHazardPhaseWeights(hazard) {
    const intensityScale = this._getHazardIntensityScale();
    return {
      envelope: this._getHazardEnvelope(hazard),
      phaseState: this._getHazardPhaseState(hazard),
      pulse: Math.sin(hazard.time * 1.8) * 0.12 * intensityScale + 1.0,
      slowPulse: Math.sin(hazard.time * 0.95) * 0.06 * intensityScale + 1.0
    };
  }

  _getHazardMotionProfile(hazard) {
    return hazard?.worldProfile?.motion || HAZARD_WORLD_PROFILE.default.motion;
  }

  _smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  _getHazardPhaseState(hazard) {
    const progress = Math.max(0, Math.min(1, hazard.phaseProgress ?? 0));
    const mix = {
      detection: hazard.phase === 'detection' ? 1 : 0,
      escalation: hazard.phase === 'escalation' ? 1 : 0,
      burst: hazard.phase === 'burst' ? 1 : 0,
      residue: hazard.phase === 'residue' ? 1 : 0
    };
    const attack = mix.detection * this._smoothstep(0, 1, progress) + mix.escalation;
    const crest = mix.escalation * this._smoothstep(0, 1, progress) + mix.burst;
    const release = mix.residue * this._smoothstep(0, 1, progress);
    return { t: progress, attack, crest, release, mix };
  }

  _getHazardLODScale(hazard) {
    if (!this.camera || !hazard.position) return 1;
    const distance = this.camera.position.distanceTo(hazard.position);
    const threshold = Math.max(36, hazard.radius * 11);
    const raw = 1 - Math.min(1, Math.max(0, (distance - 18) / threshold));
    return Math.max(0.28, raw) * (0.5 + 0.5 * Math.min(1, hazard.intensity || hazard.strength || 1));
  }

  _getHazardEnvelope(hazard) {
    const phaseState = this._getHazardPhaseState(hazard);
    if (hazard.phase === 'detection') return Math.max(0.12, phaseState.attack * 0.52);
    if (hazard.phase === 'escalation') return 0.58 + phaseState.crest * 0.42;
    if (hazard.phase === 'burst') return 1.0;
    return Math.max(0, 1 - phaseState.release * 0.9);
  }

  _setHazardPhase(hazard, nextPhase) {
    if (!hazard || hazard.phase === nextPhase) return false;
    hazard.phase = nextPhase;
    hazard.phaseTime = 0;
    hazard.phaseProgress = 0;
    hazard.root.userData = hazard.root.userData || {};
    hazard.root.userData.hazardPhase = nextPhase;
    return true;
  }

  _updateHazardLifecycle(hazard, deltaTime) {
    const durations = hazard.phaseDurations || { detection: 0.18, escalation: 0.28, burst: 0.26, residue: 0.28 };
    const normalizedAge = Math.max(0, Math.min(1, hazard.lifetime > 0 ? hazard.age / hazard.lifetime : 1));
    const detectionEnd = durations.detection;
    const escalationEnd = detectionEnd + durations.escalation;
    const burstEnd = escalationEnd + durations.burst;

    let nextPhase = 'residue';
    let start = burstEnd;
    let duration = Math.max(0.0001, durations.residue);

    if (normalizedAge < detectionEnd) {
      nextPhase = 'detection';
      start = 0;
      duration = Math.max(0.0001, durations.detection);
    } else if (normalizedAge < escalationEnd) {
      nextPhase = 'escalation';
      start = detectionEnd;
      duration = Math.max(0.0001, durations.escalation);
    } else if (normalizedAge < burstEnd) {
      nextPhase = 'burst';
      start = escalationEnd;
      duration = Math.max(0.0001, durations.burst);
    }

    hazard.phaseTime += deltaTime;
    hazard.phaseProgress = Math.max(0, Math.min(1, (normalizedAge - start) / duration));
    if (this._setHazardPhase(hazard, nextPhase)) {
      this._emitHazardEvent('environment.hazard.phase', hazard);
    }
  }

  _getHazardSignalModifiers() {
    return {
      corruptionHigh: this._isSignalActive('corruption.high'),
      loadPressureHigh: this._isSignalActive('loadPressure.high'),
      stabilityLow: this._isSignalActive('stability.low'),
      stabilityHigh: this._isSignalActive('stability.high')
    };
  }

  _getHazardEventFlavor(hazard) {
    const signals = this._getHazardSignalModifiers();
    const intensity = Math.min(1.5, hazard.intensity ?? hazard.strength ?? 1);
    const phase = hazard.phase || 'detection';
    const phaseSuffix = phase === 'burst' ? 'burst' : phase === 'residue' ? 'residue' : phase === 'escalation' ? 'escalation' : 'detection';
    const phaseTag = `hazard.phase.${phase}`;
    const worldProfile = hazard?.worldProfile || this.worldProfile || this._resolveWorldProfile();
    const worldTag = worldProfile?.tag || 'world.default';

    switch (hazard.type) {
      case 'electricalStorm':
        return {
          subtitle: worldProfile.modeKey === 'sigma'
            ? (signals.corruptionHigh
              ? 'Rift conductors fork through corrupted anomaly seams'
              : 'Sigma pressure forks through the chamber skin')
            : worldProfile.modeKey === 'memory'
              ? (signals.corruptionHigh
                ? 'Mnemonic lightning tears through archival recall lanes'
                : 'Archive conductors pulse across memory vault air')
              : signals.corruptionHigh
            ? 'Corruption crowns the conductor ribs'
            : signals.loadPressureHigh
              ? 'Pressure forks through the cathedral lattice'
              : signals.stabilityHigh
                ? 'Purified lightning gathers into ritual order'
                : 'Cathedral storm of high pressure',
          visualTone: signals.corruptionHigh ? `electric-corrupt-${worldProfile.toneSuffix}-${phaseSuffix}` : `electric-sacred-${worldProfile.toneSuffix}-${phaseSuffix}`,
          semanticSubtitle: worldProfile.modeKey === 'sigma'
            ? 'A sigma-rift conductor storm is discharging through fractured world seams.'
            : worldProfile.modeKey === 'memory'
              ? 'An archival lightning field is flashing through mnemonic air and recall corridors.'
              : signals.loadPressureHigh
            ? 'A pressure-driven rupture field is discharging across the world shell.'
            : 'A charged storm lattice is asserting repulsive territory.',
          semanticTags: [
            'environment.hazard',
            'hazard.electricalStorm',
            phaseTag,
            worldTag,
            signals.corruptionHigh ? 'signal.corruption.high' : 'signal.electric.field',
            signals.loadPressureHigh ? 'signal.loadPressure.high' : 'signal.rupture.pending'
          ],
          audioCue: phase === 'burst'
            ? 'hazard.storm.phase-burst'
            : phase === 'residue'
              ? 'hazard.storm.phase-residue'
              : (signals.corruptionHigh ? 'hazard.storm.corruption-crown' : 'hazard.storm.cathedral-arc'),
          audioLayer: phase === 'burst'
            ? 'pressure-rumble'
            : phase === 'residue'
              ? 'residue-choir'
              : (signals.loadPressureHigh ? 'pressure-rumble' : 'charged-choir'),
          audioIntensity: intensity
        };
      case 'gravitationalAnomaly':
        return {
          subtitle: worldProfile.modeKey === 'sigma'
            ? (signals.stabilityLow
              ? 'Sigma slits close around a collapsing logic wound'
              : 'Anomaly lenses shear the chamber into eclipse')
            : worldProfile.modeKey === 'memory'
              ? (signals.stabilityLow
                ? 'Recall wells deepen into a quiet archive collapse'
                : 'Memory lenses bend the aisle into impossible depth')
              : signals.stabilityLow
            ? 'Collapse seams tighten into a silent eclipse'
            : signals.loadPressureHigh
              ? 'Lens curtains compress under impossible weight'
              : signals.corruptionHigh
                ? 'Corrupted gravity twists the orbit skin'
                : 'Silent gravitational authority',
          visualTone: signals.corruptionHigh ? `cosmic-corrupt-${worldProfile.toneSuffix}-${phaseSuffix}` : `cosmic-collapse-${worldProfile.toneSuffix}-${phaseSuffix}`,
          semanticSubtitle: worldProfile.modeKey === 'sigma'
            ? 'A sigma collapse well is folding nearby space into slit-fracture torsion.'
            : worldProfile.modeKey === 'memory'
              ? 'A mnemonic gravity well is bending recall space into archive eclipse.'
              : signals.stabilityLow
            ? 'A local region is folding inward and pulling surrounding space into torsion.'
            : 'A singularity field is imposing directional pull and lens distortion.',
          semanticTags: [
            'environment.hazard',
            'hazard.gravitationalAnomaly',
            phaseTag,
            worldTag,
            signals.stabilityLow ? 'signal.stability.low' : 'signal.gravity.well',
            signals.loadPressureHigh ? 'signal.loadPressure.high' : 'signal.spatial-collapse'
          ],
          audioCue: phase === 'burst'
            ? 'hazard.gravity.phase-burst'
            : phase === 'residue'
              ? 'hazard.gravity.phase-residue'
              : (signals.corruptionHigh ? 'hazard.gravity.corrupted-well' : 'hazard.gravity.singularity-eclipse'),
          audioLayer: phase === 'residue' ? 'residue-choir' : 'void-drag',
          audioIntensity: intensity
        };
      case 'chronoBloom':
        return {
          subtitle: worldProfile.modeKey === 'sigma'
            ? (signals.stabilityHigh
              ? 'A sigma bloom opens like a controlled breach orchid'
              : 'Temporal petals split across the rift skin')
            : worldProfile.modeKey === 'memory'
              ? (signals.stabilityHigh
                ? 'Archive petals unfold into lucid recall sanctuaries'
                : 'Time-scribed petals open through layered memory')
              : signals.stabilityHigh
            ? 'Stable unreality opens into a majestic bloom'
            : signals.corruptionHigh
              ? 'Revelation petals split through corrupted time'
              : 'Majestic aperture of stable unreality',
          visualTone: signals.corruptionHigh ? `revelation-corrupt-${worldProfile.toneSuffix}-${phaseSuffix}` : `revelation-sacred-${worldProfile.toneSuffix}-${phaseSuffix}`,
          semanticSubtitle: worldProfile.modeKey === 'sigma'
            ? 'A rare sigma bloom is opening as a disciplined breach rather than a hostile collapse.'
            : worldProfile.modeKey === 'memory'
              ? 'A mnemonic bloom is opening a lucid archive field with low hostility.'
              : signals.stabilityHigh
            ? 'A rare temporal bloom is opening a safe but surreal revelation field.'
            : 'A temporal aperture is unfolding layered perception without direct hostility.',
          semanticTags: [
            'environment.hazard',
            'hazard.chronoBloom',
            phaseTag,
            worldTag,
            signals.stabilityHigh ? 'signal.stability.high' : 'signal.revelation.field',
            signals.corruptionHigh ? 'signal.corruption.edge' : 'signal.temporal-bloom'
          ],
          audioCue: phase === 'burst'
            ? 'hazard.chrono.phase-burst'
            : phase === 'residue'
              ? 'hazard.chrono.phase-residue'
              : (signals.corruptionHigh ? 'hazard.chrono.fractured-bloom' : 'hazard.chrono.revelation-bloom'),
          audioLayer: phase === 'residue' ? 'residue-choir' : 'sigil-bells',
          audioIntensity: intensity * 0.88
        };
      default:
        return {
          subtitle: hazard.subtitle || 'Unspecified event',
          visualTone: hazard.visualTone || 'neutral',
          semanticSubtitle: 'A generic environmental hazard is active.',
          semanticTags: ['environment.hazard', `hazard.${hazard.type || 'unknown'}`, phaseTag],
          audioCue: 'hazard.generic',
          audioLayer: 'ambient-alert',
          audioIntensity: intensity
        };
    }
  }

  _emitHazardEvent(eventName, hazard) {
    const bus = this.metricBus;
    if (!bus || !eventName || !hazard) return;

    const eventData = this._getHazardEventData(hazard);
    const flavor = this._getHazardEventFlavor(hazard);
    const payload = {
      type: hazard.type,
      identity: hazard.identity || eventData.identity,
      title: hazard.title || eventData.title,
      subtitle: flavor.subtitle || hazard.subtitle || eventData.subtitle,
      visualTone: flavor.visualTone || hazard.visualTone || eventData.visualTone,
      phase: hazard.phase || 'detection',
      phaseProgress: hazard.phaseProgress ?? 0,
      intensity: hazard.intensity ?? hazard.strength ?? 1,
      radius: hazard.radius,
      source: 'EnvironmentalHazards',
      timestamp: this._now(),
      detail: eventData.detail,
      semanticSubtitle: flavor.semanticSubtitle,
      semanticTags: flavor.semanticTags,
      audioCue: flavor.audioCue,
      audioLayer: flavor.audioLayer,
      audioIntensity: flavor.audioIntensity
    };

    if (typeof bus.emit === 'function') {
      bus.emit(eventName, payload);
      return;
    }
    if (typeof bus.publish === 'function') {
      bus.publish(eventName, payload);
    }
  }

  _emitResidueScarEvent(scar, hazard) {
    const bus = this.metricBus;
    if (!bus || !scar || !hazard) return;

    const worldModeRaw = typeof this.scene?.userData?.currentMode === 'string'
      ? this.scene.userData.currentMode.toLowerCase()
      : (scar.worldProfile?.modeKey || this.worldProfile?.modeKey || 'default');
    const intensity = hazard.intensity ?? hazard.strength ?? 1;
    const radius = hazard.radius ?? 0;

    const payload = {
      type: 'hazardResidueScar',
      source: 'EnvironmentalHazards',
      hazardType: hazard.type,
      worldModeKey: scar.worldProfile?.modeKey || this.worldProfile?.modeKey || 'default',
      worldModeRaw,
      intensity,
      radius,
      lifetime: scar.lifetime ?? 0,
      timestamp: this._now(),
      position: {
        x: scar.basePosition?.x ?? 0,
        y: scar.basePosition?.y ?? 0,
        z: scar.basePosition?.z ?? 0
      },
      coupling: {
        horizonPressure: THREE.MathUtils.clamp(0.16 + intensity * 0.28 + radius * 0.008, 0.16, 0.92),
        weatherPotential: THREE.MathUtils.clamp(0.05 + intensity * 0.14 + radius * 0.0025, 0.05, 0.4),
        weatherIntensity: THREE.MathUtils.clamp(0.1 + intensity * 0.18, 0.1, 0.46),
        windBoost: THREE.MathUtils.clamp(0.08 + intensity * 0.16, 0.08, 0.44),
        duration: THREE.MathUtils.clamp(2.4 + radius * 0.1, 2.4, 7.2)
      }
    };

    if (typeof bus.emit === 'function') {
      bus.emit('environment.hazard.residueScar', payload);
      return;
    }
    if (typeof bus.publish === 'function') {
      bus.publish('environment.hazard.residueScar', payload);
    }
  }

  _getHazardEventData(hazard) {
    const worldProfile = hazard?.worldProfile || this.worldProfile || this._resolveWorldProfile();
    const prefix = worldProfile?.titlePrefix ? `${worldProfile.titlePrefix} ` : '';
    switch (hazard.type) {
      case 'electricalStorm':
        return {
          identity: 'thunder crown',
          title: `${prefix}Thunder Crown`,
          subtitle: worldProfile.modeKey === 'sigma'
            ? 'Rift conductor storm over anomaly architecture'
            : worldProfile.modeKey === 'memory'
              ? 'Archive conductor storm over mnemonic halls'
              : 'Cathedral storm of high pressure',
          visualTone: 'electric',
          detail: worldProfile.modeKey === 'sigma'
            ? 'A sigma-tech storm field radiating fracture ribs, conductor arcs, and rift-pressure wakes.'
            : worldProfile.modeKey === 'memory'
              ? 'An archival storm field radiating recall arcs, ivory conductor ribs, and mnemonic afterglow wakes.'
              : 'A sacred-tech storm field radiating broken halo ribs, conductor arcs, and charged pressure wakes.'
        };
      case 'gravitationalAnomaly':
        return {
          identity: 'singularity eclipse',
          title: `${prefix}Singularity Eclipse`,
          subtitle: worldProfile.modeKey === 'sigma'
            ? 'Slit-fracture gravity under anomaly strain'
            : worldProfile.modeKey === 'memory'
              ? 'Archive gravity distorting recall corridors'
              : 'Silent gravitational authority',
          visualTone: 'cosmic',
          detail: worldProfile.modeKey === 'sigma'
            ? 'A sigma collapse field pulling space into glitch slits, lens scars, and torsion fracture orbits.'
            : worldProfile.modeKey === 'memory'
              ? 'A mnemonic collapse field bending recall space into archive wells, lens curtains, and soft torsion orbits.'
              : 'A void-surreal collapse field pulling space into slit fractures, lens curtains, and torsion orbits.'
        };
      case 'chronoBloom':
        return {
          identity: 'chrono bloom',
          title: `${prefix}Chrono Bloom`,
          subtitle: worldProfile.modeKey === 'sigma'
            ? 'Stable breach orchid of the rift shell'
            : worldProfile.modeKey === 'memory'
              ? 'Lucid archive aperture of preserved recall'
              : 'Majestic aperture of stable unreality',
          visualTone: 'revelation',
          detail: worldProfile.modeKey === 'sigma'
            ? 'A rare sigma bloom opening breach petals, disciplined sigil crowns, and surreal anomaly curtains.'
            : worldProfile.modeKey === 'memory'
              ? 'A rare archive bloom opening recall petals, memory crowns, and temporal preservation curtains.'
              : 'A rare revelation bloom opening petal halos, sigil crowns, and surreal temporal bloom curtains.'
        };
      default:
        return {
          identity: hazard.type,
          title: 'Environmental Hazard',
          subtitle: 'Unspecified event',
          visualTone: 'neutral',
          detail: 'A generic hazard event.'
        };
    }
  }

  _tagHazardObject(object, type, signature) {
    if (!object) return object;
    object.userData = object.userData || {};
    object.renderOrder = HAZARD_WORLD_OVERLAY_ORDER;
    object.userData.__environmentLayerId = 'EnvironmentalHazards';
    object.userData.__environmentOwner = 'EnvironmentalHazards';
    object.userData.isWorldFX = true;
    object.userData.type = type;
    object.userData.signature = signature;
    return object;
  }

  _applyMaterialOpacity(material, opacity) {
    if (!material) return;
    if (Array.isArray(material)) {
      material.forEach(item => this._applyMaterialOpacity(item, opacity));
      return;
    }
    if (material.uniforms?.uOpacity) {
      material.uniforms.uOpacity.value = opacity;
      return;
    }
    if ('opacity' in material) {
      material.opacity = opacity;
    }
  }

  _applyMaterialColors(material, color) {
    if (!material || !color) return;
    if (Array.isArray(material)) {
      material.forEach(item => this._applyMaterialColors(item, color));
      return;
    }
    if (material.uniforms?.uColorA && material.uniforms?.uColorB) {
      material.uniforms.uColorA.value.copy(color);
      material.uniforms.uColorB.value.copy(color);
      return;
    }
    if (material.color?.copy) {
      material.color.copy(color);
    } else if (material.color?.set) {
      material.color.set(color);
    }
  }

  _updateShaderUniforms(material, { opacity, bias, pulse, time, colorA, colorB }) {
    if (!material?.uniforms) return;
    if (Number.isFinite(opacity) && material.uniforms.uOpacity) material.uniforms.uOpacity.value = opacity;
    if (Number.isFinite(bias) && material.uniforms.uBias) material.uniforms.uBias.value = bias;
    if (Number.isFinite(pulse) && material.uniforms.uPulse) material.uniforms.uPulse.value = pulse;
    if (Number.isFinite(time) && material.uniforms.uTime) material.uniforms.uTime.value = time;
    if (colorA !== undefined && material.uniforms.uColorA) material.uniforms.uColorA.value.set(colorA);
    if (colorB !== undefined && material.uniforms.uColorB) material.uniforms.uColorB.value.set(colorB);
  }

  _disposeObjectTree(root) {
    if (!root) return;
    root.traverse(object => {
      if (object.geometry?.dispose) object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach(material => material?.dispose?.());
      } else if (object.material?.dispose) {
        object.material.dispose();
      }
    });
  }

  _now() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }
}
