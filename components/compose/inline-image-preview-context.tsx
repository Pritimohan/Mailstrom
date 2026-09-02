"use client";

import { createContext, useContext } from "react";
import type { InlineImage } from "@/types";

const InlineImagePreviewContext = createContext<InlineImage[]>([]);

export function InlineImagePreviewProvider({
  images,
  children,
}: {
  images: InlineImage[];
  children: React.ReactNode;
}) {
  return (
    <InlineImagePreviewContext.Provider value={images}>
      {children}
    </InlineImagePreviewContext.Provider>
  );
}

export function useInlineImagePreview(cid: string | null): InlineImage | null {
  const images = useContext(InlineImagePreviewContext);
  if (!cid) return null;
  return images.find((image) => image.cid === cid) ?? null;
}
