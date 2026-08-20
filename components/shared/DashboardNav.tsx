'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface Profile {
  nombre: string
  apellido_paterno: string
  rol: string
}

interface Props {
  profile: Profile
}

const freelancerLinks = [
  { href: '/freelancer/profile', label: 'Mi perfil' },
  { href: '/freelancer/vacantes', label: 'Vacantes' },
  { href: '/freelancer/postulaciones', label: 'Mis postulaciones' },
]

const directorLinks = [
  { href: '/director/profile', label: 'Mi oficina' },
  { href: '/director/vacantes', label: 'Vacantes' },
  { href: '/director/postulaciones', label: 'Postulaciones' },
]

export function DashboardNav({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = profile.rol === 'freelancer' ? freelancerLinks : directorLinks

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            Knoten
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {profile.nombre} {profile.apellido_paterno}
            </span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 border border-gray-200 rounded-lg px-3 py-1.5"
            >
              {loggingOut ? '...' : 'Salir'}
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-500"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
