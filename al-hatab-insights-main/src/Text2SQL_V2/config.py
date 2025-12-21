import os
from dotenv import load_dotenv

# Load .env variables into OS environment
load_dotenv()

class Config:
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "google")

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    OPENAI_MODEL = "gpt-4o-mini"
    GOOGLE_MODEL = "gemini-2.5-flash"

    # Validation (optional but recommended)
    if LLM_PROVIDER == "google" and not GOOGLE_API_KEY:
        print("⚠️  WARNING: GOOGLE_API_KEY is missing in .env")

    if LLM_PROVIDER == "openai" and not OPENAI_API_KEY:
        print("⚠️  WARNING: OPENAI_API_KEY is missing in .env")

config = Config()
