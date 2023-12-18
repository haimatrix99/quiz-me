"use client";

import React, { use } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

import Logo from "./Logo";
import Container from "../Container";
import MobileNav from "./MobileNav";
import Upgrade from "./Upgrade";
import Subscription from "./Subscription";
import { Button } from "../ui/button";

export default function Navbar() {
  const { userId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="sticky z-50 h-14 inset-x-0 top-0 w-full bg-white border-b border-gray-200 transition-all">
      <Container>
        <div className="h-14 flex justify-between items-center gap-4">
          <Logo />
          {userId ? (
            <div className="flex items-center gap-6 text-[14px] font-medium">
              <div
                className="cursor-pointer"
                onClick={() => {
                  pathname === "/dashboard"
                    ? router.refresh()
                    : router.push("/dashboard");
                }}
              >
                Dashboard
              </div>
              {true ? <Upgrade /> : <Subscription />}
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <>
              <MobileNav />
              <div className="hidden md:flex items-center gap-4 text-zinc-900 font-[600] text-[14px]">
                <Link href="/pricing">Pricing</Link>
                <Link href="/sign-in">Sign In</Link>
                <Link href="/sign-up">
                  <div className="flex items-center gap-2 px-4 py-2 border-2 border-zinc-900 rounded-lg">
                    Get Started
                    <ArrowRight />
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </Container>
    </nav>
  );
}
