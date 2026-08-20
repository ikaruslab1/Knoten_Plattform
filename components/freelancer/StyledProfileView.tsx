'use client'

import React from 'react'
import { ProfileView } from '@/components/freelancer/ProfileView'
import {
  resolveTheme,
  FONT_MAP,
  WIDTH_MAP,
} from '@/lib/types/profile-theme'
import type { ProfileTheme } from '@/lib/types/profile-theme'

interface StyledProfileViewProps {
  theme?: Partial<ProfileTheme> | null
  userProfile: {
    nombre: string
    apellido_paterno: string
    apellido_materno: string
  }
  profile: {
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
  workHistory: Array<{
    rol: string
    empresa: string
    periodo: string
    modalidad: string
    responsabilidades?: string
  }>
  certifications: Array<{
    nombre: string
    entidad: string
    anio?: number
    enlace?: string
  }>
  /** When true, shows a "Vista previa" watermark badge */
  previewMode?: boolean
  /** Override CSS vars — used by ProfileThemeEditor for live preview */
  cssVarsOverride?: React.CSSProperties
  bgImageStyles?: React.CSSProperties | null
}

/**
 * Wraps ProfileView with a themed container.
 * Injects CSS custom properties so child elements can use them
 * without ProfileView needing any theme knowledge.
 */
export function StyledProfileView({
  theme,
  userProfile,
  profile,
  workHistory,
  certifications,
  previewMode = false,
  cssVarsOverride,
  bgImageStyles,
}: StyledProfileViewProps) {
  const resolved = resolveTheme(theme)

  const containerVars: React.CSSProperties = cssVarsOverride ?? ({
    '--pt-bg': resolved.colorFondo,
    '--pt-text': resolved.colorTexto,
    '--pt-border': resolved.colorBorde,
    '--pt-divider-color': resolved.colorDivider,
    '--pt-shadow-color': resolved.colorSombra,
    '--pt-accent': resolved.colorAccent,
    '--pt-icon-color': resolved.colorIconos,
    '--pt-tag-bg': resolved.colorTagFondo,
    '--pt-tag-text': resolved.colorTagTexto,
    '--pt-horario-active-bg': resolved.horarioActiveBg,
    '--pt-horario-active-text': resolved.horarioActiveText,
    '--pt-horario-inactive-bg': resolved.horarioInactiveBg,
    '--pt-horario-header-text': resolved.horarioHeaderText,
    '--pt-horario-border-radius': `${resolved.horarioBorderRadius}px`,
    '--pt-horario-border-color': resolved.horarioBorderColor,
    '--pt-border-width': `${resolved.anchoBorde}px`,
    '--pt-border-radius': `${resolved.radioBorde}px`,
    '--pt-shadow': resolved.sombrasActivas
      ? `0 4px ${resolved.intensidadSombra}px 0 ${resolved.colorSombra}`
      : 'none',
    '--pt-section-gap': `${resolved.espaciadoSecciones / 4}rem`,
    '--pt-subsection-gap': `${resolved.espaciadoSubsecciones / 4}rem`,
    '--pt-font': FONT_MAP[resolved.tipoLetra],
    '--pt-text-size': `${resolved.tamanioTextoBase}px`,
    '--pt-max-width': WIDTH_MAP[resolved.anchoMaximo],
    backgroundColor: resolved.colorFondo,
    color: resolved.colorTexto,
    fontFamily: FONT_MAP[resolved.tipoLetra],
    fontSize: `${resolved.tamanioTextoBase}px`,
  } as React.CSSProperties)

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-300"
      style={containerVars}
    >
      {/* Background image layer */}
      {(bgImageStyles || (resolved.imagenFondoUrl && !cssVarsOverride)) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={
            bgImageStyles ?? {
              backgroundImage: `url("${resolved.imagenFondoUrl}")`,
              backgroundSize: resolved.imagenFondoModo,
              backgroundRepeat: resolved.imagenFondoModo === 'repeat' ? 'repeat' : 'no-repeat',
              backgroundPosition: 'center',
              opacity: resolved.imagenFondoOpacidad / 100,
            }
          }
          aria-hidden="true"
        />
      )}

      {/* Preview watermark */}
      {previewMode && (
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold tracking-wide rounded-full bg-black/70 text-white backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Vista previa
          </span>
        </div>
      )}

      {/* Profile content */}
      <div className="relative z-10 p-6 sm:p-8">
        <ThemedProfileContent
          resolved={resolved}
          userProfile={userProfile}
          profile={profile}
          workHistory={workHistory}
          certifications={certifications}
        />
      </div>
    </div>
  )
}

/**
 * Renders ProfileView sections in the user-defined order,
 * applying CSS custom properties via inline styles on section wrappers.
 */
function ThemedProfileContent({
  resolved,
  userProfile,
  profile,
  workHistory,
  certifications,
}: Omit<StyledProfileViewProps, 'theme' | 'previewMode' | 'cssVarsOverride' | 'bgImageStyles'> & {
  resolved: ProfileTheme
}) {
  const sectionGap = `${resolved.espaciadoSecciones / 4}rem`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap }}>
      <ProfileView
        userProfile={userProfile}
        profile={profile}
        workHistory={workHistory}
        certifications={certifications}
        theme={resolved}
      />
    </div>
  )
}
