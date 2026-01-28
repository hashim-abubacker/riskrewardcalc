// This layout bypasses the main portal layout's auth check
// to prevent redirect loops on the signin page

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
