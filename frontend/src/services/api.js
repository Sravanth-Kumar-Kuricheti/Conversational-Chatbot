const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

/**
 * Fetch available models from backend.
 */
export async function fetchModels() {
  const response = await fetch(`${API_BASE}/models`);
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  return response.json();
}

/**
 * Fetch all conversations with optional search query.
 */
export async function fetchConversations(searchQuery = '') {
  const url = searchQuery
    ? `${API_BASE}/conversations?search=${encodeURIComponent(searchQuery)}`
    : `${API_BASE}/conversations`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  return response.json();
}

/**
 * Create a new conversation session.
 */
export async function createConversation(data = {}) {
  const response = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }
  return response.json();
}

/**
 * Fetch full conversation detail with messages.
 */
export async function fetchConversation(id) {
  const response = await fetch(`${API_BASE}/conversations/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch conversation details');
  }
  return response.json();
}

/**
 * Rename conversation title or change model.
 */
export async function updateConversation(id, data) {
  const response = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update conversation');
  }
  return response.json();
}

/**
 * Permanently delete conversation.
 */
export async function deleteConversation(id) {
  const response = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to delete conversation');
  }
  return true;
}

/**
 * Stream user message and receive Server-Sent Events response.
 */
export async function streamMessage(conversationId, content, model, { attachment, onUserAck, onToken, onRecommendations, onDone, onError, signal }) {
  try {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ content, model, attachment }),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || `Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.replace('data: ', '').trim();
        try {
          const data = JSON.parse(jsonStr);
          if (data.type === 'user_ack') {
            if (onUserAck) onUserAck(data);
          } else if (data.type === 'token') {
            if (onToken) onToken(data.content);
          } else if (data.type === 'recommendations') {
            if (onRecommendations) onRecommendations(data.data);
          } else if (data.type === 'done') {
            if (onDone) onDone(data);
          } else if (data.type === 'error') {
            if (onError) onError(new Error(data.error));
          }
        } catch (e) {
          console.warn('Failed to parse SSE JSON:', jsonStr, e);
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Stream aborted by user');
      return;
    }
    if (onError) onError(err);
  }
}

/**
 * Retry response for the last user message.
 */
export async function retryMessage(conversationId, { onToken, onRecommendations, onDone, onError, signal }) {
  try {
    const response = await fetch(`${API_BASE}/conversations/${conversationId}/retry`, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
      },
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || `Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.replace('data: ', '').trim();
        try {
          const data = JSON.parse(jsonStr);
          if (data.type === 'token') {
            if (onToken) onToken(data.content);
          } else if (data.type === 'recommendations') {
            if (onRecommendations) onRecommendations(data.data);
          } else if (data.type === 'done') {
            if (onDone) onDone(data);
          } else if (data.type === 'error') {
            if (onError) onError(new Error(data.error));
          }
        } catch (e) {
          console.warn('Failed to parse SSE JSON:', jsonStr, e);
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    if (onError) onError(err);
  }
}

/**
 * Health check
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}
