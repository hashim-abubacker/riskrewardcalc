"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { ImageUploader } from "@/components/ImageUploader";

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featuredImage: string | null;
    published: boolean;
    scheduledFor: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [post, setPost] = useState<Post | null>(null);
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

    useEffect(() => {
        fetchPost();
    }, []);

    const fetchPost = async () => {
        try {
            const res = await fetch(`/api/posts/${id}`);
            if (!res.ok) {
                notFound();
                return;
            }
            const data = await res.json();
            setPost(data);
            const scheduledForValue = data.scheduledFor ? new Date(data.scheduledFor).toISOString().slice(0, 16) : "";
            setFormData({
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt || "",
                content: data.content,
                featuredImage: data.featuredImage || "",
                published: data.published,
                scheduledFor: scheduledForValue,
            });
            setIsScheduling(!!data.scheduledFor);
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
            const res = await fetch(`/api/posts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/portal/blog");
                router.refresh();
            } else {
                alert("Failed to update post");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating post");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/portal/blog");
                router.refresh();
            } else {
                alert("Failed to delete post");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting post");
        }
    };

    const handleImageUpload = (markdown: string) => {
        const textarea = contentRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent =
                formData.content.substring(0, start) +
                "\n" + markdown + "\n" +
                formData.content.substring(end);
            setFormData({ ...formData, content: newContent });

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + markdown.length + 2, start + markdown.length + 2);
            }, 0);
        } else {
            setFormData({ ...formData, content: formData.content + "\n" + markdown + "\n" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    if (!post) {
        notFound();
        return null;
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Edit Post</h1>
                <p className="text-sm text-gray-400">Update your blog post</p>
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
                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500"
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
                    />
                </div>

                {/* Excerpt */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                    <label className="block text-sm text-gray-400 mb-2">Excerpt</label>
                    <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        rows={2}
                        className="w-full bg-[#0D0D0D] border border-[#3A3A3A] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
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
                            <span className="text-white font-medium">Published</span>
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
                <div className="flex items-center justify-between pt-4">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-6 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                        Delete Post
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
