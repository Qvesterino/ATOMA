/**
 * WEEK 23: SYNERGY TRAVELING WAVE FX - CODE SNIPPETS & EXAMPLES
 * 
 * Copy-paste ready code examples for common use cases and patterns.
 * All examples are production-ready and follow best practices.
 */

// ============================================================================
// SECTION 1: INITIALIZATION & SETUP
// ============================================================================

/**
 * Snippet 1.1: Basic Initialization
 * 
 * Creates a minimal traveling wave FX system with default settings.
 */
export function initializeBasicWaveFX() {
    import { SynergyTravelingWaveFX_v1 } from './SynergyTravelingWaveFX_v1.js';
    
    const waveFX = new SynergyTravelingWaveFX_v1({
        debugEnabled: false
    });
    
    return waveFX;
}


/**
 * Snippet 1.2: Initialization with Custom Config
 * 
 * Creates wave FX with custom speed and intensity settings.
 */
export function initializeCustomWaveFX(speedBase, intensityBase) {
    const waveFX = new SynergyTravelingWaveFX_v1({
        debugEnabled: false,
        waveSpeedBase: speedBase || 4.0,
        waveIntensityBase: intensityBase || 1.0
    });
    
    return waveFX;
}


/**
 * Snippet 1.3: Initialization with Debug Logging
 * 
 * Enables console logging for development/debugging.
 */
export function initializeDebugWaveFX() {
    const waveFX = new SynergyTravelingWaveFX_v1({
        debugEnabled: true,
        waveSpeedBase: 4.0,
        waveIntensityBase: 1.0
    });
    
    console.log('Wave FX initialized with debug logging enabled');
    return waveFX;
}


// ============================================================================
// SECTION 2: MATERIAL REGISTRATION
// ============================================================================

/**
 * Snippet 2.1: Register Single Link Material
 * 
 * Registers a link material for positive synergy waves.
 */
export function registerLinkMaterial(waveFX, linkMaterial) {
    waveFX.registerMaterial(linkMaterial, {
        type: 'link',
        polarity: 'positive'
    });
}


/**
 * Snippet 2.2: Register All Link Materials
 * 
 * Registers all links in network for wave effects.
 */
export function registerAllLinkMaterials(waveFX, allLinks) {
    for (const link of allLinks) {
        try {
            waveFX.registerMaterial(link.material, {
                type: 'link',
                polarity: 'positive'
            });
        } catch (err) {
            console.warn(`Failed to register link material:`, err);
        }
    }
    
    console.log(`Registered ${allLinks.length} link materials`);
}


/**
 * Snippet 2.3: Register with Polarity Detection
 * 
 * Registers material with polarity based on link properties.
 */
export function registerMaterialWithPolarity(waveFX, material, linkData) {
    // Determine polarity based on link properties
    let polarity = 'positive';  // default
    
    if (linkData.corrupted) {
        polarity = 'corrupted';
    } else if (linkData.isResonant) {
        polarity = 'resonance';
    } else if (linkData.isNegative) {
        polarity = 'negative';
    }
    
    waveFX.registerMaterial(material, {
        type: 'link',
        polarity: polarity
    });
    
    return polarity;
}


/**
 * Snippet 2.4: Register Node Aura Materials
 * 
 * Registers node aura materials for cascade node effects.
 */
export function registerNodeAuraMaterials(waveFX, allNodes) {
    for (const node of allNodes) {
        try {
            if (node.auraMaterial) {
                waveFX.registerMaterial(node.auraMaterial, {
                    type: 'node',
                    polarity: 'resonance'
                });
            }
        } catch (err) {
            // Skip nodes without aura
        }
    }
}


// ============================================================================
// SECTION 3: WAVE TRIGGERING
// ============================================================================

/**
 * Snippet 3.1: Simple Wave Trigger
 * 
 * Triggers a basic wave with default parameters.
 */
export function triggerSimpleWave(waveFX, linkMaterial) {
    waveFX.triggerWave(linkMaterial, depth=0, synergyLevel=0.5, duration=1.0);
}


