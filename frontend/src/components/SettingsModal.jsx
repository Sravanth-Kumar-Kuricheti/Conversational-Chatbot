import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { checkHealth } from '../services/api';

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen, models, activeModel, setActiveModel } = useChat();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      setLoading(true);
      checkHealth()
        .then((data) => setHealth(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [settingsOpen]);

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-[#212121] border border-[#3E3E3E] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#333333]">
          <h2 className="text-[17px] font-semibold text-white">Settings</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="text-[#8E8EA0] hover:text-white p-1 rounded-lg hover:bg-[#2A2A2A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* Groq API Status */}
          <div className="p-3.5 rounded-xl bg-[#2A2A2A] border border-[#383838]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-[#10A37F]" />
                Groq API Connection
              </span>
              {health?.groq_api_configured ? (
                <span className="flex items-center gap-1 text-[12px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[12px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-[#8E8EA0] leading-relaxed">
              {health?.groq_api_configured
                ? 'Your Groq API key is configured. Requests are sent directly to Groq high-speed LPUs.'
                : 'Configure GROQ_API_KEY in backend/.env to unlock real-time live Groq models. Demo responses are active.'}
            </p>
          </div>

          {/* Active Model Selector */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#ECECEC] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#10A37F]" />
              Default Model
            </label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full bg-[#2A2A2A] text-white text-[13.5px] px-3 py-2 rounded-xl border border-[#3E3E3E] focus:outline-none focus:border-[#10A37F]"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.badge || 'Standard'})
                </option>
              ))}
            </select>
          </div>

          {/* Storage & Engine Info */}
          <div className="p-3.5 rounded-xl bg-[#2A2A2A] border border-[#383838] space-y-1 text-[12.5px] text-[#A1A1AA]">
            <div className="flex justify-between">
              <span>Database Engine:</span>
              <span className="text-white font-mono">SQLite (SQLAlchemy)</span>
            </div>
            <div className="flex justify-between">
              <span>Streaming Protocol:</span>
              <span className="text-white font-mono">Server-Sent Events (SSE)</span>
            </div>
            <div className="flex justify-between">
              <span>Backend Framework:</span>
              <span className="text-white font-mono">FastAPI</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-[#333333] bg-[#1E1E1E]">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-[#10A37F] hover:bg-[#15896B] text-white text-[13.5px] font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
