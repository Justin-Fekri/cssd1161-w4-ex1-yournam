const $ = (sel) => document.querySelector(sel);

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: app still works for this session */
    }
  },
};

let current = null; // { result, posting, jobUrl, confirmedSkills }

// ---------- API ----------

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function setStatus(msg, isError = false) {
  const el = $("#status");
  el.textContent = msg;
  el.classList.toggle("error", isError);
}

async function busy(button, label, fn) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = label;
  try {
    await fn();
  } catch (err) {
    setStatus(err.message, true);
    alert(err.message);
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

// ---------- Master resume ----------

$("#master").value = store.get("masterResume", "");
$("#master").addEventListener("input", (e) => store.set("masterResume", e.target.value));
$("#masterFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $("#master").value = await file.text();
  store.set("masterResume", $("#master").value);
});

// ---------- Profile (for application forms) ----------

const profile = store.get("profile", {});
document.querySelectorAll("[data-profile]").forEach((el) => {
  el.value = profile[el.dataset.profile] || "";
  el.addEventListener("input", () => {
    profile[el.dataset.profile] = el.value.trim();
    store.set("profile", profile);
  });
});
if (!profile.fullName) $("#profileBox").open = true;

// ---------- Tailoring ----------

$("#addAll").checked = store.get("addAllSkills", true);
$("#addAll").addEventListener("change", (e) => store.set("addAllSkills", e.target.checked));

async function runTailor(confirmedSkills = []) {
  const masterResume = $("#master").value;
  const jobPosting = $("#posting").value;
  setStatus("Tailoring, scoring and rewriting until it scores 95+... this takes about 2–5 minutes.");
  const result = await api("/api/tailor", {
    masterResume,
    jobPosting,
    confirmedSkills,
    addAllSkills: $("#addAll").checked,
  });
  current = { result, posting: jobPosting, jobUrl: $("#jobUrl").value.trim(), confirmedSkills, contacts: null };
  renderResult();
  setStatus("Done. Finding the recruiter and hiring manager...");
  findContacts().then(
    () => setStatus("Done. Resume, cover letter and contacts are ready."),
    (err) => setStatus(`Resume ready. Contact search failed: ${err.message}`, true),
  );
}

$("#tailorBtn").addEventListener("click", (e) => busy(e.target, "Working...", () => runTailor()));

$("#regenBtn").addEventListener("click", (e) => {
  const ticked = [...document.querySelectorAll("#gapList input:checked")].map((i) => i.value);
  const confirmed = [...new Set([...(current?.confirmedSkills || []), ...ticked])];
  busy(e.target, "Regenerating...", () => runTailor(confirmed));
});

function renderResult() {
  const r = current.result;
  $("#results").hidden = false;
  $("#resultTitle").textContent = `${r.jobTitle} — ${r.company}`;
  renderScore(r.atsScore, r.coverLetterScore, r.history);
  $("#applyResult").hidden = true;
  $("#resumeOut").value = r.resume;
  $("#coverOut").value = r.coverLetter;
  $("#keywords").textContent = r.matchedKeywords.join(", ");
  $("#notes").textContent = r.notes;
  $("#gapHint").textContent = $("#addAll").checked
    ? "These skills weren't on your master resume and have been added to this one. Learn them before the interview — each has the fastest way to get up to speed."
    : "These requirements aren't on your resume. Tick any to add them and regenerate. Each has the fastest way to get up to speed before the interview.";

  const list = $("#gapList");
  list.replaceChildren(
    ...r.gaps.map((g) => {
      const li = document.createElement("li");
      li.innerHTML = `<label><input type="checkbox" /> <strong></strong> <span class="badge"></span></label><p class="hint"></p>`;
      li.querySelector("input").value = g.skill;
      li.querySelector("strong").textContent = g.skill;
      li.querySelector(".badge").textContent = g.importance;
      li.querySelector(".badge").classList.add(g.importance);
      li.querySelector("p").textContent = `Close it fast: ${g.suggestion}`;
      return li;
    }),
  );
  if (!r.gaps.length) list.innerHTML = "<li>No gaps — your resume covers every listed requirement.</li>";

  $("#contactList").replaceChildren();
  showTab("resume");
  $("#results").scrollIntoView({ behavior: "smooth" });
}

function scoreClass(n) {
  return n >= 80 ? "good" : n >= 60 ? "mid" : "low";
}

