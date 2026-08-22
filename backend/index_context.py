import os
import json
import uuid
from datetime import datetime, timezone
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer


def chunk_text(text: str, max_chars: int = 1500) -> list[str]:
    """Splits text on sentence boundaries if length exceeds max_chars."""
    text = text.strip()
    if len(text) <= max_chars:
        return [text]
    
    sentences = text.replace("; ", ". ").replace("\n", ". ").split(". ")
    chunks = []
    current_chunk = []
    current_len = 0
    
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if current_len + len(s) + 2 > max_chars and current_chunk:
            chunks.append(". ".join(current_chunk) + ".")
            current_chunk = [s]
            current_len = len(s)
        else:
            current_chunk.append(s)
            current_len += len(s) + 2
            
    if current_chunk:
        chunks.append(". ".join(current_chunk) + ('.' if not current_chunk[-1].endswith('.') else ''))
    return chunks


def build_documents(data: dict) -> list[dict]:
    docs = []
    meta = data.get("metadata", {})
    course_code = meta.get("course_code", "2301101T")
    course_name = meta.get("course_name", "Calculus and Differential Equations")
    source_file = meta.get("source_file", "/mnt/data/CDE_Th_07964e271cc3e8d015916a6ef1da5504.pdf")
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Metadata Doc
    scheme = meta.get("teaching_scheme", {})
    scheme_str = f"Lecture hours: {scheme.get('lecture_hours_per_week', 3)}/week, IA: {scheme.get('IA', 30)}, MSE: {scheme.get('MSE', 20)}, ESE: {scheme.get('ESE', 50)}, Total Marks: {scheme.get('total', 100)}."
    meta_text = (
        f"Course: {course_name} ({course_code}). Credits: {meta.get('course_credits', 3)}. "
        f"Academic Year: {meta.get('academic_year', '2023-2024')}. Revision: {meta.get('revision_no', '2.0')}. "
        f"Teaching Scheme: {scheme_str} Prerequisite: {meta.get('prerequisite', 'NIL')}."
    )
    docs.append({
        "type": "metadata",
        "unit_number": None,
        "unit_title": None,
        "title": f"Course Metadata: {course_code}",
        "text": meta_text,
        "course_code": course_code,
        "course_name": course_name,
        "source_file": source_file,
        "created_at": now_iso
    })

    # 2. Course Objectives
    for obj in data.get("course_objectives", []):
        code = obj.get("code", "")
        text = obj.get("text", "")
        full_text = f"Course Objective {code}: {text}"
        docs.append({
            "type": "objective",
            "unit_number": None,
            "unit_title": None,
            "title": f"CEO: {code}",
            "text": full_text,
            "course_code": course_code,
            "course_name": course_name,
            "source_file": source_file,
            "created_at": now_iso
        })

    # 3. Course Outcomes
    for outcome in data.get("course_outcomes", []):
        code = outcome.get("code", "")
        text = outcome.get("text", "")
        full_text = f"Course Outcome {code}: {text}"
        docs.append({
            "type": "outcome",
            "unit_number": None,
            "unit_title": None,
            "title": f"CO: {code}",
            "text": full_text,
            "course_code": course_code,
            "course_name": course_name,
            "source_file": source_file,
            "created_at": now_iso
        })

    # 4. Course Abstract
    abstract = data.get("course_abstract", "")
    if abstract:
        for chk in chunk_text(abstract, max_chars=1500):
            docs.append({
                "type": "abstract",
                "unit_number": None,
                "unit_title": None,
                "title": f"Course Abstract: {course_name}",
                "text": f"Course Abstract: {chk}",
                "course_code": course_code,
                "course_name": course_name,
                "source_file": source_file,
                "created_at": now_iso
            })

    # 5. Units
    for u in data.get("units", []):
        u_num = u.get("unit_number")
        u_title = u.get("title", "")
        hours = u.get("hours", "")
        contents = u.get("contents", [])
        joined_bullets = "; ".join(contents)
        
        unit_text = f"Unit {u_num}: {u_title} (Hours: {hours}) — Contents: {joined_bullets}."
        if u.get("self_study"):
            unit_text += f" Self Study: {u.get('self_study')}."
        if u.get("applications"):
            unit_text += f" Applications: {', '.join(u.get('applications'))}."
        if u.get("further_readings"):
            unit_text += f" Further Readings: {', '.join(u.get('further_readings'))}."

        chunks = chunk_text(unit_text, max_chars=1500)
        for idx, chk in enumerate(chunks):
            chunk_title = f"Unit {u_num} {u_title}" if len(chunks) == 1 else f"Unit {u_num} {u_title} (Part {idx+1})"
            docs.append({
                "type": "unit",
                "unit_number": u_num,
                "unit_title": u_title,
                "title": chunk_title,
                "text": chk,
                "course_code": course_code,
                "course_name": course_name,
                "source_file": source_file,
                "created_at": now_iso
            })

    # 6. Textbooks
    for idx, tb in enumerate(data.get("text_books", []), start=1):
        docs.append({
            "type": "textbook",
            "unit_number": None,
            "unit_title": None,
            "title": f"Textbook {idx}",
            "text": f"Textbook: {tb}",
            "course_code": course_code,
            "course_name": course_name,
            "source_file": source_file,
            "created_at": now_iso
        })

    # 7. Reference Books
    for idx, ref in enumerate(data.get("reference_books", []), start=1):
        docs.append({
            "type": "reference",
            "unit_number": None,
            "unit_title": None,
            "title": f"Reference Book {idx}",
            "text": f"Reference Book: {ref}",
            "course_code": course_code,
            "course_name": course_name,
            "source_file": source_file,
            "created_at": now_iso
        })

    return docs


