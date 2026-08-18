#!/usr/bin/env node
// Guards safeguard titles and descriptions against drift from the official
// CIS Controls v8.1.2 text. The canonical text lives in
// data/cis-controls-v8.1.2-text.json (extracted verbatim from the official
// workbook, whitespace-normalized). Any edit to a title or description in
// src/core/safeguard-manager.ts that no longer matches the canonical text
// byte-for-byte fails this check — and with it, npm test and CI.
//
// If CIS releases a new controls version, regenerate the JSON from the new
// official workbook first; never hand-edit either side to make this pass.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const canonical = JSON.parse(readFileSync(join(root, 'data', 'cis-controls-v8.1.2-text.json'), 'utf8')).safeguards;
const ts = readFileSync(join(root, 'src', 'core', 'safeguard-manager.ts'), 'utf8');

const pat = /"(\d+\.\d+)":\s*\{\s*id:\s*"(\d+\.\d+)",\s*title:\s*"((?:[^"\\]|\\.)*)",\s*description:\s*"((?:[^"\\]|\\.)*)"/g;
const unescape = (s) => s.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

const found = {};
for (const m of ts.matchAll(pat)) {
  found[m[1]] = { title: unescape(m[3]), description: unescape(m[4]) };
}

const errors = [];
const canonicalIds = Object.keys(canonical);
if (canonicalIds.length !== 153) errors.push(`canonical JSON has ${canonicalIds.length} safeguards, expected 153`);

for (const id of canonicalIds) {
  const got = found[id];
  if (!got) { errors.push(`${id}: missing from safeguard-manager.ts`); continue; }
  if (got.title !== canonical[id].title)
    errors.push(`${id}: title drift\n    official: ${canonical[id].title}\n    found:    ${got.title}`);
  if (got.description !== canonical[id].description)
    errors.push(`${id}: description drift\n    official: ${canonical[id].description}\n    found:    ${got.description}`);
}
for (const id of Object.keys(found)) {
  if (!canonical[id]) errors.push(`${id}: present in safeguard-manager.ts but not in canonical CIS v8.1.2 text`);
}

if (errors.length) {
  console.error(`CIS text verification FAILED (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error('  ' + e + '\n');
  process.exit(1);
}
console.log(`CIS text verification passed: ${canonicalIds.length} safeguard titles and descriptions match the official v8.1.2 text.`);
