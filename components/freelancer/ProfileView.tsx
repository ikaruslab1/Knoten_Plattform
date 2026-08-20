import { ExternalLink, Briefcase, Award, Globe, Clock, GraduationCap, CheckCircle2 } from 'lucide-react'
import { DAYS_OF_WEEK, TIME_BLOCKS } from '@/lib/constants/roles'
import { parseEstudios, parseDisponibilidad } from '@/lib/validations/freelancer'
import { AvailabilityGrid } from '@/components/freelancer/AvailabilityGrid'
import type { ProfileTheme, SectionKey } from '@/lib/types/profile-theme'
import { FONT_MAP } from '@/lib/types/profile-theme'

interface Props {
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
  /** Optional resolved theme — injected by StyledProfileView */
  theme?: ProfileTheme
}

function Tag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center text-xs px-3 py-1.5 rounded-full transition-colors"
      style={{
        backgroundColor: 'var(--pt-tag-bg, #f3f4f6)',
        color: 'var(--pt-tag-text, #374151)',
        borderRadius: 'calc(var(--pt-border-radius, 12px) / 2)',
      }}
    >
      {label}
    </span>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pt-subsection-gap, 1rem)' }}>
      <div className="flex items-center gap-2">
        {icon && (
          <span style={{ color: 'var(--pt-icon-color, var(--pt-accent, #6b7280))' }}>{icon}</span>
        )}
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--pt-accent, #6b7280)' }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

/**
 * Wraps a profile section and applies per-section style overrides
 * (colors, typography, background image, padding, borders) if active.
 * EXCEPTION: "resumen" (Cuéntanos sobre ti) ignores typography overrides
 * since it carries its own rich-text / WYSIWYG styles.
 */
