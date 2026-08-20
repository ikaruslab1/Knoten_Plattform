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
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
] as const

export const TIME_BLOCKS = [
  { value: 'manana', label: 'Mañana (6–12h)' },
  { value: 'tarde', label: 'Tarde (12–18h)' },
  { value: 'noche', label: 'Noche (18–24h)' },
  { value: 'completo', label: 'Día completo' },
] as const

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
