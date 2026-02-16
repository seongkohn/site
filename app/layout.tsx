import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";
import { isIndexingEnabled } from "@/lib/site-visibility";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.seongkohn.com";
const INDEXING_ENABLED = isIndexingEnabled();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "성곤무역(주) | Seongkohn Traders Corp.",
    template: "%s | 성곤무역",
  },
  description:
    "Korea's trusted distributor of pathology laboratory instruments since 1988. Epredia, 3DHISTECH, Hologic, Grundium, Milestone, Biocartis.",
  keywords: [
    "pathology",
    "laboratory instruments",
    "histology",
    "cytology",
    "digital pathology",
    "tissue processor",
    "slide scanner",
    "molecular diagnostics",
    "병리",
    "조직병리",
    "세포병리",
    "실험 장비",
    "병리 장비",
    "디지털 병리",
    "성곤무역",
    "Seongkohn",
    "Epredia",
    "3DHISTECH",
    "Hologic",
    "Grundium",
    "Milestone",
    "Biocartis",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    siteName: "성곤무역(주) | Seongkohn Traders Corp.",
    title: "성곤무역(주) | Seongkohn Traders Corp.",
    description:
      "Korea's trusted distributor of pathology laboratory instruments since 1988.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: INDEXING_ENABLED
    ? {
      index: true,
      follow: true,
    }
    : {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${inter.variable} ${notoSansKR.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "성곤무역(주)",
              alternateName: "Seongkohn Traders Corp.",
              url: SITE_URL,
              description:
                "Korea's trusted distributor of pathology laboratory instruments since 1988.",
              foundingDate: "1988",
              address: {
                "@type": "PostalAddress",
                addressCountry: "KR",
              },
              sameAs: [],
            }),
          }}
        />
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