/**
 * Snippet 3.2: Wave Trigger with Cascade Data
 * 
 * Triggers wave using actual cascade event data.
 */
export function triggerWaveFromCascadeEvent(waveFX, link, cascadeData) {
    const {
        depth = 0,
        synergyLevel = 0.5,
        cascadeSourceNode = null
    } = cascadeData;
    
    // Duration increases with depth (deeper cascades last longer)
    const duration = 0.6 + (depth * 0.1);
    
    waveFX.triggerWave(link.material, depth, synergyLevel, duration);
}


/**
 * Snippet 3.3: Wave Trigger with Dynamic Duration
 * 
 * Duration based on link length and synergy level.
 */
export function triggerWaveWithDynamicDuration(waveFX, link, depth, synergyLevel) {
    // Base duration on link length
    const linkLength = link.length || 1.0;
    const speedFactor = 4.0;  // units/sec
    const baseDuration = linkLength / speedFactor;
    
    // Adjust by synergy level
    const duration = baseDuration * (0.5 + synergyLevel * 1.0);
    
    waveFX.triggerWave(link.material, depth, synergyLevel, duration);
}


/**
 * Snippet 3.4: Batch Wave Triggering
 * 
 * Trigger waves on multiple links simultaneously.
 */
export function triggerBatchWaves(waveFX, links, depth, synergyLevel) {
    const duration = 0.6 + (depth * 0.1);
    
    for (const link of links) {
        try {
            waveFX.triggerWave(link.material, depth, synergyLevel, duration);
        } catch (err) {
            console.warn('Wave trigger failed for link:', err);
        }
    }
    
    console.log(`Triggered ${links.length} waves at depth ${depth}`);
}


/**
 * Snippet 3.5: Sequential Wave Triggering (Cascade Visualization)
 * 
 * Trigger waves in sequence to visualize cascade propagation.
 */
export function triggerSequentialWaves(waveFX, cascadePath, synergyLevel) {
    const staggerMs = 100;  // 100ms between waves
    
    for (let i = 0; i < cascadePath.length; i++) {
        const link = cascadePath[i];
        const delay = i * staggerMs;
        
        setTimeout(() => {
            const depth = i;
            const adjustedSynergy = synergyLevel * (1.0 - (i * 0.1));  // Decrease with depth
            const duration = 0.6 + (depth * 0.1);
            
            waveFX.triggerWave(link.material, depth, adjustedSynergy, duration);
        }, delay);
    }
}


/**
 * Snippet 3.6: Wave Trigger with Polarity Adaptation
 * 
 * Adjust wave parameters based on synergy quality.
 */
export function triggerAdaptiveWave(waveFX, link, depth, synergyLevel) {
    let polarity = 'positive';
    let intensity = synergyLevel;
    
    if (synergyLevel < 0.3) {
        polarity = 'corrupted';
        intensity = 0.4;  // Reduced intensity for corrupted
    } else if (synergyLevel < 0.6) {
        polarity = 'negative';
        intensity = 0.6;
    } else if (synergyLevel > 0.85) {
        polarity = 'resonance';
        intensity = 1.0;
    }
    
    // Re-register if polarity changed
    waveFX.registerMaterial(link.material, {
        type: 'link',
        polarity: polarity
    });
    
    // Trigger with adjusted intensity
    const duration = 0.6 + (depth * 0.1);
    waveFX.triggerWave(link.material, depth, intensity, duration);
    
    return polarity;
}


// ============================================================================
// SECTION 4: PARAMETER ADJUSTMENT
// ============================================================================

/**
 * Snippet 4.1: Set Wave Speed from Synergy
 * 
 * Map synergy level to wave speed (2–8 units/sec range).
 */
export function setSpeedFromSynergy(waveFX, material, synergyLevel) {
    const speed = 2.0 + (synergyLevel * 6.0);  // 2–8 range
    waveFX.setWaveSpeed(material, speed);
}


