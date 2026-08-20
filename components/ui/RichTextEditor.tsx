'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import FontFamily from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'

const FONT_FAMILIES = [
  { label: 'Sans-serif', value: 'Inter, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mecánica', value: "'Courier New', monospace" },
  { label: 'Manuscrita', value: "'Dancing Script', cursive" },
]

interface Props {
  content?: string
  onChange?: (html: string) => void
  maxChars?: number
}

export function RichTextEditor({ content = '', onChange, maxChars }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontFamily],
    content,
    immediatelyRender: false, // Critical: prevents SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  if (!editor) return null

  const plainTextLength = editor.getText().length
  const overLimit = maxChars ? plainTextLength > maxChars : false

  const ToolbarBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title?: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div
      className={`border rounded-2xl overflow-hidden ${
        overLimit ? 'border-red-300' : 'border-gray-200'
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50 flex-wrap">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Itálica"
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Lista con viñetas"
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <select
          onChange={(e) =>
            editor.chain().focus().setFontFamily(e.target.value).run()
          }
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
          defaultValue=""
        >
          <option value="" disabled>
            Tipografía
          </option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="p-4 min-h-[180px] text-sm focus:outline-none prose max-w-none"
      />

      {/* Character counter */}
      {maxChars && (
        <div
          className={`px-4 py-2 border-t border-gray-100 text-xs text-right ${
            overLimit ? 'text-red-500 font-medium' : 'text-gray-400'
          }`}
        >
          {plainTextLength} / {maxChars} caracteres
        </div>
      )}
    </div>
  )
}
