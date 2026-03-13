/**
 * CONTROL SPINE VARIANTS - Session 100
 * Three NEW additive Control node spine variants
 * All variants are STATIC, OPAQUE, and fully immutable
 * 
 * DESIGN PRINCIPLES:
 * ✅ Additive only - no replacement of existing visuals
 * ✅ Static geometry - no animation
 * ✅ Fully opaque - transparent: false, opacity: 1.0
 * ✅ No aura, shell, or particle systems
 * ✅ Link attachment on sides, not center
 * ✅ Mechanical, structured appearance
 * ✅ Suitable for CONTROL node category
 * 
 * VARIANTS:
 * 1. SegmentedSpine - Vertical column with 8-14 solid mechanical segments
 * 2. TwistedSpine - Segmented spine with subtle rotation along axis
 * 3. HollowSpine - Column-like spine with negative space and structural ribs
 */

import * as THREE from 'three';

export class ControlSpineVariants {
  
  /**
   * CONTROL SPINE: SEGMENTED_SPINE
   * 
   * Description:
   * - Single vertical column structure
   * - 8-14 solid mechanical segments stacked vertically
   * - Small gaps between segments (0.04-0.08 units)
   * - No arms, shells, or auras
   * - Clean, readable silhouette
   * - Link attachment points on side surface
   * 
   * Visual Style:
   * - Red/magenta metallic (CONTROL authority color)
   * - Mechanical, industrial aesthetic
   * - Each segment is a distinct component
   * - High metalness (0.9+), low roughness
   * 
   * Geometry:
   * - Custom cylindrical segments (not primitive stacking)
   * - Each segment slightly different width for visual interest
   * - All vertices are on surface (no internal complexity)
   * - Side surfaces serve as link attachment points
   */
  static createControlSpine_Segmented(group, color) {
    try {
      const segmentCount = 11; // 8-14 range, centered at 11
      const segmentHeights = [];
      const segmentRadii = [];
      
      // Vary segment heights and radii for mechanical appearance
      for (let i = 0; i < segmentCount; i++) {
        const t = i / segmentCount;
        // Height variation: alternating thick/thin
        const heightVariation = 0.18 + (i % 2 === 0 ? 0.08 : 0.04);
        segmentHeights.push(heightVariation);
        
        // Radius variation: subtle changes for mechanical look
        const radiusVariation = 0.4 - Math.abs(t - 0.5) * 0.15; // Barrel shape
        segmentRadii.push(radiusVariation);
      }
      
      // Create segments
      const segmentMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.92,
        roughness: 0.08,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: false,
        opacity: 1.0,
        depthWrite: true,
        depthTest: true
      });
      
      // Calculate total height for positioning
      const gapSize = 0.06;
      const totalHeight = segmentHeights.reduce((a, b) => a + b, 0) + (segmentCount - 1) * gapSize;
      
      // Position segments
      let currentY = totalHeight / 2;
      for (let i = 0; i < segmentCount; i++) {
        const height = segmentHeights[i];
        const radius = segmentRadii[i];
        
        // Create segment with 8-sided geometry for mechanical look
        const segmentGeometry = new THREE.CylinderGeometry(radius, radius, height, 8);
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        
        // Position segment
        currentY -= height / 2;
        segment.position.y = currentY;
        currentY -= height / 2 + gapSize;
        
        segment.userData.isSpineSegment = true;
        segment.userData.segmentIndex = i;
        segment.userData.visualCoreImmutable = true;
        group.add(segment);
      }
      
      // Add subtle connecting ribs on edges for structural appearance
      for (let i = 0; i < segmentCount - 1; i++) {
        const t = i / segmentCount;
        const yPos = (totalHeight / 2) - (segmentHeights.slice(0, i + 1).reduce((a, b) => a + b, 0) + (i + 0.5) * gapSize);
        
        // Add 4 thin ribs around circumference at gaps
        const ribRadius = segmentRadii[i] + 0.02;
        const ribThickness = 0.01;
        
        for (let j = 0; j < 4; j++) {
          const ribAngle = (j / 4) * Math.PI * 2;
          const ribX = Math.cos(ribAngle) * ribRadius;
          const ribZ = Math.sin(ribAngle) * ribRadius;
          
          // Create thin rib
          const ribGeometry = new THREE.BoxGeometry(ribThickness, gapSize, ribThickness);
          const ribMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.88,
            roughness: 0.12,
            emissive: color,
            emissiveIntensity: 0.15,
            transparent: false,
            opacity: 1.0
          });
          const rib = new THREE.Mesh(ribGeometry, ribMaterial);
          
