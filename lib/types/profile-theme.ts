// ============================================================
// Profile Theme Types
// Defines the full visual customization schema for a freelancer
// profile. Stored as a single JSONB column in freelancer_profiles.
// ============================================================

export type SectionId =
  | 'resumen'
  | 'especialidades'
  | 'software'
  | 'experiencia'
  | 'educacion'
  | 'certificaciones'
  | 'idiomas'
  | 'disponibilidad'

export type SectionKey = 'header' | SectionId

export type FontFamily = 'sans' | 'serif' | 'mono' | 'caligrafia'
export type DividerStyle = 'line' | 'dot' | 'none'
export type BgImageMode = 'cover' | 'repeat' | 'contain'
export type ProfileWidth = 'narrow' | 'normal' | 'wide'
export type ContrastMode = 'claro' | 'oscuro' | 'sepia'

export interface SectionThemeStyle {
  colorFondo?: string
  colorTexto?: string
  colorAccent?: string
  colorIconos?: string
  colorBorde?: string
  colorDivider?: string
  colorTagFondo?: string
  colorTagTexto?: string
  imagenFondoUrl?: string
  imagenFondoOpacidad?: number
  imagenFondoModo?: BgImageMode
  tipoLetra?: FontFamily
  tamanioTextoBase?: number
}

export interface ProfileTheme {
  // ── Colores Generales ─────────────────────────────────────
  colorFondo: string         // fondo del perfil       (#ffffff)
  colorTexto: string         // texto principal        (#111111)
  colorBorde: string         // bordes / tarjetas      (#e5e7eb)
  colorDivider: string       // divisores / separadores(#e5e7eb)
  colorSombra: string        // sombra                 (rgba(0,0,0,0.08))
  colorAccent: string        // acento: títulos, links (#111111)
  colorIconos: string        // color de íconos        (#6b7280)
  colorTagFondo: string      // fondo de chips/tags    (#f3f4f6)
  colorTagTexto: string      // texto de chips/tags    (#374151)

  // ── Personalización Por Secciones ───────────────────────────
  personalizarPorSecciones: boolean
  personalizarTipografiaPorSecciones: boolean
  estilosSecciones: Partial<Record<SectionKey, SectionThemeStyle>>

  // ── Horarios / Cuadrícula de Disponibilidad ──────────────
  horarioActiveBg: string        // bloque activo fondo    (#111111)
  horarioActiveText: string      // bloque activo texto    (#ffffff)
  horarioInactiveBg: string      // bloque inactivo fondo  (#e5e7eb)
  horarioHeaderText: string      // títulos días y horas   (#374151)
  horarioBorderRadius: number    // px 0–12                default 2
  horarioBorderColor: string     // borde de cuadrícula    (#e5e7eb)

  // ── Bordes Generales ──────────────────────────────────────
  anchoBorde: number         // px  0–4   default 1
  radioBorde: number         // px  0–24  default 12

  // ── Sombras Generales ─────────────────────────────────────
  sombrasActivas: boolean    // default false
  intensidadSombra: number   // blur px  0–20  default 8

  // ── Espaciado ────────────────────────────────────────────
  espaciadoSecciones: number    // gap entre secciones (rem×10) 4–16, default 10
  espaciadoSubsecciones: number // gap entre ítems     (rem×10) 2–10, default 5

  // ── Tipografía General ───────────────────────────────────
  tipoLetra: FontFamily      // default 'sans'
  tamanioTextoBase: number   // px  14–18  default 15

  // ── Imagen de Fondo General ──────────────────────────────
  imagenFondoUrl: string     // URL pública, default ''
  imagenFondoOpacidad: number // 0–100, default 20
  imagenFondoModo: BgImageMode // default 'cover'

  // ── Layout ───────────────────────────────────────────────
  ordenSecciones: SectionId[]
  anchoMaximo: ProfileWidth  // default 'normal'

  // ── Extras Visuales ──────────────────────────────────────
  estiloDivider: DividerStyle // default 'line'
  modoContraste: ContrastMode // preset rápido, default 'claro'
}

export const DEFAULT_ORDER: SectionId[] = [
  'resumen',
  'especialidades',
  'software',
  'experiencia',
  'educacion',
  'certificaciones',
  'idiomas',
  'disponibilidad',
]

export const ALL_SECTION_KEYS: SectionKey[] = [
  'header',
  'resumen',
  'especialidades',
  'software',
  'experiencia',
  'educacion',
  'certificaciones',
  'idiomas',
  'disponibilidad',
]

export const ALL_SECTION_LABELS: Record<SectionKey, string> = {
  header: 'Encabezado / Datos principales',
  resumen: 'Resumen profesional (Cuéntanos sobre ti)',
  especialidades: 'Especialidades',
  software: 'Software y herramientas',
  experiencia: 'Experiencia laboral',
  educacion: 'Formación académica',
  certificaciones: 'Certificaciones',
  idiomas: 'Idiomas',
  disponibilidad: 'Disponibilidad horaria',
}