function renderScore(score, cover, history) {
  const card = $("#scoreCard");
  card.replaceChildren();
  if (!score) return;
  const big = document.createElement("div");
  big.className = `score-big ${scoreClass(score.overall)}`;
  big.innerHTML = "<span></span><small>screening score</small>";
  big.querySelector("span").textContent = score.overall;

  const bars = document.createElement("div");
  bars.className = "score-bars";
  [
    ["Keywords", score.keywordMatch],
    ["Required skills", score.requiredSkills],
    ["Preferred skills", score.preferredSkills],
    ["Title match", score.titleAlignment],
    ["Experience", score.experienceRelevance],
    ["ATS formatting", score.formatting],
  ].forEach(([label, n]) => {
    const d = document.createElement("div");
    d.innerHTML = `<div><span></span> <strong></strong></div><div class="bar"><span></span></div>`;
    d.querySelector("span").textContent = label;
    d.querySelector("strong").textContent = n;
    d.querySelector(".bar span").style.width = `${n}%`;
    bars.append(d);
  });

  const verdict = document.createElement("p");
  verdict.className = "verdict";
  verdict.textContent = score.verdict;

  card.append(big, bars, verdict);

  if (cover) {
    const cl = document.createElement("div");
    cl.className = `score-big ${scoreClass(cover.overall)}`;
    cl.innerHTML = "<span></span><small>cover letter</small>";
    cl.querySelector("span").textContent = cover.overall;
    const clBars = document.createElement("div");
    clBars.className = "score-bars";
    [
      ["Personalization", cover.personalization],
      ["Requirement match", cover.requirementMatch],
      ["Persuasiveness", cover.persuasiveness],
      ["Clarity", cover.clarity],
    ].forEach(([label, n]) => {
      const d = document.createElement("div");
      d.innerHTML = `<div><span></span> <strong></strong></div><div class="bar"><span></span></div>`;
      d.querySelector("span").textContent = label;
      d.querySelector("strong").textContent = n;
      d.querySelector(".bar span").style.width = `${n}%`;
      clBars.append(d);
    });
    const spacer = document.createElement("p");
    spacer.className = "verdict";
    card.append(cl, clBars, spacer);
  }

  if (history?.length > 1) {
    const h = document.createElement("p");
    h.className = "verdict hint";
    h.textContent = `Optimized over ${history.length - 1} rewrite${history.length > 2 ? "s" : ""}: ` +
      history.map((x) => `${x.resume}/${x.coverLetter}`).join(" → ") + " (resume/cover letter)";
    card.append(h);
  }
  const fixes = [...(score.topFixes || []), ...(cover?.fixes || [])].slice(0, 4);
  if (fixes.length && score.overall < 100) {
    const ul = document.createElement("ul");
    fixes.forEach((f) => ul.append(Object.assign(document.createElement("li"), { textContent: f })));
    card.append(ul);
  }
}

// ---------- Applying ----------

$("#applyBtn").addEventListener("click", (e) =>
  busy(e.target, "Opening application...", async () => {
    const url = current.jobUrl || prompt("Paste the job posting / application URL:");
    if (!url) return;
    current.jobUrl = url.trim();
    const r = await api("/api/apply", {
      url: current.jobUrl,
      profile,
      resume: $("#resumeOut").value,
      coverLetter: $("#coverOut").value,
      company: current.result.company,
      jobTitle: current.result.jobTitle,
    });
    const box = $("#applyResult");
    box.hidden = false;
    box.innerHTML = `<strong>Application opened in the browser window.</strong>
      <p class="filled"></p><p class="attached"></p><p class="todo"></p>
      <p class="hint">Check the form, answer anything left, and click Submit there.</p>
      <button class="primary done">I submitted it</button>`;
    box.querySelector(".filled").textContent = `Filled: ${r.filled.join(", ") || "nothing recognised"}`;
    box.querySelector(".attached").textContent = `Attached: ${r.attached.join(", ") || "no upload field found — attach the PDFs yourself: " + r.resumePdf}`;
    box.querySelector(".todo").textContent = r.unfilledRequired.length ? `Still needs your answer: ${r.unfilledRequired.join("; ")}` : "";
    box.querySelector(".done").addEventListener("click", () => {
      const job = saveCurrent();
      job.status = "Applied";
      job.applied = new Date().toISOString().slice(0, 10);
      saveJobs(loadJobs().map((j) => (j.id === job.id ? job : j)));
      box.innerHTML = "<strong>Marked as applied.</strong> Send the outreach drafts from the Contacts tab now.";
      showTab("contacts");
    });
  }),
);

// ---------- Tabs & output actions ----------

function showTab(name) {
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.dataset.panel !== name));
}
document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

