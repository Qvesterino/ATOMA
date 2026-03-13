/**
 * STORAGE ENHANCED VARIANTS - Session 81 (Updated for KINETIC/AI-GROWN)
 * Three NEW production-ready Storage node variants
 * 
 * UPGRADE GOAL: Kinetic, "AI-Grown" behaviors (Tier 2)
 * - ArchiveNexus -> "DataWeaver" (Oscillating strands)
 * - MemoryCrypts -> "VaultStack" (Sliding/Rotating chambers)
 * - DepthLayers -> "ContainmentField" (Breathing/Rotating shells)
 */

import * as THREE from 'three';

export class StorageEnhancedVariants {
  
  /**
   * STORAGE ENHANCED: ARCHIVE_NEXUS (DataWeaver)
   * 
   * Description:
   * - Multiple vertical strands that oscillate and weave
   * - Bridges that stretch/contract or float between them
   * - Visual metaphor: A loom weaving data into memory
   */
  static createStorageEnhanced_ArchiveNexus(group, color) {
    try {
      const strandCount = 4;
      const strandMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.9
      });

      // Create vertical strands with asymmetric positioning
      const strandPositions = [];
      for (let i = 0; i < strandCount; i++) {
        const angle = (i / strandCount) * Math.PI * 2;
        const radius = 0.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        strandPositions.push({ x, z, angle, index: i });
        
        // Create strand geometry (segmented for flexibility look, though rigid mesh)
        // We use a tall box but will oscillate its rotation/position
        const strandGeo = new THREE.BoxGeometry(0.1, 1.3, 0.1);
        const strand = new THREE.Mesh(strandGeo, strandMaterial);
        
        strand.position.set(x, 0, z);
        strand.rotation.y = -angle; // Face center
        
        strand.userData.isArchiveStrand = true;
        strand.userData.strandIndex = i;
        strand.userData.basePos = new THREE.Vector3(x, 0, z);
        strand.userData.baseRot = new THREE.Euler(0, -angle, 0);
        strand.userData.visualCoreImmutable = true;
        group.add(strand);
      }

      // Create floating "shuttles" (bridges) that will move between strands
      for (let i = 0; i < strandCount; i++) {
        const nextI = (i + 1) % strandCount;
        const pos1 = strandPositions[i];
        const pos2 = strandPositions[nextI];
        
        // Shuttle geometry
        const shuttleGeo = new THREE.CapsuleGeometry(0.04, 0.4, 4, 8);
        const shuttle = new THREE.Mesh(shuttleGeo, strandMaterial);
        
        // Position between strands
        const midX = (pos1.x + pos2.x) / 2;
        const midZ = (pos1.z + pos2.z) / 2;
        const angle = Math.atan2(pos2.z - pos1.z, pos2.x - pos1.x);
        
        shuttle.position.set(midX, (i - 1.5) * 0.3, midZ);
        shuttle.rotation.y = angle + Math.PI / 2;
        shuttle.rotation.z = Math.PI / 2; // Lay flat
        
        shuttle.userData.isArchiveShuttle = true;
        shuttle.userData.shuttleIndex = i;
        shuttle.userData.baseY = shuttle.position.y;
        shuttle.userData.visualCoreImmutable = true;
        group.add(shuttle);
      }

      // Central core (the loom heart)
      const coreGeo = new THREE.OctahedronGeometry(0.2, 0);
      const core = new THREE.Mesh(coreGeo, strandMaterial);
      core.userData.isArchiveCore = true;
      group.add(core);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_ARCHIVE_NEXUS';

