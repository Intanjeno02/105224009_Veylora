import type { Account } from "@/data/account";
import {
  getAccounts,
  getAccountsStorageKey,
  LEGACY_ACCOUNTS_STORAGE_KEY,
  saveAccounts,
} from "@/lib/account-storage";
import {
  getScanHistory,
  getScanHistoryStorageKey,
  LEGACY_HISTORY_STORAGE_KEY,
  saveScanHistory,
  type ScanHistory,
} from "@/lib/history-storage";

const IMPORT_MARKER_PREFIX = "veylora_legacy_import_v1_";
const IMPORTED_MARKER = "completed";

type LegacyImportResult =
  | { status: "already-imported" }
  | { status: "nothing-to-import" }
  | {
      status: "imported";
      accountsImported: number;
      historyImported: number;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAccount(value: unknown): value is Account {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.username === "string" &&
    typeof value.email === "string" &&
    typeof value.url === "string" &&
    typeof value.category === "string" &&
    typeof value.encryptedPassword === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isScanHistory(value: unknown): value is ScanHistory {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.url === "string" &&
    (value.status === "Mencurigakan" ||
      value.status === "Perlu Diperiksa") &&
    Array.isArray(value.reasons) &&
    value.reasons.every((reason) => typeof reason === "string") &&
    typeof value.checkedAt === "string"
  );
}

function readArray<T>(
  key: string,
  isItem: (value: unknown) => value is T
): T[] {
  const savedData = localStorage.getItem(key);

  if (savedData === null) {
    return [];
  }

  const parsedData: unknown = JSON.parse(savedData);

  if (!Array.isArray(parsedData) || !parsedData.every(isItem)) {
    throw new Error("Data local lama memiliki format yang tidak valid.");
  }

  return parsedData;
}

function mergeById<T extends { id: string }>(
  existing: T[],
  imported: T[]
): { records: T[]; addedCount: number } {
  const ids = new Set(existing.map((record) => record.id));
  const records = [...existing];
  let addedCount = 0;

  for (const record of imported) {
    if (!ids.has(record.id)) {
      ids.add(record.id);
      records.push(record);
      addedCount += 1;
    }
  }

  return { records, addedCount };
}

export function importLegacyLocalData(
  userId: string
): LegacyImportResult {
  if (typeof window === "undefined") {
    throw new Error("Impor data lokal hanya dapat dilakukan di browser.");
  }

  const markerKey = `${IMPORT_MARKER_PREFIX}${userId}`;

  if (localStorage.getItem(markerKey) === IMPORTED_MARKER) {
    return { status: "already-imported" };
  }

  const legacyAccounts = readArray(
    LEGACY_ACCOUNTS_STORAGE_KEY,
    isAccount
  );
  const legacyHistory = readArray(
    LEGACY_HISTORY_STORAGE_KEY,
    isScanHistory
  );

  if (legacyAccounts.length === 0 && legacyHistory.length === 0) {
    return { status: "nothing-to-import" };
  }

  const accountsKey = getAccountsStorageKey(userId);
  const historyKey = getScanHistoryStorageKey(userId);
  const currentAccounts = readArray(accountsKey, isAccount);
  const currentHistory = readArray(historyKey, isScanHistory);
  const mergedAccounts = mergeById(currentAccounts, legacyAccounts);
  const mergedHistory = mergeById(currentHistory, legacyHistory);

  if (legacyAccounts.length > 0) {
    saveAccounts(userId, mergedAccounts.records);
  }

  if (legacyHistory.length > 0) {
    saveScanHistory(userId, mergedHistory.records);
  }

  const savedAccounts = getAccounts(userId);
  const savedHistory = getScanHistory(userId);

  if (
    JSON.stringify(savedAccounts) !==
      JSON.stringify(mergedAccounts.records) ||
    JSON.stringify(savedHistory) !==
      JSON.stringify(mergedHistory.records)
  ) {
    throw new Error("Verifikasi hasil impor data lokal gagal.");
  }

  localStorage.setItem(markerKey, IMPORTED_MARKER);

  if (localStorage.getItem(markerKey) !== IMPORTED_MARKER) {
    throw new Error("Status impor data lokal tidak dapat disimpan.");
  }

  return {
    status: "imported",
    accountsImported: mergedAccounts.addedCount,
    historyImported: mergedHistory.addedCount,
  };
}
