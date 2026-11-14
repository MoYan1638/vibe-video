#!/usr/bin/env node
/**
 * vibe-video — storyboard linter (step 4.5)
 *
 * Catches timeline and engine-assignment mistakes before you spend a single
 * rendering minute or a single H3 credit.
 *
 * Usage:
 *   node assets/templates/lint-storyboard.js storyboard.txt
 *   node assets/templates/lint-storyboard.js storyboard.txt --h3 12
 *
 * Input format (one row per shot, `|` separated, header optional):
 *
 *   start | dur | engine  | visual description
 *   0     | 6   | canvas  | dark room, single lamp
 *   6     | 12  | h3      | empty courtyard, fog drifting
 *   18    | 4   | canvas  | close-up, hand enters frame
 *
 * - `start` / `dur` in seconds (decimals ok)
 * - `engine`: canvas | h3  (h3 rows get the 4-15s window check + credit estimate)
 * - lines starting with # are comments, blank lines ignored
 * - extra columns are echoed back in errors, so you can add a caption column
 *
 * Exit code 1 if any FAIL, 0 otherwise (warnings alone do not fail).
 */

const fs = require('fs');

const H3_MIN = 4;
const H3_MAX = 15;
const CREDIT_PER_SEC = 8;

const args = process.argv.slice(2);
let file = null;
let h3Window = 12;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--h3') h3Window = parseFloat(args[++i]);
  else file = args[i];
}

if (!file) {
  console.error('Usage: node lint-storyboard.js <storyboard.txt> [--h3 12]');
  process.exit(2);
}

const raw = fs.readFileSync(file, 'utf8').split(/\r?\n/);
const rows = [];
const problems = [];
const warns = [];

const add = (level, msg) => (level === 'FAIL' ? problems : warns).push(msg);

raw.forEach((line, idx) => {
  const s = line.trim();
  if (!s || s.startsWith('#') || s.startsWith('|')) return; // comment / md table frame
  if (/^-+$/.test(s)) return;
  const cells = s.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  if (cells.length < 4) {
    if (!/^start\b/i.test(cells[0] || '')) {
      warns.push(`line ${idx + 1}: skipped, needs start|dur|engine|desc`);
    }
    return;
  }
  const start = parseFloat(cells[0]);
  const dur = parseFloat(cells[1]);
  const engine = (cells[2] || '').toLowerCase();
  if (Number.isNaN(start) || Number.isNaN(dur)) {
    problems.push(`line ${idx + 1}: start/dur not numeric`);
    return;
  }
  if (!['canvas', 'h3'].includes(engine)) {
    problems.push(`line ${idx + 1}: engine must be canvas or h3 (got "${cells[2]}")`);
    return;
  }
  rows.push({ line: idx + 1, start, dur, engine, desc: cells[3], rest: cells.slice(4) });
});

if (!rows.length) {
  console.error('No shot rows parsed. Expected: start | dur | engine | desc');
  process.exit(2);
}

rows.sort((a, b) => a.start - b.start);

let total = 0;
let h3Sec = 0;
let cursor = 0;

rows.forEach((r, i) => {
  const tag = `shot ${i + 1} (line ${r.line}, ${r.start}s+${r.dur}s)`;

  // timeline continuity
  if (Math.abs(r.start - cursor) > 1e-6) {
    const gap = r.start - cursor;
    add('FAIL', `${tag}: timeline gap/overlap of ${gap.toFixed(2)}s (previous ended at ${cursor}s)`);
  }
  cursor = r.start + r.dur;

  // duration sanity
  if (r.dur < 1.5) add('FAIL', `${tag}: ${r.dur}s is too short to read`);
  if (r.engine === 'h3') {
    if (r.dur < H3_MIN || r.dur > H3_MAX) {
      add('FAIL', `${tag}: ${r.dur}s outside H3 window (${H3_MIN}-${H3_MAX}s) -> split or move to canvas`);
    }
    if (Math.abs(r.dur - h3Window) > 2.5) {
      add('WARN', `${tag}: ${r.dur}s is far from the ${h3Window}s sweet spot; model fills time with new beats`);
    }
    h3Sec += r.dur;
  }

  // weak description
  const d = r.desc || '';
  if (d.length < 12) add('WARN', `${tag}: description too thin ("${d}")`);
  if (/\b(face|faces|portrait|close-?up of (his|her|the) face)\b/i.test(d) && r.engine === 'h3') {
    add('WARN', `${tag}: h3 shot asks for a recognisable face -> identity drifts, prefer canvas`);
  }
  if (r.engine === 'h3' && /[\u4e00-\u9fa5]{2,}/.test(d) && !/(字幕|caption|文字|片头|片尾)/.test(d + (r.rest || []).join(' '))) {
    add('WARN', `${tag}: Chinese inside an h3 visual description — H3 renders CJK as mush; keep descriptions English and burn text on the canvas layer`);
  }

  total += r.dur;
});

// engine mix
if (h3Sec > 0) {
  const pct = ((h3Sec / total) * 100).toFixed(0);
  const credits = Math.round(h3Sec * CREDIT_PER_SEC);
  const line = `h3 coverage: ${h3Sec}s / ${total}s (${pct}%), ~${credits} credits`;
  if (h3Sec / total > 0.4) {
    add('WARN', `${line} — above 40%: hybrid usually wins by keeping h3 under a quarter of screen time`);
  } else {
    warns.push(`INFO ${line}`);
  }
}

// report
console.log(`storyboard: ${rows.length} shots, ${total.toFixed(1)}s (${(total / 60).toFixed(2)} min)`);
const canvasShots = rows.filter((r) => r.engine === 'canvas').length;
console.log(`engine mix: ${canvasShots} canvas / ${rows.length - canvasShots} h3`);
console.log('');

if (problems.length) problems.forEach((p) => console.log('FAIL  ' + p));
if (warns.length) warns.forEach((w) => console.log((w.startsWith('INFO') ? '' : 'WARN  ') + w));
if (!problems.length && !warns.length) console.log('OK    no issues found');

console.log('');
console.log(problems.length ? `${problems.length} blocking issue(s) — fix before rendering.` : 'Lint passed — safe to write rendering code.');
process.exit(problems.length ? 1 : 0);
