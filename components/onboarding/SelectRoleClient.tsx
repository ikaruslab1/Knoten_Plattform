'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
}

type Role = 'freelancer' | 'director'

const roles = [
  {
    value: 'freelancer' as Role,
    title: 'Freelancer',
    description:
      'Soy diseñador gráfico y quiero postularme a proyectos con oficinas de diseño.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    value: 'director' as Role,
    title: 'Director de área',
    description:
      'Dirijo una oficina de diseño y quiero reclutar profesionales para mis proyectos.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
]

export function SelectRoleClient({ userId }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ rol: selected })
      .eq('id', userId)

    if (updateError) {
      setError('Error al guardar el rol. Intenta nuevamente.')
      setLoading(false)
      return
    }

    // Create the role-specific profile row
    if (selected === 'freelancer') {
      await supabase.from('freelancer_profiles').insert({ id: userId })
    }

    router.push(selected === 'freelancer' ? '/freelancer/profile' : '/director/profile')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => setSelected(role.value)}
            className={`p-8 border-2 rounded-2xl text-left transition-all ${
              selected === role.value
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="mb-4 text-gray-900">{role.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{role.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{role.description}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selected || loading}
        className="w-full bg-black text-white rounded-xl px-6 py-4 font-medium hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading
          ? 'Guardando...'
          : selected
          ? `Continuar como ${selected === 'freelancer' ? 'Freelancer' : 'Director de área'}`
          : 'Selecciona un rol para continuar'}
      </button>

      <p className="text-center text-xs text-gray-400">
        Esta elección es permanente y no podrá modificarse después.
      </p>
    </div>
  )
}
