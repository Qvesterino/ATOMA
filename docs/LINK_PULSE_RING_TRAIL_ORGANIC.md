# LINK PULSE RING TRAIL - ORGANIZÁCIA
## Trail pôsobí ako skutočná stopa (ako LinkBeadTrail)

**Vytvorené:** 2026-03-02  
**Súbor:** LinkPulseRing.js

---

## 🎯 CIEĽ

Trail meshes by mali byť:
- Viac organické (nie len presné zrkadlené kópie hlavného ringu)
- Pôsobiť ako skutočná stopa (ako LinkBeadTrail)
- Dynamické s variáciami (fade + scale decay + jitter + pulse)

**Inspirácia:** LinkBeadTrailSystem (GPU-driven particle trails)

---

## 🔧 IMPLEMENTÁCIE

### Nová metóda: `_getTrailVariation(index)`

Vracia individuálne charakteristiky pre každý trail (4 meshes):

```javascript
_getTrailVariation(index) {
    const baseVariation = 0.05 + index * 0.03; // 0.05, 0.08, 0.11, 0.14
    
    return {
        // Lifetime variácia (dlhšie traily vytrvajú dlhšie)
        lifetimeMultiplier: 0.8 + index * 0.1, // 0.8, 0.9, 1.0, 1.1
        
        // Spin rýchlosť variácia (rôzne rýchlosti)
        spinSpeedMultiplier: 0.7 + Math.random() * 0.4, // 0.7-1.1 random
        
        // Scale pulse variácia (rôzne pulse frekvencie)
        pulseFrequencyMultiplier: 0.8 + Math.random() * 0.4, // 0.8-1.2 random
        
        // Jitter magnitude (náhodné posuny ako LinkBeadTrail)
        jitterMagnitude: baseVariation,
        
        // Position lag (trail nie je presne na tej istej pozícii)
        lagOffset: 0.002 + index * 0.001, // 0.002, 0.003, 0.004, 0.005
        
        // Hue offset (už existuje ale môžeme zvýšiť pre rozmanitosť)
        hueOffset: (index + 1) * 0.01, // 0.01, 0.02, 0.03, 0.04
        
        // Base scale decay (postupne menší)
        scaleDecayBase: 1.0 - (index + 1) / this.TRAIL_COUNT // 0.75, 0.5, 0.25, 0.0
    };
}
```

---

### Trail Initialization (_initTrails())

Každý trail dostáva svoju variáciu:

```javascript
_initTrails() {
    for (let i = 0; i < this.TRAIL_COUNT; i++) {
        const mat = this.material.clone();
        const mesh = new THREE.Mesh(SHARED_RING_GEOMETRY, mat);
        mesh.frustumCulled = false;
        
        // TRAIL VARIATIONS - Každý trail má inú charakteristiku
        const trailVariation = this._getTrailVariation(i);
        mesh.userData.trailVariation = trailVariation; // Uložiť pre update
        
        this.trailMeshes.push(mesh);
    }
}
```

---

### Trail Update Loop (ORGANIC V2)

**Predtým (stable trail):**
- Presné zrkadlené kópie hlavného ringu
- Len scale decay + opacity decay + spin offset + hue offset

**Teraz (organic trail V2):**
- Position lag (trail nie je presne na tej istej pozícii)
- Jitter (náhodné posuny ako LinkBeadTrail)
- Scale pulse (nie len decay, ale aj pulse oscilácia)
- Opacity pulse (nie len decay, ale aj pulse modulácia)
- Lifetime decay (fade in/out logic)
- Hue offset variácia (náhodná variácia oproti fixnému offsetu)

