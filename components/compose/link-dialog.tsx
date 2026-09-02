"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkDialogProps {
  open: boolean;
  initialUrl?: string;
  onClose: () => void;
  onApply: (url: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function LinkDialog({
  open,
  initialUrl = "",
  onClose,
  onApply,
  anchorRef,
}: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
    }
  }, [open, initialUrl]);

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
      className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-xl"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="link-url">Link URL</Label>
          <Input
            id="link-url"
            value={url}
            placeholder="https://example.com"
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (url.trim()) {
                  onApply(url.trim());
                  onClose();
                }
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!url.trim()}
            onClick={() => {
              onApply(url.trim());
              onClose();
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
