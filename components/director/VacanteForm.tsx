'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vacanteSchema, type VacanteInput } from '@/lib/validations/director'
import { EXPERIENCE_LEVELS, MODALITIES, DESIGN_ROLES } from '@/lib/constants/roles'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface Props {
  officeId: string
  initialData?: Partial<VacanteInput>
  vacanteId?: string
}

export function VacanteForm({ officeId, initialData, vacanteId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPregunta, setNewPregunta] = useState('')
  const [newHabilidad, setNewHabilidad] = useState('')
  const [shouldPublish, setShouldPublish] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VacanteInput>({
    resolver: zodResolver(vacanteSchema) as any,
    defaultValues: initialData || {
      numLugares: 1,
      rolesBuscados: [],
      nivelRequerido: '',
      habilidades: [],
      responsabilidades: '',
      modalidad: 'en_linea',
      horasSemanales: 10,
      duracionSemanas: 4,
      solicitarPortafolio: false,
      solicitarExtracto: false,
      confirmarCalendario: false,
      preguntasReclutamiento: [],
    },
  })

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

    const supabase = createClient()
    const payload = {
      office_id: officeId,
      num_lugares: data.numLugares,
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
      const { error: updateError } = await supabase
        .from('vacantes')
        .update(payload)
        .eq('id', vacanteId)
      if (updateError) {
        setError('Error al actualizar la vacante.')
        setLoading(false)
        return
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('vacantes')
        .insert(payload)
        .select('id')
        .single()
      if (insertError) {
        setError('Error al crear la vacante.')
        setLoading(false)
        return
      }
      if (publish && inserted) {
        router.push(`/director/vacantes/${inserted.id}/contrato`)
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
      {/* Roles buscados */}
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
          <textarea
            {...register('responsabilidades')}
            rows={5}
            placeholder="Describe las responsabilidades del puesto..."
            className={inputClass}
          />
          {errors.responsabilidades && (
            <p className="text-red-500 text-xs mt-1">{errors.responsabilidades.message}</p>
          )}
        </div>
      </div>

      {/* Condiciones */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Condiciones del proyecto</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Número de lugares</label>
            <input
              type="number"
              min={1}
              max={7}
              {...register('numLugares', { valueAsNumber: true })}
              className={inputClass}
            />
            {errors.numLugares && (
              <p className="text-red-500 text-xs mt-1">{errors.numLugares.message}</p>
            )}
          </div>
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

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          onClick={() => setShouldPublish(false)}
          className="flex-1 border border-gray-200 text-gray-700 rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar borrador'}
        </button>
        <button
          type="submit"
          disabled={loading}
          onClick={() => setShouldPublish(true)}
          className="flex-1 bg-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          Publicar vacante →
        </button>
      </div>
    </form>
  )
}
