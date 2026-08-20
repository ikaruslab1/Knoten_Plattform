'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent, Extension, mergeAttributes } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import FontFamily from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { TextAlign } from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Trash2,
  Palette,
  Highlighter,
  Maximize2,
  Minimize2,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
} from 'lucide-react'

// Custom FontSize TipTap extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) => {
          return chain().setMark('textStyle', { fontSize }).run()
        },
      unsetFontSize:
        () =>
        ({ chain }: any) => {
          return chain().setMark('textStyle', { fontSize: null }).run()
        },
    } as any
  },
})

const FONT_FAMILIES = [
  { label: 'Sans-serif', value: 'Inter, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mecánica', value: "'Courier New', monospace" },
  { label: 'Manuscrita', value: "'Dancing Script', cursive" },
]

const FONT_SIZES = [
  { label: 'Normal', value: '' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
]

const TEXT_COLORS = [
  { label: 'Predeterminado', value: '#111827' },
  { label: 'Gris', value: '#6b7280' },
  { label: 'Rojo', value: '#dc2626' },
  { label: 'Azul', value: '#2563eb' },
  { label: 'Verde', value: '#16a34a' },
  { label: 'Morado', value: '#9333ea' },
  { label: 'Naranja', value: '#ea580c' },
]

const HIGHLIGHT_COLORS = [
  { label: 'Sin fondo', value: '' },
  { label: 'Amarillo', value: '#fef08a' },
  { label: 'Verde claro', value: '#bbf7d0' },
  { label: 'Azul claro', value: '#bfdbfe' },
  { label: 'Rosa claro', value: '#fbcfe8' },
  { label: 'Morado claro', value: '#e9d5ff' },
]

// Helper to find ancestor table position in ProseMirror document tree
function findTablePos(state: any) {
  if (!state?.selection?.$from) return null
  const { $from } = state.selection
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d)
    if (node?.type?.name === 'table') {
      return {
        pos: $from.before(d),
        node,
      }
    }
  }
  return null
}

function updateTableAttrs(editor: any, newAttrs: Record<string, any>) {
  if (!editor) return
  const { state, view } = editor
  const tableData = findTablePos(state)
  if (!tableData) return

  const { pos, node } = tableData
  const attrs = {
    ...node.attrs,
    ...newAttrs,
  }

  const tr = state.tr.setNodeMarkup(pos, undefined, attrs)
  view.dispatch(tr)
}

// Custom Table Extension supporting alignment and width percentage
const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-alignment') || 'left',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment || 'left',
        }),
      },
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('data-width') || '100%',
        renderHTML: (attributes) => ({
          'data-width': attributes.width || '100%',
        }),
      },
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    const alignment = node.attrs.alignment || 'left'
    const width = node.attrs.width || '100%'

    let margin = 'margin-left: 0; margin-right: auto;'
    if (alignment === 'center') {
      margin = 'margin-left: auto; margin-right: auto;'
    } else if (alignment === 'right') {
      margin = 'margin-left: auto; margin-right: 0;'
    }

    const style = `width: ${width}; ${margin}`

    return [
      'table',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-alignment': alignment,
        'data-width': width,
        style,
      }),
      ['tbody', 0],
    ]
  },
})

// Helper to apply paragraph/heading/blockquote indentation directly via ProseMirror
function applyIndent(editor: any, delta: number) {
  if (!editor) return
  const { state, view } = editor
  const { selection } = state
  const minLevel = 0
  const maxLevel = 5

  const tr = state.tr
  let modified = false

  tr.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
    if (['paragraph', 'heading', 'blockquote'].includes(node.type.name)) {
      const currentIndent = node.attrs.indent || 0
      const newIndent = Math.min(maxLevel, Math.max(minLevel, currentIndent + delta))
      if (newIndent !== currentIndent) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          indent: newIndent,
        })
        modified = true
      }
    }
  })

  if (modified) {
    view.dispatch(tr)
  }
}

// Custom Indent Extension for paragraphs, headings & blockquotes
const IndentExtension = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minLevel: 0,
      maxLevel: 5,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const indentLevel = parseInt(element.getAttribute('data-indent') || '0', 10)
              return indentLevel || 0
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) {
                return {}
              }
              return {
                'data-indent': attributes.indent,
                style: `margin-left: ${attributes.indent * 1.5}rem;`,
              }
            },
          },
        },
      },
    ]
  },
})

// Helper functions for indentation buttons with adaptive list support
const handleIndentIncrease = (editor: any) => {
  if (editor.can().sinkListItem('listItem')) {
    editor.chain().focus().sinkListItem('listItem').run()
  } else {
    applyIndent(editor, 1)
  }
}

