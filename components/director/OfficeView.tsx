'use client'

import Link from 'next/link'
import { OFFICE_TEAMS, OFFICE_SPECIALTIES, type OfficeSpecialty } from '@/lib/constants/roles'
import { Pencil, Users, Mail, Phone, UserCheck, UserPlus, CheckCircle2, Building2, Sparkles, FileText, Printer } from 'lucide-react'

export interface TeamMember {
  id: string
  nombreCompleto: string
  correoInstitucional: string
  telefono: string
}

export interface TeamDetail {
  vacantesCreadas: number
  aceptados: number
  miembros: TeamMember[]
}

interface OfficeData {
  id: string
  nombre: string
  logo_url?: string | null
  especialidad: OfficeSpecialty
  manifiesto?: string | null
  contrato_contenido?: string | null
  equipos?: Record<string, number>
}

interface Props {
  office: OfficeData
  teamStats: Record<string, TeamDetail>
}

export function OfficeView({ office, teamStats }: Props) {
  const especialidadObj = OFFICE_SPECIALTIES.find((s) => s.value === office.especialidad)
  const especialidadLabel = especialidadObj ? especialidadObj.label : office.especialidad

  const teams = OFFICE_TEAMS[office.especialidad] || []
  const equiposMap = office.equipos || {}
  const hasContrato = Boolean(office.contrato_contenido && office.contrato_contenido.trim().length > 0)

  // Calculate total capacity and total accepted
  let totalCapacidad = 0
  let totalAceptados = 0

  teams.forEach((t) => {
    totalCapacidad += Number(equiposMap[t] || 1)
    totalAceptados += teamStats[t]?.aceptados || 0
  })

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'FL'
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-8">
      {/* Cabecera Principal de la Oficina Publicada */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Logo y datos básicos */}
          <div className="flex items-center gap-5">
            {office.logo_url ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 border border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50 p-2.5 shadow-2xs shrink-0">
                <img
                  src={office.logo_url}
                  alt={office.nombre}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-gray-900 to-gray-700 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
                {office.nombre.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-black text-white px-2.5 py-0.5 rounded-full">
                  {especialidadLabel}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Oficina Activa
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                {office.nombre}
              </h1>

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-0.5 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {teams.length} equipos conformados
                </span>
                <span>•</span>
                <span>
                  <strong className="text-gray-900 font-semibold">{totalAceptados}</strong> de{' '}
                  <strong className="text-gray-900 font-semibold">{totalCapacidad}</strong> plazas totales ocupadas
                </span>
              </div>
            </div>
          </div>

          {/* Botón para Editar Oficina */}
          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/director/profile/edit"
              className="inline-flex items-center gap-2 bg-black text-white hover:bg-neutral-800 rounded-2xl px-5 py-3 text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              Editar oficina
            </Link>
          </div>
        </div>
      </div>

      {/* SECCIÓN CONTRATO MARCO DE LA OFICINA */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="w-5 h-5 text-gray-900" />
              <h2 className="text-lg font-bold text-gray-900">
                Contrato marco de la oficina
              </h2>
              {hasContrato ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Contrato redactado y activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                  Pendiente de redacción
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 max-w-2xl">
              {hasContrato
                ? 'Documento oficial de términos, condiciones y cláusulas aplicables a todas las vacantes de tu oficina.'
                : 'Aún no has redactado el contrato único de tu oficina. Las vacantes no podrán publicarse hasta que lo redactes y guardes.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {hasContrato ? (
              <>
                <Link
                  href="/director/profile/contrato"
                  className="inline-flex items-center gap-2 bg-black text-white hover:bg-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar contrato
                </Link>
                <Link
                  href="/director/profile/contrato"
                  className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </Link>
              </>
            ) : (
              <Link
                href="/director/profile/contrato"
                className="inline-flex items-center gap-2 bg-black text-white hover:bg-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Redactar contrato ahora →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Manifiesto de la Oficina */}
      {office.manifiesto && (
        <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles className="w-4 h-4 text-gray-700" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Manifiesto de la oficina
            </h2>
          </div>
          <div
            className="prose prose-sm max-w-none text-gray-700 bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200/60 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: office.manifiesto }}
          />
        </div>
      )}

      {/* SECCIÓN CONFORMACIÓN DE EQUIPOS (A LO ANCHO) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">
                Equipos y miembros de la oficina
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              Distribución de integrantes aceptados y vacantes disponibles por cada equipo.
            </p>
          </div>

          <Link
            href="/director/profile/edit"
            className="text-xs font-semibold text-gray-700 hover:text-black underline underline-offset-4"
          >
            Modificar capacidades →
          </Link>
        </div>

        {/* Tarjetas de equipos: cada uno a lo ancho */}
        <div className="space-y-6">
          {teams.map((teamName, index) => {
            const detail = teamStats[teamName] || { vacantesCreadas: 0, aceptados: 0, miembros: [] }
            const capacity = Number(equiposMap[teamName] || 1)
            const isFull = detail.aceptados >= capacity && capacity > 0
            const emptySlotsCount = Math.max(0, capacity - detail.miembros.length)

            return (
              <div
                key={teamName}
                className={`bg-white border rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 transition-all ${
                  isFull ? 'border-emerald-300 bg-emerald-50/15' : 'border-gray-200/90'
                }`}
              >
                {/* Cabecera del Equipo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2.5 py-0.5 rounded-md">
                        Equipo #{index + 1}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {teamName}
                      </h3>
                      {isFull && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Equipo lleno
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 pt-0.5">
                      <span>
                        <strong className="text-gray-900 font-semibold">{detail.aceptados}</strong> de{' '}
                        <strong className="text-gray-900 font-semibold">{capacity}</strong> plazas ocupadas
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-gray-900 font-semibold">{emptySlotsCount}</strong> {emptySlotsCount === 1 ? 'plaza disponible' : 'plazas disponibles'}
                      </span>
                      <span>•</span>
                      <span className="text-gray-400">
                        {detail.vacantesCreadas} {detail.vacantesCreadas === 1 ? 'vacante publicada' : 'vacantes publicadas'}
                      </span>
                    </div>
                  </div>

                  {/* Badge de Capacidad configurada */}
                  <div className="bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-2 flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs text-gray-500 font-medium">Capacidad:</span>
                    <span className="text-sm font-bold text-gray-900">{capacity} personas</span>
                  </div>
                </div>

                {/* Subsección: Plazas e Integrantes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Plazas e integrantes del equipo
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Integrantes Aceptados */}
                    {detail.miembros.map((miembro) => (
                      <div
                        key={miembro.id}
                        className="bg-white border border-gray-200/90 rounded-2xl p-4.5 space-y-3.5 shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {getInitials(miembro.nombreCompleto)}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-sm font-bold text-gray-900 truncate leading-tight">
                              {miembro.nombreCompleto}
                            </h5>
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-3 h-3" /> Miembro activo
                            </span>
                          </div>
                        </div>

                        {/* Datos de contacto: Correo institucional y Teléfono */}
                        <div className="space-y-1.5 pt-1 border-t border-gray-100 text-xs">
                          <div className="flex items-center gap-2 text-gray-600 bg-gray-50/80 px-2.5 py-1.5 rounded-lg border border-gray-100 truncate">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate font-medium">{miembro.correoInstitucional}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 bg-gray-50/80 px-2.5 py-1.5 rounded-lg border border-gray-100">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="font-medium">{miembro.telefono}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 2. Plazas Disponibles como "Vacante vacía" */}
                    {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => (
                      <div
                        key={`empty-${slotIdx}`}
                        className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-2xl p-4.5 flex flex-col justify-between min-h-[140px] hover:border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-md">
                            Vacante vacía
                          </span>
                        </div>
                        <div className="space-y-1 pt-3">
                          <p className="text-xs font-bold text-gray-700">
                            Puesto #{detail.miembros.length + slotIdx + 1} disponible
                          </p>
                          <p className="text-[11px] text-gray-400 leading-snug">
                            Esperando postulación y aceptación de freelancer para este equipo.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
