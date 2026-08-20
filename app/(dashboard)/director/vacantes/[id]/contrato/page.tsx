import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContratoEditor } from '@/components/director/ContratoEditor'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContratoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: office } = await supabase
    .from('offices')
    .select('id')
    .eq('director_id', user.id)
    .single()

  if (!office) redirect('/director/profile')

  const { data: vacante } = await supabase
    .from('vacantes')
    .select('id, publicada, contrato_contenido, roles_buscados')
    .eq('id', id)
    .eq('office_id', office.id)
    .single()

  if (!vacante || !vacante.publicada) redirect('/director/vacantes')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/director/vacantes/${id}`}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← Vacante
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Contrato</h1>
        <p className="text-gray-500 mt-1">
          Redacta el contrato que firmarán los candidatos aceptados. Máximo 3,000 caracteres.
        </p>
      </div>

      <ContratoEditor
        vacanteId={id}
        initialContent={vacante.contrato_contenido || ''}
      />
    </div>
  )
}
