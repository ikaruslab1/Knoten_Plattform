import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContratoEditor } from '@/components/director/ContratoEditor'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default async function OfficeContratoPage() {
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

  if (!office) redirect('/director/profile/edit')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, apellido_paterno, apellido_materno')
    .eq('id', user.id)
    .single()

  const directorFullName = [
    profile?.nombre,
    profile?.apellido_paterno,
    profile?.apellido_materno,
  ]
    .filter(Boolean)
    .join(' ') || 'Director de la Oficina'

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/director/profile"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a mi oficina
        </Link>
        <div className="flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-gray-900" />
          <h1 className="text-2xl font-bold text-gray-900">
            Contrato marco de la oficina
          </h1>
        </div>
        <p className="text-gray-500 mt-1 text-sm">
          Este contrato único será firmado por todos los freelancers que sean aceptados en cualquier vacante de <strong className="text-gray-800">{office.nombre}</strong>.
        </p>
      </div>

      <ContratoEditor
        officeId={office.id}
        officeName={office.nombre}
        logoUrl={office.logo_url}
        officeSpecialty={office.especialidad}
        directorName={directorFullName}
        initialContent={office.contrato_contenido || ''}
      />
    </div>
  )
}
