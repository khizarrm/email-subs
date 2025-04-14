"use client"

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const message = {
    gmail_access_required: "Please allow Gmail access to continue using SubTracker.",
    default: "Something went wrong during sign-in. Please try again.",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">Sign-in Error</h1>
      <p className="mb-6">
        {message[reason as keyof typeof message] ?? message.default}
      </p>
      <a
        href="/api/auth/signin"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Try signing in again
      </a>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
