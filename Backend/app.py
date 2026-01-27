from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_engine import SkillAnalyzer
import os
import requests  # <--- New Import for API calls

app = Flask(__name__)
CORS(app) 
analyzer = SkillAnalyzer()

# --- 1. EXISTING ROUTE: Resume Analysis ---
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
        print(f"❌ Server Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# --- 2. NEW ROUTE: Job Recommendations (JSearch) ---
@app.route('/find-jobs', methods=['POST'])
def find_jobs():
    data = request.json
    role = data.get('role', 'Developer')
    
    # 🌍 Default to India for better local results
    location = "India" 
    
    # Construct the search query (e.g., "Python Developer in India")
    query_text = f"{role} in {location}"

    url = "https://jsearch.p.rapidapi.com/search"

    querystring = {
        "query": query_text,
        "page": "1",
        "num_pages": "1"
    }

    # 🔑 REPLACE THIS WITH YOUR ACTUAL RAPIDAPI KEY
    headers = {
        "X-RapidAPI-Key": "1ce074e645msh391a641d555aa10p10ffcejsn440586942bef", 
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    try:
        response = requests.get(url, headers=headers, params=querystring)
        data = response.json()
        
        # Check if the API returned valid data
        if "data" not in data:
            return jsonify({"jobs": []}) # Return empty list if no jobs found

        raw_jobs = data['data']
        clean_jobs = []

        # Extract only the Top 6 jobs to show
        for job in raw_jobs[:6]: 
            clean_jobs.append({
                "title": job.get('job_title', 'Role Unavailable'),
                "company": job.get('employer_name', 'Company Confidential'),
                "location": job.get('job_city', 'Remote') or 'India',
                "link": job.get('job_google_link', '#'),
                "logo": job.get('employer_logo') # Might be None, handled in frontend
            })
            
        return jsonify({"jobs": clean_jobs})

    except Exception as e:
        print(f"❌ Job Search Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Backend running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)