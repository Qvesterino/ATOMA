/**
 * CASCADE PROPAGATION FX v1.0 – CODE SNIPPETS
 * Phase 3C Week 25
 * 
 * Copy-paste integration examples for CascadePropagationFX_v1
 * Use these snippets to quickly integrate cascade effects into your codebase.
 */

// ============================================================================
// 1. BASIC INITIALIZATION
// ============================================================================

/**
 * Snippet: Initialize cascade FX in game setup
 * 
 * Location: main.js, in AtomaGame.init() or setup function
 */
{
    import { CascadePropagationFX_v1 } from './CascadePropagationFX_v1.js';
    
    // During game initialization
    this.cascadePropagationFX = new CascadePropagationFX_v1(this, {
        debugEnabled: false,
        defaultIntensity: 0.8,
        maxHops: 8,
        waveDuration: 0.5,
        dampingTime: 2.0,
        glowBoost: 1.5
    });
    
    // Call init()
    this.cascadePropagationFX.init();
    
    console.log('✓ Cascade Propagation FX initialized');
}

// ============================================================================
// 2. BASIC CASCADE TRIGGER
// ============================================================================

/**
 * Snippet: Trigger a cascade from a node
 */
{
    const cascadeID = this.cascadePropagationFX.triggerCascade(
        sourceNode,
        0.85  // intensity
    );
    
    console.log(`Cascade ${cascadeID} triggered from ${sourceNode.name}`);
}

// ============================================================================
// 3. CASCADE WITH CUSTOM PARAMETERS
// ============================================================================

/**
 * Snippet: Trigger cascade with custom color and harmonics
 */
{
    const cascadeID = this.cascadePropagationFX.triggerCascade(
        node,
        0.9,  // intensity
        {
            maxHops: 6,
            decayFactor: 0.85,
            waveDuration: 0.3,
            dampingTime: 1.5,
            waveSpeed: 5.0,
            harmonicMultiplier: 1.5,
            color: new THREE.Color(0xff00ff)  // Magenta
        }
    );
}

// ============================================================================
// 4. CHAIN REACTION INTEGRATION
// ============================================================================

/**
 * Snippet: Connect cascade FX to SynergyChainReaction_v1
 * 
 * Location: main.js, in update loop or event handler
 */
{
    // When chain reaction fires, trigger visual cascades
    const chainEvents = this.synergyChainReaction?.getChainEvents?.() || [];
    
    for (const event of chainEvents) {
        const cascadeID = this.cascadePropagationFX.triggerCascade(
            event.node,
            Math.min(1.0, event.intensity * 1.2),
            {
                harmonicMultiplier: event.resonance || 1.0,
                color: event.color || new THREE.Color(0x00ff00),
                maxHops: event.hops || 8
            }
        );
    }
}

// ============================================================================
// 5. BRIDGE INTEGRATION
// ============================================================================

/**
 * Snippet: Connect to SynergyCascadeFXBridge_v1
 * 
 * When bridge signals cascade, trigger propagation
 */
{
    const bridgeSignals = this.cascadeFXBridge?.getNodeSignals?.(node) || {};
    
    if (bridgeSignals.intensity > 0.5) {
        this.cascadePropagationFX.triggerCascade(node, bridgeSignals.intensity, {
            harmonicMultiplier: bridgeSignals.resonance,
            color: bridgeSignals.color,
            maxHops: Math.ceil(bridgeSignals.range)
        });
    }
}

// ============================================================================
// 6. UPDATE LOOP INTEGRATION
// ============================================================================

