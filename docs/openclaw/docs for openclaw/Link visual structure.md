# ATOMA LINK VISUAL STRUCTURE AUDIT - COMPLETED

## SÚHRN (Summary)

Identifikoval som **7 vrstiev** v link vizuálnej štruktúre:

### 1. CORE OCCLUDER (Hlbka-only shell)
- **Čo je:** Neviditeľná sieť píšuca do depth bufferu
- **Kľúčové vlastnosti:** `colorWrite: false`, `depthWrite: true`
- **Účel:** Zabraňuje preniknutiu pozadia cez transparentné vrstvy

### 2. STRAND GEOMETRY (Povrch)
- **Čo je:** Viditeľná prepletená lanová štruktúra (3-5 prútov)
- **Kľúčové vlastnosti:** `depthWrite: true`, `transparent: false`
- **Účel:** Primárna vizuálna reprezentácia linku

### 3. AURA SKIN (Atmosféra)
- **Čo je:** Transparetný energetický obal okolo prútov
- **Kľúčové vlastnosti:** `depthWrite: false`, `blending: Additive`
- **Účel:** Hlbkové svetlo a organická deformácia
- **Shader:** LinkAuraShader.js (zdieľa šum s NodeAuraShader)

### 4. FLOW EFFECTS (Pulzujúce efekty)
- **Čo sú:** Cestujúce prstence, vlny, prach
- **Sub-vrstvy:**
  - Pulse Ring (cestujúci prstenec)
  - Energy Wave (emisívna vlna)
  - Pulse Dust (prachové emisie)

### 5. PARTICLE SYSTEMS (Častice)
- **Čo sú:** Dynamické častice tečúce pozdĺž linku
- **Sub-vrstvy:**
  - Beads (energetické guličky)
  - Sparks (mikro-iskry)
  - Bead Trails (stopy po guličkách)
  - Trail Particles (corruption/healing particles)

### 6. OVERLAY EFFECTS (Prekryvy)
- **Čo sú:** Doplnkové vizuálne vrstvy
- **Sub-vrstvy:**
  - Directional Streaks (synergy prúdy)
  - Ring Arc Discharges (elektrické oblúky)
  - Energy Rings (expandujúce krúžky)
  - Pictograms (3D glyfy)
  - Dock Rings & Ghosts (ukotvenie na node)
  - Source Injection (vortex na zdroji)

### 7. IMPACT EFFECTS (Nárazové efekty)
- **Čo sú:** Vizuálna spätná väzba pri kontakte s node
- **Implementácia:** Geometrické impakty podľa kategórie node
- **Animácia:** Scale up → fade in → fade out

## KĽÚČOVÉ POJMY

- **Core Occluder** = Neviditeľná hlbka-only vrstva (colorWrite: false)
- **Surface** = Viditeľná prútová geometria
- **Aura/Overlay** = Additívne efekty nad povrchom
- **Atmosphere** = Aura skin (nie samostatná vrstva)

## RENDER ORDER

1. LINK_CORE (depth occluder)
2. LINK_STRANDS (visible surface)
3. LINK_SKIN (aura glow)
4. LINK_IMPACTS (node collision)
5. Ostatné transparentné vrstvy

Full report: `ATOMA_LINK_VISUAL_STRUCTURE_AUDIT.md`