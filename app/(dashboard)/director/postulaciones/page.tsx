import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostulacionesDirector } from '@/components/postulaciones/PostulacionesDirector'

export default async function DirectorPostulacionesPage() {
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

  if (!office) redirect('/director/profile')

  // Get all postulaciones for vacantes in this office
  const { data: postulaciones } = await supabase
    .from('postulaciones')
    .select(`
      id,
      estado,
      portafolio_url,
      extracto_experiencia,
      calendario,
      respuestas_preguntas,
      created_at,
      freelancer_id,
      vacante_id,
      freelancer_profiles!freelancer_id (
        id,
        enlace_portafolio,
        nivel_experiencia,
        especialidades,
        publicado,
        profiles!id (
          nombre,
          apellido_paterno,
          apellido_materno,
          correo_personal
        )
      ),
      vacantes!vacante_id (
        id,
        roles_buscados,
        nivel_requerido,
        modalidad
      )
    `)
    .in(
      'vacante_id',
      // Subquery equivalent: get vacante IDs from this office
      (
        await supabase
          .from('vacantes')
          .select('id')
          .eq('office_id', office.id)
      ).data?.map((v) => v.id) || []
    )
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Postulaciones recibidas</h1>
        <p className="text-gray-500 mt-1">{office.nombre}</p>
      </div>

      <PostulacionesDirector
        postulaciones={(postulaciones || []) as any}
        directorId={user.id}
      />
    </div>
  )
}
