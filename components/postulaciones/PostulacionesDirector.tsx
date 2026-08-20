'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { DAYS_OF_WEEK, TIME_BLOCKS } from '@/lib/constants/roles'

interface Postulacion {
  id: string
  estado: string
  portafolio_url: string | null
  extracto_experiencia: string | null
  calendario: Record<string, string> | null
  respuestas_preguntas: Array<{ pregunta: string; respuesta: string }> | null
  created_at: string
  freelancer_id: string
  vacante_id: string
  freelancer_profiles: {
    id: string
    enlace_portafolio: string | null
    nivel_experiencia: string | null
    especialidades: string[] | null
    publicado: boolean
    profiles: {
      nombre: string
      apellido_paterno: string
      apellido_materno: string
      correo_personal: string
    } | null
  } | null
  vacantes: {
    id: string
    roles_buscados: string[]
    nivel_requerido: string | null
    modalidad: string
  } | null
}

interface Props {
  postulaciones: Postulacion[]
  directorId: string
}

function getTimeLabel(val: string) {
  return TIME_BLOCKS.find((b) => b.value === val)?.label || val
}

export function PostulacionesDirector({ postulaciones, directorId }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, { type: 'success' | 'error'; msg: string }>>({})

  const MODALIDAD: Record<string, string> = {
    en_linea: 'En línea',
    presencial: 'Presencial',
    hibrido: 'Híbrido',
  }

  const ESTADO_STYLES: Record<string, string> = {
    pendiente: 'bg-yellow-50 text-yellow-700',
    aceptado: 'bg-green-50 text-green-700',
    rechazado: 'bg-red-50 text-red-700',
  }

  const handleAccept = async (postulacionId: string) => {
    setLoading(postulacionId)
    const supabase = createClient()

    const { data, error } = await supabase.rpc('accept_freelancer', {
      p_postulacion_id: postulacionId,
      p_director_id: directorId,
    })

    if (error || !data?.success) {
      setFeedback({
        ...feedback,
        [postulacionId]: {
          type: 'error',
          msg: data?.error || 'Error al aceptar al freelancer.',
        },
      })
    } else {
      setFeedback({
        ...feedback,
        [postulacionId]: { type: 'success', msg: '¡Freelancer aceptado correctamente!' },
      })
      router.refresh()
    }
    setLoading(null)
  }

  const handleReject = async (postulacionId: string) => {
    setLoading(postulacionId)
    const supabase = createClient()

    const { data, error } = await supabase.rpc('reject_freelancer', {
      p_postulacion_id: postulacionId,
      p_director_id: directorId,
    })

    if (error || !data?.success) {
      setFeedback({
        ...feedback,
        [postulacionId]: {
          type: 'error',
          msg: data?.error || 'Error al rechazar la postulación.',
        },
      })
    } else {
      setFeedback({
        ...feedback,
        [postulacionId]: { type: 'success', msg: 'Postulación rechazada.' },
      })
      router.refresh()
    }
    setLoading(null)
  }

  if (postulaciones.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
        <p className="text-gray-400">No has recibido postulaciones aún.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {postulaciones.map((p) => {
        const fp = p.freelancer_profiles
        const profile = fp?.profiles
        const vacante = p.vacantes
        const isExpanded = expanded === p.id
        const fb = feedback[p.id]
        const isLoading = loading === p.id

        return (
          <div key={p.id} className="border border-gray-100 rounded-2xl overflow-hidden">
            {/* Header row */}
            <div
              className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : p.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900">
                    {profile
                      ? `${profile.nombre} ${profile.apellido_paterno} ${profile.apellido_materno}`
                      : 'Freelancer'}
                  </p>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      ESTADO_STYLES[p.estado] || ESTADO_STYLES.pendiente
                    }`}
                  >
                    {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                  {fp?.nivel_experiencia && <span>{fp.nivel_experiencia}</span>}
                  {vacante?.roles_buscados?.slice(0, 2).map((r) => (
                    <span key={r}>{r}</span>
                  ))}
                  {vacante?.modalidad && <span>{MODALIDAD[vacante.modalidad]}</span>}
                </div>
              </div>
              <div className="text-gray-300 shrink-0">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {/* Expandable detail */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-5 space-y-5 bg-gray-50">
                {/* Contact */}
                {profile?.correo_personal && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Correo de contacto</p>
                    <p className="text-sm text-gray-700">{profile.correo_personal}</p>
                  </div>
                )}

                {/* Specialties */}
                {fp?.especialidades && fp.especialidades.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Especialidades</p>
                    <div className="flex flex-wrap gap-1.5">
                      {fp.especialidades.map((s) => (
                        <span key={s} className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portfolio links */}
                <div className="flex gap-3">
                  {p.portafolio_url && (
                    <a
                      href={p.portafolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:text-black bg-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Portafolio enviado
                    </a>
                  )}
                  {fp?.enlace_portafolio && (
                    <a
                      href={fp.enlace_portafolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:text-black bg-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Portafolio del perfil
                    </a>
                  )}
                </div>

                {/* Extracto */}
                {p.extracto_experiencia && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Extracto de experiencia</p>
                    <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-xl p-3 leading-relaxed">
                      {p.extracto_experiencia}
                    </p>
                  </div>
                )}

                {/* Calendario */}
                {p.calendario && Object.keys(p.calendario).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Disponibilidad confirmada</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DAYS_OF_WEEK.filter((d) => p.calendario![d.value]).map((day) => (
                        <div key={day.value} className="bg-white border border-gray-200 rounded-xl p-2.5">
                          <p className="text-xs font-medium text-gray-700">{day.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {getTimeLabel(p.calendario![day.value])}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preguntas y respuestas */}
                {p.respuestas_preguntas && p.respuestas_preguntas.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-500">Respuestas a preguntas</p>
                    {p.respuestas_preguntas.map((qa, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">{qa.pregunta}</p>
                        <p className="text-sm text-gray-800">{qa.respuesta}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Feedback message */}
                {fb && (
                  <div
                    className={`text-sm rounded-xl px-4 py-3 ${
                      fb.type === 'success'
                        ? 'bg-green-50 border border-green-100 text-green-700'
                        : 'bg-red-50 border border-red-100 text-red-700'
                    }`}
                  >
                    {fb.msg}
                  </div>
                )}

                {/* Actions — only show for pending */}
                {p.estado === 'pendiente' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleReject(p.id)}
                      disabled={isLoading}
                      className="flex-1 border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '...' : 'Rechazar'}
                    </button>
                    <button
                      onClick={() => handleAccept(p.id)}
                      disabled={isLoading}
                      className="flex-1 bg-black text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Procesando...' : 'Aceptar freelancer'}
                    </button>
                  </div>
                )}

                {/* Accepted — immutable notice */}
                {p.estado === 'aceptado' && (
                  <div className="text-xs text-gray-400 bg-gray-100 rounded-xl px-4 py-3">
                    Este freelancer ya forma parte de tu oficina. Esta relación laboral es permanente.
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
