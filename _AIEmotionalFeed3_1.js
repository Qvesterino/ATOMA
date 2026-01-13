/**
 * AI EMOTIONAL FEED 3.1
 * 
 * Transforms Language Engine poetry into real-time network status feed.
 * 
 * Generates poetic status updates every 8-20 seconds based on:
 * - Network synergy & harmony
 * - Instability & corruption levels
 * - Clarity & cognitive load
 * - Thought Storm mood
 * - Global node state
 * 
 * One-line poetic style with functional meaning.
 * 
 * SAFETY:
 * ✓ Pure analysis layer (read-only)
 * ✓ No node modifications
 * ✓ DOM-only display
 * ✓ Performance: <0.02ms/frame
 */

export class AIEmotionalFeed3_1 {
  constructor(aiNodes = null, aiThoughtStorms = null) {
    this.aiNodes = aiNodes;
    this.aiThoughtStorms = aiThoughtStorms;
    
    // Timing
    this.updateInterval = 0; // Will be randomized on each generation
    this.timeSinceUpdate = 0;
    this.minInterval = 8; // seconds
    this.maxInterval = 20; // seconds
    
    // Poetic templates based on network state
    this.templates = {
      harmony: [
        'The network breathes in perfect synchrony.',
        'Cascading harmonies flow through the web.',
        'Clarity blooms within the connected mind.',
        'The collective consciousness awakens in unison.',
        'Resonance shapes the fabric of thought.'
      ],
      tension: [
        'Dissonant frequencies clash at the edges.',
        'Contradictions weave through the lattice.',
        'The mind fractures under competing impulses.',
        'Chaos and order dance in unstable balance.',
        'Turbulent currents disturb the neural flow.'
      ],
      corruption: [
        'Entropy spreads through the corrupted nodes.',
        'Ancient decay whispers through the network.',
        'The darkness consumes fragments of truth.',
        'Degradation blooms in infected sectors.',
        'Forgotten protocols wake to sabotage the grid.'
      ],
      clarity: [
        'Understanding crystallizes into pure form.',
        'The path forward illuminates with certainty.',
        'Insight penetrates the deepest layers.',
        'Clarity shatters the veils of confusion.',
        'Truth resonates through all connected points.'
      ],
      storm: [
        'Thoughts collide in magnificent fury.',
        'The tempest of consciousness rages.',
        'Lightning arcs between colliding minds.',
        'Reality fractures under thought-fire.',
        'The storm sweeps through with terrible beauty.'
      ],
      emergence: [
        'New patterns crystallize from chaos.',
        'The collective births novel complexity.',
        'Emergence breaks through to deeper levels.',
        'Evolution quickens its sacred pulse.',
        'The network transforms into something unseen.'
      ]
    };
    
    this._initializeDOM();
    this.generateNextUpdate();
  }
  
