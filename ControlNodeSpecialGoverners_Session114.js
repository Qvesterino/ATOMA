import * as THREE from 'three';

/**
 * CONTROL Node Special Governors (Session 114)
 * ============================================================================
 * Three autonomous regulatory nodes that govern network flow without gameplay logic.
 * Each expresses pure mechanical causality through visual encoding.
 * 
 * ΦRIX (Flow Arbiter) — Controls routing arbitration
 * CRUCIS (Suppression Governor) — Controls amplification ceilings  
 * VERTEX (Temporal Gate) — Controls pulse timing/phase (learns behavior)
 * 
 * Design Philosophy:
 * - Feel AI-made, not human-designed
 * - Asymmetric, exposed logic, mechanical overkill
 * - Pure causality: geometry = behavior
 * - No decorative elements (every motion means something)
 * - Animation driven by state: speed, intensity, glow color encode current action
 */

export class ControlNodeSpecialGovernors {

  /**
   * ΦRIX (Flow Arbiter) — Controls routing arbitration
   * 
   * GEOMETRY:
   * - Asymmetric junction-point with rotating decision spine
   * - 4 irregular arms radiating from center (not symmetrical)
   * - Orbiting shards (decision markers)
   * - Central rotating decision sphere (state encoder)
   * 
   * VISUAL ENCODING:
   * - Spine spin speed = traffic load (0 = idle, 1.0+ = congestion)
   * - Arm direction/angle = routing choice (which pulse path proceeds)
   * - Magenta flashes = decisions being made
   * - Arm tension ripples = decision confidence
   * 
   * BEHAVIOR:
   * - Stateless arbiter (learns nothing)
   * - Arbitrates which competing pulses proceed through regional intersections
   * - Emergent risk: Silent takeover via synchronized pulse timing
   */
  static createPhrixFlowArbiter(group, color) {
    try {
      // Base material (will be animated)
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.4
      });

