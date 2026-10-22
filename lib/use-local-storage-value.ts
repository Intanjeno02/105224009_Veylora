"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const storageChangeEvent = "veylora:storage-change";

function getStorageSnapshot(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function subscribeToStorage(
  key: string,
  onChange: () => void
): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === key) {
      onChange();
    }
  }

  function handleLocalStorageChange(event: Event) {
    if (event instanceof CustomEvent && event.detail === key) {
      onChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(storageChangeEvent, handleLocalStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(storageChangeEvent, handleLocalStorageChange);
  };
}

export function notifyLocalStorageChange(key: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(storageChangeEvent, { detail: key })
    );
  }
}

export function useLocalStorageValue<T>(
  key: string,
  fallback: T,
  getStoredValue: () => T
): { value: T; isLoaded: boolean } {
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToStorage(key, onChange),
    [key]
  );
  const getSnapshot = useCallback(() => getStorageSnapshot(key), [key]);
  const serializedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null
  );
  const value = useMemo(
    () => (serializedValue === null ? fallback : getStoredValue()),
    [fallback, getStoredValue, serializedValue]
  );

  return { value, isLoaded: serializedValue !== null };
}
