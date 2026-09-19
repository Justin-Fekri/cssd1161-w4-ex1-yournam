const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const api = async (path, opts = {}) => {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
};

let jobs = [];

// ---------- tabs ----------
document.querySelectorAll('.tab').forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${t.dataset.view}`));
  };
});

// ---------- profile ----------
async function loadProfile() {
  const p = await api('/api/profile');
  $('#profileJson').value = JSON.stringify(p, null, 2);
}
$('#saveProfile').onclick = async () => {
  try {
    const parsed = JSON.parse($('#profileJson').value);
    await api('/api/profile', { method: 'POST', body: JSON.stringify(parsed) });
    $('#profileStatus').textContent = 'Saved. Re-process jobs to pick up the changes.';
  } catch (e) {
    $('#profileStatus').textContent = `Not saved: ${e.message}`;
  }
};

// ---------- batch processing ----------
$('#run').onclick = async () => {
  const input = $('#links').value.trim();
  if (!input) return;
  const btn = $('#run');
  btn.disabled = true;
  $('#runStatus').textContent = 'Reading postings and tailoring... this takes a few seconds per job.';
  try {
    const results = await api('/api/jobs', { method: 'POST', body: JSON.stringify({ input }) });
    $('#runStatus').textContent = `Done — ${results.length} job${results.length === 1 ? '' : 's'} processed.`;
    $('#links').value = '';
    await refresh();
    document.querySelector('.tab[data-view="queue"]').click();
  } catch (e) {
    $('#runStatus').textContent = `Error: ${e.message}`;
  } finally {
    btn.disabled = false;
  }
};

// ---------- queue ----------
const scoreClass = (n) => (n >= 75 ? 's-good' : n >= 55 ? 's-warn' : 's-bad');

function card(j) {
  const c = el('div', 'card');
  const top = el('div', 'card-top');
  const left = el('div');
  left.append(el('h3', null, esc(j.title || 'Untitled role')));
  left.append(el('div', 'co', `${esc(j.company || 'Unknown')}${j.location ? ' &middot; ' + esc(j.location) : ''}`));
  top.append(left);

  if (j.audit) {
    const s = el('div', 'score');
    s.innerHTML = `<div class="num ${scoreClass(j.audit.overall)}">${j.audit.overall}</div><div class="lbl">ATS match</div>`;
    top.append(s);
  }
  c.append(top);

  const chips = el('div', 'chips');
  if (j.ats) chips.append(el('span', 'chip ats', esc(j.ats.label)));
  chips.append(el('span', `chip status-pill st-${j.status}`, esc(j.status)));
  (j.audit?.present || []).slice(0, 7).forEach((k) => chips.append(el('span', 'chip hit', esc(k))));
  (j.audit?.genuineGaps || []).slice(0, 4).forEach((k) => chips.append(el('span', 'chip gap', esc(k) + ' (gap)')));
  c.append(chips);

  if (j.blocked) {
    c.append(el('div', 'muted', `<br>${esc(j.reason || '')} Open this job and paste the description text.`));
  }

  const acts = el('div', 'card-actions');
  const detail = el('button', 'ghost', 'Open package');
  detail.onclick = () => openDrawer(j.id);
  acts.append(detail);

  if (j.url) {
    const open = el('button', 'ghost', 'Open posting');
    open.onclick = () => window.open(j.url, '_blank', 'noopener');
    acts.append(open);
  }
  if (j.files?.resumeHtml) {
    const pdf = el('button', 'ghost', 'Resume (print to PDF)');
    pdf.onclick = () => {
      const w = window.open(`/file?path=${encodeURIComponent(j.files.resumeHtml)}`, '_blank');
      if (w) w.addEventListener('load', () => w.print(), { once: true });
    };
    acts.append(pdf);
  }
  if (j.status !== 'applied') {
    const done = el('button', 'ghost', 'Mark applied');
    done.onclick = async () => { await api('/api/jobs/status', { method: 'POST', body: JSON.stringify({ id: j.id, status: 'applied' }) }); refresh(); };
    acts.append(done);
  }
  const del = el('button', 'ghost', 'Remove');
  del.onclick = async () => { await api('/api/jobs/delete', { method: 'POST', body: JSON.stringify({ id: j.id }) }); refresh(); };
  acts.append(del);

  c.append(acts);
  return c;
}

async function refresh() {
  jobs = await api('/api/jobs');
  const q = $('#queue');
  q.innerHTML = '';
  jobs.slice().reverse().forEach((j) => q.append(card(j)));
  $('#empty').style.display = jobs.length ? 'none' : 'block';
  const applied = jobs.filter((j) => j.status === 'applied').length;
  const avg = jobs.filter((j) => j.audit).reduce((s, j, _, a) => s + j.audit.overall / a.length, 0);
  $('#stats').textContent = `${jobs.length} jobs · ${applied} applied${avg ? ` · avg match ${Math.round(avg)}` : ''}`;
}

// ---------- detail drawer ----------
$('#closeDrawer').onclick = () => { $('#drawer').hidden = true; };
$('#drawer').onclick = (e) => { if (e.target.id === 'drawer') $('#drawer').hidden = true; };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#drawer').hidden = true; });

function copyBtn(text) {
  const b = el('button', 'ghost copy', 'Copy');
  b.onclick = async () => { await navigator.clipboard.writeText(text); b.textContent = 'Copied'; setTimeout(() => (b.textContent = 'Copy'), 1400); };
  return b;
}

async function openDrawer(id) {
  const j = await api(`/api/jobs/${id}`);
  const b = $('#drawerBody');
  b.innerHTML = '';
  b.append(el('h2', null, esc(j.title || 'Untitled')));
  b.append(el('div', 'co muted', `${esc(j.company)}${j.location ? ' · ' + esc(j.location) : ''}${j.ats ? ' · ' + esc(j.ats.label) : ''}`));

  if (j.blocked) {
    b.append(el('h4', null, 'Paste the job description'));
    b.append(el('div', 'muted', esc(j.reason || '')));
    const ta = el('textarea');
    ta.rows = 12;
    ta.placeholder = 'Paste the full job description text here, then press Process.';
    b.append(ta);
    const go = el('button', 'primary', 'Process');
    go.style.marginTop = '12px';
    go.onclick = async () => {
      go.disabled = true; go.textContent = 'Processing...';
      try { await api('/api/jobs/reprocess', { method: 'POST', body: JSON.stringify({ id: j.id, text: ta.value }) }); $('#drawer').hidden = true; refresh(); }
      catch (e) { go.textContent = e.message; go.disabled = false; }
    };
    b.append(go);
    $('#drawer').hidden = false;
    return;
  }

  // How this employer screens
  if (j.ats) {
    b.append(el('h4', null, 'How this application is screened'));
    b.append(el('div', 'rec info', `<strong>${esc(j.ats.label)}.</strong> ${esc(j.ats.aiScreening)}${j.ats.notes ? ' ' + esc(j.ats.notes) : ''}`));
  }

  // Scores
  b.append(el('h4', null, 'ATS audit'));
  const a = j.audit;
  b.append(el('div', 'muted', `Overall <strong class="${scoreClass(a.overall)}">${a.overall}</strong> &nbsp;·&nbsp; keyword coverage ${a.keywordScore} &nbsp;·&nbsp; format ${a.formatScore}`));
  a.recommendations.forEach((r) => b.append(el('div', `rec ${r.severity}`, esc(r.text))));

  const checks = el('ul', 'checks');
  a.format.forEach((f) => {
    const li = el('li', f.pass ? 'ok' : 'no', `${esc(f.label)}<span class="why">${esc(f.why)}</span>`);
    checks.append(li);
  });
  b.append(checks);

  // Keywords
  b.append(el('h4', null, 'What the posting weighted most'));
  const kw = el('div', 'chips');
  (j.topKeywords || []).forEach((k) => {
    const hit = a.present.includes(k.term);
    kw.append(el('span', `chip ${hit ? 'hit' : 'gap'}`, `${esc(k.term)}${k.required ? ' *' : ''}`));
  });
  b.append(kw);
  b.append(el('div', 'muted', '<br>* marked required in the posting. Red = not on your resume.'));

  // Resume
  const h = el('h4', null, 'Tailored resume (plain text — safest for any ATS)');
  h.append(copyBtn(j.preview.resumeTxt));
  b.append(h);
  b.append(el('pre', 'doc', esc(j.preview.resumeTxt)));

  // Cover letter
  const h2 = el('h4', null, 'Cover letter');
  h2.append(copyBtn(j.preview.coverLetter));
  b.append(h2);
  b.append(el('pre', 'doc', esc(j.preview.coverLetter)));

  // Answers
  b.append(el('h4', null, 'Application form answers'));
  j.preview.answers.forEach((qa) => {
    const d = el('div', 'qa');
    d.append(el('div', 'q', esc(qa.question)));
    d.append(el('div', `a${qa.answer ? '' : ' blank'}`, qa.answer ? esc(qa.answer) : 'Blank — fill this in your profile.'));
    if (qa.answer) d.append(copyBtn(qa.answer));
    b.append(d);
  });

  b.append(el('h4', null, 'Files on disk'));
  const list = el('div', 'muted');
  Object.entries(j.files || {}).forEach(([k, p]) => {
    const link = el('div', null, `<a href="/file?path=${encodeURIComponent(p)}&download=1">${esc(k)}</a> — <code>${esc(p)}</code>`);
    list.append(link);
  });
  b.append(list);

  $('#drawer').hidden = false;
  b.parentElement.scrollTop = 0;
}

loadProfile().catch(() => {});
refresh().catch(() => {});
