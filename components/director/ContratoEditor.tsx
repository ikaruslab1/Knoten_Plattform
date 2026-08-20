'use client'

import { useState } from 'react'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Printer } from 'lucide-react'

interface Props {
  vacanteId: string
  initialContent: string
}

export function ContratoEditor({ vacanteId, initialContent }: Props) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const plainTextLength = content.replace(/<[^>]*>/g, '').length
  const overLimit = plainTextLength > 3000

  const save = async () => {
    if (overLimit) {
      setError('El contrato supera los 3,000 caracteres.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('vacantes')
      .update({ contrato_contenido: content })
      .eq('id', vacanteId)

    if (updateError) {
      setError('Error al guardar el contrato.')
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {!showPreview ? (
        <>
          <RichTextEditor
            content={content}
            onChange={setContent}
            maxChars={3000}
          />

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {saved && (
            <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3">
              ¡Contrato guardado correctamente!
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex-1 border border-gray-200 text-gray-700 rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Vista previa
            </button>
            <button
              type="button"
              onClick={save}
              disabled={loading || overLimit}
              className="flex-1 bg-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar contrato'}
            </button>
          </div>
        </>
      ) : (
        /* Print Preview */
        <div>
          <div className="flex items-center justify-between mb-4 no-print">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Volver al editor
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>

          <div
            className="border border-gray-200 rounded-2xl p-10 prose max-w-none"
            style={{ minHeight: '500px' }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </div>
  )
}
