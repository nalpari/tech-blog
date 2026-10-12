import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "sign up",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-[380px] space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
            create account
          </h1>
          <p className="text-sm text-muted">join techlog and start exploring</p>
        </div>

        <SignUpForm />
      </div>
    </div>
  );
}
