"""
test_system.py
==============
Automated verification suite for:
  1. Universal JSON Chunker (Syllabi, History, Math/Science, Question banks, nested JSONs)
  2. JSON Extraction & LaTeX Backslash Sanitizer
  3. PPTX Export with standard maths & history formatting
  4. PDF, DOCX, LaTeX Exports
"""

import os
import json
import traceback

from chunker import UniversalChunker, detect_subject
from pptx_utils import create_pptx, format_math_and_text
from pdf_utils import create_pdf
from docx_utils import create_docx
from latex_utils import create_tex
from app import _extract_json_from_llm_response


def test_chunker():
    print("\n--- TEST 1: Universal JSON Chunker ---")
    
    # 1. Syllabus Schema
    with open("CD_Calculus_Differential_Equations_context.json", "r", encoding="utf-8") as f:
        cde_data = json.load(f)
    cde_chunks = UniversalChunker.chunk_json_data(cde_data, "CD_Calculus.json")
    print(f"✅ Calculus Syllabus parsed: {len(cde_chunks)} chunks.")
    assert len(cde_chunks) >= 20, f"Expected >= 20 chunks, got {len(cde_chunks)}"
    assert any(c["item_type"] == "unit" for c in cde_chunks), "Missing unit chunks"
    assert any(c["item_type"] == "objective" for c in cde_chunks), "Missing objective chunks"

    # 2. History Schema
    history_data = {
        "topic": "Indian Freedom Movement and World War II",
        "events": [
            {
                "year": "1942",
                "title": "Quit India Movement",
                "description": "Mahatma Gandhi launched the civil disobedience movement at Bombay calling for 'Do or Die'.",
                "significance": "United nationwide resistance and intensified pressure on British colonial rule."
            },
            {
                "year": "1757",
                "title": "Battle of Plassey",
                "description": "Clash between British East India Company led by Robert Clive and Nawab Siraj-ud-Daulah.",
                "significance": "Marked the beginning of British territorial dominion in India."
            }
        ],
        "historical_sources": [
            {
                "title": "Proclamation of 1858",
                "author": "Queen Victoria",
                "extract": "We hereby announce to the Princes of India that all Treaties and Engagements made with them are accepted.",
                "context": "Direct assumption of Indian governance by the British Crown following 1857 revolt."
            }
        ]
    }
    hist_chunks = UniversalChunker.chunk_json_data(history_data, "history_freedom.json")
    print(f"✅ History Dataset parsed: {len(hist_chunks)} chunks.")
    assert len(hist_chunks) == 3, f"Expected 3 history chunks, got {len(hist_chunks)}"
    assert all(c["subject"] == "History" for c in hist_chunks), "History subject detection failed"

    # 3. Question Bank / MCQ Schema
    qbank_data = {
        "title": "Physics Mechanics Problems",
        "questions": [
            {"text": "Calculate the terminal velocity of a spherical particle $r=2\\text{mm}$ in glycerol.", "marks": 15, "solution": "$v_t = \\frac{2r^2(\\rho-\\sigma)g}{9\\eta}$"},
            {"text": "State the work-energy theorem and prove it for a variable force.", "marks": 10}
        ]
    }
    q_chunks = UniversalChunker.chunk_json_data(qbank_data, "physics_qbank.json")
    print(f"✅ Question Bank parsed: {len(q_chunks)} chunks.")
    assert len(q_chunks) == 2, f"Expected 2 question chunks, got {len(q_chunks)}"


