AINodes Duplicate Instantiation Audit
=====================================

Findings (code only; docs omitted)

| FILE:LINE | FUNCTION / STATEMENT | TRIGGER | CREATES AINODES? | DISPOSES? | EXPECTED OWNER | NOTES |
| --- | --- | --- | --- | --- | --- | --- |
| main.js:3817 | `this.createWorld()` (constructor boot sequence) | Game init (AtomaGame ctor) | Indirect (createWorld → createAINodes) | No | main.js | First canonical instantiation path. |
| main.js:4920 | `this.createAINodes();` inside `createWorld()` | Any createWorld call (constructor, init*World, loadWorld/switchMode) | Yes | No | main.js | Runs after world root rebuild; spawnMode starts INIT. |
| main.js:4944 | `this.aiNodes.dispose();` inside `createAINodes()` | Before new instance when aiNodes exists | — | Yes | main.js | Cleans old nodes/map on re-create. |
| main.js:4947 | `this.aiNodes = new AINodes(this.scene, this.player, sessionVariantEngine);` | `createAINodes()` | Yes | No | main.js | Canonical singleton instance. |
| WorldRuntime_v1.js:60-82 | `initInitialWorld()` calls `game.createWorld(); game.createAINodes();` | Optional orchestration wrapper | Yes | No | WorldRuntime_v1 | DUPLICATE if ctor already ran createWorld; creates second instance unless guarded externally. |
| NUCLEAR_LOCK_INTEGRATION.js:81 | `const aiNodes = new AINodes(scene)` | Standalone integration snippet | Yes | No | Demo/Hotfix | Out-of-band; not wired to main lifecycle. |
| SYSTEM_INIT_VALIDATOR_MAINJS_PATCH.js:93 | `this.aiNodes = new AINodes(this.scene, this.config);` | Validator patch script | Yes | No | Patch/Tooling | Separate sandbox initializer. |
| SYSTEM_INIT_VALIDATOR_MAINJS_PATCH.js:251 | `this.aiNodes = new AINodes(this.scene, this.config);` | Validator patch (secondary path) | Yes | No | Patch/Tooling | Same as above. |
| SYNERGY_MAIN_JS_EXAMPLE.js:39 | `this.aiNodes = new AINodes(this.scene);` | Example script | Yes | No | Example | Educational; not core runtime. |
| WEEK11_MYTHIC_EVOLUTION_INTEGRATION_SNIPPET.js:230 | `this.aiNodes = new AINodes();` | Example/snippet | Yes | No | Example | Standalone snippet. |

Call graph highlights (top duplication risks)
1) Constructor path: `AtomaGame ctor → createWorld() → createAINodes()` (canonical).  
2) WorldRuntime_v1 bootstrap: `WorldRuntime_v1.initInitialWorld() → game.createWorld() → game.createAINodes()` (can run after ctor, producing a second AINodes unless caller avoids double start).  
3) Map switch path: `switchMode()/loadWorld() → worldRegistry[...] → init*World() → createWorld() → createAINodes()` (recreates AINodes per world swap; disposes previous instance first—expected behavior).

Single Owner Proposal
- Only `main.js:createWorld()` should invoke `createAINodes()`; all orchestration wrappers (e.g., `WorldRuntime_v1.initInitialWorld`) should delegate to the existing game startup sequence instead of re-calling both createWorld and createAINodes. Auxiliary demo/patch files should remain isolated or be guarded behind explicit opt-in.
