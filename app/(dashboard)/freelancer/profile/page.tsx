import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StyledProfileView } from '@/components/freelancer/StyledProfileView'
import Link from 'next/link'
import { Palette } from 'lucide-react'

export default async function FreelancerProfilePage() {
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

  // If no profile or not published yet, redirect to edit
  if (!profile || !profile.publicado) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Tu perfil aún no está publicado</h1>
        <p className="text-gray-500 mb-6">
          Completa tu perfil para que los directores de área puedan encontrarte.
        </p>
        <Link
          href="/freelancer/profile/edit"
          className="inline-flex items-center bg-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          Completar perfil
        </Link>
      </div>
    )
  }

  // Get office info if accepted
  let officeInfo = null
  if (profile.estado === 'aceptado' && profile.oficina_id) {
    const { data: office } = await supabase
      .from('offices')
      .select('nombre, logo_url, especialidad')
      .eq('id', profile.oficina_id)
      .single()
    officeInfo = office
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Action buttons */}
      {profile.estado === 'disponible' && (
        <div className="flex justify-end gap-2 mb-6">
          <Link
            href="/freelancer/profile/edit"
            className="border border-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            Editar perfil
          </Link>
          <Link
            href="/freelancer/profile/theme"
            className="flex items-center gap-1.5 border border-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            <Palette className="w-3.5 h-3.5" />
            Aspecto visual
          </Link>
        </div>
      )}

      {/* Accepted banner */}
      {profile.estado === 'aceptado' && officeInfo && (
        <div className="bg-gray-900 text-white rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Actualmente trabajas en</p>
            <p className="font-semibold">{officeInfo.nombre}</p>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full" />
        </div>
      )}

      <StyledProfileView
        theme={profile.profile_theme ?? null}
        userProfile={userProfile!}
        profile={profile}
        workHistory={workHistory || []}
        certifications={certifications || []}
      />
    </div>
  )
}