/**
 * Snippet 4.2: Modulate Intensity by Network Mood
 * 
 * Adjust wave intensity based on network resonance state.
 */
export function modulateIntensityByMood(waveFX, allMaterials, networkMood) {
    const moodIntensity = networkMood.resonantLevel || 0.5;
    
    for (const material of allMaterials) {
        waveFX.setWaveIntensity(material, moodIntensity);
    }
}


/**
 * Snippet 4.3: Set Polarity-Based Color
 * 
 * Set wave color based on polarity type.
 */
export function setColorByPolarity(waveFX, material, polarity) {
    const colors = {
        'positive': new THREE.Color(0x00ff00),    // Green
        'negative': new THREE.Color(0xff00ff),    // Magenta
        'resonance': new THREE.Color(0x0080ff),   // Blue
        'corrupted': new THREE.Color(0xff0000)    // Red
    };
    
    const color = colors[polarity] || colors['positive'];
    waveFX.setWaveColor(material, color);
}


/**
 * Snippet 4.4: Dynamic Speed Adjustment
 * 
 * Update wave speed smoothly over time.
 */
export function adjustSpeedSmoothly(waveFX, material, targetSpeed, duration = 1.0) {
    const startSpeed = 4.0;
    const startTime = performance.now();
    
    const updateSpeed = () => {
        const elapsed = (performance.now() - startTime) / 1000.0;
        const progress = Math.min(1, elapsed / duration);
        
        const currentSpeed = startSpeed + (targetSpeed - startSpeed) * progress;
        waveFX.setWaveSpeed(material, currentSpeed);
        
        if (progress < 1) {
            requestAnimationFrame(updateSpeed);
        }
    };
    
    updateSpeed();
}


/**
 * Snippet 4.5: Pulsing Wave Intensity
 * 
 * Create pulsing effect by modulating intensity.
 */
export function pulseWaveIntensity(waveFX, material, frequency = 2.0, duration = null) {
    const startTime = performance.now();
    const endTime = duration ? startTime + (duration * 1000) : Infinity;
    
    const pulse = () => {
        const now = performance.now();
        
        if (now > endTime) return;  // Stop pulsing after duration
        
        const elapsed = (now - startTime) / 1000.0;
        const phase = elapsed * frequency * Math.PI * 2;
        const intensity = 0.5 + 0.5 * Math.sin(phase);
        
        waveFX.setWaveIntensity(material, intensity);
        
        requestAnimationFrame(pulse);
    };
    
    pulse();
}


/**
 * Snippet 4.6: Set Propagation Direction
 * 
 * Set wave to travel forward or backward.
 */
export function setWaveDirection(waveFX, material, direction) {
    // direction: 'forward' or 'backward', or numeric (+1 or -1)
    const numDirection = (direction === 'forward' || direction > 0) ? 1 : -1;
    waveFX.setPropagationDirection(material, numDirection);
}


/**
 * Snippet 4.7: Reverse Wave Direction
 * 
 * Toggle wave direction.
 */
export function reverseWaveDirection(waveFX, material) {
    // Get current direction and reverse it
    const currentDirection = 1.0;  // Assume forward
    const newDirection = -currentDirection;
    waveFX.setPropagationDirection(material, newDirection);
}


// ============================================================================
// SECTION 5: ANIMATION LOOP INTEGRATION
// ============================================================================

/**
 * Snippet 5.1: Basic Update Loop
 * 
 * Minimal animation loop with wave updates.
 */
export function setupBasicAnimationLoop(waveFX, renderer, scene, camera, clock) {
    const animate = () => {
        const deltaTime = clock.getDelta();
        
        // Update waves
        waveFX.update(deltaTime);
        
        // Render scene
        renderer.render(scene, camera);
        
        requestAnimationFrame(animate);
    };
    
    animate();
}


/**
 * Snippet 5.2: Animation Loop with Performance Monitoring
 * 
 * Update loop with metrics logging.
 */
