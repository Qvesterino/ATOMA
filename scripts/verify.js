#!/usr/bin/env node

/**
 * ATOMA verify orchestrator
 * Purpose:
 *  - deterministic validation
 *  - no retries
 *  - fail fast
 */

const { execSync } = require("child_process");

function run(step, command) {
  console.log(`\n▶ Running: ${step}`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✔ ${step} passed`);
  } catch (err) {
    console.error(`✖ ${step} failed`);
    process.exit(1);
  }
}

// --- Verification pipeline (ordered, minimal) ---

run("Typecheck", "npm run typecheck");
run("Build", "npm run build");
run("Smoke test", "npm run smoke");

console.log("\n✅ ATOMA verification complete");
process.exit(0);
