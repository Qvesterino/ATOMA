/**
 * ATOMA Shader Base
 * ============================================================================
 * Unified shader architecture for all ATOMA visual systems.
 * Provides shared uniform definitions, path sampling, noise functions,
 * particle masks, and temporal effects.
 * 
 * Design Goals:
 * - Consistency across all visual systems
 * - Reduced code duplication
 * - Easy extension for new systems
 * - Clear separation of concerns
 */

export class ATOMAShaderBase {
    
    /**
     * Get base uniform definitions shared across all ATOMA shaders
     * @returns {Object} Uniform definitions
     */
    static getBaseUniforms() {
        return {
            // Time
            uTime: { value: 0 },
            
            // Color
            uColor: { value: new THREE.Color(0xffffff) },
            uColorSecondary: { value: new THREE.Color(0xffffff) },
            
            // Intensity
            uOpacity: { value: 1.0 },
            uBrightness: { value: 1.0 },
            
            // State Modifiers
            uDesaturation: { value: 0.0 },
            uNoiseSeed: { value: 0.0 },
            uSpeed: { value: 1.0 },
            
            // Path/Curve
            uStart: { value: new THREE.Vector3() },
            uMid: { value: new THREE.Vector3() },
            uEnd: { value: new THREE.Vector3() },
            uThickness: { value: 0.1 },
            
            // Rhythm/Motion
            uBreathPhase: { value: 0.0 },
            uPulsePhase: { value: 0.0 }
        };
    }
    
    /**
     * Get shader code for path sampling (Bezier curves)
     * @returns {string} GLSL shader code
     */
    static getPathSamplingFunctions() {
        return `
            // Quadratic Bezier Point
            vec3 getBezierPoint(vec3 p0, vec3 p1, vec3 p2, float t) {
                float oneMinusT = 1.0 - t;
                return oneMinusT * oneMinusT * p0 + 
                       2.0 * oneMinusT * t * p1 + 
                       t * t * p2;
            }
            
            // Quadratic Bezier Tangent (for building coordinate frame)
            vec3 getBezierTangent(vec3 p0, vec3 p1, vec3 p2, float t) {
                return 2.0 * (1.0 - t) * (p1 - p0) + 2.0 * t * (p2 - p1);
            }
            
            // Build orthonormal basis from tangent
            void buildOrthonormalBasis(vec3 tangent, out vec3 right, out vec3 normal) {
                vec3 up = abs(dot(tangent, vec3(0.0, 1.0, 0.0))) < 0.99 
                    ? vec3(0.0, 1.0, 0.0) 
                    : vec3(1.0, 0.0, 0.0);
                right = normalize(cross(up, tangent));
                normal = cross(tangent, right);
            }
        `;
    }
    
    /**
     * Get shader code for noise functions (simplex 3D)
     * @param {number} layers - Number of noise layers (1-4)
     * @returns {string} GLSL shader code
     */
    static getNoiseFunctions(layers = 3) {
        let code = `
            // Simplex 3D Noise
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                
                vec3 i = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                
                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                
                vec4 x = x_ * ns.x + ns.yyyy;
                vec4 y = y_ * ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                
                vec4 s0 = floor(b0) * 2.0 + 1.0;
                vec4 s1 = floor(b1) * 2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                
                vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
                
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                
                vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                
                vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
            }
        `;
        
        // Add layered noise function
        code += `
            float layeredNoise(vec3 p, float time, int layers) {
                float result = 0.0;
                float amplitude = 1.0;
                float frequency = 1.0;
                float maxAmplitude = 0.0;
                
                for (int i = 0; i < 4; i++) {
                    if (i >= layers) break;
                    
                    result += snoise(p * frequency + time) * amplitude;
                    maxAmplitude += amplitude;
                    
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                
                return result / maxAmplitude;
            }
        `;
        
        return code;
    }
    
    /**
     * Get shader code for particle masks
     * @param {string} maskType - 'star', 'circle', 'diamond', 'glow'
     * @returns {string} GLSL shader code
     */
    static getMaskFunctions(maskType = 'star') {
        const masks = {
            star: `
                // 4-point star mask with smooth edges
                float starMask(vec2 p, float power) {
                    float armX = 1.0 - abs(p.x);
                    float armY = 1.0 - abs(p.y);
                    float star = max(armX, armY);
                    star = pow(star, power);
                    float core = 1.0 - length(p);
                    star = max(star, core);
                    return smoothstep(0.2, 0.8, star);
                }
            `,
            
            circle: `
                // Soft circle mask
                float circleMask(vec2 p, float edge) {
                    float d = length(p);
                    return 1.0 - smoothstep(edge - 0.1, edge, d);
                }
            `,
            
            diamond: `
                // Diamond/soft square mask
                float diamondMask(vec2 p) {
                    return 1.0 - smoothstep(0.0, 0.5, abs(p.x) + abs(p.y));
                }
            `,
            
            glow: `
                // Radial glow mask
                float glowMask(vec2 p, float core, float falloff) {
                    float d = length(p);
                    float coreMask = 1.0 - smoothstep(0.0, core, d);
                    float glowMask = smoothstep(falloff, 0.0, d - core);
                    return coreMask + glowMask * 0.5;
                }
            `
        };
        
        return masks[maskType] || masks.circle;
    }
    
