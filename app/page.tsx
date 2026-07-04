'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) {
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
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px]">nutrition</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            NutriSnap
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="px-4 py-2 text-primary font-label-sm hover:bg-primary/5 rounded-full transition-colors"
          >
            Masuk
          </Link>
          <Link 
            href="/register" 
            className="px-4 py-2 bg-primary hover:bg-on-primary-fixed-variant text-white font-label-sm rounded-full transition-all shadow-sm active:scale-[0.98]"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-container-max mx-auto px-margin-mobile py-md lg:py-xl grid grid-cols-1 lg:grid-cols-2 gap-lg items-center min-h-[calc(100vh-64px)]">
        
        {/* Left Column: Hero Text & Features */}
        <section className="space-y-md lg:pr-md">
          <div className="space-y-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              AI Vision Calorie Tracker
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

        {/* Right Column: Interactive CTA Card */}
        <section className="w-full max-w-md lg:ml-auto">
          <div className="bg-surface-container-lowest p-md rounded-[32px] shadow-[0px_8px_40px_rgba(0,0,0,0.08)] border border-surface-container-highest flex flex-col justify-center text-center space-y-md">
            <div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Mulai Hidup Sehat</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Lacak makanan Anda dan estimasi kalori harian Anda secara otomatis.
              </p>
            </div>

            <div className="space-y-sm">
              <Link 
                href="/register" 
                className="w-full block py-4 bg-primary hover:bg-on-primary-fixed-variant text-white font-title-md rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] duration-200 text-center"
              >
                Mulai Gratis Sekarang
              </Link>
              <Link 
                href="/login" 
                className="w-full block py-4 border border-outline text-primary hover:bg-surface-container-low font-title-md rounded-full transition-all active:scale-[0.98] duration-200 text-center"
              >
                Masuk ke Akun
              </Link>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-surface-container-highest"></div>
              <span className="flex-shrink mx-4 text-on-surface-variant font-label-sm">NutriSnap AI</span>
              <div className="flex-grow border-t border-surface-container-highest"></div>
            </div>

            <p className="font-caption text-caption text-on-surface-variant">
              Dengan mendaftar, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
            </p>
          </div>
        </section>
      </main>

      {/* Mobile Slider Decor */}
      <section className="lg:hidden w-full px-margin-mobile pb-xl">
        <div className="relative rounded-[32px] overflow-hidden h-64 shadow-xl">
          <div 
            className="w-full h-full bg-cover bg-center" 
            style={{ 
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuChV6PT-eXn9HtXe77HhvFppgAs0ftVDW8BD287BRxgxQJeS5W7o2CyQXCI_rHxaGvZ6DTJcPbUfDEuSxdYVYDTHhHBsENcRfclkBA0GUxBaWcmS30qBCR0xGXKIoybuU2LWrCIuNG_LEYoZNy78oUIjNNuogvqJuKJJU32G4rxPMwIG7NUNFErrsDVzK0YD9Pl9eQ_vsKvY6k6QVVV8sTq7_OoCdhgF7gp6tBu2bnXacyxWWn5uMHN')" 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white text-left">
            <p className="font-headline-lg-mobile text-headline-lg-mobile font-bold">Hidup Sehat,</p>
            <p className="font-title-md text-title-md opacity-90">Dimulai dari piring Anda.</p>
          </div>
        </div>
      </section>

      {/* Ambient background blur circles */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  )
}
