'use client'

import { useState, useCallback, useTransition } from 'react'
import type { ProfileTheme, SectionKey, SectionThemeStyle } from '@/lib/types/profile-theme'
import {
  resolveTheme,
  FONT_MAP,
  WIDTH_MAP,
  CONTRAST_PRESETS,
} from '@/lib/types/profile-theme'
import { saveProfileTheme } from '@/app/actions/saveProfileTheme'

interface UseProfileThemeOptions {
  initialTheme: Partial<ProfileTheme> | null | undefined
  onSaveSuccess?: () => void
  onSaveError?: (msg: string) => void
}

export function useProfileTheme({
  initialTheme,
  onSaveSuccess,
  onSaveError,
}: UseProfileThemeOptions) {
  const [draft, setDraft] = useState<ProfileTheme>(() => resolveTheme(initialTheme))
  const [saved, setSaved] = useState<ProfileTheme>(() => resolveTheme(initialTheme))
  const [isPending, startTransition] = useTransition()

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved)

  // ── Generic field setter ───────────────────────────────────────
  const set = useCallback(<K extends keyof ProfileTheme>(key: K, value: ProfileTheme[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ── Per-section style setter ──────────────────────────────────
  const setSectionStyle = useCallback(
    <K extends keyof SectionThemeStyle>(
      sectionKey: SectionKey,
      field: K,
      value: SectionThemeStyle[K]
    ) => {
      setDraft((prev) => {
        const currentStyle = prev.estilosSecciones[sectionKey] || {}
        const updatedStyle = { ...currentStyle, [field]: value }
        return {
          ...prev,
          estilosSecciones: {
            ...prev.estilosSecciones,
            [sectionKey]: updatedStyle,
          },
        }
      })
    },
    []
  )

  // ── Clear section style ───────────────────────────────────────
  const clearSectionStyle = useCallback((sectionKey: SectionKey) => {
    setDraft((prev) => {
      const nextEstilos = { ...prev.estilosSecciones }
      delete nextEstilos[sectionKey]
      return {
        ...prev,
        estilosSecciones: nextEstilos,
      }
    })
  }, [])

  // ── Section order ──────────────────────────────────────────────
  const moveSection = useCallback((fromIdx: number, toIdx: number) => {
    setDraft((prev) => {
      const order = [...prev.ordenSecciones]
      const [moved] = order.splice(fromIdx, 1)
      order.splice(toIdx, 0, moved)
      return { ...prev, ordenSecciones: order }
    })
  }, [])

  // ── Contrast preset shortcut ───────────────────────────────────
  const applyContrastPreset = useCallback((mode: ProfileTheme['modoContraste']) => {
    const preset = CONTRAST_PRESETS[mode]
    setDraft((prev) => ({ ...prev, ...preset, modoContraste: mode }))
  }, [])

  // ── Reset to last saved ────────────────────────────────────────
  const reset = useCallback(() => {
    setDraft({ ...saved })
  }, [saved])

  // ── Save ───────────────────────────────────────────────────────
  const save = useCallback(() => {
    startTransition(async () => {
      const result = await saveProfileTheme(draft)
      if (result.success) {
        setSaved({ ...draft })
        onSaveSuccess?.()
      } else {
        onSaveError?.(result.error ?? 'Error al guardar')
      }
    })
  }, [draft, onSaveSuccess, onSaveError])

  // ── CSS custom properties for preview container ────────────────
  const cssVarsObj: Record<string, string> = {
    '--pt-bg': draft.colorFondo,
    '--pt-text': draft.colorTexto,
    '--pt-border': draft.colorBorde,
    '--pt-divider-color': draft.colorDivider,
    '--pt-shadow-color': draft.colorSombra,
    '--pt-accent': draft.colorAccent,
    '--pt-icon-color': draft.colorIconos,
    '--pt-tag-bg': draft.colorTagFondo,
    '--pt-tag-text': draft.colorTagTexto,
    '--pt-horario-active-bg': draft.horarioActiveBg,
    '--pt-horario-active-text': draft.horarioActiveText,
    '--pt-horario-inactive-bg': draft.horarioInactiveBg,
    '--pt-horario-header-text': draft.horarioHeaderText,
    '--pt-horario-border-radius': `${draft.horarioBorderRadius}px`,
    '--pt-horario-border-color': draft.horarioBorderColor,
    '--pt-border-width': `${draft.anchoBorde}px`,
    '--pt-border-radius': `${draft.radioBorde}px`,
    '--pt-shadow': draft.sombrasActivas
      ? `0 4px ${draft.intensidadSombra}px 0 ${draft.colorSombra}`
      : 'none',
    '--pt-section-gap': `${draft.espaciadoSecciones / 4}rem`,
    '--pt-subsection-gap': `${draft.espaciadoSubsecciones / 4}rem`,
    '--pt-font': FONT_MAP[draft.tipoLetra],
    '--pt-text-size': `${draft.tamanioTextoBase}px`,
    '--pt-max-width': WIDTH_MAP[draft.anchoMaximo],
    backgroundColor: draft.colorFondo,
    color: draft.colorTexto,
    fontFamily: FONT_MAP[draft.tipoLetra],
    fontSize: `${draft.tamanioTextoBase}px`,
  }
  const cssVars = cssVarsObj as React.CSSProperties

  // Background image overlay styles
  const bgImageStyles: React.CSSProperties | null =
    draft.imagenFondoUrl
      ? {
          backgroundImage: `url("${draft.imagenFondoUrl}")`,
          backgroundSize: draft.imagenFondoModo,
          backgroundRepeat: draft.imagenFondoModo === 'repeat' ? 'repeat' : 'no-repeat',
          backgroundPosition: 'center',
          opacity: draft.imagenFondoOpacidad / 100,
        }
      : null

  return {
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
  }
}
