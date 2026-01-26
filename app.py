import streamlit as st
import pandas as pd
import google.generativeai as genai
import os
import json
import re

# =================================================================
# UI Configuration
# =================================================================
st.set_page_config(page_title="Google Maps Lead Scraper", page_icon="📍", layout="wide")

# Premium UI Styling
st.markdown("""
<style>
    .main {
        background-color: #f8fafc;
    }
    .stApp {
        max-width: 1200px;
        margin: 0 auto;
    }
    .main-header {
        font-family: 'Inter', sans-serif;
        color: #0f172a;
        font-weight: 800;
        text-align: center;
        margin-bottom: 2rem;
    }
    .stButton > button {
        background: linear-gradient(90deg, #2563eb, #1d4ed8);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 0.75rem 2rem;
        font-size: 1.1rem;
        font-weight: 600;
        width: 100%;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        background: linear-gradient(90deg, #1d4ed8, #1e40af);
    }
    .lead-table {
        background-color: white;
        padding: 1rem;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    .stTextInput > div > div > input {
        border-radius: 10px;
    }
</style>
""", unsafe_allow_html=True)

st.markdown("<h1 class='main-header'>Google Maps Lead Scraper</h1>", unsafe_allow_html=True)

# API Key handling (Check multiple possible env var names)
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("API_KEY") or os.environ.get("GOOGLE_API_KEY")

# =================================================================
# Scraper Logic (Integrated from React implementation)
# =================================================================
def scrape_google_maps(keyword, location):
    """
    Core scraping logic using Gemini Grounding with Google Maps.
    """
    if not API_KEY:
        st.error("⚠️ API Key not found. Please set the GEMINI_API_KEY environment variable.")
        return None

    try:
        genai.configure(api_key=API_KEY)
        
        # Initialize model with grounding tool (google_search_retrieval)
        # This replaces the TS 'googleMaps' tool for Python compatibility
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            tools=[{"google_search_retrieval": {}}]
        )
        
        # Enhanced prompt for structured lead extraction
        prompt = f"""
        Search for businesses based on the query: "{keyword}" in "{location}".
        Use Google Maps to find the most relevant and highly-rated businesses.
        For each business, extract:
        1. Business Name
        2. Address
        3. Phone Number
        4. Official Website
        5. Rating (out of 5)
        
        Output the results ONLY as a valid JSON list. 
        Example format:
        [
            {{
                "Business Name": "Global Marketing inc",
                "Address": "789 Broadway, New York, NY",
                "Phone": "+1 212-555-0123",
                "Website": "https://globalmarketing.com",
                "Rating": 4.7
            }}
        ]
        """
        
        response = model.generate_content(prompt)
        text_content = response.text.strip()
        
        # Basic parsing cleanup
        if text_content.startswith("```json"):
            text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"):
            text_content = text_content[3:-3].strip()
            
        return json.loads(text_content)

    except json.JSONDecodeError:
        st.error("❌ The AI response could not be parsed as JSON. Please try again.")
        return None
    except Exception as e:
        st.error(f"❌ An error occurred during scraping: {str(e)}")
        return None

# =================================================================
# Application Execution Logic
# =================================================================
with st.container():
    col1, col2 = st.columns(2)
    with col1:
        keyword_input = st.text_input("Business Keyword", placeholder="e.g. Roof Repair, Dental Clinic")
    with col2:
        location_input = st.text_input("Location", placeholder="e.g. Austin, TX")

if st.button("Start Scraping"):
    if not keyword_input or not location_input:
        st.warning("Please fill in both fields before starting.")
    else:
        with st.spinner(f"🔍 Fetching leads for '{keyword_input}' in '{location_input}'..."):
            results = scrape_google_maps(keyword_input, location_input)
            
            if results and isinstance(results, list):
                # Convert results to Pandas DataFrame
                df = pd.DataFrame(results)
                
                # Define expected output columns
                output_columns = ["Business Name", "Address", "Phone", "Website", "Rating"]
                
                # Fill missing columns/values
                for col in output_columns:
                    if col not in df.columns:
                        df[col] = "N/A"
                
                df = df[output_columns]
                
                # Display Results
                st.success(f"✅ Successfully found {len(df)} leads!")
                
                st.markdown("<div class='lead-table'>", unsafe_allow_html=True)
                st.dataframe(df, use_container_width=True, hide_index=True)
                st.markdown("</div>", unsafe_allow_html=True)
                
                # Download Button
                csv = df.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="📥 Download CSV",
                    data=csv,
                    file_name=f"google_maps_leads_{keyword_input.lower().replace(' ', '_')}.csv",
                    mime='text/csv',
                )
            else:
                st.info("No leads were found or the format was unexpected. Try adjusting your keyword.")

# Footer
st.markdown("---")
st.caption("Google Maps Lead Scraper AI | Powered by Gemini 1.5 Flash Grounding")
