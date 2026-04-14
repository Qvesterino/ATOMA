# _NodeMicroEvents - Prehľad Efektov a Návrhy na Zlepšenie

## Dátum: 2026-04-14

## Prehľad Efektov v _NodeMicroEvents

### 1. Personality-Based Events (10 typov osobností)

Tieto efekty sa spúšťajú na základe personality typu uzla v náhodných intervaloch (12-35s).

#### CALM_ANALYST
- **createFocusPulse()** - jemný pulz emisií
- **createSlowTilt()** - pomalé nakláňanie
- **createBreathingShift()** - dychové škálovanie (±3%)

#### HARMONY_KEEPER
- **createResonanceHalo()** - rezonačný halo s echo krúžkom
- **createSynchronizedPulse()** - synchronizovaný pulz so susedmi

#### FRACTAL_DREAMER
- **createFractalShimmer()** - farebné žiariace prechody
- **createIrregularRotation()** - nepravidelná rotácia

#### QUANTUM_TRICKSTER
- **createMicroBlink()** - mikro blikanie
- **createEmissiveSpike()** - špičková emisiálna intenzita

#### RADIANT_OPTIMIZER
- **createEnergyOvercharge()** - preťaženie energie

#### UMBRA_SENTINEL
- **createDensityDarkening()** - stmavnutie opacity

#### ECHO_WANDERER
- **createDriftingGesture()** - plávajúce gesto (position drift)

#### GLYPH_ARCHIVIST
- **createGlyphFlash()** - blikanie glyph

#### CONVERGENCE_NEXUS
- **createBalancedOscillation()** - vyvážená oscilácia

#### ASCENDED_MYTHIC
- **createAscendedFlare()** - dvojité krúžky + vertikálny lúč

### 2. Metric-Based Additive Events

Tieto efekty sa spúšťajú na základe metrických hodnôt uzla.

#### Stability (stabilita)
- **High (>0.65)**: `createJitterBurst()` - deterministický jitter (±0.015 jednotiek)
- **Mid (0.45-0.65)**: `createStabilityAnchor()` - uzemňovací krúžok
- **Low (<0.45)**: `createDimPulse()` - stmavý pulz

#### Harmony (harmónia)
- **High (>0.7)**: `createHarmonyRing()` - rezonačný krúžok s halo
- **Mid (0.5-0.7)**: `createBreathingShift()` - dychové škálovanie
- **Low (<0.5)**: `createDimPulse()` - stmavý pulz

#### Synergy (synergia)
- **High (>0.8)**: `createClaritySpark()` - čistý iskru
- **Mid (0.55-0.8)**: `createBalancedOscillation()` - vyvážená oscilácia
- **Low (<0.55)**: `createDimPulse()` - stmavý pulz

#### Corruption (korupcia)
- **High/Mid (>0.55)**: `createCorruptionTendril()` - tmavé výrastky
- **Mid (0.55)**: `createDensityDarkening()` - stmavnutie
- **Low (<0.55)**: `createFractalShimmer()` - farebné žiarenie

#### LoadPressure (tlak zaťaženia)
- **High (>0.75)**: `createCorePulse()` - pulz jadra
- **Mid (0.55-0.75)**: `createEnergyOvercharge()` - preťaženie energie
- **Low (<0.55)**: `createBreathingShift()` - dychové škálovanie

#### Clarity (jasnosť)
- **High (>0.75)**: `createClaritySpark()` - čistý iskru
- **Mid (0.5-0.75)**: `createGlyphFlash()` - blikanie glyph
- **Low (<0.5)**: `createGlyphFlash()` - blikanie glyph

### 3. Node-to-Node Interaction Events

Tieto efekty sa spúšťajú pri interakcii medzi susednými uzlami (<2.0 jednotiek).

#### createHarmonyFlash(node1, node2)
- Energetický lúč medzi uzlami s cestujúcim pulzom
- Farba: cyan/zelená (0x00ffaa → 0xaaffdd)
- Trvanie: 1.0s
- Efekt: lúč + cestujúci pulz

#### createChaosSpark(node1, node2)
- Eratický blesk medzi uzlami s odbočkami
- Farba: ružová/červená (0xff0088 → 0xff4488)
- Trvanie: 0.8s
- Efekt: hlavný blesk + 2 odbočky

#### createCalmAura(node)
- Ukladajúca aura pre ascended prítomnosť
- Farba: modrá (0x6688ff)
- Trvanie: 1.2s
- Efekt: krúžok s jemným svetlom

## Návrhy na Zlepšenie

### 1. Memory Leaks a Resource Cleanup ⚠️ **CRITICAL**

#### Problém
- Chýba `dispose()` metóda pre celý systém
- Pri odstránení NodeMicroEvents sa nečistia aktívne vizuály
- Možný memory leak pri频繁 spúšťaní/ukončovaní

#### Riešenie
Pridať `dispose()` metódu:

