"use client";

import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type Editor,
  type NodeViewProps,
} from "@tiptap/react";
import { X } from "lucide-react";
import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { useInlineImagePreview } from "@/components/compose/inline-image-preview-context";
import { inlineImageToDataUrl } from "@/lib/compose-utils";

function InlineImageNodeView({ node, deleteNode }: NodeViewProps) {
  const cid = node.attrs["data-cid"] as string | null;
  const alt = node.attrs.alt as string | null;
  const preview = useInlineImagePreview(cid);
  const src = preview
    ? inlineImageToDataUrl(preview)
    : ((node.attrs.src as string | null) ?? "");

  return (
    <NodeViewWrapper
      as="div"
      className="inline-image-node group relative my-2 inline-block max-w-full"
      data-cid={cid ?? undefined}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          draggable={false}
          className="block max-h-80 max-w-full rounded-md"
        />
      ) : (
        <div className="flex h-32 w-48 items-center justify-center rounded-md bg-neutral-900 text-sm text-neutral-500">
          Loading...
        </div>
      )}
      <button
        type="button"
        title="Remove image"
        aria-label={`Remove ${alt ?? "image"}`}
        contentEditable={false}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => deleteNode()}
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950/90 text-neutral-100 opacity-0 shadow-md ring-1 ring-neutral-600 transition-opacity hover:bg-red-600 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </NodeViewWrapper>
  );
}

export function createInlineImageExtension() {
  return Image.extend({
    name: "inlineImage",

    addAttributes() {
      return {
        ...this.parent?.(),
        src: {
          default: null,
          parseHTML: (element) => element.getAttribute("src"),
          renderHTML: (attributes) => {
            // Preview src is resolved in the node view; don't embed base64 in saved HTML.
            if (attributes["data-cid"]) {
              return {};
            }
            if (!attributes.src) {
              return {};
            }
            return { src: attributes.src };
          },
        },
        alt: {
          default: null,
          parseHTML: (element) => element.getAttribute("alt"),
          renderHTML: (attributes) => {
            if (!attributes.alt) {
              return {};
            }
            return { alt: attributes.alt };
          },
        },
        "data-cid": {
          default: null,
          parseHTML: (element) => element.getAttribute("data-cid"),
          renderHTML: (attributes) => {
            if (!attributes["data-cid"]) {
              return {};
            }
            return { "data-cid": attributes["data-cid"] };
          },
        },
      };
    },

    parseHTML() {
      return [{ tag: 'img[data-cid]' }];
    },

    addNodeView() {
      return ReactNodeViewRenderer(InlineImageNodeView, {
        as: "div",
      });
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "img",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ];
    },
  }).configure({
    inline: false,
    allowBase64: true,
    HTMLAttributes: {
      class: "compose-inline-image",
    },
  });
}

export function removeInlineImageFromEditor(editor: Editor | null) {
  if (!editor?.isActive("inlineImage")) {
    return;
  }

  editor.chain().focus().deleteSelection().run();
}

export function insertInlineImageNode(
  editor: Editor,
  inlineImage: { cid: string; filename: string; previewUrl?: string },
) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: "inlineImage",
      attrs: {
        alt: inlineImage.filename,
        "data-cid": inlineImage.cid,
        ...(inlineImage.previewUrl ? { src: inlineImage.previewUrl } : {}),
      },
    })
    .run();
}
