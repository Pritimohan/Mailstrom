"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { FontSize } from "@/lib/tiptap-font-size";
import {
  fileToInlineImage,
  isInlineImageFile,
  validateInlineImageFile,
} from "@/lib/compose-utils";
import type { InlineImage } from "@/types";
import { cn } from "@/lib/utils";

const CidImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {};
          }
          return { src: attributes.src };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onInlineImageAdd: (image: InlineImage) => void;
  onInlineImageError: (message: string) => void;
  disabled?: boolean;
  editorRef?: React.MutableRefObject<Editor | null>;
  onEditorReady?: (editor: Editor | null) => void;
}

export function RichTextEditor({
  value,
  onChange,
  onInlineImageAdd,
  onInlineImageError,
  disabled,
  editorRef,
  onEditorReady,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
      CidImage.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full rounded-md",
        },
      }),
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
      onChangeRef.current(currentEditor.getHTML());
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
      onInlineImageAdd(inlineImage);
      editor
        .chain()
        .focus()
        .setImage({ src: `cid:${inlineImage.cid}`, alt: inlineImage.filename })
        .run();
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
    if (value !== currentHtml) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-950/60">
      <EditorContent editor={editor} />
    </div>
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
      editor
        .chain()
        .focus()
        .setImage({ src: `cid:${inlineImage.cid}`, alt: inlineImage.filename })
        .run();
    })
    .catch((error: unknown) => {
      onInlineImageError(
        error instanceof Error ? error.message : "Failed to insert image.",
      );
    });
}
