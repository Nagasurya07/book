"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Plus, LogOut, Folder } from "lucide-react";
import { AddBookmarkModal } from "@/components/add-bookmark-modal";
import { BookmarkCard } from "@/components/bookmark-card";
import { createClient } from "@/lib/supabase/client";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  created_at: string;
  is_favorite?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Bookmarks");

  useEffect(() => {
    fetchUserData();
    fetchBookmarks();
  }, []);

  // Real-time updates via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    let channel: any = null;

    const setupRealtime = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const userId = user.id;

        channel = supabase
          .channel("public:bookmarks")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "bookmarks",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              setBookmarks((prev) => {
                if (prev.find((b) => b.id === payload.new.id)) return prev;
                return [payload.new, ...prev];
              });
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "bookmarks",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              setBookmarks((prev) =>
                prev.map((b) => (b.id === payload.new.id ? payload.new : b)),
              );
            },
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "bookmarks",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              setBookmarks((prev) =>
                prev.filter((b) => b.id !== payload.old.id),
              );
            },
          );

        await channel.subscribe();
      } catch (err) {
        console.error("Realtime setup error:", err);
      }
    };

    setupRealtime();

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (err) {
        // ignore
      }
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/user");
      if (response.ok) {
        const data = await response.json();
        const name =
          data.user?.user_metadata?.name ||
          data.user?.email?.split("@")[0] ||
          "User";
        setUserName(name);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/bookmarks");
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data);
      } else if (response.status === 401) {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleBookmarkAdded = () => {
    fetchBookmarks();
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesSearch =
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "All Bookmarks" ||
      bookmark.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFavoriteToggle = async (id: string, newValue: boolean) => {
    try {
      await fetch("/api/bookmarks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_favorite: newValue }),
      });
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_favorite: newValue } : b)),
      );
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Error deleting bookmark:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white">
              <span className="text-lg font-bold">📌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">BookmarkHub</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Hi, {userName}</span>
            <button
              onClick={handleSignOut}
              className="ml-4 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option>All Bookmarks</option>
            <option>Work</option>
            <option>Personal</option>
            <option>Reading</option>
            <option>Shopping</option>
            <option>Social</option>
            <option>Other</option>
          </select>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Bookmark
          </Button>
        </div>

        {/* Bookmarks Grid or Empty State */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading bookmarks...</p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-lg border border-gray-200">
            <Folder className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No bookmarks found
            </h2>
            <p className="text-gray-500">
              {searchQuery || filterCategory !== "All Bookmarks"
                ? "Try adjusting your search or filters"
                : "Add your first bookmark to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                id={bookmark.id}
                title={bookmark.title}
                url={bookmark.url}
                category={bookmark.category}
                isFavorite={bookmark.is_favorite}
                onFavoriteToggle={handleFavoriteToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <AddBookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBookmarkAdded={handleBookmarkAdded}
      />
    </div>
  );
}
