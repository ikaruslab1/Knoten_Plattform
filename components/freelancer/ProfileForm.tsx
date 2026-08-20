'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { freelancerProfileSchema, parseEstudios, parseDisponibilidad, type FreelancerProfileInput } from '@/lib/validations/freelancer'
import { SPECIALTIES } from '@/lib/constants/specialties'
import { SOFTWARE_LIST } from '@/lib/constants/software'
import { EXPERIENCE_LEVELS, LANGUAGES, DAYS_OF_WEEK, TIME_BLOCKS } from '@/lib/constants/roles'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { WorkHistory } from '@/components/freelancer/WorkHistory'
import { Certifications } from '@/components/freelancer/Certifications'
import { EstudiosInput } from '@/components/freelancer/EstudiosInput'
import { AvailabilityGrid } from '@/components/freelancer/AvailabilityGrid'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'

const getStorageKey = (uid: string) => `knoten-freelancer-draft-${uid}`
const LEGACY_STORAGE_KEY = 'knoten-freelancer-profile-draft'

interface Props {
  userId: string
  initialData?: Partial<FreelancerProfileInput>
  serverUpdatedAt?: string | null
  isPublished?: boolean
}

export function ProfileForm({ userId, initialData, serverUpdatedAt, isPublished }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shouldPublish, setShouldPublish] = useState(false)
  const [newHabilidad, setNewHabilidad] = useState('')

  // Accordion state: section 0 open by default, others collapsed
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false,
    3: false,
    4: false,
  })

  // Track which sections have been attempted to validate/advance
  const [attemptedSections, setAttemptedSections] = useState<Record<number, boolean>>({})

  // Section Refs for smooth scrolling
  const sec0Ref = useRef<HTMLDivElement>(null)
  const sec1Ref = useRef<HTMLDivElement>(null)
  const sec2Ref = useRef<HTMLDivElement>(null)
  const sec3Ref = useRef<HTMLDivElement>(null)
  const sec4Ref = useRef<HTMLDivElement>(null)

  const sectionRefs = [sec0Ref, sec1Ref, sec2Ref, sec3Ref, sec4Ref]

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
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

  // Smart Draft Hydration: Discard stale local drafts if DB has a newer published version
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      const storageKey = getStorageKey(userId)
      const storedRaw = localStorage.getItem(storageKey)

      if (storedRaw) {
        const parsed = JSON.parse(storedRaw)
        const draftTime = parsed?.updatedAt ? new Date(parsed.updatedAt).getTime() : 0
        const serverTime = serverUpdatedAt ? new Date(serverUpdatedAt).getTime() : 0

        // If server version is newer or equal, or if published version doesn't match, discard stale draft
        if (serverTime && (serverTime >= draftTime || (isPublished && parsed?.publishedVersionAt !== serverUpdatedAt))) {
          localStorage.removeItem(storageKey)
          if (initialData) {
            reset(initialData)
          }
        } else if (parsed?.data) {
          // Local uncommitted draft is newer: restore into form
          reset(parsed.data)
        } else if (typeof parsed === 'object' && !parsed?.data) {
          if (!isPublished || !serverTime) {
            reset(parsed)
          } else {
            localStorage.removeItem(storageKey)
          }
        }
      }
    } catch (e) {
      console.error('Error hydrating draft', e)
    }
  }, [userId, serverUpdatedAt, isPublished, initialData, reset])

  // Persist form changes locally with timestamp metadata
  useEffect(() => {
    const storageKey = getStorageKey(userId)
    const subscription = watch((value) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            updatedAt: new Date().toISOString(),
            publishedVersionAt: serverUpdatedAt,
            data: value,
          })
        )
      } catch (e) {
        // Handle quota errors silently
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, userId, serverUpdatedAt])

  // Realtime multi-device sync via Supabase WebSocket (0 extra polling queries)
  useEffect(() => {
    const supabase = createClient()
    const storageKey = getStorageKey(userId)

    const channel = supabase
      .channel(`profile-sync-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'freelancer_profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && payload.new.publicado) {
            // New version published from another device/tab -> clean local draft and refresh
            localStorage.removeItem(storageKey)
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, router])

  // Watch form fields for completion calculations
  const valResumen = watch('resumenProfesional') || ''
  const valEspecialidades = watch('especialidades') || []
  const valNivelExperiencia = watch('nivelExperiencia') || ''
  const valSoftware = watch('software') || []
  const valEstudios = watch('ultimoGradoEstudios') || ''
  const valIdiomas = watch('idiomas') || []
  const valPortafolio = watch('enlacePortafolio') || ''
  const valDisponibilidad = watch('disponibilidad') || {}
  const valHabilidadesRaw = watch('habilidadesComplementarias')

  const habilidadesList: string[] = Array.isArray(valHabilidadesRaw)
    ? valHabilidadesRaw
    : typeof valHabilidadesRaw === 'string' && valHabilidadesRaw.trim()
    ? valHabilidadesRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const handleAddHabilidad = () => {
    const trimmed = newHabilidad.trim()
    if (!trimmed) return
    if (!habilidadesList.includes(trimmed)) {
      const updated = [...habilidadesList, trimmed]
      setValue('habilidadesComplementarias', updated as any, { shouldDirty: true, shouldValidate: true })
    }
    setNewHabilidad('')
  }

  const handleRemoveHabilidad = (indexToRemove: number) => {
    const updated = habilidadesList.filter((_, idx) => idx !== indexToRemove)
    setValue('habilidadesComplementarias', updated as any, { shouldDirty: true, shouldValidate: true })
  }

  // Check URL validity for portfolio
  let isPortfolioValid = true
  if (valPortafolio && valPortafolio.trim() !== '') {
    try {
      new URL(valPortafolio)
    } catch {
      isPortfolioValid = false
    }
  }

  // Section Completion & Missing Details Logic
  const getSectionStatus = (secIdx: number) => {
    switch (secIdx) {
      case 0: {
        const plainText = valResumen.replace(/<[^>]*>/g, '').trim()
        const isComplete = plainText.length >= 10 && plainText.length <= 700
        let missingText = ''
        if (!isComplete) {
          if (plainText.length === 0) {
            missingText = 'Falta: Cuéntanos sobre ti'
          } else if (plainText.length < 10) {
            missingText = 'Falta: Resumen debe tener al menos 10 caracteres'
          } else {
            missingText = 'Falta: Excede el límite de 700 caracteres'
          }
        }
        return { isComplete, missingText }
      }
      case 1: {
        const hasEspec = valEspecialidades.length > 0
        const hasNivel = valNivelExperiencia !== ''
        const isComplete = hasEspec && hasNivel
        let missingText = ''
        if (!isComplete) {
          if (!hasEspec && !hasNivel) missingText = 'Falta: Áreas de especialidad y Nivel de experiencia'
          else if (!hasEspec) missingText = 'Falta: Áreas de especialidad'
          else missingText = 'Falta: Nivel de experiencia global'
        }
        return { isComplete, missingText }
      }
      case 2: {
        const isComplete = valSoftware.length > 0
        const missingText = isComplete ? '' : 'Falta: Software y herramientas'
        return { isComplete, missingText }
      }
      case 3: {
        const parsedEstudios = parseEstudios(valEstudios)
        const hasEstudios = parsedEstudios.some((item) => item.seleccionado && item.carrera && item.carrera.trim().length > 0)
        const hasIdiomas = valIdiomas.length > 0
        const isComplete = hasEstudios && hasIdiomas && isPortfolioValid
        let missingText = ''
        if (!isComplete) {
          const missingParts = []
          if (!hasEstudios) missingParts.push('Último grado de estudios')
          if (!hasIdiomas) missingParts.push('Idiomas')
          if (!isPortfolioValid) missingParts.push('URL de portafolio válida')
          missingText = `Falta: ${missingParts.join(', ')}`
        }
        return { isComplete, missingText }
      }
      case 4: {
        const parsed = parseDisponibilidad(valDisponibilidad)
        const isComplete =
          parsed.activeDays.length > 0 &&
          parsed.activeDays.some((day) => (parsed.slots[day] || []).length > 0)
        const missingText = isComplete ? '' : 'Falta: Activa al menos un día y selecciona sus horarios'
        return { isComplete, missingText }
      }
      default:
        return { isComplete: false, missingText: '' }
    }
  }

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  const handleNextSection = (currentIdx: number) => {
    setAttemptedSections((prev) => ({ ...prev, [currentIdx]: true }))

    const { isComplete } = getSectionStatus(currentIdx)
    const nextIdx = currentIdx + 1

    if (isComplete && nextIdx < 5) {
      setOpenSections((prev) => ({
        ...prev,
        [currentIdx]: false,
        [nextIdx]: true,
      }))

      setTimeout(() => {
        sectionRefs[nextIdx].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  const onSubmit = async (data: FreelancerProfileInput) => {
    const publish = shouldPublish
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const currentHabilidades = Array.isArray(data.habilidadesComplementarias)
      ? data.habilidadesComplementarias
      : typeof data.habilidadesComplementarias === 'string' && data.habilidadesComplementarias.trim()
      ? data.habilidadesComplementarias.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const finalHabilidades = newHabilidad.trim() && !currentHabilidades.includes(newHabilidad.trim())
      ? [...currentHabilidades, newHabilidad.trim()]
      : currentHabilidades

    const habilidadesString = finalHabilidades.join(', ')

    // Upsert freelancer profile
    const { error: profileError } = await supabase
      .from('freelancer_profiles')
      .upsert({
        id: userId,
        resumen_profesional: data.resumenProfesional,
        especialidades: data.especialidades,
        nivel_experiencia: data.nivelExperiencia,
        software: data.software,
        habilidades_complementarias: habilidadesString,
        enlace_portafolio: data.enlacePortafolio,
        ultimo_grado_estudios: typeof data.ultimoGradoEstudios === 'object'
          ? JSON.stringify(data.ultimoGradoEstudios)
          : data.ultimoGradoEstudios,
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
      localStorage.removeItem(getStorageKey(userId))
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      router.push('/freelancer/profile')
    } else {
      setLoading(false)
    }
  }

  const onInvalid = () => {
    // Flag all sections as attempted to show red headers for missing sections
    setAttemptedSections({ 0: true, 1: true, 2: true, 3: true, 4: true })

    // Find first incomplete section, open it and scroll into view
    for (let i = 0; i < 5; i++) {
      const { isComplete } = getSectionStatus(i)
      if (!isComplete) {
        setOpenSections((prev) => ({ ...prev, [i]: true }))
        setTimeout(() => {
          sectionRefs[i].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
        break
      }
    }
  }

  const inputClass =
    'w-full border border-gray-200/90 bg-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-2xs hover:border-gray-300'
  const labelClass = 'block text-sm font-semibold text-gray-900 mb-1'
  const helperClass = 'block text-xs text-gray-500 mb-2.5 font-normal leading-relaxed'

  const sectionsData = [
    { id: 0, title: 'Resumen profesional', subtitle: 'Biografía y presentación', ref: sec0Ref },
    { id: 1, title: 'Especialidades', subtitle: 'Disciplinas clave y nivel global', ref: sec1Ref },
    { id: 2, title: 'Herramientas del diseño', subtitle: 'Software y habilidades complementarias', ref: sec2Ref },
    { id: 3, title: 'Trayectoria', subtitle: 'Historial, portafolio, estudios e idiomas', ref: sec3Ref },
    { id: 4, title: 'Disponibilidad horaria', subtitle: 'Días y franjas semanales', ref: sec4Ref },
  ]

  return (
    <form onSubmit={(handleSubmit as any)(onSubmit, onInvalid)} className="space-y-6 sm:space-y-7">
      {sectionsData.map((sec, idx) => {
        const isOpen = !!openSections[sec.id]
        const isAttempted = !!attemptedSections[sec.id]
        const { isComplete, missingText } = getSectionStatus(sec.id)

        // Dynamic Header Styling based on status and active/open state
        let headerBgClass = ''
        let badgeClass = ''
        let chevronClass = ''

        if (isComplete) {
          if (isOpen) {
            // Active & Complete: High-contrast, rich emerald
            headerBgClass = 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm border border-emerald-800/40'
            badgeClass = 'bg-emerald-800/90 border border-emerald-400/40 text-white'
            chevronClass = 'text-white'
          } else {
            // Inactive & Complete: Soft, peaceful light green tone that does NOT steal visual attention
            headerBgClass = 'bg-emerald-50/75 hover:bg-emerald-100/75 text-emerald-950 border border-emerald-200/80'
            badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
            chevronClass = 'text-emerald-700'
          }
        } else if (isAttempted) {
          if (isOpen) {
            // Active & Incomplete error
            headerBgClass = 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 shadow-sm'
            badgeClass = 'bg-rose-800/90 border border-rose-400/40 text-white'
            chevronClass = 'text-white'
          } else {
            // Inactive & Incomplete error: Soft rose tone
            headerBgClass = 'bg-rose-50/85 hover:bg-rose-100/80 text-rose-950 border border-rose-200/80'
            badgeClass = 'bg-rose-100 text-rose-800 border border-rose-300/60'
            chevronClass = 'text-rose-700'
          }
        } else {
          if (isOpen) {
            // Active default
            headerBgClass = 'bg-neutral-900 hover:bg-black text-white border border-neutral-900 shadow-sm'
            badgeClass = 'bg-neutral-800 border border-neutral-700 text-gray-200'
            chevronClass = 'text-white'
          } else {
            // Inactive default: Clean minimalist card
            headerBgClass = 'bg-white hover:bg-gray-50/90 text-gray-900 border border-gray-200/90'
            badgeClass = 'bg-gray-100 border border-gray-200 text-gray-600'
            chevronClass = 'text-gray-500'
          }
        }

        return (
          <div
            key={sec.id}
            ref={sec.ref}
            className={`scroll-mt-6 rounded-2xl overflow-hidden transition-all duration-200 ${
              isOpen ? 'shadow-md ring-1 ring-black/5' : 'shadow-2xs'
            }`}
          >
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => toggleSection(sec.id)}
              className={`w-full flex items-center justify-between p-4.5 sm:p-5 px-5 sm:px-7 transition-all duration-200 text-left ${headerBgClass}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 gap-2 sm:gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isComplete
                        ? isOpen
                          ? 'bg-emerald-800 text-white'
                          : 'bg-emerald-200/80 text-emerald-900'
                        : isAttempted
                        ? isOpen
                          ? 'bg-rose-800 text-white'
                          : 'bg-rose-200/80 text-rose-900'
                        : isOpen
                        ? 'bg-neutral-800 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {isComplete ? '✓' : sec.id + 1}
                  </span>
                  <div>
                    <span className="font-bold text-sm sm:text-base tracking-tight block">
                      {sec.title}
                    </span>
                    <span
                      className={`text-xs block font-normal ${
                        isOpen
                          ? 'text-white/70'
                          : isComplete
                          ? 'text-emerald-700/80'
                          : isAttempted
                          ? 'text-rose-700/80'
                          : 'text-gray-400'
                      }`}
                    >
                      {sec.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {isComplete && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${badgeClass}`}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Completado
                    </span>
                  )}

                  {!isComplete && isAttempted && missingText && (
                    <span className={`text-xs px-3 py-1 rounded-lg font-medium ${badgeClass}`}>
                      {missingText}
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 bg-white/10' : 'bg-black/5'
                }`}
              >
                <svg
                  className={`w-4 h-4 ${chevronClass}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Accordion Content */}
            {isOpen && (
              <div className="p-6 sm:p-8 lg:p-10 bg-white border border-t-0 border-gray-200/80 rounded-b-2xl space-y-8 sm:space-y-10">
                {/* SECTION 0: Resumen profesional */}
                {sec.id === 0 && (
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>Cuéntanos sobre ti</label>
                      <span className={helperClass}>
                        Escribe un resumen conciso sobre tu formación, visión creativa, fortalezas y estilo de trabajo.
                      </span>
                      <Controller
                        name="resumenProfesional"
                        control={control}
                        render={({ field }) => (
                          <RichTextEditor
                            content={field.value}
                            onChange={field.onChange}
                            maxChars={700}
                            placeholder="Describe tu trayectoria, enfoque y lo que te diferencia como diseñador..."
                            enableTables={false}
                          />
                        )}
                      />
                      {errors.resumenProfesional && (
                        <p className="text-red-500 text-xs mt-1.5">{errors.resumenProfesional.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 1: Especialidades (Generous Breathing Room) */}
                {sec.id === 1 && (
                  <div className="space-y-9 sm:space-y-10">
                    {/* Subsection: Áreas de especialidad */}
                    <div className="bg-gray-50/50 p-5 sm:p-6 rounded-2xl border border-gray-100/90">
                      <label className={labelClass}>Áreas de especialidad</label>
                      <span className={helperClass}>
                        Selecciona las ramas y disciplinas principales en las que destacas profesionalmente.
                      </span>
                      <Controller
                        name="especialidades"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={[...SPECIALTIES]}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Buscar y seleccionar especialidades..."
                            error={errors.especialidades?.message}
                          />
                        )}
                      />
                    </div>

                    {/* Subsection: Nivel de experiencia global */}
                    <div className="bg-gray-50/50 p-5 sm:p-6 rounded-2xl border border-gray-100/90">
                      <label className={labelClass}>Nivel de experiencia global</label>
                      <span className={helperClass}>
                        Define tu seniority acumulado en la industria del diseño y tecnología.
                      </span>
                      <select {...register('nivelExperiencia')} className={inputClass}>
                        <option value="">Selecciona tu nivel de experiencia</option>
                        {EXPERIENCE_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      {errors.nivelExperiencia && (
                        <p className="text-red-500 text-xs mt-1.5">{errors.nivelExperiencia.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 2: Herramientas del diseño (Generous Spacing) */}
                {sec.id === 2 && (
                  <div className="space-y-9 sm:space-y-10">
                    {/* Subsection: Software */}
                    <div className="bg-gray-50/50 p-5 sm:p-6 rounded-2xl border border-gray-100/90">
                      <label className={labelClass}>Software y herramientas principales</label>
                      <span className={helperClass}>
                        Las aplicaciones, plataformas y herramientas de trabajo que dominas en tu flujo diario.
                      </span>
                      <Controller
                        name="software"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={[...SOFTWARE_LIST]}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Buscar programas y herramientas..."
                            error={errors.software?.message}
                          />
                        )}
                      />
                    </div>

                    {/* Subsection: Habilidades complementarias */}
                    <div className="bg-gray-50/50 p-5 sm:p-6 rounded-2xl border border-gray-100/90">
                      <label className={labelClass}>Habilidades complementarias</label>
                      <span className={helperClass}>
                        Conocimientos adicionales, metodologías ágiles o habilidades blandas que enriquecen tu perfil.
                      </span>

                      {habilidadesList.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {habilidadesList.map((tag, idx) => (
                            <span
                              key={`${tag}-${idx}`}
                              className="inline-flex items-center gap-2 bg-white text-gray-800 text-xs px-3.5 py-1.5 rounded-xl font-medium border border-gray-200/90 shadow-2xs group hover:border-gray-300 transition-all"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveHabilidad(idx)}
                                className="text-gray-400 hover:text-red-600 transition-colors rounded-full p-0.5"
                                title="Eliminar etiqueta"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2.5 items-center">
                        <input
                          type="text"
                          value={newHabilidad}
                          onChange={(e) => setNewHabilidad(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddHabilidad()
                            }
                          }}
                          placeholder="Ej: Gestión de proyectos, redacción UX, prototipado rápido..."
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={handleAddHabilidad}
                          className="bg-neutral-900 hover:bg-black text-white transition-all px-4 py-3 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-white" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3: Trayectoria (Generous Spacing & Clean Dividers) */}
                {sec.id === 3 && (
                  <div className="space-y-10 sm:space-y-12 divide-y divide-gray-100">
                    {/* Historial laboral */}
                    <div className="space-y-2">
                      <h3 className="text-base font-bold tracking-tight text-gray-900">Historial laboral</h3>
                      <span className={helperClass}>
                        Añade tus roles previos o actuales con sus principales responsabilidades y logros.
                      </span>
                      <div className="pt-2">
                        <Controller
                          name="historialLaboral"
                          control={control}
                          render={({ field }) => <WorkHistory value={field.value} onChange={field.onChange} />}
                        />
                      </div>
                    </div>

                    {/* Enlace a portafolio */}
                    <div className="pt-8 sm:pt-10 space-y-2">
                      <label className={labelClass}>Enlace a portafolio o sitio web</label>
                      <span className={helperClass}>
                        URL directa donde clientes o directores de arte puedan ver muestras de tus proyectos terminados.
                      </span>
                      <input
                        {...register('enlacePortafolio')}
                        type="url"
                        placeholder="https://tu-portafolio.com"
                        className={inputClass}
                      />
                      {errors.enlacePortafolio && (
                        <p className="text-red-500 text-xs mt-1.5">{errors.enlacePortafolio.message}</p>
                      )}
                    </div>

                    {/* Último grado de estudios */}
                    <div className="pt-8 sm:pt-10 space-y-2">
                      <label className={labelClass}>Último grado de estudios</label>
                      <span className={helperClass}>
                        Marca tu grado académico más representativo y especifica la carrera cursada.
                      </span>
                      <div className="pt-2">
                        <Controller
                          name="ultimoGradoEstudios"
                          control={control}
                          render={({ field }) => (
                            <EstudiosInput
                              value={field.value}
                              onChange={field.onChange}
                              error={typeof errors.ultimoGradoEstudios?.message === 'string' ? errors.ultimoGradoEstudios?.message : undefined}
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Certificaciones */}
                    <div className="pt-8 sm:pt-10 space-y-2">
                      <h3 className="text-base font-bold tracking-tight text-gray-900">Certificaciones y diplomados</h3>
                      <span className={helperClass}>
                        Cursos especializados y credenciales que avalan tu actualización profesional.
                      </span>
                      <div className="pt-2">
                        <Controller
                          name="certificaciones"
                          control={control}
                          render={({ field }) => <Certifications value={field.value} onChange={field.onChange} />}
                        />
                      </div>
                    </div>

                    {/* Idiomas */}
                    <div className="pt-8 sm:pt-10 space-y-2">
                      <label className={labelClass}>Idiomas</label>
                      <span className={helperClass}>
                        Lenguajes en los que puedes comunicarte y colaborar en proyectos.
                      </span>
                      <div className="pt-1">
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
                    </div>
                  </div>
                )}

                {/* SECTION 4: Disponibilidad horaria */}
                {sec.id === 4 && (
                  <div className="space-y-4">
                    <Controller
                      name="disponibilidad"
                      control={control}
                      render={({ field }) => (
                        <AvailabilityGrid
                          value={field.value}
                          onChange={field.onChange}
                          readOnly={false}
                        />
                      )}
                    />
                  </div>
                )}

                {/* Section Advance / Action Button */}
                {idx < 4 && (
                  <div className="flex justify-end pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleNextSection(idx)}
                      className="bg-neutral-900 text-white px-6 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-sm cursor-pointer hover:shadow-md"
                    >
                      Siguiente sección
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Global Submit Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200/80 text-red-700 text-sm rounded-xl px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Global Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 sm:pt-8 border-t border-gray-200/80">
        <button
          type="submit"
          disabled={loading}
          onClick={() => setShouldPublish(false)}
          className="flex-1 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 shadow-2xs cursor-pointer"
        >
          {loading ? 'Guardando cambios...' : 'Guardar borrador'}
        </button>
        <button
          type="submit"
          disabled={loading}
          onClick={() => setShouldPublish(true)}
          className="flex-1 bg-black hover:bg-neutral-900 text-white rounded-xl px-6 py-3.5 text-sm font-semibold transition-all disabled:opacity-50 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Publicar perfil</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Tu progreso se guarda automáticamente como borrador local en este dispositivo.
      </p>
    </form>
  )
}
