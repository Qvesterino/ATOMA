/**
 * NODE DEPTH & HOLOGRAPHIC PRESERVATION FIX
 * 
 * PROBLEM: Linked nodes lose holographic layers (rings, fresnel, accents)
 * when nodes are behind links
 * 
 * ROOT CAUSE: Link visuals write to depth buffer, blocking holographic
 * layers from rendering
 * 
 * SOLUTION: Enforce transparent rendering pipeline with proper depth &
 * render order authority
 * 
 * HARD RULES:
 * 1. All link/aura materials: transparent=true, depthWrite=false
 * 2. Render order: Links < Auras < Core < Holographic (40 > 30 > 20 > 10)
 * 3. Node internal layers ALWAYS render last
 * 4. Transparency must not destroy downstream visual layers
 */

export class NodeDepthAndHoloPreservationFix {
  /**
   * Initialize depth authority for entire scene
   * Call once after scene setup
   */
  static initializeDepthAuthority(scene) {
    console.group('%c[NODE DEPTH PRESERVATION]', 'color: #00ff88; font-weight: bold');
    
    let linkCount = 0;
    let auraCount = 0;
    let holoCount = 0;
    
    scene.traverse((obj) => {
      // ================================================================
      // LINK VISUALS: Render order 10, depth write disabled
      // ================================================================
      if (obj.userData?.isLinkVisual || 
          obj.userData?.vfxType?.includes('extreme') ||
          obj.userData?.type === 'neonCurve') {
        
        obj.traverse((child) => {
          if (!child.isMesh || !child.material) return;
          
          // Enforce depth authority on link materials
          if (child.material.transparent !== undefined) {
            child.material.transparent = true;
            child.material.depthWrite = false;
            child.material.depthTest = true;
            linkCount++;
          }
          
          // Set render priority
          child.renderOrder = 10;
        });
      }
      
      // ================================================================
      // AURA SHELLS: Render order 20, depth write disabled
      // ================================================================
      if (obj.userData?.isAura || 
          obj.userData?.isShell ||
          obj.userData?.visualLayer === 'AURA') {
        
        obj.traverse((child) => {
          if (!child.isMesh || !child.material) return;
          
          if (child.material.transparent !== undefined) {
            child.material.transparent = true;
            child.material.depthWrite = false;
            child.material.depthTest = true;
            // Cap aura opacity to prevent overdraw
            child.material.opacity = Math.min(child.material.opacity || 1.0, 0.45);
            auraCount++;
          }
          
          child.renderOrder = 20;
        });
      }
      
      // ================================================================
      // HOLOGRAPHIC LAYERS: Render order 40 (last), preserve entirely
      // ================================================================
      if (obj.userData?.isHolographicLayer ||
          obj.userData?.isFresnel ||
          obj.userData?.isHologramShell ||
          obj.userData?.visualLayer === 'HOLOGRAM') {
        
        obj.traverse((child) => {
          if (!child.isMesh) return;
          
          // Holographic layers ALWAYS render last
          child.renderOrder = 40;
          
          // Ensure visibility
          child.visible = true;
          holoCount++;
        });
      }
      
      // ================================================================
      // NODE CORE: Render order 30 (middle layer)
      // ================================================================
      if (obj.userData?.isNodeCore || 
          obj.userData?.isCoreMesh) {
        
        if (obj.isMesh) {
          obj.renderOrder = 30;
        }
      }
    });
    
    console.log(`✓ Link visuals: ${linkCount} meshes (renderOrder=10)`);
    console.log(`✓ Aura shells: ${auraCount} meshes (renderOrder=20)`);
    console.log(`✓ Holographic layers: ${holoCount} meshes (renderOrder=40)`);
    console.log('✓ Depth authority: LOCKED');
    console.groupEnd();
  }

