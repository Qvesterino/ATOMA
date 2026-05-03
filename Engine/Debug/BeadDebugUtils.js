/**
 * ============================================================================
 * BEAD DEBUG UTILITIES
 * ============================================================================
 * 
 * Developer tools for debugging and visualizing the bead system.
 * Provides console commands, visual overlays, and diagnostics.
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { printBeadPerformanceReport, getBeadPerformanceGrade } from '../../BeadPerformanceMonitor.js';
import { printDiagnostics } from '../../BeadEdgeCaseHandler.js';

/**
 * Bead debug controller
 */
export class BeadDebugController {
  constructor() {
    this.debug = false;
    this.enabled = false;
    this.showStats = false;
    this.showBounds = false;
    this.showPaths = false;
    this.scene = null;
    this.debugObjects = [];
    this.maxDebugObjects = 50; // Budget cap for debug visual objects
  }
  
  /**
   * Initialize debug controller
   */
  init(scene) {
    this.scene = scene;
    this.setupConsoleAPI();
  }
  
  /**
   * Setup console API for easy access
   */
  setupConsoleAPI() {
    if (typeof window === 'undefined') return;
    
    window.beadDebug = {
      help: () => this.printHelp(),
      stats: () => this.printGlobalStats(),
      if (this.debug) grade: () => console.log('Performance Grade:', getBeadPerformanceGrade()),
      showStats: () => this.toggleStats(true),
      hideStats: () => this.toggleStats(false),
      showBounds: () => this.toggleBounds(true),
      hideBounds: () => this.toggleBounds(false),
      showPaths: () => this.togglePaths(true),
      hidePaths: () => this.togglePaths(false),
      diagnostics: (link) => this.printLinkDiagnostics(link),
      allDiagnostics: () => this.printAllDiagnostics(),
      beadCounts: () => this.printBeadCounts(),
      config: () => this.printConfig()
    };
    
    if (this.debug) console.log('%c🔵 Bead Debug API Ready', 'color: #00ffff; font-weight: bold');
    if (this.debug) console.log('Use window.beadDebug.help() for commands');
  }
  
  /**
   * Print help
   */
  printHelp() {
    console.group('%c📖 Bead Debug Commands', 'color: #00ffff; font-weight: bold');
    if (this.debug) console.log('window.beadDebug.help()           - Show this help');
    if (this.debug) console.log('window.beadDebug.stats()          - Show performance stats');
    if (this.debug) console.log('window.beadDebug.grade()          - Show performance grade');
    if (this.debug) console.log('window.beadDebug.showStats()      - Enable stats overlay');
    if (this.debug) console.log('window.beadDebug.hideStats()      - Disable stats overlay');
    if (this.debug) console.log('window.beadDebug.showBounds()     - Show bead bounds');
    if (this.debug) console.log('window.beadDebug.hideBounds()     - Hide bead bounds');
    if (this.debug) console.log('window.beadDebug.showPaths()      - Show link curves');
    if (this.debug) console.log('window.beadDebug.hidePaths()      - Hide link curves');
    if (this.debug) console.log('window.beadDebug.diagnostics(link) - Diagnose specific link');
    if (this.debug) console.log('window.beadDebug.allDiagnostics() - Diagnose all links');
    if (this.debug) console.log('window.beadDebug.beadCounts()     - Show bead counts per link');
    if (this.debug) console.log('window.beadDebug.config()         - Print current config');
    console.groupEnd();
  }
  
  /**
   * Print global performance stats
   */
  printGlobalStats() {
    printBeadPerformanceReport();
  }
  
  /**
   * Print bead counts per link
   */
  printBeadCounts() {
    if (!window.game?.linkingSystem) {
      console.warn('linkingSystem not available');
      return;
    }
    
    const links = window.game.linkingSystem.links;
    const data = [];
    
    for (const link of links) {
      const viz = link.group?.userData?.conduitState?.beads;
      const pool = viz?.pool;
      
      if (pool) {
        const active = pool.getActiveBead().length;
        const max = pool.maxBeads;
        
        data.push({
          id: link.id?.substring(0, 8) || 'unknown',
          active,
          max,
          utilization: ((active / max) * 100).toFixed(1) + '%',
          synergy: (link['synergyScore'] ?? 0.5).toFixed(2),
          traffic: (link.traffic?.load ?? 0).toFixed(2)
        });
      }
    }
    
    console.table(data);
  }
  
