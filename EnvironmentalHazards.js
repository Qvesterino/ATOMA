import * as THREE from 'three';

const TAU = Math.PI * 2;
const SIGNAL_LIFETIME_MS = 5000;
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

/**
 * Environmental Hazards System
 * Spectacular world anomalies with signal-driven hazard spawning.
 */
export class EnvironmentalHazards {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.root = new THREE.Group();
    this.root.name = 'EnvironmentalHazardsRoot';
    this.root.userData = this.root.userData || {};
    this.root.userData.__environmentLayerId = 'EnvironmentalHazards';
    this.root.userData.__environmentOwner = 'EnvironmentalHazards';
    this.scene?.add?.(this.root);

    this.enabled = true;
    this.hazards = new Map();
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
    this._sharedUnitPlaneGeometry = new THREE.PlaneGeometry(1, 1);

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

    const palette = this._getHazardPalette(hazard.type);
    const layers = this._createHazardLayerSet(hazard.root);
    hazard.layers = layers;

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.48 + i * 0.17),
          heightBias: (i - 1) * radius * 0.08,
          segments: 88,
          gapEvery: 5 + i,
          gapLength: 1 + (i % 2),
          radialJitter: radius * 0.06,
          yJitter: radius * 0.03,
          angleOffset: i * 0.36
        }),
        new THREE.LineBasicMaterial({
          color: i === 2 ? HAZARD_PALETTE.breachRose : palette.edge,
          transparent: true,
          opacity: 0.16 - i * 0.03,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      ring.rotation.set(Math.PI * (0.28 + i * 0.11), i * 0.55, i * 0.24);
      ring.userData.baseOpacity = ring.material.opacity;
      layers.silhouetteLayer.add(this._tagHazardObject(ring, hazard.type, `storm-ring-${i}`));
    }

    for (let i = 0; i < 4; i++) {
      const arc = new THREE.Line(
        this._createFilamentCurveGeometry({
          radius: radius * (0.38 + i * 0.09),
          verticalSpan: radius * (0.7 + i * 0.08),
          lateralAmplitude: radius * 0.14,
          turns: 1.25 + i * 0.24,
          segments: 40,
          phase: i * 1.1
        }),
        new THREE.LineBasicMaterial({
          color: i % 2 === 0 ? palette.edge : HAZARD_PALETTE.ritualWhite,
          transparent: true,
          opacity: 0.12 + i * 0.02,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      arc.rotation.y = i * 0.9;
      arc.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.22;
      arc.userData.baseOpacity = arc.material.opacity;
      layers.filamentLayer.add(this._tagHazardObject(arc, hazard.type, `storm-arc-${i}`));
    }

    for (let i = 0; i < 3; i++) {
      const veil = new THREE.Mesh(
        this._createVeilStripGeometry({
          width: radius * (0.72 + i * 0.18),
          height: radius * (1.4 + i * 0.16),
          segments: 18,
          edgeNoise: radius * 0.08,
          depthNoise: radius * 0.12,
          taper: 0.72 - i * 0.08
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
      veil.rotation.y = i * (TAU / 3) + 0.28;
      veil.rotation.z = (i - 1) * 0.22;
      veil.userData.baseOpacity = veil.material.uniforms.uOpacity.value;
      layers.veilLayer.add(this._tagHazardObject(veil, hazard.type, `storm-veil-${i}`));
    }

    for (let i = 0; i < 2; i++) {
      const wake = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.92 + i * 0.21),
          heightBias: -radius * 0.18 + i * radius * 0.1,
          segments: 104,
          gapEvery: 7 + i,
          gapLength: 2,
          radialJitter: radius * 0.08,
          yJitter: radius * 0.04,
          angleOffset: i * 0.5
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
      wake.rotation.z = i * 0.28;
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

    const palette = this._getHazardPalette(hazard.type);
    const layers = this._createHazardLayerSet(hazard.root);
    hazard.layers = layers;

    for (let i = 0; i < 3; i++) {
      const slit = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.42 + i * 0.2),
          heightBias: (i - 1) * radius * 0.11,
          segments: 92,
          gapEvery: 8,
          gapLength: 3,
          radialJitter: radius * 0.09,
          yJitter: radius * 0.08,
          angleOffset: i * 0.62
        }),
        new THREE.LineBasicMaterial({
          color: i === 0 ? palette.ringSecondary : palette.ringPrimary,
          transparent: true,
          opacity: 0.12 - i * 0.02,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      slit.rotation.x = Math.PI * (0.22 + i * 0.17);
      slit.rotation.y = i * 0.8;
      slit.scale.set(1 + i * 0.06, 0.68 + i * 0.06, 1);
      slit.userData.baseOpacity = slit.material.opacity;
      layers.silhouetteLayer.add(this._tagHazardObject(slit, hazard.type, `gravity-slit-${i}`));
    }

    for (let i = 0; i < 4; i++) {
      const torsion = new THREE.Line(
        this._createFilamentCurveGeometry({
          radius: radius * (0.52 + i * 0.06),
          verticalSpan: radius * 0.92,
          lateralAmplitude: radius * (0.1 + i * 0.015),
          turns: 1.9 + i * 0.2,
          segments: 46,
          phase: i * 1.3
        }),
        new THREE.LineBasicMaterial({
          color: i % 2 === 0 ? palette.ringPrimary : HAZARD_PALETTE.breachRose,
          transparent: true,
          opacity: 0.09 + i * 0.018,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      torsion.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.38;
      torsion.userData.baseOpacity = torsion.material.opacity;
      layers.filamentLayer.add(this._tagHazardObject(torsion, hazard.type, `gravity-torsion-${i}`));
    }

    for (let i = 0; i < 3; i++) {
      const veil = new THREE.Mesh(
        this._createVeilStripGeometry({
          width: radius * (0.78 + i * 0.15),
          height: radius * (1.65 + i * 0.12),
          segments: 20,
          edgeNoise: radius * 0.09,
          depthNoise: radius * 0.18,
          taper: 0.62
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
      veil.rotation.y = i * 0.72 + 0.18;
      veil.rotation.z = (i - 1) * 0.26;
      veil.userData.baseOpacity = veil.material.uniforms.uOpacity.value;
      layers.veilLayer.add(this._tagHazardObject(veil, hazard.type, `gravity-veil-${i}`));
    }

    for (let i = 0; i < 2; i++) {
      const wake = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.95 + i * 0.22),
          heightBias: (i - 0.5) * radius * 0.15,
          segments: 112,
          gapEvery: 9,
          gapLength: 2 + i,
          radialJitter: radius * 0.1,
          yJitter: radius * 0.06,
          angleOffset: i * 0.48
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
      wake.rotation.y = i * 0.52;
      wake.scale.y = 0.72 + i * 0.08;
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

    const palette = this._getHazardPalette(hazard.type);
    const layers = this._createHazardLayerSet(hazard.root);
    hazard.layers = layers;

    for (let i = 0; i < 6; i++) {
      const petal = new THREE.Mesh(
        this._createVeilStripGeometry({
          width: radius * 0.36,
          height: radius * (0.88 + (i % 2) * 0.08),
          segments: 16,
          edgeNoise: radius * 0.05,
          depthNoise: radius * 0.08,
          taper: 0.42
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
      petal.rotation.y = (i / 6) * TAU;
      petal.rotation.z = Math.PI * 0.5;
      petal.rotation.x = (i % 2 === 0 ? 1 : -1) * 0.22;
      petal.userData.baseOpacity = petal.material.uniforms.uOpacity.value;
      petal.userData.bloomOffset = i / 6;
      layers.veilLayer.add(this._tagHazardObject(petal, hazard.type, `chrono-petal-${i}`));
    }

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.46 + i * 0.18),
          heightBias: radius * 0.04 * i,
          segments: 96,
          gapEvery: 10,
          gapLength: 2,
          radialJitter: radius * 0.04,
          yJitter: radius * 0.025,
          angleOffset: i * 0.28
        }),
        new THREE.LineBasicMaterial({
          color: i === 0 ? palette.ringSecondary : palette.ringPrimary,
          transparent: true,
          opacity: 0.13 - i * 0.02,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      ring.rotation.x = Math.PI * (0.5 + i * 0.08);
      ring.rotation.z = i * 0.16;
      ring.userData.baseOpacity = ring.material.opacity;
      layers.silhouetteLayer.add(this._tagHazardObject(ring, hazard.type, `chrono-ring-${i}`));
    }

    for (let i = 0; i < 5; i++) {
      const sigil = new THREE.Line(
        this._createFilamentCurveGeometry({
          radius: radius * (0.2 + i * 0.08),
          verticalSpan: radius * 0.8,
          lateralAmplitude: radius * 0.06,
          turns: 0.8 + i * 0.12,
          segments: 32,
          phase: i * 0.72
        }),
        new THREE.LineBasicMaterial({
          color: i % 2 === 0 ? palette.ringPrimary : HAZARD_PALETTE.goldSigil,
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      sigil.rotation.y = i * 0.65;
      sigil.rotation.z = (i - 2) * 0.12;
      sigil.userData.baseOpacity = sigil.material.opacity;
      layers.filamentLayer.add(this._tagHazardObject(sigil, hazard.type, `chrono-sigil-${i}`));
    }

    for (let i = 0; i < 2; i++) {
      const wake = new THREE.LineSegments(
        this._createBrokenRingGeometry({
          radius: radius * (0.96 + i * 0.2),
          heightBias: radius * 0.08 + i * radius * 0.04,
          segments: 100,
          gapEvery: 11,
          gapLength: 2,
          radialJitter: radius * 0.05,
          yJitter: radius * 0.02,
          angleOffset: i * 0.33
        }),
        new THREE.LineBasicMaterial({
          color: i === 0 ? HAZARD_PALETTE.goldSigil : palette.ringSecondary,
          transparent: true,
          opacity: 0.07 - i * 0.01,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      wake.rotation.x = Math.PI * 0.5;
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

    for (const hazard of Array.from(this.hazards.values())) {
      if (!hazard.active) continue;
      hazard.age += deltaTime;
      hazard.time = hazard.age;

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
    const palette = this._getHazardPalette(hazard.type);
    const pressureBoost = this._getPressureBoost(hazard);
    const crestBias = crest + pressureBoost * 0.45;
    const hover = Math.sin(hazard.time * 0.82) * hazard.radius * (0.015 + pressureBoost * 0.01);
    const lateralDrift = Math.sin(hazard.time * 0.34) * hazard.radius * 0.012;

    hazard.root.position.copy(hazard.basePosition);
    hazard.root.position.y += hover;
    hazard.root.position.x += lateralDrift;

    hazard.root.scale.setScalar(1 + attack * 0.04 + crestBias * 0.08 - release * 0.03);
    hazard.root.rotation.y += deltaTime * (0.12 + crestBias * 0.2);
    hazard.root.rotation.x = Math.sin(hazard.time * 0.41) * (0.05 + pressureBoost * 0.05);

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
    const palette = this._getHazardPalette(hazard.type);
    const pressureBoost = this._getPressureBoost(hazard);
    const collapseBias = crest + (signals.stabilityLow ? 0.22 : 0) + pressureBoost * 0.35;
    const verticalSink = Math.sin(hazard.time * 0.46) * hazard.radius * 0.012;
    const orbitDrift = Math.cos(hazard.time * 0.22) * hazard.radius * 0.01;

    hazard.root.position.copy(hazard.basePosition);
    hazard.root.position.y += verticalSink;
    hazard.root.position.z += orbitDrift;

    hazard.root.scale.setScalar(1 + attack * 0.02 + collapseBias * 0.06 - release * 0.02);
    hazard.root.rotation.y -= deltaTime * (0.07 + collapseBias * 0.08);
    hazard.root.rotation.z = Math.sin(hazard.time * 0.33) * 0.04;

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
    const palette = this._getHazardPalette(hazard.type);
    const revelationBias = crest + (signals.stabilityHigh ? 0.24 : 0);
    const bloomLift = Math.sin(hazard.time * 0.64) * hazard.radius * 0.02;
    const bloomDrift = Math.cos(hazard.time * 0.28) * hazard.radius * 0.015;

    hazard.root.position.copy(hazard.basePosition);
    hazard.root.position.y += bloomLift;
    hazard.root.position.x += bloomDrift;

    hazard.root.scale.setScalar(1 + attack * 0.03 + revelationBias * 0.05);
    hazard.root.rotation.y += deltaTime * 0.06;
    hazard.root.rotation.z = Math.sin(hazard.time * 0.4) * 0.035;

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
    const hazard = typeof hazardRef === 'string'
      ? this.hazards.get(hazardRef)
      : hazardRef && hazardRef.id
        ? this.hazards.get(hazardRef.id)
        : hazardRef;

    if (!hazard) return;
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
      this.deactivateHazard(hazard);
    }

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
    const safePosition = position?.clone?.() || new THREE.Vector3();
    const root = new THREE.Group();
    root.name = `${type}Root`;
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
      active: true,
      root,
      layers: null,
      uniforms: {},
      signalProfile,
      effectProfile,
      group: root
    };

    this._tagHazardObject(root, type, `${type}-root`);
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
      group.renderOrder = 20 + index;
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
      depthWrite: false
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

  _getHazardPalette(type) {
    switch (type) {
      case 'electricalStorm':
        return {
          core: HAZARD_PALETTE.coreWhite,
          edge: HAZARD_PALETTE.electricEdge,
          aura: HAZARD_PALETTE.primaryCyan,
          shadow: HAZARD_PALETTE.stormShadow
        };
      case 'gravitationalAnomaly':
        return {
          core: HAZARD_PALETTE.blackHole,
          ringPrimary: HAZARD_PALETTE.primaryCyan,
          ringSecondary: HAZARD_PALETTE.quantumViolet,
          veil: HAZARD_PALETTE.softHalo
        };
      case 'chronoBloom':
        return {
          core: HAZARD_PALETTE.ritualWhite,
          ringPrimary: HAZARD_PALETTE.bloomMint,
          ringSecondary: HAZARD_PALETTE.quantumViolet,
          veil: HAZARD_PALETTE.goldSigil
        };
      default:
        return {
          core: HAZARD_PALETTE.coreWhite,
          edge: HAZARD_PALETTE.electricEdge,
          aura: HAZARD_PALETTE.primaryCyan,
          shadow: HAZARD_PALETTE.stormShadow
        };
    }
  }

  _getHazardPhaseWeights(hazard) {
    const intensityScale = this._getHazardIntensityScale();
    return {
      envelope: this._getHazardEnvelope(hazard),
      pulse: Math.sin(hazard.time * 1.8) * 0.12 * intensityScale + 1.0,
      slowPulse: Math.sin(hazard.time * 0.95) * 0.06 * intensityScale + 1.0
    };
  }

  _smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  _getHazardPhaseState(hazard) {
    const t = (hazard.time % 4) / 4;
    const attack = this._smoothstep(0.0, 0.18, t);
    const crest = this._smoothstep(0.18, 0.72, t) * (1 - this._smoothstep(0.72, 1.0, t));
    const release = this._smoothstep(0.72, 1.0, t);
    return { t, attack, crest, release };
  }

  _getHazardLODScale(hazard) {
    if (!this.camera || !hazard.position) return 1;
    const distance = this.camera.position.distanceTo(hazard.position);
    const threshold = Math.max(36, hazard.radius * 11);
    const raw = 1 - Math.min(1, Math.max(0, (distance - 18) / threshold));
    return Math.max(0.28, raw) * (0.5 + 0.5 * Math.min(1, hazard.intensity || hazard.strength || 1));
  }

  _getHazardEnvelope(hazard) {
    const envelope = this.hazardEnvelope;
    const phase = (hazard.time % 4) / 4;
    if (phase < envelope.birth) return phase / envelope.birth;
    if (phase < envelope.birth + envelope.crest) return 1;
    if (phase < envelope.birth + envelope.crest + envelope.decay) {
      return 1 - ((phase - envelope.birth - envelope.crest) / envelope.decay);
    }
    const after = (phase - envelope.birth - envelope.crest - envelope.decay) / envelope.afterglow;
    return Math.max(0, 1 - after);
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

    switch (hazard.type) {
      case 'electricalStorm':
        return {
          subtitle: signals.corruptionHigh
            ? 'Corruption crowns the conductor ribs'
            : signals.loadPressureHigh
              ? 'Pressure forks through the cathedral lattice'
              : signals.stabilityHigh
                ? 'Purified lightning gathers into ritual order'
                : 'Cathedral storm of high pressure',
          visualTone: signals.corruptionHigh ? 'electric-corrupt' : 'electric-sacred',
          semanticSubtitle: signals.loadPressureHigh
            ? 'A pressure-driven rupture field is discharging across the world shell.'
            : 'A charged storm lattice is asserting repulsive territory.',
          semanticTags: [
            'environment.hazard',
            'hazard.electricalStorm',
            signals.corruptionHigh ? 'signal.corruption.high' : 'signal.electric.field',
            signals.loadPressureHigh ? 'signal.loadPressure.high' : 'signal.rupture.pending'
          ],
          audioCue: signals.corruptionHigh ? 'hazard.storm.corruption-crown' : 'hazard.storm.cathedral-arc',
          audioLayer: signals.loadPressureHigh ? 'pressure-rumble' : 'charged-choir',
          audioIntensity: intensity
        };
      case 'gravitationalAnomaly':
        return {
          subtitle: signals.stabilityLow
            ? 'Collapse seams tighten into a silent eclipse'
            : signals.loadPressureHigh
              ? 'Lens curtains compress under impossible weight'
              : signals.corruptionHigh
                ? 'Corrupted gravity twists the orbit skin'
                : 'Silent gravitational authority',
          visualTone: signals.corruptionHigh ? 'cosmic-corrupt' : 'cosmic-collapse',
          semanticSubtitle: signals.stabilityLow
            ? 'A local region is folding inward and pulling surrounding space into torsion.'
            : 'A singularity field is imposing directional pull and lens distortion.',
          semanticTags: [
            'environment.hazard',
            'hazard.gravitationalAnomaly',
            signals.stabilityLow ? 'signal.stability.low' : 'signal.gravity.well',
            signals.loadPressureHigh ? 'signal.loadPressure.high' : 'signal.spatial-collapse'
          ],
          audioCue: signals.corruptionHigh ? 'hazard.gravity.corrupted-well' : 'hazard.gravity.singularity-eclipse',
          audioLayer: 'void-drag',
          audioIntensity: intensity
        };
      case 'chronoBloom':
        return {
          subtitle: signals.stabilityHigh
            ? 'Stable unreality opens into a majestic bloom'
            : signals.corruptionHigh
              ? 'Revelation petals split through corrupted time'
              : 'Majestic aperture of stable unreality',
          visualTone: signals.corruptionHigh ? 'revelation-corrupt' : 'revelation-sacred',
          semanticSubtitle: signals.stabilityHigh
            ? 'A rare temporal bloom is opening a safe but surreal revelation field.'
            : 'A temporal aperture is unfolding layered perception without direct hostility.',
          semanticTags: [
            'environment.hazard',
            'hazard.chronoBloom',
            signals.stabilityHigh ? 'signal.stability.high' : 'signal.revelation.field',
            signals.corruptionHigh ? 'signal.corruption.edge' : 'signal.temporal-bloom'
          ],
          audioCue: signals.corruptionHigh ? 'hazard.chrono.fractured-bloom' : 'hazard.chrono.revelation-bloom',
          audioLayer: 'sigil-bells',
          audioIntensity: intensity * 0.88
        };
      default:
        return {
          subtitle: hazard.subtitle || 'Unspecified event',
          visualTone: hazard.visualTone || 'neutral',
          semanticSubtitle: 'A generic environmental hazard is active.',
          semanticTags: ['environment.hazard', `hazard.${hazard.type || 'unknown'}`],
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

  _getHazardEventData(hazard) {
    switch (hazard.type) {
      case 'electricalStorm':
        return {
          identity: 'thunder crown',
          title: 'Thunder Crown',
          subtitle: 'Cathedral storm of high pressure',
          visualTone: 'electric',
          detail: 'A sacred-tech storm field radiating broken halo ribs, conductor arcs, and charged pressure wakes.'
        };
      case 'gravitationalAnomaly':
        return {
          identity: 'singularity eclipse',
          title: 'Singularity Eclipse',
          subtitle: 'Silent gravitational authority',
          visualTone: 'cosmic',
          detail: 'A void-surreal collapse field pulling space into slit fractures, lens curtains, and torsion orbits.'
        };
      case 'chronoBloom':
        return {
          identity: 'chrono bloom',
          title: 'Chrono Bloom',
          subtitle: 'Majestic aperture of stable unreality',
          visualTone: 'revelation',
          detail: 'A rare revelation bloom opening petal halos, sigil crowns, and surreal temporal bloom curtains.'
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
