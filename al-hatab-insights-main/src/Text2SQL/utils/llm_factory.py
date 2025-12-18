from config import config
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

def load_llm(temp=0):
    if config.LLM_PROVIDER == "openai":
        if not config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required but not set in environment variables")
        return ChatOpenAI(model=config.OPENAI_MODEL, temperature=temp, api_key=config.OPENAI_API_KEY)
    else:
        if not config.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is required but not set in environment variables")
    return ChatGoogleGenerativeAI(model=config.GOOGLE_MODEL, temperature=temp, api_key=config.GOOGLE_API_KEY)
