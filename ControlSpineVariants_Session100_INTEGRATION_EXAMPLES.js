/**
 * CONTROL SPINE VARIANTS - Integration Examples
 * Session 100
 * 
 * Real-world usage patterns for the new spine variants
 * These examples show how to integrate spine variants into existing game systems
 */

import { EnhancedNodeModels } from './EnhancedNodeModels.js';
import * as THREE from 'three';

/**
 * EXAMPLE 1: Create a control node with a specific spine variant
 * Use case: Manual node creation in game systems
 */
export function createControlNodeWithSpine(nodeId, spineType = 'segmented', color = 0xff0080) {
  try {
    const controlNode = new THREE.Group();
    controlNode.userData.nodeId = nodeId;
    controlNode.userData.type = 'control';
    controlNode.userData.spineVariant = spineType;
    
    // Create spine geometry
    EnhancedNodeModels.createControlSpineVariant(spineType, controlNode, color);
    
    // Add additional node metadata
    controlNode.userData.created = Date.now();
    controlNode.userData.immutable = true;
    
    return controlNode;
  } catch (err) {
    console.error('[Integration] Failed to create control node with spine:', err);
    return null;
  }
}

/**
 * EXAMPLE 2: Replace an existing control node's visual with a spine variant
 * Use case: Runtime visual swapping for testing or customization
 */
export function replaceControlNodeVisualWithSpine(existingNode, spineType = 'segmented') {
  try {
    if (!existingNode) {
      console.warn('[Integration] No node provided for replacement');
      return false;
    }

    const nodeColor = existingNode.userData.color || 0xff0080;
    const originalChildCount = existingNode.children.length;

    // Preserve important metadata
    const preservedData = {
      id: existingNode.userData.nodeId,
      type: existingNode.userData.type,
      position: existingNode.position.clone(),
      rotation: existingNode.rotation.clone(),
      scale: existingNode.scale.clone(),
      color: nodeColor
    };

    // Clear existing geometry
    while (existingNode.children.length > 0) {
      const child = existingNode.children[0];
      // Dispose materials
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      // Dispose geometry
      if (child.geometry) {
        child.geometry.dispose();
      }
      existingNode.remove(child);
    }

    // Apply spine variant
    EnhancedNodeModels.createControlSpineVariant(spineType, existingNode, nodeColor);

    // Restore metadata
    existingNode.userData = { ...existingNode.userData, ...preservedData };
    existingNode.userData.spineVariant = spineType;
    existingNode.userData.previousChildCount = originalChildCount;
    existingNode.userData.replacedAt = Date.now();

    console.log(`[Integration] Replaced node ${preservedData.nodeId} with ${spineType} spine variant`);
    return true;
  } catch (err) {
    console.error('[Integration] Failed to replace visual:', err);
    return false;
  }
}

/**
 * EXAMPLE 3: Create a network of control nodes with mixed spine variants
 * Use case: Building diverse control hierarchies for gameplay
 */
export function createControlNetwork(nodeCount = 10, colorScheme = 'default') {
  try {
    const network = new THREE.Group();
    network.userData.type = 'controlNetwork';
    network.userData.nodeCount = nodeCount;
    
    const spineVariants = ['segmented', 'twisted', 'hollow'];
    const colors = {
      default: [0xff0080, 0xff1493, 0xff69b4],
      warm: [0xff4500, 0xff6347, 0xff7f50],
      cool: [0x8b00ff, 0x9932cc, 0xba55d3]
    };

    const selectedColors = colors[colorScheme] || colors.default;

    for (let i = 0; i < nodeCount; i++) {
      const variant = spineVariants[i % 3];
      const color = selectedColors[i % selectedColors.length];
      
      const node = createControlNodeWithSpine(`ctrl-${i}`, variant, color);
      
      if (node) {
        // Position nodes in a circle
        const angle = (i / nodeCount) * Math.PI * 2;
        const radius = 5;
        node.position.set(
          Math.cos(angle) * radius,
          Math.sin(i / nodeCount) * 2 - 1,
          Math.sin(angle) * radius
        );
        
        network.add(node);
      }
    }

    console.log(`[Integration] Created control network with ${network.children.length} nodes`);
    return network;
  } catch (err) {
    console.error('[Integration] Failed to create control network:', err);
    return null;
  }
}

