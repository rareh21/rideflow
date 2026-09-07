"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

export function LoginForm() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Enter your email and password to continue.");
            return;
        }

        setLoading(true);
        try {
            const response = await login(email.trim(), password);
            sessionStorage.setItem("accessToken", response.accessToken);
            switch (response.user.role) {
                case "DRIVER":
                    router.replace("/driver");
                    break;

                case "ADMIN":
                    router.replace("/admin");
                    break;

                default:
                    router.replace("/rider");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "We couldn't sign you in. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-semibold">Email</label>
                <Input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
            </div>

            <div>
                <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="login-password" className="text-sm font-semibold">Password</label>
                    <button type="button" className="text-xs font-semibold text-rf-green-dark hover:underline" onClick={() => setError("Password reset will be added in the next auth step.")}>Forgot password?</button>
                </div>
                <Input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} />
            </div>

            {error && (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                    {error}
                </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing you in..." : "Sign in"}
            </Button>

            <p className="text-center text-sm text-rf-muted">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-rf-green-dark hover:underline">Create account</Link>
            </p>
        </form>
    );
}
