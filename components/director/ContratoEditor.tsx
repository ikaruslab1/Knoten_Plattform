'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useEditor, EditorContent, Extension, Mark, mergeAttributes } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import FontFamily from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { TextAlign } from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { CharacterCount } from '@tiptap/extension-character-count'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Printer, FileText, CheckCircle2, Bold, Italic, Underline as UnderlineIcon,
  Strikethrough, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, FileDown, Eye, Edit3, Sliders, Scissors, Square,
  Indent as IndentIcon, Outdent as OutdentIcon, Calendar, Sparkles,
  Table2, Hash, History, MessageSquare, Palette, X, Plus, Minus,
  ChevronDown, RotateCcw, BookOpen, Layers, Braces, Shield, SidebarOpen,
  Clock, PanelRight, Search, User, Briefcase, Building2, Check, Trash2,
} from 'lucide-react'
import { OFFICE_SPECIALTIES, type OfficeSpecialty } from '@/lib/constants/roles'

// ─────────────────────────────────────────
// EXTENSIONES PERSONALIZADAS
// ─────────────────────────────────────────

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontSize?.replace(/['"]+/g, '') || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize }).run(),
    } as any
  },
})

const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() { return { types: ['paragraph', 'heading'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.lineHeight || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ tr, state, dispatch }: any) => {
        const { selection } = state
        const { from, to } = selection
        state.doc.nodesBetween(from, to, (node: any, pos: any) => {
          if (this.options.types.includes(node.type.name)) {
            if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight })
          }
        })
        return true
      },
    } as any
  },
})

const CommentMark = Mark.create({
  name: 'comment',
  addAttributes() {
    return {
      comment: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment'),
        renderHTML: attributes => ({ 'data-comment': attributes.comment }),
      },
    }
  },
  parseHTML() { return [{ tag: 'mark[data-comment]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(HTMLAttributes, {
      style: 'background:#fef9c3;border-bottom:2px solid #eab308;cursor:help;',
      title: `Nota: ${HTMLAttributes['data-comment'] ?? ''}`,
    }), 0]
  },
  addCommands() {
    return {
      setComment: (comment: string) => ({ commands }: any) =>
        commands.setMark('comment', { comment }),
      unsetComment: () => ({ commands }: any) =>
        commands.unsetMark('comment'),
    } as any
  },
})

const IndentExtension = Extension.create({
  name: 'indent',
  addOptions() {
    return { types: ['paragraph', 'heading', 'listItem'], minIndent: 0, maxIndent: 8 }
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        indentLeft: {
          default: 0,
          parseHTML: (el: HTMLElement) => parseInt(el.style.marginLeft, 10) / 24 || 0,
          renderHTML: (attrs: Record<string, any>) =>
            attrs.indentLeft ? { style: `margin-left: ${attrs.indentLeft * 24}px;` } : {},
        },
        indentRight: {
          default: 0,
          parseHTML: (el: HTMLElement) => parseInt(el.style.marginRight, 10) / 24 || 0,
          renderHTML: (attrs: Record<string, any>) =>
            attrs.indentRight ? { style: `margin-right: ${attrs.indentRight * 24}px;` } : {},
        },
      },
    }]
  },
  addCommands() {
    const adjust = (attr: 'indentLeft' | 'indentRight', delta: number) =>
      ({ tr, state, dispatch }: any) => {
        const { selection } = state
        const { from, to } = selection
        state.doc.nodesBetween(from, to, (node: any, pos: any) => {
          if (this.options.types.includes(node.type.name)) {
            const current = node.attrs[attr] || 0
            const next = Math.max(this.options.minIndent, Math.min(this.options.maxIndent, current + delta))
            if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, [attr]: next })
          }
        })
        return true
      }
    return {
      indentLeft: () => adjust('indentLeft', 1),
      outdentLeft: () => adjust('indentLeft', -1),
      indentRight: () => adjust('indentRight', 1),
      outdentRight: () => adjust('indentRight', -1),
    } as any
  },
})

// ─────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────

const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Garamond', value: "Garamond, 'Hoefler Text', serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
]

const FONT_SIZES_PT = ['8pt','9pt','10pt','11pt','12pt','14pt','16pt','18pt','20pt','24pt','28pt','36pt']

const LINE_SPACINGS = [
  { label: 'Sencillo (1.0)', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: 'Uno y medio (1.5)', value: '1.5' },
  { label: 'Doble (2.0)', value: '2' },
]

const TEXT_COLORS = [
  '#000000','#1e293b','#374151','#6b7280','#dc2626','#ea580c',
  '#d97706','#16a34a','#2563eb','#7c3aed','#db2777','#ffffff',
]

const HIGHLIGHT_COLORS = [
  '#fef08a','#fed7aa','#fecaca','#bbf7d0','#bae6fd','#e9d5ff',
  '#fce7f3','#f3f4f6','#fef9c3','#d1fae5','#dbeafe','#ede9fe',
]

const DUMMY_SAMPLE_VARIABLES: Record<string, string> = {
  // Datos de Fecha / Timestamps
  fecha_emision: '20 de agosto de 2026',

  // Datos del Freelancer (Base de datos: public.profiles & public.freelancer_profiles)
  nombre_freelancer: 'Juan Carlos',
  apellido_freelancer: 'Pérez Gómez',
  nombre_completo_freelancer: 'Juan Carlos Pérez Gómez',
  numero_cuenta: '318123456',
  correo_freelancer: 'juan.perez@unam.mx',
  correo_institucional: 'juan.perez@knoten.edu.mx',
  telefono_freelancer: '+52 55 1234 5678',
  ultimo_grado_estudios: 'Licenciatura en Diseño Gráfico',
  nivel_experiencia: 'Senior (5+ años)',

  // Datos del Contrato / Vacante (Base de datos: public.vacantes & public.postulaciones)
  vigencia: '6 semanas',
  fecha_inicio: '1 de septiembre de 2026',
  fecha_fin: '15 de octubre de 2026',
  modalidad: 'Híbrido (3 días en línea / 2 presencial)',
  horas_semanales: '20 horas semanales',
  numero_contrato: 'CTR-KNOTEN-2026-0042',

  // Datos de la Oficina y Director (Base de datos: public.offices & public.profiles)
  nombre_oficina: 'Diseños Chidos',
  tipo_oficina: 'Oficina editorial',
  director_nombre: 'Dra. Sofía Mendoza',
  lugar: 'Naucalpan de Juárez',
}

interface MergeFieldPreset {
  key: string
  label: string
  sampleValue: string
  dbSource: string
  category: 'freelancer' | 'vacante' | 'oficina' | 'sistema'
}

