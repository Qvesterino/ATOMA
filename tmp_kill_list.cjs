const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./docs/maj/FX_CONTRACT_AUDIT_DATA.json', 'utf8'));
const kills = data.filter(r => r.verdict === 'KILL').sort((a, b) => b.riskScore - a.riskScore);

let out = '# KILL Files (' + kills.length + ')\n\n';
out += '| # | File | Category | Owner | Risk | Failing Checks |\n';
out += '|---|------|----------|-------|------|----------------|\n';

for (let i = 0; i < kills.length; i++) {
  const r = kills[i];
  const fails = Object.entries(r.checks).filter(([k, v]) => !v.passed).map(([k, v]) => k).join(', ');
  out += '| ' + (i + 1) + ' | ' + r.filename + ' | ' + r.category + ' | ' + (r.owner || 'none') + ' | ' + r.riskScore + ' | ' + fails + ' |\n';
}

fs.writeFileSync('./KILL_FILES.md', out);
console.log('Written ' + kills.length + ' KILL files to KILL_FILES.md');
