# Node Core Material Authority

Default: enabled (window.ATOMA_NODE_CORE_FREEZE_ENABLED is true when undefined).

Purpose: capture, freeze, and restore node core materials so link operations cannot mutate core node visuals.

Runtime flags:
- `window.ATOMA_NODE_CORE_FREEZE_ENABLED = false` to disable the authority (for troubleshooting).
- `window.ATOMA_DEBUG_VARIANT_LOCK = true` to enable VariantLock debug logs.
- `window.ATOMA_DEBUG_HARD_INTERACTION_AUTHORITY = true` to enable HardInteractionAuthority logs.
- Optional: `window.ATOMA_DEBUG_LINK_SPAWN` etc. remain unchanged.

Enable legacy link-spawn (if needed):
```
window.ATOMA_LINK_SPAWN_ENABLED = true;
window.ATOMA_DEBUG_LINK_SPAWN = true; // optional
```

When the authority is enabled, node cores are frozen on spawn and restored after link creation/visualization, preventing unintended material/color/emissive mutations while keeping link visuals active.
