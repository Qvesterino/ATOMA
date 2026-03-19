/**
 * STRESS VISUAL SHADER SYSTEM
 * 
 * GPU-based stress visualization using GLSL shaders.
 * Consumes metrics from CoreMetricsCalculator (single source of truth).
 * 
 * DATA SOURCES (Read-Only):
 * - networkStress: from CoreMetricsCalculator.getMetrics().stability
 * - node visual metrics: from node.userData.visualMetrics
 * 
 * VISUAL OUTPUT:
 * - Ambient stress field (fog color shift, turbulence)
 * - Node stress overlay (pulse, fresnel glow)
 * - Connector stress glow
 */

import * as THREE from 'three';
import { CoreMetricsCalculator } from './CoreMetricsCalculator.js';
import {
    stressAmbientVertexShader,
    stressAmbientFragmentShader,
    nodeStressVertexShader,
    nodeStressFragmentShader,
    connectorStressVertexShader,
    connectorStressFragmentShader
} from './shaders/StressVisualShaders.js';

const DEFAULT_CONFIG = {
    // Ambient stress field
    ambientEnabled: true,
    ambientPlaneSize: 1000,
    
    // Node stress overlay
    nodeOverlayEnabled: true,
    
    // Performance
    updateInterval: 1 / 30, // 30 Hz for visual updates
    
    // Debug
    debugMode: false
};

export class StressVisualShaderSystem {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.coreMetricsCalculator = config.coreMetricsCalculator || null;
        
        // State
        this.networkStress = 0;
        this.elapsedTime = 0;
        this.lastUpdateTime = 0;
        
        // Materials
        this.ambientStressMaterial = null;
        this.nodeStressMaterials = new Map(); // nodeId -> ShaderMaterial
        
        // Meshes
        this.ambientPlane = null;
        
        // Initialize
        this._initializeAmbientStressField();
        
