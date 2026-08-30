import { AuthHeader } from "@/components/auth/auth-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="rounded-[28px] border border-rf-border bg-white p-6 shadow-[0_20px_60px_rgba(7,20,31,0.08)] sm:p-8">
        <AuthHeader title="Welcome back" description="Sign in to continue your journey." />
        <LoginForm />
      </div>
    </AuthShell>
  );
}