const handleIndentDecrease = (editor: any) => {
  if (editor.can().liftListItem('listItem')) {
    editor.chain().focus().liftListItem('listItem').run()
  } else {
    applyIndent(editor, -1)
  }
}

interface Props {
  content?: string
  onChange?: (html: string) => void
  maxChars?: number
  placeholder?: string
  enableTables?: boolean
}

export function RichTextEditor({ content = '', onChange, maxChars, enableTables = true }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Subscript,
      Superscript,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      IndentExtension,
      ...(enableTables
        ? [
            CustomTable.configure({
              resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
          ]
        : []),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (html === '<p></p>') {
        onChange?.('')
      } else {
        onChange?.(html)
      }
    },
  })

  // Sync content if changed externally
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content && !editor.isFocused) {
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  if (!editor) return null

  const plainTextLength = editor.getText().length
  const remainingChars = maxChars ? maxChars - plainTextLength : null
  const overLimit = maxChars ? plainTextLength > maxChars : false

  // Dynamic counter color logic
  let counterColorClass = 'text-gray-400'
  if (remainingChars !== null) {
    if (remainingChars <= 20) {
      counterColorClass = 'text-red-500 font-semibold'
    } else if (remainingChars <= 100) {
      counterColorClass = 'text-amber-500 font-medium'
    } else {
      counterColorClass = 'text-gray-400'
    }
  }

  const ToolbarBtn = ({
    onClick,
    active,
    children,
    title,
    disabled = false,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title?: string
    disabled?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-all text-xs flex items-center justify-center ${
        active
          ? 'bg-gray-900 text-white shadow-xs'
          : 'text-gray-600 hover:bg-gray-200/80 hover:text-black'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )

  const Divider = () => <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />

  // Determine active structure block value
  let activeHierarchy = 'p'
  if (editor.isActive('heading', { level: 1 })) activeHierarchy = 'h1'
  else if (editor.isActive('heading', { level: 2 })) activeHierarchy = 'h2'
  else if (editor.isActive('heading', { level: 3 })) activeHierarchy = 'h3'
  else if (editor.isActive('blockquote')) activeHierarchy = 'blockquote'

  const renderToolbar = () => {
    const tableData = findTablePos(editor.state)
    const currentAlignment = tableData?.node?.attrs?.alignment || 'left'
    const currentWidth = tableData?.node?.attrs?.width || '100%'

    return (
      <>
        <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50 flex-wrap shrink-0">
          {/* Jerarquía de Texto */}
          <select
            value={activeHierarchy}
            onChange={(e) => {
              const val = e.target.value
              if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run()
              else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run()
              else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run()
              else if (val === 'blockquote') editor.chain().focus().toggleBlockquote().run()
              else editor.chain().focus().setParagraph().run()
            }}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
            title="Jerarquía de contenido"
          >
            <option value="p">Párrafo normal</option>
            <option value="h1">Título principal (H1)</option>
            <option value="h2">Subtítulo grande (H2)</option>
            <option value="h3">Subtítulo mediano (H3)</option>
            <option value="blockquote">Bloque de cita</option>
          </select>

          {/* Familia de Fuente */}
          <select
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
            defaultValue=""
            title="Tipografía"
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

          {/* Tamaño de Fuente */}
          <select
            onChange={(e) => {
              const val = e.target.value
              if (val) (editor.chain().focus() as any).setFontSize(val).run()
              else (editor.chain().focus() as any).unsetFontSize().run()
            }}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
            defaultValue=""
            title="Tamaño de letra"
          >
            <option value="" disabled>
              Tamaño
            </option>
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <Divider />

          {/* Formato Básico */}
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => (editor.chain().focus() as any).toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Subrayado (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Tachado"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            active={editor.isActive('subscript')}
            title="Subíndice"
          >
            <SubscriptIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            active={editor.isActive('superscript')}
            title="Superíndice"
          >
            <SuperscriptIcon className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {/* Color de Texto */}
          <div className="flex items-center gap-1" title="Color de texto">
            <Palette className="w-3.5 h-3.5 text-gray-500" />
            <select
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
              defaultValue="#111827"
            >
              {TEXT_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color de Resaltado */}
          <div className="flex items-center gap-1" title="Color de resaltado">
            <Highlighter className="w-3.5 h-3.5 text-gray-500" />
            <select
              onChange={(e) => {
                const val = e.target.value
                if (val) editor.chain().focus().toggleHighlight({ color: val }).run()
                else editor.chain().focus().unsetHighlight().run()
              }}
              className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
              defaultValue=""
            >
              {HIGHLIGHT_COLORS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          <Divider />

          {/* Alineación */}
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="Alinear al centro"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="Alinear a la derecha"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })}
            title="Justificar"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {/* Listas & Sangrías */}
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
          <ToolbarBtn
            onClick={() => handleIndentDecrease(editor)}
            title="Disminuir sangría (Sangría izquierda)"
          >
            <OutdentIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => handleIndentIncrease(editor)}
            title="Aumentar sangría (Sangría derecha)"
          >
            <IndentIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Línea horizontal divisoria"
          >
            <Minus className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {enableTables && (
            <>
              <Divider />
              <ToolbarBtn
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                }
                active={editor.isActive('table')}
                title="Insertar Tabla 3x3"
              >
                <TableIcon className="w-4 h-4" />
              </ToolbarBtn>
            </>
          )}
        </div>

        {/* Table Context Toolbar */}
        {enableTables && editor.isActive('table') && (
          <div className="flex items-center gap-1.5 p-2 border-b border-gray-100 bg-amber-50/70 text-xs flex-wrap shrink-0">
            <span className="font-medium text-amber-900 mr-1 flex items-center gap-1">
              <TableIcon className="w-3.5 h-3.5" />
              Tabla:
            </span>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Fila arriba
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Fila abajo
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Col izq
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Col der
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="bg-white border border-red-200 px-2 py-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
            >
              - Fila
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="bg-white border border-red-200 px-2 py-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
            >
              - Columna
            </button>

            <div className="w-px h-4 bg-amber-200 mx-1" />

            {/* Alineación Horizontal de la Caja de Tabla */}
            <div className="flex items-center gap-1" title="Alineación de la caja de tabla">
              <span className="text-amber-800 text-[11px] font-medium">Caja:</span>
              <select
                value={currentAlignment}
                onChange={(e) => updateTableAttrs(editor, { alignment: e.target.value })}
                className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer font-medium"
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>

            {/* Proporción de Ancho de Tabla en % */}
            <div className="flex items-center gap-1" title="Ancho de la tabla en %">
              <span className="text-amber-800 text-[11px] font-medium">Ancho:</span>
              <select
                value={currentWidth}
                onChange={(e) => updateTableAttrs(editor, { width: e.target.value })}
                className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer font-medium"
              >
                <option value="25%">25%</option>
                <option value="50%">50%</option>
                <option value="75%">75%</option>
                <option value="100%">100%</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors font-medium flex items-center gap-1 ml-auto"
            >
              <Trash2 className="w-3 h-3" />
              Borrar tabla
            </button>
          </div>
        )}
      </>
    )
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-150">
        <div className="bg-white w-full max-w-6xl h-full max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Fullscreen Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-gray-900 text-base tracking-wide">
                  Diseñador de Resumen Profesional
                </h2>
                <span className="text-xs bg-black text-white px-2.5 py-0.5 rounded-full font-medium tracking-wide">
                  Modo Pantalla Completa
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Edita tu trayectoria con espacio amplio y sin distracciones.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 text-xs font-semibold bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Minimize2 className="w-4 h-4" />
              Salir de pantalla completa
            </button>
          </div>

          {/* Fullscreen Toolbar */}
          {renderToolbar()}

          {/* Fullscreen Editor Content */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-white">
            <EditorContent
              editor={editor}
              className="min-h-[450px] text-base leading-relaxed focus:outline-none prose max-w-none prose-p:my-1.5"
            />
          </div>

          {/* Fullscreen Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
            {maxChars && remainingChars !== null ? (
              <div className={`text-xs ${counterColorClass}`}>
                {remainingChars} caracteres restantes
              </div>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="bg-black text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              Guardar y cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`border rounded-2xl overflow-hidden bg-white transition-colors ${
          overLimit ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200 focus-within:border-black'
        }`}
      >
        {/* Toolbar */}
        {renderToolbar()}

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className="p-4 min-h-[220px] text-sm focus:outline-none prose max-w-none prose-p:my-1.5"
        />

        {/* Countdown character counter */}
        {maxChars && remainingChars !== null && (
          <div
            className={`px-4 py-2 border-t border-gray-100 text-xs text-right transition-colors ${counterColorClass}`}
          >
            {remainingChars} caracteres restantes
          </div>
        )}
      </div>

      <div className="mt-2.5 flex justify-end">
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 transition-colors px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-gray-700" />
          Ver en pantalla completa
        </button>
      </div>
    </>
  )
}



