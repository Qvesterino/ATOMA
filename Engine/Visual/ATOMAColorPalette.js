/**
 * ATOMA Color Palette System
 * ============================================================================
 * Unified color definitions and state modifiers for all ATOMA visual systems.
 * Ensures consistent semantic color communication across the engine.
 * 
 * Design Goals:
 * - Semantic colors that instantly communicate node type
 * - State modifiers that visually communicate corruption/harmony/stress
 * - Blend modes for smooth color transitions
 * - Color temperature control for mood modulation
 */

import * as THREE from 'three';

export class ATOMAColorPalette {
    
    // Node Category Colors (Semantic Identification)
    static readonly NODE_COLORS = {
        INPUT: {
            hex: 0x00DDFF,
            name: 'Cyan',
            temp: 'cool',
            brightness: 1.0,
            description: 'Data entry points, external inputs'
        },
        PROCESS: {
            hex: 0xFFAA00,
            name: 'Amber',
            temp: 'warm',
            brightness: 0.9,
            description: 'Processing, computation, transformation'
        },
        STORAGE: {
            hex: 0x88CCFF,
            name: 'Sky',
            temp: 'cool',
            brightness: 0.85,
            description: 'Memory, data persistence, databases'
        },
        INTEGRATION: {
            hex: 0x00FF88,
            name: 'Mint',
            temp: 'cool',
            brightness: 0.95,
            description: 'System integration, API connections'
        },
        ANALYTICS: {
            hex: 0xAA00FF,
            name: 'Purple',
            temp: 'cool',
            brightness: 0.8,
            description: 'Analysis, metrics, data insights'
        },
        CONTROL: {
            hex: 0xFF0088,
            name: 'Pink',
            temp: 'warm',
            brightness: 0.9,
            description: 'Control logic, decision making'
        },
        QUANTUM: {
            hex: 0x00FFFF,
            name: 'Electric',
            temp: 'neutral',
            brightness: 1.1,
            description: 'Quantum computing, advanced systems'
        }
    };
    
    // State Modifiers (Applied to base colors)
    static readonly STATE_MODIFIERS = {
        CORRUPTION: {
            desaturation: 0.7,
            brightness: 0.6,
            redShift: 0.3,
            jitter: 0.15,
            description: 'System corruption, decay, instability'
        },
        HARMONY: {
            saturation: 1.1,
            brightness: 1.15,
            cyanShift: 0.2,
            smoothing: 0.4,
            description: 'System harmony, stabilization, healing'
        },
        STRESS: {
            brightness: 1.25,
            flicker: 0.3,
            speed: 1.8,
            description: 'System stress, overload, high activity'
        },
        HEALING: {
            brightness: 1.1,
            cyanShift: 0.35,
            smoothing: 0.6,
            description: 'Active healing process, recovery'
        },
        COLLAPSE: {
            desaturation: 0.9,
            brightness: 0.4,
            redShift: 0.5,
            description: 'System collapse, critical failure'
        }
    };
    
    // Link Colors (Blended from endpoints)
    static readonly LINK_COLORS = {
        BASE: {
            blendMode: 'lerp',
            blendFactor: 0.5,
            description: 'Base link color (blend of endpoints)'
        },
        FLOW: {
            additive: true,
            brightness: 1.3,
            description: 'Energy flow accent (additive blend)'
        },
        SPARK: {
            brightness: 1.5,
            desaturate: 0.3,
            description: 'Spark particles (bright, desaturated)'
        },
        BEAD: {
            brightness: 1.2,
            additive: true,
            description: 'Connection bead accent'
        }
    };
    
    // Universal Neutral Colors
    static readonly NEUTRAL = {
        WHITE: 0xFFFFFF,
        GREY_LIGHT: 0xCCCCCC,
        GREY: 0x888888,
        GREY_DARK: 0x444444,
        BLACK: 0x000000
    };
    
    /**
     * Get color for node category
     * @param {string} category - Node category name
     * @returns {THREE.Color}
     */
    static getNodeColor(category) {
        const colorData = this.NODE_COLORS[category];
        if (!colorData) {
            console.warn(`[ATOMAColorPalette] Unknown node category: ${category}, using default`);
            return new THREE.Color(0x00DDFF);
        }
        return new THREE.Color(colorData.hex);
    }
    
