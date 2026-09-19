// Tailoring engine.
//
// Hard rule enforced throughout this file: nothing is ever added to the resume
// that is not already in the profile. Tailoring here means selecting, ordering,
// and surfacing real experience against what the posting actually asks for.
// Anything the posting wants that the profile lacks is reported as a gap, never
// invented.

import { SKILLS, mentions } from './keywords.js';

const ALL_TERMS = Object.keys(SKILLS);

/** Every canonical skill the profile can legitimately claim. */
export function profileSkillSet(profile) {
  const found = new Set();
  const declared = Object.values(profile.skills || {}).flat().map(String);
  for (const term of ALL_TERMS) {
    if (declared.some((d) => d.toLowerCase() === term.toLowerCase())) { found.add(term); continue; }
    if (declared.some((d) => mentions(d, term))) { found.add(term); continue; }
  }
  // Skills demonstrated in bullets count even if not listed in the skills block.
  for (const b of allBullets(profile)) {
    for (const t of b.tags || []) if (ALL_TERMS.includes(t)) found.add(t);
    for (const term of ALL_TERMS) if (mentions(b.text, term)) found.add(term);
  }
  return found;
}

function allBullets(profile) {
  const out = [];
  for (const role of profile.experience || []) for (const b of role.bullets || []) out.push(b);
  for (const p of profile.projects || []) for (const b of p.bullets || []) out.push(b);
  return out;
}

/** Score one bullet against the weighted JD keywords. */
function scoreBullet(bullet, keywords) {
  let score = 0;
  const matched = [];
  for (const kw of keywords) {
    const inTags = (bullet.tags || []).some((t) => t.toLowerCase() === kw.term.toLowerCase());
    const inText = mentions(bullet.text, kw.term);
    if (!inTags && !inText) continue;
    // A tag is an explicit author assertion; text match is weaker evidence.
    score += kw.weight * (inTags ? 1 : 0.7);
    matched.push(kw.term);
  }
  // Quantified bullets outperform vague ones with both parsers and humans.
  if (/\d/.test(bullet.text)) score += 1.5;
  if (/\b(\d+%|\$\d|\d+x)\b/i.test(bullet.text)) score += 1.5;
  return { score, matched };
}

/**
 * Produce a tailored resume payload for one job.
 * opts.maxBulletsPerRole caps length; opts.minBulletsPerRole keeps roles credible.
 */
