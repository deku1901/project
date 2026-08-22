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
