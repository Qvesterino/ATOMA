/**
 * TEMPORAL UNIT SYSTEM
 * 
 * Deterministic time tracking for ATOMA's deep time measurement.
 * Uses game time (not wall clock) for consistency.
 * 
 * Time Hierarchy:
 * - Cycle: 90 seconds (mm:ss)
 * - Epoch: 5 Cycles (450 seconds)
 * - Aeon: 10 Epochs (4,500 seconds / 75 minutes)
 */

export class TemporalUnitSystem {
  constructor() {
    this.elapsedTime = 0; // Total seconds elapsed
    
    // Time constants (in seconds)
    this.CYCLE_LENGTH = 90;
    this.EPOCH_LENGTH = this.CYCLE_LENGTH * 5;    // 450 seconds
    this.AEON_LENGTH = this.EPOCH_LENGTH * 10;    // 4,500 seconds
    
    // Current indices
    this.cycleIndex = 0;
    this.epochIndex = 0;
    this.aeonIndex = 0;
    
    // Track state changes for events
    this.lastCycleIndex = -1;
    this.lastEpochIndex = -1;
    this.lastAeonIndex = -1;
    
    // Event flags (set when transitions occur)
    this.newCycleThisFrame = false;
    this.newEpochThisFrame = false;
    this.newAeonThisFrame = false;
  }
  
  /**
   * Update temporal system
   * @param {number} deltaTime - Delta time in seconds
   * @returns {object} - Event flags
   */
  update(deltaTime) {
    // Clear event flags
    this.newCycleThisFrame = false;
    this.newEpochThisFrame = false;
    this.newAeonThisFrame = false;
    
    // Advance time
    this.elapsedTime += deltaTime;
    
    // Calculate current indices
    const newCycleIndex = Math.floor(this.elapsedTime / this.CYCLE_LENGTH);
    const newEpochIndex = Math.floor(newCycleIndex / 5);
    const newAeonIndex = Math.floor(newEpochIndex / 10);
    
    // Check for transitions
    if (newCycleIndex !== this.lastCycleIndex) {
      this.newCycleThisFrame = true;
      this.cycleIndex = newCycleIndex;
      this.lastCycleIndex = newCycleIndex;
    }
    
    if (newEpochIndex !== this.lastEpochIndex) {
      this.newEpochThisFrame = true;
      this.epochIndex = newEpochIndex;
      this.lastEpochIndex = newEpochIndex;
    }
    
    if (newAeonIndex !== this.lastAeonIndex) {
      this.newAeonThisFrame = true;
      this.aeonIndex = newAeonIndex;
      this.lastAeonIndex = newAeonIndex;
    }
    
    // Update indices for non-transition display
    this.cycleIndex = newCycleIndex;
    this.epochIndex = newEpochIndex;
    this.aeonIndex = newAeonIndex;
    
    return {
      newCycle: this.newCycleThisFrame,
      newEpoch: this.newEpochThisFrame,
      newAeon: this.newAeonThisFrame
    };
  }
  
  /**
   * Get current cycle time as mm:ss
   */
  getCycleTimeFormatted() {
    const timeInCycle = this.elapsedTime % this.CYCLE_LENGTH;
    const minutes = Math.floor(timeInCycle / 60);
    const seconds = Math.floor(timeInCycle % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Get current cycle progress (0-1)
   */
  getCycleProgress() {
    const timeInCycle = this.elapsedTime % this.CYCLE_LENGTH;
    return timeInCycle / this.CYCLE_LENGTH;
  }
  
  /**
   * Get current epoch progress (0-1)
   */
  getEpochProgress() {
    const timeInEpoch = this.elapsedTime % this.EPOCH_LENGTH;
    return timeInEpoch / this.EPOCH_LENGTH;
  }
  
  /**
   * Get formatted temporal display
   */
  getFormattedDisplay() {
    return {
      cycle: this.getCycleTimeFormatted(),
      cycleNumber: this.cycleIndex,
      epoch: this.epochIndex.toString().padStart(2, '0'),
      aeon: this.aeonIndex.toString().padStart(2, '0')
    };
  }
  
  /**
   * Get all temporal indices
   */
  getIndices() {
    return {
      cycle: this.cycleIndex,
      epoch: this.epochIndex,
      aeon: this.aeonIndex
    };
  }
  
  /**
   * Get total elapsed time in seconds
   */
  getTotalElapsedTime() {
    return this.elapsedTime;
  }
  
  /**
   * Check if this is a new cycle
   */
  isNewCycle() {
    return this.newCycleThisFrame;
  }
  
  /**
   * Check if this is a new epoch
   */
  isNewEpoch() {
    return this.newEpochThisFrame;
  }
  
  /**
   * Check if this is a new aeon
   */
  isNewAeon() {
    return this.newAeonThisFrame;
  }
}
