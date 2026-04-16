/**
 * COLLAPSIBLE HUD WRAPPER 1.0
 * 
 * Provides a reusable wrapper to add collapse/expand functionality to any HUD.
 * Handles header styling, collapse button, and body container structure.
 * 
 * SAFETY: Pure DOM manipulation - zero gameplay impact
 */

/**
 * Convert a HUD element into a collapsible HUD
 * 
 * @param {HTMLElement} hudElement - Root HUD element to convert
 * @param {string} title - Title for the HUD header
 * @param {Object} options - Configuration options
 *   - icon: custom icon character (default: '▲')
 *   - collapsible: whether to show collapse button (default: true)
 *   - headerClass: custom CSS class for header (default: 'hud-header')
 *   - bodyClass: custom CSS class for body (default: 'hud-body')
 */
export function makeHudCollapsible(hudElement, title, options = {}) {
  const {
    icon = '▲',
    collapsible = true,
    headerClass = 'hud-header',
    bodyClass = 'hud-body'
  } = options;
  
  if (!collapsible) {
    return; // Collapse functionality disabled for this HUD
  }
  
  // Get all existing children (these become the body)
  const existingContent = Array.from(hudElement.childNodes);
  
  // Clear the HUD element
  hudElement.innerHTML = '';
  
  // Create header
  const header = document.createElement('div');
  header.className = headerClass;
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(0, 255, 255, 0.2);
    cursor: default;
    user-select: none;
  `;
  
  // Title element
  const titleElement = document.createElement('div');
  titleElement.style.cssText = `
    font-weight: bold;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  `;
  titleElement.textContent = title;
  header.appendChild(titleElement);
  
  // Collapse button (if collapsible)
  const collapseButton = document.createElement('button');
  collapseButton.className = 'hud-collapse-button';
  collapseButton.setAttribute('aria-label', `Toggle ${title}`);
  collapseButton.setAttribute('aria-expanded', 'true');
  collapseButton.style.cssText = `
    background: none;
    border: none;
    color: inherit;
    font-size: 12px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 3px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  `;
  collapseButton.textContent = icon;
  
  // Hover effect for collapse button
  collapseButton.addEventListener('mouseenter', () => {
    collapseButton.style.background = 'rgba(0, 255, 255, 0.1)';
    collapseButton.style.boxShadow = '0 0 8px rgba(0, 255, 255, 0.3)';
  });
  
  collapseButton.addEventListener('mouseleave', () => {
    collapseButton.style.background = 'none';
    collapseButton.style.boxShadow = 'none';
  });
  
  header.appendChild(collapseButton);
  hudElement.appendChild(header);
  
  // Create body container
  const body = document.createElement('div');
  body.className = bodyClass;
  
  // Copy original styles to body if needed
  const originalStyle = hudElement.getAttribute('style');
  if (originalStyle) {
    // Preserve overflow settings
    const overflowMatch = originalStyle.match(/overflow[^:]*:[^;]*/);
    if (overflowMatch) {
      body.style.cssText = overflowMatch[0];
    }
  }
  
  // Re-add existing content to body
  existingContent.forEach(node => {
    body.appendChild(node);
  });
  
  hudElement.appendChild(body);
  
  console.log(`✓ Made collapsible: ${title}`);
}

/**
 * Apply standard HUD styling for consistent appearance
 * 
 * @param {HTMLElement} hudElement - HUD element to style
 * @param {Object} options - Style options
 */
export function styleHudElement(hudElement, options = {}) {
  const {
    borderColor = 'rgba(0, 255, 255, 0.5)',
    backgroundColor = 'rgba(0, 0, 0, 0.7)',
    textColor = '#00ffff',
    borderRadius = '4px',
    padding = '0px' // Header handles its own padding
  } = options;
  
  hudElement.style.cssText = `
    position: fixed;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: ${textColor};
    background: ${backgroundColor};
    border: 1px solid ${borderColor};
    border-radius: ${borderRadius};
    padding: ${padding};
    pointer-events: auto;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
    ${hudElement.style.cssText || ''}
  `;
}

/**
 * Add to existing HUD element without restructuring
 * Wraps existing HUD body in collapsible container
 * 
 * @param {HTMLElement} hudElement - Existing HUD element
 * @param {string} title - Title for the HUD header
 */
export function addCollapseHeaderToExistingHud(hudElement, title) {
  // Check if already has a header with collapse button
  const existingHeader = hudElement.querySelector('.hud-header');
  if (existingHeader && existingHeader.querySelector('.hud-collapse-button')) {
    // Already has a collapsible header - just ensure body exists
    if (!hudElement.querySelector('.hud-body')) {
      // Wrap existing content in body
      const body = document.createElement('div');
      body.className = 'hud-body';
      
      const children = Array.from(hudElement.childNodes);
      children.forEach(child => {
        // Don't move the header
        if (child !== existingHeader) {
          body.appendChild(child);
        }
      });
      
      hudElement.appendChild(body);
      console.log(`✓ Added body wrapper to: ${title}`);
    }
    return; // Already collapsible
  }
  
  // Create header
  const header = document.createElement('div');
  header.className = 'hud-header';
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(0, 255, 255, 0.2);
    cursor: default;
    user-select: none;
  `;
  
  // Title element
  const titleElement = document.createElement('div');
  titleElement.style.cssText = `
    font-weight: bold;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  `;
  titleElement.textContent = title;
  header.appendChild(titleElement);
  
  // Collapse button
  const collapseButton = document.createElement('button');
  collapseButton.className = 'hud-collapse-button';
  collapseButton.setAttribute('aria-label', `Toggle ${title}`);
  collapseButton.setAttribute('aria-expanded', 'true');
  collapseButton.style.cssText = `
    background: none;
    border: none;
    color: inherit;
    font-size: 12px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 3px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  `;
  collapseButton.textContent = '▲';
  
  // Hover effects
  collapseButton.addEventListener('mouseenter', () => {
    collapseButton.style.background = 'rgba(0, 255, 255, 0.1)';
    collapseButton.style.boxShadow = '0 0 8px rgba(0, 255, 255, 0.3)';
  });
  
  collapseButton.addEventListener('mouseleave', () => {
    collapseButton.style.background = 'none';
    collapseButton.style.boxShadow = 'none';
  });
  
  header.appendChild(collapseButton);
  
  // Wrap existing content in body container
  const body = document.createElement('div');
  body.className = 'hud-body';
  
  // Move all children to body (except header which we just created)
  const children = Array.from(hudElement.childNodes);
  children.forEach(child => {
    body.appendChild(child);
  });
  
  // Add header first, then body
  hudElement.insertBefore(header, hudElement.firstChild);
  hudElement.appendChild(body);
  
  // Add collapsed class styling
  if (!hudElement.classList.contains('hud-collapsible')) {
    hudElement.classList.add('hud-collapsible');
  }
  
  console.log(`✓ Added collapse header to: ${title}`);
}

console.log('✓ Collapsible HUD Wrapper 1.0 module loaded');
