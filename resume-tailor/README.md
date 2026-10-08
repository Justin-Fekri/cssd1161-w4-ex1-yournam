# Resume Tailor

A small local web app. You give it your master resume once. For each job posting it gives you:

1. **A tailored resume.** It keeps your section headings, order and plain-text layout, uses the posting's exact keywords, and moves the most relevant bullets to the top. All of this is ATS friendly.
2. **A tailored cover letter.** It's addressed to the hiring manager when the posting names one.
3. **A skill-gap list.** These are requirements the posting asks for that your resume doesn't show. Tick the ones you really have and regenerate, and they get added. Each one comes with the fastest way to close it before the interview.
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
- The app won't put skills or experience on the resume that you haven't confirmed. ATS filters get you to a human, and the human will ask about every line. Put unconfirmed requirements in the cover letter as things you're actively learning.
