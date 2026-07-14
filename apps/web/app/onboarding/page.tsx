'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(0) // 0: Physical, 1: About You, 2: Lifestyle
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const [formData, setFormData] = useState({
    tinggi_cm: '',
    berat_kg: '',
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

  const nextStep = () => {
    setError(null)
    if (currentStep === 0) {
      if (!formData.tinggi_cm || !formData.berat_kg) {
        setError('Harap isi tinggi dan berat badan Anda')
        return
      }
      const h = parseFloat(formData.tinggi_cm)
      const w = parseFloat(formData.berat_kg)
      if (h < 100 || h > 250 || w < 30 || w > 300) {
        setError('Tinggi harus 100-250 cm dan Berat harus 30-300 kg')
        return
      }
    } else if (currentStep === 1) {
      if (!formData.tanggal_lahir || !formData.gender) {
        setError('Harap lengkapi tanggal lahir dan jenis kelamin Anda')
        return
      }
    }
    setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => {
    setError(null)
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.activity_level) {
      setError('Harap pilih tingkat aktivitas Anda')
      return
    }

    if (!user) {
      setError('User tidak ditemukan. Silakan login kembali.')
      return
    }

    setLoading(true)

    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          tinggi_cm: parseFloat(formData.tinggi_cm),
          tanggal_lahir: formData.tanggal_lahir,
          gender: formData.gender,
          activity_level: formData.activity_level,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // 2. Insert weight log
      const { error: weightError } = await supabase
        .from('weight_logs')
        .insert({
          user_id: user.id,
          berat_kg: parseFloat(formData.berat_kg),
        })

      if (weightError) throw weightError

      setIsSuccess(true)
      // Wait briefly before redirecting
      await new Promise(resolve => setTimeout(resolve, 2000))
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data')
      setLoading(false)
    }
  }

  if (authLoading || (!user && !isSuccess)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin text-4xl text-primary">🔄</div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-surface-container-lowest dark:bg-inverse-surface/10 rounded-[32px] p-xl text-center space-y-md shadow-xl border border-outline-variant/10">
          <span className="material-symbols-outlined text-primary text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Selamat Datang di NutriSnap</h2>
          <p className="text-on-surface-variant font-body-lg">Menyiapkan dashboard pribadi Anda...</p>
        </div>
      </div>
    )
  }

  const progress = ((currentStep + 1) / 3) * 100

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-body-md transition-colors duration-300">
      {/* Top Header */}
      <header className="bg-transparent flex justify-between items-center w-full px-margin-mobile py-xs max-w-container-max mx-auto h-16 z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">NutriSnap</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-margin-mobile pt-16 pb-12">
        <div className="w-full max-w-lg bg-surface-container-lowest dark:bg-inverse-surface/10 rounded-[32px] p-md sm:p-lg shadow-[0px_8px_32px_rgba(0,0,0,0.06)] border border-outline-variant/20 relative overflow-hidden">
          
          {/* Progress Bar */}
          <div className="mb-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-label-sm font-label-sm text-on-surface-variant">Lengkapi Profil</span>
              <span className="text-label-sm font-label-sm text-primary" id="step-counter">
                Langkah {currentStep + 1} dari 3
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest dark:bg-surface-variant rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {error && (
            <div className="mb-md p-sm bg-error-container text-on-error-container rounded-2xl text-center">
              <p className="text-caption">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-md animate-in fade-in duration-300" onSubmit={(e) => e.preventDefault()}>
            
            {/* Step 1: Physical Data */}
            {currentStep === 0 && (
              <div className="space-y-md">
                <div>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile mb-xs text-on-surface">Data Fisik</h2>
                  <p className="text-on-surface-variant mb-md font-body-md">Kami memerlukan informasi ini untuk menghitung kebutuhan kalori dasar Anda.</p>
                </div>
                <div className="space-y-sm">
                  <div className="group">
                    <label className="block text-label-sm font-label-sm mb-1 text-on-surface" htmlFor="height">Tinggi Badan (cm)</label>
                    <div className="relative">
                      <input 
                        className="w-full h-12 px-4 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary transition-all font-body-md" 
                        id="height" 
                        placeholder="Contoh: 170" 
                        type="number"
                        value={formData.tinggi_cm}
                        onChange={(e) => setFormData({ ...formData, tinggi_cm: e.target.value })}
                        required
                        min="100"
                        max="250"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">cm</span>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-label-sm font-label-sm mb-1 text-on-surface" htmlFor="weight">Berat Badan (kg)</label>
                    <div className="relative">
                      <input 
                        className="w-full h-12 px-4 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary transition-all font-body-md" 
                        id="weight" 
                        placeholder="Contoh: 65" 
                        type="number"
                        step="0.1"
                        value={formData.berat_kg}
                        onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                        required
                        min="30"
                        max="300"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">kg</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: About You */}
            {currentStep === 1 && (
              <div className="space-y-md">
                <div>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile mb-xs text-on-surface">Tentang Anda</h2>
                  <p className="text-on-surface-variant mb-md font-body-md">Detail personal akan membantu menyempurnakan target nutrisi harian Anda.</p>
                </div>
                <div className="space-y-sm">
                  <div>
                    <label className="block text-label-sm font-label-sm mb-1 text-on-surface" htmlFor="birthday">Tanggal Lahir</label>
                    <input 
                      className="w-full h-12 px-4 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary transition-all font-body-md" 
                      id="birthday" 
                      type="date"
                      value={formData.tanggal_lahir}
                      onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      min="1900-01-01"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-label-sm mb-3 text-on-surface">Jenis Kelamin</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        className={`h-12 rounded-xl flex items-center justify-center gap-2 transition-all ${
                          formData.gender === 'pria' 
                            ? 'bg-secondary-container text-on-secondary-container ring-2 ring-primary font-bold' 
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                        }`} 
                        onClick={() => setFormData({ ...formData, gender: 'pria' })}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">male</span>
                        <span>Pria</span>
                      </button>
                      <button 
                        className={`h-12 rounded-xl flex items-center justify-center gap-2 transition-all ${
                          formData.gender === 'wanita' 
                            ? 'bg-secondary-container text-on-secondary-container ring-2 ring-primary font-bold' 
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                        }`} 
                        onClick={() => setFormData({ ...formData, gender: 'wanita' })}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">female</span>
                        <span>Wanita</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Activity Level */}
            {currentStep === 2 && (
              <div className="space-y-md">
                <div>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile mb-xs text-on-surface">Gaya Hidup</h2>
                  <p className="text-on-surface-variant mb-md font-body-md">Seberapa aktif rutinitas harian Anda?</p>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    { value: 'sedentary', label: 'Sangat Jarang Aktif', desc: 'Hampir tidak pernah berolahraga', icon: 'chair' },
                    { value: 'light', label: 'Ringan', desc: 'Olahraga ringan 1-3 kali/minggu', icon: 'directions_walk' },
                    { value: 'moderate', label: 'Sedang', desc: 'Olahraga 3-5 kali/minggu', icon: 'fitness_center' },
                    { value: 'active', label: 'Aktif', desc: 'Olahraga intens hampir setiap hari', icon: 'sports_handball' },
                    { value: 'very_active', label: 'Sangat Aktif', desc: 'Atlet atau pekerjaan fisik berat', icon: 'bolt' },
                  ].map((act) => (
                    <label 
                      key={act.value}
                      onClick={() => setFormData({ ...formData, activity_level: act.value as any })}
                      className={`flex items-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.activity_level === act.value 
                          ? 'border-primary bg-green-50/50' 
                          : 'border-transparent bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 text-primary">
                        <span className="material-symbols-outlined">{act.icon}</span>
                      </div>
                      <div className="text-left">
                        <h4 className="font-label-sm text-on-surface font-semibold">{act.label}</h4>
                        <p className="text-caption text-on-surface-variant">{act.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-4">
              {currentStep > 0 && (
                <button 
                  className="h-14 flex-1 rounded-full border border-outline-variant text-on-surface font-label-sm hover:bg-surface-container-low transition-all" 
                  onClick={prevStep}
                  type="button"
                >
                  Kembali
                </button>
              )}
              {currentStep < 2 ? (
                <button 
                  className="h-14 flex-[2] rounded-full bg-primary text-on-primary font-label-sm shadow-lg hover:shadow-primary/20 active:scale-95 transition-all" 
                  onClick={nextStep}
                  type="button"
                >
                  Lanjutkan
                </button>
              ) : (
                <button 
                  className="h-14 flex-[2] rounded-full bg-primary text-on-primary font-label-sm shadow-lg hover:shadow-primary/20 active:scale-95 transition-all" 
                  onClick={handleSubmit}
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Menyimpan...' : 'Selesai'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>

      {/* Side Decoration (Web Only) */}
      <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 max-w-xs space-y-md pointer-events-none text-left">
        <div className="flex items-center gap-4 text-on-surface opacity-30">
          <div className="w-12 h-[2px] bg-primary"></div>
          <span className="font-label-sm uppercase tracking-widest">Digital Wellness Companion</span>
        </div>
        <h3 className="font-display-lg text-display-lg text-on-surface opacity-10">Precise.<br/>Personal.<br/>Powerful.</h3>
      </div>

      {/* Ambient background decoration */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-primary/10 to-transparent blur-3xl rounded-full"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-1/2 h-1/3 bg-gradient-to-tr from-secondary/5 to-transparent blur-3xl rounded-full"></div>
    </div>
  )
}
