import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleRoute } from "@/components/auth/role-route";

export default function DriverLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={["DRIVER"]}>
        {children}
      </RoleRoute>
    </ProtectedRoute>
  );
}