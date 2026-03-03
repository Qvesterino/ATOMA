/**
 * Surface Phase Ripples for Braided Links — Working Examples
 * ============================================================================
 * Copy-paste integration patterns for applying ripples to link materials.
 */

import { LinkSurfacePhaseRipples } from './LinkSurfacePhaseRipples.js';

// ============================================================================
// 1. SETUP & INITIALIZATION
// ============================================================================

/**
 * Initialize global ripple system
 */
export function initializeRippleSystem() {
    const rippleSystem = new LinkSurfacePhaseRipples();
    console.log('✅ Surface ripple system initialized');
    return rippleSystem;
}

/**
 * Initialize ripples for a link
 */
export function initializeRipplesForLink(link, rippleSystem) {
    rippleSystem.initializeLink(link);
    console.log(`✅ Ripples initialized for link ${link.id}`);
}

/**
 * Update loop for all links
 */
export function updateRipplesForAllLinks(allLinks, rippleSystem, deltaTime = 0.016) {
    allLinks.forEach(link => {
        if (link.isActive) {
            const metrics = link.getMetrics();
            rippleSystem.update(link, metrics, deltaTime);
        }
    });
}

/**
 * Render loop for all links
 */
export function renderRipplesForAllLinks(allLinks, rippleSystem) {
    allLinks.forEach(link => {
        if (link.mesh && link.mesh.material) {
            const metrics = link.getMetrics();
            rippleSystem.applyRipplesToMaterial(link, link.mesh.material, metrics);
        }
    });
}

// ============================================================================
// 2. MATERIAL & SHADER INTEGRATION
// ============================================================================

/**
 * Prepare link material for ripples
 * Adds required uniforms to existing material
 */
export function prepareLinkatMaterialForRipples(material) {
    if (!material.uniforms) {
        console.warn('Material lacks uniforms, skipping ripple preparation');
        return false;
    }

    // Add ripple uniforms if missing
    if (!material.uniforms.u_rippleIntensity) {
        material.uniforms.u_rippleIntensity = { value: 0.0 };
    }
    if (!material.uniforms.u_ripplesActive) {
        material.uniforms.u_ripplesActive = { value: 0 };
    }
    if (!material.uniforms.u_hueShift) {
        material.uniforms.u_hueShift = { value: 0.0 };
    }
    if (!material.uniforms.u_rippleSaturation) {
        material.uniforms.u_rippleSaturation = { value: 0.5 };
    }

    console.log('✅ Material prepared for ripples');
    return true;
}

/**
 * Example shader code for ripples
 * Add to your link material's fragment shader
 */
export const RIPPLE_SHADER_FRAGMENT = `
// Ripple uniforms
uniform float u_rippleIntensity;
uniform int u_ripplesActive;
uniform float u_hueShift;
uniform float u_rippleSaturation;

// Function to convert RGB to HSL
vec3 rgbToHsl(vec3 rgb) {
    float maxC = max(rgb.r, max(rgb.g, rgb.b));
    float minC = min(rgb.r, min(rgb.g, rgb.b));
    float l = (maxC + minC) / 2.0;
    
    if (maxC == minC) {
        return vec3(0.0, 0.0, l); // Achromatic
    }
    
    float d = maxC - minC;
    float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
    
    float h = 0.0;
    if (maxC == rgb.r) {
        h = mod((rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6.0 : 0.0), 6.0) / 6.0;
    } else if (maxC == rgb.g) {
        h = ((rgb.b - rgb.r) / d + 2.0) / 6.0;
    } else {
        h = ((rgb.r - rgb.g) / d + 4.0) / 6.0;
    }
    
    return vec3(h, s, l);
}

// Function to convert HSL to RGB
vec3 hslToRgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c / 2.0;
    
    vec3 rgb;
    if (h < 1.0/6.0) {
        rgb = vec3(c, x, 0.0);
    } else if (h < 2.0/6.0) {
        rgb = vec3(x, c, 0.0);
    } else if (h < 3.0/6.0) {
        rgb = vec3(0.0, c, x);
    } else if (h < 4.0/6.0) {
        rgb = vec3(0.0, x, c);
    } else if (h < 5.0/6.0) {
        rgb = vec3(x, 0.0, c);
    } else {
        rgb = vec3(c, 0.0, x);
    }
    
    return rgb + m;
}

void main() {
    // ... existing shader code ...
    
    // Apply ripple modulation
    vec3 finalColor = gl_FragColor.rgb;
    
    if (u_ripplesActive > 0.5) {
        // Emissive modulation
        vec3 emissive = finalColor;
        emissive *= (1.0 + u_rippleIntensity * 0.5);
        
        // Optional hue shift
        vec3 hsl = rgbToHsl(emissive);
        hsl.x += u_hueShift / 360.0;
        emissive = hslToRgb(hsl);
        
        // Blend with ripple saturation
        finalColor = mix(finalColor, emissive, u_rippleSaturation);
    }
    
    gl_FragColor.rgb = finalColor;
}
`;

