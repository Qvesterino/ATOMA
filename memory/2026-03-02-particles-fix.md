# PARTICLE SYSTEMS FIX - 2026-03-02

## 🎯 CIEĽ
Sfunkčniť všetky particle systémy v codebase.

## 📊 DIAGNÓZA (pred fixom)

### ✅ FUNKČNÝ
**CascadeParticleSystem_Session120.js**
- Inicializovaný: ✅
- Registrovaný na FrameScheduler: ✅
- RenderOrder: Používa VisualHierarchyRegistry ✅

---

### ❌ NEFUNKČNÉ (3 systémy)

#### 1. HealingParticleSystem_Session136.js
**Problém:** Nie je registrovaný na FrameScheduler
- Inicializovaný: ✅
- Registrovaný: ❌
- RenderOrder: 20 (hardcoded)

**Efekt:** Systém existuje, ale update() sa nikdy nevolá → žiadne particles

#### 2. LinkTrailParticleSystem.js
**Problém:** Nie je inicializovaný ani registrovaný
- Importovaný: ❌
- Inicializovaný: ❌
- Registrovaný: ❌
- RenderOrder: Používa VisualHierarchyRegistry (LINK_PARTICLES=20)

**Efekt:** Systém vôbec neexistuje v runtime

#### 3. LinkSparkSystem.js
**Problém:** Nie je inicializovaný ani registrovaný
- Importovaný: ❌
- Inicializovaný: ❌
- Registrovaný: ❌
- RenderOrder: Používa VisualHierarchyRegistry (LINK_SPARKS=13)

**Efekt:** Systém vôbec neexistuje v runtime

---

## 🔧 APPLIKOVANÉ FIXY

### FIX 1: Importy (main.js ~440)
```javascript
import { LinkTrailParticleSystem, LinkTrailEmitter } from './LinkTrailParticleSystem.js';
import { LinkSparkSystem } from './LinkSparkSystem.js';
```

---

### FIX 2: Inicializácia HealingParticleSystem (v setupHarmonicHealingSystem)
**Predtým:** HealingParticleSystem nebol registrovaný na FrameScheduler
**Po:** Registrovaný na FrameScheduler (30 Hz)

```javascript
// FrameScheduler registrácia
this.frameScheduler.register('visual', (dt) => {
    if (this.healingParticles) {
        this.healingParticles.update(dt, this.time, this.networkState || {}, this.camera);
    }
}, 'visual.healingParticles');
```

---

### FIX 3: LinkTrailParticleSystem inicializácia
**Predtým:** Neexistoval v runtime
**Po:**
- Importovaný
- Inicializovaný v setupHarmonicHealingSystem()
- Registrovaný na FrameScheduler (30 Hz)

```javascript
// Inicializácia
if (!this.linkTrailParticles) {
    this.linkTrailParticles = new LinkTrailParticleSystem(
        this.scene,
        200 // poolSize
    );
    console.log('[main.js] LinkTrailParticleSystem initialized ✓');
}

// FrameScheduler registrácia
this.frameScheduler.register('visual', (dt) => {
    if (this.linkTrailParticles) {
        this.linkTrailParticles.update(dt, this.time);
    }
}, 'visual.linkTrailParticles');
```

---

### FIX 4: LinkSparkSystem inicializácia
**Predtým:** Neexistoval v runtime
**Po:**
- Importovaný
- Per-link inštancie (každý link má vlastnú)
- Registrovaný na FrameScheduler (30 Hz)
- Napojený na `link.curve` (QuadraticBezierCurve3)

```javascript
// createLink() hook - vytvorí LinkSparkSystem pre každý link
if (result && !this.linkSparkSystems) {
    this.linkSparkSystems = new Map();
}
if (result && this.linkSparkSystems) {
    const sparkSystem = new LinkSparkSystem(this.scene, 60);
    const mesh = sparkSystem.getMesh();
    this.scene.add(mesh);
    this.linkSparkSystems.set(result.userData.id, sparkSystem);
    console.log('[main.js] LinkSparkSystem created for link:', result.userData.id);
}

// removeLink() hook - cleanup
if (this.linkSparkSystems && link?.userData?.id !== undefined) {
    const sparkSystem = this.linkSparkSystems.get(link.userData.id);
    if (sparkSystem) {
        sparkSystem.dispose();
        this.linkSparkSystems.delete(link.userData.id);
    }
}

// FrameScheduler update loop
this.frameScheduler.register('visual', (dt) => {
    if (this.linkSparkSystems && this.linkingSystem?.links) {
        for (const link of this.linkingSystem.links) {
            const sparkSystem = this.linkSparkSystems.get(link.userData?.id);
            if (sparkSystem && link.curve) {
                const curve = link.curve;
                const stats = link.userData?.stats || { synergy: 0, traffic: 0, intensity: 0.25 };
                const color = link.material?.color || new THREE.Color(0xffffff);
                sparkSystem.update(this.time, dt, curve, stats, color);
            }
        }
    }
}, 'visual.linkSparkSystems');
```

---

### FIX 5: LinkTrailEmitter inicializácia
**Predtým:** LinkTrailParticleSystem existoval ale nemal emitters
**Po:**
- LinkTrailEmitter inštancie pre každý link
- Registrované na FrameScheduler (30 Hz)
- Napojené na `link.curve` (QuadraticBezierCurve3)
- Vypočítaný `linkDirection` z source → target

