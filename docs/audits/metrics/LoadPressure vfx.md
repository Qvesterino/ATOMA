## LoadPressure / Load / Load Ratio VFX Efekty

| Názov súboru | Trigger Event | Wiring |
|--------------|---------------|--------|
| **CanonicalTemplate3_StressVisuals.js** | - `updateNodeLoadPressure(node, loadPressure)`<br>- `updateNetworkStress(stressValue)` | ❌ **NEINŠTALOVANÝ** v main.js<br>Systém existuje ale nie je vytvorený ani zapojený |
| **StressVisualShaderSystem.js** | - `update(deltaTime, time, nodes)` | ✅ **INŠTALOVANÝ** v main.js<br>`this.stressVisualShaderSystem = new StressVisualShaderSystem(this.scene, { ambientEnabled: true })`<br>Číta z: CoreMetricsCalculator.getMetrics() |
| **CoreMetricsHUD.js** | - Automatic update pri každom frame | ✅ **INŠTALOVANÝ**<br>HUD zobrazuje LOAD PRESSURE s farbou `#aa00ff` (Violet) |
| **CoreMetricsOverlay.js** | - `_sanitizeMetric('loadPressure', value)` | ✅ **INŠTALOVANÝ**<br>Normalizuje loadPressure na 0-1 rozsah |
| **MetricsRuntime_v1.js** | - Emituje `metric:loadPressureHigh` pri loadPressure >= 0.75<br>- Emituje `event:loadCollapse` pri loadPressure >= 0.8 a networkStress >= 0.6 | ✅ **INŠTALOVANÝ** v main.js<br>FrameScheduler: `simulation.metricsRuntime_v1` |
| **LinkRendererConduit.js** | - Shader uniform `uLoad.value = metrics.loadPressure` | ✅ **INŠTALOVANÝ**<br>Používa `mat.uniforms.uLoad.value = m.loadPressure ?? 0` pre link shader |
| **NodeLinkedAuraSystem.js** | - Číta `nodeMetrics.loadPressure` | ✅ **INŠTALOVANÝ**<br>Používa loadPressure pri výpočte aury |
| **ParticleEmissionScaler.js** | - `_computeCurveFactor(this.cachedMetrics.loadPressure, ...)` | ✅ **INŠTALOVANÝ**<br>FrameScheduler: `visual.particleEmissionScaler` |
| **NodeDynamicMetrics.js** | - `_clamp01(base?.loadPressure ?? loadRatio)` | ✅ **INŠTALOVANÝ**<br>Číta a normalizuje loadPressure |
| **LinkSemanticPictogramSystem_Enhanced.js** | - `buildLoadPressureGlyph(size, renderOrder)` | ✅ **INŠTALOVANÝ**<br>Vytvorí torus-based glyph pre loadPressure vizualizáciu |

### Kľúčové zistenia:

1. **StressVisualShaderSystem** je aktívny GPU shader systém - inštalovaný v main.js, číta z CoreMetricsCalculator
2. **CanonicalTemplate3_StressVisuals** **NEFUNGUJE** - súbor existuje ale nie je v main.js ani inicializovaný
3. LoadPressure vizualizácia je distribuovaná medzi:
   - Link shaders (uLoad uniform)
   - Particlové systémy (ParticleEmissionScaler)
   - Node aury (NodeLinkedAuraSystem)
   - HUD (CoreMetricsHUD)
4. Event-driven systém: MetricsRuntime_v1 emituje `metric:loadPressureHigh` a `event:loadCollapse` eventy