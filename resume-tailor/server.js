import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { startApplication } from "./apply.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(here, "public");
const PORT = Number(process.env.PORT) || 3000;
const MODEL = "claude-opus-5-5";

// Reads ANTHROPIC_API_KEY (or an `ant auth login` profile) from the environment.
const client = new Anthropic();

// ---------- Claude calls ----------

const TAILOR_SYSTEM = `You are an expert technical recruiter and resume writer who knows how applicant tracking systems (Workday, Greenhouse, Lever, iCIMS, Taleo) and AI screeners parse and rank resumes.

You receive the candidate's MASTER RESUME and a JOB POSTING. Produce a resume and cover letter tailored to that posting.

Formatting rules for the resume (strict):
- Keep the master resume's exact layout: same section headings, same section order, same bullet character, same date format, same contact header. Only the content inside sections changes.
- Plain text only. No tables, columns, emojis, or graphics — these break ATS parsing.
- Keep it to roughly the same length as the master resume.

Content rules:
- Mirror the posting's exact wording for skills, tools, and job-title keywords wherever the candidate's real background supports it (e.g. if the resume says "JS" and the posting says "JavaScript", write "JavaScript").
- Reorder bullets and skills so the most relevant ones come first. Rewrite bullets in strong action-verb + impact form; keep any numbers that are in the master resume and never invent new metrics.
- Rewrite the summary/profile (if the resume has one) to target this specific role.
- Do NOT invent employers, job titles, dates, degrees, certifications, or metrics. These are checked in background verification.
- The candidate may confirm extra skills (listed under CONFIRMED EXTRA SKILLS). Add those to the skills section, and to a bullet only where an existing role plausibly used them.
- SKILL MODE tells you what to do with posting skills that are not on the master resume:
  - "add-all": the candidate has chosen to list every required and preferred skill/tool/technology from the posting. Add each one to the skills section using the posting's exact wording, and weave the most important into the summary. Do not attach them to specific past roles unless that role plausibly used them.
  - "confirmed-only": add only the confirmed extra skills; leave other missing skills off the resume.
- Either way, list every required/preferred posting skill that is not on the master resume (and not confirmed) in "gaps", so the candidate knows what to study before the interview.

Cover letter rules:
- Addressed to the hiring manager by name if the posting names one, otherwise "Dear Hiring Manager,".
- 250–350 words, 3–4 paragraphs: a specific hook about this company/role, 2–3 concrete matches between the candidate's experience and the posting's top requirements, a short note on how the candidate ramps up quickly on new tools (in "confirmed-only" mode you may name gap skills as things they are actively learning; in "add-all" mode treat them as part of the candidate's toolkit), and a confident close asking for an interview.
- Use the candidate's name and contact line from the resume in the signature.`;

const TAILOR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "company",
    "jobTitle",
    "hiringManagerNamedInPosting",
    "resume",
    "coverLetter",
    "matchedKeywords",
    "gaps",
    "atsScore",
    "notes",
  ],
  properties: {
    company: { type: "string" },
    jobTitle: { type: "string" },
    hiringManagerNamedInPosting: {
      type: "string",
      description: "Name of the hiring manager or recruiter if the posting mentions one, else empty string",
    },
    resume: { type: "string", description: "Full tailored resume, plain text, same layout as the master" },
    coverLetter: { type: "string" },
    matchedKeywords: {
      type: "array",
      items: { type: "string" },
      description: "Posting keywords that now appear in the tailored resume",
    },
    gaps: {
      type: "array",
      description: "Posting requirements the master resume does not show (whether or not they were added)",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "importance", "suggestion"],
        properties: {
          skill: { type: "string" },
          importance: { type: "string", enum: ["required", "preferred"] },
          suggestion: {
            type: "string",
            description: "A fast, concrete way to close this gap (course, mini-project, certification)",
          },
        },
      },
    },
    atsScore: {
      type: "object",
      additionalProperties: false,
      description:
        "Score the TAILORED resume the way an ATS ranker and an AI screener would, each 0-100. Be strict and realistic, not flattering.",
      required: [
        "overall",
        "keywordMatch",
        "requiredSkills",
        "preferredSkills",
        "titleAlignment",
        "experienceRelevance",
        "formatting",
        "verdict",
        "topFixes",
      ],
      properties: {
        overall: { type: "integer", description: "0-100 weighted overall pass likelihood" },
        keywordMatch: { type: "integer", description: "0-100 share of posting keywords present verbatim" },
        requiredSkills: { type: "integer", description: "0-100 coverage of required qualifications" },
        preferredSkills: { type: "integer", description: "0-100 coverage of preferred qualifications" },
        titleAlignment: { type: "integer", description: "0-100 how closely past titles/summary match the target title" },
        experienceRelevance: { type: "integer", description: "0-100 years and type of experience vs the posting" },
        formatting: { type: "integer", description: "0-100 how cleanly an ATS will parse it" },
        verdict: { type: "string", description: "One sentence: likely to pass the screen, borderline, or likely filtered out, and why" },
        topFixes: { type: "array", items: { type: "string" }, description: "Up to 3 changes that would raise the score most" },
      },
    },
    notes: { type: "string", description: "Short tips for this application" },
  },
};

