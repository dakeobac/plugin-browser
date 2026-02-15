"use client";

import { useState } from "react";
import type { PluginUserData } from "@/lib/types";

export function UserRating({
  slug,
  initialData,
}: {
  slug: string;
  initialData?: PluginUserData;
}) {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState(initialData?.note || "");
  const [showNote, setShowNote] = useState(!!initialData?.note);
  const [saving, setSaving] = useState(false);

  async function save(newRating?: number, newNote?: string) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { slug };
      if (newRating !== undefined) body.rating = newRating;
      if (newNote !== undefined) body.note = newNote;

      await fetch("/api/user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("Failed to save user data:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleStarClick(star: number) {
    const newRating = star === rating ? 0 : star;
    setRating(newRating);
    save(newRating);
  }

  function handleNoteBlur() {
    if (note !== (initialData?.note || "")) {
      save(undefined, note);
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-foreground">Your Rating</h2>
      <div className="flex items-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              disabled={saving}
              className="p-0.5 transition-colors disabled:opacity-50"
            >
              <svg
                className={`h-5 w-5 ${
                  star <= (hover || rating)
                    ? "text-amber-400"
                    : "text-muted-foreground"
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNote(!showNote)}
          className="text-xs text-muted-foreground hover:text-accent-foreground transition-colors"
        >
          {showNote ? "Hide note" : "Add note"}
        </button>
      </div>
      {showNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Personal notes about this plugin..."
          className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
          rows={3}
        />
      )}
    </div>
  );
}

export function UserRatingCompact({ rating }: { rating?: number }) {
  if (!rating || rating === 0) return null;

  return (
    <span className="inline-flex items-center gap-0.5 text-xs" title={`Your rating: ${rating}/5`}>
      <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-amber-400/80">{rating}</span>
    </span>
  );
}
