## 🎨 DIZAJNERSKÝ UPGRADE PLÁN - CascadeBurstVisual_Session147

### SÚČASNÝ STAV (Baseline)

• 4 vrstvy: Energy Shell, Shockwave Ring, Radial Rays, Core Flash
• MeshBasicMaterial (žiadne shadery)
• Jednoduché animácie (scale, opacity, rotation)
• Max 8 súčasných burst-ov, 1.2s trvanie
• LOD: 100% → 30% kvalita vo vzdialenosti

--------

## 🚀 EPIC UPGRADE - 5 FÁZ

### FAZA 1: SHADEROVÉ REVOLÚCIA ⭐⭐⭐⭐⭐

Cieľ: Nahraď MeshBasicMaterial s GLSL shadrami

#### 1.1 Energy Shell Upgrade

  TERAZ: Wireframe Icosahedron s rotáciou
  EPIC:
  ├─ Vertex shader: Noise-based displacement (bublinový efekt)
  ├─ Fragment shader: Elektrický glow s edge highlighting
  ├─ 3 vrstvy shellov s rôznymi rýchlosťami a veľkosťami
  └─ "Energy cracks" - náhodné blikajúce čiary na povrchu

#### 1.2 Shockwave Ring Upgrade

  TERAZ: 1 expandujúci Torus
  EPIC:
  ├─ 3-5 prstencov s rôznymi rýchlosťami (wave interference)
  ├─ Vertex shader: Sinusoidal displacement na "ripple" efekt
  ├─ Fragment shader: Gradient farby (cyan → white → cyan)
  └─ "Distortion ring" - shader-based krivka okolo prstencu

#### 1.3 Radial Rays Upgrade

  TERAZ: 6 Lines
  EPIC:
  ├─ 12-16 lúčov (dvojnásobok)
  ├─ Namiesto Lines použiť extrudované shap (Beam geometry)
  ├─ Vertex shader: Pulse glow traveling down the beam
  ├─ "Energy particles" - častice cestujúce po lúčoch
  └─ "Fractal branching" - lúče sa rozdelia na konci (tree-like)

#### 1.4 Core Flash Upgrade

  TERAZ: 1 Sphere
  EPIC:
  ├─ 3-vrstvová guľa (core, bloom, aura) s rôznymi opacitami
  ├─ "Energy tendrils" - častice vylietavajúce z jadra
  ├─ "Chromatic aberration" - RGB split na začiatku burstu
  └─ "Implosion → explosion" - sťahovanie pred expanziou

--------

### FAZA 2: VIACVRSTVOVÝ DESIGN ⭐⭐⭐⭐

Cieľ: Hlbšia vizuálna zložitosť

  Každá vrstva = 3-5 mesh-ov:
  ├─ Inner (ráchle, jasná)
  ├─ Middle (stredná rýchlosť, intenzita)
  └─ Outer (pomalá, rozptýlená)

  Parallax efekt:
  ├─ Rôzne rýchlosti rotácie
  ├─ Rôzne expanzné rýchlosti
  └─ Rôzne fade-out časy

--------

### FAZA 3: ČASTICOVÉ SYSTÉMY ⭐⭐⭐⭐⭐

Cieľ: Pridať movement a detail

#### 3.1 Energy Particles (po lúčoch)

  ├─ 50-100 malých častíc cestujúcich po lúčoch
  ├─ Znížená rýchlosť pri vzdialenom konci
  └─ Trail efekt za každou časticou

#### 3.2 Core Sparks (z jadra)

  ├─ 200-300 malých iskier vylietavajúcich radiálne
  ├─ Random velocity s gravitáciou (padajú dole)
  └─ Spark lifetime = 0.5-0.8s

#### 3.3 Nebula Cloud (okolo burstu)

  ├─ 30-50 veľkých mračienok častíc
  ├─ Spomalé expandovanie s rotáciou
  └─ Farebný gradient (center = jasný, edge = tmavý)

--------

### FAZA 4: POST-PROCESSING ⭐⭐⭐⭐⭐

Cieľ: Celoscénové efekty

#### 4.1 Bloom

  ├─ Intenzívny bloom pre Core Flash
  ├─ Stredný bloom pre Shell
  └─ Slabý bloom pre Rays

#### 4.2 Chromatic Aberration

  ├─ 0-0.3s: Silný RGB split (explosion shock)
  ├─ 0.3-0.8s: Postupne klesá
  └─ 0.8s+: Uplne zmizne

#### 4.3 Distortion Wave

  ├─ Sférická vlna distorzie v priestore
  ├─ Vplyv na okolité objekty (push away)
  └─ Klesá s vzdialenosťou od burstu

--------

### FAZA 5: INTERAKTIVITA ⭐⭐⭐

Cieľ: Burst ovplyvňuje svet

#### 5.1 Lighting Flash

  ├─ PointLight v centre burstu
  ├─ Intenzita: 0 → 10 → 0 (čas: 0.1s)
  ├─ Farba podľa burst typu (harmonic/synergy/corruption)
  └─ Zmení osvetlenie okolitých node-ov

#### 5.2 Push Away Force

  ├─ Fyzikálne push away pre blízke častice
  ├─ Síla klesá s vzdialenosťou (1/r²)
  └─ Len pre vizuálne systémy (nie gameplay)

#### 5.3 Sound Impact (voliteľné)

  ├─ Bass boom pri starte
  ├─ High-pitched shimmer počas expanzie
  └─ Znížená hlasitosť vo vzdialenosti (attenuation)

--------

