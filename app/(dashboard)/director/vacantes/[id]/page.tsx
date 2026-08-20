import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VacanteForm } from '@/components/director/VacanteForm'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function VacanteDetailPage({ params }: Props) {
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
    .select('*')
    .eq('id', id)
    .eq('office_id', office.id)
    .single()

  if (!vacante) redirect('/director/vacantes')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/director/vacantes"
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Vacantes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Editar vacante</h1>
        </div>
        {vacante.publicada && (
          <Link
            href={`/director/vacantes/${id}/contrato`}
            className="text-sm bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-900 transition-colors"
          >
            {vacante.contrato_contenido ? 'Ver contrato' : 'Redactar contrato'}
          </Link>
        )}
      </div>

      <VacanteForm
        officeId={office.id}
        vacanteId={id}
        initialData={{
          numLugares: vacante.num_lugares,
          rolesBuscados: vacante.roles_buscados || [],
          nivelRequerido: vacante.nivel_requerido || '',
          habilidades: vacante.habilidades || [],
          responsabilidades: vacante.responsabilidades || '',
          modalidad: vacante.modalidad,
          horasSemanales: vacante.horas_semanales,
          duracionSemanas: vacante.duracion_semanas,
          solicitarPortafolio: vacante.solicitar_portafolio,
          solicitarExtracto: vacante.solicitar_extracto,
          confirmarCalendario: vacante.confirmar_calendario,
          preguntasReclutamiento: vacante.preguntas_reclutamiento || [],
        }}
      />
    </div>
  )
}
