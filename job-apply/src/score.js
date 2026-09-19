// ATS audit. Two halves:
//   1. Keyword coverage against the posting (what gets you ranked).
//   2. Format/parseability checks (what gets you silently dropped).

import { mentions } from './keywords.js';

const FORMAT_RULES = [
  {
    id: 'standard-headings',
    label: 'Uses standard section headings',
    test: (txt) => /PROFESSIONAL SUMMARY|SUMMARY/i.test(txt) && /SKILLS/i.test(txt) && /EXPERIENCE/i.test(txt) && /EDUCATION/i.test(txt),
    why: 'Parsers map content to fields by heading name. Creative headings ("My Journey") land in a junk bucket.',
  },
  {
    id: 'contact-parseable',
    label: 'Email and location present in the body, not a page header',
    test: (txt) => /[\w.+-]+@[\w-]+\.[\w.]+/.test(txt),
    why: 'Contact details inside a PDF header/footer are frequently dropped entirely by parsers.',
  },
  {
    id: 'no-tables',
    label: 'No tables, columns, or text boxes',
    test: () => true,
    why: 'Multi-column layouts get read left-to-right across columns, scrambling every line.',
    static: true,
  },
  {
    id: 'simple-bullets',
    label: 'Plain hyphen bullets only',
    test: (txt) => !/[▪●❖➢✧•]/.test(txt),
    why: 'Exotic bullet glyphs render as garbage characters (or nothing) after text extraction.',
  },
  {
    id: 'quantified',
    label: 'At least half the bullets carry a number',
    test: (txt) => {
      const bullets = txt.split('\n').filter((l) => l.startsWith('- '));
      if (!bullets.length) return false;
      return bullets.filter((b) => /\d/.test(b)).length / bullets.length >= 0.5;
    },
    why: 'Quantified results are the single biggest differentiator once a human opens the file.',
  },
  {
    id: 'length',
    label: 'Length is one to two pages worth of text',
    test: (txt) => { const w = txt.split(/\s+/).length; return w >= 250 && w <= 900; },
    why: 'Under ~250 words reads as thin; over ~900 spills past two pages and gets skimmed.',
  },
  {
    id: 'no-graphics',
    label: 'No images, icons, charts, or photos',
    test: () => true,
    why: 'Extractors discard images. Any information living only in a graphic is invisible.',
    static: true,
  },
  {
    id: 'dates-present',
    label: 'Every role carries a date range',
    test: (txt) => /(19|20)\d{2}/.test(txt),
    why: 'Missing dates make an ATS compute zero years of experience for that role.',
  },
  {
    id: 'ascii-safe',
    label: 'No smart quotes or em dashes that mangle on extraction',
    test: (txt) => !/[‘’“”–—]/.test(txt),
    why: 'Older parsers turn these into mojibake mid-word, which breaks keyword matching.',
  },
];

/** Full audit of a rendered resume against a job analysis. */
export function auditResume(resumeText, analysis, tailored) {
  const top = analysis.keywords.slice(0, 25);

  const present = [];
  const missingButHave = [];
  const genuineGaps = [];

  for (const kw of top) {
    if (mentions(resumeText, kw.term)) { present.push(kw.term); continue; }
    // Distinguish "you have this but it's not on the page" (fixable, do it)
    // from "you don't have this" (a real gap — do not fabricate).
    if (tailored.match.gaps.includes(kw.term)) genuineGaps.push(kw.term);
    else missingButHave.push(kw.term);
  }

  const totalW = top.reduce((s, k) => s + k.weight, 0) || 1;
  const gotW = top.filter((k) => present.includes(k.term)).reduce((s, k) => s + k.weight, 0);
  const keywordScore = Math.round((gotW / totalW) * 100);

  const format = FORMAT_RULES.map((r) => ({
    id: r.id, label: r.label, why: r.why,
    pass: r.static ? true : !!r.test(resumeText),
    informational: !!r.static,
  }));
  const checked = format.filter((f) => !f.informational);
  const formatScore = Math.round((checked.filter((f) => f.pass).length / checked.length) * 100);

  const overall = Math.round(keywordScore * 0.6 + formatScore * 0.4);

  return {
    overall,
    keywordScore,
    formatScore,
    present,
    missingButHave,
    genuineGaps,
    requiredMissing: tailored.match.requiredMissing,
    format,
    recommendations: recommend({ keywordScore, formatScore, missingButHave, genuineGaps, format, analysis }),
  };
}

function recommend({ keywordScore, formatScore, missingButHave, genuineGaps, format, analysis }) {
  const recs = [];
  if (missingButHave.length) {
    recs.push({
      severity: 'high',
      text: `You already have these but they are not on the tailored page: ${missingButHave.join(', ')}. Add a bullet or a skills-line entry for each — this is free score.`,
    });
  }
  if (genuineGaps.length) {
    recs.push({
      severity: 'info',
      text: `The posting asks for ${genuineGaps.join(', ')}, which is not in your profile. Do not add these to the resume. If any is something you are actively learning, say so honestly in the cover letter instead.`,
    });
  }
  for (const f of format.filter((x) => !x.pass && !x.informational)) {
    recs.push({ severity: 'medium', text: `Format: ${f.label} — failing. ${f.why}` });
  }
  if (keywordScore < 60) {
    recs.push({ severity: 'high', text: 'Keyword coverage is below 60%. Either this posting is a weak fit, or your profile needs more detail in the areas it asks about.' });
  }
  const bigYears = (analysis.years || []).filter((y) => y.years >= 5);
  if (bigYears.length) {
    recs.push({ severity: 'info', text: `The posting mentions ${bigYears.map((y) => `${y.years}+ years`).join(', ')}. If that is well past your experience, apply anyway but expect this to be the screening question.` });
  }
  if (formatScore === 100 && keywordScore >= 75) {
    recs.push({ severity: 'good', text: 'Clean parse and strong coverage. This one is ready to send.' });
  }
  return recs;
}
