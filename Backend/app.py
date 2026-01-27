from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_engine import SkillAnalyzer
import os

app = Flask(__name__)
CORS(app) # Allow frontend to talk to backend
analyzer = SkillAnalyzer()

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
        # 🔍 ADDED: Print error to terminal so you can see it!
        print(f"❌ Server Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Backend running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)