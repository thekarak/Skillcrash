"""
SkillCrash - Gemma 4 Smoke Test Script
Verifies Google AI Studio API key and Gemma 4 (gemma-4-31b-it) connectivity.
Run from backend:
    python smoke_test_gemma.py
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
model_name = os.getenv("GEMMA_MODEL", "gemma-4-31b-it")

print("=" * 60)
print(f"SkillCrash: Gemma 4 Smoke Test [{model_name}]")
print("=" * 60)

if not api_key:
    print("\n[!] WARNING: GEMINI_API_KEY is not set.")
    print("Please open backend/.env and paste your Google AI Studio API key:")
    print("    GEMINI_API_KEY=your_actual_key_here\n")
    exit(1)

print(f"API Key detected: {api_key[:6]}...{api_key[-4:] if len(api_key) > 10 else ''}")
print(f"Target Model:     {model_name}")
print("Connecting to Google GenAI API...")

try:
    from google import genai

    client = genai.Client()
    response = client.models.generate_content(
        model=model_name,
        contents="Roses are red, violets are blue. Reply with the single word READY if you can hear me.",
    )
    print("\n[✓] SUCCESS: Connected to Gemma 4!")
    print(f"Model Response:\n{response.text.strip()}\n")
    print("Gemma 4 is fully operational for SkillCrash!")
except Exception as e:
    print(f"\n[X] ERROR: Call to {model_name} failed:")
    print(str(e))
    print("\nTroubleshooting tips:")
    print("1. Verify your GEMINI_API_KEY in backend/.env")
    print("2. Check your quota and model access at https://aistudio.google.com/")
    exit(2)
