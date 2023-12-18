"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";

const poppins = Montserrat({ weight: "600", subsets: ["latin"] });

export default function Logo() {
  const router = useRouter();
  const { userId } = useAuth();
  const pathname = usePathname();

  return (
    <div
      onClick={() =>
        pathname === "/dashboard"
          ? router.refresh()
          : router.push(userId ? "/dashboard" : "/")
      }
      className={cn(
        "cursor-pointer text-2xl font-semibold text-zinc-900 z-50",
        poppins.className
      )}
    >
      QuizMe
    </div>
  );
}
