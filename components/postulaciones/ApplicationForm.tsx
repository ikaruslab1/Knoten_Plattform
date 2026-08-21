'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { OFFICE_SPECIALTIES } from '@/lib/constants/roles'
import { AvailabilityGrid } from '@/components/freelancer/AvailabilityGrid'

interface OfficeInfo {
  id: string
  nombre: string
  logo_url?: string | null
  especialidad?: string | null
  manifiesto?: string | null
  links_portafolios?: string[]
}

interface VacanteInfo {
  id: string
  equipo?: string | null
  roles_buscados: string[]
  nivel_requerido?: string | null
  modalidad: string
  horas_semanales: number
  duracion_semanas: number
  num_lugares: number
  habilidades?: string[]
  responsabilidades?: string | null
  solicitar_portafolio: boolean
  solicitar_extracto: boolean
  confirmar_calendario: boolean
  preguntas_reclutamiento: string[]
}

interface Props {
  vacanteId: string
  freelancerId: string
  initialPortafolioUrl?: string
  initialDisponibilidad?: any
  office: OfficeInfo
  vacante: VacanteInfo
}

const MODALIDAD_LABELS: Record<string, string> = {
  en_linea: 'En línea',
  presencial: 'Presencial',
  hibrido: 'Híbrido',
}

