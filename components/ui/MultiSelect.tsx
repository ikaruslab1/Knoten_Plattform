'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  options: string[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  error?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar y seleccionar...',
  error,
}: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = options.filter(
    (opt) =>
      opt.toLowerCase().includes(search.toLowerCase()) && !value.includes(opt)
  )

  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt))
    } else {
      onChange([...value, opt])
      setSearch('')
    }
  }

  return (
    <div className="relative">
      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full"
            >
              {v}
              <button
                type="button"
                onClick={() => toggle(v)}
                className="text-gray-400 hover:text-gray-900 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${
          error ? 'border-red-300' : 'border-gray-200'
        }`}
      />

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.slice(0, 20).map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={() => toggle(opt)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              {opt}
            </button>
          ))}
          {filtered.length > 20 && (
            <p className="px-4 py-2 text-xs text-gray-400">
              +{filtered.length - 20} más. Escribe para filtrar.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