  /**
   * Print current config
   */
  printConfig() {
    const { BEAD_CONFIG } = require('../../LinkBeadSystem.js');
    if (this.debug) console.log('Current Bead Configuration:');
    if (this.debug) console.log(JSON.stringify(BEAD_CONFIG, null, 2));
  }
  
  /**
   * Print diagnostics for specific link
   */
  printLinkDiagnostics(link) {
    if (!link) {
      console.warn('Link not provided');
      return;
    }
    
    printDiagnostics(link);
  }
  
  /**
   * Print diagnostics for all links
   */
  printAllDiagnostics() {
    if (!window.game?.linkingSystem) {
      console.warn('linkingSystem not available');
      return;
    }
    
    const links = window.game.linkingSystem.links;
    
    for (let i = 0; i < Math.min(links.length, 5); i++) {
      if (this.debug) console.log(`\n--- Link ${i + 1} ---`);
      printDiagnostics(links[i]);
    }
    
    if (links.length > 5) {
      if (this.debug) console.log(`\n(Showing 5 of ${links.length} links)`);
    }
  }
  
  /**
   * Toggle stats overlay
   */
  toggleStats(enabled) {
    this.showStats = enabled;
    if (this.debug) console.log(`Stats overlay ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Toggle bounds visualization
   */
  toggleBounds(enabled) {
    this.showBounds = enabled;
    this.updateDebugVisuals();
    if (this.debug) console.log(`Bounds visualization ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Toggle path visualization
   */
  togglePaths(enabled) {
    this.showPaths = enabled;
    this.updateDebugVisuals();
    if (this.debug) console.log(`Path visualization ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Update debug visuals
   */
  updateDebugVisuals() {
    // Clear existing debug objects
    for (const obj of this.debugObjects) {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
    this.debugObjects = [];
    
    if (!window.game?.linkingSystem) return;
    
    const links = window.game.linkingSystem.links;
    
    for (const link of links) {
      if (!link.curve) continue;
      
      // Show link curves
      if (this.showPaths) {
        const points = [];
        for (let i = 0; i <= 20; i++) {
          points.push(link.curve.getPointAt(i / 20));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff });
        const line = new THREE.Line(geometry, material);
        
        this.scene.add(line);
        this.debugObjects.push(line);
      }
      
      // Show bead bounds
      if (this.showBounds) {
        const viz = link.group?.userData?.conduitState?.beads;
        const pool = viz?.pool;
        
        if (pool) {
          for (const bead of pool.beads) {
            if (bead.isActive) {
              // Box marker at bead position (no SphereGeometry in debug path).
              const edge = Math.max(bead.radius * 2, 0.01);
              const geom = new THREE.BoxGeometry(edge, edge, edge);
              const mat = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
                transparent: true,
                opacity: 0.5
              });
              const sphere = new THREE.Mesh(geom, mat);
              
              // Position on curve
              const pos = link.curve.getPointAt(bead.t);
              sphere.position.copy(pos);
              
              this.scene.add(sphere);
              this.debugObjects.push(sphere);
            }
          }
        }
      }
    }
  }
}

/**
 * Create debug controller instance
 */
let debugController = null;

/**
 * Initialize global debug controller
 */
export function initBeadDebugController(scene) {
  if (!debugController) {
    debugController = new BeadDebugController();
    debugController.init(scene);
  }
  return debugController;
}

/**
 * Get debug controller
 */
export function getBeadDebugController() {
  return debugController;
}

/**
 * Quick logging function
 */
export function logBeadInfo(link) {
  if (!link) {
    console.warn('No link provided');
    return;
  }
  
  const viz = link.group?.userData?.conduitState?.beads;
  const pool = viz?.pool;
  
  if (pool) {
    const active = pool.getActiveBead();
    if (this.debug) console.log(`Link: ${link.id?.substring(0, 8)}`);
    if (this.debug) console.log(`  Active Beads: ${active.length}/${pool.maxBeads}`);
    if (this.debug) console.log(`  Synergy: ${(link['synergyScore'] ?? 0.5).toFixed(2)}`);
    if (this.debug) console.log(`  Traffic: ${(link.traffic?.load ?? 0).toFixed(2)}`);
    if (this.debug) console.log(`  Activity: ${pool.getActivityLevel().toFixed(2)}`);
  }
}

export default {
  BeadDebugController,
  initBeadDebugController,
  getBeadDebugController,
  logBeadInfo
};
