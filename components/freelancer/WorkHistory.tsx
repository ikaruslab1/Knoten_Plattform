'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { WorkHistoryInput } from '@/lib/validations/freelancer'
import { WORK_MODALITIES } from '@/lib/constants/roles'

interface Props {
  value: WorkHistoryInput[]
  onChange: (value: WorkHistoryInput[]) => void
}

const emptyItem = (): WorkHistoryInput => ({
  id: crypto.randomUUID(),
  rol: '',
  empresa: '',
  periodo: '',
  modalidad: '',
  responsabilidades: '',
})

export function WorkHistory({ value, onChange }: Props) {
  const add = () => onChange([...value, emptyItem()])

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))

  const update = (idx: number, key: keyof WorkHistoryInput, val: string) => {
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
              Experiencia #{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Eliminar experiencia"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className={labelClass}>Rol o puesto</label>
              <input
                type="text"
                value={item.rol}
                onChange={(e) => update(idx, 'rol', e.target.value)}
                placeholder="Ej. Diseñador UI/UX Senior"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Empresa o cliente</label>
              <input
                type="text"
                value={item.empresa}
                onChange={(e) => update(idx, 'empresa', e.target.value)}
                placeholder="Ej. Estudio de Diseño / Freelance"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Periodo de tiempo</label>
              <input
                type="text"
                value={item.periodo}
                onChange={(e) => update(idx, 'periodo', e.target.value)}
                placeholder="Ej. Ene 2022 – Actualidad"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Modalidad de trabajo</label>
              <select
                value={item.modalidad}
                onChange={(e) => update(idx, 'modalidad', e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar modalidad</option>
                {WORK_MODALITIES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Principales logros y responsabilidades
            </label>
            <textarea
              rows={3}
              value={item.responsabilidades || ''}
              onChange={(e) => update(idx, 'responsabilidades', e.target.value)}
              placeholder="Describe tus contribuciones clave, sistemas desarrollados o impacto logrado..."
              className={inputClass}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50/80 rounded-2xl py-4 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
      >
        <Plus className="w-4 h-4 text-gray-500" />
        Agregar otra experiencia laboral
      </button>
    </div>
  )
}
