# HOVER GLYPH CONNECTION FIX
## Aby bol RecursiveGlyphSignalSystem napojený a vidno

**Vytvorené:** 2026-03-02  
**Stav:** MANUÁLNY NÁVOD (nástroj nevie editovať main.js)

---

## 🎯 PROBLÉM

**Root cause:** `RecursiveGlyphSignalSystem.js` NEJE zapojený (connected)
- Súbor existuje a obsahuje triedu
- Ale NIE je inicializovaný v `main.js`
- NIE je registrovaný vo `FrameScheduler.visual` (30 Hz)
- Preto hover glyph (ktorý je malý cyan holografický symbol) sa NEZOBRAZÍ

**Audit zistil:**
- `RecursiveGlyphSignalSystem` - EXISTS
- ES6 class export
- Ale NO constructor found (zrejme pod názvom `constructor`)
- Ale NO update method found (zrejme pod názvom `update`)
- NIE je registrovaný v `main.js`
- SystemRegistry ID je DISABLED

---

## 🔧 MANUÁLNY FIX (KROK ZA KROKOM)

### KROK 1: Nájsť stabilné miesto v main.js

**Súbor:** `D:\ATOMA_CLEAN\main.js`  
**Hľadať:** Kód ktorý inicializuje ďalšie vizuálne systémy

**Príkladové názvy na vyhľadanie:**
- `NodeVisuals4_0`
- `NodeAuraSystem_v1`
- `SemanticGlyphAI`
- `LinkRendererConduit`

**Hľadať pattern:**
```javascript
// Skontroluj či existuje iný import:
try {
  const { NodeVisuals4_0 } = await import('./_NodeVisuals4_0.js');
  // ...
}
```

Alebo:
```javascript
// Skontroluj či existuje FrameScheduler registrácia:
if (FrameScheduler && typeof FrameScheduler.visual.register === 'function') {
  FrameScheduler.visual.register('nodeVisuals', ...);
  // ...
}
```

---

### KROK 2: Pridať RecursiveGlyphSignalSystem inicializáciu

**Súbor:** `D:\ATOMA_CLEAN\main.js`  
**Miesto:** Za kód ktorý inicializuje iné vizuálne systémy (SemanticGlyphAI je dobrý miesto)

**Pridať tento kód:**
```javascript
// RecursiveGlyphSignalSystem - Hover Glyph System (connected & visible)
let recursiveGlyphSignalSystem;
try {
  const RecursiveGlyphSignalSystem = await import('./RecursiveGlyphSignalSystem.js');
  recursiveGlyphSignalSystem = new RecursiveGlyphSignalSystem.RecursiveGlyphSignalSystem(scene, worldRoot, attachRoot);
  
  // Register in FrameScheduler.visual (30 Hz)
  if (FrameScheduler && typeof FrameScheduler.visual.register === 'function') {
    FrameScheduler.visual.register('recursiveGlyphSignal', (dt) => recursiveGlyphSignalSystem.update(dt));
  }
  
  // Expose for raycast bridge
  window.recursiveGlyphSignal = recursiveGlyphSignalSystem;
} catch (e) {
  console.error('[MAIN] Failed to initialize RecursiveGlyphSignalSystem:', e);
  window.recursiveGlyphSignal = null;
}
```

---

### KROK 3: Pridať Raycast Bridge do NodeInteractionEngine

**Súbor:** `D:\ATOMA_CLEAN\NodeInteractionEngine.ts`  
**Účel:** Odoslať `hoveredNode` do `recursiveGlyphSignal`

**Hľadať metódu:** `onPointerMove()` alebo `onPointerDown()` kde sa nastavuje `this.hoveredNode`

**Pridať tento kód tesne po tom, čo sa nastaví `this.hoveredNode`:**
```typescript
// PREDTÝM:
this.hoveredNode = node;

// POTOM:
this.hoveredNode = node;

// HOVER GLYPH BRIDGE - Forward to RecursiveGlyphSignalSystem
if (window.recursiveGlyphSignal && typeof window.recursiveGlyphSignal.setHoverTarget === 'function') {
  window.recursiveGlyphSignal.setHoverTarget(node);
}
```

