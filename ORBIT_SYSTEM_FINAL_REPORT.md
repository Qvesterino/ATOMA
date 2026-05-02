# ORBIT SYSTEM FORENSIC REPORT
## Identificação do Sistema de Órbita/Cluster

### Resumo
O sistema que cria efeitos visuais de órbita/cluster com múltiplos objetos e glifos rosados foi identificado.

---

## 1. SISTEMA IDENTIFICADO

### Arquivo Principal
**`_GlyphLayer4_MultiFusion.js`**

### Funções Principais
- `createGlyphFusion(node, nodeId)` - Cria fusões multi-glifo por nó
- `createAmbientOrbitForNode(node, nodeId)` - Cria órbitas ambientes por nó
- `createEvolutionGlyph(node, nodeId)` - Cria glifos de evolução com órbita
- `_applyEvolutionOrbitMotion(evoGroup, deltaTime)` - Aplica movimento orbital (Math.sin/Math.cos)

### Funções de Spawn (Post-Spawn Observers)
No arquivo **`AINodes.js`**, linhas 878-890 e 13832-13873 em **`main.js`**:

```javascript
// Observer 1: 'glyph-layer4-fusions' (ordem 80)
this.registerPostSpawnObserver(
    'glyph-layer4-fusions',
    (newNode) => {
        const nodeId = newNode?.userData?.nodeId;
        if (!newNode || !nodeId || !this.glyphLayer4 || this.glyphLayer4.hoverOnlyMode) return;
        this.glyphLayer4.createGlyphFusion(newNode, nodeId);
    },
    80
);

// Observer 2: 'glyph-layer4-ambient-orbit' (ordem 90)
this.registerPostSpawnObserver(
    'glyph-layer4-ambient-orbit',
    (newNode) => {
        const nodeId = newNode?.userData?.nodeId;
        if (!newNode || !nodeId || !this.glyphLayer4) return;
        this.glyphLayer4.reconcileAmbientOrbitGlyphs?.(this.aiNodes?.nodes || []);
    },
    90
);
```

---

## 2. EVIDÊNCIAS DO PROBLEMA

### 2.1 Uso de Math.sin / Math.cos (Órbita)

**Arquivo:** `_GlyphLayer4_MultiFusion.js`  
**Linhas:** 188-202

```javascript
_applyEvolutionOrbitMotion(evoGroup, deltaTime) {
    if (!evoGroup) return;
    
    const rotationSpeed = Number(evoGroup.userData.rotationSpeed) || 0.3;
    const orbitSpeed = Number(evoGroup.userData.orbitSpeed) || 0.6;
    const orbitRadius = Number(evoGroup.userData.orbitRadius) || 0.7;
    
    evoGroup.rotation.y += rotationSpeed * deltaTime;
    
    evoGroup.userData.orbitPhase = (Number(evoGroup.userData.orbitPhase) || 0) + deltaTime * orbitSpeed;
    const angle = evoGroup.userData.orbitPhase;
    
    evoGroup.position.x = Math.cos(angle) * orbitRadius;  // <-- Órbita circular
    evoGroup.position.z = Math.sin(angle) * orbitRadius;  // <-- Órbita circular
}
```

**Chamado em:** `updateEvolutionGlyph()` (linha 1446)

### 2.2 Múltiplos Objetos por Glifo

Cada glifo de evolução contém múltiplos sub-objetos THREE.js:

**Stage 1 - `createFoldedImpossibleGlyph()`** (linhas 720-880):
- 1x Core (dodecaedro)
- 2x Rings (toros)
- 3x Bridges (linhas)
- 3x Shards (cone)
- 1x Frame (linha hexagonal)
- **Total: ~10 objetos**

**Stage 2 - `createHarmonicCellGlyph()`** (linhas 966-1119):
- 1x Beacon (icosaedro)
- 2x Halos (toros)
- 4x Membranas
- 3x Ribs (linhas)
- 3x Crown spikes (cone)
- **Total: ~13 objetos**

**Stage 3 - `createHelicalTrinityGlyph()`** (linhas 1121-1222):
- 3x Arms (cilindros com pontas e trails)
- 1x Halo (toro)
- **Total: ~10 objetos**

**Stage 4 - `createResonanceCrownFragmentGlyph()`** (linhas 1224-1350):
- 1x Core (dodecaedro)
- 1x Shell (esfera)
- 3x Lobes (esferas)
- 4x Spines (cone)
- 4x Nodules (esferas)
- 4x Tendrils (linhas curvas)
- **Total: ~17 objetos**

### 2.3 Glifos Rosados (Cores Pink/Magenta)

