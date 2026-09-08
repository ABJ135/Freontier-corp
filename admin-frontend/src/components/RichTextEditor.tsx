import { useEffect, useRef } from "react";
import type { FormEvent } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const toolbarButtonClasses =
  "flex h-8 w-8 items-center justify-center rounded-md text-[#6B6B76] transition-colors hover:bg-[#EDEDF0] hover:text-[#111114] dark:text-[#8B8A96] dark:hover:bg-[#1A1A22] dark:hover:text-[#F4F3F1]";

const dividerClasses = "mx-1 h-5 w-px bg-[#E4E4E9] dark:bg-[#2A2A34]";

/**
 * A minimal WYSIWYG editor built on contentEditable + document.execCommand.
 * No extra dependencies required. If the project later adopts a package
 * like Tiptap, this component's props (value/onChange as HTML strings) are
 * a drop-in match, so swapping the implementation won't touch call sites.
 */
function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !hasInitialized.current) {
      editorRef.current.innerHTML = value || "";
      hasInitialized.current = true;
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const handleInput = (event: FormEvent<HTMLDivElement>) => {
    onChange(event.currentTarget.innerHTML);
  };

  const isEmpty = !value || value === "<br>" || value === "<p></p>";

  return (
    <div className="overflow-hidden rounded-lg border border-[#E4E4E9] bg-white dark:border-[#2A2A34] dark:bg-[#15151C]">
      <div className="flex items-center gap-0.5 border-b border-[#E4E4E9] px-2 py-1.5 dark:border-[#2A2A34]">
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h2>")}
          className={toolbarButtonClasses}
          aria-label="Heading"
        >
          <Heading2 size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h3>")}
          className={toolbarButtonClasses}
          aria-label="Subheading"
        >
          <Heading3 size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<p>")}
          className={toolbarButtonClasses}
          aria-label="Paragraph"
        >
          <Pilcrow size={16} strokeWidth={1.75} />
        </button>
        <span className={dividerClasses} />
        <button
          type="button"
          onClick={() => exec("bold")}
          className={toolbarButtonClasses}
          aria-label="Bold"
        >
          <Bold size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className={toolbarButtonClasses}
          aria-label="Italic"
        >
          <Italic size={16} strokeWidth={1.75} />
        </button>
        <span className={dividerClasses} />
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className={toolbarButtonClasses}
          aria-label="Bullet list"
        >
          <List size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className={toolbarButtonClasses}
          aria-label="Numbered list"
        >
          <ListOrdered size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="relative">
        {isEmpty && placeholder && (
          <p className="pointer-events-none absolute left-3 top-2.5 text-sm text-[#9C9CA6] dark:text-[#5C5B66]">
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[168px] px-3 py-2.5 text-sm text-[#111114] outline-none dark:text-[#F4F3F1] [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:first:mt-0 [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:first:mt-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p]:last:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>
    </div>
  );
}

export default RichTextEditor;