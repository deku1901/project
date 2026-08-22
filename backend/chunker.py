"""
chunker.py
==========
Universal semantic chunking and extraction engine for academic context JSONs.
Supports:
  - University / School Syllabi & Curriculums (metadata, units, objectives, outcomes, abstract)
  - History & Humanities (timelines, historical events, source documents, eras, dynasties)
  - Mathematics & Sciences (theorems, formulas, derivations, proofs, problem-solution pairs)
  - Question Banks / Assessments (questions, problems, exercises, MCQs)
  - Arbitrary nested key-value hierarchies and document arrays
"""

import json
import re
from typing import List, Dict, Any, Optional, Tuple

# ── Comprehensive Academic Subject Keywords ─────────────────────────────────
SUBJECT_KEYWORDS: Dict[str, List[str]] = {
    "Mathematics": [
        "calculus", "algebra", "geometry", "trigonometry", "matrix", "determinant",
        "integral", "derivative", "differential", "equation", "theorem", "proof",
        "polynomial", "vector", "linear", "series", "sequence", "logarithm",
        "arithmetic", "quadratic", "binomial", "permutation", "combination",
        "coordinate", "gradient", "divergence", "curl", "laplace", "fourier",
        "eigenvalue", "eigenvector", "set theory", "number theory", "topology",
        "modular", "probability", "statistics", "partial derivative", "jacobian",
        "euler", "euler's", "cauchy", "riemann", "taylor", "maclaurin", "ode", "pde"
    ],
    "History": [
        "civilization", "war", "revolution", "empire", "dynasty", "colonialism",
        "independence", "ancient", "medieval", "modern", "world war", "treaty",
        "monarch", "republic", "democracy", "feudal", "renaissance", "reformation",
        "imperialism", "nationalism", "cold war", "constitution", "mughal",
        "maurya", "gupta", "british raj", "parliament", "treaty of", "monarchy",
        "revolt", "movement", "crusade", "chronology", "reign", "archaeology",
        "primary source", "historian", "battle of", "allied powers", "axis powers"
    ],
    "Physics": [
        "force", "velocity", "acceleration", "momentum", "energy", "power",
        "wave", "optics", "lens", "mirror", "thermodynamics", "quantum",
        "newton", "electric", "magnetic", "circuit", "oscillation", "relativity",
        "gravitational", "nuclear", "radioactive", "photon", "electron", "proton",
        "capacitor", "resistor", "inductor", "semiconductor", "electrostatics",
        "current", "voltage", "resistance", "refraction", "diffraction", "interference",
        "projectile", "friction", "torque", "angular momentum", "entropy", "maxwell"
    ],
    "Chemistry": [
        "atom", "molecule", "reaction", "bond", "acid", "base", "salt",
        "orbital", "periodic", "titration", "oxidation", "reduction", "polymer",
        "hydrocarbon", "electrolysis", "catalyst", "valence", "mole", "stoichiometry",
        "enthalpy", "entropy", "equilibrium", "ph", "isomer", "functional group",
        "organic", "inorganic", "spectroscopy", "chromatography", "thermochemistry",
        "covalent", "ionic", "alkane", "alkene", "aldehyde", "ketone", "benzene"
    ],
    "Biology": [
        "cell", "organism", "dna", "rna", "protein", "evolution", "ecology",
        "anatomy", "photosynthesis", "mitosis", "meiosis", "gene", "chromosome",
        "neuron", "enzyme", "bacteria", "virus", "tissue", "organ", "respiration",
        "metabolism", "hormone", "immune", "genetics", "heredity", "mutation",
        "biome", "ecosystem", "food chain", "nervous system", "endocrine",
        "cardiovascular", "digestion", "osmosis", "diffusion", "taxonomy"
    ],
    "Computer Science": [
        "algorithm", "data structure", "programming", "database", "network",
        "operating system", "compiler", "recursion", "sorting", "binary tree",
        "complexity", "machine learning", "artificial intelligence", "neural network",
        "software", "hardware", "internet", "encryption", "stack", "queue",
        "linked list", "graph traversal", "dynamic programming", "cpu", "memory",
        "tcp", "http", "sql", "object oriented", "class", "inheritance", "python"
    ],
    "Economics": [
        "market", "supply", "demand", "inflation", "gdp", "trade", "fiscal",
        "monetary", "elasticity", "microeconomics", "macroeconomics", "utility",
        "marginal", "budget", "equilibrium price", "consumer surplus", "monopoly",
        "oligopoly", "recession", "investment", "capital", "interest rate"
    ],
    "Geography": [
        "climate", "topography", "map", "continent", "latitude", "longitude",
        "erosion", "river", "population", "migration", "earthquake", "volcano",
        "biome", "ocean", "atmosphere", "weathering", "landform", "plateau",
        "delta", "watershed", "urbanization", "demographic", "geomorphology"
    ],
    "Literature": [
        "novel", "poem", "character", "theme", "metaphor", "prose", "narrative",
        "author", "literary", "symbolism", "allegory", "sonnet", "drama",
        "plot", "protagonist", "antagonist", "genre", "fiction", "non-fiction",
        "stanza", "rhyme", "imagery", "tone", "satire", "tragedy", "comedy"
    ],
    "Statistics": [
        "probability", "distribution", "regression", "hypothesis", "variance",
        "mean", "median", "standard deviation", "sampling", "confidence interval",
        "t-test", "chi-square", "anova", "correlation", "normal distribution",
        "poisson", "binomial distribution", "random variable", "expected value"
    ]
}


