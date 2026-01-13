/**
 * NodeAuraShader.js
 * ============================================================================
 * VERTEX & FRAGMENT SHADERS FOR NODE AURA RENDERING
 * 
 * Implements dynamic, noise-driven vertex displacement for torn/irregular
 * translucent aura meshes around nodes.
 * 
 * Features:
 * - Unified noise from EnergyVisualProfile
 * - Vertex displacement based on noise + time
 * - Harmony → smooth motion, low displacement
 * - Corruption → rough motion, high displacement
 * - Cascade hints → compressed displacement, reduced randomness
 * 
 * READS FROM: EnergyVisualProfile for all color, opacity, noise, and timing
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';
import { EnergyVisualProfile } from '../EnergyVisualProfile.js';
import { FireLikeAuraConfig } from '../FireLikeAuraConfig.js';

/**
 * Create node aura shader material
 * All visual parameters read from EnergyVisualProfile
 * Optional config overrides for specific instances (discouraged)
 * 
 * @param {Object} config - Configuration (optional overrides)
 * @returns {THREE.ShaderMaterial} Aura material
 */
export function createNodeAuraMaterial(config = {}) {
  const profile = EnergyVisualProfile;
  const flameConfig = FireLikeAuraConfig;
  
  const defaultConfig = {
    baseDisplacement: config.baseDisplacement ?? profile.baseDisplacement,
    noiseScale: config.noiseScale ?? profile.noiseScale,
    timeScale: config.timeScale ?? profile.globalTimeScale,
    baseOpacity: config.baseOpacity ?? profile.baseOpacity,
    hintCompressionStrength: config.hintCompressionStrength ?? profile.hintCompressionStrength,
    
    // Fire-like aura morphing parameters
    flowSpeed: config.flowSpeed ?? flameConfig.flowSpeed,
    directionBias: config.directionBias ?? flameConfig.directionBias,
    ridgeAmplification: config.ridgeAmplification ?? flameConfig.ridgeAmplification,
  };

  const vertexShader = `
    uniform float uTime;
    uniform float uDisplacement;
    uniform float uHarmony;
    uniform float uCorruption;
    uniform float uHintStrength;
    uniform float uWaveInfluence;
    uniform vec3 uLinkDirection;
    uniform float uLinkBirthIntensity;
    uniform float uLinkRemovalIntensity;
    
    // Particle impact effects (from NodeImpactManager)
    uniform float uImpactDisplacement;
    uniform float uImpactCorruptionBias;
    uniform float uImpactHarmonyBias;
    
    // Fire-like aura morphing (from FireLikeAuraConfig)
    uniform float uFlowSpeed;
    uniform float uDirectionBias;
    uniform float uRidgeAmplification;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacementFactor;
    
    // ========================================================================
    // SIMPLEX-LIKE 3D NOISE (WORKING VERSION - UNIFIED ACROSS SYSTEMS)
    // ========================================================================
    // Fast, stable noise function used across all energy visualization systems
    
    float mod289(float x) { return x - floor(x / 289.0) * 289.0; }
    vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x / 289.0) * 289.0; }
    
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - 0.5;
      
      i = mod289(i);
      
      // Canonical 3D simplex permutation (all vec4 operands)
      vec4 p = permute(
        permute(
          permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0)
          )
          + i.y + vec4(0.0, i1.y, i2.y, 1.0)
        )
        + i.x + vec4(0.0, i1.x, i2.x, 1.0)
      );
      
      float n0 = sin(p.x * 43758.5453);
      float n1 = sin(p.y * 43758.5453);
      float n2 = sin(p.z * 43758.5453);
      float n3 = sin(p.w * 43758.5453);
      
      float noise0 = fract(n0) * 2.0 - 1.0;
      float noise1 = fract(n1) * 2.0 - 1.0;
      float noise2 = fract(n2) * 2.0 - 1.0;
      float noise3 = fract(n3) * 2.0 - 1.0;
      
      float t0 = 0.6 - dot(x0, x0);
      float t1 = 0.6 - dot(x1, x1);
      float t2 = 0.6 - dot(x2, x2);
      float t3 = 0.6 - dot(x3, x3);
      
      t0 = max(t0, 0.0);
      t1 = max(t1, 0.0);
      t2 = max(t2, 0.0);
      t3 = max(t3, 0.0);
      
      t0 *= t0 * t0;
      t1 *= t1 * t1;
      t2 *= t2 * t2;
      t3 *= t3 * t3;
      
      return 42.0 * (t0 * noise0 + t1 * noise1 + t2 * noise2 + t3 * noise3);
    }
    
    void main() {
      // ========================================================================
      // FIRE-LIKE DIRECTIONAL FLAME MORPHING
      // ========================================================================
      // Flow noise along directional axis for intelligent flame structure
      
      // Directional flow vector (normalize link direction or use normal)
      vec3 flowDir = normalize(uLinkDirection);
      
      // Base noise position (with time evolution)
      vec3 noisePos = position + uTime * 0.3;
      
      // Apply directional bias: noise flows along flow axis
      // Creates streaming, flame-like deformation
      vec3 flowBias = flowDir * dot(position, flowDir) * uFlowSpeed;
      vec3 directedNoisePos = noisePos + flowBias * uDirectionBias;
      
      // ========================================================================
      // MULTI-OCTAVE NOISE WITH RIDGE DETECTION
      // ========================================================================
      // Multiple octaves of noise for organic feel (from EnergyVisualProfile)
      float noise1 = snoise(directedNoisePos * 2.0);
      float noise2 = snoise(directedNoisePos * 4.0) * 0.5;
      float noise3 = snoise(directedNoisePos * 8.0) * 0.25;
      float noiseTotal = (noise1 + noise2 + noise3) / 1.75;
      
      // Ridge detection: create flame-like tongues
      // Sharpen ridges, suppress valleys
      float ridge = abs(noiseTotal * 2.0 - 1.0);  // Range: 0-1, peaks at ±1.0
      float ridgeFactor = smoothstep(0.3, 0.9, ridge);  // Smooth transition
      
      // Amplify displacement at ridges (flame tongue shaping)
      float ridgedNoise = mix(noiseTotal * 0.5, noiseTotal, ridgeFactor * (1.0 + uRidgeAmplification * 0.35));
      
      // ========================================================================
      // STATE-AWARE FLAME MORPHING MODULATION
      // ========================================================================
      // Harmony → smoother (clamped motion, slower breathing) - from EnergyVisualProfile
      // Corruption → rougher (enhanced motion, faster morphing) - from EnergyVisualProfile
      float harmonyDampen = mix(1.0, 0.6, uHarmony);  // Profile: harmonyMotionDampen = 0.6
      float corruptionEnhance = mix(1.0, 1.4, uCorruption);  // Profile: corruptionMotionEnhanceNode = 1.4
      
      // Cascade hints → compress displacement
      float hintCompression = mix(1.0, 1.0 - uHintStrength * 0.5, uHintStrength);
      
      // ========================================================================
      // FLAME BREATHING (SLOW OSCILLATION)
      // ========================================================================
      // Very slow, subtle rise and fall of entire aura
      // Harmony makes breathing more pronounced (resonance)
      float breathingPhase = uTime * 0.3;  // ~3.3 second cycle
      float breathing = sin(breathingPhase) * 0.08;  // ±0.08
      breathing *= mix(1.0, 1.5, uHarmony);  // Harmony enhances breathing
      
      // Wave influence → subtle additional oscillation
      float waveOscillation = sin(uTime * 2.0 + uWaveInfluence * 6.28) * 0.15;
      
      // Final displacement: ridged noise + state modulation
      float displacementFactor = ridgedNoise * uDisplacement * harmonyDampen * corruptionEnhance * hintCompression;
      displacementFactor += waveOscillation * 0.1;
      displacementFactor += breathing;  // Add breathing oscillation
      
      // --- LINK BIRTH ENHANCEMENT ---
      // Add directional pulse toward link when justLinked (uLinkBirthIntensity > 0)
      float linkBirthPulse = 0.0;
      if (uLinkBirthIntensity > 0.0) {
        // Directional bias: dot product of normal toward link direction
        float linkBias = max(0.0, dot(normalize(normal), normalize(uLinkDirection)));
        
        // Ease-in for 100-150ms, gentle decay for 500-700ms
        float birthPhase = mod(uTime * 2.5, 1.0); // Total cycle ~400ms
        float easeIn = smoothstep(0.0, 0.3, birthPhase);
        float decay = mix(1.0, 0.0, smoothstep(0.3, 1.0, birthPhase));
        
        // Directional stretching toward link
        linkBirthPulse = easeIn * decay * 0.35 * linkBias;
        
        // Radial ripple: expanding wave from center outward
        float rippleTime = mod(uTime * 2.0, 1.5);
        float rippleWave = sin(rippleTime * 3.14159) * exp(-rippleTime * 2.0);
        linkBirthPulse += rippleWave * 0.15;
      }
      
      // --- LINK REMOVAL DISSIPATION ---
      // Opposite of birth: contraction inward with dissipation ripple
      float linkRemovalPulse = 0.0;
      if (uLinkRemovalIntensity > 0.0) {
        // Contraction phase: aura shrinks inward quickly
        float removalPhase = mod(uTime * 3.0, 1.0); // Slightly faster than birth
        float contractIn = smoothstep(1.0, 0.0, removalPhase); // Reverse: 1 → 0
        float dissipate = mix(1.0, 0.0, smoothstep(0.4, 1.0, removalPhase));
        
        // Inward contraction: pull away from link direction
        float linkBiasInward = max(0.0, dot(normalize(normal), normalize(-uLinkDirection)));
        linkRemovalPulse = contractIn * dissipate * -0.4 * linkBiasInward; // Negative for inward
        
        // Dissipation ripple: collapsing wave from outside inward
        float rippleTimeRemoval = mod(uTime * 2.5, 1.2);
        float rippleWaveRemoval = cos(rippleTimeRemoval * 3.14159) * exp(-rippleTimeRemoval * 2.5);
        linkRemovalPulse -= rippleWaveRemoval * 0.12;
      }
      
      displacementFactor += linkBirthPulse * uLinkBirthIntensity;
      displacementFactor += linkRemovalPulse * uLinkRemovalIntensity;
      
      // --- PARTICLE IMPACT EFFECTS ---
      // Subtle deformation from particle arrivals (corruption/harmony)
      // Negative = contraction (corruption), Positive = expansion (harmony)
      displacementFactor += uImpactDisplacement;
      
      // ========================================================================
      // LINK-AURA CONTINUITY: FLAME BENDING
      // ========================================================================
      // Flame folds subtly bend toward link connection points
      // Creates visual continuity: flames pulled into link
      float linkBendInfluence = max(0.0, dot(normalize(position), normalize(uLinkDirection)));
      float linkBend = linkBendInfluence * 0.15;  // Subtle bending
      displacementFactor += linkBend;
      
      vec3 displaced = position + normalize(normal) * (ridgedNoise + linkBirthPulse + linkRemovalPulse + linkBend) * displacementFactor;
      
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
      vDisplacementFactor = displacementFactor;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uOpacity;
    uniform float uHarmony;
    uniform float uHintStrength;
    uniform float uCorruption;
    uniform float uDesaturation;
    
    // Particle impact effects (from NodeImpactManager)
    uniform float uImpactCorruptionBias;
    uniform float uImpactHarmonyBias;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacementFactor;
    
    // Convert RGB to grayscale using luminance
    float getGrayscale(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }
    
    void main() {
      // Subtle gradient based on normal direction and displacement
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float rim = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
      
      // Base color: neutral gray-white (from EnergyVisualProfile)
      vec3 auraColor = vec3(0.85, 0.85, 0.9);  // Profile: baseColor
      
      // Harmony influence: brighten toward harmony white (from EnergyVisualProfile)
      auraColor = mix(auraColor, vec3(0.8, 0.8, 0.88), uHarmony * 0.3);  // harmonyColor, blendStrength 0.3
      
      // Corruption influence: add red tint before desaturation (from EnergyVisualProfile)
      auraColor = mix(auraColor, vec3(1.0, 0.4, 0.4), uCorruption * 0.4);  // corruptionColor, nodeBlend 0.4
      
      // --- PARTICLE IMPACT COLOR BIASES ---
      // Corruption particles arriving: enhance red tint (energy absorption)
      auraColor = mix(auraColor, vec3(1.0, 0.4, 0.4), uImpactCorruptionBias * 0.5);
      
      // Harmony particles arriving: enhance cyan/white tint (energy resonance)
      auraColor = mix(auraColor, vec3(0.7, 0.9, 1.0), uImpactHarmonyBias * 0.4);
      
      // Hint influence: very subtle brightening
      auraColor += vec3(0.05) * uHintStrength * 0.3;
      
      // --- CORRUPTION DESATURATION ---
      // Progressive shift from color to grayscale as corruption increases
      if (uDesaturation > 0.0) {
        vec3 grayscale = vec3(getGrayscale(auraColor));
        // Blend: color → increasingly grayscale
        auraColor = mix(auraColor, grayscale, uDesaturation);
        
        // At high desaturation, shift toward sickly yellow-gray (corrupted aesthetic)
        if (uDesaturation > 0.5) {
          vec3 corruptedGray = grayscale + vec3(0.15, 0.1, -0.05);
          auraColor = mix(auraColor, corruptedGray, (uDesaturation - 0.5) * 0.5);
        }
      }
      
      // Rim lighting for visibility (reduced when corrupted)
      auraColor += rim * vec3(0.15) * (1.0 - uDesaturation * 0.4);
      
      // Opacity modulation
      float opacity = uOpacity * (0.7 + rim * 0.3);
      opacity *= (0.8 + vDisplacementFactor * 0.2);
      
      gl_FragColor = vec4(auraColor, opacity);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDisplacement: { value: defaultConfig.baseDisplacement },
      uHarmony: { value: 0.5 },
      uCorruption: { value: 0.2 },
      uHintStrength: { value: 0 },
      uWaveInfluence: { value: 0 },
      uOpacity: { value: defaultConfig.baseOpacity },
      uLinkDirection: { value: new THREE.Vector3(0, 0, 1) },
      uLinkBirthIntensity: { value: 0 },
      uLinkRemovalIntensity: { value: 0 },
      uDesaturation: { value: 0 },
      
      // Particle impact effects (NodeImpactManager)
      uImpactDisplacement: { value: 0 },
      uImpactCorruptionBias: { value: 0 },
      uImpactHarmonyBias: { value: 0 },
      
      // Fire-like aura morphing (FireLikeAuraConfig)
      uFlowSpeed: { value: 0.8 },
      uDirectionBias: { value: 0.6 },
      uRidgeAmplification: { value: 1.35 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });
}

/**
 * Create procedural aura mesh (torn/irregular icosphere)
 * @param {number} radius - Base radius
 * @param {number} subdivisions - Mesh detail
 * @returns {THREE.Geometry} Aura geometry
 */
export function createAuraGeometry(radius = 1.2, subdivisions = 2) {
  // Start with icosphere for organic base
  const geometry = new THREE.IcosahedronGeometry(radius, subdivisions);
  
  // Randomly displace vertices for torn appearance
  const positions = geometry.attributes.position;
  const posArray = positions.array;
  
  for (let i = 0; i < posArray.length; i += 3) {
    const x = posArray[i];
    const y = posArray[i + 1];
    const z = posArray[i + 2];
    
    // Random offset for irregular silhouette
    const randomOffset = (Math.random() - 0.5) * 0.3;
    const dist = Math.sqrt(x * x + y * y + z * z);
    const scale = (dist + randomOffset) / dist;
    
    posArray[i] = x * scale;
    posArray[i + 1] = y * scale;
    posArray[i + 2] = z * scale;
  }
  
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  
  return geometry;
}
