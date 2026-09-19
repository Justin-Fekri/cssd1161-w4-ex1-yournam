// Flat-file JSON storage. Everything stays on this machine — no resume or
// personal data leaves the local filesystem.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = join(ROOT, 'data');
export const OUTPUT_DIR = join(ROOT, 'output');
const JOBS_FILE = join(DATA_DIR, 'applications.json');
const PROFILE_FILE = join(DATA_DIR, 'profile.json');

async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export async function getProfile() {
  const p = await readJson(PROFILE_FILE, null);
  if (p) return p;
  // First run: seed from the example so the UI has something to show.
  const example = await readJson(join(DATA_DIR, 'profile.example.json'), null);
  if (example) await writeJson(PROFILE_FILE, example);
  return example;
}

export const saveProfile = (p) => writeJson(PROFILE_FILE, p);
export const getJobs = () => readJson(JOBS_FILE, []);
export const saveJobs = (jobs) => writeJson(JOBS_FILE, jobs);

export async function upsertJob(job) {
  const jobs = await getJobs();
  const i = jobs.findIndex((j) => j.id === job.id);
  if (i >= 0) jobs[i] = { ...jobs[i], ...job }; else jobs.push(job);
  await saveJobs(jobs);
  return job;
}

export async function getJob(id) {
  return (await getJobs()).find((j) => j.id === id) || null;
}

export async function writeOutput(slug, filename, content) {
  const dir = join(OUTPUT_DIR, slug);
  await mkdir(dir, { recursive: true });
  const path = join(dir, filename);
  await writeFile(path, content, 'utf8');
  return path;
}

export function slugify(s) {
  return String(s || 'job').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'job';
}

export { existsSync, ROOT };
