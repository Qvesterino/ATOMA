#!/usr/bin/env python3
"""
FX Contract Audit Script
Scans all ATOMA FX files against the 9-point contract from contract.fx.md.
Outputs per-file verdict: KEEP / FIX / ISOLATE / KILL
"""

import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
FX_DIRS = [WORKSPACE_ROOT]  # scan workspace root for .js files
OUTPUT_DIR = WORKSPACE_ROOT / "docs" / "maj"

# Known FX filenames (explicit list from design plan)
EXPLICIT_FX_FILES: Set[str] = {
    "_AdaptiveGlyphRendering1_0.js",
    "_AiEmotionalFeed3_1.js",
    "_AINarrativePatterns6_0.js",
    "_AIThoughtStorms2_0.js",
    "_AmbientEntityManager.js",
    "_AmbientEntityRegistry.js",
    "_AtomaGlyphSystem4_0.js",
    "AIConsciousnessLayer.js",
    "ArchetypeShaderModes_v1.js",
    "CanonicalGeometryFamilies_v1.js",
    "CanonicalTemplate3_StressVisuals.js",
    "CascadeBurstVisual_Session147.js",
    "CascadeEventBridge_v1.js",
    "CascadeParticleSystem_Session120.js",
    "CascadeResonanceWaveVisualization_Session146.js",
    "CascadeSystemConsoleAPI.js",
    "CascadeToWaveBridge_v1.js",
    "CascadeWaveParticles.js",
    "CascadingRuptureSystem.js",
    "CinematicUpgrade.js",
    "CognitiveHorizonPlane.js",
    "ColonyVFXManager.js",
    "CompositeGlyphGenerator.js",
    "CompositeGlyphResonanceFeedback.js",
    "CoreHologramShader.js",
    "CorruptionVisualFX_v1.js",
    "CriticalNodeFailureSystem.js",
    "DistanceLODController.js",
    "DreamDepthEffectManager.js",
    "EchoRippleIntegrationPatch_Session125.js",
    "EchoRippleSystem_Session125.js",
    "EnergyVisualProfile.js",
    "EnhancedNodeModels.js",
    "EnvironmentalHazards.js",
    "EventVisualSuppression_v1.js",
    "FireLikeAuraConfig.js",
    "FresnelAuraIntegrationPatch.js",
    "FresnelRimLightAuraShader.js",
    "FXPerformanceController_v1.js",
    "FXPerformanceSmoothTransition_v1.js",
    "GlyphAnimationModulator.js",
    "GlyphFusionZone.js",
    "HarmonicAudioReactivitySystem_Session135.js",
    "HarmonicCascadeAmplification_Session145.js",
    "HarmonicHealingVisualSystem_Session134.js",
    "HarmonicHubAuraSystem_Session126.js",
    "HarmonicHubCascade.js",
    "HarmonicHubLifecycle.js",
    "HarmonicHubSync.js",
    "HarmonicInfluencePropagationSystem_Session127.js",
    "HarmonicNodeResonanceHalos.js",
    "HarmonicRecoveryVisualSystem_Session138.js",
    "HarmonicResonanceCoupling_v1.js",
    "HarmonicResonanceFeedbackSystem.js",
    "HarmonicTopologyLearningSystem.js",
    "NeuralConvergenceSingularity.js",
    "SafeQuantumIllusionsPack1.js",
    "_SafeEvolutionManager.js",
    "_SafeLegendaryLinkFX.js",
    "_SafeLegendaryWorldEvents.js",
    "_SafeAIWeatherPack.js",
    "_SafeWorldFXPack.js",
    "SynergyCascadeVisualizer.js",
    "T2_CorruptionVisualIntegration_v1.js",
    "T2_HarmonyVisualConsumer_v1.js",
    "VisualUpgradeSuperpack.js",
    "_LinkedGlyphMessaging3_0.js",
    "_LinkedGlyphSynchronization1_0.js",
    "_RecursiveGlyphMessaging4_0.js",
    "_ProceduralMeaningEngine.js",
    "_NodeVisualBootstrap3_0.js",
    "_ExtremeAIShaderPack.js",
    "_EmergentThoughtStorms5_0.js",
    "_GlyphFusionOverlay4_1.js",
    "PHASE5_CascadeVisuals.js",
    "TIER4_CorruptionFeedbackVisuals_v1.js",
    "_GlyphLayer4_MultiFusion.js",
    "_SemanticGlyphAI.js",
}

