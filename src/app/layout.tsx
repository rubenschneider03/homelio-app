import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Homelio – Der vorgelagerte Wohnungsmarkt",
  description:
    "Finde deine nächste Wohnung, bevor sie ausgeschrieben wird. Homelio vernetzt wechselwillige Mieter frühzeitig – kostenlos und datenschutzkonform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-white font-sans">{children}</body>
    </html>
  );
}
