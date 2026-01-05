/**
 * TIER 4: GAMEPLAY FEEDBACK UI v1.0 (Session 40)
 * 
 * HUD overlay for link action feedback
 * 
 * Purpose: Display player-visible feedback for link interactions
 * - Link creation notifications with corruption impact
 * - Cascade risk warnings
 * - Harmony boost indicators
 * - Real-time network health meter
 * 
 * Pure UI layer — reads gameplay state, writes to DOM
 */

export class TIER4_GameplayFeedbackUI {
  constructor(config = {}) {
    this.config = {
      enableDebug: config.enableDebug ?? false,
      containerSelector: config.containerSelector ?? '#game-container',
      position: config.position ?? 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
      theme: config.theme ?? 'dark' // 'dark', 'light', 'neon'
    };
    
    this.container = null;
    this.hudElement = null;
    this.notificationQueue = [];
    this.activeNotifications = new Map();
    
    this.stats = {
      notificationsDisplayed: 0,
      totalNotificationTime: 0
    };
    
    this.init();
  }
  
  /**
   * Initialize UI elements
   */
  init() {
    // Create HUD container
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'tier4-gameplay-feedback-hud';
    this.hudElement.className = `tier4-hud tier4-hud-${this.config.position} tier4-hud-${this.config.theme}`;
    
    // Apply styles
    this.applyStyles();
    
    // Get or create parent container
    this.container = document.querySelector(this.config.containerSelector);
    if (!this.container) {
      this.container = document.body;
    }
    
    this.container.appendChild(this.hudElement);
    
    if (this.config.enableDebug) {
      console.log('[TIER4_GameplayFeedbackUI] Initialized ✓');
    }
  }
  
  /**
   * Apply CSS styles to HUD
   */
  applyStyles() {
    if (!this.hudElement) return;
    
    const styles = `
      #tier4-gameplay-feedback-hud {
        position: fixed;
        z-index: 9900;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        pointer-events: none;
        min-width: 250px;
        max-width: 400px;
      }
      
      /* Position variants */
      #tier4-gameplay-feedback-hud.tier4-hud-top-right {
        top: 20px;
        right: 20px;
      }
      
      #tier4-gameplay-feedback-hud.tier4-hud-top-left {
        top: 20px;
        left: 20px;
      }
      
      #tier4-gameplay-feedback-hud.tier4-hud-bottom-right {
        bottom: 20px;
        right: 20px;
      }
      
      #tier4-gameplay-feedback-hud.tier4-hud-bottom-left {
        bottom: 20px;
        left: 20px;
      }
      
      /* Theme variants */
      #tier4-gameplay-feedback-hud.tier4-hud-dark {
        background: rgba(10, 10, 15, 0.9);
        border: 1px solid rgba(100, 100, 120, 0.5);
        color: #00ff00;
      }
      
      #tier4-gameplay-feedback-hud.tier4-hud-light {
        background: rgba(240, 240, 240, 0.9);
        border: 1px solid rgba(100, 100, 100, 0.5);
        color: #000;
      }
      
      #tier4-gameplay-feedback-hud.tier4-hud-neon {
        background: rgba(10, 10, 20, 0.95);
        border: 2px solid #00ffff;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        color: #00ffff;
      }
      
      /* Notification styles */
      .tier4-notification {
        padding: 10px;
        margin: 5px 0;
        border-left: 3px solid;
        border-radius: 2px;
        animation: tier4-fadeIn 0.3s ease-out;
        opacity: 1;
        transition: opacity 0.3s ease;
      }
      
      @keyframes tier4-fadeIn {
        from {
          opacity: 0;
          transform: translateX(10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      /* Notification types */
      .tier4-notification.link-created {
        border-left-color: #ff6600;
        background: rgba(255, 102, 0, 0.1);
      }
      
      .tier4-notification.link-destroyed {
        border-left-color: #00ff00;
        background: rgba(0, 255, 0, 0.1);
      }
      
      .tier4-notification.cascade-warning {
        border-left-color: #ff0000;
        background: rgba(255, 0, 0, 0.15);
        animation: tier4-pulse 0.5s ease-in-out;
      }
      
      @keyframes tier4-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .tier4-notification.harmony-boost {
        border-left-color: #00ffff;
        background: rgba(0, 255, 255, 0.1);
      }
      
      /* Notification text */
      .tier4-notification-title {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 3px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .tier4-notification-message {
        font-size: 10px;
        opacity: 0.8;
        line-height: 1.3;
      }
      
      .tier4-notification-value {
        font-weight: bold;
        color: #ffff00;
      }
      
      /* Meter styles */
      .tier4-meter {
        margin-top: 10px;
        padding: 5px;
        border: 1px solid rgba(100, 100, 120, 0.3);
      }
      
      .tier4-meter-label {
        font-size: 9px;
        margin-bottom: 3px;
        opacity: 0.7;
      }
      
      .tier4-meter-bar {
        width: 100%;
        height: 6px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(100, 100, 120, 0.3);
        border-radius: 2px;
        overflow: hidden;
      }
      
      .tier4-meter-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff00, #ffff00, #ff6600);
        width: 50%;
        transition: width 0.3s ease;
      }
    `;
    
    // Inject styles if not already present
    if (!document.getElementById('tier4-gameplay-feedback-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'tier4-gameplay-feedback-styles';
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
  }
  
  /**
   * Display link creation notification
   */
  notifyLinkCreated(sourceNode, targetNode, corruptionAmount) {
    const notification = {
      type: 'link-created',
      title: 'Link Created',
      message: `Connection formed between nodes\nCorruption applied: <span class="tier4-notification-value">${(corruptionAmount * 100).toFixed(0)}%</span>`,
      duration: 3000
    };
    
    this.queueNotification(notification);
  }
  
  /**
   * Display link destruction notification
   */
  notifyLinkDestroyed(sourceNode, targetNode, harmonyRestored) {
    const notification = {
      type: 'link-destroyed',
      title: 'Link Destroyed',
      message: `Connection severed\nHarmony restored: <span class="tier4-notification-value">+${(harmonyRestored * 100).toFixed(0)}%</span>`,
      duration: 3000
    };
    
    this.queueNotification(notification);
  }
  
  /**
   * Display cascade warning
   */
  notifyCascadeWarning(sourceNode, corruptionLevel) {
    const notification = {
      type: 'cascade-warning',
      title: '⚠ Cascade Risk',
      message: `High corruption detected\nCascade threshold: <span class="tier4-notification-value">${(corruptionLevel * 100).toFixed(0)}%</span>`,
      duration: 4000
    };
    
    this.queueNotification(notification);
  }
  
  /**
   * Display harmony boost notification
   */
  notifyHarmonyBoost(nodeCount, harmonyAmount) {
    const notification = {
      type: 'harmony-boost',
      title: '✓ Harmony Restored',
      message: `${nodeCount} nodes healed\nBoost: <span class="tier4-notification-value">+${(harmonyAmount * 100).toFixed(0)}%</span>`,
      duration: 2500
    };
    
    this.queueNotification(notification);
  }
  
  /**
   * Queue a notification for display
   */
  queueNotification(notification) {
    this.notificationQueue.push(notification);
    this.processNotificationQueue();
  }
  
  /**
   * Process queued notifications and display them
   */
  processNotificationQueue() {
    while (this.notificationQueue.length > 0 && this.activeNotifications.size < 3) {
      const notification = this.notificationQueue.shift();
      this.displayNotification(notification);
    }
  }
  
  /**
   * Display a single notification
   */
  displayNotification(notification) {
    const element = document.createElement('div');
    element.className = `tier4-notification ${notification.type}`;
    
    const title = document.createElement('div');
    title.className = 'tier4-notification-title';
    title.textContent = notification.title;
    
    const message = document.createElement('div');
    message.className = 'tier4-notification-message';
    message.innerHTML = notification.message;
    
    element.appendChild(title);
    element.appendChild(message);
    
    this.hudElement.appendChild(element);
    
    const id = Math.random();
    this.activeNotifications.set(id, {
      element,
      notification,
      startTime: Date.now()
    });
    
    this.stats.notificationsDisplayed++;
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeNotification(id);
    }, notification.duration);
  }
  
