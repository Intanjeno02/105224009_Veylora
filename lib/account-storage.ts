import type { Account } from "@/data/account";
import { notifyLocalStorageChange } from "@/lib/use-local-storage-value";

export const LEGACY_ACCOUNTS_STORAGE_KEY = "personal-security-accounts";

export function getAccountsStorageKey(userId: string): string {
  return `veylora_vault_${userId}`;
}

export function getAccounts(userId: string): Account[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedData = localStorage.getItem(getAccountsStorageKey(userId));

    if (!savedData) {
      return [];
    }

    const parsedData: unknown = JSON.parse(savedData);

    return Array.isArray(parsedData) ? (parsedData as Account[]) : [];
  } catch {
    return [];
  }
}

export function saveAccounts(userId: string, accounts: Account[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getAccountsStorageKey(userId);
  localStorage.setItem(storageKey, JSON.stringify(accounts));
  notifyLocalStorageChange(storageKey);
}