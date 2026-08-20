'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { officeSchema, type OfficeInput } from '@/lib/validations/director'
import { OFFICE_SPECIALTIES, OFFICE_TEAMS, type OfficeSpecialty } from '@/lib/constants/roles'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Upload, Lock, Users, CheckCircle2, Mail, Phone, UserPlus, UserCheck, Sparkles } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/RichTextEditor'

export interface TeamMember {
  id: string
  nombreCompleto: string
  correoInstitucional: string
  telefono: string
}

export interface TeamDetail {
  vacantesCreadas: number
  aceptados: number
  miembros: TeamMember[]
}

interface Props {
  directorId: string
  initialData?: Partial<OfficeInput>
  officeId?: string
  currentLogoUrl?: string
  teamStats?: Record<string, TeamDetail>
}

export function OfficeForm({ directorId, initialData, officeId, currentLogoUrl, teamStats = {} }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!officeId

  const defaultEspecialidad: OfficeSpecialty = (initialData?.especialidad as OfficeSpecialty) || 'editorial'

  // Ensure default equipos object has entries for all teams of the specialty
  const defaultTeamsList = OFFICE_TEAMS[defaultEspecialidad] || []
  const defaultEquipos: Record<string, number> = { ...initialData?.equipos }
  defaultTeamsList.forEach((team) => {
    if (!defaultEquipos[team] || defaultEquipos[team] < 1) {
      defaultEquipos[team] = 1
    }
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OfficeInput>({
    resolver: zodResolver(officeSchema) as any,
    defaultValues: {
      nombre: initialData?.nombre || '',
      manifiesto: initialData?.manifiesto || '',
      especialidad: defaultEspecialidad,
      equipos: defaultEquipos,
    },
  })

  const currentEspecialidad = (watch('especialidad') as OfficeSpecialty) || 'editorial'
  const teamsForSpecialty = OFFICE_TEAMS[currentEspecialidad] || []

  // Ensure team defaults exist when specialty is changed during creation
  useEffect(() => {
    if (!isEditing) {
      const currentEquipos = watch('equipos') || {}
      const updated = { ...currentEquipos }
      let changed = false
      teamsForSpecialty.forEach((t) => {
        if (!updated[t] || updated[t] < 1) {
          updated[t] = 1
          changed = true
        }
      })
      if (changed) {
        setValue('equipos', updated)
      }
    }
  }, [currentEspecialidad, isEditing, teamsForSpecialty, setValue, watch])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isSvgExtension = file.name.toLowerCase().endsWith('.svg')
    const isSvgMime = file.type.includes('svg') || file.type === 'text/xml' || file.type === 'image/svg+xml'

    if (!isSvgExtension && !isSvgMime) {
      setError('El logotipo debe ser un archivo SVG.')
      return
    }
    if (file.size > 500 * 1024) {
      setError('El SVG no debe superar los 500 KB.')
      return
    }

    setLogoFile(file)
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
    setError(null)
  }

  const onSubmit = async (data: OfficeInput) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    let logoUrl = currentLogoUrl || null

    if (logoFile) {
      const fileExt = 'svg'
      const fileName = `${directorId}/logo.${fileExt}`

      let { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, logoFile, {
          upsert: true,
          contentType: 'image/svg+xml',
          cacheControl: '3600',
        })

      if (uploadError && (uploadError.message?.toLowerCase().includes('bucket not found') || (uploadError as any).statusCode === '404')) {
        try {
          const { error: createError } = await supabase.storage.createBucket('logos', { public: true })
          if (!createError) {
            const retry = await supabase.storage
              .from('logos')
              .upload(fileName, logoFile, {
                upsert: true,
                contentType: 'image/svg+xml',
                cacheControl: '3600',
              })
            uploadError = retry.error
          }
        } catch {
          // Fall through
        }
      }

      if (uploadError) {
        console.error('Logo upload error:', uploadError)
        setError(`Error al subir el logotipo: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName)
      logoUrl = `${urlData.publicUrl}?t=${Date.now()}`
    }

    // Build standard equipos object with exact teams for specialty
    const equiposPayload: Record<string, number> = {}
    teamsForSpecialty.forEach((team) => {
      const val = Number(data.equipos?.[team])
      equiposPayload[team] = val && val >= 1 ? val : 1
    })

    const payload = {
      director_id: directorId,
      nombre: data.nombre,
      manifiesto: data.manifiesto || '',
      especialidad: isEditing ? defaultEspecialidad : data.especialidad, // Locked on edit
      equipos: equiposPayload,
      logo_url: logoUrl,
    }

    if (officeId) {
      let { error: updateError } = await supabase
        .from('offices')
        .update(payload)
        .eq('id', officeId)

      if (updateError && (updateError.message?.toLowerCase().includes('equipos') || updateError.message?.toLowerCase().includes('schema cache'))) {
        const { equipos, ...fallbackPayload } = payload
        const retry = await supabase
          .from('offices')
          .update(fallbackPayload)
          .eq('id', officeId)
        updateError = retry.error
      }

      if (updateError) {
        setError(`Error al actualizar la oficina: ${updateError.message}`)
        setLoading(false)
        return
      }
    } else {
      let { error: insertError } = await supabase.from('offices').insert(payload)

      if (insertError && (insertError.message?.toLowerCase().includes('equipos') || insertError.message?.toLowerCase().includes('schema cache'))) {
        const { equipos, ...fallbackPayload } = payload
        const retry = await supabase.from('offices').insert(fallbackPayload)
        insertError = retry.error
      }

      if (insertError) {
        setError(`Error al crear la oficina: ${insertError.message}`)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
    router.push('/director/profile')
    router.refresh()
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all'

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'FL'
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* Sección General: Logo, Nombre y Manifiesto */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xs">
        {/* Header de sección */}
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Datos generales de la oficina</h2>
          <p className="text-xs text-gray-500 mt-0.5">Identidad visual y manifiesto creativo</p>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Logotipo de la oficina <span className="text-gray-400 font-normal text-xs">(solo SVG, máx. 500 KB)</span>
          </label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div className="w-18 h-18 border border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50 p-2.5 shadow-2xs">
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  onError={() => setError('Error al cargar la vista previa del SVG.')}
                />
              </div>
            ) : (
              <div className="w-18 h-18 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-300 bg-gray-50/50">
                <Upload className="w-6 h-6" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border border-gray-200 bg-white hover:bg-gray-50 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 transition-all shadow-2xs cursor-pointer"
            >
              {logoPreview ? 'Cambiar logotipo' : 'Subir logotipo SVG'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Nombre de la oficina
          </label>
          <input
            {...register('nombre')}
            type="text"
            placeholder="Ej: Oficina de Diseño Editorial UNAM"
            className={inputClass}
          />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
        </div>

        {/* Manifiesto con RichTextEditor */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Manifiesto de la oficina
          </label>
          <span className="block text-xs text-gray-500 mb-3">
            Describe la postura creativa, valores y enfoque de trabajo de tu oficina.
          </span>
          <Controller
            name="manifiesto"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                content={field.value || ''}
                onChange={field.onChange}
                maxChars={1000}
                placeholder="Describe el enfoque, valores y postura creativa de tu oficina..."
                enableTables={false}
              />
            )}
          />
          {errors.manifiesto && (
            <p className="text-red-500 text-xs mt-1.5">{errors.manifiesto.message}</p>
          )}
        </div>

        {/* Especialidad (Permanente una vez guardado) */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Tipo de oficina
            </label>
            {isEditing && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl p-3 mb-3 flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 shrink-0 text-amber-700" />
                <span>La selección del tipo de oficina es permanente y no se puede modificar una vez guardada.</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OFFICE_SPECIALTIES.map((spec) => {
              const isSelected = currentEspecialidad === spec.value
              return (
                <label
                  key={spec.value}
                  className={`flex items-center gap-3 border-2 rounded-2xl p-4.5 transition-all ${
                    isEditing
                      ? isSelected
                        ? 'border-black bg-gray-100/90 cursor-not-allowed opacity-90'
                        : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'border-black bg-gray-50 cursor-pointer shadow-2xs'
                      : 'border-gray-200 hover:border-gray-400 cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    value={spec.value}
                    disabled={isEditing}
                    {...register('especialidad')}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-black' : 'border-gray-300'}`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-black block" />}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{spec.label}</span>
                  </div>
                </label>
              )
            })}
          </div>
          {errors.especialidad && (
            <p className="text-red-500 text-xs mt-1">{errors.especialidad.message}</p>
          )}
        </div>
      </div>

      {/* SECCIÓN CONFORMACIÓN DE EQUIPOS (ESPACIO A LO ANCHO POR CADA EQUIPO) */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Users className="w-5 h-5 text-gray-900" />
            <h2 className="text-xl font-bold text-gray-900">
              Conformación y estructura de equipos
            </h2>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
            Cada equipo cuenta con su propio espacio a lo ancho para visualizar tanto los integrantes aceptados como las vacantes disponibles. Puedes configurar la capacidad de integrantes requerida para cada equipo (mínimo 1 persona).
          </p>
        </div>

        {/* Listado de Equipos: Cada uno ocupa todo el ancho */}
        <div className="space-y-6">
          {teamsForSpecialty.map((teamName, index) => {
            const detail: TeamDetail = teamStats[teamName] || { vacantesCreadas: 0, aceptados: 0, miembros: [] }
            const capacity = Number(watch(`equipos.${teamName}`) || 1)
            const isFull = detail.aceptados >= capacity && capacity > 0

            // Determine total slots to display (at least equal to configured capacity)
            const totalSlots = Math.max(capacity, detail.miembros.length)
            const emptySlotsCount = Math.max(0, capacity - detail.miembros.length)

            return (
              <div
                key={teamName}
                className={`bg-white border rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 transition-all ${
                  isFull ? 'border-emerald-300 bg-emerald-50/15' : 'border-gray-200/90'
                }`}
              >
                {/* Cabecera del Equipo: Título, Estado y Control de Capacidad */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2.5 py-0.5 rounded-md">
                        Equipo #{index + 1}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {teamName}
                      </h3>
                      {isFull && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Equipo lleno
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 pt-0.5">
                      <span>
                        <strong className="text-gray-900 font-semibold">{detail.aceptados}</strong> de{' '}
                        <strong className="text-gray-900 font-semibold">{capacity}</strong> plazas ocupadas
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-gray-900 font-semibold">{emptySlotsCount}</strong> {emptySlotsCount === 1 ? 'plaza disponible' : 'plazas disponibles'}
                      </span>
                      {isEditing && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400">
                            {detail.vacantesCreadas} {detail.vacantesCreadas === 1 ? 'vacante publicada' : 'vacantes publicadas'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Input de Capacidad del Equipo */}
                  <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3 flex items-center gap-3 shrink-0">
                    <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                      Capacidad del equipo:
                    </label>
                    <div className="w-20">
                      <input
                        type="number"
                        min={1}
                        {...register(`equipos.${teamName}` as const, { valueAsNumber: true })}
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-center text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Subsección: Integrantes y Plazas (Slots) a lo ancho en Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Distribución de plazas e integrantes
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Renderizar Integrantes Aceptados */}
                    {detail.miembros.map((miembro) => (
                      <div
                        key={miembro.id}
                        className="bg-white border border-gray-200/90 rounded-2xl p-4.5 space-y-3.5 shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all relative overflow-hidden group"
                      >
                        {/* Indicador de estado */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {getInitials(miembro.nombreCompleto)}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-sm font-bold text-gray-900 truncate leading-tight">
                                {miembro.nombreCompleto}
                              </h5>
                              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                                <UserCheck className="w-3 h-3" /> Miembro activo
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Datos de contacto solicitados: Correo institucional y Teléfono */}
                        <div className="space-y-1.5 pt-1 border-t border-gray-100 text-xs">
                          <div className="flex items-center gap-2 text-gray-600 bg-gray-50/80 px-2.5 py-1.5 rounded-lg border border-gray-100 truncate">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate font-medium">{miembro.correoInstitucional}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 bg-gray-50/80 px-2.5 py-1.5 rounded-lg border border-gray-100">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="font-medium">{miembro.telefono}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 2. Renderizar Plazas Disponibles como "Vacante vacía" */}
                    {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => (
                      <div
                        key={`empty-${slotIdx}`}
                        className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-2xl p-4.5 flex flex-col justify-between min-h-[140px] hover:border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-md">
                            Vacante vacía
                          </span>
                        </div>
                        <div className="space-y-1 pt-3">
                          <p className="text-xs font-bold text-gray-700">
                            Puesto #{detail.miembros.length + slotIdx + 1} disponible
                          </p>
                          <p className="text-[11px] text-gray-400 leading-snug">
                            Esperando postulación y aceptación de freelancer para este equipo.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl px-5 py-4 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-2xl px-5 py-4 font-medium">
          ¡Oficina guardada correctamente!
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        {isEditing && (
          <button
            type="button"
            onClick={() => router.push('/director/profile')}
            className="border border-gray-200 text-gray-700 rounded-2xl px-6 py-4 text-sm font-semibold hover:bg-gray-50 transition-all cursor-pointer text-center"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black text-white rounded-2xl px-6 py-4 text-sm font-bold hover:bg-gray-900 transition-all disabled:opacity-50 shadow-md cursor-pointer text-center"
        >
          {loading ? 'Guardando...' : officeId ? 'Guardar cambios de la oficina' : 'Crear oficina y conformar equipos'}
        </button>
      </div>
    </form>
  )
}
