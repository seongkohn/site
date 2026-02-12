import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: {
    default: "Seongkohn Traders Corp. | 성곤무역(주)",
    template: "%s | Seongkohn Traders",
  },
  description:
    "Korea's trusted distributor of pathology laboratory instruments since 1988. Epredia, 3DHISTECH, Hologic, Grundium.",
  keywords: [
    "pathology",
    "laboratory instruments",
    "병리",
    "실험 장비",
    "성곤무역",
    "Seongkohn",
    "Epredia",
    "3DHISTECH",
    "Hologic",
    "Grundium",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${inter.variable} ${notoSansKR.variable}`}>
      <body className="antialiased">
        <LanguageProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <SearchBar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
