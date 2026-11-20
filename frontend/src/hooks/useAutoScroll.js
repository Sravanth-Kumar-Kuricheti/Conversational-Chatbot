import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for ChatGPT-style auto-scrolling:
 * - Follows output as tokens stream in.
 * - Detects when the user manually scrolls up and PAUSES auto-scrolling.
 * - Resumes following when the user scrolls back near the bottom.
 * - Provides a manual `scrollToBottom` trigger for "Scroll to bottom" button.
 */
export function useAutoScroll(isStreaming) {
  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isUserScrollingUpRef = useRef(false);
  const animationFrameRef = useRef(null);

  // Check whether the user is scrolled near the bottom of the container
  const checkIfAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    const threshold = 100; // pixels from bottom considered "at bottom"
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceToBottom <= threshold;
  }, []);

  // Handle user manual scroll events
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);

    // If user is not at the bottom, flag that they've scrolled up
    if (!atBottom) {
      isUserScrollingUpRef.current = true;
    } else {
      isUserScrollingUpRef.current = false;
    }
  }, [checkIfAtBottom]);

  // Smoothly scroll to the absolute bottom
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;

    isUserScrollingUpRef.current = false;
    setIsAtBottom(true);

    if (smooth) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // During streaming, follow content with requestAnimationFrame only if user hasn't scrolled up
  const followStreaming = useCallback(() => {
    if (isUserScrollingUpRef.current) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el && !isUserScrollingUpRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, []);

  // When streaming finishes, cancel any scheduled animation frames
  useEffect(() => {
    if (!isStreaming && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isStreaming]);

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    followStreaming,
    handleScroll,
  };
}
