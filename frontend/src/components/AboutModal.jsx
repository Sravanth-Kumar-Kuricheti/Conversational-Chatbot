import React from 'react';
import { X, Zap, Database, Terminal, Shield } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function AboutModal() {
  const { aboutOpen, setAboutOpen } = useChat();

  if (!aboutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-[#212121] border border-[#3E3E3E] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with ☪︎ symbol */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#333333]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#10A37F] flex items-center justify-center text-white text-[16px] font-bold select-none leading-none">
              ☪︎
            </div>
            <h2 className="text-[17px] font-semibold text-white">About Esmeray AI</h2>
          </div>
          <button
            onClick={() => setAboutOpen(false)}
            className="text-[#8E8EA0] hover:text-white p-1 rounded-lg hover:bg-[#2A2A2A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-[13.5px] text-[#ECECEC]">
          <p className="leading-relaxed text-[#D1D1D1]">
            <strong className="text-white">Esmeray AI</strong> is a production-quality, full-stack AI chatbot application inspired by the ChatGPT desktop interface, engineered for blazing-fast inference using Groq AI.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-[#2A2A2A] border border-[#383838]">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <Zap className="w-4 h-4 text-[#10A37F]" />
                Fast Inference
              </div>
              <p className="text-[12px] text-[#8E8EA0]">
                Powered by Groq LPUs delivering ultra-low token latency.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#2A2A2A] border border-[#383838]">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <Database className="w-4 h-4 text-[#10A37F]" />
                Permanent History
              </div>
              <p className="text-[12px] text-[#8E8EA0]">
                Conversations persisted in SQLite with full cascade & search.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#2A2A2A] border border-[#383838]">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <Terminal className="w-4 h-4 text-[#10A37F]" />
                Real-time SSE
              </div>
              <p className="text-[12px] text-[#8E8EA0]">
                Token-by-token streaming with smart auto-scroll & pause.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#2A2A2A] border border-[#383838]">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <Shield className="w-4 h-4 text-[#10A37F]" />
                Document & Vision
              </div>
              <p className="text-[12px] text-[#8E8EA0]">
                Multi-modal understanding for PDFs, images, and code.
              </p>
            </div>
          </div>

          <div className="text-[12px] text-[#8E8EA0] pt-2 border-t border-[#303030]">
            Version 1.0.0 • Developed with FastAPI, Groq SDK, SQLite, React & Tailwind CSS.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-[#333333] bg-[#1E1E1E]">
          <button
            onClick={() => setAboutOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-white text-[13.5px] font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
