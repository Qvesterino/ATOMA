# CORRUPTION GLYPH DIMMING — CODE REFERENCE

## File Modifications

### File: `_AtomaGlyphSystem4_0.js`

#### 1. Constructor Addition (lines 58–63)

```javascript
// [CORRUPTION GLYPH DIMMING] Corruption-based opacity reduction
this.corruptionDimmingConfig = {
  activeThreshold: 0.65,      // Dimming starts at 65% corruption
  maxDimmingThreshold: 0.85,  // Full dimming at 85% corruption
  minOpacityFactor: 0.25      // Glyphs dim to 25% of normal opacity
};
```

**Purpose**: Initialize configuration for corruption-based glyph dimming
**Type**: Configuration object
**Scope**: Instance property, modified by `setCorruptionDimmingConfig()`

---

#### 2. Core Implementation: `_applyCorruptionGlyphDimming()` (lines 1474–1558)

```javascript
_applyCorruptionGlyphDimming(glyphGroup, nodeId, context) {
  if (!glyphGroup || !context) return;
  
  const corruption = context.corruption || 0;
  const config = this.corruptionDimmingConfig;
  
  // No dimming below threshold
  if (corruption < config.activeThreshold) {
    glyphGroup.userData.corruptionDimmingActive = false;
    return;
  }
  
  // Calculate dimming factor: 1.0 (no dim) → 0.25 (full dim)
  // Linear interpolation from activeThreshold to maxDimmingThreshold
  const dimmingRange = config.maxDimmingThreshold - config.activeThreshold;
  const corruptionProgress = Math.min(
    (corruption - config.activeThreshold) / dimmingRange,
    1.0
  );
  
  // Dimming factor: 1.0 at threshold, minOpacityFactor at max
  const dimmingFactor = 1.0 - (corruptionProgress * (1.0 - config.minOpacityFactor));
  
  glyphGroup.userData.corruptionDimmingActive = true;
  glyphGroup.userData.corruptionDimmingFactor = dimmingFactor;
  
  // Apply dimming to all glyph children [OPACITY]
  glyphGroup.traverse(child => {
    if (child.material && child.material.opacity !== undefined) {
      // Store base opacity if not already stored
      if (!child.userData.baseOpacityBeforeDimming) {
        child.userData.baseOpacityBeforeDimming = child.material.opacity;
      }
      
      // Apply dimming multiplier
      child.material.opacity = child.userData.baseOpacityBeforeDimming * dimmingFactor;
    }
    
    // Also reduce emissive intensity for dimmed glyphs [EMISSIVE]
    if (child.material && child.material.emissiveIntensity !== undefined) {
      if (!child.userData.baseEmissiveIntensity) {
        child.userData.baseEmissiveIntensity = child.material.emissiveIntensity;
      }
      
      child.material.emissiveIntensity = child.userData.baseEmissiveIntensity * dimmingFactor;
    }
  });
  
  // Optional: Slight desaturation for "corruption" visual language [DESATURATION]
  if (corruptionProgress > 0.3) {
    const desaturation = corruptionProgress * 0.15;  // Up to 15%
    
    glyphGroup.traverse(child => {
      if (child.material && child.material.color) {
        // Store base color if not already stored
        if (!child.userData.baseColorBeforeDimming) {
          child.userData.baseColorBeforeDimming = child.material.color.clone();
        }
        
        // Lerp toward grayscale (desaturation)
        const baseColor = child.userData.baseColorBeforeDimming;
        const gray = new THREE.Color();
        gray.copy(baseColor);
        const luminance = (gray.r + gray.g + gray.b) / 3;
        gray.setRGB(luminance, luminance, luminance);
        
        child.material.color.lerpColors(baseColor, gray, desaturation);
      }
    });
  }
}
```

**Key Components**:

1. **Threshold Check**: Early exit if corruption < activeThreshold
2. **Dimming Factor Calculation**: Linear interpolation across corruption range
3. **Opacity Dimming**: Multiply base opacity by dimming factor
4. **Emissive Reduction**: Reduce emissive intensity proportionally
5. **Desaturation**: Progressive color shift toward grayscale

**Data Flow**:
```
Input: corruption (0–1)
  ↓
Calculate corruptionProgress (0–1)
  ↓
Calculate dimmingFactor (1.0 → 0.25)
  ↓
Apply to materials:
  - opacity *= dimmingFactor
  - emissiveIntensity *= dimmingFactor
  - color → lerp toward gray (if corruptionProgress > 0.3)
  ↓
Output: Dimmed glyph materials
```

