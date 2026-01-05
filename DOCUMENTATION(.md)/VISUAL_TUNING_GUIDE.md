# ATOMA Neon Visual System - Tuning & Customization Guide

## 🎨 Fine-Tuning Your Visual Experience

This guide shows you how to customize the neon visual system to match your exact preferences. All parameters are in `NeonLinkVisuals.js` under the `config` object.

---

## 🎯 Preset Configurations

### Preset 1: "Neon Dreams" (Default - Recommended)
**Best for:** General use, balanced visuals

```javascript
config = {
  curveResolution: 60,
  baseLineWidth: 2,
  maxLineWidth: 8,
  bloomIntensity: 1.5,
  glowScale: 1.3,
  
  particleCount: 3,
  particleSize: 0.08,
  particleSpeed: 0.03,
  trailLength: 12,
  
  priority: {
    low: { pulseSpeed: 0.5, opacity: 0.4 },
    normal: { pulseSpeed: 1.0, opacity: 0.7 },
    high: { pulseSpeed: 2.0, opacity: 1.0 }
  }
}
```

**Result**: Balanced neon aesthetics, smooth animations, good performance

---

### Preset 2: "Ultra Bright" 
**Best for:** High visibility, dramatic effect

```javascript
config = {
  // Increase line prominence
  baseLineWidth: 3,        // Thicker base
  maxLineWidth: 12,        // Much thicker at peak
  bloomIntensity: 2.5,     // Enhanced glow
  glowScale: 1.6,          // Larger halo
  
  // More particles for visual impact
  particleCount: 6,        // Double particles
  particleSize: 0.15,      // Larger particles
  particleSpeed: 0.04,     // Slightly faster
  trailLength: 20,         // Longer trails
  
  priority: {
    low: { pulseSpeed: 0.7, opacity: 0.6 },
    normal: { pulseSpeed: 1.2, opacity: 0.8 },
    high: { pulseSpeed: 3.0, opacity: 1.0 }
  }
}
```

**Result**: Very prominent, highly visible, dramatic appearance

---

### Preset 3: "Subtle Elegance"
**Best for:** Minimalist feel, less intrusive

```javascript
config = {
  // Thinner, more refined lines
  curveResolution: 50,     // Fewer points
  baseLineWidth: 1,        // Thin base
  maxLineWidth: 4,         // Max is still thin
  bloomIntensity: 1.0,     // Subtle glow
  glowScale: 1.1,          // Minimal halo
  
  // Fewer particles, subtle effect
  particleCount: 1,        // Just one
  particleSize: 0.05,      // Very small
  particleSpeed: 0.02,     // Slower
  trailLength: 8,          // Short trails
  
  priority: {
    low: { pulseSpeed: 0.3, opacity: 0.3 },
    normal: { pulseSpeed: 0.7, opacity: 0.5 },
    high: { pulseSpeed: 1.5, opacity: 0.8 }
  }
}
```

**Result**: Refined, understated, sophisticated look

---

### Preset 4: "Performance Mode"
**Best for:** Low-end devices, 100+ links

```javascript
config = {
  // Simplified geometry
  curveResolution: 40,     // Fewer points
  baseLineWidth: 2,
  maxLineWidth: 6,
  bloomIntensity: 1.0,
  glowScale: 1.1,
  
  // Minimal particles
  particleCount: 1,        // Single particle
  particleSize: 0.06,
  particleSpeed: 0.03,
  trailLength: 6,          // Minimal trail
  
  priority: {
    low: { pulseSpeed: 0.3, opacity: 0.3 },
    normal: { pulseSpeed: 0.6, opacity: 0.5 },
    high: { pulseSpeed: 1.2, opacity: 0.7 }
  }
}
```

**Result**: Maximum performance, minimal visual complexity

---

### Preset 5: "Dark Mode"
**Best for:** OLED displays, eye comfort

