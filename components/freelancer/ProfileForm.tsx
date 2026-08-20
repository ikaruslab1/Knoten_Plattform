'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { freelancerProfileSchema, type FreelancerProfileInput } from '@/lib/validations/freelancer'
import { SPECIALTIES } from '@/lib/constants/specialties'
import { SOFTWARE_LIST } from '@/lib/constants/software'
import { EXPERIENCE_LEVELS, LANGUAGES, DAYS_OF_WEEK, TIME_BLOCKS, WORK_MODALITIES } from '@/lib/constants/roles'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { WorkHistory } from '@/components/freelancer/WorkHistory'
import { Certifications } from '@/components/freelancer/Certifications'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useFormPersist from 'react-hook-form-persist'

const STORAGE_KEY = 'knoten-freelancer-profile-draft'

interface Props {
  userId: string
  initialData?: Partial<FreelancerProfileInput>
}

export function ProfileForm({ userId, initialData }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const publishRef = useState(false)
  const [shouldPublish, setShouldPublish] = publishRef

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FreelancerProfileInput>({
    resolver: zodResolver(freelancerProfileSchema) as any,
    defaultValues: initialData || {
      resumenProfesional: '',
      especialidades: [],
      nivelExperiencia: '',
      software: [],
      habilidadesComplementarias: '',
      historialLaboral: [],
      enlacePortafolio: '',
      ultimoGradoEstudios: '',
      certificaciones: [],
      idiomas: [],
      disponibilidad: {},
    },
  })

  // Persist form state to localStorage
  useFormPersist(STORAGE_KEY, {
    watch,
    setValue,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  })

  const onSubmit = async (data: FreelancerProfileInput) => {
    const publish = shouldPublish
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Upsert freelancer profile
    const { error: profileError } = await supabase
      .from('freelancer_profiles')
      .upsert({
        id: userId,
        resumen_profesional: data.resumenProfesional,
        especialidades: data.especialidades,
        nivel_experiencia: data.nivelExperiencia,
        software: data.software,
        habilidades_complementarias: data.habilidadesComplementarias,
        enlace_portafolio: data.enlacePortafolio,
        ultimo_grado_estudios: data.ultimoGradoEstudios,
        idiomas: data.idiomas,
        disponibilidad: data.disponibilidad,
        publicado: publish,
      })

    if (profileError) {
      setError('Error al guardar el perfil. Intenta nuevamente.')
      setLoading(false)
      return
    }

    // Delete and re-insert work history
    await supabase.from('work_history').delete().eq('freelancer_id', userId)
    if (data.historialLaboral.length > 0) {
      await supabase.from('work_history').insert(
        data.historialLaboral.map((item, idx) => ({
          freelancer_id: userId,
          rol: item.rol,
          empresa: item.empresa,
          periodo: item.periodo,
          modalidad: item.modalidad,
          responsabilidades: item.responsabilidades,
          orden: idx,
        }))
      )
    }

    // Delete and re-insert certifications
    await supabase.from('certifications').delete().eq('freelancer_id', userId)
    if (data.certificaciones.length > 0) {
      await supabase.from('certifications').insert(
        data.certificaciones.map((cert, idx) => ({
          freelancer_id: userId,
          nombre: cert.nombre,
          entidad: cert.entidad,
          anio: cert.anio,
          enlace: cert.enlace,
          orden: idx,
        }))
      )
    }

    if (publish) {
      // Clear localStorage draft
      localStorage.removeItem(STORAGE_KEY)
      router.push('/freelancer/profile')
    } else {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'
  const sectionClass = 'space-y-5 pb-8 border-b border-gray-100'

  return (
    <form onSubmit={(handleSubmit as any)(onSubmit)} className="space-y-10">
      {/* Resumen profesional */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Resumen profesional</h2>
        <div>
          <label className={labelClass}>Cuéntanos sobre ti</label>
          <textarea
            {...register('resumenProfesional')}
            rows={4}
            placeholder="Describe tu trayectoria, enfoque y lo que te diferencia como diseñador..."
            className={inputClass}
          />
          {errors.resumenProfesional && (
            <p className="text-red-500 text-xs mt-1">{errors.resumenProfesional.message}</p>
          )}
        </div>
      </div>

      {/* Especialidades */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Especialidades</h2>
        <div>
          <label className={labelClass}>Áreas de especialidad</label>
          <Controller
            name="especialidades"
            control={control}
            render={({ field }) => (
              <MultiSelect
                options={[...SPECIALTIES]}
                value={field.value}
                onChange={field.onChange}
                placeholder="Buscar especialidades..."
                error={errors.especialidades?.message}
              />
            )}
          />
        </div>

        <div>
          <label className={labelClass}>Nivel de experiencia global</label>
          <select
            {...register('nivelExperiencia')}
            className={inputClass}
          >
            <option value="">Selecciona tu nivel</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {errors.nivelExperiencia && (
            <p className="text-red-500 text-xs mt-1">{errors.nivelExperiencia.message}</p>
          )}
        </div>
      </div>

      {/* Software */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Software y herramientas</h2>
        <Controller
          name="software"
          control={control}
          render={({ field }) => (
            <MultiSelect
              options={[...SOFTWARE_LIST]}
              value={field.value}
              onChange={field.onChange}
              placeholder="Buscar software..."
              error={errors.software?.message}
            />
          )}
        />

        <div>
          <label className={labelClass}>Habilidades complementarias</label>
          <input
            {...register('habilidadesComplementarias')}
            type="text"
            placeholder="Ej: Gestión de proyectos, redacción UX, prototipado rápido..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Historial laboral */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Historial laboral</h2>
        <Controller
          name="historialLaboral"
          control={control}
          render={({ field }) => (
            <WorkHistory value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      {/* Portafolio y estudios */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Portafolio y formación</h2>
        <div>
          <label className={labelClass}>Enlace a portafolio</label>
          <input
            {...register('enlacePortafolio')}
            type="url"
            placeholder="https://tu-portafolio.com"
            className={inputClass}
          />
          {errors.enlacePortafolio && (
            <p className="text-red-500 text-xs mt-1">{errors.enlacePortafolio.message}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Último grado de estudios</label>
          <textarea
            {...register('ultimoGradoEstudios')}
            rows={2}
            placeholder="Ej: Licenciatura en Diseño y Comunicación Visual, UNAM FES Acatlán, 2021"
            className={inputClass}
          />
          {errors.ultimoGradoEstudios && (
            <p className="text-red-500 text-xs mt-1">{errors.ultimoGradoEstudios.message}</p>
          )}
        </div>
      </div>

      {/* Certificaciones */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Certificaciones</h2>
        <Controller
          name="certificaciones"
          control={control}
          render={({ field }) => (
            <Certifications value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      {/* Idiomas */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900">Idiomas</h2>
        <Controller
          name="idiomas"
          control={control}
          render={({ field }) => (
            <MultiSelect
              options={[...LANGUAGES]}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecciona idiomas..."
              error={errors.idiomas?.message}
            />
          )}
        />
      </div>

      {/* Disponibilidad */}
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Disponibilidad horaria</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const currentVal = watch(`disponibilidad.${day.value}` as any) || ''
            return (
              <div key={day.value} className="border border-gray-100 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">{day.label}</p>
                <select
                  value={currentVal}
                  onChange={(e) =>
                    setValue(`disponibilidad.${day.value}` as any, e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">No disponible</option>
                  {TIME_BLOCKS.map((block) => (
                    <option key={block.value} value={block.value}>
                      {block.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Actions */}
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
          Publicar perfil
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Tu progreso se guarda automáticamente en este dispositivo.
      </p>
    </form>
  )
}
