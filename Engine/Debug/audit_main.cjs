const fs = require('fs');

const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

console.log('=== REGISTER CALLS ===');
lines.forEach((l, i) => {
  if (l.match(/\.register\(/i)) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});

console.log('\n=== NEW KEYWORDS (potential initializations) ===');
lines.forEach((l, i) => {
  if (l.match(/\bnew\s+[A-Z]\w+/)) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});

console.log('\n=== IMPORT STATEMENTS ===');
lines.forEach((l, i) => {
  if (l.match(/^import\s+.*from\s+/) || l.match(/^const\s+.*=\s*require\(/)) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});