/**
 * Snippet: Call cascade update in animation loop
 * 
 * Location: main.js, in animate() function
 */
{
    function animate() {
        const deltaTime = clock.getDelta();
        
        // Update cascade propagation
        this.cascadePropagationFX?.update?.(deltaTime);
        
        // Apply cascade effects to materials
        updateCascadeMaterials();
        
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
}

// ============================================================================
// 7. LINK MATERIAL UPDATE
// ============================================================================

/**
 * Snippet: Apply cascade effects to link materials
 * 
 * Call this in your render loop or material update function
 */
{
    function updateCascadeMaterials_Links() {
        // Get all links (adjust to your scene structure)
        const links = this.scene?.children?.filter(
            child => child.userData?.isLink
        ) || [];
        
        for (const link of links) {
            const linkState = this.cascadePropagationFX?.getLinkCascadeState?.(link);
            
            if (linkState && linkState.totalIntensity > 0.01) {
                // Update material uniforms
                if (link.material?.uniforms) {
                    link.material.uniforms.uCascadeIntensity.value = 
                        linkState.smoothedIntensity;
                    link.material.uniforms.uRippleAmplitude.value = 
                        linkState.rippleAmplitude;
                    link.material.uniforms.uCascadeColor.value = 
                        linkState.effectiveColor;
                    link.material.uniforms.uCascadePhase.value = 
                        linkState.combinedPhase;
                }
            }
        }
    }
}

// ============================================================================
// 8. NODE MATERIAL UPDATE
// ============================================================================

/**
 * Snippet: Apply cascade effects to node materials
 * 
 * Call this in your render loop or material update function
 */
{
    function updateCascadeMaterials_Nodes() {
        // Get all nodes
        const nodes = this.nodes || [];
        
        for (const node of nodes) {
            const nodeState = this.cascadePropagationFX?.getNodeCascadeState?.(node);
            
            if (nodeState && nodeState.totalIntensity > 0.01) {
                // Update material uniforms
                if (node.material?.uniforms) {
                    node.material.uniforms.uCascadeIntensity.value = 
                        nodeState.smoothedIntensity;
                    node.material.uniforms.uGlowAmplification.value = 
                        nodeState.glowAmplification;
                    node.material.uniforms.uCascadeColor.value = 
                        nodeState.effectiveColor;
                    node.material.uniforms.uAuraPulsation.value = 
                        nodeState.auraPulsation;
                }
                
                // Or update emissive directly
                if (node.material?.emissive) {
                    node.material.emissive.copy(nodeState.effectiveColor);
                    node.material.emissiveIntensity = nodeState.glowAmplification;
                }
            }
        }
    }
}

// ============================================================================
// 9. GET CASCADE STATE FOR SPECIFIC LINK
// ============================================================================

/**
 * Snippet: Query cascade state for a single link
 */
{
    const linkState = this.cascadePropagationFX.getLinkCascadeState(link);
    
    if (linkState) {
        console.log('Link cascade state:');
        console.log(`  Intensity: ${linkState.totalIntensity.toFixed(2)}`);
        console.log(`  Ripple: ${linkState.rippleAmplitude.toFixed(2)}`);
        console.log(`  Color: ${linkState.effectiveColor.getHexString()}`);
        console.log(`  Phase: ${(linkState.combinedPhase * 180 / Math.PI).toFixed(1)}°`);
    } else {
        console.log('No cascade on this link');
    }
}

// ============================================================================
// 10. GET CASCADE STATE FOR SPECIFIC NODE
// ============================================================================

/**
 * Snippet: Query cascade state for a single node
 */
{
    const nodeState = this.cascadePropagationFX.getNodeCascadeState(node);
    
    if (nodeState) {
        console.log('Node cascade state:');
        console.log(`  Intensity: ${nodeState.totalIntensity.toFixed(2)}`);
        console.log(`  Glow: ${nodeState.glowAmplification.toFixed(2)}`);
        console.log(`  Aura Pulse: ${nodeState.auraPulsation.toFixed(2)}`);
        console.log(`  Color: ${nodeState.effectiveColor.getHexString()}`);
    } else {
        console.log('No cascade on this node');
    }
}

// ============================================================================
// 11. GET CASCADE DATA BY ID
// ============================================================================

/**
 * Snippet: Query cascade data by ID
 */
{
    const cascade = this.cascadePropagationFX.getCascadeData(cascadeID);
    
    if (cascade) {
        const now = performance.now() / 1000;  // Convert to seconds
        
        console.log(`Cascade ${cascadeID}:`);
        console.log(`  State: ${cascade.state}`);
        console.log(`  Progress: ${(cascade.getProgress(now) * 100).toFixed(1)}%`);
        console.log(`  Intensity: ${cascade.getIntensity(now).toFixed(2)}`);
        console.log(`  Nodes affected: ${cascade.visitedNodes.size}`);
        console.log(`  Links affected: ${cascade.visitedLinks.size}`);
    }
}

// ============================================================================
// 12. GET ALL ACTIVE CASCADES
// ============================================================================

/**
 * Snippet: Get all currently active cascades
 */
{
    const cascades = this.cascadePropagationFX.getActiveCascades();
    
    console.log(`${cascades.length} cascades active:`);
    for (const cascade of cascades) {
        console.log(`  - ID ${cascade.id} from ${cascade.sourceNode.name}`);
        console.log(`    State: ${cascade.state}`);
        console.log(`    Nodes: ${cascade.visitedNodes.size}`);
    }
}

// ============================================================================
// 13. PERFORMANCE MONITORING
// ============================================================================

/**
 * Snippet: Monitor cascade FX performance
 * 
 * Call this periodically (e.g., 1x per second) or on demand
 */
{
    function logCascadeMetrics() {
        const metrics = this.cascadePropagationFX.getMetrics();
        
        console.log('─────────────────────────────────────');
        console.log('CASCADE FX PERFORMANCE METRICS');
        console.log('─────────────────────────────────────');
        console.log(`Active Cascades:   ${metrics.activeCascades}`);
        console.log(`Peak Cascades:     ${metrics.peakCascades}`);
        console.log(`Pool Utilization:  ${(metrics.poolUtilization * 100).toFixed(1)}%`);
        console.log(`Update Time:       ${metrics.updateTimeMs.toFixed(2)}ms`);
        console.log(`Link States:       ${metrics.linkStatesCount}`);
        console.log(`Node States:       ${metrics.nodeStatesCount}`);
        console.log('─────────────────────────────────────');
    }
    
    // Log every second
    setInterval(() => logCascadeMetrics.call(game), 1000);
}

// ============================================================================
// 14. REAL-TIME PERFORMANCE DISPLAY
// ============================================================================

/**
 * Snippet: Display cascade metrics in HUD or console
 */
{
    class CascadeMetricsDisplay {
        constructor(cascadeFX) {
            this.cascadeFX = cascadeFX;
            this.lastMetrics = null;
        }
        
        update() {
            this.lastMetrics = this.cascadeFX.getMetrics();
            return this.lastMetrics;
        }
        
        getHTML() {
            if (!this.lastMetrics) return '';
            
            const m = this.lastMetrics;
            return `
                <div style="font-family: monospace; background: rgba(0,0,0,0.7); padding: 10px;">
                    <div>Active: ${m.activeCascades} / ${m.peakCascades} peak</div>
                    <div>Pool: ${(m.poolUtilization * 100).toFixed(1)}% used</div>
                    <div>Update: ${m.updateTimeMs.toFixed(2)}ms</div>
                    <div>States: ${m.linkStatesCount}L + ${m.nodeStatesCount}N</div>
                </div>
            `;
        }
    }
    
    const display = new CascadeMetricsDisplay(this.cascadePropagationFX);
}

// ============================================================================
// 15. CLEAR ALL CASCADES
// ============================================================================

/**
 * Snippet: Stop all active cascades
 * 
 * Use when resetting world, pausing game, etc.
 */
{
    this.cascadePropagationFX.clearCascades();
    console.log('All cascades cleared');
}

// ============================================================================
// 16. MULTI-CASCADE EXAMPLE
// ============================================================================

/**
 * Snippet: Trigger multiple cascades simultaneously
 * 
 * Demonstrates cascade blending
 */
{
    // Get cluster of nodes
    const clusterNodes = selectNodeCluster(3);  // 3 nodes
    const cascadeIDs = [];
    
    // Trigger cascades from each
    for (let i = 0; i < clusterNodes.length; i++) {
        const cascadeID = this.cascadePropagationFX.triggerCascade(
            clusterNodes[i],
            0.7 + i * 0.1,  // Vary intensity
            {
                color: new THREE.Color()
                    .setHSL(i / clusterNodes.length, 1, 0.5),  // Different colors
                harmonicMultiplier: 1.0 + i * 0.2
            }
        );
        cascadeIDs.push(cascadeID);
    }
    
    console.log(`Triggered ${cascadeIDs.length} cascades: ${cascadeIDs.join(', ')}`);
}

// ============================================================================
// 17. SHADER INTEGRATION EXAMPLE
// ============================================================================

/**
 * Snippet: Fragment shader code to use cascade uniforms
 * 
 * Add to your link or node fragment shader
 */
const CASCADE_SHADER_FRAGMENT = `
    // Cascade uniforms (injected by CascadePropagationFX_v1)
    uniform float uCascadeIntensity;
    uniform float uCascadePhase;
    uniform vec3  uCascadeColor;
    uniform float uRippleAmplitude;
    uniform float uWaveSpeed;
    
    // In main fragment shader:
    void main() {
        // Base color
        vec4 baseColor = texture2D(map, vUv);
        
        // Cascade wave
        float wave = sin(vPosition.x * 5.0 - uTime * uWaveSpeed + uCascadePhase) 
                   * uRippleAmplitude 
                   * uCascadeIntensity;
        
        // Ripple displacement
        vec3 rippled = mix(
            baseColor.rgb,
            uCascadeColor,
            uCascadeIntensity * 0.5
        );
        
        // Add glow
        rippled += uCascadeColor * uCascadeIntensity * 0.3;
        
        gl_FragColor = vec4(rippled, baseColor.a);
    }
`;

// ============================================================================
// 18. DISPOSE / CLEANUP
// ============================================================================

/**
 * Snippet: Properly dispose cascade FX when shutting down
 * 
 * Location: main.js, in AtomaGame.dispose() or cleanup function
 */
{
    // Cleanup cascade FX
    this.cascadePropagationFX?.dispose?.();
    this.cascadePropagationFX = null;
    
    console.log('✓ Cascade FX disposed');
}

// ============================================================================
// 19. ERROR HANDLING
// ============================================================================

/**
 * Snippet: Safe cascade trigger with error handling
 */
{
    function safeTriggerCascade(node, intensity = 0.8, options = {}) {
        try {
            if (!node) {
                console.warn('No node provided to cascade trigger');
                return null;
            }
            
            if (!this.cascadePropagationFX) {
                console.warn('Cascade FX not initialized');
                return null;
            }
            
            return this.cascadePropagationFX.triggerCascade(node, intensity, options);
        } catch (error) {
            console.error('Error triggering cascade:', error);
            return null;
        }
    }
    
    // Usage
    const cascadeID = safeTriggerCascade.call(game, sourceNode, 0.85);
}

// ============================================================================
// 20. DEBUG VISUALIZATION
// ============================================================================

/**
 * Snippet: Debug cascade propagation
 * 
 * Draw cascade paths in scene for debugging
 */
{
    function visualizeCascade(cascadeID) {
        const cascade = this.cascadePropagationFX.getCascadeData(cascadeID);
        if (!cascade) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        // Add cascade source
        positions.push(...cascade.sourceNode.position.toArray());
        
        // Add visited nodes
        for (const node of cascade.visitedNodes) {
            if (node !== cascade.sourceNode) {
                positions.push(...node.position.toArray());
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(
            new Float32Array(positions),
            3
        ));
        
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const line = new THREE.LineSegments(geometry, material);
        
        this.scene.add(line);
        
        // Remove after 2 seconds
        setTimeout(() => this.scene.remove(line), 2000);
    }
}

// ============================================================================
// 21. INTEGRATION CHECKLIST
// ============================================================================

/**
 * Snippet: Integration verification checklist
 * 
 * Run this to verify cascade FX is properly integrated
 */
{
    function verifyCascadeIntegration() {
        const checks = {
            'CascadePropagationFX exists': !!this.cascadePropagationFX,
            'Module initialized': !!this.cascadePropagationFX?.cascadePool?.length,
            'Can get metrics': typeof this.cascadePropagationFX?.getMetrics === 'function',
            'Can trigger cascade': typeof this.cascadePropagationFX?.triggerCascade === 'function',
            'Can update': typeof this.cascadePropagationFX?.update === 'function',
            'Can dispose': typeof this.cascadePropagationFX?.dispose === 'function'
        };
        
        console.log('INTEGRATION CHECKLIST:');
        for (const [check, result] of Object.entries(checks)) {
            console.log(`  ${result ? '✓' : '✗'} ${check}`);
        }
        
        const allPass = Object.values(checks).every(v => v);
        console.log(`Overall: ${allPass ? '✓ PASS' : '✗ FAIL'}`);
        
        return allPass;
    }
}

// ============================================================================
// 22. COMPLETE INTEGRATION EXAMPLE
// ============================================================================

/**
 * Snippet: Complete integration with all systems working together
 * 
 * This shows a realistic cascade trigger from chain reaction through rendering
 */
{
    class AtomaGameWithCascades extends AtomaGame {
        initialize() {
            super.initialize();
            
            // 1. Initialize cascade FX
            this.cascadePropagationFX = new CascadePropagationFX_v1(this);
            this.cascadePropagationFX.init();
        }
        
        update(deltaTime) {
            // 2. Update cascade propagation
            this.cascadePropagationFX.update(deltaTime);
            
            // 3. Apply cascade effects
            this.updateCascadeEffects();
            
            // Call parent update
            super.update(deltaTime);
        }
        
        updateCascadeEffects() {
            // Update all links with cascade ripples
            for (const link of this.links) {
                const state = this.cascadePropagationFX.getLinkCascadeState(link);
                if (state?.totalIntensity > 0) {
                    link.material.uniforms.uCascadeIntensity.value = 
                        state.smoothedIntensity;
                    link.material.uniforms.uRippleAmplitude.value = 
                        state.rippleAmplitude;
                    link.material.emissive.copy(state.effectiveColor);
                }
            }
            
            // Update all nodes with cascade glows
            for (const node of this.nodes) {
                const state = this.cascadePropagationFX.getNodeCascadeState(node);
                if (state?.totalIntensity > 0) {
                    node.material.emissive.copy(state.effectiveColor);
                    node.material.emissiveIntensity = state.glowAmplification;
                }
            }
        }
        
        onChainReactionEvent(event) {
            // 4. Trigger cascade on chain reaction
            this.cascadePropagationFX.triggerCascade(event.node, event.intensity, {
                harmonicMultiplier: event.resonance,
                color: event.color,
                maxHops: event.hops
            });
        }
        
        dispose() {
            // 5. Clean up cascade FX
            this.cascadePropagationFX?.dispose?.();
            super.dispose();
        }
    }
}

// ============================================================================
// END OF SNIPPETS
// ============================================================================

export const WEEK25_CASCADE_FX_SNIPPETS = {
    description: 'Copy-paste examples for CascadePropagationFX_v1 integration'
};
