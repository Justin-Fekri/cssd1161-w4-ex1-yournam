"""Find the largest base font size whose rendered PDF still fits on exactly one page."""
import subprocess, sys, os

S = "/tmp/claude-0/-home-user-cssd1161-w4-ex1-yournam/5a41e21a-969b-5348-8b51-5ac27c19b297/scratchpad"
OUTDIR = sys.argv[1]
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
HTML = os.path.join(OUTDIR, "resume.html")
DOCX = os.path.join(OUTDIR, "Mohsen_Fekri_EY_Resume_v2.docx")
PDF = os.path.join(OUTDIR, "Mohsen_Fekri_EY_Resume_v2.pdf")


def pages(path):
    d = open(path, "rb").read()
    return d.count(b"/Type /Page") - d.count(b"/Type /Pages")


def render(base):
    subprocess.run([sys.executable, f"{S}/build.py", HTML, DOCX, str(base)],
                   check=True, capture_output=True)
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu",
                    "--no-pdf-header-footer", f"--print-to-pdf={PDF}", f"file://{HTML}"],
                   check=True, capture_output=True)
    return pages(PDF)


best = None
size = 8.4
while size <= 10.6:
    n = render(round(size, 2))
    print(f"  {size:.2f}pt -> {n} page(s)", flush=True)
    if n == 1:
        best = round(size, 2)
    else:
        break
    size += 0.1

if best is None:
    print("FAIL: does not fit even at 8.4pt")
    sys.exit(1)

n = render(best)
print(f"FINAL: {best}pt, {n} page(s)")
