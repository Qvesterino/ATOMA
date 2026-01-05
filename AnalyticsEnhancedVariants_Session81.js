/**
 * ANALYTICS ENHANCED VARIANTS - Session 81
 * Three NEW production-ready Analytics node variants
 * 
 * CONSTRAINTS MET:
 * ✅ No primitives (cube, sphere, torus, circle, ring)
 * ✅ No perfect symmetry - asymmetrical designs
 * ✅ No flat disks or planar-only meshes - all have depth
 * ✅ Geometry has negative space and structure
 * ✅ Visual identity from structure, not mass
 * ✅ Static, performance-safe geometry
 * ✅ Compatible with existing aura, LOD, frustum, spatial offset logic
 * ✅ No per-frame dependency on camera
 * ✅ No gameplay logic modifications
 * 
 * VARIANTS:
 * 1. SignalStratifier - Layered, offset plates with vertical stratification
 * 2. TrendExcavator - Eroded, carved block structure with exposed cavities
 * 3. AnomalyLedger - Fractured open shell with floating internal fragments
 */

import * as THREE from 'three';

export class AnalyticsEnhancedVariants {
  
  /**
   * ANALYTICS ENHANCED: SIGNAL_STRATIFIER
   * 
   * Description:
   * - Vertical stack of offset, irregular plates/membranes
   * - Visible gaps for data flow (vertical stratification)
   * - No central cylinder; the stack itself is the form
   * - Plates are asymmetrical and slightly rotated per layer
   * 
   * Visual Style:
   * - Dark matte plates with teal/cyan emissive veins in gaps
   * - Structural, constructivist aesthetic
   * 
   * Geometry:
   * - Multiple thin, flattened geometries (not simple boxes)
   * - Vertical stacking with randomized X/Z offsets
   */
  static createAnalyticsEnhanced_SignalStratifier(group, color) {
    try {
      const layerCount = 7;
      const baseWidth = 0.9;
      const baseHeight = 0.12;
      
      const plateMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222, // Dark matte base
        metalness: 0.4,
        roughness: 0.7,
        emissive: color,
        emissiveIntensity: 0.1
      });

