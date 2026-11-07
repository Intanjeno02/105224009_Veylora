"use client";

import { createContext, useContext, type ReactNode } from "react";

const UserIdContext = createContext<string | null>(null);

export function UserIdProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return (
    <UserIdContext.Provider value={userId}>
      {children}
    </UserIdContext.Provider>
  );
}

export function useUserId(): string {
  const userId = useContext(UserIdContext);

  if (!userId) {
    throw new Error("User ID tidak tersedia pada halaman terproteksi.");
  }

  return userId;
}
