
Findings (per symptom)
DirectionalStreaks init crash

Root cause: __streaksInit was written before conduitState existed.
Exact failing write site: group.userData.conduitState.__streaksInit = true in LinkRendererConduit.js:614.
Why undefined: conduitState was created later at LinkRendererConduit.js:631, so the receiver was undefined during init.
NodeVisualStateBinder “read-only userData” failure

Call path: link event → NodeVisualStateBinder.applyLinkFXOnly() → ensureCoreVisualIntegrity() → CoreVisualAuthorityGuard.enforce() → NodeCoreMaterialAuthority.lockCoreMaterial().
Exact risky write site: mat.userData = mat.userData || {} (previous code) in NodeCoreMaterialAuthority.js lock path.
Immutability evidence:
Explicit read-only descriptor exists in repo: EnhancedNodeModels.js:5022 sets userData non-writable/non-configurable.
Error object #<WC> is consistent with a minified runtime class name (material/object wrapper), not a local class symbol in source.
Result: assignment to userData property itself throws and is surfaced by binder catch at NodeVisualStateBinder.js:347.
VariantLock warning (“side modified after lock”)

Warning source: setter installed in freezeMaterialFlags() at LinkRendererConduit.js:86.
Mechanism: after lock, any material.side write triggers warning; this can happen from downstream runtime/material workflows after creation.
Fix applied: side removed from lock list at LinkRendererConduit.js:41 to avoid false-positive post-lock side mutation warnings.
Write-site table (targeted scope)

File	Function	Line	Target object	Property written	Guard(s)
LinkRendererConduit.js	createLinkVisuals	614	conduitState	__streaksInit	if (LinkDirectionalStreaks && this.directionalStreaks)
LinkDirectionalStreaks.js	initialize	148	state	directionalStreaks	`if (!linkGroup
NodeVisualStateBinder.js	applyLinkFXOnly	340	node.userData	linkFXMesh	_validateNodeForBinder(...)
NodeVisualStateBinder.js	applyLinkFXOnly	341	node.userData	linkFXAppliedAt	_validateNodeForBinder(...)
CoreVisualAuthoritySystem.js	CoreVisualAuthorityGuard.enforce	188	coreMesh.material	delegated lock call	`if (!coreMesh
NodeCoreMaterialAuthority.js	lockCoreMaterial	167-170	material.userData	isNodeCore, __depthAuthorityLocked	now only if userData object exists/writable
LinkRendererConduit.js	freezeMaterialFlags	77-90	material[prop] descriptor	lock setter	skips non-configurable props
Call-chain map (short)
NodeLinkingSystem.createLink → LinkRendererConduit.createLinkVisuals → DirectionalStreaks init + conduitState writes.
NodeLinkingSystem.on link created → NodeVisualStateBinder.onNodeStateChange(..., 'LINKED') → applyLinkFXOnly → CoreVisualAuthorityGuard.enforce → NodeCoreMaterialAuthority.lockCoreMaterial.
Patch set (applied)
Patch 1 (highest impact)
File: LinkRendererConduit.js
Intent:
Create conduitState before DirectionalStreaks init.
Write __streaksInit to existing state.
Preserve per-link streak data (directionalStreaks) and store manager separately (directionalStreaksManager) instead of overwriting.
Patch 2
File: NodeCoreMaterialAuthority.js
Intent:
Remove direct reassignment of material.userData.
Only mutate metadata when userData is already accessible/writable.
Prevent read-only userData assignment crashes in binder link-FX path.
Patch 3
File: LinkRendererConduit.js
Intent:
Remove side from VARIANT_CRITICAL_PROPS lock list to stop post-lock side warning noise.
Safe write contract (per-link/per-node metadata)
Where state is stored

Per-link runtime state: linkGroup.userData.conduitState.
Per-link streak payload: conduitState.directionalStreaks.
Manager reference only: conduitState.directionalStreaksManager.
Per-node binder metadata: node.userData.* (only validated node objects).
Per-material lock metadata: only in material.userData when writable; otherwise skipped (no foreign-object extension).
When created

conduitState: at start of createLinkVisuals.
directionalStreaks: during LinkDirectionalStreaks.initialize.
Node binder fields: during validated binder operations.
Mutation ownership

LinkRendererConduit owns conduitState shell + lifecycle.
LinkDirectionalStreaks owns conduitState.directionalStreaks.
NodeVisualStateBinder owns node link-FX metadata fields.
NodeCoreMaterialAuthority may mark material metadata only if writable; no forced userData creation on locked materials.
Verification checklist (static + simple manual, no instrumentation)
Confirm no pre-init __streaksInit write on undefined path in LinkRendererConduit.js.
Confirm conduitState is created before streak init in LinkRendererConduit.js.
Confirm per-link streak state is not overwritten by manager reference (directionalStreaks vs directionalStreaksManager).
Confirm no direct mat.userData = ... assignment remains in lockCoreMaterial path.
Run static syntax check: node --check LinkRendererConduit.js and node --check NodeCoreMaterialAuthority.js.
Manual: create a link and verify no DirectionalStreaks INITIALIZATION FAILED error appears.
Manual: trigger link state transition (LINKED) and verify no Failed to apply link FX ... read only property 'userData' error appears.
Manual: verify no [VariantLock] side modified after lock warning during normal link rendering.
Modified files

LinkRendererConduit.js
NodeCoreMaterialAuthority.js
Why safe

Localized to link visual init/metadata and material metadata write guards.
No world switching / scheduler / spawning / AINodes architecture changes.
No gameplay logic edits.
Verification performed

Static source audit and line-path tracing.
node --check on both modified files.
Diff reviewed for minimal scope.
NO gameplay changes
NO visual style changes
NO performance impact