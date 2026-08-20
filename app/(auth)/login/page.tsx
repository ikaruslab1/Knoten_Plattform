import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12">
        <div className="text-white">
          <h1 className="text-5xl font-bold tracking-tighter mb-4">Knoten</h1>
          <p className="text-gray-400 text-lg max-w-xs">
            Plataforma de contratación por proyectos para diseño gráfico transdisciplinario.
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
            <p className="text-gray-500 mt-1">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-black font-medium hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

