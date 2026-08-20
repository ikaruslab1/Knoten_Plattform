import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OfficeView } from '@/components/director/OfficeView'
import Link from 'next/link'
import { Building2, Plus } from 'lucide-react'

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

export default async function DirectorProfilePage() {
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

  // If no office has been created yet, show prompt to set up office
  if (!office) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-400">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Aún no has configurado tu oficina</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Define el tipo de oficina, logotipo, manifiesto y capacidad de tus equipos para comenzar a publicar vacantes.
        </p>
        <Link
          href="/director/profile/edit"
          className="inline-flex items-center gap-2 bg-black text-white rounded-2xl px-6 py-3.5 text-sm font-semibold hover:bg-neutral-800 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Configurar mi oficina
        </Link>
      </div>
    )
  }

  let teamStats: Record<string, TeamDetail> = {}

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

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <OfficeView
        office={office}
        teamStats={teamStats}
      />
    </div>
  )
}


