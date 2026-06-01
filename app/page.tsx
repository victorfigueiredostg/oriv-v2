import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ORIV 2.0
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de Registro de Visitas
          </p>
        </div>

        <div className="text-center py-12">
          <p className="text-gray-700 text-xl mb-8">
            Sistema inicializado com sucesso! ✅
          </p>
          <div className="space-y-4">
            <Link
              href="/admin/login"
              className="block bg-indigo-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors max-w-md mx-auto"
            >
              Acesso Gestor (Admin)
            </Link>
            <Link
              href="/health"
              className="block bg-green-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors max-w-md mx-auto"
            >
              🔍 Health Check (Teste)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
