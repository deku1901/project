"""
vector_store.py
===============
FAISS-backed dense vector store with subject-aware querying and statistics.
"""

import faiss
import numpy as np
from typing import List, Dict, Any, Union, Optional
from sentence_transformers import SentenceTransformer
from collections import Counter


class VectorStore:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.encoder = SentenceTransformer(model_name)
        self.dimension = self.encoder.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatL2(self.dimension)
        self.items: List[Dict[str, Any]] = []

    # ── Write ──────────────────────────────────────────────────────────────
    def add(self, list_of_items: List[Union[Dict[str, Any], str]]):
        """
        Add items to the FAISS index.  Each item may be a plain string or
        a dict with at least a 'content'/'text' key.  Optionally carries a
        'subject' field that is preserved in self.items for later filtering.
        """
        if not list_of_items:
            return

        texts, structured = [], []
        for item in list_of_items:
            if isinstance(item, str):
                texts.append(item)
                structured.append({"content": item})
            elif isinstance(item, dict):
                text = item.get("content") or item.get("text") or str(item)
                texts.append(text)
                structured.append(item)
            else:
                text = str(item)
                texts.append(text)
                structured.append({"content": text})

        embeddings = self.encoder.encode(texts, convert_to_numpy=True)
        embeddings = np.array(embeddings, dtype=np.float32)
        self.index.add(embeddings)
        self.items.extend(structured)

    # ── Read ───────────────────────────────────────────────────────────────
    def query(self, query_text: str, k: int = 6, subject: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Return top-k items semantically similar to query_text.
        If *subject* is provided, results are filtered to that subject first
        (if there are enough matching items), with a graceful fallback to the
        global index when the subject subset is too small.
        """
        if self.index.ntotal == 0 or not query_text.strip():
            return []

        qvec = np.array(self.encoder.encode([query_text], convert_to_numpy=True), dtype=np.float32)

        # Subject-filtered search
        if subject and subject.lower() not in ("general", ""):
            subject_items = [(i, item) for i, item in enumerate(self.items)
                             if item.get("subject", "General").lower() == subject.lower()]
            if len(subject_items) >= max(k, 3):
                sub_embeddings = np.array(
                    self.encoder.encode(
                        [it["content"] for _, it in subject_items],
                        convert_to_numpy=True
                    ),
                    dtype=np.float32
                )
                sub_idx = faiss.IndexFlatL2(self.dimension)
                sub_idx.add(sub_embeddings)
                actual_k = min(k, sub_idx.ntotal)
                _, indices = sub_idx.search(qvec, actual_k)
                results = []
                for i in indices[0]:
                    if i != -1 and i < len(subject_items):
                        orig_i, item = subject_items[i]
                        r = dict(item)
                        results.append(r)
                if results:
                    return results

        # Global search
        actual_k = min(k, self.index.ntotal)
        _, indices = self.index.search(qvec, actual_k)
        return [
            dict(self.items[i])
            for i in indices[0]
            if i != -1 and i < len(self.items)
        ]

    # ── Analytics ──────────────────────────────────────────────────────────
    def get_subject_stats(self) -> Dict[str, int]:
        """Return a {subject: count} dictionary of indexed items."""
        subjects = [item.get("subject", "General") for item in self.items]
        return dict(Counter(subjects))

    def get_total(self) -> int:
        return self.index.ntotal

    def clear(self):
        """Reset the vector store."""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.items = []
