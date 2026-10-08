# Resume Tailor

A small local web app. You give it your master resume once. For each job posting it gives you:

1. **A tailored resume.** It keeps your section headings, order and plain-text layout, uses the posting's exact keywords, and moves the most relevant bullets to the top. All of this is ATS friendly.
2. **A tailored cover letter.** It's addressed to the hiring manager when the posting names one.
3. **Every skill the posting asks for.** With *Add every required & preferred skill* on (the default), all of the posting's required and preferred skills are added to your resume's skills section. The Skill gaps tab lists which ones were added, with the fastest way to learn each before the interview. Turn the option off to add only the skills you tick.
4. **Optimization to 95+.** A separate, strict grader scores each draft the way an ATS ranker, an AI screener and a recruiter would. The app then rewrites the resume and cover letter using the grader's line-by-line feedback, up to 3 times, until both score 95 or higher, and keeps the best version.
5. **A screening score.** It rates the final resume 0–100 the way an ATS ranker or AI screener would: keywords, required skills, preferred skills, title match, experience and formatting. The cover letter gets its own score for personalization, requirement match, persuasiveness and clarity.
6. **Recruiter and hiring-manager research.** This runs automatically after tailoring. It uses web search over public sources, and every person links to its source. There are also ready-made LinkedIn people searches.
7. **Outreach drafts.** You get a LinkedIn note, an email, and a one-week follow-up for each contact. There's a one-click *Send email* when the contact's email is public, and *Copy note & open LinkedIn*.
8. **Apply (auto-fill).** It opens the application in a browser window on your computer and clicks through to the form. It fills your name, email, phone, LinkedIn, GitHub, website and location, writes the cover letter into a text box if there is one, and uploads the resume and cover letter as PDFs. It then lists any screening questions still left for you.
9. **An application tracker.** It's saved in your browser, shows each job's score, and flags applications that are due for a follow-up.

## Run it

Requires Node 18+ and an Anthropic API key (https://console.anthropic.com).

```bash
cd resume-tailor
npm install
npx playwright install chromium     # browser used by Apply (one time)
export ANTHROPIC_API_KEY=sk-ant-...   # Windows PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
npm start
```

Open http://localhost:3000.

## Workflow per job

Fill in **My details** once. Then for each job:

1. Paste the job posting and its URL, and click **Tailor**. The resume, cover letter and score appear first, and the contacts follow a minute later.
2. Click **Apply (auto-fill)**. A browser window opens with the form filled in and your files attached. Answer the questions it lists (work authorization, salary, "why us"), then click **Submit** in that window.
3. Click **I submitted it**. The job is saved to the tracker as *Applied*.
4. In **Contacts**, draft and send the LinkedIn note or email to the recruiter or hiring manager.
5. When the tracker shows *Follow up*, send the follow-up draft.

The browser window keeps its own profile in `.browser-profile/`. Log in to LinkedIn, Workday and similar sites once and they stay logged in.

## Notes

- Your master resume and tracker live only in your browser's localStorage. Resume and posting text is sent to the Claude API to generate results.
- The app adds skills, but it never invents employers, job titles, dates, degrees, certifications or metrics. Those are checked in background verification.
