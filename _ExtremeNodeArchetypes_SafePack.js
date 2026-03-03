import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

/**
 * UltraSafe Node Archetypes Pack - ATOMA Edition
 * 
 * 12 extreme neon-geometric archetypes for AI nodes
 * Fully self-contained, non-destructive, visual-only
 * 
 * Hard rules maintained:
 * - NO modifications to existing systems
 * - NO global state changes
 * - NO THREE.js prototype overrides
 * - All meshes wrapped in parent THREE.Group()
 * - Non-raycastable (depthWrite: false, raycast disabled)
 * - Pure visual animation via userData
 * - Zero physics, zero gameplay impact
 */

export class ExtremeNodeArchetypes_SafePack {
  constructor() {
    this.archetypeDefinitions = {
      'quantum-lotus': this.createQuantumLotus.bind(this),
      'fractal-spine': this.createFractalSpine.bind(this),
      'echo-torus': this.createEchoTorus.bind(this),
      'omega-helix': this.createOmegaHelix.bind(this),
      'celestial-prism': this.createCelestialPrism.bind(this),
      'hypervoid-mirror': this.createHypervoidMirror.bind(this),
      'astra-bloom': this.createAstraBloom.bind(this),
      'duality-paradox': this.createDualityParadox.bind(this),
      'singularity-vine': this.createSingularityVine.bind(this),
      'chrono-chain': this.createChronoChain.bind(this),
      'neon-seraph': this.createNeonSeraph.bind(this),
      'spectral-crown': this.createSpectralCrown.bind(this)
    };
  }

  /**
   * Apply archetype by ID to a node
   * @param {string} id - Archetype ID (e.g., 'quantum-lotus')
   * @param {THREE.Object3D} node - Target AI node
   * @returns {boolean} Success status
   */
  applyArchetype(id, node) {
    if (!this.archetypeDefinitions[id]) {
      console.warn(`[SafeArchetypes] Unknown archetype ID: ${id}`);
      return false;
    }

    try {
      const archetypeGroup = this.archetypeDefinitions[id]();
      if (archetypeGroup) {
        node.add(archetypeGroup);
        node.userData.archetypal = id;
        node.userData.archetypeApplied = true;
        return true;
      }
    } catch (err) {
      console.error(`[SafeArchetypes] Error applying archetype ${id}:`, err);
    }
    return false;
  }