```javascript
config = {
  // Same geometry, different colors
  curveResolution: 60,
  baseLineWidth: 2,
  maxLineWidth: 8,
  bloomIntensity: 0.8,     // Reduced bloom
  glowScale: 1.2,
  
  particleCount: 2,        // Fewer particles
  particleSize: 0.06,
  particleSpeed: 0.03,
  trailLength: 10,
  
  priority: {
    low: { pulseSpeed: 0.4, opacity: 0.3 },
    normal: { pulseSpeed: 0.9, opacity: 0.6 },
    high: { pulseSpeed: 1.8, opacity: 0.9 }
  },
  
  // Add dark-mode colors (separate)
  trafficColors: {
    low: 0x00aa88,         // Darker cyan
    medium: 0x0077dd,      // Darker blue
    high: 0xdd6600,        // Darker orange
    overload: 0xcc0000     // Darker red
  }
}
```

**Result**: Comfortable on dark displays, reduced eye strain

---

## 🔧 Individual Parameter Tuning

### Line Width Parameters

#### `baseLineWidth` (Default: 2)
Base thickness of link core line in pixels.

```javascript
// Thin, refined look
baseLineWidth: 1

// Balanced (default)
baseLineWidth: 2

// Thick, prominent
baseLineWidth: 3

// Very thick, dramatic
baseLineWidth: 4
```

**Effect**: Lower = more elegant, Higher = more visible

---

#### `maxLineWidth` (Default: 8)
Maximum thickness when traffic is high.

```javascript
// Subtle traffic response
maxLineWidth: 4     // Only 2x base increase

// Moderate traffic response
maxLineWidth: 8     // 4x base increase (default)

// Dramatic traffic response
maxLineWidth: 12    // 6x base increase

// Extreme traffic response
maxLineWidth: 16    // 8x base increase
```

**Effect**: Increases visual response to traffic load

---

### Glow & Bloom Parameters

#### `bloomIntensity` (Default: 1.5)
Strength of the glow effect around lines.

```javascript
// Very subtle glow
bloomIntensity: 0.5

// Subtle glow
bloomIntensity: 1.0

// Balanced (default)
bloomIntensity: 1.5

// Strong glow
bloomIntensity: 2.0

// Very strong glow
bloomIntensity: 3.0
```

**Effect**: Higher = more prominent glow halo

---

#### `glowScale` (Default: 1.3)
Size multiplier of glow halo relative to core line.

```javascript
// Tight, minimal halo
glowScale: 1.0      // No size difference

// Subtle halo
glowScale: 1.1

// Balanced halo
glowScale: 1.3      // (default)

// Large halo
glowScale: 1.6

// Very large halo
glowScale: 2.0
```

**Effect**: Higher = wider glow spread

---

### Particle System Parameters

#### `particleCount` (Default: 3)
Number of particles flowing along each link.

```javascript
// Minimal - very subtle
particleCount: 0    // No particles

// Single particle - elegant
particleCount: 1

// Dual particles - clear flow
particleCount: 2

// Balanced (default)
particleCount: 3

// Dense flow - obvious
particleCount: 5

// Very dense - overwhelming
particleCount: 8
```

**Effect**: More particles = clearer data flow, heavier performance cost

---

#### `particleSize` (Default: 0.08)
Diameter of each particle in scene units.

```javascript
// Tiny - barely visible
particleSize: 0.03

// Small - subtle
particleSize: 0.06

// Balanced (default)
particleSize: 0.08

// Large - prominent
particleSize: 0.12

// Very large - obvious
particleSize: 0.20
```

**Effect**: Larger = more visible, but can overwhelm

---

#### `particleSpeed` (Default: 0.03)
Base speed of particle movement along curves.

```javascript
// Very slow - contemplative
particleSpeed: 0.01

// Slow - gentle
particleSpeed: 0.02

// Balanced (default)
particleSpeed: 0.03

// Fast - active
particleSpeed: 0.05

// Very fast - urgent
particleSpeed: 0.08
```

**Effect**: Interacts with priority multiplier

