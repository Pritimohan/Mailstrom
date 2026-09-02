"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  Quote,
  Redo2,
  RemoveFormatting,
  Smile,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LinkDialog } from "@/components/compose/link-dialog";
import { EmojiPicker } from "@/components/compose/emoji-picker";

const FONT_FAMILIES = [
  { label: "Sans Serif", value: "Arial, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Monospace", value: "Courier New, monospace" },
  { label: "Comic Sans", value: "Comic Sans MS, cursive" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Trebuchet", value: "Trebuchet MS, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const FONT_SIZES = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "14px" },
  { label: "Large", value: "18px" },
  { label: "Huge", value: "24px" },
];

const TEXT_COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#ffffff",
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
];

const HIGHLIGHT_COLORS = [
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#ff00ff",
  "#ff9900",
  "#fce5cd",
  "#d9ead3",
  "#cfe2f3",
];

interface ComposeToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  onAttachFiles: () => void;
  onInsertPhoto: () => void;
}

function ToolbarButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 transition-colors",
        "hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-neutral-800 text-white",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSelect({
  value,
  disabled,
  onChange,
  options,
  className,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  className?: string;
}) {
  return (
    <select
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-8 rounded-md border border-neutral-700 bg-neutral-900 px-2 text-xs text-neutral-200",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ColorPicker({
  colors,
  disabled,
  onSelect,
}: {
  colors: string[];
  disabled?: boolean;
  onSelect: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        title="Text color"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
      >
        <span className="text-sm font-semibold">A</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 grid grid-cols-4 gap-1 rounded-lg border border-neutral-700 bg-neutral-900 p-2 shadow-xl">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className="h-6 w-6 rounded border border-neutral-700"
              style={{ backgroundColor: color }}
              onClick={() => {
                onSelect(color);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightPicker({
  colors,
  disabled,
  onSelect,
}: {
  colors: string[];
  disabled?: boolean;
  onSelect: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        title="Highlight color"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
      >
        <span className="rounded bg-yellow-300 px-1 text-xs font-semibold text-neutral-950">
          A
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 grid grid-cols-4 gap-1 rounded-lg border border-neutral-700 bg-neutral-900 p-2 shadow-xl">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className="h-6 w-6 rounded border border-neutral-700"
              style={{ backgroundColor: color }}
              onClick={() => {
                onSelect(color);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ComposeToolbar({
  editor,
  disabled,
  onAttachFiles,
  onInsertPhoto,
}: ComposeToolbarProps) {
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  if (!editor) {
    return (
      <div className="rounded-xl border border-neutral-700 bg-neutral-900/80 px-2 py-2 text-xs text-neutral-500">
        Loading editor...
      </div>
    );
  }

  const currentFont =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) ??
    "Arial, sans-serif";
  const currentSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ??
    "14px";

  return (
    <div className="space-y-2 rounded-xl border border-neutral-700 bg-neutral-900/80 p-2">
      <div className="flex flex-wrap items-center gap-1">
        <ToolbarButton
          title="Undo"
          disabled={disabled || !editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={disabled || !editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-neutral-700" />

        <ToolbarSelect
          disabled={disabled}
          value={currentFont}
          className="min-w-[110px]"
          options={FONT_FAMILIES}
          onChange={(value) =>
            editor.chain().focus().setFontFamily(value).run()
          }
        />
        <ToolbarSelect
          disabled={disabled}
          value={currentSize}
          className="min-w-[90px]"
          options={FONT_SIZES}
          onChange={(value) => editor.chain().focus().setFontSize(value).run()}
        />

        <span className="mx-1 h-5 w-px bg-neutral-700" />

        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ColorPicker
          colors={TEXT_COLORS}
          disabled={disabled}
          onSelect={(color) => editor.chain().focus().setColor(color).run()}
        />
        <HighlightPicker
          colors={HIGHLIGHT_COLORS}
          disabled={disabled}
          onSelect={(color) =>
            editor.chain().focus().toggleHighlight({ color }).run()
          }
        />

        <span className="mx-1 h-5 w-px bg-neutral-700" />

        <ToolbarButton
          title="Align left"
          active={editor.isActive({ textAlign: "left" })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          active={editor.isActive({ textAlign: "center" })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          active={editor.isActive({ textAlign: "right" })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-neutral-700" />

        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Indent"
          disabled={disabled}
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        >
          <IndentIncrease className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Outdent"
          disabled={disabled}
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        >
          <IndentDecrease className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-neutral-700" />

        <div className="relative">
          <ToolbarButton
            title="Insert link"
            active={editor.isActive("link")}
            disabled={disabled}
            onClick={() => setLinkOpen(true)}
          >
            <span ref={linkButtonRef}>
              <Link2 className="h-4 w-4" />
            </span>
          </ToolbarButton>
          <LinkDialog
            open={linkOpen}
            initialUrl={editor.getAttributes("link").href ?? ""}
            anchorRef={linkButtonRef}
            onClose={() => setLinkOpen(false)}
            onApply={(url) => {
              if (editor.state.selection.empty) {
                editor
                  .chain()
                  .focus()
                  .insertContent(`<a href="${url}">${url}</a>`)
                  .run();
              } else {
                editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
              }
            }}
          />
        </div>

        <ToolbarButton
          title="Insert photo"
          disabled={disabled}
          onClick={onInsertPhoto}
        >
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>

        <div className="relative">
          <ToolbarButton
            title="Insert emoji"
            disabled={disabled}
            onClick={() => setEmojiOpen(true)}
          >
            <span ref={emojiButtonRef}>
              <Smile className="h-4 w-4" />
            </span>
          </ToolbarButton>
          <EmojiPicker
            open={emojiOpen}
            anchorRef={emojiButtonRef}
            onClose={() => setEmojiOpen(false)}
            onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()}
          />
        </div>

        <ToolbarButton
          title="Quote"
          active={editor.isActive("blockquote")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Remove formatting"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-neutral-700" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 rounded-md px-2 text-neutral-200 hover:bg-neutral-800"
          onClick={onAttachFiles}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