const MERGE_FIELD_CATEGORIES: { name: string; category: 'freelancer' | 'vacante' | 'oficina' | 'sistema'; fields: MergeFieldPreset[] }[] = [
  {
    name: 'Fecha y Timestamps',
    category: 'sistema',
    fields: [
      { key: 'fecha_emision', label: 'Fecha de emisión / firma (Auto)', sampleValue: '20 de agosto de 2026', dbSource: 'Timestamp al momento de la firma', category: 'sistema' },
    ],
  },
  {
    name: 'Datos del Freelancer (BD)',
    category: 'freelancer',
    fields: [
      { key: 'nombre_freelancer', label: 'Nombre del freelancer', sampleValue: 'Juan Carlos', dbSource: 'profiles.nombre', category: 'freelancer' },
      { key: 'apellido_freelancer', label: 'Apellidos del freelancer', sampleValue: 'Pérez Gómez', dbSource: 'profiles.apellido_paterno', category: 'freelancer' },
      { key: 'nombre_completo_freelancer', label: 'Nombre completo', sampleValue: 'Juan Carlos Pérez Gómez', dbSource: 'profiles.nombre + apellidos', category: 'freelancer' },
      { key: 'numero_cuenta', label: 'Número de cuenta / Folio', sampleValue: '318123456', dbSource: 'profiles.numero_cuenta', category: 'freelancer' },
      { key: 'correo_freelancer', label: 'Correo personal', sampleValue: 'juan.perez@unam.mx', dbSource: 'profiles.correo_personal', category: 'freelancer' },
      { key: 'correo_institucional', label: 'Correo institucional', sampleValue: 'juan.perez@knoten.edu.mx', dbSource: 'profiles.email_institucional', category: 'freelancer' },
      { key: 'telefono_freelancer', label: 'Teléfono', sampleValue: '+52 55 1234 5678', dbSource: 'profiles.telefono', category: 'freelancer' },
      { key: 'ultimo_grado_estudios', label: 'Grado de estudios', sampleValue: 'Licenciatura en Diseño Gráfico', dbSource: 'freelancer_profiles.ultimo_grado_estudios', category: 'freelancer' },
      { key: 'nivel_experiencia', label: 'Nivel de experiencia', sampleValue: 'Senior (5+ años)', dbSource: 'freelancer_profiles.nivel_experiencia', category: 'freelancer' },
    ],
  },
  {
    name: 'Condiciones de Contrato',
    category: 'vacante',
    fields: [
      { key: 'vigencia', label: 'Vigencia del contrato', sampleValue: '6 semanas', dbSource: 'vacantes.duracion_semanas', category: 'vacante' },
      { key: 'fecha_inicio', label: 'Fecha de inicio', sampleValue: '1 de septiembre de 2026', dbSource: 'convenio acordado', category: 'vacante' },
      { key: 'fecha_fin', label: 'Fecha de fin', sampleValue: '15 de octubre de 2026', dbSource: 'convenio acordado', category: 'vacante' },
      { key: 'modalidad', label: 'Modalidad de trabajo', sampleValue: 'Híbrido (3 días / 2 presencial)', dbSource: 'vacantes.modalidad', category: 'vacante' },
      { key: 'horas_semanales', label: 'Horas semanales', sampleValue: '20 horas semanales', dbSource: 'vacantes.horas_semanales', category: 'vacante' },
      { key: 'numero_contrato', label: 'Folio de contrato', sampleValue: 'CTR-KNOTEN-2026-0042', dbSource: 'Autogenerado por sistema', category: 'vacante' },
    ],
  },
  {
    name: 'Oficina y Director',
    category: 'oficina',
    fields: [
      { key: 'nombre_oficina', label: 'Nombre de la oficina', sampleValue: 'Diseños Chidos', dbSource: 'offices.nombre', category: 'oficina' },
      { key: 'tipo_oficina', label: 'Tipo / Especialidad de oficina', sampleValue: 'Oficina editorial', dbSource: 'offices.especialidad (editorial / gráfica)', category: 'oficina' },
      { key: 'director_nombre', label: 'Nombre del director', sampleValue: 'Dra. Sofía Mendoza', dbSource: 'profiles (director)', category: 'oficina' },
      { key: 'lugar', label: 'Lugar / Sede', sampleValue: 'Naucalpan de Juárez', dbSource: 'Fijo: Naucalpan de Juárez', category: 'oficina' },
    ],
  },
]

const CLAUSE_TEMPLATES = [
  {
    label: 'Confidencialidad',
    html: '<h2>CLÁUSULA DE CONFIDENCIALIDAD</h2><p>El freelancer se compromete a mantener en estricta confidencialidad toda la información, datos, documentos y materiales relacionados con el presente contrato y con las actividades de <strong>{{nombre_oficina}}</strong>. Esta obligación permanecerá vigente incluso después de la terminación del presente contrato.</p>',
  },
  {
    label: 'Duración',
    html: '<h2>CLÁUSULA DE DURACIÓN</h2><p>El presente contrato tendrá una vigencia de <strong>{{vigencia}}</strong>, iniciando el <strong>{{fecha_inicio}}</strong> y concluyendo el <strong>{{fecha_fin}}</strong>. Podrá renovarse por periodos iguales de mutuo acuerdo entre las partes.</p>',
  },
  {
    label: 'Pago y compensación',
    html: '<h2>CLÁUSULA DE PAGO Y COMPENSACIÓN</h2><p>La contraprestación acordada por los servicios descritos en el presente contrato se realizará conforme a las horas establecidas y la modalidad <strong>{{modalidad}}</strong> para la oficina <strong>{{nombre_oficina}}</strong> (<strong>{{tipo_oficina}}</strong>).</p>',
  },
  {
    label: 'Rescisión',
    html: '<h2>CLÁUSULA DE RESCISIÓN</h2><p>Cualquiera de las partes podrá rescindir el presente contrato mediante aviso previo por escrito expedido en <strong>{{lugar}}</strong> con un mínimo de <strong>15 días naturales</strong>. En caso de incumplimiento, la parte afectada tendrá derecho a exigir los daños y perjuicios correspondientes.</p>',
  },
  {
    label: 'Propiedad intelectual',
    html: '<h2>CLÁUSULA DE PROPIEDAD INTELECTUAL</h2><p>Todos los trabajos, creaciones, diseños y materiales producidos por <strong>{{nombre_completo_freelancer}}</strong> como resultado del presente contrato serán de exclusiva propiedad de <strong>{{nombre_oficina}}</strong>, quien tendrá plenos derechos de uso, reproducción y distribución.</p>',
  },
  {
    label: 'Legislación aplicable',
    html: '<h2>CLÁUSULA DE LEGISLACIÓN APLICABLE</h2><p>Para todo lo no previsto en el presente contrato emitido en <strong>{{lugar}}</strong>, las partes se someten a las disposiciones del derecho común aplicable, renunciando a cualquier fuero que pudiera corresponderles en razón de sus domicilios presentes o futuros.</p>',
  },
]

interface MarginPreset {
  id: string; label: string
  paddingTop: number; paddingBottom: number
  paddingLeft: number; paddingRight: number
}

const MARGIN_PRESETS: MarginPreset[] = [
  { id: 'standard', label: 'Normal (2.5 cm)', paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48 },
  { id: 'narrow', label: 'Estrecho (1.27 cm)', paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24 },
  { id: 'moderate', label: 'Moderado', paddingTop: 48, paddingBottom: 48, paddingLeft: 36, paddingRight: 36 },
  { id: 'wide', label: 'Ancho (3.8h cm)', paddingTop: 48, paddingBottom: 48, paddingLeft: 68, paddingRight: 68 },
]

interface VersionEntry { timestamp: number; label: string; content: string }
interface Props {
  officeId: string
  officeName?: string
  logoUrl?: string | null
  officeSpecialty?: OfficeSpecialty
  directorName?: string
  initialContent: string
}

const PAGE_W = 816
const PAGE_H = 1056
const HEADER_H = 40
const FOOTER_H = 36

// ─────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────

function detectMergeFields(html: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const reserved = new Set(['fecha_emision','fecha_hoy','fecha_actual','fecha'])
  const fields = new Set<string>()
  let m
  while ((m = regex.exec(html)) !== null) {
    const key = m[1].trim()
    if (!reserved.has(key)) fields.add(key)
  }
  return Array.from(fields)
}

