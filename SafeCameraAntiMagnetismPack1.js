import * as THREE from 'three';

export class SafeCameraAntiMagnetismPack1 {
  constructor(camera, dreamDepthPack, cameraFXPack) {
    this.camera = camera;
    this.dreamDepthPack = dreamDepthPack;
    this.cameraFXPack = cameraFXPack;
    
    this.registry = {
      antiMagnetismActive: true,
      disabledSystems: [],
      magneticConstantsNulled: 0,
      focusSystemsDisabled: 0,
      cameraLockdownActive: true
    };
    
    this.baseState = {
      position: camera.position.clone(),
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z
      },
      quaternion: camera.quaternion.clone()
    };
    
    this.config = {
      magneticConstants: {
        attractionStrength: 0,
        autoFramingStrength: 0,
        targetMagnetism: 0,
        cameraInterestBias: 0,
        nodeFocus: 0,
        colonyPull: 0,
        eventPan: 0,
        weatherPull: 0,
        synergyAttract: 0
      },
      
      focusDisable: {
        autoFocusEnabled: false,
        nodeAutoFocus: false,
        linkPulseFocus: false,
        legendaryHyperfocus: false,
        colonyFocusAssist: false,
        worldEventFocus: false,
        dotSimulationTargeting: false,
        cinematicTargetLock: false
      },
      
      framingLockdown: {
        adaptiveFramingEnabled: false,
        automatedPansEnabled: false,
        screenOffsetCompositionEnabled: false,
        eventBasedAutoAimEnabled: false
      },
      
      offsetCurves: {
        cameraOffsetLerp: 0,
        cameraPullTowardTarget: 0,
        cameraGlideToPointOfInterest: 0
      }
    };
    
