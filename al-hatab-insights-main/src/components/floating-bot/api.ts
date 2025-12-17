// API client for Text2SQL backend
// Uses explicit backend URL, overridable via VITE_TEXT2SQL_API_URL
export const API_BASE_URL =
  import.meta.env.VITE_TEXT2SQL_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "https://al-hatab-insights-main.onrender.com");

export interface QueryResponse {
  sql: string;
  data: Record<string, any>[];
  summary: string;
  viz: string | null;
  mime: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  data?: Record<string, any>[];
  viz?: string | null;
  mime?: string | null;
  timestamp: Date;
}

export const sendQuery = async (question: string): Promise<QueryResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling Text2SQL API:", error);
    throw error;
  }
};

