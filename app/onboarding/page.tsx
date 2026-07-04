'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    tinggi_cm: '',
    berat_kg: '',
    umur: '',
    gender: '' as 'pria' | 'wanita' | '',
    activity_level: '' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!user) {
      setError('User tidak ditemukan. Silakan login kembali.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tinggi_cm: parseFloat(formData.tinggi_cm),
          berat_kg: parseFloat(formData.berat_kg),
          umur: parseInt(formData.umur),
          gender: formData.gender,
          activity_level: formData.activity_level,
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      // Tunggu sebentar dan redirect
      await new Promise(resolve => setTimeout(resolve, 300))
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">🍎</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">NutriSnap</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Lengkapi Profil Anda
          </h2>
          <p className="text-gray-600">
            Kami butuh info ini untuk menghitung kebutuhan kalori harian Anda
          </p>
        </div>

        {/* Onboarding Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tinggi Badan */}
            <div>
              <label htmlFor="tinggi" className="block text-sm font-medium text-gray-700 mb-1">
                Tinggi Badan (cm)
              </label>
              <input
                id="tinggi"
                type="number"
                value={formData.tinggi_cm}
                onChange={(e) => setFormData({ ...formData, tinggi_cm: e.target.value })}
                required
                min="100"
                max="250"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: 170"
              />
            </div>

            {/* Berat Badan */}
            <div>
              <label htmlFor="berat" className="block text-sm font-medium text-gray-700 mb-1">
                Berat Badan (kg)
              </label>
              <input
                id="berat"
                type="number"
                value={formData.berat_kg}
                onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                required
                min="30"
                max="300"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: 65"
              />
            </div>

            {/* Umur */}
            <div>
              <label htmlFor="umur" className="block text-sm font-medium text-gray-700 mb-1">
                Umur (tahun)
              </label>
              <input
                id="umur"
                type="number"
                value={formData.umur}
                onChange={(e) => setFormData({ ...formData, umur: e.target.value })}
                required
                min="10"
                max="120"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: 25"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kelamin
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'pria' })}
                  className={`p-4 border-2 rounded-lg text-center transition ${
                    formData.gender === 'pria'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-1">👨</div>
                  <div className="font-medium">Pria</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'wanita' })}
                  className={`p-4 border-2 rounded-lg text-center transition ${
                    formData.gender === 'wanita'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-1">👩</div>
                  <div className="font-medium">Wanita</div>
                </button>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tingkat Aktivitas
              </label>
              <select
                value={formData.activity_level}
                onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as any })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Pilih tingkat aktivitas</option>
                <option value="sedentary">Tidak Aktif (jarang olahraga)</option>
                <option value="light">Ringan (olahraga 1-3x/minggu)</option>
                <option value="moderate">Sedang (olahraga 3-5x/minggu)</option>
                <option value="active">Aktif (olahraga 6-7x/minggu)</option>
                <option value="very_active">Sangat Aktif (atlet/pekerjaan fisik berat)</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Menyimpan...' : 'Lanjutkan ke Dashboard'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
