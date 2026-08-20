'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ConfirmClientProps {
  initialVerified: boolean
}

export function ConfirmClient({ initialVerified }: ConfirmClientProps) {
  const [verified, setVerified] = useState(initialVerified)
  const [loginUrl, setLoginUrl] = useState('/login')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check hash or query params if user just arrived from confirmation link
      const hasHashToken = window.location.hash.includes('access_token')
      const hasSuccessParam = window.location.search.includes('verified=true') || window.location.search.includes('type=signup')

      if (hasHashToken || hasSuccessParam) {
        setVerified(true)
      }

      // Check stored signup credentials to auto-fill login URL
      const pendingData = sessionStorage.getItem('knoten_pending_login')
      if (pendingData) {
        try {
          const { email, password } = JSON.parse(pendingData)
          if (email) {
            setLoginUrl(
              `/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password || '')}`
            )
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e4e4e7] shadow-sm overflow-hidden">
        {/* Header Block - Black with white uppercase text */}
        <div className="bg-black py-8 px-6 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-[3px] uppercase">
            KNOTEN
          </h1>
        </div>

        {/* Content Body */}
        <div className="p-8">
          {verified ? (
            <div>
              <h2 className="text-2xl font-bold text-[#09090b] mb-3">
                ¡Correo electrónico confirmado!
              </h2>
              <p className="text-[#52525b] text-sm leading-relaxed mb-6">
                Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión con tus credenciales para acceder a la plataforma.
              </p>

              <div className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-lg p-5 mb-6 text-center">
                <p className="text-xs text-[#71717a] font-semibold uppercase tracking-wider mb-2">
                  Estado de la cuenta
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-xs font-semibold rounded-full">
                  ✓ Verificada y Activa
                </span>
              </div>

              <Link
                href={loginUrl}
                className="block w-full bg-black text-white text-center font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-md hover:bg-zinc-800 transition-colors"
              >
                INICIAR SESIÓN
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-[#09090b] mb-3">
                Revisa tu correo personal
              </h2>
              <p className="text-[#52525b] text-sm leading-relaxed mb-6">
                Te hemos enviado un correo de confirmación. Por favor abre el mensaje con el asunto <strong className="text-[#09090b]">"Confirma tu correo electrónico"</strong> y haz clic en el enlace para activar tu cuenta.
              </p>

              <div className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-lg p-5 mb-6">
                <p className="text-xs text-[#71717a] font-semibold uppercase tracking-wider mb-1">
                  Nota importante
                </p>
                <p className="text-xs text-[#52525b] leading-normal">
                  No podrás iniciar sesión en Knoten hasta que hayas confirmado tu dirección de correo electrónico.
                </p>
              </div>

              <Link
                href={loginUrl}
                className="block w-full bg-black text-white text-center font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-md hover:bg-zinc-800 transition-colors"
              >
                IR AL INICIO DE SESIÓN
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e4e4e7] py-4 text-center">
          <p className="text-[11px] text-[#a1a1aa] uppercase tracking-wider">
            © KNOTEN. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>
      </div>
    </div>
  )
}
