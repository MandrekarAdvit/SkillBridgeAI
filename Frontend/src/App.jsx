import React, { useState } from 'react';
import axios from 'axios';

// --- COMPONENTS ---
import Dropzone from './components/Dropzone';
import ResultDashboard from './components/ResultDashboard';
import ChatBot from './components/ChatBot';

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [role, setRole] = useState("Frontend Developer");

  const onUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', role);

    try {
      const { data } = await axios.post('http://localhost:5000/analyze', formData);
      
      if (data.error) {
        alert("Backend Error: " + data.error);
        setResults(null); 
      } else {
        // ✅ CRITICAL FIX IS HERE:
        // We combine the backend data with the 'role' state.
        // ResultDashboard needs this 'role' string to fetch the right jobs.
        setResults({ ...data, role: role }); 
      }
      
    } catch (err) {
      console.error(err);
      alert("Network Error: Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Added bg-slate-900 to ensure the background is dark
    <div className="min-h-screen relative bg-slate-900 font-sans"> 
      
      {/* STATIC INTERACTIVE HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">S</div>
            <span className="font-bold text-xl tracking-tight text-white">SkillBridge<span className="text-blue-500">AI</span></span>
          </div>
          <div className="text-xs font-semibold text-blue-400 bg-blue-950/40 border border-blue-900/50 px-3 py-1 rounded-full">
             Hackathon Build v1.0
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-5xl mx-auto px-6">
        {!results ? (
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                Close the gap to your <span className="text-blue-500 underline decoration-blue-800 underline-offset-8">dream job</span>.
              </h1>
              <p className="text-lg text-slate-400 max-w-lg mx-auto">
                Upload your resume and select your target role. Our AI engine will analyze your skills and recommend learning paths.
              </p>
            </div>

            <div className="glass rounded-[32px] p-8 shadow-2xl bg-white/5 border border-white/10">
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Target Role
                </label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-900/50 border border-white/10 focus:border-blue-500 rounded-xl p-4 text-lg font-medium outline-none transition-all cursor-pointer text-white appearance-none"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="AI Engineer">AI Engineer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="Mobile Developer">Mobile Developer</option>
                  </select>
                   {/* Custom Arrow */}
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>
              <Dropzone onUpload={onUpload} loading={loading} />
            </div>
          </div>
        ) : (
          <ResultDashboard results={results} onReset={() => setResults(null)} />
        )}
      </main>

      {/* --- CHATBOT INTEGRATION --- */}
      {results && (
        <ChatBot 
            resumeText={results.raw_text} 
            targetRole={role} 
        />
      )}

    </div>
  );
}

export default App;