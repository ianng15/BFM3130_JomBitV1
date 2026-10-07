"use client";

/**
 * Browser-only demo store. Persists the whole demo state in localStorage and
 * lets React components subscribe to it.
 */
import { useSyncExternalStore } from "react";
import { createSeed, DEMO_VERSION } from "./seed";
import type { DemoState } from "./types";

const KEY = "jombit-demo-state";

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === DEMO_VERSION) return parsed;
    }
  } catch {
    // ignore and reseed
  }
  const fresh = createSeed();
  save(fresh);
  return fresh;
}

function save(s: DemoState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage full or blocked — keep working in memory
  }
}

function getState(): DemoState {
  if (!state) state = load();
  return state;
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Apply a mutation to a copy of the state; throws (and changes nothing) on error. */
export function update<T>(fn: (draft: DemoState) => T): T {
  const draft = structuredClone(getState());
  const result = fn(draft);
  state = draft;
  save(draft);
  emit();
  return result;
}

export function resetDemo(keepUser = true) {
  const current = getState().currentUserId;
  const fresh = createSeed();
  if (keepUser && current && fresh.users.some((u) => u.id === current)) fresh.currentUserId = current;
  state = fresh;
  save(fresh);
  emit();
}

/** Returns null during server render / before the browser store is ready. */
export function useDemoState(): DemoState | null {
  return useSyncExternalStore(subscribe, getState, () => null);
}
