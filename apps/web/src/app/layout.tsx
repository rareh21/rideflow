import { AuthProvider } from "@/context/auth-context";
import "./globals.css";
import { AuthorizationProvider } from "@/components/auth/authorization-context";
import { AppShell } from "@/components/navigation/AppShell";
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <AuthorizationProvider>
                        <AppShell>
                            {children}
                        </AppShell>
                    </AuthorizationProvider>
                </AuthProvider>
            </body>
        </html>
    );
}