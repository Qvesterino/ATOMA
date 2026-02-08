# Link Spawn Policy

Default: link-triggered spawning is OFF (safe/stable).

Enable (opt-in):

```
window.ATOMA_LINK_SPAWN_ENABLED = true;
window.ATOMA_DEBUG_LINK_SPAWN = true; // optional one-time block warnings
```

When disabled, link creation remains logic-only (relationships + visuals). No nodes are spawned from link events.
