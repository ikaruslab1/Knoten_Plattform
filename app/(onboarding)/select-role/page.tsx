import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SelectRoleClient } from '@/components/onboarding/SelectRoleClient'

export default async function SelectRolePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

  // If already has role, redirect
  if (profile?.rol) {
    redirect(profile.rol === 'freelancer' ? '/freelancer/profile' : '/director/profile')
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">¿Cómo te incorporas?</h1>
          <p className="text-gray-500 mt-2">
            Hola, <span className="font-medium text-gray-900">{profile?.nombre}</span>. Selecciona tu rol.
            Esta elección es permanente.
          </p>
        </div>
        <SelectRoleClient userId={user.id} />
      </div>
    </div>
  )
}
