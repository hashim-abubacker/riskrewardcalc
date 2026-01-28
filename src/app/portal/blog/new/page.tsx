"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/ImageUploader";

export default function NewPostPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        featuredImage: "",
        published: false,
        scheduledFor: "",
    });
    const [isScheduling, setIsScheduling] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/portal/blog");
                router.refresh();
            } else {
                alert("Failed to create post");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating post");
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = () => {
        const slug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        setFormData({ ...formData, slug });
    };

    const handleImageUpload = (markdown: string) => {
        // Insert markdown at cursor position or append to content
        const textarea = contentRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent =
                formData.content.substring(0, start) +
                "\n" + markdown + "\n" +
                formData.content.substring(end);
            setFormData({ ...formData, content: newContent });

            // Set cursor after inserted text
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + markdown.length + 2, start + markdown.length + 2);
            }, 0);
        } else {
            setFormData({ ...formData, content: formData.content + "\n" + markdown + "\n" });
        }
    };

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">New Blog Post</h1>
                <p className="text-sm text-gray-400">Create a new blog post</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Title *</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        onBlur={generateSlug}
                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="My Awesome Blog Post"
                    />
                </div>

                {/* Slug */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Slug *</label>
                    <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                        placeholder="my-awesome-blog-post"
                    />
                    <p className="text-xs text-gray-600 mt-1">URL: /blog/{formData.slug || "..."}</p>
                </div>

                {/* Excerpt */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Excerpt</label>
                    <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        rows={2}
                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                        placeholder="A short summary of your post..."
                    />
                </div>

                {/* Featured Image */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Featured Image</label>
                    <ImageUploader onUpload={(markdown, url) => setFormData({ ...formData, featuredImage: url })} />
                    {formData.featuredImage && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Preview:</p>
                            <img src={formData.featuredImage} alt="Featured" className="h-32 rounded object-cover" />
                        </div>
                    )}
                </div>

                {/* Content Image Upload Helper */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Add Image to Content</label>
                    <ImageUploader onUpload={handleImageUpload} />
                </div>

                {/* Content */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Content (Markdown) *</label>
                    <textarea
                        ref={contentRef}
                        required
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={15}
                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 resize-none"
                        placeholder="# Your content here..."
                    />
                </div>

                {/* Published Toggle */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.published && !isScheduling}
                            disabled={isScheduling}
                            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                            className="w-5 h-5 rounded bg-[#0D0D0D] border-[#3A3A3A] text-emerald-500 focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                        />
                        <div>
                            <span className="text-white font-medium">Publish immediately</span>
                            <p className="text-xs text-gray-500">Make this post visible to the public right now</p>
                        </div>
                    </label>
                </div>

                {/* Schedule Post Toggle */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                            type="checkbox"
                            checked={isScheduling}
                            onChange={(e) => {
                                setIsScheduling(e.target.checked);
                                if (e.target.checked) {
                                    setFormData({ ...formData, published: false });
                                } else {
                                    setFormData({ ...formData, scheduledFor: "" });
                                }
                            }}
                            className="w-5 h-5 rounded bg-[#0D0D0D] border-[#3A3A3A] text-emerald-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <div>
                            <span className="text-white font-medium">Schedule for later</span>
                            <p className="text-xs text-gray-500">Set a date and time to auto-publish this post</p>
                        </div>
                    </label>
                    {isScheduling && (
                        <div className="mt-3 pt-3 border-t border-[#3A3A3A]">
                            <label className="block text-sm text-gray-400 mb-2">Publish Date & Time</label>
                            <input
                                type="datetime-local"
                                value={formData.scheduledFor}
                                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                                className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                            <p className="text-xs text-gray-600 mt-1">Post will be automatically published at this time</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-white font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Post"}
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
