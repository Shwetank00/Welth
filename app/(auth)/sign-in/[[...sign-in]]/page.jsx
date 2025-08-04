"use client";

import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function SignInPage() {
  return (
    <>
      {/* Show the form only to guests */}
      <SignedOut>
        <SignIn fallbackRedirectUrl="/dashboard" />
      </SignedOut>

      {/* If a session already exists, send the user away once */}
      <SignedIn>{redirect("/dashboard")}</SignedIn>
    </>
  );
}
