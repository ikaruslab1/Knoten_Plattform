import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function FreelancerPostulacionesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: postulaciones } = await supabase
    .from('postulaciones')
    .select(`
      id,
      estado,
      created_at,
      vacantes (
        id,
        roles_buscados,
        modalidad,
        nivel_requerido,
        offices (
          nombre,
          logo_url
        )
      )
    `)
    .eq('freelancer_id', user.id)
    .order('created_at', { ascending: false })

  const ESTADO_STYLES: Record<string, { label: string; className: string }> = {
    pendiente: { label: 'Pendiente', className: 'bg-yellow-50 text-yellow-700' },
    aceptado: { label: 'Aceptado', className: 'bg-green-50 text-green-700' },
    rechazado: { label: 'Rechazado', className: 'bg-red-50 text-red-700' },
  }

  const MODALIDAD_LABELS: Record<string, string> = {
    en_linea: 'En línea',
    presencial: 'Presencial',
    hibrido: 'Híbrido',
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mis postulaciones</h1>
        <p className="text-gray-500 mt-1">Historial de tus solicitudes a vacantes.</p>
      </div>

      {!postulaciones || postulaciones.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 mb-4">Aún no te has postulado a ninguna vacante.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {postulaciones.map((p) => {
            const vacante = Array.isArray(p.vacantes) ? p.vacantes[0] : p.vacantes
            const office = vacante
              ? Array.isArray((vacante as any).offices)
                ? (vacante as any).offices[0]
                : (vacante as any).offices
              : null
            const estado = ESTADO_STYLES[p.estado] || ESTADO_STYLES.pendiente

            return (
              <div
                key={p.id}
                className="border border-gray-100 rounded-2xl p-5 flex items-start gap-4"
              >
                {/* Office logo */}
                {office?.logo_url ? (
                  <img
                    src={office.logo_url}
                    alt={office.nombre}
                    className="w-10 h-10 object-contain shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">
                    {office?.nombre?.[0] || '?'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-gray-900">{office?.nombre || 'Oficina'}</p>
                    <span
                      className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${estado.className}`}
                    >
                      {estado.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                    {((vacante as any)?.roles_buscados || []).slice(0, 2).join(', ')}
                    {(vacante as any)?.modalidad && (
                      <span>{MODALIDAD_LABELS[(vacante as any).modalidad]}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
