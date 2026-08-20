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
    .select('*')
    .eq('director_id', user.id)
    .maybeSingle()

  if (!office) redirect('/director/profile')

  const { data: existingVacantes } = await supabase
    .from('vacantes')
    .select('*')
    .eq('office_id', office.id)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nueva vacante</h1>
        <p className="text-gray-500 mt-1">{office.nombre}</p>
      </div>
      <VacanteForm
        officeId={office.id}
        officeSpecialty={office.especialidad}
        officeEquipos={office.equipos || {}}
        existingVacantes={existingVacantes || []}
        hasOfficeContract={Boolean(office.contrato_contenido && office.contrato_contenido.trim().length > 0)}
      />
    </div>
  )
}

