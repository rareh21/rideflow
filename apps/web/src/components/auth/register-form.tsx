"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace("/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="register-name" className="mb-2 block text-sm font-semibold">Full name</label>
        <Input id="register-name" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="register-email" className="mb-2 block text-sm font-semibold">Email</label>
        <Input id="register-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="register-password" className="mb-2 block text-sm font-semibold">Password</label>
        <Input id="register-password" type="password" autoComplete="new-password" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label htmlFor="register-confirm" className="mb-2 block text-sm font-semibold">Confirm password</label>
        <Input id="register-confirm" type="password" autoComplete="new-password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{error}</div>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating your account..." : "Create account"}
      </Button>

      <p className="pt-2 text-center text-sm text-rf-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-rf-green-dark hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