function fileSlug(name) {
  const r = current?.result;
  return [r?.company, r?.jobTitle, name].filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.copy) {
    navigator.clipboard.writeText($("#" + t.dataset.copy).value);
    t.textContent = "Copied!";
    setTimeout(() => (t.textContent = "Copy"), 1200);
  } else if (t.dataset.download) {
    const blob = new Blob([$("#" + t.dataset.download).value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileSlug(t.dataset.name) + ".txt";
    a.click();
    URL.revokeObjectURL(a.href);
  } else if (t.dataset.print) {
    const w = window.open("", "_blank");
    const pre = w.document.createElement("pre");
    pre.textContent = $("#" + t.dataset.print).value;
    w.document.title = fileSlug("");
    w.document.body.style.cssText = "font-family: Calibri, Arial, sans-serif; font-size: 11pt; margin: 0.6in;";
    pre.style.cssText = "white-space: pre-wrap; font-family: inherit; margin: 0;";
    w.document.body.append(pre);
    w.print();
  }
});

// ---------- Contacts ----------

async function findContacts() {
  const job = current;
  $("#contactList").textContent = "Searching public sources for the recruiter and hiring manager...";
  const data = await api("/api/contacts", {
    company: job.result.company,
    jobTitle: job.result.jobTitle,
    jobPosting: job.posting,
    jobUrl: job.jobUrl,
  });
  job.contacts = data;
  if (current === job) renderContacts(data);
  if (job.savedId) saveJobs(loadJobs().map((j) => (j.id === job.savedId ? { ...j, contacts: data } : j)));
}

$("#contactsBtn").addEventListener("click", (e) =>
  busy(e.target, "Searching...", () => {
    if (!current.posting) throw new Error("Paste the job posting again to search for contacts.");
    return findContacts();
  }),
);

function linkedinSearchUrl(keywords) {
  return "https://www.linkedin.com/search/results/people/?keywords=" + encodeURIComponent(keywords);
}

function renderContacts(data) {
  const r = current.result;
  const box = $("#contactList");
  box.replaceChildren();

  const searches = document.createElement("div");
  searches.className = "card";
  searches.innerHTML = "<strong>Search LinkedIn yourself</strong><ul></ul>";
  [
    [`${r.company} recruiter`, "Recruiters"],
    [`${r.company} talent acquisition`, "Talent acquisition"],
    [`${r.company} ${r.jobTitle.replace(/\b(senior|junior|sr\.?|jr\.?|i{1,3})\b/gi, "").trim()} manager`, "Likely hiring managers"],
  ].forEach(([q, label]) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = linkedinSearchUrl(q);
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = `${label}: "${q}"`;
    li.append(a);
    searches.querySelector("ul").append(li);
  });

  if (!data.contacts.length) {
    const p = document.createElement("p");
    p.textContent = "No named contacts found in public sources — use the searches below.";
    box.append(p);
  }

  data.contacts.forEach((c) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="contact-head"><strong class="n"></strong> <span class="badge conf"></span></div>
      <div class="t hint"></div>
      <p class="why"></p>
      <p class="links"></p>
      <button class="draft">Draft outreach messages</button>
      <div class="drafts"></div>`;
    card.querySelector(".n").textContent = c.name;
    card.querySelector(".conf").textContent = `${c.role.replace("_", " ")} · ${c.confidence} confidence`;
    card.querySelector(".t").textContent = c.title;
    card.querySelector(".why").textContent = c.why;
    const links = card.querySelector(".links");
    const addLink = (href, text) => {
      if (!href) return;
      const a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = text;
      links.append(a, " ");
    };
    addLink(c.linkedinUrl, "LinkedIn");
    addLink(c.sourceUrl, "Source");
    if (c.publicEmail) addLink("mailto:" + c.publicEmail, c.publicEmail);
    card.querySelector(".draft").addEventListener("click", (e) =>
      busy(e.target, "Drafting...", async () => {
        const d = await api("/api/followups", {
          contactName: c.name,
          contactRole: c.role,
          company: r.company,
          jobTitle: r.jobTitle,
          resume: $("#resumeOut").value,
        });
        const drafts = card.querySelector(".drafts");
        drafts.replaceChildren();
        [
          ["LinkedIn note", d.linkedinNote],
          ["Email", d.email],
          ["Follow-up (send after ~1 week)", d.followUp],
        ].forEach(([label, text]) => {
          const h = document.createElement("h4");
          h.textContent = label;
          const ta = document.createElement("textarea");
          ta.rows = Math.min(12, text.split("\n").length + 2);
          ta.value = text;
          drafts.append(h, ta);
        });
        if (c.publicEmail) {
          const [subjectLine, ...bodyLines] = d.email.split("\n");
          const subject = subjectLine.replace(/^subject:\s*/i, "");
          const mail = Object.assign(document.createElement("a"), {
            href: `mailto:${c.publicEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n").trim())}`,
            textContent: `Send email to ${c.publicEmail}`,
            className: "file-btn",
          });
          drafts.append(mail);
        }
        if (c.linkedinUrl) {
          const li = Object.assign(document.createElement("button"), { textContent: "Copy note & open LinkedIn" });
          li.addEventListener("click", () => {
            navigator.clipboard.writeText(d.linkedinNote);
            window.open(c.linkedinUrl, "_blank", "noopener");
          });
          drafts.append(li);
        }
      }),
    );
    box.append(card);
  });

  if (data.companyCareersContact || data.outreachTip) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = [data.companyCareersContact && `Company recruiting contact: ${data.companyCareersContact}`, data.outreachTip]
      .filter(Boolean)
      .join(" — ");
    box.append(p);
  }
  box.append(searches);
}

