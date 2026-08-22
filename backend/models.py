from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class ContextItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    item_type: Optional[str] = Field(default="general")
    subject: Optional[str] = Field(default="General")        # e.g. "Mathematics", "Physics"
    source_file: Optional[str] = Field(default=None)         # original filename uploaded
    metadata_json: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Exam(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    max_marks: int = Field(default=100)
    n_questions: int = Field(default=5)
    per_unit_weights_json: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    questions: List["Question"] = Relationship(back_populates="exam", cascade_delete=True)


class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exam.id")
    q_index: int
    text: str
    marks: int = Field(default=10)
    image_path: Optional[str] = Field(default=None)
    image_spec_json: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    exam: Optional[Exam] = Relationship(back_populates="questions")


# ── Trust & Transparency: No-Code Configuration Models ─────────────────────

class BlueprintConfig(SQLModel, table=True):
    """Stores saved exam blueprint configurations that admins can create/edit
    through the Control Hub UI without writing any code."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="Default Blueprint")
    exam_profile: str = Field(default="university")  # university, competitive, jee_main, jee_advanced
    difficulty_json: Optional[str] = Field(default=None)  # {"easy": 20, "medium": 50, "hard": 30}
    bloom_levels_json: Optional[str] = Field(default=None)  # ["Apply", "Analyze", "Evaluate"]
    question_types_json: Optional[str] = Field(default=None)  # {"mcq": 40, "numerical": 30, "subjective": 30}
    nep_alignment_json: Optional[str] = Field(default=None)  # {"co_mapping": true, "po_mapping": false, ...}
    guardrails_json: Optional[str] = Field(default=None)  # {"no_duplicate_topics": true, ...}
    llm_model: Optional[str] = Field(default=None)
    llm_temperature: float = Field(default=0.7)
    llm_max_tokens: int = Field(default=4000)
    llm_top_p: float = Field(default=0.9)
    max_diagrams: int = Field(default=3)
    time_minutes: int = Field(default=180)
    is_default: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GenerationLog(SQLModel, table=True):
    """Audit trail entry created after each exam generation,
    storing the frozen config snapshot and post-generation transparency analytics."""
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: Optional[int] = Field(default=None, foreign_key="exam.id")
    config_snapshot_json: Optional[str] = Field(default=None)  # full blueprint config at generation time
    transparency_json: Optional[str] = Field(default=None)  # post-gen analytics: actual difficulty, bloom, coverage
    model_used: Optional[str] = Field(default=None)
    tokens_consumed: Optional[int] = Field(default=None)
    generation_duration_ms: Optional[int] = Field(default=None)
    faiss_retrieval_count: int = Field(default=0)
    syllabus_coverage_pct: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
