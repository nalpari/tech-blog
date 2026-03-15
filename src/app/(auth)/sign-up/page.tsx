import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "sign up",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="w-full max-w-[400px] space-y-8 animate-fade-in-up">
        <div className="space-y-2">
          <h1 className="text-xl font-mono font-bold text-foreground">
            <span className="text-accent">&gt;</span> create_account
          </h1>
          <p className="text-sm font-sans text-muted">
            {"// join techlog and start exploring"}
          </p>
        </div>

        <SignUpForm />
      </div>
    </div>
  );
}