**Výsledok:** Keď sa myš pohybe nad node, `RecursiveGlyphSignalSystem` dostane správu o hovore a zobrazí hover glyph.

---

### KROK 4: (VOLITEĽNÉ) Pridať hover callback do SemanticGlyphAI

**Poznám:** Toto je voliteľné len ak chceš DVE systémy pre hover (RecursiveGlyphSignalSystem aj SemanticGlyphAI).

**Ak nie, preskoč tento krok.**

**Súbor:** `D:\ATOMA_CLEAN\main.js`  
**Účel:** Dve systémy pre rôzne typy hover (Recursive = short signals, Semantic = scan lines)

**Pridať tento kód po inicializácii RecursiveGlyphSignalSystem:**
```javascript
// Dual hover systems (optional)
let semanticGlyphAI;
try {
  const SemanticGlyphAI = await import('./_SemanticGlyphAI.js');
  semanticGlyphAI = new SemanticGlyphAI.SemanticGlyphAI(scene, worldRoot, attachRoot);
  
  // Register in FrameScheduler.visual (30 Hz)
  if (FrameScheduler && typeof FrameScheduler.visual.register === 'function') {
    FrameScheduler.visual.register('semanticGlyphAI', (dt) => semanticGlyphAI.update(dt, nodes));
  }
} catch (e) {
  console.error('[MAIN] Failed to initialize SemanticGlyphAI:', e);
}

// Bridge to ensure both get hover updates
window.updateHoverGlyphs = (hoveredNode) => {
  // Update SemanticGlyphAI (scanlines)
  if (window.semanticGlyphAI && typeof window.semanticGlyphAI.setHoverTarget === 'function') {
    window.semanticGlyphAI.setHoverTarget(hoveredNode);
  }
  
  // Update RecursiveGlyphSignalSystem (short signals)
  if (window.recursiveGlyphSignal && typeof window.recursiveGlyphSignal.setHoverTarget === 'function') {
    window.recursiveGlyphSignal.setHoverTarget(hoveredNode);
  }
};
```

**Aktualizácia v NodeInteractionEngine:** Zmeniť bridge na:
```typescript
// HOVER GLYPH BRIDGE - Update both systems
if (window.updateHoverGlyphs && typeof window.updateHoverGlyphs === 'function') {
  window.updateHoverGlyphs(node);
}
```

---

## 📊 VÝSLEDOK PO FIXE

**Predtým:**
- RecursiveGlyphSignalSystem = NEZNÁMY (neinicializovaný)
- Hover events sa zablokovali (LOCK_INTERACTION = true)
- Hover glyph = NEVIDITEĽNÝ

**Po fixe:**
- RecursiveGlyphSignalSystem = INICIALIZOVANÝ
- Registrovaný vo FrameScheduler.visual (30 Hz)
- Raycast bridge v NodeInteractionEngine aktívny
- Hover events fungujú → RecursiveGlyphSignalSystem dostane správy
- Hover glyph = VIDITEĽNÝ (malý cyan holografický symbol)

---

## 🚀 REŠTART HRY

Po aplikovaní manuálneho fixu:
1. Ulož `main.js`
2. Reštartuj prehliadač (F5) / engine
3. Otestuj hover nad node - vidíš malý cyan holografický symbol?

---

## 🔗 SÚVISIACE

- `RecursiveGlyphSignalSystem.js` - Systém pre hover glyph (krátke signály)
- `NodeInteractionEngine.ts` - Raycaster a hover logika
- `main.js` - Spustanie a registrácia všetkých systémov
- `FrameScheduler` - Visual loop scheduler (30 Hz)
- `CONFIG.js` - LOCK_INTERACTION = false (zablokuje interakcie)

---

**VÝSLEDOK:** Aby bol RecursiveGlyphSignalSystem napojený a vidno, treba manuálne pridať kód do `main.js`. Súbor je príliš veľký, takže ho nástroj nedoká editovať. Postupuj kroky 1-4 v tomto dokumente.
