import { z } from 'zod'
import { ALLOWED_NUMEROS_CUENTA } from '@/lib/constants/auth'

export function toTitleCase(val: string): string {
  if (!val) return val
  return val
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ')
}

export const registerSchema = z
  .object({
    nombre: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(50)
      .transform(toTitleCase),
    apellidoPaterno: z
      .string()
      .min(1, 'El apellido paterno es requerido')
      .max(50)
      .transform(toTitleCase),
    apellidoMaterno: z
      .string()
      .min(1, 'El apellido materno es requerido')
      .max(50)
      .transform(toTitleCase),
    numeroCuenta: z
      .string()
      .length(9, 'El número de cuenta debe tener exactamente 9 dígitos')
      .regex(/^\d{9}$/, 'El número de cuenta solo debe contener números')
      .refine(
        (val) => ALLOWED_NUMEROS_CUENTA.has(val),
        'Este número de cuenta no está autorizado para registrarse.'
      ),
    correoInstitucional: z
      .string()
      .email('Correo inválido')
      .refine(
        (val) => val.toLowerCase().includes('.unam'),
        'El correo institucional debe contener ".unam"'
      ),
    correoPersonal: z.string().email('Correo personal inválido'),
    telefono: z
      .string()
      .min(10, 'El teléfono debe tener al menos 10 dígitos')
      .max(15)
      .regex(/^[\d\s\+\-\(\)]+$/, 'Teléfono inválido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72),
    confirmPassword: z
      .string()
      .min(1, 'La confirmación de contraseña es requerida'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export type LoginInput = z.infer<typeof loginSchema>