def detect_subject(text: str, default_subject: str = "General") -> str:
    """Classifies text into an academic discipline using keyword density scoring."""
    if not text:
        return default_subject
    lower = text.lower()
    scores: Dict[str, int] = {}
    for subj, keywords in SUBJECT_KEYWORDS.items():
        score = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', lower))
        if score > 0:
            scores[subj] = score

    if not scores:
        return default_subject

    best_subj = max(scores, key=lambda s: scores[s])
    return best_subj if scores[best_subj] > 0 else default_subject


def split_sentences_into_chunks(text: str, max_chars: int = 1200, overlap_chars: int = 150) -> List[str]:
    """
    Splits long text on sentence/paragraph boundaries with optional overlap.
    Preserves mathematical formulas, punctuation, and readability.
    """
    text = text.strip()
    if len(text) <= max_chars:
        return [text]

    paragraphs = re.split(r'\n\s*\n', text)
    sentences: List[str] = []
    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue
        p_sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\'\(\$])', p_clean)
        sentences.extend([s.strip() for s in p_sentences if s.strip()])

    chunks: List[str] = []
    current_chunk: List[str] = []
    current_len = 0

    for s in sentences:
        s_len = len(s)
        if current_len + s_len + 1 > max_chars and current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append(chunk_text)
            
            overlap_items = []
            overlap_len = 0
            for prev_s in reversed(current_chunk):
                if overlap_len + len(prev_s) < overlap_chars:
                    overlap_items.insert(0, prev_s)
                    overlap_len += len(prev_s)
                else:
                    break
            current_chunk = overlap_items + [s]
            current_len = sum(len(x) for x in current_chunk) + len(current_chunk)
        else:
            current_chunk.append(s)
            current_len += s_len + 1

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks if chunks else [text]


