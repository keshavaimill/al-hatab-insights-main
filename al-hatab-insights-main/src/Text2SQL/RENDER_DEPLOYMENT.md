# Render Deployment Guide

## Configuration

This backend is configured to work with Render's deployment requirements:

1. **Port Configuration**: The app uses the `PORT` environment variable provided by Render
   - Falls back to port 5000 for local development
   - Automatically binds to `0.0.0.0` to accept external connections

2. **Procfile**: Located at `src/Text2SQL/Procfile`
   - Command: `web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - Uses gunicorn (production WSGI server) instead of Flask's dev server

## Render Service Settings

When setting up the service on Render:

1. **Root Directory**: Set to `src/Text2SQL` (the directory containing `app.py` and `Procfile`)

2. **Build Command**: (Optional - Render will auto-detect Python)
   ```bash
   pip install -r requirements.txt
   ```

3. **Start Command**: Render will automatically use the Procfile (no need to set manually)

**Note**: We use `gunicorn` instead of `python app.py` for production. The Procfile handles this automatically.

4. **Environment Variables**: Make sure to set these in Render's dashboard:
   - `LLM_PROVIDER` (e.g., `google` or `openai`)
   - `GOOGLE_API_KEY` (if using Google)
   - `OPENAI_API_KEY` (if using OpenAI)
   - `PORT` (automatically set by Render - don't override)

## Verifying Deployment

Once deployed, check the health endpoint:
```
https://your-service-name.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "al-hatab-insights-backend",
  "version": "1.0.0",
  "agents": "ready" or "not_initialized"
}
```

