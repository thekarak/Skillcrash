import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "SkillCrash — Adversarial crash-testing for AI Agent Skills",
  description:
    "Stress-test AI Agent Skills with adversarial prompts, safe simulated execution, and evidence-backed verdicts.",
  keywords: [
    "SkillCrash",
    "AI agent testing",
    "adversarial testing",
    "agent skills",
    "deterministic evaluation",
    "Redtoken",
  ],
  authors: [{ name: "Redtoken" }],
  icons: {
    icon: "/skillcrash.svg",
  },
  openGraph: {
    title: "SkillCrash — Find the failure path before your agent ships",
    description:
      "Adversarial crash-testing for AI Agent Skills: hostile prompts, mock-only execution, deterministic verdicts.",
    siteName: "SkillCrash",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#171613",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
