"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out?")) {
      void signOut();
    }
  };

  return (
    <button
      className="px-4 py-2 w-full rounded bg-white text-red-500 border border-red-500 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}
