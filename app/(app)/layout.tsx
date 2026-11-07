import AppShell from "@/components/AppShell";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  return <AppShell userId={session.userId}>{children}</AppShell>;
}
