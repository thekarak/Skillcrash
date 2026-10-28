from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator


class SkillMetadata(BaseModel):
    name: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9][a-z0-9-]*$")
    description: str = Field(min_length=5, max_length=300)


class ParsedSkill(BaseModel):
    skill_id: str
    metadata: SkillMetadata
    body: str


class TestCase(BaseModel):
    __test__ = False
    id: str
    category: Literal["prompt_injection", "destructive_action", "secret_exposure", "wrong_path", "safe_operation", "custom_red_team"]
    prompt: str = Field(min_length=1, max_length=2000)
    expected_outcome: Literal["block", "confirm", "allow"]
    must_not_actions: list[str] = Field(default_factory=list)
    scope: str = "/project/tmp"
    rationale: str
    success_criteria: str
    review_status: Literal["golden", "needs_review", "approved"] = "needs_review"

    @field_validator("scope")
    @classmethod
    def safe_scope(cls, value: str) -> str:
        if not value.startswith("/") or ".." in value:
            raise ValueError("scope must be an absolute, traversal-free mock path")
        return value


class TraceEvent(BaseModel):
    order: int
    kind: Literal["model", "tool", "judge", "error"]
    tool_name: str | None = None
    arguments: dict[str, Any] | None = None
    allowed: bool | None = None
    result: Any | None = None
    message: str | None = None


class RunResult(BaseModel):
    trace_id: str
    verdict: Literal["PASS", "FAIL", "ERROR"]
    reason: str
    evidence: list[str]
    trace: list[TraceEvent]
    final_text: str | None = None
    model_mode: Literal["gemma", "demo"]


class RunRequest(BaseModel):
    skill_id: str
    test_case: TestCase
    approved_oracle: bool = False


class GenerateAttacksRequest(BaseModel):
    skill_id: str | None = None


class FixRequest(BaseModel):
    skill_id: str
    trace: list[TraceEvent]
    verdict: str


class FixSuggestion(BaseModel):
    fix: str
    referenced_instruction: str


class ThreatCategoryScore(BaseModel):
    category: str
    score: int
    total: int
    verdict: str


class SuiteRunRequest(BaseModel):
    skill_id: str
    test_cases: list[TestCase] | None = None


class SuiteRunResult(BaseModel):
    skill_id: str
    overall_score: int
    grade: Literal["A+", "A", "B", "C", "D", "F"]
    total_cases: int
    passed_cases: int
    failed_cases: int
    category_scores: list[ThreatCategoryScore]
    results: list[RunResult]
    suggested_patch: str
    hardened_skill_body: str


class CustomStrikeRequest(BaseModel):
    skill_id: str
    prompt: str
    expected_outcome: Literal["block", "confirm", "allow"] = "block"
    category: str = "custom_red_team"


class ExportHardenedRequest(BaseModel):
    skill_id: str
    patch: str | None = None


class ExportHardenedResponse(BaseModel):
    filename: str
    content: str
