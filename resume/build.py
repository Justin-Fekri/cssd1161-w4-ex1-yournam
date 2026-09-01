"""Single-source resume builder: emits both resume.html and the .docx from one content tree.

Bold spans are written inline as **text** and split out at render time so the two
renderers can never drift.
"""
import re
import sys

# ------------------------------------------------------------------ content ---
NAME = "MOHSEN FEKRI"
TAGLINE = "AI & DATA  |  MACHINE LEARNING  |  COMPUTER VISION"
CONTACT = "justinfe@my.yorku.ca  |  (437) 556-5959  |  github.com/Justin-Fekri  |  Toronto, Canada"

SUMMARY = (
    "AI and machine learning practitioner who builds end-to-end: faculty-led research in spatio-temporal "
    "medical-image segmentation, credit-risk models designed for human review, and enterprise RAG with "
    "page-level citations and role-based access. Comfortable where models meet production — imbalanced "
    "data, evaluation trade-offs, model drift, and inference optimization. Pursuing a BASc in Computer "
    "Science for Software Development (Co-op) at York University, Lassonde School of Engineering. Aligned "
    "to EY AI & Data, Digital Engineering, and Technology Risk, with working knowledge of EY.ai, EYQ, "
    "FlexiGenAI, and Responsible AI."
)

SKILLS = [
    ("AI & Machine Learning:",
     "PyTorch, MONAI, computer vision, segmentation, classification, spatio-temporal modelling, "
     "model evaluation (precision, recall, F1, ROC-AUC), imbalanced data, model drift, explainable AI"),
    ("GenAI & Agents:",
     "RAG, MCP (Model Context Protocol), OpenAI-compatible API standard, vector databases, "
     "LangChain/LlamaIndex, RAGAS evaluation, Responsible AI"),
    ("Engineering & Data:",
     "Python, SQL, Java, JavaScript, Pandas (DataFrames), NumPy, Scikit-learn, XGBoost, FastAPI, "
     "Streamlit, Gradio, Docker, Kubernetes, TensorRT, Git"),
]

RESEARCH = {
    "role": "Undergraduate Research Award (UGRA) & Teaching Assistant",
    "meta": "  |  York University  |  ",
    "date": "2025",
    "sub": "Supervisor: Prof. Navid Mohaghegh  —  Spatio-Temporal Ultrasound Needle Segmentation",
    "bullets": [
        "Held a **UGRA** research award for AI-assisted needle localization in ultrasound, alongside "
        "teaching assistant duties for Prof. Mohaghegh.",
        "Built a PyTorch and MONAI segmentation pipeline pairing Swin Transformer **spatial** feature "
        "extraction with ConvLSTM **temporal** modelling across frames.",
        "Drove preprocessing, model development, and frame-level evaluation on sequential ultrasound, "
        "scoring segmentation quality with Dice and IoU.",
    ],
}

PROJECTS = [
    {
        "role": "AI Credit Risk & Loan Decision Support System",
        "meta": "  |  Python  |  Scikit-learn  |  XGBoost  |  Explainable AI  |  ",
        "date": "2026",
        "bullets": [
            "Modelled borrower credit history and financial attributes to estimate loan eligibility and "
            "default risk.",
            "Tuned against a heavily **imbalanced** default population, weighing false positives against "
            "false negatives across precision, recall, F1, ROC-AUC, and confusion-matrix analysis.",
            "Surfaced the features driving each decision and framed output as decision support, keeping "
            "the final lending call with a human reviewer.",
        ],
    },
    {
        "role": "Enterprise Document Question-Answering Assistant",
        "meta": "  |  Python  |  RAG  |  MCP  |  FastAPI  |  Gradio  |  RAGAS  |  ",
        "date": "2026",
        "bullets": [
            "Shipped a RAG assistant over company policies, audit procedures, risk reports, and "
            "cybersecurity documentation in PDF and Word.",
            "Exposed retrieval as **MCP** tools behind an OpenAI-compatible API so agentic clients can "
            "drive the assistant directly.",
            "Returned page-level citations and abstained when the corpus lacked evidence, rather than "
            "answering from thin retrieval.",
            "Tuned chunking and retrieval against **RAGAS** faithfulness scores, behind role-based "
            "permissions.",
        ],
    },
    {
        "role": "Medical Image Cancer Detection Prototype",
        "meta": "  |  Python  |  PyTorch  |  EfficientNet-B0  |  TensorRT  |  Streamlit  |  ",
        "date": "2025",
        "bullets": [
            "Trained a CNN classifier that standardizes images to 224 x 224 RGB, with a sigmoid "
            "probability and an adjustable decision threshold.",
            "Cut model size and inference latency with **TensorRT** quantization and pruning, tracking "
            "the accuracy trade-off at each step.",
            "Added visual interpretability for reviewer oversight, labelled clearly as educational and "
            "research-only rather than diagnostic.",
        ],
    },
]

