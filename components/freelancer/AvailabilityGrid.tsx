'use client'

import { DAYS_OF_WEEK, HOURLY_SLOTS } from '@/lib/constants/roles'
import { parseDisponibilidad, type AvailabilityParsed } from '@/lib/validations/freelancer'
import { Calendar, Clock } from 'lucide-react'

interface Props {
  value: any
  onChange?: (val: AvailabilityParsed) => void
  readOnly?: boolean
}

function getContiguousBlockRange(currentSlotId: string, daySlots: string[]): { start: string; end: string } {
  if (!daySlots || daySlots.length === 0) return { start: '', end: '' }

  const selectedIndices = daySlots
    .map((id) => HOURLY_SLOTS.findIndex((s) => s.id === id))
    .filter((idx) => idx !== -1)
    .sort((a, b) => a - b)

  const currentIndex = HOURLY_SLOTS.findIndex((s) => s.id === currentSlotId)
  if (currentIndex === -1 || !selectedIndices.includes(currentIndex)) {
    const slot = HOURLY_SLOTS.find((s) => s.id === currentSlotId)
    return { start: slot?.startHour || '', end: slot?.endHour || '' }
  }

  let startIdx = currentIndex
  while (startIdx > 0 && selectedIndices.includes(startIdx - 1)) {
    startIdx--
  }

  let endIdx = currentIndex
  while (endIdx < HOURLY_SLOTS.length - 1 && selectedIndices.includes(endIdx + 1)) {
    endIdx++
  }

  return {
    start: HOURLY_SLOTS[startIdx].startHour,
    end: HOURLY_SLOTS[endIdx].endHour,
  }
}

