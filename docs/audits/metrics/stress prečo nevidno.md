Directive:
- Analyze and identify the root cause why the stress visual effects (CanonicalTemplate3_StressVisuals, StressVisualShaderSystem) are not visible.
- Check for: config flags, policies, debug/visibility toggles, shader/material issues, data thresholds, or wiring errors.
- Output a clear explanation of the most likely cause(s).

Orchestration Plan:
1. Check for global or per-system config flags or policies that could disable/hide the effects.
2. Review the initialization and update logic for any early returns, guards, or visibility toggles.
3. Inspect shader/material setup for issues (opacity, visible, renderOrder, etc.).
4. Examine the data flow: are stress/load values nonzero and within effect-triggering thresholds?
5. Look for errors or warnings in logs related to these systems.
6. Summarize findings and recommend next steps.

Proceeding to check for config/policy disables, update guards, and data thresholds in the relevant files. 

Searched for regex `visible|opacity|enabled|policy|ATOMA_FLAGS|debug|threshold|return false|return;|if \(!this\.|if \(this\.` (`**/CanonicalTemplate3_StressVisuals.js`), 48 results

Searched for regex `visible|opacity|enabled|policy|ATOMA_FLAGS|debug|threshold|return false|return;|if \(!this\.|if \(this\.` (`**/StressVisualShaderSystem.js`), 50 results

Searched for regex `visible|opacity|enabled|policy|ATOMA_FLAGS|debug|threshold|return false|return;|if \(!this\.|if \(this\.` (`**/main.js`), 50 results

Searched for regex `opacity|visible|material|add|scene|parent|mesh|plane|geometry|uniform|threshold|intensity|show|hide|cull|alpha|color` (`**/CanonicalTemplate3_StressVisuals.js|StressVisualShaderSystem.js`), no results

Searched for regex `opacity|visible|material|add|scene|parent|mesh|plane|geometry|uniform|threshold|intensity|show|hide|cull|alpha|color` (`**/CanonicalTemplate3_StressVisuals.js|StressVisualShaderSystem.js`), no results

Searched for regex `stress|load|pressure|intensity|threshold|clamp|min|max|Math\.min|Math\.max|uniform|set|update|value|nodeStress|ambient|overlay|plane|material|geometry|shader` (`**/CanonicalTemplate3_StressVisuals.js|StressVisualShaderSystem.js`), no results

Searched for regex `stress|load|pressure|intensity|threshold|clamp|min|max|Math\.min|Math\.max|uniform|set|update|value|nodeStress|ambient|overlay|plane|material|geometry|shader` (`**/CanonicalTemplate3_StressVisuals.js|StressVisualShaderSystem.js`), no results

Read [](file:///d%3A/ATOMA_CLEAN/CanonicalTemplate3_StressVisuals.js#1-1), lines 1 to 60

Read [](file:///d%3A/ATOMA_CLEAN/CanonicalTemplate3_StressVisuals.js#61-61), lines 61 to 160

Read [](file:///d%3A/ATOMA_CLEAN/CanonicalTemplate3_StressVisuals.js#161-161), lines 161 to 260

Read [](file:///d%3A/ATOMA_CLEAN/CanonicalTemplate3_StressVisuals.js#261-261), lines 261 to 360

Read [](file:///d%3A/ATOMA_CLEAN/StressVisualShaderSystem.js#1-1), lines 1 to 80

Read [](file:///d%3A/ATOMA_CLEAN/StressVisualShaderSystem.js#81-81), lines 81 to 180

Read [](file:///d%3A/ATOMA_CLEAN/StressVisualShaderSystem.js#181-181), lines 181 to 280

Read [](file:///d%3A/ATOMA_CLEAN/StressVisualShaderSystem.js#281-281), lines 281 to 338

Analysis summary:

1. **No global policy or config disables found:**  
   - Both systems are enabled by default (`ambientEnabled: true`, `nodeOverlayEnabled: true`).
   - No policy, ATOMA_FLAGS, or debug flag disables the visuals by default.

2. **Wiring and update logic is correct:**  
   - Both systems are updated every frame via the frame scheduler.
   - Node data is registered and updated as expected.

3. **No threshold or clamping blocks:**  
   - All stress/load values are clamped to [0, 1], but there is no minimum threshold that would block effects for low but nonzero values.

4. **Material/mesh/scene issues:**  
   - In StressVisualShaderSystem, the ambient stress plane is created but **not added to the scene by default** (`// this.scene.add(this.ambientPlane);` is commented out).  
   - If your scene uses fog instead of the plane, only fog color/density will change, which may be subtle or overridden by other scene settings.
   - Node overlays require `userData.visualMetrics.networkStressVisualDensity` to be set per node, otherwise the effect will be zero.

5. **Data flow issues likely:**  
   - If `networkStress` is always near zero, or nodes lack `visualMetrics.networkStressVisualDensity`, effects will be invisible.
   - CanonicalTemplate3_StressVisuals only jitters nodes if `loadPressure > 0`, and only changes fog/ambient if `networkStress > 0`.

**Root cause(s) most likely:**
- **Ambient plane is not visible** unless you explicitly call `enableAmbientPlane()`.
- **Node overlays require node.userData.visualMetrics.networkStressVisualDensity** to be set and nonzero.
- **Fog/ambient color changes may be too subtle** or overridden by other scene settings.
- **Input data (stress/load) may be zero** due to upstream metrics or node wiring.

**Recommendation:**  
- Check if `enableAmbientPlane()` is ever called; if not, ambient effect is missing.
- Inspect node.userData for `visualMetrics.networkStressVisualDensity`—if missing or zero, node overlays will not show.
- Temporarily set `networkStress = 1` and `loadPressure = 1` for a node to test if effects appear.
- Review scene fog and lighting to ensure color/intensity changes are not masked.

Let me know if you want a step-by-step debug script or want to test with forced values.Root cause analysis complete: The most likely reasons for invisible stress visual effects are (1) the ambient plane is not added to the scene by default, (2) node overlays require specific node metrics to be set, and (3) fog/ambient color changes may be too subtle or masked. No policy or config disables were found.

Marking the task as complete. 



Analýza dokončená: Efekty nevidíš pravdepodobne preto, že ambient plane nie je pridaný do scény (musíš zavolať enableAmbientPlane()), node overlay potrebuje špecifické metriky v userData, a zmeny vo fog/ambient môžu byť príliš jemné alebo prekrývané inými nastaveniami. Žiadna policy ani config ich neblokuje.