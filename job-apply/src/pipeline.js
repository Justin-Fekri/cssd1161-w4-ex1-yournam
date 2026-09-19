// One job link in -> a complete, ready-to-submit application package out.
// This is the whole pipeline; both the web UI and the CLI batch runner call it.

import { randomUUID } from 'node:crypto';
import { extractKeywords } from './keywords.js';
import { fetchJob, detectATS } from './fetchJob.js';
import { tailorResume } from './tailor.js';
import { renderText, renderMarkdown, renderHTML, renderCoverLetter } from './render.js';
import { auditResume } from './score.js';
import { buildAnswerPack } from './questions.js';
import { writeOutput, slugify, upsertJob } from './store.js';

/**
 * @param {object} input  { url?, text?, title?, company? }
 * @param {object} profile
 * @returns the stored application record
 */
export async function processJob(input, profile) {
  const id = input.id || randomUUID().slice(0, 8);
  let job;

  if (input.text && input.text.trim().length > 200) {
    // Pasted description — the most reliable path, and the fallback for gated sites.
    const ats = detectATS(input.url || '');
    job = {
      url: input.url || '',
      title: input.title || firstLine(input.text),
      company: input.company || 'Unknown',
      location: input.location || '',
      text: input.text,
      ats: { key: ats.key, label: ats.label, aiScreening: ats.aiScreening, autofill: ats.autofill, notes: ats.notes },
      ok: true,
      sourcedFrom: 'pasted',
    };
  } else if (input.url) {
    job = { ...(await fetchJob(input.url)), sourcedFrom: 'fetched' };
    if (input.title) job.title = input.title;
    if (input.company) job.company = input.company;
    if (!job.ok) {
      // Keep the record so the queue shows it and the user can paste the text in.
      const record = {
        id, createdAt: new Date().toISOString(), status: 'needs-input',
        url: input.url, title: job.title || 'Could not read posting', company: job.company || 'Unknown',
        ats: job.ats, blocked: true, reason: job.reason,
      };
      await upsertJob(record);
      return record;
    }
  } else {
    throw new Error('Provide either a job URL or the job description text.');
  }

  const analysis = extractKeywords(job.text, job.title);
  const tailored = tailorResume(profile, analysis, job);

  const resumeTxt = renderText(tailored);
  const resumeMd = renderMarkdown(tailored);
  const resumeHtml = renderHTML(tailored);
  const coverLetter = renderCoverLetter(tailored, profile, job, analysis);
  const audit = auditResume(resumeTxt, analysis, tailored);
  const answers = buildAnswerPack(profile, job, tailored, analysis);

  const slug = `${slugify(job.company)}__${slugify(job.title)}__${id}`;
  const base = slugify(`${profile.name}-${job.company}-${job.title}`);
  const files = {};
  files.resumeTxt = await writeOutput(slug, `${base}-resume.txt`, resumeTxt);
  files.resumeMd = await writeOutput(slug, `${base}-resume.md`, resumeMd);
  files.resumeHtml = await writeOutput(slug, `${base}-resume.html`, resumeHtml);
  files.coverLetter = await writeOutput(slug, `${base}-cover-letter.txt`, coverLetter);
  files.answers = await writeOutput(slug, 'application-answers.json', JSON.stringify({ job: { title: job.title, company: job.company, url: job.url }, answers }, null, 2));
  files.jobDescription = await writeOutput(slug, 'job-description.txt', job.text);

  const record = {
    id,
    createdAt: new Date().toISOString(),
    status: 'ready',
    url: job.url,
    title: job.title,
    company: job.company,
    location: job.location || '',
    ats: job.ats,
    sourcedFrom: job.sourcedFrom,
    slug,
    files,
    audit: {
      overall: audit.overall, keywordScore: audit.keywordScore, formatScore: audit.formatScore,
      present: audit.present, missingButHave: audit.missingButHave, genuineGaps: audit.genuineGaps,
      requiredMissing: audit.requiredMissing, format: audit.format, recommendations: audit.recommendations,
    },
    match: tailored.match,
    topKeywords: analysis.keywords.slice(0, 20).map((k) => ({ term: k.term, weight: Math.round(k.weight * 10) / 10, required: k.required })),
    yearsAsked: analysis.years.slice(0, 5),
    preview: { resumeTxt, coverLetter, answers },
  };

  await upsertJob(record);
  return record;
}

/** Batch: many links at once, bounded concurrency so we don't hammer boards. */
export async function processBatch(inputs, profile, { concurrency = 3, onProgress } = {}) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, inputs.length) }, async () => {
    while (cursor < inputs.length) {
      const i = cursor++;
      try {
        const r = await processJob(inputs[i], profile);
        results[i] = r;
        onProgress?.({ done: results.filter(Boolean).length, total: inputs.length, record: r });
      } catch (err) {
        results[i] = { id: `err-${i}`, status: 'error', url: inputs[i].url, title: 'Failed', company: 'Unknown', reason: err.message };
        onProgress?.({ done: results.filter(Boolean).length, total: inputs.length, record: results[i] });
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function firstLine(t) {
  return String(t).split('\n').map((s) => s.trim()).find(Boolean)?.slice(0, 120) || 'Untitled role';
}
