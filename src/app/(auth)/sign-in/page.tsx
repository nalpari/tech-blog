import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "sign in",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-[380px] space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
            sign in
          </h1>
          <p className="text-sm text-muted">welcome back to techlog</p>
        </div>

        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
