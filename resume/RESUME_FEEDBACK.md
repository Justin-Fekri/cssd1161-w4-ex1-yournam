# Resume Feedback — Mohsen Fekri (EY)

Source: `Mohsen_recordings_combined.m4a` (21 min 46 s, spoken in Persian with English
technical terms). Transcribed locally with OpenAI Whisper (small) via sherpa-onnx and
Silero VAD. Timestamps below point at the moment each item is raised.

The recording has two halves:

- **00:00 – 11:40** — direct, line-by-line feedback on the resume. These are the edits applied.
- **11:40 – 21:45** — interview preparation, dress code, and job-market advice. Recorded
  below for reference; nothing in this half changes the resume.

---

## Changes applied to the resume

| # | Time | What he says | Change made |
|---|------|--------------|-------------|
| 1 | 00:23 | The contact line leads with "Markham, ON". Don't put the location first — move it to the end of the line. | Contact line reordered to `email | phone | github | location`. |
| 2 | 00:43–01:35 | Markham isn't recognizable to recruiters, especially for global positions. Write Toronto, and Canada. | `Markham, ON` → `Toronto, Canada`. Education line reads `Toronto (Markham Campus)`. |
| 3 | 00:53 | Move the email up — the left-hand side of the line is prime real estate and gets scanned first. | Email now leads the contact line. |
| 4 | 01:40–02:15 | On the UGRA project you wrote "temporal". Make it **temporal *and* spatial** — you look across time *and* spatially within each frame. Word it so you can discuss it in an interview. | Research title → `Spatio-Temporal Ultrasound Needle Segmentation`. Summary uses "spatio-temporal". `spatial` and `temporal` bolded in the pipeline bullet. Added to skills. |
| 5 | 02:20 | Docker is there and that's good — add **Kubernetes**. He's sending a lab for it. | `Kubernetes` added to GenAI & Development. |
| 6 | 02:42–03:20 | Streamlit is good, but also list **Gradio** — Streamlit reads more business-facing, Gradio more lab/development. Interviewers look for it. | `Gradio` added to skills and to the RAG project's tech list. |
| 7 | 03:24 | Companies now want more than RAG — they want **MCP**. It's quick to pick up. | `MCP (Model Context Protocol)` added to skills, to the RAG project's tech list, and as a bullet. |
| 8 | 05:07–06:15 | Be ready to defend **model evaluation**: imbalanced datasets, false positives vs. false negatives, precision, recall, F1. Have it on the page so it's discussable. | Credit-risk bullet rewritten to name class imbalance and the FP/FN trade-off. `imbalanced data` added to skills; summary mentions it. |
| 9 | 06:19–06:55 | He didn't see **Pandas DataFrames** as a keyword. Make sure Pandas and Scikit-learn appear in the keywords. | `Pandas (DataFrames)` in Programming & Data. |
| 10 | 07:21–10:35 | Add **TensorRT** — optimizing a trained model, quantization, pruning, reducing footprint and latency. | `TensorRT` added to skills and to the cancer-detection project, with a bullet on quantization and pruning. |
| 11 | 10:38–11:35 | Since you talk about AI and Data, keep **model drift** in mind — the production distribution shifts away from training data. Worth having the term. | `model drift` added to skills and named in the summary. |
| 12 | 15:15 | Look at the **OpenAI API standard**. | `OpenAI-compatible API standard` added to skills; the RAG project bullet mentions it. |

### What he explicitly liked (left alone)

- The name block and the `AI & DATA | MACHINE LEARNING | COMPUTER VISION` headline (00:23).
- That the resume is short and to the point — "خلاصه، مختصر و مفید" (11:39). The rewrite is
  still one page.
- Docker (02:20) and Streamlit (02:42) already being present.

---

## Polish pass (second revision)

Mohsen's items were all applied in the first pass and Justin has confirmed he has since done
the labs behind Kubernetes, Gradio, MCP, TensorRT and the OpenAI API standard, so those entries
are backed by real work and stay. A second pass then went after impact rather than correctness:

- **The UGRA was buried.** An Undergraduate Research Award is competitive and was sitting as an
  acronym inside a grey italic subtitle. It is now the role title: *Undergraduate Research Award
  (UGRA) & Teaching Assistant*, with the award named again in the first bullet. This is the
  single largest credibility signal on the page and it was invisible.
- **Skills regrouped for the reader, not the tool.** `Programming & Data / AI & ML / GenAI &
  Development` became `AI & Machine Learning / GenAI & Agents / Engineering & Data`, so the
  strongest, most role-relevant band lands first and the agentic story (RAG, MCP, OpenAI API,
  RAGAS) reads as one coherent group instead of being mixed into tooling.
- **Verb variety.** Four bullets opened with "Built". Now: Built, Drove, Modelled, Tuned,
  Shipped, Trained, Cut, Surfaced, Exposed, Returned, Added.
- **Bullets lead with the decision, not the mechanism.** e.g. "Tuned against a heavily imbalanced
  default population, weighing false positives against false negatives" reads as judgement;
  the old "Evaluated performance across five measures" read as a checklist.
- **Summary rewritten** from a list of nouns into a claim: *"builds end-to-end ... comfortable
  where models meet production"*, with the production concerns (imbalanced data, drift,
  inference optimization) as evidence for it. "Familiar with" became "working knowledge of".
- **Single-source build.** `build.py` now generates the HTML and the .docx from one content
  tree, so the PDF and the editable copy cannot drift apart. Regenerate with:
  `python3 build.py resume.html Mohsen_Fekri_EY_Resume_v2.docx`

Still one page, which Mohsen called out as a strength.

## EY alignment pass (third revision)

Goal: fill a full page, sharpen the fit to EY, and make the EY tooling explicit.

- **EY tooling promoted to its own skills line.** `EY Platforms & Responsible AI: EY.ai, EYQ,
  FlexiGenAI, Responsible AI framework; aligned to EY AI & Data, Digital Engineering, and
  Technology Risk` now leads the skills block instead of sitting as a trailing clause in the
  summary, where a skim would miss it.
- **`RESPONSIBLE AI` added to the header tagline**, matching how EY frames the practice.
- **The RAG project moved to the top of Selected AI Projects.** It is the most EY-shaped thing
  on the page — retrieval over audit procedures, risk reports and cybersecurity documentation,
  with citations, abstention and role-based access. The bullet now names those document classes
  as "the document classes an assurance team works in".
- **Governance framing made explicit where it was already true.** The credit-risk bullet now
  says decision support, not automatic approval, "the control a regulated lender is required to
  evidence"; the imaging bullet states the educational/research-only claim boundary. Both were
  facts already in the resume — they are now stated in the language a Technology Risk reviewer
  uses.
- **Explainability split into its own bullet** on the credit-risk project rather than being
  buried in a sentence about approvals.
- **Auto-fit.** `fit.py` renders at successive type sizes and keeps the largest that still holds
  one page. Result: **9.0pt, one page, about 95% full**. 9.1pt spills to a second page.

### Cut in this pass

The one-line descriptions under Additional Experience were removed. They were written by
inference from the job titles rather than from anything stated, and on an AI resume those three
roles earn their place as dates and titles only. Cutting them freed the space that let the type
go from 8.6pt (too small to be professional) to 9.0pt.

---

## Formatting pass (fourth revision)

Typographic and layout rework. No claims changed.

- **Typeface pairing.** Body set in **Charter** (Georgia in the .docx) — a sturdy, large-x-height
  serif that stays legible at 9pt — with a humanist sans for the name, section headings, skill
  labels, dates, and tech stacks. Previously everything was one Times clone, which reads as a
  word-processor default.
- **Dates moved hard right**, in small bold navy sans, on a flex row in the PDF and a right tab
  stop in the .docx. This is the single change that most makes a resume look professionally set:
  the eye gets a clean date column instead of hunting for years inside pipe-separated runs.