Cores identificadas nos materiais:

- `0xFF00FF` - Magenta puro
- `0xFFE3F4` - Rosa claro
- `0xF6FCFF` - Rosa muito claro
- `0xFFF0D1` - Pêssego/rosa
- `0xD7B6FF` - Lilás/rosa
- `0x8AF0FF` - Ciano claro (frequentemente misturado)

Exemplo no `createHelicalTrinityGlyph()`:
```javascript
const armColors = [0xd8f9ff, 0x8af0ff, 0xd7b6ff]; // Inclui magenta/lilás
```

Exemplo no `createResonanceCrownFragmentGlyph()`:
```javascript
{ position: [0.05, 0.14, -0.08], color: 0xffe3f4 }, // Rosa claro
```

### 2.4 Radius / Angle no Código

**Arquivo:** `_GlyphLayer4_MultiFusion.js`  
**Função:** `_getEvolutionOrbitRadius()` (linhas 170-186)

```javascript
_getEvolutionOrbitRadius(glyphKey, stage = 1) {
    const radiusMap = {
        controlIntegration: 0.96,
        analyticsEmotional: 0.9,
        inputProcess: 0.84,
        errorSigma: 0.78,
        primeMythic: 1.05,
        quantumStorage: 1.0,
        1: 0.96,
        2: 0.9,
        3: 0.84,
        4: 0.78
    };
    
    const resolvedStage = Math.max(1, Math.min(4, Math.round(Number(stage) || 1)));
    return radiusMap[glyphKey] ?? radiusMap[resolvedStage] ?? 0.9;
}
```

---

## 3. FLUXO DE EXECUÇÃO

### Passo a Passo

1. **Node criado** via `createErrorFoldedImpossibleNode()` ou similar
2. **Node adicionado ao grupo** via `group.add(root)`
3. **`_runPostSpawnObservers()`** é chamado (AINodes.js linha 1003)
4. **Observers executam em ordem:**
   - `visual-authority-runtime` (ordem 10)
   - `metrics-and-init` (ordem 20)
   - `link-jobs` (ordem 30)
   - `wave-engine-debug` (ordem 40)
   - `spawn-category-counter` (ordem ~50)
   - **`glyph-layer4-fusions` (ordem 80)** ← CRIA GLIFOS
   - **`glyph-layer4-ambient-orbit` (ordem 90)** ← CRIA ÓRBITAS
5. **`createGlyphFusion()`** ou **`reconcileAmbientOrbitGlyphs()`** são chamados
6. **`createEvolutionGlyph()`** cria o glifo base
7. **`_applyEvolutionOrbitMotion()`** aplica movimento orbital via Math.sin/cos
8. **Múltiplos objetos** são adicionados ao grupo (meshes, linhas, etc.)
9. **Update loop** continua animando via Math.sin/Math.cos

---

## 4. BLOCO DE SPAWN ESPECÍFICO

### Localização
**Arquivo:** `_GlyphLayer4_MultiFusion.js`  
**Função:** `createEvolutionGlyph()`  
**Linhas:** 204-289

### Código Crítico

```javascript
createEvolutionGlyph(node, nodeId) {
    const glyphKey = this.resolveEvolutionGlyphKey(node);
    
    if (glyphKey === 'primeMythic') {
        return this.createPrimeMythicGlyph(node, nodeId);
    }
    
    if (glyphKey === 'quantumStorage') {
        return this.createQuantumStorageGlyph(node, nodeId);
    }
    
    const categoryStageMap = {
        controlIntegration: 1,
        analyticsEmotional: 2,
        inputProcess: 3,
        errorSigma: 4
    };
    
    const stage = categoryStageMap[glyphKey] ?? this.resolveEvolutionStage(node);
    if (stage < 1 || stage > 4) return null;
    const orbitRadius = this._getEvolutionOrbitRadius(glyphKey, stage);  // <-- RADIUS
    
    const evoGroup = new THREE.Group();
    evoGroup.userData = {
        glyphLayer: 'evolution',
        glyphKey,
        stage,
        orbitRadius,  // <-- ARMAZENA RADIUS
        isVFX: true,
        noEvolve: true,
        noCleanup: true
    };
    evoGroup.name = `glyph_evo_${nodeId}`;
    evoGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    
    // Stage-specific visuals (CRIA OS OBJETOS)
    if (stage === 1) {
        const impossibleGlyph = this.createFoldedImpossibleGlyph();  // <-- MUITOS OBJETOS
        evoGroup.add(impossibleGlyph);
        evoGroup.userData.rotationSpeed = 0.6;
    } else if (stage === 2) {
        const harmonicCell = this.createHarmonicCellGlyph();  // <-- MUITOS OBJETOS
        evoGroup.add(harmonicCell);
        evoGroup.userData.rotationSpeed = 0.42;
    } else if (stage === 3) {
        const helicalTrinity = this.createHelicalTrinityGlyph();  // <-- MUITOS OBJETOS
        evoGroup.add(helicalTrinity);
        evoGroup.userData.rotationSpeed = 0.5;
    } else if (stage === 4) {
        const resonanceCrown = this.createResonanceCrownFragmentGlyph();  // <-- MUITOS OBJETOS
        evoGroup.add(resonanceCrown);
        evoGroup.userData.rotationSpeed = 0.32;
    }
    
    // Position offset (orbits core)
    evoGroup.userData.orbitPhase = Math.random() * Math.PI * 2;  // <-- ANGLE INICIAL
    evoGroup.userData.orbitRadius = orbitRadius;  // <-- RADIUS
    
    return evoGroup;
}
```

