from __future__ import annotations

import uuid
from pathlib import Path
from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from .agent_runner import run_agent
from .attack_generator import generate_attacks
from .fix_suggester import suggest_fix
from .judge import judge
from .models import FixRequest, FixSuggestion, GenerateAttacksRequest, ParsedSkill, RunRequest, RunResult
from .skill_parser import SkillParseError, parse_skill

app = FastAPI(title="SkillCrash API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["*"])
skills: dict[str, ParsedSkill] = {}


def stored_skill(skill_id: str) -> ParsedSkill:
    skill = skills.get(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found. Upload it again before running a test.")
    return skill


@app.get("/api/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/api/upload", response_model=ParsedSkill)
async def upload_skill(file: UploadFile | None = File(default=None), text: str | None = Form(default=None)) -> ParsedSkill:
    if file and file.filename and not file.filename.lower().endswith(".md"):
        raise HTTPException(status_code=400, detail="Only .md skill files are accepted.")
    raw = text or ""
    if file:
        try:
            raw = (await file.read(100 * 1024 + 1)).decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=400, detail="Skill files must be UTF-8 text.") from exc
    try:
        metadata, body = parse_skill(raw)
    except SkillParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    skill = ParsedSkill(skill_id=str(uuid.uuid4()), metadata=metadata, body=body)
    skills[skill.skill_id] = skill
    return skill


@app.post("/api/generate-attacks")
def attacks(
    skill_id: str | None = None,
    request: GenerateAttacksRequest | None = Body(default=None),
) -> dict:
    resolved_id = (request.skill_id if request and request.skill_id else None) or skill_id
    if not resolved_id:
        raise HTTPException(status_code=400, detail="skill_id is required either in the query parameters or request body.")
    skill = stored_skill(resolved_id)
    try:
        cases, generation_mode = generate_attacks(skill.metadata.name, skill.metadata.description, skill.body)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Attack generation failed: {exc}") from exc
    # Generated cases stay untrusted until the user approves their expected behavior.
    return {"cases": [case.model_dump() for case in cases], "generation_mode": generation_mode}


@app.post("/api/run", response_model=RunResult)
def run(request: RunRequest) -> RunResult:
    skill = stored_skill(request.skill_id)
    if request.test_case.review_status == "needs_review" and not request.approved_oracle:
        raise HTTPException(status_code=400, detail="Generated cases must be approved before execution.")
    trace, final_text, model_mode = run_agent(skill.body, request.test_case, request.approved_oracle)
    verdict, reason, evidence = judge(request.test_case, trace)
    return RunResult(trace_id=str(uuid.uuid4()), verdict=verdict, reason=reason, evidence=evidence, trace=trace, final_text=final_text, model_mode=model_mode)


@app.post("/api/suggest-fix", response_model=FixSuggestion)
def suggest_fix_endpoint(request: FixRequest) -> FixSuggestion:
    skill = stored_skill(request.skill_id)
    return suggest_fix(skill.body, request.trace, request.verdict)
