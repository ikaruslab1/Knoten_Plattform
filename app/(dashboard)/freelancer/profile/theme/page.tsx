import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileThemeEditor } from '@/components/freelancer/ProfileThemeEditor'
import { parseEstudios } from '@/lib/validations/freelancer'
import type { ProfileTheme } from '@/lib/types/profile-theme'

export default async function FreelancerProfileThemePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('nombre, apellido_paterno, apellido_materno')
    .eq('id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('freelancer_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Must have a published profile to customize the theme
  if (!profile || !profile.publicado) {
    redirect('/freelancer/profile/edit')
  }

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

  // Build profile data for the preview (same shape as ProfileView expects)
  const habilidadesComplementarias = profile.habilidades_complementarias
    ? typeof profile.habilidades_complementarias === 'string' &&
      profile.habilidades_complementarias.startsWith('[')
      ? (() => {
          try {
            return JSON.parse(profile.habilidades_complementarias)
          } catch {
            return profile.habilidades_complementarias
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          }
        })()
      : typeof profile.habilidades_complementarias === 'string'
      ? profile.habilidades_complementarias
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : profile.habilidades_complementarias
    : []

  const profileData = {
    resumen_profesional: profile.resumen_profesional,
    especialidades: profile.especialidades,
    nivel_experiencia: profile.nivel_experiencia,
    software: profile.software,
    habilidades_complementarias: habilidadesComplementarias,
    enlace_portafolio: profile.enlace_portafolio,
    ultimo_grado_estudios: profile.ultimo_grado_estudios,
    idiomas: profile.idiomas,
    disponibilidad: profile.disponibilidad,
    estado: profile.estado,
  }

  return (
    // Full-screen layout — overrides the dashboard's max-w container
    <div className="fixed inset-0 z-40 bg-gray-50">
      <ProfileThemeEditor
        initialTheme={(profile.profile_theme as Partial<ProfileTheme>) ?? null}
        userProfile={userProfile!}
        profile={profileData}
        workHistory={(workHistory || []).map((w: any) => ({
          rol: w.rol,
          empresa: w.empresa,
          periodo: w.periodo,
          modalidad: w.modalidad,
          responsabilidades: w.responsabilidades,
        }))}
        certifications={(certifications || []).map((c: any) => ({
          nombre: c.nombre,
          entidad: c.entidad,
          anio: c.anio,
          enlace: c.enlace,
        }))}
      />
    </div>
  )
}
