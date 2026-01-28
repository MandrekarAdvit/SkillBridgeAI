import React, { useState } from 'react';
import axios from 'axios';
import Dropzone from './components/Dropzone';
import ResultDashboard from './components/ResultDashboard';
import ChatBot from './components/ChatBot'; // <--- 1. Import ChatBot

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
      
      // 🛡️ SAFETY CHECK: Did the backend return an error?
      if (data.error) {
        alert("Backend Error: " + data.error);
        setResults(null); 
      } else {
        setResults(data); 
      }
      
    } catch (err) {
      console.error(err);
      alert("Network Error: Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 relative"> {/* Added relative for positioning */}
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 mb-12 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">S</div>
            <span className="font-bold text-xl tracking-tight text-slate-800">SkillBridge<span className="text-blue-600">AI</span></span>
          </div>
          <div className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
             Hackathon Build v1.0
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6">
        {!results ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
                Close the gap to your <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">dream job</span>.
              </h1>
              <p className="text-lg text-slate-500 max-w-lg mx-auto">
                Upload your resume and select your target role. Our AI engine will analyze your skills and recommend learning paths.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Target Role
                </label>
                <select 
                  className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 rounded-xl p-4 text-lg font-medium outline-none transition-all cursor-pointer hover:bg-slate-100"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="AI Engineer">AI Engineer 🤖</option>
                  <option value="DevOps Engineer">DevOps Engineer ☁️</option>
                  <option value="Mobile Developer">Mobile Developer 📱</option>
                </select>
              </div>

              <Dropzone onUpload={onUpload} loading={loading} />
            </div>
          </div>
        ) : (
          <ResultDashboard results={results} onReset={() => setResults(null)} />
        )}
      </main>

      {/* 2. CHATBOT INTEGRATION */}
      {/* Only show the chatbot when results exist (i.e., resume is analyzed) */}
      {results && (
        <ChatBot 
            resumeText={results.raw_text} 
            targetRole={results.role} 
        />
      )}

    </div>
  );
}

export default App;