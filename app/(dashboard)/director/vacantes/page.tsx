import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function DirectorVacantesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: office } = await supabase
    .from('offices')
    .select('id, nombre')
    .eq('director_id', user.id)
    .single()

  if (!office) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">Primero debes configurar tu oficina.</p>
        <Link
          href="/director/profile"
          className="inline-flex bg-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          Configurar oficina
        </Link>
      </div>
    )
  }

  const { data: vacantes } = await supabase
    .from('vacantes')
    .select('*')
    .eq('office_id', office.id)
    .order('created_at', { ascending: false })

  const MODALIDAD_LABELS: Record<string, string> = {
    en_linea: 'En línea',
    presencial: 'Presencial',
    hibrido: 'Híbrido',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vacantes</h1>
          <p className="text-gray-500 mt-1">{office.nombre}</p>
        </div>
        <Link
          href="/director/vacantes/new"
          className="flex items-center gap-2 bg-black text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva vacante
        </Link>
      </div>

      {!vacantes || vacantes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 mb-4">No has creado vacantes aún.</p>
          <Link
            href="/director/vacantes/new"
            className="text-sm text-black font-medium hover:underline"
          >
            Crear primera vacante
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {vacantes.map((vacante) => (
            <div
              key={vacante.id}
              className="border border-gray-100 rounded-2xl p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${
                        vacante.publicada
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {vacante.publicada ? 'Publicada' : 'Borrador'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {vacante.num_lugares} {vacante.num_lugares === 1 ? 'lugar' : 'lugares'}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      {MODALIDAD_LABELS[vacante.modalidad]}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      {vacante.duracion_semanas} {vacante.duracion_semanas === 1 ? 'semana' : 'semanas'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(vacante.roles_buscados || []).slice(0, 4).map((rol: string) => (
                      <span
                        key={rol}
                        className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
                      >
                        {rol}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/director/vacantes/${vacante.id}`}
                    className="text-sm border border-gray-200 rounded-xl px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Editar
                  </Link>
                  {vacante.publicada && !vacante.contrato_contenido && (
                    <Link
                      href={`/director/vacantes/${vacante.id}/contrato`}
                      className="text-sm bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-900 transition-colors"
                    >
                      Redactar contrato
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
