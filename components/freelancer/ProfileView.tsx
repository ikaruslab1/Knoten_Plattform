import { ExternalLink, Briefcase, Award, Globe, Clock } from 'lucide-react'
import { DAYS_OF_WEEK, TIME_BLOCKS } from '@/lib/constants/roles'

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
    habilidades_complementarias?: string
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
  const getTimeLabel = (val: string) =>
    TIME_BLOCKS.find((b) => b.value === val)?.label || val

  const availableDays = DAYS_OF_WEEK.filter(
    (d) => profile.disponibilidad?.[d.value]
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
          <p className="text-gray-600 mt-4 leading-relaxed">{profile.resumen_profesional}</p>
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

      {/* Software */}
      {profile.software && profile.software.length > 0 && (
        <Section title="Software y herramientas">
          <div className="flex flex-wrap gap-2">
            {profile.software.map((s) => <Tag key={s} label={s} />)}
          </div>
          {profile.habilidades_complementarias && (
            <p className="text-sm text-gray-500 mt-2">{profile.habilidades_complementarias}</p>
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
      {profile.ultimo_grado_estudios && (
        <Section title="Formación académica">
          <p className="text-sm text-gray-700">{profile.ultimo_grado_estudios}</p>
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
      {availableDays.length > 0 && (
        <Section title="Disponibilidad" icon={<Clock className="w-4 h-4" />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableDays.map((day) => (
              <div key={day.value} className="border border-gray-100 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-700">{day.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {getTimeLabel(profile.disponibilidad![day.value])}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
