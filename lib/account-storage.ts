import type { Account } from "@/data/account";
import { notifyLocalStorageChange } from "@/lib/use-local-storage-value";

const STORAGE_KEY = "personal-security-accounts";

export function getAccounts(): Account[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return [];
    }

    return JSON.parse(savedData) as Account[];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: Account[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  notifyLocalStorageChange(STORAGE_KEY);
}