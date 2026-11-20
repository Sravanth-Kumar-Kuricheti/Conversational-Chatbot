import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ChatContainer from '../components/ChatContainer';
import ChatComposer from '../components/ChatComposer';
import SettingsModal from '../components/SettingsModal';
import AboutModal from '../components/AboutModal';

export default function ChatPage() {
  const [followStreamCallback, setFollowStreamCallback] = useState(null);

  return (
    <div className="flex h-screen w-screen bg-[#212121] text-[#ECECEC] overflow-hidden font-sans">
      {/* 260px Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 bg-[#212121]">
        {/* Fixed 56px Top Navbar */}
        <Navbar />

        {/* Chat Messages Container (Max 800px centered) */}
        <ChatContainer onSetFollowStream={setFollowStreamCallback} />

        {/* Chat Composer (Pinned at bottom, max 800px centered, 16px spacing) */}
        <ChatComposer onFollowStream={followStreamCallback} />
      </div>

      {/* Modals */}
      <SettingsModal />
      <AboutModal />
    </div>
  );
}
