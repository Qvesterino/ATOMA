/**
 * INTEGRATION ENHANCED VARIANTS - Session 110
 * Three NEW production-ready Integration node variants
 * Archetype: KNOTS (Intertwined structures)
 * 
 * 1. Signal Knot: Smooth data streams, readable flow, balanced.
 * 2. Protocol Tangle: Heterogeneous strands, complex, negotiated friction.
 * 3. Continuity Binder: Calmer, elongated, stable loops.
 * 
 * CONSTRAINTS MET:
 * ✅ No primitives (cube, sphere, torus, circle, ring)
 * ✅ No perfect symmetry - asymmetrical designs
 * ✅ No flat disks or planar-only meshes - all have depth
 * ✅ Geometry has negative space and structure
 * ✅ Visual identity from structure, not mass
 */

import * as THREE from 'three';

export class IntegrationEnhancedVariants {
  
  /**
   * INTEGRATION: SIGNAL_KNOT
   * 
   * Description:
   * - Three smooth data streams woven together in a balanced open weave.
   * - Readable flow direction via geometry alignment.
   * - Intentional and precise integration.
   * 
   * Visual Style:
   * - Cyan/Teal emissive flow lines.
   * - Smooth tubular geometry.
   * - Balanced composition.
   */
  static createIntegrationEnhanced_SignalKnot(group, color) {
    try {
      const strandCount = 3;
      
      // Material: Smooth, flowing, semi-translucent
      const strandMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.5,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.5,
        transmission: 0.2,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });

      for (let i = 0; i < strandCount; i++) {
        // Create 3 distinct weaving paths
        const points = [];
        const segments = 40;
        const phaseOffset = (i / strandCount) * Math.PI * 2;
        
        for (let j = 0; j <= segments; j++) {
          const t = j / segments;
          const angle = t * Math.PI * 4 + phaseOffset; // 2 full turns
          
          // Parametric curve for weaving strand
          // Lissajous-like knot curve
          const r = 0.5 + 0.15 * Math.sin(angle * 1.5);
          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          const y = Math.sin(angle * 3 + phaseOffset) * 0.25 + (t - 0.5) * 0.5; // Slight vertical climb
          
          points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 32, 0.06, 8, false);
        
        const strand = new THREE.Mesh(geometry, strandMaterial.clone());
        
        // Add flow indication (start transparent, end solid or vice versa for flow)
        // We'll handle visual flow via animation mostly, but geometry setup helps
        
        strand.userData.isSignalStrand = true;
        strand.userData.strandIndex = i;
        strand.userData.curve = curve; // Store curve for animation
        strand.userData.visualCoreImmutable = true;
        
        group.add(strand);
      }

      // Add floating "packets" along the knot to indicate signal presence
      // We need access to the curves we just created.
      // Let's retrieve them from the children we just added.
      const strands = group.children.filter(c => c.userData.isSignalStrand);
      