  /**
   * Enforce depth authority on newly created link
   * Called when link is created
   */
  static enforceLinkDepthAuthority(linkGroup) {
    if (!linkGroup || !linkGroup.isMesh === false) return;
    
    linkGroup.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      
      // MANDATORY: Transparent rendering for all link meshes
      child.material.transparent = true;
      child.material.depthWrite = false;
      child.material.depthTest = true;
      
      // HARD RULE: Opacity must never exceed 0.45 for links
      if (child.material.opacity !== undefined) {
        child.material.opacity = Math.min(child.material.opacity || 0.8, 0.45);
      }
      
      // Set render order (links render first)
      child.renderOrder = 10;
    });
  }

  /**
   * Enforce depth authority on aura shell
   * Called when aura is created
   */
  static enforceAuraDepthAuthority(auraMesh) {
    if (!auraMesh || !auraMesh.isMesh === false) return;
    
    auraMesh.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      
      // MANDATORY: Transparent auras
      child.material.transparent = true;
      child.material.depthWrite = false;
      child.material.depthTest = true;
      
      // HARD RULE: Aura opacity capped at 0.45
      if (child.material.opacity !== undefined) {
        child.material.opacity = Math.min(child.material.opacity || 0.8, 0.45);
      }
      
      // Auras render at priority 20
      child.renderOrder = 20;
    });
  }

  /**
   * Enforce holographic layer preservation
   * Called when node is created
   */
  static enforceHolographicPreservation(node) {
    if (!node || !node.traverse) return;
    
    node.traverse((child) => {
      if (!child.isMesh) return;
      
      const userData = child.userData || {};
      
      // ================================================================
      // HOLOGRAPHIC LAYERS: Always render last, always visible
      // ================================================================
      if (userData.isHolographicLayer || 
          userData.isFresnel ||
          userData.isHologramShell ||
          userData.visualLayer === 'HOLOGRAM') {
        
        // Holographic layers MUST render last (renderOrder = 40)
        child.renderOrder = 40;
        child.visible = true;
        
        // Preserve material properties
        if (child.material) {
          child.material.depthTest = true;  // Still test depth (read-only)
          // DO NOT SET depthWrite = false on holo materials
          // They should write to depth so they render properly
        }
      }
      
      // ================================================================
      // CORE MESH: Middle priority (renderOrder = 30)
      // ================================================================
      else if (userData.isNodeCore || userData.isCoreMesh) {
        child.renderOrder = 30;
        child.visible = true;
      }
    });
  }

  /**
   * RUNTIME GUARD: Prevent visual mesh occlusion
   * Runs each frame to enforce depth authority
   */
  static enforceDepthAuthorityEveryFrame(scene) {
    if (!scene || !scene.traverse) return;
    
    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      
      const userData = obj.userData || {};
      
      // Link and aura visuals NEVER write depth
      if (userData.isLinkVisual || 
          userData.vfxType?.includes('extreme') ||
          userData.isAura ||
          userData.visualLayer === 'AURA') {
        
        if (obj.material.depthWrite === true) {
          // VIOLATION DETECTED: Forcibly disable depth writing
          obj.material.depthWrite = false;
        }
      }
      
      // Holographic layers always render last
      if (userData.isHolographicLayer ||
          userData.isHologramShell ||
          userData.visualLayer === 'HOLOGRAM') {
        
        if (obj.renderOrder !== 40) {
          // VIOLATION DETECTED: Restore render order
          obj.renderOrder = 40;
        }
      }
    });
  }

  /**
   * Material safety check
   * Validates material properties are compliant
   */
  static validateMaterialCompliance(material, expectedType) {
    if (!material) return { valid: false, issues: ['No material'] };
    
    const issues = [];
    
    // Based on type, enforce different rules
    if (expectedType === 'link' || expectedType === 'aura') {
      if (material.depthWrite !== false) {
        issues.push(`depthWrite should be false (is ${material.depthWrite})`);
      }
      if (material.transparent !== true) {
        issues.push('transparent should be true');
      }
      if (material.opacity > 0.45) {
        issues.push(`opacity capped at 0.45 (is ${material.opacity})`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * DEBUG: Print depth authority report
   */
  static printDepthAuthorityReport(scene) {
    console.group('%c[DEPTH AUTHORITY REPORT]', 'color: #ffaa00; font-weight: bold');
    
    const violations = [];
    const renderOrderStats = {};
    
    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      
      const userData = obj.userData || {};
      const renderOrder = obj.renderOrder || 0;
      
      // Count render orders
      renderOrderStats[renderOrder] = (renderOrderStats[renderOrder] || 0) + 1;
      
      // Check for violations
      if (userData.isLinkVisual || userData.vfxType?.includes('extreme')) {
        if (obj.material.depthWrite === true) {
          violations.push(`Link ${obj.name} has depthWrite=true`);
        }
        if (obj.renderOrder !== 10) {
          violations.push(`Link ${obj.name} has renderOrder=${obj.renderOrder} (expected 10)`);
        }
      }
      
      if (userData.isAura || userData.visualLayer === 'AURA') {
        if (obj.material.depthWrite === true) {
          violations.push(`Aura ${obj.name} has depthWrite=true`);
        }
        if (obj.renderOrder !== 20) {
          violations.push(`Aura ${obj.name} has renderOrder=${obj.renderOrder} (expected 20)`);
        }
      }
      
      if (userData.isHolographicLayer || userData.visualLayer === 'HOLOGRAM') {
        if (obj.renderOrder !== 40) {
          violations.push(`Holographic ${obj.name} has renderOrder=${obj.renderOrder} (expected 40)`);
        }
      }
    });
    
    console.log('Render Order Distribution:');
    for (const [order, count] of Object.entries(renderOrderStats).sort()) {
      console.log(`  Order ${order}: ${count} meshes`);
    }
    
    if (violations.length === 0) {
      console.log('✓ No violations detected');
    } else {
      console.warn(`✗ ${violations.length} violations:`);
      violations.forEach(v => console.warn(`  - ${v}`));
    }
    
    console.groupEnd();
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.NodeDepthPreservation = NodeDepthAndHoloPreservationFix;
}