# Files to cross-reference for owner detection
OWNER_CROSSREF_FILES = ["main.js", "EnvironmentDomainController.js"]

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ContractCheck:
    name: str
    passed: bool
    detail: str = ""

@dataclass
class FXFileReport:
    filename: str
    filepath: Path
    category: str = "UNKNOWN"
    owner: str = "UNKNOWN"
    trigger: str = "UNKNOWN"
    checks: List[ContractCheck] = field(default_factory=list)
    risk_score: int = 0
    risk_level: str = "LOW"
    verdict: str = "KEEP"
    console_count: int = 0
    has_debug_guard: bool = False
    class_name: Optional[str] = None

# ---------------------------------------------------------------------------
# FXFileScanner
# ---------------------------------------------------------------------------

class FXFileScanner:
    def __init__(self, root: Path):
        self.root = root

    def scan(self) -> List[Path]:
        files: List[Path] = []
        explicit_found: Set[str] = set()

        for path in self.root.rglob("*.js"):
            if path.name in EXPLICIT_FX_FILES:
                files.append(path)
                explicit_found.add(path.name)
                continue
            if self._is_fx_heuristic(path):
                files.append(path)

        # Warn about missing explicit files
        missing = EXPLICIT_FX_FILES - explicit_found
        if missing:
            print(f"[WARN] {len(missing)} explicit FX files not found: {sorted(missing)}")

        # Deduplicate and sort
        seen: Set[Path] = set()
        unique_files: List[Path] = []
        for p in sorted(files, key=lambda x: x.name):
            rp = p.resolve()
            if rp not in seen:
                seen.add(rp)
                unique_files.append(p)
        return unique_files

    def _is_fx_heuristic(self, path: Path) -> bool:
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return False
        has_export_class = "export class" in content
        has_three = any(k in content for k in ("THREE.Mesh", "THREE.Line", "THREE.Points", "THREE.Group"))
        has_material = any(k in content for k in ("ShaderMaterial", "MeshBasicMaterial", "MeshStandardMaterial"))
        has_scene = "scene.add" in content or "scene.remove" in content
        has_dispose = ".dispose()" in content
        return has_export_class and (has_three or has_material or has_scene or has_dispose)

# ---------------------------------------------------------------------------
# CategoryDetector
# ---------------------------------------------------------------------------

class CategoryDetector:
    CATEGORIES: List[Tuple[str, List[str]]] = [
        ("LINK FX", ["linkId", "link.source", "link.target", "linkingSystem", "LinkFX", "LinkCascade", "LinkBead", "LinkCollapse"]),
        ("NODE FX", ["nodeId", "node.position", "node.userData", "NodeFX", "registerNode", "AINodes", "EnhancedNode", "NodeVisual", "NodeResonance"]),
        ("ENVIRONMENT FX", ["worldRoot", "environmentRoot", "WORLD_OVERLAY", "WORLD_BACKGROUND", "Environment", "WeatherPack", "WorldFX", "Atmosphere", "DreamDepth"]),
        ("CASCADE/WAVE", ["Cascade", "Wave", "Resonance", "Rupture", "Burst", "SynergyCascade", "HarmonicCascade", "CascadeParticle"]),
        ("PARTICLE FX", ["THREE.Points", "ParticleSystem", "Particle", "spawnCount", "pool", "PointsMaterial", "particlePools"]),
        ("SHADER/MATERIAL", ["ShaderMaterial", "onBeforeCompile", "uniforms", "vertexShader", "fragmentShader", "ArchetypeShader", "AuraShader", "HologramShader"]),
    ]

    def detect(self, content: str, filename: str) -> str:
        scores: Dict[str, int] = {}
        for cat, keywords in self.CATEGORIES:
            score = sum(1 for kw in keywords if kw in content or kw in filename)
            if score:
                scores[cat] = score
        if not scores:
            return "UNKNOWN"
        return max(scores, key=scores.get)  # type: ignore[arg-type]

# ---------------------------------------------------------------------------
# ContractChecker
# ---------------------------------------------------------------------------

