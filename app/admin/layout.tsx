import type { Metadata, Viewport } from "next";
import { Alexandria, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./admin.css";

const display = Alexandria({ subsets: ["arabic", "latin"], variable: "--font-alexandria", display: "swap" });
const body = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard" },
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: [{ url: "/favicon.png", type: "image/png" }] },
};

export const viewport: Viewport = { themeColor: "#002933", colorScheme: "light" };

/** The content management dashboard (separate from the public website's layout). */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" dir="ltr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
