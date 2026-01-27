import React, { useState } from 'react';

const Dropzone = ({ onUpload, loading }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`relative group border-2 border-dashed rounded-2xl p-12 transition-all duration-300 text-center
        ${isDragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-blue-400'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {loading ? (
        <div className="flex flex-col items-center py-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-blue-600 font-medium animate-pulse">Processing Resume with NLP...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-blue-100 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800">Upload your Resume</h3>
          <p className="text-slate-500 mt-2 mb-6">Drag and drop your PDF here, or click to browse</p>
          
          <input 
            type="file" 
            id="resume-upload" 
            className="hidden" 
            accept=".pdf"
            onChange={(e) => onUpload(e.target.files[0])}
          />
          <label 
            htmlFor="resume-upload"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 cursor-pointer shadow-lg shadow-blue-200 transition-all"
          >
            Select PDF
          </label>
        </>
      )}
    </div>
  );
};

export default Dropzone;