'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Printer,
  FileText,
  CheckCircle2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sliders,
  FileDown,
  Layers,
} from 'lucide-react'
import { OFFICE_SPECIALTIES, type OfficeSpecialty } from '@/lib/constants/roles'

// Tipografías y Tamaños en Puntos (pt) como en Word
const FONT_FAMILIES = [
  { label: 'Inter (Sans-serif)', value: 'Inter, sans-serif' },
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Garamond', value: "Garamond, 'Hoefler Text', serif" },
  { label: 'Courier New (Mono)', value: "'Courier New', monospace" },
]

const FONT_SIZES_PT = [
  { label: '8 pt', value: '8pt' },
  { label: '9 pt', value: '9pt' },
  { label: '10 pt', value: '10pt' },
  { label: '11 pt', value: '11pt' },
  { label: '12 pt (Estándar)', value: '12pt' },
  { label: '14 pt', value: '14pt' },
  { label: '16 pt', value: '16pt' },
  { label: '18 pt', value: '18pt' },
  { label: '20 pt', value: '20pt' },
  { label: '24 pt', value: '24pt' },
  { label: '28 pt', value: '28pt' },
  { label: '36 pt', value: '36pt' },
]

const MARGIN_PRESETS = [
  {
    id: 'standard',
    label: 'Normal (2.5 cm)',
    description: '1 pulgada en todos los lados',
    style: { paddingTop: '48px', paddingBottom: '48px', paddingLeft: '48px', paddingRight: '48px' },
    usableHeight: 860,
  },
  {
    id: 'narrow',
    label: 'Estrecho (1.27 cm)',
    description: '0.5 pulgadas para aprovechar espacio',
    style: { paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px' },
    usableHeight: 920,
  },
  {
    id: 'moderate',
    label: 'Moderado (2.5 cm vert, 1.9 cm horiz)',
    description: 'Equilibrio formal para contratos',
    style: { paddingTop: '48px', paddingBottom: '48px', paddingLeft: '36px', paddingRight: '36px' },
    usableHeight: 860,
  },
  {
    id: 'wide',
    label: 'Ancho (2.5 cm vert, 3.8 cm horiz)',
    description: 'Márgenes amplios para lectura ejecutiva',
    style: { paddingTop: '48px', paddingBottom: '48px', paddingLeft: '68px', paddingRight: '68px' },
    usableHeight: 860,
  },
]

// Función avanzada para dividir contenido y cortar párrafos de forma exacta sin dejar huecos blancos
function paginateHtmlContent(html: string, usableHeightPx: number = 860): string[] {
  if (!html || typeof window === 'undefined') return [html || '<p></p>']

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return [html || '<p></p>']

  const children = Array.from(root.children)
  if (children.length === 0) {
    return [html.trim().length > 0 ? html : '<p></p>']
  }

  const pages: string[] = []
  let currentPageElements: string[] = []
  let currentHeight = 0
  const LINE_HEIGHT = 22
  const CHARS_PER_LINE = 75

  const startNewPage = () => {
    if (currentPageElements.length > 0) {
      pages.push(currentPageElements.join(''))
      currentPageElements = []
      currentHeight = 0
    }
  }

  let i = 0
  while (i < children.length) {
    const el = children[i]
    const text = (el.textContent || '').trim()
    const tagName = el.tagName.toLowerCase()

    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
      const headingHeight = tagName === 'h1' ? 56 : tagName === 'h2' ? 44 : 36
      // Si el encabezado no cabe o dejaría el encabezado solo al fondo, lo pasamos a la siguiente hoja
      if (currentHeight + headingHeight + LINE_HEIGHT * 2 > usableHeightPx && currentHeight > 0) {
        startNewPage()
      }
      currentPageElements.push(el.outerHTML)
      currentHeight += headingHeight
      i++
      continue
    }

    if (tagName === 'p') {
      const totalChars = text.length
      const totalLines = Math.max(1, Math.ceil(totalChars / CHARS_PER_LINE))
      const totalParagraphHeight = totalLines * LINE_HEIGHT + 10

      const remainingSpace = usableHeightPx - currentHeight

      if (currentHeight + totalParagraphHeight <= usableHeightPx) {
        // Cabe por completo en la página actual
        currentPageElements.push(el.outerHTML)
        currentHeight += totalParagraphHeight
        i++
      } else if (remainingSpace >= LINE_HEIGHT * 2) {
        // ¡CORTAMOS EL PÁRRAFO para aprovechar todo el espacio restante de la hoja!
        const linesCanFit = Math.floor((remainingSpace - 6) / LINE_HEIGHT)
        const charsCanFit = linesCanFit * CHARS_PER_LINE

        const words = text.split(/\s+/)
        let currentChars = 0
        let splitIndex = 0

        for (let w = 0; w < words.length; w++) {
          currentChars += words[w].length + 1
          if (currentChars >= charsCanFit) {
            splitIndex = Math.max(1, w)
            break
          }
        }

        if (splitIndex > 0 && splitIndex < words.length) {
          const part1 = words.slice(0, splitIndex).join(' ')
          const part2 = words.slice(splitIndex).join(' ')

          currentPageElements.push(`<p>${part1}</p>`)
          startNewPage()

          // Continuamos la segunda parte del párrafo en la siguiente hoja
          el.innerHTML = part2
        } else {
          startNewPage()
          currentPageElements.push(el.outerHTML)
          currentHeight += totalParagraphHeight
          i++
        }
      } else {
        // No cabe ni 2 líneas, pasamos el párrafo completo a la siguiente hoja
        startNewPage()
        currentPageElements.push(el.outerHTML)
        currentHeight += totalParagraphHeight
        i++
      }
      continue
    }

    if (tagName === 'ul' || tagName === 'ol') {
      const lis = Array.from(el.querySelectorAll('li'))
      let listItemsPart: string[] = []

      lis.forEach((li) => {
        const liHeight = Math.max(24, Math.ceil((li.textContent || '').length / CHARS_PER_LINE) * LINE_HEIGHT)
        if (currentHeight + liHeight > usableHeightPx && listItemsPart.length > 0) {
          currentPageElements.push(`<${tagName}>${listItemsPart.join('')}</${tagName}>`)
          startNewPage()
          listItemsPart = [li.outerHTML]
          currentHeight = liHeight
        } else {
          listItemsPart.push(li.outerHTML)
          currentHeight += liHeight
        }
      })

      if (listItemsPart.length > 0) {
        currentPageElements.push(`<${tagName}>${listItemsPart.join('')}</${tagName}>`)
      }
      i++
      continue
    }

    // Manejo de bloques generales (blockquote, div, hr, etc.)
    const defaultHeight = Math.max(28, Math.ceil(text.length / CHARS_PER_LINE) * LINE_HEIGHT)
    if (currentHeight + defaultHeight > usableHeightPx && currentPageElements.length > 0) {
      startNewPage()
    }
    currentPageElements.push(el.outerHTML)
    currentHeight += defaultHeight
    i++
  }

  startNewPage()
  return pages.length > 0 ? pages : [html || '<p></p>']
}

