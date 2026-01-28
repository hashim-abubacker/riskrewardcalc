import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { auth } from "@/auth";

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // If no session, just render children (signin page handles its own layout)
    // Middleware handles the redirect for protected routes
    if (!session) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-[#0D0D0D]">
            {/* Top Bar */}
            <div className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                        <nav className="hidden md:flex items-center gap-4">
                            <Link
                                href="/portal"
                                className="text-sm text-gray-400 hover:text-emerald-500 transition-colors"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/portal/blog"
                                className="text-sm text-gray-400 hover:text-emerald-500 transition-colors"
                            >
                                Blog
                            </Link>
                            <Link
                                href="/portal/faq"
                                className="text-sm text-gray-400 hover:text-emerald-500 transition-colors"
                            >
                                FAQ
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">{session.user?.email}</span>
                        <SignOutButton />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        </div>
    );
}