class UniversalChunker:
    """
    Universal semantic chunker that recursively parses and decomposes any JSON
    structure (syllabi, history timelines, problem banks, formulas, nested objects)
    into high-quality, tagged chunks for vector embedding and retrieval.
    """

    @classmethod
    def chunk_json_data(cls, raw_data: Any, filename: str = "context.json") -> List[Dict[str, Any]]:
        """
        Main entrypoint: parses raw_data (dict, list, or primitive) and returns
        a list of normalized context item dicts with keys:
          - content: str (the rich semantic text)
          - item_type: str (e.g. 'unit', 'objective', 'outcome', 'history_event', 'theorem', 'problem', 'general')
          - subject: str (detected subject e.g. 'Mathematics', 'History', 'Physics', etc.)
          - source_file: str
          - metadata: dict
        """
        if isinstance(raw_data, dict):
            # Check for Syllabus / Course Curriculum Schema
            if any(k in raw_data for k in ("units", "course_objectives", "course_outcomes", "teaching_scheme", "course_abstract", "syllabus", "modules")):
                return cls._extract_syllabus_schema(raw_data, filename)

            # Check for History Dataset Schema
            if any(k in raw_data for k in ("events", "timeline", "eras", "dynasties", "historical_sources", "rulers", "battles", "treaties")):
                return cls._extract_history_schema(raw_data, filename)

            # Check for Question Bank Schema
            if any(k in raw_data for k in ("questions", "problems", "exercises", "mcqs", "question_bank")):
                return cls._extract_question_bank_schema(raw_data, filename)

            # Check for Science / Math Formula / Theorem Schema
            if any(k in raw_data for k in ("theorems", "formulas", "definitions", "derivations", "experiments")):
                return cls._extract_science_schema(raw_data, filename)

            # Generic nested dict traversal
            return cls._extract_generic_dict(raw_data, filename)

        elif isinstance(raw_data, list):
            return cls._extract_list_items(raw_data, filename)

        else:
            text = str(raw_data).strip()
            subject = detect_subject(text)
            return [{
                "content": text,
                "item_type": "general",
                "subject": subject,
                "source_file": filename,
                "metadata": {}
            }]

    # ── Syllabus Schema Handler ──────────────────────────────────────────────
    @classmethod
    def _extract_syllabus_schema(cls, data: dict, filename: str) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        meta = data.get("metadata", {})
        course_name = meta.get("course_name") or data.get("course_name") or data.get("title") or "Course Syllabus"
        course_code = meta.get("course_code") or data.get("course_code") or ""
        
        overall_subject = detect_subject(f"{course_name} {course_code}", default_subject="General")

        # 1. Course Metadata Summary
        scheme = meta.get("teaching_scheme") or {}
        scheme_desc = ""
        if isinstance(scheme, dict) and scheme:
            scheme_desc = f"Teaching Scheme: Lectures {scheme.get('lecture_hours_per_week', 3)}h/week, IA: {scheme.get('IA', 30)}, MSE: {scheme.get('MSE', 20)}, ESE: {scheme.get('ESE', 50)}, Total: {scheme.get('total', 100)} marks."
        elif isinstance(scheme, str):
            scheme_desc = f"Teaching Scheme: {scheme}"

        meta_content = (
            f"Course: {course_name} ({course_code}). "
            f"Academic Year: {meta.get('academic_year', 'Current')}. Revision: {meta.get('revision_no', '1.0')}. "
            f"{scheme_desc} Prerequisite: {meta.get('prerequisite', 'None')}."
        )
        items.append({
            "content": meta_content.strip(),
            "item_type": "metadata",
            "subject": detect_subject(meta_content, overall_subject),
            "source_file": filename,
            "metadata": {"course_name": course_name, "course_code": course_code}
        })

        # 2. Course Abstract / Overview
        abstract = data.get("course_abstract") or data.get("abstract") or data.get("description") or ""
        if abstract:
            chunks = split_sentences_into_chunks(str(abstract), max_chars=1200)
            for idx, chk in enumerate(chunks):
                content = f"Course Abstract ({course_name}): {chk}"
                items.append({
                    "content": content,
                    "item_type": "abstract",
                    "subject": detect_subject(content, overall_subject),
                    "source_file": filename,
                    "metadata": {"course_name": course_name, "chunk_idx": idx + 1}
                })

        # 3. Course Objectives
        objectives = data.get("course_objectives") or data.get("objectives") or []
        if isinstance(objectives, list):
            for obj in objectives:
                if isinstance(obj, dict):
                    code = obj.get("code", "")
                    text = obj.get("text") or obj.get("description") or str(obj)
                else:
                    code = ""
                    text = str(obj)
                content = f"Course Objective {code}: {text}".strip()
                items.append({
                    "content": content,
                    "item_type": "objective",
                    "subject": detect_subject(content, overall_subject),
                    "source_file": filename,
                    "metadata": {"code": code, "course_name": course_name}
                })

        # 4. Course Outcomes
        outcomes = data.get("course_outcomes") or data.get("outcomes") or []
        if isinstance(outcomes, list):
            for outcome in outcomes:
                if isinstance(outcome, dict):
                    code = outcome.get("code", "")
                    text = outcome.get("text") or outcome.get("description") or str(outcome)
                else:
                    code = ""
                    text = str(outcome)
                content = f"Course Outcome {code}: {text}".strip()
                items.append({
                    "content": content,
                    "item_type": "outcome",
                    "subject": detect_subject(content, overall_subject),
                    "source_file": filename,
                    "metadata": {"code": code, "course_name": course_name}
                })

        # 5. Units / Modules / Chapters
        units = data.get("units") or data.get("modules") or data.get("chapters") or data.get("sections") or []
        if isinstance(units, list):
            for u in units:
                if isinstance(u, dict):
                    u_num = u.get("unit_number") or u.get("module_number") or u.get("chapter_number") or u.get("number") or ""
                    u_title = u.get("title") or u.get("name") or u.get("topic") or f"Unit {u_num}"
                    hours = u.get("hours") or u.get("lecture_hours") or ""
                    contents_list = u.get("contents") or u.get("topics") or u.get("subtopics") or []
                    
                    if isinstance(contents_list, list):
                        joined_contents = "; ".join(str(c) for c in contents_list)
                    else:
                        joined_contents = str(contents_list)

                    unit_body = f"Unit {u_num}: {u_title}" + (f" ({hours} Hours)" if hours else "") + f" — Topics: {joined_contents}"
                    if u.get("self_study"):
                        unit_body += f" | Self Study: {u.get('self_study')}"
                    if u.get("applications"):
                        apps = u.get("applications")
                        unit_body += f" | Applications: {', '.join(apps) if isinstance(apps, list) else str(apps)}"
                    if u.get("further_readings"):
                        frs = u.get("further_readings")
                        unit_body += f" | Further Readings: {', '.join(frs) if isinstance(frs, list) else str(frs)}"

                    unit_chunks = split_sentences_into_chunks(unit_body, max_chars=1200)
                    for c_idx, chk in enumerate(unit_chunks):
                        title_prefix = f"Unit {u_num}: {u_title}" if len(unit_chunks) == 1 else f"Unit {u_num}: {u_title} (Part {c_idx+1})"
                        content = f"{title_prefix}\n{chk}" if not chk.startswith(f"Unit {u_num}") else chk
                        items.append({
                            "content": content,
                            "item_type": "unit",
                            "subject": detect_subject(content, overall_subject),
                            "source_file": filename,
                            "metadata": {
                                "unit_number": u_num,
                                "unit_title": u_title,
                                "course_name": course_name
                            }
                        })
                elif isinstance(u, str):
                    items.append({
                        "content": f"Unit / Topic: {u}",
                        "item_type": "unit",
                        "subject": detect_subject(u, overall_subject),
                        "source_file": filename,
                        "metadata": {"course_name": course_name}
                    })

        # 6. Textbooks & References
        for key, itype in (("text_books", "textbook"), ("reference_books", "reference"), ("references", "reference")):
            books = data.get(key, [])
            if isinstance(books, list):
                for idx, book in enumerate(books, start=1):
                    book_str = json.dumps(book) if isinstance(book, dict) else str(book)
                    content = f"Reference Reading ({itype.title()} {idx}): {book_str}"
                    items.append({
                        "content": content,
                        "item_type": itype,
                        "subject": detect_subject(content, overall_subject),
                        "source_file": filename,
                        "metadata": {"course_name": course_name}
                    })

        return items

    # ── History & Humanities Schema Handler ──────────────────────────────────
    @classmethod
    def _extract_history_schema(cls, data: dict, filename: str) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        topic = data.get("topic") or data.get("title") or data.get("era") or "History"
        
        # 1. Events / Timeline
        events = data.get("events") or data.get("timeline") or data.get("battles") or data.get("treaties") or []
        if isinstance(events, list):
            for ev in events:
                if isinstance(ev, dict):
                    year = ev.get("year") or ev.get("date") or ev.get("period") or ""
                    title = ev.get("title") or ev.get("name") or ev.get("event") or ""
                    desc = ev.get("description") or ev.get("summary") or ev.get("details") or ""
                    significance = ev.get("significance") or ev.get("impact") or ev.get("outcome") or ""
                    
                    content = f"Historical Event [{year}]: {title}. Description: {desc}"
                    if significance:
                        content += f" | Historical Significance: {significance}"
                else:
                    content = f"Historical Event: {str(ev)}"

                items.append({
                    "content": content.strip(),
                    "item_type": "history_event",
                    "subject": "History",
                    "source_file": filename,
                    "metadata": {"topic": topic}
                })

        # 2. Historical Sources / Primary Documents
        sources = data.get("historical_sources") or data.get("sources") or data.get("primary_sources") or []
        if isinstance(sources, list):
            for src in sources:
                if isinstance(src, dict):
                    title = src.get("title") or src.get("name") or "Primary Source"
                    author = src.get("author") or src.get("origin") or "Unknown"
                    extract = src.get("extract") or src.get("text") or src.get("content") or ""
                    context = src.get("context") or src.get("analysis") or ""
                    content = f"Primary Source ({title} by {author}): \"{extract}\"\nHistorical Context: {context}"
                else:
                    content = f"Historical Source: {str(src)}"

                items.append({
                    "content": content.strip(),
                    "item_type": "history_source",
                    "subject": "History",
                    "source_file": filename,
                    "metadata": {"topic": topic}
                })

        # 3. Dynasties / Eras / Rulers
        dynasties = data.get("dynasties") or data.get("eras") or data.get("rulers") or []
        if isinstance(dynasties, list):
            for d in dynasties:
                if isinstance(d, dict):
                    name = d.get("name") or d.get("title") or "Era"
                    period = d.get("period") or d.get("dates") or ""
                    achievements = d.get("achievements") or d.get("key_policies") or d.get("summary") or ""
                    content = f"Historical Era / Dynasty: {name} ({period}). Key Aspects: {achievements}"
                else:
                    content = f"Historical Dynasty/Era: {str(d)}"

                items.append({
                    "content": content.strip(),
                    "item_type": "history_era",
                    "subject": "History",
                    "source_file": filename,
                    "metadata": {"topic": topic}
                })

        return items if items else cls._extract_generic_dict(data, filename)

    # ── Question Bank / Assessment Schema Handler ─────────────────────────────
    @classmethod
    def _extract_question_bank_schema(cls, data: dict, filename: str) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        q_list = data.get("questions") or data.get("problems") or data.get("exercises") or data.get("mcqs") or data.get("question_bank") or []
        topic = data.get("topic") or data.get("subject") or data.get("title") or ""

        if isinstance(q_list, list):
            for idx, q in enumerate(q_list, start=1):
                if isinstance(q, dict):
                    q_text = q.get("text") or q.get("question") or q.get("prompt") or ""
                    marks = q.get("marks") or q.get("points") or ""
                    solution = q.get("solution") or q.get("answer") or q.get("explanation") or ""
                    subj = q.get("subject") or detect_subject(f"{topic} {q_text} {solution}")
                    
                    content = f"Question {idx}" + (f" [{marks} Marks]" if marks else "") + f": {q_text}"
                    if solution:
                        content += f"\nSolution/Marking Scheme: {solution}"
                else:
                    q_text = str(q)
                    subj = detect_subject(f"{topic} {q_text}")
                    content = f"Question {idx}: {q_text}"

                items.append({
                    "content": content.strip(),
                    "item_type": "problem_solution",
                    "subject": subj,
                    "source_file": filename,
                    "metadata": {"topic": topic, "q_index": idx}
                })

        return items if items else cls._extract_generic_dict(data, filename)

    # ── Science / Mathematics Formula & Theorem Schema Handler ───────────────
    @classmethod
    def _extract_science_schema(cls, data: dict, filename: str) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        topic = data.get("topic") or data.get("title") or "Science/Maths"

        for key, itype in (("theorems", "theorem"), ("formulas", "formula"), ("definitions", "definition"), ("derivations", "derivation")):
            entries = data.get(key, [])
            if isinstance(entries, list):
                for e in entries:
                    if isinstance(e, dict):
                        name = e.get("name") or e.get("title") or itype.title()
                        statement = e.get("statement") or e.get("formula") or e.get("definition") or e.get("expression") or ""
                        proof = e.get("proof") or e.get("derivation") or e.get("explanation") or ""
                        content = f"{itype.title()}: {name}\nStatement: {statement}"
                        if proof:
                            content += f"\nProof / Derivation: {proof}"
                    else:
                        content = f"{itype.title()}: {str(e)}"

                    subj = detect_subject(content, default_subject="Mathematics")
                    items.append({
                        "content": content.strip(),
                        "item_type": itype,
                        "subject": subj,
                        "source_file": filename,
                        "metadata": {"topic": topic}
                    })

        return items if items else cls._extract_generic_dict(data, filename)

    # ── List Items Handler ───────────────────────────────────────────────────
    @classmethod
    def _extract_list_items(cls, list_data: list, filename: str) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        for idx, entry in enumerate(list_data):
            if isinstance(entry, dict):
                text = entry.get("content") or entry.get("text") or entry.get("question") or entry.get("statement") or ""
                item_type = entry.get("type") or entry.get("category") or "general"
                topic = entry.get("topic") or entry.get("subject_area") or ""
                
                if not text:
                    text = cls._dict_to_readable_text(entry)

                subj = entry.get("subject") or detect_subject(f"{topic} {text}")
                meta = {k: v for k, v in entry.items() if k not in ("content", "text", "subject")}

                for chk in split_sentences_into_chunks(text, max_chars=1200):
                    items.append({
                        "content": chk,
                        "item_type": item_type,
                        "subject": subj,
                        "source_file": filename,
                        "metadata": meta
                    })

            elif isinstance(entry, list):
                items.extend(cls._extract_list_items(entry, filename))

            elif isinstance(entry, str):
                s_text = entry.strip()
                if s_text:
                    subj = detect_subject(s_text)
                    items.append({
                        "content": s_text,
                        "item_type": "general",
                        "subject": subj,
                        "source_file": filename,
                        "metadata": {}
                    })

        return items

    # ── Generic Hierarchical Dict Traversal ──────────────────────────────────
    @classmethod
    def _extract_generic_dict(cls, data: dict, filename: str, path_prefix: str = "") -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        
        if "content" in data or "text" in data:
            text = str(data.get("content") or data.get("text"))
            item_type = data.get("type", "general")
            subj = data.get("subject") or detect_subject(f"{path_prefix} {text}")
            items.append({
                "content": f"[{path_prefix}] {text}" if path_prefix else text,
                "item_type": item_type,
                "subject": subj,
                "source_file": filename,
                "metadata": {k: v for k, v in data.items() if k not in ("content", "text")}
            })
            return items

        for key, val in data.items():
            current_path = f"{path_prefix} > {key}" if path_prefix else key
            
            if isinstance(val, str):
                val_clean = val.strip()
                if val_clean:
                    subj = detect_subject(f"{current_path}: {val_clean}")
                    items.append({
                        "content": f"{current_path}: {val_clean}",
                        "item_type": "topic",
                        "subject": subj,
                        "source_file": filename,
                        "metadata": {"key": key, "path": current_path}
                    })

            elif isinstance(val, list):
                for idx, list_elem in enumerate(val):
                    elem_path = f"{current_path} [{idx+1}]"
                    if isinstance(list_elem, str):
                        subj = detect_subject(f"{elem_path}: {list_elem}")
                        items.append({
                            "content": f"{elem_path}: {list_elem}",
                            "item_type": "topic",
                            "subject": subj,
                            "source_file": filename,
                            "metadata": {"path": elem_path}
                        })
                    elif isinstance(list_elem, dict):
                        elem_items = cls.chunk_json_data(list_elem, filename)
                        for it in elem_items:
                            if not it["content"].startswith(current_path):
                                it["content"] = f"[{current_path}] {it['content']}"
                            items.append(it)

            elif isinstance(val, dict):
                sub_items = cls._extract_generic_dict(val, filename, path_prefix=current_path)
                items.extend(sub_items)

        if not items:
            readable = cls._dict_to_readable_text(data)
            subj = detect_subject(readable)
            items.append({
                "content": readable,
                "item_type": "general",
                "subject": subj,
                "source_file": filename,
                "metadata": {}
            })

        return items

    @staticmethod
    def _dict_to_readable_text(d: dict) -> str:
        lines = []
        for k, v in d.items():
            if isinstance(v, (dict, list)):
                lines.append(f"{k}: {json.dumps(v)}")
            else:
                lines.append(f"{k}: {v}")
        return "\n".join(lines)
