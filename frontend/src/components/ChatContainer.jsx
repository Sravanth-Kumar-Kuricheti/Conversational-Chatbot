import React, { useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAutoScroll } from '../hooks/useAutoScroll';
import ChatMessage from './ChatMessage';
import WelcomeScreen from './WelcomeScreen';

export default function ChatContainer({ onSetFollowStream }) {
  const {
    currentMessages,
    streamingContent,
    isStreaming,
    loadingConv,
    sendMessage,
    retryLastMessage,
  } = useChat();

  const {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    followStreaming,
    handleScroll,
  } = useAutoScroll(isStreaming);

  // Pass followStreaming up so composer can trigger it on user sends
  useEffect(() => {
    if (onSetFollowStream) {
      onSetFollowStream(() => followStreaming);
    }
  }, [onSetFollowStream, followStreaming]);

  // When user sends a message or opens conversation, scroll to bottom
  useEffect(() => {
    if (currentMessages.length > 0) {
      scrollToBottom(false);
    }
  }, [currentMessages.length, scrollToBottom]);

  const hasMessages = currentMessages.length > 0 || isStreaming;

  return (
    <div className="relative flex-1 h-full overflow-hidden flex flex-col">
      {/* Scrollable messages container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6"
      >
        <div className="max-w-[800px] mx-auto w-full">
          {loadingConv ? (
            <div className="flex items-center justify-center min-h-[50vh] text-[#8E8EA0] text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10A37F] animate-pulse" />
                <span>Loading conversation...</span>
              </div>
            </div>
          ) : !hasMessages ? (
            <WelcomeScreen
              onSelectPrompt={(prompt) => sendMessage(prompt, followStreaming)}
            />
          ) : (
            <div className="space-y-6 pb-6">
              {currentMessages.map((msg, index) => {
                const isLatestAssistant =
                  msg.role === 'assistant' &&
                  index === currentMessages.length - 1 &&
                  !isStreaming;

                return (
                  <ChatMessage
                    key={msg.id || index}
                    message={msg}
                    isLatestAssistant={isLatestAssistant}
                    onRetry={() => retryLastMessage(followStreaming)}
                    onSelectQuestion={(q) => sendMessage(q, followStreaming)}
                  />
                );
              })}

              {/* Real-time Streaming message */}
              {isStreaming && streamingContent && (
                <ChatMessage
                  message={{
                    role: 'assistant',
                    content: streamingContent,
                  }}
                  isStreaming={true}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {!isAtBottom && hasMessages && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-6 right-6 z-30 p-2.5 rounded-full bg-[#303030] hover:bg-[#3E3E3E] text-white border border-[#484848] shadow-xl transition-all duration-200 hover:scale-105"
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4 text-[#10A37F]" />
        </button>
      )}
    </div>
  );
}