---

#### `trailLength` (Default: 12)
Number of historic positions stored for trails.

```javascript
// No trail
trailLength: 0

// Very short trail
trailLength: 4

// Short trail - subtle
trailLength: 8

// Balanced trail (default)
trailLength: 12

// Long trail - obvious
trailLength: 20

// Very long trail
trailLength: 32
```

**Effect**: Higher = more visible trail effect, slightly higher memory

---

### Animation Speed Parameters

#### Priority Pulse Speed
Controls how fast each priority level pulses.

```javascript
// Slow, rhythmic pulsing
priority: {
  low: { pulseSpeed: 0.3, opacity: 0.3 },
  normal: { pulseSpeed: 0.6, opacity: 0.6 },
  high: { pulseSpeed: 1.0, opacity: 0.9 }
}

// Moderate (default)
priority: {
  low: { pulseSpeed: 0.5, opacity: 0.4 },
  normal: { pulseSpeed: 1.0, opacity: 0.7 },
  high: { pulseSpeed: 2.0, opacity: 1.0 }
}

// Rapid, energetic pulsing
priority: {
  low: { pulseSpeed: 1.0, opacity: 0.5 },
  normal: { pulseSpeed: 2.0, opacity: 0.8 },
  high: { pulseSpeed: 4.0, opacity: 1.0 }
}
```

**Effect**: Higher speed = faster pulses, more energetic feel

---

#### Priority Opacity
Base opacity at each priority level.

```javascript
// Very subtle opacity
priority: {
  low: { pulseSpeed: 0.5, opacity: 0.2 },
  normal: { pulseSpeed: 1.0, opacity: 0.4 },
  high: { pulseSpeed: 2.0, opacity: 0.7 }
}

// Moderate opacity (default)
priority: {
  low: { pulseSpeed: 0.5, opacity: 0.4 },
  normal: { pulseSpeed: 1.0, opacity: 0.7 },
  high: { pulseSpeed: 2.0, opacity: 1.0 }
}

// High opacity - very visible
priority: {
  low: { pulseSpeed: 0.5, opacity: 0.7 },
  normal: { pulseSpeed: 1.0, opacity: 0.9 },
  high: { pulseSpeed: 2.0, opacity: 1.0 }
}
```

**Effect**: Higher opacity = always visible, less priority differentiation

---

### Curve Resolution

#### `curveResolution` (Default: 60)
Number of points used to render Bézier curves.

```javascript
// Very low - angular, choppy
curveResolution: 20

// Low - faceted appearance
curveResolution: 40

// Balanced (default)
curveResolution: 60

// High - smooth curves
curveResolution: 80

// Very high - perfect smoothness
curveResolution: 120
```

**Effect**: Higher = smoother curves, higher performance cost

---

## 🎨 Color Customization

### Traffic Colors

```javascript
config.trafficColors = {
  low: new THREE.Color(0x00ddff),      // Cyan
  medium: new THREE.Color(0x0099ff),   // Blue
  high: new THREE.Color(0xff8800),     // Orange
  overload: new THREE.Color(0xff0000)  // Red
}

// Warm theme
config.trafficColors = {
  low: new THREE.Color(0xffdd00),      // Yellow
  medium: new THREE.Color(0xff9900),   // Orange
  high: new THREE.Color(0xff6600),     // Deep orange
  overload: new THREE.Color(0xff0000)  // Red
}

// Cool theme
config.trafficColors = {
  low: new THREE.Color(0x00ffff),      // Cyan
  medium: new THREE.Color(0x0099ff),   // Blue
  high: new THREE.Color(0x0055ff),     // Dark blue
  overload: new THREE.Color(0x9900ff)  // Purple
}

// Grayscale theme
config.trafficColors = {
  low: new THREE.Color(0xaaaaaa),      // Light gray
  medium: new THREE.Color(0x777777),   // Medium gray
  high: new THREE.Color(0x444444),     // Dark gray
  overload: new THREE.Color(0x000000)  // Black
}
```