```javascript
this.trailMeshes.forEach((trail, i) => {
    // Get trail variation parameters
    const variation = trail.userData.trailVariation;
    const trailProgress = this.progress - spacing * (i + 1);
    
    // Hide if behind start
    if (trailProgress <= 0) {
        trail.visible = false;
        return;
    }
    
    trail.visible = true;
    
    // Position on curve
    const trailT = Math.min(0.999, Math.max(0.001, trailProgress));
    const trailPoint = curve.getPointAt(trailT);
    const trailTan = curve.getTangentAt(trailT);
    
    // Apply position lag (trail nie je presne na tej istej pozícii)
    const trailPosLagged = trailPoint.clone();
    trailPosLagged.addScaledVector(trailTan, variation.lagOffset);
    trail.position.copy(trailPosLagged);
    
    // Orientation
    const trailQuat = new THREE.Quaternion();
    trailQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), trailTan.normalize());
    trail.quaternion.copy(trailQuat);
    
    // ORGANIC: Jitter (náhodné posuny ako LinkBeadTrail)
    const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
    ).normalize();
    
    const jitterMagnitude = variation.jitterMagnitude * this.mesh.scale.x;
    trail.position.addScaledVector(jitter, jitterMagnitude);
    
    // SCALE: Decay + Pulse (nielen decay, ale aj pulse)
    const baseScale = this.mesh.scale.x;
    const trailScalePulse = Math.sin(this.progress * Math.PI * 6 * variation.pulseFrequencyMultiplier) * 0.05;
    const dynamicScale = baseScale * (variation.scaleDecayBase + trailScalePulse);
    trail.scale.setScalar(dynamicScale);
    
    // OPACITY: Decay + Pulse + Lifetime variation
    const trailOpacityPulse = Math.sin(this.progress * Math.PI * 6 * variation.pulseFrequencyMultiplier) * 0.1;
    const trailOpacityDecay = 1.0 - (i + 1) / this.trailMeshes.length;
    
    // Lifetime variation (fade in/out logic)
    let trailLifetimeDecay = 1.0;
    if (trailProgress < 0.3) {
        trailLifetimeDecay = trailProgress / 0.3;
    } else if (trailProgress > 0.7) {
        trailLifetimeDecay = (1.0 - trailProgress) / 0.3;
    }
    
    trail.material.uniforms.uOpacity.value = finalOpacity * trailLifetimeDecay * trailOpacityDecay * (0.9 + trailOpacityPulse);
    
    // HUE: Variabilnejší offset (náhodná variácia oproti fixnému offsetu)
    const trailHueOffset = variation.hueOffset + (Math.random() - 0.5) * 0.02;
    this._tempColor.setHSL(hsl.h + trailHueOffset, hsl.s, hsl.l);
    trail.material.uniforms.uColor.value.copy(this._tempColor);
    
    // SPIN: Unique spin speed per trail
    const trailSpin = this.spin * variation.spinSpeedMultiplier;
    trail.rotateOnAxis(new THREE.Vector3(0, 0, 1), trailSpin);
});
```

---

## 📊 PARAMETRE

### Trail Variations (pre 4 trails)

| Parameter | Trail 0 | Trail 1 | Trail 2 | Trail 3 |
|-----------|----------|----------|----------|----------|
| **Lifetime Multiplier** | 0.8 | 0.9 | 1.0 | 1.1 |
| **Spin Speed Multiplier** | 0.7-1.1 | 0.7-1.1 | 0.7-1.1 | 0.7-1.1 |
| **Pulse Frequency Multiplier** | 0.8-1.2 | 0.8-1.2 | 0.8-1.2 | 0.8-1.2 |
| **Jitter Magnitude** | 0.05 | 0.08 | 0.11 | 0.14 |
| **Lag Offset** | 0.002 | 0.003 | 0.004 | 0.005 |
| **Hue Offset** | 0.01 | 0.02 | 0.03 | 0.04 |
| **Scale Decay Base** | 0.75 | 0.5 | 0.25 | 0.0 |

---

## ✅ VÝSLEDOK

### Predtým (Stable Trail)
- Trail = presné zrkadlené kópie hlavného ringu
- Len scale decay + opacity decay + spin offset + hue offset
- Presná, mechanická stopa

### Teraz (Organic Trail V2)
- Trail = **organická stopa** s náhodnými variáciami
- **Position lag**: trail nie je presne na tej istej pozícii
- **Jitter**: náhodné posuny (ako LinkBeadTrail)
- **Scale pulse**: oscilácia (nie len decay)
- **Opacity pulse**: modulácia (nie len decay)
- **Lifetime variation**: fade in/out logic
- **Hue variation**: náhodná variácia oproti fixnému offsetu
- **Unique spin speed**: každý trail má inú rýchlosť

---

## 🔗 SÚVISIACE

- **LinkPulseRing.js** - V3 + Fresnel + Harmonic + Hue Drift + Organic Trail V2
- **LinkBeadTrailSystem.js** - Inšpirácia pre organic trail behavior
- **LINK_PULSE_RING_V4_HARMONIC_HUE_DRIFT.md** - Predchádzajúce V4 upgrade
- **LINK_PULSE_RING_V3_FRESNEL.md** - Predchádzajúce V3 upgrade

---

## 📌 POZNÁMKA

**Inšpirácia z LinkBeadTrailSystem:**
- GPU-driven particle trails s jitter 0.02 * bead.radius
- Lifetime: 0.5s pre medium, 0.8s pre large
- Emission rate: 60 particles/sekundu per bead
- Size attenuácia: `baseSize * (1.0 - lifeProgress) * (40.0 / -mvPosition.z)`
- Alpha fade: `0.6 * (1.0 - lifeProgress)`

**Adaptácia pre Ring Trail:**
- Trail meshes (nie particles)
- Jitter: 0.05-0.14 * ring scale (väčšie než beads)
- Lifetime variation: 0.8-1.1 multiplier
- Scale pulse: sin(progress * PI * 6 * pulseFreq) * 0.05
- Opacity pulse: sin(progress * PI * 6 * pulseFreq) * 0.1

---

**Hotové!** Trail pôsobí teraz ako organická stopa, nie len presné zrkadlené kópie. 🚀
