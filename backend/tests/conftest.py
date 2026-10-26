import os
import pytest

@pytest.fixture(autouse=True)
def disable_live_gemma_for_unit_tests(monkeypatch):
    """Ensure unit tests run deterministically without burning API quota or relying on network."""
    monkeypatch.setenv("SKILLCRASH_USE_GEMMA", "0")
