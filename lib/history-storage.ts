import { notifyLocalStorageChange } from "@/lib/use-local-storage-value";

export type ScanHistory = {
  id: string;
  url: string;
  status: "Mencurigakan" | "Perlu Diperiksa";
  reasons: string[];
  checkedAt: string;
};

export const LEGACY_HISTORY_STORAGE_KEY = "veylora-url-history";

export function getScanHistoryStorageKey(userId: string): string {
  return `veylora_history_${userId}`;
}

export function getScanHistory(userId: string): ScanHistory[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedData = localStorage.getItem(
      getScanHistoryStorageKey(userId)
    );

    if (!savedData) {
      return [];
    }

    const parsedData: unknown = JSON.parse(savedData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData as ScanHistory[];
  } catch {
    return [];
  }
}

export function saveScanHistory(
  userId: string,
  history: ScanHistory[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getScanHistoryStorageKey(userId);
  localStorage.setItem(storageKey, JSON.stringify(history));
  notifyLocalStorageChange(storageKey);
}

export function addScanHistory(
  userId: string,
  entry: Omit<ScanHistory, "id">
): ScanHistory[] {
  const currentHistory = getScanHistory(userId);

  const newEntry: ScanHistory = {
    ...entry,
    id: crypto.randomUUID(),
  };

  const updatedHistory = [
    newEntry,
    ...currentHistory,
  ];

  saveScanHistory(userId, updatedHistory);

  return updatedHistory;
}

export function clearScanHistory(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getScanHistoryStorageKey(userId);
  localStorage.removeItem(storageKey);
  notifyLocalStorageChange(storageKey);
}