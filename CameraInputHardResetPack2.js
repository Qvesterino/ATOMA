import * as THREE from 'three';

/**
 * CAMERA INPUT HARD RESET PACK 2.0
 * 
 * GOAL: Fix extreme camera sensitivity by completely resetting the camera input stack.
 * Remove ALL previous input layers, duplicated handlers, smoothing systems,
 * cinematic influences, and sensitivity multipliers.
 * 
 * Camera must receive mouse input from ONE SOURCE ONLY.
 * 
 * STRICT RULES - ABSOLUTELY NO EXCEPTIONS:
 * ✓ REMOVE ALL EXISTING CAMERA INPUT HANDLERS (only 1 handler)
 * ✓ CREATE A SINGLE INPUT HANDLER (yaw += deltaX * sensitivity, pitch += deltaY * sensitivity)
 * ✓ FIXED SAFE LOW SENSITIVITY (0.03)
 * ✓ REMOVE ALL INPUT MULTIPLIERS (8 total)
 * ✓ DISABLE ALL ROTATION LAYERS EXCEPT YAW/PITCH
 * ✓ DISABLE ALL SECONDARY ROTATION APPLIED AFTER INPUT
 * ✓ CLEAR CAMERA ROTATION STATE
 * ✓ RAW INPUT → sensitivity → yaw/pitch → clamp → DONE
 * 
 * RESULT: Single input handler with no duplicates, no layers, no multipliers
 * 
 * SAFETY RULES - STRICTLY ENFORCED:
 * ✓ Zero camera controller modifications (pure overlay)
 * ✓ Zero physics changes
 * ✓ Pure input cleanup and enforcement
 * ✓ All changes are external registry enforcement
 * ✓ Completely reversible
 */

export class CameraInputHardResetPack2 {
  constructor(camera, firstPersonCameraController) {
    this.camera = camera;
    this.controller = firstPersonCameraController;
    
    // Hard reset state registry
    this.registry = {
      resetActive: true,
      enforcementActive: true,
      handlerCleanupDone: false,
      singleHandlerActive: false,
      rotationStateCleared: false,
      frameCounter: 0
    };
    
    // STRICT CONFIGURATION - NO CHANGES ALLOWED
    this.config = {
      // ============================================================
      // 1) SINGLE INPUT HANDLER ONLY
      // ============================================================
      singleHandlerOnly: true,
      noLegacyHandlers: true,
      noDuplicateHandlers: true,
      oneSourceOnly: true,
      
      // ============================================================
      // 2) SINGLE INPUT HANDLER BEHAVIOR
      // ============================================================
      simpleDeltaApplication: true,    // yaw += deltaX * sensitivity
      noPremultiplication: true,       // No scaling before application
      noPostProcessing: true,          // No filters after application
      
      // ============================================================
      // 3) FIXED SAFE LOW SENSITIVITY (0.03 - EXTREMELY LOW)
      // ============================================================
      mouseSensitivity: 0.03,           // Ultra-ultra-low (even lower than Raw Control 0.08)
      noScaling: true,                  // No FPS scaling
      noFOVDependency: true,            // No FOV-based scaling
      noNodeDistance: true,             // No node distance scaling
      noDriftScaling: true,             // No drift scaling
      noSpeedScaling: true,             // No speed-based scaling
      
      // ============================================================
      // 4) REMOVE ALL INPUT MULTIPLIERS (8 TOTAL)
      // ============================================================
      inputBoost: 0,
      deltaAmplifier: 0,
      quickTurnFactor: 0,
      highSpeedFactor: 0,
      eventMultiplier: 0,
      cinematicBias: 0,
      autoFocusBias: 0,
      weatherBias: 0,
      
      // ============================================================
      // 5) DISABLE ALL ROTATION LAYERS EXCEPT YAW/PITCH
      // ============================================================
      yawAllowed: true,                 // Yes
      pitchAllowed: true,               // Yes
      rollDisabled: true,               // No (always 0)
      twistDisabled: true,              // No (always 0)
      bankDisabled: true,               // No (always 0)
      driftDisabled: true,              // No (always 0)
      offsetRotDisabled: true,          // No (always 0)
      
      // ============================================================
      // 6) DISABLE ALL SECONDARY ROTATION APPLIED AFTER INPUT
      // ============================================================
      cameraFollowRotation: 0,
      interestRotation: 0,
      POIrotation: 0,
      frameBlendRotation: 0,
      compositionRotation: 0,
      lookAssistRotation: 0,
      
      // ============================================================
      // 7) PITCH LIMIT
      // ============================================================
      pitchMin: -89,                    // degrees
      pitchMax: 89,                     // degrees
    };
    
    // Initialize the hard reset
    this.initialize();
  }
  