  /**
   * Remove a notification by ID
   */
  removeNotification(id) {
    const notifData = this.activeNotifications.get(id);
    if (notifData) {
      notifData.element.style.opacity = '0';
      setTimeout(() => {
        this.hudElement.removeChild(notifData.element);
        this.activeNotifications.delete(id);
        
        // Process queued notifications
        this.processNotificationQueue();
      }, 300);
    }
  }
  
  /**
   * Update network health meter
   */
  updateNetworkHealthMeter(corruptionLevel, harmonyLevel) {
    // Create or update meter element
    let meterContainer = this.hudElement.querySelector('.tier4-meter');
    if (!meterContainer) {
      meterContainer = document.createElement('div');
      meterContainer.className = 'tier4-meter';
      this.hudElement.appendChild(meterContainer);
    }
    
    // Update corruption meter
    let corruptionMeter = meterContainer.querySelector('[data-metric="corruption"]');
    if (!corruptionMeter) {
      corruptionMeter = this.createMeterElement('Network Corruption');
      corruptionMeter.setAttribute('data-metric', 'corruption');
      meterContainer.appendChild(corruptionMeter);
    }
    
    const corruptionFill = corruptionMeter.querySelector('.tier4-meter-fill');
    corruptionFill.style.width = `${corruptionLevel * 100}%`;
    
    // Update harmony meter
    let harmonyMeter = meterContainer.querySelector('[data-metric="harmony"]');
    if (!harmonyMeter) {
      harmonyMeter = this.createMeterElement('Network Harmony');
      harmonyMeter.setAttribute('data-metric', 'harmony');
      meterContainer.appendChild(harmonyMeter);
    }
    
    const harmonyFill = harmonyMeter.querySelector('.tier4-meter-fill');
    harmonyFill.style.width = `${harmonyLevel * 100}%`;
  }
  
  /**
   * Create a meter element
   */
  createMeterElement(label) {
    const meter = document.createElement('div');
    meter.className = 'tier4-meter-row';
    meter.style.marginBottom = '5px';
    
    const labelEl = document.createElement('div');
    labelEl.className = 'tier4-meter-label';
    labelEl.textContent = label;
    
    const barContainer = document.createElement('div');
    barContainer.className = 'tier4-meter-bar';
    
    const fill = document.createElement('div');
    fill.className = 'tier4-meter-fill';
    
    barContainer.appendChild(fill);
    meter.appendChild(labelEl);
    meter.appendChild(barContainer);
    
    return meter;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      notificationsDisplayed: this.stats.notificationsDisplayed,
      activeNotifications: this.activeNotifications.size,
      queuedNotifications: this.notificationQueue.length
    };
  }
  
  /**
   * Clear all notifications
   */
  clear() {
    for (const [id, data] of this.activeNotifications) {
      this.hudElement.removeChild(data.element);
    }
    this.activeNotifications.clear();
    this.notificationQueue = [];
  }
  
  /**
   * Dispose UI resources
   */
  dispose() {
    this.clear();
    if (this.hudElement && this.hudElement.parentElement) {
      this.hudElement.parentElement.removeChild(this.hudElement);
    }
  }
}

export default TIER4_GameplayFeedbackUI;
