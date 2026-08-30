import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleRoute } from "@/components/auth/role-route";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={["ADMIN"]}>
        {children}
      </RoleRoute>
    </ProtectedRoute>
  );
}