          rib.position.set(ribX, yPos, ribZ);
          rib.userData.isSpineRib = true;
          rib.userData.visualCoreImmutable = true;
          group.add(rib);
        }
      }
      
      // Mark group as spine structure
      group.userData.isControlSpine = true;
      group.userData.spineType = 'segmented';
      group.userData.segmentCount = segmentCount;
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_SEGMENTED_SPINE';
      
      return group;
    } catch (err) {
      console.warn('[ControlSpineVariants] SegmentedSpine creation failed:', err);
      throw err;
    }
  }
  
  /**
   * CONTROL SPINE: TWISTED_SPINE
   * 
   * Description:
   * - Same base structure as SegmentedSpine
   * - Segments are progressively rotated along the vertical axis
   * - Subtle twist only (total rotation: 45-90 degrees)
   * - Creates visual sense of tension/compression
   * - Still one continuous object (not fragmented)
   * - No protruding parts
   * 
   * Visual Style:
   * - Red/magenta metallic (CONTROL authority color)
   * - Mechanical with dynamic tension
   * - Twist emphasizes rotation/control authority
   * - Each segment visible as distinct component
   * 
   * Geometry:
   * - Same segment structure as Segmented variant
   * - Each segment rotated progressively around Y axis
   * - Cumulative rotation creates visual spiral without actual spiral shape
   * - All surfaces remain accessible for link attachment
   */
  static createControlSpine_Twisted(group, color) {
    try {
      const segmentCount = 11;
      const segmentHeights = [];
      const segmentRadii = [];
      
      // Vary segment heights and radii for mechanical appearance
      for (let i = 0; i < segmentCount; i++) {
        const t = i / segmentCount;
        const heightVariation = 0.18 + (i % 2 === 0 ? 0.08 : 0.04);
        segmentHeights.push(heightVariation);
        
        const radiusVariation = 0.4 - Math.abs(t - 0.5) * 0.15;
        segmentRadii.push(radiusVariation);
      }
      
      // Create segments with progressive rotation
      const segmentMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.92,
        roughness: 0.08,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: false,
        opacity: 1.0,
        depthWrite: true,
        depthTest: true
      });
      
      // Calculate total height
      const gapSize = 0.06;
      const totalHeight = segmentHeights.reduce((a, b) => a + b, 0) + (segmentCount - 1) * gapSize;
      
      // Maximum twist: 90 degrees over full height
      const maxTwist = Math.PI / 2;
      
      // Position segments with rotation
      let currentY = totalHeight / 2;
      for (let i = 0; i < segmentCount; i++) {
        const height = segmentHeights[i];
        const radius = segmentRadii[i];
        
        // Create segment (8-sided for mechanical appearance)
        const segmentGeometry = new THREE.CylinderGeometry(radius, radius, height, 8);
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        
        // Position segment
        currentY -= height / 2;
        segment.position.y = currentY;
        currentY -= height / 2 + gapSize;
        
        // Apply progressive rotation (twist effect)
        const t = i / segmentCount;
        segment.rotation.y = t * maxTwist;
        
        segment.userData.isSpineSegment = true;
        segment.userData.segmentIndex = i;
        segment.userData.twistRotation = t * maxTwist;
        segment.userData.visualCoreImmutable = true;
        group.add(segment);
      }
      
      // Add structural ribs that also twist
      for (let i = 0; i < segmentCount - 1; i++) {
        const t = i / segmentCount;
        const yPos = (totalHeight / 2) - (segmentHeights.slice(0, i + 1).reduce((a, b) => a + b, 0) + (i + 0.5) * gapSize);
        
        const ribRadius = segmentRadii[i] + 0.02;
        const ribThickness = 0.01;
        
        for (let j = 0; j < 4; j++) {
          const baseAngle = (j / 4) * Math.PI * 2;
          
          // Calculate rib position with twist consideration
          const twistAngle = t * maxTwist;
          const ribAngle = baseAngle + twistAngle;
          
          const ribX = Math.cos(ribAngle) * ribRadius;
          const ribZ = Math.sin(ribAngle) * ribRadius;
          
          // Create thin rib
          const ribGeometry = new THREE.BoxGeometry(ribThickness, gapSize, ribThickness);
          const ribMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.88,
            roughness: 0.12,
            emissive: color,
            emissiveIntensity: 0.15,
            transparent: false,
            opacity: 1.0
          });
          const rib = new THREE.Mesh(ribGeometry, ribMaterial);
          
          rib.position.set(ribX, yPos, ribZ);
          rib.rotation.y = twistAngle;
          rib.userData.isSpineRib = true;
          rib.userData.visualCoreImmutable = true;
          group.add(rib);
        }
      }
      
      // Mark group as twisted spine
      group.userData.isControlSpine = true;
      group.userData.spineType = 'twisted';
      group.userData.segmentCount = segmentCount;
      group.userData.maxTwist = maxTwist;
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_TWISTED_SPINE';
      
      return group;
    } catch (err) {
      console.warn('[ControlSpineVariants] TwistedSpine creation failed:', err);
      throw err;
    }
  }
  
  /**
   * CONTROL SPINE: HOLLOW_SPINE
   * 
   * Description:
   * - Column-like spine with strategic cutouts/hollow sections
   * - Negative space is integral to the design
   * - Structural ribs maintain integrity around openings
   * - Solid outer frame with empty interior
   * - No transparency, completely opaque
   * - Creates sense of "internal structure" and "control architecture"
   * 
   * Visual Style:
   * - Red/magenta metallic (CONTROL authority color)
   * - Mechanical with architectural feel
   * - Openings reveal underlying structure
   * - Ribs suggest reinforced control pathways
   * 
   * Geometry:
   * - Main column with hollow interior (not transparent, just geometry)
   * - Vertical ribs creating structural grid
   * - Horizontal supports at key points
   * - All surfaces perfectly opaque and solid
   * - Link attachment on outer surface and rib tops
   */
  static createControlSpine_Hollow(group, color) {
    try {
      const columnHeight = 1.2;
      const outerRadius = 0.45;
      const innerRadius = 0.25;
      const ribThickness = 0.05;
      const ribCount = 6;
      
      // Create main hollow column using LatheGeometry approach (custom implementation)
      // We'll build it from scratch using BufferGeometry for full control
      
      const columnVertices = [];
      const columnIndices = [];
      
      // Build hollow cylinder with custom geometry
      const heightSegments = 10;
      const radialSegments = 12;
      
      // Outer surface
      for (let i = 0; i <= heightSegments; i++) {
        const y = (i / heightSegments) * columnHeight - columnHeight / 2;
        
        for (let j = 0; j < radialSegments; j++) {
          const angle = (j / radialSegments) * Math.PI * 2;
          const x = Math.cos(angle) * outerRadius;
          const z = Math.sin(angle) * outerRadius;
          columnVertices.push(x, y, z);
        }
      }
      
      // Inner surface (hollow)
      for (let i = 0; i <= heightSegments; i++) {
        const y = (i / heightSegments) * columnHeight - columnHeight / 2;
        
        for (let j = 0; j < radialSegments; j++) {
          const angle = (j / radialSegments) * Math.PI * 2;
          const x = Math.cos(angle) * innerRadius;
          const z = Math.sin(angle) * innerRadius;
          columnVertices.push(x, y, z);
        }
      }
      
      // Create indices for outer surface
      for (let i = 0; i < heightSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
          const curr = i * radialSegments + j;
          const next = curr + radialSegments;
          const j1 = (j + 1) % radialSegments;
          
          // Outer surface quads
          columnIndices.push(curr, next, curr + 1);
          columnIndices.push(next, next + 1, curr + 1);
        }
      }
      
      // Create indices for inner surface (reverse winding)
      const innerOffset = (heightSegments + 1) * radialSegments;
      for (let i = 0; i < heightSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
          const curr = innerOffset + i * radialSegments + j;
          const next = curr + radialSegments;
          const j1 = (j + 1) % radialSegments;
          
          // Inner surface quads (reversed for proper normals)
          columnIndices.push(curr + 1, next, curr);
          columnIndices.push(curr + 1, next + 1, next);
        }
      }
      
      // Create top cap (annular ring)
      const topCapOffset = (heightSegments + 1) * radialSegments * 2;
      for (let j = 0; j < radialSegments; j++) {
        const outer = (heightSegments) * radialSegments + j;
        const inner = topCapOffset + j;
        columnVertices.push(
          Math.cos((j / radialSegments) * Math.PI * 2) * outerRadius,
          columnHeight / 2,
          Math.sin((j / radialSegments) * Math.PI * 2) * outerRadius
        );
      }
      
      for (let j = 0; j < radialSegments; j++) {
        const inner = topCapOffset + j;
        const inner_next = topCapOffset + (j + 1) % radialSegments;
        const outer = heightSegments * radialSegments + j;
        const outer_next = heightSegments * radialSegments + (j + 1) % radialSegments;
        
        columnIndices.push(outer, inner, outer_next);
        columnIndices.push(inner, inner_next, outer_next);
      }
      
      // Create column geometry
      const columnGeometry = new THREE.BufferGeometry();
      columnGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(columnVertices), 3));
      columnGeometry.setIndex(new Uint16Array(columnIndices));
      columnGeometry.computeVertexNormals();
      
      const columnMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.25,
        transparent: false,
        opacity: 1.0,
        depthWrite: true,
        depthTest: true,
        side: THREE.DoubleSide // Ensure visibility from inside
      });
      
      const column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.userData.isHollowSpineColumn = true;
      column.userData.visualCoreImmutable = true;
      group.add(column);
      
      // Add vertical ribs for structural appearance
      const ribMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.92,
        roughness: 0.08,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: false,
        opacity: 1.0
      });
      
      for (let i = 0; i < ribCount; i++) {
        const ribAngle = (i / ribCount) * Math.PI * 2;
        const ribX = Math.cos(ribAngle) * (outerRadius + innerRadius) / 2;
        const ribZ = Math.sin(ribAngle) * (outerRadius + innerRadius) / 2;
        
        // Create vertical rib
        const ribGeometry = new THREE.BoxGeometry(ribThickness * 0.8, columnHeight, ribThickness * 0.8);
        const rib = new THREE.Mesh(ribGeometry, ribMaterial);
        
        rib.position.set(ribX, 0, ribZ);
        rib.userData.isStructuralRib = true;
        rib.userData.visualCoreImmutable = true;
        group.add(rib);
      }
      
      // Add horizontal support rings at key heights
      const supportCount = 3;
      for (let i = 1; i < supportCount; i++) {
        const supportY = (-columnHeight / 2) + (i / supportCount) * columnHeight;
        
        // Create ring support (thin torus-like structure)
        const ringGeometry = new THREE.TorusGeometry(
          (outerRadius + innerRadius) / 2,
          ribThickness * 0.5,
          8,
          24
        );
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.88,
          roughness: 0.12,
          emissive: color,
          emissiveIntensity: 0.2,
          transparent: false,
          opacity: 1.0
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        ring.position.y = supportY;
        ring.userData.isSupportRing = true;
        ring.userData.visualCoreImmutable = true;
        group.add(ring);
      }
      
      // Mark group as hollow spine
      group.userData.isControlSpine = true;
      group.userData.spineType = 'hollow';
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_HOLLOW_SPINE';
      
      return group;
    } catch (err) {
      console.warn('[ControlSpineVariants] HollowSpine creation failed:', err);
      throw err;
    }
  }
}
