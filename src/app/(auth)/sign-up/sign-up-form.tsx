"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleOAuthSignUp() {
    setIsOAuthLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setIsOAuthLoading(false);
      setError("Google 로그인 중 오류가 발생했습니다.");
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-accent/30 bg-accent/5">
          <p className="text-accent text-sm font-mono">
            {"// 확인 이메일을 보냈습니다"}
          </p>
          <p className="text-muted text-sm font-sans mt-1">
            이메일의 링크를 클릭하여 계정을 활성화해 주세요.
          </p>
        </div>
        <button
          onClick={() => router.push("/sign-in")}
          className="text-sm font-mono text-accent hover:underline transition-colors cursor-pointer"
        >
          &gt; sign_in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* OAuth */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleOAuthSignUp}
          disabled={isOAuthLoading || loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border bg-background hover:bg-card-hover text-foreground text-sm font-mono transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {isOAuthLoading ? "connecting..." : "google"}
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground font-mono">
            or
          </span>
        </div>
      </div>

      {/* Email form */}
      <form onSubmit={handleSignUp} className="space-y-4">
        {error && (
          <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-sans">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-mono text-muted">
            email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3 py-2.5 border border-border bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-mono text-muted">
            password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="최소 6자 이상"
            required
            className="w-full px-3 py-2.5 border border-border bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirm-password"
            className="text-xs font-mono text-muted"
          >
            confirm_password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호 확인"
            required
            className="w-full px-3 py-2.5 border border-border bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 text-sm font-mono border border-accent bg-accent text-background hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "creating..." : "create account"}
        </button>
      </form>

      <p className="text-center text-sm font-sans text-muted-foreground">
        {"already have an account? "}
        <Link
          href="/sign-in"
          className="text-accent hover:underline transition-colors"
        >
          sign in
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