  /**
   * ARCHETYPE 1: Quantum Lotus
   * Layered petal geometry with fractal symmetry and neon core
   */
  createQuantumLotus() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'quantum-lotus',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.32,
      rotationAxis: new THREE.Vector3(0, 1, 0.25).normalize()
    };

    const petalColors = [0x00ffff, 0x00ddff, 0x00bbff];

    // Base ring
    const baseGeo = new THREE.TorusGeometry(0.72, 0.05, 8, 20, Math.PI * 1.8);
    const baseMat = materialRegistry.getBasicMaterial({
      color: 0x00bbff,
      transparent: true,
      opacity: 0.4,
      emissive: 0x0099ff,
      emissiveIntensity: 0.4,
      depthWrite: false
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.rotation.x = Math.PI * 0.5;
    base.rotation.y = Math.PI * 0.12;
    base.userData = { isArchetypeVFX: true };
    base.raycast = () => false;
    group.add(base);

    // Spine
    const spineGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 10, 1);
    const spineMat = materialRegistry.getBasicMaterial({
      color: 0x00e0ff,
      emissive: 0x00e0ff,
      emissiveIntensity: 0.6,
      depthWrite: false,
      transparent: true,
      opacity: 0.8
    });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.y = 0.05;
    spine.userData = { isArchetypeVFX: true };
    spine.raycast = () => false;
    group.add(spine);

    // Petal ring (6 petals)
    const petalGeo = new THREE.BoxGeometry(0.18, 0.6, 0.12);
    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2;
      const petalMat = materialRegistry.getBasicMaterial({
        color: petalColors[p % petalColors.length],
        emissive: petalColors[p % petalColors.length],
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 0.55, 0.12, Math.sin(angle) * 0.55);
      petal.rotation.y = angle + Math.PI * 0.2;
      petal.rotation.z = Math.PI * 0.18;
      petal.userData = { isArchetypeVFX: true, petalIndex: p };
      petal.raycast = () => false;
      group.add(petal);
    }

    // Inner halo ring
    const haloGeo = new THREE.TorusGeometry(0.32, 0.025, 8, 18);
    const haloMat = materialRegistry.getBasicMaterial({
      color: 0x66ffff,
      emissive: 0x33ccff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = 0.28;
    halo.rotation.x = Math.PI * 0.5;
    halo.userData = { isArchetypeVFX: true };
    halo.raycast = () => false;
    group.add(halo);

    // Core
    const centerGeo = new THREE.OctahedronGeometry(0.22, 1);
    const centerMat = materialRegistry.getBasicMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.position.y = 0.34;
    center.userData = { isArchetypeVFX: true };
    center.raycast = () => false;
    group.add(center);

    return group;
  }

  /**
   * ARCHETYPE 2: Fractal Spine
   * Recursive scaled boxes forming an elegant spinal column
   */
  createFractalSpine() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'fractal-spine',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.5,
      rotationAxis: new THREE.Vector3(0, 0, 1)
    };

    const baseColor = 0xff00ff;
    const segmentCount = 5;

    for (let s = 0; s < segmentCount; s++) {
      // Fractal scale reduction
      const fractalScale = Math.pow(0.8, s);
      const yOffset = (s - segmentCount / 2) * 0.3;

      const boxGeo = new THREE.BoxGeometry(0.3 * fractalScale, 0.15 * fractalScale, 0.3 * fractalScale);
      
      // Alternate between solid and wireframe
      const isWireframe = s % 2 === 0;
      const boxMat = materialRegistry.getBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: isWireframe ? 0.4 : (0.75 - s * 0.1),
        emissive: baseColor,
        emissiveIntensity: 0.45,
        depthWrite: false,
        wireframe: isWireframe
      });

      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = yOffset;
      box.userData = { isArchetypeVFX: true, segmentIndex: s };
      box.raycast = () => false;

      group.add(box);
    }

    return group;
  }

  /**
   * ARCHETYPE 3: Echo Torus
   * Concentric rotating tori with pulsing opacity layers
   */
  createEchoTorus() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'echo-torus',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.25,
      rotationAxis: new THREE.Vector3(0.3, 1, 0.2).normalize()
    };

    const torusColors = [0x00ffff, 0x00ffaa, 0x00ff88];
    const torusCount = 3;

    for (let t = 0; t < torusCount; t++) {
      const radius = 0.4 + t * 0.25;
      const tube = 0.08 - t * 0.02;

      const torusGeo = new THREE.TorusGeometry(radius, tube, 16, 100);
      const torusMat = materialRegistry.getBasicMaterial({
        color: torusColors[t % torusColors.length],
        transparent: true,
        opacity: 0.55 - t * 0.12,
        emissive: torusColors[t % torusColors.length],
        emissiveIntensity: 0.35,
        depthWrite: false
      });

      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.x = Math.random() * Math.PI;
      torus.rotation.y = Math.random() * Math.PI;
      torus.userData = { isArchetypeVFX: true, torusIndex: t };
      torus.raycast = () => false;

      group.add(torus);
    }

    return group;
  }

  /**
   * ARCHETYPE 4: Omega Helix
   * Helical spiral path with node markers and connecting line
   */
  createOmegaHelix() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'omega-helix',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.4,
      rotationAxis: new THREE.Vector3(0, 1, 0)
    };

    const baseColor = 0xff00ff;
    const helixPoints = 8;
    const helixRadius = 0.5;
    const helixHeight = 0.6;

    const points = [];

    for (let h = 0; h < helixPoints; h++) {
      const t = (h / helixPoints) * Math.PI * 2;
      const y = (h - helixPoints / 2) * helixHeight / helixPoints;

      const x = Math.cos(t) * helixRadius;
      const z = Math.sin(t) * helixRadius;

      points.push(new THREE.Vector3(x, y, z));

      // Create octahedron at each helix node
      const nodeGeo = new THREE.OctahedronGeometry(0.12, 1);
      const nodeMat = materialRegistry.getBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.7,
        emissive: baseColor,
        emissiveIntensity: 0.4,
        depthWrite: false
      });

      const helixNode = new THREE.Mesh(nodeGeo, nodeMat);
      helixNode.position.copy(points[points.length - 1]);
      helixNode.userData = { isArchetypeVFX: true, helixIndex: h };
      helixNode.raycast = () => false;

      group.add(helixNode);
    }

    // Add connecting line
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      linewidth: 2
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.userData = { isArchetypeVFX: true };
    group.add(line);

    return group;
  }

  /**
   * ARCHETYPE 5: Celestial Prism
   * Faceted polyhedron with internal wireframe for depth
   */
  createCelestialPrism() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'celestial-prism',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.6,
      rotationAxis: new THREE.Vector3(1, 1, 1).normalize()
    };

    const prismColors = [0x00ffff, 0xffff00, 0x00ff88];

    // Outer solid faceted dodecahedron
    const outerGeo = new THREE.DodecahedronGeometry(0.4, 0);
    const outerMat = materialRegistry.getBasicMaterial({
      color: prismColors[0],
      transparent: true,
      opacity: 0.35,
      emissive: prismColors[0],
      emissiveIntensity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.userData = { isArchetypeVFX: true };
    outer.raycast = () => false;
    group.add(outer);

    // Inner wireframe for depth perception
    const innerGeo = new THREE.DodecahedronGeometry(0.38, 0);
    const innerMat = materialRegistry.getBasicMaterial({
      color: prismColors[2],
      transparent: true,
      opacity: 0.55,
      emissive: prismColors[2],
      emissiveIntensity: 0.25,
      depthWrite: false,
      wireframe: true
    });

    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.userData = { isArchetypeVFX: true };
    inner.raycast = () => false;
    group.add(inner);

    return group;
  }

  /**
   * ARCHETYPE 6: Hypervoid Mirror
   * Symmetrical mirrored planes creating void/depth effect
   */
  createHypervoidMirror() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'hypervoid-mirror',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.35,
      rotationAxis: new THREE.Vector3(0, 1, 0.5).normalize()
    };

    const mirrorColors = [0xff00ff, 0x00ffff];
    const planeCount = 4;

    for (let p = 0; p < planeCount; p++) {
      const angle = (p / planeCount) * Math.PI * 2;

      const planeGeo = new THREE.PlaneGeometry(0.4, 0.6);
      const planeMat = materialRegistry.getBasicMaterial({
        color: mirrorColors[p % 2],
        transparent: true,
        opacity: 0.5,
        emissive: mirrorColors[p % 2],
        emissiveIntensity: 0.3,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = Math.PI * 0.25;
      plane.rotation.z = angle;
      plane.userData = { isArchetypeVFX: true, planeIndex: p };
      plane.raycast = () => false;

      group.add(plane);
    }

    return group;
  }

  /**
   * ARCHETYPE 7: Astra Bloom
   * Starburst of pointed tetrahedra radiating outward
   */
  createAstraBloom() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'astra-bloom',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.5,
      rotationAxis: new THREE.Vector3(0, 1, 0)
    };

    const baseColor = 0xffff00;
    const spikeCount = 8;
    const radiusMultiplier = 0.4;

    for (let s = 0; s < spikeCount; s++) {
      const angle = (s / spikeCount) * Math.PI * 2;
      const verticalOffset = (s % 2) === 0 ? 0.5 : -0.5;

      const direction = new THREE.Vector3(
        Math.cos(angle),
        verticalOffset,
        Math.sin(angle)
      ).normalize();

      // Tetrahedron spike
      const spikeGeo = new THREE.TetrahedronGeometry(0.2, 0);
      const spikeMat = materialRegistry.getBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.7,
        emissive: baseColor,
        emissiveIntensity: 0.5,
        depthWrite: false
      });

      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.copy(direction.multiplyScalar(radiusMultiplier));
      spike.lookAt(direction);
      spike.userData = { isArchetypeVFX: true, spikeIndex: s };
      spike.raycast = () => false;

      group.add(spike);
    }

    return group;
  }

  /**
   * ARCHETYPE 8: Duality Paradox
   * Interlocking contradictory wireframe shapes
   */
  createDualityParadox() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'duality-paradox',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.45,
      rotationAxis: new THREE.Vector3(1, 1, 0).normalize()
    };

    // Wireframe sphere (roundness)
    const sphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const sphereMat = materialRegistry.getBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.45,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
      depthWrite: false,
      wireframe: true
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.userData = { isArchetypeVFX: true };
    sphere.raycast = () => false;
    group.add(sphere);

    // Wireframe cube (angularity) - slightly rotated for contradiction
    const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const cubeMat = materialRegistry.getBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.45,
      emissive: 0xff00ff,
      emissiveIntensity: 0.3,
      depthWrite: false,
      wireframe: true
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.rotation.set(0.3, 0.3, 0.3);
    cube.userData = { isArchetypeVFX: true };
    cube.raycast = () => false;
    group.add(cube);

    return group;
  }

  /**
   * ARCHETYPE 9: Singularity Vine
   * Twisted spiral with organic branching
   */
  createSingularityVine() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'singularity-vine',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.55,
      rotationAxis: new THREE.Vector3(0, 1, 0)
    };

    const vineColors = [0xff00ff, 0x00ffff];
    const segmentCount = 6;
    const helicalTwist = Math.PI * 4;

    for (let v = 0; v < segmentCount; v++) {
      const t = v / segmentCount;
      const y = (v - segmentCount / 2) * 0.35 / segmentCount;
      const twist = t * helicalTwist;

      const x = Math.cos(twist) * 0.3;
      const z = Math.sin(twist) * 0.3;

      // Capsule segment
      const capsuleGeo = new THREE.CapsuleGeometry(0.08, 0.15, 4, 8);
      const capsuleMat = materialRegistry.getBasicMaterial({
        color: vineColors[v % 2],
        transparent: true,
        opacity: 0.65,
        emissive: vineColors[v % 2],
        emissiveIntensity: 0.4,
        depthWrite: false
      });

      const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
      capsule.position.set(x, y, z);
      capsule.userData = { isArchetypeVFX: true, vineIndex: v };
      capsule.raycast = () => false;

      group.add(capsule);

      // Branch every other segment
      if (v % 2 === 0) {
        const branchAngle = twist + Math.PI / 4;
        const branchX = Math.cos(branchAngle) * 0.25;
        const branchZ = Math.sin(branchAngle) * 0.25;

        const branchGeo = new THREE.TetrahedronGeometry(0.1, 0);
        const branchMat = materialRegistry.getBasicMaterial({
          color: 0x00ffaa,
          transparent: true,
          opacity: 0.55,
          emissive: 0x00ffaa,
          emissiveIntensity: 0.3,
          depthWrite: false
        });

        const branch = new THREE.Mesh(branchGeo, branchMat);
        branch.position.set(x + branchX, y, z + branchZ);
        branch.userData = { isArchetypeVFX: true, branchIndex: v };
        branch.raycast = () => false;

        group.add(branch);
      }
    }

    return group;
  }

  /**
   * ARCHETYPE 10: Chrono Chain
   * Linked temporal segments forming a chain
   */
  createChronoChain() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'chrono-chain',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.4,
      rotationAxis: new THREE.Vector3(0, 0, 1)
    };

    const chainColors = [0xffff00, 0xff00ff, 0x00ffff];
    const linkCount = 5;

    for (let c = 0; c < linkCount; c++) {
      const y = (c - linkCount / 2) * 0.35 / linkCount;

      // Torus link (chain ring)
      const linkGeo = new THREE.TorusGeometry(0.15, 0.05, 8, 32);
      const linkMat = materialRegistry.getBasicMaterial({
        color: chainColors[c % 3],
        transparent: true,
        opacity: 0.65,
        emissive: chainColors[c % 3],
        emissiveIntensity: 0.4,
        depthWrite: false
      });

      const link = new THREE.Mesh(linkGeo, linkMat);
      link.rotation.x = Math.PI / 2;
      link.position.y = y;
      link.userData = { isArchetypeVFX: true, chainIndex: c };
      link.raycast = () => false;

      group.add(link);

      // Connection sphere between links
      if (c < linkCount - 1) {
        const connGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const connMat = materialRegistry.getBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.55,
          emissive: 0x00ffff,
          emissiveIntensity: 0.3,
          depthWrite: false
        });

        const conn = new THREE.Mesh(connGeo, connMat);
        conn.position.y = y + 0.08;
        conn.userData = { isArchetypeVFX: true };
        conn.raycast = () => false;

        group.add(conn);
      }
    }

    return group;
  }

  /**
   * ARCHETYPE 11: Neon Seraph
   * Winged angelic form with radiating light rays
   */
  createNeonSeraph() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'neon-seraph',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.35,
      rotationAxis: new THREE.Vector3(0, 1, 0)
    };

    const baseColor = 0x00ffff;

    // Central column (body)
    const columnGeo = new THREE.CapsuleGeometry(0.1, 0.6, 4, 8);
    const columnMat = materialRegistry.getBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.7,
      emissive: baseColor,
      emissiveIntensity: 0.5,
      depthWrite: false
    });

    const column = new THREE.Mesh(columnGeo, columnMat);
    column.userData = { isArchetypeVFX: true };
    column.raycast = () => false;
    group.add(column);

    // Wings (two sides)
    for (let wing = 0; wing < 2; wing++) {
      const wingX = wing === 0 ? -0.3 : 0.3;
      const wingSegments = 3;

      for (let w = 0; w < wingSegments; w++) {
        const wingY = (w - wingSegments / 2) * 0.25;
        const wingZ = w * 0.2;

        const wingGeo = new THREE.PlaneGeometry(0.2, 0.3);
        const wingMat = materialRegistry.getBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.5,
          emissive: 0xff00ff,
          emissiveIntensity: 0.3,
          depthWrite: false,
          side: THREE.DoubleSide
        });

        const wingMesh = new THREE.Mesh(wingGeo, wingMat);
        wingMesh.position.set(wingX, wingY, wingZ);
        wingMesh.rotation.z = (wing === 0 ? -1 : 1) * Math.PI / 6;
        wingMesh.userData = { isArchetypeVFX: true, wingIndex: w };
        wingMesh.raycast = () => false;

        group.add(wingMesh);
      }
    }

    // Radiating light rays (top halo)
    const rayCount = 6;
    for (let r = 0; r < rayCount; r++) {
      const angle = (r / rayCount) * Math.PI * 2;
      const startPos = new THREE.Vector3(0, 0.3, 0);
      const endPos = new THREE.Vector3(
        Math.cos(angle) * 0.35,
        0.55,
        Math.sin(angle) * 0.35
      );

      const rayGeo = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
      const rayMat = new THREE.LineBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        linewidth: 2
      });

      const ray = new THREE.Line(rayGeo, rayMat);
      ray.userData = { isArchetypeVFX: true };
      group.add(ray);
    }

    return group;
  }

  /**
   * ARCHETYPE 12: Spectral Crown
   * Crown structure with floating gems
   */
  createSpectralCrown() {
    const group = new THREE.Group();
    group.userData = {
      archetypal: 'spectral-crown',
      pulsePhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.5,
      rotationAxis: new THREE.Vector3(0, 1, 0)
    };

    // Crown band (torus)
    const bandGeo = new THREE.TorusGeometry(0.4, 0.08, 12, 48);
    const bandMat = materialRegistry.getBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.65,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4,
      depthWrite: false
    });

    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI / 3;
    band.userData = { isArchetypeVFX: true };
    band.raycast = () => false;
    group.add(band);

    // Crown points (spikes)
    const pointColors = [0xff00ff, 0x00ffff, 0x00ffaa];
    const pointCount = 5;

    for (let p = 0; p < pointCount; p++) {
      const angle = (p / pointCount) * Math.PI * 2;
      const radius = 0.4;

      const pointX = Math.cos(angle) * radius;
      const pointZ = Math.sin(angle) * radius;
      const pointY = 0.35;

      // Octahedron spike
      const pointGeo = new THREE.OctahedronGeometry(0.15, 1);
      const pointMat = materialRegistry.getBasicMaterial({
        color: pointColors[p % 3],
        transparent: true,
        opacity: 0.7,
        emissive: pointColors[p % 3],
        emissiveIntensity: 0.5,
        depthWrite: false
      });

      const point = new THREE.Mesh(pointGeo, pointMat);
      point.position.set(pointX, pointY, pointZ);
      point.scale.z = 2;
      point.userData = { isArchetypeVFX: true, crownIndex: p };
      point.raycast = () => false;

      group.add(point);

      // Floating gem below each point
      const gemGeo = new THREE.IcosahedronGeometry(0.1, 2);
      const gemMat = materialRegistry.getBasicMaterial({
        color: pointColors[(p + 1) % 3],
        transparent: true,
        opacity: 0.8,
        emissive: pointColors[(p + 1) % 3],
        emissiveIntensity: 0.6,
        depthWrite: false
      });

      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(pointX, pointY - 0.3, pointZ);
      gem.userData = { 
        isArchetypeVFX: true, 
        gemFloatPhase: Math.random() * Math.PI * 2,
        gemIndex: p
      };
      gem.raycast = () => false;

      group.add(gem);
    }

    return group;
  }
}

