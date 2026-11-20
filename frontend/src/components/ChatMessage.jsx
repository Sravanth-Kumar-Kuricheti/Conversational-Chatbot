import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RotateCcw, Bot } from 'lucide-react';
import CodeBlock from './CodeBlock';
import RecommendationSection from './RecommendationSection';

export default function ChatMessage({
  message,
  isLatestAssistant = false,
  isStreaming = false,
  onRetry,
  onSelectQuestion,
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // Extract structured metadata (recommendation, resources, questions)
  let metadata = message.metadata;
  if (!metadata && message.metadata_json) {
    try {
      metadata = typeof message.metadata_json === 'string'
        ? JSON.parse(message.metadata_json)
        : message.metadata_json;
    } catch (e) {
      metadata = null;
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="max-w-[85%] bg-[#2A2A2A] text-[#ECECEC] px-4 py-3 rounded-2xl rounded-tr-sm text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4 w-full group">
      {/* 32px Assistant Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#10A37F] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
        <Bot className="w-5 h-5 text-white" />
      </div>

      {/* Assistant Content Body */}
      <div className="flex-1 min-w-0">
        <div className={`prose-chat ${isStreaming ? 'streaming-cursor' : ''}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                if (!inline && match) {
                  return <CodeBlock language={match[1]} value={codeString} />;
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Structured "My recommendation" & "This might also interest you" */}
        {!isStreaming && metadata && (
          <RecommendationSection
            metadata={metadata}
            onSelectQuestion={onSelectQuestion}
          />
        )}

        {/* Message action buttons */}
        {!isStreaming && (
          <div className="flex items-center gap-2 mt-3 pt-1 text-[#8E8EA0] text-xs opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded hover:bg-[#2A2A2A] transition-colors"
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {isLatestAssistant && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded hover:bg-[#2A2A2A] transition-colors"
                title="Retry response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