    /**
     * Apply state modifier to base color
     * @param {THREE.Color} baseColor - Original color
     * @param {string} state - State name (CORRUPTION, HARMONY, STRESS, etc.)
     * @param {number} intensity - Intensity of state effect (0-1)
     * @returns {THREE.Color} Modified color
     */
    static applyStateModifier(baseColor, state, intensity = 1.0) {
        const modifier = this.STATE_MODIFIERS[state];
        if (!modifier) {
            console.warn(`[ATOMAColorPalette] Unknown state modifier: ${state}`);
            return baseColor.clone();
        }
        
        const result = baseColor.clone();
        const i = Math.max(0, Math.min(1, intensity));
        
        // Apply desaturation
        if (modifier.desaturation) {
            const luminance = result.r * 0.299 + result.g * 0.587 + result.b * 0.114;
            const grayscale = new THREE.Color(luminance, luminance, luminance);
            result.lerp(grayscale, modifier.desaturation * i);
        }
        
        // Apply brightness
        if (modifier.brightness) {
            const brightnessFactor = 1.0 + (modifier.brightness - 1.0) * i;
            result.multiplyScalar(brightnessFactor);
        }
        
        // Apply red shift (corruption)
        if (modifier.redShift) {
            const redTint = new THREE.Color(1.0, 0.3, 0.2);
            result.lerp(redTint, modifier.redShift * i);
        }
        
        // Apply cyan shift (harmony)
        if (modifier.cyanShift) {
            const cyanTint = new THREE.Color(0.6, 1.0, 0.9);
            result.lerp(cyanTint, modifier.cyanShift * i);
        }
        
        // Clamp to valid range
        result.r = Math.max(0, Math.min(1, result.r));
        result.g = Math.max(0, Math.min(1, result.g));
        result.b = Math.max(0, Math.min(1, result.b));
        
        return result;
    }
    
    /**
     * Blend two colors for link base
     * @param {THREE.Color} color1 - First endpoint color
     * @param {THREE.Color} color2 - Second endpoint color
     * @param {number} factor - Blend factor (0-1, default 0.5)
     * @returns {THREE.Color} Blended color
     */
    static blendLinkColors(color1, color2, factor = 0.5) {
        const clampedFactor = Math.max(0, Math.min(1, factor));
        return color1.clone().lerp(color2, clampedFactor);
    }
    
    /**
     * Get flow accent color (additive, brighter)
     * @param {THREE.Color} baseColor - Base link color
     * @param {number} brightness - Brightness multiplier (default 1.3)
     * @returns {THREE.Color} Flow accent color
     */
    static getFlowColor(baseColor, brightness = 1.3) {
        const flowColor = baseColor.clone();
        flowColor.multiplyScalar(brightness);
        
        // Clamp to valid range
        flowColor.r = Math.max(0, Math.min(1, flowColor.r));
        flowColor.g = Math.max(0, Math.min(1, flowColor.g));
        flowColor.b = Math.max(0, Math.min(1, flowColor.b));
        
        return flowColor;
    }
    
    /**
     * Get spark particle color (bright, slightly desaturated)
     * @param {THREE.Color} baseColor - Base link color
     * @param {number} brightness - Brightness multiplier (default 1.5)
     * @param {number} desaturate - Desaturation amount (0-1, default 0.3)
     * @returns {THREE.Color} Spark color
     */
    static getSparkColor(baseColor, brightness = 1.5, desaturate = 0.3) {
        const sparkColor = baseColor.clone();
        
        // Desaturate
        const luminance = sparkColor.r * 0.299 + sparkColor.g * 0.587 + sparkColor.b * 0.114;
        const grayscale = new THREE.Color(luminance, luminance, luminance);
        sparkColor.lerp(grayscale, desaturate);
        
        // Brighten
        sparkColor.multiplyScalar(brightness);
        
        // Clamp
        sparkColor.r = Math.max(0, Math.min(1, sparkColor.r));
        sparkColor.g = Math.max(0, Math.min(1, sparkColor.g));
        sparkColor.b = Math.max(0, Math.min(1, sparkColor.b));
        
        return sparkColor;
    }
    
    /**
     * Get bead connection color (additive accent)
     * @param {THREE.Color} baseColor - Base link color
     * @param {number} brightness - Brightness multiplier (default 1.2)
     * @returns {THREE.Color} Bead color
     */
    static getBeadColor(baseColor, brightness = 1.2) {
        const beadColor = baseColor.clone();
        beadColor.multiplyScalar(brightness);
        
        // Clamp
        beadColor.r = Math.max(0, Math.min(1, beadColor.r));
        beadColor.g = Math.max(0, Math.min(1, beadColor.g));
        beadColor.b = Math.max(0, Math.min(1, beadColor.b));
        
        return beadColor;
    }
    