class ContractChecker:
    def check(self, content: str, filename: str) -> List[ContractCheck]:
        checks: List[ContractCheck] = []
        checks.append(self._check_purpose(content))
        checks.append(self._check_owner(content, filename))
        checks.append(self._check_trigger(content))
        checks.append(self._check_gate(content, filename))
        checks.append(self._check_update(content))
        checks.append(self._check_budget(content))
        checks.append(self._check_lifetime(content))
        checks.append(self._check_dispose(content))
        checks.append(self._check_debug(content))
        return checks

    # 1. PURPOSE
    def _check_purpose(self, content: str) -> ContractCheck:
        # Look for JSDoc or comment block with descriptive keywords
        pattern = re.compile(r"/\*\*[\s\S]*?(visual|effect|vfx|fx|overlay|particle|shader|cascade|wave|aura|glow)", re.IGNORECASE)
        if pattern.search(content):
            return ContractCheck("PURPOSE", True, "JSDoc/comment with FX keywords found")
        # Fallback: any block comment
        if re.search(r"/\*\*[\s\S]*?\*/", content):
            return ContractCheck("PURPOSE", True, "Block comment present (generic)")
        return ContractCheck("PURPOSE", False, "No purpose documentation")

    # 2. OWNER
    def _check_owner(self, content: str, filename: str) -> ContractCheck:
        owners = []
        if "EnvironmentDomainController" in content:
            owners.append("EnvironmentDomainController")
        if "LinkRendererConduit" in content:
            owners.append("LinkRendererConduit")
        if "FrameScheduler" in content:
            owners.append("FrameScheduler")
        if "semanticBus" in content or "SemanticBus" in content:
            owners.append("SemanticBus")
        if "constructor" in content and "scene" in content:
            owners.append("scene-based")
        if owners:
            return ContractCheck("OWNER", True, f"Detected: {', '.join(owners)}")
        return ContractCheck("OWNER", False, "No known owner reference")

    # 3. TRIGGER
    def _check_trigger(self, content: str) -> ContractCheck:
        triggers = []
        if re.search(r"\.(on\(|addEventListener|subscribe)", content):
            triggers.append("event")
        if re.search(r"synergy|harmony|stability|corruption|loadPressure", content, re.IGNORECASE):
            triggers.append("metric")
        if "link." in content or "linkId" in content:
            triggers.append("link-state")
        if "node." in content or "nodeId" in content:
            triggers.append("node-state")
        if re.search(r"worldState|atmosphereState|weatherState", content):
            triggers.append("environment")
        if "update(deltaTime" in content or "update(dt" in content:
            triggers.append("per-frame")
        if triggers:
            return ContractCheck("TRIGGER", True, f"Detected: {', '.join(triggers)}")
        return ContractCheck("TRIGGER", False, "No clear trigger mechanism")

    # 4. GATE
    def _check_gate(self, content: str, filename: str) -> ContractCheck:
        gates = []
        if re.search(r"this\.(enabled|disabled)\b|setEnabled\b", content):
            gates.append("enabled-flag")
        if "frameScheduler" in content or "shouldRunVisual" in content or "shouldRunSimulation" in content:
            gates.append("scheduler")
        if re.search(r"LOD|distance|farDistance", content):
            gates.append("LOD")
        if re.search(r"cooldown|lastTime|interval", content, re.IGNORECASE):
            gates.append("cooldown")
        if re.search(r"if\s*\(\s*!this\.\w+", content):
            gates.append("null-guard")
        # Critical anti-pattern check
        if "!this.frameScheduler?.shouldRunVisual?.()" in content:
            return ContractCheck("GATE", False, "CRITICAL: frameScheduler optional-chain bug — always blocks update")
        if gates:
            return ContractCheck("GATE", True, f"Detected: {', '.join(gates)}")
        return ContractCheck("GATE", False, "No gate mechanism found")

    # 5. UPDATE
    def _check_update(self, content: str) -> ContractCheck:
        if re.search(r"update\s*\(", content):
            # Check if update has early return
            if re.search(r"update\s*\([^)]*\)\s*\{[^}]*?return", content, re.DOTALL):
                return ContractCheck("UPDATE", True, "update() with early return")
            return ContractCheck("UPDATE", True, "update() present (no early return)")
        return ContractCheck("UPDATE", False, "No update() method")

    # 6. BUDGET
    def _check_budget(self, content: str) -> ContractCheck:
        if re.search(r"maxParticles|maxCount|pool.*size|cap|limit|MAX_", content, re.IGNORECASE):
            return ContractCheck("BUDGET", True, "Budget cap keywords found")
        return ContractCheck("BUDGET", False, "No budget cap detected")

    # 7. LIFETIME
    def _check_lifetime(self, content: str) -> ContractCheck:
        lifetime = []
        if re.search(r"TTL|lifetime|duration|maxAge|age", content, re.IGNORECASE):
            lifetime.append("TTL")
        if re.search(r"fadeOut|dissolve|despawn", content, re.IGNORECASE):
            lifetime.append("fade-out")
        if re.search(r"pool.*release|returnToPool|recycle", content, re.IGNORECASE):
            lifetime.append("pool")
        if "scene.remove" in content or "removeFromScene" in content:
            lifetime.append("scene-remove")
        if lifetime:
            return ContractCheck("LIFETIME", True, f"Detected: {', '.join(lifetime)}")
        return ContractCheck("LIFETIME", False, "No lifetime management")

    # 8. DISPOSE
    def _check_dispose(self, content: str) -> ContractCheck:
        if re.search(r"dispose\s*\(\)", content):
            details = []
            if "scene.remove" in content or "scene\.remove" in content:
                details.append("scene-remove")
            if re.search(r"\.geometry\.dispose|geometry\.dispose", content):
                details.append("geometry")
            if re.search(r"\.material\.dispose|material\.dispose", content):
                details.append("material")
            if re.search(r"\.clear\(\)", content):
                details.append("clear-maps")
            if re.search(r"removeEventListener|unsubscribe|off\(", content):
                details.append("unsubscribe")
            detail = f"dispose() with: {', '.join(details)}" if details else "dispose() present"
            return ContractCheck("DISPOSE", True, detail)
        return ContractCheck("DISPOSE", False, "No dispose() method")

    # 9. DEBUG FLAG
    def _check_debug(self, content: str) -> ContractCheck:
        console_calls = len(re.findall(r"console\.(log|warn|error|info)", content))
        has_debug = bool(re.search(r"debugMode|this\.debug|DEBUG|_debug", content))
        # Check if console calls are wrapped in debug guards
        wrapped = len(re.findall(r"if\s*\(\s*(?:this\.)?debug(?:Mode)?\s*\)\s*\{[^}]*console\.(log|warn|error|info)", content))
        if console_calls == 0:
            return ContractCheck("DEBUG", True, "No console calls")
        if has_debug and (wrapped >= console_calls * 0.5 or console_calls <= 3):
            return ContractCheck("DEBUG", True, f"{console_calls} console calls, debug guard present")
        if console_calls > 3 and not has_debug:
            return ContractCheck("DEBUG", False, f"{console_calls} console calls without debug flag")
        return ContractCheck("DEBUG", True, f"{console_calls} console calls, debug flag present")

