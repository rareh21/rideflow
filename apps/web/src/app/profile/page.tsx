"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

type AuthenticatedUser = {
  userId: string;
  role: "RIDER" | "DRIVER" | "ADMIN";
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthenticatedUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const response =
          await getCurrentUser();

        setUser(response.user);
      } catch {
        setError("You are not authenticated.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="p-8">
        Loading profile...
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            {error}
          </p>

          <Link
            href="/login"
            className="mt-4 inline-block underline"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Profile
          </h1>

          <button
            onClick={handleLogout}
            className="rounded-md border px-4 py-2"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 rounded-xl border p-6">
          <p>
            <strong>User ID:</strong>{" "}
            {user.userId}
          </p>

          <p className="mt-2">
            <strong>Role:</strong>{" "}
            {user.role}
          </p>
        </div>
      </div>
    </main>
  );
}