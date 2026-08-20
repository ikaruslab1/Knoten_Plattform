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
              <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
              <input
                type="text"
                value={item.rol}
                onChange={(e) => update(idx, 'rol', e.target.value)}
                placeholder="Diseñador UI/UX"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Empresa</label>
              <input
                type="text"
                value={item.empresa}
                onChange={(e) => update(idx, 'empresa', e.target.value)}
                placeholder="Estudio de diseño"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Periodo</label>
              <input
                type="text"
                value={item.periodo}
                onChange={(e) => update(idx, 'periodo', e.target.value)}
                placeholder="Ene 2022 – Dic 2023"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Modalidad</label>
              <select
                value={item.modalidad}
                onChange={(e) => update(idx, 'modalidad', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona</option>
                {WORK_MODALITIES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Responsabilidades
            </label>
            <textarea
              rows={3}
              value={item.responsabilidades || ''}
              onChange={(e) => update(idx, 'responsabilidades', e.target.value)}
              placeholder="Describe brevemente tus responsabilidades en este rol..."
              className={inputClass}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar experiencia laboral
      </button>
    </div>
  )
}
