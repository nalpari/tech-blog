import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "sign in",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-[400px] space-y-8 animate-fade-in-up">
        <div className="space-y-2">
          <h1 className="text-xl font-mono font-bold text-foreground">
            <span className="text-accent">&gt;</span> sign_in
          </h1>
          <p className="text-sm font-sans text-muted">
            {"// welcome back to techlog"}
          </p>
        </div>

        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
