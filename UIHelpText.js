/**
 * UI HELP TEXT
 * 
 * Bottom-of-screen control hints showing current keybindings.
 * Updated for ATOMA UI 3.0 controls.
 * 
 * SAFETY:
 * ✓ Pure display layer (read-only)
 * ✓ No gameplay modifications
 */

export class UIHelpText {
  constructor() {
    this.element = null;
    this._initializeDOM();
  }
  
  /**
   * Initialize DOM
   */
  _initializeDOM() {
    this.element = document.createElement('div');
    this.element.id = 'ui-help-text';
    this.element.style.cssText = `
      position: fixed;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      color: #36F2FF;
      letter-spacing: 0.8px;
      opacity: 0.7;
      z-index: 1000;
      pointer-events: none;
      white-space: nowrap;
    `;
    
    this.element.innerHTML = `
      <div style="line-height: 1.4;">
        <span style="color: #00F59E;">WASD</span> MOVE
        <span style="opacity: 0.4; margin: 0 8px;">●</span>
        <span style="color: #7CFFDA;">MOUSE</span> LOOK
        <span style="opacity: 0.4; margin: 0 8px;">●</span>
        <span style="color: #8AFF80;">SPACE</span> JUMP
        <span style="opacity: 0.4; margin: 0 8px;">●</span>
        <span style="color: #FF4DF0;">LMB</span> SELECT/LINK
        <span style="opacity: 0.4; margin: 0 8px;">●</span>
        <span style="color: #FF4DF0;">RMB</span> NODE MENU
        <span style="opacity: 0.4; margin: 0 8px;">●</span>
        <span style="color: #FFB500;">TAB</span> HUD ANALYTICS
        <span style="opacity: 0.4; margin: 0 8px;">●</span>
        <span style="color: #FF3C3C;">ESC</span> CLEAR
      </div>
    `;
    
    document.body.appendChild(this.element);
  }
  
  /**
   * Dispose
   */
  dispose() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