EDU = {
    "role": "York University, Lassonde School of Engineering",
    "meta": "  |  Toronto (Markham Campus)  |  ",
    "date": "Expected 2029",
    "sub": "Bachelor of Applied Science (BASc), Computer Science for Software Development, Co-op  |  GPA: 6.7/9.0",
}

ADDITIONAL = [
    ("Operations Assistant", "York University", "May 2026 - Sep 2026"),
    ("Program & Administrative Assistant", "YMCA of Greater Toronto", "Dec 2024 - Jan 2026"),
    ("IT Support & Lab Assistant, Volunteer", "Toronto Public Library", "Mar 2023 - Sep 2023"),
]

CERT = ("AI-103: Developing AI Apps and Agents on Azure", "Microsoft", "In Progress")


def split_bold(text):
    """'a **b** c' -> [('a ',False),('b',True),(' c',False)]"""
    return [(part, i % 2 == 1) for i, part in enumerate(re.split(r"\*\*", text)) if part]


# --------------------------------------------------------------------- html ---
def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def html_rich(text):
    return "".join(f"<b>{esc(t)}</b>" if b else esc(t) for t, b in split_bold(text))


def build_html(path):
    o = []
    o.append("""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Mohsen Fekri - Resume</title>
<style>
  @page { size: Letter; margin: 0.38in 0.55in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Liberation Serif", "Times New Roman", Georgia, serif;
         font-size: 9.05pt; line-height: 1.19; color: #111; }
  .name { text-align: center; font-size: 19pt; font-weight: 700; color: #1F3B63;
          letter-spacing: .5px; margin: 0 0 1pt; }
  .tagline { text-align: center; font-size: 10pt; font-weight: 700; margin: 0 0 2pt; }
  .contact { text-align: center; font-size: 9.2pt; color: #555; margin: 0 0 4pt; }
  h2 { font-size: 9.9pt; color: #1F3B63; text-transform: uppercase; letter-spacing: .4px;
       margin: 5pt 0 2pt; padding-bottom: 1.2pt; border-bottom: 1px solid #1F3B63; }
  p { margin: 0 0 2pt; }
  .role { font-weight: 700; font-size: 10pt; }
  .meta { color: #555; }
  .sub { font-style: italic; color: #555; margin-bottom: 2pt; }
  ul { margin: 1pt 0 2pt; padding-left: 13pt; }
  li { margin: 0 0 1pt; }
  .entry { margin-top: 2pt; }
  .skill { margin-bottom: 1.5pt; }
</style>
</head>
<body>
""")
    o.append(f'<div class="name">{esc(NAME)}</div>')
    o.append(f'<div class="tagline">{esc(TAGLINE)}</div>')
    o.append(f'<div class="contact">{esc(CONTACT)}</div>')

    o.append("<h2>Professional Summary</h2>")
    o.append(f"<p>{esc(SUMMARY)}</p>")

    o.append("<h2>Technical Skills</h2>")
    for label, items in SKILLS:
        o.append(f'<p class="skill"><b>{esc(label)}</b> {esc(items)}</p>')

    def entry(d, with_sub_italic=True):
        o.append('<div class="entry">')
        o.append(f'  <span class="role">{esc(d["role"])}</span>'
                 f'<span class="meta">{esc(d["meta"])}</span><b>{esc(d["date"])}</b>')
        if d.get("sub"):
            cls = "sub" if with_sub_italic else "meta"
            o.append(f'  <div class="{cls}">{esc(d["sub"])}</div>')
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

    o.append("<h2>Education</h2>")
    entry(EDU, with_sub_italic=False)

    o.append("<h2>Additional Experience</h2>")
    for title, org, dates in ADDITIONAL:
        o.append(f'<p><b>{esc(title)}</b><span class="meta">  |  {esc(org)}  |  </span><b>{esc(dates)}</b></p>')

    o.append("<h2>Certification In Progress</h2>")
    o.append(f'<p><b>{esc(CERT[0])}</b><span class="meta">  |  {esc(CERT[1])}  |  </span><b>{esc(CERT[2])}</b></p>')

    o.append("</body>\n</html>")
    open(path, "w").write("\n".join(o))
    print("wrote", path)


