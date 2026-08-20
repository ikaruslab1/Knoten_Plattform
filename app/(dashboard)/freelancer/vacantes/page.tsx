import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ApplicationForm } from '@/components/postulaciones/ApplicationForm'

export default async function FreelancerVacantesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if freelancer is already accepted and get profile data for auto-fill
  const { data: myProfile } = await supabase
    .from('freelancer_profiles')
    .select('estado, oficina_id, enlace_portafolio, disponibilidad')
    .eq('id', user.id)
    .single()

  const isAccepted = myProfile?.estado === 'aceptado'

  // Get my existing applications
  const { data: myPostulaciones } = await supabase
    .from('postulaciones')
    .select('vacante_id, estado')
    .eq('freelancer_id', user.id)

  const appliedVacanteIds = new Set(myPostulaciones?.map((p) => p.vacante_id) || [])

  // Get all published vacantes with full office info
  const { data: vacantes } = await supabase
    .from('vacantes')
    .select(`
      id,
      equipo,
      num_lugares,
      roles_buscados,
      nivel_requerido,
      habilidades,
      responsabilidades,
      modalidad,
      horas_semanales,
      duracion_semanas,
      solicitar_portafolio,
      solicitar_extracto,
      confirmar_calendario,
      preguntas_reclutamiento,
      offices (
        id,
        nombre,
        logo_url,
        especialidad,
        manifiesto,
        links_portafolios
      )
    `)
    .eq('publicada', true)
    .order('created_at', { ascending: false })

  const MODALIDAD_LABELS: Record<string, string> = {
    en_linea: 'En línea',
    presencial: 'Presencial',
    hibrido: 'Híbrido',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Vacantes disponibles</h1>
        <p className="text-gray-500 mt-1">
          {isAccepted
            ? 'Actualmente formas parte de una oficina. No puedes postularte a nuevas vacantes.'
            : 'Encuentra proyectos que se alineen con tu perfil.'}
        </p>
      </div>

      {isAccepted && (
        <div className="bg-gray-900 text-white rounded-2xl p-5 mb-6">
          <p className="text-sm text-gray-400 mb-0.5">Estado</p>
          <p className="font-medium">Actualmente eres parte de una oficina de diseño.</p>
        </div>
      )}

      {!vacantes || vacantes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400">No hay vacantes publicadas en este momento.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {vacantes.map((vacante) => {
            const office = Array.isArray(vacante.offices)
              ? vacante.offices[0]
              : vacante.offices
            const alreadyApplied = appliedVacanteIds.has(vacante.id)

            return (
              <div
                key={vacante.id}
                className="border border-gray-100 rounded-2xl p-6 space-y-4 bg-white"
              >
                {/* Office info preview */}
                {office && (
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    {office.logo_url ? (
                      <img
                        src={office.logo_url}
                        alt={office.nombre}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs font-bold">
                        {office.nombre[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{office.nombre}</p>
                      {office.manifiesto && (
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {office.manifiesto.replace(/<[^>]*>/g, '')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Vacante details */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(vacante.roles_buscados || []).map((rol: string) => (
                      <span key={rol} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {rol}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    {vacante.equipo && (
                      <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                        Equipo: {vacante.equipo}
                      </span>
                    )}
                    {vacante.nivel_requerido && <span>Nivel: {vacante.nivel_requerido}</span>}
                    <span>{MODALIDAD_LABELS[vacante.modalidad] || vacante.modalidad}</span>
                    <span>{vacante.horas_semanales}h/semana</span>
                    <span>{vacante.duracion_semanas} {vacante.duracion_semanas === 1 ? 'semana' : 'semanas'}</span>
                  </div>
                </div>

                {/* Apply button & split-screen container */}
                {!isAccepted && (
                  alreadyApplied ? (
                    <div className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                      ✓ Ya te postulaste a esta vacante
                    </div>
                  ) : (
                    <ApplicationForm
                      vacanteId={vacante.id}
                      freelancerId={user.id}
                      initialPortafolioUrl={myProfile?.enlace_portafolio || ''}
                      initialDisponibilidad={myProfile?.disponibilidad || null}
                      office={{
                        id: office?.id || '',
                        nombre: office?.nombre || 'Oficina',
                        logo_url: office?.logo_url,
                        especialidad: office?.especialidad,
                        manifiesto: office?.manifiesto,
                        links_portafolios: office?.links_portafolios || [],
                      }}
                      vacante={{
                        id: vacante.id,
                        equipo: vacante.equipo,
                        roles_buscados: vacante.roles_buscados || [],
                        nivel_requerido: vacante.nivel_requerido,
                        modalidad: vacante.modalidad,
                        horas_semanales: vacante.horas_semanales,
                        duracion_semanas: vacante.duracion_semanas,
                        num_lugares: vacante.num_lugares,
                        habilidades: vacante.habilidades || [],
                        responsabilidades: vacante.responsabilidades || '',
                        solicitar_portafolio: vacante.solicitar_portafolio,
                        solicitar_extracto: vacante.solicitar_extracto,
                        confirmar_calendario: vacante.confirmar_calendario,
                        preguntas_reclutamiento: vacante.preguntas_reclutamiento || [],
                      }}
                    />
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
