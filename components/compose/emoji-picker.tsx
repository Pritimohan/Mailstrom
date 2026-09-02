"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🙂", "😉", "😊", "😍",
  "🥰", "😘", "😎", "🤔", "😮", "😢", "😭", "😡", "👍", "👎",
  "👏", "🙏", "💪", "✨", "🔥", "💯", "✅", "❌", "⭐", "❤️",
  "💙", "💚", "💛", "💜", "🎉", "🎊", "📎", "📧", "📅", "☕",
];

interface EmojiPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function EmojiPicker({
  open,
  onClose,
  onSelect,
  anchorRef,
}: EmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-neutral-700 bg-neutral-900 p-2 shadow-xl"
    >
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-lg",
              "hover:bg-neutral-800",
            )}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
