import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoleRoute } from "@/components/auth/role-route";
import { BookingProvider } from "@/context/booking-context";

export default function RiderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={["RIDER"]}>
        <BookingProvider>
          {children}
        </BookingProvider>
      </RoleRoute>
    </ProtectedRoute>
  );
}