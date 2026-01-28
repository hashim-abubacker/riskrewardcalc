"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFAQPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        order: 0,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/faqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/portal/faq");
                router.refresh();
            } else {
                alert("Failed to create FAQ");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating FAQ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">New FAQ</h1>
                <p className="text-sm text-gray-400">Create a new frequently asked question</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Question */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Question *</label>
                    <input
                        type="text"
                        required
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="How do I calculate my position size?"
                    />
                </div>

                {/* Answer */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Answer *</label>
                    <textarea
                        required
                        value={formData.answer}
                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        rows={6}
                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                        placeholder="Enter your balance and risk percentage..."
                    />
                </div>

                {/* Order */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Order (Display Priority)</label>
                    <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0"
                    />
                    <p className="text-xs text-gray-600 mt-1">Lower numbers appear first</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-white font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create FAQ"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-transparent border border-[#3A3A3A] rounded-lg text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
