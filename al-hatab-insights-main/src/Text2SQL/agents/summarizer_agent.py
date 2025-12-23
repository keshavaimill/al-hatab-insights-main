import matplotlib.pyplot as plt
import base64
from io import BytesIO
from utils.llm_factory import load_llm

class SummarizerAgent:
    def __init__(self):
        self.llm = load_llm(0.2)

    def summarize(self, q, df):
        # Handle empty dataframe
        if df.empty:
            return f"No data found for your query: '{q}'. Please try rephrasing your question or check if the data exists in the database."
        
        # Get data sample - use more rows for better context
        num_rows = len(df)
        sample_size = min(10, num_rows)  # Show up to 10 rows for context
        data_sample = df.head(sample_size).to_string() if sample_size > 0 else "No data available"
        
        # Get column info for better context
        columns_info = f"Columns: {', '.join(df.columns.tolist())}"
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            columns_info += f"\nNumeric columns: {', '.join(numeric_cols)}"
        
        # Build a more detailed prompt
        prompt = f"""
You are a senior data analyst. Analyze the following query results and provide a clear, concise summary.

Question: {q}

{columns_info}

Data sample ({sample_size} of {num_rows} rows):
{data_sample}

Instructions:
- If the data is meaningful, provide 2-3 short bullet points with key insights
- Focus on the most important numbers, trends, or patterns
- Use plain language that a business user would understand
- If the data seems incomplete or unclear, mention that

Provide your analysis:
"""
        try:
            response = self.llm.invoke(prompt)
            summary = response.content if hasattr(response, "content") else str(response)
            
            # Validate the response isn't generic
            generic_phrases = [
                "dataset is currently empty",
                "no data points or variables are available",
                "need to acquire and load the relevant data",
                "no data available for analysis"
            ]
            
            if any(phrase.lower() in summary.lower() for phrase in generic_phrases):
                # Return a more helpful message based on actual data
                if num_rows > 0:
                    return f"Found {num_rows} result(s) for your query. Here are the key details:\n\n" + data_sample[:500] + ("..." if len(data_sample) > 500 else "")
                else:
                    return f"No data found matching your query: '{q}'. Please try rephrasing or check if the data exists."
            
            return summary
        except Exception as e:
            print(f"Error in summarizer: {str(e)}")
            # Fallback to basic summary
            if num_rows > 0:
                return f"Query returned {num_rows} row(s). Data columns: {', '.join(df.columns.tolist()[:5])}"
            else:
                return f"No data found for: '{q}'"
    
    # ---------------------------------------------
    # Detect chart type based on question
    # ---------------------------------------------
    def detect_chart_type(self, question: str):
        q = question.lower()

        if "line" in q or "trend" in q or "time series" in q:
            return "line"
        if "bar" in q or "compare" in q or "comparison" in q:
            return "bar"
        if "scatter" in q or "relationship" in q or "correlation" in q:
            return "scatter"
        if "hist" in q or "distribution" in q:
            return "hist"
        if "pie" in q:
            return "pie"

        return "auto"  # fallback

    def generate_viz(self, question, df):
        if df.empty:
            return None, None

        chart_type = self.detect_chart_type(question)
        plt.figure(figsize=(8, 4))

        # Auto-select columns
        numeric_cols = df.select_dtypes(include="number").columns.tolist()
        non_numeric_cols = df.select_dtypes(exclude="number").columns.tolist()

        # default selections
        x = non_numeric_cols[0] if non_numeric_cols else df.columns[0]
        y = numeric_cols[0] if numeric_cols else None

        # ---------------------------------------------
        # CHART TYPE HANDLERS
        # ---------------------------------------------
        try:
            if chart_type == "line":
                if y is None:
                    return None, None
                df.plot.line(x=x, y=y)

            elif chart_type == "bar":
                if y is None:
                    return None, None
                df.plot.bar(x=x, y=y)

            elif chart_type == "scatter":
                if len(numeric_cols) < 2:
                    return None, None
                df.plot.scatter(x=numeric_cols[0], y=numeric_cols[1])

            elif chart_type == "hist":
                if y is None:
                    return None, None
                df[y].plot.hist()

            elif chart_type == "pie":
                if y is None:
                    return None, None
                df.set_index(x)[y].plot.pie(autopct="%1.1f%%")

            # fallback → auto
            else:
                df.plot()

            # ---------------------------------------------
            # Export PNG for frontend
            # ---------------------------------------------
            buf = BytesIO()
            plt.tight_layout()
            plt.savefig(buf, format="png")
            buf.seek(0)
            encoded = base64.b64encode(buf.read()).decode("utf-8")
            plt.close()

            return encoded, "image/png"

        except Exception as e:
            print("Plot error:", e)
            return None, None