interface Props {
  officeId: string
  officeName?: string
  logoUrl?: string | null
  officeSpecialty?: OfficeSpecialty
  directorName?: string
  initialContent: string
}

export function ContratoEditor({
  officeId,
  officeName = 'Oficina de Diseño',
  logoUrl,
  officeSpecialty = 'editorial',
  directorName = 'Director Responsable',
  initialContent,
}: Props) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent || '<p>Escribe aquí las cláusulas del contrato...</p>')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [selectedMarginId, setSelectedMarginId] = useState('standard')
  const [currentFontSizePt, setCurrentFontSizePt] = useState('12pt')
  const [currentFontFamily, setCurrentFontFamily] = useState('Inter, sans-serif')

  const activeMargin = useMemo(() => {
    return MARGIN_PRESETS.find((m) => m.id === selectedMarginId) || MARGIN_PRESETS[0]
  }, [selectedMarginId])

  const specialtyObj = OFFICE_SPECIALTIES.find((s) => s.value === officeSpecialty)
  const specialtyLabel = specialtyObj ? specialtyObj.label : officeSpecialty

  // Paginación calculada con corte fino de párrafos
  const paginatedPages = useMemo(() => {
    return paginateHtmlContent(content, activeMargin.usableHeight)
  }, [content, activeMargin.usableHeight])

  const totalPages = Math.max(1, paginatedPages.length)

  // Ejecución de comandos de formato de texto
  const execCmd = (command: string, value: string = '') => {
    document.execCommand(command, false, value)
  }

  // Manejo de edición en tiempo real en cualquier página
  const handlePageInput = useCallback(
    (pageIndex: number, newPageHtml: string) => {
      const updatedPages = [...paginatedPages]
      updatedPages[pageIndex] = newPageHtml
      const newCombinedContent = updatedPages.join('')
      setContent(newCombinedContent)
    },
    [paginatedPages]
  )

  // Guardar contrato en Supabase
  const save = async () => {
    setLoading(true)
    setError(null)
    setSaved(false)

    const supabase = createClient()
    let { error: updateError } = await supabase
      .from('offices')
      .update({ contrato_contenido: content })
      .eq('id', officeId)

    if (
      updateError &&
      (updateError.message?.toLowerCase().includes('contrato_contenido') ||
        updateError.message?.toLowerCase().includes('schema cache'))
    ) {
      setError(
        'La columna "contrato_contenido" no existe aún en la tabla "offices". Recuerda ejecutar el archivo SQL "supabase/migrations/007_office_contract.sql" en el Editor SQL de Supabase.'
      )
      setLoading(false)
      return
    }

    if (updateError) {
      setError(`Error al guardar el contrato: ${updateError.message}`)
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const ToolbarBtn = ({
    onClick,
    children,
    title,
  }: {
    onClick: () => void
    children: React.ReactNode
    title?: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg transition-all text-xs flex items-center justify-center cursor-pointer text-gray-700 hover:bg-gray-200/90 hover:text-black"
    >
      {children}
    </button>
  )

  const Divider = () => <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />

  // Renderizador de membrete superior institucional
  const renderSheetHeader = () => (
    <div className="border-b border-gray-100 pb-3 mb-6 flex items-center justify-between text-[10px] text-gray-400 select-none shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={officeName}
            className="h-3.5 max-w-[100px] object-contain shrink-0 opacity-40 grayscale"
          />
        ) : null}
        <span className="truncate">{officeName}</span>
      </div>
      <div className="shrink-0">
        <span className="uppercase tracking-wider">{specialtyLabel}</span>
      </div>
    </div>
  )

  // Renderizador de pie de página institucional
  const renderSheetFooter = (currentPageNum: number) => (
    <div className="border-t border-gray-100 pt-3 mt-6 flex items-center justify-between text-[10px] text-gray-400 select-none shrink-0">
      <span>Documento emitido en plataforma Knoten</span>
      <span>
        Página {currentPageNum} de {totalPages}
      </span>
    </div>
  )

  // Renderizador de firma oficial
  const renderSignatureBlock = () => (
    <div className="pt-14 pb-4 text-center select-none shrink-0" style={{ pageBreakInside: 'avoid' }}>
      <div className="w-64 border-t-2 border-black mx-auto mb-3" />
      <p className="font-bold text-sm text-black uppercase tracking-wide">
        {directorName}
      </p>
      <p className="text-xs text-gray-700 font-medium mt-0.5">
        Director de la {specialtyLabel}
      </p>
      <p className="text-[11px] text-gray-500 mt-0.5">{officeName}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Estilos estrictos de impresión @media print */}
      <style jsx global>{`
        @media print {
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-contract-container,
          #printable-contract-container * {
            visibility: visible !important;
          }
          #printable-contract-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          .letter-sheet-page {
            width: 100% !important;
            max-width: 100% !important;
            height: 1056px !important;
            min-height: 1056px !important;
            max-height: 1056px !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            background: white !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
          }
          nav,
          header,
          aside,
          footer,
          .no-print {
            display: none !important;
          }
          @page {
            size: letter portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* BARRA SUPERIOR DE ACCIONES */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">
                Contrato Marco • {officeName}
              </h2>
              <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full border border-gray-200 flex items-center gap-1">
                <Layers className="w-3 h-3 text-gray-500" />
                {totalPages} {totalPages === 1 ? 'Página Carta' : 'Páginas Carta'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Hojas físicas tamaño Carta (8.5 × 11 in) con corte fino de párrafos y aprovechamiento total del espacio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>

          <button
            type="button"
            onClick={save}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-black hover:bg-neutral-900 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            {loading ? 'Guardando...' : 'Guardar contrato'}
          </button>
        </div>
      </div>

      {/* MENSAJES DE ESTADO */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl px-5 py-3.5 font-medium no-print">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl px-5 py-3.5 font-semibold flex items-center gap-2 no-print shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ¡Contrato marco de la oficina guardado exitosamente! Las vacantes ya pueden ser publicadas.
        </div>
      )}

      {/* BARRA DE HERRAMIENTAS ESTILO WORD */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-2xs flex items-center gap-1.5 flex-wrap no-print sticky top-4 z-40">
        {/* Tipografía */}
        <select
          value={currentFontFamily}
          onChange={(e) => {
            setCurrentFontFamily(e.target.value)
            execCmd('fontName', e.target.value)
          }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-black font-medium cursor-pointer"
          title="Tipografía del documento"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* SELECTOR MANUAL EN PUNTOS (PT) */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 bg-white">
          <select
            value={currentFontSizePt}
            onChange={(e) => {
              const ptVal = e.target.value
              setCurrentFontSizePt(ptVal)
            }}
            className="text-xs text-gray-800 font-semibold bg-transparent focus:outline-none cursor-pointer"
            title="Tamaño de tipografía en puntos (pt)"
          >
            {FONT_SIZES_PT.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <Divider />

        {/* Selector de Márgenes de Hoja Carta */}
        <div className="flex items-center gap-1.5 bg-neutral-50 border border-gray-200 px-2 py-1 rounded-xl">
          <Sliders className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
          <select
            value={selectedMarginId}
            onChange={(e) => setSelectedMarginId(e.target.value)}
            className="text-xs bg-transparent text-gray-800 font-semibold focus:outline-none cursor-pointer"
            title="Ajustar márgenes de la hoja tamaño carta"
          >
            {MARGIN_PRESETS.map((m) => (
              <option key={m.id} value={m.id}>
                Márgenes: {m.label}
              </option>
            ))}
          </select>
        </div>

        <Divider />

        {/* Formato de Texto */}
        <ToolbarBtn onClick={() => execCmd('bold')} title="Negrita (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd('italic')} title="Cursiva (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd('underline')} title="Subrayado (Ctrl+U)">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd('strikeThrough')} title="Tachado">
          <Strikethrough className="w-4 h-4" />
        </ToolbarBtn>

        <Divider />

        {/* Alineación */}
        <ToolbarBtn onClick={() => execCmd('justifyLeft')} title="Alinear a la izquierda">
          <AlignLeft className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd('justifyCenter')} title="Alinear al centro">
          <AlignCenter className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd('justifyRight')} title="Alinear a la derecha">
          <AlignRight className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd('justifyFull')} title="Justificar texto">
          <AlignJustify className="w-4 h-4" />
        </ToolbarBtn>

        <Divider />

        {/* Listas */}
        <ToolbarBtn onClick={() => execCmd('insertUnorderedList')} title="Lista con viñetas">
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd('insertOrderedList')} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd('formatBlock', 'blockquote')} title="Cita / Cláusula destacada">
          <Quote className="w-4 h-4" />
        </ToolbarBtn>
      </div>

      {/* LIENZO / MESA DE TRABAJO CON HOJAS CARTA Y CORTE EXACTO DE PÁRRAFOS */}
      <div className="bg-neutral-200/90 rounded-3xl p-4 sm:p-10 border border-neutral-300 flex flex-col items-center justify-start overflow-x-auto shadow-inner min-h-[900px]">
        {/* Contenedor de hojas separadas con gap-10 */}
        <div id="printable-contract-container" className="w-full flex flex-col items-center gap-10">
          {paginatedPages.map((pageHtml, pageIndex) => {
            const pageNum = pageIndex + 1
            const isLastPage = pageIndex === totalPages - 1

            return (
              <div
                key={`letter-sheet-${pageIndex}`}
                className="letter-sheet-page bg-white shadow-2xl w-full max-w-[816px] h-[1056px] min-h-[1056px] max-h-[1056px] text-black transition-all relative flex flex-col justify-between overflow-hidden"
                style={{
                  ...activeMargin.style,
                  fontFamily: currentFontFamily,
                }}
              >
                {/* Encabezado institucional de la hoja */}
                {renderSheetHeader()}

                {/* Contenido editable de la hoja con corte exacto de párrafo */}
                <div className="flex-1 overflow-hidden flex flex-col justify-between">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => handlePageInput(pageIndex, e.currentTarget.innerHTML)}
                    className="focus:outline-none flex-1 leading-relaxed text-black prose max-w-none prose-p:my-1.5 prose-headings:font-bold prose-headings:text-black select-text cursor-text"
                    style={{ fontSize: currentFontSizePt }}
                    dangerouslySetInnerHTML={{ __html: pageHtml }}
                  />

                  {/* Firma institucional solo en la última hoja */}
                  {isLastPage && renderSignatureBlock()}
                </div>

                {/* Pie de página institucional de la hoja */}
                {renderSheetFooter(pageNum)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