# ---------------------------------------------------------------------------
# RiskAssessor
# ---------------------------------------------------------------------------

class RiskAssessor:
    def assess(self, checks: List[ContractCheck], content: str, filename: str) -> Tuple[int, str]:
        score = 0
        check_map = {c.name: c for c in checks}

        if not check_map.get("DISPOSE", ContractCheck("", True)).passed:
            score += 3
        if not check_map.get("GATE", ContractCheck("", True)).passed:
            score += 2
        if not check_map.get("BUDGET", ContractCheck("", True)).passed:
            score += 2
        if not check_map.get("DEBUG", ContractCheck("", True)).passed:
            score += 1
        if not check_map.get("OWNER", ContractCheck("", True)).passed:
            score += 1
        if not check_map.get("UPDATE", ContractCheck("", True)).passed:
            score += 1

        # Known glitch source pattern
        if "RoundedBoxGeometry" in content and "opacity" in content and "0.0" in content:
            score += 3
        if "THREE.Points" in content and "sizeAttenuation" in content and "position(0,0,0)" in content.replace(" ", ""):
            score += 2

        # Deprecated API references
        if "Geometry" in content and "BufferGeometry" not in content:
            score += 2

        if score <= 1:
            level = "LOW"
        elif score <= 3:
            level = "MID"
        else:
            level = "HIGH"
        return score, level

