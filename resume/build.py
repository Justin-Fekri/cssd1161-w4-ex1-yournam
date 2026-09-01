"""Single-source resume builder: emits resume.html and the .docx from one content tree.

Bold spans are written inline as **text** and split at render time, so the two
renderers can never drift. Base font size is a parameter so fit.py can search for
the largest size that still holds one page.

Typography: Charter (PDF) / Georgia (docx) for body — sturdy, large-x-height serifs
that hold up at 9pt — paired with a humanist sans for headings and labels.
Layout is deliberately single-column with real text and no images or layout tables,
so it stays machine-readable for an applicant tracking system.
"""
import re
import sys

# ------------------------------------------------------------------ content ---
NAME = "MOHSEN FEKRI"
TAGLINE = "AI & Data  ·  Machine Learning  ·  Computer Vision  ·  Responsible AI"
CONTACT = ["justinfe@my.yorku.ca", "(437) 556-5959", "github.com/Justin-Fekri", "Toronto, Canada"]

SUMMARY = (
    "AI and machine learning practitioner who builds end-to-end and designs for review: faculty-led "
    "research in spatio-temporal medical-image segmentation, credit-risk scoring with explainable output "
    "and a human in the loop, and an enterprise RAG assistant over audit, risk, and cybersecurity "
    "documentation. Comfortable where models meet production and governance — imbalanced data, evaluation "
    "trade-offs, model drift, inference optimization, and role-based access."
)

SKILLS = [
    ("EY Platforms & Responsible AI",
     "EY.ai, EYQ, FlexiGenAI, Responsible AI framework; aligned to EY AI & Data, Digital Engineering, "
     "and Technology Risk"),
    ("AI & Machine Learning",
     "PyTorch, MONAI, computer vision, segmentation, classification, spatio-temporal modelling, "
     "model evaluation (precision, recall, F1, ROC-AUC), imbalanced data, model drift, explainable AI"),
    ("GenAI & Agents",
     "RAG, MCP (Model Context Protocol), OpenAI-compatible API standard, vector databases, "
     "LangChain/LlamaIndex, RAGAS evaluation"),
    ("Engineering & Data",
     "Python, SQL, Java, JavaScript, Pandas (DataFrames), NumPy, Scikit-learn, XGBoost, FastAPI, "
     "Streamlit, Gradio, Docker, Kubernetes, TensorRT, Git"),
]

RESEARCH = {
    "role": "Undergraduate Research Award (UGRA) & Teaching Assistant",
    "org": "York University",
    "date": "2025",
    "sub": "Supervisor: Prof. Navid Mohaghegh  ·  Spatio-Temporal Ultrasound Needle Segmentation",
    "bullets": [
        "Selected for a **York Undergraduate Research Award** to work on AI-assisted needle localization "
        "in ultrasound, alongside teaching assistant duties for Prof. Mohaghegh.",
        "Built a PyTorch and MONAI segmentation pipeline pairing Swin Transformer **spatial** feature "
        "extraction with ConvLSTM **temporal** modelling across frames.",
        "Drove preprocessing, model development, and frame-level evaluation on sequential ultrasound, "
        "scoring segmentation quality with **Dice and IoU**.",
    ],
}

PROJECTS = [
    {
        "role": "Enterprise Document Question-Answering Assistant",
        "stack": "Python · RAG · MCP · FastAPI · Gradio · RAGAS",
        "date": "2026",
        "bullets": [
            "Shipped a RAG assistant over company policies, **audit procedures, risk reports, and "
            "cybersecurity documentation** in PDF and Word — the document classes an assurance team works in.",
            "Exposed retrieval as **MCP** tools behind an OpenAI-compatible API so agentic clients can "
            "drive the assistant directly.",
            "Returned **page-level citations** and abstained when the corpus lacked evidence, rather than "
            "answering from thin retrieval.",
            "Tuned chunking and retrieval against **RAGAS** faithfulness scores, behind **role-based "
            "permissions** so each user retrieves only what their role allows.",
        ],
    },
    {
        "role": "AI Credit Risk & Loan Decision Support System",
        "stack": "Python · Scikit-learn · XGBoost · Explainable AI",
        "date": "2026",
        "bullets": [
            "Modelled borrower credit history and financial attributes to estimate loan eligibility and "
            "default risk.",
            "Tuned against a heavily **imbalanced** default population, weighing false positives against "
            "false negatives across precision, recall, F1, ROC-AUC, and confusion-matrix analysis.",
            "Surfaced the features driving each decision through **explainable-AI** output, so a reviewer "
            "can see why an applicant scored the way they did.",
            "Framed the system as **decision support, not automatic approval**, keeping the final lending "
            "call with a human — the control a regulated lender is required to evidence.",
        ],
    },
    {
        "role": "Medical Image Cancer Detection Prototype",
        "stack": "Python · PyTorch · EfficientNet-B0 · TensorRT · Streamlit",
        "date": "2025",
        "bullets": [
            "Trained a CNN classifier that standardizes images to 224 x 224 RGB, with a sigmoid "
            "probability and an adjustable decision threshold.",
            "Cut model size and inference latency with **TensorRT** quantization and pruning, tracking the "
            "accuracy trade-off at each step.",
            "Added visual interpretability for reviewer oversight, with output labelled explicitly as "
            "**educational and research-only, not diagnostic**.",
        ],
    },
]

