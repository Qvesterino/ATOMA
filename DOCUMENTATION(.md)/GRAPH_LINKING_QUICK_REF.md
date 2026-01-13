# Graph Linking Quick Reference

## What Changed

| Feature | Before | After |
|---|---|---|
| Links per node | 1-2 max | 16+ allowed |
| Layer compatibility | Hard block | Soft (visual flavor) |
| Duplicate links | Blocked | Blocked (hard rule) |
| Self-links | Blocked | Blocked (hard rule) |
| Reverse links | Blocked | Allowed |
| Cycles | Blocked | Allowed |
| User feedback | Error UI | Console only |
| Synergy | N/A | 0.5-0.8 visual scale |

---

## Quick Rules

✅ **Do this:**
- Link any node to any other node
- Create 10+ connections per node
- Link storage → input (even if "unusual")
- Create A→B and B→A simultaneously
- Build cycles and loops
- Link for pure gameplay, ignore layer hints

❌ **Don't do this:**
- Link node to itself
- Create exact duplicate link twice

---

## Implementation (NodeLinkingSystem.js)

**Key methods:**
- `validateLink()` - Only checks self-link + duplicate
- `attemptLink()` - Toggle behavior (create or remove)
- `linkExists()` - Directional check only
- `getLayerCompatibility()` - Purely advisory, doesn't block

**No changes to:**
- Rendering, VFX, animations
- Physics, environment
- Shaders, materials

---

## Synergy Levels

| Combo | Synergy | Visual |
|---|---|---|
| input → process | 0.8 | ★★ BRIGHT |
| input → storage | 0.5 | ★ SUBTLE |
| process → process | 0.5 | ★ SUBTLE |

---

## Player Guide

**To link:**
1. Click Node A → cyan highlight
2. Click Node B → link created (or removed if toggling)

**To remove:**
- Click same link twice (toggle off)

**Multiple links:**
- One node can have many outgoing links
- Just keep selecting and clicking different targets

---

## Testing

```javascript
// Test permissive linking
const nodeA = /* any node */;
const nodeB = /* different node */;

// Should create link (no layer check)
linkingSystem.attemptLink(nodeA, nodeB);

// Should remove link (toggle)
linkingSystem.attemptLink(nodeA, nodeB);

// Should deny (self-link)
linkingSystem.attemptLink(nodeA, nodeA);

// Should deny (duplicate)
linkingSystem.attemptLink(nodeA, nodeB);
linkingSystem.attemptLink(nodeA, nodeB); // Tries to create again while exists
```

---

## Console Output Examples

```
✓ Link created: input → storage [★ NORMAL synergy]
✓ Link created: process → process [★ NORMAL synergy]
✓ Link created: process → control [★★ HIGH synergy]
✓ Link removed: input → storage
✗ Link denied: self-link (input → input)
✗ Link denied: duplicate link (process → storage)
```

---

## Performance

- **Validation**: O(1) - only 2 checks
- **Memory**: No overhead
- **Rendering**: Same as before
- **FPS impact**: Negligible

---

## Files Changed

- `NodeLinkingSystem.js` - Link validation + attempt logic (~40 lines modified)
- All other systems untouched

---

## Troubleshooting

**Issue**: Can't link incompatible layers
- **Expected behavior!** This is now allowed. Check console for link creation confirmation.

**Issue**: Can't create duplicate link
- **Expected behavior!** Self-links and exact duplicates are denied. This is intentional.

**Issue**: Old networks broke
- **Not expected.** Existing links should work fine. Check browser console for errors.

---

## Next Steps

- Test network building with 5+ nodes per source node
- Verify visual feedback matches synergy levels
- Check console for logging clarity
- Build complex hub-and-spoke topologies

🎯 **Status: Permissive graph linking active!**
