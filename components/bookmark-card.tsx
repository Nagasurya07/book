"use client";

import {
  Globe,
  Youtube,
  FileText,
  Link as LinkIcon,
  Music,
  Image as ImageIcon,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface BookmarkCardProps {
  id: string;
  title: string;
  url: string;
  category: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string, newValue: boolean) => void;
  onDelete?: (id: string) => void;
}

function getIconForUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return <Youtube className="w-6 h-6 text-red-500" />;
    }
    if (hostname.includes("github.com")) {
      return <LinkIcon className="w-6 h-6 text-gray-800" />;
    }
    if (hostname.includes("spotify.com") || hostname.includes("music")) {
      return <Music className="w-6 h-6 text-green-500" />;
    }
    return <Globe className="w-6 h-6 text-blue-500" />;
  } catch {
    return <Globe className="w-6 h-6 text-blue-500" />;
  }
}

export function BookmarkCard({
  id,
  title,
  url,
  category,
  isFavorite = false,
  onFavoriteToggle,
  onDelete,
}: BookmarkCardProps) {
  const [hovered, setHovered] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const [faviconError, setFaviconError] = useState(false);
  const truncatedUrl = url.length > 50 ? url.substring(0, 47) + "..." : url;

  const categoryColors: Record<string, string> = {
    Work: "bg-blue-100 text-blue-700",
    Personal: "bg-pink-100 text-pink-700",
    Reading: "bg-yellow-100 text-yellow-700",
    Shopping: "bg-green-100 text-green-700",
    Social: "bg-purple-100 text-purple-700",
    Other: "bg-gray-100 text-gray-700",
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setFavorite((prev) => {
      const newValue = !prev;
      onFavoriteToggle?.(id, newValue);
      return newValue;
    });
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete?.(id);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow bg-white relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {(() => {
            try {
              const hostname = new URL(url).hostname;
              const duckIcon = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
              const googleIcon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
              return (
                <>
                  {!faviconError ? (
                    <img
                      src={duckIcon}
                      alt={`${hostname} favicon`}
                      onError={() => setFaviconError(true)}
                      className="w-6 h-6 rounded-sm object-cover"
                    />
                  ) : (
                    <img
                      src={googleIcon}
                      alt={`${hostname} favicon`}
                      onError={() => setFaviconError(true)}
                      className="w-6 h-6 rounded-sm object-cover"
                    />
                  )}
                </>
              );
            } catch {
              return getIconForUrl(url);
            }
          })()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          <p className="text-sm text-gray-500 truncate mt-1">{truncatedUrl}</p>
          <div className="mt-3">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${categoryColors[category] || categoryColors.Other}`}
            >
              {category.toLowerCase()}
            </span>
          </div>
        </div>
        {/* Hover icons */}
        {hovered && (
          <div className="absolute top-2 right-4 flex gap-2 z-20">
            <button
              title={favorite ? "Remove from favorites" : "Add to favorites"}
              onClick={handleStarClick}
              className="p-1 rounded-full hover:bg-yellow-100 focus:outline-none"
            >
              <Star
                className={`w-6 h-6 ${favorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`}
                fill={favorite ? "#facc15" : "none"}
              />
            </button>
            <button
              title="Delete bookmark"
              onClick={handleDeleteClick}
              className="p-1 rounded-full hover:bg-red-100 focus:outline-none"
            >
              <Trash2 className="w-6 h-6 text-red-400" />
            </button>
          </div>
        )}
      </div>
    </a>
  );
}
