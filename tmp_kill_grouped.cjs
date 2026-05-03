const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./docs/maj/FX_CONTRACT_AUDIT_DATA.json', 'utf8'));
const kills = data.filter(r => r.verdict === 'KILL').sort((a, b) => b.riskScore - a.riskScore);

const tiers = [
  { name: 'CRITICAL (risk 8-11)', min: 8, max: 11 },
  { name: 'HIGH (risk 6-7)', min: 6, max: 7 },
  { name: 'MEDIUM (risk 4-5)', min: 4, max: 5 }
];

let out = '# KILL Files — 89 total\n\n';
out += 'Sorted by risk score (highest first). Many are false positives (audit tools, base classes, configs, registries).\n\n';

for (const tier of tiers) {
  const items = kills.filter(r => r.riskScore >= tier.min && r.riskScore <= tier.max);
  out += '## ' + tier.name + ' — ' + items.length + ' files\n\n';
  out += '| # | File | Category | Owner | Risk | Fails |\n';
  out += '|---|------|----------|-------|------|-------|\n';
  for (let i = 0; i < items.length; i++) {
    const r = items[i];
    const fails = Object.entries(r.checks).filter(([k, v]) => !v.passed).map(([k, v]) => k).join(', ');
    out += '| ' + (i + 1) + ' | ' + r.filename + ' | ' + r.category + ' | ' + (r.owner || 'none') + ' | ' + r.riskScore + ' | ' + fails + ' |\n';
  }
  out += '\n';
}

fs.writeFileSync('./KILL_FILES_GROUPED.md', out);
console.log('Written ' + kills.length + ' KILL files to KILL_FILES_GROUPED.md');
