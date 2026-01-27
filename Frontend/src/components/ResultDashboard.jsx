import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

const ResultDashboard = ({ results, onReset }) => {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // 1. Auto-Fetch Jobs when results load
  useEffect(() => {
    const fetchJobs = async () => {
      if (!results) return;
      setLoadingJobs(true);
      try {
        const { data } = await axios.post('http://localhost:5000/find-jobs', { 
            role: results.role 
        });
        setJobs(data.jobs || []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [results]);

  if (!results) return null;

  // Chart Data Config (Same as before)
  const doughnutData = {
    labels: ['Match', 'Missing'],
    datasets: [{
      data: [results.score, 100 - results.score],
      backgroundColor: ['#3B82F6', '#E2E8F0'],
      borderWidth: 0,
    }],
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32">
            <Doughnut data={doughnutData} options={{ cutout: '75%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-blue-600">{results.score}%</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Match</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Analysis Complete</h2>
            <p className="text-slate-500 mt-1">
              You matched <strong className="text-green-600">{results.found_skills.length} skills</strong> required for a <strong className="text-blue-600">{results.role}</strong>.
            </p>
            {results.ai_insight && (
                <div className="mt-3 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-100 flex items-center gap-2">
                    ✨ AI Insight: {results.ai_insight}
                </div>
            )}
          </div>
        </div>
        <button onClick={onReset} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95">
          Upload Another Resume
        </button>
      </div>

      {/* 2. SKILLS GRID */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Strengths */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-green-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            ✅ Your Strengths
          </h3>
          <div className="flex flex-wrap gap-2">
            {results.found_skills.length > 0 ? (
              results.found_skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-semibold">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-slate-400 italic">No direct matches found yet.</p>
            )}
          </div>
        </div>

        {/* Right: Weaknesses */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-red-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            ⚠️ Recommended Upskilling
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {results.missing_skills.length > 0 ? (
              results.missing_skills.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl border border-red-100 hover:bg-red-50 transition group">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50">
                    LEARN ↗
                  </a>
                </div>
              ))
            ) : (
              <p className="text-green-600 font-medium">🎉 Amazing! You have all the core skills.</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. NEW JOB RECOMMENDATIONS SECTION */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
           🚀 Recommended Jobs for You
           {loadingJobs && <span className="text-sm font-normal text-slate-400 animate-pulse">(Searching live...)</span>}
        </h3>
        
        {loadingJobs ? (
           // Loading Skeleton
           <div className="grid md:grid-cols-2 gap-4">
              {[1,2,3,4].map(n => (
                 <div key={n} className="h-24 bg-slate-200 rounded-xl animate-pulse"></div>
              ))}
           </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {jobs.length > 0 ? (
                jobs.map((job, idx) => (
                <a key={idx} href={job.link} target="_blank" rel="noreferrer" 
                    className="block p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex items-center gap-4 group">
                    
                    {/* Company Logo / Placeholder */}
                    <div className="w-12 h-12 flex-shrink-0 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden">
                        {job.logo ? (
                            <img src={job.logo} alt="logo" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-xl">🏢</span>
                        )}
                    </div>

                    {/* Job Details */}
                    <div>
                        <h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{job.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span className="font-medium text-slate-700">{job.company}</span>
                            <span>•</span>
                            <span>📍 {job.location}</span>
                        </div>
                    </div>
                </a>
                ))
            ) : (
                <div className="col-span-2 text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No active job listings found for this role right now.
                </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default ResultDashboard;