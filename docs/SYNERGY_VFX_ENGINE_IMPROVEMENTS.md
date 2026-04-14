# SynergyVFXEngine1_0 - Vylepšenia a Eventové Mapovanie

## Dátum: 2026-04-14

## Prehľad vylepšení

### 1. Event-Based Trigger System (Nový)

SynergyVFXEngine1_0 je teraz rozšírený o automatický systém spúšťania efektov na základe semantických eventov z SemanticEventBus.

**Konštruktor aktualizovaný:**
```javascript
constructor(scene, camera, linkingSystem, semanticBus, config = {})
```
- Pridaný parameter `semanticBus` pre event-based integráciu
- Automatická registrácia na `node.synergy.low/mid/high` eventy

### 2. Mapovanie Efektov na Eventy

#### `node.synergy.low` (synergy < 0.3)
- **Orbit Halos**: Tier 0 - minimálny rádius (1.0x)
- **Polarity**: neutrálna
- **Vizuálny dopad**: jemný, takmer neviditeľný
- **Ďalšie efekty**: žiadne (minimálny výkon)
- **Použitie**: pre nízko-synergické uzly

#### `node.synergy.mid` (0.3 ≤ synergy < 0.8)
- **Orbit Halos**: Tier 1 - 1 kruh (rádius 1.2x)
- **Polarity**: neutrálna
- **Node Pulses**: stredné pulzy s intenzitou 0.5
- **Farba**: neutrálna fialová (#C09CFF)
- **Použitie**: pre stredne-synergické uzly

#### `node.synergy.high` (synergy ≥ 0.8)
- **Orbit Halos**: Tier 2 - 3 kruhy (rádius 1.4x, 1.7x, 2.0x)
- **Polarity**: pozitívna
- **Burst Events**: plné pulzy s intenzitou 0.8
- **Synergy Threads**: spawnovanie vlákien medzi pripojenými linkami
- **Farba**: pozitívna zelená (#4BFFC3)
- **Použitie**: pre vysoko-synergické uzly

### 3. Nové Metódy

#### `_initializeEventHandlers()`
- Inicializuje prihlásenie na eventy
- Vytvára bound handlere pre `node.synergy.low/mid/high`
- Ukladá unsubscribe funkcie pre cleanup

#### `_handleNodeSynergyLow(event)`
- Spracuje `node.synergy.low` event
- Vytvorí/aktualizuje orbit halos s tier 0
- Minimálny vizuálny dopad

#### `_handleNodeSynergyMid(event)`
- Spracuje `node.synergy.mid` event
- Vytvorí/aktualizuje orbit halos s tier 1
- Spustí node pulse efekt

#### `_handleNodeSynergyHigh(event)`
- Spracuje `node.synergy.high` event
- Vytvorí/aktualizuje orbit halos s tier 2
- Spustí burst event
- Spustí spawnovanie synergy threads

#### `_createNodePulse(position, color, intensity)`
- Vytvorí pulz efekt na danej pozícii
- Používa sa pre mid/high synergy eventy

#### `_spawnSynergyThreadsForNode(node)`
- Spustí synergy threads pre pripojené linky uzla
- Používa sa pre high synergy eventy

### 4. Zmeny v _NodeMicroEvents.js

#### Rozšírené emitovanie eventov
Pridané emitovanie pre všetky tri synergy tiers:

```javascript
// Low synergy: dim pulse
if (synergy < 0.3) {
  this._emitEvent('node.synergy.low', {
    nodeId: node.userData?.nodeId || node.id || node.uuid,
    value: synergy,
    source: 'NodeMicroEvents',
    node: node,
    position: node.position.clone()
  });
  this.createDimPulse(node);
  this.logEvent(node, 'dim_pulse');
} else if (synergy >= 0.3 && synergy < 0.8) {
  // Mid synergy: balanced oscillation
  this._emitEvent('node.synergy.mid', {
    nodeId: node.userData?.nodeId || node.id || node.uuid,
    value: synergy,
    source: 'NodeMicroEvents',
    node: node,
    position: node.position.clone()
  });
  this.createBalancedOscillation(node);
  this.logEvent(node, 'balanced_oscillation');
}

// High clarity: glyph spark
if (synergy > 0.8) {
  this._emitEvent('node.synergy.high', {
    nodeId: node.userData?.nodeId || node.id || node.uuid,
    value: synergy,
    source: 'NodeMicroEvents',
    node: node,
    position: node.position.clone()
  });
  this.createClaritySpark(node);
  this.logEvent(node, 'clarity_spark');
}
```

### 5. Konfiguračné Vylepšenia

Pridané nové konfiguračné parametre:

```javascript
{
  eventBasedTriggers: true,  // Enable event-based effect triggering
  // ... ostatné parametre
}
```

### 6. Cleanup a Resource Management

#### Aktualizovaná `dispose()` metóda
- Odpojí všetkých event handlerov
- Vyčistí `_eventHandlers` a `_boundHandlers`
- Pôvodná cleanup logika zachovaná

### 7. Diagnostický Report

Aktualizovaný `getDiagnosticReport()` zobrazuje:
- Status event-based triggers
- Pripojenie k SemanticEventBus
- Počet registrovaných event handlerov
- Mapovanie eventov na efekty

## Integrácia

### Príklad inicializácie:

```javascript
// V main.js alebo podobnom mieste
const semanticBus = window.game?.semanticBus || window.semanticBus;

window.game.synergyVFXEngine = new SynergyVFXEngine1_0(
  scene,
  camera,
  linkingSystem,
  semanticBus,
  {
    enabled: true,
    eventBasedTriggers: true
  }
);

// V animate loope
function animate() {
  requestAnimationFrame(animate);
  
  const deltaMs = clock.getDelta() * 1000;
  
  // Update SynergyVFXEngine
  if (window.game.synergyVFXEngine) {
    window.game.synergyVFXEngine.tick(deltaMs);
    window.game.synergyVFXEngine.renderSynergyEffects();
  }
  
  renderer.render(scene, camera);
}

// Pri cleanup
function cleanup() {
  if (window.game.synergyVFXEngine) {
    window.game.synergyVFXEngine.dispose();
  }
}
```

## Výhody

1. **Automatické spúšťanie**: Efekty sa spúšťajú automaticky na základe eventov, bez manuálneho volania
2. **Lepší výkon**: Efekty sa spúšťajú len keď je to potrebné (event-driven)
3. **Jednoduchšia integrácia**: Stačí inicializovať engine, o ostatné sa postará event systém
4. **Flexibilita**: Môže byť použitý s alebo bez SemanticEventBus
5. **Kompatibilita**: Plne kompatibilný s existujúcou API

## Data Flow

```
Node Metrics Update
       ↓
_NodeMicroEvents.checkMetricEvents()
       ↓
Emit: node.synergy.low/mid/high
       ↓
SemanticEventBus
       ↓
SynergyVFXEngine1_0 Event Handlers
       ↓
Trigger: Orbit Halos / Bursts / Threads
       ↓
Visual Rendering (tick + renderSynergyEffects)
```

## Testovanie

### Overenie funkčnosti:

```javascript
// Spustiť v konzole
const report = window.game.synergyVFXEngine.getDiagnosticReport();
console.log(report);

// Očakávaný výstup:
// ✓ YES pre Event-Based Triggers
// ✓ YES pre SemanticBus Connected
// 3 pre Event Handlers
```

### Manuálne spustenie eventov:

```javascript
// Simulácia node.synergy.high eventu
window.semanticBus.emit('node.synergy.high', {
  nodeId: 'test-node-1',
  value: 0.9,
  node: someNode,
  position: new THREE.Vector3(0, 0, 0)
});
```

## Budúce Rozšírenia

Možné ďalšie vylepšenia:

1. **Link synergy events**: Pridanie `link.synergy.low/mid/high` eventov
2. **Trend-based effects**: Rôzne efekty pre rising/falling/stable trend
3. **Cluster-level events**: Eventy pre celé clustery, nie len jednotlivé uzly
4. **Polarity-based colors**: Dynamické farby podľa polarity
5. **Configurable thresholds**: Nastaviteľné threholdy pre low/mid/high
6. **Performance profiling**: Detailné profiling efektov

## Záver

Tieto vylepšenia robia SynergyVFXEngine1_0 moderným, event-driven vizuálnym systémom, ktorý sa automaticky integruje do existujúceho metrického systému ATOMA.
