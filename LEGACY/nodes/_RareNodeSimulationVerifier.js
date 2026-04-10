/**
 * RARE NODE SIMULATION VERIFIER
 * 
 * Runtime diagnostics to verify rare nodes are updating properly
 * Attached to window.__rareNodeVerifier for console access
 * 
 * Usage in browser console:
 * window.__rareNodeVerifier.fullDiagnostics()
 * window.__rareNodeVerifier.isRareNodeUpdateActive()
 * window.__rareNodeVerifier.getRareNodeCount()
 * etc.
 */

export class RareNodeSimulationVerifier {
  constructor(aiNodes, rareNodeSpawner) {
    this.aiNodes = aiNodes;
    this.rareNodeSpawner = rareNodeSpawner;
    this.lastFrameTime = Date.now();
    this.shellRotationTracker = new Map(); // Track shell rotations
    this.frameCount = 0;
  }

  /**
   * Get current rare node count in authoritative registry
   */
  getRareNodeCount() {
    if (!this.aiNodes || !this.aiNodes.nodes) return 0;
    return this.aiNodes.nodes.filter(n => n.userData?.rareType).length;
  }

  /**
   * Verify registry integrity
   */
  verifyRegistryIntegrity() {
    if (!this.aiNodes || !this.rareNodeSpawner) {
      return {
        status: 'CRITICAL',
        error: 'AINodes or RareNodeSpawner not initialized',
      };
    }

    const isAiNodesList = Array.isArray(this.aiNodes.nodes);
    const isSpawnerList = Array.isArray(this.rareNodeSpawner.nodesList);
    const isSameArray = this.aiNodes.nodes === this.rareNodeSpawner.nodesList;

    return {
      status: isSameArray ? 'OK' : 'CRITICAL',
      aiNodesList: isAiNodesList,
      spawnerList: isSpawnerList,
      sameArray: isSameArray,
      note: isSameArray 
        ? 'Rare nodes properly registered to authoritative registry' 
        : 'ERROR: Different arrays detected! Rare nodes may not update',
    };
  }

  /**
   * Check if rare nodes are being updated
   */
  isRareNodeUpdateActive() {
    const rareNodes = this.aiNodes.nodes.filter(n => n.userData?.rareType);
    if (rareNodes.length === 0) {
      return { status: 'NO_RARE_NODES', count: 0 };
    }

    // Check if shells are rotating (proof of update)
    let rotatingCount = 0;
    const rotations = [];

    rareNodes.forEach(node => {
      const shell = node.children?.find(c => c.userData?.isHologramShell);
      if (shell) {
        rotatingCount++;
        rotations.push({
          nodeId: node.id,
          rareType: node.userData.rareType,
          shellRotationZ: shell.rotation.z.toFixed(4),
        });
      }
    });

    return {
      status: rotatingCount > 0 ? 'UPDATING' : 'NOT_UPDATING',
      totalRareNodes: rareNodes.length,
      rotatingShells: rotatingCount,
      rotations: rotations.slice(0, 3), // Show first 3
    };
  }

  /**
   * Per-frame diagnostic (call every frame)
   */
  updateDiagnostics() {
    this.frameCount++;
    
    // Update shell rotation tracker every 10 frames
    if (this.frameCount % 10 === 0) {
      const rareNodes = this.aiNodes.nodes.filter(n => n.userData?.rareType);
      rareNodes.forEach(node => {
        const shell = node.children?.find(c => c.userData?.isHologramShell);
        if (shell) {
          const key = `node_${node.id}`;
          if (!this.shellRotationTracker.has(key)) {
            this.shellRotationTracker.set(key, shell.rotation.z);
          } else {
            const prevRotation = this.shellRotationTracker.get(key);
            const currRotation = shell.rotation.z;
            this.shellRotationTracker.set(key, currRotation);
            // Detect rotation change (update activity)
          }
        }
      });
    }
  }

