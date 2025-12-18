# Fix: API Key Leaked Error

## Problem
You're receiving this error:
```
PERMISSION_DENIED: 403 PERMISSION_DENIED. 
Your API key was reported as leaked. Please use another API key.
```

This happens when your Google API key was exposed publicly (e.g., in a GitHub repository, logs, or shared publicly). Google automatically disables leaked keys for security.

## Solution: Create a New API Key

### Step 1: Create a New Google API Key

1. **Go to Google AI Studio:**
   - Visit: https://aistudio.google.com/apikey
   - Or: https://makersuite.google.com/app/apikey

2. **Create a new API key:**
   - Click "Create API Key"
   - Select your Google Cloud project (or create a new one)
   - Copy the new API key immediately (you won't see it again)

3. **Optional: Restrict the API key (Recommended for Production):**
   - Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
   - Find your new API key
   - Click "Edit"
   - Under "API restrictions", select "Restrict key"
   - Choose "Gemini API" only
   - Save

### Step 2: Update API Key in Render

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Navigate to your backend service (`al-hatab-insights-main`)

2. **Update Environment Variables:**
   - Click on "Environment" tab
   - Find `GOOGLE_API_KEY`
   - Click "Edit" or update the value
   - Paste your new API key
   - Click "Save Changes"

3. **Redeploy (if needed):**
   - Render should automatically redeploy when you save environment variables
   - If not, click "Manual Deploy" → "Deploy latest commit"

### Step 3: Verify It Works

1. **Check Health Endpoint:**
   ```
   https://al-hatab-insights-main.onrender.com/health
   ```
   Should show: `{"status": "healthy", "agents": "ready", ...}`

2. **Test the Chatbot:**
   - Try asking a question in the chatbot
   - Should work without the PERMISSION_DENIED error

## Alternative: Use OpenAI Instead

If you prefer to use OpenAI:

1. **Get OpenAI API Key:**
   - Visit: https://platform.openai.com/api-keys
   - Create a new API key

2. **Update Render Environment Variables:**
   - Set `LLM_PROVIDER=openai`
   - Set `OPENAI_API_KEY=your_openai_api_key_here`
   - Remove or leave `GOOGLE_API_KEY` empty

## Security Best Practices

### ✅ DO:
- Store API keys in environment variables (not in code)
- Use Render's environment variables for production
- Restrict API keys to specific APIs/IPs when possible
- Rotate keys periodically
- Use different keys for development and production

### ❌ DON'T:
- Commit `.env` files to Git
- Share API keys in public repositories
- Hardcode API keys in source code
- Share API keys in screenshots or documentation

## Verify .env is in .gitignore

Make sure your `.gitignore` includes:
```
.env
.env.local
.env.*.local
```

If not, add these lines to prevent accidentally committing API keys.

## Need Help?

If you continue to have issues:
1. Check Render logs for specific error messages
2. Verify the API key is correctly set in Render environment variables
3. Test the API key directly using Google's API tester
4. Make sure you have billing enabled in Google Cloud (free tier is usually sufficient)

