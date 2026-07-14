'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (result.error) {
        if (result.error.message.includes('Invalid login credentials')) {
          setError('Email atau kata sandi salah')
        } else if (result.error.message.includes('Email not confirmed')) {
          setError('Email belum dikonfirmasi. Silakan cek inbox email Anda.')
        } else {
          setError(result.error.message)
        }
        setLoading(false)
      } else if (result.data.session) {
        // Redirect on successful session creation
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin text-4xl text-primary">🔄</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-background relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* Top App Bar */}
      <header className="bg-transparent w-full px-margin-mobile py-xs max-w-container-max mx-auto h-16 flex justify-between items-center z-10 relative">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px]">nutrition</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            NutriSnap
          </h1>
        </Link>
        <Link 
          href="/register" 
          className="px-4 py-2 bg-primary hover:bg-on-primary-fixed-variant text-white font-label-sm rounded-full transition-all shadow-sm active:scale-[0.98]"
        >
          Daftar
        </Link>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-container-max mx-auto px-margin-mobile py-md lg:py-xl grid grid-cols-1 lg:grid-cols-2 gap-lg items-center min-h-[calc(100vh-64px)]">
        
        {/* Left Column: Hero Text & Features */}
        <section className="space-y-md lg:pr-md">
          <div className="space-y-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">lock_open</span>
              Selamat Datang Kembali
            </span>
            <h2 className="font-display-lg text-[40px] leading-[48px] lg:text-display-lg lg:leading-none text-on-surface tracking-tight">
              Hidup Sehat,<br />
              Dimulai dari Foto.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
              Lacak kalori dan nutrisi harian secara instan dengan teknologi visi AI. Cukup snap makanan Anda dan biarkan AI kami melakukan sisanya.
            </p>
          </div>

          {/* Value Badges */}
          <div className="flex flex-wrap gap-sm pt-xs">
            <div className="flex items-center gap-2 bg-surface-container text-on-surface-variant px-3 py-2 rounded-xl">
              <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
              <span className="font-label-sm text-label-sm">AI Scan Presisi</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container text-on-surface-variant px-3 py-2 rounded-xl">
              <span className="material-symbols-outlined text-[20px] text-primary">fitness_center</span>
              <span className="font-label-sm text-label-sm">Log Olahraga</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container text-on-surface-variant px-3 py-2 rounded-xl">
              <span className="material-symbols-outlined text-[20px] text-primary">history</span>
              <span className="font-label-sm text-label-sm">Riwayat Terperinci</span>
            </div>
          </div>

          {/* Visual Decorative Element (Desktop) */}
          <div className="hidden lg:block relative pt-md">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-video w-[480px]">
              <div 
                className="w-full h-full bg-cover bg-center" 
                style={{ 
                  backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCh5DMeucRSDVxLtv3bv5S7gZGtAdnHqjRhXgvKesiQ2y6kDXZl5eueeG8OeeuBHokgotmV9ByxHgWUuaphoVnpbc51g5CafCU0X3-SHK543w61MNUeVmSk4cysY54Z-8t7mSwmwUBo60XvaKt-6yi_DNcHYbBsd1Dth1DsW97GP3sMe0pi0nMDYVxX-e6zyA7fPdU3P0Hn0UyoKszH33z6urldOXv69-KP_864EX4LxyRhgkuK4XXC')" 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm font-bold text-gray-900">Salad Bowl detected</p>
                  <p className="text-[10px] text-gray-600">340 kcal • High Protein</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Login Card Section */}
        <section className="w-full max-w-md lg:ml-auto">
          <div className="bg-surface-container-lowest p-md rounded-[32px] shadow-[0px_8px_40px_rgba(0,0,0,0.08)] border border-surface-container-highest">
            <div className="mb-lg">
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Selamat Datang</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Silakan masuk ke akun NutriSnap Anda</p>
            </div>

            {error && (
              <div className="mb-md p-sm bg-error-container text-on-error-container rounded-2xl text-center">
                <p className="text-caption">{error}</p>
              </div>
            )}

            <form className="space-y-md" onSubmit={handleSubmit}>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant block ml-1" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-200" 
                    id="email" 
                    placeholder="nama@email.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant block ml-1" htmlFor="password">Kata Sandi</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-200" 
                    id="password" 
                    placeholder="••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-xs">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" 
                    type="checkbox"
                  />
                  <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Ingat Saya</span>
                </label>
                <Link className="font-label-sm text-label-sm text-primary hover:underline font-semibold" href="#">Lupa Sandi?</Link>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-on-primary-fixed-variant text-white font-title-md text-title-md rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] duration-200 flex justify-center items-center"
              >
                {loading ? 'Memproses...' : 'Masuk Sekarang'}
              </button>
            </form>

            <div className="relative my-lg">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-container-highest"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface-container-lowest px-4 font-label-sm text-label-sm text-on-surface-variant">atau lanjutkan dengan</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-3 border border-outline-variant rounded-2xl hover:bg-surface-container-low transition-colors"
              >
                <img 
                  alt="Google" 
                  className="w-5 h-5" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn8GeKsXqRu66V4r99sqYnHE0DCmF9TbPfCozjlSj6ThnJLbHgeD_XWl4LkchzLrARChgJ0d8j3knOzEjw80ySmjm8AcgpKaaIr3plMJUr_oTYVbllK0R6TNr7VCYkRKpUzXIugWWlv4cx9wjaDxMbXvboFtQNe8YwJYbWc0ANmhXlnsoKINp4N1AX-_8xhqJzyEYJLvCbxv9x8M-HdXZwaw-l05sroE0d0RdThj26YidQJqSVnkgC"
                />
                <span className="font-label-sm text-label-sm font-semibold">Google</span>
              </button>
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-3 border border-outline-variant rounded-2xl hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>apps</span>
                <span className="font-label-sm text-label-sm font-semibold">Apple</span>
              </button>
            </div>

            <p className="text-center mt-lg font-body-md text-body-md text-on-surface-variant">
              Belum punya akun?{' '}
              <Link className="text-primary font-bold hover:underline" href="/register">
                Daftar NutriSnap
              </Link>
            </p>
          </div>
        </section>
      </main>

      {/* Ambient background blur circles */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  )
}
