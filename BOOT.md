# ATOMA Boot & Smoke Manual

This file is the practical runtime manual for humans and agents.

It is not the project philosophy layer and it is not the technical authority map.

---

## Canonical Runtime Target

Prefer this URL for live runtime validation:

- `http://127.0.0.1:5173/`

Run the game through Vite and treat that runtime as the default truth source.

Use legacy/static routes only when a task explicitly requires them.

---

## Recommended Worlds

For current release-slice validation, start with:

- `Quantum Island`
- `Dream Desert`

These worlds have the strongest onboarding, run-identity, setpiece, audio, and UX support.

---

## Boot Flow

1. Start the Vite runtime.
2. Open `http://127.0.0.1:5173/`.
3. Wait for the main menu to finish loading.
4. Select `Quantum Island` or `Dream Desert`.
5. Confirm the start/run-identity flow if it appears.
6. Let the world finish booting before judging gameplay or visuals.

---

## Basic Link Creation

Primary link flow:

1. choose a first node
2. set it as the primary node
3. choose a second node
4. confirm that a visible link forms between them

Practical notes:

- clicking empty space clears the active selection
- clicking the same node again does not create a new link
- a valid link requires a selected source and a different valid target

If runtime helpers are needed, use the debug helpers already exposed by the game rather than inventing parallel test paths.

---

## Smoke Checklist

Use the lightest verification that fits the task.

For a basic gameplay smoke:

1. boot into `Quantum Island` or `Dream Desert`
2. confirm the HUD appears
3. create at least one valid link
4. confirm link visuals respond
5. confirm no obvious blocking console/runtime error appears
6. confirm the menu/pause/resume loop behaves normally if relevant to the task

For a gameplay-loop smoke:

1. form multiple links
2. watch `Network Time`, build-state, and guidance layers
3. confirm the game is actually in live simulation, not still in a menu/transition surface
4. validate the requested behavior on the canonical runtime

---

## Fail Fast Rules

- blank page: inspect console and network before retrying
- build error: fix the error before doing another runtime interpretation pass
- stale browser session: verify the runtime is fresh before trusting the result
- no `window.game`: the runtime is not in valid gameplay state yet
- no visible link after valid create attempt: verify selection state and link authority before blaming visuals

Do not run blind retry loops without changing anything.

---

## Verification Tooling

- prefer direct manual validation when the task is simple
- use browser automation when the task benefits from repeatability, screenshots, or runtime inspection
- use the canonical live runtime, not an accidental fallback, unless the task explicitly requires it

---

## Where to Look Next

- `ATOMA_CORE_CONTEXT.md` for runtime/system truth
- `IDENTITY.md` for the compact startup snapshot
- `MainMenu.js`, `AtomaBoot.js`, and `main.js` for the live boot chain
