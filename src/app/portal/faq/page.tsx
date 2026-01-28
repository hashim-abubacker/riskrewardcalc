import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function deleteFAQ(id: string) {
    "use server";
    await prisma.fAQ.delete({ where: { id } });
}

export default async function FAQPage() {
    const faqs = await prisma.fAQ.findMany({
        orderBy: { order: "asc" },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">FAQs</h1>
                    <p className="text-sm text-gray-400">Manage frequently asked questions</p>
                </div>
                <Link
                    href="/portal/faq/new"
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-white text-sm font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all"
                >
                    + New FAQ
                </Link>
            </div>

            {/* FAQ List */}
            {faqs.length === 0 ? (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-12 text-center">
                    <p className="text-gray-400 mb-4">No FAQs yet</p>
                    <Link
                        href="/portal/faq/new"
                        className="text-emerald-500 hover:text-emerald-400 text-sm"
                    >
                        Create your first FAQ →
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {faqs.map((faq) => (
                        <Link
                            key={faq.id}
                            href={`/portal/faq/${faq.id}`}
                            className="block bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 hover:border-emerald-500/50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded font-mono">
                                            #{faq.order}
                                        </span>
                                        <h3 className="font-semibold text-white">{faq.question}</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 line-clamp-2">{faq.answer}</p>
                                </div>
                                <div className="text-gray-500 hover:text-emerald-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