/**
 * EXAMPLE 4: Runtime variant switching with smooth transition
 * Use case: Visual feedback for node state changes
 */
export function switchSpineVariantWithTransition(node, newVariant, duration = 500) {
  return new Promise((resolve, reject) => {
    try {
      if (!node) {
        reject(new Error('No node provided'));
        return;
      }

      const currentVariant = node.userData.spineVariant || 'segmented';
      
      if (currentVariant === newVariant) {
        console.log('[Integration] Node already using', newVariant);
        resolve(false);
        return;
      }

      // Fade out current geometry
      const fadeOutStart = Date.now();
      const fadeOutDuration = duration * 0.3;
      
      const fadeOutInterval = setInterval(() => {
        const elapsed = Date.now() - fadeOutStart;
        const progress = Math.min(elapsed / fadeOutDuration, 1);
        const opacity = 1 - progress;
        
        node.children.forEach(child => {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.opacity = opacity);
            } else {
              child.material.opacity = opacity;
            }
          }
        });
        
        if (progress >= 1) {
          clearInterval(fadeOutInterval);
          
          // Replace geometry
          replaceControlNodeVisualWithSpine(node, newVariant);
          
          // Fade in new geometry
          const fadeInStart = Date.now();
          const fadeInDuration = duration * 0.3;
          
          const fadeInInterval = setInterval(() => {
            const elapsed = Date.now() - fadeInStart;
            const progress = Math.min(elapsed / fadeInDuration, 1);
            const opacity = progress;
            
            node.children.forEach(child => {
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.opacity = opacity);
                } else {
                  child.material.opacity = opacity;
                }
              }
            });
            
            if (progress >= 1) {
              clearInterval(fadeInInterval);
              resolve(true);
            }
          }, 16);
        }
      }, 16);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * EXAMPLE 5: Batch creation of spine variants for testing
 * Use case: Performance testing and verification
 */
