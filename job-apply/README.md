# Job Apply

Turn a pile of job links into finished, tailored application packages — a
per-job resume, a per-job cover letter, and every form answer pre-written —
so applying takes seconds each instead of half an hour.

Runs entirely on your machine. Nothing is uploaded anywhere.

---

## What it does and what it does not do

**It does:**

- Read a job posting (from a URL, or from text you paste).
- Identify what the posting actually weights — requirements sections and the
  job title count far more than the perks blurb.
- Detect which applicant tracking system is behind it (Greenhouse, Lever,
  Workday, Taleo, iCIMS, Ashby, Workable, SmartRecruiters, LinkedIn, Indeed)
  and tell you how that system screens candidates, including whether it runs
  AI ranking.
- Rebuild your resume for that specific job: reorder and select bullets by
  relevance, lead each role with its strongest matching achievement, reorder
  your skills so the matched ones come first, and rewrite the summary to point
  at that role.
- Render it three ways — plain `.txt` (safest for any parser), `.md` (easy to
  edit), and single-column print-ready `.html` (print to PDF at Letter size).
- Write a cover letter whose every claim traces back to a real bullet.
- Pre-answer the standard application questions, including the knockout ones
  (work authorization, sponsorship, relocation, salary) straight from your
  profile — a wrong answer there is an automatic reject before a human looks.
- Audit the result: keyword coverage score, format/parseability checks, and a
  list of fixes ranked by impact.
- Optionally open the posting in a real browser and fill the entire form for
  you, resume PDF uploaded, and stop at the Submit button.

**It does not:**

- **Click Submit.** See below.
- **Invent anything.** Every line on every tailored resume comes from your
  profile. Skills the posting wants that you don't have are reported to you as
  gaps, explicitly flagged as "do not add these" — not quietly written in.

### Why it stops at Submit

Not a formality — it genuinely breaks otherwise:

- **Terms of service.** Workday, LinkedIn, and Indeed prohibit automated
  submission and actively detect it. A banned LinkedIn account costs you far
  more opportunities than being an hour later on one posting.
- **It doesn't technically work.** Workday requires a separate account with
  email verification per employer. Greenhouse and Lever fire CAPTCHA on
  automated sessions. An unattended run submits half-empty applications.
- **It's irreversible.** Most ATSes block re-applying to the same requisition
  for 6–12 months. One bad auto-submit burns the job permanently.

The slow part of applying is the tailoring and the form-filling. This does all
of that. What's left is a glance and a click.

**On timing:** recruiters review applications in batches, usually days after
posting. Being applicant #40 on day one and applicant #4 in hour one screen
identically. Apply within a day or two and you're competitive.

---

## Setup

Requires Node 18+. No dependencies for the core app.

```bash
cd job-apply
npm start
```

Open http://127.0.0.1:4321.

For browser autofill (optional):

```bash
npm install playwright
```

---

## Using it

### 1. Fill in your profile

Open the **My profile** tab. It is seeded from `data/profile.example.json`.
Replace it with your real details and save. This file is the single source of
truth for every resume the app generates.

The quality of your tailored resumes is capped by the quality of this file.
The one thing worth the time:

> **Tag your bullets, and put numbers in them.**
>
> Each bullet has a `tags` array of the skills it demonstrates. Tags are how
> the matcher knows a bullet is relevant to a posting. A bullet with no tags
> can still match on its text, but tags are stronger evidence.
>
> `"Built the API"` → `"Designed and documented 5 REST endpoints in Node.js
> and Express, backed by PostgreSQL, serving ~8k requests per day."`
>
> The second one wins with both the parser and the human. Write 6–8 bullets
> per role even though only the top 4 get used — the extras are what lets the
> app tailor instead of just reprinting.

### 2. Add jobs

**Add jobs** tab. Paste links, one per line, and press Process all jobs.

Sites that block server-side reading (Workday, LinkedIn, Indeed, and some
company career pages) will come back marked *needs-input*. For those, paste
the job description text. Either paste it in the job's drawer afterward, or
include it up front, separating each job with a line of `---`:

```
https://boards.greenhouse.io/acme/jobs/123456
https://jobs.lever.co/example/abc-def
---
https://company.wd1.myworkdayjobs.com/en-US/careers/job/Dev_R-123
Software Developer
(paste the full job description text here)
```

Pasted text works exactly as well as fetched text — the tailoring is identical.

### 3. Review and submit

Each queue card shows an ATS match score. Open the package to see:

- How that specific ATS screens candidates
- The audit: keyword score, format checks, ranked fixes
- Which of the posting's keywords you hit and which you don't
- The full tailored resume and cover letter, with copy buttons
- Every form answer, ready to paste

**Resume (print to PDF)** opens the print dialog with correct Letter margins.

Then: open the posting, upload or paste, submit, and hit **Mark applied**.

### 4. Optional: browser autofill

```bash
node src/autofill.js <jobId>   # one job
node src/autofill.js --all     # every ready job with an autofillable URL
```

Opens a real browser, renders your resume to PDF, fills every field it
recognizes, uploads the resume, and prints any question it *couldn't* answer
so you know exactly what to look at. Review each tab and submit yourself.

---

## Reading the score

| Score  | Meaning |
|--------|---------|
| 75–100 | Strong. Send it. |
| 55–74  | Worth sending; work the recommendations first. |
| < 55   | Either a weak fit, or your profile is missing detail the posting asks about. |

The audit splits missing keywords into two piles, and the difference matters:

- **"You already have these but they aren't on the page"** — fix immediately.
  Free score, no dishonesty. Usually means a skill is in your profile's skills
  list but no bullet demonstrates it.
- **"Genuine gaps"** — the posting wants something you don't have. The app will
  never add these. Apply anyway if the rest matches; if it's something you're
  actively learning, say so honestly in the cover letter.

## ATS formatting rules enforced in the output

Every generated resume is built to survive a parser: one column, standard
section headings, plain hyphen bullets, dates on every role, contact details in
the document body rather than a PDF header, no tables, no text boxes, no
images, no icons, and no smart quotes or em dashes. These are the things that
silently destroy a resume between upload and the recruiter's screen.

## Privacy

`data/profile.json`, `data/applications.json`, and everything in `output/` are
gitignored. The server binds to `127.0.0.1` only and is not reachable from your
network. No data is sent anywhere.

## Layout

```
job-apply/
├── server.js              Local HTTP server (zero deps)
├── src/
│   ├── keywords.js        Skill dictionary; weighted keyword extraction
│   ├── fetchJob.js        Posting fetch, HTML→text, ATS detection
│   ├── tailor.js          Matching and selection engine
│   ├── render.js          Resume (txt/md/html) and cover letter renderers
│   ├── score.js           ATS audit: keywords + format checks
│   ├── questions.js       Screening-question answering
│   ├── pipeline.js        Link in → full package out
│   ├── store.js           Flat-file JSON storage
│   └── autofill.js        Optional Playwright form filler
├── public/                Web UI
├── data/                  Profile and application records
└── output/                Generated resumes and cover letters, per job
```
