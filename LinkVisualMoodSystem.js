/**
 * LINK VISUAL MOOD SYSTEM v1.0
 * 
 * Runtime link appearance presets for different scenes and moods
 * 
 * MOODS:
 * - calm: Minimal, zen-like, subtle glow, cool colors
 * - premium: Elegant, refined, balanced, professional
 * - intense: Aggressive, high-contrast, bright, dramatic
 * - meditative: Slow, deep, breathing-like, contemplative
 * 
 * FEATURES:
 * - Real-time mood switching
 * - Smooth transitions between moods
 * - Per-mood color palettes
 * - Per-mood priority multiplier profiles
 * - Per-mood bloom & post-processing tweaks
 * - Console API for runtime adjustment
 * - All-maps support (Quantum Island, Dream Desert, Fractal Valley)
 * 
 * INTEGRATION:
 * - Call moodSystem.activateMood(moodName) to switch
 * - Moods apply immediately, with smooth 0.5s transitions
 * - Works with existing NeonLinkVisuals, DynamicLinkColorSystem, etc.
 */

import * as THREE from 'three';

export class LinkVisualMoodSystem {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Current mood state
    this.currentMood = 'premium';
    this.moodTransition = null;
    this.isTransitioning = false;
    
    // Reference to external systems
    this.neonLinkVisuals = null;
    this.dynamicLinkColorSystem = null;
    this.linkingSystem = null;
    this.postProcessing = null;
    
    // Mood definitions
    this.moods = this.defineMoods();
    
