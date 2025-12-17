# Text2SQL Backend

## Setup

1. **Install dependencies:**
   ```bash
   cd src/Text2SQL
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `src/Text2SQL` directory with:
   ```
   LLM_PROVIDER=google  # or "openai"
   GOOGLE_API_KEY=your_google_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here  # if using OpenAI
   ```

3. **Run the Flask server:**
   ```bash
   cd src/Text2SQL
   python app.py
   ```
   
   The server will start on `http://localhost:5000`

## API Endpoint

- **POST** `/query`
  - Request body: `{ "question": "your question here" }`
  - Response: 
    ```json
    {
      "sql": "SELECT ...",
      "data": [...],
      "summary": "Summary text",
      "viz": "base64_image_string" | null,
      "mime": "image/png" | null
    }
    ```

## Frontend Integration

The frontend is configured to proxy requests to `/api/text2sql` which routes to `http://localhost:5000` via Vite proxy (see `vite.config.ts`).

## File Structure

```
src/Text2SQL/
├── app.py                 # Flask application entry point
├── config.py              # Configuration and environment variables
├── requirements.txt       # Python dependencies
├── local.db              # SQLite database (generated)
├── schema_metadata.json  # Schema metadata for agents
├── datasets/             # CSV data files
│   ├── dc_168h_forecasts.csv
│   └── store_168h_forecasts.csv
├── agents/               # LLM agents
│   ├── text2sql_agent.py
│   └── summarizer_agent.py
├── core/                 # Core utilities
│   ├── db_builder.py
│   └── schema_loader.py
└── utils/                # Helper utilities
    ├── intent.py
    └── llm_factory.py
```

## Notes

- All file paths are resolved relative to `app.py` location using absolute paths
- CORS is enabled to allow frontend requests
- The server runs on port 5000 by default

