import { notifyLocalStorageChange } from "@/lib/use-local-storage-value";

export type ScanHistory = {
  id: string;
  url: string;
  status: "Mencurigakan" | "Perlu Diperiksa";
  reasons: string[];
  checkedAt: string;
};

const STORAGE_KEY = "veylora-url-history";

export function getScanHistory(): ScanHistory[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

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
  history: ScanHistory[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history)
  );
  notifyLocalStorageChange(STORAGE_KEY);
}

export function addScanHistory(
  entry: Omit<ScanHistory, "id">
): ScanHistory[] {
  const currentHistory = getScanHistory();

  const newEntry: ScanHistory = {
    ...entry,
    id: crypto.randomUUID(),
  };

  const updatedHistory = [
    newEntry,
    ...currentHistory,
  ];

  saveScanHistory(updatedHistory);

  return updatedHistory;
}

export function clearScanHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  notifyLocalStorageChange(STORAGE_KEY);
}