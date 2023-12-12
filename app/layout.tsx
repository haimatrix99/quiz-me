import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

import ClientOnly from "@/components/ClientOnly";
import ToastProvider from "@/providers/ToastProvider";
import Navbar from "@/components/navbar/Navbar";
import Container from "@/components/Container";
import TRPCProvider from "@/providers/TRPCProvider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quiz Me",
  description: "Generate quiz from video",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <TRPCProvider>
          <body className={cn("h-screen", inter.className)}>
            <ClientOnly>
              <ToastProvider />
              <Navbar />
              <Container>{children}</Container>
            </ClientOnly>
          </body>
        </TRPCProvider>
      </html>
    </ClerkProvider>
  );
}