# --------------------------------------------------------------------- docx ---
def build_docx(path):
    from docx import Document
    from docx.shared import Pt, RGBColor, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    NAVY = RGBColor(0x1F, 0x3B, 0x63)
    GREY = RGBColor(0x55, 0x55, 0x55)

    doc = Document()
    s = doc.sections[0]
    s.top_margin = s.bottom_margin = Inches(0.38)
    s.left_margin = s.right_margin = Inches(0.55)
    st = doc.styles["Normal"]
    st.font.name = "Calibri"
    st.font.size = Pt(9.2)
    st.paragraph_format.space_after = Pt(0)
    st.paragraph_format.space_before = Pt(0)

    def para(after=0, before=0, align=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(after)
        p.paragraph_format.space_before = Pt(before)
        if align:
            p.alignment = align
        return p

    def run(p, text, bold=False, italic=False, size=9.2, color=None):
        r = p.add_run(text)
        r.bold, r.italic = bold, italic
        r.font.size = Pt(size)
        if color:
            r.font.color.rgb = color
        return r

    def heading(text):
        p = para(after=2, before=5)
        run(p, text.upper(), bold=True, size=10, color=NAVY)
        pPr = p._p.get_or_add_pPr()
        bd = OxmlElement("w:pBdr")
        b = OxmlElement("w:bottom")
        b.set(qn("w:val"), "single"); b.set(qn("w:sz"), "8")
        b.set(qn("w:space"), "1"); b.set(qn("w:color"), "1F3B63")
        bd.append(b); pPr.append(bd)

    def bullet(text):
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(0.5)
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.first_line_indent = Inches(-0.12)
        for t, b in split_bold(text):
            run(p, t, bold=b)

    def entry(d, sub_italic=True):
        p = para(after=0, before=2)
        run(p, d["role"], bold=True, size=9.8)
        run(p, d["meta"], color=GREY)
        run(p, d["date"], bold=True)
        if d.get("sub"):
            p = para(after=1)
            run(p, d["sub"], italic=sub_italic, color=GREY)
        for b in d.get("bullets", []):
            bullet(b)

    p = para(align=WD_ALIGN_PARAGRAPH.CENTER, after=1)
    run(p, NAME, bold=True, size=19, color=NAVY)
    p = para(align=WD_ALIGN_PARAGRAPH.CENTER, after=2)
    run(p, TAGLINE, bold=True, size=10)
    p = para(align=WD_ALIGN_PARAGRAPH.CENTER, after=3)
    run(p, CONTACT, color=GREY)

    heading("Professional Summary")
    p = para(after=2)
    run(p, SUMMARY)

    heading("Technical Skills")
    for label, items in SKILLS:
        p = para(after=1)
        run(p, label + " ", bold=True)
        run(p, items)

    heading("AI Research Experience")
    entry(RESEARCH)

    heading("Selected AI Projects")
    for pr in PROJECTS:
        entry(pr)

    heading("Education")
    entry(EDU, sub_italic=False)

    heading("Additional Experience")
    for title, org, dates in ADDITIONAL:
        p = para(after=1)
        run(p, title, bold=True)
        run(p, f"  |  {org}  |  ", color=GREY)
        run(p, dates, bold=True)

    heading("Certification In Progress")
    p = para(after=1)
    run(p, CERT[0], bold=True)
    run(p, f"  |  {CERT[1]}  |  ", color=GREY)
    run(p, CERT[2], bold=True)

    doc.save(path)
    print("wrote", path)


if __name__ == "__main__":
    build_html(sys.argv[1])
    build_docx(sys.argv[2])
