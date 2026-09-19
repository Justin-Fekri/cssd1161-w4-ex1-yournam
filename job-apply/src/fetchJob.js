// Fetch a job posting and reduce it to { company, title, location, text, ats }.
// Many boards block server-side fetches; when that happens the caller falls back
// to the user pasting the description text, which works just as well downstream.

import { normalize } from './keywords.js';

// Which applicant tracking system is behind this URL. Determines both how hard
// the page is to fetch and which autofill selector set applies.
export const ATS_PROFILES = {
  greenhouse: {
    label: 'Greenhouse',
    match: /greenhouse\.io|boards\.greenhouse|job-boards\.greenhouse/i,
    fetchable: true,
    aiScreening: 'Keyword + recruiter review. Greenhouse itself does not auto-reject; some employers bolt on AI scoring.',
    autofill: true,
    notes: 'Parses PDF and DOCX resumes reliably. Single-column text wins here.',
  },
  lever: {
    label: 'Lever',
    match: /jobs\.lever\.co|lever\.co/i,
    fetchable: true,
    aiScreening: 'Keyword search + recruiter review. Resume text is fully parsed and searchable.',
    autofill: true,
    notes: 'Auto-parses the resume into the form. Verify the parsed fields before submitting.',
  },
  ashby: {
    label: 'Ashby',
    match: /jobs\.ashbyhq\.com|ashbyhq\.com/i,
    fetchable: true,
    aiScreening: 'Built-in AI-assisted candidate ranking on some plans.',
    autofill: true,
    notes: 'Heavy client-side rendering; autofill needs the browser, not a plain fetch.',
  },
  workday: {
    label: 'Workday',
    match: /myworkdayjobs\.com|workday\.com/i,
    fetchable: false,
    aiScreening: 'Strict structured-field matching. Knockout questions auto-reject before a human ever looks.',
    autofill: true,
    notes: 'Requires an account per employer. Answer knockout questions (work auth, relocation, salary) carefully — they are hard filters.',
  },
  taleo: {
    label: 'Taleo',
    match: /taleo\.net|tbe\.taleo/i,
    fetchable: false,
    aiScreening: 'Classic keyword-and-score ATS. Literal keyword matching; graphics and tables break its parser.',
    autofill: false,
    notes: 'The most format-sensitive ATS in wide use. Use the plain-text resume here.',
  },
  icims: {
    label: 'iCIMS',
    match: /icims\.com/i,
    fetchable: false,
    aiScreening: 'Keyword scoring plus optional AI matching add-on.',
    autofill: false,
    notes: 'Resume parser is dated — keep headings standard and avoid special characters.',
  },
  smartrecruiters: {
    label: 'SmartRecruiters',
    match: /smartrecruiters\.com/i,
    fetchable: true,
    aiScreening: 'Offers an AI ranking engine that scores applicants against the posting.',
    autofill: true,
    notes: 'Keyword coverage against the posting directly drives your rank.',
  },
  workable: {
    label: 'Workable',
    match: /workable\.com|apply\.workable/i,
    fetchable: true,
    aiScreening: 'AI candidate scoring is a standard feature.',
    autofill: true,
    notes: 'Scores against the posting text — mirror its exact vocabulary.',
  },
  bamboohr: { label: 'BambooHR', match: /bamboohr\.com/i, fetchable: true, aiScreening: 'Mostly manual review.', autofill: true, notes: 'Small-company ATS; a human usually reads everything.' },
  jazzhr: { label: 'JazzHR', match: /applytojob\.com|jazzhr\.com/i, fetchable: true, aiScreening: 'Keyword matching.', autofill: true, notes: '' },
  linkedin: {
    label: 'LinkedIn',
    match: /linkedin\.com/i,
    fetchable: false,
    aiScreening: 'LinkedIn ranks you against other applicants and shows the employer a "top applicant" flag.',
    autofill: false,
    notes: 'Easy Apply must be done in your logged-in session. Your LinkedIn profile text is screened as heavily as the resume.',
  },
  indeed: { label: 'Indeed', match: /indeed\.com/i, fetchable: false, aiScreening: 'Indeed applies its own matching score and screener questions.', autofill: false, notes: 'Screener questions are hard knockouts. Log in and apply in-session.' },
  generic: { label: 'Company site / unknown', match: /.^/, fetchable: true, aiScreening: 'Unknown — assume keyword parsing at minimum.', autofill: false, notes: 'Treat as a strict parser: plain formatting, standard headings.' },
};