      return group;
    } catch (err) {
      console.warn('[StorageEnhancedVariants] ArchiveNexus creation failed:', err);
      return group;
    }
  }

  /**
   * STORAGE ENHANCED: MEMORY_CRYPTS (VaultStack)
   * 
   * Description:
   * - Stacked asymmetric chambers that rotate and slide vertically
   * - Like a locking mechanism constantly re-configuring
   */
  static createStorageEnhanced_MemoryCrypts(group, color) {
    try {
      const chamberCount = 5;
      const accentColor = new THREE.Color(color).multiplyScalar(1.3);
      
      const chamberMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.8
      });

      const accentMaterial = new THREE.MeshStandardMaterial({
        color: accentColor.getHex(),
        metalness: 0.95,
        roughness: 0.1,
        emissive: accentColor.getHex(),
        emissiveIntensity: 0.4
      });

      // Create stacked chambers
      for (let i = 0; i < chamberCount; i++) {
        // Create asymmetric chamber (hexagonal prism with offset)
        const radius = 0.4 - (i % 2) * 0.05; // Alternating widths
        const chamberGeo = new THREE.CylinderGeometry(radius, radius, 0.18, 6);
        
        const chamber = new THREE.Mesh(chamberGeo, chamberMaterial);
        
        // Initial position
        const yPos = (i - chamberCount / 2) * 0.25;
        chamber.position.set(0, yPos, 0);
        
        // Alternating rotation
        chamber.rotation.y = i * (Math.PI / 6);

        chamber.userData.isCryptChamber = true;
        chamber.userData.chamberIndex = i;
        chamber.userData.baseY = yPos;
        chamber.userData.visualCoreImmutable = true;
        group.add(chamber);

        // Add "Locking Pins" to each chamber
        for (let j = 0; j < 3; j++) {
            const pinGeo = new THREE.BoxGeometry(0.1, 0.05, 0.1);
            const pin = new THREE.Mesh(pinGeo, accentMaterial);
            const angle = (j / 3) * Math.PI * 2;
            
            pin.position.set(Math.cos(angle) * (radius + 0.05), 0, Math.sin(angle) * (radius + 0.05));
            pin.rotation.y = -angle;
            
            // Attach pins to chamber
            chamber.add(pin);
        }
      }

      // Central Axis
      const axisGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8);
      const axis = new THREE.Mesh(axisGeo, chamberMaterial);
      group.add(axis);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_MEMORY_CRYPTS';

      return group;
    } catch (err) {
      console.warn('[StorageEnhancedVariants] MemoryCrypts creation failed:', err);
      return group;
    }
  }

  /**
   * STORAGE ENHANCED: DEPTH_LAYERS (ContainmentField)
   * 
   * Description:
   * - Concentric shells rotating on different axes
   * - "Breathing" expansion/contraction
   * - Erosion details orbiting the surface
   */
  static createStorageEnhanced_DepthLayers(group, color) {
    try {
      const layerCount = 3; // Reduced count for better visibility of rotation
      
      for (let layer = 0; layer < layerCount; layer++) {
        const seed = layer * 4.32;
        
        // Distinct material for each layer
        const layerOpacity = 0.5 + (layer * 0.15);
        const layerMaterial = new THREE.MeshPhysicalMaterial({
          color: color,
          metalness: 0.8,
          roughness: 0.2,
          emissive: color,
          emissiveIntensity: 0.2,
          transparent: true,
          opacity: layerOpacity,
          transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
          thickness: 0.1
        });

        // Create shell (Icosahedron based)
        const radius = 0.8 - (layer * 0.25);
        const shellGeo = new THREE.IcosahedronGeometry(radius, 1);
        
        // Distort geometry slightly
        const posAttribute = shellGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i);
            const y = posAttribute.getY(i);
            const z = posAttribute.getZ(i);
            // Noise-like distortion
            const scale = 1.0 + Math.sin(x * 5 + seed) * 0.05;
            posAttribute.setXYZ(i, x * scale, y * scale, z * scale);
        }
        shellGeo.computeVertexNormals();

        const shell = new THREE.Mesh(shellGeo, layerMaterial);
        
        shell.userData.isDepthShell = true;
        shell.userData.layerIndex = layer;
        // Random rotation axis for each shell
        shell.userData.rotationAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        shell.userData.rotationSpeed = 0.1 + (layer * 0.15); // Outer slower, inner faster
        shell.userData.visualCoreImmutable = true;
        
        group.add(shell);

        // Add "Data Particulates" orbiting this shell
        const partCount = 4;
        for (let p=0; p<partCount; p++) {
            const partGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
            const part = new THREE.Mesh(partGeo, layerMaterial);
            
            const angle = (p / partCount) * Math.PI * 2;
            const r = radius + 0.1;
            
            part.position.set(Math.cos(angle)*r, Math.sin(angle)*r * 0.5, Math.sin(angle)*r);
            
            // Attach to shell so they rotate with it (or could be separate for complex orbit)
            shell.add(part);
        }
      }

      // Core Singularity
      const coreGeo = new THREE.SphereGeometry(0.15, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.userData.isDepthCore = true;
      group.add(core);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_DEPTH_LAYERS';

      return group;
    } catch (err) {
      console.warn('[StorageEnhancedVariants] DepthLayers creation failed:', err);
      return group;
    }
  }
}

export default StorageEnhancedVariants;
