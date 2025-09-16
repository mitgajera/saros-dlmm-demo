
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Saros DLMM Demo",
  description: "Demo: LP positions, one-click rebalance, mini analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="max-w-6xl mx-auto p-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
