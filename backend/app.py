import os
import json
import re
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel, Session, create_engine, select

from models import ContextItem, Exam, Question, BlueprintConfig, GenerationLog
from vector_store import VectorStore
from llm_client import call_openrouter
from image_utils import render_plot_from_spec, execute_matplotlib_code, generate_plot_code_from_ai
from latex_utils import create_tex
from pdf_utils import create_pdf
from docx_utils import create_docx
from pptx_utils import create_pptx
from chunker import UniversalChunker, detect_subject, SUBJECT_KEYWORDS

DATABASE_URL = "sqlite:///./examgen.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

vector_store: Optional[VectorStore] = None
EXPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "exports")
IMAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "images")
os.makedirs(EXPORTS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)


def init_db():
    SQLModel.metadata.create_all(engine)
    # Automatic migration for existing SQLite database tables if columns are missing
    import sqlite3
    db_file = DATABASE_URL.replace("sqlite:///", "")
    if os.path.exists(db_file):
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        try:
            cursor.execute("PRAGMA table_info(contextitem)")
            existing_cols = {col[1] for col in cursor.fetchall()}
            if "subject" not in existing_cols:
                cursor.execute("ALTER TABLE contextitem ADD COLUMN subject VARCHAR DEFAULT 'General'")
            if "source_file" not in existing_cols:
                cursor.execute("ALTER TABLE contextitem ADD COLUMN source_file VARCHAR DEFAULT NULL")
            conn.commit()
        except Exception as e:
            print(f"[DB Migration Warning] {e}")
        finally:
            conn.close()
    # Seed default blueprint configs if table is empty
    _seed_default_blueprints()


