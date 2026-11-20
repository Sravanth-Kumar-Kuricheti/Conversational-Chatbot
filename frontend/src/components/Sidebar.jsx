import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Info,
  ChevronLeft,
  Bot
} from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function Sidebar() {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    createNewChat,
    renameConversation,
    deleteChat,
    searchQuery,
    setSearchQuery,
    isSidebarOpen,
    setIsSidebarOpen,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    setSettingsOpen,
    setAboutOpen,
  } = useChat();

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Group conversations into Today, Yesterday, Previous 7 Days, Older
  const groupedConversations = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 7 * 86400000;

    conversations.forEach((conv) => {
      const convTime = new Date(conv.updated_at || conv.created_at).getTime();
      if (convTime >= todayStart) {
        groups.Today.push(conv);
      } else if (convTime >= yesterdayStart) {
        groups.Yesterday.push(conv);
      } else if (convTime >= weekStart) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  }, [conversations]);

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (convId, e) => {
    if (e) e.stopPropagation();
    if (editTitle.trim()) {
      renameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    if (e) e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (convId, e) => {
    e.stopPropagation();
    deleteChat(convId);
    setDeleteConfirmId(null);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-[#171717] border-r border-[#303030] transition-all duration-300 ease-in-out select-none ${
          isMobileDrawerOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full md:translate-x-0'
        } ${isSidebarOpen ? 'md:w-[260px]' : 'md:w-0 md:opacity-0 md:pointer-events-none md:border-r-0'}`}
        style={{ width: isMobileDrawerOpen || isSidebarOpen ? '260px' : '0px' }}
      >
        {/* Sidebar Header & New Chat Button */}
        <div className="p-3 shrink-0 flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#10A37F] flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-[15px] text-white tracking-tight">
                PyChat AI
              </span>
            </div>
            {/* Collapse button on desktop */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-[#8E8EA0] hover:text-white rounded-lg hover:bg-[#252525] hidden md:block"
              title="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={createNewChat}
            className="flex items-center justify-between w-full px-3 py-2 bg-[#212121] hover:bg-[#282828] border border-[#383838] hover:border-[#4A4A4A] text-white rounded-xl text-[14px] font-medium transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-[#10A37F] group-hover:scale-110 transition-transform" />
              <span>New chat</span>
            </div>
          </button>

          {/* Search Input Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8E8EA0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#212121] text-[#ECECEC] text-[13px] placeholder-[#71717A] rounded-lg pl-8 pr-7 py-1.5 border border-[#303030] focus:outline-none focus:border-[#4B4B4B] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8EA0] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-3 text-[#71717A] text-[13px]">
              {searchQuery ? 'No matching conversations' : 'No chats yet. Start a conversation!'}
            </div>
          ) : (
            Object.entries(groupedConversations).map(([groupTitle, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-[#8E8EA0] uppercase tracking-wider">
                    {groupTitle}
                  </div>

                  {list.map((conv) => {
                    const isActive = conv.id === currentConversationId;
                    const isEditing = editingId === conv.id;
                    const isDeleting = deleteConfirmId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => !isEditing && selectConversation(conv.id)}
                        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-[13.5px] cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[#2A2A2A] text-white font-medium'
                            : 'text-[#D1D1D1] hover:bg-[#212121] hover:text-white'
                        }`}
                      >
                        {/* Conversation Title / Edit input */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <MessageSquare className="w-4 h-4 shrink-0 text-[#8E8EA0] group-hover:text-white" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editTitle}
                              autoFocus
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(conv.id, e);
                                if (e.key === 'Escape') handleCancelRename(e);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-[#1A1A1A] text-white text-[13px] px-1.5 py-0.5 rounded border border-[#525252] focus:outline-none"
                            />
                          ) : (
                            <span className="truncate">{conv.title}</span>
                          )}
                        </div>

                        {/* Action buttons (Rename & Delete) */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isEditing ? (
                            <>
                              <button
                                onClick={(e) => handleSaveRename(conv.id, e)}
                                className="p-1 text-[#10A37F] hover:text-emerald-400"
                                title="Save title"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleCancelRename}
                                className="p-1 text-[#8E8EA0] hover:text-white"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : isDeleting ? (
                            <div className="flex items-center gap-1 bg-[#2C1818] px-1.5 py-0.5 rounded border border-red-700">
                              <span className="text-[11px] text-red-300">Delete?</span>
                              <button
                                onClick={(e) => handleDelete(conv.id, e)}
                                className="text-red-400 hover:text-red-300 font-bold text-xs"
                                title="Confirm delete"
                              >
                                Yes
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="text-neutral-400 hover:text-white text-xs"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="hidden group-hover:flex items-center gap-1">
                              <button
                                onClick={(e) => handleStartRename(conv, e)}
                                className="p-1 text-[#8E8EA0] hover:text-white rounded hover:bg-[#383838]"
                                title="Rename conversation"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(conv.id);
                                }}
                                className="p-1 text-[#8E8EA0] hover:text-red-400 rounded hover:bg-[#383838]"
                                title="Delete conversation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer (Settings & About) */}
        <div className="p-2 border-t border-[#303030] shrink-0 space-y-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13.5px] text-[#ECECEC] hover:bg-[#212121] rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 text-[#8E8EA0]" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setAboutOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13.5px] text-[#ECECEC] hover:bg-[#212121] rounded-lg transition-colors"
          >
            <Info className="w-4 h-4 text-[#8E8EA0]" />
            <span>About PyChat AI</span>
          </button>
        </div>
      </aside>
    </>
  );
}
