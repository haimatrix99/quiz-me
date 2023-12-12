import React from "react";
import Link from "next/link";
import { UserButton, currentUser } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

import Logo from "./Logo";
import Container from "../Container";
import MobileNav from "./MobileNav";
import Upgrade from "./Upgrade";
import Subscription from "./Subscription";

export default async function Navbar() {
  const user = await currentUser();

  return (
    <nav className="sticky h-14 inset-x-0 top-0 w-full border-b border-gray-200 transition-all">
      <Container>
        <div className="h-14 flex justify-between items-center gap-4">
          <Logo />
          {user ? (
            <div className="flex items-center gap-6 text-[14px] font-medium">
              <Link href="/dashboard">Dashboard</Link>
              {true ? <Upgrade /> : <Subscription />}
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <>
              <MobileNav />
              <div className="hidden md:flex items-center gap-4 text-zinc-900 font-[600] text-[14px]">
                <Link href="/pricing">Pricing</Link>
                <Link href="/sign-in">Sign In</Link>
                <Link href="/sign-in">
                  <div className="flex items-center gap-2 bg-indigo-400 px-4 py-2 border rounded-lg">
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