export function setupMonitoredAnimationLoop(waveFX, renderer, scene, camera, clock) {
    let frameCount = 0;
    let totalTime = 0;
    let maxTime = 0;
    
    const animate = () => {
        const startTime = performance.now();
        const deltaTime = clock.getDelta();
        
        // Update waves
        waveFX.update(deltaTime);
        
        // Track metrics
        const elapsed = performance.now() - startTime;
        totalTime += elapsed;
        maxTime = Math.max(maxTime, elapsed);
        frameCount++;
        
        // Log every 60 frames
        if (frameCount % 60 === 0) {
            const avgTime = totalTime / frameCount;
            const metrics = waveFX.getMetrics();
            
            console.log(`Wave FX: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms, active=${metrics.activeMaterialCount}`);
            
            totalTime = 0;
            maxTime = 0;
            frameCount = 0;
        }        
        // Render scene
        renderer.render(scene, camera);
        
        requestAnimationFrame(animate);
    };
    
    animate();
}


/**
 * Snippet 5.3: Animation Loop with Cascade Integration
 * 
 * Update loop that responds to cascade events.
 */
export function setupCascadeIntegratedLoop(waveFX, chainReaction, renderer, scene, camera, clock) {
    const animate = () => {
        const deltaTime = clock.getDelta();
        
        // Update wave effects
        waveFX.update(deltaTime);
        
        // Check for new cascade events
        const reactions = chainReaction.getActiveReactions?.();
        if (reactions && reactions.linkEvents) {
            for (const linkEvent of reactions.linkEvents) {
                // Trigger wave for each link event
                waveFX.triggerWave(
                    linkEvent.link?.material,
                    linkEvent.hopIndex || 0,
                    linkEvent.intensity || 0.5,
                    0.6 + (linkEvent.hopIndex || 0) * 0.1
                );
            }
        }
        
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };
    
    animate();
}


// ============================================================================
// SECTION 6: PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * Snippet 6.1: Batch Register High-Performance Mode
 * 
 * Register materials with simplified polarity for mobile/low-end.
 */
export function registerMaterialsBatch(waveFX, materials, lowPerformanceMode = false) {
    const polarity = lowPerformanceMode ? 'positive' : 'resonance';  // Positive cheaper
    
    for (const material of materials) {
        try {
            waveFX.registerMaterial(material, {
                type: 'link',
                polarity: polarity
            });
        } catch (err) {
            // Continue on error
        }
    }
    
    console.log(`Registered ${materials.length} materials (perf: ${lowPerformanceMode ? 'low' : 'high'})`);
}


/**
 * Snippet 6.2: Throttle Wave Triggering
 * 
 * Limit wave triggers to prevent excessive GPU load.
 */
export function createThrottledWaveTrigger(waveFX, minIntervalMs = 50) {
    let lastTriggerTime = 0;
    
    return (material, depth, synergyLevel) => {
        const now = performance.now();
        
        if (now - lastTriggerTime > minIntervalMs) {
            waveFX.triggerWave(material, depth, synergyLevel);
            lastTriggerTime = now;
            return true;
        }
        
        return false;  // Throttled
    };
}


/**
 * Snippet 6.3: Monitor and Adapt Performance
 * 
 * Automatically reduce quality if performance drops.
 */
export function setupPerformanceAdaptation(waveFX, targetFrameTime = 16.67) {  // 60 FPS
    let shouldReduceQuality = false;
    
    const checkPerformance = () => {
        const metrics = waveFX.getMetrics();
        
        if (metrics.lastUpdateTime > targetFrameTime) {
            if (!shouldReduceQuality) {
                console.warn('Performance warning: reducing wave quality');
                shouldReduceQuality = true;
                
                // Could further reduce wave quality here
                // e.g., use cheaper polarity types, reduce intensity
            }
        } else if (shouldReduceQuality && metrics.lastUpdateTime < targetFrameTime * 0.5) {
            console.log('Performance recovered: restoring wave quality');
            shouldReduceQuality = false;
        }
    };
    
    setInterval(checkPerformance, 1000);  // Check every 1 second
}


