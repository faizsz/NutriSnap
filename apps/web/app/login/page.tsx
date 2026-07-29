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
      
      {/* ----------------- DESKTOP LAYOUT (Stitch) ----------------- */}
      <div className="hidden lg:block min-h-screen">
        {/* TopNavBar */}
        <nav className="fixed top-0 left-0 right-0 h-16 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-gutter max-w-full mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
            <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">NutriSnap</span>
          </Link>
          <div className="flex items-center gap-8">
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" href="#features">Features</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" href="#how-it-works">How it Works</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" href="#pricing">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/register" className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label-sm text-label-sm hover:bg-primary/90 transition-all shadow-sm active:scale-95">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen pt-16 flex items-center overflow-hidden">
          {/* Background Asset */}
          <div className="absolute inset-0 z-0">
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAE7LzCwGxCx0MLWAcojleAZ0TInGDq-j3-rpuwhtQ7E8qUxmQ2NX4E5-kABhtQIjsLEYgm8IPcThCc9HsHUKz-UPaP7AGnkqD_iZ5RbERezqmtFZAhpI_ta7zqUSPLQWwOItgLizmOnQfdMcEtwsfMs10SSHtNkiSclGYPeuKMLYP_eKoaal8IJDMeFG1gvPQIyj-xRCgHxU5SIlfH-aiw4EDT3wDLRl1PFn87gwblmofCzx5SxrZu')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
          </div>
          <div className="container-max mx-auto px-margin-desktop relative z-10 grid grid-cols-12 gap-gutter">
            <div className="col-span-7 py-xl flex flex-col justify-center">
              <span className="inline-block self-start px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm mb-6">
                New: AI-Vision v2.0
              </span>
              <h1 className="font-display-lg text-display-lg text-on-surface mb-6 leading-[1.1] tracking-tight">
                Scan Your Food, <br/>
                <span className="text-primary">AI Tracks Your Health</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-xl">
                Experience the future of nutrition. No more manual logging. Just snap a photo, and our advanced AI instantly analyzes macros, vitamins, and calories.
              </p>
              <div className="flex items-center gap-4 mb-8">
                <Link href="/register" className="bg-primary text-on-primary px-8 py-4 rounded-xl font-label-sm text-label-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5">
                  Get Started for Free
                </Link>
              </div>
              <div className="flex items-center gap-4 border-t border-outline-variant/30 pt-6">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAkNTu6dSvlnPw-hMPFn9Q_e1SxkGyHTg1hyOQb8Fei11cfba2yx_-k5KN0bwB5h2rBaxRFLCI1ruD8vpHF3hrn51kJbpx9XcZRt3ChdDnFs8TlOv5BQqcLu0Lp8A24OV6CyzJKKgf7_TIqNyMg6M1i71hR9EdCqUgCCK_3diULXzbe7-r5I6PktEZGlfbCngPnAP6-UClg2OjtvWQt-XsXDMkSYlgSWnO_cFSpI9kYbo9BkKGzg35V')" }}></div>
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB_nq0K4wAhKWaDHGgcs6ooYsdlkt7FDLixbBZLDS77DNq0AGlL8bZOOFmBPboAQ_QQEq_Dyzepauz19UEFDVnTmgEfjSR-kcYhTr3nx2J4rrlSParOZg2kNNVp0iAV7Ul80qP5JmMtVl8mVMxl71tRdNtbLbWpHaxeu4TOi5mQY3zAOZz4CldFWn3GaeOxYm5lhWFSN-ZpgX0iEJFuHKQVqgQwk9mNguJitUPr5SRjzSy8L6XU0QPe')" }}></div>
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDWdORq-SBeiH9njq8eRLgld5mPcHRQ58xMrGDSDepHsS62ISah8-LZgQzdiZiTW2AuUw4-Kj72NzkQw4eaunfp3UExjbH630GRF40jn10D62Gd_9ySNtXfQZZq_M2xWwWbwaWkK22kSVO6d4FuH1YM3nzv0Zbed7aHRf05UOL2lfUKDNap3Oa8-oWnEYVuFEL_I6sGrl8a2eO9kBkETFa9iRcnJKlSI4WtSAFDwGCAdVEtbo0Ot0av')" }}></div>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm font-bold text-on-surface">15k+ Active Users</p>
                  <div className="flex text-primary">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="col-span-5 flex items-center justify-center">
              <div className="bg-surface/80 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-2xl w-full max-w-md shadow-emerald-500/10">
                <div className="mb-6">
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Welcome Back</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Log in to track your lunch</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl text-center text-xs">
                    <p>{error}</p>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Email</label>
                    <input 
                      className="w-full bg-surface-container-low border-0 focus:ring-2 focus:ring-primary rounded-lg p-3 text-body-md" 
                      placeholder="name@example.com" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Password</label>
                    <input 
                      className="w-full bg-surface-container-low border-0 focus:ring-2 focus:ring-primary rounded-lg p-3 text-body-md" 
                      placeholder="••••••••" 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-label-sm text-label-sm hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                  >
                    {loading ? 'Logging In...' : 'Log In'}
                  </button>
                </form>
                
                <div className="mt-6 flex items-center justify-center gap-4">
                  <div className="h-px bg-outline-variant/30 flex-1"></div>
                  <span className="text-label-sm text-on-surface-variant text-xs">or continue with</span>
                  <div className="h-px bg-outline-variant/30 flex-1"></div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 py-2.5 border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors text-xs font-semibold">
                    <img alt="Google" className="w-4 h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKFCpA3EOBN7OH4zYHSNIi7wylors5KhmzernPSNkNyR0WlfXuUFfqjusxCQoPGZed1eU7QqLLQZd3YS_3rzy7gyJRSCgq29z3bDd0f4au-iMymvzhjqDzOqzVt9pkWYDTbH061ym5S99AP9iDkNhSGkP-Sk6o9uz7LSnEMsKPuj2YPzNMyj-XdzjzgP0J_mMo0i2qUvE1sZ2nLKDjsRy8SGwBUw8L3wbtETArCUimeJ2s5MlmSMt5"/>
                    <span>Google</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2.5 border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors text-xs font-semibold">
                    <span className="material-symbols-outlined text-[18px]">apps</span>
                    <span>Apple</span>
                  </button>
                </div>

                <p className="text-center mt-6 font-body-md text-body-md text-on-surface-variant text-sm">
                  Belum punya akun?{' '}
                  <Link className="text-primary font-bold hover:underline" href="/register">
                    Daftar NutriSnap
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ----------------- MOBILE LAYOUT (Preserved) ----------------- */}
      <div className="lg:hidden">
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
        <main className="max-w-container-max mx-auto px-margin-mobile py-md grid grid-cols-1 gap-lg items-center min-h-[calc(100vh-64px)]">
          {/* Hero Text & Features */}
          <section className="space-y-md">
            <div className="space-y-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                Selamat Datang Kembali
              </span>
              <h2 className="font-display-lg text-[40px] leading-[48px] text-on-surface tracking-tight">
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
          </section>

          {/* Login Card Section */}
          <section className="w-full max-w-md mx-auto">
            <div className="bg-surface-container-lowest p-md rounded-[32px] shadow-[0px_8px_40px_rgba(0,0,0,0.08)] border border-surface-container-highest">
              <div className="mb-6">
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Selamat Datang</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Silakan masuk ke akun NutriSnap Anda</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-2xl text-center text-xs">
                  <p>{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant block ml-1" htmlFor="email-mobile">Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-200" 
                      id="email-mobile" 
                      placeholder="nama@email.com" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant block ml-1" htmlFor="password-mobile">Kata Sandi</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-200" 
                      id="password-mobile" 
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

              <div className="relative my-6">
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

              <p className="text-center mt-6 font-body-md text-body-md text-on-surface-variant">
                Belum punya akun?{' '}
                <Link className="text-primary font-bold hover:underline" href="/register">
                  Daftar NutriSnap
                </Link>
              </p>
            </div>
          </section>
        </main>
      </div>

      {/* Ambient background blur circles */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  )
}
