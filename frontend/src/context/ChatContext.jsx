import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchModels,
  fetchConversations,
  fetchConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  streamMessage,
  retryMessage
} from '../services/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  // Models & Config
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState('llama-3.3-70b-versatile');

  // Conversations & Messages
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Stream abort controller ref
  const abortControllerRef = useRef(null);

  // Load models on startup
  useEffect(() => {
    async function initModels() {
      try {
        const list = await fetchModels();
        setModels(list);
        if (list.length > 0) {
          setActiveModel((prev) => (list.some((m) => m.id === prev) ? prev : list[0].id));
        }
      } catch (err) {
        console.error('Error loading models:', err);
      }
    }
    initModels();
  }, []);

  // Load conversation list (with search debounce)
  const refreshConversations = useCallback(async (query = searchQuery) => {
    try {
      const data = await fetchConversations(query);
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [searchQuery]);

  useEffect(() => {
    refreshConversations(searchQuery);
  }, [searchQuery, refreshConversations]);

  // Load selected conversation
  const selectConversation = useCallback(async (id) => {
    if (!id || id === currentConversationId) return;
    
    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingContent('');
    }

    setLoadingConv(true);
    setCurrentConversationId(id);
    try {
      const data = await fetchConversation(id);
      const parsedMsgs = (data.messages || []).map((m) => {
        let meta = null;
        if (m.metadata_json) {
          try {
            meta = typeof m.metadata_json === 'string' ? JSON.parse(m.metadata_json) : m.metadata_json;
          } catch (e) {
            meta = null;
          }
        }
        return { ...m, metadata: meta };
      });
      setCurrentMessages(parsedMsgs);
      if (data.model) setActiveModel(data.model);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setCurrentMessages([]);
    } finally {
      setLoadingConv(false);
      setIsMobileDrawerOpen(false); // Close mobile drawer on selection
    }
  }, [currentConversationId]);

  // Start a fresh chat
  const createNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingContent('');
    }
    setCurrentConversationId(null);
    setCurrentMessages([]);
    setStreamingContent('');
    setIsMobileDrawerOpen(false);
  }, []);

  // Send message with streaming
  const sendMessage = useCallback(async (text, onFollowStream, attachment = null) => {
    if ((!text || !text.trim()) && !attachment) return;
    if (isStreaming) return;

    const content = (text && text.trim()) ? text.trim() : (attachment ? 'Please analyze this attached file.' : '');

    let targetConvId = currentConversationId;

    // If no active conversation, create one in SQLite first
    if (!targetConvId) {
      try {
        const newConv = await createConversation({
          title: 'New Chat',
          model: activeModel,
        });
        targetConvId = newConv.id;
        setCurrentConversationId(targetConvId);
      } catch (err) {
        console.error('Failed to create new conversation:', err);
        return;
      }
    }

    // Format user message for optimistic UI display
    const displayContent = attachment
      ? (attachment.type?.includes('image')
          ? `🖼️ **Attached Image:** \`${attachment.name}\`\n\n${content}`
          : `📄 **Attached Document:** \`${attachment.name}\`\n\n${content}`)
      : content;

    // Optimistically append user message to UI
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: displayContent,
      created_at: new Date().toISOString(),
    };
    setCurrentMessages((prev) => [...prev, tempUserMsg]);

    // Setup streaming state
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let streamedAccumulator = '';
    let streamedRecData = null;

    await streamMessage(targetConvId, content, activeModel, {
      attachment: attachment ? {
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        data: attachment.data
      } : null,
      signal: controller.signal,
      onUserAck: (data) => {
        // Update user message id with persisted id and update title if auto-generated
        setCurrentMessages((prev) =>
          prev.map((m) =>
            m.id === tempUserMsg.id ? { ...m, id: data.user_message_id } : m
          )
        );
        refreshConversations();
      },
      onToken: (token) => {
        streamedAccumulator += token;
        setStreamingContent(streamedAccumulator);
        if (onFollowStream) onFollowStream();
      },
      onRecommendations: (rec) => {
        streamedRecData = rec;
      },
      onDone: (data) => {
        // Commit assistant message to currentMessages list
        const finalMsg = {
          id: data.message_id || `msg-${Date.now()}`,
          role: 'assistant',
          content: streamedAccumulator,
          created_at: new Date().toISOString(),
          metadata: data.metadata || streamedRecData,
        };
        setCurrentMessages((prev) => [...prev, finalMsg]);
        setStreamingContent('');
        setIsStreaming(false);
        abortControllerRef.current = null;
        refreshConversations();
      },
      onError: (err) => {
        console.error('Streaming error:', err);
        const errorMsg = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error receiving response:** ${err.message}`,
          created_at: new Date().toISOString(),
        };
        setCurrentMessages((prev) => [...prev, errorMsg]);
        setStreamingContent('');
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
    });
  }, [currentConversationId, activeModel, isStreaming, refreshConversations]);

  // Retry the last message
  const retryLastMessage = useCallback(async (onFollowStream) => {
    if (!currentConversationId || isStreaming || currentMessages.length === 0) return;

    // Check if last message was assistant
    const lastMsg = currentMessages[currentMessages.length - 1];
    if (lastMsg.role === 'assistant') {
      setCurrentMessages((prev) => prev.slice(0, -1));
    }

    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let streamedAccumulator = '';
    let streamedRecData = null;

    await retryMessage(currentConversationId, {
      signal: controller.signal,
      onToken: (token) => {
        streamedAccumulator += token;
        setStreamingContent(streamedAccumulator);
        if (onFollowStream) onFollowStream();
      },
      onRecommendations: (rec) => {
        streamedRecData = rec;
      },
      onDone: (data) => {
        const finalMsg = {
          id: data.message_id || `msg-${Date.now()}`,
          role: 'assistant',
          content: streamedAccumulator,
          created_at: new Date().toISOString(),
          metadata: data.metadata || streamedRecData,
        };
        setCurrentMessages((prev) => [...prev, finalMsg]);
        setStreamingContent('');
        setIsStreaming(false);
        abortControllerRef.current = null;
        refreshConversations();
      },
      onError: (err) => {
        console.error('Retry error:', err);
        const errorMsg = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error retrying response:** ${err.message}`,
          created_at: new Date().toISOString(),
        };
        setCurrentMessages((prev) => [...prev, errorMsg]);
        setStreamingContent('');
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
    });
  }, [currentConversationId, isStreaming, currentMessages, refreshConversations]);

  // Stop ongoing streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamingContent) {
      const partialMsg = {
        id: `stopped-${Date.now()}`,
        role: 'assistant',
        content: streamingContent + ' *(Response stopped by user)*',
        created_at: new Date().toISOString(),
      };
      setCurrentMessages((prev) => [...prev, partialMsg]);
    }
    setStreamingContent('');
    setIsStreaming(false);
  }, [streamingContent]);

  // Rename a conversation
  const renameConversation = useCallback(async (id, newTitle) => {
    try {
      await updateConversation(id, { title: newTitle });
      refreshConversations();
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  }, [refreshConversations]);

  // Delete a conversation
  const deleteChat = useCallback(async (id) => {
    try {
      await deleteConversation(id);
      if (currentConversationId === id) {
        createNewChat();
      }
      refreshConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [currentConversationId, createNewChat, refreshConversations]);

  return (
    <ChatContext.Provider
      value={{
        models,
        activeModel,
        setActiveModel,
        conversations,
        currentConversationId,
        currentMessages,
        streamingContent,
        isStreaming,
        loadingConv,
        searchQuery,
        setSearchQuery,
        isSidebarOpen,
        setIsSidebarOpen,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        settingsOpen,
        setSettingsOpen,
        aboutOpen,
        setAboutOpen,
        selectConversation,
        createNewChat,
        sendMessage,
        retryLastMessage,
        stopStreaming,
        renameConversation,
        deleteChat,
        refreshConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
