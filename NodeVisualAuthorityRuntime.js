import * as THREE from 'three';
import { NodeCoreMaterialAuthority } from './NodeCoreMaterialAuthority.js';

function isFiniteScale(scale) {
  return Number.isFinite(scale?.x) && Number.isFinite(scale?.y) && Number.isFinite(scale?.z);
}

export class NodeVisualAuthorityRuntime {
  constructor(options = {}) {
    this.debugMode = options.debugMode === true;
    this.allowRootFrustumDisable = options.allowRootFrustumDisable === true;
    this._repairLog = [];
    this._maxRepairLog = options.maxRepairLog ?? 200;
  }

  applyBaseline(node, context = {}) {
    if (!node || !(node instanceof THREE.Object3D)) return false;

    node.visible = true;
    if (!isFiniteScale(node.scale) || node.scale.x <= 0 || node.scale.y <= 0 || node.scale.z <= 0) {
      node.scale.set(1, 1, 1);
    }

    if (node.layers && node.layers.mask === 0) {
      node.layers.mask = 1;
    }

    if (!this.allowRootFrustumDisable && node.frustumCulled === false) {
      node.frustumCulled = true;
    }

    node.userData = node.userData || {};
    node.userData.visualAuthorityRuntime = {
      appliedAt: Date.now(),
      source: context.source || 'spawn',
      category: context.category || node.userData.category || 'unknown',
      rootScale: { x: node.scale.x, y: node.scale.y, z: node.scale.z },
    };

    node.traverse((child) => {
      if (!child || child.isObject3D !== true) return;

      const userData = child.userData || {};
      if (userData.isInteractionProxy === true) {
        child.frustumCulled = false;
      } else if (child.frustumCulled === false && userData.allowNoFrustum !== true) {
        child.frustumCulled = true;
      }

      if (child.isMesh && (userData.visualLayer === 'CORE' || userData.isCoreMesh === true)) {
        child.visible = true;
        if (child.material) {
          NodeCoreMaterialAuthority.lockCoreMaterial(child.material, true);
        }
      }
    });

    return true;
  }

  validateBaseline(node) {
    const issues = [];
    if (!node || !(node instanceof THREE.Object3D)) {
      return { valid: false, issues: ['invalid-node'] };
    }
    if (node.visible !== true) issues.push('root-hidden');
    if (!isFiniteScale(node.scale) || node.scale.x <= 0 || node.scale.y <= 0 || node.scale.z <= 0) {
      issues.push('root-invalid-scale');
    }
    if (node.layers && node.layers.mask === 0) issues.push('root-layer-mask-0');
    if (!this.allowRootFrustumDisable && node.frustumCulled === false) issues.push('root-frustum-disabled');
    return { valid: issues.length === 0, issues };
  }

  requestRepair(node, reason = 'manual') {
    const applied = this.applyBaseline(node, { source: 'repair', reason });
    this._repairLog.push({
      nodeId: node?.userData?.nodeId || node?.uuid || 'unknown',
      reason,
      applied,
      timestamp: Date.now(),
    });
    if (this._repairLog.length > this._maxRepairLog) {
      this._repairLog.shift();
    }
    return applied;
  }

  getDiagnostics() {
    return {
      debugMode: this.debugMode,
      allowRootFrustumDisable: this.allowRootFrustumDisable,
      recentRepairs: this._repairLog.slice(-20),
    };
  }
}

export default NodeVisualAuthorityRuntime;