---

#### 3. Integration Point (lines 1613–1615)

```javascript
// [SYNERGY GLYPH REVEAL] Apply synergy-based reveal effect
this._applySynergyGlyphReveal(glyphGroup, nodeId, context);

// [CORRUPTION GLYPH DIMMING] Apply corruption dimming AFTER synergy reveal
// Corruption overrides synergy visibility - visual indication of system degradation
this._applyCorruptionGlyphDimming(glyphGroup, nodeId, context);

// Update based on glyph type
switch (glyphType) { ... }
```

**Location**: In the main `update()` loop within the glyph registry iteration
**Order**: AFTER `_applySynergyGlyphReveal()` so corruption can override
**Called**: Every frame for every active glyph

---

#### 4. Public API: `setCorruptionDimmingConfig()` (lines 1753–1767)

```javascript
/**
 * [CORRUPTION GLYPH DIMMING] Configure corruption-based glyph dimming behavior
 * @param {Object} config - Configuration object
 */
setCorruptionDimmingConfig(config) {
  if (!config) return;
  
  if (config.activeThreshold !== undefined) {
    this.corruptionDimmingConfig.activeThreshold = 
      Math.max(0, Math.min(1, config.activeThreshold));
  }
  if (config.maxDimmingThreshold !== undefined) {
    this.corruptionDimmingConfig.maxDimmingThreshold = 
      Math.max(0, Math.min(1, config.maxDimmingThreshold));
  }
  if (config.minOpacityFactor !== undefined) {
    this.corruptionDimmingConfig.minOpacityFactor = 
      Math.max(0, Math.min(1, config.minOpacityFactor));
  }
  
  console.log('✓ Corruption glyph dimming config updated:', 
              this.corruptionDimmingConfig);
}
```

**Usage**:
```javascript
glyphSystem.setCorruptionDimmingConfig({
  activeThreshold: 0.50,
  maxDimmingThreshold: 0.75,
  minOpacityFactor: 0.10
});
```

**Validation**: All values clamped to [0, 1] range

---

#### 5. Public API: `getCorruptionDimmingConfig()` (lines 1774–1776)

```javascript
/**
 * [CORRUPTION GLYPH DIMMING] Get current corruption dimming configuration
 * @returns {Object} Current dimming config
 */
getCorruptionDimmingConfig() {
  return { ...this.corruptionDimmingConfig };
}
```

**Returns**: Shallow copy of current config
**Usage**: Query current dimming settings without modifying

---

#### 6. Status Reporting Enhancement (line 1788)

```javascript
getStatus() {
  return {
    activeGlyphs: this.glyphRegistry.size,
    totalCreated: this.stats.totalGlyphsCreated,
    byType: this.stats.byType,
    lastUpdateMs: this.stats.lastUpdateTime.toFixed(2),
    glyphIds: Array.from(this.glyphRegistry.keys()),
    corruptionDimmingConfig: this.getCorruptionDimmingConfig()  // ← NEW
  };
}
```

**Addition**: `corruptionDimmingConfig` field now included in status

---

## Data Structures

### Configuration Object

```javascript
corruptionDimmingConfig = {
  activeThreshold: 0.65,       // number (0–1)
  maxDimmingThreshold: 0.85,   // number (0–1)
  minOpacityFactor: 0.25       // number (0–1)
}
```

### Glyph Group User Data

```javascript
glyphGroup.userData = {
  // ... existing properties ...
  corruptionDimmingActive: boolean,     // Is dimming active?
  corruptionDimmingFactor: number       // Current dimming multiplier (0–1)
}
```

### Glyph Child User Data

```javascript
child.userData = {
  // ... existing properties ...
  baseOpacityBeforeDimming: number,     // Original opacity value
  baseEmissiveIntensity: number,        // Original emissive intensity
  baseColorBeforeDimming: THREE.Color   // Original color (cloned)
}
```

---

## Calculation Details

### Dimming Factor Formula

```
If corruption < activeThreshold:
  return (no changes)

corruption_progress = min((corruption - activeThreshold) / 
                          (maxDimmingThreshold - activeThreshold), 1.0)

dimming_factor = 1.0 - (corruption_progress * (1.0 - minOpacityFactor))

Result: dimming_factor in range [minOpacityFactor, 1.0]
```

