import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { HandHelping } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link href="/browse" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white">
            <HandHelping size={20} />
          </span>
          <span className="text-lg font-semibold">LendLoop</span>
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