export function tailorResume(profile, analysis, job, opts = {}) {
  const { maxBulletsPerRole = 4, minBulletsPerRole = 2, maxProjects = 2, maxSkillsPerGroup = 10 } = opts;
  const keywords = analysis.keywords;
  const have = profileSkillSet(profile);

  // --- Experience: keep every role, choose and order the bullets within it. ---
  const experience = (profile.experience || []).map((role) => {
    const scored = (role.bullets || []).map((b, i) => ({ ...b, ...scoreBullet(b, keywords), _i: i }));
    const ranked = [...scored].sort((a, b) => b.score - a.score || a._i - b._i);
    const keep = Math.min(Math.max(minBulletsPerRole, maxBulletsPerRole), scored.length);
    const chosen = ranked.slice(0, keep);
    // Lead with the highest-scoring bullet, then restore chronology for the rest
    // so the role still reads as a coherent story.
    const [lead, ...rest] = chosen;
    const ordered = lead ? [lead, ...rest.sort((a, b) => a._i - b._i)] : [];
    return { ...role, bullets: ordered, roleScore: chosen.reduce((s, b) => s + b.score, 0) };
  });

  // --- Projects: only the most relevant ones survive, ranked. ---
  const projects = (profile.projects || [])
    .map((p) => {
      const scored = (p.bullets || []).map((b, i) => ({ ...b, ...scoreBullet(b, keywords), _i: i }));
      return { ...p, bullets: scored.sort((a, b) => b.score - a.score || a._i - b._i).slice(0, 3), projScore: scored.reduce((s, b) => s + b.score, 0) };
    })
    .sort((a, b) => b.projScore - a.projScore)
    .slice(0, maxProjects);

  // --- Skills: matched skills first, within their original groups. ---
  const wanted = new Map(keywords.map((k) => [k.term.toLowerCase(), k.weight]));
  const skills = {};
  for (const [group, list] of Object.entries(profile.skills || {})) {
    const ranked = [...list].sort((a, b) => (wanted.get(String(b).toLowerCase()) || 0) - (wanted.get(String(a).toLowerCase()) || 0));
    skills[group] = ranked.slice(0, maxSkillsPerGroup);
  }

  // --- Coverage: what the posting wants vs. what the profile can honestly claim. ---
  const top = keywords.slice(0, 25);
  const covered = top.filter((k) => have.has(k.term));
  const gaps = top.filter((k) => !have.has(k.term));
  const coverage = top.length ? Math.round((covered.reduce((s, k) => s + k.weight, 0) / top.reduce((s, k) => s + k.weight, 0)) * 100) : 0;

  const usedBullets = new Set([
    ...experience.flatMap((r) => r.bullets.map((b) => b.text)),
    ...projects.flatMap((p) => p.bullets.map((b) => b.text)),
  ]);
  const summary = buildSummary(profile, job, covered, usedBullets);

  return {
    job,
    targetTitle: job.title || profile.headline,
    summary,
    skills,
    experience,
    projects,
    education: profile.education || [],
    certifications: profile.certifications || [],
    contact: {
      name: profile.name, email: profile.email, phone: profile.phone,
      location: profile.location, links: profile.links || {},
    },
    match: {
      coverage,
      covered: covered.map((k) => k.term),
      gaps: gaps.map((k) => k.term),
      requiredMissing: (analysis.required || []).filter((t) => !have.has(t)),
      years: analysis.years,
    },
  };
}

// The summary is the one place a resume gets to answer "why you, for this role".
// It is assembled only from facts already in the profile.
function buildSummary(profile, job, covered, usedBullets) {
  const title = job.title ? cleanTitle(job.title) : profile.headline || 'Software Developer';
  const topSkills = covered.slice(0, 6).map((k) => k.term);
  const years = totalYears(profile);

  const parts = [];
  parts.push(`${profile.headline || title} with hands-on experience in ${listify(topSkills.slice(0, 4)) || 'software development'}`);
  if (years >= 1) parts.push(`across ${years}+ year${years > 1 ? 's' : ''} of applied work`);
  // Quantified proof, but never a sentence that already appears as a bullet —
  // repeating it wastes the summary and reads as padding.
  const proof = strongestMetricBullet(profile, usedBullets);
  let s = parts.join(' ') + '.';
  if (proof) s += ` ${proof}`;
  if (topSkills.length > 4) s += ` Additional strengths in ${listify(topSkills.slice(4, 7))}.`;
  s += ` Seeking the ${title} role${job.company && job.company !== 'Unknown' ? ` at ${job.company}` : ''}.`;
  return s.replace(/\s+/g, ' ').trim();
}

function cleanTitle(t) {
  return String(t).split(/\s[-|–]\s/)[0].replace(/\(.*?\)/g, '').trim();
}

function listify(arr) {
  if (!arr || !arr.length) return '';
  if (arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
}

function totalYears(profile) {
  const years = (profile.experience || [])
    .map((r) => {
      const a = parseYear(r.start), b = /present|current/i.test(r.end || '') ? new Date().getFullYear() : parseYear(r.end);
      return a && b ? Math.max(0, b - a) : 0;
    })
    .reduce((s, y) => s + y, 0);
  return years;
}

function parseYear(s) {
  const m = String(s || '').match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : 0;
}

function strongestMetricBullet(profile, usedBullets = new Set()) {
  const withMetric = allBullets(profile)
    .filter((b) => !usedBullets.has(b.text))
    .filter((b) => /\d+\s*%|\$\s?\d|\b\d{2,}\b|\b\d+x\b/i.test(b.text));
  if (!withMetric.length) return '';
  return withMetric.sort((a, b) => b.text.length - a.text.length)[0].text;
}
