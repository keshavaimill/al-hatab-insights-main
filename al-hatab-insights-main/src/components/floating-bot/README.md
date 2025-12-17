# Floating Chat Bot

A floating chat widget that integrates with the Text2SQL backend to answer natural language questions about data.

## Setup

### 1. Backend Setup

Make sure the Flask Text2SQL backend is running:

```bash
cd src/Text2SQL/Text2SQL
python app.py
```

The backend should run on `http://localhost:5000` by default.

### 2. Environment Variables (Optional)

Create a `.env` file in the project root if you need to change the API URL:

```env
VITE_TEXT2SQL_API_URL=http://localhost:5000
```

### 3. CORS Configuration

If you encounter CORS errors, add this to the Flask `app.py`:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Add this line
```

And install flask-cors:
```bash
pip install flask-cors
```

## Components

- **FloatingBot.tsx**: Main component with floating button
- **ChatWindow.tsx**: Chat interface with message display
- **api.ts**: API client for Text2SQL backend

## Features

- ✅ Floating button with custom image icon
- ✅ Smooth animations
- ✅ SQL query display
- ✅ Data table preview
- ✅ Chart visualization support
- ✅ Responsive design
- ✅ Dark mode compatible