// ============================================================================
// 3. INTEGRATION EXAMPLES
// ============================================================================

/**
 * EXAMPLE 1: Basic Ripple Application
 * ──────────────────────────────────
 * Apply ripples to a single link
 */
export function applyRipplesToLink(link, rippleSystem, metrics) {
    if (!link.mesh || !link.mesh.material) return;

    // Get ripple modulation
    const emissive = rippleSystem.getEmissiveModulation(link, metrics);
    const hueShift = rippleSystem.getHueShiftModulation(link, metrics);

    // Apply to material
    if (link.mesh.material.uniforms) {
        link.mesh.material.uniforms.u_rippleIntensity.value = emissive.intensity;
        link.mesh.material.uniforms.u_hueShift.value = hueShift.hueShift;
        link.mesh.material.uniforms.u_rippleSaturation.value = hueShift.saturation;
        link.mesh.material.uniforms.u_ripplesActive.value = emissive.factor > 0.1 ? 1 : 0;
    }

    console.debug(`[Ripples] ${link.id}: intensity=${emissive.intensity.toFixed(4)}, hue=${hueShift.hueShift.toFixed(2)}°`);
}

/**
 * EXAMPLE 2: Batch Ripple Application
 * ────────────────────────────────────
 * Apply ripples to all active links
 */
export function applyRipplesToAllActiveLinks(allLinks, rippleSystem) {
    let appliedCount = 0;

    allLinks.forEach(link => {
        if (!link.isActive || !link.mesh?.material) return;

        const metrics = link.getMetrics();
        rippleSystem.applyRipplesToMaterial(link, link.mesh.material, metrics);
        appliedCount++;
    });

    console.debug(`[Ripples] Applied to ${appliedCount} links`);
}

/**
 * EXAMPLE 3: Ripple Intensity Control
 * ────────────────────────────────────
 * Apply ripples with custom intensity scaling
 */
export function applyRipplesWithCustomIntensity(link, rippleSystem, metrics, customScale = 1.0) {
    if (!link.mesh?.material?.uniforms) return;

    const emissive = rippleSystem.getEmissiveModulation(link, metrics);
    const hueShift = rippleSystem.getHueShiftModulation(link, metrics);

    // Apply custom scaling
    const scaledIntensity = emissive.intensity * customScale;
    const scaledHueShift = hueShift.hueShift * customScale;

    link.mesh.material.uniforms.u_rippleIntensity.value = scaledIntensity;
    link.mesh.material.uniforms.u_hueShift.value = scaledHueShift;
    link.mesh.material.uniforms.u_rippleSaturation.value = hueShift.saturation * customScale;
}

/**
 * EXAMPLE 4: Ripple State Responsive
 * ──────────────────────────────────
 * Apply ripples with state-based intensity
 */
export function applyRipplesStateResponsive(link, rippleSystem, metrics) {
    if (!link.mesh?.material?.uniforms) return;

    const emissive = rippleSystem.getEmissiveModulation(link, metrics);
    const synergy = metrics.synergy || 0.3;
    const harmony = metrics.harmony || 0.5;
    const corruption = metrics.corruption || 0.0;

    // Boost intensity based on state
    let stateMultiplier = 1.0;

    if (corruption > 0.5) {
        // Under stress, make ripples more visible (warning indicator)
        stateMultiplier = 1.3;
    } else if (harmony > 0.7 && synergy > 0.6) {
        // Healthy state, subtle ripples
        stateMultiplier = 0.8;
    }

    const scaledIntensity = emissive.intensity * stateMultiplier;

    link.mesh.material.uniforms.u_rippleIntensity.value = scaledIntensity;
}

/**
 * EXAMPLE 5: Debug Ripple Visualization
 * ──────────────────────────────────────
 * Visualize ripple pattern for debugging
 */