def run_indexing(
    json_path: str,
    output_dir: str = "."
):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    docs = build_documents(data)
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    dimension = model.get_sentence_embedding_dimension()
    
    index = faiss.IndexFlatL2(dimension)
    metadata_list = []
    texts_to_embed = []
    errors = []

    for doc in docs:
        doc_id = str(uuid.uuid4())
        doc_text = doc["text"]
        text_snippet = doc_text[:240]
        
        meta_entry = {
            "id": doc_id,
            "course_code": doc["course_code"],
            "course_name": doc["course_name"],
            "type": doc["type"],
            "unit_number": doc["unit_number"],
            "unit_title": doc["unit_title"],
            "title": doc["title"],
            "text_snippet": text_snippet,
            "source_file": doc["source_file"],
            "full_text_length": len(doc_text),
            "created_at": doc["created_at"]
        }
        metadata_list.append(meta_entry)
        texts_to_embed.append(doc_text)

    # Batch embedding
    try:
        embeddings = model.encode(texts_to_embed, batch_size=64, convert_to_numpy=True)
        embeddings = np.array(embeddings, dtype=np.float32)
        index.add(embeddings)
    except Exception as e:
        errors.append(f"Embedding batch error: {str(e)}")

    # Paths
    os.makedirs(output_dir, exist_ok=True)
    index_path = os.path.join(output_dir, "faiss_cde_index.index")
    metadata_path = os.path.join(output_dir, "faiss_cde_metadata.jsonl")
    manifest_path = os.path.join(output_dir, "faiss_cde_manifest.json")
    errors_log_path = os.path.join(output_dir, "faiss_cde_errors.log")

    if index.ntotal != len(metadata_list):
        raise RuntimeError(f"Index count ({index.ntotal}) does not match metadata count ({len(metadata_list)})")

    # Persist Index
    faiss.write_index(index, index_path)

    # Persist Metadata JSONL
    with open(metadata_path, "w", encoding="utf-8") as f:
        for m in metadata_list:
            f.write(json.dumps(m) + "\n")

    # Persist Manifest
    manifest = {
        "course_code": "2301101T",
        "course_name": "Calculus and Differential Equations",
        "total_vectors": index.ntotal,
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "metric": "IndexFlatL2",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "type_counts": {}
    }
    for m in metadata_list:
        t = m["type"]
        manifest["type_counts"][t] = manifest["type_counts"].get(t, 0) + 1

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # Validation Queries
    queries = [
        "partial differentiation chain rule total derivative",
        "Newton's law of cooling",
        "mass-spring system linear differential equations"
    ]
    
    query_results = []
    for q in queries:
        q_vec = model.encode([q], convert_to_numpy=True)
        q_vec = np.array(q_vec, dtype=np.float32)
        distances, indices = index.search(q_vec, min(5, index.ntotal))
        
        res_items = []
        for idx, dist in zip(indices[0], distances[0]):
            if idx != -1 and idx < len(metadata_list):
                m = metadata_list[idx]
                res_items.append({
                    "id": m["id"],
                    "type": m["type"],
                    "title": m["title"],
                    "score": round(float(dist), 4),
                    "text_snippet": m["text_snippet"]
                })
        query_results.append({
            "query": q,
            "results": res_items
        })

    report = {
        "status": "success" if not errors else "partial_failure",
        "total_chunks": len(metadata_list),
        "indexed_vectors": index.ntotal,
        "index_path": os.path.abspath(index_path).replace("\\", "/"),
        "metadata_path": os.path.abspath(metadata_path).replace("\\", "/"),
        "manifest_path": os.path.abspath(manifest_path).replace("\\", "/"),
        "samples": {
            "query_results": query_results
        },
        "errors_log": os.path.abspath(errors_log_path).replace("\\", "/") if errors else None,
        "notes": "Used IndexFlatL2 with raw L2 distance. All objectives, outcomes, units, abstract, textbooks, and references indexed."
    }

    if errors:
        with open(errors_log_path, "w", encoding="utf-8") as f:
            f.write("\n".join(errors))

    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_input = os.path.join(base_dir, "CD_Calculus_Differential_Equations_context.json")
    run_indexing(json_input, output_dir=base_dir)
