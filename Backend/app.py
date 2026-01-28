from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_engine import SkillAnalyzer
import os
import requests  # Using standard requests for everything now

app = Flask(__name__)
CORS(app)
analyzer = SkillAnalyzer()

# --- CONFIGURATION ---
# 1. Job Search Key
RAPID_API_KEY = "1ce074e645msh391a641d555aa10p10ffcejsn440586942bef"

# 2. Gemini API Key (PASTE YOUR NEW KEY HERE)
GEMINI_API_KEY = "AIzaSyCmGj9H3cN20GLFBRBtafcXE2lHPksT5J0" 

# --- HELPER: Direct Call to Gemini (Using the SAFE 'gemini-flash-latest' alias) ---
def call_gemini(prompt):
    # We switched to 'gemini-flash-latest' which is guaranteed to have Free Tier quota
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        # Check for Errors
        if response.status_code != 200:
            return f"Error from Google: {response.text}"
            
        data = response.json()
        
        # Safety Check
        if "candidates" not in data or not data["candidates"]:
             return "I couldn't think of a response. Please try asking differently! 😊"

        return data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        return f"Connection Error: {str(e)}"

# --- 1. RESUME ANALYSIS ---
@app.route('/analyze', methods=['POST'])
def analyze_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    role = request.form.get('role', 'Frontend Developer')
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        pdf_content = file.read()
        results = analyzer.analyze(pdf_content, role)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 2. JOB SEARCH ---
@app.route('/find-jobs', methods=['POST'])
def find_jobs():
    data = request.json
    role = data.get('role', 'Developer')
    location = "India"
    query_text = f"{role} in {location}"

    url = "https://jsearch.p.rapidapi.com/search"
    querystring = {"query": query_text, "page": "1", "num_pages": "1"}
    headers = {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    try:
        response = requests.get(url, headers=headers, params=querystring)
        data = response.json()
        if "data" not in data:
            return jsonify({"jobs": []})

        clean_jobs = []
        for job in data['data'][:6]: 
            clean_jobs.append({
                "title": job.get('job_title', 'Role Unavailable'),
                "company": job.get('employer_name', 'Company Confidential'),
                "location": job.get('job_city', 'Remote') or 'India',
                "link": job.get('job_google_link', '#'),
                "logo": job.get('employer_logo')
            })
        return jsonify({"jobs": clean_jobs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 3. CHATBOT (Using Direct API Call) ---
@app.route('/chat', methods=['POST'])
def chat_with_ai():
    data = request.json
    user_msg = data.get('message', '')
    resume_context = data.get('context') or "No resume provided."
    role = data.get('role', 'Developer')

    # --- UPDATED PROMPT LOGIC ---
    full_prompt = f"""
    You are a friendly, encouraging Career Coach.
    User Role: {role}
    Resume Summary: "{resume_context[:2000]}..."

    User Question: {user_msg}

    Instructions:
    1. If the user sends a single technical keyword (e.g., "Python", "React", "Leadership"), assume they want a **4-Week Learning Roadmap** for it.
    2. If asked for a roadmap, provide a strict 4-week plan with bullet points (Week 1 to Week 4).
    3. Keep other answers to 3-4 sentences max.
    4. Be polite and use emojis like 🚀, 🗺️, 💡.
    """

    # Call the helper function defined above
    ai_reply = call_gemini(full_prompt)

    return jsonify({"reply": ai_reply})

if __name__ == '__main__':
    print("🚀 Backend running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)