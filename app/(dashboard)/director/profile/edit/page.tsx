import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OfficeForm } from '@/components/director/OfficeForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export interface TeamMember {
  id: string
  nombreCompleto: string
  correoInstitucional: string
  telefono: string
}

export interface TeamDetail {
  vacantesCreadas: number
  aceptados: number
  miembros: TeamMember[]
}

export default async function EditDirectorProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: office } = await supabase
    .from('offices')
    .select('*')
    .eq('director_id', user.id)
    .maybeSingle()

  let teamStats: Record<string, TeamDetail> = {}

  if (office) {
    const { data: vacantes } = await supabase
      .from('vacantes')
      .select('*')
      .eq('office_id', office.id)

    const vacanteIds = vacantes?.map((v) => v.id) || []

    let acceptedPostulaciones: any[] = []
    if (vacanteIds.length > 0) {
      const { data: postulaciones } = await supabase
        .from('postulaciones')
        .select(`
          id,
          vacante_id,
          freelancer_id,
          freelancer_profiles!freelancer_id (
            id,
            profiles!id (
              nombre,
              apellido_paterno,
              apellido_materno,
              correo_institucional,
              correo_personal,
              telefono
            )
          )
        `)
        .eq('estado', 'aceptado')
        .in('vacante_id', vacanteIds)

      acceptedPostulaciones = postulaciones || []
    }

    const vacanteToTeamMap = new Map(vacantes?.map((v) => [v.id, v.equipo]))

    vacantes?.forEach((v) => {
      if (!v.equipo) return
      if (!teamStats[v.equipo]) {
        teamStats[v.equipo] = { vacantesCreadas: 0, aceptados: 0, miembros: [] }
      }
      teamStats[v.equipo].vacantesCreadas += 1
    })

    acceptedPostulaciones.forEach((p) => {
      const team = vacanteToTeamMap.get(p.vacante_id)
      if (team) {
        if (!teamStats[team]) {
          teamStats[team] = { vacantesCreadas: 0, aceptados: 0, miembros: [] }
        }
        teamStats[team].aceptados += 1

        const fp = p.freelancer_profiles
        const prof = Array.isArray(fp?.profiles) ? fp.profiles[0] : fp?.profiles
        if (prof) {
          const fullName = `${prof.nombre || ''} ${prof.apellido_paterno || ''} ${prof.apellido_materno || ''}`.trim()
          teamStats[team].miembros.push({
            id: p.freelancer_id,
            nombreCompleto: fullName || 'Freelancer',
            correoInstitucional: prof.correo_institucional || prof.correo_personal || 'No registrado',
            telefono: prof.telefono || 'No registrado',
          })
        }
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        {office && (
          <Link
            href="/director/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a la vista de oficina
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {office ? 'Editar mi oficina' : 'Configura tu oficina'}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {office
            ? 'Modifica los datos generales y la capacidad de integrantes de tus equipos.'
            : 'Completa la configuración inicial de tu oficina para poder publicar vacantes.'}
        </p>
      </div>

      <OfficeForm
        directorId={user.id}
        initialData={
          office
            ? {
                nombre: office.nombre,
                manifiesto: office.manifiesto || '',
                especialidad: office.especialidad,
                equipos: office.equipos || {},
              }
            : undefined
        }
        officeId={office?.id}
        currentLogoUrl={office?.logo_url}
        teamStats={teamStats}
      />
    </div>
  )
}