# ---------------------------------------------------------------------------
# VerdictEngine
# ---------------------------------------------------------------------------

class VerdictEngine:
    def decide(self, checks: List[ContractCheck], risk_score: int, risk_level: str) -> str:
        passed = sum(1 for c in checks if c.passed)
        failed = len(checks) - passed

        if failed == 0:
            return "KEEP"
        if failed <= 2 and risk_level in ("LOW", "MID"):
            return "FIX"
        if failed >= 3 and risk_level == "MID":
            return "ISOLATE"
        if risk_level == "HIGH" or failed >= 6:
            return "KILL"
        if failed <= 2:
            return "FIX"
        return "ISOLATE"

# ---------------------------------------------------------------------------
# Owner cross-reference
# ---------------------------------------------------------------------------

class OwnerCrossRef:
    def __init__(self, root: Path):
        self.root = root
        self.owners: Dict[str, str] = {}
        self._scan()

    def _scan(self) -> None:
        for fname in OWNER_CROSSREF_FILES:
            path = self.root / fname
            if not path.exists():
                continue
            try:
                content = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            # Find new ClassName( patterns
            for match in re.finditer(r"new\s+([A-Za-z0-9_]+)\s*\(", content):
                class_name = match.group(1)
                self.owners[class_name] = fname
            # Find import patterns
            for match in re.finditer(r"import\s+\{?\s*([A-Za-z0-9_]+)\s*\}?\s+from\s+['\"]([^'\"]+)['\"]", content):
                class_name = match.group(1)
                src = match.group(2)
                if src.endswith(".js"):
                    self.owners[class_name] = fname

    def get_owner(self, class_name: Optional[str], filename: str) -> str:
        if class_name and class_name in self.owners:
            return self.owners[class_name]
        # Fallback: filename-based heuristic
        if "Environment" in filename or "World" in filename or "Weather" in filename:
            return "EnvironmentDomainController (heuristic)"
        if "Link" in filename:
            return "LinkRendererConduit (heuristic)"
        if "Node" in filename or "AINodes" in filename:
            return "main.js (heuristic)"
        return "UNKNOWN"

# ---------------------------------------------------------------------------
# ReportGenerator
# ---------------------------------------------------------------------------

