import * as THREE from 'three';

/**
 * Audio System for ATOMA
 * Manages ambient sounds, sound effects, and audio synthesis
 */
export class AudioSystem {
  constructor(options = {}) {
    this.audioContext = null;
    this.masterGain = null;
    this.sounds = new Map();
    this.activeAudio = new Map();
    this.musicTracks = new Map();
    this.currentMusic = null;
    this.ambientSounds = new Map();

    // Configuration
    this.config = {
      masterVolume: options.masterVolume || 0.5,
      sfxVolume: options.sfxVolume || 0.4,
      ambientVolume: options.ambientVolume || 0.3,
      musicVolume: options.musicVolume || 0.5,
      enabled: options.enabled !== false,
      useSynthesis: options.useSynthesis !== false
    };

    // Audio library (pre-generated or loaded)
    this.soundLibrary = {};

    // Initialize
    this.init();
  }

  /**
   * Initialize audio context
   */
  init() {
    if (!this.config.enabled) return;

    try {
      const audioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new audioContextClass();

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.config.masterVolume;
      this.masterGain.connect(this.audioContext.destination);

      // Create sub-gains for different types
      this.gains = {
        sfx: this.audioContext.createGain(),
        ambient: this.audioContext.createGain(),
        music: this.audioContext.createGain(),
        synthesis: this.audioContext.createGain()
      };

      Object.values(this.gains).forEach(gain => {
        gain.connect(this.masterGain);
      });

      this.gains.sfx.gain.value = this.config.sfxVolume;
      this.gains.ambient.gain.value = this.config.ambientVolume;
      this.gains.music.gain.value = this.config.musicVolume;

      console.log('✓ Audio system initialized');
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
      this.config.enabled = false;
    }
  }

  /**
   * Generate synthetic sound for node activation
   */
  generateNodeActivationSound(frequency = 440, duration = 0.3) {
    if (!this.audioContext) return null;

    const now = this.audioContext.currentTime;
    
    // Oscillator
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration * 0.5);
    
    // Gain envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.gains.sfx);

    osc.start(now);
    osc.stop(now + duration);

    return { osc, gainNode };
  }

  /**
   * Generate link creation sound
   */
  generateLinkCreationSound(startFreq = 220, endFreq = 440, duration = 0.5) {
    if (!this.audioContext) return null;

    const now = this.audioContext.currentTime;

    // Oscillator with frequency sweep
    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    // Envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + duration * 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.gains.sfx);

    osc.start(now);
    osc.stop(now + duration);

    return { osc, gainNode };
  }

  /**
   * Generate traffic flow sonification
   * Pitch and density correlate to link traffic
   */
  generateTrafficSonification(load = 0.5, priority = 0.5, duration = 1.0) {
    if (!this.audioContext) return null;

    const now = this.audioContext.currentTime;

    // Base frequency determined by priority (low traffic = low pitch)
    const baseFreq = 100 + priority * 400;
    
    // Create stereo effect for traffic variation
    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = baseFreq;

    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = baseFreq * 1.25;

    // Modulation based on load
    const lfo = this.audioContext.createOscillator();
    lfo.frequency.value = 4 + load * 8; // Faster modulation for higher load
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = load * 100;

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    // Combine oscillators
    const mixer = this.audioContext.createGain();
    osc1.connect(mixer);
    osc2.connect(mixer);

    // Master envelope
    const masterGain = this.audioContext.createGain();
    masterGain.gain.setValueAtTime(0.15, now);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    mixer.connect(masterGain);
    masterGain.connect(this.gains.synthesis);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    osc1.stop(now + duration);
    osc2.stop(now + duration);
    lfo.stop(now + duration);

    return { osc1, osc2, lfo, mixer };
  }

  /**
   * Generate error/denial sound
   */
  generateErrorSound(duration = 0.3) {
    if (!this.audioContext) return null;

    const now = this.audioContext.currentTime;

    // Harsh buzzer sound
    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + duration);

    // Quick envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.gains.sfx);

    osc.start(now);
    osc.stop(now + duration);

    return { osc, gainNode };
  }

  /**
   * Generate success/collection sound
   */
  generateSuccessSound(duration = 0.4) {
    if (!this.audioContext) return null;

    const now = this.audioContext.currentTime;

    // Pleasant ascending sweep
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + duration);

    // Smooth envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.gains.sfx);

    osc.start(now);
    osc.stop(now + duration);

    return { osc, gainNode };
  }

  /**
   * Play categorized sound effect
   */
  playSound(category, options = {}) {
    if (!this.audioContext || !this.config.enabled) return;

    const {
      frequency = 440,
      volume = 0.3,
      duration = 0.3,
      pitch = 1.0,
      delay = 0
    } = options;

    let soundGenerator;

    switch (category) {
      case 'node_activate':
        soundGenerator = this.generateNodeActivationSound(frequency * pitch, duration);
        break;
      case 'link_create':
        soundGenerator = this.generateLinkCreationSound(
          220 * pitch,
          440 * pitch,
          duration
        );
        break;
      case 'link_delete':
        soundGenerator = this.generateErrorSound(duration);
        break;
      case 'traffic_flow':
        soundGenerator = this.generateTrafficSonification(options.load || 0.5, options.priority || 0.5, duration);
        break;
      case 'error':
        soundGenerator = this.generateErrorSound(duration);
        break;
      case 'success':
      case 'collect_standard':
      case 'collect_rare':
      case 'collect_legendary':
        soundGenerator = this.generateSuccessSound(duration);
        break;
      default:
        return;
    }

    if (soundGenerator && delay > 0) {
      setTimeout(() => this.playSound(category, options), delay * 1000);
    }
  }

  /**
   * Play ambient sound loop
   */
  playAmbientSound(id, frequency = 100, duration = 5) {
    if (!this.audioContext || !this.config.enabled) return;

    const now = this.audioContext.currentTime;

    // Create LFO-modulated oscillator for ambient drone
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;

    // LFO for subtle pitch variation
    const lfo = this.audioContext.createOscillator();
    lfo.frequency.value = 0.3;
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 5;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 1);
    gainNode.gain.linearRampToValueAtTime(0.05, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.gains.ambient);

    osc.start(now);
    lfo.start(now);

    const stopTime = now + duration;
    osc.stop(stopTime);
    lfo.stop(stopTime);

    // Store reference
    this.ambientSounds.set(id, {
      osc, lfo, gainNode,
      startTime: now,
      duration
    });
  }

  /**
   * Stop ambient sound
   */
  stopAmbientSound(id) {
    const sound = this.ambientSounds.get(id);
    if (sound) {
      sound.osc.stop();
      sound.lfo.stop();
      this.ambientSounds.delete(id);
    }
  }

  /**
   * Create ambient soundscape
   */
  createAmbientSoundscape(environment = 'dream') {
    if (!this.audioContext || !this.config.enabled) return;

    const frequencies = {
      dream: [100, 125, 150, 200, 250],
      quantum: [200, 250, 300, 400, 500],
      fractal: [150, 225, 300, 450, 600],
      memory: [80, 120, 160, 240, 320]
    };

    const freqs = frequencies[environment] || frequencies.dream;

    freqs.forEach((freq, index) => {
      this.playAmbientSound(`ambient_${environment}_${index}`, freq, 10);
    });
  }

  /**
   * Stop all ambient sounds
   */
  stopAllAmbientSounds() {
    this.ambientSounds.forEach((_, id) => {
      this.stopAmbientSound(id);
    });
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume) {
    this.config.masterVolume = THREE.MathUtils.clamp(volume, 0, 1);
    if (this.masterGain) {
      this.masterGain.gain.value = this.config.masterVolume;
    }
  }

  /**
   * Set SFX volume
   */
  setSFXVolume(volume) {
    this.config.sfxVolume = THREE.MathUtils.clamp(volume, 0, 1);
    if (this.gains.sfx) {
      this.gains.sfx.gain.value = this.config.sfxVolume;
    }
  }

  /**
   * Set ambient volume
   */
  setAmbientVolume(volume) {
    this.config.ambientVolume = THREE.MathUtils.clamp(volume, 0, 1);
    if (this.gains.ambient) {
      this.gains.ambient.gain.value = this.config.ambientVolume;
    }
  }

  /**
   * Resume audio context if suspended
   */
  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      console.log('Audio context resumed');
    }
  }

  /**
   * Enable/disable audio
   */
  toggleAudio() {
    this.config.enabled = !this.config.enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this.config.enabled ? this.config.masterVolume : 0;
    }
  }

  /**
   * Get audio stats
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      masterVolume: this.config.masterVolume,
      activeAmbientSounds: this.ambientSounds.size,
      audioContextState: this.audioContext?.state || 'unavailable'
    };
  }

  /**
   * Dispose
   */
  dispose() {
    this.stopAllAmbientSounds();
    // Audio context cannot be fully disposed, but we can clean up references
    this.sounds.clear();
    this.ambientSounds.clear();
    this.musicTracks.clear();
  }
}