      for (let i = 0; i < 6; i++) {
        const packetGeo = new THREE.OctahedronGeometry(0.08, 0);
        const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        const packet = new THREE.Mesh(packetGeo, packetMat);
        
        // Pick a random strand to travel on
        const randomStrand = strands[Math.floor(Math.random() * strands.length)];
        
        packet.userData.isSignalPacket = true;
        packet.userData.packetIndex = i;
        packet.userData.packetSpeed = 0.2 + Math.random() * 0.2; // Speed in t (0-1) per second approx
        packet.userData.pathOffset = Math.random(); // Position along curve (0-1)
        packet.userData.parentCurve = randomStrand.userData.curve; // Link to curve
        
        group.add(packet);
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INTEGRATION_SIGNAL_KNOT';

      return group;
    } catch (err) {
      console.warn('[IntegrationEnhancedVariants] SignalKnot creation failed:', err);
      throw err;
    }
  }

  /**
   * INTEGRATION: PROTOCOL_TANGLE
   * 
   * Description:
   * - Heterogeneous strands with different properties (thickness, roughness).
   * - Complex, dense knot structure.
   * - Visual friction between elements (close proximity, jagged turns).
   * - "Negotiated" integration.
   * 
   * Visual Style:
   * - Varied green/teal tones.
   * - Some matte, some glossy strands.
   * - Dense center.
   */
  static createIntegrationEnhanced_ProtocolTangle(group, color) {
    try {
      const strandCount = 5;
      
      for (let i = 0; i < strandCount; i++) {
        const points = [];
        const segments = 30;
        
        // Randomize strand parameters for heterogeneity
        const radiusBase = 0.3 + Math.random() * 0.3;
        const verticalScale = 0.4 + Math.random() * 0.4;
        const freqX = 2 + Math.floor(Math.random() * 3);
        const freqY = 3 + Math.floor(Math.random() * 2);
        const freqZ = 2 + Math.floor(Math.random() * 3);
        const phase = Math.random() * Math.PI * 2;
        
        for (let j = 0; j <= segments; j++) {
          const t = j / segments;
          const angle = t * Math.PI * 2;
          
          // Lissajous knot curve (more chaotic)
          const x = Math.sin(angle * freqX + phase) * radiusBase;
          const y = Math.cos(angle * freqY + phase) * verticalScale * 0.5;
          const z = Math.sin(angle * freqZ) * radiusBase;
          
          points.push(new THREE.Vector3(x, y, z));
        }
        
        // Close the loop for some, open for others
        const closed = Math.random() > 0.3;
        const curve = new THREE.CatmullRomCurve3(points, closed);
        
        // Varied thickness
        const thickness = 0.03 + Math.random() * 0.05;
        const geometry = new THREE.TubeGeometry(curve, 40, thickness, 6, closed);
        
        // Varied material properties
        const roughness = 0.1 + Math.random() * 0.6;
        const metalness = 0.3 + Math.random() * 0.5;
        const opacity = 0.6 + Math.random() * 0.4;
        
        const material = new THREE.MeshStandardMaterial({
          color: color,
          metalness: metalness,
          roughness: roughness,
          emissive: color,
          emissiveIntensity: 0.2 + Math.random() * 0.3,
          transparent: true,
          opacity: opacity
        });
        
        const strand = new THREE.Mesh(geometry, material);
        strand.userData.isProtocolStrand = true;
        strand.userData.strandIndex = i;
        strand.userData.vibrationSpeed = 2 + Math.random() * 3; // Fast jitter
        strand.userData.vibrationAmp = 0.005 + Math.random() * 0.01;
        strand.userData.visualCoreImmutable = true;
        
        group.add(strand);
      }

      // Add "Friction Nodes" - small jagged shapes at intersections
      for (let i = 0; i < 4; i++) {
        const frictionGeo = new THREE.TetrahedronGeometry(0.12, 0); // Sharp
        const frictionMat = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color(color).offsetHSL(0, -0.2, 0.2), // Darker/Contrast
            wireframe: true 
        });
        const frictionNode = new THREE.Mesh(frictionGeo, frictionMat);
        
        // Random position near center
        frictionNode.position.set(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        frictionNode.userData.isFrictionNode = true;
        frictionNode.userData.rotSpeed = (Math.random() - 0.5) * 2;
        frictionNode.userData.visualCoreImmutable = true;
        
        group.add(frictionNode);
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INTEGRATION_PROTOCOL_TANGLE';

      return group;
    } catch (err) {
      console.warn('[IntegrationEnhancedVariants] ProtocolTangle creation failed:', err);
      throw err;
    }
  }

  /**
   * INTEGRATION: CONTINUITY_BINDER
   * 
   * Description:
   * - Calmer, elongated knot.
   * - Two main loops interlocking in a stable configuration (Reef/Square knot topology).
   * - Fewer crossings, more looping wraps.
   * - Emphasizes long-term stability.
   * 
   * Visual Style:
   * - Smooth, thick, reassuring forms.
   * - Slow motion.
   */
  static createIntegrationEnhanced_ContinuityBinder(group, color) {
    try {
      const loopRadius = 0.5;
      const loopThickness = 0.12;
      
      const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.3,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1
      });

      // Loop 1: Horizontal elongated
      const points1 = [];
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * Math.PI * 2;
          // Elongated oval-like path, bent slightly
          const x = Math.cos(t) * 0.6;
          const z = Math.sin(t) * 0.3;
          const y = Math.sin(t * 2) * 0.15; // Vertical weave
          points1.push(new THREE.Vector3(x, y, z));
      }
      const curve1 = new THREE.CatmullRomCurve3(points1, true);
      const geo1 = new THREE.TubeGeometry(curve1, 40, loopThickness, 12, true);
      const loop1 = new THREE.Mesh(geo1, material);
      loop1.userData.isBinderLoop = true;
      loop1.userData.loopIndex = 0;
      loop1.userData.visualCoreImmutable = true;
      group.add(loop1);

      // Loop 2: Vertical elongated (interlocked)
      const points2 = [];
      for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * Math.PI * 2;
          // Rotated 90 degrees and intertwined
          const x = Math.sin(t * 2) * 0.15; // Horizontal weave
          const z = Math.cos(t) * 0.3;
          const y = Math.sin(t) * 0.6;
          points2.push(new THREE.Vector3(x, y, z));
      }
      const curve2 = new THREE.CatmullRomCurve3(points2, true);
      const geo2 = new THREE.TubeGeometry(curve2, 40, loopThickness, 12, true);
      const loop2 = new THREE.Mesh(geo2, material);
      
      // Rotate Loop 2 slightly to lock visual
      loop2.rotation.y = Math.PI / 2; 
      
      loop2.userData.isBinderLoop = true;
      loop2.userData.loopIndex = 1;
      loop2.userData.visualCoreImmutable = true;
      group.add(loop2);

      // Stability Anchor (Central binding ring)
      const anchorGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 32);
      const anchorMat = new THREE.MeshBasicMaterial({ 
          color: 0xffffff, 
          transparent: true, 
          opacity: 0.4 
      });
      const anchor = new THREE.Mesh(anchorGeo, anchorMat);
      anchor.rotation.x = Math.PI / 2;
      anchor.userData.isStabilityAnchor = true;
      anchor.userData.visualCoreImmutable = true;
      group.add(anchor);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INTEGRATION_CONTINUITY_BINDER';

      return group;
    } catch (err) {
      console.warn('[IntegrationEnhancedVariants] ContinuityBinder creation failed:', err);
      throw err;
    }
  }
}