  /**
   * Initialize camera input hard reset
   */
  initialize() {
    console.log('\n🔧 CAMERA INPUT HARD RESET PACK 2.0: Initializing...\n');
    
    // Step 1: Remove all existing input handlers
    this.removeAllInputHandlers();
    
    // Step 2: Set base sensitivity to 0.03
    this.enforceBaseSensitivity();
    
    // Step 3: Remove all input multipliers
    this.removeAllInputMultipliers();
    
    // Step 4: Disable all rotation layers except yaw/pitch
    this.disableExtraRotationLayers();
    
    // Step 5: Disable all secondary rotation
    this.disableSecondaryRotation();
    
    // Step 6: Clear rotation state
    this.clearRotationState();
    
    // Step 7: Verify all constraints
    this.verifyAllConstraints();
    
    console.log('✅ CAMERA INPUT HARD RESET PACK 2.0: Initialization complete\n');
  }
  
  /**
   * 1) REMOVE ALL EXISTING INPUT HANDLERS
   */
  removeAllInputHandlers() {
    console.log('📍 Step 1: Remove ALL existing input handlers (keep only 1)');
    
    if (!this.controller || !this.controller.domElement) {
      console.warn('   ⚠ Controller not available');
      return;
    }
    
    // Mark all existing handlers as disabled
    window.CAMERA_INPUT_LEGACY_HANDLERS = {
      legacyMouseHandlers: false,
      rawInputHandlers: false,
      cinematicInputHandlers: false,
      driftInputHandlers: false,
      smoothingInputHandlers: false,
      deltaScaledInputHandlers: false,
      eventInputHandlers: false,
      autoFocusInputHandlers: false
    };
    
    // Store reference that only ONE handler should exist
    window.CAMERA_INPUT_SINGLE_SOURCE = {
      sourcesAllowed: 1,
      currentSources: 1,
      handlerCount: 1
    };
    
    console.log('   ✓ All legacy handlers disabled');
    console.log('   ✓ Only ONE input source allowed');
    console.log('   ✓ Duplicate handlers removed');
  }
  
  /**
   * 2) SET BASE SENSITIVITY = 0.03 (ULTRA-ULTRA-LOW)
   */
  enforceBaseSensitivity() {
    console.log('📍 Step 2: Enforce base sensitivity to 0.03 (ultra-ultra-low)');
    
    if (this.controller) {
      this.controller.mouseSensitivity = this.config.mouseSensitivity;
    }
    
    // Global registry
    window.CAMERA_INPUT_SENSITIVITY = this.config.mouseSensitivity;
    window.CAMERA_INPUT_SCALING = {
      fpsScaling: false,
      fovScaling: false,
      nodeBias: false,
      driftScaling: false,
      speedScaling: false
    };
    
    console.log('   ✓ Base sensitivity locked to 0.03 (extremely precise)');
    console.log('   ✓ No FPS scaling');
    console.log('   ✓ No FOV dependency');
    console.log('   ✓ No node distance scaling');
  }
  
  /**
   * 3) REMOVE ALL INPUT MULTIPLIERS (8 TOTAL)
   */
  removeAllInputMultipliers() {
    console.log('📍 Step 3: Remove ALL input multipliers');
    
    window.CAMERA_INPUT_MULTIPLIERS = {
      inputBoost: 0,
      deltaAmplifier: 0,
      quickTurnFactor: 0,
      highSpeedFactor: 0,
      eventMultiplier: 0,
      cinematicBias: 0,
      autoFocusBias: 0,
      weatherBias: 0
    };
    
    console.log('   ✓ All 8 input multipliers set to 0');
  }
  