def _seed_default_blueprints():
    """Ensures default exam profile presets exist in the database."""
    PRESETS = [
        {
            "name": "University Standard",
            "exam_profile": "university",
            "difficulty_json": json.dumps({"easy": 30, "medium": 50, "hard": 20}),
            "bloom_levels_json": json.dumps(["Remember", "Understand", "Apply", "Analyze"]),
            "question_types_json": json.dumps({"subjective": 60, "numerical": 25, "mcq": 15}),
            "nep_alignment_json": json.dumps({"co_mapping": True, "po_mapping": True, "cross_disciplinary": False, "formative": False}),
            "guardrails_json": json.dumps({"no_duplicate_topics": True, "min_hard_questions": 1, "balance_marks": True, "require_diagram": False}),
            "llm_temperature": 0.7, "llm_max_tokens": 4000, "llm_top_p": 0.9,
            "max_diagrams": 3, "time_minutes": 180, "is_default": True
        },
        {
            "name": "University Competitive",
            "exam_profile": "competitive",
            "difficulty_json": json.dumps({"easy": 20, "medium": 45, "hard": 35}),
            "bloom_levels_json": json.dumps(["Apply", "Analyze", "Evaluate"]),
            "question_types_json": json.dumps({"subjective": 40, "numerical": 35, "mcq": 25}),
            "nep_alignment_json": json.dumps({"co_mapping": True, "po_mapping": True, "cross_disciplinary": True, "formative": False}),
            "guardrails_json": json.dumps({"no_duplicate_topics": True, "min_hard_questions": 2, "balance_marks": True, "require_diagram": True}),
            "llm_temperature": 0.6, "llm_max_tokens": 4500, "llm_top_p": 0.85,
            "max_diagrams": 4, "time_minutes": 180, "is_default": False
        },
        {
            "name": "JEE Main Profile",
            "exam_profile": "jee_main",
            "difficulty_json": json.dumps({"easy": 15, "medium": 50, "hard": 35}),
            "bloom_levels_json": json.dumps(["Apply", "Analyze", "Evaluate"]),
            "question_types_json": json.dumps({"mcq": 65, "numerical": 35, "subjective": 0}),
            "nep_alignment_json": json.dumps({"co_mapping": True, "po_mapping": False, "cross_disciplinary": True, "formative": False}),
            "guardrails_json": json.dumps({"no_duplicate_topics": True, "min_hard_questions": 3, "balance_marks": True, "require_diagram": True}),
            "llm_temperature": 0.5, "llm_max_tokens": 5000, "llm_top_p": 0.8,
            "max_diagrams": 5, "time_minutes": 180, "is_default": False
        },
        {
            "name": "JEE Advanced Profile",
            "exam_profile": "jee_advanced",
            "difficulty_json": json.dumps({"easy": 5, "medium": 35, "hard": 60}),
            "bloom_levels_json": json.dumps(["Analyze", "Evaluate", "Create"]),
            "question_types_json": json.dumps({"mcq": 45, "numerical": 40, "subjective": 15}),
            "nep_alignment_json": json.dumps({"co_mapping": True, "po_mapping": False, "cross_disciplinary": True, "formative": False}),
            "guardrails_json": json.dumps({"no_duplicate_topics": True, "min_hard_questions": 5, "balance_marks": False, "require_diagram": True}),
            "llm_temperature": 0.4, "llm_max_tokens": 6000, "llm_top_p": 0.75,
            "max_diagrams": 5, "time_minutes": 180, "is_default": False
        },
    ]
    with Session(engine) as session:
        existing = session.exec(select(BlueprintConfig)).all()
        if not existing:
            for preset in PRESETS:
                session.add(BlueprintConfig(**preset))
            session.commit()
            print("[Init] Seeded 4 default blueprint configurations.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global vector_store
    init_db()
    vector_store = VectorStore()

    # Preload existing context items from SQLite into VectorStore
    with Session(engine) as session:
        items = session.exec(select(ContextItem)).all()
        if items:
            vector_store.add([
                {
                    "id": item.id,
                    "content": item.content,
                    "subject": item.subject or detect_subject(item.content),
                    "source_file": item.source_file or ""
                }
                for item in items
            ])
    yield


app = FastAPI(title="ExamGen Studio", lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static and frontend assets
if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")), name="static")
if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")):
    app.mount("/frontend", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")), name="frontend")


@app.get("/")
async def root():
    index_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"status": "ok", "service": "ExamGen Studio Backend"}


@app.get("/api/exams")
async def get_exams():
    """Returns list of recently generated exams."""
    with Session(engine) as session:
        exams = session.exec(select(Exam).order_by(Exam.created_at.desc())).all()
        result = []
        for e in exams:
            q_count = len(session.exec(select(Question).where(Question.exam_id == e.id)).all())
            result.append({
                "id": e.id,
                "title": e.title,
                "max_marks": e.max_marks,
                "n_questions": e.n_questions or q_count,
                "per_unit_weights_json": e.per_unit_weights_json,
                "created_at": e.created_at.isoformat() if hasattr(e.created_at, "isoformat") else str(e.created_at)
            })
        return result


@app.get("/api/exam/{exam_id}")
async def get_exam(exam_id: int):
    """Loads a specific exam and all its questions."""
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        questions = session.exec(
            select(Question).where(Question.exam_id == exam_id).order_by(Question.q_index)
        ).all()
        return {
            "exam": {
                "id": exam.id,
                "title": exam.title,
                "max_marks": exam.max_marks,
                "n_questions": exam.n_questions,
                "per_unit_weights_json": exam.per_unit_weights_json,
                "created_at": exam.created_at.isoformat() if hasattr(exam.created_at, "isoformat") else str(exam.created_at)
            },
            "questions": [
                {
                    "id": q.id,
                    "exam_id": q.exam_id,
                    "q_index": q.q_index,
                    "text": q.text,
                    "marks": q.marks,
                    "image_path": q.image_path,
                    "image_spec_json": q.image_spec_json,
                    "created_at": q.created_at.isoformat() if hasattr(q.created_at, "isoformat") else str(q.created_at)
                }
                for q in questions
            ]
        }


@app.get("/sample_context.json")
@app.get("/api/context/sample")
async def get_sample_context():
    """Serves the pre-configured sample context JSON."""
    sample_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_context.json")
    if os.path.exists(sample_file):
        return FileResponse(sample_file, media_type="application/json")
    # Fallback inline sample
    return JSONResponse([
        {
            "type": "course_objective",
            "topic": "Calculus & Differential Equations",
            "content": "Students must understand directional derivatives, gradient vectors, and 3D surface rates of change for multivariable functions u(x,y)."
        },
        {
            "type": "problem_solution",
            "topic": "Damped Harmonic Oscillation",
            "content": "For an underdamped oscillator, the displacement is x(t) = A exp(-gamma*t) cos(omega*t + phi)."
        }
    ])


@app.get("/api/context/stats")
async def get_context_stats():
    """Returns the count of indexed items, subject breakdown, and recent items."""
    with Session(engine) as session:
        items = session.exec(select(ContextItem)).all()
        # Subject breakdown from DB
        subject_counts: Dict[str, int] = {}
        for item in items:
            subj = item.subject or "General"
            subject_counts[subj] = subject_counts.get(subj, 0) + 1
        # Also merge live vector-store subject counts
        if vector_store:
            vs_counts = vector_store.get_subject_stats()
            for subj, cnt in vs_counts.items():
                if subj not in subject_counts:
                    subject_counts[subj] = cnt
        recent = [
            {
                "id": item.id,
                "type": item.item_type,
                "subject": item.subject or "General",
                "source_file": item.source_file or "",
                "content": item.content[:150] + ("..." if len(item.content) > 150 else "")
            }
            for item in items[-8:]
        ]
        return {
            "status": "success",
            "total_items": len(items),
            "subject_breakdown": subject_counts,
            "recent_items": recent
        }


# ── Subject Classifier ──────────────────────────────────────────────────────
# Fast rule-based keyword detector covering 12+ academic disciplines at
# primary, secondary, and university levels.  Zero LLM cost.
_SUBJECT_KEYWORDS: Dict[str, List[str]] = {
    "Mathematics": [
        "calculus", "algebra", "geometry", "trigonometry", "matrix", "determinant",
        "integral", "derivative", "equation", "theorem", "proof", "polynomial",
        "vector", "linear", "differential", "series", "sequence", "logarithm",
        "arithmetic", "quadratic", "binomial", "permutation", "combination",
        "coordinate", "gradient", "divergence", "curl", "laplace", "fourier",
        "eigenvalue", "eigenvector", "set theory", "number theory", "topology",
        "modular", "probability", "statistics", "bayes",
    ],
    "Physics": [
        "force", "velocity", "acceleration", "momentum", "energy", "power",
        "wave", "optics", "lens", "mirror", "thermodynamics", "quantum",
        "newton", "electric", "magnetic", "circuit", "oscillation", "relativity",
        "gravitational", "nuclear", "radioactive", "photon", "electron", "proton",
        "capacitor", "resistor", "inductor", "semiconductor", "electrostatics",
        "current", "voltage", "resistance", "refraction", "diffraction", "interference",
        "projectile", "friction", "torque", "angular momentum", "entropy",
    ],
    "Biology": [
        "cell", "organism", "dna", "rna", "protein", "evolution", "ecology",
        "anatomy", "photosynthesis", "mitosis", "meiosis", "gene", "chromosome",
        "neuron", "enzyme", "bacteria", "virus", "tissue", "organ", "respiration",
        "metabolism", "hormone", "immune", "genetics", "heredity", "mutation",
        "biome", "ecosystem", "food chain", "nervous system", "endocrine",
        "cardiovascular", "digestion", "osmosis", "diffusion", "taxonomy",
    ],
    "Chemistry": [
        "atom", "molecule", "reaction", "bond", "acid", "base", "salt",
        "orbital", "periodic", "titration", "oxidation", "reduction", "polymer",
        "hydrocarbon", "electrolysis", "catalyst", "valence", "mole", "stoichiometry",
        "enthalpy", "entropy", "equilibrium", "ph", "isomer", "functional group",
        "organic", "inorganic", "spectroscopy", "chromatography", "thermochemistry",
    ],
    "Computer Science": [
        "algorithm", "data structure", "programming", "database", "network",
        "operating system", "compiler", "recursion", "sorting", "binary tree",
        "complexity", "machine learning", "artificial intelligence", "neural network",
        "software", "hardware", "internet", "encryption", "stack", "queue",
        "linked list", "graph traversal", "dynamic programming", "cpu", "memory",
        "tcp", "http", "sql", "object oriented", "class", "inheritance",
    ],
    "Statistics": [
        "probability", "distribution", "regression", "hypothesis", "variance",
        "mean", "median", "standard deviation", "sampling", "confidence interval",
        "t-test", "chi-square", "anova", "correlation", "normal distribution",
        "poisson", "binomial distribution", "random variable", "expected value",
    ],
    "Economics": [
        "market", "supply", "demand", "inflation", "gdp", "trade", "fiscal",
        "monetary", "elasticity", "microeconomics", "macroeconomics", "utility",
        "marginal", "budget", "equilibrium price", "consumer surplus",
        "monopoly", "oligopoly", "gdp", "recession", "investment", "capital",
    ],
    "History": [
        "civilization", "war", "revolution", "empire", "dynasty", "colonialism",
        "independence", "ancient", "medieval", "modern", "world war", "treaty",
        "monarch", "republic", "democracy", "feudal", "renaissance", "reformation",
        "imperialism", "nationalism", "cold war", "constitution",
    ],
    "Geography": [
        "climate", "topography", "map", "continent", "latitude", "longitude",
        "erosion", "river", "population", "migration", "earthquake", "volcano",
        "biome", "ocean", "atmosphere", "weathering", "landform", "plateau",
        "delta", "watershed", "urbanization", "demographic",
    ],
    "Literature": [
        "novel", "poem", "character", "theme", "metaphor", "prose", "narrative",
        "author", "literary", "symbolism", "allegory", "sonnet", "drama",
        "plot", "protagonist", "antagonist", "genre", "fiction", "non-fiction",
        "stanza", "rhyme", "imagery", "tone", "satire", "tragedy", "comedy",
    ],
    "Science": [
        "experiment", "hypothesis", "observation", "conclusion", "data",
        "scientific method", "measurement", "natural", "environment",
    ],
    "Primary": [
        "addition", "subtraction", "multiplication", "division", "fraction",
        "counting", "shapes", "alphabet", "vowel", "sentence", "paragraph",
        "animals", "plants", "community", "family", "seasons",
    ],
}


def _detect_subject(combined_text: str) -> str:
    """
    Classifies *combined_text* (topic + content) into an academic subject.
    Uses a keyword scoring approach: the subject whose keywords appear most
    frequently in the text wins.  Falls back to 'General' if no match.
    """
    lower = combined_text.lower()
    scores: Dict[str, int] = {}
    for subject, keywords in _SUBJECT_KEYWORDS.items():
        scores[subject] = sum(1 for kw in keywords if kw in lower)
    best_subject = max(scores, key=lambda s: scores[s])
    return best_subject if scores[best_subject] > 0 else "General"


@app.post("/api/context/upload")
async def upload_context(files: List[UploadFile] = File(...)):
    """
    Accepts one OR MORE JSON files (syllabi, history timelines, problem sets, formulas,
    question banks, or nested subject structures). Each file is recursively parsed and
    chunked using UniversalChunker, subject-classified, and stored in SQLite + FAISS.
    """
    total_saved: List[Dict] = []
    per_file_results: List[Dict] = []
    all_for_indexing: List[Dict] = []

    for upload_file in files:
        filename = upload_file.filename or "context.json"
        try:
            content_bytes = await upload_file.read()
            raw_data = json.loads(content_bytes.decode("utf-8"))
        except Exception as e:
            per_file_results.append({"file": filename, "error": str(e), "count": 0})
            continue

        # Use UniversalChunker to parse any academic JSON schema
        extracted_items = UniversalChunker.chunk_json_data(raw_data, filename=filename)
        file_saved: List[Dict] = []
        subject_counts: Dict[str, int] = {}

        with Session(engine) as session:
            for item in extracted_items:
                text = item["content"]
                item_type = item.get("item_type", "general")
                subject = item.get("subject", "General")
                meta = item.get("metadata", {})
                subject_counts[subject] = subject_counts.get(subject, 0) + 1

                db_item = ContextItem(
                    content=text,
                    item_type=item_type,
                    subject=subject,
                    source_file=filename,
                    metadata_json=json.dumps(meta) if meta else None
                )
                session.add(db_item)
                session.commit()
                session.refresh(db_item)

                record = {
                    "id": db_item.id,
                    "content": db_item.content,
                    "item_type": db_item.item_type,
                    "subject": subject
                }
                file_saved.append(record)
                total_saved.append(record)
                all_for_indexing.append({
                    "id": db_item.id,
                    "content": text,
                    "subject": subject,
                    "source_file": filename
                })

        per_file_results.append({
            "file": filename,
            "count": len(file_saved),
            "subjects": subject_counts
        })

    if vector_store and all_for_indexing:
        vector_store.add(all_for_indexing)

    # Build aggregate subject summary across all files
    aggregate_subjects: Dict[str, int] = {}
    for r in per_file_results:
        for subj, cnt in r.get("subjects", {}).items():
            aggregate_subjects[subj] = aggregate_subjects.get(subj, 0) + cnt

    return {
        "status": "success",
        "message": f"Parsed and indexed {len(total_saved)} semantic chunks from {len(files)} file(s).",
        "count": len(total_saved),
        "subject_breakdown": aggregate_subjects,
        "files": per_file_results
    }


# ── Robust LaTeX Escape & JSON Sanitization ────────────────────────────────
_LATEX_CMD_REGEX = re.compile(
    r'(?<!\\)\\'
    r'(?='
    r'frac|dfrac|tfrac|forall|fbox|flat|flushbottom|flushleft|flushright|fontsize|footnote|'
    r'theta|vartheta|tau|text|textbf|textit|textrm|texttt|textsf|tilde|times|to|top|triangle|'
    r'nabla|neg|neq|newcommand|newline|noindent|nonumber|not|nu|'
    r'rangle|rfloor|rceil|right|rightarrow|Rightarrow|rho|varrho|rm|rule|'
    r'bar|begin|beta|bf|big|binom|bmod|boldsymbol|Box|'
    r'alpha|approx|arccos|arcsin|arctan|ast|atop|'
    r'partial|int|iint|iiint|oint|sum|prod|lim|sqrt|infty|pm|mp|cdot|'
    r'leq|geq|equiv|sim|propto|leftarrow|Leftarrow|Leftrightarrow|iff|implies|'
    r'exists|in|notin|subset|subseteq|cup|cap|perp|parallel|angle|degree|circ|'
    r'sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|ln|log|exp|det|dim|ker|deg|'
    r'mathbf|mathbb|mathrm|left|right|limits|end|'
    r'Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega'
    r')'
)


def _pre_fix_latex_backslashes(json_str: str) -> str:
    return _LATEX_CMD_REGEX.sub(r'\\\\', json_str)


def _sanitize_json_latex_escapes(json_str: str) -> str:
    """
    State-machine sanitizer that walks a JSON candidate string and auto-escapes
    any unescaped backslashes inside JSON string literals.
    """
    result = []
    in_string = False
    i = 0
    length = len(json_str)

    while i < length:
        c = json_str[i]

        if c == '"':
            num_preceding_backslashes = 0
            j = len(result) - 1
            while j >= 0 and result[j] == '\\':
                num_preceding_backslashes += 1
                j -= 1
            if num_preceding_backslashes % 2 == 0:
                in_string = not in_string
            result.append(c)
            i += 1
            continue

        if not in_string:
            result.append(c)
            i += 1
            continue

        if c == '\\':
            if i + 1 >= length:
                result.append('\\\\')
                i += 1
                continue

            next_c = json_str[i + 1]

            if next_c == '\\':
                result.append('\\\\')
                i += 2
                continue

            if next_c in ('"', '/'):
                result.append('\\')
                result.append(next_c)
                i += 2
                continue

            if next_c in ('b', 'f', 'n', 'r', 't'):
                # In LaTeX context, \frac, \beta, \nabla, \rho, \theta are commands, not control chars
                if i + 2 < length and json_str[i + 2].isalpha():
                    result.append('\\\\')
                    result.append(next_c)
                    i += 2
                else:
                    result.append('\\')
                    result.append(next_c)
                    i += 2
                continue

            if next_c == 'u' and i + 5 < length:
                hex_chars = json_str[i + 2:i + 6]
                if len(hex_chars) == 4 and all(h in '0123456789abcdefABCDEF' for h in hex_chars):
                    result.append('\\u')
                    result.append(hex_chars)
                    i += 6
                    continue

            result.append('\\\\')
            result.append(next_c)
            i += 2
        else:
            result.append(c)
            i += 1

    return "".join(result)


def _repair_unclosed_json(json_str: str) -> str:
    """Closes unclosed braces and brackets if LLM output was truncated."""
    s = json_str.rstrip().rstrip(",")
    if s.endswith('"') and s.count('"') % 2 != 0:
        s += '"'
    
    open_brackets = s.count("[") - s.count("]")
    open_braces = s.count("{") - s.count("}")
    
    if open_braces > 0:
        s += "}" * open_braces
    if open_brackets > 0:
        s += "]" * open_brackets
    return s


def _extract_objects_iteratively(text: str) -> List[Dict]:
    """
    Parses nested question objects from text with full balanced bracket matching,
    even when conversational thoughts or truncation surrounds the JSON.
    """
    objects = []
    i = 0
    n = len(text)
    while i < n:
        if text[i] == '{':
            depth = 0
            start = i
            in_str = False
            escape = False
            while i < n:
                ch = text[i]
                if escape:
                    escape = False
                elif ch == '\\':
                    escape = True
                elif ch == '"':
                    in_str = not in_str
                elif not in_str:
                    if ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                        if depth == 0:
                            obj_str = text[start:i+1]
                            for fixer in (_sanitize_json_latex_escapes, _pre_fix_latex_backslashes):
                                try:
                                    clean = fixer(obj_str)
                                    clean = re.sub(r",\s*([\]}])", r"\1", clean)
                                    parsed = json.loads(clean)
                                    if isinstance(parsed, dict) and ("text" in parsed or "q_index" in parsed):
                                        objects.append(parsed)
                                        break
                                except Exception:
                                    pass
                            break
                i += 1
        i += 1
    return objects


def _extract_json_from_llm_response(raw_text: str) -> Any:
    """
    Robust multi-strategy JSON extractor with advanced LaTeX backslash sanitization,
    preamble stripping, trailing comma removal, unclosed bracket repair, and
    balanced object extraction.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("LLM returned an empty response. Please retry or switch models.")

    text = raw_text.strip()
    text = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<thought>[\s\S]*?</thought>", "", text, flags=re.IGNORECASE)

    # Strip code block fences
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)(?:```|$)", text, flags=re.IGNORECASE)
    candidate_str = fence_match.group(1).strip() if fence_match else text

    # Discard any conversational preamble before '[' or '{'
    start_bracket = candidate_str.find("[")
    start_brace = candidate_str.find("{")

    if start_bracket != -1 and (start_brace == -1 or start_bracket < start_brace):
        candidate_str = candidate_str[start_bracket:]
    elif start_brace != -1:
        candidate_str = candidate_str[start_brace:]

    end_bracket = candidate_str.rfind("]")
    end_brace = candidate_str.rfind("}")

    if candidate_str.startswith("[") and end_bracket != -1:
        json_candidate = candidate_str[:end_bracket + 1]
    elif candidate_str.startswith("{") and end_brace != -1:
        json_candidate = candidate_str[:end_brace + 1]
    else:
        json_candidate = candidate_str

    # Strategy 1: Direct parse with sanitization passes
    for attempt in (
        json_candidate,
        _pre_fix_latex_backslashes(json_candidate),
        _sanitize_json_latex_escapes(json_candidate),
        re.sub(r",\s*([\]}])", r"\1", _sanitize_json_latex_escapes(json_candidate)),
        _repair_unclosed_json(_sanitize_json_latex_escapes(json_candidate))
    ):
        try:
            parsed = json.loads(attempt)
            return [parsed] if isinstance(parsed, dict) else parsed
        except Exception:
            pass

    # Strategy 2: Full state-machine iterative balanced object extraction
    extracted = _extract_objects_iteratively(raw_text)
    if extracted:
        return extracted

    raise ValueError(f"Could not parse valid JSON from LLM output. Raw snippet: {raw_text[:250]}")


def _clean_question_text(raw_text: str) -> str:
    """Strips raw/unrendered LaTeX figure environments from the question text."""
    if not raw_text:
        return ""
    cleaned = re.sub(r"\\begin\{figure\}[\s\S]*?\\end\{figure\}", "", raw_text)
    cleaned = re.sub(r"\\includegraphics(\[.*?\])?\{.*?\}", "", cleaned)
    cleaned = re.sub(r"\\caption\{.*?\}", "", cleaned)
    cleaned = re.sub(r"\\centering", "", cleaned)
    return cleaned.strip()


@app.post("/api/generate")
async def generate_exam(
    title: str = Form("Course Examination"),
    n_questions: int = Form(4),
    max_marks: int = Form(100),
    per_unit_weights: Optional[str] = Form(None),
    include_diagrams: Optional[bool] = Form(True),
    model: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None),
    blueprint_config_id: Optional[int] = Form(None)
):
    """
    High-speed, single-pass exam generator that retrieves relevant curriculum context
    from FAISS, formats subject-specific prompts (Maths, History, Sciences, etc.),
    and generates questions with embedded Matplotlib image specs in ONE efficient LLM call.

    If blueprint_config_id is provided, loads the saved BlueprintConfig and injects
    difficulty, Bloom's taxonomy, question type, and guardrail constraints into the
    LLM system prompt for Trust & Transparency compliance.
    """
    gen_start_time = time.time()

    # ── Load Blueprint Config if provided ──────────────────────────────────
    bp_config = None
    config_snapshot = {}
    if blueprint_config_id:
        with Session(engine) as session:
            bp_config = session.get(BlueprintConfig, blueprint_config_id)
        if bp_config:
            # Override LLM params from blueprint
            if bp_config.llm_model and not model:
                model = bp_config.llm_model
            config_snapshot = {
                "id": bp_config.id,
                "name": bp_config.name,
                "exam_profile": bp_config.exam_profile,
                "difficulty": json.loads(bp_config.difficulty_json) if bp_config.difficulty_json else {},
                "bloom_levels": json.loads(bp_config.bloom_levels_json) if bp_config.bloom_levels_json else [],
                "question_types": json.loads(bp_config.question_types_json) if bp_config.question_types_json else {},
                "nep_alignment": json.loads(bp_config.nep_alignment_json) if bp_config.nep_alignment_json else {},
                "guardrails": json.loads(bp_config.guardrails_json) if bp_config.guardrails_json else {},
                "llm_temperature": bp_config.llm_temperature,
                "llm_max_tokens": bp_config.llm_max_tokens,
                "llm_top_p": bp_config.llm_top_p,
                "max_diagrams": bp_config.max_diagrams,
                "time_minutes": bp_config.time_minutes,
            }

    # Infer subject
    query_text = f"{title} " + (per_unit_weights or "")
    detected_subj = detect_subject(query_text, default_subject="General")

    # Semantic context retrieval from FAISS
    contexts = []
    faiss_retrieval_count = 0
    if vector_store:
        contexts = vector_store.query(query_text, k=8, subject=detected_subj if detected_subj != "General" else None)
        if not contexts:
            contexts = vector_store.query(query_text, k=6)
        faiss_retrieval_count = len(contexts)

    context_str = "\n\n".join([f"- {c.get('content', '')}" for c in contexts]) if contexts else "Standard university curriculum curriculum."

    # Subject-specific instructions
    if detected_subj == "History":
        subject_guidance = (
            "SUBJECT: HISTORY & HUMANITIES\n"
            "- Include historical context, timeline events, primary source extracts where relevant, and analytical essay questions.\n"
            "- Questions should evaluate cause-and-effect, administrative policies, treaties, historical significance, and source critique.\n"
            "- For diagrams: If asking about timelines, historical expansion, or demographic trends, provide matplotlib code for timeline charts or bar comparisons.\n"
        )
    elif detected_subj == "Mathematics":
        subject_guidance = (
            "SUBJECT: MATHEMATICS & APPLIED CALCULUS\n"
            "- Formulate mathematically rigorous questions with clear equations, boundary conditions, and theorems.\n"
            "- Use LaTeX mathematical notation: $u(x,y)$, $\\frac{\\partial u}{\\partial x}$, $\\int_a^b$, $\\nabla f$, $\\lambda$.\n"
            "- For diagrams: Provide 'image_spec' with Matplotlib code for 3D surfaces, 2D curves, vector fields, and contour plots.\n"
        )
    elif detected_subj in ("Physics", "Chemistry", "Biology"):
        subject_guidance = (
            f"SUBJECT: {detected_subj.upper()}\n"
            "- Include physical units, balanced equations, experimental setups, and theoretical derivations.\n"
            "- For diagrams: Provide 'image_spec' with Matplotlib code for waveforms, ray diagrams, reaction profiles, or anatomical schematics.\n"
        )
    else:
        subject_guidance = (
            "SUBJECT: COMPREHENSIVE ACADEMIC CURRICULUM\n"
            "- Create rigorous, clear questions with balanced weightages.\n"
        )

    # ── Build Blueprint Constraint Instructions ─────────────────────────────
    blueprint_instructions = ""
    if bp_config and config_snapshot:
        parts = ["\nBLUEPRINT CONFIGURATION CONSTRAINTS (MUST FOLLOW):"]

        # Difficulty distribution
        diff = config_snapshot.get("difficulty", {})
        if diff:
            parts.append(f"- Difficulty Distribution: {diff.get('easy', 0)}% Easy, {diff.get('medium', 0)}% Medium, {diff.get('hard', 0)}% Hard.")
            parts.append(f"  Assign a 'difficulty' field to each question: 'easy', 'medium', or 'hard'.")

        # Bloom's Taxonomy
        blooms = config_snapshot.get("bloom_levels", [])
        if blooms:
            parts.append(f"- Bloom's Taxonomy Levels to target: {', '.join(blooms)}. Assign a 'bloom_level' field to each question.")

        # Question types
        qtypes = config_snapshot.get("question_types", {})
        if qtypes:
            type_strs = [f"{k}: {v}%" for k, v in qtypes.items() if v > 0]
            parts.append(f"- Question Type Distribution: {', '.join(type_strs)}. Assign a 'question_type' field ('mcq', 'numerical', 'subjective', 'proof') to each question.")

        # Guardrails
        guards = config_snapshot.get("guardrails", {})
        if guards.get("no_duplicate_topics"):
            parts.append("- GUARDRAIL: No two questions may cover the exact same topic.")
        if guards.get("min_hard_questions"):
            parts.append(f"- GUARDRAIL: Include at least {guards['min_hard_questions']} hard-difficulty question(s).")
        if guards.get("balance_marks"):
            parts.append("- GUARDRAIL: Distribute marks as evenly as possible across question types.")

        # Exam profile context
        profile = config_snapshot.get("exam_profile", "university")
        profile_desc = {
            "university": "University-level semester examination with focus on conceptual understanding.",
            "competitive": "Competitive university examination with higher analytical demand.",
            "jee_main": "JEE Main style: emphasis on speed, MCQs, numerical answer types, and applied problem solving.",
            "jee_advanced": "JEE Advanced style: emphasis on multi-concept problems, high difficulty, analytical reasoning, and creative problem solving.",
        }
        parts.append(f"- Exam Profile: {profile_desc.get(profile, profile)}")

        # Diagram constraint
        max_diag = config_snapshot.get("max_diagrams", 3)
        parts.append(f"- Maximum {max_diag} questions should include image_spec diagrams.")

        # Time allocation
        time_min = config_snapshot.get("time_minutes", 180)
        parts.append(f"- Total exam time: {time_min} minutes. Calibrate question difficulty accordingly.")

        # Output schema update
        parts.append('- Updated JSON schema per question: {"q_index": 1, "text": "...", "marks": 25, "difficulty": "medium", "bloom_level": "Apply", "question_type": "numerical", "image_spec": {...}}')

        blueprint_instructions = "\n".join(parts) + "\n"

    system_prompt = (
        "You are an elite university professor and examination board author creating a premier examination paper.\n\n"
        f"{subject_guidance}\n"
        f"{blueprint_instructions}"
        "VISUAL DIAGRAM & GRAPH RULES:\n"
        "1. Whenever a question involves 2D/3D geometry, curves, surfaces, vector fields, waveforms, data plots, or timeline charts, "
        "provide an 'image_spec' object with a 'code' field containing executable Python/Matplotlib code using 'np', 'plt', 'fig', 'ax'.\n"
        "2. DO NOT write `\\includegraphics` or `\\begin{figure}` into the 'text' field. The application automatically displays and attaches the diagram.\n\n"
        "CRITICAL OUTPUT FORMATTING RULES:\n"
        "- Begin your response IMMEDIATELY with the character '[' and end with ']'.\n"
        "- DO NOT write any conversational preamble, planning notes, thinking text, or explanations outside the JSON array.\n"
        "- Inside JSON strings, ALL backslashes MUST be double-escaped: write \\\\frac, \\\\int, \\\\partial, \\\\theta, \\\\alpha, \\\\sin, \\\\beta.\n"
        "- Schema:\n"
        "[\n"
        "  {\n"
        '    "q_index": 1,\n'
        '    "text": "Find the directional derivative of $u(x,y) = x^2 y + x y^2$ at $(1,2)$ in the direction of vector $\\\\mathbf{v} = (1,1)$.",\n'
        '    "marks": 25,\n'
        '    "difficulty": "medium",\n'
        '    "bloom_level": "Apply",\n'
        '    "question_type": "numerical",\n'
        '    "image_spec": {\n'
        '      "code": "x = np.linspace(-2, 2, 40)\\ny = np.linspace(-2, 2, 40)\\nX, Y = np.meshgrid(x, y)\\nZ = X**2 * Y + X * Y**2\\nax = fig.add_subplot(111, projection=\'3d\')\\nax.plot_surface(X, Y, Z, cmap=\'viridis\')\\nax.set_title(\'Surface Plot of u(x,y)\')"\n'
        '    }\n'
        "  }\n"
        "]"
    )

    user_prompt = (
        f"Generate Examination Paper for Title: '{title}'.\n"
        f"Subject Discipline: {detected_subj}\n"
        f"Number of Questions: {n_questions}\n"
        f"Total Maximum Marks: {max_marks}\n"
        f"Unit/Topic Weighting: {per_unit_weights or 'Balanced across syllabus'}\n\n"
        f"Curriculum Reference Context:\n{context_str}\n\n"
        f"Create exactly {n_questions} high-quality, distinctive questions whose individual marks sum to {max_marks}. "
        f"{'Include executable matplotlib code in image_spec for relevant questions (maximum 2-3 diagrams across the exam).' if include_diagrams else 'Pure text and equations without image_spec.'} "
        f"Include 'difficulty', 'bloom_level', and 'question_type' fields in each question object. "
        f"Begin directly with '['. Return ONLY the JSON array."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    # Dynamically scale max_tokens and timeout to support large question sets (e.g. 15-20 questions)
    if bp_config and bp_config.llm_max_tokens:
        scaled_max_tokens = min(8000, max(3500, bp_config.llm_max_tokens))
    else:
        scaled_max_tokens = min(8000, max(3500, n_questions * 420))
    scaled_timeout = min(120, max(60, n_questions * 6))

    actual_model_used = model or None
    try:
        raw_llm_output = call_openrouter(
            messages=messages,
            model=model,
            api_key=api_key,
            max_tokens=scaled_max_tokens,
            timeout=scaled_timeout,
            temperature=bp_config.llm_temperature if bp_config else None,
            top_p=bp_config.llm_top_p if bp_config else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Generation Error: {str(e)}")

    try:
        questions_data = _extract_json_from_llm_response(raw_llm_output)
        if not isinstance(questions_data, list):
            raise ValueError("Expected a JSON array of question objects.")
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to parse JSON from LLM response",
                "detail": str(e),
                "raw_output": raw_llm_output
            }
        )

    gen_duration_ms = int((time.time() - gen_start_time) * 1000)

    with Session(engine) as session:
        exam = Exam(
            title=title,
            max_marks=max_marks,
            n_questions=len(questions_data),
            per_unit_weights_json=per_unit_weights
        )
        session.add(exam)
        session.commit()
        session.refresh(exam)

        exam_dict = {
            "id": exam.id,
            "title": exam.title,
            "max_marks": exam.max_marks,
            "n_questions": exam.n_questions,
            "per_unit_weights_json": exam.per_unit_weights_json,
            "created_at": exam.created_at.isoformat() if hasattr(exam.created_at, "isoformat") else str(exam.created_at)
        }

        saved_questions = []
        # Transparency counters
        difficulty_counts = {"easy": 0, "medium": 0, "hard": 0}
        bloom_counts = {}
        qtype_counts = {}
        total_marks_sum = 0
        diagram_count = 0

        for idx, q_data in enumerate(questions_data, start=1):
            raw_text = q_data.get("text", "")
            clean_text = _clean_question_text(raw_text)
            marks = int(q_data.get("marks", round(max_marks / max(1, len(questions_data)))))
            img_spec = q_data.get("image_spec")
            img_path = None

            # Track transparency metadata
            diff_label = q_data.get("difficulty", "medium").lower()
            if diff_label in difficulty_counts:
                difficulty_counts[diff_label] += 1
            bloom_label = q_data.get("bloom_level", "Apply")
            bloom_counts[bloom_label] = bloom_counts.get(bloom_label, 0) + 1
            qtype_label = q_data.get("question_type", "subjective")
            qtype_counts[qtype_label] = qtype_counts.get(qtype_label, 0) + 1
            total_marks_sum += marks

            # Render plot locally in milliseconds
            if img_spec and include_diagrams:
                img_path = render_plot_from_spec(img_spec)
                if img_path:
                    diagram_count += 1

            q_obj = Question(
                exam_id=exam.id,
                q_index=q_data.get("q_index", idx),
                text=clean_text or raw_text,
                marks=marks,
                image_path=img_path,
                image_spec_json=json.dumps(img_spec) if img_spec else None
            )
            session.add(q_obj)
            session.commit()
            session.refresh(q_obj)

            q_dict = {
                "id": q_obj.id,
                "exam_id": q_obj.exam_id,
                "q_index": q_obj.q_index,
                "text": q_obj.text,
                "marks": q_obj.marks,
                "image_path": q_obj.image_path,
                "image_spec_json": q_obj.image_spec_json,
                "difficulty": diff_label,
                "bloom_level": bloom_label,
                "question_type": qtype_label,
                "created_at": q_obj.created_at.isoformat() if hasattr(q_obj.created_at, "isoformat") else str(q_obj.created_at)
            }
            saved_questions.append(q_dict)

        # ── Build Transparency Analytics ────────────────────────────────────
        n_total = len(questions_data)
        transparency = {
            "difficulty_distribution": {
                k: round((v / max(1, n_total)) * 100, 1) for k, v in difficulty_counts.items()
            },
            "bloom_coverage": {
                k: round((v / max(1, n_total)) * 100, 1) for k, v in bloom_counts.items()
            },
            "question_type_distribution": {
                k: round((v / max(1, n_total)) * 100, 1) for k, v in qtype_counts.items()
            },
            "total_marks_actual": total_marks_sum,
            "total_marks_configured": max_marks,
            "marks_deviation_pct": round(abs(total_marks_sum - max_marks) / max(1, max_marks) * 100, 1),
            "diagram_count": diagram_count,
            "questions_generated": n_total,
            "subject_detected": detected_subj,
            "faiss_chunks_retrieved": faiss_retrieval_count,
        }

        # Calculate syllabus coverage if we have unit weights
        syllabus_coverage_pct = 0.0
        if per_unit_weights:
            try:
                weights = json.loads(per_unit_weights)
                topics_requested = set(k.lower() for k in weights.keys())
                topics_covered = set()
                for q in saved_questions:
                    q_text_lower = q["text"].lower()
                    for topic in topics_requested:
                        if any(word in q_text_lower for word in topic.split()):
                            topics_covered.add(topic)
                syllabus_coverage_pct = round(len(topics_covered) / max(1, len(topics_requested)) * 100, 1)
            except Exception:
                syllabus_coverage_pct = 0.0
        transparency["syllabus_coverage_pct"] = syllabus_coverage_pct

        # ── Create Generation Log entry ─────────────────────────────────────
        gen_log = GenerationLog(
            exam_id=exam.id,
            config_snapshot_json=json.dumps(config_snapshot) if config_snapshot else None,
            transparency_json=json.dumps(transparency),
            model_used=actual_model_used or "default",
            tokens_consumed=scaled_max_tokens,
            generation_duration_ms=gen_duration_ms,
            faiss_retrieval_count=faiss_retrieval_count,
            syllabus_coverage_pct=syllabus_coverage_pct,
        )
        session.add(gen_log)
        session.commit()
        session.refresh(gen_log)

    return {
        "status": "success",
        "exam": exam_dict,
        "questions": saved_questions,
        "transparency": transparency,
        "config_snapshot": config_snapshot,
        "generation_log_id": gen_log.id,
    }


@app.post("/api/generate_plot")
async def generate_plot(
    question_id: Optional[int] = Form(None),
    code: Optional[str] = Form(None),
    prompt: Optional[str] = Form(None),
    function_expr: Optional[str] = Form(None),
    x_min: Optional[float] = Form(-10.0),
    x_max: Optional[float] = Form(10.0),
    plot_title: Optional[str] = Form(""),
    model: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None)
):
    """
    Renders or generates a Matplotlib diagram from code, prompt, or function formula,
    and optionally links it to a question.
    """
    image_path = None
    executed_code = None

    # Case 1: Direct Python Matplotlib code provided
    if code and code.strip():
        res = execute_matplotlib_code(code)
        if not res["success"]:
            raise HTTPException(status_code=400, detail=f"Matplotlib Error: {res['error']}")
        image_path = res["image_path"]
        executed_code = res["code"]

    # Case 2: AI Prompt provided to write Matplotlib code
    elif prompt and prompt.strip():
        q_context = ""
        if question_id:
            with Session(engine) as session:
                q = session.get(Question, question_id)
                if q:
                    q_context = q.text

        generated_code = generate_plot_code_from_ai(
            prompt=prompt,
            question_context=q_context,
            model=model,
            api_key=api_key
        )
        res = execute_matplotlib_code(generated_code)
        if not res["success"]:
            raise HTTPException(status_code=400, detail=f"Generated Code Execution Error: {res['error']}")
        image_path = res["image_path"]
        executed_code = generated_code

    # Case 3: Math formula provided
    elif function_expr and function_expr.strip():
        spec = {
            "function": function_expr.strip(),
            "x_range": [x_min, x_max],
            "title": plot_title or f"y = {function_expr}"
        }
        image_path = render_plot_from_spec(spec)
        executed_code = f"# Formula Plot: {function_expr}"

    else:
        raise HTTPException(status_code=400, detail="Please provide Python code, an AI prompt, or a mathematical formula.")

    # If linked to a Question, update Question record in database
    updated_question = None
    if question_id:
        with Session(engine) as session:
            q = session.get(Question, question_id)
            if q:
                q.image_path = image_path
                q.image_spec_json = json.dumps({"code": executed_code}) if executed_code else None
                session.add(q)
                session.commit()
                session.refresh(q)
                updated_question = {
                    "id": q.id,
                    "exam_id": q.exam_id,
                    "q_index": q.q_index,
                    "text": q.text,
                    "marks": q.marks,
                    "image_path": q.image_path,
                    "image_spec_json": q.image_spec_json
                }

    return {
        "status": "success",
        "image_path": image_path,
        "code": executed_code,
        "question": updated_question
    }


@app.post("/api/question/remove_image")
async def remove_question_image(question_id: int = Form(...)):
    """Removes the plot/image from a question."""
    with Session(engine) as session:
        question = session.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")
        question.image_path = None
        question.image_spec_json = None
        session.add(question)
        session.commit()
        session.refresh(question)
        return {"status": "success", "question": {"id": question.id, "image_path": None}}


@app.post("/api/edit_question")
async def edit_question(
    question_id: int = Form(...),
    edit_prompt: str = Form(...),
    model: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None)
):
    """
    Calls the secondary editor LLM to perform targeted modifications to a question.
    """
    with Session(engine) as session:
        question = session.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail=f"Question with ID {question_id} not found.")
        current_text = question.text

    editor_system_prompt = (
        "Given current LaTeX question and instruction, return only the rewritten LaTeX text. "
        "Do NOT include raw \\includegraphics or \\begin{figure} markup in the text."
    )
    editor_user_prompt = (
        f"Current Question:\n{current_text}\n\n"
        f"Teacher Edit Instruction:\n{edit_prompt}\n\n"
        "Return ONLY the rewritten LaTeX question text with no additional explanations."
    )

    messages = [
        {"role": "system", "content": editor_system_prompt},
        {"role": "user", "content": editor_user_prompt}
    ]

    try:
        rewritten_text = call_openrouter(
            messages=messages,
            model=model,
            api_key=api_key,
            max_tokens=1500
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Editor Error: {str(e)}")

    rewritten_text = rewritten_text.strip()
    if rewritten_text.startswith("```latex") or rewritten_text.startswith("```"):
        rewritten_text = re.sub(r"^```(?:latex)?\s*", "", rewritten_text)
        rewritten_text = re.sub(r"\s*```$", "", rewritten_text)

    rewritten_text = _clean_question_text(rewritten_text)

    with Session(engine) as session:
        db_question = session.get(Question, question_id)
        if db_question:
            db_question.text = rewritten_text
            session.add(db_question)
            session.commit()
            session.refresh(db_question)
            return {
                "status": "success",
                "question": {
                    "id": db_question.id,
                    "exam_id": db_question.exam_id,
                    "q_index": db_question.q_index,
                    "text": db_question.text,
                    "marks": db_question.marks,
                    "image_path": db_question.image_path
                }
            }

    return {"status": "success", "text": rewritten_text}


@app.post("/api/save_question")
async def save_question(
    question_id: int = Form(...),
    text: str = Form(...),
    marks: Optional[int] = Form(None)
):
    """Saves manual inline edits to SQLite."""
    with Session(engine) as session:
        question = session.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")
        question.text = text
        if marks is not None:
            question.marks = marks
        session.add(question)
        session.commit()
        session.refresh(question)
        return {
            "status": "success",
            "question": {
                "id": question.id,
                "exam_id": question.exam_id,
                "q_index": question.q_index,
                "text": question.text,
                "marks": question.marks,
                "image_path": question.image_path
            }
        }


@app.post("/api/question/create")
async def create_question(
    exam_id: int = Form(...),
    text: str = Form("New question text..."),
    marks: int = Form(10)
):
    """Adds a new question to the exam."""
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found.")
        existing_count = len(session.exec(select(Question).where(Question.exam_id == exam_id)).all())
        new_q = Question(
            exam_id=exam_id,
            q_index=existing_count + 1,
            text=text,
            marks=marks
        )
        session.add(new_q)
        session.commit()
        session.refresh(new_q)
        return {
            "status": "success",
            "question": {
                "id": new_q.id,
                "exam_id": new_q.exam_id,
                "q_index": new_q.q_index,
                "text": new_q.text,
                "marks": new_q.marks,
                "image_path": new_q.image_path
            }
        }


@app.delete("/api/question/{question_id}")
async def delete_question(question_id: int):
    """Deletes a question from an exam."""
    with Session(engine) as session:
        question = session.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")
        session.delete(question)
        session.commit()
        return {"status": "success", "message": f"Question {question_id} deleted."}


@app.post("/api/export")
async def export_exam(
    exam_id: int = Form(...),
    format: str = Form("pdf")
):
    """
    Exports the exam to PDF (standalone ReportLab engine), LaTeX (.tex), or Word (.docx).
    """
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail=f"Exam with ID {exam_id} not found.")

        questions = session.exec(
            select(Question).where(Question.exam_id == exam_id).order_by(Question.q_index)
        ).all()

    if not questions:
        raise HTTPException(status_code=400, detail="Exam has no questions to export.")

    q_dicts = [
        {
            "id": q.id,
            "q_index": q.q_index,
            "text": q.text,
            "marks": q.marks,
            "image_path": q.image_path
        }
        for q in questions
    ]
    safe_title = re.sub(r"[^\w\-_]", "_", exam.title.lower())
    export_base = f"exam_{exam.id}_{safe_title}"

    fmt = format.strip().lower()

    if fmt == "pdf":
        pdf_path = os.path.join(EXPORTS_DIR, f"{export_base}.pdf")
        try:
            create_pdf(exam.title, q_dicts, exam.max_marks, output_path=pdf_path)
            return FileResponse(
                pdf_path,
                filename=f"{export_base}.pdf",
                media_type="application/pdf"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF Generation Failed: {str(e)}")

    elif fmt == "tex":
        tex_path = os.path.join(EXPORTS_DIR, f"{export_base}.tex")
        try:
            create_tex(exam.title, q_dicts, exam.max_marks, output_path=tex_path)
            return FileResponse(
                tex_path,
                filename=f"{export_base}.tex",
                media_type="application/x-tex"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LaTeX Export Failed: {str(e)}")

    elif fmt in ("docx", "doc"):
        docx_path = os.path.join(EXPORTS_DIR, f"{export_base}.docx")
        try:
            create_docx(exam.title, q_dicts, exam.max_marks, output_path=docx_path)
            return FileResponse(
                docx_path,
                filename=f"{export_base}.docx",
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Word Document Export Failed: {str(e)}")

    elif fmt in ("pptx", "ppt", "powerpoint"):
        pptx_path = os.path.join(EXPORTS_DIR, f"{export_base}.pptx")
        try:
            create_pptx(exam.title, q_dicts, exam.max_marks, output_path=pptx_path)
            return FileResponse(
                pptx_path,
                filename=f"{export_base}.pptx",
                media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PowerPoint Export Failed: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{format}'. Choose 'pdf', 'pptx', 'docx', or 'tex'.")


# ══════════════════════════════════════════════════════════════════════════════
# Trust & Transparency: Blueprint Config CRUD + Generation Log Endpoints
# ══════════════════════════════════════════════════════════════════════════════

def _serialize_blueprint(bp: BlueprintConfig) -> dict:
    return {
        "id": bp.id,
        "name": bp.name,
        "exam_profile": bp.exam_profile,
        "difficulty": json.loads(bp.difficulty_json) if bp.difficulty_json else {},
        "bloom_levels": json.loads(bp.bloom_levels_json) if bp.bloom_levels_json else [],
        "question_types": json.loads(bp.question_types_json) if bp.question_types_json else {},
        "nep_alignment": json.loads(bp.nep_alignment_json) if bp.nep_alignment_json else {},
        "guardrails": json.loads(bp.guardrails_json) if bp.guardrails_json else {},
        "llm_model": bp.llm_model,
        "llm_temperature": bp.llm_temperature,
        "llm_max_tokens": bp.llm_max_tokens,
        "llm_top_p": bp.llm_top_p,
        "max_diagrams": bp.max_diagrams,
        "time_minutes": bp.time_minutes,
        "is_default": bp.is_default,
        "created_at": bp.created_at.isoformat() if hasattr(bp.created_at, "isoformat") else str(bp.created_at),
        "updated_at": bp.updated_at.isoformat() if hasattr(bp.updated_at, "isoformat") else str(bp.updated_at),
    }


@app.get("/api/blueprint/configs")
async def list_blueprint_configs():
    """Returns all saved blueprint configurations."""
    with Session(engine) as session:
        configs = session.exec(select(BlueprintConfig).order_by(BlueprintConfig.created_at.desc())).all()
        return [_serialize_blueprint(c) for c in configs]


@app.get("/api/blueprint/config/default")
async def get_default_blueprint():
    """Returns the active default blueprint configuration."""
    with Session(engine) as session:
        bp = session.exec(select(BlueprintConfig).where(BlueprintConfig.is_default == True)).first()
        if not bp:
            bp = session.exec(select(BlueprintConfig)).first()
        if not bp:
            raise HTTPException(status_code=404, detail="No blueprint configurations found.")
        return _serialize_blueprint(bp)


@app.get("/api/blueprint/config/{config_id}")
async def get_blueprint_config(config_id: int):
    """Returns a specific blueprint configuration by ID."""
    with Session(engine) as session:
        bp = session.get(BlueprintConfig, config_id)
        if not bp:
            raise HTTPException(status_code=404, detail=f"Blueprint config {config_id} not found.")
        return _serialize_blueprint(bp)


@app.post("/api/blueprint/config")
async def save_blueprint_config(request: Request):
    """Create or update a blueprint configuration (JSON body)."""
    body = await request.json()

    with Session(engine) as session:
        config_id = body.get("id")
        if config_id:
            bp = session.get(BlueprintConfig, config_id)
            if not bp:
                raise HTTPException(status_code=404, detail=f"Blueprint config {config_id} not found.")
        else:
            bp = BlueprintConfig()

        bp.name = body.get("name", bp.name)
        bp.exam_profile = body.get("exam_profile", bp.exam_profile)
        bp.difficulty_json = json.dumps(body["difficulty"]) if "difficulty" in body else bp.difficulty_json
        bp.bloom_levels_json = json.dumps(body["bloom_levels"]) if "bloom_levels" in body else bp.bloom_levels_json
        bp.question_types_json = json.dumps(body["question_types"]) if "question_types" in body else bp.question_types_json
        bp.nep_alignment_json = json.dumps(body["nep_alignment"]) if "nep_alignment" in body else bp.nep_alignment_json
        bp.guardrails_json = json.dumps(body["guardrails"]) if "guardrails" in body else bp.guardrails_json
        bp.llm_model = body.get("llm_model", bp.llm_model)
        bp.llm_temperature = body.get("llm_temperature", bp.llm_temperature)
        bp.llm_max_tokens = body.get("llm_max_tokens", bp.llm_max_tokens)
        bp.llm_top_p = body.get("llm_top_p", bp.llm_top_p)
        bp.max_diagrams = body.get("max_diagrams", bp.max_diagrams)
        bp.time_minutes = body.get("time_minutes", bp.time_minutes)
        bp.updated_at = datetime.utcnow()

        if body.get("is_default"):
            # Un-default all others
            all_configs = session.exec(select(BlueprintConfig)).all()
            for c in all_configs:
                c.is_default = False
                session.add(c)
            bp.is_default = True

        session.add(bp)
        session.commit()
        session.refresh(bp)

        return {"status": "success", "config": _serialize_blueprint(bp)}


@app.delete("/api/blueprint/config/{config_id}")
async def delete_blueprint_config(config_id: int):
    """Deletes a blueprint configuration."""
    with Session(engine) as session:
        bp = session.get(BlueprintConfig, config_id)
        if not bp:
            raise HTTPException(status_code=404, detail=f"Blueprint config {config_id} not found.")
        session.delete(bp)
        session.commit()
        return {"status": "success", "message": f"Blueprint config {config_id} deleted."}


@app.get("/api/generation-logs")
async def list_generation_logs():
    """Returns all generation audit log entries, most recent first."""
    with Session(engine) as session:
        logs = session.exec(select(GenerationLog).order_by(GenerationLog.created_at.desc())).all()
        result = []
        for log in logs:
            entry = {
                "id": log.id,
                "exam_id": log.exam_id,
                "config_snapshot": json.loads(log.config_snapshot_json) if log.config_snapshot_json else None,
                "transparency": json.loads(log.transparency_json) if log.transparency_json else None,
                "model_used": log.model_used,
                "tokens_consumed": log.tokens_consumed,
                "generation_duration_ms": log.generation_duration_ms,
                "faiss_retrieval_count": log.faiss_retrieval_count,
                "syllabus_coverage_pct": log.syllabus_coverage_pct,
                "created_at": log.created_at.isoformat() if hasattr(log.created_at, "isoformat") else str(log.created_at),
            }
            # Attach exam title if available
            if log.exam_id:
                exam = session.get(Exam, log.exam_id)
                entry["exam_title"] = exam.title if exam else "Deleted Exam"
            result.append(entry)
        return result


@app.get("/api/generation-log/{log_id}")
async def get_generation_log(log_id: int):
    """Returns a specific generation log entry with full transparency data."""
    with Session(engine) as session:
        log = session.get(GenerationLog, log_id)
        if not log:
            raise HTTPException(status_code=404, detail=f"Generation log {log_id} not found.")

        entry = {
            "id": log.id,
            "exam_id": log.exam_id,
            "config_snapshot": json.loads(log.config_snapshot_json) if log.config_snapshot_json else None,
            "transparency": json.loads(log.transparency_json) if log.transparency_json else None,
            "model_used": log.model_used,
            "tokens_consumed": log.tokens_consumed,
            "generation_duration_ms": log.generation_duration_ms,
            "faiss_retrieval_count": log.faiss_retrieval_count,
            "syllabus_coverage_pct": log.syllabus_coverage_pct,
            "created_at": log.created_at.isoformat() if hasattr(log.created_at, "isoformat") else str(log.created_at),
        }
        if log.exam_id:
            exam = session.get(Exam, log.exam_id)
            entry["exam_title"] = exam.title if exam else "Deleted Exam"
        return entry
