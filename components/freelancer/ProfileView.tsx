import { ExternalLink, Briefcase, Award, Globe, Clock, GraduationCap, CheckCircle2 } from 'lucide-react'
import { DAYS_OF_WEEK, TIME_BLOCKS } from '@/lib/constants/roles'
import { parseEstudios, parseDisponibilidad } from '@/lib/validations/freelancer'
import { AvailabilityGrid } from '@/components/freelancer/AvailabilityGrid'

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
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
      {label}
    </span>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export function ProfileView({ userProfile, profile, workHistory, certifications }: Props) {
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

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-gray-100 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {userProfile.nombre} {userProfile.apellido_paterno}{' '}
              {userProfile.apellido_materno}
            </h1>
            {profile.nivel_experiencia && (
              <p className="text-gray-500 mt-1">{profile.nivel_experiencia}</p>
            )}
          </div>
          {profile.enlace_portafolio && (
            <a
              href={profile.enlace_portafolio}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors shrink-0 border border-gray-200 rounded-lg px-3 py-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Portafolio
            </a>
          )}
        </div>

        {profile.resumen_profesional && (
          <div
            className="prose max-w-none text-gray-600 mt-4 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: profile.resumen_profesional }}
          />
        )}
      </div>

      {/* Specialties */}
      {profile.especialidades && profile.especialidades.length > 0 && (
        <Section title="Especialidades">
          <div className="flex flex-wrap gap-2">
            {profile.especialidades.map((s) => <Tag key={s} label={s} />)}
          </div>
        </Section>
      )}

      {/* Software y Herramientas */}
      {((profile.software && profile.software.length > 0) || habilidadesComplementariasList.length > 0) && (
        <Section title="Software y herramientas">
          {profile.software && profile.software.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.software.map((s) => <Tag key={s} label={s} />)}
            </div>
          )}
          {habilidadesComplementariasList.length > 0 && (
            <div className={profile.software && profile.software.length > 0 ? "mt-4" : ""}>
              {profile.software && profile.software.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Habilidades complementarias</p>
              )}
              <div className="flex flex-wrap gap-2">
                {habilidadesComplementariasList.map((h) => <Tag key={h} label={h} />)}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Work History */}
      {workHistory.length > 0 && (
        <Section title="Experiencia" icon={<Briefcase className="w-4 h-4" />}>
          <div className="space-y-5">
            {workHistory.map((job, idx) => (
              <div key={idx} className="border-l-2 border-gray-100 pl-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{job.rol}</p>
                    <p className="text-sm text-gray-500">{job.empresa}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{job.periodo}</p>
                    <p className="text-xs text-gray-400 capitalize">{job.modalidad}</p>
                  </div>
                </div>
                {job.responsabilidades && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {job.responsabilidades}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {activeEstudios.length > 0 && (
        <Section title="Formación académica" icon={<GraduationCap className="w-4 h-4" />}>
          <div className="space-y-3">
            {activeEstudios.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-2xs shrink-0 text-gray-700 mt-0.5">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {item.tipo}: {item.carrera}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
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
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <Section title="Certificaciones" icon={<Award className="w-4 h-4" />}>
          <div className="space-y-3">
            {certifications.map((cert, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{cert.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {cert.entidad} {cert.anio ? `· ${cert.anio}` : ''}
                  </p>
                </div>
                {cert.enlace && (
                  <a
                    href={cert.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-black transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {profile.idiomas && profile.idiomas.length > 0 && (
        <Section title="Idiomas" icon={<Globe className="w-4 h-4" />}>
          <div className="flex flex-wrap gap-2">
            {profile.idiomas.map((lang) => <Tag key={lang} label={lang} />)}
          </div>
        </Section>
      )}

      {/* Availability */}
      {parsedAvailability.activeDays.length > 0 && (
        <Section title="Disponibilidad horaria" icon={<Clock className="w-4 h-4" />}>
          <AvailabilityGrid value={profile.disponibilidad} readOnly={true} />
        </Section>
      )}
    </div>
  )
}