/**
 * Audio Manager for ATOMA Game
 * Handles all audio interactions
 */
export class AudioManager {
  constructor(game, options = {}) {
    this.game = game;
    this.audioSystem = new AudioSystem(options);
    this.currentEnvironment = 'desert';
    this.soundPresets = this.createSoundPresets();
  }

  /**
   * Create sound effect presets
   */
  createSoundPresets() {
    return {
      node: {
        input: { frequency: 220, duration: 0.2 },
        process: { frequency: 330, duration: 0.25 },
        integration: { frequency: 440, duration: 0.2 },
        analytics: { frequency: 550, duration: 0.25 },
        storage: { frequency: 660, duration: 0.2 },
        control: { frequency: 880, duration: 0.3 }
      },
      link: {
        create: { startFreq: 220, endFreq: 440, duration: 0.5 },
        delete: { duration: 0.3 },
        error: { duration: 0.3 },
        success: { duration: 0.4 }
      }
    };
  }

  /**
   * Play node activation sound
   */
  playNodeSound(category) {
    const preset = this.soundPresets.node[category];
    if (preset) {
      this.audioSystem.playSound('node_activate', preset);
    }
  }

  /**
   * Play link sound
   */
  playLinkSound(action) {
    const category = `link_${action}`;
    const preset = this.soundPresets.link[action];
    if (preset) {
      this.audioSystem.playSound(category, preset);
    }
  }

  /**
   * Play traffic sonification
   */
  playTrafficSound(load, priority) {
    this.audioSystem.playSound('traffic_flow', {
      load,
      priority,
      duration: 0.5
    });
  }

  /**
   * Switch environment sounds
   */
  switchEnvironment(environment) {
    this.currentEnvironment = environment;
    
    // Stop current ambient
    this.audioSystem.stopAllAmbientSounds();
    
    // Start new ambient
    this.audioSystem.createAmbientSoundscape(environment);
  }

  /**
   * Update game audio state
   */
  update(deltaTime) {
    // Handle any continuous audio updates
    // This could include 3D audio positioning based on player location
  }

  /**
   * Dispose
   */
  dispose() {
    this.audioSystem.dispose();
  }
}
