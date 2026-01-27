import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const ResultDashboard = ({ results, onReset }) => {
  // 🛡️ SAFETY CHECK: If data is missing, use defaults to prevent crashes
  const score = results?.score || 0;
  const foundSkills = results?.found_skills || []; // <--- This fixes the "length" error
  const missingSkills = results?.missing_skills || [];
  const role = results?.role || "Unknown Role";
  const aiInsight = results?.ai_insight || null;

  const data = [
    { name: 'Matched', value: score },
    { name: 'Missing', value: 100 - score },
  ];
  
  const COLORS = ['#2563eb', '#e5e7eb'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      
      {/* 🚀 AI INSIGHT BLOCK */}
      {aiInsight && (
        <div className="p-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg text-white flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div>
            <h4 className="font-bold text-lg mb-1">AI Career Discovery</h4>
            <p className="opacity-90">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* SCORE SECTION */}
      <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col items-center relative">
           <div className="h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270}>
                  {data.map((entry, index) => <Cell key={index} fill={COLORS[index]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
           </div>
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-bold text-blue-600">{score}%</span>
              <span className="text-xs text-gray-500 font-bold uppercase">Match</span>
           </div>
        </div>

        <div className="mt-6 md:mt-0 md:ml-10 text-center md:text-left flex-1">
          <h2 className="text-3xl font-bold text-gray-800">Analysis Complete</h2>
          <p className="text-gray-600 mt-2">
            You matched <span className="font-bold text-green-600">{foundSkills.length} skills</span> required for a 
            <span className="font-bold text-blue-600"> {role}</span>.
          </p>
          <button onClick={onReset} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
            Upload Another Resume
          </button>
        </div>
      </div>

      {/* SKILL GAPS SECTION */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* MATCHED SKILLS */}
        <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-green-500">
          <h3 className="text-xl font-bold text-gray-800 mb-4">✅ Your Strengths</h3>
          <div className="flex flex-wrap gap-2">
            {foundSkills.length > 0 ? (
              foundSkills.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))
            ) : <p className="text-gray-400 italic">No matches found.</p>}
          </div>
        </div>

        {/* MISSING SKILLS (With Links) */}
        <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-red-500">
          <h3 className="text-xl font-bold text-gray-800 mb-4">⚠️ Recommended Upskilling</h3>
          <div className="space-y-3">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-lg group hover:bg-red-100 transition">
                  <span className="font-medium text-gray-700">{skill.name}</span>
                  <a 
                    href={skill.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white text-blue-600 text-xs font-bold rounded shadow-sm hover:text-blue-800 flex items-center gap-1"
                  >
                    LEARN ↗
                  </a>
                </div>
              ))
            ) : <p className="text-green-600 font-medium">🎉 Perfect Match!</p>}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default ResultDashboard;