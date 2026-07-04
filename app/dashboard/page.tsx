'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">🍎</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">NutriSnap</h1>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Keluar
          </Button>
        </div>

        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang! 👋
          </h2>
          <p className="text-gray-600">
            Email: <span className="font-medium">{user?.email}</span>
          </p>
        </div>

        {/* Placeholder untuk fitur selanjutnya */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/scan" className="block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Scan Makanan
              </h3>
              <p className="text-gray-600 mb-4">
                Upload foto makanan dan dapatkan analisis kalori otomatis dengan AI
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Mulai Scan
              </Button>
            </div>
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Riwayat Makanan
            </h3>
            <p className="text-gray-600 mb-4">
              Lihat history asupan kalori harian Anda
            </p>
            <Button disabled className="w-full">
              Segera Hadir
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
