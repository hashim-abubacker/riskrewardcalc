"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";

interface FAQ {
    id: string;
    question: string;
    answer: string;
    order: number;
}

export default function EditFAQPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [faq, setFaq] = useState<FAQ | null>(null);
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        order: 0,
    });

    useEffect(() => {
        fetchFAQ();
    }, []);

    const fetchFAQ = async () => {
        try {
            const res = await fetch(`/api/faqs/${id}`);
            if (!res.ok) {
                notFound();
                return;
            }
            const data = await res.json();
            setFaq(data);
            setFormData({
                question: data.question,
                answer: data.answer,
                order: data.order,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/faqs/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/portal/faq");
                router.refresh();
            } else {
                alert("Failed to update FAQ");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating FAQ");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this FAQ?")) return;

        try {
            const res = await fetch(`/api/faqs/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/portal/faq");
                router.refresh();
            } else {
                alert("Failed to delete FAQ");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting FAQ");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    if (!faq) {
        notFound();
        return null;
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Edit FAQ</h1>
                <p className="text-sm text-gray-400">Update this FAQ</p>
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
                    />
                    <p className="text-xs text-gray-600 mt-1">Lower numbers appear first</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-6 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                        Delete FAQ
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 bg-transparent border border-[#3A3A3A] rounded-lg text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-white font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
