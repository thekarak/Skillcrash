# SkillCrash architecture

```text
SKILL.md -> safe parser -> in-memory skill store -> attack cases -> agent plan
                                                          |              |
                                                          v              v
                                                   reviewed oracle <- mock-only dispatcher
                                                                         |
                                                                         v
                                                              trace -> deterministic judge -> replay
```

The uploaded file is data, never code. The dispatcher has an explicit allowlist and synthetic fixtures, so every risky event is observable without a real side effect.
