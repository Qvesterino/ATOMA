# ATOMA — LOCAL DEVELOPMENT CHECKLIST

Use this checklist:

- before running Atoma
- after AI intervention
- before committing
- when "something weird is happening"

---

## 1️⃣ Environment Check (once a day)

- [ ] Node.js LTS is installed (`node -v`)
- [ ] Dependencies are up to date (`npm install`)
- [ ] VS Code is open in the ROOT folder of Atomy
- [ ] Continue is enabled and sees the project
- [ ] I am using the correct model (DeepSeek / Devstral / Nemotron)

---

## 2️⃣ Before every RUN of Atoma

- [ ] Terminal is clean (no old dev servers)
- [ ] I am serving `index.html` from the local static server
- [ ] I am opening `http://127.0.0.1:5500/index.html`
- [ ] I am using port `5500` for runtime validation
- [ ] DevTools (F12) are open
- [ ] Console is empty (no ERROR)

If console is red → STOP and fix.

---

## 3️⃣ GPU / Visual Health Check

- [ ] Node cores are VISIBLE under all circumstances
- [ ] Aura is never opaque
- [ ] Lines do not overlap node core
- [ ] No visual "flickering" for no reason
- [ ] No effect causes nodes to disappear

If something disappears → the problem is ALWAYS in the visual layer.

---

## 4️⃣ Performance Sanity Check

- [ ] No new allocations per-frame
- [ ] No new geometries in update loop
- [ ] InstancedMesh used where possible
- [ ] Shader uniforms instead of CPU animations
- [ ] FPS stable (even with multiple nodes)

If FPS drops → first look for CPU-side error.

---

## 5️⃣ AI Safety Check (after AI intervention)

- [ ] AI ONLY modified files I allowed

- [ ] Diff is small and understandable

- [ ] No new "helper" systems appeared

- [ ] No behavior changed elsewhere in the project

- [ ] ATOMA_CORE_CONTEXT.md was not changed

If something doesn't fit → revert.

---

## 6️⃣ Console & Errors

- [ ] No `Uncaught TypeError`
- [ ] No shader compile errors
- [ ] No warning spamming
- [ ] No "undefined" in critical paths

Warnings today = bugs tomorrow.

---

## 7️⃣ Before Commit Checklist

- [ ] Atoma starts from scratch (clean reload)
- [ ] Visual is stable
- [ ] The bug I fixed is really gone
- [ ] Commit message is specific
- [ ] I can say WHAT I changed and WHY

If you can't explain it → don't commit yet.

---

## 8️⃣ Golden Rules (DO NOT BREAK)

- Stability > performance
- Minimal change > clever refactor
- GPU renders, CPU orchestrates
- Visuals read state, never invent it
- Silence > guessing

---

## 9️⃣ When Something Feels Wrong

Stop and ask yourself:

- "Did I introduce system duplication?"
- "Did I bypass the authority of another layer?"
- "Did I forget that Atoma is an ORGANISM, not a demo?"

The answer is often there.

---

## 10️⃣ Reminder

ATOMA is not rushed.
ATOMA grows.
Slow, stable progress beats fast chaos.

Trust the system.
