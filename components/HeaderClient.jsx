"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";

export default function HeaderClient({ initialSignedIn = false }) {
  const { isLoaded, isSignedIn } = useAuth();
  const authed = isLoaded ? isSignedIn : initialSignedIn; // avoids flicker/mismatch

  return (
    <div className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container flex items-center py-4 px-4 mx-auto justify-between">
        <Link href="/">
          <Image
            src="/logo.png"
            height={60}
            width={200}
            alt="Logo"
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex items-center space-x-4">
          {authed ? (
            <>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <Button variant="outline" className="flex items-center gap-2">
                  <LayoutDashboard size={18} />
                  <span className="hidden md:inline">Dashboard</span>
                </Button>
              </Link>

              <Link href="/transaction/create">
                <Button className="flex items-center gap-2">
                  <PenBox size={18} />
                  <span className="hidden md:inline">Add Transaction</span>
                </Button>
              </Link>

              <UserButton
                appearance={{ elements: { avatarBox: "w-20 h-20" } }}
                afterSignOutUrl="/"
              />
            </>
          ) : (
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">LogIn</Button>
            </SignInButton>
          )}
        </div>
      </nav>
    </div>
  );
}