export function ApplicationForm({
  vacanteId,
  freelancerId,
  initialPortafolioUrl = '',
  initialDisponibilidad = null,
  office,
  vacante,
}: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states:
  // 1) Portafolio: Auto-filled from profile if present, else empty
  const [portafolioUrl, setPortafolioUrl] = useState(initialPortafolioUrl)

  // 2) Extracto de experiencia: ALWAYS starts empty
  const [extracto, setExtracto] = useState('')

  // 3) Calendario de disponibilidad: Auto-filled from profile availability if present, else empty
  const [calendario, setCalendario] = useState<any>(
    initialDisponibilidad || { activeDays: [], slots: {} }
  )

  // 4) Preguntas de reclutamiento: Empty responses
  const [respuestas, setRespuestas] = useState<string[]>(
    (vacante.preguntas_reclutamiento || []).map(() => '')
  )

  // Prevent background scroll when full-screen modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const respuestasJson = (vacante.preguntas_reclutamiento || []).map((pregunta, idx) => ({
      pregunta,
      respuesta: respuestas[idx] || '',
    }))

    const { error: postError } = await supabase.from('postulaciones').insert({
      freelancer_id: freelancerId,
      vacante_id: vacanteId,
      portafolio_url: vacante.solicitar_portafolio ? portafolioUrl : null,
      extracto_experiencia: vacante.solicitar_extracto ? extracto : null,
      calendario: vacante.confirmar_calendario ? calendario : null,
      respuestas_preguntas: respuestasJson,
    })

    if (postError) {
      setError('Error al enviar la postulación. Intenta nuevamente.')
      setLoading(false)
      return
    }

    setIsOpen(false)
    router.refresh()
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-black text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-neutral-900 transition-colors shadow-2xs cursor-pointer"
      >
        Postularme
      </button>
    )
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-2xs hover:border-gray-300'

  const especialidadObj = OFFICE_SPECIALTIES.find((s) => s.value === office.especialidad)
  const especialidadLabel = especialidadObj ? especialidadObj.label : office.especialidad

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Full Screen / Full Size Modal Card Container */}
      <div className="bg-white w-full max-w-7xl h-full max-h-[96vh] rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Fixed Header Bar */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Proceso de postulación
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              Postularte a {office.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-all text-base font-bold shadow-2xs cursor-pointer"
            title="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body with Split Screen View */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* PARTE IZQUIERDA: Formulario con los inputs del postulante */}
            <div className="order-1 lg:order-1 space-y-6">
              <div className="bg-gray-50/80 p-4.5 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Tu candidatura</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Completa los requisitos solicitados para enviar tu postulación directa a la oficina.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Enlace Portafolio */}
                {vacante.solicitar_portafolio && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-900">
                      Enlace a portafolio <span className="text-red-500">*</span>
                    </label>
                    {initialPortafolioUrl ? (
                      <p className="text-xs text-emerald-700 font-medium">
                        ✓ Autorrellenado con la URL de tu perfil. Puedes modificarlo si lo requieres.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Ingresa el enlace a tu portafolio en línea o sitio web.
                      </p>
                    )}
                    <input
                      type="url"
                      required
                      value={portafolioUrl}
                      onChange={(e) => setPortafolioUrl(e.target.value)}
                      placeholder="https://tu-portafolio.com"
                      className={inputClass}
                    />
                  </div>
                )}

                {/* 2. Extracto de experiencia relevante (SIEMPRE VACÍO) */}
                {vacante.solicitar_extracto && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-900">
                      Extracto de experiencia relevante <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500">
                      Escribe un resumen puntual sobre tu experiencia directamente relacionada con las necesidades de esta vacante.
                    </p>
                    <textarea
                      required
                      rows={4}
                      value={extracto}
                      onChange={(e) => setExtracto(e.target.value)}
                      placeholder="Describe brevemente tu experiencia más relevante para este puesto..."
                      className={inputClass}
                    />
                  </div>
                )}

                {/* 3. Calendario de disponibilidad */}
                {vacante.confirmar_calendario && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">
                      Confirma tu disponibilidad <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      {initialDisponibilidad && initialDisponibilidad.activeDays?.length > 0
                        ? '✓ Tu disponibilidad configurada en el perfil se ha cargado automáticamente. Puedes ajustarla para esta vacante.'
                        : 'Selecciona los días y horarios en los que tienes disponibilidad semanal.'}
                    </p>
                    <AvailabilityGrid
                      value={calendario}
                      onChange={(val) => setCalendario(val)}
                    />
                  </div>
                )}

                {/* 4. Preguntas de reclutamiento */}
                {vacante.preguntas_reclutamiento.length > 0 && (
                  <div className="space-y-5 pt-2">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                      Preguntas de reclutamiento
                    </h4>
                    {vacante.preguntas_reclutamiento.map((pregunta, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-800">
                          {idx + 1}. {pregunta} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={respuestas[idx] || ''}
                          onChange={(e) => {
                            const newResp = [...respuestas]
                            newResp[idx] = e.target.value
                            setRespuestas(newResp)
                          }}
                          placeholder="Responde aquí..."
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl p-4">
                    {error}
                  </div>
                )}

                {/* Form action buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 border border-gray-200 text-gray-700 rounded-xl px-5 py-3.5 text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-black text-white rounded-xl px-5 py-3.5 text-sm font-semibold hover:bg-neutral-900 transition-colors disabled:opacity-50 shadow-md cursor-pointer"
                  >
                    {loading ? 'Enviando...' : 'Enviar postulación'}
                  </button>
                </div>
              </form>
            </div>

            {/* PARTE DERECHA: Información de la Oficina y detalles por secciones de la vacante */}
            <div className="order-2 lg:order-2 space-y-8">
              {/* PRIMERA SECCIÓN: Información sobre la oficina */}
              <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-6 sm:p-7 space-y-5">
                <div className="flex items-start gap-4 pb-4 border-b border-gray-200/60">
                  {office.logo_url ? (
                    <img
                      src={office.logo_url}
                      alt={office.nombre}
                      className="w-14 h-14 object-contain bg-white rounded-xl p-1.5 border border-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-neutral-900 text-white rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
                      {office.nombre[0]}
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Oficina empleadora
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                      {office.nombre}
                    </h3>
                    {especialidadLabel && (
                      <span className="inline-block bg-white text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-gray-200">
                        {especialidadLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Links de portafolios de la oficina */}
                {office.links_portafolios && office.links_portafolios.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-600 block">
                      Portafolios y sitio web de la oficina:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {office.links_portafolios.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline truncate max-w-full bg-white px-2.5 py-1 rounded-lg border border-gray-200"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manifiesto de la oficina con formato del editor especial */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                    Manifiesto de la oficina
                  </span>
                  {office.manifiesto ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-700 bg-white p-4.5 rounded-xl border border-gray-200/80 leading-relaxed font-normal"
                      dangerouslySetInnerHTML={{ __html: office.manifiesto }}
                    />
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      La oficina aún no ha publicado un manifiesto.
                    </p>
                  )}
                </div>
              </div>

              {/* SEGUNDA SECCIÓN: Información por secciones de la vacante publicada */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xs">
                <div className="border-b border-gray-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Especificaciones
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">
                    Información de la vacante
                  </h3>
                </div>

                {/* Roles buscados */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-500 block">Roles buscados</span>
                  <div className="flex flex-wrap gap-2">
                    {vacante.roles_buscados.map((rol) => (
                      <span
                        key={rol}
                        className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full"
                      >
                        {rol}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Condiciones del proyecto */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 block">Modalidad</span>
                    <span className="text-xs font-bold text-gray-900">
                      {MODALIDAD_LABELS[vacante.modalidad] || vacante.modalidad}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 block">Nivel requerido</span>
                    <span className="text-xs font-bold text-gray-900">
                      {vacante.nivel_requerido || 'No especificado'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 block">Dedicación semanal</span>
                    <span className="text-xs font-bold text-gray-900">
                      {vacante.horas_semanales} hrs / semana
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 block">Duración estimada</span>
                    <span className="text-xs font-bold text-gray-900">
                      {vacante.duracion_semanas} {vacante.duracion_semanas === 1 ? 'semana' : 'semanas'}
                    </span>
                  </div>
                </div>

                {/* Equipo asignado */}
                {vacante.equipo && (
                  <div className="bg-emerald-50 border border-emerald-200/70 p-3.5 rounded-xl text-emerald-900 flex items-center justify-between text-xs">
                    <span className="font-semibold">Puesto en equipo</span>
                    <span className="font-bold bg-emerald-200 text-emerald-950 px-2.5 py-0.5 rounded-full">
                      {vacante.equipo}
                    </span>
                  </div>
                )}

                {/* Habilidades requeridas */}
                {vacante.habilidades && vacante.habilidades.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-700 block">
                      Habilidades y competencias clave
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {vacante.habilidades.map((hab, i) => (
                        <span
                          key={i}
                          className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-lg border border-gray-200 font-medium"
                        >
                          {hab}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Responsabilidades del puesto */}
                {vacante.responsabilidades && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-700 block">
                      Responsabilidades y alcance
                    </span>
                    {vacante.responsabilidades.trim().startsWith('<') ? (
                      <div
                        className="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100 leading-relaxed prose max-w-none prose-p:my-1 prose-xs"
                        dangerouslySetInnerHTML={{ __html: vacante.responsabilidades }}
                      />
                    ) : (
                      <div className="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-line">
                        {vacante.responsabilidades}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
