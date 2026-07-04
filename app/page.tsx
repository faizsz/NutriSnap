import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">🍎</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">NutriSnap</h1>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button>Daftar</Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-gray-900">
              Lacak Kalori dengan
              <span className="text-green-600"> Foto</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Cukup ambil foto makanan Anda, dan biarkan AI kami menganalisis
              kandungan kalori dan nutrisinya secara otomatis.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center space-x-4">
            <Link href="/register">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Mulai Gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Lihat Demo
              </Button>
            </Link>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-12 bg-gray-200 rounded-2xl h-96 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-6xl">📱</div>
              <p className="text-gray-500">Screenshot App Preview</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Fitur Utama
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">
                Analisis AI
              </h4>
              <p className="text-gray-600">
                Powered by Gemini AI untuk mengenali makanan dan menghitung
                kalori secara akurat dari foto.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">
                Tracking Harian
              </h4>
              <p className="text-gray-600">
                Pantau asupan kalori dan nutrisi Anda setiap hari dengan
                visualisasi yang mudah dipahami.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">
                Target Personal
              </h4>
              <p className="text-gray-600">
                Atur target kalori harian dan dapatkan insight untuk mencapai
                tujuan kesehatan Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-gray-200 text-center text-gray-500">
          <p>&copy; 2026 NutriSnap. Food Calorie Tracker with AI Vision.</p>
        </footer>
      </div>
    </main>
  )
}