function SectionWrapper({
  sectionKey,
  theme,
  children,
}: {
  sectionKey: SectionKey
  theme?: ProfileTheme
  children: React.ReactNode
}) {
  if (!children) return null

  const isColorPerSection = theme?.personalizarPorSecciones
  const isTypoPerSection = theme?.personalizarTipografiaPorSecciones && sectionKey !== 'resumen'
  const sStyle = (isColorPerSection || isTypoPerSection) ? theme?.estilosSecciones?.[sectionKey] : undefined

  if (!sStyle || Object.keys(sStyle).length === 0) {
    return <>{children}</>
  }

  const bgUrl = sStyle.imagenFondoUrl
  const hasBg = Boolean(sStyle.colorFondo || bgUrl)
  const fontStyle = (sectionKey !== 'resumen' && sStyle.tipoLetra) ? FONT_MAP[sStyle.tipoLetra] : undefined
  const fontSizeStyle = (sectionKey !== 'resumen' && sStyle.tamanioTextoBase) ? `${sStyle.tamanioTextoBase}px` : undefined

  const wrapperVars: React.CSSProperties = {
    '--pt-bg': sStyle.colorFondo || 'var(--pt-bg, #ffffff)',
    '--pt-text': sStyle.colorTexto || 'var(--pt-text, #111111)',
    '--pt-accent': sStyle.colorAccent || 'var(--pt-accent, #6b7280)',
    '--pt-icon-color': sStyle.colorIconos || 'var(--pt-icon-color, var(--pt-accent, #6b7280))',
    '--pt-border': sStyle.colorBorde || 'var(--pt-border, #e5e7eb)',
    '--pt-divider-color': sStyle.colorDivider || 'var(--pt-divider-color, var(--pt-border, #e5e7eb))',
    '--pt-tag-bg': sStyle.colorTagFondo || 'var(--pt-tag-bg, #f3f4f6)',
    '--pt-tag-text': sStyle.colorTagTexto || 'var(--pt-tag-text, #374151)',
    ...(fontStyle ? { '--pt-font': fontStyle, fontFamily: fontStyle } : {}),
    ...(fontSizeStyle ? { '--pt-text-size': fontSizeStyle, fontSize: fontSizeStyle } : {}),
    backgroundColor: sStyle.colorFondo || 'transparent',
    color: sStyle.colorTexto || 'var(--pt-text, #111111)',
    borderRadius: hasBg ? 'var(--pt-border-radius, 12px)' : undefined,
    padding: hasBg ? '1.25rem' : undefined,
    border: sStyle.colorBorde ? `var(--pt-border-width, 1px) solid ${sStyle.colorBorde}` : undefined,
    boxShadow: theme?.sombrasActivas && hasBg ? 'var(--pt-shadow, none)' : undefined,
  } as React.CSSProperties

  return (
    <div className="relative overflow-hidden transition-all duration-200" style={wrapperVars}>
      {bgUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("${bgUrl}")`,
            backgroundSize: sStyle.imagenFondoModo || 'cover',
            backgroundRepeat: sStyle.imagenFondoModo === 'repeat' ? 'repeat' : 'no-repeat',
            backgroundPosition: 'center',
            opacity: (sStyle.imagenFondoOpacidad ?? 20) / 100,
          }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function ProfileView({ userProfile, profile, workHistory, certifications, theme }: Props) {
  const parsedAvailability = parseDisponibilidad(profile.disponibilidad)

  const habilidadesComplementariasList: string[] = Array.isArray(profile.habilidades_complementarias)
    ? profile.habilidades_complementarias
    : typeof profile.habilidades_complementarias === 'string' && profile.habilidades_complementarias.trim()
    ? (profile.habilidades_complementarias.startsWith('[')
        ? (() => { try { return JSON.parse(profile.habilidades_complementarias) } catch { return profile.habilidades_complementarias.split(',').map((s) => s.trim()).filter(Boolean) } })()
        : profile.habilidades_complementarias.split(',').map((s) => s.trim()).filter(Boolean))
    : []

  const estudiosList = parseEstudios(profile.ultimo_grado_estudios)
  const activeEstudios = estudiosList.filter(
    (item) => item.seleccionado && item.carrera && item.carrera.trim() !== ''
  )

  const sectionGap = 'var(--pt-section-gap, 2.5rem)'
  const dividerStyle: React.CSSProperties = {
    borderBottomStyle: theme?.estiloDivider === 'dot' ? 'dotted' : theme?.estiloDivider === 'none' ? 'none' : 'solid',
    borderBottomWidth: theme?.estiloDivider === 'none' ? '0px' : 'var(--pt-border-width, 1px)',
    borderBottomColor: 'var(--pt-divider-color, var(--pt-border, #e5e7eb))',
  }

  const orderedSections = theme?.ordenSecciones ?? [
    'resumen', 'especialidades', 'software', 'experiencia',
    'educacion', 'certificaciones', 'idiomas', 'disponibilidad',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap }}>
      {/* Header — always top */}
      <SectionWrapper sectionKey="header" theme={theme}>
        <div className="pb-6" style={dividerStyle}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ color: 'var(--pt-text, #111111)' }}
              >
                {userProfile.nombre} {userProfile.apellido_paterno}{' '}
                {userProfile.apellido_materno}
              </h1>
              {profile.nivel_experiencia && (
                <p className="mt-1" style={{ color: 'var(--pt-accent, #6b7280)' }}>
                  {profile.nivel_experiencia}
                </p>
              )}
            </div>
            {profile.enlace_portafolio && (
              <a
                href={profile.enlace_portafolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm transition-colors shrink-0 px-3 py-2"
                style={{
                  color: 'var(--pt-accent, #6b7280)',
                  border: `var(--pt-border-width, 1px) solid var(--pt-border, #e5e7eb)`,
                  borderRadius: 'var(--pt-border-radius, 12px)',
                  boxShadow: 'var(--pt-shadow, none)',
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--pt-icon-color, var(--pt-accent, #6b7280))' }} />
                Portafolio
              </a>
            )}
          </div>

          {profile.resumen_profesional && (
            <SectionWrapper sectionKey="resumen" theme={theme}>
              <div
                className="prose max-w-none mt-4 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                style={{ color: 'var(--pt-text, #374151)' }}
                dangerouslySetInnerHTML={{ __html: profile.resumen_profesional }}
              />
            </SectionWrapper>
          )}
        </div>
      </SectionWrapper>

      {/* Ordered sections */}
      {orderedSections.map((sectionId) => {
        switch (sectionId) {
          case 'especialidades':
            return profile.especialidades && profile.especialidades.length > 0 ? (
              <SectionWrapper key={sectionId} sectionKey={sectionId} theme={theme}>
                <Section title="Especialidades">
                  <div className="flex flex-wrap gap-2">
                    {profile.especialidades.map((s) => <Tag key={s} label={s} />)}
                  </div>
                </Section>
              </SectionWrapper>
            ) : null

          case 'software':
            return ((profile.software && profile.software.length > 0) || habilidadesComplementariasList.length > 0) ? (
              <SectionWrapper key={sectionId} sectionKey={sectionId} theme={theme}>
                <Section title="Software y herramientas">
                  {profile.software && profile.software.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.software.map((s) => <Tag key={s} label={s} />)}
                    </div>
                  )}
                  {habilidadesComplementariasList.length > 0 && (
                    <div className={profile.software && profile.software.length > 0 ? 'mt-4' : ''}>
                      {profile.software && profile.software.length > 0 && (
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: 'var(--pt-accent, #9ca3af)' }}
                        >
                          Habilidades complementarias
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {habilidadesComplementariasList.map((h) => <Tag key={h} label={h} />)}
                      </div>
                    </div>
                  )}
                </Section>
              </SectionWrapper>
            ) : null

          case 'experiencia':
            return workHistory.length > 0 ? (
              <SectionWrapper key={sectionId} sectionKey={sectionId} theme={theme}>
                <Section title="Experiencia" icon={<Briefcase className="w-4 h-4" />}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pt-subsection-gap, 1.25rem)' }}>
                    {workHistory.map((job, idx) => (
                      <div
                        key={idx}
                        className="pl-4"
                        style={{
                          borderLeft: `2px solid var(--pt-divider-color, var(--pt-border, #e5e7eb))`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: 'var(--pt-text, #111111)' }}
                            >
                              {job.rol}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--pt-accent, #6b7280)' }}>{job.empresa}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs" style={{ color: 'var(--pt-accent, #9ca3af)' }}>{job.periodo}</p>
                            <p className="text-xs capitalize" style={{ color: 'var(--pt-accent, #9ca3af)' }}>{job.modalidad}</p>
                          </div>
                        </div>
                        {job.responsabilidades && (
                          <p
                            className="text-sm mt-2 leading-relaxed"
                            style={{ color: 'var(--pt-text, #374151)', opacity: 0.85 }}
                          >
                            {job.responsabilidades}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              </SectionWrapper>
            ) : null

          case 'educacion':
            return activeEstudios.length > 0 ? (
              <SectionWrapper key={sectionId} sectionKey={sectionId} theme={theme}>
                <Section title="Formación académica" icon={<GraduationCap className="w-4 h-4" />}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pt-subsection-gap, 0.75rem)' }}>
                    {activeEstudios.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 p-4 transition-colors"
                        style={{
                          border: `var(--pt-border-width, 1px) solid var(--pt-border, #e5e7eb)`,
                          borderRadius: 'var(--pt-border-radius, 12px)',
                          boxShadow: 'var(--pt-shadow, none)',
                          backgroundColor: 'color-mix(in srgb, var(--pt-bg, #fff) 95%, var(--pt-border, #e5e7eb))',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="p-2 shrink-0 mt-0.5"
                            style={{
                              backgroundColor: 'var(--pt-bg, #fff)',
                              border: `var(--pt-border-width, 1px) solid var(--pt-border, #e5e7eb)`,
                              borderRadius: 'calc(var(--pt-border-radius, 12px) / 1.5)',
                              color: 'var(--pt-icon-color, var(--pt-accent, #374151))',
                              boxShadow: 'var(--pt-shadow, none)',
                            }}
                          >
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm" style={{ color: 'var(--pt-text, #111111)' }}>
                              {item.tipo}: {item.carrera}
                            </h4>
                            <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--pt-accent, #9ca3af)' }}>
                              Grado {item.tipo.toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {item.estado === 'en_curso' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full">
                              <Clock className="w-3 h-3 text-amber-600" />
                              En curso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Terminado
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </SectionWrapper>
            ) : null

          case 'certificaciones':
            return certifications.length > 0 ? (
              <SectionWrapper key={sectionId} sectionKey={sectionId} theme={theme}>
                <Section title="Certificaciones" icon={<Award className="w-4 h-4" />}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pt-subsection-gap, 0.75rem)' }}>
                    {certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--pt-text, #111111)' }}>{cert.nombre}</p>
                          <p className="text-xs" style={{ color: 'var(--pt-accent, #9ca3af)' }}>
                            {cert.entidad} {cert.anio ? `· ${cert.anio}` : ''}
                          </p>
                        </div>
                        {cert.enlace && (
                          <a
                            href={cert.enlace}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs transition-colors"
                            style={{ color: 'var(--pt-accent, #9ca3af)' }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--pt-icon-color, var(--pt-accent, #9ca3af))' }} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              </SectionWrapper>
            ) : null

          case 'idiomas':
            return profile.idiomas && profile.idiomas.length > 0 ? (
              <SectionWrapper key={sectionId} sectionKey={sectionId} theme={theme}>
                <Section title="Idiomas" icon={<Globe className="w-4 h-4" />}>
                  <div className="flex flex-wrap gap-2">
                    {profile.idiomas.map((lang) => <Tag key={lang} label={lang} />)}
                  </div>
                </Section>
              </SectionWrapper>
            ) : null

          case 'disponibilidad':
            return parsedAvailability.activeDays.length > 0 ? (
              <SectionWrapper key={sectionId} sectionKey={sectionId} theme={theme}>
                <Section title="Disponibilidad horaria" icon={<Clock className="w-4 h-4" />}>
                  <AvailabilityGrid value={profile.disponibilidad} readOnly={true} />
                </Section>
              </SectionWrapper>
            ) : null

          // 'resumen' handled inside header
          default:
            return null
        }
      })}
    </div>
  )
}
