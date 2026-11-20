import React from 'react';
import { Sparkles, Code2, Cpu, FileText } from 'lucide-react';
import { useChat } from '../context/ChatContext';

const EXAMPLE_PROMPTS = [
  {
    icon: Cpu,
    title: 'Explain quantum computing',
    prompt: 'Can you explain quantum computing and quantum superposition in simple, intuitive terms?',
  },
  {
    icon: Code2,
    title: 'Build a Python web scraper',
    prompt: 'Write a clean Python script using BeautifulSoup and requests to scrape article titles safely.',
  },
  {
    icon: Sparkles,
    title: 'Design a system architecture',
    prompt: 'Explain the key differences between microservices and modular monolith architecture with pros and cons.',
  },
  {
    icon: FileText,
    title: 'Draft a polite follow-up email',
    prompt: 'Help me draft a professional follow-up email after a great technical interview for a Senior Developer position.',
  },
];

export default function WelcomeScreen({ onSelectPrompt }) {
  const { activeModel } = useChat();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-[800px] mx-auto px-4 text-center select-none">
      {/* Esmeray AI Hero Logo with ☪︎ symbol */}
      <div className="w-16 h-16 rounded-2xl bg-[#10A37F] flex items-center justify-center mb-6 shadow-xl shadow-[#10A37F]/10 ring-1 ring-[#10A37F]/30 text-white text-[32px] font-bold select-none leading-none">
        ☪︎
      </div>

      {/* Main Heading (Exact 24px) */}
      <h1 className="text-[24px] font-semibold text-white tracking-tight mb-2">
        How can I help you today?
      </h1>

      {/* Subdescription */}
      <p className="text-[14.5px] text-[#8E8EA0] max-w-md mb-8 leading-relaxed">
        Ultra-fast AI conversations powered by Groq and Esmeray AI. Choose a prompt below or start typing.
      </p>

      {/* Example Prompts Grid (Rounded 12px cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {EXAMPLE_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex items-start gap-3.5 p-4 rounded-card bg-[#2A2A2A] hover:bg-[#323232] border border-[#3E3E3E] hover:border-[#525252] transition-all duration-150 group cursor-pointer text-left"
            >
              <div className="p-2 rounded-lg bg-[#383838] group-hover:bg-[#404040] text-[#10A37F] shrink-0 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-[#ECECEC] group-hover:text-white transition-colors truncate">
                  {item.title}
                </div>
                <div className="text-[12.5px] text-[#8E8EA0] line-clamp-2 mt-0.5 leading-snug">
                  {item.prompt}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
