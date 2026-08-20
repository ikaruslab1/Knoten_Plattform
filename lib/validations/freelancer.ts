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

export interface EstudioItem {
  tipo: 'Técnico' | 'Licenciatura'
  seleccionado: boolean
  estado: 'en_curso' | 'terminado'
  carrera: string
}

export const estudioItemSchema = z.object({
  tipo: z.enum(['Técnico', 'Licenciatura']),
  seleccionado: z.boolean().default(false),
  estado: z.enum(['en_curso', 'terminado']).default('terminado'),
  carrera: z.string().optional().default(''),
})

export function parseEstudios(val: any): EstudioItem[] {
  const defaultEstudios: EstudioItem[] = [
    { tipo: 'Técnico', seleccionado: false, estado: 'terminado', carrera: '' },
    { tipo: 'Licenciatura', seleccionado: false, estado: 'terminado', carrera: '' },
  ]

  if (!val) return defaultEstudios

  let items: any[] = []
  if (Array.isArray(val)) {
    items = val
  } else if (typeof val === 'string' && val.trim().startsWith('[')) {
    try {
      items = JSON.parse(val)
    } catch {
      items = []
    }
  } else if (typeof val === 'string' && val.trim()) {
    const text = val.trim()
    const isTecnico = text.toLowerCase().includes('técnico') || text.toLowerCase().includes('tecnico')
    return [
      { tipo: 'Técnico', seleccionado: isTecnico, estado: 'terminado', carrera: text },
      { tipo: 'Licenciatura', seleccionado: !isTecnico, estado: 'terminado', carrera: !isTecnico ? text : '' },
    ]
  }

  const tecnicoItem = items.find((i) => i.tipo === 'Técnico')
  const licenciaturaItem = items.find((i) => i.tipo === 'Licenciatura')

  return [
    {
      tipo: 'Técnico',
      seleccionado: Boolean(tecnicoItem?.seleccionado),
      estado: tecnicoItem?.estado === 'en_curso' ? 'en_curso' : 'terminado',
      carrera: tecnicoItem?.carrera || '',
    },
    {
      tipo: 'Licenciatura',
      seleccionado: Boolean(licenciaturaItem?.seleccionado),
      estado: licenciaturaItem?.estado === 'en_curso' ? 'en_curso' : 'terminado',
      carrera: licenciaturaItem?.carrera || '',
    },
  ]
}

export interface AvailabilityParsed {
  activeDays: string[]
  slots: Record<string, string[]>
}

export function parseDisponibilidad(val: any): AvailabilityParsed {
  const defaultRes: AvailabilityParsed = { activeDays: [], slots: {} }
  if (!val) return defaultRes

  let data = val
  if (typeof val === 'string') {
    try {
      data = JSON.parse(val)
    } catch {
      return defaultRes
    }
  }

  if (typeof data !== 'object' || data === null) return defaultRes

  // Check if it already has activeDays & slots structure
  if (Array.isArray(data.activeDays) && typeof data.slots === 'object' && data.slots !== null) {
    return {
      activeDays: data.activeDays.map(String),
      slots: data.slots,
    }
  }

  // Legacy format conversion: e.g. { "lunes": "manana" }
  const activeDays: string[] = []
  const slots: Record<string, string[]> = {}

  const dayKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

  const mananaSlots = ['07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00']
  const tardeSlots = ['12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00']
  const nocheSlots = ['18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00']
  const completoSlots = [...mananaSlots, ...tardeSlots, ...nocheSlots]

  for (const day of dayKeys) {
    const rawVal = data[day]
    if (!rawVal) continue

    if (Array.isArray(rawVal)) {
      activeDays.push(day)
      slots[day] = rawVal.map(String)
    } else if (typeof rawVal === 'string' && rawVal.trim()) {
      activeDays.push(day)
      if (rawVal === 'manana') slots[day] = mananaSlots
      else if (rawVal === 'tarde') slots[day] = tardeSlots
      else if (rawVal === 'noche') slots[day] = nocheSlots
      else if (rawVal === 'completo') slots[day] = completoSlots
      else slots[day] = [rawVal]
    }
  }

  return { activeDays, slots }
}

export const freelancerProfileSchema = z.object({
  resumenProfesional: z.string().superRefine((val, ctx) => {
    const plainText = (val || '').replace(/<[^>]*>/g, '').trim()
    if (plainText.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El resumen debe tener al menos 10 caracteres',
      })
    } else if (plainText.length > 700) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El resumen no debe exceder 700 caracteres',
      })
    }
  }),
  especialidades: z.array(z.string()).min(1, 'Selecciona al menos una especialidad'),
  nivelExperiencia: z.string().min(1, 'Selecciona tu nivel de experiencia'),
  software: z.array(z.string()).min(1, 'Selecciona al menos un software'),
  habilidadesComplementarias: z.union([z.array(z.string()), z.string()]).optional(),
  historialLaboral: z.array(workHistorySchema).default([]),
  enlacePortafolio: z.string().url('URL de portafolio inválida').optional().or(z.literal('')),
  ultimoGradoEstudios: z.union([
    z.array(estudioItemSchema).refine(
      (items) => items.some((item) => item.seleccionado && item.carrera && item.carrera.trim().length > 0),
      { message: 'Selecciona al menos un grado de estudios y especifica la carrera' }
    ),
    z.string().min(1, 'El grado de estudios es requerido'),
  ]),
  certificaciones: z.array(certificationSchema).default([]),
  idiomas: z.array(z.string()).min(1, 'Selecciona al menos un idioma'),
  disponibilidad: z.any().default({ activeDays: [], slots: {} }),
})

export type FreelancerProfileInput = z.infer<typeof freelancerProfileSchema>
export type WorkHistoryInput = z.infer<typeof workHistorySchema>
export type CertificationInput = z.infer<typeof certificationSchema>