class ReportGenerator:
    def __init__(self, reports: List[FXFileReport]):
        self.reports = reports

    def print_console(self) -> None:
        print("\n" + "=" * 70)
        print("FX CONTRACT AUDIT")
        print("=" * 70)
        print(f"Scanning {len(self.reports)} FX files...\n")

        for r in self.reports:
            box_width = 70
            print("┌" + "─" * box_width + "┐")
            print(f"│ FILE: {r.filename:<{box_width - 7}}│")
            print(f"│ Category: {r.category:<{box_width - 11}}│")
            print(f"│ Owner: {r.owner:<{box_width - 8}}│")
            print(f"│ Trigger: {r.trigger:<{box_width - 10}}│")
            print(f"│ Risk: {r.risk_level} (score {r.risk_score}){' ' * (box_width - 22 - len(r.risk_level) - len(str(r.risk_score)))}│")
            print(f"│ Verdict: {r.verdict:<{box_width - 10}}│")
            print("├" + "─" * box_width + "┤")
            check_line = " ".join(f"{c.name}:{'✅' if c.passed else '❌'}" for c in r.checks)
            # Wrap check line
            while check_line:
                chunk = check_line[:box_width - 2]
                check_line = check_line[box_width - 2:]
                print(f"│ {chunk:<{box_width - 2}}│")
            print("└" + "─" * box_width + "┘")
            print()

        summary: Dict[str, int] = {"KEEP": 0, "FIX": 0, "ISOLATE": 0, "KILL": 0}
        for r in self.reports:
            summary[r.verdict] = summary.get(r.verdict, 0) + 1

        print("=" * 70)
        print("SUMMARY:")
        for v in ("KEEP", "FIX", "ISOLATE", "KILL"):
            print(f"  {v:<10} {summary.get(v, 0)} files")
        print("=" * 70)

    def generate_markdown(self) -> str:
        lines = [
            "# FX Contract Audit Report",
            "",
            f"**Date:** auto-generated  ",
            f"**Files Scanned:** {len(self.reports)}  ",
            "",
            "## Summary",
            "",
        ]
        summary: Dict[str, int] = {"KEEP": 0, "FIX": 0, "ISOLATE": 0, "KILL": 0}
        for r in self.reports:
            summary[r.verdict] = summary.get(r.verdict, 0) + 1
        for v in ("KEEP", "FIX", "ISOLATE", "KILL"):
            lines.append(f"- **{v}:** {summary.get(v, 0)} files")
        lines.append("")
        lines.append("## Per-File Details")
        lines.append("")
        lines.append("| File | Category | Owner | Trigger | Risk | Verdict | Checks |")
        lines.append("|------|----------|-------|---------|------|---------|--------|")
        for r in self.reports:
            checks_str = " ".join(f"{c.name}:{'✅' if c.passed else '❌'}" for c in r.checks)
            lines.append(f"| {r.filename} | {r.category} | {r.owner} | {r.trigger} | {r.risk_level}({r.risk_score}) | {r.verdict} | {checks_str} |")
        lines.append("")
        lines.append("## Risk Details")
        lines.append("")
        for r in self.reports:
            if r.risk_level in ("MID", "HIGH"):
                lines.append(f"### {r.filename}")
                lines.append(f"- **Risk:** {r.risk_level} (score {r.risk_score})")
                lines.append(f"- **Verdict:** {r.verdict}")
                for c in r.checks:
                    if not c.passed:
                        lines.append(f"- **{c.name}:** ❌ {c.detail}")
                lines.append("")
        return "\n".join(lines)

    def generate_json(self) -> str:
        data = []
        for r in self.reports:
            data.append({
                "filename": r.filename,
                "category": r.category,
                "owner": r.owner,
                "trigger": r.trigger,
                "risk_score": r.risk_score,
                "risk_level": r.risk_level,
                "verdict": r.verdict,
                "checks": {c.name: {"passed": c.passed, "detail": c.detail} for c in r.checks},
            })
        return json.dumps(data, indent=2)

    def write_outputs(self) -> None:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        md_path = OUTPUT_DIR / "FX_CONTRACT_AUDIT_REPORT.md"
        json_path = OUTPUT_DIR / "FX_CONTRACT_AUDIT_DATA.json"
        md_path.write_text(self.generate_markdown(), encoding="utf-8")
        json_path.write_text(self.generate_json(), encoding="utf-8")
        print(f"[INFO] Reports written to:")
        print(f"       {md_path}")
        print(f"       {json_path}")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    scanner = FXFileScanner(WORKSPACE_ROOT)
    files = scanner.scan()
    if not files:
        print("[ERROR] No FX files found.")
        return 1

    category_detector = CategoryDetector()
    contract_checker = ContractChecker()
    risk_assessor = RiskAssessor()
    verdict_engine = VerdictEngine()
    owner_xref = OwnerCrossRef(WORKSPACE_ROOT)

    reports: List[FXFileReport] = []

    for path in files:
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            print(f"[WARN] Could not read {path}: {e}")
            continue

        # Extract class name
        class_match = re.search(r"export\s+class\s+([A-Za-z0-9_]+)", content)
        class_name = class_match.group(1) if class_match else None

        category = category_detector.detect(content, path.name)
        checks = contract_checker.check(content, path.name)
        risk_score, risk_level = risk_assessor.assess(checks, content, path.name)
        verdict = verdict_engine.decide(checks, risk_score, risk_level)
        owner = owner_xref.get_owner(class_name, path.name)

        # Trigger from checks
        trigger_check = next((c for c in checks if c.name == "TRIGGER"), None)
        trigger = trigger_check.detail if trigger_check else "UNKNOWN"

        report = FXFileReport(
            filename=path.name,
            filepath=path,
            category=category,
            owner=owner,
            trigger=trigger,
            checks=checks,
            risk_score=risk_score,
            risk_level=risk_level,
            verdict=verdict,
            class_name=class_name,
        )
        reports.append(report)

    # Sort by verdict severity
    verdict_order = {"KILL": 0, "ISOLATE": 1, "FIX": 2, "KEEP": 3}
    reports.sort(key=lambda r: (verdict_order.get(r.verdict, 99), r.filename))

    generator = ReportGenerator(reports)
    generator.print_console()
    generator.write_outputs()

    return 0

if __name__ == "__main__":
    sys.exit(main())
