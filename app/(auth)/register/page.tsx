import { RegisterForm } from '@/components/auth/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12">
        <div className="text-white">
          <h1 className="text-5xl font-bold tracking-tighter mb-4">Knoten</h1>
          <p className="text-gray-400 text-lg max-w-xs">
            Conecta tu talento en diseño gráfico con proyectos que importan.
          </p>
        </div>
      </div>

      {/* Right: Register Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
            <p className="text-gray-500 mt-1">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-black font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
