import type { Metadata } from "next";
import "@/styles/globals.css";
import { DataStoreProvider } from "@/lib/repository";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = {
  title: "Valeria's Creds — Academic Learning Portal",
  description:
    "A university-grade learning portal where students organize YouTube lectures into credit-bearing coursework, complete rigorous assessments, and earn verifiable credentials.",
  icons: {
    icon: [
      { url: "/brand/butterfly-real-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/butterfly-real-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/brand/butterfly-real-180.png",
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
      data-theme="pearl"
      className="antialiased"
      suppressHydrationWarning
    >
      <head>
        {/* Fonts load in the browser (not at build time), so a Google Fonts hiccup can never break a deploy. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var d = document.documentElement;
                try {
                  var m = localStorage.getItem("vc_mode") === "dark" ? "dark" : "light";
                  d.setAttribute("data-theme", m === "dark" ? "clove" : "pearl");
                  if (m === "dark") d.classList.add("dark"); else d.classList.remove("dark");
                  var v = JSON.parse(localStorage.getItem("vc_accent_vars") || "null");
                  if (v) for (var k in v) d.style.setProperty(k, v[k]);
                } catch (e) {
                  d.setAttribute("data-theme", "pearl");
                }
              })();
            `,
          }}
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