export function AvailabilityGrid({ value, onChange, readOnly = false }: Props) {
  const parsed: AvailabilityParsed = parseDisponibilidad(value)
  const activeDaysSet = new Set(parsed.activeDays)

  const toggleDay = (dayValue: string) => {
    if (readOnly || !onChange) return
    const newActiveDays = activeDaysSet.has(dayValue)
      ? parsed.activeDays.filter((d) => d !== dayValue)
      : [...parsed.activeDays, dayValue]

    const newSlots = { ...parsed.slots }
    if (!activeDaysSet.has(dayValue) && (!newSlots[dayValue] || newSlots[dayValue].length === 0)) {
      newSlots[dayValue] = []
    }

    onChange({
      activeDays: newActiveDays,
      slots: newSlots,
    })
  }

  const toggleSlot = (dayValue: string, slotId: string) => {
    if (readOnly || !onChange) return
    if (!activeDaysSet.has(dayValue)) return // Day must be active first

    const currentSlots = parsed.slots[dayValue] || []
    const isSelected = currentSlots.includes(slotId)
    const updatedSlotsForDay = isSelected
      ? currentSlots.filter((id) => id !== slotId)
      : [...currentSlots, slotId]

    onChange({
      activeDays: parsed.activeDays,
      slots: {
        ...parsed.slots,
        [dayValue]: updatedSlotsForDay,
      },
    })
  }

  const toggleAllSlotsForDay = (dayValue: string) => {
    if (readOnly || !onChange || !activeDaysSet.has(dayValue)) return
    const currentSlots = parsed.slots[dayValue] || []
    const allSlotIds = HOURLY_SLOTS.map((s) => s.id)
    const isAllSelected = allSlotIds.every((id) => currentSlots.includes(id))

    onChange({
      activeDays: parsed.activeDays,
      slots: {
        ...parsed.slots,
        [dayValue]: isAllSelected ? [] : allSlotIds,
      },
    })
  }

  const selectWeekdays = () => {
    if (readOnly || !onChange) return
    const weekdays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
    const newActive = Array.from(new Set([...parsed.activeDays, ...weekdays]))
    onChange({
      activeDays: newActive,
      slots: parsed.slots,
    })
  }

  const selectAllDays = () => {
    if (readOnly || !onChange) return
    const allDays = DAYS_OF_WEEK.map((d) => d.value)
    onChange({
      activeDays: allDays,
      slots: parsed.slots,
    })
  }

  const deactivateAll = () => {
    if (readOnly || !onChange) return
    onChange({
      activeDays: [],
      slots: {},
    })
  }

  return (
    <div className="space-y-5">
      {/* EDIT MODE: Day Activation & Presets Bar */}
      {!readOnly && (
        <div className="space-y-4 bg-gray-50/90 p-4 rounded-2xl border border-gray-200/80">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-black" />
              1. Activa los días laborables
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Haz clic en cada día para activar o desactivar su columna de bloques horarios.
            </p>
          </div>

          {/* Presets - Placed ABOVE the days buttons */}
          <div className="flex items-center gap-2 flex-wrap pb-1 border-b border-gray-200/60">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
              Selección rápida:
            </span>
            <button
              type="button"
              onClick={selectWeekdays}
              className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-2xs cursor-pointer"
            >
              Lun - Vie
            </button>
            <button
              type="button"
              onClick={selectAllDays}
              className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-2xs cursor-pointer"
            >
              Todos los días
            </button>
            <button
              type="button"
              onClick={deactivateAll}
              className="text-xs bg-white hover:bg-red-50 text-red-600 font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-2xs cursor-pointer"
            >
              Desactivar todos
            </button>
          </div>

          {/* Days Activation Buttons (High Contrast & Noticeable Difference) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isActive = activeDaysSet.has(day.value)
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-black text-white border-2 border-black shadow-md scale-[1.02]'
                      : 'bg-gray-100/80 text-gray-400 border-2 border-dashed border-gray-300 opacity-60 hover:opacity-100 hover:border-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <span>{day.shortLabel}</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      isActive ? 'bg-white text-black' : 'bg-gray-300/60 text-gray-500'
                    }`}
                  >
                    {isActive ? '✓' : '✕'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 2D MATRIX GRID / CHART */}
      {readOnly ? (
        /* PUBLISHED PROFILE MODE: Borderless, Gapless 2D Matrix Chart - No Vertical Scroll on Desktop */
        <div className="overflow-x-auto overflow-y-hidden md:overflow-visible pt-6 pb-2">
          <table className="w-full border-collapse border-0 text-left min-w-[500px] md:min-w-full">
            <thead>
              <tr>
                {/* Y-Axis Label Header */}
                <th className="p-0 pb-2 w-16 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider border-0">
                  Hora
                </th>
                {/* X-Axis Header: Abbreviated Day Names */}
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day.value} className="p-0 pb-2 text-center text-xs font-bold text-gray-700 border-0">
                    {day.shortLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURLY_SLOTS.map((slot) => (
                <tr key={slot.id} className="border-0">
                  {/* Y-Axis Hour Label (only starting hour: e.g., 07:00, 08:00) */}
                  <td className="p-0 py-1 text-center text-[11px] font-medium text-gray-400 border-0 shrink-0 select-none pr-2">
                    {slot.startHour}
                  </td>

                  {/* Matrix Cells: Edge-to-edge touching blocks with NO borders/gaps */}
                  {DAYS_OF_WEEK.map((day) => {
                    const isActive = activeDaysSet.has(day.value)
                    const daySlots = parsed.slots[day.value] || []
                    const isSelected = isActive && daySlots.includes(slot.id)
                    const range = getContiguousBlockRange(slot.id, daySlots)
                    const hoverTitle = isSelected
                      ? `${day.label}: ${range.start} - ${range.end}`
                      : `${day.label} ${slot.startHour}: No disponible`

                    return (
                      <td key={`${day.value}-${slot.id}`} className="p-0 border-0 align-middle">
                        <div
                          className={`relative group w-full h-7 transition-colors ${
                            isSelected ? 'bg-black cursor-pointer' : 'bg-gray-200/80'
                          }`}
                          title={hoverTitle}
                        >
                          {isSelected && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                              <div className="bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xl border border-gray-800">
                                <span className="font-bold">{day.label}:</span> {range.start} - {range.end}
                              </div>
                              <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* EDIT MODE: Interactive 2D Matrix Grid - No Vertical Scroll on Desktop */
        <div className="border border-gray-200 rounded-2xl bg-white">
          <div className="overflow-x-auto overflow-y-hidden md:overflow-visible pt-6 pb-2 rounded-2xl">
            <table className="w-full border-collapse text-left min-w-[550px] md:min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {/* Y-Axis Label Header */}
                  <th className="py-3 px-3 w-20 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200 shrink-0">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>Hora</span>
                    </div>
                  </th>
                  {/* X-Axis Header: Abbreviated Day Names */}
                  {DAYS_OF_WEEK.map((day) => {
                    const isActive = activeDaysSet.has(day.value)
                    const daySlots = parsed.slots[day.value] || []
                    const isAllSelected =
                      isActive && HOURLY_SLOTS.every((s) => daySlots.includes(s.id))

                    return (
                      <th
                        key={day.value}
                        className={`py-3 px-2 text-center border-r border-gray-200 last:border-r-0 transition-colors ${
                          isActive ? 'bg-white' : 'bg-gray-100/80 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span
                            className={`text-xs font-extrabold uppercase ${
                              isActive ? 'text-black' : 'text-gray-400'
                            }`}
                          >
                            {day.shortLabel}
                          </span>
                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => toggleAllSlotsForDay(day.value)}
                              className="text-[10px] text-gray-500 hover:text-black font-medium underline cursor-pointer"
                            >
                              {isAllSelected ? 'Limpiar' : 'Todo'}
                            </button>
                          ) : (
                            <span className="text-[9px] text-gray-400 uppercase font-semibold">
                              OFF
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {HOURLY_SLOTS.map((slot, rowIdx) => (
                  <tr
                    key={slot.id}
                    className={`border-b border-gray-100 last:border-b-0 ${
                      rowIdx % 2 === 1 ? 'bg-gray-50/20' : ''
                    }`}
                  >
                    {/* Y-Axis Row Label: Hour starting format (07:00, 08:00, etc.) */}
                    <td className="py-2.5 px-3 text-center border-r border-gray-200 bg-gray-50/60 text-[11px] font-semibold text-gray-600 tracking-tight shrink-0 select-none">
                      {slot.startHour}
                    </td>

                    {/* X-Axis Cells for each Day */}
                    {DAYS_OF_WEEK.map((day) => {
                      const isActive = activeDaysSet.has(day.value)
                      const daySlots = parsed.slots[day.value] || []
                      const isSelected = isActive && daySlots.includes(slot.id)
                      const range = getContiguousBlockRange(slot.id, daySlots)
                      const hoverTitle = isSelected
                        ? `${day.label}: ${range.start} - ${range.end}`
                        : `${day.label} ${slot.startHour}: ${isActive ? 'No seleccionado' : 'Día no activado'}`

                      return (
                        <td
                          key={`${day.value}-${slot.id}`}
                          className="p-1 border-r border-gray-100 last:border-r-0 text-center align-middle"
                        >
                          <div
                            onClick={() => !readOnly && isActive && toggleSlot(day.value, slot.id)}
                            className={`relative group h-8 rounded-lg flex items-center justify-center transition-all select-none ${
                              isSelected
                                ? 'bg-black text-white shadow-xs cursor-pointer'
                                : isActive
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-400 cursor-pointer hover:scale-[0.98]'
                                : 'bg-gray-100/50 opacity-40 cursor-not-allowed'
                            }`}
                            title={hoverTitle}
                          >
                            {isSelected && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                                <div className="bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xl border border-gray-800">
                                  <span className="font-bold">{day.label}:</span> {range.start} - {range.end}
                                </div>
                                <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPLANATION OF COLORS - Placed at the VERY BOTTOM */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 pt-2 px-1 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-black inline-block shadow-2xs" />
            <span className="font-semibold text-gray-900">Bloque seleccionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-gray-200 border border-gray-300 inline-block" />
            <span className="text-gray-500">No seleccionado / Día inactivo</span>
          </div>
        </div>
        {!readOnly && (
          <p className="text-xs text-gray-400 italic">
            * Selecciona manualmente las horas disponibles (07:00 a 22:00)
          </p>
        )}
      </div>
    </div>
  )
}
