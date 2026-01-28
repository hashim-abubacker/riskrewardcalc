"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                const data = await res.json();
                setError(data.error || "Something went wrong");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-semibold text-white mb-4">Invalid Link</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            This password reset link is invalid or has expired.
                        </p>
                        <Link
                            href="/portal/auth/forgot-password"
                            className="text-emerald-500 hover:text-emerald-400 text-sm"
                        >
                            Request a new reset link →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                        <div className="text-4xl mb-4">✅</div>
                        <h2 className="text-xl font-semibold text-white mb-4">Password Updated!</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Your password has been successfully reset.
                        </p>
                        <Link
                            href="/portal/auth/signin"
                            className="inline-block py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-white font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">New Password</h1>
                    <p className="text-gray-400 text-sm">Enter your new password</p>
                </div>

                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm text-gray-400 mb-2">
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm text-gray-400 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-white font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50"
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