    console.log('✅ LinkVisualMoodSystem v1.0 initialized');
    console.log('   Available moods: calm, premium, intense, meditative');
    console.log('   Use: moodSystem.activateMood(moodName)');
  }
  
  /**
   * Define all mood presets
   * Each mood specifies:
   * - colorPalette: Custom synergy colors
   * - neonConfig: Adjustments to NeonLinkVisuals
   * - bloomConfig: Adjustments to PostProcessing bloom
   * - dynamicColorConfig: Adjustments to DynamicLinkColorSystem
   * - priorityMultipliers: Custom tier profiles
   */
  defineMoods() {
    return {
      calm: {
        name: 'Calm',
        description: 'Minimal, zen-like, subtle connectivity',
        icon: '🧘',
        
        colorPalette: {
          low: {
            primary: 0x1a5f7a,    // Deep cyan
            secondary: 0x0d7a9e   // Darker blue
          },
          mid: {
            primary: 0x4a5a8a,    // Muted purple
            secondary: 0xc0c0c0   // Silver
          },
          high: {
            primary: 0x8a7a6a,    // Warm muted brown
            secondary: 0xaa8a5a,  // Soft orange
            tertiary: 0xb89a6a    // Light bronze
          }
        },
        
        neonConfig: {
          curveResolution: 60,
          baseLineWidth: 1.0,       // Very thin (from 2)
          maxLineWidth: 3.0,        // Reduced (from 8)
          bloomIntensity: 0.4,      // Subtle (from 1.5)
          glowScale: 0.6,           // Minimal (from 1.3)
          particleCount: 1,         // Single particle (from 3)
          particleSize: 0.04,       // Tiny (from 0.08)
          particleSpeed: 0.01,      // Slow (from 0.03)
          trailLength: 6            // Short trail
        },
        
        bloomConfig: {
          strength: 0.3,            // Very subtle
          radius: 0.2,              // Tight
          threshold: 0.95           // Only brightest glow
        },
        
        dynamicColorConfig: {
          transitionDuration: 0.8,  // Slower transitions
          updateFrequency: 3,       // Update every 3 frames
          batchSize: 50
        },
        
        priorityMultipliers: {
          low: {
            pulseSpeed: 0.2,
            opacity: 0.30,
            widthMul: 0.7,
            glowMul: 0.3,
            particleMul: 0.2,
            trafficPulseMul: 0.1,
            auraScale: 0.4
          },
          normal: {
            pulseSpeed: 0.4,
            opacity: 0.50,
            widthMul: 1.0,
            glowMul: 0.6,
            particleMul: 0.8,
            trafficPulseMul: 0.3,
            auraScale: 0.8
          },
          high: {
            pulseSpeed: 0.8,
            opacity: 0.70,
            widthMul: 1.2,
            glowMul: 1.0,
            particleMul: 1.2,
            trafficPulseMul: 0.5,
            auraScale: 1.2
          },
          critical: {
            pulseSpeed: 1.2,
            opacity: 0.85,
            widthMul: 1.4,
            glowMul: 1.3,
            particleMul: 1.5,
            trafficPulseMul: 0.7,
            auraScale: 1.5
          }
        }
      },
      
      premium: {
        name: 'Premium',
        description: 'Elegant, refined, professional network',
        icon: '✨',
        
        colorPalette: {
          low: {
            primary: 0x00ddff,      // Bright cyan (original)
            secondary: 0x0099ff    // Blue
          },
          mid: {
            primary: 0xaa88ff,      // Purple
            secondary: 0xffffff     // White
          },
          high: {
            primary: 0xffff00,      // Yellow
            secondary: 0xff8800,    // Orange
            tertiary: 0xff4400     // Orange-red
          }
        },
        
        neonConfig: {
          curveResolution: 60,
          baseLineWidth: 1.5,       // Refined (from 2)
          maxLineWidth: 5.0,        // Elegant (from 8)
          bloomIntensity: 0.9,      // Balanced (from 1.5)
          glowScale: 0.95,          // Proportional (from 1.3)
          particleCount: 2,         // Minimal (from 3)
          particleSize: 0.06,       // Small (from 0.08)
          particleSpeed: 0.02,      // Moderate (from 0.03)
          trailLength: 10           // Moderate trail
        },
        
        bloomConfig: {
          strength: 1.0,            // Balanced
          radius: 0.35,             // Moderate spread
          threshold: 0.80           // Lower threshold for glow
        },
        
        dynamicColorConfig: {
          transitionDuration: 0.5,  // Smooth
          updateFrequency: 1,       // Every frame
          batchSize: 50
        },
        
        priorityMultipliers: {
          low: {
            pulseSpeed: 0.5,
            opacity: 0.45,
            widthMul: 0.9,
            glowMul: 0.6,
            particleMul: 0.4,
            trafficPulseMul: 0.4,
            auraScale: 0.7
          },
          normal: {
            pulseSpeed: 1.0,
            opacity: 0.75,
            widthMul: 1.0,
            glowMul: 1.0,
            particleMul: 1.0,
            trafficPulseMul: 0.7,
            auraScale: 1.0
          },
          high: {
            pulseSpeed: 1.7,
            opacity: 0.95,
            widthMul: 1.4,
            glowMul: 1.6,
            particleMul: 1.5,
            trafficPulseMul: 1.0,
            auraScale: 1.5
          },
          critical: {
            pulseSpeed: 2.5,
            opacity: 1.0,
            widthMul: 1.9,
            glowMul: 2.3,
            particleMul: 2.0,
            trafficPulseMul: 1.3,
            auraScale: 2.2
          }
        }
      },
      
      intense: {
        name: 'Intense',
        description: 'Aggressive, high-contrast, dramatic',
        icon: '⚡',
        
        colorPalette: {
          low: {
            primary: 0x00ffff,      // Bright cyan
            secondary: 0x00ddff
          },
          mid: {
            primary: 0xdd00ff,      // Bright magenta
            secondary: 0xffff00     // Bright yellow
          },
          high: {
            primary: 0xff0000,      // Pure red
            secondary: 0xff2200,    // Red-orange
            tertiary: 0xff0022     // Deep red
          }
        },
        
        neonConfig: {
          curveResolution: 60,
          baseLineWidth: 2.5,       // Thick (from 2)
          maxLineWidth: 12.0,       // Very thick (from 8)
          bloomIntensity: 2.5,      // Aggressive (from 1.5)
          glowScale: 1.8,           // Strong (from 1.3)
          particleCount: 5,         // Many (from 3)
          particleSize: 0.12,       // Large (from 0.08)
          particleSpeed: 0.05,      // Fast (from 0.03)
          trailLength: 20           // Long trail
        },
        
        bloomConfig: {
          strength: 2.0,            // Strong bloom
          radius: 0.6,              // Wide spread
          threshold: 0.6            // Lower threshold, more glow
        },
        
        dynamicColorConfig: {
          transitionDuration: 0.2,  // Fast transitions
          updateFrequency: 1,       // Every frame
          batchSize: 50
        },
        
        priorityMultipliers: {
          low: {
            pulseSpeed: 1.5,
            opacity: 0.70,
            widthMul: 1.2,
            glowMul: 1.2,
            particleMul: 1.0,
            trafficPulseMul: 0.8,
            auraScale: 1.2
          },
          normal: {
            pulseSpeed: 2.5,
            opacity: 0.95,
            widthMul: 1.6,
            glowMul: 1.8,
            particleMul: 2.0,
            trafficPulseMul: 1.2,
            auraScale: 1.8
          },
          high: {
            pulseSpeed: 3.5,
            opacity: 1.0,
            widthMul: 2.0,
            glowMul: 2.6,
            particleMul: 2.5,
            trafficPulseMul: 1.5,
            auraScale: 2.3
          },
          critical: {
            pulseSpeed: 4.5,
            opacity: 1.0,
            widthMul: 2.5,
            glowMul: 3.2,
            particleMul: 3.0,
            trafficPulseMul: 1.8,
            auraScale: 2.8
          }
        }
      },
      
      meditative: {
        name: 'Meditative',
        description: 'Slow, deep, breathing-like, contemplative',
        icon: '🌙',
        
        colorPalette: {
          low: {
            primary: 0x1a3a5f,      // Deep blue
            secondary: 0x2a4a7f     // Deeper blue
          },
          mid: {
            primary: 0x6a5a9a,      // Deep purple
            secondary: 0x8a7aaa     // Softer purple
          },
          high: {
            primary: 0xaa6a4a,      // Deep bronze
            secondary: 0xba7a5a,    // Warm bronze
            tertiary: 0xaa5a3a     // Deep amber
          }
        },
        
        neonConfig: {
          curveResolution: 60,
          baseLineWidth: 1.2,       // Thin (from 2)
          maxLineWidth: 4.0,        // Moderate (from 8)
          bloomIntensity: 0.5,      // Soft (from 1.5)
          glowScale: 0.7,           // Subtle (from 1.3)
          particleCount: 1,         // Single (from 3)
          particleSize: 0.05,       // Tiny (from 0.08)
          particleSpeed: 0.005,     // Very slow (from 0.03)
          trailLength: 8            // Short trail
        },
        
        bloomConfig: {
          strength: 0.5,            // Soft bloom
          radius: 0.25,             // Tight
          threshold: 0.90           // Only bright spots
        },
        
        dynamicColorConfig: {
          transitionDuration: 1.2,  // Very slow transitions
          updateFrequency: 2,       // Update every 2 frames
          batchSize: 50
        },
        
        priorityMultipliers: {
          low: {
            pulseSpeed: 0.15,       // Very slow pulse
            opacity: 0.25,
            widthMul: 0.6,
            glowMul: 0.4,
            particleMul: 0.1,
            trafficPulseMul: 0.05,
            auraScale: 0.5
          },
          normal: {
            pulseSpeed: 0.30,       // Slow pulse
            opacity: 0.45,
            widthMul: 0.9,
            glowMul: 0.7,
            particleMul: 0.7,
            trafficPulseMul: 0.2,
            auraScale: 0.9
          },
          high: {
            pulseSpeed: 0.60,
            opacity: 0.65,
            widthMul: 1.2,
            glowMul: 1.1,
            particleMul: 1.0,
            trafficPulseMul: 0.4,
            auraScale: 1.3
          },
          critical: {
            pulseSpeed: 0.90,
            opacity: 0.80,
            widthMul: 1.5,
            glowMul: 1.5,
            particleMul: 1.3,
            trafficPulseMul: 0.6,
            auraScale: 1.7
          }
        }
      }
    };
  }
  
  /**
   * Activate a mood with smooth transition
   * @param {string} moodName - 'calm', 'premium', 'intense', 'meditative'
   * @param {number} transitionDuration - Optional override (default 0.5s)
   */
  activateMood(moodName, transitionDuration = 0.5) {
    if (!this.moods[moodName]) {
      console.warn(`❌ Unknown mood: ${moodName}`);
      console.log(`Available moods: ${Object.keys(this.moods).join(', ')}`);
      return false;
    }
    
    if (this.currentMood === moodName) {
      console.log(`ℹ️ Already in ${moodName} mood`);
      return true;
    }
    
    const sourceMood = this.moods[this.currentMood];
    const targetMood = this.moods[moodName];
    
    // Setup smooth transition
    this.moodTransition = {
      source: sourceMood,
      target: targetMood,
      elapsed: 0,
      duration: transitionDuration,
      active: true
    };
    
    this.isTransitioning = true;
    this.currentMood = moodName;
    
    console.log(`🎨 Transitioning to ${targetMood.icon} ${targetMood.name} mood...`);
    
    // Apply immediately (lerp will smooth it)
    this._applyMoodConfig(targetMood, 0);
    
    return true;
  }
  
  /**
   * Immediately switch mood (no transition)
   */
  switchMoodImmediate(moodName) {
    return this.activateMood(moodName, 0);
  }
  
  /**
   * Apply mood configuration to systems
   * @private
   */
  _applyMoodConfig(mood, transitionAlpha = 1.0) {
    // Apply color palette
    if (this.dynamicLinkColorSystem) {
      this.dynamicLinkColorSystem.colorPalette = mood.colorPalette;
    }
    
    // Apply neon config
    if (this.neonLinkVisuals) {
      Object.assign(this.neonLinkVisuals.config, mood.neonConfig);
      this.neonLinkVisuals.config.priority = mood.priorityMultipliers;
    }
    
    // Apply bloom config
    if (this.postProcessing) {
      const bloomPass = this.postProcessing.bloomPass;
      if (bloomPass) {
        bloomPass.strength = mood.bloomConfig.strength;
        bloomPass.radius = mood.bloomConfig.radius;
        bloomPass.threshold = mood.bloomConfig.threshold;
      }
    }
    
    // Apply dynamic color config
    if (this.dynamicLinkColorSystem) {
      this.dynamicLinkColorSystem.configure(mood.dynamicColorConfig);
    }
  }
  
  /**
   * Update mood transition (smooth lerp between moods)
   * Call from main animation loop
   * @param {number} deltaTime - Delta time in seconds
   */
  update(deltaTime) {
    if (!this.moodTransition || !this.moodTransition.active) {
      return;
    }
    
    const transition = this.moodTransition;
    transition.elapsed += deltaTime;
    
    const progress = Math.min(transition.elapsed / transition.duration, 1.0);
    
    // Lerp between source and target
    this._lerpMoodConfig(
      transition.source,
      transition.target,
      progress
    );
    
    // Mark as complete
    if (progress >= 1.0) {
      transition.active = false;
      this.isTransitioning = false;
      console.log(`✅ Mood transition complete`);
    }
  }
  
  /**
   * Smooth lerp between two mood configurations
   * @private
   */
  _lerpMoodConfig(sourceMood, targetMood, alpha) {
    // Lerp neon config
    if (this.neonLinkVisuals) {
      const sourceNeon = sourceMood.neonConfig;
      const targetNeon = targetMood.neonConfig;
      
      const lerpedConfig = {
        curveResolution: Math.round(this._lerp(sourceNeon.curveResolution, targetNeon.curveResolution, alpha)),
        baseLineWidth: this._lerp(sourceNeon.baseLineWidth, targetNeon.baseLineWidth, alpha),
        maxLineWidth: this._lerp(sourceNeon.maxLineWidth, targetNeon.maxLineWidth, alpha),
        bloomIntensity: this._lerp(sourceNeon.bloomIntensity, targetNeon.bloomIntensity, alpha),
        glowScale: this._lerp(sourceNeon.glowScale, targetNeon.glowScale, alpha),
        particleCount: Math.round(this._lerp(sourceNeon.particleCount, targetNeon.particleCount, alpha)),
        particleSize: this._lerp(sourceNeon.particleSize, targetNeon.particleSize, alpha),
        particleSpeed: this._lerp(sourceNeon.particleSpeed, targetNeon.particleSpeed, alpha),
        trailLength: Math.round(this._lerp(sourceNeon.trailLength, targetNeon.trailLength, alpha))
      };
      
      Object.assign(this.neonLinkVisuals.config, lerpedConfig);
    }
    
    // Lerp bloom config
    if (this.postProcessing) {
      const bloomPass = this.postProcessing.bloomPass;
      if (bloomPass) {
        const sourceBloom = sourceMood.bloomConfig;
        const targetBloom = targetMood.bloomConfig;
        
        bloomPass.strength = this._lerp(sourceBloom.strength, targetBloom.strength, alpha);
        bloomPass.radius = this._lerp(sourceBloom.radius, targetBloom.radius, alpha);
        bloomPass.threshold = this._lerp(sourceBloom.threshold, targetBloom.threshold, alpha);
      }
    }
  }
  
  /**
   * Simple linear interpolation helper
   * @private
   */
  _lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  /**
   * Get current mood info
   */
  getCurrentMood() {
    return {
      name: this.moods[this.currentMood].name,
      icon: this.moods[this.currentMood].icon,
      description: this.moods[this.currentMood].description,
      isTransitioning: this.isTransitioning
    };
  }
  
  /**
   * List all available moods
   */
  listMoods() {
    const moodsList = Object.entries(this.moods).map(([key, mood]) => ({
      key,
      name: mood.name,
      icon: mood.icon,
      description: mood.description
    }));
    
    console.table(moodsList);
    return moodsList;
  }
  
  /**
   * Get mood details
   */
  getMoodDetails(moodName) {
    const mood = this.moods[moodName];
    if (!mood) {
      console.warn(`Unknown mood: ${moodName}`);
      return null;
    }
    
    return {
      name: mood.name,
      icon: mood.icon,
      description: mood.description,
      config: {
        neon: mood.neonConfig,
        bloom: mood.bloomConfig,
        dynamicColor: mood.dynamicColorConfig,
        priority: mood.priorityMultipliers
      }
    };
  }
  
  /**
   * Wireup external systems
   */
  setNeonLinkVisuals(system) {
    this.neonLinkVisuals = system;
    return this;
  }
  
  setDynamicLinkColorSystem(system) {
    this.dynamicLinkColorSystem = system;
    return this;
  }
  
  setLinkingSystem(system) {
    this.linkingSystem = system;
    return this;
  }
  
  setPostProcessing(system) {
    this.postProcessing = system;
    return this;
  }
}