// ---------- Tracker ----------

const STATUSES = ["Tailored", "Applied", "Followed up", "Interview", "Offer", "Rejected"];

function loadJobs() {
  return store.get("jobs", []);
}

function saveJobs(jobs) {
  store.set("jobs", jobs);
  renderTracker();
}

function saveCurrent() {
  const r = current.result;
  const jobs = loadJobs();
  const existing = jobs.find((j) => j.id === current.savedId);
  const job = {
    ...(existing || { id: Date.now(), status: "Tailored", applied: "" }),
    company: r.company,
    jobTitle: r.jobTitle,
    url: current.jobUrl,
    posting: current.posting,
    atsScore: r.atsScore,
    coverLetterScore: r.coverLetterScore,
    resume: $("#resumeOut").value,
    coverLetter: $("#coverOut").value,
    contacts: current.contacts,
  };
  current.savedId = job.id;
  saveJobs(existing ? jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...jobs]);
  return job;
}

$("#saveBtn").addEventListener("click", () => {
  if (!current) return;
  saveCurrent();
  $("#saveBtn").textContent = "Saved ✓";
  setTimeout(() => ($("#saveBtn").textContent = "Save to tracker"), 1500);
});

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function renderTracker() {
  const body = $("#trackerBody");
  const jobs = loadJobs();
  body.replaceChildren();
  if (!jobs.length) {
    body.innerHTML = '<tr><td colspan="5" class="hint">No saved applications yet.</td></tr>';
    return;
  }
  jobs.forEach((job) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="c"></td><td class="r"></td><td><select></select></td><td class="d"></td><td class="ops"></td>`;
    tr.querySelector(".c").textContent = job.company;
    if (job.atsScore) {
      const b = Object.assign(document.createElement("span"), { className: `badge ${scoreClass(job.atsScore.overall)}`, textContent: `score ${job.atsScore.overall}` });
      tr.querySelector(".c").append(" ", b);
    }
    const role = tr.querySelector(".r");
    if (job.url) {
      const a = document.createElement("a");
      a.href = job.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = job.jobTitle;
      role.append(a);
    } else role.textContent = job.jobTitle;

    const sel = tr.querySelector("select");
    STATUSES.forEach((s) => sel.append(new Option(s, s, false, s === job.status)));
    sel.addEventListener("change", () => {
      job.status = sel.value;
      if (sel.value === "Applied" && !job.applied) job.applied = new Date().toISOString().slice(0, 10);
      saveJobs(jobs);
    });

    const d = tr.querySelector(".d");
    if (job.applied) {
      const days = daysSince(job.applied);
      d.textContent = job.applied;
      if (job.status === "Applied" && days >= 7) {
        d.append(document.createElement("br"), Object.assign(document.createElement("span"), { className: "badge required", textContent: `Follow up (${days}d)` }));
      }
    }

    const ops = tr.querySelector(".ops");
    const open = Object.assign(document.createElement("button"), { textContent: "Open" });
    open.addEventListener("click", () => {
      current = {
        result: { company: job.company, jobTitle: job.jobTitle, resume: job.resume, coverLetter: job.coverLetter, matchedKeywords: [], gaps: [], atsScore: job.atsScore, coverLetterScore: job.coverLetterScore, notes: "" },
        posting: job.posting || "",
        savedId: job.id,
        jobUrl: job.url,
        confirmedSkills: [],
        contacts: job.contacts,
      };
      renderResult();
      if (job.contacts) renderContacts(job.contacts);
    });
    const del = Object.assign(document.createElement("button"), { textContent: "Delete" });
    del.addEventListener("click", () => confirm(`Delete ${job.company}?`) && saveJobs(jobs.filter((j) => j.id !== job.id)));
    ops.append(open, del);
    body.append(tr);
  });
}

renderTracker();
