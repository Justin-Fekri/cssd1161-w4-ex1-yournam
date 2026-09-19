// Renderers. Three outputs per job, because different ATSes want different things:
//   .txt  - the safest possible artifact; paste into any "paste your resume" box
//   .md   - for quick human editing before you commit to a version
//   .html - single-column, print-to-PDF at Letter size, no tables/columns/images
//
// Deliberate ATS-parser choices below: standard section headings, one column,
// a hyphen bullet, no headers/footers, no text boxes, dates on the same line as
// the role, and contact details as plain lines rather than in a page header.

const SECTION = {
  summary: 'PROFESSIONAL SUMMARY',
  skills: 'SKILLS',
  experience: 'PROFESSIONAL EXPERIENCE',
  projects: 'PROJECTS',
  education: 'EDUCATION',
  certifications: 'CERTIFICATIONS',
};

function contactLines(c) {
  const line1 = [c.email, c.phone, c.location].filter(Boolean).join(' | ');
  const line2 = [c.links?.linkedin, c.links?.github, c.links?.portfolio].filter(Boolean).join(' | ');
  return [line1, line2].filter(Boolean);
}

export function renderText(r) {
  const out = [];
  out.push(r.contact.name.toUpperCase());
  if (r.targetTitle) out.push(stripTitle(r.targetTitle));
  for (const l of contactLines(r.contact)) out.push(l);
  out.push('');

  out.push(SECTION.summary);
  out.push(r.summary);
  out.push('');

  out.push(SECTION.skills);
  for (const [group, list] of Object.entries(r.skills)) {
    if (list.length) out.push(`${group}: ${list.join(', ')}`);
  }
  out.push('');

  if (r.experience.length) {
    out.push(SECTION.experience);
    for (const role of r.experience) {
      out.push(`${role.title}, ${role.company}${role.location ? ` - ${role.location}` : ''}`);
      out.push(`${role.start || ''}${role.start || role.end ? ' - ' : ''}${role.end || ''}`.trim());
      for (const b of role.bullets) out.push(`- ${b.text}`);
      out.push('');
    }
  }

  if (r.projects.length) {
    out.push(SECTION.projects);
    for (const p of r.projects) {
      out.push(`${p.name}${p.context ? ` - ${p.context}` : ''}${p.link ? ` (${p.link})` : ''}`);
      for (const b of p.bullets) out.push(`- ${b.text}`);
      out.push('');
    }
  }

  if (r.education.length) {
    out.push(SECTION.education);
    for (const e of r.education) {
      out.push(`${e.credential}${e.school ? `, ${e.school}` : ''}${e.location ? ` - ${e.location}` : ''}`);
      if (e.start || e.end) out.push(`${e.start || ''}${e.start && e.end ? ' - ' : ''}${e.end || ''}`.trim());
      for (const d of e.details || []) out.push(`- ${d}`);
      out.push('');
    }
  }

  if (r.certifications.length) {
    out.push(SECTION.certifications);
    for (const c of r.certifications) out.push(`- ${typeof c === 'string' ? c : `${c.name}${c.issuer ? `, ${c.issuer}` : ''}${c.year ? ` (${c.year})` : ''}`}`);
    out.push('');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function renderMarkdown(r) {
  const out = [];
  out.push(`# ${r.contact.name}`);
  if (r.targetTitle) out.push(`**${stripTitle(r.targetTitle)}**`);
  for (const l of contactLines(r.contact)) out.push(l);
  out.push('', `## ${SECTION.summary}`, r.summary, '', `## ${SECTION.skills}`);
  for (const [g, list] of Object.entries(r.skills)) if (list.length) out.push(`**${g}:** ${list.join(', ')}`);
  if (r.experience.length) {
    out.push('', `## ${SECTION.experience}`);
    for (const role of r.experience) {
      out.push('', `### ${role.title}, ${role.company}`);
      out.push(`${[role.location, [role.start, role.end].filter(Boolean).join(' - ')].filter(Boolean).join(' | ')}`);
      for (const b of role.bullets) out.push(`- ${b.text}`);
    }
  }
  if (r.projects.length) {
    out.push('', `## ${SECTION.projects}`);
    for (const p of r.projects) {
      out.push('', `### ${p.name}${p.context ? ` — ${p.context}` : ''}`);
      for (const b of p.bullets) out.push(`- ${b.text}`);
    }
  }
  if (r.education.length) {
    out.push('', `## ${SECTION.education}`);
    for (const e of r.education) {
      out.push('', `### ${e.credential}, ${e.school}`);
      out.push([e.location, [e.start, e.end].filter(Boolean).join(' - ')].filter(Boolean).join(' | '));
      for (const d of e.details || []) out.push(`- ${d}`);
    }
  }
  if (r.certifications.length) {
    out.push('', `## ${SECTION.certifications}`);
    for (const c of r.certifications) out.push(`- ${typeof c === 'string' ? c : c.name}`);
  }
  return out.join('\n').trim() + '\n';
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function renderHTML(r) {
  const secs = [];
  secs.push(`<section><h2>${SECTION.summary}</h2><p>${esc(r.summary)}</p></section>`);
  const skillRows = Object.entries(r.skills).filter(([, l]) => l.length)
    .map(([g, l]) => `<p><strong>${esc(g)}:</strong> ${esc(l.join(', '))}</p>`).join('');
  secs.push(`<section><h2>${SECTION.skills}</h2>${skillRows}</section>`);

  if (r.experience.length) {
    const roles = r.experience.map((role) => `
      <div class="entry">
        <p class="entry-head"><strong>${esc(role.title)}</strong>, ${esc(role.company)}<span class="dates">${esc([role.start, role.end].filter(Boolean).join(' – '))}</span></p>
        ${role.location ? `<p class="sub">${esc(role.location)}</p>` : ''}
        <ul>${role.bullets.map((b) => `<li>${esc(b.text)}</li>`).join('')}</ul>
      </div>`).join('');
    secs.push(`<section><h2>${SECTION.experience}</h2>${roles}</section>`);
  }
  if (r.projects.length) {
    const ps = r.projects.map((p) => `
      <div class="entry">
        <p class="entry-head"><strong>${esc(p.name)}</strong>${p.context ? ` — ${esc(p.context)}` : ''}${p.link ? `<span class="dates">${esc(p.link)}</span>` : ''}</p>
        <ul>${p.bullets.map((b) => `<li>${esc(b.text)}</li>`).join('')}</ul>
      </div>`).join('');
    secs.push(`<section><h2>${SECTION.projects}</h2>${ps}</section>`);
  }
  if (r.education.length) {
    const es = r.education.map((e) => `
      <div class="entry">
        <p class="entry-head"><strong>${esc(e.credential)}</strong>, ${esc(e.school)}<span class="dates">${esc([e.start, e.end].filter(Boolean).join(' – '))}</span></p>
        ${e.location ? `<p class="sub">${esc(e.location)}</p>` : ''}
        ${(e.details || []).length ? `<ul>${e.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
      </div>`).join('');
    secs.push(`<section><h2>${SECTION.education}</h2>${es}</section>`);
  }
  if (r.certifications.length) {
    secs.push(`<section><h2>${SECTION.certifications}</h2><ul>${r.certifications.map((c) => `<li>${esc(typeof c === 'string' ? c : c.name)}</li>`).join('')}</ul></section>`);
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(r.contact.name)} — ${esc(stripTitle(r.targetTitle))}</title>
<style>
  /* Single column, no floats, no tables: everything an ATS PDF parser can follow. */
  @page { size: letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; font-size: 10.5pt; line-height: 1.34;
         color: #000; background: #fff; max-width: 7.5in; margin: 0 auto; padding: 0.4in 0.3in; }
  h1 { font-size: 20pt; margin: 0 0 2px; letter-spacing: 0.4px; }
  .role-line { font-size: 11pt; margin: 0 0 4px; }
  .contact { font-size: 9.5pt; margin: 0 0 12px; }
  h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 1px;
       border-bottom: 1px solid #000; padding-bottom: 2px; margin: 14px 0 7px; }
  p { margin: 0 0 4px; }
  .entry { margin-bottom: 9px; }
  .entry-head { display: flex; justify-content: space-between; gap: 12px; }
  .dates { white-space: nowrap; font-size: 9.5pt; }
  .sub { font-size: 9.5pt; font-style: italic; margin-bottom: 3px; }
  ul { margin: 3px 0 0; padding-left: 17px; }
  li { margin-bottom: 3px; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <h1>${esc(r.contact.name)}</h1>
  <p class="role-line">${esc(stripTitle(r.targetTitle))}</p>
  <p class="contact">${contactLines(r.contact).map(esc).join('<br>')}</p>
  ${secs.join('\n')}
</body></html>`;
}

function stripTitle(t) {
  return String(t || '').split(/\s[-|–]\s/)[0].replace(/\(.*?\)/g, '').trim();
}

/**
 * Cover letter. Built from the job's own top requirements paired with the
 * candidate's strongest matching bullet, so every claim traces to the profile.
 */
export function renderCoverLetter(r, profile, job, analysis) {
  const company = job.company && job.company !== 'Unknown' ? job.company : 'your team';
  const title = stripTitle(job.title || r.targetTitle);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Pick the three best evidence bullets among those matching top JD keywords.
  const evidence = [];
  const used = new Set();
  for (const term of r.match.covered.slice(0, 8)) {
    const hit = [...(r.experience.flatMap((e) => e.bullets)), ...(r.projects.flatMap((p) => p.bullets))]
      .filter((b) => !used.has(b.text))
      .find((b) => (b.matched || []).includes(term));
    if (hit) { used.add(hit.text); evidence.push({ term, text: hit.text }); }
    if (evidence.length === 3) break;
  }

  const body = [];
  body.push(`Dear Hiring Manager,`);
  body.push('');
  body.push(`I am writing to apply for the ${title} position at ${company}. ${r.match.covered.length ? `Your posting calls for ${listify(r.match.covered.slice(0, 3))}, which is where my work has been concentrated.` : 'The role lines up closely with the work I have been doing.'}`);
  body.push('');
  if (evidence.length) {
    body.push(`A few specifics relevant to what you described:`);
    body.push('');
    for (const e of evidence) body.push(`- ${e.text}`);
    body.push('');
  }
  body.push(`${company === 'your team' ? 'This role' : `What draws me to ${company}`} ${company === 'your team' ? 'is a direct match for how I want to grow' : 'is the chance to work on problems at this scale and keep sharpening the skills above'}. I would welcome the chance to talk through how I can contribute.`);
  body.push('');
  body.push(`Thank you for your time and consideration.`);
  body.push('');
  body.push('Sincerely,');
  body.push(profile.name);
  const contact = [profile.email, profile.phone].filter(Boolean).join(' | ');
  if (contact) body.push(contact);

  const header = [profile.name, [profile.location].filter(Boolean).join(''), [profile.email, profile.phone].filter(Boolean).join(' | '), '', today, '', company !== 'your team' ? `${company} - Hiring Team` : '', ''].filter((l) => l !== undefined);

  return header.join('\n').replace(/\n{3,}/g, '\n\n') + '\n' + body.join('\n') + '\n';
}

function listify(arr) {
  if (!arr?.length) return '';
  if (arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
}
