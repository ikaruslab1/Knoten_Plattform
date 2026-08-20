'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, toTitleCase, type RegisterInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import useFormPersist from 'react-hook-form-persist'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  // Persist form fields to localStorage (excluding passwords)
  useFormPersist('register-form-data', {
    watch,
    setValue,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    exclude: ['password', 'confirmPassword'],
  })

  const handleNameInput =
    (field: 'nombre' | 'apellidoPaterno' | 'apellidoMaterno') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const titleCased = toTitleCase(e.target.value)
      setValue(field, titleCased, { shouldValidate: true })
    }

  const handleNumeroCuentaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 9)
    setValue('numeroCuenta', onlyNums, { shouldValidate: true })
  }

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    setError(null)

    // Check DB for allowed account numbers and duplicates (correoInstitucional, correoPersonal, telefono, numeroCuenta)
    try {
      const checkRes = await fetch('/api/auth/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correoInstitucional: data.correoInstitucional,
          correoPersonal: data.correoPersonal,
          telefono: data.telefono,
          numeroCuenta: data.numeroCuenta,
        }),
      })

      const checkData = await checkRes.json()

      if (checkData.isDuplicate) {
        setError(checkData.message)
        setLoading(false)
        return
      }
    } catch {
      // Non-blocking catch
    }

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

    // Clear local storage persistence on successful registration
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('register-form-data')
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
          password: data.password,
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
    <div className="space-y-4">
      {/* Botón para volver atrás e iniciar sesión */}
      <div>
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-black transition-colors group mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Volver a iniciar sesión
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              {...register('nombre')}
              type="text"
              onChange={handleNameInput('nombre')}
              className={inputClass}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ap. Paterno</label>
            <input
              {...register('apellidoPaterno')}
              type="text"
              onChange={handleNameInput('apellidoPaterno')}
              className={inputClass}
            />
            {errors.apellidoPaterno && (
              <p className="text-red-500 text-xs mt-1">{errors.apellidoPaterno.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ap. Materno</label>
            <input
              {...register('apellidoMaterno')}
              type="text"
              onChange={handleNameInput('apellidoMaterno')}
              className={inputClass}
            />
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
            onChange={handleNumeroCuentaInput}
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
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
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
    </div>
  )
}
