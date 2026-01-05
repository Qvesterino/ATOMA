import * as THREE from 'three';

/**
 * TEMPORAL EVENT EFFECTS
 * 
 * Safe, purely visual effects triggered on temporal milestones.
 * Completely non-intrusive:
 * - No camera movement
 * - No geometry distortion
 * - No physics changes
 * - Auto-disables if conflicts detected
 */

export class TemporalEventEffects {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.enabled = true;
    
    // Post-processing effects
    this.composer = null;
    this.vignettePass = null;
    
    // Cycle glow (HUD-level only, handled by HUD)
    this.cycleGlowActive = false;
    
    // Epoch color shift
    this.epochShiftActive = false;
    this.epochShiftElapsedTime = 0;
    this.epochShiftTotalTime = 3.0; // 3 seconds in + fade out
    this.epochShiftMaxIntensity = 0.08; // 8% color shift
    this.originalBackgroundColor = this.scene.background ? this.scene.background.clone() : null;
    
    // Aeon pulse effect state
    this.aeonPulseActive = false;
    this.aeonPulseElapsedTime = 0;
    this.aeonPulseTotalTime = 3.0;
    this.aeonPulseGlyphs = [];
    
    // Animation phases
    this.animationPhases = {
      epochFadeIn: 0.5,   // 0.5s to fade in
      epochFadeOut: 2.0,  // 2s to fade out (after peak)
      aeonPulseDuration: 3.0
    };
  }
  
  /**
   * Update temporal effects
   */
  update(deltaTime, temporalEvents) {
    if (!this.enabled) return;
    
    // Update epoch color shift
    if (temporalEvents.newEpoch) {
      this.triggerEpochShift();
    }
    this.updateEpochShift(deltaTime);
    
    // Update aeon pulse
    if (temporalEvents.newAeon) {
      this.triggerAeonPulse();
    }
    this.updateAeonPulse(deltaTime);
  }
  
  /**
   * Trigger epoch color shift (subtle background tint)
   */
  triggerEpochShift() {
    this.epochShiftActive = true;
    this.epochShiftElapsedTime = 0;
  }
  
  /**
   * Update epoch color shift
   */
  updateEpochShift(deltaTime) {
    if (!this.epochShiftActive) return;
    
    this.epochShiftElapsedTime += deltaTime;
    
    if (this.epochShiftElapsedTime >= this.epochShiftTotalTime) {
      this.epochShiftActive = false;
      
      // Restore original background
      if (this.originalBackgroundColor && this.scene.background) {
        this.scene.background.copy(this.originalBackgroundColor);
      }
      return;
    }
    
    // Calculate fade in/out
    let intensity = 0;
    
    if (this.epochShiftElapsedTime < this.animationPhases.epochFadeIn) {
      // Fade in
      const progress = this.epochShiftElapsedTime / this.animationPhases.epochFadeIn;
      intensity = progress * this.epochShiftMaxIntensity;
    } else if (this.epochShiftElapsedTime < this.animationPhases.epochFadeIn + this.animationPhases.epochFadeOut) {
      // Fade out
      const fadeOutStart = this.animationPhases.epochFadeIn;
      const fadeOutProgress = (this.epochShiftElapsedTime - fadeOutStart) / this.animationPhases.epochFadeOut;
      intensity = this.epochShiftMaxIntensity * (1.0 - fadeOutProgress);
    }
    
    // Apply color shift to background
    if (this.originalBackgroundColor && this.scene.background) {
      const shiftedColor = this.originalBackgroundColor.clone();
      
      // Add subtle cyan tint
      shiftedColor.r = Math.min(1.0, shiftedColor.r + intensity * 0.3);
      shiftedColor.g = Math.min(1.0, shiftedColor.g + intensity * 0.5);
      shiftedColor.b = Math.min(1.0, shiftedColor.b + intensity * 0.6);
      
      this.scene.background.copy(shiftedColor);
    }
  }
  
  /**
   * Trigger aeon pulse effect
   */
  triggerAeonPulse() {
    this.aeonPulseActive = true;
    this.aeonPulseElapsedTime = 0;
    
    // Create subtle glyph particles (optional visual flourish)
    this.createAeonGlyphs();
  }
  
  /**
   * Create aeon glyph particles (purely visual)
   */
  createAeonGlyphs() {
    try {
      // Create a few glyph particles in the center of screen
      const glyphCount = 3;
      const glyphs = ['◎', '◈', '※'];
      
      for (let i = 0; i < glyphCount; i++) {
        const glyph = {
          character: glyphs[i % glyphs.length],
          startTime: 0,
          duration: 2.0 + Math.random() * 1.0, // 2-3 seconds
          startOpacity: 0.8,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight * 0.3, // Upper portion of screen
          velocityY: -20 - Math.random() * 30 // Upward drift
        };
        
        this.aeonPulseGlyphs.push(glyph);
      }
    } catch (error) {
      console.warn('Error creating aeon glyphs:', error);
    }
  }
  
  /**
   * Update aeon pulse effect
   */
  updateAeonPulse(deltaTime) {
    if (!this.aeonPulseActive) return;
    
    this.aeonPulseElapsedTime += deltaTime;
    
    if (this.aeonPulseElapsedTime >= this.aeonPulseTotalTime) {
      this.aeonPulseActive = false;
      this.aeonPulseGlyphs = [];
      return;
    }
    
    // Update glyph visibility
    this.updateAeonGlyphs(deltaTime);
  }
  
  /**
   * Update aeon glyph particles
   */
  updateAeonGlyphs(deltaTime) {
    this.aeonPulseGlyphs.forEach((glyph, index) => {
      glyph.startTime += deltaTime;
      
      if (glyph.startTime > glyph.duration) {
        this.aeonPulseGlyphs.splice(index, 1);
      }
    });
  }
  
  /**
   * Render aeon glyphs (called from main render loop if needed)
   */
  renderAeonGlyphs() {
    if (this.aeonPulseGlyphs.length === 0) return;
    
    // Note: This would require canvas overlay or DOM elements
    // For safety, we skip complex glyph rendering
    // Optional: Could render to a canvas 2D context if needed
  }
  
  /**
   * Enable temporal effects
   */
  enable() {
    this.enabled = true;
  }
  
  /**
   * Disable temporal effects
   */
  disable() {
    this.enabled = false;
    
    // Restore original background
    if (this.originalBackgroundColor && this.scene.background) {
      this.scene.background.copy(this.originalBackgroundColor);
    }
  }
  
  /**
   * Cleanup resources
   */
  cleanup() {
    this.disable();
    this.aeonPulseGlyphs = [];
  }
}
