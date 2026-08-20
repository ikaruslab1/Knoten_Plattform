'use client'

import React, { useState, useCallback } from 'react'
import {
  ArrowLeft, Save, RotateCcw, Palette, Type, AlignLeft,
  Square, LayoutGrid, ChevronUp, ChevronDown, Check,
  Loader2, Image, Layers, Sparkles, Trash2, Info, Clock,
} from 'lucide-react'
import Link from 'next/link'
import { useProfileTheme } from '@/hooks/useProfileTheme'
import { StyledProfileView } from '@/components/freelancer/StyledProfileView'
import {
  FONT_LABELS,
  SECTION_LABELS,
  ALL_SECTION_KEYS,
  ALL_SECTION_LABELS,
  CONTRAST_PRESETS,
  DEFAULT_ORDER,
  resolveTheme,
} from '@/lib/types/profile-theme'
import type {
  ProfileTheme,
  SectionId,
  SectionKey,
  SectionThemeStyle,
  FontFamily,
  ContrastMode,
  DividerStyle,
  BgImageMode,
  ProfileWidth,
} from '@/lib/types/profile-theme'

// ── Sub-types for ProfileThemeEditor props ─────────────────────────────────
type UserProfile = { nombre: string; apellido_paterno: string; apellido_materno: string }
type ProfileData = {
  resumen_profesional?: string
  especialidades?: string[]
  nivel_experiencia?: string
  software?: string[]
  habilidades_complementarias?: string | string[]
  enlace_portafolio?: string
  ultimo_grado_estudios?: string
  idiomas?: string[]
  disponibilidad?: Record<string, string>
  estado?: string
}
type WorkHistoryItem = { rol: string; empresa: string; periodo: string; modalidad: string; responsabilidades?: string }
type CertificationItem = { nombre: string; entidad: string; anio?: number; enlace?: string }

interface Props {
  initialTheme: Partial<ProfileTheme> | null
  userProfile: UserProfile
  profile: ProfileData
  workHistory: WorkHistoryItem[]
  certifications: CertificationItem[]
}

// ── Tab definitions ─────────────────────────────────────────────────────────
type Tab = 'colores' | 'tipografia' | 'espaciado' | 'borde' | 'horarios' | 'orden'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'colores', label: 'Colores', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'tipografia', label: 'Tipografía', icon: <Type className="w-3.5 h-3.5" /> },
  { id: 'espaciado', label: 'Espaciado', icon: <AlignLeft className="w-3.5 h-3.5" /> },
  { id: 'borde', label: 'Bordes', icon: <Square className="w-3.5 h-3.5" /> },
  { id: 'horarios', label: 'Horarios', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'orden', label: 'Orden', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
]

