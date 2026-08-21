'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vacanteSchema, type VacanteInput } from '@/lib/validations/director'
import { EXPERIENCE_LEVELS, MODALITIES, DESIGN_ROLES, OFFICE_TEAMS, type OfficeSpecialty } from '@/lib/constants/roles'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Trash2, AlertCircle, Users } from 'lucide-react'

import Link from 'next/link'

interface Props {
  officeId: string
  officeSpecialty?: OfficeSpecialty
  officeEquipos?: Record<string, number>
  existingVacantes?: Array<{ id: string; equipo: string | null }>
  hasOfficeContract?: boolean
  initialData?: Partial<VacanteInput>
  vacanteId?: string
}

export function VacanteForm({
  officeId,
  officeSpecialty = 'editorial',
  officeEquipos = {},
  existingVacantes = [],
  hasOfficeContract = false,
  initialData,
  vacanteId,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPregunta, setNewPregunta] = useState('')
  const [newHabilidad, setNewHabilidad] = useState('')
  const [shouldPublish, setShouldPublish] = useState(false)

  const availableTeams = OFFICE_TEAMS[officeSpecialty] || OFFICE_TEAMS.editorial

  // Calculate created count per team excluding current vacancy being edited
  const teamCreatedCounts: Record<string, number> = {}
  existingVacantes.forEach((v) => {
    if (v.equipo && v.id !== vacanteId) {
      teamCreatedCounts[v.equipo] = (teamCreatedCounts[v.equipo] || 0) + 1
    }
  })

  // Determine initial selected team
  let defaultTeam = initialData?.equipo || ''
  if (!defaultTeam) {
    const firstAvailable = availableTeams.find((t) => {
      const cap = officeEquipos[t] || 1
      const count = teamCreatedCounts[t] || 0
      return count < cap
    })
    defaultTeam = firstAvailable || availableTeams[0]
  }

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VacanteInput>({
    resolver: zodResolver(vacanteSchema) as any,
    defaultValues: {
      equipo: defaultTeam,
      numLugares: 1,
      rolesBuscados: initialData?.rolesBuscados || [],
      nivelRequerido: initialData?.nivelRequerido || '',
      habilidades: initialData?.habilidades || [],
      responsabilidades: initialData?.responsabilidades || '',
      modalidad: initialData?.modalidad || 'en_linea',
      horasSemanales: initialData?.horasSemanales || 10,
      duracionSemanas: initialData?.duracionSemanas || 4,
      solicitarPortafolio: initialData?.solicitarPortafolio || false,
      solicitarExtracto: initialData?.solicitarExtracto || false,
      confirmarCalendario: initialData?.confirmarCalendario || false,
      preguntasReclutamiento: initialData?.preguntasReclutamiento || [],
    },
  })

  const selectedEquipo = watch('equipo')
  const preguntasReclutamiento = watch('preguntasReclutamiento')
  const habilidades = watch('habilidades')

  const addPregunta = () => {
    if (!newPregunta.trim()) return
    setValue('preguntasReclutamiento', [...preguntasReclutamiento, newPregunta.trim()])
    setNewPregunta('')
  }

  const removePregunta = (idx: number) => {
    setValue('preguntasReclutamiento', preguntasReclutamiento.filter((_, i) => i !== idx))
  }

  const addHabilidad = () => {
    if (!newHabilidad.trim()) return
    setValue('habilidades', [...habilidades, newHabilidad.trim()])
    setNewHabilidad('')
  }

  const removeHabilidad = (idx: number) => {
    setValue('habilidades', habilidades.filter((_, i) => i !== idx))
  }

  const onSubmit = async (data: VacanteInput) => {
    const publish = shouldPublish
    setLoading(true)
    setError(null)

    // Contract validation: office contract must exist to publish
    if (publish && !hasOfficeContract) {
      setError(
        'No puedes publicar esta vacante porque tu oficina aún no tiene un contrato redactado. Redacta el contrato en "Mi oficina" antes de publicar vacantes, o guárdala como borrador.'
      )
      setLoading(false)
      return
    }

    // Reactive validation: check capacity
    const capacity = officeEquipos[data.equipo] || 1
    const currentCount = teamCreatedCounts[data.equipo] || 0
    if (currentCount >= capacity) {
      setError(`Has alcanzado la capacidad máxima de vacantes creadas para el ${data.equipo} (${currentCount}/${capacity}).`)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const payload = {
      office_id: officeId,
      equipo: data.equipo,
      num_lugares: 1, // 1 vacante = 1 lugar
      roles_buscados: data.rolesBuscados,
      nivel_requerido: data.nivelRequerido,
      habilidades: data.habilidades,
      responsabilidades: data.responsabilidades,
      modalidad: data.modalidad,
      horas_semanales: data.horasSemanales,
      duracion_semanas: data.duracionSemanas,
      solicitar_portafolio: data.solicitarPortafolio,
      solicitar_extracto: data.solicitarExtracto,
      confirmar_calendario: data.confirmarCalendario,
      preguntas_reclutamiento: data.preguntasReclutamiento,
      publicada: publish,
    }

    if (vacanteId) {
      let { error: updateError } = await supabase
        .from('vacantes')
        .update(payload)
        .eq('id', vacanteId)

      if (updateError && (updateError.message?.toLowerCase().includes('equipo') || updateError.message?.toLowerCase().includes('schema cache'))) {
        const { equipo, ...fallbackPayload } = payload
        const retry = await supabase
          .from('vacantes')
          .update(fallbackPayload)
          .eq('id', vacanteId)
        updateError = retry.error
      }

      if (updateError) {
        console.error('Error al actualizar vacante:', updateError)
        setError(`Error al actualizar la vacante: ${updateError.message}`)
        setLoading(false)
        return
      }
    } else {
      let { data: inserted, error: insertError } = await supabase
        .from('vacantes')
        .insert(payload)
        .select('id')
        .single()

      if (insertError && (insertError.message?.toLowerCase().includes('equipo') || insertError.message?.toLowerCase().includes('schema cache'))) {
        const { equipo, ...fallbackPayload } = payload
        const retry = await supabase
          .from('vacantes')
          .insert(fallbackPayload)
          .select('id')
          .single()
        inserted = retry.data
        insertError = retry.error
      }

      if (insertError) {
        console.error('Error al crear vacante:', insertError)
        setError(`Error al crear la vacante: ${insertError.message}. Recuerda ejecutar el archivo 'supabase/migrations/006_office_teams_and_vacante_equipo.sql' en el Editor SQL de Supabase.`)
        setLoading(false)
        return
      }
    }

    router.push('/director/vacantes')
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'
  const sectionClass = 'space-y-5 pb-8 border-b border-gray-100'

  return (
    <form onSubmit={(handleSubmit as any)(onSubmit)} className="space-y-10">
      {/* Equipo de la Oficina (Reemplaza número de lugares) */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-700" />
            Puesto y equipo de la oficina
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Selecciona el equipo al que pertenecerá esta vacante (1 vacante = 1 lugar en el equipo).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {availableTeams.map((teamName) => {
            const cap = officeEquipos[teamName] || 1
            const count = teamCreatedCounts[teamName] || 0
            const isFull = count >= cap
            const isSelected = selectedEquipo === teamName

            return (
              <label
                key={teamName}
                className={`flex flex-col justify-between border-2 rounded-2xl p-4 transition-all ${
                  isFull
                    ? 'border-gray-200 bg-gray-100/70 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'border-black bg-gray-50 cursor-pointer shadow-2xs'
                    : 'border-gray-200 hover:border-gray-400 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="radio"
                      value={teamName}
                      disabled={isFull}
                      {...register('equipo')}
                      className="sr-only"
                    />
                    <span className="text-sm font-bold text-gray-900">{teamName}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isFull
                      ? `Capacidad máxima alcanzada (${count}/${cap})`
                      : `Vacantes publicadas: ${count}/${cap}`}
                  </p>
                </div>
                {isFull && (
                  <span className="text-[10px] font-semibold text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Sin cupo
                  </span>
                )}
              </label>
            )
          })}
        </div>
        {errors.equipo && (
          <p className="text-red-500 text-xs mt-1">{errors.equipo.message}</p>
        )}
      </div>

      {/* Roles buscados y nivel */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Roles y nivel</h2>
        <div>
          <label className={labelClass}>Roles buscados</label>
          <Controller
            name="rolesBuscados"
            control={control}
            render={({ field }) => (
              <MultiSelect
                options={[...DESIGN_ROLES]}
                value={field.value}
                onChange={field.onChange}
                placeholder="Buscar roles..."
                error={errors.rolesBuscados?.message}
              />
            )}
          />
        </div>

        <div>
          <label className={labelClass}>Nivel requerido</label>
          <select {...register('nivelRequerido')} className={inputClass}>
            <option value="">Selecciona un nivel</option>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {errors.nivelRequerido && (
            <p className="text-red-500 text-xs mt-1">{errors.nivelRequerido.message}</p>
          )}
        </div>
      </div>

      {/* Habilidades y responsabilidades */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Descripción del puesto</h2>

        <div>
          <label className={labelClass}>Habilidades requeridas</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {habilidades.map((h, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                {h}
                <button type="button" onClick={() => removeHabilidad(idx)} className="text-gray-400 hover:text-gray-900">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newHabilidad}
              onChange={(e) => setNewHabilidad(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHabilidad() }}}
              placeholder="Ej: Tipografía, manejo de color..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <button
              type="button"
              onClick={addHabilidad}
              className="border border-gray-200 rounded-xl px-4 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Responsabilidades</label>
          <Controller
            name="responsabilidades"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                content={field.value}
                onChange={field.onChange}
                maxChars={2000}
                placeholder="Describe las responsabilidades del puesto..."
                enableTables={false}
              />
            )}
          />
          {errors.responsabilidades && (
            <p className="text-red-500 text-xs mt-1">{errors.responsabilidades.message}</p>
          )}
        </div>
      </div>

      {/* Condiciones */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Condiciones del proyecto</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Horas semanales</label>
            <input
              type="number"
              min={1}
              max={60}
              {...register('horasSemanales', { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Duración (semanas)</label>
            <input
              type="number"
              min={1}
              max={7}
              {...register('duracionSemanas', { valueAsNumber: true })}
              className={inputClass}
            />
            {errors.duracionSemanas && (
              <p className="text-red-500 text-xs mt-1">{errors.duracionSemanas.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Modalidad</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODALITIES.map((m) => {
              const currentVal = watch('modalidad')
              return (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    currentVal === m.value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    value={m.value}
                    {...register('modalidad')}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ajustes de reclutamiento */}
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Ajustes de reclutamiento</h2>

        <div className="space-y-3">
          {[
            { name: 'solicitarPortafolio', label: 'Solicitar portafolio' },
            { name: 'solicitarExtracto', label: 'Solicitar extracto de experiencia' },
            { name: 'confirmarCalendario', label: 'Confirmar calendario de disponibilidad' },
          ].map(({ name, label }) => (
            <label
              key={name}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                {...register(name as keyof VacanteInput)}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
            </label>
          ))}
        </div>

        {/* Preguntas de reclutamiento */}
        <div>
          <label className={labelClass}>Preguntas de reclutamiento</label>
          <div className="space-y-2 mb-3">
            {preguntasReclutamiento.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="flex-1 text-sm text-gray-700">{p}</span>
                <button
                  type="button"
                  onClick={() => removePregunta(idx)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPregunta}
              onChange={(e) => setNewPregunta(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPregunta() }}}
              placeholder="¿Cuál es tu proceso de diseño?"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <button
              type="button"
              onClick={addPregunta}
              className="border border-gray-200 rounded-xl px-4 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {!hasOfficeContract && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4.5 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">
              Contrato de oficina pendiente de redacción
            </p>
            <p className="leading-relaxed text-amber-900">
              Para poder <strong>publicar vacantes</strong>, primero debes redactar el contrato único de tu oficina.{' '}
              <Link
                href="/director/profile/contrato"
                className="font-bold underline text-amber-950 hover:text-black"
              >
                Redactar contrato de la oficina aquí →
              </Link>
            </p>
            <p className="text-[11px] text-amber-700">
              Puedes guardar esta vacante como <strong>Borrador</strong> mientras tanto.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          onClick={() => setShouldPublish(false)}
          className="flex-1 border border-gray-200 text-gray-700 rounded-xl px-6 py-3.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Guardando...' : 'Guardar borrador'}
        </button>
        <button
          type="submit"
          disabled={loading}
          onClick={() => setShouldPublish(true)}
          className={`flex-1 rounded-xl px-6 py-3.5 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer ${
            hasOfficeContract
              ? 'bg-black text-white hover:bg-neutral-900 shadow-sm'
              : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
          }`}
          title={!hasOfficeContract ? 'Redacta el contrato de tu oficina para poder publicar' : undefined}
        >
          Publicar vacante →
        </button>
      </div>
    </form>
  )
}
