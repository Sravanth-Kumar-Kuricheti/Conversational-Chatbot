import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Plus, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function ChatComposer({ onFollowStream }) {
  const { sendMessage, isStreaming, stopStreaming } = useChat();
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [fileError, setFileError] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Format file size nicely (e.g. 240 KB, 1.5 MB)
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Auto-resize textarea from min 24px to max 180px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    const newHeight = Math.min(Math.max(el.scrollHeight, 24), 180);
    el.style.height = `${newHeight}px`;
  }, [input]);

  const handleKeyDown = (e) => {
    // Enter without shift sends message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');

    // Check size limit: 20MB
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('File size exceeds the 20MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const isImg = file.type.startsWith('image/');
      setAttachment({
        name: file.name,
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        size: file.size,
        data: reader.result,
        isImage: isImg,
        previewUrl: isImg ? reader.result : null,
      });
    };
    reader.onerror = () => {
      setFileError('Failed to read the file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      stopStreaming();
      return;
    }

    const hasText = Boolean(input && input.trim());
    const hasAttachment = Boolean(attachment);

    if (!hasText && !hasAttachment) return;

    const textToSend = input.trim();
    const currentAttachment = attachment;

    setInput('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }

    sendMessage(textToSend, onFollowStream, currentAttachment);
  };

  const canSubmit = Boolean(input.trim()) || Boolean(attachment);

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 md:px-6 pb-4">
      {/* Hidden File Input for PDFs and Images */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />

      {/* Attachment Preview Card */}
      {attachment && (
        <div className="mb-2 flex items-center gap-3 p-2.5 bg-[#2A2A2A] border border-[#3E3E3E] rounded-xl w-fit max-w-full shadow-md animate-in fade-in duration-150">
          {attachment.isImage ? (
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              className="w-11 h-11 object-cover rounded-lg border border-[#444444]"
            />
          ) : (
            <div className="w-11 h-11 rounded-lg bg-red-950/60 border border-red-800/80 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-red-400" />
            </div>
          )}

          <div className="min-w-0 pr-1">
            <p className="text-[13px] font-medium text-white truncate max-w-[200px] sm:max-w-[320px]">
              {attachment.name}
            </p>
            <p className="text-[11.5px] text-[#8E8EA0]">
              {formatFileSize(attachment.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemoveAttachment}
            className="p-1 rounded-full text-[#8E8EA0] hover:text-white hover:bg-[#383838] transition-colors ml-1"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Error Notification */}
      {fileError && (
        <div className="mb-2 text-xs text-red-400 px-3 py-1.5 bg-red-950/40 border border-red-900 rounded-lg">
          {fileError}
        </div>
      )}

      {/* Composer Container */}
      <div className="relative flex flex-col bg-[#303030] rounded-[24px] border border-[#414141] shadow-lg transition-all focus-within:border-[#525252]">
        <div className="flex items-end px-3.5 py-2.5 gap-2">
          {/* Working Plus (+) Attachment Button */}
          <button
            type="button"
            onClick={handleFileClick}
            className="p-2 text-[#9E9E9E] hover:text-white rounded-full hover:bg-[#3D3D3D] transition-colors shrink-0 mb-0.5 cursor-pointer"
            title="Attach PDF or image"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Auto-resizing Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachment ? 'Add instructions or ask a question about the file...' : 'Message PyChat AI...'}
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none text-[15px] text-[#ECECEC] placeholder-[#8E8EA0] focus:outline-none focus:ring-0 leading-relaxed max-h-[180px] py-1.5 overflow-y-auto"
            style={{ minHeight: '24px' }}
          />

          {/* Send or Stop button */}
          <div className="shrink-0 mb-0.5">
            {isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
                title="Stop streaming"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  canSubmit
                    ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer shadow-sm'
                    : 'bg-[#424242] text-[#8E8EA0] cursor-not-allowed opacity-50'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ChatGPT-style Subtext */}
      <p className="text-center text-[12px] text-[#8E8EA0] mt-2 select-none">
        PyChat AI can make mistakes. Supports text, PDFs, and images with Groq AI.
      </p>
    </div>
  );
}
