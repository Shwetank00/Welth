// components/Header.jsx  (SERVER component — no "use client")
import { auth } from "@clerk/nextjs/server";
import { checkUser } from "@/lib/checkUser";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  // Your server-side logic stays here
  await checkUser();

  // Read server-side auth (works in prod even if client is still hydrating)
  const { userId } = await auth();

  // Pass initial status to the client component to avoid "Login" flash
  return <HeaderClient initialSignedIn={!!userId} />;
}
