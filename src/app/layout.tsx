import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://homelio.ch'),
  title: 'Homelio – Der unsichtbare Wohnungsmarkt der Schweiz',
  description:
    'Homelio verbindet wechselwillige Mieter frühzeitig und macht passende Wohnungswechsel möglich, bevor Wohnungen öffentlich ausgeschrieben werden.',
  openGraph: {
    title: 'Homelio – Der unsichtbare Wohnungsmarkt der Schweiz',
    description:
      'Homelio verbindet wechselwillige Mieter frühzeitig und macht passende Wohnungswechsel möglich, bevor Wohnungen öffentlich ausgeschrieben werden.',
    url: 'https://homelio.ch',
    siteName: 'Homelio',
    locale: 'de_CH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Homelio – Der unsichtbare Wohnungsmarkt der Schweiz',
    description:
      'Homelio verbindet wechselwillige Mieter frühzeitig und macht passende Wohnungswechsel möglich, bevor Wohnungen öffentlich ausgeschrieben werden.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
