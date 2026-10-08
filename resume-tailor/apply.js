// Opens a job application in a real browser window on this computer, fills in
// the candidate's details, and attaches the tailored resume and cover letter.
// The window stays open so the candidate can answer any screening questions
// and click Submit.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
// Persistent profile: job-site logins survive between runs.
const PROFILE_DIR = path.join(here, ".browser-profile");
const executablePath = process.env.CHROMIUM_PATH || undefined;

let context = null;

async function getContext() {
  if (context) return context;
  context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: process.env.HEADLESS === "1",
    executablePath,
    viewport: null,
  });
  context.on("close", () => (context = null));
  return context;
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}

async function textToPdf(text, file) {
  const browser = await chromium.launch({ executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<pre style="white-space:pre-wrap;font:11pt Calibri,Arial,sans-serif;margin:0">${escapeHtml(text)}</pre>`,
    );
    await page.pdf({ path: file, format: "Letter", margin: { top: "0.6in", bottom: "0.6in", left: "0.6in", right: "0.6in" } });
  } finally {
    await browser.close();
  }
}

function slug(s) {
  return s.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
}

// Runs inside the application page: fills empty fields whose label matches the profile.
function fillFields(values) {
  const rules = [
    ["firstName", /first.?name|given.?name|^first$/i],
    ["lastName", /last.?name|family.?name|surname|^last$/i],
    ["fullName", /full.?name|^name$|your name|legal name/i],
    ["email", /e-?mail/i],
    ["phone", /phone|mobile|cell/i],
    ["linkedin", /linkedin/i],
    ["github", /github/i],
    ["website", /website|portfolio|personal.?site|url/i],
    ["location", /location|city|current.?address|where.*based/i],
    ["coverLetter", /cover.?letter/i],
  ];
  const labelFor = (el) => {
    const labelledBy = el.getAttribute("aria-labelledby");
    const parts = [
      el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent,
      el.closest("label")?.textContent,
      labelledBy && document.getElementById(labelledBy)?.textContent,
      el.getAttribute("aria-label"),
      el.placeholder,
      el.name,
      el.id,
    ];
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  };
  const setValue = (el, v) => {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v); // works with React-controlled inputs
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const filled = [];
  const unfilledRequired = [];
  const fields = document.querySelectorAll(
    'input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]):not([type=submit]), textarea',
  );
  for (const el of fields) {
    if (el.disabled || el.readOnly || el.offsetParent === null) continue;
    const label = labelFor(el);
    if (!el.value) {
      const rule = rules.find(([key, re]) => values[key] && re.test(label) && !(key === "website" && /linkedin|github/i.test(label)));
      if (rule) {
        setValue(el, values[rule[0]]);
        filled.push(label.slice(0, 60));
      }
    }
    if (!el.value && (el.required || el.getAttribute("aria-required") === "true")) unfilledRequired.push(label.slice(0, 80) || "(unlabelled field)");
  }
  document.querySelectorAll("select").forEach((el) => {
    if ((el.required || el.getAttribute("aria-required") === "true") && !el.value) unfilledRequired.push(labelFor(el).slice(0, 80));
  });
  return { filled, unfilledRequired };
}

async function attachFiles(page, resumePdf, coverPdf) {
  const attached = [];
  const inputs = await page.locator('input[type="file"]').all();
  for (const [i, input] of inputs.entries()) {
    const label = await input.evaluate((el) => {
      const near = el.closest("fieldset, .field, [class*=field], [class*=upload], div")?.textContent || "";
      return [el.name, el.id, el.getAttribute("aria-label"), near].join(" ");
    });
    const isCover = /cover/i.test(label) && !/resume|cv\b/i.test(label.split(/cover/i)[0].slice(-40));
    const file = isCover ? coverPdf : /resume|cv\b/i.test(label) || i === 0 ? resumePdf : null;
    if (!file) continue;
    await input.setInputFiles(file).then(
      () => attached.push(isCover ? "cover letter" : "resume"),
      () => {},
    );
  }
  return attached;
}

async function hasForm(page) {
  return page.evaluate(() => document.querySelectorAll('input[type="file"], input[type="email"], input[name*="name" i]').length > 1);
}

export async function startApplication({ url, profile, resume, coverLetter, company, jobTitle }) {
  if (!/^https?:\/\//i.test(url || "")) throw Object.assign(new Error("A posting URL starting with http(s) is required to apply."), { status: 400 });

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-tailor-"));
  const base = slug(`${profile.fullName || "Resume"}_${company}`);
  const resumePdf = path.join(dir, `${base}_Resume.pdf`);
  const coverPdf = path.join(dir, `${base}_Cover_Letter.pdf`);
  await textToPdf(resume, resumePdf);
  await textToPdf(coverLetter, coverPdf);

  const ctx = await getContext();
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

  // Many postings show the description first; click through to the form.
  if (!(await hasForm(page))) {
    const applyBtn = page.getByRole("link", { name: /apply/i }).or(page.getByRole("button", { name: /apply/i })).first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    }
  }

  const [firstName, ...rest] = (profile.fullName || "").trim().split(/\s+/);
  const values = { ...profile, firstName, lastName: rest.join(" "), coverLetter };

  // Application forms are often embedded in an iframe (e.g. Greenhouse on a company site).
  const result = { filled: [], unfilledRequired: [], attached: [] };
  for (const frame of page.frames()) {
    const r = await frame.evaluate(fillFields, values).catch(() => null);
    if (!r) continue;
    result.filled.push(...r.filled);
    result.unfilledRequired.push(...r.unfilledRequired);
  }
  result.attached = await attachFiles(page, resumePdf, coverPdf);
  for (const frame of page.frames().slice(1)) {
    result.attached.push(...(await attachFiles(frame, resumePdf, coverPdf).catch(() => [])));
  }

  await page.bringToFront();
  return { ...result, pageUrl: page.url(), jobTitle, company, resumePdf, coverPdf };
}