export function detectATS(url = '') {
  for (const [key, p] of Object.entries(ATS_PROFILES)) {
    if (key !== 'generic' && p.match.test(url)) return { key, ...p };
  }
  return { key: 'generic', ...ATS_PROFILES.generic };
}

// Minimal HTML -> readable text. Keeps block structure so heading detection works.
export function htmlToText(html) {
  let s = normalize(html);
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, '\n');
  s = s.replace(/<(p|div|li|h[1-6]|tr)[^>]*>/gi, '\n');
  s = s.replace(/<li[^>]*>/gi, '\n- ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  s = s.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
  return s.replace(/\n{3,}/g, '\n\n');
}

function decodeEntities(s) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', hellip: '...', bull: '-', middot: '-' };
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (named[n.toLowerCase()] !== undefined ? named[n.toLowerCase()] : m));
}

// Pull structured facts out of embedded JSON-LD, which most boards publish.
function fromJsonLd(html) {
  const out = {};
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let data;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const nodes = Array.isArray(data) ? data : [data];
    for (const node of nodes) {
      if (!node || node['@type'] !== 'JobPosting') continue;
      out.title = out.title || node.title;
      out.company = out.company || node.hiringOrganization?.name;
      const loc = node.jobLocation;
      const addr = (Array.isArray(loc) ? loc[0] : loc)?.address;
      if (addr && !out.location) {
        out.location = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', ');
      }
      if (node.description && !out.text) out.text = htmlToText(node.description);
      if (node.employmentType && !out.employmentType) out.employmentType = String(node.employmentType);
    }
  }
  return out;
}

function guessTitle(html, text) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og) return decodeEntities(og[1]).trim();
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) return decodeEntities(t[1]).replace(/\s+/g, ' ').trim();
  return text.split('\n')[0] || 'Unknown role';
}

function guessCompany(html, url) {
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
  if (og) return decodeEntities(og[1]).trim();
  // Board URLs embed the company slug: boards.greenhouse.io/acme/jobs/123
  const m = url.match(/(?:greenhouse\.io|lever\.co|ashbyhq\.com|applytojob\.com)\/([^/?#]+)/i);
  if (m) return m[1].replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  try {
    const host = new URL(url).hostname.replace(/^www\.|^jobs\.|^careers\./, '');
    return host.split('.')[0].replace(/\b\w/g, (c) => c.toUpperCase());
  } catch { return 'Unknown'; }
}

/**
 * Fetch and parse a posting. Never throws — returns { ok, needsPaste, ... } so
 * the UI can fall back to a pasted description instead of dead-ending.
 */
export async function fetchJob(url, { timeoutMs = 20000 } = {}) {
  const ats = detectATS(url);
  const base = { url, ats: { key: ats.key, label: ats.label, aiScreening: ats.aiScreening, autofill: ats.autofill, notes: ats.notes } };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) {
      return { ...base, ok: false, needsPaste: true, reason: `Site returned HTTP ${res.status}. Paste the job description text instead.` };
    }
    const html = await res.text();
    const ld = fromJsonLd(html);
    const text = ld.text && ld.text.length > 400 ? ld.text : htmlToText(html);

    if (text.replace(/\s/g, '').length < 400) {
      return { ...base, ok: false, needsPaste: true, reason: 'Page is JavaScript-rendered or gated. Paste the job description text instead.' };
    }
    return {
      ...base,
      ok: true,
      title: ld.title || guessTitle(html, text),
      company: ld.company || guessCompany(html, url),
      location: ld.location || '',
      employmentType: ld.employmentType || '',
      text,
    };
  } catch (err) {
    const reason = err.name === 'AbortError'
      ? 'Request timed out. Paste the job description text instead.'
      : `Could not reach the page (${err.message}). Paste the job description text instead.`;
    return { ...base, ok: false, needsPaste: true, reason };
  } finally {
    clearTimeout(timer);
  }
}
