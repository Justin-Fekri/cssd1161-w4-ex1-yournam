#!/usr/bin/env node
// Assisted form filler.
//
// Opens the posting in a real browser, fills every field it can from the
// generated package, uploads the tailored resume PDF, and then STOPS with the
// browser open for you to review and press Submit yourself.
//
// It does not submit. That is deliberate:
//   - Automated submission breaches the terms of Workday, LinkedIn, Indeed and
//     most boards, and gets accounts banned.
//   - A silent misfill cannot be undone; most ATSes block re-applying to the
//     same requisition for 6-12 months.
// Filling is the slow part. Reviewing and clicking submit takes seconds.
//
// Usage:  node src/autofill.js <jobId>        (job id from the queue)
//         node src/autofill.js --all          (walk the whole ready queue)

import { getJobs, getJob } from './store.js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  console.error('\nAutofill needs Playwright:\n\n  npm install playwright\n\nEverything else in the app works without it.\n');
  process.exit(1);
}

// Field name -> the answer-pack question that feeds it.
const FIELD_MAP = [
  { keys: ['first_name', 'firstname', 'given'], q: 'First name' },
  { keys: ['last_name', 'lastname', 'family', 'surname'], q: 'Last name' },
  { keys: ['full_name', 'fullname', 'name'], q: '__FULLNAME__' },
  { keys: ['email'], q: 'Email' },
  { keys: ['phone', 'mobile', 'telephone'], q: 'Phone' },
  { keys: ['location', 'city', 'address'], q: 'Location (City)' },
  { keys: ['linkedin'], q: 'LinkedIn Profile' },
  { keys: ['github'], q: 'GitHub' },
  { keys: ['website', 'portfolio', 'url'], q: 'Portfolio / Website' },
];

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');

async function renderPdf(browser, htmlPath) {
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  const pdfPath = htmlPath.replace(/\.html$/, '.pdf');
  await page.pdf({ path: pdfPath, format: 'Letter', printBackground: false, margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' } });
  await page.close();
  return pdfPath;
}

async function fillJob(browser, job) {
  const answers = new Map(job.preview.answers.map((a) => [a.question, a.answer]));
  answers.set('__FULLNAME__', `${answers.get('First name') || ''} ${answers.get('Last name') || ''}`.trim());
  const coverLetter = job.preview.coverLetter;

  console.log(`\n--- ${job.title} @ ${job.company} (${job.ats?.label}) ---`);

  const pdfPath = await renderPdf(browser, job.files.resumeHtml);
  console.log(`  resume PDF: ${pdfPath}`);

  const page = await browser.newPage();
  await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  // Some boards put the form behind an "Apply" button.
  for (const label of ['Apply for this job', 'Apply now', 'Apply', "I'm interested"]) {
    const btn = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first();
    if (await btn.count().catch(() => 0)) { await btn.click().catch(() => {}); await page.waitForTimeout(1500); break; }
  }

  let filled = 0;
  const inputs = await page.locator('input:visible, textarea:visible, select:visible').all();

  for (const input of inputs) {
    const type = (await input.getAttribute('type').catch(() => '')) || '';
    if (['hidden', 'submit', 'button', 'checkbox', 'radio'].includes(type)) continue;

    // Build an identity for the field from every hint the page offers.
    const hints = norm([
      await input.getAttribute('name').catch(() => ''),
      await input.getAttribute('id').catch(() => ''),
      await input.getAttribute('placeholder').catch(() => ''),
      await input.getAttribute('aria-label').catch(() => ''),
      await labelTextFor(page, input),
    ].filter(Boolean).join(' '));

    if (type === 'file') {
      if (/resume|cv/.test(hints)) { await input.setInputFiles(pdfPath).catch(() => {}); filled++; console.log('  + resume uploaded'); }
      else if (/cover/.test(hints)) { /* cover letter usually has a text option; skip file */ }
      continue;
    }

    const tag = await input.evaluate((e) => e.tagName.toLowerCase()).catch(() => 'input');

    // Cover letter textarea.
    if (tag === 'textarea' && /cover|letter|why|motivat/.test(hints)) {
      await input.fill(coverLetter).catch(() => {});
      filled++; console.log('  + cover letter');
      continue;
    }

    // Direct identity fields.
    const map = FIELD_MAP.find((m) => m.keys.some((k) => hints.includes(k)));
    if (map) {
      const val = answers.get(map.q);
      if (val) {
        if (tag === 'select') await selectBest(input, val);
        else await input.fill(String(val)).catch(() => {});
        filled++;
      }
      continue;
    }

    // Screening questions — match the visible label against the answer pack.
    const labelText = await labelTextFor(page, input);
    if (labelText) {
      const hit = job.preview.answers.find((a) => looseMatch(labelText, a.question));
      if (hit?.answer) {
        if (tag === 'select') await selectBest(input, hit.answer);
        else await input.fill(String(hit.answer)).catch(() => {});
        filled++;
        console.log(`  + ${labelText.slice(0, 60)}`);
      } else {
        console.log(`  ? UNANSWERED: ${labelText.slice(0, 70)}`);
      }
    }
  }

  console.log(`  filled ${filled} field(s). Review everything, then submit manually.`);
  return page;
}

async function labelTextFor(page, input) {
  return input.evaluate((e) => {
    const id = e.getAttribute('id');
    if (id) {
      const l = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (l) return l.innerText.trim();
    }
    const wrap = e.closest('label');
    if (wrap) return wrap.innerText.trim();
    const field = e.closest('div,fieldset,section');
    const lab = field?.querySelector('label,legend');
    return lab ? lab.innerText.trim() : '';
  }).catch(() => '');
}

function looseMatch(label, question) {
  const a = label.toLowerCase().replace(/[^a-z ]/g, ' ');
  const b = question.toLowerCase().replace(/[^a-z ]/g, ' ');
  const bw = b.split(/\s+/).filter((w) => w.length > 3);
  if (!bw.length) return false;
  const hits = bw.filter((w) => a.includes(w)).length;
  return hits / bw.length >= 0.55;
}

async function selectBest(select, value) {
  const want = String(value).toLowerCase();
  const opts = await select.locator('option').allTextContents().catch(() => []);
  const exact = opts.findIndex((o) => o.toLowerCase().trim() === want);
  const fuzzy = opts.findIndex((o) => o.toLowerCase().includes(want) || want.includes(o.toLowerCase().trim()));
  const pick = exact >= 0 ? exact : fuzzy;
  if (pick >= 0) await select.selectOption({ index: pick }).catch(() => {});
}

// ---- entry point ----
const arg = process.argv[2];
if (!arg) { console.error('Usage: node src/autofill.js <jobId> | --all'); process.exit(1); }

const targets = arg === '--all'
  ? (await getJobs()).filter((j) => j.status === 'ready' && j.url && j.ats?.autofill)
  : [await getJob(arg)].filter(Boolean);

if (!targets.length) { console.error('No matching jobs with an autofillable URL.'); process.exit(1); }

const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });

for (const job of targets) {
  if (!job.files?.resumeHtml || !existsSync(job.files.resumeHtml)) { console.log(`skip ${job.title} — no generated resume`); continue; }
  try { await fillJob(browser, job); }
  catch (err) { console.error(`  ! ${job.title}: ${err.message}`); }
}

console.log('\nAll forms are open and filled. Review each tab and submit yourself.');
console.log('Press Ctrl+C here when you are done to close the browser.\n');
await new Promise(() => {});
