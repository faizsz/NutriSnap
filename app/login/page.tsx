'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('Attempting login with:', email)
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Login result:', result)
      
      if (result.error) {
        console.error('Login error:', result.error)
        // Pesan error yang lebih user-friendly
        if (result.error.message.includes('Invalid login credentials')) {
          setError('Email atau password salah')
        } else if (result.error.message.includes('Email not confirmed')) {
          setError('Email belum dikonfirmasi. Cek inbox Anda.')
        } else {
          setError(result.error.message)
        }
        setLoading(false)
      } else if (result.data.session) {
        console.log('Login successful! Session:', result.data.session)
        // Langsung redirect dengan window.location (hard refresh)
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">🍎</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">NutriSnap</h1>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Masuk</h2>
          <p className="text-gray-600">
            Selamat datang kembali! Masukkan kredensial Anda.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link href="/register" className="text-green-600 hover:text-green-700 font-medium">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
