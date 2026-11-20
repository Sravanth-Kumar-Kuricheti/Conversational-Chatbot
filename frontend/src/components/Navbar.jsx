import React, { useState, useRef, useEffect } from 'react';
import { PanelLeft, ChevronDown, Check, Plus, Bot, Sparkles, Zap, Shield } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function Navbar() {
  const {
    models,
    activeModel,
    setActiveModel,
    isSidebarOpen,
    setIsSidebarOpen,
    setIsMobileDrawerOpen,
    createNewChat,
  } = useChat();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModelObj = models.find((m) => m.id === activeModel) || (models.length > 0 ? models[0] : {
    id: activeModel || 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    badge: 'Recommended',
  });

  const handleToggleSidebar = () => {
    // If screen is mobile (<768px), open mobile drawer
    if (window.innerWidth < 768) {
      setIsMobileDrawerOpen((prev) => !prev);
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  return (
    <header className="h-[56px] min-h-[56px] border-b border-[#333333] bg-[#212121] flex items-center justify-between px-3 md:px-4 select-none shrink-0 z-20">
      {/* Left: Sidebar toggle & Branding */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleSidebar}
          className="p-2 text-[#ECECEC] hover:bg-[#2F2F2F] rounded-lg transition-colors"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* PyChat AI Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={createNewChat}>
          <div className="w-6 h-6 rounded-md bg-[#10A37F] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[16px] text-white tracking-tight hidden sm:inline">
            PyChat AI
          </span>
        </div>
      </div>

      {/* Center: Model Selector Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium text-[#ECECEC] hover:bg-[#2A2A2A] transition-colors group"
        >
          <span className="text-white font-medium truncate max-w-[150px] sm:max-w-[220px]">
            {currentModelObj.name}
          </span>
          {currentModelObj.badge && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#10A37F]/20 text-[#10A37F] font-semibold hidden md:inline">
              {currentModelObj.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#8E8EA0] group-hover:text-white transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-72 sm:w-80 bg-[#252525] border border-[#3E3E3E] rounded-xl shadow-2xl py-2 z-50">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8E8EA0] uppercase tracking-wider">
              Groq AI Models
            </div>

            <div className="space-y-1 px-1.5">
              {models.map((model) => {
                const isSelected = model.id === activeModel;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setActiveModel(model.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-[#303030] text-white'
                        : 'text-[#ECECEC] hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-medium truncate">
                          {model.name}
                        </span>
                        {model.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10A37F]/20 text-[#10A37F] font-bold">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-[#8E8EA0] line-clamp-1 mt-0.5">
                        {model.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#10A37F] shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: New Chat Action */}
      <div className="flex items-center gap-2">
        <button
          onClick={createNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#3E3E3E] text-white text-[13px] font-medium rounded-lg transition-colors"
          title="Start a new chat"
        >
          <Plus className="w-4 h-4 text-[#10A37F]" />
          <span className="hidden sm:inline">New chat</span>
        </button>
      </div>
    </header>
  );
}
