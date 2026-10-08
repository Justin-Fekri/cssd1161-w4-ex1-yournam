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

// ---------- Tailoring ----------

$("#addAll").checked = store.get("addAllSkills", true);
$("#addAll").addEventListener("change", (e) => store.set("addAllSkills", e.target.checked));

async function runTailor(confirmedSkills = []) {
  const masterResume = $("#master").value;
  const jobPosting = $("#posting").value;
  setStatus("Tailoring... this usually takes under a minute.");
  const result = await api("/api/tailor", {
    masterResume,
    jobPosting,
    confirmedSkills,
    addAllSkills: $("#addAll").checked,
  });
  current = { result, posting: jobPosting, jobUrl: $("#jobUrl").value.trim(), confirmedSkills, contacts: null };
  renderResult();
  setStatus("Done. Review every line before you submit — you'll be asked about it in the interview.");
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
  $("#atsScore").textContent = `Estimated keyword/requirement coverage: ${r.atsScoreEstimate}/100`;
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

$("#contactsBtn").addEventListener("click", (e) =>
  busy(e.target, "Searching...", async () => {
    const r = current.result;
    const data = await api("/api/contacts", {
      company: r.company,
      jobTitle: r.jobTitle,
      jobPosting: current.posting,
      jobUrl: current.jobUrl,
    });
    current.contacts = data;
    renderContacts(data);
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

$("#saveBtn").addEventListener("click", () => {
  if (!current) return;
  const r = current.result;
  const jobs = loadJobs();
  jobs.unshift({
    id: Date.now(),
    company: r.company,
    jobTitle: r.jobTitle,
    url: current.jobUrl,
    status: "Tailored",
    applied: "",
    resume: $("#resumeOut").value,
    coverLetter: $("#coverOut").value,
    contacts: current.contacts,
  });
  saveJobs(jobs);
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
        result: { company: job.company, jobTitle: job.jobTitle, resume: job.resume, coverLetter: job.coverLetter, matchedKeywords: [], gaps: [], atsScoreEstimate: "—", notes: "" },
        posting: "",
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