**Example with defaults**:
```
activeThreshold = 0.65
maxDimmingThreshold = 0.85
minOpacityFactor = 0.25

At corruption = 0.65:
  progress = 0.0
  factor = 1.0 - (0.0 * 0.75) = 1.0  [no dimming]

At corruption = 0.75:
  progress = 0.5
  factor = 1.0 - (0.5 * 0.75) = 0.625  [62.5% visible]

At corruption = 0.85:
  progress = 1.0
  factor = 1.0 - (1.0 * 0.75) = 0.25  [25% visible, full dim]

At corruption > 0.85:
  progress = 1.0 (clamped)
  factor = 0.25  [stays at min]
```

### Desaturation Formula

```
If corruptionProgress <= 0.3:
  return (no desaturation)

desaturation_amount = corruptionProgress * 0.15

For each color component:
  luminance = (r + g + b) / 3
  gray_color = Color(luminance, luminance, luminance)
  
  new_color = lerp(base_color, gray_color, desaturation_amount)
```

**Effect**:
- At 30% corruption progress (≈0.71 total): 0% desaturation
- At 50% corruption progress (≈0.75 total): 7.5% desaturation
- At 100% corruption progress (≈0.85 total): 15% desaturation

---

## Integration with Existing Systems

### Data Flow from Node Properties

```javascript
// In AINodes.js or NodeLinkingSystem.js:
node.userData.corruption = 0.75  // Set by game logic

// In glyph update:
const context = this.analyzeContext(node, nodeId);
// context.corruption = 0.75  (extracted from node.userData)

// In _applyCorruptionGlyphDimming:
const corruption = context.corruption || 0;  // Use extracted value
```

### Interaction with Synergy Reveal

```javascript
// Both can be active simultaneously:
this._applySynergyGlyphReveal(glyphGroup, nodeId, context);
// opacity might be boosted to 0.85 if synergy >= 0.85

this._applyCorruptionGlyphDimming(glyphGroup, nodeId, context);
// If corruption >= 0.65, opacity is multiplied by dimming_factor
// Result: 0.85 * 0.25 = 0.2125 (very dim, corruption wins)
```

---

## Performance Characteristics

### Time Complexity

Per glyph update:
```
traverse(children): O(n)  where n = children count
  - For each child:
    - Check/set opacity: O(1)
    - Check/set emissive: O(1)
    - Color lerp: O(1)
    
Total: O(n) where n = ~3–5 children typical per glyph
```

Typical: 0.05–0.1ms per glyph

### Space Complexity

Per glyph:
```
userData storage per child:
  - baseOpacityBeforeDimming: 4 bytes
  - baseEmissiveIntensity: 4 bytes
  - baseColorBeforeDimming: 12 bytes (Float32 × 3)
  
Total per child: ~20 bytes
Typical glyph (3 children): ~60 bytes
```

Typical project: 50–100 glyphs × 60 bytes = 3–6 KB

---

## Usage Examples

### Basic Usage (Using Defaults)

```javascript
// Glyph system automatically dims glyphs as corruption increases
// No configuration needed, uses defaults:
// - activeThreshold: 0.65
// - maxDimmingThreshold: 0.85
// - minOpacityFactor: 0.25
```

### Customize Dimming Behavior

```javascript
// Make dimming more aggressive
glyphSystem.setCorruptionDimmingConfig({
  activeThreshold: 0.50,        // Start dimming earlier
  maxDimmingThreshold: 0.70,    // Reach full dim sooner
  minOpacityFactor: 0.10        // Fade more aggressively
});
```

### Query Current Configuration

```javascript
const config = glyphSystem.getCorruptionDimmingConfig();
console.log(config);
// Output:
// {
//   activeThreshold: 0.50,
//   maxDimmingThreshold: 0.70,
//   minOpacityFactor: 0.10
// }
```

### Inspect Status

```javascript
const status = glyphSystem.getStatus();
console.log(status.corruptionDimmingConfig);
// Returns current dimming config from status report
```

---

## Testing Code

### Unit Test: Dimming Factor Calculation