// ── Helper UI components ────────────────────────────────────────────────────

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-600 shrink-0">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function ColorInput({
  value,
  onChange,
  label,
  onClear,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  onClear?: () => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <input
          type="color"
          value={value && value.startsWith('#') ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
          aria-label={`Color: ${label}`}
          title={label}
        />
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#hex"
        className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1 font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10"
        aria-label={`Valor hex: ${label}`}
        spellCheck={false}
      />
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Restablecer color"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

function SliderInput({
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  unit?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 accent-black"
      />
      <span className="text-xs text-gray-500 w-9 text-right tabular-nums">
        {value}{unit}
      </span>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
        checked ? 'bg-black' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ProfileThemeEditor({
  initialTheme,
  userProfile,
  profile,
  workHistory,
  certifications,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('colores')
  const [mobileView, setMobileView] = useState<'controls' | 'preview'>('controls')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }, [])

  const {
    draft,
    isDirty,
    isPending,
    set,
    setSectionStyle,
    clearSectionStyle,
    moveSection,
    applyContrastPreset,
    reset,
    save,
    cssVars,
    bgImageStyles,
  } = useProfileTheme({
    initialTheme,
    onSaveSuccess: () => showToast('Tema guardado correctamente', 'success'),
    onSaveError: (e) => showToast(e, 'error'),
  })

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* ── Top Header Bar ──────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white border-b border-gray-200 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/freelancer/profile"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Mi perfil</span>
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-bold text-gray-900">Aspecto visual del perfil</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile toggle */}
          <div className="flex sm:hidden bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setMobileView('controls')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                mobileView === 'controls' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500'
              }`}
            >
              Editar
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                mobileView === 'preview' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500'
              }`}
            >
              Vista previa
            </button>
          </div>

          {isDirty && (
            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-xl hover:bg-gray-100 disabled:opacity-40"
              aria-label="Restablecer cambios"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Descartar</span>
            </button>
          )}

          {/* Super Prominent Save Button in Top Header */}
          <button
            type="button"
            onClick={save}
            disabled={isPending || !isDirty}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-500/20 shadow-emerald-600/20 scale-[1.02] cursor-pointer'
                : 'bg-gray-900 text-white hover:bg-black opacity-50 cursor-not-allowed'
            }`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isPending ? 'Guardando...' : 'Guardar cambios'}</span>
          </button>
        </div>
      </header>

      {/* ── Toast Notification ──────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl transition-all animate-in slide-in-from-bottom-4 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Main Body Split Panel ───────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Control Sidebar Panel ─────────────────────────── */}
        <aside
          className={`flex flex-col w-full sm:w-80 lg:w-96 bg-white border-r border-gray-200 shrink-0 overflow-hidden ${
            mobileView === 'preview' ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* 2x3 Grid Navigation Menu — ALL 6 TABS ALWAYS VISIBLE */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
              Menú de edición
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-black text-white shadow-md scale-[1.02]'
                        : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/80 shadow-2xs'
                    }`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Tab Controls Panel */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {activeTab === 'colores' && (
              <ColoresYFondoTab
                draft={draft}
                set={set}
                setSectionStyle={setSectionStyle}
                clearSectionStyle={clearSectionStyle}
                applyContrastPreset={applyContrastPreset}
              />
            )}
            {activeTab === 'tipografia' && (
              <TipografiaTab
                draft={draft}
                set={set}
                setSectionStyle={setSectionStyle}
                clearSectionStyle={clearSectionStyle}
              />
            )}
            {activeTab === 'espaciado' && (
              <EspaciadoTab draft={draft} set={set} />
            )}
            {activeTab === 'borde' && (
              <BordeSombraTab draft={draft} set={set} />
            )}
            {activeTab === 'horarios' && (
              <HorariosTab draft={draft} set={set} />
            )}
            {activeTab === 'orden' && (
              <OrdenTab draft={draft} moveSection={moveSection} />
            )}
          </div>

          {/* STICKY BOTTOM SAVE ACTION BAR FOR MAXIMUM VISIBILITY */}
          <div className="p-3 bg-white border-t border-gray-200 shrink-0 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs text-gray-600 font-medium">
                  {isDirty ? 'Cambios sin guardar' : 'Todo guardado'}
                </span>
              </div>

              <button
                type="button"
                onClick={save}
                disabled={isPending || !isDirty}
                className={`flex items-center justify-center gap-2 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all ${
                  isDirty
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer scale-[1.02]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Guardar cambios</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Live Preview Area ───────────────────────────────── */}
        <main
          className={`flex-1 overflow-y-auto bg-gray-100 ${
            mobileView === 'controls' ? 'hidden sm:block' : 'block'
          }`}
        >
          <div className="min-h-full p-4 sm:p-8">
            <div
              className="mx-auto transition-all duration-300"
              style={{ maxWidth: draft.anchoMaximo === 'narrow' ? '42rem' : draft.anchoMaximo === 'wide' ? '72rem' : '56rem' }}
            >
              <StyledProfileView
                theme={draft}
                userProfile={userProfile}
                profile={profile}
                workHistory={workHistory}
                certifications={certifications}
                previewMode
                cssVarsOverride={cssVars as React.CSSProperties}
                bgImageStyles={bgImageStyles ?? undefined}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Tab: Colores y Fondo (General + Por Secciones)
