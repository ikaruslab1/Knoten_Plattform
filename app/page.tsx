import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!profile?.rol) {
    redirect('/select-role')
  }

  if (profile.rol === 'freelancer') {
    redirect('/freelancer/profile')
  } else {
    redirect('/director/profile')
  }
}
