'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, user, loading: authLoading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
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

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    if (!agreeTerms) {
      setError('Anda harus menyetujui Ketentuan Layanan')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password)
      
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // Wait briefly for trigger/session propagation
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.href = '/onboarding'
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
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
    <div className="min-h-screen bg-background dark:bg-inverse-surface flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle Atmospheric Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[5%] w-[35%] h-[35%] rounded-full bg-primary/10 blur-[100px]"></div>
      </div>

      <main className="w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Brand Header */}
        <header className="flex flex-col items-center mb-lg">
          <Link href="/" className="flex items-center gap-xs mb-xs hover:opacity-85 transition-opacity">
            <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary dark:text-inverse-primary tracking-tight">
              NutriSnap
            </h1>
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant text-center px-md">
            Mulai langkah hidup sehat Anda hari ini secara instan dan akurat.
          </p>
        </header>

        {/* Registration Card */}
        <div className="bg-surface-container-lowest dark:bg-surface-container-highest/80 rounded-[32px] p-md md:p-lg shadow-[0px_8px_32px_rgba(0,0,0,0.06)] border border-white/20 dark:border-white/5">
          <h2 className="font-title-md text-title-md text-on-surface mb-lg">Daftar Akun Baru</h2>
          
          {error && (
            <div className="mb-md p-sm bg-error-container text-on-error-container rounded-2xl text-center">
              <p className="text-caption">{error}</p>
            </div>
          )}

          <form className="space-y-sm" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">mail</span>
              </div>
              <input 
                className="block w-full pl-11 pr-3 py-4 bg-surface-container-low dark:bg-surface-variant/20 border-none rounded-xl focus:ring-2 focus:ring-primary text-on-surface transition-all" 
                id="email" 
                placeholder="Alamat Email" 
                required 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">lock</span>
              </div>
              <input 
                className="block w-full pl-11 pr-11 py-4 bg-surface-container-low dark:bg-surface-variant/20 border-none rounded-xl focus:ring-2 focus:ring-primary text-on-surface transition-all" 
                id="password" 
                placeholder="Kata Sandi" 
                required 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
              <button 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors" 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Confirm Password Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">verified_user</span>
              </div>
              <input 
                className="block w-full pl-11 pr-3 py-4 bg-surface-container-low dark:bg-surface-variant/20 border-none rounded-xl focus:ring-2 focus:ring-primary text-on-surface transition-all" 
                id="confirm-password" 
                placeholder="Ulangi Kata Sandi" 
                required 
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-xs py-xs">
              <div className="flex items-center h-5">
                <input 
                  className="w-5 h-5 rounded border-outline text-primary focus:ring-primary-container bg-surface-container-low" 
                  id="terms" 
                  required 
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
              </div>
              <div className="ml-2 text-label-sm">
                <label className="font-label-sm text-on-surface-variant cursor-pointer" htmlFor="terms">
                  Saya setuju dengan <a className="text-primary font-semibold hover:underline" href="#">Ketentuan Layanan</a> dan <a className="text-primary font-semibold hover:underline" href="#">Kebijakan Privasi</a>.
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full bg-primary text-on-primary py-4 rounded-full font-title-md text-title-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xs shadow-lg shadow-primary/20" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Mendaftar...' : 'Buat Akun'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-lg flex items-center">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="flex-shrink mx-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">atau mendaftar dengan</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-sm">
            <button className="flex items-center justify-center gap-xs p-3 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors">
              <img 
                className="w-5 h-5" 
                alt="Google"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn8GeKsXqRu66V4r99sqYnHE0DCmF9TbPfCozjlSj6ThnJLbHgeD_XWl4LkchzLrARChgJ0d8j3knOzEjw80ySmjm8AcgpKaaIr3plMJUr_oTYVbllK0R6TNr7VCYkRKpUzXIugWWlv4cx9wjaDxMbXvboFtQNe8YwJYbWc0ANmhXlnsoKINp4N1AX-_8xhqJzyEYJLvCbxv9x8M-HdXZwaw-l05sroE0d0RdThj26YidQJqSVnkgC"
              />
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">Google</span>
            </button>
            <button className="flex items-center justify-center gap-xs p-3 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px] text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>apps</span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">Apple</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center mt-lg font-body-md text-body-md text-on-surface-variant">
          Sudah memiliki akun?{' '}
          <Link className="text-primary font-bold hover:underline ml-xs transition-colors" href="/login">
            Masuk di sini
          </Link>
        </p>
      </main>

      {/* Side Image Decor (Desktop only) */}
      <div className="hidden lg:flex fixed right-0 top-0 h-full w-[35%] items-center justify-center p-xl">
        <div className="relative w-full h-[80%] rounded-[48px] overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ 
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAS6uZE7CFLpIlHBO2b_UU3IuKpOWMmpdeBTJqrsNJau10DFCGNYW3uWWcD5ka4M1zR1nRZr49GXyAaxb5rEMt7EdRxI-w-C3bBSf6zpb-WCir1MvrN0uDofh0umaBMfQMW6TKfF538mtXXrl9G-3tOVa8Y8P6ubqsSlQp5Z3HPhHUm9ycpbk9ez75RIh-Qy9zqDF-mtp_6omF-VxKsPgIWgpfRHhYJOOPhmW0u3uhlQviDOkRwjgGu')" 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-10 left-10 text-white max-w-[300px] text-left">
            <h3 className="font-display-lg text-headline-lg mb-xs font-bold">Eat Better.</h3>
            <p className="font-body-md text-body-md opacity-90">Ambil foto makanan dan dapatkan informasi nutrisi klinis secara instan.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