---

## 📊 Performance Tuning

### For High-Performance Scenarios
```javascript
// Optimize for 200+ links at 60 FPS
config = {
  curveResolution: 40,      // Fewer points
  baseLineWidth: 1,         // Thinner
  maxLineWidth: 3,          // Less variation
  bloomIntensity: 0.5,      // Minimal glow
  glowScale: 1.0,
  
  particleCount: 0,         // No particles!
  priority: {
    low: { pulseSpeed: 0.2, opacity: 0.2 },
    normal: { pulseSpeed: 0.5, opacity: 0.4 },
    high: { pulseSpeed: 1.0, opacity: 0.7 }
  }
}
```

---

### For Visual Quality
```javascript
// Optimize for beautiful visuals
config = {
  curveResolution: 100,     // Smooth curves
  baseLineWidth: 3,         // Prominent
  maxLineWidth: 10,         // Large variation
  bloomIntensity: 2.0,      // Strong glow
  glowScale: 1.5,
  
  particleCount: 5,         // Many particles
  particleSize: 0.12,       // Visible
  trailLength: 20,          // Long trails
  priority: {
    low: { pulseSpeed: 0.5, opacity: 0.5 },
    normal: { pulseSpeed: 1.0, opacity: 0.8 },
    high: { pulseSpeed: 2.0, opacity: 1.0 }
  }
}
```

---

## 🎮 Theme Presets for Different Use Cases

### Network Monitoring Dashboard
```javascript
// High visibility, clear metrics
config = {
  curveResolution: 60,
  baseLineWidth: 2,
  maxLineWidth: 10,
  bloomIntensity: 1.8,
  glowScale: 1.4,
  particleCount: 4,
  particleSize: 0.1,
  priority: {
    low: { pulseSpeed: 0.5, opacity: 0.5 },
    normal: { pulseSpeed: 1.0, opacity: 0.8 },
    high: { pulseSpeed: 2.0, opacity: 1.0 }
  }
}
```

### Presentation / Demo Mode
```javascript
// Impressive, dramatic visuals
config = {
  curveResolution: 100,
  baseLineWidth: 3,
  maxLineWidth: 12,
  bloomIntensity: 2.5,
  glowScale: 1.6,
  particleCount: 6,
  particleSize: 0.15,
  priority: {
    low: { pulseSpeed: 0.6, opacity: 0.6 },
    normal: { pulseSpeed: 1.2, opacity: 0.85 },
    high: { pulseSpeed: 2.5, opacity: 1.0 }
  }
}
```

### Development / Debugging
```javascript
// Clear, readable, low overhead
config = {
  curveResolution: 40,
  baseLineWidth: 2,
  maxLineWidth: 6,
  bloomIntensity: 1.2,
  glowScale: 1.2,
  particleCount: 2,
  particleSize: 0.08,
  priority: {
    low: { pulseSpeed: 0.4, opacity: 0.3 },
    normal: { pulseSpeed: 0.8, opacity: 0.6 },
    high: { pulseSpeed: 1.6, opacity: 0.9 }
  }
}
```

---

## 🚀 Advanced Tweaking Tips

### Matching Your Theme Color Scheme
```javascript
// If using purple theme
config.trafficColors = {
  low: new THREE.Color(0xaa00ff),      // Purple
  medium: new THREE.Color(0xff00ff),   // Magenta
  high: new THREE.Color(0xff0088),     // Pink
  overload: new THREE.Color(0xff0000)  // Red
}

// If using green theme
config.trafficColors = {
  low: new THREE.Color(0x00ff88),      // Green
  medium: new THREE.Color(0x00ffff),   // Cyan
  high: new THREE.Color(0xffff00),     // Yellow
  overload: new THREE.Color(0xff0000)  // Red
}
```