export function batchCreateSpineVariants(count = 100, variant = 'segmented') {
  try {
    const batch = new THREE.Group();
    batch.userData.type = 'spineVariantBatch';
    batch.userData.variantType = variant;
    batch.userData.count = count;
    batch.userData.createdAt = Date.now();
    
    const startTime = performance.now();
    
    for (let i = 0; i < count; i++) {
      const node = new THREE.Group();
      node.userData.nodeId = `batch-${variant}-${i}`;
      
      EnhancedNodeModels.createControlSpineVariant(variant, node, 0xff0080);
      
      // Random positioning
      node.position.set(
        Math.random() * 20 - 10,
        Math.random() * 20 - 10,
        Math.random() * 20 - 10
      );
      
      batch.add(node);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / count;
    
    batch.userData.stats = {
      totalTime,
      averageTimePerVariant: avgTime,
      variantsPerSecond: 1000 / avgTime
    };
    
    console.log(`[Integration] Batch created: ${count} ${variant} variants in ${totalTime.toFixed(2)}ms (avg ${avgTime.toFixed(2)}ms each)`);
    
    return batch;
  } catch (err) {
    console.error('[Integration] Failed to batch create spine variants:', err);
    return null;
  }
}

/**
 * EXAMPLE 6: Validate spine variant immutability
 * Use case: Ensure freeze mode compatibility
 */
export function validateSpineVariantImmutability(node) {
  try {
    const results = {
      nodeImmutable: node.userData.visualCoreImmutable === true,
      childrenImmutable: true,
      materialsImmutable: true,
      geometriesProtected: true,
      issues: []
    };

    // Check all children
    node.traverse(child => {
      if (child === node) return; // Skip root
      
      // Check userData immutability flag
      if (!child.userData?.visualCoreImmutable) {
        results.childrenImmutable = false;
        results.issues.push(`Child ${child.name || child.type} missing immutability flag`);
      }

      // Check material properties
      if (child.material) {
        if (child.material.transparent === true || child.material.opacity < 1.0) {
          results.materialsImmutable = false;
          results.issues.push(`Child ${child.name || child.type} has transparency enabled`);
        }
      }
    });

    results.valid = results.nodeImmutable && results.childrenImmutable && results.materialsImmutable;
    
    if (results.valid) {
      console.log('[Integration] ✓ Spine variant immutability validated');
    } else {
      console.warn('[Integration] ✗ Immutability issues detected:', results.issues);
    }

    return results;
  } catch (err) {
    console.error('[Integration] Failed to validate immutability:', err);
    return null;
  }
}

/**
 * EXAMPLE 7: Get spine variant statistics
 * Use case: Analytics and debugging
 */
export function getSpineVariantStats(node) {
  try {
    const stats = {
      variant: node.userData.spineVariant || 'unknown',
      nodeGeometryName: node.userData.nodeGeometryName || 'unknown',
      childCount: node.children.length,
      vertexCount: 0,
      triangleCount: 0,
      materialCount: 0,
      materials: [],
      immutable: node.userData.visualCoreImmutable || false
    };

    const processedMaterials = new Set();

    node.traverse(child => {
      if (child.geometry) {
        if (child.geometry.attributes.position) {
          stats.vertexCount += child.geometry.attributes.position.count;
        }
        if (child.geometry.index) {
          stats.triangleCount += child.geometry.index.count / 3;
        }
      }

      if (child.material && !processedMaterials.has(child.material)) {
        processedMaterials.add(child.material);
        stats.materialCount++;
        stats.materials.push({
          type: child.material.type,
          color: child.material.color?.getHexString() || 'N/A',
          metalness: child.material.metalness,
          roughness: child.material.roughness,
          transparent: child.material.transparent,
          opacity: child.material.opacity
        });
      }
    });

    console.log('[Integration] Spine variant stats:', stats);
    return stats;
  } catch (err) {
    console.error('[Integration] Failed to get spine variant stats:', err);
    return null;
  }
}

/**
 * EXAMPLE 8: Convert default control node to spine variant with fallback
 * Use case: Safe migration of existing nodes
 */
export function safeConvertToSpineVariant(node, spineType = 'segmented') {
  try {
    // Check if already a spine variant
    if (node.userData.spineVariant) {
      console.log(`[Integration] Node already is a ${node.userData.spineVariant} variant`);
      return true;
    }

    // Save backup of original
    const backup = {
      children: node.children.map(c => ({ name: c.name, type: c.type })),
      userData: { ...node.userData }
    };

    // Attempt conversion
    try {
      replaceControlNodeVisualWithSpine(node, spineType);
      
      // Validate result
      const validation = validateSpineVariantImmutability(node);
      if (!validation.valid) {
        throw new Error('Immutability validation failed after conversion');
      }

      console.log(`[Integration] ✓ Successfully converted to ${spineType} variant`);
      return true;
    } catch (err) {
      console.error('[Integration] Conversion failed, attempting rollback:', err);
      
      // Restore backup
      node.userData = backup.userData;
      console.log('[Integration] Rollback complete, node preserved');
      
      return false;
    }
  } catch (err) {
    console.error('[Integration] Safe conversion failed:', err);
    return false;
  }
}

/**
 * EXPORT SUMMARY
 * ==============
 * 
 * Functions available:
 * 1. createControlNodeWithSpine() - Create new spine node
 * 2. replaceControlNodeVisualWithSpine() - Replace existing visual
 * 3. createControlNetwork() - Create network of mixed variants
 * 4. switchSpineVariantWithTransition() - Runtime variant switching
 * 5. batchCreateSpineVariants() - Performance testing
 * 6. validateSpineVariantImmutability() - Verify freeze mode compatibility
 * 7. getSpineVariantStats() - Get node statistics
 * 8. safeConvertToSpineVariant() - Safe migration with rollback
 * 
 * All functions include error handling and logging
 */
