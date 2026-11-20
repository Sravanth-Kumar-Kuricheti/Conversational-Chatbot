import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

export default function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative my-4 rounded-lg overflow-hidden border border-[#3E3E3E] bg-[#1E1E1E]">
      {/* Code block header bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#2A2A2A] text-xs text-[#B4B4B4] font-mono select-none">
        <span className="lowercase">{language || 'plaintext'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[#B4B4B4] hover:text-white transition-colors duration-150 py-1 px-1.5 rounded hover:bg-[#383838]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-sans">Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax highlighted code */}
      <div className="overflow-x-auto text-[13.5px] leading-relaxed">
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#1A1A1A',
            fontSize: '13.5px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
          wrapLongLines={false}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