/**
 * Setup console debugging API
 */
export function setupLinkMoodSystemConsoleAPI(moodSystem) {
  if (!window.debugLinkMood) {
    window.debugLinkMood = {};
  }
  
  Object.assign(window.debugLinkMood, {
    // List all moods
    list: () => {
      moodSystem.listMoods();
    },
    
    // Get current mood
    current: () => {
      const mood = moodSystem.getCurrentMood();
      console.log(`${mood.icon} Current Mood: ${mood.name}`);
      console.log(`   Description: ${mood.description}`);
      console.log(`   Transitioning: ${mood.isTransitioning}`);
      return mood;
    },
    
    // Switch to calm
    calm: () => {
      moodSystem.activateMood('calm');
    },
    
    // Switch to premium
    premium: () => {
      moodSystem.activateMood('premium');
    },
    
    // Switch to intense
    intense: () => {
      moodSystem.activateMood('intense');
    },
    
    // Switch to meditative
    meditative: () => {
      moodSystem.activateMood('meditative');
    },
    
    // Get mood details
    details: (moodName) => {
      const details = moodSystem.getMoodDetails(moodName);
      if (details) {
        console.log(`${moodSystem.moods[moodName].icon} ${details.name}`);
        console.log(`   Description: ${details.description}`);
        console.table(details.config);
      }
      return details;
    },
    
    // Activate with custom transition
    activate: (moodName, transitionDuration = 0.5) => {
      moodSystem.activateMood(moodName, transitionDuration);
    },
    
    // Immediate switch (no transition)
    switch: (moodName) => {
      moodSystem.switchMoodImmediate(moodName);
    },
    
    // Test transition
    test: async () => {
      const moodNames = ['calm', 'premium', 'intense', 'meditative'];
      for (const mood of moodNames) {
        console.log(`\n🎨 Testing mood: ${mood}`);
        moodSystem.activateMood(mood, 1.0);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      moodSystem.activateMood('premium', 1.0);
      console.log('\n✅ Mood test sequence complete');
    }
  });
  
  console.log('✅ LinkVisualMoodSystem console API ready:');
  console.log('   debugLinkMood.list()              — List all moods');
  console.log('   debugLinkMood.current()           — Show current mood');
  console.log('   debugLinkMood.calm()              — Switch to calm');
  console.log('   debugLinkMood.premium()           — Switch to premium');
  console.log('   debugLinkMood.intense()           — Switch to intense');
  console.log('   debugLinkMood.meditative()        — Switch to meditative');
  console.log('   debugLinkMood.details(moodName)   — Show mood details');
  console.log('   debugLinkMood.activate(moodName, duration) — Activate with transition');
  console.log('   debugLinkMood.switch(moodName)    — Immediate switch');
  console.log('   debugLinkMood.test()              — Test all moods');
}
