import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "@/styles/globals.css";
import { DataStoreProvider } from "@/lib/repository";
import { AppShell } from "@/components/shell/app-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Catya's Creds — Academic Learning Portal",
  description:
    "A university-grade learning portal where students organize YouTube lectures into credit-bearing coursework, complete rigorous assessments, and earn verifiable credentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-app-bg text-app-ink font-sans">
        <DataStoreProvider>
          <AppShell>{children}</AppShell>
        </DataStoreProvider>
      </body>
    </html>
  );
}
