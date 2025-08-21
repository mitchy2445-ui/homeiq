import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HOMEIQ — Smarter Rentals",
  description: "Find smarter rentals with video tours, verified landlords, and instant messaging.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Header />
        <main className="pt-4 md:pt-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