// ============================================================================
// SECTION 7: CLEANUP & DISPOSAL
// ============================================================================

/**
 * Snippet 7.1: Safe Cleanup
 * 
 * Properly dispose wave FX on scene cleanup.
 */
export function cleanupWaveFX(waveFX) {
    if (waveFX) {
        try {
            waveFX.dispose();
            console.log('Wave FX disposed successfully');
        } catch (err) {
            console.error('Wave FX disposal error:', err);
        }
    }
}


/**
 * Snippet 7.2: Full Scene Cleanup
 * 
 * Complete cleanup including wave FX and Three.js resources.
 */
export function fullSceneCleanup(waveFX, renderer, scene, materials, geometries) {
    // Cleanup wave FX
    if (waveFX) {
        waveFX.dispose();
    }
    
    // Cleanup Three.js resources
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                object.material.dispose();
            }
        });
        scene.clear();
    }
    
    if (renderer) {
        renderer.dispose();
    }
    
    console.log('Full scene cleanup complete');
}


/**
 * Snippet 7.3: Window Unload Handler
 * 
 * Cleanup when page unloads.
 */
export function setupUnloadHandler(waveFX, renderer) {
    window.addEventListener('beforeunload', () => {
        if (waveFX) {
            waveFX.dispose();
        }
        if (renderer) {
            renderer.dispose();
        }
    });
    
    window.addEventListener('unload', () => {
        console.log('Page unloading, resources cleaned');
    });
}


// ============================================================================
// SECTION 8: DEBUGGING & METRICS
// ============================================================================

/**
 * Snippet 8.1: Enable Debug Logging
 * 
 * Create debug version with console output.
 */
export function createDebugWaveFX() {
    const waveFX = new SynergyTravelingWaveFX_v1({
        debugEnabled: true
    });
    
    console.log('Debug Wave FX created - monitor console for output');
    return waveFX;
}


/**
 * Snippet 8.2: Performance Dashboard
 * 
 * Create simple performance monitoring display.
 */
