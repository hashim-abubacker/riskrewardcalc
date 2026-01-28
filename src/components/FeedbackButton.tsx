"use client";

import { useState } from "react";

export function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [honeypot, setHoneypot] = useState(""); // Bot trap
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            setStatus({ type: 'error', message: 'Please enter your feedback' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    message: message.trim(),
                    website: honeypot, // Honeypot
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: 'Thank you for your feedback!' });
                setEmail("");
                setMessage("");
                setTimeout(() => {
                    setIsOpen(false);
                    setStatus(null);
                }, 2000);
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to send feedback' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Feedback Button */}
            {/* Feedback Button - Icon Style */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-[#27272A] rounded-lg transition-all"
                title="Send Feedback"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Send Feedback</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-400 mb-6">
                            We'd love to hear your thoughts, suggestions, or any issues you've encountered.
                        </p>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email (Optional) */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Email <span className="text-gray-600">(optional)</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                                <p className="text-xs text-gray-600 mt-1">So we can respond to you</p>
                            </div>

                            {/* Message (Required) */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us what you think..."
                                    rows={4}
                                    required
                                    className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                                />
                            </div>

                            {/* Honeypot (Hidden from humans, visible to bots) */}
                            <input
                                type="text"
                                name="website"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                            />

                            {/* Status Message */}
                            {status && (
                                <div className={`text-sm p-3 rounded-lg ${status.type === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/30'
                                    }`}>
                                    {status.message}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2 bg-transparent border border-[#3A3A3A] rounded-lg text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !message.trim()}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-white font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