## 🎯 KONKRÉTNE VYLEPŠENIA

### A. ANIMÁCIE

  TERAZ:
  ├─ Linear scale
  ├─ Constant rotation
  └─ Simple fade

  EPIC:
  ├─ Easing funkcie (ease-out-back, elastic-out)
  ├─ Overshoot pre expansion (scale > max potom klesne)
  ├─ Damped oscillation (vibrujúce klesnutie do 0)
  └─ Multi-phase animácie (implosion → pause → explosion)

### B. FARBY

  TERAZ:
  ├─ Jedna farba podľa typu (cyan/gold/red)
  └─ Statická počas burstu

  EPIC:
  ├─ Gradient farby (white → cyan → blue)
  ├─ Farebné shiftovanie počas trvania
  ├─ Sekundárne farby pre "echo" efekty
  └─ "Heat map" - farba podľa intenzity

### C. LOD (Level of Detail)

  TERAZ:
  ├─ 100% → 30% (binary)
  └─ Len scale reduction

  EPIC:
  ├─ 100% → 70% → 30% (tri úrovne)
  ├─ Near: Všetky shadery + častice
  ├─ Mid: Zjednodušené shadery, menej častíc
  └─ Far: Iba základné mesh-e, žiadne častice

### D. POČET BURST-OV

  TERAZ: Max 8 súčasných
  EPIC: Max 16 s pooling (flexibilný limit)

### E. TRVANIE

  TERAZ: 1.2s fixné
  EPIC:
  ├─ Normal: 1.2s
  ├─ High strength: 1.6s
  ├─ Mythic: 2.0s (s extra efekty)
  └─ Podľa cascade strength dynamic

--------

## 📊 TECHNICKÝ PLÁN IMPLEMENTÁCIE

### Krok 1: Shader Library

  // Shaders/
  ├─ BurstShellShader.glsl      (vertex + fragment)
  ├─ BurstRingShader.glsl      (vertex + fragment)
  ├─ BurstRayShader.glsl       (vertex + fragment)
  ├─ BurstCoreShader.glsl      (vertex + fragment)
  └─ BurstCommon.glsl          (zdieľané funkcie)

### Krok 2: Particle Systems

  // CascadeBurstParticles.js
  ├─ EnergyBeamParticles
  ├─ CoreSparkParticles
  └─ NebulaCloudParticles

### Krok 3: Post-Processing Hooks

  // CascadeBurstPostProcessing.js
  ├─ Bloom management
  ├─ Chromatic aberration pass
  └─ Distortion wave pass

### Krok 4: Interactivity

  // CascadeBurstInteraction.js
  ├─ PointLight flash
  ├─ Push away force
  └─ Optional sound trigger

### Krok 5: Pool Management

  // Extended pool:
  ├─ 16 burst rigs (z 8)
  ├─ 2000 častíc (z 0)
  ├─ 5 point lights (pool)
  └─ Dynamic allocation

--------

## 🎨 KONCEPTUÁLNE VYKRESLENIE (Mental Image)

Po upgrade:

  Burst sa spustí:
  0.0s:
    ├─ CORE IMPLODES (sťahovanie do 0.1×)
    ├─ Sound: Low bass rumble
    └─ Tma okolo (light suck-in)

  0.1s:
    ├─ EXPLOSION! (scale z 0.1× → 1.5× v 0.1s)
    ├─ Jasná biela guľa s RGB splitom
    ├─ 3-5 prstencov expanduje rýchlo
    ├─ 12 lúčov streľá von
    ├─ 300 iskier vylietáva
    ├─ Light flash (intenzita = 10×)
    ├─ Chromatic aberration = max
    └─ Distortion vlna v priestore

  0.3s:
    ├─ Core klesá na 70% opacity
    ├─ Shell expanduje pomalšie (elastic bounce)
    ├─ Prstence vytvárajú interference vzory
    ├─ Častice cestujú po lúčoch
    ├─ Bloom klesá
    └─ Chromatic aberration klesá

  0.6s:
    ├─ Core zmizne (fade out)
    ├─ Shell wireframe blinkuje (energy cracks)
    ├─ Prstence rozpustia do mračienok
    ├─ Iskrie padajú dole (gravitácia)
    └─ Echo ring (slabý, pomalý)

  1.2s:
    ├─ Všetko zmizne
    ├─ Farby prejdú do blue/purple fade
    └─ Ticho

--------

## 🏁 SUMÁR

 Fáza                         │ Impact                      │ Difficulty                  │ Priority
──────────────────────────────┼─────────────────────────────┼─────────────────────────────┼─────────────────────────────
 1. Shader revolúcia          │ ⭐⭐⭐⭐⭐                  │ ⭐⭐⭐⭐                    │ HIGH
 2. Viacvrstvový design       │ ⭐⭐⭐⭐                    │ ⭐⭐⭐                      │ HIGH
 3. Časticové systémy         │ ⭐⭐⭐⭐⭐                  │ ⭐⭐⭐                      │ HIGH
 4. Post-processing           │ ⭐⭐⭐⭐⭐                  │ ⭐⭐⭐⭐⭐                  │ MEDIUM
 5. Interaktivita             │ ⭐⭐⭐                      │ ⭐⭐                        │ LOW

Odporúčané po poradí:

1. Fáza 1 (Shadery) - najväčší vizuálny dopad
2. Fáza 3 (Častice) - pridáva movement
3. Fáza 2 (Viacvrstvový) - hlbšia zložitosť
4. Fáza 4 (Post-processing) - polish
5. Fáza 5 (Interaktivita) - optional extra