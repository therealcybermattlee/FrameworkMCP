#!/usr/bin/env node
// Guards the four element buckets of every safeguard against drift from the
// governing CIS v8.1 Safeguard Visualisations PDF. The canonical, colour-coded
// element sets live in data/cis-v8.1-visualisation-elements.json (see its
// "source" and "rules" fields). Any element in src/core/safeguard-manager.ts
// that is added, removed, reworded, or moved to a different bucket relative to
// that file fails this check — and with it, npm test and CI.
//
// Downstream consumers pin exact element strings, so an element change is a
// breaking change: regenerate the JSON from the PDF, bump the major version,
// and document the per-safeguard diff in CHANGELOG.md. Never hand-edit either
// side just to make this pass.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const canonical = JSON.parse(readFileSync(join(root, 'data', 'cis-v8.1-visualisation-elements.json'), 'utf8')).safeguards;
const ts = readFileSync(join(root, 'src', 'core', 'safeguard-manager.ts'), 'utf8');

const BUCKETS = ['governanceElements', 'coreRequirements', 'subTaxonomicalElements', 'implementationSuggestions'];
const unescape = (s) => s.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

// Split the TS map into per-safeguard blocks, then pull each bucket's string literals.
const found = {};
const blockPat = /^  "(\d+\.\d+)": \{\n([\s\S]*?)(?=^  "\d+\.\d+": \{\n|^\};?\s*$)/gm;
for (const m of ts.matchAll(blockPat)) {
  const [, id, body] = m;
  found[id] = {};
  for (const b of BUCKETS) {
    const am = body.match(new RegExp(`^    ${b}: \\[[^\\n]*\\n([\\s\\S]*?)^    \\]`, 'm'));
    if (!am) { found[id][b] = null; continue; }
    found[id][b] = [...am[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => unescape(x[1]));
  }
}

const errors = [];
const ids = Object.keys(canonical);
if (ids.length !== 153) errors.push(`canonical JSON has ${ids.length} safeguards, expected 153`);

const key = (arr) => JSON.stringify([...arr].sort());
for (const id of ids) {
  const got = found[id];
  if (!got) { errors.push(`${id}: missing from safeguard-manager.ts`); continue; }
  for (const b of BUCKETS) {
    if (!got[b]) { errors.push(`${id}: ${b} not found in safeguard-manager.ts`); continue; }
    const want = canonical[id][b] || [];
    if (key(got[b]) !== key(want)) {
      const extra = got[b].filter((x) => !want.includes(x));
      const missing = want.filter((x) => !got[b].includes(x));
      errors.push(`${id}: ${b} drift` +
        (extra.length ? `\n    not in PDF (remove or re-bucket): ${JSON.stringify(extra)}` : '') +
        (missing.length ? `\n    in PDF but missing:              ${JSON.stringify(missing)}` : ''));
    }
    if (new Set(got[b]).size !== got[b].length) errors.push(`${id}: ${b} contains duplicate elements`);
  }
}
for (const id of Object.keys(found)) {
  if (!canonical[id]) errors.push(`${id}: present in safeguard-manager.ts but not in the canonical element file`);
}

if (errors.length) {
  console.error(`CIS element verification FAILED (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error('  ' + e + '\n');
  process.exit(1);
}
const total = ids.reduce((n, id) => n + BUCKETS.reduce((m, b) => m + (canonical[id][b] || []).length, 0), 0);
console.log(`CIS element verification passed: ${ids.length} safeguards, ${total} elements match the governing visualisation PDF.`);
