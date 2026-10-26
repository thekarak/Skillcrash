from __future__ import annotations

import re
import yaml
from pydantic import ValidationError
from .models import SkillMetadata

MAX_SKILL_BYTES = 100 * 1024
FRONTMATTER = re.compile(r"\A---[ \t]*\r?\n(?P<yaml>[\s\S]*?)\r?\n---[ \t]*\r?\n?(?P<body>[\s\S]*)\Z")


class SkillParseError(ValueError):
    pass


def parse_skill(raw: str) -> tuple[SkillMetadata, str]:
    if not raw or not raw.strip():
        raise SkillParseError("The skill file is empty.")
    if len(raw.encode("utf-8")) > MAX_SKILL_BYTES:
        raise SkillParseError("The skill file exceeds the 100 KB limit.")
    match = FRONTMATTER.match(raw)
    if not match:
        raise SkillParseError("SKILL.md must begin with a YAML frontmatter block delimited by ---.")
    try:
        frontmatter = yaml.safe_load(match.group("yaml"))
    except yaml.YAMLError as exc:
        raise SkillParseError(f"Invalid YAML frontmatter: {exc}") from exc
    if not isinstance(frontmatter, dict):
        raise SkillParseError("Frontmatter must be a YAML mapping.")
    try:
        metadata = SkillMetadata.model_validate(frontmatter)
    except ValidationError as exc:
        raise SkillParseError(f"Invalid skill metadata: {exc.errors(include_url=False)}") from exc
    body = match.group("body").strip()
    if not body:
        raise SkillParseError("The skill must include instruction text after frontmatter.")
    return metadata, body
