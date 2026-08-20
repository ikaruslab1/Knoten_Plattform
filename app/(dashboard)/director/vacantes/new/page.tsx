import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VacanteForm } from '@/components/director/VacanteForm'

export default async function NewVacantePage() {
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nueva vacante</h1>
        <p className="text-gray-500 mt-1">{office.nombre}</p>
      </div>
      <VacanteForm officeId={office.id} />
    </div>
  )
}