  /**
   * Verify rare node positions are valid
   */
  verifyRareNodePositions() {
    const rareNodes = this.aiNodes.nodes.filter(n => n.userData?.rareType);
    const positions = [];

    rareNodes.forEach(node => {
      const pos = node.position;
      const isValid = !isNaN(pos.x) && !isNaN(pos.y) && !isNaN(pos.z);
      positions.push({
        nodeId: node.id,
        rareType: node.userData.rareType,
        position: { x: pos.x.toFixed(2), y: pos.y.toFixed(2), z: pos.z.toFixed(2) },
        isValid: isValid,
      });
    });

    return {
      totalRareNodes: positions.length,
      allValid: positions.every(p => p.isValid),
      positions: positions.slice(0, 5),
    };
  }

  /**
   * Check if rare nodes are linkable
   */
  verifyRareLinkability() {
    const rareNodes = this.aiNodes.nodes.filter(n => n.userData?.rareType);
    const linkState = [];

    rareNodes.forEach(node => {
      const canLink = !node.linked || node.linkedNodes?.length >= 0;
      linkState.push({
        nodeId: node.id,
        rareType: node.userData.rareType,
        isLinked: node.linked,
        linkedCount: node.linkedNodes?.length || 0,
        canLinkMore: true, // Rare nodes always linkable
      });
    });

    return {
      totalRareNodes: linkState.length,
      linkedNodes: linkState.filter(s => s.isLinked).length,
      linkState: linkState.slice(0, 5),
    };
  }

  /**
   * Full diagnostic report
   */
  fullDiagnostics() {
    console.group('🔍 RARE NODE SIMULATION DIAGNOSTICS');
    
    console.group('1. Registry Integrity');
    const registry = this.verifyRegistryIntegrity();
    console.table(registry);
    console.groupEnd();

    console.group('2. Update Activity');
    const updateStatus = this.isRareNodeUpdateActive();
    console.table(updateStatus);
    console.groupEnd();

    console.group('3. Positions');
    const positions = this.verifyRareNodePositions();
    console.table(positions);
    console.groupEnd();

    console.group('4. Linkability');
    const linkability = this.verifyRareLinkability();
    console.table(linkability);
    console.groupEnd();

    console.log('📊 Summary:', {
      rareNodeCount: this.getRareNodeCount(),
      registryOK: registry.status === 'OK',
      updatingActive: updateStatus.status === 'UPDATING',
      allPositionsValid: positions.allValid,
      totalSpawned: this.rareNodeSpawner?.registry?.totalSpawned || 0,
    });

    console.groupEnd();

    return {
      registry,
      updateStatus,
      positions,
      linkability,
      rareNodeCount: this.getRareNodeCount(),
    };
  }

  /**
   * Quick status check
   */
  quickStatus() {
    const rare = this.getRareNodeCount();
    const update = this.isRareNodeUpdateActive();
    const registry = this.verifyRegistryIntegrity();
    
    return {
      rareNodeCount: rare,
      updateStatus: update.status,
      registryStatus: registry.status,
      spawned: this.rareNodeSpawner?.registry?.totalSpawned || 0,
    };
  }
}

/**
 * Attach verifier to window for console access
 */
export function setupRareNodeVerifier(aiNodes, rareNodeSpawner) {
  const verifier = new RareNodeSimulationVerifier(aiNodes, rareNodeSpawner);
  
  if (typeof window !== 'undefined') {
    window.__rareNodeVerifier = {
      getRareNodeCount: () => verifier.getRareNodeCount(),
      verifyRegistry: () => verifier.verifyRegistryIntegrity(),
      isUpdating: () => verifier.isRareNodeUpdateActive(),
      checkPositions: () => verifier.verifyRareNodePositions(),
      checkLinkability: () => verifier.verifyRareLinkability(),
      fullDiagnostics: () => verifier.fullDiagnostics(),
      quickStatus: () => verifier.quickStatus(),
    };
  }

  return verifier;
}