### Creating Smooth Transitions
```javascript
// For smooth, flowing visuals
config = {
  curveResolution: 80,      // Smoother curves
  particleSpeed: 0.02,      // Slower, more graceful
  priority: {
    low: { pulseSpeed: 0.3, opacity: 0.4 },
    normal: { pulseSpeed: 0.7, opacity: 0.7 },
    high: { pulseSpeed: 1.4, opacity: 1.0 }
  }
}
```

### Creating Punchy, Energetic Visuals
```javascript
// For rapid, exciting feel
config = {
  curveResolution: 40,      // Sharper curves
  particleSpeed: 0.06,      // Fast particles
  priority: {
    low: { pulseSpeed: 1.0, opacity: 0.5 },
    normal: { pulseSpeed: 2.0, opacity: 0.85 },
    high: { pulseSpeed: 4.0, opacity: 1.0 }
  }
}
```

---

## 📝 Configuration Checklist

When customizing, verify:

- [ ] FPS remains 60+ on target hardware
- [ ] Links are visible at all zoom levels
- [ ] Priority differences are clear
- [ ] Traffic changes are noticeable
- [ ] Particles don't overwhelm
- [ ] Glow doesn't cause visual fatigue
- [ ] Mobile performance acceptable
- [ ] Theme fits overall aesthetic

---

## 🔄 Implementation Example

To apply a preset, edit `NeonLinkVisuals.js`:

```javascript
constructor(scene, camera) {
  this.scene = scene;
  this.camera = camera;
  this.time = 0;
  
  // Use your chosen preset here
  this.config = {
    // Paste your preset configuration
    curveResolution: 60,
    baseLineWidth: 2,
    maxLineWidth: 8,
    // ... rest of config
  };
  
  this.materials = this.createMaterials();
}
```

---

## 💡 Pro Tips

1. **Start with defaults** - They're balanced for most uses
2. **Adjust one parameter** - See the effect before changing others
3. **Test on target device** - Mobile/VR may need different settings
4. **Monitor FPS** - Performance matters more than visuals
5. **Keep it consistent** - Matching aesthetics across the app
6. **Use presets as starting points** - Customize from there

---

## ❓ Common Customization Questions

**Q: My links are too thin to see**
A: Increase `baseLineWidth` and/or `maxLineWidth`

**Q: Too much visual clutter**
A: Reduce `particleCount`, `bloomIntensity`, and `glowScale`

**Q: Particles are hard to see**
A: Increase `particleSize` and/or `particleCount`

**Q: Performance is poor**
A: Use the "Performance Mode" preset above

**Q: I want more dramatic traffic visualization**
A: Increase the difference between `baseLineWidth` and `maxLineWidth`

**Q: Glow is too strong**
A: Reduce `bloomIntensity` and `glowScale`

**Q: Animations feel sluggish**
A: Increase priority `pulseSpeed` values

**Q: Too many particles**
A: Reduce `particleCount` and/or `trailLength`

---

## 🎨 Creating Your Own Preset

```javascript
// Template for custom preset
const myPreset = {
  // Geometry
  curveResolution: 60,
  baseLineWidth: 2,
  maxLineWidth: 8,
  
  // Glow
  bloomIntensity: 1.5,
  glowScale: 1.3,
  
  // Particles
  particleCount: 3,
  particleSize: 0.08,
  particleSpeed: 0.03,
  trailLength: 12,
  
  // Colors
  trafficColors: {
    low: new THREE.Color(0x00ddff),
    medium: new THREE.Color(0x0099ff),
    high: new THREE.Color(0xff8800),
    overload: new THREE.Color(0xff0000)
  },
  
  // Animation
  priority: {
    low: { pulseSpeed: 0.5, opacity: 0.4 },
    normal: { pulseSpeed: 1.0, opacity: 0.7 },
    high: { pulseSpeed: 2.0, opacity: 1.0 }
  }
}

// Apply your preset
Object.assign(this.config, myPreset);
```

---

**Happy Customizing!** 🎨✨

Experiment with these settings to create the exact visual style you want. The system is flexible and responsive to all parameters.
