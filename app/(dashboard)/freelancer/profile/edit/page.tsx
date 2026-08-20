import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/freelancer/ProfileForm'
import { parseEstudios } from '@/lib/validations/freelancer'

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
        habilidadesComplementarias: profile.habilidades_complementarias
          ? (profile.habilidades_complementarias.startsWith('[')
              ? (() => { try { return JSON.parse(profile.habilidades_complementarias) } catch { return profile.habilidades_complementarias.split(',').map((s: string) => s.trim()).filter(Boolean) } })()
              : profile.habilidades_complementarias.split(',').map((s: string) => s.trim()).filter(Boolean))
          : [],
        historialLaboral: (workHistory || []).map((w: any) => ({
          id: w.id,
          rol: w.rol,
          empresa: w.empresa,
          periodo: w.periodo,
          modalidad: w.modalidad,
          responsabilidades: w.responsabilidades || '',
        })),
        enlacePortafolio: profile.enlace_portafolio || '',
        ultimoGradoEstudios: parseEstudios(profile.ultimo_grado_estudios),
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
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4">
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          <span>Freelancer</span>
          <span>•</span>
          <span className="text-gray-600">Perfil Profesional</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          {profile?.publicado ? 'Editar perfil' : 'Completa tu perfil'}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
          {profile?.publicado
            ? 'Los cambios se publicarán inmediatamente en el directorio de talento.'
            : 'Completa cada sección para desbloquear la postulación a vacantes y proyectos.'}
        </p>
      </div>
      <ProfileForm userId={user.id} initialData={initialData} />
    </div>
  )
}
