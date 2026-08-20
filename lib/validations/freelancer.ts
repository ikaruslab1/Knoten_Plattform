import { z } from 'zod'

const workHistorySchema = z.object({
  id: z.string().optional(),
  rol: z.string().min(1, 'El rol es requerido'),
  empresa: z.string().min(1, 'La empresa es requerida'),
  periodo: z.string().min(1, 'El periodo es requerido'),
  modalidad: z.string().min(1, 'La modalidad es requerida'),
  responsabilidades: z.string().optional(),
})

const certificationSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  entidad: z.string().min(1, 'La entidad es requerida'),
  anio: z.number().min(1990).max(new Date().getFullYear()).optional().nullable(),
  enlace: z.string().url('URL inválida').optional().or(z.literal('')),
})

export const freelancerProfileSchema = z.object({
  resumenProfesional: z.string().min(10, 'El resumen debe tener al menos 10 caracteres').max(1000),
  especialidades: z.array(z.string()).min(1, 'Selecciona al menos una especialidad'),
  nivelExperiencia: z.string().min(1, 'Selecciona tu nivel de experiencia'),
  software: z.array(z.string()).min(1, 'Selecciona al menos un software'),
  habilidadesComplementarias: z.string().optional(),
  historialLaboral: z.array(workHistorySchema).default([]),
  enlacePortafolio: z.string().url('URL de portafolio inválida').optional().or(z.literal('')),
  ultimoGradoEstudios: z.string().min(1, 'El grado de estudios es requerido'),
  certificaciones: z.array(certificationSchema).default([]),
  idiomas: z.array(z.string()).min(1, 'Selecciona al menos un idioma'),
  disponibilidad: z.record(z.string(), z.string()).default({}),
})

export type FreelancerProfileInput = z.infer<typeof freelancerProfileSchema>
export type WorkHistoryInput = z.infer<typeof workHistorySchema>
export type CertificationInput = z.infer<typeof certificationSchema>