export const SECTION_LABELS: Record<SectionId, string> = {
  resumen: 'Resumen profesional',
  especialidades: 'Especialidades',
  software: 'Software y herramientas',
  experiencia: 'Experiencia laboral',
  educacion: 'Formación académica',
  certificaciones: 'Certificaciones',
  idiomas: 'Idiomas',
  disponibilidad: 'Disponibilidad horaria',
}

export const CONTRAST_PRESETS: Record<ContrastMode, Pick<ProfileTheme, 'colorFondo' | 'colorTexto' | 'colorBorde' | 'colorAccent'>> = {
  claro: {
    colorFondo: '#ffffff',
    colorTexto: '#111111',
    colorBorde: '#e5e7eb',
    colorAccent: '#111111',
  },
  oscuro: {
    colorFondo: '#0f0f0f',
    colorTexto: '#f0f0f0',
    colorBorde: '#2a2a2a',
    colorAccent: '#a3a3a3',
  },
  sepia: {
    colorFondo: '#fdf6e3',
    colorTexto: '#3b2a1a',
    colorBorde: '#d4b896',
    colorAccent: '#7a4f28',
  },
}

export const FONT_MAP: Record<FontFamily, string> = {
  sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
  serif: '"Georgia", "Times New Roman", serif',
  mono: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
  caligrafia: '"Dancing Script", cursive',
}

export const FONT_LABELS: Record<FontFamily, string> = {
  sans: 'Sans Serif',
  serif: 'Serif',
  mono: 'Monospace',
  caligrafia: 'Caligrafía',
}

export const WIDTH_MAP: Record<ProfileWidth, string> = {
  narrow: '42rem',
  normal: '56rem',
  wide: '72rem',
}

export const DEFAULT_THEME: ProfileTheme = {
  colorFondo: '#ffffff',
  colorTexto: '#111111',
  colorBorde: '#e5e7eb',
  colorDivider: '#e5e7eb',
  colorSombra: 'rgba(0,0,0,0.08)',
  colorAccent: '#111111',
  colorIconos: '#6b7280',
  colorTagFondo: '#f3f4f6',
  colorTagTexto: '#374151',
  personalizarPorSecciones: false,
  personalizarTipografiaPorSecciones: false,
  estilosSecciones: {},
  horarioActiveBg: '#111111',
  horarioActiveText: '#ffffff',
  horarioInactiveBg: '#e5e7eb',
  horarioHeaderText: '#374151',
  horarioBorderRadius: 2,
  horarioBorderColor: '#e5e7eb',
  anchoBorde: 1,
  radioBorde: 12,
  sombrasActivas: false,
  intensidadSombra: 8,
  espaciadoSecciones: 10,
  espaciadoSubsecciones: 5,
  tipoLetra: 'sans',
  tamanioTextoBase: 15,
  imagenFondoUrl: '',
  imagenFondoOpacidad: 20,
  imagenFondoModo: 'cover',
  ordenSecciones: [...DEFAULT_ORDER],
  anchoMaximo: 'normal',
  estiloDivider: 'line',
  modoContraste: 'claro',
}

/**
 * Merges a partial profile_theme from the database with the defaults.
 * Ensures all fields are present even for old/incomplete stored themes.
 */
export function resolveTheme(stored: Partial<ProfileTheme> | null | undefined): ProfileTheme {
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_THEME }
  return {
    ...DEFAULT_THEME,
    ...stored,
    colorDivider: stored.colorDivider || stored.colorBorde || DEFAULT_THEME.colorDivider,
    colorIconos: stored.colorIconos || stored.colorAccent || DEFAULT_THEME.colorIconos,
    horarioActiveBg: stored.horarioActiveBg || DEFAULT_THEME.horarioActiveBg,
    horarioActiveText: stored.horarioActiveText || DEFAULT_THEME.horarioActiveText,
    horarioInactiveBg: stored.horarioInactiveBg || DEFAULT_THEME.horarioInactiveBg,
    horarioHeaderText: stored.horarioHeaderText || DEFAULT_THEME.horarioHeaderText,
    horarioBorderRadius: typeof stored.horarioBorderRadius === 'number' ? stored.horarioBorderRadius : DEFAULT_THEME.horarioBorderRadius,
    horarioBorderColor: stored.horarioBorderColor || DEFAULT_THEME.horarioBorderColor,
    ordenSecciones:
      Array.isArray(stored.ordenSecciones) && stored.ordenSecciones.length > 0
        ? stored.ordenSecciones
        : [...DEFAULT_ORDER],
    personalizarPorSecciones: Boolean(stored.personalizarPorSecciones),
    personalizarTipografiaPorSecciones: Boolean(stored.personalizarTipografiaPorSecciones),
    estilosSecciones:
      stored.estilosSecciones && typeof stored.estilosSecciones === 'object'
        ? stored.estilosSecciones
        : {},
  }
}