```javascript
dispose() {
  // Vyčistiť všetky aktívne vizuály
  this.activeVisuals.forEach((visual) => {
    this.cleanupVisual(visual);
  });
  this.activeVisuals.clear();

  // Vyčistiť event registry
  this.nodeEvents.clear();
  this.interactionCache.clear();

  // Reset timer
  this._elapsedTime = 0;
  this.lastUpdateTime = 0;
  this.lastInteractionCheck = 0;

  console.log('[NodeMicroEvents] Disposed successfully');
}
```

### 2. Geometry Reuse / Object Pooling ⚠️ **HIGH PRIORITY**

#### Problém
- Každý efekt vytvára novú geometriu (RingGeometry, SphereGeometry, CylinderGeometry)
- Zbytočné alokácie pri častých efektoch
- Garbage collection pressure

#### Riešenie
Implementovať jednoduchý object pool pre často používané geometrie:

```javascript
constructor(scene, camera) {
  // ... existujúci kód ...

  // Geometry pool
  this.geometryPool = {
    rings: [],     // RingGeometry in various sizes
    spheres: [],   // SphereGeometry
    cylinders: [], // CylinderGeometry
  };

  // Material pool
  this.materialPool = {
    rings: [],
    spheres: [],
    cylinders: [],
  };
}

_getRingGeometry(innerRadius, outerRadius, segments) {
  const key = `${innerRadius}_${outerRadius}_${segments}`;
  let geo = this.geometryPool.rings.find(g => g.userData.key === key);

  if (!geo) {
    geo = new THREE.RingGeometry(innerRadius, outerRadius, segments);
    geo.userData.key = key;
    this.geometryPool.rings.push(geo);
  }

  return geo;
}

dispose() {
  // Dispose geometries
  Object.values(this.geometryPool).forEach(pool => {
    pool.forEach(geo => geo.dispose());
  });
  Object.values(this.materialPool).forEach(pool => {
    pool.forEach(mat => mat.dispose());
  });

  // ... existujúci cleanup ...
}
```

### 3. Incomplete Cleanup ⚠️ **MEDIUM PRIORITY**

#### Problém
V `cleanupVisual()` chýba čistenie niektorých objektov:
- `visual.tendril` (jeden)
- `visual.stabilizer` (ak existuje)
- Iné prípadné objekty

#### Riešenie
Rozšíriť `cleanupVisual()`:

```javascript
cleanupVisual(visual) {
  // Reset node properties
  // ... existujúci kód ...

  // Helper to safely dispose a mesh
  const disposeMesh = (mesh) => {
    if (!mesh) return;
    this.scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  };

  // Remove scene objects — standard
  disposeMesh(visual.ring);
  disposeMesh(visual.ring1);
  disposeMesh(visual.ring2);
  disposeMesh(visual.spark);
  disposeMesh(visual.beam);

  // Remove scene objects — new EPIC types
  disposeMesh(visual.echoRing);
  disposeMesh(visual.halo);
  disposeMesh(visual.pulse);

  // Remove trail particles
  if (visual.trails) {
    visual.trails.forEach(t => disposeMesh(t.mesh));
  }

  // Remove branch sparks
  if (visual.branches) {
    visual.branches.forEach(b => disposeMesh(b));
  }

  // Remove tendrils
  if (visual.tendrils) {
    visual.tendrils.forEach(t => disposeMesh(t));
  }

  // NEW: Remove single tendril
  disposeMesh(visual.tendril);

  // NEW: Remove stabilizer
  disposeMesh(visual.stabilizer);

  // NEW: Remove any other mesh references
  Object.values(visual).forEach(value => {
    if (value instanceof THREE.Mesh) {
      disposeMesh(value);
    }
  });
}
```

### 4. Performance Optimization - Interaction Cache ⚠️ **MEDIUM PRIORITY**

#### Problém
- `updateInteractionCache()` používa O(n²) algoritmus
- Pre 100 uzlov = 10,000 porovnaní
- Spúšťa sa 5Hz = 50,000 operácií/s

#### Riešenie
Optimalizovať pomocou spatial partitioning:

```javascript
constructor(scene, camera) {
  // ... existujúci kód ...

  // Spatial grid for faster proximity checks
  this.spatialGrid = new Map(); // gridKey -> [nodes]
  this.gridCellSize = 2.0; // Same as proximity threshold
}

_updateSpatialGrid(nodes) {
  this.spatialGrid.clear();

  nodes.forEach(node => {
    const cellX = Math.floor(node.position.x / this.gridCellSize);
    const cellZ = Math.floor(node.position.z / this.gridCellSize);
    const key = `${cellX}_${cellZ}`;

    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, []);
    }
    this.spatialGrid.get(key).push(node);
  });
}

updateInteractionCache(nodes) {
  // Update spatial grid
  this._updateSpatialGrid(nodes);

  this.interactionCache.clear();

  // Find nearby nodes using spatial grid
  nodes.forEach(nodeA => {
    const nearby = [];
    const cellX = Math.floor(nodeA.position.x / this.gridCellSize);
    const cellZ = Math.floor(nodeA.position.z / this.gridCellSize);

    // Check current cell and adjacent cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const key = `${cellX + dx}_${cellZ + dz}`;
        const cellNodes = this.spatialGrid.get(key);

        if (cellNodes) {
          cellNodes.forEach(nodeB => {
            if (nodeA.uuid === nodeB.uuid) return;

            const distance = nodeA.position.distanceTo(nodeB.position);
            if (distance < 2.0) {
              nearby.push(nodeB);
            }
          });
        }
      }
    }

    if (nearby.length > 0) {
      this.interactionCache.set(nodeA.uuid, nearby);
    }
  });
}
```