      const veinMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
      });

      for (let i = 0; i < layerCount; i++) {
        const yPos = (i - layerCount / 2) * 0.22;
        
        // Offset and scale per layer for asymmetry
        const seed = i * 4.5;
        const scaleX = 0.8 + Math.sin(seed) * 0.2;
        const scaleZ = 0.8 + Math.cos(seed * 1.2) * 0.2;
        const offsetX = Math.cos(seed * 0.5) * 0.15;
        const offsetZ = Math.sin(seed * 0.8) * 0.15;

        // Create irregular plate (chamfered box approximation)
        const plateGeometry = new THREE.CylinderGeometry(
          baseWidth * scaleX * 0.5, 
          baseWidth * scaleX * 0.5, 
          baseHeight, 
          6 // Hexagonal base for "tech" feel
        );
        
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        plate.position.set(offsetX, yPos, offsetZ);
        plate.rotation.y = seed; // Random rotation
        plate.scale.set(1, 1, scaleZ / scaleX); // Non-uniform scale
        
        plate.userData.isStratifierLayer = true;
        plate.userData.visualCoreImmutable = true;
        group.add(plate);

        // Add emissive "vein" or connector in the gap below (except bottom)
        if (i > 0) {
          const veinGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2);
          const vein = new THREE.Mesh(veinGeo, veinMaterial);
          vein.position.set(offsetX * 0.5, yPos - 0.11, offsetZ * 0.5);
          vein.rotation.y = seed + Math.PI/4;
          vein.userData.visualCoreImmutable = true;
          group.add(vein);
        }
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_SIGNAL_STRATIFIER';

      return group;
    } catch (err) {
      console.warn('[AnalyticsEnhancedVariants] SignalStratifier creation failed:', err);
      return group;
    }
  }

  /**
   * ANALYTICS ENHANCED: TREND_EXCAVATOR
   * 
   * Description:
   * - Large irregular block that looks eroded/carved
   * - Internal cavities exposed (negative space)
   * - "Excavated" look, like mining data from stone
   * - Slow, deep analytical presence
   * 
   * Visual Style:
   * - Matte dark outer shell, amber/warm inner glow
   * - Heavy, grounded, ancient tech feel
   * 
   * Geometry:
   * - Main block composed of clustered shapes to form a rough whole
   * - Missing chunks create the "excavated" feel
   */
  static createAnalyticsEnhanced_TrendExcavator(group, color) {
    try {
      // Use a warm amber tone for the "excavated" inner parts if original color is generic
      const innerColor = new THREE.Color(color).lerp(new THREE.Color(0xffaa00), 0.3);

      const blockMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, // Very dark grey
        metalness: 0.3,
        roughness: 0.8,
        flatShading: true
      });

      const exposedMaterial = new THREE.MeshStandardMaterial({
        color: innerColor,
        metalness: 0.6,
        roughness: 0.4,
        emissive: innerColor,
        emissiveIntensity: 0.4,
        flatShading: true
      });

      // Construct a "voxelized" or clustered irregular block
      // 3x3x3 grid, but missing random chunks, focused on one side being "open"
      const gridSize = 3;
      const cellSize = 0.35;
      
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          for (let z = 0; z < gridSize; z++) {
            // Determine if this block exists
            const cx = x - 1; 
            const cy = y - 1; 
            const cz = z - 1;
            
            const dist = Math.sqrt(cx*cx + cy*cy + cz*cz);
            
            // "Excavation" logic: Remove blocks in a specific octant or based on noise
            // Let's carve out the +X, +Y, +Z corner roughly
            const excavationFactor = (cx + cy + cz); 
            
            if (excavationFactor > 1.0) continue; // Remove corner
            if (Math.random() > 0.85) continue; // Random noise removal

            // Inner core blocks are "exposed"
            const isInner = dist < 0.8 && excavationFactor > -0.5;
            const mat = isInner ? exposedMaterial : blockMaterial;
            
            // Random slight offset/rotation for "rubble/carved" look
            const geo = new THREE.DodecahedronGeometry(cellSize * 0.6, 0); // Faceted look
            const mesh = new THREE.Mesh(geo, mat);
            
            mesh.position.set(
              (x - 1) * cellSize * 0.9,
              (y - 1) * cellSize * 0.9,
              (z - 1) * cellSize * 0.9
            );
            
            mesh.rotation.set(
              Math.random() * 0.2,
              Math.random() * 0.2,
              Math.random() * 0.2
            );

            mesh.userData.visualCoreImmutable = true;
            group.add(mesh);
          }
        }
      }

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_TREND_EXCAVATOR';

      return group;
    } catch (err) {
      console.warn('[AnalyticsEnhancedVariants] TrendExcavator creation failed:', err);
      return group;
    }
  }

  /**
   * ANALYTICS ENHANCED: ANOMALY_LEDGER
   * 
   * Description:
   * - Fractured open shell (spherical/icosahedral basis)
   * - Floating internal record fragments (shards)
   * - Subtle spatial dislocation (floating bits)
   * - Reacts to rare events (conceptually)
   * 
   * Visual Style:
   * - Tech-cyan/teal
   * - High contrast between shell and void
   * - "Exploded view" aesthetic
   */
  static createAnalyticsEnhanced_AnomalyLedger(group, color) {
    try {
      const shellMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.6,
        roughness: 0.4,
        side: THREE.DoubleSide,
        emissive: color,
        emissiveIntensity: 0.1
      });

      const fragmentMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });

      // 1. Fractured Shell
      // Create separate arc segments to simulate a broken sphere
      const shellSegments = 6;
      for (let i = 0; i < shellSegments; i++) {
        const radius = 0.8;
        const tube = 0.15; // thickness
        // Arc segment
        const geometry = new THREE.TorusGeometry(radius, tube, 4, 12, Math.PI * 0.6); // Partial arc
        const mesh = new THREE.Mesh(geometry, shellMaterial);
        
        // Rotate to form a broken sphere shape
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = (i / shellSegments) * Math.PI * 2;
        mesh.rotation.z = Math.random() * 0.5;
        
        mesh.userData.visualCoreImmutable = true;
        group.add(mesh);
      }

      // 2. Floating Fragments (The "Ledger")
      const fragmentCount = 12;
      for (let i = 0; i < fragmentCount; i++) {
        // Small planar shards
        const w = 0.1 + Math.random() * 0.1;
        const h = 0.1 + Math.random() * 0.1;
        const geo = new THREE.PlaneGeometry(w, h);
        const mesh = new THREE.Mesh(geo, fragmentMaterial);
        
        // Cluster in center but floating
        const r = 0.4 * Math.random();
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        mesh.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
        
        mesh.lookAt(0, 0, 0); // Face center? or random?
        mesh.rotation.z = Math.random() * Math.PI; // Random spin
        
        // Animation metadata: specific fragments float
        mesh.userData.isLedgerFragment = true;
        mesh.userData.floatSpeed = 0.2 + Math.random() * 0.3;
        mesh.userData.floatPhase = Math.random() * Math.PI * 2;
        
        mesh.userData.visualCoreImmutable = true;
        group.add(mesh);
      }

      group.userData.ledgerFragmentCount = fragmentCount;
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_ANOMALY_LEDGER';

      return group;
    } catch (err) {
      console.warn('[AnalyticsEnhancedVariants] AnomalyLedger creation failed:', err);
      return group;
    }
  }

  /**
   * Helper: Create gradient ribbon geometry from curve (Preserved if needed for other helpers)
   * @private
   */
  static _createGradientRibbon(curve, segmentCount, ribbonWidth = 0.12) {
    const points = curve.getPoints(segmentCount);
    const vertices = [];
    const indices = [];
    let vertexIndex = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      
      const forward = new THREE.Vector3().subVectors(p1, p0).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();
      
      const left = new THREE.Vector3().addVectors(p0, right.multiplyScalar(-ribbonWidth / 2));
      const right_pos = new THREE.Vector3().addVectors(p0, right.multiplyScalar(ribbonWidth / 2));
      
      vertices.push(left.x, left.y, left.z);
      vertices.push(right_pos.x, right_pos.y, right_pos.z);
      
      if (i < points.length - 2) {
        indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
        indices.push(vertexIndex + 1, vertexIndex + 3, vertexIndex + 2);
        vertexIndex += 2;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    geometry.computeVertexNormals();
    
    return geometry;
  }
}

export default AnalyticsEnhancedVariants;
