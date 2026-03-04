# MEGA GLYPH CONDUIT PATCH
# Patch pre main.js pre migráciu na MegaGlyphConduit

---

## FILE: main.js

### CHANGE 1: Pridať import (riadok ~206)

**POUŽIŤ NA RIADOK 206 (po RecursiveGlyphSignalSystem import)**

```diff
 import { RecursiveGlyphSignalSystem } from './_RecursiveGlyphSignalSystem.js';
+import { MegaGlyphConduit } from './MegaGlyphConduit.js';
 import { EmergentThoughtStorms5_0 } from './_EmergentThoughtStorms5_0.js';
```

---

### CHANGE 2: Pridať property (riadok ~4135)

**POUŽIŤ NA RIADOK 4135 (po recursiveGlyphSignalSystem property)**

```diff
 this.recursiveGlyphSignalSystem = null; // Initialized after semantic AI + linking + selection ready
+this.megaGlyphConduit = null; // Mega Glyph Conduit - unified orchestrator

 // Emergent Thought Storms 5.0 (chain collision phenomena)
```

---

### CHANGE 3: Pridať setup metódu (riadok ~9895)

**POUŽIŤ NA RIADOK 9895 (po setupRecursiveGlyphSignalSystem)**

```diff
 this.recursiveGlyphSignalSystem.setEnabled(true);
 console.log('✓ Recursive Glyph Signal System active');
 console.log('  - SIGNAL-layer recursive glyph language');
 console.log('  - Triggered by attention and local meaning events');
 console.log('  - Silent by default, auto-clears after communication');
 console.log('  - Uses dynamic tick registration (no idle global glyph loop)');

+/**
+ * Setup Mega Glyph Conduit 1.0
+ * Unified orchestrator pre všetky glyph systémy
+ */
+setupMegaGlyphConduit() {
+ if (!this.frameScheduler) {
+     console.warn('FrameScheduler not initialized, deferring Mega Glyph Conduit setup');
+     return;
+ }

+ this.megaGlyphConduit = new MegaGlyphConduit(
+     this.scene,
+     this.camera,
+     this.frameScheduler
+ );

+ // Wire dependencies
+ if (this.megaGlyphConduit && this.selectionCore) {
+     this.megaGlyphConduit.setSelectionCore(this.selectionCore);
+ }

+ if (this.megaGlyphConduit && this.linkingSystem) {
+     this.megaGlyphConduit.setLinkingSystem(this.linkingSystem);
+ }

+ this.megaGlyphConduit.setEnabled(true);

+ console.log('✓ Mega Glyph Conduit 1.0 active');
+ console.log('  - Orchestrates: Core, Messaging, Recursive Messaging, Signals, Semantic');
+ console.log('  - Single update loop for all glyph systems');
+ console.log('  - Delegates to underlying systems');
+ console.log('  - Use this.megaGlyphConduit.debugAll() for comprehensive status');
+}


 /**
  * Setup Emergent Thought Storms 5.0 (SAFE EDITION)
```

---

### CHANGE 4: Nahradit setup volania (riadok ~4292)

**POUŽIŤ NA RIADOK 4292**

```diff
 this.setupProceduralMeaningEngine();
 this.setupLinkGlyphFlow();
-this.setupLinkedGlyphMessaging();
-this.setupRecursiveGlyphMessaging();
-this.setupRecursiveGlyphSignalSystem();
+this.setupMegaGlyphConduit(); // Nahradzujú 3 staré setup metódy
 this.registerVisualGlyphSchedulers(); // move glyph/link language systems to FrameScheduler visual (30Hz)
```

---

### CHANGE 5: Upraviť update registráciu (riadok ~8223)

**POUŽIŤ NA RIADOK 8223**

```diff
 // Visual cadence ~30 Hz
 const fs = this.frameScheduler;

 fs.register('visual', (dt) => this.linkGlyphFlow?.update?.(dt), 'linkGlyphFlow');
-fs.register('visual', (dt) => this.linkedGlyphMessaging?.update?.(dt, this.aiNodes, this.linkingSystem), 'linkedGlyphMessaging');
-fs.register('visual', (dt) => this.recursiveGlyphMessaging?.update?.(dt, this.aiNodes, this.linkingSystem), 'recursiveGlyphMessaging');
+fs.register('visual', (dt) => {
+    if (this.megaGlyphConduit) {
+        this.megaGlyphConduit.update(dt, this.aiNodes.nodes, this.linkingSystem);
+    }
+}, 'megaGlyphConduit');
 fs.register('visual', (dt) => {
     const pictos = this.linkPictogramSystem ?? this.linkSemanticPictograms;
     pictos?.update?.(dt, this.time, this.aiNodes?.nodes);
 }, 'linkPictogramSystem');

 // Prevent double-running in SystemRegistry loop
 systemRegistry.disable('linkGlyphFlow');
-systemRegistry.disable('linkedGlyphMessaging');
-systemRegistry.disable('recursiveGlyphMessaging');
+// Staré systémy sú teraz spravované MegaGlyphConduit
+// systemRegistry.disable('linkedGlyphMessaging');
+// systemRegistry.disable('recursiveGlyphMessaging');
 systemRegistry.disable('recursiveGlyphSignalSystem');
 systemRegistry.disable('linkPictogramSystem');
```

