"""
pdf_utils.py
============
Generates a professionally formatted, publication-grade Examination PDF
using ReportLab Platypus with embedded Matplotlib diagrams.

Layout per page:
  ┌─────────────────────────────────────────────┐
  │  INSTITUTION / EXAM TITLE (centred, bold)   │
  │  Course · Year · Max Marks · Time           │
  ├─────────────────────────────────────────────┤
  │  GENERAL INSTRUCTIONS (shaded box)          │
  │  Marks Distribution Table                   │
  ├─────────────────────────────────────────────┤
  │  Q1.  [Question text …]          [15 Marks] │
  │       [Diagram if any — centred]            │
  │       _____________________________________ │  ← answer line(s)
  │  Q2.  …                                     │
  └─────────────────────────────────────────────┘
  Footer: "Page X of Y"  |  ExamGen © 2026
"""

import os
import re
from typing import List, Dict, Any, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage,
    Table, TableStyle, HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY


# ─────────────────────────── Page dimensions ──────────────────────────────
PAGE_W, PAGE_H = A4            # 595.27 × 841.89 pts
L_MARGIN = R_MARGIN = 45
T_MARGIN = B_MARGIN = 52
CONTENT_W = PAGE_W - L_MARGIN - R_MARGIN   # ~505 pts


