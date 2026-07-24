import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useUndoRedo — snapshot-based undo/redo for the broadcast control panel.
 *
 * Watches the `data` object. When data changes meaningfully (not from polling
 * or undo/redo itself), the previous state is pushed to the undo stack.
 *
 * Usage:
 *   const { undo, redo, canUndo, canRedo, history, snapshotLabel } = useUndoRedo(data, overlayApi, refresh);
 */
const MAX_HISTORY = 30;

export function useUndoRedo(data, overlayApi, refresh) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [history, setHistory] = useState([]); // human-readable action log
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const prevDataRef = useRef(null);
  const skipRef = useRef(false); // skip snapshot when restoring
  const initializedRef = useRef(false);

  // Deep clone helper (structuredClone is available in modern browsers)
  const clone = (obj) => {
    if (typeof structuredClone === 'function') return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
  };

  // Shallow equality check — compares array lengths + top-level keys
  const dataChanged = (prev, curr) => {
    if (!prev || !curr) return false;
    const keys = ['teams', 'players', 'matches', 'match_standings', 'kill_events', 'elimination_events', 'overlay_state', 'tournament', 'design'];
    for (const k of keys) {
      const pv = prev[k], cv = curr[k];
      if (Array.isArray(pv) || Array.isArray(cv)) {
        const pl = Array.isArray(pv) ? pv.length : -1;
        const cl = Array.isArray(cv) ? cv.length : -1;
        if (pl !== cl) return true;
      } else if (typeof pv === 'object' && typeof cv === 'object') {
        if (JSON.stringify(pv) !== JSON.stringify(cv)) return true;
      } else if (pv !== cv) return true;
    }
    return false;
  };

  // Auto-snapshot on data change
  useEffect(() => {
    if (!data) return;

    // First load — don't snapshot
    if (!initializedRef.current) {
      prevDataRef.current = clone(data);
      initializedRef.current = true;
      return;
    }

    // Skip if this change came from undo/redo restore
    if (skipRef.current) {
      skipRef.current = false;
      prevDataRef.current = clone(data);
      return;
    }

    // Only snapshot if data actually changed meaningfully
    if (dataChanged(prevDataRef.current, data)) {
      setUndoStack(prev => {
        const next = [...prev, clone(prevDataRef.current)];
        if (next.length > MAX_HISTORY) next.shift();
        return next;
      });
      setRedoStack([]); // clear redo on new action
      setHistory(prev => {
        const entry = {
          id: Date.now(),
          label: `Change #${prev.length + 1}`,
          time: new Date().toLocaleTimeString(),
        };
        const next = [...prev, entry].slice(-MAX_HISTORY);
        return next;
      });
    }

    prevDataRef.current = clone(data);
  }, [data]);

  // Undo
  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];

    // Push current to redo
    setRedoStack(prevStack => [...prevStack, clone(prevDataRef.current)]);
    setUndoStack(prevStack => prevStack.slice(0, -1));
    setHistory(prevH => {
      const entry = {
        id: Date.now(),
        label: `↶ Undo`,
        time: new Date().toLocaleTimeString(),
      };
      return [...prevH, entry].slice(-MAX_HISTORY);
    });

    skipRef.current = true;

    try {
      await overlayApi.restoreState(prev);
      await refresh();
    } catch (e) {
      console.error('Undo failed:', e);
      skipRef.current = false; // reset flag on error
    }
  }, [undoStack, overlayApi, refresh]);

  // Redo
  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];

    // Push current to undo
    setUndoStack(prevStack => [...prevStack, clone(prevDataRef.current)]);
    setRedoStack(prevStack => prevStack.slice(0, -1));
    setHistory(prevH => {
      const entry = {
        id: Date.now(),
        label: `↷ Redo`,
        time: new Date().toLocaleTimeString(),
      };
      return [...prevH, entry].slice(-MAX_HISTORY);
    });

    skipRef.current = true;

    try {
      await overlayApi.restoreState(next);
      await refresh();
    } catch (e) {
      console.error('Redo failed:', e);
      skipRef.current = false;
    }
  }, [redoStack, overlayApi, refresh]);

  return {
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    history,
    undoDepth: undoStack.length,
    redoDepth: redoStack.length,
  };
}