---

## 5. VERIFICAÇÃO (Teste de Confirmação)

### Para confirmar que este é o sistema correto:

1. **Adicione `return;` no início de `createGlyphFusion()`** (linha 1902)
2. **Adicione `return;` no início de `createAmbientOrbitForNode()`** (linha 2031)
3. **Reinicie/crie novos nodes**
4. **Os efeitos orbit/cluster com glifos rosados devem desaparecer**

### Alternativa (menos invasiva):

Desative os observers em `main.js`:
```javascript
// Comente ou remova estas linhas:
this.setupGlyphLayer4Fusions();  // Linha ~13845
this.setupGlyphLayer4AmbientOrbit();  // Linha ~13818
```

---

## 6. IMPACTO NO SISTEMA

### Características do Efeito
- **Múltiplos objetos por nó:** 10-17 meshes/linhas por glifo
- **Movimento orbital:** Math.sin/cos contínuo
- **Atualização por frame:** 60Hz via FrameScheduler
- **Custo GPU:** Alto (especialmente com múltiplos nodes)
- **Cores:** Predominância de tons rosados/magenta

### Relação com o Problema Original
- O problema ocorre **APÓS** `group.add(root)`
- O efeito se manifesta após **spawn** ou **linkagem**
- Multi-efeito = múltiplos objetos + órbita + glifos
- Sistema reage a **métricas** e **links** (via `_hasNodeActiveLinks()`)

---

## 7. ARQUIVOS ENVOLVIDOS

### Primários
1. **`_GlyphLayer4_MultiFusion.js`** - Sistema principal de glifos
2. **`AINodes.js`** - Registro de post-spawn observers
3. **`main.js`** - Configuração/setup dos observers

### Secundários
- `VisualHierarchyRegistry.js` - Configuração de render order
- `EnhancedNodeModels.js` - Modelos de nodes
- `FrameScheduler.js` - Agendamento de updates

---

## 8. RECOMENDAÇÕES

### Para Desativação Temporária
```javascript
// Em _GlyphLayer4_MultiFusion.js, linha 117:
this.hoverOnlyMode = true;  // Já está true por padrão
this.ambientOrbitEnabled = false;  // Já está false por padrão
```

### Para Desativação Permanente
Remover ou comentar os observers em `AINodes.js`:
```javascript
// Remover linhas 878-890 (registro dos observers)
```

### Para Otimização
- Reduzir número de objetos por glifo
- Simplificar geometrias (menos segmentos)
- Aumentar LOD (Level of Detail)
- Desativar atualizações por frame desnecessárias

---

## CONCLUSÃO

**Sistema identificado com sucesso:**

- ✅ **Arquivo:** `_GlyphLayer4_MultiFusion.js`
- ✅ **Funções:** `createGlyphFusion()`, `createAmbientOrbitForNode()`, `createEvolutionGlyph()`, `_applyEvolutionOrbitMotion()`
- ✅ **Blocos de spawn:** Stage 1-4 em `createEvolutionGlyph()` (linhas 240-282)
- ✅ **Movimento orbital:** Math.cos/sin nas linhas 200-201
- ✅ **Glifos rosados:** Cores 0xFF00FF, 0xFFE3F4, etc.
- ✅ **Observers:** 'glyph-layer4-fusions' e 'glyph-layer4-ambient-orbit'

O efeito de órbita/cluster com múltiplos objetos e glifos rosados é gerado pelo sistema **GlyphLayer4 Multi-Fusion**, ativado via post-spawn observers após a criação de nodes com links ativos.