// ──────────────────────────────────────────────────────────────────
function ColoresYFondoTab({
  draft,
  set,
  setSectionStyle,
  clearSectionStyle,
  applyContrastPreset,
}: {
  draft: ProfileTheme
  set: <K extends keyof ProfileTheme>(key: K, value: ProfileTheme[K]) => void
  setSectionStyle: <K extends keyof SectionThemeStyle>(
    sectionKey: SectionKey,
    field: K,
    value: SectionThemeStyle[K]
  ) => void
  clearSectionStyle: (sectionKey: SectionKey) => void
  applyContrastPreset: (mode: ContrastMode) => void
}) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null)

  const PRESETS: { id: ContrastMode; label: string; bg: string; text: string }[] = [
    { id: 'claro', label: 'Claro', bg: '#ffffff', text: '#111111' },
    { id: 'oscuro', label: 'Oscuro', bg: '#0f0f0f', text: '#f0f0f0' },
    { id: 'sepia', label: 'Sépia', bg: '#fdf6e3', text: '#3b2a1a' },
  ]

  const bgModes: { id: BgImageMode; label: string }[] = [
    { id: 'cover', label: 'Cubrir' },
    { id: 'contain', label: 'Contener' },
    { id: 'repeat', label: 'Repetir' },
  ]

  return (
    <div className="py-1 space-y-5">
      {/* Mode Selector */}
      <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
        <button
          type="button"
          onClick={() => set('personalizarPorSecciones', false)}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
            !draft.personalizarPorSecciones
              ? 'bg-white shadow-xs text-gray-900'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Tema general
        </button>
        <button
          type="button"
          onClick={() => set('personalizarPorSecciones', true)}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            draft.personalizarPorSecciones
              ? 'bg-white shadow-xs text-gray-900'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Por secciones
        </button>
      </div>

      {!draft.personalizarPorSecciones ? (
        /* ── TEMA GENERAL ─────────────────────────────────────── */
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preset de contraste</p>
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyContrastPreset(p.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 transition-all text-xs font-medium ${
                    draft.modoContraste === p.id
                      ? 'border-black ring-2 ring-black/10'
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: p.bg, color: p.text }}
                  title={p.label}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-current/20"
                    style={{ backgroundColor: p.text }}
                  />
                  <span style={{ color: p.text }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Colores del perfil</p>
            <ControlRow label="Fondo general">
              <ColorInput value={draft.colorFondo} onChange={(v) => set('colorFondo', v)} label="Color de fondo" />
            </ControlRow>
            <ControlRow label="Texto principal">
              <ColorInput value={draft.colorTexto} onChange={(v) => set('colorTexto', v)} label="Color de texto" />
            </ControlRow>
            <ControlRow label="Acento / títulos">
              <ColorInput value={draft.colorAccent} onChange={(v) => set('colorAccent', v)} label="Color de acento" />
            </ControlRow>
            <ControlRow label="Color de íconos">
              <ColorInput value={draft.colorIconos} onChange={(v) => set('colorIconos', v)} label="Color de íconos" />
            </ControlRow>
            <ControlRow label="Borde de tarjetas">
              <ColorInput value={draft.colorBorde} onChange={(v) => set('colorBorde', v)} label="Color de borde" />
            </ControlRow>
            <ControlRow label="Divisores / separadores">
              <ColorInput value={draft.colorDivider} onChange={(v) => set('colorDivider', v)} label="Color de divisores" />
            </ControlRow>
            <ControlRow label="Fondo de etiquetas">
              <ColorInput value={draft.colorTagFondo} onChange={(v) => set('colorTagFondo', v)} label="Fondo de tags" />
            </ControlRow>
            <ControlRow label="Texto de etiquetas">
              <ColorInput value={draft.colorTagTexto} onChange={(v) => set('colorTagTexto', v)} label="Texto de tags" />
            </ControlRow>
          </div>

          {/* Imagen de fondo general */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Imagen de fondo general</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">URL de la imagen</label>
                <input
                  type="url"
                  value={draft.imagenFondoUrl}
                  onChange={(e) => set('imagenFondoUrl', e.target.value)}
                  placeholder="https://ejemplo.com/fondo.jpg"
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10"
                  spellCheck={false}
                />
              </div>

              {draft.imagenFondoUrl && (
                <>
                  <ControlRow label="Opacidad">
                    <SliderInput
                      value={draft.imagenFondoOpacidad}
                      min={0}
                      max={100}
                      onChange={(v) => set('imagenFondoOpacidad', v)}
                      unit="%"
                    />
                  </ControlRow>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Modo de imagen</label>
                    <div className="flex gap-1.5">
                      {bgModes.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => set('imagenFondoModo', m.id)}
                          className={`flex-1 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                            draft.imagenFondoModo === m.id
                              ? 'border-black bg-gray-900 text-white'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── POR SECCIONES (ACCORDION) ───────────────────────── */
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
            Personaliza los colores e imagen de fondo de cada sección por separado. Las secciones sin cambios heredarán el tema general.
          </div>

          <div className="space-y-2">
            {ALL_SECTION_KEYS.map((key) => {
              const secStyle = draft.estilosSecciones[key] || {}
              const isCustomized = Object.keys(secStyle).some((k) =>
                ['colorFondo', 'colorTexto', 'colorAccent', 'colorIconos', 'colorBorde', 'colorDivider', 'colorTagFondo', 'colorTagTexto', 'imagenFondoUrl'].includes(k)
              )
              const isOpen = openSection === key

              return (
                <div
                  key={key}
                  className={`border rounded-xl transition-all overflow-hidden bg-white ${
                    isOpen ? 'border-gray-300 shadow-xs' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() => setOpenSection(isOpen ? null : key)}
                    className="w-full flex items-center justify-between p-3 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-800">
                        {ALL_SECTION_LABELS[key]}
                      </span>
                      {isCustomized && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          Personalizado
                        </span>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Accordion Body */}
                  {isOpen && (
                    <div className="p-3 pt-0 border-t border-gray-100 space-y-3">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-2">
                        Colores de la sección
                      </p>

                      <ControlRow label="Fondo sección">
                        <ColorInput
                          value={secStyle.colorFondo || ''}
                          onChange={(v) => setSectionStyle(key, 'colorFondo', v)}
                          label="Fondo sección"
                          onClear={() => setSectionStyle(key, 'colorFondo', undefined)}
                        />
                      </ControlRow>

                      <ControlRow label="Texto principal">
                        <ColorInput
                          value={secStyle.colorTexto || ''}
                          onChange={(v) => setSectionStyle(key, 'colorTexto', v)}
                          label="Texto principal"
                          onClear={() => setSectionStyle(key, 'colorTexto', undefined)}
                        />
                      </ControlRow>

                      <ControlRow label="Acento / títulos">
                        <ColorInput
                          value={secStyle.colorAccent || ''}
                          onChange={(v) => setSectionStyle(key, 'colorAccent', v)}
                          label="Color acento"
                          onClear={() => setSectionStyle(key, 'colorAccent', undefined)}
                        />
                      </ControlRow>

                      <ControlRow label="Íconos sección">
                        <ColorInput
                          value={secStyle.colorIconos || ''}
                          onChange={(v) => setSectionStyle(key, 'colorIconos', v)}
                          label="Color íconos"
                          onClear={() => setSectionStyle(key, 'colorIconos', undefined)}
                        />
                      </ControlRow>

                      <ControlRow label="Borde sección">
                        <ColorInput
                          value={secStyle.colorBorde || ''}
                          onChange={(v) => setSectionStyle(key, 'colorBorde', v)}
                          label="Color borde"
                          onClear={() => setSectionStyle(key, 'colorBorde', undefined)}
                        />
                      </ControlRow>

                      <ControlRow label="Divisores sección">
                        <ColorInput
                          value={secStyle.colorDivider || ''}
                          onChange={(v) => setSectionStyle(key, 'colorDivider', v)}
                          label="Color divisor"
                          onClear={() => setSectionStyle(key, 'colorDivider', undefined)}
                        />
                      </ControlRow>

                      <ControlRow label="Fondo etiquetas">
                        <ColorInput
                          value={secStyle.colorTagFondo || ''}
                          onChange={(v) => setSectionStyle(key, 'colorTagFondo', v)}
                          label="Fondo etiquetas"
                          onClear={() => setSectionStyle(key, 'colorTagFondo', undefined)}
                        />
                      </ControlRow>

                      <ControlRow label="Texto etiquetas">
                        <ColorInput
                          value={secStyle.colorTagTexto || ''}
                          onChange={(v) => setSectionStyle(key, 'colorTagTexto', v)}
                          label="Texto etiquetas"
                          onClear={() => setSectionStyle(key, 'colorTagTexto', undefined)}
                        />
                      </ControlRow>

                      {/* Section Background Image */}
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Imagen de fondo de sección
                        </p>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">URL de la imagen</label>
                            <input
                              type="url"
                              value={secStyle.imagenFondoUrl || ''}
                              onChange={(e) => setSectionStyle(key, 'imagenFondoUrl', e.target.value)}
                              placeholder="https://ejemplo.com/seccion-bg.jpg"
                              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10"
                              spellCheck={false}
                            />
                          </div>

                          {secStyle.imagenFondoUrl && (
                            <>
                              <ControlRow label="Opacidad">
                                <SliderInput
                                  value={secStyle.imagenFondoOpacidad ?? 20}
                                  min={0}
                                  max={100}
                                  onChange={(v) => setSectionStyle(key, 'imagenFondoOpacidad', v)}
                                  unit="%"
                                />
                              </ControlRow>

                              <div>
                                <label className="block text-[11px] text-gray-500 mb-1">Modo de imagen</label>
                                <div className="flex gap-1.5">
                                  {bgModes.map((m) => (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => setSectionStyle(key, 'imagenFondoModo', m.id)}
                                      className={`flex-1 py-1 text-xs rounded-lg border transition-all font-medium ${
                                        (secStyle.imagenFondoModo || 'cover') === m.id
                                          ? 'border-black bg-gray-900 text-white'
                                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                                      }`}
                                    >
                                      {m.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Reset section button */}
                      {isCustomized && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => clearSectionStyle(key)}
                            className="w-full flex items-center justify-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Restablecer colores de esta sección
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Tab: Tipografía (General + Por Secciones)
// ──────────────────────────────────────────────────────────────────
function TipografiaTab({
  draft,
  set,
  setSectionStyle,
  clearSectionStyle,
}: {
  draft: ProfileTheme
  set: <K extends keyof ProfileTheme>(key: K, value: ProfileTheme[K]) => void
  setSectionStyle: <K extends keyof SectionThemeStyle>(
    sectionKey: SectionKey,
    field: K,
    value: SectionThemeStyle[K]
  ) => void
  clearSectionStyle: (sectionKey: SectionKey) => void
}) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null)

  const fonts: { id: FontFamily; preview: string }[] = [
    { id: 'sans', preview: 'Inter — Aa Bb Cc' },
    { id: 'serif', preview: 'Georgia — Aa Bb Cc' },
    { id: 'mono', preview: 'Mono — Aa Bb Cc' },
    { id: 'caligrafia', preview: 'Script — Aa Bb' },
  ]

  const fontFamilies: Record<FontFamily, string> = {
    sans: '"Inter", sans-serif',
    serif: 'Georgia, serif',
    mono: '"Courier New", monospace',
    caligrafia: '"Dancing Script", cursive',
  }

  return (
    <div className="py-1 space-y-5">
      {/* Mode Selector */}
      <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
        <button
          type="button"
          onClick={() => set('personalizarTipografiaPorSecciones', false)}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
            !draft.personalizarTipografiaPorSecciones
              ? 'bg-white shadow-xs text-gray-900'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Tipografía general
        </button>
        <button
          type="button"
          onClick={() => set('personalizarTipografiaPorSecciones', true)}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            draft.personalizarTipografiaPorSecciones
              ? 'bg-white shadow-xs text-gray-900'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Por secciones
        </button>
      </div>

      {!draft.personalizarTipografiaPorSecciones ? (
        /* ── TIPOGRAFÍA GENERAL ────────────────────────────────── */
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tipo de letra principal</p>
            <div className="grid grid-cols-2 gap-2">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => set('tipoLetra', f.id)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left ${
                    draft.tipoLetra === f.id
                      ? 'border-black bg-gray-50 ring-2 ring-black/10'
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <span
                    className="text-xl leading-none text-gray-900"
                    style={{ fontFamily: fontFamilies[f.id] }}
                  >
                    Ag
                  </span>
                  <span className="text-xs text-gray-500">{FONT_LABELS[f.id]}</span>
                </button>
              ))}
            </div>
          </div>

          <ControlRow label="Tamaño base de texto">
            <SliderInput
              value={draft.tamanioTextoBase}
              min={13}
              max={18}
              onChange={(v) => set('tamanioTextoBase', v)}
              unit="px"
            />
          </ControlRow>
        </div>
      ) : (
        /* ── TIPOGRAFÍA POR SECCIONES (ACCORDION) ──────────────── */
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
            Escoge el tipo de fuente y tamaño de texto para cada sección. Las secciones sin cambios heredarán la tipografía general.
          </div>

          <div className="space-y-2">
            {ALL_SECTION_KEYS.map((key) => {
              const secStyle = draft.estilosSecciones[key] || {}
              const isCustomized = Boolean(secStyle.tipoLetra || secStyle.tamanioTextoBase)
              const isOpen = openSection === key
              const isResumen = key === 'resumen'

              return (
                <div
                  key={key}
                  className={`border rounded-xl transition-all overflow-hidden bg-white ${
                    isOpen ? 'border-gray-300 shadow-xs' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() => setOpenSection(isOpen ? null : key)}
                    className="w-full flex items-center justify-between p-3 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-800">
                        {ALL_SECTION_LABELS[key]}
                      </span>
                      {isCustomized && !isResumen && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          Personalizado
                        </span>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Accordion Body */}
                  {isOpen && (
                    <div className="p-3 pt-0 border-t border-gray-100 space-y-3">
                      {isResumen ? (
                        /* Notice for Cuéntanos sobre ti */
                        <div className="mt-2 bg-blue-50 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>
                            La sección <strong>Cuéntanos sobre ti</strong> contiene formato enriquecido y conserva sus propios estilos tipográficos personalizados del editor de contenido.
                          </span>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-2">
                            Fuente de la sección
                          </p>

                          <div className="grid grid-cols-2 gap-1.5">
                            {fonts.map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setSectionStyle(key, 'tipoLetra', f.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                                  (secStyle.tipoLetra || draft.tipoLetra) === f.id
                                    ? 'border-black bg-gray-900 text-white font-medium'
                                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                <span
                                  className="text-base leading-none"
                                  style={{ fontFamily: fontFamilies[f.id] }}
                                >
                                  Ag
                                </span>
                                <span className="text-xs">{FONT_LABELS[f.id]}</span>
                              </button>
                            ))}
                          </div>

                          <ControlRow label="Tamaño base texto">
                            <SliderInput
                              value={secStyle.tamanioTextoBase ?? draft.tamanioTextoBase}
                              min={13}
                              max={18}
                              onChange={(v) => setSectionStyle(key, 'tamanioTextoBase', v)}
                              unit="px"
                            />
                          </ControlRow>

                          {isCustomized && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSectionStyle(key, 'tipoLetra', undefined)
                                  setSectionStyle(key, 'tamanioTextoBase', undefined)
                                }}
                                className="w-full flex items-center justify-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 py-1.5 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Restablecer tipografía de esta sección
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Tab: Espaciado
// ──────────────────────────────────────────────────────────────────
function EspaciadoTab({
  draft,
  set,
}: {
  draft: ProfileTheme
  set: <K extends keyof ProfileTheme>(key: K, value: ProfileTheme[K]) => void
}) {
  const widths: { id: ProfileWidth; label: string; desc: string }[] = [
    { id: 'narrow', label: 'Compacto', desc: '42rem' },
    { id: 'normal', label: 'Normal', desc: '56rem' },
    { id: 'wide', label: 'Amplio', desc: '72rem' },
  ]

  return (
    <div className="py-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-1">Ancho del perfil</p>
      <div className="flex gap-2 mb-5">
        {widths.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => set('anchoMaximo', w.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs transition-all ${
              draft.anchoMaximo === w.id
                ? 'border-black bg-gray-50 ring-2 ring-black/10 font-semibold text-gray-900'
                : 'border-gray-100 text-gray-500 hover:border-gray-300'
            }`}
          >
            <div
              className="h-8 bg-current rounded opacity-20"
              style={{
                width: w.id === 'narrow' ? '40%' : w.id === 'normal' ? '65%' : '90%',
              }}
            />
            {w.label}
          </button>
        ))}
      </div>

      <ControlRow label="Entre secciones">
        <SliderInput
          value={draft.espaciadoSecciones}
          min={4}
          max={20}
          onChange={(v) => set('espaciadoSecciones', v)}
          unit=""
        />
      </ControlRow>
      <ControlRow label="Entre subsecciones">
        <SliderInput
          value={draft.espaciadoSubsecciones}
          min={2}
          max={12}
          onChange={(v) => set('espaciadoSubsecciones', v)}
          unit=""
        />
      </ControlRow>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Tab: Borde y Sombra
// ──────────────────────────────────────────────────────────────────
function BordeSombraTab({
  draft,
  set,
}: {
  draft: ProfileTheme
  set: <K extends keyof ProfileTheme>(key: K, value: ProfileTheme[K]) => void
}) {
  const dividers: { id: DividerStyle; label: string }[] = [
    { id: 'line', label: 'Línea' },
    { id: 'dot', label: 'Puntos' },
    { id: 'none', label: 'Ninguno' },
  ]

  return (
    <div className="py-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-1">Bordes</p>

      <ControlRow label="Ancho de borde">
        <SliderInput
          value={draft.anchoBorde}
          min={0}
          max={4}
          onChange={(v) => set('anchoBorde', v)}
          unit="px"
        />
      </ControlRow>
      <ControlRow label="Radio de borde">
        <SliderInput
          value={draft.radioBorde}
          min={0}
          max={24}
          onChange={(v) => set('radioBorde', v)}
          unit="px"
        />
      </ControlRow>
      <ControlRow label="Color de bordes">
        <ColorInput value={draft.colorBorde} onChange={(v) => set('colorBorde', v)} label="Color de bordes" />
      </ControlRow>
      <ControlRow label="Color de divisores">
        <ColorInput value={draft.colorDivider} onChange={(v) => set('colorDivider', v)} label="Color de divisores" />
      </ControlRow>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-5">Sombras</p>

      <ControlRow label="Activar sombras">
        <Toggle
          checked={draft.sombrasActivas}
          onChange={(v) => set('sombrasActivas', v)}
          label="Activar sombras"
        />
      </ControlRow>
      {draft.sombrasActivas && (
        <>
          <ControlRow label="Intensidad">
            <SliderInput
              value={draft.intensidadSombra}
              min={0}
              max={30}
              onChange={(v) => set('intensidadSombra', v)}
              unit="px"
            />
          </ControlRow>
          <ControlRow label="Color de sombra">
            <ColorInput value={draft.colorSombra} onChange={(v) => set('colorSombra', v)} label="Color de sombra" />
          </ControlRow>
        </>
      )}

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-5">Separador de secciones</p>
      <div className="flex gap-2">
        {dividers.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => set('estiloDivider', d.id)}
            className={`flex-1 py-2.5 text-xs rounded-xl border-2 transition-all font-medium ${
              draft.estiloDivider === d.id
                ? 'border-black bg-gray-50 ring-2 ring-black/10 text-gray-900'
                : 'border-gray-100 text-gray-500 hover:border-gray-300'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Tab: Horarios (Customization of Availability Grid)
// ──────────────────────────────────────────────────────────────────
function HorariosTab({
  draft,
  set,
}: {
  draft: ProfileTheme
  set: <K extends keyof ProfileTheme>(key: K, value: ProfileTheme[K]) => void
}) {
  return (
    <div className="py-2 space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-1">Estilos de Disponibilidad Horaria</p>
        <p className="text-xs text-gray-500 mb-3">
          Personaliza los colores, redondeo de celdas y bordes de la cuadrícula de horarios.
        </p>

        <ControlRow label="Bloque activo (fondo)">
          <ColorInput
            value={draft.horarioActiveBg}
            onChange={(v) => set('horarioActiveBg', v)}
            label="Fondo de bloque activo"
          />
        </ControlRow>

        <ControlRow label="Bloque activo (texto)">
          <ColorInput
            value={draft.horarioActiveText}
            onChange={(v) => set('horarioActiveText', v)}
            label="Texto de bloque activo"
          />
        </ControlRow>

        <ControlRow label="Bloque inactivo (fondo)">
          <ColorInput
            value={draft.horarioInactiveBg}
            onChange={(v) => set('horarioInactiveBg', v)}
            label="Fondo de bloque inactivo"
          />
        </ControlRow>

        <ControlRow label="Texto de días / horas">
          <ColorInput
            value={draft.horarioHeaderText}
            onChange={(v) => set('horarioHeaderText', v)}
            label="Texto de encabezados"
          />
        </ControlRow>

        <ControlRow label="Líneas / bordes">
          <ColorInput
            value={draft.horarioBorderColor}
            onChange={(v) => set('horarioBorderColor', v)}
            label="Color de bordes"
          />
        </ControlRow>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Forma y contorno</p>

        <ControlRow label="Redondeo de celdas">
          <SliderInput
            value={draft.horarioBorderRadius}
            min={0}
            max={12}
            onChange={(v) => set('horarioBorderRadius', v)}
            unit="px"
          />
        </ControlRow>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Tab: Orden de secciones
// ──────────────────────────────────────────────────────────────────
function OrdenTab({
  draft,
  moveSection,
}: {
  draft: ProfileTheme
  moveSection: (from: number, to: number) => void
}) {
  return (
    <div className="py-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 mt-1">Orden de secciones</p>
      <p className="text-xs text-gray-400 mb-4">Reorganiza las secciones de tu perfil usando los botones de flecha.</p>

      <div className="flex flex-col gap-2">
        {draft.ordenSecciones.map((id, idx) => (
          <div
            key={id}
            className="flex items-center gap-3 px-3 py-3 bg-white rounded-xl border border-gray-100 shadow-xs select-none"
          >
            <span className="text-xs font-mono text-gray-300 w-5 text-center">{idx + 1}</span>
            <span className="flex-1 text-sm text-gray-700">{SECTION_LABELS[id]}</span>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => idx > 0 && moveSection(idx, idx - 1)}
                disabled={idx === 0}
                className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                aria-label={`Mover ${SECTION_LABELS[id]} arriba`}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => idx < draft.ordenSecciones.length - 1 && moveSection(idx, idx + 1)}
                disabled={idx === draft.ordenSecciones.length - 1}
                className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                aria-label={`Mover ${SECTION_LABELS[id]} abajo`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