### 5. Missing Event Emitters for Metric Low/Mid Events ✅ **ALREADY FIXED**

#### Problém (UŽ RIEŠENÝ)
- Iba `node.synergy.high` bol emitovaný
- Chýbali `node.synergy.low` a `node.synergy.mid`
- Toto už bolo opravené v predchádzajúcej úlohe

### 6. Lack of Visual Intensity Scaling 📊 **LOW PRIORITY**

#### Problém
- Všetky efekty majú rovnakú intenzitu bez ohľadu na počet uzlov
- Pri veľkom počte uzlov môže byť vizuálny hluk

#### Riešenie
Pridať dynamické škálovanie intenzity:

```javascript
update(deltaTime, nodes) {
  // ... existujúci kód ...

  // Calculate intensity multiplier based on node count
  const intensityMultiplier = Math.max(0.5, Math.min(1.0, 100 / nodes.length));
  this.config.visualIntensity = intensityMultiplier;

  // ... zvyšok kódu ...
}
```

### 7. Missing Diagnostic/Status Method 📊 **LOW PRIORITY**

#### Problém
- Žiadna metóda na získanie stavu systému
- Ťažké debugovanie a profilovanie

#### Riešenie
Pridať `getStatus()` metódu:

```javascript
getStatus() {
  const eventCounts = {};
  this.activeVisuals.forEach((visual) => {
    eventCounts[visual.type] = (eventCounts[visual.type] || 0) + 1;
  });

  return {
    performanceMode: this.performanceMode,
    updateInterval: this.updateInterval,
    totalNodes: this.nodeEvents.size,
    activeVisuals: this.activeVisuals.size,
    interactionPairs: this.interactionCache.size,
    eventBreakdown: eventCounts,
    averageEventCount: Array.from(this.nodeEvents.values())
      .reduce((sum, e) => sum + (e.eventCount || 0), 0) / Math.max(1, this.nodeEvents.size),
  };
}
```

### 8. Inconsistent Threshold Values 🎯 **LOW PRIORITY**

#### Problém
- Thresholdy v konfigurácii sa nezodpovedajú s tými v `checkMetricEvents()`
- Napr.: synergy high v config = 0.8, ale v kóde = 0.8 (ok)
- Ale harmony mid v config = 0.5, ale nie je explicitne použité

#### Riešenie
Normalizovať thresholdy a použiť konfiguráciu konzistentne:

```javascript
checkMetricEvents(node, metrics) {
  const stability = Number.isFinite(metrics?.stability) ? metrics.stability : 0;
  const harmony = Number.isFinite(metrics?.harmony) ? metrics.harmony : 0;
  const synergy = Number.isFinite(metrics?.synergy) ? metrics.synergy : 0;
  const loadPressure = Number.isFinite(metrics?.loadPressure) ? metrics.loadPressure : 0;

  // Use config thresholds consistently
  const { stability: stTh, harmony: haTh, synergy: syTh, loadPressure: lpTh } = this.config;

  // High stability
  if (stability > stTh.high) {
    this._emitEvent('node.stability.high', { /* ... */ });
    this.createJitterBurst(node);
  }
  // Mid stability
  else if (stability > stTh.mid) {
    this.createStabilityAnchor(node, stability);
  }
  // Low stability
  else {
    this.createDimPulse(node);
  }

  // ... podobne pre ostatné metriky ...
}
```

## Priorita Zlepšení

### Kritické (spraviť hneď)
1. **Memory Leaks** - Pridať `dispose()` metódu

### Vysoká priorita (spraviť čoskoro)
2. **Geometry Reuse** - Implementovať object pooling

### Stredná priorita (spraviť keď bude čas)
3. **Incomplete Cleanup** - Doplniť chýbajúce cleanup
4. **Performance Optimization** - Optimalizovať interaction cache

### Nízka priorita (nice-to-have)
5. **Visual Intensity Scaling** - Dynamické škálovanie
6. **Diagnostic Method** - Pridať `getStatus()`
7. **Threshold Consistency** - Normalizovať thresholdy

## Zhrnutie

_NodeMicroEvents obsahuje **33 rôznych efektov** rozdelených do 3 kategórií:
- 10 personality-based efektov
- 15+ metric-based efektov
- 3 node-to-node interaction efekty

Systém je vizuálne bohatý a dobre navrhnutý, ale má niekoľko problémov s pamäťou a výkonom. Kritickým problémom je chýbajúca `dispose()` metóda, ktorá môže spôsobiť memory leaks. Vysokou prioritou je implementácia geometry reuse pre zníženie garbage collection pressure.

Väčšina problémov je riešiteľná s minimálnymi zmenami a bez toho, aby sa ovplyvnil existujúci vizuálny výstup systému.