        if (this.config.debugMode) {
            console.log('[StressVisualShaderSystem] Initialized');
        }
    }
    
    /**
     * Initialize ambient stress field (full-screen quad)
     */
    _initializeAmbientStressField() {
        if (!this.config.ambientEnabled || !this.scene) return;
        
        // Create shader material for ambient stress
        this.ambientStressMaterial = new THREE.ShaderMaterial({
            vertexShader: stressAmbientVertexShader,
            fragmentShader: stressAmbientFragmentShader,
            uniforms: {
                uNetworkStress: { value: 0.0 },
                uTime: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        // Create a large plane for ambient effect (positioned far back)
        const geometry = new THREE.PlaneGeometry(
            this.config.ambientPlaneSize,
            this.config.ambientPlaneSize
        );
        
        this.ambientPlane = new THREE.Mesh(geometry, this.ambientStressMaterial);
        this.ambientPlane.position.z = -500; // Far back in the scene
        this.ambientPlane.renderOrder = -1000; // Render first
        
        // Note: We don't add to scene by default - this is optional
        // The scene might use fog instead of a plane
        // this.scene.add(this.ambientPlane);
    }
    
    /**
     * Create or update node stress overlay material
     */
    _createNodeStressMaterial(node) {
        const material = new THREE.ShaderMaterial({
            vertexShader: nodeStressVertexShader,
            fragmentShader: nodeStressFragmentShader,
            uniforms: {
                uStressIntensity: { value: 0.0 },
                uStressPulsePhase: { value: 0.0 },
                uStressPulseRate: { value: 1.0 },
                uTime: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        return material;
    }
    
    /**
     * Create connector stress material
     */
    _createConnectorStressMaterial() {
        return new THREE.ShaderMaterial({
            vertexShader: connectorStressVertexShader,
            fragmentShader: connectorStressFragmentShader,
            uniforms: {
                uConnectorStress: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false
        });
    }
    
    /**
     * Main update loop
     * @param {number} deltaTime - Time since last frame
     * @param {number} time - Current elapsed time
     * @param {Array} nodes - Array of node objects
     */
    update(deltaTime, time, nodes = []) {
        this.elapsedTime = time;
        
        // Throttle updates for performance
        if (time - this.lastUpdateTime < this.config.updateInterval) {
            return;
        }
        this.lastUpdateTime = time;
        
        // 1. Read network stress from live metrics
        this._updateNetworkStress();
        
        // 2. Update ambient stress field
        this._updateAmbientStressField();
        
        // 3. Update node stress overlays
        if (this.config.nodeOverlayEnabled && nodes.length > 0) {
            this._updateNodeStressOverlays(nodes);
        }
    }
    
    /**
     * Read network stress from CoreMetricsCalculator
     * CoreMetricsCalculator is the single source of truth for network metrics
     */
    _updateNetworkStress() {
        if (this.coreMetricsCalculator) {
            const metrics = this.coreMetricsCalculator.getMetrics();
            // networkStress = 1 - stability (inverted)
            this.networkStress = 1 - (metrics?.stability ?? 0);
        }
    }
    
    /**
     * Update ambient stress field uniforms
     */
    _updateAmbientStressField() {
        if (!this.ambientStressMaterial) return;
        
        this.ambientStressMaterial.uniforms.uNetworkStress.value = this.networkStress;
        this.ambientStressMaterial.uniforms.uTime.value = this.elapsedTime;
        
        // Also apply to scene fog if present (alternative to plane)
        if (this.scene?.fog) {
            const stress = this.networkStress;
            
            // Color shift: cool → orange → red
            let r, g, b;
            if (stress < 0.5) {
                const t = stress * 2;
                r = 0.2 + (0.8 - 0.2) * t;
                g = 0.4 + (0.5 - 0.4) * t;
                b = 0.6 + (0.2 - 0.6) * t;
            } else {
                const t = (stress - 0.5) * 2;
                r = 0.8 + (1.0 - 0.8) * t;
                g = 0.5 + (0.2 - 0.5) * t;
                b = 0.2 + (0.2 - 0.2) * t;
            }
            
            this.scene.fog.color.setRGB(r, g, b);
        }
    }
    
    /**
     * Update node stress overlay uniforms
     */
    _updateNodeStressOverlays(nodes) {
        for (const node of nodes) {
            if (!node?.userData) continue;
            
            // Read visual metrics from MetricInterpretationLayer_v1
            const visualMetrics = node.userData.visualMetrics;
            if (!visualMetrics) continue;
            
            const stressIntensity = visualMetrics.networkStressVisualDensity ?? 0;
            const pulseRate = 1.0 + stressIntensity * 2.0; // 1-3x base rate
            const pulsePhase = (this.elapsedTime * pulseRate) % (Math.PI * 2);
            
            // Store in userData for potential use by other systems
            node.userData.stressPulseRate = pulseRate;
            node.userData.stressPulsePhase = pulsePhase;
            node.userData.stressIntensity = stressIntensity;
            
            // If node has a stress material, update it
            const nodeId = node.userData.nodeId || node.uuid;
            if (this.nodeStressMaterials.has(nodeId)) {
                const material = this.nodeStressMaterials.get(nodeId);
                material.uniforms.uStressIntensity.value = stressIntensity;
                material.uniforms.uStressPulsePhase.value = pulsePhase;
                material.uniforms.uStressPulseRate.value = pulseRate;
                material.uniforms.uTime.value = this.elapsedTime;
            }
        }
    }
    
    /**
     * Register a node for stress overlay rendering
     */
    registerNode(node) {
        if (!node?.userData) return;
        
        const nodeId = node.userData.nodeId || node.uuid;
        if (this.nodeStressMaterials.has(nodeId)) return;
        
        const material = this._createNodeStressMaterial(node);
        this.nodeStressMaterials.set(nodeId, material);
        
        if (this.config.debugMode) {
            console.log(`[StressVisualShaderSystem] Registered node ${nodeId.slice(0, 8)}`);
        }
    }
    
    /**
     * Unregister a node
     */
    unregisterNode(node) {
        if (!node?.userData) return;
        
        const nodeId = node.userData.nodeId || node.uuid;
        const material = this.nodeStressMaterials.get(nodeId);
        
        if (material) {
            material.dispose();
            this.nodeStressMaterials.delete(nodeId);
        }
    }
    
    /**
     * Enable ambient stress plane in scene
     */
    enableAmbientPlane() {
        if (this.ambientPlane && this.scene && !this.ambientPlane.parent) {
            this.scene.add(this.ambientPlane);
        }
    }
    
    /**
     * Disable ambient stress plane
     */
    disableAmbientPlane() {
        if (this.ambientPlane?.parent) {
            this.ambientPlane.parent.remove(this.ambientPlane);
        }
    }
    
    /**
     * Get current network stress value
     */
    getNetworkStress() {
        return this.networkStress;
    }
    
    /**
     * Debug: Print status
     */
    debugPrint() {
        console.log('[StressVisualShaderSystem] Status:');
        console.log(`  Network Stress: ${this.networkStress.toFixed(3)}`);
        console.log(`  Registered Nodes: ${this.nodeStressMaterials.size}`);
        console.log(`  Ambient Plane: ${this.ambientPlane?.parent ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Cleanup
     */
    dispose() {
        // Dispose ambient material
        if (this.ambientStressMaterial) {
            this.ambientStressMaterial.dispose();
        }
        
        // Dispose ambient plane
        if (this.ambientPlane) {
            this.ambientPlane.geometry?.dispose();
            if (this.ambientPlane.parent) {
                this.ambientPlane.parent.remove(this.ambientPlane);
            }
        }
        
        // Dispose node materials
        for (const material of this.nodeStressMaterials.values()) {
            material.dispose();
        }
        this.nodeStressMaterials.clear();
        
        if (this.config.debugMode) {
            console.log('[StressVisualShaderSystem] Disposed');
        }
    }
}

export default StressVisualShaderSystem;