function resolveDynamicVariables(html: string, mergeValues: Record<string, string> = {}): string {
  const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const combinedValues: Record<string, string> = {
    ...DUMMY_SAMPLE_VARIABLES,
    fecha_emision: dateStr,
    fecha_hoy: dateStr,
    fecha_actual: dateStr,
    fecha: dateStr,
    lugar: 'Naucalpan de Juárez',
    nombre_oficina: DUMMY_SAMPLE_VARIABLES.nombre_oficina || 'Diseños Chidos',
    tipo_oficina: DUMMY_SAMPLE_VARIABLES.tipo_oficina || 'Oficina editorial',
    ...mergeValues,
  }

  let result = html
    .replace(/\{\{\s*fecha_emision\s*\}\}/gi, dateStr)
    .replace(/\{\{\s*fecha_hoy\s*\}\}/gi, dateStr)
    .replace(/\{\{\s*fecha_actual\s*\}\}/gi, dateStr)
    .replace(/\{\{\s*fecha\s*\}\}/gi, dateStr)
    .replace(/\[FECHA_EMISION\]/gi, dateStr)

  Object.entries(combinedValues).forEach(([key, val]) => {
    if (!val) return
    const re = new RegExp(`\\{\\{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'gi')
    result = result.replace(re, val)
  })

  return result
}

function generateTOC(html: string): string {
  if (typeof window === 'undefined') return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
  if (headings.length === 0) return ''
  const rows = headings.map(h => {
    const level = parseInt(h.tagName[1])
    const indent = (level - 1) * 20
    return `<div style="margin-left:${indent}px;padding:3px 0;font-size:11pt;"><span style="font-weight:${level===1?'700':'500'}">${h.textContent ?? ''}</span></div>`
  }).join('')
  return `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:20px;background:#fafafa;">
    <p style="font-weight:700;font-size:10pt;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Tabla de Contenidos</p>
    ${rows}
  </div>`
}

function splitListElement(
  listElem: HTMLElement, availableHeight: number, measureContainer: HTMLElement
): { headHtml: string | null; tailElem: HTMLElement | null } {
  const items = Array.from(listElem.children) as HTMLElement[]
  if (items.length <= 1) return { headHtml: null, tailElem: listElem }
  const tagName = listElem.tagName.toLowerCase()
  const attrs = Array.from(listElem.attributes).map(a => `${a.name}="${a.value}"`).join(' ')
  const attrStr = attrs ? ' ' + attrs : ''
  let fittingCount = 0
  for (let i = 1; i <= items.length; i++) {
    const testItems = items.slice(0, i).map(it => it.outerHTML).join('')
    measureContainer.innerHTML = `<${tagName}${attrStr}>${testItems}</${tagName}>`
    if (measureContainer.scrollHeight <= availableHeight) { fittingCount = i } else { break }
  }
  if (fittingCount === 0) return { headHtml: null, tailElem: listElem }
  const headHtml = `<${tagName}${attrStr}>${items.slice(0, fittingCount).map(it => it.outerHTML).join('')}</${tagName}>`
  const tailElem = document.createElement(tagName)
  Array.from(listElem.attributes).forEach(a => tailElem.setAttribute(a.name, a.value))
  tailElem.innerHTML = items.slice(fittingCount).map(it => it.outerHTML).join('')
  return { headHtml, tailElem }
}

function splitParagraphElement(
  elem: HTMLElement, availableHeight: number, measureContainer: HTMLElement
): { headHtml: string | null; tailElem: HTMLElement | null } {
  if (availableHeight < 28) return { headHtml: null, tailElem: elem }
  const tokens = elem.innerHTML.split(/(\s+)/)
  if (tokens.length <= 1) return { headHtml: null, tailElem: elem }
  const tagName = elem.tagName.toLowerCase()
  const attrs = Array.from(elem.attributes).map(a => `${a.name}="${a.value}"`).join(' ')
  const attrStr = attrs ? ' ' + attrs : ''
  let low = 1, high = tokens.length - 1, bestIndex = 0
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    measureContainer.innerHTML = `<${tagName}${attrStr}>${tokens.slice(0, mid).join('')}</${tagName}>`
    if (measureContainer.scrollHeight <= availableHeight) { bestIndex = mid; low = mid + 1 } else { high = mid - 1 }
  }
  if (bestIndex <= 0) return { headHtml: null, tailElem: elem }
  const headHtml = `<${tagName}${attrStr}>${tokens.slice(0, bestIndex).join('')}</${tagName}>`
  const tailElem = document.createElement(tagName)
  Array.from(elem.attributes).forEach(a => tailElem.setAttribute(a.name, a.value))
  tailElem.innerHTML = tokens.slice(bestIndex).join('')
  if (!tailElem.textContent?.trim()) return { headHtml: null, tailElem: elem }
  return { headHtml, tailElem }
}

function paginateHtml(
  html: string, fontSizePt: string, fontFamily: string,
  margin: MarginPreset, mergeValues: Record<string, string>
): string[][] {
  if (typeof window === 'undefined') return [[html]]
  const parser = new DOMParser()
  const resolved = resolveDynamicVariables(html, mergeValues)
  const doc = parser.parseFromString(`<div>${resolved}</div>`, 'text/html')
  const root = doc.querySelector('div')!
  const queue: HTMLElement[] = Array.from(root.childNodes).map(n => {
    if (n.nodeType === Node.TEXT_NODE) {
      const p = document.createElement('p'); p.textContent = n.textContent; return p
    }
    return n as HTMLElement
  }).filter(n => (n.outerHTML && n.outerHTML.trim()) || (n.textContent && n.textContent.trim()))

  const contentWidth = PAGE_W - margin.paddingLeft - margin.paddingRight
  const contentHeight = PAGE_H - margin.paddingTop - margin.paddingBottom - HEADER_H - FOOTER_H
  const measure = document.createElement('div')
  measure.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${contentWidth}px;font-size:${fontSizePt};font-family:${fontFamily};line-height:1.625;padding:0;visibility:hidden;pointer-events:none;white-space:pre-wrap;word-break:break-word;`
  document.body.appendChild(measure)

  const pages: string[][] = [[]]
  let usedHeight = 0
  while (queue.length > 0) {
    const node = queue.shift()!
    measure.innerHTML = ''; measure.appendChild(node.cloneNode(true))
    const h = measure.scrollHeight || 24
    if (usedHeight + h <= contentHeight) {
      pages[pages.length - 1].push(node.outerHTML || node.textContent || '')
      usedHeight += h; continue
    }
    const available = contentHeight - usedHeight
    const tag = node.tagName ? node.tagName.toUpperCase() : ''
    if ((tag === 'UL' || tag === 'OL') && available > 30) {
      const { headHtml, tailElem } = splitListElement(node, available, measure)
      if (headHtml && tailElem) {
        pages[pages.length - 1].push(headHtml); pages.push([]); usedHeight = 0
        queue.unshift(tailElem); continue
      }
    }
    if ((tag === 'P' || tag === 'BLOCKQUOTE' || tag === 'DIV') && available > 28) {
      const { headHtml, tailElem } = splitParagraphElement(node, available, measure)
      if (headHtml && tailElem) {
        pages[pages.length - 1].push(headHtml); pages.push([]); usedHeight = 0
        queue.unshift(tailElem); continue
      }
    }
    if (usedHeight > 0) { pages.push([]); usedHeight = 0; queue.unshift(node) }
    else { pages[pages.length - 1].push(node.outerHTML || node.textContent || ''); usedHeight += h }
  }
  document.body.removeChild(measure)
  return pages.filter(p => p.length > 0 || pages.length === 1)
}

function calculateExactBreakPositions(
  paginatedPages: string[][], contentWidth: number, fontSizePt: string, fontFamily: string
): number[] {
  if (typeof window === 'undefined' || paginatedPages.length <= 1) return []
  const measure = document.createElement('div')
  measure.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${contentWidth}px;font-size:${fontSizePt};font-family:${fontFamily};line-height:1.625;padding:0;visibility:hidden;pointer-events:none;white-space:pre-wrap;word-break:break-word;`
  measure.className = 'prose max-w-none prose-p:my-2 prose-headings:font-bold prose-headings:text-black'
  document.body.appendChild(measure)
  const positions: number[] = []
  let cumH = 0
  for (let i = 0; i < paginatedPages.length - 1; i++) {
    measure.innerHTML = paginatedPages[i].join('')
    cumH += measure.scrollHeight
    positions.push(cumH)
  }
  document.body.removeChild(measure)
  return positions
}

// ─────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────

export function ContratoEditor({
  officeId, officeName = 'Oficina de Diseño', logoUrl, officeSpecialty = 'editorial',
  directorName = 'Director Responsable', initialContent,
}: Props) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

  // Typography
  const [fontSizePt, setFontSizePt] = useState('12pt')
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif')
  const [lineSpacing, setLineSpacing] = useState('1.5')

  // Page setup
  const [selectedMarginId, setSelectedMarginId] = useState('standard')
  const [showRedBreaks, setShowRedBreaks] = useState(true)
  const [showRedMargins, setShowRedMargins] = useState(true)

  // Presentation
  const [watermark, setWatermark] = useState<'none' | 'borrador' | 'confidencial'>('borrador')
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const [showTOC, setShowTOC] = useState(false)

  // Variables panel
  const [showVariablesPanel, setShowVariablesPanel] = useState(false)
  const [mergeFieldValues, setMergeFieldValues] = useState<Record<string, string>>({})
  const [variableSearch, setVariableSearch] = useState('')
  const [selectedVarCategory, setSelectedVarCategory] = useState<'all' | 'freelancer' | 'vacante' | 'oficina' | 'sistema'>('all')
  const [recentlyInsertedKey, setRecentlyInsertedKey] = useState<string | null>(null)

  // Table modal
  const [showTableModal, setShowTableModal] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [versionHistory, setVersionHistory] = useState<VersionEntry[]>([])

  // Comment
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [pendingComment, setPendingComment] = useState('')

  // Clause panel
  const [showClausePanel, setShowClausePanel] = useState(false)

  // Color pickers
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)

  const editorWrapRef = useRef<HTMLDivElement>(null)
  const HISTORY_KEY = `knoten_contrato_${officeId}_history`

  const specialtyLabel = useMemo(
    () => OFFICE_SPECIALTIES.find(s => s.value === officeSpecialty)?.label ?? officeSpecialty,
    [officeSpecialty]
  )
  const activeMargin = useMemo(
    () => MARGIN_PRESETS.find(m => m.id === selectedMarginId) ?? MARGIN_PRESETS[0],
    [selectedMarginId]
  )
  const detectedMergeFields = useMemo(() => detectMergeFields(content), [content])
  const tocHtml = useMemo(() => generateTOC(content), [content])

  const paginatedPages = useMemo(
    () => paginateHtml(content, fontSizePt, fontFamily, activeMargin, mergeFieldValues),
    [content, fontSizePt, fontFamily, activeMargin, mergeFieldValues]
  )
  const redBreakPositions = useMemo(() => {
    const w = PAGE_W - activeMargin.paddingLeft - activeMargin.paddingRight
    return calculateExactBreakPositions(paginatedPages, w, fontSizePt, fontFamily)
  }, [paginatedPages, activeMargin, fontSizePt, fontFamily])

  const editorPageCount = paginatedPages.length

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
      setVersionHistory(saved)
    } catch { /* ignore */ }
  }, [HISTORY_KEY])

  const saveToHistory = useCallback((c: string) => {
    const entry: VersionEntry = {
      timestamp: Date.now(),
      label: new Date().toLocaleString('es-ES'),
      content: c,
    }
    setVersionHistory(prev => {
      const updated = [entry, ...prev].slice(0, 25)
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }, [HISTORY_KEY])

  const [, setSelectionTick] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextStyle, FontFamily, FontSize, LineHeight, IndentExtension,
      CommentMark, Subscript, Superscript, Underline,
      Color, Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow, TableCell, TableHeader,
      CharacterCount.configure({ limit: null }),
    ],
    content: initialContent || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'focus:outline-none text-black prose max-w-none prose-p:my-2 prose-headings:font-bold prose-headings:text-black',
      },
    },
    onSelectionUpdate: () => {
      setSelectionTick(t => t + 1)
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setContent(html === '<p></p>' ? '' : html)
    },
  })



  const save = async () => {
    setLoading(true); setError(null); setSaved(false)
    saveToHistory(content)
    const supabase = createClient()
    const { error: err } = await supabase.from('offices').update({ contrato_contenido: content }).eq('id', officeId)
    if (err) { setError(`Error al guardar: ${err.message}`) } else { setSaved(true); router.refresh() }
    setLoading(false)
  }



  const insertDateVariable = () => {
    if (!editor) return
    editor.chain().focus().insertContent(' {{fecha_emision}} ').run()
  }

  const insertMergeField = (key: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(` {{${key}}} `).run()
    setRecentlyInsertedKey(key)
    setTimeout(() => setRecentlyInsertedKey(null), 2500)
  }

  const addComment = () => {
    if (!editor || !pendingComment.trim()) return
    ;(editor.chain().focus() as any).setComment(pendingComment.trim()).run()
    setPendingComment(''); setShowCommentInput(false)
  }

  const insertClause = (template: typeof CLAUSE_TEMPLATES[0]) => {
    if (!editor) return
    editor.chain().focus().insertContent(template.html).run()
    setShowClausePanel(false)
  }

  const insertTable = () => {
    if (!editor) return
    ;(editor.chain().focus() as any).insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run()
    setShowTableModal(false)
  }

  const restoreVersion = (entry: VersionEntry) => {
    if (!editor) return
    editor.commands.setContent(entry.content)
    setContent(entry.content)
    setShowHistoryModal(false)
  }

  const deleteVersion = (timestamp: number) => {
    setVersionHistory(prev => {
      const updated = prev.filter(v => v.timestamp !== timestamp)
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }

  const clearAllVersions = () => {
    if (confirm('¿Estás seguro de vaciar todo el historial de versiones guardadas?')) {
      setVersionHistory([])
      try { localStorage.removeItem(HISTORY_KEY) } catch { /* ignore */ }
    }
  }

  // ── Componente botón de toolbar ──
  const Btn = ({ onClick, active, children, title, className = '' }: {
    onClick: () => void; active?: boolean; children: React.ReactNode; title?: string; className?: string
  }) => (
    <button type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded-lg transition-all text-xs flex items-center justify-center cursor-pointer shrink-0 ${
        active ? 'bg-neutral-900 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/90 hover:text-black'
      } ${className}`}>
      {children}
    </button>
  )

  // ── Renderizar una hoja carta (vista previa + impresión) ──
  const renderPageSheet = (pageBlocks: string[], idx: number, total: number) => (
    <div key={idx} className="preview-sheet print-page-sheet" style={{ fontFamily, fontSize: fontSizePt,
      paddingTop: `${activeMargin.paddingTop}px`, paddingBottom: `${activeMargin.paddingBottom}px`,
      paddingLeft: `${activeMargin.paddingLeft}px`, paddingRight: `${activeMargin.paddingRight}px` }}>
      {/* Membrete */}
      <div className="preview-hdr">
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl && <img src={logoUrl} alt={officeName} className="h-3.5 max-w-[90px] object-contain shrink-0 opacity-40 grayscale" />}
          <span className="truncate">{officeName}</span>
        </div>
        <span className="uppercase tracking-wider shrink-0">{specialtyLabel}</span>
      </div>
      {/* TOC solo en primera página si está activada */}
      {idx === 0 && showTOC && tocHtml && (
        <div dangerouslySetInnerHTML={{ __html: tocHtml }} />
      )}
      {/* Numeración de líneas wrapper */}
      <div className={showLineNumbers ? 'line-numbered' : ''}>
        <div className="preview-body prose max-w-none text-black"
          dangerouslySetInnerHTML={{ __html: pageBlocks.join('') }} />
      </div>
      {/* Firma (última página) */}
      {idx === total - 1 && (
        <div className="pt-6 pb-1 text-center select-none">
          <div className="w-52 border-t-2 border-black mx-auto mb-2" />
          <p className="font-bold text-[11px] text-black uppercase tracking-wide">{directorName}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Director de la {specialtyLabel}</p>
        </div>
      )}
      {/* Marca de agua */}
      {watermark !== 'none' && (
        <div className="watermark-overlay">
          {watermark === 'borrador' ? 'BORRADOR' : 'CONFIDENCIAL'}
        </div>
      )}
      {/* Pie */}
      <div className="preview-ftr">
        <span>Documento emitido en plataforma Knoten</span>
        <span>Página {idx + 1} de {total}</span>
      </div>
    </div>
  )

  const wordCount = editor ? editor.storage.characterCount?.words?.() ?? 0 : 0
  const charCount = editor ? editor.storage.characterCount?.characters?.() ?? 0 : 0

  // ──────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────
  return (
    <div className="space-y-4">
      <style jsx global>{`
        /* ── Tabla TipTap ── */
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 8px 0;
        }
        .ProseMirror td, .ProseMirror th {
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          min-width: 50px;
          vertical-align: top;
        }
        .ProseMirror th {
          background: #f9fafb;
          font-weight: 700;
        }
        .ProseMirror .selectedCell::after {
          content: '';
          background: #dbeafe88;
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
        }
        /* ── Guías de edición ── */
        .red-break-line {
          pointer-events: none; position: absolute;
          left: 0; right: 0; height: 0;
          border-top: 2px dashed #ef4444; z-index: 30;
        }
        .red-break-tag {
          pointer-events: none; position: absolute; right: 12px;
          transform: translateY(-50%); background: #fee2e2; color: #dc2626;
          border: 1px solid #fca5a5; font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 9999px; white-space: nowrap; z-index: 31;
          display: flex; align-items: center; gap: 4px;
        }
        .red-margin-guide {
          pointer-events: none; position: absolute;
          border: 1px dashed #ef4444; opacity: 0.6; z-index: 25;
        }
        /* ── Hoja carta ── */
        .preview-sheet {
          background: white; width: ${PAGE_W}px; height: ${PAGE_H}px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.13); position: relative;
          overflow: hidden; box-sizing: border-box;
          display: flex; flex-direction: column;
        }
        .preview-hdr, .preview-ftr {
          flex-shrink: 0; display: flex; align-items: center;
          justify-content: space-between; font-size: 10px; color: #9ca3af;
        }
        .preview-hdr { height: ${HEADER_H}px; border-bottom: 1px solid #f3f4f6; margin-bottom: 8px; }
        .preview-ftr { height: ${FOOTER_H}px; border-top: 1px solid #f3f4f6; margin-top: auto; padding-top: 8px; }
        .preview-body { flex: 1; overflow: hidden; min-height: 0; font-size: inherit; }
        .ProseMirror p, .preview-body p { margin-top: 6px !important; margin-bottom: 6px !important; }
        .ProseMirror h1, .preview-body h1 { font-size: 1.65em !important; font-weight: 700 !important; line-height: 1.25 !important; margin: 0.6em 0 0.3em !important; }
        .ProseMirror h2, .preview-body h2 { font-size: 1.35em !important; font-weight: 700 !important; line-height: 1.3 !important; margin: 0.5em 0 0.25em !important; }
        .ProseMirror h3, .preview-body h3 { font-size: 1.15em !important; font-weight: 700 !important; line-height: 1.35 !important; margin: 0.4em 0 0.2em !important; }
        .preview-body ul { list-style: disc; padding-left: 1.25em; margin: 0.35em 0; }
        .preview-body ol { list-style: decimal; padding-left: 1.25em; margin: 0.35em 0; }
        .preview-body blockquote { border-left: 3px solid #e5e7eb; padding-left: 0.75em; color: #6b7280; margin: 0.35em 0; }
        .preview-body table { border-collapse: collapse; width: 100%; }
        .preview-body td, .preview-body th { border: 1px solid #d1d5db; padding: 5px 8px; font-size: 0.92em; }
        .preview-body th { background: #f9fafb; font-weight: 700; }
        /* ── Numeración de líneas ── */
        .line-numbered { counter-reset: line-counter; }
        .line-numbered .preview-body p { counter-increment: line-counter; }
        .line-numbered .preview-body p::before {
          content: counter(line-counter);
          display: inline-block; width: 28px; color: #9ca3af;
          font-size: 9px; text-align: right; margin-right: 8px;
          margin-left: -36px; user-select: none;
        }
        /* ── Marca de agua ── */
        .watermark-overlay {
          position: absolute; inset: 0; display: flex;
          align-items: center; justify-content: center;
          font-size: 72px; font-weight: 900; letter-spacing: .15em;
          color: #00000010; pointer-events: none; z-index: 10;
          transform: rotate(-45deg); user-select: none; white-space: nowrap;
        }
        /* ── Editor watermark ── */
        .editor-watermark {
          position: absolute; inset: 0; display: flex;
          align-items: center; justify-content: center;
          font-size: 64px; font-weight: 900; letter-spacing: .1em;
          color: #00000008; pointer-events: none; z-index: 5;
          transform: rotate(-45deg); user-select: none; white-space: nowrap;
        }
        /* ── Marca de agua en impresión ── */
        @media print {
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; display: flex !important; flex-direction: column !important; align-items: center !important; background: white !important; }
          .print-page-sheet { box-shadow: none !important; page-break-after: always !important; break-after: page !important; margin: 0 !important; }
          .print-page-sheet:last-child { page-break-after: auto !important; break-after: auto !important; }
          .no-print { display: none !important; }
          @page { size: letter portrait; margin: 0; }
        }
      `}</style>

      {/* ── Área de impresión (siempre en DOM) ── */}
      <div id="print-area" className="hidden print:flex flex-col items-center">
        {paginatedPages.map((blocks, idx) => renderPageSheet(blocks, idx, paginatedPages.length))}
      </div>

      {/* ── Cabecera ── */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Contrato Marco · {officeName}</h2>
            <p className="text-xs text-gray-500">Editor profesional con variables dinámicas, plantillas y vista previa</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setShowVariablesPanel(!showVariablesPanel)}
            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer">
            <Braces className="w-3.5 h-3.5" />
            Variables {detectedMergeFields.length > 0 && <span className="bg-amber-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{detectedMergeFields.length}</span>}
          </button>
          <button type="button" onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center gap-1.5 bg-neutral-50 hover:bg-neutral-100 text-gray-700 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer">
            <History className="w-3.5 h-3.5" /> Historial
          </button>

          <button type="button" onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer">
            <Printer className="w-3.5 h-3.5" /> Imprimir PDF
          </button>
          <button type="button" onClick={save} disabled={loading}
            className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-900 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer">
            <FileDown className="w-3.5 h-3.5" /> {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl px-5 py-3 font-medium no-print">{error}</div>}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl px-5 py-3 font-semibold flex items-center gap-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> ¡Contrato guardado correctamente!
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-2xl p-1 w-fit no-print">
        {(['editor', 'preview'] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'
            }`}>
            {tab === 'editor' ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {tab === 'editor' ? 'Editor' : 'Vista previa'}
          </button>
        ))}
      </div>

      {/* ── TAB EDITOR ── */}
      {activeTab === 'editor' && editor && (
        <div className="space-y-3 no-print">

          {/* ═══════════════════════════════════════════════════════
              BARRA DE HERRAMIENTAS STICKY — 3 FILAS
          ═══════════════════════════════════════════════════════ */}
          <div className="bg-white/97 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm overflow-hidden sticky top-[64px] z-30">

            {/* FILA 1: Tipografía y Formato */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-gray-100 flex-wrap">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mr-1 shrink-0">Texto</span>

              {/* Fuente & Tamaño */}
              <div className="flex items-center gap-1 bg-neutral-50 border border-gray-200/80 rounded-xl px-2 py-1">
                <select
                  value={editor?.getAttributes('textStyle')?.fontFamily || fontFamily}
                  onChange={e => { setFontFamily(e.target.value); editor.chain().focus().setFontFamily(e.target.value).run() }}
                  className="text-xs border-0 bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer max-w-[110px]"
                >
                  {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <div className="w-px h-3.5 bg-gray-300" />
                <select
                  value={
                    editor?.getAttributes('textStyle')?.fontSize || (
                      editor?.isActive('heading', { level: 1 }) ? '20pt' :
                      editor?.isActive('heading', { level: 2 }) ? '16pt' :
                      editor?.isActive('heading', { level: 3 }) ? '14pt' :
                      fontSizePt
                    )
                  }
                  onChange={e => {
                    const val = e.target.value
                    if (editor) {
                      if (editor.state.selection.empty) {
                        setFontSizePt(val)
                      } else {
                        ;(editor.chain().focus() as any).setFontSize(val).run()
                      }
                    } else {
                      setFontSizePt(val)
                    }
                  }}
                  className="text-xs border-0 bg-transparent text-gray-800 font-bold focus:outline-none cursor-pointer w-14"
                >
                  {FONT_SIZES_PT.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* Interlineado */}
              <div className="flex items-center gap-1 bg-neutral-50 border border-gray-200/80 rounded-xl px-2 py-1">
                <AlignJustify className="w-3 h-3 text-gray-400 shrink-0" />
                <select
                  value={
                    editor?.getAttributes('paragraph')?.lineHeight ||
                    editor?.getAttributes('heading')?.lineHeight ||
                    lineSpacing
                  }
                  onChange={e => {
                    const val = e.target.value
                    setLineSpacing(val)
                    if (editor) {
                      ;(editor.chain().focus() as any).setLineHeight(val).run()
                    }
                  }}
                  className="text-xs border-0 bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer w-12"
                >
                  {LINE_SPACINGS.map(ls => <option key={ls.value} value={ls.value}>{ls.value}x</option>)}
                </select>
              </div>

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* B I U S */}
              <div className="flex items-center gap-0.5 bg-neutral-50 border border-gray-200/80 rounded-xl p-1">
                <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita"><Bold className="w-3.5 h-3.5" /></Btn>
                <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva"><Italic className="w-3.5 h-3.5" /></Btn>
                <Btn onClick={() => (editor.chain().focus() as any).toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado"><UnderlineIcon className="w-3.5 h-3.5" /></Btn>
                <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado"><Strikethrough className="w-3.5 h-3.5" /></Btn>
              </div>

              {/* Sub / Sup */}
              <div className="flex items-center gap-0.5 bg-neutral-50 border border-gray-200/80 rounded-xl p-1">
                <Btn onClick={() => (editor.chain().focus() as any).toggleSubscript().run()} active={editor.isActive('subscript')} title="Subíndice">
                  <span className="text-xs font-bold leading-none">X<sub>₂</sub></span>
                </Btn>
                <Btn onClick={() => (editor.chain().focus() as any).toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superíndice">
                  <span className="text-xs font-bold leading-none">X<sup>²</sup></span>
                </Btn>
              </div>

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* Color de texto */}
              <div className="relative">
                <button type="button" onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false) }}
                  title="Color de texto"
                  className="flex items-center gap-1 bg-neutral-50 border border-gray-200/80 rounded-xl px-2 py-1.5 text-xs font-medium hover:bg-gray-100 cursor-pointer transition-all">
                  <Palette className="w-3.5 h-3.5" />
                  <div className="w-3 h-1.5 rounded-sm" style={{ background: (editor.getAttributes('textStyle') as any).color || '#000' }} />
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 grid grid-cols-6 gap-1 w-36">
                    {TEXT_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false) }}
                        className="w-5 h-5 rounded cursor-pointer border border-gray-300 hover:scale-110 transition-transform"
                        style={{ background: c }} title={c} />
                    ))}
                    <button type="button" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false) }}
                      className="col-span-6 text-[10px] text-gray-500 hover:text-gray-800 cursor-pointer mt-0.5">Quitar color</button>
                  </div>
                )}
              </div>

              {/* Resaltado */}
              <div className="relative">
                <button type="button" onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false) }}
                  title="Color de resaltado"
                  className="flex items-center gap-1 bg-neutral-50 border border-gray-200/80 rounded-xl px-2 py-1.5 text-xs font-medium hover:bg-gray-100 cursor-pointer transition-all">
                  <span className="text-sm">🖍</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showHighlightPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 grid grid-cols-6 gap-1 w-36">
                    {HIGHLIGHT_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightPicker(false) }}
                        className="w-5 h-5 rounded cursor-pointer border border-gray-300 hover:scale-110 transition-transform"
                        style={{ background: c }} title={c} />
                    ))}
                    <button type="button" onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false) }}
                      className="col-span-6 text-[10px] text-gray-500 hover:text-gray-800 cursor-pointer mt-0.5">Quitar resaltado</button>
                  </div>
                )}
              </div>
            </div>

            {/* FILA 2: Párrafo, Estructura y Contenido */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-gray-100 flex-wrap">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mr-1 shrink-0">Párrafo</span>

              {/* Encabezados */}
              <div className="flex items-center gap-0.5 bg-neutral-50 border border-gray-200/80 rounded-xl p-1">
                {([1, 2, 3] as const).map(level => (
                  <Btn key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                    active={editor.isActive('heading', { level })} title={`Encabezado ${level}`}>
                    <span className="text-xs font-bold">H{level}</span>
                  </Btn>
                ))}
                <Btn onClick={() => editor.chain().focus().setParagraph().run()}
                  active={editor.isActive('paragraph')} title="Párrafo normal">
                  <span className="text-xs">¶</span>
                </Btn>
              </div>

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* Alineación */}
              <div className="flex items-center gap-0.5 bg-neutral-50 border border-gray-200/80 rounded-xl p-1">
                <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Izquierda"><AlignLeft className="w-3.5 h-3.5" /></Btn>
                <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centro"><AlignCenter className="w-3.5 h-3.5" /></Btn>
                <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Derecha"><AlignRight className="w-3.5 h-3.5" /></Btn>
                <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificado"><AlignJustify className="w-3.5 h-3.5" /></Btn>
              </div>

              {/* Sangrías */}
              <div className="flex items-center gap-0.5 bg-neutral-50 border border-gray-200/80 rounded-xl p-1">
                <Btn onClick={() => (editor.chain().focus() as any).outdentLeft().run()} title="Disminuir sangría izquierda"><OutdentIcon className="w-3.5 h-3.5" /></Btn>
                <Btn onClick={() => (editor.chain().focus() as any).indentLeft().run()} title="Aumentar sangría izquierda"><IndentIcon className="w-3.5 h-3.5" /></Btn>
                <div className="w-px h-3.5 bg-gray-300 mx-0.5" />
                <Btn onClick={() => (editor.chain().focus() as any).indentRight().run()} title="Aumentar sangría derecha"><IndentIcon className="w-3.5 h-3.5 rotate-180" /></Btn>
                <Btn onClick={() => (editor.chain().focus() as any).outdentRight().run()} title="Disminuir sangría derecha"><OutdentIcon className="w-3.5 h-3.5 rotate-180" /></Btn>
              </div>

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* Listas y citas */}
              <div className="flex items-center gap-0.5 bg-neutral-50 border border-gray-200/80 rounded-xl p-1">
                <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista viñetas"><List className="w-3.5 h-3.5" /></Btn>
                <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada"><ListOrdered className="w-3.5 h-3.5" /></Btn>
                <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita"><Quote className="w-3.5 h-3.5" /></Btn>
              </div>

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* Tabla */}
              <button type="button" onClick={() => setShowTableModal(true)}
                className="flex items-center gap-1.5 bg-neutral-50 border border-gray-200/80 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-all">
                <Table2 className="w-3.5 h-3.5" /> Tabla
              </button>

              {/* Plantillas de cláusulas */}
              <div className="relative">
                <button type="button" onClick={() => setShowClausePanel(!showClausePanel)}
                  className="flex items-center gap-1.5 bg-neutral-50 border border-gray-200/80 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-all">
                  <BookOpen className="w-3.5 h-3.5" /> Cláusula
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showClausePanel && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 w-60 py-1 overflow-hidden">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 py-2">Plantillas de cláusulas</p>
                    {CLAUSE_TEMPLATES.map(tpl => (
                      <button key={tpl.label} type="button" onClick={() => insertClause(tpl)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-neutral-50 cursor-pointer transition-all font-medium">
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* Variables dinámicas */}
              <button type="button" onClick={() => setShowVariablesPanel(!showVariablesPanel)}
                className="flex items-center gap-1.5 bg-amber-500 text-white rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-amber-600 cursor-pointer transition-all shadow-xs"
                title="Gestor de variables dinámicas del contrato">
                <Braces className="w-3.5 h-3.5 text-white" /> Variables {detectedMergeFields.length > 0 && <span className="bg-amber-700 text-white text-[10px] rounded-full px-1.5 font-mono">{detectedMergeFields.length}</span>}
              </button>

              <div className="w-px h-5 bg-gray-200 mx-0.5" />

              {/* Comentario */}
              <div className="relative">
                <button type="button" onClick={() => setShowCommentInput(!showCommentInput)}
                  className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-yellow-100 cursor-pointer transition-all"
                  title="Agregar comentario/nota a la selección">
                  <MessageSquare className="w-3.5 h-3.5" /> Nota
                </button>
                {showCommentInput && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-3 w-64">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Agregar nota al texto seleccionado</p>
                    <input type="text" value={pendingComment} onChange={e => setPendingComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addComment() }}
                      placeholder="Escribe tu nota..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-300 mb-2" />
                    <div className="flex gap-2">
                      <button type="button" onClick={addComment}
                        className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded-xl py-1.5 text-xs font-bold cursor-pointer">Agregar</button>
                      <button type="button" onClick={() => setShowCommentInput(false)}
                        className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-1.5 text-xs cursor-pointer">✕</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FILA 3: Configuración de página y documento */}
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 flex-wrap bg-neutral-50/50">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mr-1 shrink-0">Página</span>

                {/* Márgenes */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200/80 rounded-xl px-2 py-1">
                  <Sliders className="w-3 h-3 text-gray-400 shrink-0" />
                  <select value={selectedMarginId} onChange={e => setSelectedMarginId(e.target.value)}
                    className="text-xs bg-transparent text-gray-800 font-semibold focus:outline-none cursor-pointer">
                    {MARGIN_PRESETS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>

                {/* Marca de agua */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200/80 rounded-xl px-2 py-1">
                  <Shield className="w-3 h-3 text-gray-400 shrink-0" />
                  <select value={watermark} onChange={e => setWatermark(e.target.value as any)}
                    className="text-xs bg-transparent text-gray-800 font-semibold focus:outline-none cursor-pointer">
                    <option value="none">Sin marca</option>
                    <option value="borrador">BORRADOR</option>
                    <option value="confidencial">CONFIDENCIAL</option>
                  </select>
                </div>

                {/* Numeración de líneas */}
                <button type="button" onClick={() => setShowLineNumbers(!showLineNumbers)}
                  className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl border font-semibold cursor-pointer transition-all ${showLineNumbers ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  <Hash className="w-3 h-3" /> Núm. líneas
                </button>

                {/* TOC */}
                <button type="button" onClick={() => setShowTOC(!showTOC)}
                  className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl border font-semibold cursor-pointer transition-all ${showTOC ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  <BookOpen className="w-3 h-3" /> Índice TOC
                </button>
              </div>

              {/* Guías rojas */}
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setShowRedBreaks(!showRedBreaks)}
                  className={`text-[11px] px-2 py-1 rounded-lg border font-medium flex items-center gap-1 cursor-pointer transition-all ${showRedBreaks ? 'bg-red-50 text-red-700 border-red-200 font-bold' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                  title="Mostrar/ocultar líneas de salto de página">
                  <Scissors className="w-3 h-3" /> Saltos
                </button>
                <button type="button" onClick={() => setShowRedMargins(!showRedMargins)}
                  className={`text-[11px] px-2 py-1 rounded-lg border font-medium flex items-center gap-1 cursor-pointer transition-all ${showRedMargins ? 'bg-red-50 text-red-700 border-red-200 font-bold' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                  title="Mostrar/ocultar guía de márgenes">
                  <Square className="w-3 h-3" /> Márgenes
                </button>
              </div>
            </div>
          </div>
          {/* FIN TOOLBAR */}

          {/* ── Lienzo del Editor ── */}
          <div className="bg-neutral-200/90 rounded-3xl p-6 sm:p-10 border border-neutral-300 shadow-inner overflow-x-auto flex justify-center">
            <div className="bg-white shadow-2xl relative text-black" style={{
              width: `${PAGE_W}px`, minHeight: `${PAGE_H}px`,
              paddingTop: `${activeMargin.paddingTop}px`, paddingBottom: `${activeMargin.paddingBottom}px`,
              paddingLeft: `${activeMargin.paddingLeft}px`, paddingRight: `${activeMargin.paddingRight}px`,
              fontFamily, fontSize: fontSizePt, boxSizing: 'border-box',
            }}>
              {/* Marca de agua en editor */}
              {watermark !== 'none' && (
                <div className="editor-watermark">{watermark === 'borrador' ? 'BORRADOR' : 'CONFIDENCIAL'}</div>
              )}
              {/* Guía visual roja de márgenes */}
              {showRedMargins && (
                <div className="red-margin-guide" style={{
                  top: `${activeMargin.paddingTop}px`, bottom: `${activeMargin.paddingBottom}px`,
                  left: `${activeMargin.paddingLeft}px`, right: `${activeMargin.paddingRight}px`,
                }} />
              )}
              {/* Membrete */}
              <div className="border-b border-gray-100 pb-2 mb-4 flex items-center justify-between text-[10px] text-gray-400 select-none">
                <div className="flex items-center gap-2 min-w-0">
                  {logoUrl && <img src={logoUrl} alt={officeName} className="h-3.5 max-w-[90px] object-contain shrink-0 opacity-40 grayscale" />}
                  <span className="truncate">{officeName}</span>
                </div>
                <span className="uppercase tracking-wider shrink-0">{specialtyLabel}</span>
              </div>
              {/* Área editable */}
              <div ref={editorWrapRef} className="relative min-h-[500px]">
                <EditorContent editor={editor} />
                {/* Líneas rojas de salto de página */}
                {showRedBreaks && redBreakPositions.map((yPos, idx) => (
                  <div key={idx} style={{ top: `${yPos}px` }} className="red-break-line">
                    <span className="red-break-tag"><Scissors className="w-3 h-3" /> Pág {idx + 2}</span>
                  </div>
                ))}
              </div>
              {/* Firma Director */}
              <div className="pt-12 pb-3 text-center select-none mt-auto">
                <div className="w-52 border-t-2 border-black mx-auto mb-2" />
                <p className="font-bold text-[11px] text-black uppercase tracking-wide">{directorName}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Director de la {specialtyLabel}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{officeName}</p>
              </div>
              {/* Pie de página en edición */}
              <div className="border-t border-gray-100 pt-2 mt-4 flex items-center justify-between text-[10px] text-gray-400 select-none">
                <span>Documento emitido en plataforma Knoten</span>
                <span>~{editorPageCount} {editorPageCount === 1 ? 'página' : 'páginas'}</span>
              </div>
            </div>
          </div>

          {/* ── Barra de estado ── */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-2">
            <div className="flex items-center gap-4">
              <span><strong className="text-gray-600">{wordCount}</strong> palabras</span>
              <span><strong className="text-gray-600">{charCount}</strong> caracteres</span>
              <span><strong className="text-gray-600">~{editorPageCount}</strong> {editorPageCount === 1 ? 'página' : 'páginas'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Variables detectadas: <code className="bg-gray-100 px-1 rounded">{detectedMergeFields.length === 0 ? 'ninguna' : detectedMergeFields.map(f => `{{${f}}}`).join(', ')}</code></span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB VISTA PREVIA ── */}
      {activeTab === 'preview' && (
        <div className="space-y-3 no-print">
          <div className="bg-neutral-200/90 rounded-3xl p-6 sm:p-10 border border-neutral-300 shadow-inner overflow-x-auto flex justify-center">
            <div className="flex flex-col items-center gap-8">
              {paginatedPages.length === 0 ? (
                <div className="preview-sheet flex items-center justify-center text-gray-400 text-sm">
                  El contrato está vacío. Escribe algo en el Editor.
                </div>
              ) : paginatedPages.map((blocks, idx) => renderPageSheet(blocks, idx, paginatedPages.length))}
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Vista de solo lectura · {paginatedPages.length} {paginatedPages.length === 1 ? 'hoja carta' : 'hojas carta'} · Las variables <code className="bg-gray-100 px-1 rounded">{'{{...}}'}</code> se resuelven automáticamente
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          PANEL LATERAL — GESTOR DE VARIABLES DINÁMICAS
      ═══════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════
          MODAL CLÁSICO — GESTOR DE VARIABLES DINÁMICAS
      ═══════════════════════════════════════════════════ */}
      {showVariablesPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 no-print">
          {/* Fondo oscurecido con transparencia que deja ver la página de fondo */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowVariablesPanel(false)}
          />

          {/* Diálogo modal clásico flotante y espacioso */}
          <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden z-10">
            {/* Header del modal */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">Gestor de Variables del Contrato</h2>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  Inserta variables dinámicas que se completarán automáticamente desde la Base de Datos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVariablesPanel(false)}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-xs"
              >
                Cerrar (Esc)
              </button>
            </div>

            {/* Contenido principal con scroll interno */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Cuadro de instrucciones minimalista */}
              <div className="border border-gray-300 bg-neutral-50 rounded-2xl p-4 space-y-1.5">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">Instrucciones y Funcionamiento</h3>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Haz clic en <strong className="text-black">+ Insertar en documento</strong> en cualquier variable para colocar la etiqueta en la posición exacta de tu cursor. Al emitirse o firmarse el contrato para una vacante, el sistema extraerá los datos reales de Supabase. Durante la fase de edición, el lienzo muestra valores de ejemplo ficticios.
                </p>
              </div>

              {/* Buscador y Pestañas de Filtro */}
              <div className="space-y-4 border-b border-gray-200 pb-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {/* Buscador de texto libre */}
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      value={variableSearch}
                      onChange={e => setVariableSearch(e.target.value)}
                      placeholder="Buscar variable por nombre, clave o origen BD..."
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                    />
                    {variableSearch && (
                      <button
                        type="button"
                        onClick={() => setVariableSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black font-bold text-xs p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filtro por Categorías (Minimalista sin iconos ni emojis) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    {[
                      { id: 'all', label: 'Todas las variables' },
                      { id: 'sistema', label: 'Fecha' },
                      { id: 'freelancer', label: 'Freelancer' },
                      { id: 'vacante', label: 'Vacante / Proyecto' },
                      { id: 'oficina', label: 'Oficina / Director' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedVarCategory(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                          selectedVarCategory === tab.id
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sección de Variables Detectadas en el Documento Actual */}
              {detectedMergeFields.length > 0 && !variableSearch && selectedVarCategory === 'all' && (
                <div className="border border-gray-300 bg-white rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                        Variables presentes en tu contrato ({detectedMergeFields.length})
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Puedes probar valores de simulación para ver cómo lucen en vista previa</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detectedMergeFields.map(field => {
                      const sample = DUMMY_SAMPLE_VARIABLES[field] || 'Ejemplo de valor'
                      return (
                        <div key={field} className="border border-gray-200 rounded-xl p-3.5 bg-neutral-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <code className="bg-gray-200 text-black font-bold font-mono px-2.5 py-1 rounded text-xs">{`{{${field}}}`}</code>
                            <span className="text-[10px] text-gray-500 font-mono font-semibold">En texto</span>
                          </div>
                          <input
                            type="text"
                            value={mergeFieldValues[field] ?? ''}
                            onChange={e => setMergeFieldValues(prev => ({ ...prev, [field]: e.target.value }))}
                            placeholder={`Simular: "${sample}"`}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white text-black"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Catálogo de Variables en Grid (2 Columnas Espaciosas) */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Catálogo Completo de Variables</h3>

                {MERGE_FIELD_CATEGORIES
                  .filter(cat => selectedVarCategory === 'all' || cat.category === selectedVarCategory)
                  .map(cat => {
                    const matchingFields = cat.fields.filter(f =>
                      !variableSearch ||
                      f.label.toLowerCase().includes(variableSearch.toLowerCase()) ||
                      f.key.toLowerCase().includes(variableSearch.toLowerCase()) ||
                      f.dbSource.toLowerCase().includes(variableSearch.toLowerCase())
                    )

                    if (matchingFields.length === 0) return null

                    return (
                      <div key={cat.name} className="space-y-3">
                        <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
                          <h4 className="text-sm font-bold text-black">{cat.name}</h4>
                          <span className="text-xs text-gray-500 font-semibold">{matchingFields.length} disponibles</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchingFields.map(field => {
                            const isJustInserted = recentlyInsertedKey === field.key
                            return (
                              <div
                                key={field.key}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 bg-white ${
                                  isJustInserted
                                    ? 'border-black bg-neutral-50 ring-1 ring-black'
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <h5 className="font-bold text-sm text-black leading-snug">{field.label}</h5>
                                    <button
                                      type="button"
                                      onClick={() => insertMergeField(field.key)}
                                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
                                        isJustInserted
                                          ? 'bg-gray-200 text-black border border-gray-400 font-bold'
                                          : 'bg-black hover:bg-neutral-800 text-white'
                                      }`}
                                    >
                                      {isJustInserted ? '¡Insertado en cursor!' : '+ Insertar en documento'}
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-500 font-mono">
                                    Origen en BD: <span className="text-gray-900 font-semibold">{field.dbSource}</span>
                                  </p>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-50 rounded-xl p-3 border border-gray-200 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Clave:</span>
                                    <code className="bg-gray-200 text-black font-bold font-mono px-2 py-0.5 rounded text-xs">{`{{${field.key}}}`}</code>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Ejemplo: <span className="font-bold text-black">"{field.sampleValue}"</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-gray-200 bg-neutral-50 flex items-center justify-between text-xs text-gray-600 shrink-0">
              <span>Haz clic en <strong>+ Insertar en documento</strong> para agregar cualquier variable donde tengas ubicado el cursor.</span>
              <button
                type="button"
                onClick={() => setShowVariablesPanel(false)}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Finalizar selección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL — INSERTAR TABLA
      ═══════════════════════════════════════════════════ */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center no-print">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowTableModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-80">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Table2 className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-sm text-gray-900">Insertar tabla</h3>
              </div>
              <button type="button" onClick={() => setShowTableModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Filas</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setTableRows(Math.max(1, tableRows - 1))}
                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold text-gray-900 w-8 text-center">{tableRows}</span>
                  <button type="button" onClick={() => setTableRows(Math.min(20, tableRows + 1))}
                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Columnas</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setTableCols(Math.max(1, tableCols - 1))}
                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold text-gray-900 w-8 text-center">{tableCols}</span>
                  <button type="button" onClick={() => setTableCols(Math.min(10, tableCols + 1))}
                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Preview visual */}
              <div className="mt-3 flex flex-col gap-0.5">
                {Array.from({ length: Math.min(tableRows, 6) }).map((_, r) => (
                  <div key={r} className="flex gap-0.5">
                    {Array.from({ length: Math.min(tableCols, 6) }).map((_, c) => (
                      <div key={c} className={`flex-1 h-4 rounded-sm border ${r === 0 ? 'bg-gray-200 border-gray-400' : 'bg-gray-50 border-gray-200'}`} />
                    ))}
                  </div>
                ))}
                {(tableRows > 6 || tableCols > 6) && <p className="text-[10px] text-gray-400 text-center mt-1">Vista reducida — tabla real: {tableRows}×{tableCols}</p>}
              </div>
            </div>
            <button type="button" onClick={insertTable}
              className="w-full mt-5 bg-neutral-900 text-white rounded-2xl py-2.5 text-sm font-bold hover:bg-black cursor-pointer transition-all">
              Insertar tabla {tableRows}×{tableCols}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL — HISTORIAL DE VERSIONES
      ═══════════════════════════════════════════════════ */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center no-print">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowHistoryModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-[520px] max-h-[80vh] flex flex-col z-10 border border-gray-200">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-800" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Historial de versiones</h3>
                  <p className="text-[11px] text-gray-500">Versiones guardadas localmente</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {versionHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllVersions}
                    className="text-xs text-red-600 hover:text-red-800 font-bold px-2.5 py-1 rounded-xl hover:bg-red-50 cursor-pointer transition-all border border-red-200/60"
                  >
                    Vaciar historial
                  </button>
                )}
                <button type="button" onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {versionHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aún no hay versiones guardadas.</p>
                  <p className="text-xs mt-1 text-gray-400">Se guardan automáticamente al presionar «Guardar».</p>
                </div>
              ) : versionHistory.map((entry, idx) => (
                <div key={entry.timestamp}
                  className="flex items-center justify-between border border-gray-200/80 rounded-2xl p-3.5 hover:bg-neutral-50 transition-all bg-white">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{entry.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                      {idx === 0 ? '✦ Versión más reciente' : `Versión ${versionHistory.length - idx}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => restoreVersion(entry)}
                      className="flex items-center gap-1.5 bg-black text-white rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-neutral-800 cursor-pointer transition-all shadow-2xs">
                      <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                    </button>
                    <button type="button" onClick={() => deleteVersion(entry.timestamp)}
                      title="Eliminar esta versión"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs text-gray-500">
              <span className="text-[11px]">Se conservan hasta 25 versiones en tu navegador.</span>
              <button type="button" onClick={() => setShowHistoryModal(false)}
                className="font-bold text-gray-900 hover:text-black cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
