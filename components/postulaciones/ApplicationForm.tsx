'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DAYS_OF_WEEK, TIME_BLOCKS } from '@/lib/constants/roles'

interface Props {
  vacanteId: string
  freelancerId: string
  oficinaNombre: string
  rolesVacante: string[]
  solicitarPortafolio: boolean
  solicitarExtracto: boolean
  confirmarCalendario: boolean
  preguntasReclutamiento: string[]
}

export function ApplicationForm({
  vacanteId,
  freelancerId,
  oficinaNombre,
  rolesVacante,
  solicitarPortafolio,
  solicitarExtracto,
  confirmarCalendario,
  preguntasReclutamiento,
}: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portafolioUrl, setPortafolioUrl] = useState('')
  const [extracto, setExtracto] = useState('')
  const [calendario, setCalendario] = useState<Record<string, string>>({})
  const [respuestas, setRespuestas] = useState<string[]>(
    preguntasReclutamiento.map(() => '')
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const respuestasJson = preguntasReclutamiento.map((pregunta, idx) => ({
      pregunta,
      respuesta: respuestas[idx] || '',
    }))

    const { error: postError } = await supabase.from('postulaciones').insert({
      freelancer_id: freelancerId,
      vacante_id: vacanteId,
      portafolio_url: solicitarPortafolio ? portafolioUrl : null,
      extracto_experiencia: solicitarExtracto ? extracto : null,
      calendario: confirmarCalendario ? calendario : null,
      respuestas_preguntas: respuestasJson,
    })

    if (postError) {
      setError('Error al enviar la postulación. Intenta nuevamente.')
      setLoading(false)
      return
    }

    // Send confirmation email
    try {
      await fetch('/api/email/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancerId,
          oficinaNombre,
          rolesVacante,
        }),
      })
    } catch {
      // Non-critical
    }

    setIsOpen(false)
    router.refresh()
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-900 transition-colors"
      >
        Postularme
      </button>
    )
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 border-t border-gray-100 pt-5 mt-4">
      <h3 className="text-sm font-semibold text-gray-900">
        Postularte a {oficinaNombre}
      </h3>

      {/* Portafolio */}
      {solicitarPortafolio && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Enlace a portafolio <span className="text-red-400">*</span>
          </label>
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

      {/* Extracto de experiencia */}
      {solicitarExtracto && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Extracto de experiencia relevante <span className="text-red-400">*</span>
          </label>
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

      {/* Calendario de disponibilidad */}
      {confirmarCalendario && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirma tu disponibilidad <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="border border-gray-100 rounded-xl p-2">
                <p className="text-xs font-medium text-gray-700 mb-1">{day.label}</p>
                <select
                  value={calendario[day.value] || ''}
                  onChange={(e) =>
                    setCalendario({ ...calendario, [day.value]: e.target.value })
                  }
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">No disponible</option>
                  {TIME_BLOCKS.map((block) => (
                    <option key={block.value} value={block.value}>
                      {block.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preguntas de reclutamiento */}
      {preguntasReclutamiento.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">Preguntas de reclutamiento</p>
          {preguntasReclutamiento.map((pregunta, idx) => (
            <div key={idx}>
              <label className="block text-sm text-gray-600 mb-1.5">
                {idx + 1}. {pregunta}
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
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-1 border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar postulación'}
        </button>
      </div>
    </form>
  )
}
