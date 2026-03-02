# LINK PULSE RING V3 + FRESNEL SHADER
## Transformácia: Svetlý torus → Energétický plazmový torus

**Vytvorené:** 2026-03-02  
**Súbor:** LinkPulseRing.js

---

## 🎯 CIELE

### 1️⃣ Fresnel Shader Material
**Nahradiť MeshBasicMaterial ShaderMaterial-om** s vlastným shaderom:
- Fresnel efekt: Ostrý rim na hrane (view-dependent)
- Širší glow: `uFresnelPower = 2.5`, `uFresnelIntensity = 1.8`
- Jemný glow term: `finalColor += uColor * 0.2` (subtle inner glow)
- Additive blending: Zosilňuje efekt

### 2️⃣ Shader Uniform Updates
**Nahradiť setter-ov shader uniform-ami**:
- PREDTÝM: `this.material.opacity = ...`, `this.material.color.copy(...).lerp(...)`
- TERAZ: `this.material.uniforms.uOpacity.value = ...`, `this.material.uniforms.uColor.value.copy(...).lerp(...)`

### 3️⃣ Doladenie (Signature Feeling)
- Nižší fresnel power → **širší glow**
- Vyšší fresnel intensity → **ostrý rim**
- Jemný glow term → **signature feeling**

---

## 🔧 IMPLEMENTÁCIA

### 1. Constructor Zmeny

#### PREDTÝM (MeshBasicMaterial)
```javascript
this.material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide
});
```

#### TERAZ (ShaderMaterial s Fresnel)
```javascript
this.material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    
    uniforms: {
        uColor: { value: new THREE.Color(0xffffff) },
        uOpacity: { value: 0.5 },
        uFresnelPower: { value: 2.5 },        // Širší glow
        uFresnelIntensity: { value: 1.8 }   // Ostrý rim
    },
    
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
    `,
    
    fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uFresnelPower;
        uniform float uFresnelIntensity;
        
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float fresnel = pow(1.0 - dot(vNormal, viewDir), uFresnelPower);
            fresnel *= uFresnelIntensity;
            
            vec3 finalColor = uColor * fresnel;
            
            // Jemný glow term (signature feeling)
            finalColor += uColor * 0.2;
            
            gl_FragColor = vec4(finalColor, uOpacity * fresnel);
        }
    `
});
```

---

### 2. Update() Zmeny

#### PREDTÝM (Material property setter-ov)
```javascript
// Color blending
if (sourceColor && targetColor) {
    this.material.color.copy(sourceColor).lerp(targetColor, this.progress);
} else if (sourceColor) {
    this.material.color.copy(sourceColor);
}

// Opacity with epic boost
const maxOpacity = 0.4 + (synergy * 0.4);
this.material.opacity = alpha * maxOpacity * epicBoost;
```

#### TERAZ (Shader uniform updates)
```javascript
// Color blending - do shader-uColor
if (sourceColor && targetColor) {
    this.material.uniforms.uColor.value.copy(sourceColor).lerp(targetColor, this.progress);
} else if (sourceColor) {
    this.material.uniforms.uColor.value.copy(sourceColor);
}

// Opacity - do shader-uOpacity
const maxOpacity = 0.4 + (synergy * 0.4);
const finalOpacity = alpha * maxOpacity * epicBoost;
this.material.uniforms.uOpacity.value = finalOpacity;
```

---

## 📊 PARAMETRE

### Fresnel Shader
| Parameter | Hodnota | Účel |
|-----------|----------|--------|
| `uFresnelPower` | **2.5** | Širší glow (lower power = wider glow) |
| `uFresnelIntensity` | **1.8** | Ostrý rim (higher intensity = sharper rim) |
| `uColor` | Dynamic (source → target) | Farba ringu |
| `uOpacity` | Dynamic (fade in/out + boost) | Priehľnosť |

### Epic Glow (zachované)
| Parameter | Hodnota | Účel |
|-----------|----------|--------|
| `pulseBreath` | `1.0 + sin(...) * 0.15` | Pulse breathing |
| `epicBoost` | `0.6 + synergy * 0.8` | Energy boost |
| `baseScale` | `0.12 + synergy * 0.08` | Base size |
| `maxOpacity` | `0.4 + synergy * 0.4` | Max opacity |

---

## ✅ VÝSLEDOK: VISUÁLNA TRANSFORMÁCIA

### PREDTÝM
- Ring = **svetlý torus** (MeshBasicMaterial)
- Jemný, priamy svetlo
- Bez view-dependent efektov

### TERAZ
- Ring = **energétický plazmový torus** (Fresnel ShaderMaterial)
- **Ostrý rim** na hrane (view-dependent)
- **Širší glow** (fresnel * intensity)
- **Jemný vnútorný glow** (signature feeling)
- **Additive blending** zosilňuje efekt

### Signatura
- Nie "soft glow"
- Ale "ENERGIA" + "SIGNATURE"
- Plazmový vzhľad + ostrý rim

---

## ⚠️ MISSING: TRAIL MESHES DO LINK RENDERER CONDUIT

### PROBLÉM
LinkRendererConduit.js pridáva len hlavný pulseRing mesh do group:
```javascript
group.add(pulseRing.getMesh());
```

Ale NEpridáva trail meshy:
```javascript
// CHÝBA:
const trailMeshes = pulseRing.getTrailMeshes();
trailMeshes.forEach(mesh => group.add(mesh));
```

### RIEŠENIE
Do `LinkRendererConduit.js`, v `createLinkVisuals()`, po tom ako sa pridá pulseRing:

```javascript
// 5. Flow Carrier (Mandatory)
let pulseRing = null;
try {
    if (LinkPulseRing) {
        pulseRing = new LinkPulseRing(this.scene);
        group.add(pulseRing.getMesh());
        
        // Pridať trail meshy
        const trailMeshes = pulseRing.getTrailMeshes();
        trailMeshes.forEach(mesh => group.add(mesh));
    }
} catch (e) { throw e; }
```

---

## 🔗 SÚVISIACE

- **LinkPulseRing.js** - V3 + Fresnel ShaderMaterial
- **LinkRendererConduit.js** - Treba pridať trail meshy
- **LINK_RENDER_ORDER_UNIFIED_PROPOSAL_V2.md** - RenderOrder hierarchia
- **LINK_NODE_RENDER_ORDER_GUIDELINES.md** - NODE < 2 < LINKS pravidlo
- **PULSE_RING_ENHANCEMENT.md** - Predchádzajúce enhancementy (spin, epic glow, trail, impact)

---

## 📌 POZNÁMKA POSTPROCESSING

- **Výhodnosť:** Toto riešenie zanedbateľne (prakticky bez overhead)
- **Žiadne postprocessing potrebné:** Additive blending + shader dosiahne rovnaký efekt
- **Žiadne GPU bottleneck:** Jednoduchý Fresnel shader, velmi efektívny
- **Deterministické:** Všetky v shadery, žiadne random runtime changes

---

**Transformácia hotová!** 🎨✨

Svetlý torus → Energétický plazmový torus s ostrým rim efektom

**POZÁMKA:** Treba pridať trail meshy do LinkRendererConduit.js (pozri MISSING sekciu).
