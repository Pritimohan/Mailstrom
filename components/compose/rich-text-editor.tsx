"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useMemo, useRef, useState } from "react";
import { FontSize } from "@/lib/tiptap-font-size";
import {
  createInlineImageExtension,
  insertInlineImageNode,
} from "@/components/compose/inline-image-extension";
import { InlineImagePreviewProvider } from "@/components/compose/inline-image-preview-context";
import {
  extractCidsFromHtml,
  fileToInlineImage,
  inlineImageToDataUrl,
  isInlineImageFile,
  validateInlineImageFile,
} from "@/lib/compose-utils";
import type { InlineImage } from "@/types";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  inlineImages: InlineImage[];
  onChange: (html: string) => void;
  onInlineImageAdd: (image: InlineImage) => void;
  onInlineImagesSync: (cids: string[]) => void;
  onInlineImageError: (message: string) => void;
  disabled?: boolean;
  editorRef?: React.MutableRefObject<Editor | null>;
  onEditorReady?: (editor: Editor | null) => void;
}

export function RichTextEditor({
  value,
  inlineImages,
  onChange,
  onInlineImageAdd,
  onInlineImagesSync,
  onInlineImageError,
  disabled,
  editorRef,
  onEditorReady,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  const onInlineImagesSyncRef = useRef(onInlineImagesSync);
  const [pendingImages, setPendingImages] = useState<InlineImage[]>([]);
  onChangeRef.current = onChange;
  onInlineImagesSyncRef.current = onInlineImagesSync;

  const previewImages = useMemo(() => {
    const byCid = new Map(inlineImages.map((image) => [image.cid, image]));
    for (const image of pendingImages) {
      byCid.set(image.cid, image);
    }
    return [...byCid.values()];
  }, [inlineImages, pendingImages]);

  const inlineImageExtension = useMemo(
    () => createInlineImageExtension(),
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-sky-400 underline",
        },
      }),
      inlineImageExtension,
      TextAlign.configure({
        types: ["paragraph", "heading"],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      FontSize,
      Placeholder.configure({
        placeholder: "Write your email message...",
      }),
    ],
    content: value || "<p></p>",
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const cids = extractCidsFromHtml(html);
      onChangeRef.current(html);
      onInlineImagesSyncRef.current(cids);
      setPendingImages((current) =>
        current.filter((image) => cids.includes(image.cid)),
      );
    },
    editorProps: {
      attributes: {
        class: cn(
          "compose-editor min-h-[200px] px-3 py-3 text-sm text-neutral-100 outline-none",
          "prose prose-invert max-w-none",
        ),
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              void insertInlineImage(file);
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const imageFile = Array.from(files).find(isInlineImageFile);
        if (!imageFile) return false;

        event.preventDefault();
        void insertInlineImage(imageFile);
        return true;
      },
    },
  });

  async function insertInlineImage(file: File) {
    if (!editor) return;

    const validationError = validateInlineImageFile(file);
    if (validationError) {
      onInlineImageError(validationError);
      return;
    }

    try {
      const inlineImage = await fileToInlineImage(file);
      setPendingImages((current) => [...current, inlineImage]);
      onInlineImageAdd(inlineImage);
      insertInlineImageNode(editor, {
        cid: inlineImage.cid,
        filename: inlineImage.filename,
        previewUrl: inlineImageToDataUrl(inlineImage),
      });
    } catch (error) {
      onInlineImageError(
        error instanceof Error ? error.message : "Failed to insert image.",
      );
    }
  }

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
    onEditorReady?.(editor);
  }, [editor, editorRef, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml && value !== "") {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <InlineImagePreviewProvider images={previewImages}>
      <div className="rounded-xl border border-neutral-700 bg-neutral-950/60">
        <EditorContent editor={editor} />
      </div>
    </InlineImagePreviewProvider>
  );
}

export function insertInlineImageFromFile(
  editor: Editor | null,
  file: File,
  onInlineImageAdd: (image: InlineImage) => void,
  onInlineImageError: (message: string) => void,
) {
  if (!editor) return;

  const validationError = validateInlineImageFile(file);
  if (validationError) {
    onInlineImageError(validationError);
    return;
  }

  void fileToInlineImage(file)
    .then((inlineImage) => {
      onInlineImageAdd(inlineImage);
      insertInlineImageNode(editor, {
        cid: inlineImage.cid,
        filename: inlineImage.filename,
        previewUrl: inlineImageToDataUrl(inlineImage),
      });
    })
    .catch((error: unknown) => {
      onInlineImageError(
        error instanceof Error ? error.message : "Failed to insert image.",
      );
    });
}
