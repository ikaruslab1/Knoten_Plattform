'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { officeSchema, type OfficeInput } from '@/lib/validations/director'
import { OFFICE_SPECIALTIES } from '@/lib/constants/roles'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'

interface Props {
  directorId: string
  initialData?: Partial<OfficeInput>
  officeId?: string
  currentLogoUrl?: string
}

export function OfficeForm({ directorId, initialData, officeId, currentLogoUrl }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [newLink, setNewLink] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OfficeInput>({
    resolver: zodResolver(officeSchema) as any,
    defaultValues: initialData || {
      nombre: '',
      manifiesto: '',
      linksPortafolios: [],
    },
  })

  const linksPortafolios = watch('linksPortafolios')
  const manifiesto = watch('manifiesto') || ''

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'image/svg+xml') {
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

  const addLink = () => {
    if (!newLink) return
    try {
      new URL(newLink)
      setValue('linksPortafolios', [...linksPortafolios, newLink])
      setNewLink('')
    } catch {
      setError('El enlace no es una URL válida.')
    }
  }

  const removeLink = (idx: number) => {
    setValue(
      'linksPortafolios',
      linksPortafolios.filter((_, i) => i !== idx)
    )
  }

  const onSubmit = async (data: OfficeInput) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    let logoUrl = currentLogoUrl || null

    // Upload SVG logo if provided
    if (logoFile) {
      const fileExt = 'svg'
      const fileName = `${directorId}/logo.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, logoFile, { upsert: true, contentType: 'image/svg+xml' })

      if (uploadError) {
        setError('Error al subir el logotipo. Verifica el bucket de almacenamiento.')
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName)
      logoUrl = urlData.publicUrl
    }

    const payload = {
      director_id: directorId,
      nombre: data.nombre,
      manifiesto: data.manifiesto,
      especialidad: data.especialidad,
      links_portafolios: data.linksPortafolios,
      logo_url: logoUrl,
    }

    if (officeId) {
      const { error: updateError } = await supabase
        .from('offices')
        .update(payload)
        .eq('id', officeId)
      if (updateError) {
        setError('Error al actualizar la oficina.')
        setLoading(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('offices').insert(payload)
      if (insertError) {
        setError('Error al crear la oficina.')
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logotipo <span className="text-gray-400 font-normal">(solo SVG, máx. 500 KB)</span>
        </label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <div className="w-16 h-16 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 p-2">
              {/* SVG preview via img tag */}
              <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300">
              <Upload className="w-6 h-6" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {logoPreview ? 'Cambiar logo' : 'Subir logo SVG'}
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nombre de la oficina
        </label>
        <input {...register('nombre')} type="text" placeholder="Oficina de Diseño Editorial UNAM" className={inputClass} />
        {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
      </div>

      {/* Manifiesto */}
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">Manifiesto</label>
          <span className={`text-xs ${manifiesto.length > 400 ? 'text-red-500' : 'text-gray-400'}`}>
            {manifiesto.length}/400
          </span>
        </div>
        <textarea
          {...register('manifiesto')}
          rows={4}
          maxLength={400}
          placeholder="Describe el enfoque, valores y visión de tu oficina de diseño..."
          className={inputClass}
        />
        {errors.manifiesto && (
          <p className="text-red-500 text-xs mt-1">{errors.manifiesto.message}</p>
        )}
      </div>

      {/* Especialidad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Especialidad</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OFFICE_SPECIALTIES.map((spec) => {
            const currentValue = watch('especialidad')
            return (
              <label
                key={spec.value}
                className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  currentValue === spec.value
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  value={spec.value}
                  {...register('especialidad')}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-800">{spec.label}</span>
              </label>
            )
          })}
        </div>
        {errors.especialidad && (
          <p className="text-red-500 text-xs mt-1">{errors.especialidad.message}</p>
        )}
      </div>

      {/* Links de portafolios de integrantes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Links de portafolios de integrantes
        </label>
        <div className="space-y-2 mb-3">
          {linksPortafolios.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="flex-1 text-sm text-gray-600 truncate">{link}</span>
              <button
                type="button"
                onClick={() => removeLink(idx)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() }}}
            placeholder="https://portafolio-integrante.com"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={addLink}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3">
          ¡Oficina guardada correctamente!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : officeId ? 'Actualizar oficina' : 'Crear oficina'}
      </button>
    </form>
  )
}
