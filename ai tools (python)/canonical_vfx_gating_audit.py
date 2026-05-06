#!/usr/bin/env python3
"""
Canonical VFX Gating Audit

Combines existing ATOMA audit helpers into one repo-local offender report focused on
canonical metric gating authority and subscription hygiene.

Outputs:
  - docs/audits/CANONICAL_VFX_GATING_OFFENDER_REPORT.json
  - docs/audits/CANONICAL_VFX_GATING_OFFENDER_REPORT.md
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


SCRIPT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = WORKSPACE_ROOT / "docs" / "audits"
OUTPUT_JSON = OUTPUT_DIR / "CANONICAL_VFX_GATING_OFFENDER_REPORT.json"
OUTPUT_MD = OUTPUT_DIR / "CANONICAL_VFX_GATING_OFFENDER_REPORT.md"

CANONICAL_TAG_RE = re.compile(
    r"\b(?:node|link|hub|global)\.(?:synergy|harmony|stability|corruption|loadPressure)\.(?:low|mid|high)\b"
)
LOCAL_FAMILY_RE = re.compile(
    r"\b(?:cascade|topology|temporal|semantic\.ritual|environment\.hazard|environment\.colony|link\.created|node\.spawned|consciousness\.)[A-Za-z0-9_.:-]*\b"
)
SEMANTIC_SUBSCRIBE_RE = re.compile(
    r"\b(?:semanticBus|ATOMA_BUS|\w+Bus|\w+bus)\.(?:on|subscribe|once)\(\s*['\"]([^'\"]+)['\"]"
)
SEMANTIC_EMIT_RE = re.compile(
    r"\b(?:semanticBus|ATOMA_BUS|\w+Bus|\w+bus)\.(?:emit|publish)\(\s*['\"]([^'\"]+)['\"]"
)

OVERRIDES = {
    "MetricReactiveWorldEvents.js": {
        "classification": "SELF_THRESHOLDING_AUTHORITY",
        "action": "MIGRATE_NOW",
        "notes": [
            "Polls metrics locally and computes its own visual tier authority.",
            "Must consume canonical global scoped metric tags instead of emitting them."
        ]
    },
    "TemporalEventEffects.js": {
        "classification": "CANONICAL_CONSUMER",
        "action": "KEEP",
        "notes": ["Already canonical-gated; report-only in this wave."]
    },
    "Phase8RitualVisualOrchestration.js": {
        "classification": "CANONICAL_CONSUMER",
        "action": "KEEP",
        "notes": ["Already canonical-gated; report-only in this wave."]
    },
    "_SafeLegendaryWorldEvents.js": {
        "classification": "CANONICAL_CONSUMER",
        "action": "KEEP",
        "notes": ["Already canonical-gated; report-only in this wave."]
    },
    "EnvironmentalHazards.js": {
        "classification": "CANONICAL_CONSUMER",
        "action": "KEEP",
        "notes": ["Consumes canonical globals and emits local environment hazard events."]
    },
    "SynergyCascadeVisualizer.js": {
        "classification": "CANONICAL_CONSUMER",
        "action": "KEEP",
        "notes": ["Consumes canonical node/link tiers; cascade.* remains auxiliary family for later review."]
    },
    "CascadeEventBridge_v1.js": {
        "classification": "CANONICAL_CONSUMER + AUXILIARY_PRODUCER",
        "action": "KEEP",
        "notes": [
            "Consumes canonical node/link tiers.",
            "Sole authorized producer of cascade.start / cascade.hop / cascade.end."
        ]
    },
    "CascadeParticleSystem_Session120.js": {
        "classification": "AUXILIARY_CONSUMER",
        "action": "KEEP",
        "notes": [
            "Consumes only cascade.hop as a derived auxiliary family.",
            "No longer uses raw lifecycle semantic events as primary refresh authority."
        ]
    },
    "CascadeResonanceWaveVisualization_Session146.js": {
        "classification": "AUXILIARY_CONSUMER",
        "action": "KEEP",
        "notes": [
            "Consumes derived cascade.start / cascade.hop only.",
            "Semantic subscriptions are registry-wrapped."
        ]
    }
}
REPORT_ONLY_INCLUDE = (
    "MetricReactiveWorldEvents.js",
    "TemporalEventEffects.js",
    "Phase8RitualVisualOrchestration.js",
    "_SafeLegendaryWorldEvents.js",
    "SynergyCascadeVisualizer.js",
    "EnvironmentalHazards.js",
)


def load_module(file_name: str):
    path = SCRIPT_DIR / file_name
    spec = importlib.util.spec_from_file_location(path.stem.replace(" ", "_"), path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Failed to load module from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def short_path(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(WORKSPACE_ROOT.resolve())).replace("\\", "/")
    except Exception:
        return str(path).replace("\\", "/")


def collect_by_file(items: List[Any], attr_name: str) -> Dict[str, List[Any]]:
    result: Dict[str, List[Any]] = defaultdict(list)
    for item in items:
        result[getattr(item, attr_name)].append(item)
    return result


def classify_record(filename: str, record: Dict[str, Any]) -> None:
    if filename in OVERRIDES:
        record.update(OVERRIDES[filename])
        return

    if record["self_thresholding"]:
        record["classification"] = "SELF_THRESHOLDING_AUTHORITY"
        record["action"] = "MIGRATE_NOW"
        return

    if record["canonical_emits"]:
        record["classification"] = "CANONICAL_PRODUCER"
        record["action"] = "KEEP"
        return

    if record["canonical_subscribes"]:
        record["classification"] = "CANONICAL_CONSUMER"
        record["action"] = "KEEP"
        return

    if record["local_semantic_families"] or record["bare_bus_subscriptions"]:
        record["classification"] = "LEGACY_NOISY"
        record["action"] = "BRIDGE"
        return

    record["classification"] = "LOCAL_ONLY"
    record["action"] = "LEAVE_LOCAL"


def build_markdown(report: Dict[str, Any]) -> str:
    lines: List[str] = []
    lines.append("# Canonical VFX Gating Offender Report")
    lines.append("")
    lines.append(f"- Generated: `{report['generatedAt']}`")
    lines.append(f"- Workspace root: `{report['workspaceRoot']}`")
    lines.append(f"- First migration batch: `{', '.join(report['firstMigrationBatch'])}`")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    for key, value in sorted(report["summary"]["classificationCounts"].items()):
        lines.append(f"- `{key}`: {value}")
    lines.append("")
    lines.append("## First Migration Batch")
    lines.append("")
    for entry in report["firstMigration"]:
        lines.append(f"- `{entry['file']}` -> `{entry['classification']}` / `{entry['action']}`")
        for note in entry["notes"]:
            lines.append(f"  - {note}")
    lines.append("")
    lines.append("## Report Table")
    lines.append("")
    lines.append("| File | Classification | Action | Canonical Subs | Canonical Emits | Notes |")
    lines.append("| --- | --- | --- | ---: | ---: | --- |")
    for entry in report["systems"]:
        notes = "; ".join(entry["notes"][:3]) if entry["notes"] else ""
        lines.append(
            f"| `{entry['file']}` | `{entry['classification']}` | `{entry['action']}` | "
            f"{len(entry['canonical_subscribes'])} | {len(entry['canonical_emits'])} | {notes} |"
        )
    lines.append("")
    return "\n".join(lines) + "\n"


def main() -> int:
    semantic_event_mapper = load_module("semantic_event_mapper.py")
    metric_flow_tracer = load_module("metric_flow_tracer.py")
    vfx_contract_audit = load_module("vfx_contract_audit.py")

    event_mapper = semantic_event_mapper.SemanticEventMapper(str(WORKSPACE_ROOT))
    event_mapper.scan_directory(str(WORKSPACE_ROOT))

    metric_tracer = metric_flow_tracer.MetricFlowTracer(str(WORKSPACE_ROOT))
    metric_tracer.scan_directory(str(WORKSPACE_ROOT))

    vfx_scanner = vfx_contract_audit.FXFileScanner(WORKSPACE_ROOT)
    fx_files = vfx_scanner.scan()
    fx_index = {path.name: path for path in fx_files}
    for forced_name in REPORT_ONLY_INCLUDE:
        if forced_name in fx_index:
            continue
        candidate = WORKSPACE_ROOT / forced_name
        if candidate.exists():
            fx_files.append(candidate)
            fx_index[forced_name] = candidate

    emits_by_file = collect_by_file(event_mapper.emits, "file_path")
    subs_by_file = collect_by_file(event_mapper.subscribes, "file_path")
    metrics_by_file = collect_by_file(metric_tracer.metric_accesses, "file_path")

    systems: List[Dict[str, Any]] = []

    for fx_path in fx_files:
      content = fx_path.read_text(encoding="utf-8", errors="ignore")
      file_key = str(fx_path)

      emitted_events = sorted(set(SEMANTIC_EMIT_RE.findall(content)))
      subscribed_events = sorted(set(SEMANTIC_SUBSCRIBE_RE.findall(content)))
      canonical_literals = sorted(set(CANONICAL_TAG_RE.findall(content)))
      canonical_emits = sorted(set([e for e in emitted_events if CANONICAL_TAG_RE.fullmatch(e)]))
      canonical_subscribes = sorted(set([e for e in subscribed_events if CANONICAL_TAG_RE.fullmatch(e)]))
      local_families = sorted(set(LOCAL_FAMILY_RE.findall(content)))
      metric_patterns = sorted(set([m.pattern for m in metrics_by_file.get(file_key, [])]))

      uses_registry = "eventRegistrationRegistry.register" in content
      has_registry_cleanup = "eventRegistrationRegistry.disposeOwner" in content or "dispose()" in content
      bare_bus_subscriptions = bool(subscribed_events) and not uses_registry
      helper_subscriber = any(token in content for token in [
          "_subscribeMetricTag(",
          "_subscribeSemanticEvent(",
          "eventRegistrationRegistry.register(",
          "bind('global.",
          "reg('global."
      ])
      if canonical_literals and helper_subscriber and not canonical_subscribes:
          canonical_subscribes = canonical_literals
      if canonical_literals and ("emit(" in content or "publish(" in content) and "buildScopedMetricEventName(" in content and not canonical_emits:
          canonical_emits = canonical_literals
      self_thresholding = (
          ("coreMetricsOverlay.getMetrics(" in content or "projectHudMetrics(" in content)
          and ("thresholds:" in content or "classifyMetricTier(" in content)
          and ("metric.tier.changed" in content or canonical_emits)
      )

      notes: List[str] = []
      if self_thresholding:
          notes.append("Self-thresholding metric authority detected.")
      if bare_bus_subscriptions:
          notes.append("Semantic subscriptions are not registry-wrapped.")
      if canonical_emits and not self_thresholding:
          notes.append("Emits canonical scoped metric events.")
      if canonical_subscribes:
          notes.append("Consumes canonical scoped metric events.")
      if local_families and not canonical_subscribes and not canonical_emits:
          notes.append("Uses only local/auxiliary semantic families.")
      if metric_patterns:
          notes.append(f"Metric reads: {len(metric_patterns)}")
      if not has_registry_cleanup and uses_registry:
          notes.append("Registry usage found without obvious cleanup path.")

      record = {
          "file": short_path(fx_path),
          "classification": None,
          "action": None,
          "canonical_subscribes": canonical_subscribes,
          "canonical_emits": canonical_emits,
          "local_semantic_families": local_families,
          "registryWrapped": uses_registry,
          "registryCleanupVisible": has_registry_cleanup,
          "bare_bus_subscriptions": bare_bus_subscriptions,
          "self_thresholding": self_thresholding,
          "rawEmitCount": len(emits_by_file.get(file_key, [])),
          "rawSubscribeCount": len(subs_by_file.get(file_key, [])),
          "metricAccessCount": len(metric_patterns),
          "notes": notes,
      }
      classify_record(fx_path.name, record)
      systems.append(record)

    systems.sort(key=lambda item: (item["action"] != "MIGRATE_NOW", item["file"].lower()))
    classification_counts = Counter(system["classification"] for system in systems)
    action_counts = Counter(system["action"] for system in systems)
    first_migration = [system for system in systems if system["action"] == "MIGRATE_NOW"]

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "workspaceRoot": str(WORKSPACE_ROOT),
        "firstMigrationBatch": ["MetricReactiveWorldEvents.js"],
        "summary": {
            "systemCount": len(systems),
            "classificationCounts": dict(classification_counts),
            "actionCounts": dict(action_counts),
        },
        "firstMigration": first_migration,
        "systems": systems,
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")
    OUTPUT_MD.write_text(build_markdown(report), encoding="utf-8")

    print(f"[canonical_vfx_gating_audit] wrote {OUTPUT_JSON}")
    print(f"[canonical_vfx_gating_audit] wrote {OUTPUT_MD}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
