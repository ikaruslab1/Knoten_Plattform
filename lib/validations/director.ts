import { z } from 'zod'

export const officeSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la oficina es requerido').max(100),
  manifiesto: z
    .string()
    .max(400, 'El manifiesto no puede superar los 400 caracteres')
    .optional(),
  especialidad: z.enum(['editorial', 'graficos'], {
    required_error: 'Selecciona una especialidad',
  }),
  linksPortafolios: z.array(z.string().url('URL inválida')).default([]),
})

export type OfficeInput = z.infer<typeof officeSchema>

export const vacanteSchema = z.object({
  numLugares: z
    .number()
    .min(1, 'Mínimo 1 lugar')
    .max(7, 'Máximo 7 lugares'),
  rolesBuscados: z.array(z.string()).min(1, 'Selecciona al menos un rol'),
  nivelRequerido: z.string().min(1, 'El nivel es requerido'),
  habilidades: z.array(z.string()).default([]),
  responsabilidades: z.string().min(10, 'Describe las responsabilidades').max(2000),
  modalidad: z.enum(['en_linea', 'presencial', 'hibrido'], {
    required_error: 'Selecciona una modalidad',
  }),
  horasSemanales: z
    .number()
    .min(1, 'Mínimo 1 hora semanal')
    .max(60, 'Máximo 60 horas semanales'),
  duracionSemanas: z
    .number()
    .min(1, 'Mínimo 1 semana')
    .max(7, 'Máximo 7 semanas'),
  solicitarPortafolio: z.boolean().default(false),
  solicitarExtracto: z.boolean().default(false),
  confirmarCalendario: z.boolean().default(false),
  preguntasReclutamiento: z.array(z.string()).default([]),
})

export type VacanteInput = z.infer<typeof vacanteSchema>

export const contratoSchema = z.object({
  contenido: z
    .string()
    .min(1, 'El contrato no puede estar vacío')
    .refine(
      (val) => val.replace(/<[^>]*>/g, '').length <= 3000,
      'El contrato no puede superar los 3000 caracteres de texto'
    ),
})

export type ContratoInput = z.infer<typeof contratoSchema>
