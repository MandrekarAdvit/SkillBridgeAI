import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatBot = ({ resumeText, targetRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Initial Message
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: `Hi there! 👋 I'm your AI Career Coach. I've analyzed your resume for the **${targetRole}** role. How can I help you today?` 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(true); 
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, loading, showOptions]);

  // --- OPTIONS MENU ---
  const options = [
    { label: "Resume Analysis", prompt: "Please analyze my resume and give me constructive feedback." },
    { label: "Career Pivot Advice", prompt: "I want to pivot to this role. What steps should I take?" },
    { label: "Generate Skill Roadmap", action: "ask_roadmap" }, 
    { label: "Ask a specific question...", isInputTrigger: true } 
  ];

  // --- HANDLER ---
  const handleOptionClick = async (input) => {
    // 1. Determine input type
    const isOptionObj = typeof input === 'object';
    const textToSend = isOptionObj ? input.prompt : input;

    // CASE A: Trigger Input Box
    if (isOptionObj && input.isInputTrigger) {
        setShowOptions(false); 
        return;
    }

    // CASE B: Roadmap Interaction Flow
    if (isOptionObj && input.action === 'ask_roadmap') {
        setShowOptions(false);
        setMessages(prev => [...prev, { sender: 'user', text: "I want to generate a skill roadmap." }]);
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            setMessages(prev => [...prev, { 
                sender: 'ai', 
                text: "That sounds exciting! 🚀 **Which specific skill** do you want to learn? (e.g., Python, System Design, Leadership)" 
            }]);
        }, 800);
        return; 
    }

    // CASE C: Standard Request
    setShowOptions(false);
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/chat', {
        message: textToSend,
        context: resumeText || "No resume uploaded yet.",
        role: targetRole || "General"
      });
      
      // --- LOGIC: Handle JSON Roadmap vs Plain Text ---
      let aiResponseText = "";

      // Check if backend returned structured JSON (for Roadmap)
      if (res.data.type === 'json' && Array.isArray(res.data.data)) {
          aiResponseText = "### 🗺️ Your 4-Week Roadmap:\n\n";
          res.data.data.forEach(week => {
              aiResponseText += `**${week.week}: ${week.topic}**\n* ${week.details}\n\n`;
          });
      } else {
          // Standard Text Response
          aiResponseText = res.data.reply || "I couldn't generate a response.";
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
      
      // Show Options again after a delay
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'ai', text: "Is there anything else I can help you with? 😊" }]);
        setShowOptions(true);
      }, 1000);

    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Oops! I couldn't connect to the server. Please try again." }]);
      setShowOptions(true);
    }
    setLoading(false);
  };

  const endChat = () => {
    setMessages(prev => [...prev, { sender: 'user', text: "No, I'm done. Thank you!" }]);
    setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'ai', text: "You're welcome! Best of luck with your job search! 🚀" }]);
        setShowOptions(false);
        setTimeout(() => setIsOpen(false), 3000);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-4 animate-fade-in-up">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white font-bold flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
                <span className="text-xl"></span>
                <div>
                    <h3 className="text-sm font-bold">SkillBridge Coach</h3>
                    <p className="text-xs text-blue-100 font-normal">Online • AI Assistant</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition">✕</button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                }`}>
                  {/* --- PARSING LOGIC HERE --- */}
                  <div className="markdown-content">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Style lists to look neat
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 mt-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 mt-1" {...props} />,
                            // Make links blue and distinct
                            a: ({node, ...props}) => <a className="text-blue-200 hover:text-white underline font-bold" target="_blank" rel="noopener noreferrer" {...props} />,
                            // Bold text
                            strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                            // Headers
                            h3: ({node, ...props}) => <h3 className="font-bold text-base mt-2 mb-1 border-b pb-1" {...props} />
                        }}
                    >
                        {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </div>
                </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Action Buttons / Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            {showOptions ? (
                <div className="grid gap-2">
                    {options.map((opt, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleOptionClick(opt)}
                            className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-sm font-medium text-slate-700 hover:text-blue-700 transition-all active:scale-95 flex items-center justify-between group"
                        >
                            {opt.label}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">➤</span>
                        </button>
                    ))}
                    <button 
                        onClick={endChat}
                        className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-red-500 mt-2 transition-colors"
                    >
                        No, I'm done. Thanks!
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        placeholder="Type here..."
                        autoFocus
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleOptionClick(e.target.value); 
                                e.target.value = '';
                            }
                        }}
                    />
                    <button onClick={() => setShowOptions(true)} className="text-xs text-blue-600 font-bold px-2">Menu</button>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl shadow-blue-600/30 transition-transform hover:scale-110 flex items-center justify-center w-16 h-16 relative group"
      >
        {isOpen ? (
            <span className="text-2xl font-bold">✕</span>
        ) : (
            <>
                <span className="text-3xl">💬</span>
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
            </>
        )}
      </button>
    </div>
  );
};

export default ChatBot;