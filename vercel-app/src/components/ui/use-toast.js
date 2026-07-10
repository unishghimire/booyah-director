import * as React from "react";
import { useEffect, useState } from "react";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map();
const listeners = new Set();

function scheduleRemove(toastId) {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE", toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
}

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD":
      return [action.toast, ...state].slice(0, TOAST_LIMIT);
    case "UPDATE":
      return state.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t));
    case "DISMISS":
      if (action.toastId === undefined) return state.map((t) => ({ ...t, open: false }));
      return state.map((t) => (t.id === action.toastId ? { ...t, open: false } : t));
    case "REMOVE":
      if (action.toastId === undefined) return [];
      return state.filter((t) => t.id !== action.toastId);
    default:
      return state;
  }
};

const memoryState = { toasts: [] };
function dispatch(action) {
  memoryState.toasts = reducer(memoryState.toasts, action);
  listeners.forEach((l) => l(memoryState.toasts));
}

export function toast({ ...props }) {
  const id = genId();
  const update = (props) => dispatch({ type: "UPDATE", toast: { ...props, id } });
  const dismiss = () => dispatch({ type: "DISMISS", toastId: id });
  dispatch({
    type: "ADD",
    toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss(); } },
  });
  scheduleRemove(id);
  return { id, dismiss, update };
}

export function useToast() {
  const [state, setState] = React.useState(memoryState.toasts);
  React.useEffect(() => {
    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);
  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS", toastId }),
  };
}