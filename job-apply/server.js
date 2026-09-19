// Local-only HTTP server. Zero dependencies; runs on Node 18+.
// Binds to 127.0.0.1 deliberately — your resume and personal details never
// leave this machine and the server is not reachable from the network.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize as normPath } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getProfile, saveProfile, getJobs, getJob, saveJobs, upsertJob, OUTPUT_DIR } from './src/store.js';
import { processJob, processBatch } from './src/pipeline.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 4321;

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };

const json = (res, code, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) });
  res.end(payload);
};

async function readBody(req, limit = 5_000_000) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new Error('Request body too large');
    chunks.push(c);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Invalid JSON body'); }
}

// Parse a textarea of links/descriptions into pipeline inputs.
// One URL per line, or blocks separated by a line of "---" for pasted descriptions.
export function parseInputs(raw) {
  const blocks = String(raw || '').split(/^\s*---+\s*$/m).map((b) => b.trim()).filter(Boolean);
  const inputs = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const urls = lines.filter((l) => /^https?:\/\//i.test(l));
    const rest = lines.filter((l) => !/^https?:\/\//i.test(l)).join('\n');
    if (rest.length > 200) {
      // A pasted description, optionally preceded by its URL.
      inputs.push({ url: urls[0] || '', text: rest });
    } else {
      for (const u of urls) inputs.push({ url: u });
    }
  }
  return inputs;
}

const routes = {
  'GET /api/profile': async () => ({ code: 200, body: await getProfile() }),

  'POST /api/profile': async (req) => {
    const body = await readBody(req);
    if (!body || typeof body !== 'object' || !body.name) throw new Error('Profile must include at least a name.');
    await saveProfile(body);
    return { code: 200, body: { ok: true } };
  },

  'GET /api/jobs': async () => {
    const jobs = await getJobs();
    // Strip the heavy preview payload from the list view.
    return { code: 200, body: jobs.map(({ preview, ...rest }) => rest) };
  },

  'POST /api/jobs': async (req) => {
    const { input, concurrency } = await readBody(req);
    const inputs = parseInputs(input);
    if (!inputs.length) throw new Error('No job links or descriptions found in the input.');
    const profile = await getProfile();
    if (!profile) throw new Error('Set up your profile first.');
    const results = await processBatch(inputs, profile, { concurrency: Math.min(Number(concurrency) || 3, 5) });
    return { code: 200, body: results.map(({ preview, ...rest }) => rest) };
  },

  'POST /api/jobs/reprocess': async (req) => {
    const { id, text, title, company } = await readBody(req);
    const existing = await getJob(id);
    if (!existing) throw new Error('Job not found.');
    const profile = await getProfile();
    const record = await processJob({ id, url: existing.url, text, title: title || existing.title, company: company || existing.company }, profile);
    return { code: 200, body: { ...record, preview: undefined } };
  },

  'POST /api/jobs/status': async (req) => {
    const { id, status, note } = await readBody(req);
    const job = await getJob(id);
    if (!job) throw new Error('Job not found.');
    await upsertJob({ ...job, status, note: note ?? job.note, updatedAt: new Date().toISOString() });
    return { code: 200, body: { ok: true } };
  },

  'POST /api/jobs/delete': async (req) => {
    const { id } = await readBody(req);
    const jobs = await getJobs();
    await saveJobs(jobs.filter((j) => j.id !== id));
    return { code: 200, body: { ok: true } };
  },
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const key = `${req.method} ${url.pathname}`;

  try {
    if (routes[key]) {
      const { code, body } = await routes[key](req, url);
      return json(res, code, body);
    }

    // Single job detail, including the full preview.
    const m = url.pathname.match(/^\/api\/jobs\/([\w-]+)$/);
    if (req.method === 'GET' && m) {
      const job = await getJob(m[1]);
      return job ? json(res, 200, job) : json(res, 404, { error: 'Not found' });
    }

    // Serve a generated file (resume, cover letter, answers) out of output/.
    if (req.method === 'GET' && url.pathname === '/file') {
      const p = url.searchParams.get('path') || '';
      const resolved = normPath(p);
      // Contain reads to the output directory — a path outside it is rejected.
      if (!resolved.startsWith(OUTPUT_DIR)) return json(res, 403, { error: 'Forbidden' });
      const data = await readFile(resolved);
      const type = MIME[extname(resolved)] || 'application/octet-stream';
      const dl = url.searchParams.get('download') === '1';
      res.writeHead(200, {
        'Content-Type': type,
        ...(dl ? { 'Content-Disposition': `attachment; filename="${resolved.split('/').pop()}"` } : {}),
      });
      return res.end(data);
    }

    // Static assets.
    let file = url.pathname === '/' ? '/index.html' : url.pathname;
    const path = join(PUBLIC, normPath(file).replace(/^(\.\.[/\\])+/, ''));
    if (!path.startsWith(PUBLIC)) return json(res, 403, { error: 'Forbidden' });
    const info = await stat(path).catch(() => null);
    if (!info?.isFile()) return json(res, 404, { error: 'Not found' });
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    json(res, 400, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Job Apply running at http://127.0.0.1:${PORT}`);
  console.log(`  Generated files land in ./output/\n`);
});