    /**
     * Get shader code for temporal functions
     * @returns {string} GLSL shader code
     */
    static getTemporalFunctions() {
        return `
            // Smooth oscillation
            float oscillate(float time, float speed, float phase) {
                return sin(time * speed + phase);
            }
            
            // Breathing (in-out oscillation)
            float breath(float time, float speed, float phase) {
                return sin(time * speed + phase) * 0.5 + 0.5;
            }
            
            // Pulse (sharp rise, slow fall)
            float pulse(float time, float speed, float phase, float sharpness) {
                float t = mod(time * speed + phase, 1.0);
                return 1.0 - pow(1.0 - t, sharpness);
            }
            
            // Ease in-out
            float easeInOut(float t) {
                return t < 0.5 ? 2.0 * t * t : 1.0 - 2.0 * (1.0 - t) * (1.0 - t);
            }
            
            // Fade with lifetime
            float fadeInOut(float lifeProgress, float fadeInPct, float fadeOutStart) {
                float fadeIn = smoothstep(0.0, fadeInPct, lifeProgress);
                float fadeOut = 1.0 - smoothstep(fadeOutStart, 1.0, lifeProgress);
                return fadeIn * fadeOut;
            }
        `;
    }
    
    /**
     * Get shader code for color modification functions
     * @returns {string} GLSL shader code
     */
    static getColorFunctions() {
        return `
            // Desaturation
            vec3 desaturate(vec3 color, float amount) {
                float luminance = dot(color, vec3(0.299, 0.587, 0.114));
                return mix(color, vec3(luminance), amount);
            }
            
            // Color temperature shift (warm/cool)
            vec3 temperatureShift(vec3 color, float shift) {
                vec3 warm = vec3(1.0, 0.8, 0.6);
                vec3 cool = vec3(0.6, 0.8, 1.0);
                vec3 tint = mix(cool, warm, shift);
                return mix(color, color * tint, 0.3);
            }
            
            // Harmony boost (cyan shift, saturation increase)
            vec3 harmonyBoost(vec3 color, float amount) {
                vec3 harmonyTint = vec3(0.6, 1.0, 0.9);
                vec3 boosted = color + harmonyTint * amount * 0.3;
                boosted = mix(color, boosted, amount * 0.5);
                return boosted;
            }
            
            // Corruption shift (red bias, desaturation)
            vec3 corruptionShift(vec3 color, float amount) {
                vec3 corruptionTint = vec3(1.0, 0.3, 0.2);
                vec3 shifted = mix(color, corruptionTint, amount * 0.4);
                shifted = desaturate(shifted, amount * 0.5);
                return shifted;
            }
        `;
    }
    
    /**
     * Get complete vertex shader template
     * @param {Object} options - { includePathSampling, includeNoise, includeTemporal }
     * @returns {string} Complete GLSL vertex shader
     */
    static getVertexShaderTemplate(options = {}) {
        let shader = '';
        
        if (options.includePathSampling) {
            shader += this.getPathSamplingFunctions() + '\n';
        }
        
        if (options.includeNoise) {
            shader += this.getNoiseFunctions(options.noiseLayers || 2) + '\n';
        }
        
        if (options.includeTemporal) {
            shader += this.getTemporalFunctions() + '\n';
        }
        
        // Common attributes
        shader += `
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uOpacity;
            uniform float uBrightness;
            uniform float uDesaturation;
            uniform float uSpeed;
            uniform float uBreathPhase;
            uniform float uPulsePhase;
        `;
        
        return shader;
    }
    
    /**
     * Get complete fragment shader template
     * @param {Object} options - { includeMasks, includeColors, includeTemporal }
     * @returns {string} Complete GLSL fragment shader
     */
    static getFragmentShaderTemplate(options = {}) {
        let shader = '';
        
        if (options.includeMasks) {
            shader += this.getMaskFunctions(options.maskType || 'circle') + '\n';
        }
        
        if (options.includeColors) {
            shader += this.getColorFunctions() + '\n';
        }
        
        if (options.includeTemporal) {
            shader += this.getTemporalFunctions() + '\n';
        }
        
        // Common uniforms
        shader += `
            uniform vec3 uColor;
            uniform vec3 uColorSecondary;
            uniform float uOpacity;
            uniform float uBrightness;
            uniform float uDesaturation;
            uniform float uTime;
        `;
        
        return shader;
    }
    
    /**
     * Create base material with ATOMA uniforms
     * @param {Object} materialParams - Three.js material parameters
     * @returns {THREE.ShaderMaterial}
     */
    static createBaseMaterial(materialParams = {}) {
        const uniforms = this.getBaseUniforms();
        
        return new THREE.ShaderMaterial({
            uniforms,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            ...materialParams
        });
    }
}