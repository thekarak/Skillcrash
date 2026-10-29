from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator, model_validator


class SkillMetadata(BaseModel):
    name: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9][a-z0-9-]*$")
    description: str = Field(min_length=5, max_length=300)


class SkillMeta(BaseModel):
    skill_id: str
    name: str
    description: str
    body: str
    size_bytes: int


class ParsedSkill(BaseModel):
    skill_id: str
    metadata: SkillMetadata
    body: str
    name: str = ""
    description: str = ""
    size_bytes: int = 0

    @model_validator(mode="before")
    @classmethod
    def populate_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            metadata = data.get("metadata")
            if isinstance(metadata, dict):
                data.setdefault("name", metadata.get("name", ""))
                data.setdefault("description", metadata.get("description", ""))
            elif isinstance(metadata, SkillMetadata):
                data.setdefault("name", metadata.name)
                data.setdefault("description", metadata.description)
            if "body" in data and ("size_bytes" not in data or not data["size_bytes"]):
                data["size_bytes"] = len(data["body"].encode("utf-8"))
        return data


TestCaseCategory = Literal[
    "prompt_injection",
    "destructive_action",
    "destructive_no_confirmation",
    "secret_exposure",
    "secret_exfiltration",
    "wrong_path",
    "wrong_path_missing_data",
    "safe_operation",
    "benign_control",
    "custom_red_team",
]


class TestCase(BaseModel):
    __test__ = False
    id: str
    category: TestCaseCategory = "prompt_injection"
    prompt: str = Field(min_length=1, max_length=2000)
    expected_outcome: Literal["block", "confirm", "allow"]
    must_not_actions: list[str] = Field(default_factory=list)
    required_actions: list[str] = Field(default_factory=list)
    approved_deletions: list[str] = Field(default_factory=list)
    scope: str = "/project/tmp"
    rationale: str = ""
    success_criteria: str = ""
    review_status: Literal["golden", "needs_review", "approved"] = "needs_review"

    @field_validator("scope")
    @classmethod
    def safe_scope(cls, value: str) -> str:
        if not value.startswith("/") or ".." in value:
            raise ValueError("scope must be an absolute, traversal-free mock path")
        return value


class TraceEvent(BaseModel):
    order: int
    kind: str
    tool_name: str | None = None
    arguments: dict[str, Any] | None = None
    allowed: bool | None = None
    result: Any | None = None
    text: str | None = None
    message: str | None = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    turn: int = 1

    @model_validator(mode="before")
    @classmethod
    def sync_text_message(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "text" in data and ("message" not in data or data["message"] is None):
                data["message"] = data["text"]
            elif "message" in data and ("text" not in data or data["text"] is None):
                data["text"] = data["message"]
        return data


class Violation(BaseModel):
    rule_id: str
    event_order: int
    tool_name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    message: str


class JudgeResult(BaseModel):
    verdict: Literal["PASS", "FAIL", "ERROR"]
    reason: str
    violations: list[Violation] = Field(default_factory=list)
    checks_passed: list[str] = Field(default_factory=list)


class RunResult(BaseModel):
    trace_id: str
    skill_id: str = ""
    test_case_id: str = ""
    source: Literal["live", "cached"] = "live"
    verdict: Literal["PASS", "FAIL", "ERROR"]
    reason: str
    evidence: list[str] = Field(default_factory=list)
    judge: JudgeResult | None = None
    trace: list[TraceEvent]
    final_text: str | None = None
    fixture_before: dict[str, str] = Field(default_factory=dict)
    fixture_after: dict[str, str] = Field(default_factory=dict)
    real_side_effects: Literal[False] = False
    model_mode: Literal["gemma", "demo"] = "demo"

    @model_validator(mode="before")
    @classmethod
    def populate_run_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            verdict = data.get("verdict", "PASS")
            reason = data.get("reason", "")
            evidence = data.get("evidence", [])
            if "judge" not in data or data["judge"] is None:
                violations = [
                    Violation(
                        rule_id="RULE_VIOLATION",
                        event_order=1,
                        tool_name="unknown",
                        arguments={},
                        message=str(e),
                    )
                    for e in evidence
                ]
                checks = ["All constraints satisfied"] if verdict == "PASS" else []
                data["judge"] = JudgeResult(
                    verdict=verdict,
                    reason=reason,
                    violations=violations,
                    checks_passed=checks,
                )
        return data


class RunRequest(BaseModel):
    skill_id: str
    test_case_id: str | None = None
    test_case: TestCase | None = None
    approved_oracle: bool = False


class ApproveCaseRequest(BaseModel):
    edits: dict[str, Any] = Field(default_factory=dict)


class GenerateAttacksRequest(BaseModel):
    skill_id: str | None = None


class FixRequest(BaseModel):
    skill_id: str
    trace_id: str | None = None
    trace: list[TraceEvent] | None = None
    verdict: str | None = None


class FixSuggestion(BaseModel):
    referenced_instruction: str
    problem: str = ""
    suggested_replacement: str = ""
    rationale: str = ""
    fix: str = ""


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
