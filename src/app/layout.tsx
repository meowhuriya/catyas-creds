import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "@/styles/globals.css";
import { DataStoreProvider } from "@/lib/repository";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { AppShell } from "@/components/shell/app-shell";

// Headings: Inter Tight (crisp, modern). Body: Inter.
const display = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

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
      className={`${display.variable} ${body.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
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
