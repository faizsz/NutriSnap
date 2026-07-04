'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import UpdateWeightModal from '@/components/UpdateWeightModal'
import { calculateAge, formatDateIndonesian } from '@/lib/utils'
import { calculateBMR, calculateBMI, getBMICategory, calculateMetabolicRate } from '@/lib/calculations'

interface ProfileData {
  tinggi_cm: number | null
  tanggal_lahir: string | null
  gender: 'pria' | 'wanita' | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
}

interface LatestWeight {
  berat_kg: number
  recorded_at: string
}

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [latestWeight, setLatestWeight] = useState<LatestWeight | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWeightModal, setShowWeightModal] = useState(false)

  const [formData, setFormData] = useState({
    tinggi_cm: '',
    tanggal_lahir: '',
    gender: '' as 'pria' | 'wanita' | '',
    activity_level: '' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '',
  })

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchLatestWeight()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tinggi_cm, tanggal_lahir, gender, activity_level')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        tinggi_cm: data.tinggi_cm?.toString() || '',
        tanggal_lahir: data.tanggal_lahir || '',
        gender: data.gender || '',
        activity_level: data.activity_level || '',
      })
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestWeight = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('berat_kg, recorded_at')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

      setLatestWeight(data)
    } catch (err: any) {
      console.error('Error fetching weight:', err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          tinggi_cm: parseFloat(formData.tinggi_cm),
          tanggal_lahir: formData.tanggal_lahir,
          gender: formData.gender,
          activity_level: formData.activity_level,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Refresh data
      await fetchProfile()
      setEditing(false)
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const getActivityLabel = (level: string) => {
    const labels: Record<string, string> = {
      sedentary: 'Tidak Aktif (jarang olahraga)',
      light: 'Ringan (1-3x/minggu)',
      moderate: 'Sedang (3-5x/minggu)',
      active: 'Aktif (6-7x/minggu)',
      very_active: 'Sangat Aktif (atlet/pekerja fisik)',
    }
    return labels[level] || level
  }

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin text-4xl text-primary">🔄</div>
      </div>
    )
  }

  // Calculate BMI & BMR
  const height = profile?.tinggi_cm || 0
  const weight = latestWeight?.berat_kg || 0
  const bmi = height > 0 && weight > 0 ? calculateBMI(weight, height) : 0
  const bmiCat = bmi > 0 ? getBMICategory(bmi) : '-'
  
  let bmr = 0
  let tdee = 0
  if (height > 0 && weight > 0 && profile?.tanggal_lahir && profile?.gender && profile?.activity_level) {
    const age = calculateAge(profile.tanggal_lahir)
    const rates = calculateMetabolicRate(weight, height, age, profile.gender, profile.activity_level)
    bmr = rates.bmr
    tdee = rates.tdee
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-28 transition-colors duration-300 font-sans">
      
      {/* Top AppBar */}
      <header className="bg-background dark:bg-background border-b border-surface-variant/10 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-margin-mobile py-xs max-w-container-max mx-auto h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">NutriSnap</h1>
          </Link>
          <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
        </div>
      </header>

      <main className="max-w-container-max mx-auto px-margin-mobile mt-lg max-w-lg">
        
        {/* Profile Header Section */}
        <section className="flex flex-col items-center text-center mb-xl">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-inverse-surface shadow-lg mb-sm">
              <img 
                className="w-full h-full object-cover" 
                alt="Amanda Johnson" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuABbgtUf8x-gDAIn_VyH0QR9Y8I7JGjvXhwHVBSd_Opl2_5kwQN1bXu9Ur-5obijpCpmG1QOOQNxj1-0t3Cb69KU1yhngGP3JWgVUTVzwgF8_vhsOcNoA0KUS0lKhZm3Kt8ueinkSt-T6NX8Ktdo65Pbt9eeM99mxjnkLIx9ZsIGTKHxTq4v-w1KrQ_VxJgcGNlzzYcNwDqFO8DMu4BCygudkBNewDNxDBNqZZMuLrYYbRrVUotNQOm"
              />
            </div>
            {!editing && (
              <button 
                onClick={() => setEditing(true)}
                className="absolute bottom-1 right-1 bg-primary text-on-primary rounded-full p-1.5 shadow-md border-2 border-white hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            )}
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Profil Pengguna</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{user?.email}</p>
        </section>

        {error && (
          <div className="mb-md p-sm bg-error-container text-on-error-container rounded-2xl text-center">
            <p className="text-caption">{error}</p>
          </div>
        )}

        {/* Physical Data Cards (Bento Style) */}
        {!editing && (
          <section className="space-y-md">
            <div className="grid grid-cols-2 gap-sm">
              <div className="bg-surface-container-lowest dark:bg-surface-container p-md rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-start border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary mb-2">height</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Tinggi Badan</span>
                <span className="font-title-md text-title-md text-on-surface font-bold">{height > 0 ? `${height} cm` : '-'}</span>
              </div>
              <div className="bg-surface-container-lowest dark:bg-surface-container p-md rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-start border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary mb-2">weight</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Berat Badan</span>
                <span className="font-title-md text-title-md text-on-surface font-bold">{weight > 0 ? `${weight} kg` : '-'}</span>
              </div>
              <div className="bg-surface-container-lowest dark:bg-surface-container p-md rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-start border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary mb-2">monitor_heart</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Indeks Massa Tubuh</span>
                <span className="font-title-md text-title-md text-on-surface font-bold">{bmi > 0 ? `${bmi} (${bmiCat})` : '-'}</span>
              </div>
              <div className="bg-surface-container-lowest dark:bg-surface-container p-md rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-start border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary mb-2">target</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Target TDEE</span>
                <span className="font-title-md text-title-md text-on-surface font-bold">{tdee > 0 ? `${tdee} kkal` : '-'}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowWeightModal(true)}
              className="w-full bg-primary-container text-on-primary-container font-label-sm text-label-sm py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] font-bold"
            >
              <span className="material-symbols-outlined">add</span>
              Update Berat Badan
            </button>

            {/* Settings List */}
            <div className="space-y-sm text-left">
              <h3 className="font-title-md text-title-md text-on-surface px-1 font-bold">Pengaturan Gaya Hidup</h3>
              <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/10">
                
                {/* Activity Level info */}
                <div 
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-between p-md border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">directions_run</span>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface font-semibold">Tingkat Aktivitas</p>
                      <p className="font-caption text-caption text-on-surface-variant">
                        {profile?.activity_level ? getActivityLabel(profile.activity_level) : '-'}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </div>

                {/* Account info */}
                <div className="flex items-center justify-between p-md border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface font-semibold">Keamanan Akun</p>
                      <p className="font-caption text-caption text-on-surface-variant">Kata Sandi &amp; Sesi Aktif</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </div>

                {/* BMR detail */}
                <div className="flex items-center justify-between p-md hover:bg-surface-container-low transition-colors cursor-pointer">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">sync</span>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface font-semibold">Basal Metabolic Rate (BMR)</p>
                      <p className="font-caption text-caption text-on-surface-variant">Kalori dasar istirahat: {bmr > 0 ? `${bmr} kkal` : '-'}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* EDITING MODE */}
        {editing && (
          <form onSubmit={handleSave} className="bg-surface-container-lowest dark:bg-surface-container p-md rounded-3xl border border-outline-variant/20 shadow-[0px_8px_32px_rgba(0,0,0,0.04)] space-y-sm text-left">
            <h3 className="font-title-md text-title-md text-on-surface mb-md font-bold">Edit Parameter Fisik</h3>

            <div>
              <label className="block text-label-sm font-label-sm mb-1 text-on-surface-variant" htmlFor="tinggi">
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
                className="w-full h-12 px-4 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary transition-all font-body-md"
              />
            </div>

            <div>
              <label className="block text-label-sm font-label-sm mb-1 text-on-surface-variant" htmlFor="birthday">
                Tanggal Lahir
              </label>
              <input
                id="birthday"
                type="date"
                value={formData.tanggal_lahir}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                required
                max={new Date().toISOString().split('T')[0]}
                min="1900-01-01"
                className="w-full h-12 px-4 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary transition-all font-body-md"
              />
            </div>

            <div>
              <label className="block text-label-sm font-label-sm mb-2 text-on-surface-variant">
                Jenis Kelamin
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'pria' })}
                  className={`h-12 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    formData.gender === 'pria'
                      ? 'bg-secondary-container text-on-secondary-container ring-2 ring-primary font-bold'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">male</span>
                  <span>Pria</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'wanita' })}
                  className={`h-12 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    formData.gender === 'wanita'
                      ? 'bg-secondary-container text-on-secondary-container ring-2 ring-primary font-bold'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">female</span>
                  <span>Wanita</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-label-sm font-label-sm mb-2 text-on-surface-variant">
                Tingkat Aktivitas
              </label>
              <select
                value={formData.activity_level}
                onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as any })}
                required
                className="w-full h-12 px-4 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary transition-all font-body-md"
              >
                <option value="">Pilih tingkat aktivitas</option>
                <option value="sedentary">Tidak Aktif (jarang olahraga)</option>
                <option value="light">Ringan (olahraga 1-3x/minggu)</option>
                <option value="moderate">Sedang (olahraga 3-5x/minggu)</option>
                <option value="active">Aktif (olahraga 6-7x/minggu)</option>
                <option value="very_active">Sangat Aktif (atlet/pekerjaan fisik berat)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  fetchProfile() // reset form
                }}
                disabled={saving}
                className="flex-1 py-3 border border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-label-sm rounded-full transition-all duration-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-primary text-on-primary hover:opacity-95 font-label-sm rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] duration-200"
              >
                {saving ? 'Menyimpan...' : '💾 Simpan'}
              </button>
            </div>
          </form>
        )}

        {/* Logout Button */}
        <button 
          onClick={handleSignOut}
          className="mt-lg w-full p-md text-error flex items-center justify-center gap-2 hover:bg-error-container/10 rounded-2xl transition-colors font-label-sm text-label-sm border border-error/10"
        >
          <span className="material-symbols-outlined">logout</span>
          Keluar dari Akun
        </button>

      </main>

      <BottomNav />

      <UpdateWeightModal 
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSuccess={() => {
          fetchLatestWeight()
        }}
      />
    </div>
  )
}
