'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { CertificationInput } from '@/lib/validations/freelancer'

interface Props {
  value: CertificationInput[]
  onChange: (value: CertificationInput[]) => void
}

const emptyItem = (): CertificationInput => ({
  id: crypto.randomUUID(),
  nombre: '',
  entidad: '',
  anio: null,
  enlace: '',
})

export function Certifications({ value, onChange }: Props) {
  const add = () => onChange([...value, emptyItem()])
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))

  const update = (
    idx: number,
    key: keyof CertificationInput,
    val: string | number | null
  ) => {
    const updated = value.map((item, i) =>
      i === idx ? { ...item, [key]: val } : item
    )
    onChange(updated)
  }

  const inputClass =
    'w-full border border-gray-200/90 bg-white rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all shadow-2xs hover:border-gray-300'
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1.5'

  return (
    <div className="space-y-5">
      {value.map((item, idx) => (
        <div
          key={item.id || idx}
          className="border border-gray-200/80 bg-gray-50/40 rounded-2xl p-5 sm:p-6 space-y-5 relative transition-all"
        >
          <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Certificación #{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Eliminar certificación"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className={labelClass}>
                Nombre de la certificación o diploma
              </label>
              <input
                type="text"
                value={item.nombre}
                onChange={(e) => update(idx, 'nombre', e.target.value)}
                placeholder="Ej. Google UX Design Certificate"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Entidad emisora / Institución
              </label>
              <input
                type="text"
                value={item.entidad}
                onChange={(e) => update(idx, 'entidad', e.target.value)}
                placeholder="Ej. Coursera / Google / Platzi"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Año de obtención</label>
              <input
                type="number"
                value={item.anio ?? ''}
                onChange={(e) =>
                  update(idx, 'anio', e.target.value ? parseInt(e.target.value) : null)
                }
                min={1990}
                max={new Date().getFullYear()}
                placeholder="2023"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Enlace a credencial (opcional)
              </label>
              <input
                type="url"
                value={item.enlace || ''}
                onChange={(e) => update(idx, 'enlace', e.target.value)}
                placeholder="https://credencial.com/..."
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50/80 rounded-2xl py-4 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
      >
        <Plus className="w-4 h-4 text-gray-500" />
        Agregar otra certificación
      </button>
    </div>
  )
}