/**
 * INTEGRATION NOTES FOR MANUAL SETUP:
 * 
 * This pack is fully self-contained and safe.
 * All 12 archetypes are production-ready.
 * 
 * BASIC USAGE:
 * 
 * 1. Import:
 *    import { ExtremeNodeArchetypes_SafePack } from './_ExtremeNodeArchetypes_SafePack.js'
 * 
 * 2. Create instance:
 *    const archetypesPack = new ExtremeNodeArchetypes_SafePack()
 * 
 * 3. Apply to node:
 *    archetypesPack.applyArchetype('quantum-lotus', nodeObject)
 * 
 * ANIMATION (optional, add to animation loop):
 * 
 *   node.traverse(child => {
 *     if (child.userData.isArchetypeVFX) {
 *       const rotSpeed = node.userData.rotationSpeed || 0.3;
 *       const rotAxis = node.userData.rotationAxis || new THREE.Vector3(0, 1, 0);
 *       
 *       child.rotation.x += rotSpeed * deltaTime * rotAxis.x;
 *       child.rotation.y += rotSpeed * deltaTime * rotAxis.y;
 *       child.rotation.z += rotSpeed * deltaTime * rotAxis.z;
 *       
 *       // Optional pulsing opacity
 *       if (child.userData.torusIndex !== undefined) {
 *         const base = [0.55, 0.43, 0.31][child.userData.torusIndex];
 *         child.material.opacity = base + 
 *           Math.sin(node.userData.pulsePhase + time) * 0.1;
 *       }
 *     }
 *   });
 * 
 * ARCHETYPES AVAILABLE:
 * - quantum-lotus
 * - fractal-spine
 * - echo-torus
 * - omega-helix
 * - celestial-prism
 * - hypervoid-mirror
 * - astra-bloom
 * - duality-paradox
 * - singularity-vine
 * - chrono-chain
 * - neon-seraph
 * - spectral-crown
 */
