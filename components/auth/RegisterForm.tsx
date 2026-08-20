'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email: data.correoPersonal,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          apellido_paterno: data.apellidoPaterno,
          apellido_materno: data.apellidoMaterno,
          numero_cuenta: data.numeroCuenta,
          correo_institucional: data.correoInstitucional,
          correo_personal: data.correoPersonal,
          telefono: data.telefono,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/confirm`,
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.')
      } else {
        setError('Ocurrió un error al registrarte. Intenta nuevamente.')
      }
      setLoading(false)
      return
    }

    // Send welcome email via server action
    try {
      await fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
          numeroCuenta: data.numeroCuenta,
          correoInstitucional: data.correoInstitucional,
          correoPersonal: data.correoPersonal,
          telefono: data.telefono,
        }),
      })
    } catch {
      // Non-critical: email failure shouldn't block registration
    }

    router.push('/confirm')
  }

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input {...register('nombre')} type="text" className={inputClass} />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ap. Paterno</label>
          <input {...register('apellidoPaterno')} type="text" className={inputClass} />
          {errors.apellidoPaterno && (
            <p className="text-red-500 text-xs mt-1">{errors.apellidoPaterno.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ap. Materno</label>
          <input {...register('apellidoMaterno')} type="text" className={inputClass} />
          {errors.apellidoMaterno && (
            <p className="text-red-500 text-xs mt-1">{errors.apellidoMaterno.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de cuenta UNAM
        </label>
        <input
          {...register('numeroCuenta')}
          type="text"
          maxLength={9}
          placeholder="000000000"
          className={inputClass}
        />
        {errors.numeroCuenta && (
          <p className="text-red-500 text-xs mt-1">{errors.numeroCuenta.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo institucional UNAM
        </label>
        <input
          {...register('correoInstitucional')}
          type="email"
          placeholder="cuenta@comunidad.unam.mx"
          className={inputClass}
        />
        {errors.correoInstitucional && (
          <p className="text-red-500 text-xs mt-1">{errors.correoInstitucional.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Correo personal</label>
        <input
          {...register('correoPersonal')}
          type="email"
          placeholder="tu@correo.com"
          className={inputClass}
        />
        {errors.correoPersonal && (
          <p className="text-red-500 text-xs mt-1">{errors.correoPersonal.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
        <input {...register('telefono')} type="tel" placeholder="+52 55 0000 0000" className={inputClass} />
        {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" className={inputClass} />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  )
}
