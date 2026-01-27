import spacy
from pdfminer.high_level import extract_text
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import io

# Load small English model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading language model...")
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# --- DATABASE: Skills to look for ---
ROLE_SKILLS = {
    "Frontend Developer": ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind", "Redux", "Vite", "Git", "Figma", "Next.js", "Angular JS"],
    "Backend Developer": ["C","C++","Python", "Java", "Node.js", "Django", "Flask", "Docker", "SQL", "PostgreSQL", "MongoDB", "AWS", "API"],
    "Data Scientist": ["Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "TensorFlow", "PyTorch", "Matplotlib", "Statistics", "Jupyter", "Machine Learning"],
    "AI Engineer": ["Python", "PyTorch", "TensorFlow", "Deep Learning", "NLP", "Transformers", "Computer Vision", "GANs", "OpenCV", "LangChain", "LLM", "Bert"],
    "DevOps Engineer": ["AWS", "Azure", "Docker", "Kubernetes", "Jenkins", "CI/CD", "Linux", "Terraform", "Git", "Bash"],
    "Mobile Developer": ["Java", "Kotlin", "Swift", "Flutter", "React Native", "Firebase", "Android Studio", "iOS"]
}

# --- DATABASE: Learning Links ---
RESOURCES = {
    "React": "https://react.dev/learn",
    "JavaScript": "https://javascript.info/",
    "TypeScript": "https://www.typescriptlang.org/docs/",
    "HTML": "https://developer.mozilla.org/en-US/docs/Web/HTML",
    "CSS": "https://developer.mozilla.org/en-US/docs/Web/CSS",
    "Tailwind": "https://tailwindcss.com/docs",
    "Redux": "https://redux.js.org/introduction/getting-started",
    "Vite": "https://vitejs.dev/guide/",
    "Git": "https://www.atlassian.com/git/tutorials",
    "Figma": "https://www.youtube.com/watch?v=jwKhePdKHfk",
    "Python": "https://www.python.org/about/gettingstarted/",
    "Java": "https://www.codecademy.com/learn/learn-java",
    "Node.js": "https://nodejs.org/en/docs/",
    "Django": "https://www.djangoproject.com/start/",
    "Flask": "https://flask.palletsprojects.com/",
    "Docker": "https://www.docker.com/101-tutorial/",
    "SQL": "https://www.w3schools.com/sql/",
    "PostgreSQL": "https://www.postgresqltutorial.com/",
    "MongoDB": "https://www.mongodb.com/basics",
    "AWS": "https://aws.amazon.com/getting-started/",
    "Azure": "https://learn.microsoft.com/en-us/training/azure/",
    "Pandas": "https://pandas.pydata.org/docs/getting_started/index.html",
    "NumPy": "https://numpy.org/learn/",
    "Scikit-Learn": "https://scikit-learn.org/stable/tutorial/index.html",
    "TensorFlow": "https://www.tensorflow.org/learn",
    "PyTorch": "https://pytorch.org/tutorials/",
    "Deep Learning": "https://www.coursera.org/specializations/deep-learning",
    "NLP": "https://www.coursera.org/learn/nlp-sequence-models",
    "Transformers": "https://huggingface.co/docs/transformers/index",
    "Computer Vision": "https://opencv.org/",
    "GANs": "https://developers.google.com/machine-learning/gan",
    "Kubernetes": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
    "CI/CD": "https://www.gitlab.com/topics/ci-cd/",
    "Terraform": "https://developer.hashicorp.com/terraform/tutorials",
    "Flutter": "https://flutter.dev/learn",
    "React Native": "https://reactnative.dev/docs/getting-started",
    "Kotlin": "https://kotlinlang.org/docs/home.html",
    "Swift": "https://developer.apple.com/swift/resources/"
}

class SkillAnalyzer:
    def __init__(self):
        # 🧠 SUPER SMART INFERENCE
        # "If you know X, you definitely know Y."
        self.IMPLIED_SKILLS = {
            # Frontend Logic
            "React": ["JavaScript", "HTML", "CSS", "Vite"],
            "Next.js": ["React", "JavaScript", "HTML", "CSS"],
            
            # Backend Logic
            "Django": ["Python", "SQL"],
            "Flask": ["Python", "SQL"],
            
            # Data Science Logic
            "Scikit-Learn": ["Python", "Pandas", "NumPy", "Matplotlib", "Statistics"],
            "Machine Learning": ["Python", "Pandas", "NumPy", "Scikit-Learn"],
            "Deep Learning": ["Python", "TensorFlow", "PyTorch", "NumPy"],
            "Python": ["Pandas", "NumPy","Matplotlib"],
            
            # AI Engineer Logic (UPDATED)
            "PyTorch": ["Python", "Deep Learning", "NumPy"],
            "TensorFlow": ["Python", "Deep Learning", "NumPy"],
            "Transformers": ["Deep Learning", "NLP", "Python", "Bert", "LLM"], 
            "Bert": ["Transformers", "NLP", "Deep Learning"],
            "LLM": ["Transformers", "NLP", "Deep Learning"],
            "GANs": ["Deep Learning", "Computer Vision", "Python"],
            
            # Environment Logic
            "Jupyter Notebook": ["Jupyter", "Python"],
            "Google Colab": ["Jupyter", "Python"]
        }

    def extract_text_from_pdf(self, file_stream):
        try:
            if isinstance(file_stream, bytes):
                file_stream = io.BytesIO(file_stream)
            text = extract_text(file_stream)
            return text
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return ""

    def calculate_vector_score(self, resume_text, role_skills):
        job_desc = " ".join(role_skills * 2) 
        documents = [resume_text, job_desc]
        tfidf = TfidfVectorizer(stop_words='english')
        try:
            matrix = tfidf.fit_transform(documents)
            similarity = cosine_similarity(matrix[0:1], matrix[1:2])
            return int(similarity[0][0] * 100)
        except:
            return 0

    def analyze(self, file_stream, target_role):
        text = self.extract_text_from_pdf(file_stream)
        if not text:
            return {"error": "Could not read PDF content."}

        # 1. ROBUST EXTRACTION (Fixes "GANs PyTorch" sticking together)
        text_lower = text.lower()
        found_skills = set()
        
        # Scan for every possible skill in our database
        all_skills = set([s for role in ROLE_SKILLS.values() for s in role])
        
        for skill in all_skills:
            # Flexible Match: " jupyter " OR "jupyter," OR "jupyter\n"
            if skill.lower() in text_lower:
                found_skills.add(skill)

        # 2. APPLY INFERENCE (The Magic Step)
        # We use a loop to handle chains (A -> B -> C)
        for _ in range(2): 
            current_skills = list(found_skills)
            for found in current_skills:
                if found in self.IMPLIED_SKILLS:
                    implied_list = self.IMPLIED_SKILLS[found]
                    for implied in implied_list:
                        found_skills.add(implied)

        # Normalize to Title Case
        found_skills_clean = {s.title() if s.lower() not in ["sql", "html", "css", "api", "llm", "nlp", "aws"] else s.upper() for s in found_skills}
        
        # 3. Gap Analysis
        required_skills = ROLE_SKILLS.get(target_role, [])
        matched_skills = [s for s in required_skills if s.upper() in [f.upper() for f in found_skills_clean]]
        missing_skills_list = [s for s in required_skills if s.upper() not in [f.upper() for f in found_skills_clean]]

        # 4. Scoring Logic
        if required_skills:
            score = self.calculate_vector_score(text, required_skills)
            keyword_coverage = int((len(matched_skills) / len(required_skills)) * 100)
            
            # Boost score significantly if inference filled the gaps
            final_score = (score + (keyword_coverage * 1.5)) / 2.5
            final_score = min(int(final_score * 100) // 100, 99) 
        else:
            final_score = 0

        # AI Pivot Logic
        best_fit_role = None
        best_fit_score = -1
        for role_key, role_data in ROLE_SKILLS.items():
            s = self.calculate_vector_score(text, role_data)
            if s > best_fit_score:
                best_fit_score = s
                best_fit_role = role_key
        
        pivot_msg = None
        if best_fit_role and best_fit_role != target_role and best_fit_score > 45:
             pivot_msg = f"Your resume is actually a stronger match ({best_fit_score}%) for {best_fit_role}. Consider pivoting!"

        # Recommendations
        recommendations = []
        for skill in missing_skills_list:
            link = RESOURCES.get(skill, f"https://www.youtube.com/results?search_query=learn+{skill}+tutorial")
            recommendations.append({"name": skill, "link": link})
        
        return {
            "role": target_role,
            "score": int(final_score),
            "found_skills": matched_skills,
            "missing_skills": recommendations,
            "ai_insight": pivot_msg
        }