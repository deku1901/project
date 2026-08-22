import os
import re
import shutil
import subprocess
from typing import List, Dict, Any, Optional
from jinja2 import Template

EXAM_LATEX_TEMPLATE = r"""\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage{graphicx}
\usepackage{geometry}
\usepackage{enumitem}
\usepackage{fancyhdr}

\geometry{top=1in, bottom=1in, left=0.8in, right=0.8in}
\pagestyle{fancy}
\fancyhf{}
\rhead{Max Marks: {{ max_marks }}}
\lhead{Exam: {{ exam_title }}}
\rfoot{Page \thepage}

\begin{document}

\begin{center}
    {\LARGE \textbf{ {{ exam_title }} }} \\[0.5em]
    \textbf{Total Maximum Marks:} {{ max_marks }} \quad | \quad \textbf{Total Questions:} {{ questions|length }}
\end{center}

\vspace{1em}
\hrule
\vspace{1.5em}

\noindent \textbf{Instructions:} Answer all questions carefully. Show all mathematical derivations, intermediate steps, and calculations where applicable.

\vspace{1.5em}

\begin{enumerate}[label=\textbf{Q\arabic*.}, leftmargin=2em]
{% for q in questions %}
    \item \textbf{[{{ q.marks }} Marks]} {{ q.clean_text }}
    {% if q.abs_image_path %}
    \begin{center}
        \includegraphics[width=0.65\textwidth,keepaspectratio]{ {{- q.abs_image_path -}} }
    \end{center}
    {% endif %}
    \vspace{1em}
{% endfor %}
\end{enumerate}

\end{document}
"""


def _clean_latex_question_text(text: str) -> str:
    """Strips fake/unrendered figure environments from the question text."""
    if not text:
        return ""
    # Strip raw figure blocks since images are handled in the template
    text = re.sub(r"\\begin\{figure\}[\s\S]*?\\end\{figure\}", "", text)
    text = re.sub(r"\\includegraphics(\[.*?\])?\{.*?\}", "", text)
    text = re.sub(r"\\caption\{.*?\}", "", text)
    text = re.sub(r"\\centering", "", text)
    return text.strip()


def create_tex(
    exam_title: str,
    questions: List[Dict[str, Any]],
    max_marks: int,
    output_path: Optional[str] = None
) -> str:
    """
    Renders a clean LaTeX .tex file string from exam metadata and questions.
    If output_path is provided, writes to the file.
    """
    processed_questions = []
    base_dir = os.path.dirname(os.path.abspath(__file__))

    for q in questions:
        q_copy = dict(q) if isinstance(q, dict) else q.__dict__.copy()
        raw_text = q_copy.get("text", "")
        q_copy["clean_text"] = _clean_latex_question_text(raw_text)

        img_path = q_copy.get("image_path")
        if img_path:
            # Provide absolute path with forward slashes for LaTeX compatibility
            abs_img = os.path.abspath(os.path.join(base_dir, img_path)).replace("\\", "/")
            if os.path.exists(abs_img):
                q_copy["abs_image_path"] = abs_img
            else:
                q_copy["abs_image_path"] = None
        else:
            q_copy["abs_image_path"] = None
        processed_questions.append(q_copy)

    template = Template(EXAM_LATEX_TEMPLATE)
    tex_content = template.render(
        exam_title=exam_title,
        questions=processed_questions,
        max_marks=max_marks
    )

    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(tex_content)

    return tex_content


def compile_pdf(tex_path: str) -> str:
    """
    Compiles a .tex file to PDF using pdflatex.
    """
    tex_path = os.path.abspath(tex_path)
    output_dir = os.path.dirname(tex_path)
    base_name = os.path.splitext(os.path.basename(tex_path))[0]
    pdf_path = os.path.join(output_dir, f"{base_name}.pdf")

    if not shutil.which("pdflatex"):
        raise RuntimeError("pdflatex command not found.")

    process = subprocess.run(
        [
            "pdflatex",
            "-interaction=nonstopmode",
            "--disable-installer",
            f"-output-directory={output_dir}",
            tex_path
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=15
    )

    if not os.path.exists(pdf_path):
        raise RuntimeError(f"LaTeX compilation failed:\n{process.stdout[-400:]}")

    return pdf_path