EDU = {
    "role": "York University, Lassonde School of Engineering",
    "org": "Toronto (Markham Campus)",
    "date": "Expected 2029",
    "sub": "Bachelor of Applied Science (BASc), Computer Science for Software Development, Co-op  ·  GPA: 6.7/9.0",
}

CERT = {"role": "AI-103: Developing AI Apps and Agents on Azure", "org": "Microsoft", "date": "In Progress"}

ADDITIONAL = [
    ("Operations Assistant", "York University", "May 2026 - Sep 2026"),
    ("Program & Administrative Assistant", "YMCA of Greater Toronto", "Dec 2024 - Jan 2026"),
    ("IT Support & Lab Assistant, Volunteer", "Toronto Public Library", "Mar 2023 - Sep 2023"),
]

NAVY = "1F3B63"
RULE = "B9C7DA"
GREY = "5A5A5A"


def split_bold(text):
    """'a **b** c' -> [('a ',False),('b',True),(' c',False)]"""
    return [(part, i % 2 == 1) for i, part in enumerate(re.split(r"\*\*", text)) if part]


# --------------------------------------------------------------------- html ---
def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def html_rich(text):
    return "".join(f"<b>{esc(t)}</b>" if b else esc(t) for t, b in split_bold(text))


def build_html(path, base=9.0):
    o = [f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Mohsen Fekri - Resume</title>
<style>
  @page {{ size: Letter; margin: 0.4in 0.55in; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; color: #17181A;
          font-family: "Bitstream Charter", Charter, Georgia, serif;
          font-size: {base}pt; line-height: {round(base*1.27,2)}pt; }}
  .sans {{ font-family: "Liberation Sans", Arial, Helvetica, sans-serif; }}

  /* ---- header ---- */
  header {{ text-align: center; padding-bottom: {round(base*0.30,2)}pt;
            border-bottom: 1.6pt solid #{NAVY}; margin-bottom: {round(base*0.42,2)}pt; }}
  .name {{ font-family: "Liberation Sans", Arial, sans-serif;
           font-size: {round(base*2.30,2)}pt; font-weight: 700; color: #{NAVY};
           letter-spacing: 2.6px; margin: 0 0 {round(base*0.28,2)}pt; }}
  .tagline {{ font-family: "Liberation Sans", Arial, sans-serif;
              font-size: {round(base*0.93,2)}pt; color: #{NAVY};
              letter-spacing: .75px; margin: 0 0 {round(base*0.30,2)}pt; }}
  .contact {{ font-size: {round(base*0.97,2)}pt; color: #{GREY}; }}
  .contact .sep {{ color: #A9B6C7; padding: 0 4pt; }}

  /* ---- section headings ---- */
  h2 {{ font-family: "Liberation Sans", Arial, sans-serif;
        font-size: {round(base*0.90,2)}pt; font-weight: 700; color: #{NAVY};
        text-transform: uppercase; letter-spacing: 1.5px;
        margin: {round(base*0.50,2)}pt 0 {round(base*0.26,2)}pt;
        padding-bottom: {round(base*0.20,2)}pt; border-bottom: .8pt solid #{RULE}; }}

  /* ---- entries: title left, date hard right ---- */
  .row {{ display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }}
  .role {{ font-weight: 700; font-size: {round(base*1.06,2)}pt; }}
  .date {{ font-family: "Liberation Sans", Arial, sans-serif;
           font-size: {round(base*0.87,2)}pt; font-weight: 700; color: #{NAVY};
           white-space: nowrap; letter-spacing: .3px; }}
  .org {{ color: #{GREY}; font-weight: 400; }}
  .sub {{ color: #{GREY}; font-style: italic; margin-top: .5pt; }}
  .stack {{ font-family: "Liberation Sans", Arial, sans-serif;
            font-size: {round(base*0.85,2)}pt; color: #46617F;
            letter-spacing: .25px; margin-top: .8pt; }}
  .entry {{ margin-top: {round(base*0.30,2)}pt; }}
  .addl {{ margin-top: {round(base*0.14,2)}pt; }}
  .entry:first-of-type {{ margin-top: 0; }}

  /* ---- bullets ---- */
  ul {{ margin: {round(base*0.16,2)}pt 0 0; padding-left: 10.5pt; }}
  li {{ margin: 0 0 {round(base*0.09,2)}pt; padding-left: 1.5pt; }}
  li::marker {{ color: #7E93AC; content: "▪  "; font-size: {round(base*0.80,2)}pt; }}

  /* ---- skills: labels in an aligned column ---- */
  .skills {{ display: grid; grid-template-columns: max-content 1fr;
             column-gap: 9pt; row-gap: {round(base*0.13,2)}pt; }}
  .skills dt {{ font-family: "Liberation Sans", Arial, sans-serif;
                font-size: {round(base*0.87,2)}pt; font-weight: 700; color: #{NAVY};
                letter-spacing: .2px; }}
  .skills dd {{ margin: 0; }}

  p {{ margin: 0; }}
  .summary {{ text-align: justify; }}
</style>
</head>
<body>
"""]

    # header
    o.append("<header>")
    o.append(f'  <div class="name">{esc(NAME)}</div>')
    o.append(f'  <div class="tagline">{esc(TAGLINE)}</div>')
    sep = '<span class="sep">|</span>'
    o.append(f'  <div class="contact">{sep.join(esc(c) for c in CONTACT)}</div>')
    o.append("</header>")

    o.append("<h2>Professional Summary</h2>")
    o.append(f'<p class="summary">{esc(SUMMARY)}</p>')

    o.append("<h2>Technical Skills</h2>")
    o.append('<dl class="skills">')
    for label, items in SKILLS:
        o.append(f"  <dt>{esc(label)}</dt><dd>{esc(items)}</dd>")
    o.append("</dl>")

    def entry(d):
        o.append('<div class="entry">')
        left = f'<span class="role">{esc(d["role"])}</span>'
        if d.get("org"):
            left += f'<span class="org">&nbsp;&nbsp;|&nbsp;&nbsp;{esc(d["org"])}</span>'
        # role and org must be ONE flex child, or space-between strands the org mid-row
        o.append(f'  <div class="row"><span>{left}</span>'
                 f'<span class="date">{esc(d["date"])}</span></div>')
        if d.get("stack"):
            o.append(f'  <div class="stack">{esc(d["stack"])}</div>')
        if d.get("sub"):
            o.append(f'  <div class="sub">{esc(d["sub"])}</div>')
        if d.get("bullets"):
            o.append("  <ul>")
            for b in d["bullets"]:
                o.append(f"    <li>{html_rich(b)}</li>")
            o.append("  </ul>")
        o.append("</div>")

    o.append("<h2>AI Research Experience</h2>")
    entry(RESEARCH)

    o.append("<h2>Selected AI Projects</h2>")
    for p in PROJECTS:
        entry(p)

    o.append("<h2>Education &amp; Certification</h2>")
    entry(EDU)
    entry(CERT)

    o.append("<h2>Additional Experience</h2>")
    for title, org, dates in ADDITIONAL:
        o.append(f'<div class="row addl"><span><b>{esc(title)}</b>'
                 f'<span class="org">&nbsp;&nbsp;|&nbsp;&nbsp;{esc(org)}</span></span>'
                 f'<span class="date">{esc(dates)}</span></div>')

    o.append("</body>\n</html>")
    open(path, "w").write("\n".join(o))


# --------------------------------------------------------------------- docx ---
def build_docx(path, base=9.0):
    from docx import Document
    from docx.shared import Pt, RGBColor, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    c_navy = RGBColor(0x1F, 0x3B, 0x63)
    c_grey = RGBColor(0x5A, 0x5A, 0x5A)
    c_stack = RGBColor(0x46, 0x61, 0x7F)

    SERIF, SANS = "Georgia", "Calibri"
    RIGHT = Inches(8.5 - 0.55 * 2)          # content width -> right tab stop

    doc = Document()
    s = doc.sections[0]
    s.top_margin = s.bottom_margin = Inches(0.4)
    s.left_margin = s.right_margin = Inches(0.55)
    st = doc.styles["Normal"]
    st.font.name = SERIF
    st.font.size = Pt(base)
    st.paragraph_format.space_after = Pt(0)
    st.paragraph_format.space_before = Pt(0)
    st.paragraph_format.line_spacing = 1.06

    def para(after=0, before=0, align=None, tab_right=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(after)
        p.paragraph_format.space_before = Pt(before)
        if align:
            p.alignment = align
        if tab_right:
            p.paragraph_format.tab_stops.add_tab_stop(RIGHT, WD_TAB_ALIGNMENT.RIGHT)
        return p

    def run(p, text, bold=False, italic=False, size=None, color=None, font=SERIF, spacing=None):
        r = p.add_run(text)
        r.bold, r.italic = bold, italic
        r.font.size = Pt(size or base)
        r.font.name = font
        if color:
            r.font.color.rgb = color
        if spacing:                                   # letter-spacing, in twentieths of a point
            rPr = r._element.get_or_add_rPr()
            el = OxmlElement("w:spacing")
            el.set(qn("w:val"), str(int(spacing * 20)))
            rPr.append(el)
        return r

    def rule(p, color, size_eighths):
        pPr = p._p.get_or_add_pPr()
        bd = OxmlElement("w:pBdr")
        b = OxmlElement("w:bottom")
        b.set(qn("w:val"), "single")
        b.set(qn("w:sz"), str(size_eighths))
        b.set(qn("w:space"), "2")
        b.set(qn("w:color"), color)
        bd.append(b)
        pPr.append(bd)

    def heading(text):
        p = para(after=round(base * 0.26, 1), before=round(base * 0.50, 1))
        run(p, text.upper(), bold=True, size=round(base * 0.90, 1),
            color=c_navy, font=SANS, spacing=1.5)
        rule(p, RULE, 6)

    def bullet(text):
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(round(base * 0.09, 1))
        p.paragraph_format.left_indent = Inches(0.19)
        p.paragraph_format.first_line_indent = Inches(-0.115)
        p.paragraph_format.line_spacing = 1.06
        for t, b in split_bold(text):
            run(p, t, bold=b)

    def entry(d):
        p = para(before=round(base * 0.30, 1), tab_right=True)
        run(p, d["role"], bold=True, size=round(base * 1.06, 1))
        if d.get("org"):
            run(p, f"   |   {d['org']}", color=c_grey)
        run(p, "\t")
        run(p, d["date"], bold=True, size=round(base * 0.87, 1), color=c_navy, font=SANS)
        if d.get("stack"):
            q = para()
            run(q, d["stack"], size=round(base * 0.85, 1), color=c_stack, font=SANS)
        if d.get("sub"):
            q = para()
            run(q, d["sub"], italic=True, color=c_grey)
        for b in d.get("bullets", []):
            bullet(b)

    # header
    p = para(align=WD_ALIGN_PARAGRAPH.CENTER, after=round(base * 0.28, 1))
    run(p, NAME, bold=True, size=round(base * 2.30, 1), color=c_navy, font=SANS, spacing=2.0)
    p = para(align=WD_ALIGN_PARAGRAPH.CENTER, after=round(base * 0.30, 1))
    run(p, TAGLINE, size=round(base * 0.93, 1), color=c_navy, font=SANS, spacing=0.6)
    p = para(align=WD_ALIGN_PARAGRAPH.CENTER, after=round(base * 0.42, 1))
    run(p, "   |   ".join(CONTACT), size=round(base * 0.97, 1), color=c_grey)
    rule(p, NAVY, 12)

    heading("Professional Summary")
    p = para()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run(p, SUMMARY)

    heading("Technical Skills")
    # hanging indent + left tab so labels form a real column and wrapped value text
    # aligns under the value, matching the CSS grid used in the PDF
    LABEL_W = Inches(1.62)
    for label, items in SKILLS:
        p = para(after=round(base * 0.13, 1))
        p.paragraph_format.left_indent = LABEL_W
        p.paragraph_format.first_line_indent = -LABEL_W
        p.paragraph_format.tab_stops.add_tab_stop(LABEL_W, WD_TAB_ALIGNMENT.LEFT)
        run(p, label, bold=True, size=round(base * 0.87, 1), color=c_navy, font=SANS)
        run(p, "\t")
        run(p, items)

    heading("AI Research Experience")
    entry(RESEARCH)

    heading("Selected AI Projects")
    for pr in PROJECTS:
        entry(pr)

    heading("Education & Certification")
    entry(EDU)
    entry(CERT)

    heading("Additional Experience")
    for title, org, dates in ADDITIONAL:
        p = para(after=round(base * 0.14, 1), tab_right=True)
        run(p, title, bold=True)
        run(p, f"   |   {org}", color=c_grey)
        run(p, "\t")
        run(p, dates, bold=True, size=round(base * 0.87, 1), color=c_navy, font=SANS)

    doc.save(path)


if __name__ == "__main__":
    html_path, docx_path = sys.argv[1], sys.argv[2]
    base = float(sys.argv[3]) if len(sys.argv) > 3 else 9.0
    build_html(html_path, base)
    build_docx(docx_path, base)
    print(f"wrote {html_path} and {docx_path} at {base}pt")