# ─────────────────────────── Two-pass canvas for "Page X of Y" ────────────
class NumberedCanvas(canvas.Canvas):
    """Canvas that performs two-pass rendering to display 'Page X of Y'."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states: list = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_chrome(num_pages)
            super().showPage()
        super().save()

    def _draw_chrome(self, total_pages: int):
        self.saveState()
        # ── Header rule ──────────────────────────────────────────────────
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.6)
        self.line(L_MARGIN, PAGE_H - T_MARGIN + 6, PAGE_W - R_MARGIN, PAGE_H - T_MARGIN + 6)

        # ── Footer ───────────────────────────────────────────────────────
        self.line(L_MARGIN, B_MARGIN - 10, PAGE_W - R_MARGIN, B_MARGIN - 10)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(L_MARGIN, B_MARGIN - 22, "ExamGen Autonomous Examination System")
        self.drawRightString(PAGE_W - R_MARGIN, B_MARGIN - 22,
                             f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()


# ─────────────────────────── LaTeX → readable text ────────────────────────
def _clean_text_for_pdf(text: str) -> str:
    """
    Converts LaTeX math markup into clean readable Unicode + ReportLab XML tags.
    Strips raw figure environments since images are embedded separately.
    """
    if not text:
        return ""

    # Remove LaTeX figure environments
    text = re.sub(r"\\begin\{figure\}[\s\S]*?\\end\{figure\}", "", text)
    text = re.sub(r"\\includegraphics(\[.*?\])?\{.*?\}", "", text)
    text = re.sub(r"\\caption\{.*?\}", "", text)
    text = re.sub(r"\\centering", "", text)
    text = re.sub(r"\\label\{.*?\}", "", text)

    replacements = [
        # Fractions & roots
        (r"\\frac\{([^}]+)\}\{([^}]+)\}", r"(\1 / \2)"),
        (r"\\sqrt\{([^}]+)\}", r"√(\1)"),
        (r"\\sqrt", "√"),
        # Calculus
        (r"\\partial", "∂"),
        (r"\\nabla", "∇"),
        (r"\\int_\{?([^}^ ]+)\}?\^\{?([^}^ ]+)\}?", r"∫[\1 to \2]"),
        (r"\\int", "∫"),
        (r"\\oint", "∮"),
        (r"\\sum_\{?([^}^ ]+)\}?\^\{?([^}^ ]+)\}?", r"∑[\1 to \2]"),
        (r"\\sum", "∑"),
        (r"\\prod", "∏"),
        (r"\\lim_\{([^}]+)\}", r"lim[\1]"),
        # Greek
        (r"\\alpha", "α"),    (r"\\Alpha", "Α"),
        (r"\\beta",  "β"),    (r"\\Beta",  "Β"),
        (r"\\gamma", "γ"),    (r"\\Gamma", "Γ"),
        (r"\\delta", "δ"),    (r"\\Delta", "Δ"),
        (r"\\epsilon","ε"),
        (r"\\zeta",  "ζ"),
        (r"\\eta",   "η"),
        (r"\\theta", "θ"),    (r"\\Theta", "Θ"),
        (r"\\lambda","λ"),    (r"\\Lambda","Λ"),
        (r"\\mu",    "μ"),
        (r"\\nu",    "ν"),
        (r"\\xi",    "ξ"),    (r"\\Xi",    "Ξ"),
        (r"\\pi",    "π"),    (r"\\Pi",    "Π"),
        (r"\\rho",   "ρ"),
        (r"\\sigma", "σ"),    (r"\\Sigma", "Σ"),
        (r"\\tau",   "τ"),
        (r"\\phi",   "φ"),    (r"\\Phi",   "Φ"),
        (r"\\chi",   "χ"),
        (r"\\psi",   "ψ"),    (r"\\Psi",   "Ψ"),
        (r"\\omega", "ω"),    (r"\\Omega", "Ω"),
        # Operators & symbols
        (r"\\infty", "∞"),
        (r"\\pm",    "±"),    (r"\\mp",    "∓"),
        (r"\\times", "×"),    (r"\\div",   "÷"),
        (r"\\cdot",  "·"),
        (r"\\leq",   "≤"),    (r"\\geq",   "≥"),
        (r"\\neq",   "≠"),    (r"\\approx","≈"),
        (r"\\equiv", "≡"),    (r"\\sim",   "~"),
        (r"\\propto","∝"),
        (r"\\to",    "→"),    (r"\\rightarrow","→"),
        (r"\\leftarrow","←"), (r"\\Rightarrow","⇒"),
        (r"\\Leftrightarrow","⟺"),
        (r"\\forall","∀"),    (r"\\exists","∃"),
        (r"\\in",    "∈"),    (r"\\notin","∉"),
        (r"\\subset","⊂"),    (r"\\subseteq","⊆"),
        (r"\\cup",   "∪"),    (r"\\cap",   "∩"),
        (r"\\circ",  "∘"),    (r"\\bullet","•"),
        (r"\\perp",  "⊥"),    (r"\\parallel","∥"),
        (r"\\angle", "∠"),    (r"\\triangle","△"),
        # Trig / log
        (r"\\sin", "sin"),   (r"\\cos", "cos"),
        (r"\\tan", "tan"),   (r"\\sec", "sec"),
        (r"\\csc", "csc"),   (r"\\cot", "cot"),
        (r"\\exp", "exp"),   (r"\\log", "log"),
        (r"\\ln",  "ln"),    (r"\\max", "max"),
        (r"\\min", "min"),
        # Formatting
        (r"\\mathbf\{([^}]+)\}", r"<b>\1</b>"),
        (r"\\textbf\{([^}]+)\}", r"<b>\1</b>"),
        (r"\\textit\{([^}]+)\}", r"<i>\1</i>"),
        (r"\\emph\{([^}]+)\}",   r"<i>\1</i>"),
        (r"\\mathit\{([^}]+)\}", r"<i>\1</i>"),
        (r"\\mathbb\{R\}\^?(\d+)?", r"ℝ\1"),
        (r"\\mathbb\{([^}]+)\}", r"\1"),
        (r"\\mathrm\{([^}]+)\}", r"\1"),
        (r"\\text\{([^}]+)\}",   r"\1"),
        # Superscripts / subscripts (simple)
        (r"\^\{([^}]+)\}", r"^\1"),
        (r"_\{([^}]+)\}",  r"_\1"),
    ]

    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text)

    # Strip remaining inline math delimiters
    text = re.sub(r"\\\((.*?)\\\)", r"\1", text, flags=re.DOTALL)
    text = re.sub(r"\\\[(.*?)\\\]", r"\1", text, flags=re.DOTALL)
    text = re.sub(r"\$\$([^\$]+)\$\$", r"\1", text)
    text = re.sub(r"\$([^\$]+)\$", r"\1", text)

    # Escape HTML-special chars not part of tags we added
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Restore bold/italic tags
    for tag in ("b", "i"):
        text = text.replace(f"&lt;{tag}&gt;", f"<{tag}>")
        text = text.replace(f"&lt;/{tag}&gt;", f"</{tag}>")

    # Replace newlines → paragraph breaks
    text = re.sub(r"\n{2,}", "<br/><br/>", text)
    text = text.replace("\n", "<br/>")

    # Strip leftover LaTeX commands
    text = re.sub(r"\\[a-zA-Z]+\{([^}]*)\}", r"\1", text)
    text = re.sub(r"\\[a-zA-Z]+", "", text)

    return text.strip()


# ─────────────────────────── Style factory ────────────────────────────────
def _build_styles():
    base = getSampleStyleSheet()

    def S(name, **kw):
        return ParagraphStyle(name, parent=base["Normal"], **kw)

    return {
        "institution": S(
            "Institution",
            fontName="Helvetica-Bold", fontSize=9, leading=12,
            alignment=TA_CENTER, textColor=colors.HexColor("#64748b"),
            spaceBefore=0, spaceAfter=2,
        ),
        "title": S(
            "ExamTitle",
            fontName="Helvetica-Bold", fontSize=19, leading=24,
            alignment=TA_CENTER, textColor=colors.HexColor("#0f172a"),
            spaceBefore=4, spaceAfter=4,
        ),
        "meta": S(
            "ExamMeta",
            fontName="Helvetica", fontSize=9.5, leading=13,
            alignment=TA_CENTER, textColor=colors.HexColor("#475569"),
            spaceAfter=6,
        ),
        "inst_body": S(
            "InstBody",
            fontName="Helvetica-Oblique", fontSize=9, leading=13,
            textColor=colors.HexColor("#334155"),
        ),
        "section_header": S(
            "SectionHeader",
            fontName="Helvetica-Bold", fontSize=12, leading=16,
            alignment=TA_CENTER, textColor=colors.HexColor("#ffffff"),
            spaceBefore=8, spaceAfter=4,
        ),
        "q_number": S(
            "QNumber",
            fontName="Helvetica-Bold", fontSize=11, leading=15,
            textColor=colors.HexColor("#1e40af"),
        ),
        "q_marks": S(
            "QMarks",
            fontName="Helvetica-Bold", fontSize=10, leading=14,
            alignment=TA_RIGHT, textColor=colors.HexColor("#0284c7"),
        ),
        "q_body": S(
            "QBody",
            fontName="Helvetica", fontSize=10.5, leading=16,
            textColor=colors.HexColor("#1e293b"),
            spaceAfter=4, firstLineIndent=0,
        ),
        "caption": S(
            "FigCaption",
            fontName="Helvetica-Oblique", fontSize=8.5, leading=11,
            alignment=TA_CENTER, textColor=colors.HexColor("#64748b"),
            spaceBefore=2, spaceAfter=6,
        ),
        "marks_cell_hdr": S(
            "MCH",
            fontName="Helvetica-Bold", fontSize=9, leading=12,
            alignment=TA_CENTER, textColor=colors.HexColor("#ffffff"),
        ),
        "marks_cell": S(
            "MC",
            fontName="Helvetica", fontSize=9, leading=12,
            alignment=TA_CENTER, textColor=colors.HexColor("#0f172a"),
        ),
    }


# ─────────────────────────── Answer-space lines ───────────────────────────
def _answer_space(marks: int) -> list:
    """
    Inserts ruled lines for answers proportional to marks weight.
    Returns a list of Platypus flowables.
    """
    n_lines = min(max(3, marks // 3), 10)
    flowables = [Spacer(1, 4)]
    for _ in range(n_lines):
        flowables.append(
            HRFlowable(
                width="94%", thickness=0.4,
                color=colors.HexColor("#cbd5e1"),
                spaceBefore=9, spaceAfter=0,
                hAlign="CENTER"
            )
        )
    flowables.append(Spacer(1, 8))
    return flowables


# ─────────────────────────── Main PDF builder ─────────────────────────────
def create_pdf(
    exam_title: str,
    questions: List[Dict[str, Any]],
    max_marks: int,
    output_path: str,
    institution: str = "University Examination Board",
    course_code: str = "",
    exam_year: str = "2026",
) -> str:
    """
    Builds a publication-grade Examination PDF with:
    • Branded header (institution, title, metadata)
    • General instructions box
    • Marks distribution summary table
    • Professionally typeset questions with embedded diagrams
    • Answer-space ruling lines
    • 'Page X of Y' footer via two-pass canvas
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    base_dir = os.path.dirname(os.path.abspath(__file__))

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=R_MARGIN,
        leftMargin=L_MARGIN,
        topMargin=T_MARGIN,
        bottomMargin=B_MARGIN,
    )

    st = _build_styles()
    story = []

    # ── Brand / Title ──────────────────────────────────────────────────────
    story.append(Paragraph(institution.upper(), st["institution"]))
    story.append(Paragraph(exam_title.upper(), st["title"]))

    course_str = f"Course Code: {course_code}  |  " if course_code else ""
    meta_line = (
        f"{course_str}"
        f"Examination Year: {exam_year}  |  "
        f"Maximum Marks: <b>{max_marks}</b>  |  "
        f"Total Questions: <b>{len(questions)}</b>  |  "
        f"Time Allowed: <b>3 Hours</b>"
    )
    story.append(Paragraph(meta_line, st["meta"]))
    story.append(HRFlowable(
        width="100%", thickness=2,
        color=colors.HexColor("#0f172a"),
        spaceBefore=4, spaceAfter=10
    ))

    # ── General Instructions ───────────────────────────────────────────────
    inst_lines = [
        "<b>GENERAL INSTRUCTIONS:</b>",
        "1. All questions are compulsory unless specified otherwise.",
        "2. Candidates must show all working, intermediate steps, and derivations to earn full marks.",
        "3. Draw diagrams wherever necessary; label all parts clearly.",
        "4. Figures, graphs and diagrams are provided with the respective question.",
        "5. Use of scientific calculator is permitted unless otherwise notified.",
    ]
    inst_html = "<br/>".join(inst_lines)
    inst_table = Table(
        [[Paragraph(inst_html, st["inst_body"])]],
        colWidths=[CONTENT_W]
    )
    inst_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX",           (0, 0), (-1, -1), 0.7, colors.HexColor("#94a3b8")),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(inst_table)
    story.append(Spacer(1, 12))

    # ── Marks Distribution Table ───────────────────────────────────────────
    mdist_data = [
        [Paragraph("Q.No", st["marks_cell_hdr"])] +
        [Paragraph(str(i), st["marks_cell_hdr"]) for i in range(1, len(questions) + 1)] +
        [Paragraph("Total", st["marks_cell_hdr"])]
    ]
    marks_row = [Paragraph("Marks", st["marks_cell_hdr"])]
    for q in questions:
        q_d = dict(q) if isinstance(q, dict) else q.__dict__
        marks_row.append(Paragraph(str(q_d.get("marks", 0)), st["marks_cell"]))
    marks_row.append(Paragraph(str(max_marks), st["marks_cell"]))
    mdist_data.append(marks_row)

    col_count = len(questions) + 2   # Q.No col + question cols + Total col
    col_w = CONTENT_W / col_count
    mdist_table = Table(mdist_data, colWidths=[col_w] * col_count, repeatRows=1)
    mdist_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("BACKGROUND",    (0, 1), (-1, -1), colors.HexColor("#f1f5f9")),
        ("BACKGROUND",    (-1, 0), (-1, -1), colors.HexColor("#1e40af")),
        ("TEXTCOLOR",     (-1, 0), (-1, -1), colors.white),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
    ]))
    story.append(mdist_table)
    story.append(Spacer(1, 18))

    # ── Questions ──────────────────────────────────────────────────────────
    fig_counter = 0
    for idx, q in enumerate(questions, start=1):
        q_dict = dict(q) if isinstance(q, dict) else q.__dict__
        marks    = int(q_dict.get("marks", 0))
        raw_text = q_dict.get("text", "")
        clean    = _clean_text_for_pdf(raw_text)
        img_path = q_dict.get("image_path")

        q_elements = []

        # ── Question header row: "Question 1" | "[15 Marks]" ──────────────
        hdr_table = Table(
            [[Paragraph(f"Question {idx}", st["q_number"]),
              Paragraph(f"[{marks} Marks]", st["q_marks"])]],
            colWidths=[CONTENT_W * 0.72, CONTENT_W * 0.28]
        )
        hdr_table.setStyle(TableStyle([
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
            ("LINEBELOW",     (0, 0), (-1, 0), 0.8, colors.HexColor("#bfdbfe")),
        ]))
        q_elements.append(hdr_table)
        q_elements.append(Spacer(1, 6))

        # ── Question body ──────────────────────────────────────────────────
        q_elements.append(Paragraph(clean, st["q_body"]))

        # ── Embedded diagram ───────────────────────────────────────────────
        if img_path:
            abs_img = os.path.abspath(os.path.join(base_dir, img_path))
            if os.path.exists(abs_img):
                fig_counter += 1
                q_elements.append(Spacer(1, 8))
                try:
                    from PIL import Image as PILImage
                    with PILImage.open(abs_img) as pil_img:
                        iw, ih = pil_img.size
                    aspect = ih / iw
                    target_w = min(CONTENT_W * 0.78, 360)
                    target_h = target_w * aspect

                    img_flowable = RLImage(abs_img, width=target_w, height=target_h)
                    img_flowable.hAlign = "CENTER"

                    img_table = Table([[img_flowable]], colWidths=[CONTENT_W])
                    img_table.setStyle(TableStyle([
                        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
                        ("TOPPADDING",    (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                        ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                        ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                    ]))
                    q_elements.append(img_table)
                    q_elements.append(
                        Paragraph(f"Figure {fig_counter}", st["caption"])
                    )
                except ImportError:
                    # Pillow not available — fall back to fixed size
                    try:
                        img_flowable = RLImage(abs_img, width=340, height=210)
                        img_flowable.hAlign = "CENTER"
                        q_elements.append(img_flowable)
                        q_elements.append(Paragraph(f"Figure {fig_counter}", st["caption"]))
                    except Exception as img_err:
                        print(f"[PDF Export] Warning embedding image: {img_err}")
                except Exception as img_err:
                    print(f"[PDF Export] Warning embedding image: {img_err}")

        # ── Answer space ───────────────────────────────────────────────────
        q_elements.extend(_answer_space(marks))

        # ── Section divider ────────────────────────────────────────────────
        q_elements.append(
            HRFlowable(
                width="100%", thickness=0.6,
                color=colors.HexColor("#e2e8f0"),
                spaceBefore=0, spaceAfter=14
            )
        )

        story.append(KeepTogether(q_elements))

    # Build with page numbers
    doc.build(story, canvasmaker=NumberedCanvas)
    return output_path