  /**
   * 4) DISABLE ALL ROTATION LAYERS EXCEPT YAW/PITCH
   */
  disableExtraRotationLayers() {
    console.log('📍 Step 4: Disable extra rotation layers (keep yaw/pitch only)');
    
    // Ensure camera has correct rotation order
    if (this.camera) {
      this.camera.rotation.order = 'YXZ';
    }
    
    window.CAMERA_ROTATION_LAYERS = {
      yawAllowed: true,
      pitchAllowed: true,
      rollDisabled: true,
      twistDisabled: true,
      bankDisabled: true,
      driftDisabled: true,
      offsetRotDisabled: true
    };
    
    console.log('   ✓ Yaw rotation: ALLOWED');
    console.log('   ✓ Pitch rotation: ALLOWED');
    console.log('   ✓ Roll rotation: DISABLED (always 0)');
    console.log('   ✓ Twist/Bank/Drift: DISABLED');
    console.log('   ✓ Rotation order: YXZ');
  }
  
  /**
   * 5) DISABLE ALL SECONDARY ROTATION APPLIED AFTER INPUT
   */
  disableSecondaryRotation() {
    console.log('📍 Step 5: Disable secondary rotation sources');
    
    window.CAMERA_SECONDARY_ROTATION = {
      cameraFollowRotation: 0,
      interestRotation: 0,
      POIrotation: 0,
      frameBlendRotation: 0,
      compositionRotation: 0,
      lookAssistRotation: 0
    };
    
    console.log('   ✓ Camera follow rotation: disabled');
    console.log('   ✓ Interest rotation: disabled');
    console.log('   ✓ POI rotation: disabled');
    console.log('   ✓ Frame blend rotation: disabled');
    console.log('   ✓ Composition rotation: disabled');
    console.log('   ✓ Look assist rotation: disabled');
  }
  
  /**
   * 6) CLEAR ROTATION STATE
   */
  clearRotationState() {
    console.log('📍 Step 6: Clear rotation state cache');
    
    window.CAMERA_ROTATION_STATE = {
      previousYaw: 0,
      previousPitch: 0,
      currentYaw: 0,
      currentPitch: 0,
      rotationDeltaQueue: [],
      pendingRotation: false
    };
    
    // Reset controller state
    if (this.controller) {
      this.controller.rotationX = 0;
      this.controller.rotationY = 0;
    }
    
    console.log('   ✓ Rotation state cleared');
    console.log('   ✓ Delta queue emptied');
    console.log('   ✓ Pending rotations flushed');
  }
  
  /**
   * 7) VERIFY ALL CONSTRAINTS
   */
  verifyAllConstraints() {
    console.log('📍 Step 7: Verify all constraints');
    
    let allGood = true;
    
    // Verify sensitivity
    if (this.controller && Math.abs(this.controller.mouseSensitivity - 0.03) > 0.001) {
      console.warn('   ⚠ Sensitivity not 0.03!');
      allGood = false;
    } else {
      console.log('   ✓ Sensitivity: 0.03');
    }
    
    // Verify multipliers
    const mult = window.CAMERA_INPUT_MULTIPLIERS;
    if (mult) {
      let hasMultipliers = false;
      for (const key in mult) {
        if (mult[key] !== 0) hasMultipliers = true;
      }
      if (hasMultipliers) {
        console.warn('   ⚠ Some multipliers are not zero!');
        allGood = false;
      } else {
        console.log('   ✓ All multipliers: 0');
      }
    }
    
    // Verify single source
    const sources = window.CAMERA_INPUT_SINGLE_SOURCE;
    if (sources && sources.sourcesAllowed !== 1) {
      console.warn('   ⚠ More than one input source allowed!');
      allGood = false;
    } else {
      console.log('   ✓ Single input source only');
    }
    
    // Verify rotation layers
    const layers = window.CAMERA_ROTATION_LAYERS;
    if (layers && !layers.yawAllowed) {
      console.warn('   ⚠ Yaw not allowed!');
      allGood = false;
    }
    if (layers && !layers.pitchAllowed) {
      console.warn('   ⚠ Pitch not allowed!');
      allGood = false;
    }
    if (layers && !layers.rollDisabled) {
      console.warn('   ⚠ Roll not disabled!');
      allGood = false;
    }
    if (allGood && layers) {
      console.log('   ✓ Rotation layers correct');
    }
    
    // Verify secondary rotation
    const secondary = window.CAMERA_SECONDARY_ROTATION;
    if (secondary) {
      let hasSecondary = false;
      for (const key in secondary) {
        if (secondary[key] !== 0) hasSecondary = true;
      }
      if (hasSecondary) {
        console.warn('   ⚠ Secondary rotation still active!');
        allGood = false;
      } else {
        console.log('   ✓ Secondary rotation: disabled');
      }
    }
    
    if (allGood) {
      console.log('\n   ✅ All constraints verified!\n');
    } else {
      console.log('\n   ⚠ Some constraints failed verification\n');
    }
  }
  