    /**
     * Calculate corruption/harmony color shift for shader
     * @param {number} corruption - Corruption level (0-1)
     * @param {number} harmony - Harmony level (0-1)
     * @returns {Object} { colorShift, desaturation, brightness }
     */
    static calculateStateColorShift(corruption, harmony) {
        const corruptionClamped = Math.max(0, Math.min(1, corruption));
        const harmonyClamped = Math.max(0, Math.min(1, harmony));
        
        // Corruption creates red shift, desaturation, darkening
        const corruptionColorShift = corruptionClamped * 0.3;
        const corruptionDesat = corruptionClamped * 0.7;
        const corruptionBrightness = 1.0 - (corruptionClamped * 0.4);
        
        // Harmony creates cyan shift, saturation boost, brightening
        const harmonyColorShift = harmonyClamped * 0.2;
        const harmonySaturation = harmonyClamped * 0.1;
        const harmonyBrightness = 1.0 + (harmonyClamped * 0.15);
        
        // Combined effect (harmony counteracts corruption)
        const netColorShift = Math.max(0, corruptionColorShift - harmonyColorShift * 0.5);
        const netDesaturation = Math.max(0, corruptionDesat - harmonySaturation);
        const netBrightness = corruptionBrightness * harmonyBrightness;
        
        return {
            colorShift: netColorShift,
            desaturation: netDesaturation,
            brightness: netBrightness
        };
    }
    
    /**
     * Get color for aura (desaturated grey-white/cyan)
     * @param {number} harmony - Harmony level (0-1)
     * @returns {THREE.Color}
     */
    static getAuraColor(harmony = 0) {
        const harmonyClamped = Math.max(0, Math.min(1, harmony));
        
        // Base: desaturated grey-white
        const baseColor = new THREE.Color(0.85, 0.88, 0.9);
        
        // Harmony adds cyan tint
        const cyanTint = new THREE.Color(0.7, 0.85, 0.88);
        baseColor.lerp(cyanTint, harmonyClamped * 0.4);
        
        return baseColor;
    }
    
    /**
     * Get neutral color by name
     * @param {string} name - Color name (WHITE, GREY, BLACK, etc.)
     * @returns {THREE.Color}
     */
    static getNeutral(name) {
        const hex = this.NEUTRAL[name];
        if (hex === undefined) {
            console.warn(`[ATOMAColorPalette] Unknown neutral color: ${name}`);
            return new THREE.Color(0x888888);
        }
        return new THREE.Color(hex);
    }
    
    /**
     * Validate color contrast (for accessibility/readability)
     * @param {THREE.Color} color1 - First color
     * @param {THREE.Color} color2 - Second color
     * @returns {number} Contrast ratio (1-21, higher = better contrast)
     */
    static getContrastRatio(color1, color2) {
        const getLuminance = (c) => {
            const r = c.r <= 0.03928 ? c.r / 12.92 : Math.pow((c.r + 0.055) / 1.055, 2.4);
            const g = c.g <= 0.03928 ? c.g / 12.92 : Math.pow((c.g + 0.055) / 1.055, 2.4);
            const b = c.b <= 0.03928 ? c.b / 12.92 : Math.pow((c.b + 0.055) / 1.055, 2.4);
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        
        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }
    
    /**
     * Get color temperature (for mood modulation)
     * @param {THREE.Color} color - Color to analyze
     * @returns {number} Temperature (-1 to 1, negative = cool, positive = warm)
     */
    static getColorTemperature(color) {
        // Simple temperature estimation based on RGB balance
        const total = color.r + color.g + color.b;
        if (total === 0) return 0;
        
        const r = color.r / total;
        const b = color.b / total;
        
        // More red = warm, more blue = cool
        return (r - b) * 2.0;
    }
    
    /**
     * Convert hex to THREE.Color
     * @param {number} hex - Hex color value
     * @returns {THREE.Color}
     */
    static hexToColor(hex) {
        return new THREE.Color(hex);
    }
    
    /**
     * Export palette for documentation/debugging
     * @returns {Object} Palette data
     */
    static exportPalette() {
        return {
            nodeColors: this.NODE_COLORS,
            stateModifiers: this.STATE_MODIFIERS,
            linkColors: this.LINK_COLORS,
            neutral: this.NEUTRAL
        };
    }
}