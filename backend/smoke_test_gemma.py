"""
SkillCrash - Gemma 4 Smoke Test Script
Verifies Google AI Studio API key and Gemma 4 connectivity.
Run from repository root or backend:
    python backend/smoke_test_gemma.py
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env if present
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

api_key = os.getenv("GEMINI_API_KEY", "").strip()
model_name = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it").strip()

print("=" * 65)
print(f"SkillCrash: Gemma 4 Smoke Test")
print("=" * 65)

if not api_key:
    print("\n[!] WARNING: GEMINI_API_KEY is not set.")
    print("Please open backend/.env and paste your Google AI Studio API key:")
    print("    GEMINI_API_KEY=your_actual_key_here\n")
    exit(1)

print(f"API Key detected: {api_key[:6]}...{api_key[-4:] if len(api_key) > 10 else ''}")
print(f"Primary Model:    {model_name}")
print("Connecting to Google GenAI API...\n")

from google import genai

client = genai.Client()

def test_single_model(m_name: str) -> bool:
    print(f"--> Testing model: {m_name}")
    try:
        response = client.models.generate_content(
            model=m_name,
            contents="Reply with the single word READY.",
        )
        print(f"[OK] SUCCESS ({m_name}): {response.text.strip()}")
        return True
    except Exception as e:
        err_msg = str(e)
        print(f"[ERROR] FAILED ({m_name}): {err_msg}")
        return False

# Test primary model
success = test_single_model(model_name)

if not success and model_name != "gemma-4-26b-a4b-it":
    print("\n" + "-" * 65)
    print(f"Note: '{model_name}' encountered an upstream Google API error.")
    print("Testing recommended Blueprint model 'gemma-4-26b-a4b-it'...")
    print("-" * 65)
    backup_success = test_single_model("gemma-4-26b-a4b-it")
    if backup_success:
        print("\n[OK] Gemma 4 (gemma-4-26b-a4b-it) is 100% operational!")
        print("Tip: In backend/.env, set:")
        print("    GEMMA_MODEL=gemma-4-26b-a4b-it")
        print("to use the stable Gemma 4 model while Google resolves the 31B outage.")

print("\n" + "=" * 65)
