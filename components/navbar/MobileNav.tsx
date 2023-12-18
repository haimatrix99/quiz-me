"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Menu } from "lucide-react";

const MobileNav = () => {
  const [isOpen, setOpen] = useState<boolean>(false);

  const toggleOpen = () => setOpen((prev) => !prev);

  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) toggleOpen();
  }, [pathname]);

  const closeOnCurrent = (href: string) => {
    if (pathname === href) {
      toggleOpen();
    }
  };

  return (
    <div className="md:hidden">
      <Menu
        onClick={toggleOpen}
        className="relative z-30 h-8 w-8 text-zinc-700 cursor-pointer"
      />

      {isOpen ? (
        <div className="fixed animate-in slide-in-from-top-5 fade-in-20 inset-0 z-0 w-full">
          <ul className="absolute bg-white border-b border-zinc-200 shadow-xl grid w-full gap-3 px-10 pt-20 pb-8">
            <li>
              <Link
                onClick={() => closeOnCurrent("/pricing")}
                className="flex items-center w-full font-semibold "
                href="/pricing"
              >
                Pricing
              </Link>
            </li>
            <li className="my-3 h-[1px] w-full bg-gray-300" />
            <li>
              <Link
                className="flex items-center w-full font-semibold"
                href="/sign-in"
              >
                Sign in
              </Link>
            </li>
            <li className="my-3 h-[0.5px] w-full bg-gray-300" />
            <li>
              <Link
                className="flex items-center w-full font-semibold text-indigo-500"
                href="/sign-up"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default MobileNav;