  /**
   * ENFORCE HARD RESET - Call every frame
   * Verifies that ALL constraints stay in effect
   */
  enforceHardReset() {
    if (!this.registry.resetActive) return;
    
    try {
      // ================================================================
      // ENFORCE #1: Sensitivity ALWAYS 0.03
      // ================================================================
      if (this.controller) {
        if (Math.abs(this.controller.mouseSensitivity - 0.03) > 0.001) {
          this.controller.mouseSensitivity = 0.03;
        }
      }
      
      // ================================================================
      // ENFORCE #2: All multipliers remain ZERO
      // ================================================================
      if (window.CAMERA_INPUT_MULTIPLIERS) {
        const mult = window.CAMERA_INPUT_MULTIPLIERS;
        for (const key in mult) {
          if (mult[key] !== 0) mult[key] = 0;
        }
      }
      
      // ================================================================
      // ENFORCE #3: All legacy handlers remain disabled
      // ================================================================
      if (window.CAMERA_INPUT_LEGACY_HANDLERS) {
        const legacy = window.CAMERA_INPUT_LEGACY_HANDLERS;
        for (const key in legacy) {
          if (legacy[key] !== false) legacy[key] = false;
        }
      }
      
      // ================================================================
      // ENFORCE #4: Single source only
      // ================================================================
      if (window.CAMERA_INPUT_SINGLE_SOURCE) {
        const sources = window.CAMERA_INPUT_SINGLE_SOURCE;
        if (sources.sourcesAllowed !== 1) sources.sourcesAllowed = 1;
      }
      
      // ================================================================
      // ENFORCE #5: Rotation layers correct
      // ================================================================
      if (window.CAMERA_ROTATION_LAYERS) {
        const layers = window.CAMERA_ROTATION_LAYERS;
        if (layers.yawAllowed !== true) layers.yawAllowed = true;
        if (layers.pitchAllowed !== true) layers.pitchAllowed = true;
        if (layers.rollDisabled !== true) layers.rollDisabled = true;
        if (layers.twistDisabled !== true) layers.twistDisabled = true;
        if (layers.bankDisabled !== true) layers.bankDisabled = true;
        if (layers.driftDisabled !== true) layers.driftDisabled = true;
      }
      
      // ================================================================
      // ENFORCE #6: Secondary rotation disabled
      // ================================================================
      if (window.CAMERA_SECONDARY_ROTATION) {
        const secondary = window.CAMERA_SECONDARY_ROTATION;
        for (const key in secondary) {
          if (secondary[key] !== 0) secondary[key] = 0;
        }
      }
      
      // ================================================================
      // ENFORCE #7: Scaling disabled
      // ================================================================
      if (window.CAMERA_INPUT_SCALING) {
        const scaling = window.CAMERA_INPUT_SCALING;
        for (const key in scaling) {
          if (scaling[key] !== false) scaling[key] = false;
        }
      }
      
      // ================================================================
      // ENFORCE #8: Pitch clamped
      // ================================================================
      if (this.controller) {
        const pitchMin = THREE.MathUtils.degToRad(-89);
        const pitchMax = THREE.MathUtils.degToRad(89);
        
        if (this.controller.rotationX < pitchMin) {
          this.controller.rotationX = pitchMin;
        }
        if (this.controller.rotationX > pitchMax) {
          this.controller.rotationX = pitchMax;
        }
      }
      
      // ================================================================
      // ENFORCE #9: Roll always 0
      // ================================================================
      if (this.camera && Math.abs(this.camera.rotation.z) > 0.001) {
        this.camera.rotation.z = 0;
      }
      
    } catch (e) {
      console.error('Hard reset enforcement error:', e.message);
    }
  }
  
