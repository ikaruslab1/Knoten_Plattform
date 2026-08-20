'use client'

import { parseEstudios, EstudioItem } from '@/lib/validations/freelancer'
import { GraduationCap, CheckCircle2, Clock } from 'lucide-react'

interface EstudiosInputProps {
  value: any
  onChange: (newValue: EstudioItem[]) => void
  error?: string
}

export function EstudiosInput({ value, onChange, error }: EstudiosInputProps) {
  const currentItems = parseEstudios(value)

  const handleToggleSelect = (index: number) => {
    const updated = currentItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, seleccionado: !item.seleccionado }
      }
      return item
    })
    onChange(updated)
  }

  const handleToggleEstado = (index: number) => {
    const updated = currentItems.map((item, idx) => {
      if (idx === index) {
        const nextEstado: 'en_curso' | 'terminado' = item.estado === 'terminado' ? 'en_curso' : 'terminado'
        return { ...item, estado: nextEstado }
      }
      return item
    })
    onChange(updated)
  }

  const handleCarreraChange = (index: number, newCarrera: string) => {
    const updated = currentItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, carrera: newCarrera }
      }
      return item
    })
    onChange(updated)
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {currentItems.map((item, idx) => {
        const isChecked = item.seleccionado
        const isTerminado = item.estado === 'terminado'
        const placeholder =
          item.tipo === 'Técnico'
            ? 'ej. Diseño de modas, Contabilidad, Soporte Técnico...'
            : 'ej. Licenciatura en Diseño Gráfico, Arquitectura, Artes Visuales...'

        return (
          <div
            key={item.tipo}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              isChecked
                ? 'border-gray-900 bg-white shadow-sm ring-1 ring-gray-900/5'
                : 'border-gray-200/80 bg-gray-50/40 hover:border-gray-300'
            }`}
          >
            {/* Card Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleSelect(idx)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
                />
                <span className="flex items-center gap-2 font-bold text-gray-900 text-sm group-hover:text-black">
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                  {item.tipo}
                </span>
              </label>

              {/* Status Switch (Only interactive when checked) */}
              {isChecked && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 hidden sm:inline">Estatus:</span>
                  <button
                    type="button"
                    onClick={() => handleToggleEstado(idx)}
                    className={`relative inline-flex items-center h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20 ${
                      isTerminado ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                    title={isTerminado ? 'Marcar como en curso' : 'Marcar como terminado'}
                  >
                    <span className="sr-only">Estado del grado</span>
                    <span className="inline-flex items-center justify-center h-6 px-3 rounded-full text-[11px] font-semibold text-white transition duration-200">
                      {isTerminado ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" /> Terminado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> En curso
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Card Body - Text Area / Input */}
            {isChecked && (
              <div className="p-4 sm:p-5 bg-gray-50/30 space-y-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-gray-600">
                  Especifica la especialidad o carrera ({item.tipo}):
                </label>
                <textarea
                  rows={2}
                  value={item.carrera}
                  onChange={(e) => handleCarreraChange(idx, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 bg-white text-sm text-gray-900 border border-gray-200/90 rounded-xl placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-colors resize-y shadow-2xs"
                />
              </div>
            )}
          </div>
        )
      })}

      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
