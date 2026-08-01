import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_HISTORY = 30;

export function useUndoRedo(data, overlayApi, refresh) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const prevDataRef = useRef(null);
  const skipRef = useRef(false);
  const initializedRef = useRef(false);

  const clone = (obj) => {
    if (typeof structuredClone === 'function') return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
  };

  const dataChanged = (prev, curr) => {
    if (!prev || !curr) return false;
    const keys = ['teams', 'players', 'matches', 'match_standings', 'kill_events', 'elimination_events', 'overlay_state', 'tournament', 'design'];
    for (const k of keys) {
      const pv = prev[k], cv = curr[k];
      if (Array.isArray(pv) || Array.isArray(cv)) {
        if ((Array.isArray(pv) ? pv.length : -1) !== (Array.isArray(cv) ? cv.length : -1)) return true;
      } else if (typeof pv === 'object' && typeof cv === 'object') {
        if (JSON.stringify(pv) !== JSON.stringify(cv)) return true;
      } else if (pv !== cv) return true;
    }
    return false;
  };

  useEffect(() => {
    if (!data) return;
    if (!initializedRef.current) { prevDataRef.current = clone(data); initializedRef.current = true; return; }
    if (skipRef.current) { skipRef.current = false; prevDataRef.current = clone(data); return; }
    if (dataChanged(prevDataRef.current, data)) {
      setUndoStack(prev => { const next = [...prev, clone(prevDataRef.current)]; return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next; });
      setRedoStack([]);
    }
    prevDataRef.current = clone(data);
  }, [data]);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(s => [...s, clone(prevDataRef.current)]);
    setUndoStack(s => s.slice(0, -1));
    skipRef.current = true;
    try { await overlayApi.restoreState(prev); await refresh(); }
    catch (e) { console.error('Undo failed:', e); skipRef.current = false; }
  }, [undoStack, overlayApi, refresh]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, clone(prevDataRef.current)]);
    setRedoStack(s => s.slice(0, -1));
    skipRef.current = true;
    try { await overlayApi.restoreState(next); await refresh(); }
    catch (e) { console.error('Redo failed:', e); skipRef.current = false; }
  }, [redoStack, overlayApi, refresh]);

  return { undo, redo, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 };
}
