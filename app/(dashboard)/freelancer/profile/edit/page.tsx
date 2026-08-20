import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/freelancer/ProfileForm'

export default async function FreelancerProfileEditPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Load existing profile data
  const { data: profile } = await supabase
    .from('freelancer_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: workHistory } = await supabase
    .from('work_history')
    .select('*')
    .eq('freelancer_id', user.id)
    .order('orden')

  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('freelancer_id', user.id)
    .order('orden')

  const initialData = profile
    ? {
        resumenProfesional: profile.resumen_profesional || '',
        especialidades: profile.especialidades || [],
        nivelExperiencia: profile.nivel_experiencia || '',
        software: profile.software || [],
        habilidadesComplementarias: profile.habilidades_complementarias || '',
        historialLaboral: (workHistory || []).map((w: any) => ({
          id: w.id,
          rol: w.rol,
          empresa: w.empresa,
          periodo: w.periodo,
          modalidad: w.modalidad,
          responsabilidades: w.responsabilidades || '',
        })),
        enlacePortafolio: profile.enlace_portafolio || '',
        ultimoGradoEstudios: profile.ultimo_grado_estudios || '',
        certificaciones: (certifications || []).map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          entidad: c.entidad,
          anio: c.anio,
          enlace: c.enlace || '',
        })),
        idiomas: profile.idiomas || [],
        disponibilidad: profile.disponibilidad || {},
      }
    : undefined

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {profile?.publicado ? 'Editar perfil' : 'Completa tu perfil'}
        </h1>
        <p className="text-gray-500 mt-1">
          {profile?.publicado
            ? 'Los cambios se publicarán inmediatamente.'
            : 'Completa tu perfil para comenzar a postularte a vacantes.'}
        </p>
      </div>
      <ProfileForm userId={user.id} initialData={initialData} />
    </div>
  )
}
