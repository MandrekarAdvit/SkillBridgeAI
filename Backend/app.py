from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_engine import SkillAnalyzer
import os
import requests
from dotenv import load_dotenv # <--- IMPORTS DOTENV

# 1. Load the secret keys from the .env file
load_dotenv()

app = Flask(__name__)
CORS(app)
analyzer = SkillAnalyzer()

# 2. FETCH KEYS SECURELY (Do not paste actual keys here!)
RAPID_API_KEY = os.getenv("RAPID_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Safety Check
if not GEMINI_API_KEY:
    print("❌ ERROR: Gemini Key not found! Make sure you created the .env file.")
else:
    print("✅ Gemini Key loaded successfully.")

# --- HELPER: Call Gemini ---
def call_gemini(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            return f"Error from Google: {response.text}"
            
        data = response.json()
        
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

# --- 3. CHATBOT ---
@app.route('/chat', methods=['POST'])
def chat_with_ai():
    data = request.json
    user_msg = data.get('message', '')
    resume_context = data.get('context') or "No resume provided."
    role = data.get('role', 'Developer')

    # --- PROMPT LOGIC ---
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
    
    ai_reply = call_gemini(full_prompt)

    return jsonify({"reply": ai_reply})

if __name__ == '__main__':
    print("🚀 Backend running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)