async function tailor({ masterResume, jobPosting, confirmedSkills, addAllSkills }) {
  const extra = confirmedSkills?.length ? confirmedSkills.join(", ") : "(none)";
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: TAILOR_SCHEMA },
    },
    system: [{ type: "text", text: TAILOR_SYSTEM }],
    messages: [
      {
        role: "user",
        content: [
          // The master resume is the same for every job, so cache everything up to it.
          {
            type: "text",
            text: `MASTER RESUME:\n<<<\n${masterResume}\n>>>`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `JOB POSTING:\n<<<\n${jobPosting}\n>>>\n\nCONFIRMED EXTRA SKILLS: ${extra}\nSKILL MODE: ${addAllSkills ? "add-all" : "confirmed-only"}`,
          },
        ],
      },
    ],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new Error("The model declined this request.");
  if (message.stop_reason === "max_tokens") throw new Error("Response was cut off; try a shorter posting.");
  const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text);
}

const CONTACTS_SYSTEM = `You help a job seeker find the right people to follow up with about a specific job application.

Use web search to find, from PUBLIC professional sources only (the job posting itself, the company's careers/team pages, press releases, LinkedIn public profiles that appear in search results, conference bios):
- The recruiter / talent acquisition partner for this role or team
- The likely hiring manager (the person the role reports to, or the head of that team)
- Any official recruiting / careers contact published by the company

Rules:
- Only report a person if a source you actually found ties them to this company (and ideally this team). Give the source URL for every person.
- Only report an email address if it is published verbatim on a public page you found. Never guess or construct email addresses from naming patterns.
- Do not look up personal phone numbers, home addresses, or personal social media.
- Confidence: "high" = named in the posting or explicitly as recruiter/manager for this team; "medium" = right team/title at the company; "low" = plausible but unconfirmed.

After searching, reply with ONLY a JSON object (no prose, no code fence) of this shape:
{"contacts":[{"name":"","title":"","role":"recruiter|hiring_manager|team_member|company_contact","confidence":"high|medium|low","linkedinUrl":"","publicEmail":"","sourceUrl":"","why":""}],
 "companyCareersContact":"","outreachTip":""}`;

async function findContacts({ company, jobTitle, jobPosting, jobUrl }) {
  const messages = [
    {
      role: "user",
      content: `Company: ${company}\nRole: ${jobTitle}\nPosting URL: ${jobUrl || "(not given)"}\n\nPosting text:\n<<<\n${jobPosting.slice(0, 20000)}\n>>>`,
    },
  ];
  let message;
  // Web search can pause long turns; resume up to a few times.
  for (let i = 0; i < 4; i++) {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: CONTACTS_SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
      messages,
    });
    message = await stream.finalMessage();
    if (message.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: message.content });
  }
  if (message.stop_reason === "refusal") throw new Error("The model declined this request.");
  const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    return JSON.parse(json);
  } catch {
    return { contacts: [], companyCareersContact: "", outreachTip: text.trim() };
  }
}

const FOLLOWUP_SYSTEM = `Write short, professional outreach messages for a job applicant. Plain text. No flattery, no exaggeration, no claims beyond what the resume shows. Each message must mention the exact role title and that the candidate has applied.`;

async function draftFollowUps({ contactName, contactRole, company, jobTitle, resume }) {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["linkedinNote", "email", "followUp"],
          properties: {
            linkedinNote: { type: "string", description: "LinkedIn connection note, max 300 characters" },
            email: { type: "string", description: "Email with a Subject: line, under 150 words" },
            followUp: { type: "string", description: "Polite follow-up to send ~7 days later if no reply, under 80 words" },
          },
        },
      },
    },
    system: FOLLOWUP_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Recipient: ${contactName || "the hiring team"} (${contactRole || "recruiter"}) at ${company}\nRole applied for: ${jobTitle}\n\nCandidate's tailored resume:\n<<<\n${resume}\n>>>`,
      },
    ],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new Error("The model declined this request.");
  return JSON.parse(message.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
}

// ---------- HTTP ----------

const ROUTES = {
  "/api/tailor": (b) => {
    if (!b.masterResume?.trim() || !b.jobPosting?.trim()) throw badRequest("Master resume and job posting are required.");
    return tailor(b);
  },
  "/api/contacts": (b) => {
    if (!b.company?.trim() || !b.jobPosting?.trim()) throw badRequest("Company and job posting are required.");
    return findContacts(b);
  },
  "/api/apply": (b) => {
    if (!b.resume?.trim() || !b.coverLetter?.trim()) throw badRequest("Tailor the resume first.");
    return startApplication(b);
  },
  "/api/followups": (b) => {
    if (!b.company?.trim() || !b.resume?.trim()) throw badRequest("Company and resume are required.");
    return draftFollowUps(b);
  },
};

function badRequest(msg) {
  return Object.assign(new Error(msg), { status: 400 });
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

async function readBody(req) {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 2_000_000) throw badRequest("Request too large.");
  }
  return JSON.parse(data || "{}");
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const handler = ROUTES[url.pathname];

  if (handler && req.method === "POST") {
    try {
      send(res, 200, await handler(await readBody(req)));
    } catch (err) {
      console.error(err);
      const status = err instanceof Anthropic.APIError ? 502 : err.status || 500;
      send(res, status, { error: err.message });
    }
    return;
  }

  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  const file = path.normalize(path.join(PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname));
  if (!file.startsWith(PUBLIC_DIR)) return send(res, 403, { error: "Forbidden" });
  try {
    const content = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(content);
  } catch {
    send(res, 404, { error: "Not found" });
  }
});

server.listen(PORT, () => console.log(`Resume Tailor running at http://localhost:${PORT}`));
