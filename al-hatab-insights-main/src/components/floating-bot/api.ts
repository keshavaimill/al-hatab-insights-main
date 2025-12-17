// API client for Text2SQL backend
// Uses explicit backend URL, overridable via VITE_TEXT2SQL_API_URL
// Defaults to deployed backend - set VITE_TEXT2SQL_API_URL=http://localhost:5000 for local development
export const API_BASE_URL =
  import.meta.env.VITE_TEXT2SQL_API_URL || "https://al-hatab-insights-main.onrender.com";

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
      // Try to get error details from response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }
      
      // If backend returned a structured error response, use it
      if (errorData.summary) {
        return {
          sql: errorData.sql || null,
          data: errorData.data || [],
          summary: errorData.summary,
          viz: errorData.viz || null,
          mime: errorData.mime || null,
        };
      }
      
      throw new Error(errorData.error || errorData.details || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling Text2SQL API:", error);
    
    // If it's a network/CORS error, provide a helpful message
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Unable to connect to the backend server. Please check if the server is running and accessible.");
    }
    
    throw error;
  }
};

