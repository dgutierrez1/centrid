import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { aiAgentState } from '@/lib/state/aiAgentState';

export function useNavigateToSource() {
  const router = useRouter();

  const navigateToSource = async (
    sourceThreadId: string,
    creationMessageId?: string
  ) => {
    // Navigate to the source thread
    const url = creationMessageId
      ? `/workspace/${sourceThreadId}?highlightMessage=${creationMessageId}`
      : `/workspace/${sourceThreadId}`;

    await router.push(url);
  };

  // Handle highlighting after navigation (called from thread page)
  const handleMessageHighlight = (messageId: string) => {
    // Wait for messages to be loaded in state
    const checkMessages = setInterval(() => {
      const message = aiAgentState.messages.find((m) => m.id === messageId);

      if (message) {
        clearInterval(checkMessages);

        // Find message element
        const messageElement = document.querySelector(
          `[data-message-id="${messageId}"]`
        );

        if (messageElement) {
          // Scroll to message
          messageElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          // Apply highlight class
          messageElement.classList.add(
            'bg-yellow-100',
            'dark:bg-yellow-900/30',
            'transition-colors',
            'duration-2000'
          );

          // Fade to transparent after animation
          setTimeout(() => {
            messageElement.classList.remove(
              'bg-yellow-100',
              'dark:bg-yellow-900/30'
            );

            // Remove highlight class completely after fade
            setTimeout(() => {
              messageElement.classList.remove(
                'transition-colors',
                'duration-2000'
              );
            }, 2000);
          }, 100);
        }
      }
    }, 100);

    // Timeout after 5 seconds if message not found
    setTimeout(() => clearInterval(checkMessages), 5000);
  };

  // Auto-highlight on mount if query param present
  useEffect(() => {
    const { highlightMessage } = router.query;

    if (highlightMessage && typeof highlightMessage === 'string') {
      // Wait for component to mount
      setTimeout(() => {
        handleMessageHighlight(highlightMessage);
      }, 500);
    }
  }, [router.query]);

  return { navigateToSource, handleMessageHighlight };
}
