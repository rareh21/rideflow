import { AuthProvider } from "@/context/auth-context";
import "./globals.css";
import { AuthorizationProvider } from "@/components/auth/authorization-context";
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
                        {children}
                    </AuthorizationProvider>
                </AuthProvider>
            </body>
        </html>
    );
}