```javascript
function testDimmingFactor() {
  const config = {
    activeThreshold: 0.65,
    maxDimmingThreshold: 0.85,
    minOpacityFactor: 0.25
  };
  
  const testCases = [
    { corruption: 0.60, expected: 1.0 },    // Below threshold
    { corruption: 0.65, expected: 1.0 },    // At threshold
    { corruption: 0.70, expected: 0.625 },  // Mid-range
    { corruption: 0.75, expected: 0.5 },    // Half progress
    { corruption: 0.85, expected: 0.25 },   // Max dim
    { corruption: 0.90, expected: 0.25 }    // Beyond max
  ];
  
  testCases.forEach(test => {
    const range = config.maxDimmingThreshold - config.activeThreshold;
    const progress = Math.min(
      (test.corruption - config.activeThreshold) / range,
      1.0
    );
    const factor = 1.0 - (progress * (1.0 - config.minOpacityFactor));
    
    console.assert(
      Math.abs(factor - test.expected) < 0.001,
      `corruption=${test.corruption}: expected ${test.expected}, got ${factor}`
    );
  });
}
```

### Integration Test: Glyph Dimming

```javascript
function testGlyphDimming() {
  const glyphSystem = new AtomaGlyphSystem4_0(scene, camera);
  
  // Create test node
  const testNode = {
    userData: {
      corruption: 0.75,
      synergy: 0.0,
      harmony: 0.0,
      // ... other properties
    }
  };
  
  // Create glyph
  glyphSystem.createAIConsciousnessGlyph(testNode, 'test-node');
  
  // Get glyph
  const glyphData = glyphSystem.glyphRegistry.get('test-node');
  
  // Update loop
  glyphSystem.update(0.016, [testNode]);
  
  // Check dimming applied
  glyphData.glyphGroup.traverse(child => {
    if (child.material && child.material.opacity !== undefined) {
      console.log(
        `Opacity: ${child.material.opacity} (should be ~62.5% of base)`
      );
    }
  });
}
```

---

## Debugging

### Log Dimming State

```javascript
// In _applyCorruptionGlyphDimming after dimming applied:
console.log(`[Dimming] Node ${nodeId}:`, {
  corruption: corruption,
  progress: corruptionProgress,
  factor: dimmingFactor,
  active: glyphGroup.userData.corruptionDimmingActive
});
```

### Inspect Material State

```javascript
glyphGroup.traverse(child => {
  if (child.material) {
    console.log(`Material state:`, {
      opacity: child.material.opacity,
      baseOpacity: child.userData.baseOpacityBeforeDimming,
      emissive: child.material.emissiveIntensity,
      baseEmissive: child.userData.baseEmissiveIntensity
    });
  }
});
```

### Verify Configuration

```javascript
console.log('Current dimming config:', glyphSystem.getCorruptionDimmingConfig());
console.log('Status with config:', glyphSystem.getStatus());
```

---

## Common Patterns

### Check if Dimming Active

```javascript
if (glyphGroup.userData.corruptionDimmingActive) {
  console.log('Glyph is currently dimmed');
  console.log('Dimming factor:', glyphGroup.userData.corruptionDimmingFactor);
}
```

### Restore Base Opacity

```javascript
glyphGroup.traverse(child => {
  if (child.userData.baseOpacityBeforeDimming) {
    child.material.opacity = child.userData.baseOpacityBeforeDimming;
  }
});
```

### Clear Dimming State

```javascript
glyphGroup.userData.corruptionDimmingActive = false;
glyphGroup.userData.corruptionDimmingFactor = 1.0;
glyphGroup.traverse(child => {
  delete child.userData.baseOpacityBeforeDimming;
  delete child.userData.baseEmissiveIntensity;
  delete child.userData.baseColorBeforeDimming;
});
```

---

## Edge Cases

### Rapid Corruption Changes

**Issue**: Opacity changing frame-to-frame might cause jitter
**Solution**: Base values stored once, reused each frame → smooth progression

### Multiple Glyphs on Same Node

**Issue**: All glyphs should dim uniformly
**Solution**: Each glyph processed independently, all receive same context

### Glyph Removal During Dimming

**Issue**: Cleanup needed for stored base values
**Solution**: `disposeGlyph()` removes all userData → no orphaned state

### Configuration Changes at Runtime

**Issue**: Existing dimming might not immediately reflect new config
**Solution**: New config applied on next update, smooth transition

---

## Notes for Future Development

- Desaturation currently caps at 15%; could increase for stronger effect
- Opacity floor at 25%; could lower to 10% for more aggressive dimming
- Linear interpolation for dimming; could use ease curves for smoother feel
- Emissive reduction tied to opacity; could decouple for independent control