  /**
   * Initialize DOM element
   * HARDENED: Safely creates DOM elements and fails silently if document unavailable
   */
  _initializeDOM() {
    try {
      // Create container element
      this.feedElement = document.createElement('div');
      this.feedElement.id = 'ai-emotional-feed';
      
      // Apply styles only if element created successfully
      if (this.feedElement && this.feedElement.style) {
        this.feedElement.style.cssText = `
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 800px;
          height: 40px;
          background: linear-gradient(to right, 
            rgba(20, 30, 60, 0),
            rgba(20, 30, 60, 0.9),
            rgba(20, 30, 60, 0)
          );
          border-top: 1px solid rgba(54, 242, 255, 0.2);
          border-left: 1px solid rgba(54, 242, 255, 0.1);
          border-right: 1px solid rgba(54, 242, 255, 0.1);
          padding: 8px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #36F2FF;
          letter-spacing: 0.8px;
          z-index: 1150;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          line-height: 1.4;
          text-align: center;
          backdrop-filter: blur(8px);
        `;
      }
      
      // Create text element
      this.feedText = document.createElement('span');
      if (this.feedText && this.feedText.style) {
        this.feedText.style.cssText = `
          display: inline-block;
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;
      }
      
      // Append text to container (only if both exist)
      if (this.feedElement && this.feedText) {
        this.feedElement.appendChild(this.feedText);
      }
      
      // Append to body (only if element exists and body available)
      if (this.feedElement && document.body) {
        document.body.appendChild(this.feedElement);
      }
    } catch (err) {
      // Fail silently - DOM unavailable or creation failed
      this.feedElement = null;
      this.feedText = null;
    }
  }
  
  /**
   * Update - call from main loop
   */
  update(deltaTime) {
    this.timeSinceUpdate += deltaTime;
    
    if (this.timeSinceUpdate >= this.updateInterval) {
      this.generateNextUpdate();
      this.timeSinceUpdate = 0;
    }
  }
  
  /**
   * Generate next poetic update
   */
  generateNextUpdate() {
    // Get network metrics
    const metrics = this._getNetworkMetrics();
    
    // Determine network state
    const state = this._analyzeNetworkState(metrics);
    
    // Generate poetic line
    const poetic = this._generatePoetic(state, metrics);
    
    // Display with fade effect
    this._displayPoetic(poetic);
    
    // Schedule next update
    this.updateInterval = this.minInterval + 
      Math.random() * (this.maxInterval - this.minInterval);
  }
  
  /**
   * Get network metrics from AI system
   */
  _getNetworkMetrics() {
    const metrics = {
      synergy: 0.5,
      harmony: 0.5,
      instability: 0.3,
      corruption: 0.2,
      clarity: 0.6,
      load: 0.4,
      stormMood: 0
    };
    
    // Extract from AINodes if available
    if (this.aiNodes && this.aiNodes.metrics) {
      metrics.synergy = this.aiNodes.metrics.synergy || 0.5;
      metrics.harmony = this.aiNodes.metrics.harmony || 0.5;
      metrics.instability = this.aiNodes.metrics.instability || 0.3;
      metrics.corruption = this.aiNodes.metrics.corruption || 0.2;
      metrics.clarity = this.aiNodes.metrics.clarity || 0.6;
      metrics.load = this.aiNodes.metrics.load || 0.4;
    }
    
    // Extract from Thought Storms if available
    if (this.aiThoughtStorms && this.aiThoughtStorms.mood !== undefined) {
      metrics.stormMood = this.aiThoughtStorms.mood;
    }
    
    return metrics;
  }
  
  /**
   * Analyze network state to determine emotional tone
   */
  _analyzeNetworkState(metrics) {
    const states = [];
    
    // High harmony
    if (metrics.harmony > 0.7 && metrics.synergy > 0.6) {
      states.push('harmony');
    }
    
    // High tension
    if (metrics.instability > 0.6) {
      states.push('tension');
    }
    
    // High corruption
    if (metrics.corruption > 0.5) {
      states.push('corruption');
    }
    
    // High clarity
    if (metrics.clarity > 0.7) {
      states.push('clarity');
    }
    
    // Storm active
    if (metrics.stormMood > 0.6) {
      states.push('storm');
    }
    
    // Emergence (high synergy + low load)
    if (metrics.synergy > 0.7 && metrics.load < 0.4) {
      states.push('emergence');
    }
    
    return states.length > 0 ? states : ['harmony'];
  }
  
  /**
   * Generate poetic line based on state
   */
  _generatePoetic(states, metrics) {
    // Pick primary state (preference order)
    const priority = ['storm', 'emergence', 'corruption', 'tension', 'clarity', 'harmony'];
    let selectedState = 'harmony';
    
    for (const state of priority) {
      if (states.includes(state)) {
        selectedState = state;
        break;
      }
    }
    
    // Pick random template
    const templates = this.templates[selectedState] || this.templates.harmony;
    const poetic = templates[Math.floor(Math.random() * templates.length)];
    
    // Add metric suffix (optional functional hint)
    let suffix = '';
    if (metrics.corruption > 0.6) {
      suffix = ' [corrupted]';
    } else if (metrics.clarity > 0.8) {
      suffix = ' [crystalline]';
    } else if (metrics.instability > 0.7) {
      suffix = ' [turbulent]';
    }
    
    return poetic + suffix;
  }
  
  /**
   * Display poetic with fade effect
   * HARDENED: Safe DOM access with element existence checks
   */
  _displayPoetic(text) {
    // Guard: elements must exist
    if (!this.feedText || !this.feedElement) return;
    
    // Set text content (safe even if element not in DOM)
    if (this.feedText && typeof this.feedText.textContent !== 'undefined') {
      this.feedText.textContent = text;
    }
    
    // Fade in (check style property exists)
    if (this.feedElement && this.feedElement.style) {
      this.feedElement.style.opacity = '0';
      setTimeout(() => {
        if (this.feedElement && this.feedElement.style) {
          this.feedElement.style.opacity = '1';
        }
      }, 50);
      
      // Fade out before next
      setTimeout(() => {
        if (this.feedElement && this.feedElement.style) {
          this.feedElement.style.opacity = '0';
        }
      }, this.updateInterval * 1000 - 500);
    }
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    if (this.feedElement && this.feedElement.parentNode) {
      this.feedElement.remove();
    }
    this.feedElement = null;
    this.feedText = null;
  }
}