def test_json_sanitizer():
    print("\n--- TEST 2: JSON Extraction & LaTeX Sanitizer ---")

    # Raw LLM output with unescaped LaTeX backslashes (\frac, \int, \partial, \alpha), thinking tags, markdown fence
    raw_llm_sample = """
<think>
User wants multivariable calculus questions. I will format with double escaped backslashes.
</think>
```json
[
  {
    "q_index": 1,
    "text": "Find the directional derivative of $u(x,y) = x^2 y + \\frac{1}{2} x y^2$ at the point $(1,2)$ in the direction of vector $\\mathbf{v} = (1,1)$. Evaluate $\\int_0^1 \\sqrt{1-x^2} dx$.",
    "marks": 25,
    "image_spec": {
      "code": "x = np.linspace(-2, 2, 40)\\ny = np.linspace(-2, 2, 40)\\nX, Y = np.meshgrid(x, y)\\nZ = X**2 * Y + 0.5 * X * Y**2\\nax = fig.add_subplot(111, projection='3d')\\nax.plot_surface(X, Y, Z, cmap='viridis')\\nax.set_title('Surface Plot of u(x,y)')"
    }
  },
  {
    "q_index": 2,
    "text": "Analyze the historical significance of the Treaty of Versailles (1919) with respect to territorial concessions and reparations.",
    "marks": 25
  },
]
```
"""
    extracted = _extract_json_from_llm_response(raw_llm_sample)
    print(f"✅ JSON Extraction succeeded! Extracted {len(extracted)} question objects.")
    assert len(extracted) == 2, f"Expected 2 questions, got {len(extracted)}"
    assert "\\frac" in extracted[0]["text"] or "1/2" in extracted[0]["text"] or "frac" in extracted[0]["text"]


def test_pptx_and_multi_format_exports():
    print("\n--- TEST 3: PPTX & Multi-Format Exports ---")
    
    # Sample questions representing Maths, History, and Science
    test_questions = [
        {
            "id": 1,
            "q_index": 1,
            "text": "Evaluate the line integral $\\oint_C (x^2 y dx + x y^2 dy)$ along the closed curve $C$ enclosing region $R$. State and verify Green's Theorem $\\iint_R (\\frac{\\partial N}{\\partial x} - \\frac{\\partial M}{\\partial y}) dA$.",
            "marks": 25,
            "image_path": None
        },
        {
            "id": 2,
            "q_index": 2,
            "text": "Evaluate the primary causes of the Indian Revolt of 1857. Analyze: (a) The Doctrine of Lapse, (b) Socio-religious anxieties, and (c) Immediate military triggers.",
            "marks": 25,
            "image_path": None
        },
        {
            "id": 3,
            "q_index": 3,
            "text": "For an underdamped harmonic oscillator $m\\frac{d^2x}{dt^2} + b\\frac{dx}{dt} + kx = 0$, derive the general solution $x(t) = A e^{-\\gamma t} \\cos(\\omega t + \\phi)$ and find the damping ratio.",
            "marks": 25,
            "image_path": None
        }
    ]

    os.makedirs("static/exports", exist_ok=True)

    # 1. PPTX Export
    pptx_file = "static/exports/test_comprehensive_exam.pptx"
    create_pptx("Multivariable Calculus & History of Modern India", test_questions, 75, output_path=pptx_file)
    assert os.path.exists(pptx_file), "PPTX export file was not created"
    file_size_pptx = os.path.getsize(pptx_file)
    print(f"✅ PPTX Export created successfully ({file_size_pptx / 1024:.1f} KB): {pptx_file}")

    # 2. PDF Export
    pdf_file = "static/exports/test_comprehensive_exam.pdf"
    create_pdf("Multivariable Calculus & History of Modern India", test_questions, 75, output_path=pdf_file)
    assert os.path.exists(pdf_file), "PDF export file was not created"
    file_size_pdf = os.path.getsize(pdf_file)
    print(f"✅ PDF Export created successfully ({file_size_pdf / 1024:.1f} KB): {pdf_file}")

    # 3. DOCX Export
    docx_file = "static/exports/test_comprehensive_exam.docx"
    create_docx("Multivariable Calculus & History of Modern India", test_questions, 75, output_path=docx_file)
    assert os.path.exists(docx_file), "DOCX export file was not created"
    file_size_docx = os.path.getsize(docx_file)
    print(f"✅ DOCX Export created successfully ({file_size_docx / 1024:.1f} KB): {docx_file}")

    # 4. LaTeX Export
    tex_file = "static/exports/test_comprehensive_exam.tex"
    create_tex("Multivariable Calculus & History of Modern India", test_questions, 75, output_path=tex_file)
    assert os.path.exists(tex_file), "LaTeX export file was not created"
    file_size_tex = os.path.getsize(tex_file)
    print(f"✅ LaTeX Export created successfully ({file_size_tex / 1024:.1f} KB): {tex_file}")


if __name__ == "__main__":
    try:
        test_chunker()
        test_json_sanitizer()
        test_pptx_and_multi_format_exports()
        print("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉\n")
    except Exception as e:
        print(f"\n❌ TEST SUITE FAILED: {e}")
        traceback.print_exc()
