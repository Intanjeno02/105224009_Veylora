import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veylora",
  description:
    "Simpan kata sandi dengan aman dan cek keamanan link dalam satu aplikasi.",
};

const themeScript = `
  (function () {
    try {
      var settings = localStorage.getItem("veylora-settings");
      var theme = settings ? JSON.parse(settings).theme : "dark";

      if (theme !== "light" && theme !== "dark") {
        theme = "dark";
      }

      document.documentElement.classList.toggle(
        "dark",
        theme === "dark"
      );

      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}