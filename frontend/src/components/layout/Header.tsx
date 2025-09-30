"use client";

import Link from "next/link";
import { ROUTES } from "@/constants";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { HeaderRow } from "@/components/layout/HeaderRow";
import { MapPin } from "lucide-react";

export function Header() {
  return (
    <header className="w-full h-16 z-[3] fixed top-0 bg-secondary">
      <HeaderRow
        left={
          <Link href={ROUTES.HOME} className="text-xl font-bold text-blue-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="font-semibold">HikkoshiLens</span>
            </div>
          </Link>
        }
        right={
          <>
            <ModeToggle />
          </>
        }
      />
    </header>
  );
}
