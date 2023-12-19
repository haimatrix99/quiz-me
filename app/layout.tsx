import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import { cn } from "@/lib/utils";

import ClientOnly from "@/components/ClientOnly";
import ToastProvider from "@/providers/ToastProvider";
import Navbar from "@/components/navbar/Navbar";
import Container from "@/components/Container";
import TRPCProvider from "@/providers/TRPCProvider";
import { getUserSubscriptionPlan } from "@/lib/stripe";

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
  const { isSubscribed } = await getUserSubscriptionPlan();

  return (
    <ClerkProvider>
      <html lang="en">
        <TRPCProvider>
          <body className={cn("h-screen", inter.className)}>
            <ClientOnly>
              <ToastProvider />
              <Navbar isSubscribed={isSubscribed} />
              <Container>{children}</Container>
            </ClientOnly>
          </body>
        </TRPCProvider>
      </html>
    </ClerkProvider>
  );
}