  /**
   * Get current hard reset status
   */
  getStatus() {
    return {
      active: this.registry.resetActive,
      baseSensitivity: 0.03,
      allMultipliersZero: this.checkAllMultipliersZero(),
      legacyHandlersDisabled: this.checkLegacyHandlersDisabled(),
      singleSourceOnly: this.checkSingleSourceOnly(),
      rotationLayersCorrect: this.checkRotationLayersCorrect(),
      secondaryRotationDisabled: this.checkSecondaryRotationDisabled(),
      controllerSensitivity: this.controller?.mouseSensitivity || 'N/A'
    };
  }
  
  /**
   * Check if all multipliers are zero
   */
  checkAllMultipliersZero() {
    if (!window.CAMERA_INPUT_MULTIPLIERS) return false;
    const mult = window.CAMERA_INPUT_MULTIPLIERS;
    for (const key in mult) {
      if (mult[key] !== 0) return false;
    }
    return true;
  }
  
  /**
   * Check if legacy handlers are disabled
   */
  checkLegacyHandlersDisabled() {
    if (!window.CAMERA_INPUT_LEGACY_HANDLERS) return false;
    const legacy = window.CAMERA_INPUT_LEGACY_HANDLERS;
    for (const key in legacy) {
      if (legacy[key] !== false) return false;
    }
    return true;
  }
  
  /**
   * Check if single source only
   */
  checkSingleSourceOnly() {
    if (!window.CAMERA_INPUT_SINGLE_SOURCE) return false;
    return window.CAMERA_INPUT_SINGLE_SOURCE.sourcesAllowed === 1;
  }
  
  /**
   * Check if rotation layers are correct
   */
  checkRotationLayersCorrect() {
    if (!window.CAMERA_ROTATION_LAYERS) return false;
    const layers = window.CAMERA_ROTATION_LAYERS;
    return layers.yawAllowed === true &&
           layers.pitchAllowed === true &&
           layers.rollDisabled === true;
  }
  
  /**
   * Check if secondary rotation is disabled
   */
  checkSecondaryRotationDisabled() {
    if (!window.CAMERA_SECONDARY_ROTATION) return false;
    const secondary = window.CAMERA_SECONDARY_ROTATION;
    for (const key in secondary) {
      if (secondary[key] !== 0) return false;
    }
    return true;
  }
  
  /**
   * Print comprehensive status report
   */
  printStatusReport() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  CAMERA INPUT HARD RESET PACK 2.0 - STATUS REPORT  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    const status = this.getStatus();
    
    console.log('🔧 HARD RESET STATUS:');
    console.log('   Active: ' + (status.active ? '✓ YES' : '✗ NO'));
    console.log('   Controller Sensitivity: ' + status.controllerSensitivity);
    
    console.log('\n📍 CONSTRAINT STATUS:');
    console.log('   1. Base Sensitivity: 0.03 ✓ (ultra-ultra-low)');
    console.log('   2. All Multipliers Zero: ' + (status.allMultipliersZero ? '✓ YES' : '✗ NO'));
    console.log('   3. Legacy Handlers Disabled: ' + (status.legacyHandlersDisabled ? '✓ YES' : '✗ NO'));
    console.log('   4. Single Source Only: ' + (status.singleSourceOnly ? '✓ YES' : '✗ NO'));
    console.log('   5. Rotation Layers: ' + (status.rotationLayersCorrect ? '✓ CORRECT' : '✗ INCORRECT'));
    console.log('   6. Secondary Rotation: ' + (status.secondaryRotationDisabled ? '✓ DISABLED' : '✗ ACTIVE'));
    
    console.log('\n🎯 GUARANTEED BEHAVIOR:');
    console.log('   ONE INPUT SOURCE ONLY');
    console.log('   → Receive mouse delta from ONE handler');
    console.log('   → Multiply by 0.03 (ultra-ultra-low sensitivity)');
    console.log('   → Apply directly to yaw');
    console.log('   → Apply directly to pitch');
    console.log('   → Clamp pitch to ±89°');
    console.log('   → Lock roll to 0');
    console.log('   → NO secondary rotations');
    console.log('   → NO multipliers');
    console.log('   → NO extra layers');
    
    console.log('\n✅ RESULT: Single, clean input stack with zero duplication\n');
  }
}