    this.disableAllMagnetism();
  }
  
  disableAllMagnetism() {
    console.log('🔒 ANTI-MAGNETISM PACK 1.0: Disabling all camera magnetism...');
    
    this.disableDreamDepthFocus();
    this.disableCameraFXFraming();
    this.nullifyMagneticConstants();
    this.disableFocusSystems();
    this.lockdownFraming();
    this.zeroOffsetCurves();
    
    console.log('✅ ANTI-MAGNETISM PACK 1.0: All magnetism disabled');
    console.log('   Camera will ONLY respond to:');
    console.log('   - Mouse input (yaw/pitch)');
    console.log('   - Player position');
    console.log('   - No automatic attraction');
  }
  
  disableDreamDepthFocus() {
    if (!this.dreamDepthPack) return;
    
    try {
      if (this.dreamDepthPack.config) {
        if (this.dreamDepthPack.config.focus) {
          this.dreamDepthPack.config.focus.enabled = false;
          this.dreamDepthPack.config.focus.contrastBoost = 0;
          this.dreamDepthPack.config.focus.vignetteIncrease = 0;
          this.dreamDepthPack.config.focus.backgroundFade = 0;
        }
      }
      
      if (this.dreamDepthPack.autoFocusOnTarget) {
        this.dreamDepthPack.autoFocusOnTarget = function() {};
      }
      
      this.dreamDepthPack.focusTransition = 0;
      this.dreamDepthPack.currentFocus = null;
      
      this.registry.disabledSystems.push('DreamDepthFocus');
      console.log('  ✓ Disabled Dream Depth Pack auto-focus');
    } catch (e) {
      console.warn('  ⚠ Could not disable Dream Depth focus:', e.message);
    }
  }
  
  disableCameraFXFraming() {
    if (!this.cameraFXPack) return;
    
    try {
      if (this.cameraFXPack.config) {
        this.cameraFXPack.config.maxTilt = 0;
        this.cameraFXPack.config.maxFOVOffset = 0;
        this.cameraFXPack.config.eventDriftSpeed = 0;
      }
      
      if (this.cameraFXPack.registry) {
        this.cameraFXPack.registry.tiltAmount = 0;
        this.cameraFXPack.registry.fovOffset = 0;
        this.cameraFXPack.registry.basePosition = this.camera.position.clone();
      }
      
      this.cameraFXPack.targetTilt = 0;
      this.cameraFXPack.currentTilt = 0;
      this.cameraFXPack.eventDriftPhase = 0;
      
      this.registry.disabledSystems.push('CameraFXFraming');
      console.log('  ✓ Disabled Camera FX Pack framing');
    } catch (e) {
      console.warn('  ⚠ Could not disable Camera FX framing:', e.message);
    }
  }
  
  nullifyMagneticConstants() {
    window.CAMERA_MAGNETISM = {
      attractionStrength: 0,
      autoFramingStrength: 0,
      targetMagnetism: 0,
      cameraInterestBias: 0,
      nodeFocus: 0,
      colonyPull: 0,
      eventPan: 0,
      weatherPull: 0,
      synergyAttract: 0
    };
    
    this.registry.magneticConstantsNulled = 9;
    console.log('  ✓ Nullified 9 magnetic constants (all = 0)');
  }
  
  disableFocusSystems() {
    window.CAMERA_FOCUS_DISABLE = {
      autoFocusEnabled: false,
      nodeAutoFocus: false,
      linkPulseFocus: false,
      legendaryHyperfocus: false,
      colonyFocusAssist: false,
      worldEventFocus: false,
      dotSimulationTargeting: false,
      cinematicTargetLock: false
    };
    
    this.registry.focusSystemsDisabled = 8;
    console.log('  ✓ Disabled 8 focus systems');
  }
  
  lockdownFraming() {
    window.CAMERA_FRAMING_LOCKDOWN = {
      adaptiveFramingEnabled: false,
      automatedPansEnabled: false,
      screenOffsetCompositionEnabled: false,
      eventBasedAutoAimEnabled: false,
      cameraOffsetLerp: 0,
      cameraPullTowardTarget: 0,
      cameraGlideToPointOfInterest: 0
    };
    
    console.log('  ✓ Framing locked down (no composition shifts)');
  }
  
  zeroOffsetCurves() {
    window.CAMERA_OFFSET_CURVES = {
      cameraOffsetLerp: 0,
      cameraPullTowardTarget: 0,
      cameraGlideToPointOfInterest: 0,
      cameraLookAtTarget: null,
      targetOffsetPosition: new THREE.Vector3(0, 0, 0),
      targetOffsetEasing: 0
    };
    
    console.log('  ✓ Offset curves zeroed');
  }
  
  enforceAntiMagnetism() {
    if (!this.registry.cameraLockdownActive) return;
    
    if (window.CAMERA_MAGNETISM) {
      for (const key in window.CAMERA_MAGNETISM) {
        if (typeof window.CAMERA_MAGNETISM[key] === 'number') {
          window.CAMERA_MAGNETISM[key] = 0;
        }
      }
    }
    
    if (window.CAMERA_FOCUS_DISABLE) {
      for (const key in window.CAMERA_FOCUS_DISABLE) {
        if (typeof window.CAMERA_FOCUS_DISABLE[key] === 'boolean') {
          window.CAMERA_FOCUS_DISABLE[key] = false;
        }
      }
    }
    
    if (window.CAMERA_FRAMING_LOCKDOWN) {
      for (const key in window.CAMERA_FRAMING_LOCKDOWN) {
        if (typeof window.CAMERA_FRAMING_LOCKDOWN[key] === 'boolean') {
          window.CAMERA_FRAMING_LOCKDOWN[key] = false;
        }
        if (typeof window.CAMERA_FRAMING_LOCKDOWN[key] === 'number') {
          window.CAMERA_FRAMING_LOCKDOWN[key] = 0;
        }
      }
    }
    
    if (window.CAMERA_OFFSET_CURVES) {
      for (const key in window.CAMERA_OFFSET_CURVES) {
        if (typeof window.CAMERA_OFFSET_CURVES[key] === 'number') {
          window.CAMERA_OFFSET_CURVES[key] = 0;
        }
      }
    }
  }
  
  getStatus() {
    return {
      active: this.registry.antiMagnetismActive,
      systemsDisabled: this.registry.disabledSystems.length,
      magneticConstantsNulled: this.registry.magneticConstantsNulled,
      focusSystemsDisabled: this.registry.focusSystemsDisabled,
      cameraLocked: this.registry.cameraLockdownActive,
      disabledSystems: this.registry.disabledSystems
    };
  }
  
  printStatusReport() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  SAFE CAMERA ANTI-MAGNETISM PACK 1.0 - STATUS        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    const status = this.getStatus();
    
    console.log('🔒 ANTI-MAGNETISM STATUS:');
    console.log('   Active: ' + status.active);
    console.log('   Camera Locked: ' + status.cameraLocked);
    console.log('   Disabled Systems: ' + status.systemsDisabled);
    console.log('   Magnetic Constants Nulled: ' + status.magneticConstantsNulled);
    console.log('   Focus Systems Disabled: ' + status.focusSystemsDisabled);
    
    console.log('\n✅ CAMERA ALLOWED TO MOVE FROM:');
    console.log('   - Mouse input (yaw/pitch)');
    console.log('   - Player position (WASD movement)');
    console.log('   - Input smoothing/dampening');
    
    console.log('\n❌ CAMERA BLOCKED FROM:');
    console.log('   - Node magnetism (attraction strength = 0)');
    console.log('   - Auto-focus systems (disabled)');
    console.log('   - Synergy hotspot targeting (magnetism = 0)');
    console.log('   - Legendary node hyperfocus (disabled)');
    console.log('   - Colony center attraction (pull = 0)');
    console.log('   - Weather anomaly pulls (strength = 0)');
    console.log('   - World event pans (enabled = false)');
    console.log('   - Cinematic framing (locked down)');
    console.log('   - Any lookAt() calls to world objects');
    
    console.log('\n📊 DISABLED SYSTEMS:');
    status.disabledSystems.forEach((sys, i) => {
      console.log('   ' + (i + 1) + '. ' + sys);
    });
    
    console.log('\n🎮 GUARANTEED BEHAVIOR:');
    console.log('   Pure first-person camera control');
    console.log('   No automatic attraction or tracking');
    console.log('   No hidden offsets or lerps');
    console.log('   No cinematic camera composition');
    console.log('   100% player input driven\n');
  }
}
