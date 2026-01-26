import spacy
from spacy.matcher import PhraseMatcher
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
    "Frontend Developer": ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind", "Redux", "Vite", "Git", "Figma"],
    "Backend Developer": ["Python", "Flask", "Django", "Node.js", "Docker", "Redis", "API", "SQL", "PostgreSQL", "AWS"],
    "Data Scientist": ["Python", "Pandas", "NumPy", "Scikit-Learn", "Machine Learning", "SQL", "Statistics", "TensorFlow", "Jupyter"]
}

# --- DATABASE: Learning Links ---
RESOURCES = {
    "React": "https://react.dev/learn",
    "TypeScript": "https://www.typescriptlang.org/docs/",
    "Docker": "https://www.docker.com/101-tutorial/",
    "Flask": "https://flask.palletsprojects.com/",
    "Tailwind": "https://tailwindcss.com/docs/installation",
    "PostgreSQL": "https://www.postgresqltutorial.com/",
    "Machine Learning": "https://www.coursera.org/learn/machine-learning",
    "Redux": "https://redux.js.org/introduction/getting-started",
    "Vite": "https://vitejs.dev/guide/",
    "Git": "https://www.atlassian.com/git/tutorials",
    "Figma": "https://www.youtube.com/watch?v=jwKhePdKHfk"
}

class SkillAnalyzer:
    def __init__(self):
        self.matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
        
        # Create patterns for ALL skills across all roles
        all_possible_skills = set([skill for skills in ROLE_SKILLS.values() for skill in skills])
        patterns = [nlp.make_doc(text) for text in all_possible_skills]
        
        self.matcher.add("SKILL_LIST", patterns)

    def extract_text_from_pdf(self, file_stream):
        """Extracts raw text from a PDF file stream (in-memory)."""
        try:
            text = extract_text(file_stream)
            return text
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return ""

    def calculate_vector_score(self, resume_text, role_skills):
        """
        AI LOGIC: Uses TF-IDF and Cosine Similarity to calculate a 
        semantic match score (0-100) instead of simple keyword counting.
        """
        # 1. Create a synthetic "Job Description" from the required skills
        # We repeat skills to give them weight in the vector space
        job_desc = " ".join(role_skills * 2) 
        
        # 2. Create the document corpus
        documents = [resume_text, job_desc]
        
        # 3. Convert text to Vectors (Numbers)
        # stop_words='english' removes common words like "the", "and"
        tfidf = TfidfVectorizer(stop_words='english')
        try:
            matrix = tfidf.fit_transform(documents)
            
            # 4. Calculate Cosine Similarity (The Angle between vectors)
            # matrix[0] is resume, matrix[1] is job description
            similarity = cosine_similarity(matrix[0:1], matrix[1:2])
            
            # Return percentage (e.g., 0.75 -> 75)
            return int(similarity[0][0] * 100)
        except:
            # Fallback if text is too short or empty
            return 0

    def analyze(self, file_stream, target_role):
        # 1. Get Text
        text = self.extract_text_from_pdf(file_stream)
        if not text:
            return {"error": "Could not read PDF content"}

        doc = nlp(text)
        
        # 2. Phrase Matching (Keyword Extraction)
        matches = self.matcher(doc)
        found_skills = set([doc[start:end].text for _, start, end in matches])
        
        # Normalize to Title Case
        found_skills_clean = {s.title() for s in found_skills}
        
        # 3. Gap Analysis
        required_skills = ROLE_SKILLS.get(target_role, [])
        matched_skills = [s for s in required_skills if s in found_skills_clean]
        missing_skills_list = [s for s in required_skills if s not in found_skills_clean]
        
        # 4. SCORING (UPDATED with AI Vector Logic)
        if required_skills:
            # Use the new Vector function
            score = self.calculate_vector_score(text, required_skills)
            
            # Optional: Boost score slightly if they have many exact keyword matches
            # This makes the score feel more "fair" to the user
            keyword_coverage = int((len(matched_skills) / len(required_skills)) * 100)
            final_score = (score + keyword_coverage) // 2
        else:
            final_score = 0
            
        # 5. Build Recommendations
        recommendations = []
        for skill in missing_skills_list:
            link = RESOURCES.get(skill, f"https://www.youtube.com/results?search_query=learn+{skill}+tutorial")
            recommendations.append({"name": skill, "link": link})
        
        return {
            "role": target_role,
            "score": final_score,
            "found_skills": matched_skills,
            "missing_skills": recommendations
        }