---

### CHANGE 6: Upraviť cleanup (riadok ~9950 - nájsť dispose metódu)

**HĽADAŤ dispose() metódu a pridať na koniec**

```diff
 // Add other cleanup...
 this.worldRoot?.remove?.();
 this.environmentRoot?.remove?.();
 this.nodeRoot?.remove?.();

+// Cleanup Mega Glyph Conduit
+this.megaGlyphConduit?.cleanup?.();

 console.log('✓ Main game disposed');
```

---

## OPTIONAL: Zachovať backward compatibility wrappers

Ak chceš zachovať staré API volania, pridaj tieto wrapper metódy:

```javascript
// Wrapper metódy pre backward compatibility (na koniec triedy)

get linkedGlyphMessaging() {
    console.warn('⚠ linkedGlyphMessaging je deprecated. Použi this.megaGlyphConduit.messaging');
    return this.megaGlyphConduit?.messaging;
}

get recursiveGlyphMessaging() {
    console.warn('⚠ recursiveGlyphMessaging je deprecated. Použi this.megaGlyphConduit.recursiveMessaging');
    return this.megaGlyphConduit?.recursiveMessaging;
}

get recursiveGlyphSignalSystem() {
    console.warn('⚠ recursiveGlyphSignalSystem je deprecated. Použi this.megaGlyphConduit.signals');
    return this.megaGlyphConduit?.signals;
}

// Wrapper setup metódy (pre zachovanie starých setup volaní)
setupLinkedGlyphMessaging() {
    console.warn('⚠ setupLinkedGlyphMessaging() je deprecated. Použi setupMegaGlyphConduit()');
    // Volá sa len ak megaGlyphConduit už existuje
    if (!this.megaGlyphConduit) {
        console.warn('Mega Glyph Conduit not initialized, skipping legacy setup');
        return;
    }
    // MegaGlyphConduit spravuje linked messaging internally
}

setupRecursiveGlyphMessaging() {
    console.warn('⚠ setupRecursiveGlyphMessaging() je deprecated. Použi setupMegaGlyphConduit()');
    if (!this.megaGlyphConduit) {
        console.warn('Mega Glyph Conduit not initialized, skipping legacy setup');
        return;
    }
    // MegaGlyphConduit spravuje recursive messaging internally
}

setupRecursiveGlyphSignalSystem() {
    console.warn('⚠ setupRecursiveGlyphSignalSystem() je deprecated. Použi setupMegaGlyphConduit()');
    if (!this.megaGlyphConduit) {
        console.warn('Mega Glyph Conduit not initialized, skipping legacy setup');
        return;
    }
    // MegaGlyphConduit spravuje signals internally
}
```

---

## TESTOVANIE

Po aplikovaní patchu:

1. Spusti ATOMA
2. Skontroluj konzolu:
   - Malo by byť "✓ Mega Glyph Conduit 1.0 active"
   - Malo by byť 5 riadkov pre každý systém (Core, Messaging, etc.)
3. Spusti:
   - `window.game.megaGlyphConduit.debugAll()`
   - Malo by zobraziť status všetkých 5 systémov
4. Testovanie glyph systémov:
   - Hover nad nodmi (signaly)
   - Linky medzi nodmi (messaging)
   - Node glyphs (core renderer)

---

## ROLLBACK

Ak potrebuješ rollback, môžeš:
1. Odstrániť CHANGE 1 (import)
2. Odstrániť CHANGE 2 (property)
3. Odstrániť CHANGE 3 (setupMegaGlyphConduit)
4. Obnoviť CHANGE 4 (staré setup volania)
5. Obnoviť CHANGE 5 (staré update registrácie)
6. Odstrániť CHANGE 6 (cleanup)

---

## POZNÁMKY

- Staré systémy (AtomaGlyphSystem4_0, LinkedGlyphMessaging3_0, atď.) zostávajú nezávislé
- MegaGlyphConduit ich len orchestruje, nespravuje žiadne zmeny v nich
- Ak niečo nefunguje, môžeš temporary disable MegaGlyphConduit a vrátiť sa na staré systémy
- Všetky staré API volania sú dostupné cez delegovanie:
  - `this.megaGlyphConduit.createAIConsciousnessGlyph()`
  - `this.megaGlyphConduit.triggerAttentionSignal()`
  - atď.
