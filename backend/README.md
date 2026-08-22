# ExamGen — Autonomous Exam Paper Generation Studio

ExamGen is a full-stack, AI-powered exam generation web application designed for educators. It ingests course context (objectives, solutions, student learning states) as JSON, indexes them using a local FAISS vector store with SentenceTransformers, and orchestrates dual-LLM generation (primary creator + targeted editor) via OpenRouter. The system renders scientific diagrams using Matplotlib (Agg headless) and exports final exams to LaTeX (`.tex`), PDF (`pdflatex`), and Microsoft Word (`.docx`).

## Setup & Running

Create and activate a Python virtual environment (`python -m venv venv && source venv/bin/activate` or `venv\Scripts\activate` on Windows), install dependencies via `pip install -r requirements.txt`, set your OpenRouter environment variables (`export OPENROUTER_API_KEY="your_openrouter_api_key_here"` and `export OPENROUTER_MODEL="nvidia/nemotron-3.5-lightning:free"`), and launch the server with `uvicorn app:app --host 0.0.0.0 --port 8000 --reload`. Navigate to `http://localhost:8000` to start creating exams.

Install pdflatex (TeX Live) to enable PDF compile.

## Features
- **JSON Context Upload**: Automatically extracts and embeds course context into FAISS (`all-MiniLM-L6-v2`).
- **Dual-LLM Workflow**: Primary LLM generates structured LaTeX exam questions with marks and optional Matplotlib plot specifications; secondary editor LLM performs targeted inline revisions.
- **Interactive Exam Studio**: Edit question text directly in the browser (`contentEditable`), invoke AI edits with custom prompts, and save modifications in real-time to SQLite.
- **Multi-Format Export**: One-click export to LaTeX (`.tex`), compiled PDF (`pdflatex`), and formatted Word documents (`.docx`) with embedded figures.
