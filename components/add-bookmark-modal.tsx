"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookmarkAdded: () => void;
}

const CATEGORIES = [
  "Work",
  "Favorites",
  "Personal",
  "Reading",
  "Shopping",
  "Social",
  "Other",
];

export function AddBookmarkModal({
  isOpen,
  onClose,
  onBookmarkAdded,
}: AddBookmarkModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Other");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Normalize and validate URL: ensure protocol present and encode to preserve special chars
      let finalUrl = url.trim();
      if (!finalUrl) {
        setError("Please enter a URL");
        setIsLoading(false);
        return;
      }
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      try {
        finalUrl = encodeURI(finalUrl);
        // validate parsed URL
        // eslint-disable-next-line no-new
        new URL(finalUrl);
      } catch (err) {
        setError("Please enter a valid URL");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          url: finalUrl,
          category,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add bookmark");
      }

      setTitle("");
      setUrl("");
      setCategory("Other");
      onBookmarkAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Bookmark</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="URL (e.g. https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between"
            >
              <span className="text-gray-900">{category}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 ${
                      category === cat
                        ? "bg-purple-50 text-purple-600 font-medium"
                        : "text-gray-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded-lg font-semibold mt-6"
          >
            {isLoading ? "Adding..." : "Add Bookmark"}
          </Button>
        </form>
      </div>
    </div>
  );
}
