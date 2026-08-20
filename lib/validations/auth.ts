import { z } from 'zod'

export const registerSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50),
  apellidoPaterno: z.string().min(1, 'El apellido paterno es requerido').max(50),
  apellidoMaterno: z.string().min(1, 'El apellido materno es requerido').max(50),
  numeroCuenta: z
    .string()
    .length(9, 'El número de cuenta debe tener 9 dígitos')
    .regex(/^\d{9}$/, 'El número de cuenta solo debe contener dígitos'),
  correoInstitucional: z
    .string()
    .email('Correo inválido')
    .refine(
      (val) => val.endsWith('@comunidad.unam.mx') || val.endsWith('@unam.mx'),
      'Debe ser un correo institucional UNAM (@unam.mx o @comunidad.unam.mx)'
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
})

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export type LoginInput = z.infer<typeof loginSchema>
