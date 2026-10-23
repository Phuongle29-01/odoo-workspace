'use client';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from 'lucide-react';
export default function RichTextEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Mô tả công việc',
        'aria-multiline': 'true',
        class: 'rich-text-input',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  const formatting = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') || false,
      italic: editor?.isActive('italic') || false,
      bullet: editor?.isActive('bulletList') || false,
      ordered: editor?.isActive('orderedList') || false,
      undo: editor?.can().undo() || false,
      redo: editor?.can().redo() || false,
    }),
  });
  return (
    <div className="rich-editor">
      <div className="editor-toolbar" role="group" aria-label="Định dạng mô tả">
        <button
          type="button"
          className="icon-button"
          aria-label="In đậm"
          aria-pressed={formatting?.bold || false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="In nghiêng"
          aria-pressed={formatting?.italic || false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Danh sách dấu đầu dòng"
          aria-pressed={formatting?.bullet || false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Danh sách đánh số"
          aria-pressed={formatting?.ordered || false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Hoàn tác mô tả"
          disabled={!formatting?.undo}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Làm lại mô tả"
          disabled={!formatting?.redo}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
