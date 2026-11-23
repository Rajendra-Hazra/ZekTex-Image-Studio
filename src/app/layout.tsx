import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZekTex Image Studio — Local Image Converter & Optimizer",
  description:
    "Internal browser-based image converter, compressor, resizer, and OmiBay optimization toolkit by ZekTex Pvt. Ltd. 100% local processing with zero server uploads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#FAFAFB] text-[#09090B] antialiased selection:bg-[#EEF2FF] selection:text-[#4F46E5]">
        {children}
      </body>
    </html>
  );
}
