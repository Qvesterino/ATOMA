# /release-atoma

## Goal
Verify that ATOMA loads and runs without fatal errors.

## Steps
1. Switch to skill: `atoma-release-manager`
2. Ensure reviewer verdict exists and is APPROVE or APPROVE_WITH_RISK.
3. Start a local static server in the project root:
   - Try: `npx serve`
   - Fallback: `python -m http.server`
   - Fallback: `node ./dev-server.js` (if exists)
4. Request the main HTML file via HTTP (e.g. curl http://localhost:3000).
5. Verify that:
   - HTML is returned
   - No 404 on main JS entry
6. Optionally fetch console logs if available.
7. If server fails to start or page fails to load → FAIL.
8. Output:
   - server used
   - status (PASS / FAIL)
   - any error messages