export function createPerformanceDashboard(waveFX) {
    const dashboard = document.createElement('div');
    dashboard.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: #0f0;
        font-family: monospace;
        padding: 10px;
        font-size: 12px;
        z-index: 999;
    `;
    
    document.body.appendChild(dashboard);
    
    setInterval(() => {
        const metrics = waveFX.getMetrics();
        dashboard.innerHTML = `
            Wave FX Metrics<br>
            Time: ${metrics.lastUpdateTime.toFixed(2)}ms<br>
            Active: ${metrics.activeMaterialCount}<br>
            Global Time: ${metrics.globalTime.toFixed(1)}s
        `;
    }, 100);
}


/**
 * Snippet 8.3: Metrics Logging
 * 
 * Log detailed metrics periodically.
 */
export function startMetricsLogging(waveFX, intervalMs = 2000) {
    const logMetrics = () => {
        const metrics = waveFX.getMetrics();
        
        console.group('Wave FX Metrics');
        console.log('Update Time (ms):', metrics.lastUpdateTime.toFixed(3));
        console.log('Active Materials:', metrics.activeMaterialCount);
        console.log('Processed This Frame:', metrics.processedMaterialsThisFrame);
        console.log('Global Time (s):', metrics.globalTime.toFixed(2));
        console.groupEnd();
    };
    
    setInterval(logMetrics, intervalMs);
}


// ============================================================================
// SECTION 9: INTEGRATION PATTERNS
// ============================================================================

/**
 * Snippet 9.1: Integration with SynergyCascadeFXBridge
 * 
 * Use cascade bridge to trigger waves on events.
 */
export function integrateCascadeBridge(waveFX, cascadeBridge, network) {
    // Hook into cascade event system
    // (This pattern will be used in Week 24 integration)
    
    const originalTriggerWave = cascadeBridge.triggerWaveEffect;
    
    cascadeBridge.triggerWaveEffect = function(link, depth, intensity) {
        // Call original if exists
        if (originalTriggerWave) {
            originalTriggerWave.call(this, link, depth, intensity);
        }
        
        // Also trigger traveling wave
        waveFX.triggerWave(
            link.material,
            depth,
            intensity,
            0.6 + (depth * 0.1)
        );
    };
}


/**
 * Snippet 9.2: Integration with ResonanceFeedback
 * 
 * Use network mood to modulate waves.
 */
export function integrateResonanceFeedback(waveFX, resonanceFeedback, allMaterials) {
    const updateWavesFromMood = () => {
        const mood = resonanceFeedback.networkMood;
        
        if (mood) {
            // Modulate intensity by mood
            const intensity = mood.resonantLevel || 0.5;
            
            for (const material of allMaterials) {
                waveFX.setWaveIntensity(material, intensity);
            }
        }
    };
    
    // Update waves whenever mood changes
    setInterval(updateWavesFromMood, 100);
}


// ============================================================================
// SECTION 10: EXAMPLES & TEMPLATES
// ============================================================================

/**
 * Snippet 10.1: Complete Basic Example
 * 
 * Minimal working example with all pieces.
 */
export function completeBasicExample(scene, renderer, camera, networkLinks) {
    import { SynergyTravelingWaveFX_v1 } from './SynergyTravelingWaveFX_v1.js';
    
    // Initialize
    const waveFX = new SynergyTravelingWaveFX_v1();
    
    // Register materials
    for (const link of networkLinks) {
        waveFX.registerMaterial(link.material, {
            type: 'link',
            polarity: 'positive'
        });
    }
    
    // Animation loop
    const clock = new THREE.Clock();
    
    const animate = () => {
        const deltaTime = clock.getDelta();
        
        // Update waves
        waveFX.update(deltaTime);
        
        // Render
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };
    
    animate();
    
    // Return handle for testing
    return waveFX;
}


/**
 * Snippet 10.2: Complete Advanced Example
 * 
 * Full example with cascades, monitoring, and cleanup.
 */
export function completeAdvancedExample(scene, renderer, camera, network, chainReaction, resonanceFeedback) {
    import { SynergyTravelingWaveFX_v1 } from './SynergyTravelingWaveFX_v1.js';
    
    // Initialize with custom config
    const waveFX = new SynergyTravelingWaveFX_v1({
        debugEnabled: true,
        waveSpeedBase: 4.0,
        waveIntensityBase: 1.0
    });
    
    // Register all materials
    for (const link of network.allLinks) {
        waveFX.registerMaterial(link.material, {
            type: 'link',
            polarity: 'positive'
        });
    }
    
    // Performance dashboard
    createPerformanceDashboard(waveFX);
    
    // Animation loop with cascade integration
    const clock = new THREE.Clock();
    
    const animate = () => {
        const deltaTime = clock.getDelta();
        
        // Update waves
        waveFX.update(deltaTime);
        
        // Handle cascade events
        const reactions = chainReaction.getActiveReactions?.();
        if (reactions && reactions.linkEvents) {
            for (const linkEvent of reactions.linkEvents) {
                waveFX.triggerWave(
                    linkEvent.link?.material,
                    linkEvent.hopIndex || 0,
                    linkEvent.intensity || 0.5
                );
            }
        }
        
        // Modulate by mood
        const mood = resonanceFeedback?.networkMood;
        if (mood) {
            waveFX.setWaveIntensity(/* all materials */, mood.resonantLevel || 0.5);
        }
        
        // Render
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
        waveFX.dispose();
    });
    
    return waveFX;
}


// ============================================================================
// EXPORTS
// ============================================================================

export {
    initializeBasicWaveFX,
    initializeCustomWaveFX,
    registerLinkMaterial,
    triggerSimpleWave,
    setupBasicAnimationLoop,
    cleanupWaveFX,
    createPerformanceDashboard,
    completeBasicExample,
    completeAdvancedExample
};
