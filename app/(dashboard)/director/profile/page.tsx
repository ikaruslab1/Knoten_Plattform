import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OfficeForm } from '@/components/director/OfficeForm'

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
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {office ? 'Mi oficina' : 'Configura tu oficina'}
        </h1>
        <p className="text-gray-500 mt-1">
          {office
            ? 'Información de tu oficina de diseño.'
            : 'Configura el perfil de tu oficina para comenzar a publicar vacantes.'}
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
                linksPortafolios: office.links_portafolios || [],
              }
            : undefined
        }
        officeId={office?.id}
        currentLogoUrl={office?.logo_url}
      />
    </div>
  )
}
