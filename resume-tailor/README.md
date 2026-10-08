# Resume Tailor

A small local web app. You give it your master resume once. For each job posting it gives you:

1. **A tailored resume.** It keeps your section headings, order and plain-text layout, uses the posting's exact keywords, and moves the most relevant bullets to the top. All of this is ATS friendly.
2. **A tailored cover letter.** It's addressed to the hiring manager when the posting names one.
3. **Every skill the posting asks for.** With *Add every required & preferred skill* on (the default), all of the posting's required and preferred skills are added to your resume's skills section. The Skill gaps tab lists which ones were added, with the fastest way to learn each before the interview. Turn the option off to add only the skills you tick.
4. **Recruiter and hiring-manager research.** It uses web search over public sources. Every person links to its source, plus ready-made LinkedIn people searches.
5. **Outreach drafts.** You get a LinkedIn note, an email, and a one-week follow-up for each contact.
6. **An application tracker.** It's saved in your browser and flags applications that are due for a follow-up.

## Run it

Requires Node 18+ and an Anthropic API key (https://console.anthropic.com).

```bash
cd resume-tailor
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # Windows PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
npm start
```

Open http://localhost:3000.

## Workflow per job

1. Paste the job posting (and its URL) and click **Tailor**.
2. Review the resume and cover letter. Then **Print / save PDF** or download them.
3. Apply on the employer's site yourself and attach the files.
4. **Save to tracker** and set the status to *Applied*.
5. In **Contacts**, find the recruiter or hiring manager. Then send the drafted LinkedIn note or email.
6. When the tracker shows *Follow up*, send the follow-up draft.

## Notes

- Your master resume and tracker live only in your browser's localStorage. Resume and posting text is sent to the Claude API to generate results.
- The app adds skills, but it never invents employers, job titles, dates, degrees, certifications or metrics. Those are checked in background verification.
