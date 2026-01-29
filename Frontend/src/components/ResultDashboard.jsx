import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios'; // <--- Don't forget this import!

const ResultDashboard = ({ results, onReset }) => {
  const score = results?.score || 0;
  const foundSkills = results?.found_skills || []; 
  const missingSkills = results?.missing_skills || [];
  const role = results?.role || "Developer"; // Default fallback
  const aiInsight = results?.ai_insight || null;

  // --- NEW: Job State ---
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // --- NEW: Fetch Jobs Automatically ---
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const res = await axios.post('http://localhost:5000/find-jobs', {
          role: role 
        });
        setJobs(res.data.jobs || []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    };

    if (role) {
      fetchJobs();
    }
  }, [role]);

  const data = [
    { name: 'Matched', value: score },
    { name: 'Missing', value: 100 - score },
  ];
  
  const COLORS = ['#2563eb', '#1e293b'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      
      {/* 1. AI INSIGHT HEADER */}
      {aiInsight && (
        <div className="p-6 bg-blue-900/20 border border-blue-500/20 rounded-2xl text-white flex items-start gap-4">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-bold text-lg mb-1">AI Career Discovery</h4>
            <p className="text-slate-300 leading-relaxed">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* 2. MAIN SCORE CARD */}
      <div className="glass p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between shadow-2xl">
        <div className="flex flex-col items-center relative">
           <div className="h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                  {data.map((entry, index) => <Cell key={index} fill={COLORS[index]} cornerRadius={8} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
           </div>
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-bold text-white">{score}%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Match</span>
           </div>
        </div>

        <div className="mt-6 md:mt-0 md:ml-10 text-center md:text-left flex-1">
          <h2 className="text-3xl font-bold text-white tracking-tight">Analysis Complete</h2>
          <p className="text-slate-400 mt-2">
            You matched <span className="font-bold text-blue-400">{foundSkills.length} skills</span> required for a 
            <span className="font-bold text-white"> {role}</span>.
          </p>
          <button onClick={onReset} className="mt-6 px-6 py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition text-sm uppercase">
            Upload Another Resume
          </button>
        </div>
      </div>

      {/* 3. SKILLS GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* ORANGE STRENGTH SECTION */}
        <div className="glass p-6 rounded-[24px] border-l-4 border-orange-500 shadow-lg">
          <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
             Your Strengths
          </h3>
          <div className="flex flex-wrap gap-2">
            {foundSkills.length > 0 ? (
              foundSkills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-orange-950/30 text-orange-400 border border-orange-900/50 rounded-full text-xs font-bold uppercase tracking-wider">
                  {skill}
                </span>
              ))
            ) : <p className="text-slate-500 italic">No matches found.</p>}
          </div>
        </div>

        {/* GREEN GROWTH SECTION */}
        <div className="glass p-6 rounded-[24px] border-l-4 border-emerald-500 shadow-lg">
          <h3 className="text-xl font-bold text-emerald-400 mb-4">
             Recommended Upskilling
          </h3>
          <div className="space-y-3">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, idx) => {
                // Handle both object {name, link} and simple string formats
                const skillName = typeof skill === 'object' ? skill.name : skill;
                const skillLink = typeof skill === 'object' ? skill.link : `https://www.google.com/search?q=learn+${skill}`;
                
                return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg group hover:border-emerald-500/50 transition">
                    <span className="font-medium text-slate-200">{skillName}</span>
                    <a 
                      href={skillLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded shadow-sm hover:bg-emerald-600 transition"
                    >
                      LEARN ↗
                    </a>
                  </div>
                );
              })
            ) : <p className="text-emerald-400 font-medium font-bold">Perfect Match!</p>}
          </div>
        </div>
      </div>

      {/* 4. NEW: JOB RECOMMENDATION SECTION */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
           🚀 Recommended Jobs 
           {loadingJobs && <span className="text-sm font-normal text-slate-500 animate-pulse">(Searching live...)</span>}
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {loadingJobs ? (
            // Loading Skeletons
            [1, 2].map((n) => (
              <div key={n} className="bg-white/5 h-32 rounded-2xl animate-pulse border border-white/10"></div>
            ))
          ) : jobs.length > 0 ? (
            jobs.map((job, idx) => (
              <a 
                key={idx} 
                href={job.link} 
                target="_blank" 
                rel="noreferrer"
                className="glass p-5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 flex items-start gap-4 hover:-translate-y-1 group"
              >
                 {/* Logo Placeholder */}
                 <div className="w-12 h-12 rounded-lg bg-white/90 flex items-center justify-center overflow-hidden">
                    {job.logo ? <img src={job.logo} alt="logo" className="w-8 h-8 object-contain" /> : <span className="text-xl">💼</span>}
                 </div>
                 
                 <div className="flex-1">
                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{job.title}</h4>
                    <p className="text-sm text-slate-400 mb-2">{job.company} • {job.location}</p>
                    <span className="text-[10px] font-bold text-blue-900 bg-blue-400 px-2 py-1 rounded">APPLY NOW ↗</span>
                 </div>
              </a>
            ))
          ) : (
            <div className="col-span-2 text-center text-slate-500 py-10 bg-white/5 rounded-2xl border border-white/10">
              No live jobs found right now. Try a different role!
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
};

export default ResultDashboard;