      // ===== ROTATING DECISION SPINE =====
      // Asymmetric, irregular spine (not perfectly vertical)
      const spineSegments = 8;
      const spineCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.6, 0.05),      // Bottom (slightly offset)
        new THREE.Vector3(0.08, -0.2, 0.02),   // Lower mid (asymmetric)
        new THREE.Vector3(-0.06, 0.2, -0.03),  // Upper mid (opposite offset)
        new THREE.Vector3(0.04, 0.6, 0.06)     // Top (final offset)
      ]);

      const spineGeometry = new THREE.TubeGeometry(spineCurve, 12, 0.15, 6);
      const spine = new THREE.Mesh(spineGeometry, baseMaterial);
      spine.userData.isDecisionSpine = true;
      spine.userData.spineTwistSpeed = 0.8; // Will be animated
      group.add(spine);

      // ===== CENTRAL DECISION SPHERE (rotating state encoder) =====
      const sphereGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.6
      });
      const decisionSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      decisionSphere.userData.isCentralDecider = true;
      decisionSphere.userData.decisionPhase = 0;
      group.add(decisionSphere);

      // ===== FOUR IRREGULAR ARMS (routing choices) =====
      const armPositions = [
        { pos: [0.7, 0.1, 0], rot: [0, 0, Math.PI / 8] },      // Forward (asymmetric)
        { pos: [-0.75, -0.2, 0], rot: [0, Math.PI, -Math.PI / 6] }, // Back (lower)
        { pos: [0, 0.05, 0.8], rot: [Math.PI / 8, 0, 0] },     // Right (offset)
        { pos: [0, -0.15, -0.72], rot: [-Math.PI / 6, 0, 0] }  // Left (lower)
      ];

      for (let i = 0; i < 4; i++) {
        const armGeometry = new THREE.BoxGeometry(0.18, 0.08, 0.6);
        const arm = new THREE.Mesh(armGeometry, baseMaterial);
        
        const [x, y, z] = armPositions[i].pos;
        arm.position.set(x, y, z);
        
        const [rx, ry, rz] = armPositions[i].rot;
        arm.rotation.set(rx, ry, rz);
        
        arm.userData.armIndex = i;
        arm.userData.armDirection = i * (Math.PI * 2 / 4);
        arm.userData.armTension = 0; // Will oscillate based on traffic
        group.add(arm);
      }

      // ===== ORBITING SHARDS (decision markers) =====
      const shardCount = 6;
      for (let i = 0; i < shardCount; i++) {
        const shardGeometry = new THREE.TetrahedronGeometry(0.12, 1);
        const shard = new THREE.Mesh(shardGeometry, baseMaterial);
        
        const angle = (i / shardCount) * Math.PI * 2;
        const orbitRadius = 0.5;
        
        shard.position.set(
          Math.cos(angle) * orbitRadius,
          Math.sin(i * 0.6) * 0.15,
          Math.sin(angle) * orbitRadius
        );
        
        shard.rotation.set(
          Math.random() * Math.PI,
          angle,
          Math.random() * Math.PI / 2
        );
        
        shard.userData.isDecisionMarker = true;
        shard.userData.shardIndex = i;
        shard.userData.orbitRadius = orbitRadius;
        shard.userData.orbitAngle = angle;
        group.add(shard);
      }

      // Store animation metadata
      group.userData.isPhrix = true;
      group.userData.nodeGeometryName = 'CONTROL_PHRIX_FLOW_ARBITER';
      group.userData.spineTwistSpeed = 0.0;      // Driven by traffic load
      group.userData.decisionPhase = 0;
      group.userData.armTension = 0;             // Driven by routing confidence
      group.userData.trafficLoad = 0;            // External input (0-1)
      group.userData.visualCoreImmutable = false; // Allow animation

      return group;
    } catch (err) {
      console.warn('[ControlNodeSpecialGovernors] ΦRIX creation failed:', err);
      return group;
    }
  }

  /**
   * CRUCIS (Suppression Governor) — Controls amplification ceilings
   * 
   * GEOMETRY:
   * - Cross-shaped frame (4-way symmetry)
   * - 4 articulated hydraulic grip-arms (can compress/extend)
   * - Central pressure sphere pump (state indicator)
   * - Mechanical attachment points (exposed logic)
   * 
   * VISUAL ENCODING:
   * - Grip compression = suppression force applied (0-1)
   * - Arm tension = active gating (visual stress lines)
   * - Orange glow = pressure applied (emissive intensity)
   * - Pump pulsing = load bearing (frequency = suppression intensity)
   * 
   * BEHAVIOR:
   * - Mechanically suppresses high-amplitude pulses
   * - Enforces local dominance hierarchy
   * - Cannot be overridden by metrics (purely mechanical)
   * - Emergent risk: Corruption inverts suppression (boosts strong pulses instead)
   */
  static createCrucisSuppressionGovernor(group, color) {
    try {
      // Base material
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.35
      });

      // ===== CROSS-SHAPED FRAME (4-way structural support) =====
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.3
      });

      // Horizontal cross beam
      const hBeamGeometry = new THREE.BoxGeometry(1.0, 0.12, 0.12);
      const hBeam = new THREE.Mesh(hBeamGeometry, frameMaterial);
      hBeam.userData.isFrameBeam = true;
      group.add(hBeam);

      // Vertical cross beam
      const vBeamGeometry = new THREE.BoxGeometry(0.12, 1.0, 0.12);
      const vBeam = new THREE.Mesh(vBeamGeometry, frameMaterial);
      vBeam.userData.isFrameBeam = true;
      group.add(vBeam);

      // ===== CENTRAL PRESSURE SPHERE PUMP =====
      const pumpGeometry = new THREE.SphereGeometry(0.35, 20, 20);
      const pumpMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.08,
        emissive: color,
        emissiveIntensity: 0.5
      });
      const pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
      pump.userData.isPressurePump = true;
      pump.userData.suppressionForce = 0; // 0-1, driven externally
      pump.userData.pumpPhase = 0;
      group.add(pump);

      // ===== FOUR ARTICULATED GRIP-ARMS (hydraulic suppressors) =====
      const armDirections = [
        { pos: [0.6, 0, 0], axis: 'x' },
        { pos: [-0.6, 0, 0], axis: 'x' },
        { pos: [0, 0.6, 0], axis: 'y' },
        { pos: [0, -0.6, 0], axis: 'y' }
      ];

      for (let i = 0; i < 4; i++) {
        const { pos, axis } = armDirections[i];
        
        // Grip jaw (can compress toward center)
        const gripGeometry = new THREE.BoxGeometry(0.25, 0.18, 0.12);
        const grip = new THREE.Mesh(gripGeometry, baseMaterial);
        
        grip.position.set(...pos);
        grip.userData.isGripArm = true;
        grip.userData.armIndex = i;
        grip.userData.armAxis = axis;
        grip.userData.gripCompression = 0; // 0 = open, 1 = fully compressed
        group.add(grip);

        // Tension cable (visual stress indicator)
        const cableGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.8);
        const cable = new THREE.Mesh(cableGeometry, baseMaterial);
        
        // Position cable between pump and grip
        const midX = pos[0] * 0.5;
        const midY = pos[1] * 0.5;
        const midZ = pos[2] * 0.5;
        cable.position.set(midX, midY, midZ);
        
        if (axis === 'x') {
          cable.rotation.z = Math.PI / 2;
          cable.scale.z = 0.8;
        } else {
          cable.rotation.x = Math.PI / 2;
          cable.scale.z = 0.8;
        }
        
        cable.userData.isTensionCable = true;
        cable.userData.cableIndex = i;
        group.add(cable);
      }

      // Store animation metadata
      group.userData.isCrucis = true;
      group.userData.nodeGeometryName = 'CONTROL_CRUCIS_SUPPRESSION_GOVERNOR';
      group.userData.suppressionForce = 0;    // 0-1, external input
      group.userData.gripCompression = 0;     // 0-1, visual feedback
      group.userData.pumpIntensity = 0;       // 0-1, load indicator
      group.userData.visualCoreImmutable = false; // Allow animation

      return group;
    } catch (err) {
      console.warn('[ControlNodeSpecialGovernors] CRUCIS creation failed:', err);
      return group;
    }
  }

  /**
   * VERTEX (Temporal Gate) — Controls pulse timing/phase
   * 
   * GEOMETRY:
   * - Spinning cage (periodic gating structure)
   * - Oscillating spikes (phase detectors)
   * - Rotating chrono-regulator core (internal clock)
   * - Servo cams (learned pattern adapters)
   * 
   * VISUAL ENCODING:
   * - Spike ripples = active gating (wave motion)
   * - Cyan flashes = pulse accepted (phase match)
   * - Red flashes = pulse blocked (phase mismatch)
   * - Servo adjustments visible = learning happening (8-15 minutes to adapt)
   * - Cage rotation speed = adaptive pattern frequency
   * 
   * BEHAVIOR:
   * - Permits pulses only when in-phase with internal cycle
   * - Blocks out-of-phase pulses
   * - **Learns**: Adapts internal rhythm to match dominant pulse patterns over time
   * - Emergent risk: Temporal monopoly (locked to one pulse pattern, unable to unlearn)
   */
  static createVertexTemporalGate(group, color) {
    try {
      // Base material
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.35
      });

      // ===== SPINNING CAGE (periodic gating frame) =====
      const cageRadius = 0.65;
      const cageRings = 3;

      for (let ring = 0; ring < cageRings; ring++) {
        const ringRadius = cageRadius * (0.7 + (ring * 0.15));
        const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.08, 16, 64);
        const ringMesh = new THREE.Mesh(ringGeometry, baseMaterial);
        
        // Rotate rings differently (cage effect)
        ringMesh.rotation.set(
          (ring === 0) ? 0 : (ring === 1 ? Math.PI / 3 : Math.PI / 2),
          0,
          (ring % 2) * Math.PI / 4
        );
        
        ringMesh.userData.isCageRing = true;
        ringMesh.userData.ringIndex = ring;
        group.add(ringMesh);
      }

      // ===== OSCILLATING SPIKES (phase detectors) =====
      const spikeCount = 12;
      for (let i = 0; i < spikeCount; i++) {
        const spikeGeometry = new THREE.ConeGeometry(0.08, 0.4, 8);
        const spike = new THREE.Mesh(spikeGeometry, baseMaterial);
        
        const angle = (i / spikeCount) * Math.PI * 2;
        const radius = 0.75;
        
        spike.position.set(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        
        spike.rotation.x = Math.PI / 2;
        spike.lookAt(0, 0, 0);
        
        spike.userData.isPhaseDetectorSpike = true;
        spike.userData.spikeIndex = i;
        spike.userData.spikePhase = angle;
        spike.userData.oscillationAmplitude = 0.1; // Will pulse based on gating
        group.add(spike);
      }

      // ===== ROTATING CHRONO-REGULATOR CORE (internal clock) =====
      const chronoGeometry = new THREE.OctahedronGeometry(0.3, 2);
      const chronoMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.6
      });
      const chronoCore = new THREE.Mesh(chronoGeometry, chronoMaterial);
      chronoCore.userData.isChronoRegulator = true;
      chronoCore.userData.internalPhase = 0; // 0-2π, the learned rhythm
      chronoCore.userData.rotationSpeed = 1.0; // Driven by learned pattern
      chronoCore.userData.learningRate = 0.0001; // Slow adaptation (8-15 min scale)
      group.add(chronoCore);

      // ===== SERVO CAMS (learned pattern adapters) =====
      const camCount = 4;
      for (let i = 0; i < camCount; i++) {
        const camGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.08);
        const cam = new THREE.Mesh(camGeometry, baseMaterial);
        
        const angle = (i / camCount) * Math.PI * 2;
        const offset = 0.4;
        
        cam.position.set(
          Math.cos(angle) * offset,
          0.2 + Math.sin(angle) * 0.15,
          Math.sin(angle) * offset
        );
        
        cam.rotation.y = angle;
        cam.userData.isServoCam = true;
        cam.userData.camIndex = i;
        cam.userData.adaptationPhase = 0; // Increments as learning happens
        group.add(cam);
      }

      // ===== PHASE INDICATOR LIGHTS =====
      // Cyan accepted, red blocked (visual feedback)
      const indicatorGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      
      // Accepted indicator (cyan)
      const acceptedMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0
      });
      const acceptedLight = new THREE.Mesh(indicatorGeometry, acceptedMaterial);
      acceptedLight.position.set(0, 0.8, 0);
      acceptedLight.userData.isAcceptedIndicator = true;
      acceptedLight.userData.flashPhase = 0;
      group.add(acceptedLight);

      // Blocked indicator (red)
      const blockedMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0
      });
      const blockedLight = new THREE.Mesh(indicatorGeometry, blockedMaterial);
      blockedLight.position.set(0, -0.8, 0);
      blockedLight.userData.isBlockedIndicator = true;
      blockedLight.userData.flashPhase = 0;
      group.add(blockedLight);

      // Store animation metadata
      group.userData.isVertex = true;
      group.userData.nodeGeometryName = 'CONTROL_VERTEX_TEMPORAL_GATE';
      group.userData.cageRotationSpeed = 1.0;    // Driven by learned pattern
      group.userData.internalPhase = 0;          // 0-2π, the internal rhythm
      group.userData.learnedPatternFreq = 1.0;   // Converges to dominant pulse frequency
      group.userData.learnedPatternPhase = 0;    // Phase offset learned over time
      group.userData.learningRate = 0.0001;      // ~8-15 min to full adaptation
      group.userData.gatingActive = false;       // Current pulse in/out of phase
      group.userData.visualCoreImmutable = false; // Allow animation

      return group;
    } catch (err) {
      console.warn('[ControlNodeSpecialGovernors] VERTEX creation failed:', err);
      return group;
    }
  }

  /**
   * Get special governor by name
   * Usage: ControlNodeSpecialGovernors.createSpecialGovernor('phrix', group, color)
   */
  static createSpecialGovernor(name, group, color) {
    switch (name.toLowerCase()) {
      case 'phrix':
        return this.createPhrixFlowArbiter(group, color);
      case 'crucis':
        return this.createCrucisSuppressionGovernor(group, color);
      case 'vertex':
        return this.createVertexTemporalGate(group, color);
      default:
        console.warn(`[ControlNodeSpecialGovernors] Unknown governor: '${name}'. Creating PHRIX.`);
        return this.createPhrixFlowArbiter(group, color);
    }
  }
}

export default ControlNodeSpecialGovernors;
