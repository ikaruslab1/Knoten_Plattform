export const EXPERIENCE_LEVELS = [
  'Pasante',
  'Junior',
  'Semi-senior',
  'Senior',
  'Lead',
  'Director de área',
] as const

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]

export const MODALITIES = [
  { value: 'en_linea', label: 'En línea' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
] as const

export const LANGUAGES = [
  'Español',
  'Inglés',
  'Francés',
  'Alemán',
  'Portugués',
  'Italiano',
  'Japonés',
  'Chino Mandarín',
  'Árabe',
  'Coreano',
] as const

export const WORK_MODALITIES = [
  { value: 'en_linea', label: 'En línea' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'freelance', label: 'Freelance' },
] as const

export const DAYS_OF_WEEK = [
  { value: 'lunes', label: 'Lunes', shortLabel: 'Lun' },
  { value: 'martes', label: 'Martes', shortLabel: 'Mar' },
  { value: 'miercoles', label: 'Miércoles', shortLabel: 'Mié' },
  { value: 'jueves', label: 'Jueves', shortLabel: 'Jue' },
  { value: 'viernes', label: 'Viernes', shortLabel: 'Vie' },
  { value: 'sabado', label: 'Sábado', shortLabel: 'Sáb' },
  { value: 'domingo', label: 'Domingo', shortLabel: 'Dom' },
] as const

export const TIME_BLOCKS = [
  { value: 'manana', label: 'Mañana (6–12h)' },
  { value: 'tarde', label: 'Tarde (12–18h)' },
  { value: 'noche', label: 'Noche (18–24h)' },
  { value: 'completo', label: 'Día completo' },
] as const

export const HOURLY_SLOTS = [
  { id: '07:00-08:00', label: '07:00 - 08:00', startHour: '07:00', endHour: '08:00' },
  { id: '08:00-09:00', label: '08:00 - 09:00', startHour: '08:00', endHour: '09:00' },
  { id: '09:00-10:00', label: '09:00 - 10:00', startHour: '09:00', endHour: '10:00' },
  { id: '10:00-11:00', label: '10:00 - 11:00', startHour: '10:00', endHour: '11:00' },
  { id: '11:00-12:00', label: '11:00 - 12:00', startHour: '11:00', endHour: '12:00' },
  { id: '12:00-13:00', label: '12:00 - 13:00', startHour: '12:00', endHour: '13:00' },
  { id: '13:00-14:00', label: '13:00 - 14:00', startHour: '13:00', endHour: '14:00' },
  { id: '14:00-15:00', label: '14:00 - 15:00', startHour: '14:00', endHour: '15:00' },
  { id: '15:00-16:00', label: '15:00 - 16:00', startHour: '15:00', endHour: '16:00' },
  { id: '16:00-17:00', label: '16:00 - 17:00', startHour: '16:00', endHour: '17:00' },
  { id: '17:00-18:00', label: '17:00 - 18:00', startHour: '17:00', endHour: '18:00' },
  { id: '18:00-19:00', label: '18:00 - 19:00', startHour: '18:00', endHour: '19:00' },
  { id: '19:00-20:00', label: '19:00 - 20:00', startHour: '19:00', endHour: '20:00' },
  { id: '20:00-21:00', label: '20:00 - 21:00', startHour: '20:00', endHour: '21:00' },
  { id: '21:00-22:00', label: '21:00 - 22:00', startHour: '21:00', endHour: '22:00' },
] as const

export interface AvailabilityData {
  activeDays: string[]
  slots: Record<string, string[]>
}


export const OFFICE_SPECIALTIES = [
  { value: 'editorial', label: 'Oficina de diseño editorial' },
  { value: 'graficos', label: 'Oficina de gráficos' },
] as const

export const DESIGN_ROLES = [
  'Diseñador gráfico',
  'Diseñador UX/UI',
  'Diseñador editorial',
  'Ilustrador',
  'Fotógrafo',
  'Videógrafo',
  'Animador',
  'Diseñador 3D',
  'Diseñador web',
  'Director de arte',
  'Gestor de diseño',
] as const