export function visualizeRipplePattern(link, rippleSystem, samples = 32) {
    const ripples = rippleSystem.getRippleVisualization(link, samples);

    console.group(`Ripple Pattern: ${link.id}`);
    console.log(`Total samples: ${samples}`);

    // Show pattern as ASCII graph
    let graph = '';
    ripples.forEach((sample, i) => {
        const barLength = Math.round((sample.wave + 1) / 2 * 20);
        const bar = '█'.repeat(barLength);
        if (i % 4 === 0) {
            graph += `${i.toString().padEnd(3)} | ${bar}\n`;
        }
    });

    console.log(graph);
    console.groupEnd();

    return ripples;
}

// ============================================================================
// 4. TESTING UTILITIES
// ============================================================================

export const SurfaceRipplesTestUtils = {
    /**
     * Test ripple behavior with varying synergy
     */
    testSynergyEffect(link, rippleSystem, durationSeconds = 10) {
        console.log(`🧪 Testing synergy effect for ${durationSeconds}s`);

        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 0.1;

            // Ramp synergy up and down
            const synergy = Math.sin(elapsed / durationSeconds * Math.PI) * 0.5 + 0.5;

            const metrics = { synergy, harmony: 0.5, corruption: 0.0, instability: 0.0 };
            rippleSystem.update(link, metrics, 0.1);

            const emissive = rippleSystem.getEmissiveModulation(link, metrics);
            const blendFactor = rippleSystem.getRippleBlendFactor(link, metrics);

            if (Math.floor(elapsed * 10) % 10 === 0) {
                console.log(`  ${elapsed.toFixed(1)}s: synergy=${synergy.toFixed(2)}, intensity=${emissive.intensity.toFixed(4)}, blend=${blendFactor.toFixed(3)}`);
            }

            if (elapsed >= durationSeconds) {
                clearInterval(interval);
                console.log(`✅ Synergy test complete`);
            }
        }, 100);
    },

    /**
     * Test ripple behavior with varying harmony
     */
    testHarmonyEffect(link, rippleSystem, durationSeconds = 10) {
        console.log(`🧪 Testing harmony effect for ${durationSeconds}s`);

        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 0.1;

            // Ramp harmony up and down
            const harmony = Math.sin(elapsed / durationSeconds * Math.PI) * 0.5 + 0.5;

            const metrics = { synergy: 0.5, harmony, corruption: 0.0, instability: 0.0 };
            rippleSystem.update(link, metrics, 0.1);

            const debugInfo = rippleSystem.getDebugInfo(link);

            if (Math.floor(elapsed * 10) % 10 === 0) {
                console.log(`  ${elapsed.toFixed(1)}s: harmony=${harmony.toFixed(2)}, smoothing=${debugInfo.harmonySmoothingFactor.toFixed(3)}`);
            }

            if (elapsed >= durationSeconds) {
                clearInterval(interval);
                console.log(`✅ Harmony test complete`);
            }
        }, 100);
    },

    /**
     * Test ripple behavior with corruption
     */
    testCorruptionEffect(link, rippleSystem, durationSeconds = 10) {
        console.log(`🧪 Testing corruption effect for ${durationSeconds}s`);

        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 0.1;

            // Ramp corruption up and down
            const corruption = Math.sin(elapsed / durationSeconds * Math.PI) * 0.5 + 0.25;

            const metrics = { synergy: 0.5, harmony: 0.5, corruption, instability: 0.0 };
            rippleSystem.update(link, metrics, 0.1);

            const emissive = rippleSystem.getEmissiveModulation(link, metrics);

            if (Math.floor(elapsed * 10) % 10 === 0) {
                console.log(`  ${elapsed.toFixed(1)}s: corruption=${corruption.toFixed(2)}, jitter=${Math.abs(emissive.baseWave).toFixed(3)}`);
            }

            if (elapsed >= durationSeconds) {
                clearInterval(interval);
                console.log(`✅ Corruption test complete`);
            }
        }, 100);
    },

    /**
     * Test all ripple getters
     */
    testAllGetters(link, rippleSystem, metrics = {}) {
        console.log(`🧪 Testing all ripple getters`);

        const defaultMetrics = { synergy: 0.6, harmony: 0.7, corruption: 0.1, instability: 0.2, ...metrics };

        const tests = [
            { name: 'getEmissiveModulation', fn: () => rippleSystem.getEmissiveModulation(link, defaultMetrics) },
            { name: 'getHueShiftModulation', fn: () => rippleSystem.getHueShiftModulation(link, defaultMetrics) },
            { name: 'getRippleBlendFactor', fn: () => rippleSystem.getRippleBlendFactor(link, defaultMetrics) },
            { name: 'getRippleVisualization', fn: () => rippleSystem.getRippleVisualization(link, 16) },
            { name: 'getDebugInfo', fn: () => rippleSystem.getDebugInfo(link) },
        ];

        tests.forEach(test => {
            try {
                const result = test.fn();
                console.log(`  ✅ ${test.name}: ${JSON.stringify(result).substring(0, 60)}...`);
            } catch (e) {
                console.error(`  ❌ ${test.name}: ${e.message}`);
            }
        });
    },
};

