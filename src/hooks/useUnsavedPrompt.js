import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useUnsavedPrompt
 * Protects users from accidental data loss upon tab close, reload, or navigation.
 * Also provides lightweight autosave checkpointing to sessionStorage.
 *
 * @param {boolean} isDirty - Whether the form currently contains unsaved modifications
 * @param {Object} options - Configuration options
 * @param {string} [options.storageKey] - Key for autosaving form snapshot in sessionStorage
 * @param {any} [options.formData] - Current form values to checkpoint
 * @param {string} [options.message] - Custom warning message for window unload
 */
export default function useUnsavedPrompt(isDirty, options = {}) {
  const {
    storageKey = null,
    formData = null,
    message = 'You have unsaved changes. Are you sure you want to leave?',
  } = options;

  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const debounceTimerRef = useRef(null);

  // Check if a saved draft exists on mount
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = sessionStorage.getItem(`draft_${storageKey}`);
      if (saved) {
        setHasSavedDraft(true);
      }
    } catch {
      // Ignore storage errors (private mode, quota)
    }
  }, [storageKey]);

  // Window beforeunload listener
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);

  // Debounced autosave to sessionStorage
  useEffect(() => {
    if (!storageKey || !isDirty || !formData) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(
          `draft_${storageKey}`,
          JSON.stringify({
            data: formData,
            timestamp: Date.now(),
          })
        );
        setHasSavedDraft(true);
      } catch {
        // Ignore storage errors
      }
    }, 2000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [storageKey, isDirty, formData]);

  const clearSavedDraft = useCallback(() => {
    if (!storageKey) return;
    try {
      sessionStorage.removeItem(`draft_${storageKey}`);
      setHasSavedDraft(false);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  const getSavedDraft = useCallback(() => {
    if (!storageKey) return null;
    try {
      const saved = sessionStorage.getItem(`draft_${storageKey}`);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, [storageKey]);

  return {
    hasSavedDraft,
    getSavedDraft,
    clearSavedDraft,
  };
}
