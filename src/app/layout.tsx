import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { ActiveDatasetProvider } from "@/components/active-dataset-provider";
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
  title: {
    default: "AI FinOps Copilot",
    template: "%s · AI FinOps Copilot",
  },
  description:
    "Turn cloud cost signals into prioritized, explainable, owner-aware FinOps action plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ActiveDatasetProvider>
          <AppShell>{children}</AppShell>
        </ActiveDatasetProvider>
      </body>
    </html>
  );
}
