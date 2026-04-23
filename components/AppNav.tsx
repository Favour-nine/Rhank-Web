"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AppNav({ variant = "blue" }: { variant?: "blue" | "yellow" }) {
  const path = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const yellow = variant === "yellow";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className={`sticky top-0 z-20 backdrop-blur-md ${yellow ? "bg-[#ffe600]" : "bg-[#1a5fff]/80"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/demo" className="flex items-center" style={{ height: 24 }}>
          <Image
            src={yellow ? "/Rhank_Black.svg" : "/Rhank_White.svg"}
            alt="Rhank"
            width={80}
            height={24}
            style={{ height: 24, width: "auto" }}
          />
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-4 text-[11px] font-medium tracking-[0.26em] uppercase">
          {path !== "/rhanks" && (
            <Link
              href="/rhanks"
              className={`transition-colors ${yellow ? "text-black/50 hover:text-black" : "text-white/50 hover:text-white"}`}
            >
              Browse
            </Link>
          )}

          {user ? (
            <>
              {path !== "/rhanks/new" && (
                <Link
                  href="/rhanks/new"
                  className={`border px-5 py-2.5 transition-colors duration-200 ${yellow
                    ? "border-black/25 text-black hover:bg-black hover:text-[#ffe600]"
                    : "border-white/25 text-white hover:bg-white hover:text-[#1a5fff]"
                  }`}
                >
                  + Create
                </Link>
              )}

              {/* User avatar + dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className={`flex items-center gap-2 transition-colors ${yellow ? "text-black/60 hover:text-black" : "text-white/60 hover:text-white"}`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${yellow ? "bg-black text-[#ffe600]" : "bg-white text-[#1a5fff]"}`}>
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-[11px] tracking-[0.2em]">{displayName}</span>
                </button>
                {open && (
                  <div className={`absolute right-0 top-full mt-2 w-48 border py-1 z-30 ${yellow ? "bg-[#ffe600] border-black/15" : "bg-[#1450d8] border-white/15"}`}>
                    <div className={`px-4 py-2 text-[10px] tracking-[0.18em] uppercase border-b mb-1 truncate ${yellow ? "text-black/30 border-black/10" : "text-white/30 border-white/10"}`}>
                      {user?.email}
                    </div>
                    <Link
                      href="/my-rhanks"
                      onClick={() => setOpen(false)}
                      className={`block w-full px-4 py-2.5 text-[11px] tracking-[0.18em] uppercase transition-colors ${yellow ? "text-black/70 hover:text-black hover:bg-black/5" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                    >
                      My Rhanks
                    </Link>
                    <button
                      onClick={() => { setOpen(false); handleSignOut(); }}
                      className={`w-full text-left px-4 py-2.5 text-[11px] tracking-[0.18em] uppercase transition-colors ${yellow ? "text-black/70 hover:text-black hover:bg-black/5" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`transition-colors ${yellow ? "text-black/60 hover:text-black" : "text-white/60 hover:text-white"}`}
              >
                Sign in
              </Link>
              {path !== "/rhanks/new" && (
                <Link
                  href="/rhanks/new"
                  className={`border px-5 py-2.5 transition-colors duration-200 ${yellow
                    ? "border-black/25 text-black hover:bg-black hover:text-[#ffe600]"
                    : "border-white/25 text-white hover:bg-white hover:text-[#1a5fff]"
                  }`}
                >
                  + Create
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