// ============================================================================
// 5. DEBUG UTILITIES
// ============================================================================

/**
 * Debug HUD for ripple state
 */
export class RippleDebugHUD {
    constructor(hudElement) {
        this.hudElement = hudElement;
        this.selectedLink = null;
        this.rippleSystem = null;
    }

    setSelectedLink(link, rippleSystem) {
        this.selectedLink = link;
        this.rippleSystem = rippleSystem;
    }

    update() {
        if (!this.selectedLink?.rippleState || !this.rippleSystem) return;

        const debugInfo = this.rippleSystem.getDebugInfo(this.selectedLink);
        const metrics = this.selectedLink.getMetrics();
        const emissive = this.rippleSystem.getEmissiveModulation(this.selectedLink, metrics);
        const blend = this.rippleSystem.getRippleBlendFactor(this.selectedLink, metrics);

        let html = `
        <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
            <h3 style="margin: 0 0 10px 0;">🌊 Surface Ripples</h3>
            <div style="background: #1a1a1a; padding: 10px; border-radius: 4px;">
                <div><strong>Phase State:</strong></div>
                <div>  Surface: ${(debugInfo.surfacePhase * 100).toFixed(1)}%</div>
                <div>  Angular: ${(debugInfo.angularPhase / Math.PI / 2 * 100).toFixed(1)}%</div>
                <div>  Combined: ${(debugInfo.phaseOffset / Math.PI / 2 * 100).toFixed(1)}%</div>
                
                <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
                    <strong>Modulation:</strong>
                    <div>  Emissive: ${emissive.intensity.toFixed(4)}</div>
                    <div>  Factor: ${emissive.factor.toFixed(3)}</div>
                    <div>  Damping: ${emissive.damping.toFixed(3)}</div>
                </div>
                
                <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
                    <strong>State Drivers:</strong>
                    <div>  Synergy: ${(metrics.synergy * 100).toFixed(0)}%</div>
                    <div>  Harmony: ${(metrics.harmony * 100).toFixed(0)}%</div>
                    <div>  Corruption: ${(metrics.corruption * 100).toFixed(0)}%</div>
                    <div>  Instability: ${(metrics.instability * 100).toFixed(0)}%</div>
                </div>
                
                <div style="margin-top: 8px; border-top: 1px solid #333; padding-top: 8px;">
                    <strong>Visibility:</strong>
                    <div>  Blend Factor: ${(blend * 100).toFixed(1)}%</div>
                    <div>  Active: ${debugInfo.amplitudeDamping > 0.1 ? '✅ YES' : '❌ NO'}</div>
                </div>
            </div>
        </div>
        `;

        this.hudElement.innerHTML = html;
    }
}

/**
 * Export ripple state to JSON
 */
export function exportRippleState(link, rippleSystem) {
    const metrics = link.getMetrics();
    const emissive = rippleSystem.getEmissiveModulation(link, metrics);
    const hueShift = rippleSystem.getHueShiftModulation(link, metrics);

    return {
        link: {
            id: link.id,
            isActive: link.isActive,
            metrics,
        },
        ripple: rippleSystem.getDebugInfo(link),
        modulation: {
            emissive,
            hueShift,
            blendFactor: rippleSystem.getRippleBlendFactor(link, metrics),
        },
        timestamp: Date.now(),
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const SurfaceRipplesSystemExports = {
    // Setup
    initializeRippleSystem,
    initializeRipplesForLink,
    updateRipplesForAllLinks,
    renderRipplesForAllLinks,

    // Material preparation
    prepareLinkatMaterialForRipples,
    RIPPLE_SHADER_FRAGMENT,

    // Integration examples
    applyRipplesToLink,
    applyRipplesToAllActiveLinks,
    applyRipplesWithCustomIntensity,
    applyRipplesStateResponsive,
    visualizeRipplePattern,

    // Testing
    SurfaceRipplesTestUtils,

    // Debugging
    RippleDebugHUD,
    exportRippleState,
};

export default SurfaceRipplesSystemExports;
