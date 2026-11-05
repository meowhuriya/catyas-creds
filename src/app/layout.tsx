import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import { DataStoreProvider } from "@/lib/repository";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { AppShell } from "@/components/shell/app-shell";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valeria's Creds — Academic Learning Portal",
  description:
    "A university-grade learning portal where students organize YouTube lectures into credit-bearing coursework, complete rigorous assessments, and earn verifiable credentials.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.ico",
    apple: "/cat-icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="obsidian"
      className={`${fraunces.variable} ${plusJakartaSans.variable} dark antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem("app_theme") || "obsidian";
                  document.documentElement.setAttribute("data-theme", t);
                  if (t === "obsidian") {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch (e) {
                  document.documentElement.setAttribute("data-theme", "obsidian");
                  document.documentElement.classList.add("dark");
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..800&family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen text-[var(--color-ink)] font-sans">
        <DataStoreProvider>
          <ToastProvider>
            <ThemeProvider>
              <AppShell>{children}</AppShell>
            </ThemeProvider>
          </ToastProvider>
        </DataStoreProvider>
      </body>
    </html>
  );
}
