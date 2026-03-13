import * as THREE from 'three';

/**
 * STORAGE Node Visual Designs (Session 116)
 * ============================================================================
 * Three visual-only STORAGE nodes representing memory, accumulation, preservation.
 * 
 * DESIGN PHILOSOPHY:
 * - Heavy, calm, stable presence
 * - Quietly intelligent (not aggressive)
 * - Memory feels tangible and grounded
 * - Motion is subtle and patient (10-30 second cycles)
 * - No spheres, no UI symbols, no mechanical aggression
 * 
 * NODES:
 * 1. OBELISK CACHE - Memory Monolith, seeded with cyan glow
 * 2. FRACTAL RESERVOIR - Crystallized Memory, shimmering violet veins
 * 3. ARCHIVE DRUM - Mechanical Archive, slow rotating rings
 */

export class StorageNodesVisual {

  /**
   * OBELISK CACHE - Memory Monolith / Data Vault
   * 
   * ARCHETYPE: Tall irregular obelisk, data stored in deep seams
   * 
   * GEOMETRY:
   * - Tall asymmetric structure (height ~1.4x width)
   * - 4-6 non-uniform vertical plates
   * - Slightly chipped/fractured top
   * - Deep seams between plates filled with translucent material
   * - Grounded, heavy base
   * 
   * MATERIALS:
   * - Dark ceramic/obsidian (0.1, 0.08, 0.15)
   * - Matte surface (metalness 0.3, roughness 0.7)
   * - Inner seams: translucent cyan material
   * 
   * EMISSIVE:
   * - Soft cyan glow from interior seams
   * - Depth-layered (light appears to come from inside)
   * - Breathing cycle 10-15 seconds
   * 
   * MOTION:
   * - Almost static
   * - Very slow internal light breathing
   * - Micro-settling of plates (barely visible)
   */
  static createObeliskCache(group, color = 0x00ff88) {
    try {
      // Base material (dark ceramic)
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x1a1a2e),  // Dark blue-black
        metalness: 0.3,
        roughness: 0.7,
        emissive: new THREE.Color(0x1a1a2e),
        emissiveIntensity: 0.05
      });

      // Seam material (translucent with cyan glow)
      const seamMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x004444),  // Deep cyan
        metalness: 0.2,
        roughness: 0.4,
        transparent: true,
        opacity: 0.6,
        emissive: new THREE.Color(0x00aaff),  // Bright cyan
        emissiveIntensity: 0.4
      });

      // === MAIN OBELISK PLATES ===
      // Create 5 irregular vertical plates
      const plateCount = 5;
      const plateHeights = [0.8, 0.95, 0.85, 0.9, 0.75];  // Varied heights
      const plateRotations = [0, 0.15, -0.1, 0.2, -0.15]; // Slight tilts

      for (let i = 0; i < plateCount; i++) {
        const plateGeometry = new THREE.BoxGeometry(0.25, plateHeights[i], 0.08);
        const plate = new THREE.Mesh(plateGeometry, baseMaterial);

        // Position in circle around center
        const angle = (i / plateCount) * Math.PI * 2;
        const radius = 0.25;
        plate.position.set(
          Math.cos(angle) * radius,
          plateHeights[i] * 0.5 - 0.1,
          Math.sin(angle) * radius
        );

        // Slight rotation for asymmetry
        plate.rotation.z = plateRotations[i];
        plate.rotation.y = angle;

        plate.userData.isObeliskPlate = true;
        plate.userData.plateIndex = i;
        plate.userData.baseHeight = plateHeights[i];
        group.add(plate);
      }

      // === FRACTURED TOP ===
      // Create irregular peak (chipped effect)
      const topGeometry = new THREE.TetrahedronGeometry(0.2, 1);
      const top = new THREE.Mesh(topGeometry, baseMaterial);
      top.position.y = 0.5;
      top.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
      top.scale.set(0.8, 1.1, 0.8);  // Slightly stretched
      top.userData.isFracturedTop = true;
      group.add(top);

      // === INTERIOR SEAMS (Glowing translucent layers) ===
      const seamCount = 3;
      for (let i = 0; i < seamCount; i++) {
        const seamGeometry = new THREE.BoxGeometry(0.15, 0.6 - (i * 0.1), 0.02);
        const seam = new THREE.Mesh(seamGeometry, seamMaterial);

        seam.position.y = 0.1 - (i * 0.05);
        seam.position.z = -0.15 + (i * 0.08);
        seam.rotation.y = (i / seamCount) * Math.PI / 3;

        seam.userData.isInteriorSeam = true;
        seam.userData.seamIndex = i;
        seam.userData.breathingPhase = 0;
        group.add(seam);
      }

      // === BASE PLATFORM ===
      const baseGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.15, 8);
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = -0.45;
      base.userData.isBase = true;
      group.add(base);

      // Store animation metadata
      group.userData.isObeliskCache = true;
      group.userData.nodeGeometryName = 'STORAGE_OBELISK_CACHE';
      group.userData.breathingCycle = 12.0;     // 12 seconds
      group.userData.breathingAmplitude = 0.15; // 15% intensity variation
      group.userData.settlingAmplitude = 0.02;  // Micro-settling (2% of height)
      group.userData.visualCoreImmutable = false;

      return group;
    } catch (err) {
      console.warn('[StorageNodesVisual] ObeliskCache creation failed:', err);
      return group;
    }
  }

  /**
   * FRACTAL RESERVOIR - Crystallized Memory / Data Reservoir
   * 
   * ARCHETYPE: Cluster of crystals, memory feels fragmented across shards
   * 
   * GEOMETRY:
   * - 6-12 irregular crystal shards
   * - Each shard unique shape and height
   * - Gaps between shards (distributed memory)
   * - No central core (distributed architecture)
   * - Range from 0.3 to 0.8 units tall
   * 
   * MATERIALS:
   * - Semi-transparent crystal (frosted glass aesthetic)
   * - Sharp edges, slight internal noise
   * - Dim violet/blue veins of light
   * 
   * EMISSIVE:
   * - Violet internal light pathways
   * - Refracts inside crystals
   * - Subtle rim-light on edges
   * - No pulsing, only slow luminosity breathing
   * 
   * MOTION:
   * - Extremely slow light pulsing (15-20s cycle)
   * - Occasional micro-rotation of single shards
   * - Feels geological, patient
   */
  static createFractalReservoir(group, color = 0x00ff88) {
    try {
      // Crystal material (semi-transparent with internal light)
      const crystalMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x1a2a3a),       // Deep blue-gray
        metalness: 0.1,
        roughness: 0.3,
        transparent: true,
        opacity: 0.7,
        emissive: new THREE.Color(0x6633ff),   // Violet veins
        emissiveIntensity: 0.25,
        side: THREE.DoubleSide
      });

      // Rim-light material (for edge accent)
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x3355ff),
        metalness: 0.0,
        roughness: 0.2,
        transparent: true,
        opacity: 0.3,
        emissive: new THREE.Color(0x00ffff),  // Cyan rim
        emissiveIntensity: 0.15
      });

      // === CREATE SHARD CLUSTER ===
      const shardCount = 9;
      const shards = [];

      for (let i = 0; i < shardCount; i++) {
        // Varied shard shapes using different geometries
        let shardGeometry;
        const shapeType = i % 3;

        if (shapeType === 0) {
          // Tetrahedron
          shardGeometry = new THREE.TetrahedronGeometry(
            0.15 + Math.random() * 0.1,
            1
          );
        } else if (shapeType === 1) {
          // Octahedron
          shardGeometry = new THREE.OctahedronGeometry(
            0.12 + Math.random() * 0.08,
            1
          );
        } else {
          // Irregular cone
          shardGeometry = new THREE.ConeGeometry(
            0.1 + Math.random() * 0.06,
            0.3 + Math.random() * 0.15,
            5
          );
        }

        const shard = new THREE.Mesh(shardGeometry, crystalMaterial);

        // Random distribution (not perfectly centered)
        const angle = (i / shardCount) * Math.PI * 2 + (Math.random() * 0.3);
        const radius = 0.3 + Math.random() * 0.2;
        const height = 0.2 + Math.random() * 0.4;

        shard.position.set(
          Math.cos(angle) * radius,
          height - 0.3,
          Math.sin(angle) * radius
        );

        // Random rotation (sharp, angular)
        shard.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );

        shard.userData.isShardCrystal = true;
        shard.userData.shardIndex = i;
        shard.userData.oscillationPhase = Math.random() * Math.PI * 2;
        shard.userData.oscillationSpeed = 0.3 + Math.random() * 0.2;
        shard.userData.basePosition = shard.position.clone();

        group.add(shard);
        shards.push(shard);
      }

      // === ADD RIM-LIGHT ACCENTS ===
      // Subtle glowing edges around some shards
      for (let i = 0; i < Math.floor(shardCount / 2); i++) {
        const rimGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);

        const shardIdx = i * 2;
        const targetShard = shards[shardIdx];
        if (targetShard) {
          rim.position.copy(targetShard.position);
          rim.userData.isRimLight = true;
          rim.userData.linkedShardIndex = shardIdx;
          group.add(rim);
        }
      }

      // Store animation metadata
      group.userData.isFractalReservoir = true;
      group.userData.nodeGeometryName = 'STORAGE_FRACTAL_RESERVOIR';
      group.userData.lightBreathingCycle = 18.0;       // 18 seconds
      group.userData.lightBreathingAmplitude = 0.2;    // 20% variation
      group.userData.shardMicroRotationAmplitude = 0.05; // 5% rotation
      group.userData.shardMicroRotationSpeed = 0.4;    // Slow rotation
      group.userData.visualCoreImmutable = false;

      return group;
    } catch (err) {
      console.warn('[StorageNodesVisual] FractalReservoir creation failed:', err);
      return group;
    }
  }

  /**
   * ARCHIVE DRUM - Mechanical Archive / Data Cylinder
   * 
   * ARCHETYPE: Horizontal rotating cylinder with layered rings
   * 
   * GEOMETRY:
   * - Horizontal or slightly tilted segmented cylinder
   * - Outer shell: circular rings
   * - Inner visible layered discs
   * - Slight asymmetry in axis alignment
   * - Feels mechanical but not aggressive
   * 
   * MATERIALS:
   * - Matte industrial metal (0.4-0.6 metalness)
   * - Glass/translucent rings between segments
   * - Reflective inner layers
   * 
   * EMISSIVE:
   * - Muted amber (0xdd8844) + cold blue accents
   * - Circular light flow along inner rings
   * - No blinking or sharp pulses
   * 
   * MOTION:
   * - Very slow rotation (1 full rotation in 20-30 seconds)
   * - Inner layers rotate at slightly different speeds
   * - Calm, archival motion
   */
  static createArchiveDrum(group, color = 0x00ff88) {
    try {
      // Outer shell material (matte industrial metal)
      const shellMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x4a4a4a),
        metalness: 0.5,
        roughness: 0.6,
        emissive: new THREE.Color(0x2a2a2a),
        emissiveIntensity: 0.05
      });

      // Ring material (translucent glass with amber glow)
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x5a4a2a),
        metalness: 0.2,
        roughness: 0.3,
        transparent: true,
        opacity: 0.5,
        emissive: new THREE.Color(0xdd8844),  // Amber
        emissiveIntensity: 0.2
      });

      // Inner disc material (reflective with blue accents)
      const discMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x3a4a5a),
        metalness: 0.7,
        roughness: 0.3,
        emissive: new THREE.Color(0x4488dd),  // Cold blue
        emissiveIntensity: 0.15
      });

      // === MAIN DRUM SHELL ===
      const drumGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12, 2);
      const drum = new THREE.Mesh(drumGeometry, shellMaterial);
      drum.rotation.z = 0.3;  // Slight tilt
      drum.userData.isDrumShell = true;
      drum.userData.rotationSpeed = 0.05;  // Very slow (20s per rotation)
      group.add(drum);

      // === OUTER RINGS (segmented appearance) ===
      const ringCount = 4;
      for (let i = 0; i < ringCount; i++) {
        const ringGeometry = new THREE.TorusGeometry(0.42, 0.06, 16, 32);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);

        // Space rings along axis
        const spacing = 0.12;
        ring.position.z = (i - ringCount / 2) * spacing + 0.05;
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = 0.3;  // Match drum tilt

        ring.userData.isOuterRing = true;
        ring.userData.ringIndex = i;
        ring.userData.glowPhase = i * (Math.PI / ringCount);
        group.add(ring);
      }

      // === INNER LAYERED DISCS ===
      const discCount = 6;
      for (let i = 0; i < discCount; i++) {
        const discGeometry = new THREE.CylinderGeometry(
          0.35 - (i * 0.04),
          0.35 - (i * 0.04),
          0.05,
          12
        );
        const disc = new THREE.Mesh(discGeometry, discMaterial);

        // Stack discs inside
        const stackSpacing = 0.08;
        disc.position.z = (i - discCount / 2) * stackSpacing;
        disc.rotation.z = 0.3;  // Match drum tilt

        disc.userData.isInnerDisc = true;
        disc.userData.discIndex = i;
        disc.userData.rotationSpeed = 0.05 + (i * 0.01);  // Slightly varying speeds
        group.add(disc);
      }

      // === CENTER AXIS HUB ===
      const hubGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
      const hub = new THREE.Mesh(hubGeometry, shellMaterial);
      hub.rotation.z = 0.3;
      hub.userData.isCenterHub = true;
      group.add(hub);

      // === ACCENT CAPS (end pieces with glow) ===
      const capMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x2a3a4a),
        metalness: 0.6,
        roughness: 0.4,
        emissive: new THREE.Color(0x0099ff),  // Bright blue accent
        emissiveIntensity: 0.2
      });

      for (let side = -1; side <= 1; side += 2) {
        const capGeometry = new THREE.CylinderGeometry(0.45, 0.38, 0.08, 12);
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.z = side * 0.38;
        cap.rotation.z = 0.3;
        cap.userData.isEndCap = true;
        cap.userData.capSide = side;
        group.add(cap);
      }

      // Store animation metadata
      group.userData.isArchiveDrum = true;
      group.userData.nodeGeometryName = 'STORAGE_ARCHIVE_DRUM';
      group.userData.shellRotationSpeed = 0.05;       // 20s per rotation
      group.userData.discRotationBaseSpeed = 0.05;
      group.userData.discRotationVariance = 0.02;     // Slight speed differences
      group.userData.glowBreathingCycle = 10.0;       // 10 second cycle
      group.userData.glowBreathingAmplitude = 0.1;    // 10% glow variation
      group.userData.visualCoreImmutable = false;

      return group;
    } catch (err) {
      console.warn('[StorageNodesVisual] ArchiveDrum creation failed:', err);
      return group;
    }
  }

  /**
   * Create storage node by name
   * Usage: StorageNodesVisual.createStorageNode('obelisk', group, color)
   */
  static createStorageNode(name, group, color = 0x00ff88) {
    switch (name.toLowerCase()) {
      case 'obelisk':
        return this.createObeliskCache(group, color);
      case 'fractal':
        return this.createFractalReservoir(group, color);
      case 'drum':
      case 'archive':
        return this.createArchiveDrum(group, color);
      default:
        console.warn(`[StorageNodesVisual] Unknown storage node: '${name}'. Creating Obelisk.`);
        return this.createObeliskCache(group, color);
    }
  }
}

export default StorageNodesVisual;
