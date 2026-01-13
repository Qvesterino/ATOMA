// ATOMA smoke test
// Purpose: ensure core modules load without crashing

try {
  require("../src/main"); // alebo engine entrypoint
  console.log("ATOMA smoke test: OK");
  process.exit(0);
} catch (err) {
  console.error("ATOMA smoke test: FAILED");
  console.error(err);
  process.exit(1);
}