- **Skills became a real two-column grid** — labels in a fixed navy column, values aligned beside
  them, wrapped lines aligned under the value. In the .docx this is a hanging indent with a left
  tab stop, so both formats match.
- **Tech stacks pulled onto their own line** under each project title, in small blue-grey sans
  with middot separators, instead of being crammed into the title row behind pipes.
- **Section rules lightened** from solid navy to a fine slate rule, with the heading itself
  letterspaced. The header block closes with one heavier navy rule, so the page has a clear
  hierarchy of weights rather than five identical bars.
- **Bullets** use a small slate square at a reduced size, and the summary is justified.

### Space this cost, and where it came from

The stack lines and the looser header cost roughly four lines. Rather than shrink the type, two
pieces of genuine redundancy were cut:

- The summary's closing sentence repeated the degree, university and school **verbatim** from the
  Education section two inches below. Removed.
- `Education` and `Certification In Progress` merged into one `Education & Certification`
  section, saving a heading.

Result: **8.9pt, one page, essentially full**. 9.0pt spills.

### A note on ATS

The layout is deliberately single-column, with real text, no images, no icon glyphs carrying
meaning, and no layout tables. Flex and grid affect visual placement only — extraction order
still reads title, org, date, then bullets. A two-column or sidebar design would look striking
and parse badly, which is the wrong trade for a firm that screens with an ATS.

---

### The one thing that would raise this further

Every bullet describes *what was done*, none says *how well*. Numbers are what separate a good
student resume from a memorable one, and they cannot be invented here — supply any of these and
they should go in:

- Dice / IoU actually reached on the needle segmentation, and over how many frames or sequences
- ROC-AUC or F1 on the credit-risk model, and the size of the dataset
- The TensorRT result: latency or model-size reduction, and the accuracy cost
- RAGAS faithfulness score, corpus size, or number of documents indexed
- Class ratio in the imbalanced default population

Two smaller judgement calls left as-is, both worth a decision:

1. **GPA 6.7/9.0.** York's 9-point scale is not widely recognized, and 6.7 reads as ordinary to
   anyone who does not know it. Options: leave it, add the letter equivalent, or drop it if the
   posting does not require it.
2. **No LinkedIn on the contact line.** Recruiters expect one next to GitHub.

Also still open: the unresolved term at **15:15** of the recording. He names two things to look
at; the second is clearly the OpenAI API standard, the first did not transcribe cleanly and
sounds like it could be *Ollama*. Worth a re-listen.

---

## Interview advice from the second half (no resume changes)

- **11:39** — The resume is good and concise. Your **GitHub will be opened**, so make sure the
  projects there are presentable.
- **12:00** — For AI/data roles they want someone who can *talk*: explain your work, hold a
  discussion, present an opinion.
- **12:29–14:25** — Expect "what's your biggest strength / weakness". Frame answers around what
  the company gains. For a weakness, pick something real and show the correction, not a
  non-answer.
- **14:47** — Every answer should land on: what value do you bring to *this* company?
- **05:33** — Expect a curveball: "your dataset is imbalanced — a million images, 0.1% positive.
  What do you do?" Know your FP/FN, precision/recall, F1.
- **16:07–16:40** — Dress: dress pants (not jeans), long-sleeve shirt, clean formal shoes,
  no stickers. Tie optional — most people here don't wear one.
- **17:07** — Be there about ten minutes early and ready.
- **19:22** — Don't take silence personally; no callback is normal in this market.
- **19:36–21:30** — Behavioral questions probe conflict: describe a hard situation, how you
  helped, how you handled a teammate not pulling their weight. Show you're a team player who
  raises issues constructively rather than making noise.
- **17:53–18:55** — Context he gives on the market: it is genuinely tight right now, hiring is
  slow, and you're competing with a large pool of graduating applicants. Apply widely and
  don't read rejection as a verdict on you.

---

## Reproducing the transcript

```
python3 tr5.py small transcript.txt 4 1      # whisper small int8, VAD-segmented, fa
```

Full transcripts are not committed — they are rough machine output of a private recording,
useful only as a working artifact.