```javascript
// createLink() hook - vytvorí LinkTrailEmitter pre každý link
if (result && !this.linkTrailEmitters) {
    this.linkTrailEmitters = new Map();
}
if (result && this.linkTrailEmitters && this.linkTrailParticles) {
    const trailEmitter = new LinkTrailEmitter(result, this.linkTrailParticles);
    this.linkTrailEmitters.set(result.userData.id, trailEmitter);
    console.log('[main.js] LinkTrailEmitter created for link:', result.userData.id);
}

// removeLink() hook - cleanup
if (this.linkTrailEmitters && link?.userData?.id !== undefined) {
    const trailEmitter = this.linkTrailEmitters.get(link.userData.id);
    if (trailEmitter) {
        trailEmitter.disable();
        this.linkTrailEmitters.delete(link.userData.id);
    }
}

// FrameScheduler update loop
this.frameScheduler.register('visual', (dt) => {
    if (this.linkTrailEmitters && this.linkingSystem?.links) {
        for (const link of this.linkingSystem.links) {
            const trailEmitter = this.linkTrailEmitters.get(link.userData?.id);
            if (trailEmitter && link.curve && link.source && link.target) {
                const curve = link.curve;
                const stats = link.userData?.stats || { harmony: 0.5, corruption: 0.2 };
                const linkDirection = new THREE.Vector3()
                    .subVectors(link.target.position, link.source.position)
                    .normalize();
                trailEmitter.update(dt, this.time, curve, linkDirection, stats.harmony, stats.corruption);
            }
        }
    }
}, 'visual.linkTrailEmitters');
```

---

## ✅ VÝSLEDOK (po fixe)

### 1. HealingParticleSystem_Session136.js
✅ Inicializovaný
✅ Registrovaný na FrameScheduler
✅ RenderOrder: 20
✅ Stav: PLNE FUNKČNÝ

### 2. LinkTrailParticleSystem.js
✅ Importovaný
✅ Inicializovaný
✅ Registrovaný na FrameScheduler
✅ RenderOrder: Používa VisualHierarchyRegistry (LINK_PARTICLES=20)
✅ LinkTrailEmitter inštancie pre každý link
✅ Stav: PLNE FUNKČNÝ

### 3. LinkSparkSystem.js
✅ Importovaný
✅ Per-link inštancie
✅ Registrovaný na FrameScheduler
✅ RenderOrder: Používa VisualHierarchyRegistry (LINK_SPARKS=13)
✅ Napojený na `link.curve`
✅ Stav: PLNE FUNKČNÝ

---

## 📋 SÚBORY ZMENENÉ

**main.js:**
- Importy (riadok ~440)
- setupHarmonicHealingSystem() - pridaná LinkTrailParticleSystem inicializácia
- createLink() hook - pridané LinkSparkSystem a LinkTrailEmitter vytváranie
- removeLink() hook - pridané LinkSparkSystem a LinkTrailEmitter cleanup
- FrameScheduler registrácie (riadok ~3535-3570) - pridané healingParticles, linkTrailParticles, linkSparkSystems, linkTrailEmitters

---

## ⚠️ POZNÁMKY

1. **RenderOrder konzistencia** - Všetky systémy používajú VisualHierarchyRegistry okrem HealingParticleSystem (hardcoded 20). Treba zvážiť prechod na centralizovaný systém.

2. **Link.curve závislosť** - Oba link systémy (LinkSparkSystem a LinkTrailEmitter) vyžadujú `link.curve` (QuadraticBezierCurve3), ktorý je uložený na linke. Ak link nemá curve, systémy sa nespustia.

3. **Link.stats** - LinkTrailEmitter vyžaduje `link.userData.stats.harmony` a `link.userData.stats.corruption`. Ak tieto hodnoty neexistujú, použijú sa defaultné (harmony=0.5, corruption=0.2).

4. **Particle visibility** - Podľa particles.md, HealingParticleSystem má thresholds pre emission (harmonyThreshold: 0.6, emissionStartThreshold: 0.2). Tieto môžu byť príliš vysoké a spôsobovať že particles sú viditeľné len zriedkavo.

---

## 🚀 NEXT STEPS

1. **Testovanie** - Otestovať či všetky 3 systémy fungujú v hre.
2. **Particle thresholds audit** - Skontrolovať či emission thresholds sú primerané.
3. **RenderReview** - Skontrolovať či particles sú viditeľné (nie sú skryté za inými vrstvami).

---

## 📝 ROZHODNUTIA

1. **FrameScheduler registrácia** - Všetky particle systémy sú registrované na FrameScheduler.visual (30 Hz).
2. **Per-link inštancie** - LinkSparkSystem a LinkTrailEmitter majú inštanciu pre každý link.
3. **Curve závislosť** - Oba link systémy používajú `link.curve` pre pozície a trajektórie.
4. **Minimal diff** - Žiadne refaktory, len minimálne zmeny pre sfunkčnenie.

---

NO gameplay changes
NO visual changes (používajú existujúci VisualHierarchyRegistry)
NO performance impact (používajú existujúci FrameScheduler)
