'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/admin', label: 'Dashboard', match: (p: string) => p === '/admin' },
  {
    href: '/admin/relatorios',
    label: 'Relatórios',
    match: (p: string) => p.startsWith('/admin/relatorios'),
  },
  {
    href: '/admin/configuracoes',
    label: 'Configurações',
    match: (p: string) =>
      p.startsWith('/admin/configuracoes') ||
      p.startsWith('/admin/empreendimentos'),
  },
]

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/admin/login')
    }
  }, [status, session, router])

  if (status === 'loading' || !session || session.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-700">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-white md:min-h-screen flex md:flex-col">
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold">ORIV 2.0</h1>
          <p className="text-slate-400 text-sm mt-1">Painel do Gestor</p>
        </div>

        <nav className="flex md:flex-col flex-1 md:flex-none md:px-3 md:space-y-1">
          {NAV.map((item) => {
            const ativo = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 md:flex-none text-center md:text-left px-4 py-4 md:py-3 md:rounded-lg font-medium transition-colors ${
                  ativo
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 md:mt-auto">
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full text-center md:text-left px-4 py-3 rounded-lg font-medium text-red-300 hover:bg-slate-800 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-x-auto">{children}</main>
    </div>
  )
}
