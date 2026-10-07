import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "JomBit — Split the bill in seconds. Settle with DuitNow.",
    template: "%s · JomBit",
  },
  description:
    "Scan a receipt, split it with friends, and settle up with a pre-filled DuitNow QR. A BFM3130 student proof of concept.",
  applicationName: "JomBit",
  openGraph: {
    title: "JomBit — Split the bill in seconds",
    description: "Scan a receipt, split it with friends, settle with DuitNow. Student proof of concept.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#151515",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
