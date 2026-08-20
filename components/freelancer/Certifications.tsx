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
    'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all'

  return (
    <div className="space-y-4">
      {value.map((item, idx) => (
        <div
          key={item.id || idx}
          className="border border-gray-100 rounded-xl p-5 space-y-4 relative"
        >
          <button
            type="button"
            onClick={() => remove(idx)}
            className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Nombre del certificado
              </label>
              <input
                type="text"
                value={item.nombre}
                onChange={(e) => update(idx, 'nombre', e.target.value)}
                placeholder="Google UX Design Certificate"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Entidad emisora
              </label>
              <input
                type="text"
                value={item.entidad}
                onChange={(e) => update(idx, 'entidad', e.target.value)}
                placeholder="Coursera / Google"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
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
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Enlace (opcional)
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
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar certificación
      </button>
    </div>
  )
}
