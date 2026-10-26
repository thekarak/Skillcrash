import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "SkillCrash", description: "Adversarial crash tests for AI skills" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
