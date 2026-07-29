'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/image-utils'
import { FoodItem, AnalyzeResponse } from '@nutrisnap/shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default function ScanPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editedItems, setEditedItems] = useState<FoodItem[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [recentScans, setRecentScans] = useState<any[]>([])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Sync dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
  }, [])

  // Load recent scans for desktop left sidebar
  useEffect(() => {
    if (user) {
      fetchRecentScans()
    }
  }, [user])

  const fetchRecentScans = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)
      if (!error && data) {
        setRecentScans(data)
      }
    } catch (err) {
      console.error('Error fetching recent scans:', err)
    }
  }

  const handleFileSelect = async (file: File) => {
    try {
      setError(null)
      setSaveSuccess(false)
      
      const compressed = await compressImage(file, 2)
      setSelectedFile(compressed)
      
      const url = URL.createObjectURL(compressed)
      setPreviewUrl(url)
      
      setAnalysisResult(null)
      setEditedItems([])
    } catch (err: any) {
      setError(err.message || 'Gagal memproses gambar')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile || !user) return

    setAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('userId', user.id)

      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analisis gagal')
      }

      setAnalysisResult(data)
      setEditedItems(data.items || [])
    } catch (err: any) {
      setError(err.message || 'Gagal menganalisis gambar')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleItemEdit = (index: number, field: keyof FoodItem, value: any) => {
    const updated = [...editedItems]
    updated[index] = { ...updated[index], [field]: value }
    setEditedItems(updated)
  }

  const handleAddItem = () => {
    setEditedItems([
      ...editedItems,
      {
        name: 'Item Makanan Baru',
        confidence: 'high',
        portion_estimate_g: 100,
        calories: 100,
        protein_g: 5,
        carbs_g: 15,
        fat_g: 2
      }
    ])
  }

  const calculateTotals = () => {
    return editedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein_g || 0),
        carbs: acc.carbs + (item.carbs_g || 0),
        fat: acc.fat + (item.fat_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  const handleSave = async () => {
    if (!analysisResult || !user) return

    setSaving(true)
    setError(null)

    try {
      const totals = calculateTotals()

      const { error: insertError } = await supabase.from('food_logs').insert({
        user_id: user.id,
        photo_url: analysisResult.photo_url,
        items: editedItems,
        total_calories: totals.calories,
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fat: totals.fat,
      })

      if (insertError) throw insertError

      setSaveSuccess(true)
      fetchRecentScans() // refresh sidebar
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan riwayat makanan')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin text-4xl text-primary">🔄</div>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md selection:bg-primary/20">
      
      {/* ----------------- DESKTOP SIDEBAR & HEADER (Stitch) ----------------- */}
      <div className="hidden lg:block">
        <aside className="h-screen w-64 fixed left-0 top-0 bg-surface/85 backdrop-blur-md shadow-sm border-r border-outline-variant/30 flex flex-col py-6 px-4 z-50">
          <div className="flex items-center gap-2 mb-10 px-2">
            <span className="material-symbols-outlined text-primary text-3xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">NutriSnap</h1>
          </div>
          <nav className="flex-1 space-y-1">
            <Link className="flex items-center gap-4 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container/40 hover:text-primary transition-all" href="/dashboard">
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link className="flex items-center gap-4 px-4 py-3 rounded-xl text-primary font-bold bg-secondary-container/20 border-r-4 border-primary transition-all" href="/scan">
              <span className="material-symbols-outlined">qr_code_scanner</span>
              <span>Scan Food</span>
            </Link>
            <Link className="flex items-center gap-4 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container/40 hover:text-primary transition-all" href="/history">
              <span className="material-symbols-outlined">history</span>
              <span>History Log</span>
            </Link>
            <Link className="flex items-center gap-4 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container/40 hover:text-primary transition-all" href="/profile">
              <span className="material-symbols-outlined">person</span>
              <span>Profile</span>
            </Link>
          </nav>
          <div className="mt-auto px-2 pt-6 border-t border-outline-variant/30 space-y-2">
            <Link href="/scan" className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md flex items-center justify-center gap-2 hover:bg-primary/95 transition-all active:scale-95 shadow-md shadow-primary/10 text-sm">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Scan New Food
            </Link>
            <button onClick={handleLogout} className="w-full bg-surface-container-low text-on-surface-variant py-2.5 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-error/10 hover:text-error transition-all active:scale-95 text-xs">
              <span className="material-symbols-outlined text-xs">logout</span>
              Log Out
            </button>
          </div>
        </aside>

        <header className="fixed top-0 right-0 left-64 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 z-40 flex items-center px-8">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary text-body-md placeholder:text-outline/60 transition-all" placeholder="Search nutrition data..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <button onClick={() => {
              const dark = document.documentElement.classList.toggle('dark')
              setIsDark(dark)
            }} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container hover:scale-105 transition-transform">
              <img className="w-full h-full object-cover" alt="User Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGRu8gSInXdOdzf7J1WZf_smTv-LSHV8w-FB-UubS95XyfEaJgjobUik-KfO6WMCBIXB5GJ8Z9hm0jZwHSPMIw4Rm8nePItLtlDMujuHRjE5Sg-PZzpQnDrHH-QKTJbPgkJHco45t01Z4hONPSH8PZflP63bYYuqnK-9EnY8EoUkv9i3nWKPJ_tG6Iixe6xJAy8xtOR6ASSbjBfAVtU7wyTtT7orQ028nSJmDHbg1cZOZ6X1UbD_Y-"/>
            </Link>
          </div>
        </header>
      </div>

      {/* ----------------- MOBILE TOP APP BAR (Preserved) ----------------- */}
      <div className="lg:hidden">
        <header className="bg-background fixed top-0 w-full z-50 border-b border-surface-variant/10 shadow-sm">
          <div className="flex justify-between items-center w-full px-margin-mobile py-xs h-16">
            <div className="flex items-center gap-3">
              {analysisResult && (
                <button 
                  onClick={() => {
                    setAnalysisResult(null)
                    setEditedItems([])
                  }} 
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-primary">arrow_back</span>
                </button>
              )}
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">NutriSnap</h1>
            </div>
            <Link href="/profile" className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </Link>
          </div>
        </header>
      </div>

      {/* ----------------- MAIN CONTENT (Responsive Switch) ----------------- */}
      <div className="lg:pl-64 min-h-screen">
        <main className="max-w-container-max mx-auto px-margin-mobile lg:px-8 pt-20 lg:pt-24 pb-28">
          
          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-2xl text-center max-w-lg mx-auto text-sm">
              <p>{error}</p>
            </div>
          )}

          {/* DESKTOP 3-COLUMN LAYOUT */}
          <div className="hidden lg:grid grid-cols-12 gap-8">
            
            {/* Left Column: Recent Scans */}
            <aside className="col-span-3 space-y-6">
              <h3 className="font-headline-md text-primary font-bold text-base">Recent Scans</h3>
              <div className="space-y-4">
                {recentScans.length > 0 ? (
                  recentScans.map((scan) => {
                    const names = scan.items?.map((i: any) => i.name).join(', ') || 'Scan Makanan'
                    const dateStr = new Date(scan.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    return (
                      <div key={scan.id} className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-md transition-all">
                        {scan.photo_url ? (
                          <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url('${scan.photo_url}')` }}></div>
                        ) : (
                          <div className="h-32 w-full bg-surface-container flex items-center justify-center text-3xl">🍽️</div>
                        )}
                        <div className="p-3">
                          <p className="font-bold text-primary text-sm truncate">{names}</p>
                          <p className="text-on-surface-variant text-[11px] mt-0.5">{dateStr}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-4 bg-surface-container-low rounded-xl text-center text-xs text-on-surface-variant">
                    No recent scans yet.
                  </div>
                )}
              </div>
              <Link href="/history" className="w-full block text-center py-2 text-primary font-bold text-xs hover:underline transition-all">
                View Full History
              </Link>
            </aside>

            {/* Central Column: Upload / Analyzer */}
            <div className="col-span-6 space-y-6">
              {!analysisResult ? (
                // Upload view
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="font-display-lg text-primary text-3xl font-extrabold tracking-tight">Analyze Your Meal</h2>
                    <p className="font-body-lg text-on-surface-variant mt-1 text-sm">Upload a photo to get instant macros and health insights.</p>
                  </div>
                  
                  <div 
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !analyzing && fileInputRef.current?.click()}
                    className="relative group border-4 border-dashed border-outline-variant/50 rounded-3xl bg-surface-container-lowest h-96 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary hover:bg-secondary-container/10"
                  >
                    {!previewUrl ? (
                      <div className="z-10 text-center p-8">
                        <div className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-primary text-4xl">photo_camera</span>
                        </div>
                        <p className="font-semibold text-on-surface text-base">Drag and drop your food photo here</p>
                        <p className="text-on-surface-variant text-xs mt-1">or click to browse your local files</p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 w-full h-full">
                        <img className="w-full h-full object-cover rounded-2xl" alt="Selected Preview" src={previewUrl} />
                        {analyzing && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4 z-20 rounded-2xl">
                            {/* Scanning Animation line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#62fae3] to-transparent shadow-[0_0_15px_#62fae3] animate-[scan_3s_linear_infinite]" />
                            <div className="relative w-12 h-12">
                              <div className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
                            </div>
                            <p className="font-bold text-sm">Analyzing photo...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    {previewUrl && !analyzing ? (
                      <button 
                        onClick={handleAnalyze}
                        className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-semibold shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
                      >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        Analyze with AI
                      </button>
                    ) : (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-semibold shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
                      >
                        <span className="material-symbols-outlined text-sm">file_upload</span>
                        Select Local Image
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Analysis Editor view
                <div className="space-y-6">
                  <div>
                    <h2 className="font-headline-lg text-primary text-2xl font-bold">Hasil Analisis</h2>
                    <p className="text-on-surface-variant text-xs">Verify items detected and customize macros if needed.</p>
                  </div>

                  <div className="space-y-4">
                    {editedItems.map((item, idx) => (
                      <article key={idx} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10 flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container border border-outline-variant/10">
                          {previewUrl ? (
                            <img className="w-full h-full object-cover" alt={item.name} src={previewUrl} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <input 
                              type="text" 
                              value={item.name} 
                              onChange={(e) => handleItemEdit(idx, 'name', e.target.value)}
                              className="font-bold text-on-surface text-sm bg-transparent border-none p-0 focus:ring-0 w-full hover:bg-surface-container-low transition rounded px-1"
                            />
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary uppercase">
                              {item.confidence === 'high' ? 'Akurat' : 'Sedang'}
                            </span>
                          </div>

                          <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-on-surface-variant">Porsi (g):</span>
                              <input 
                                type="number" 
                                value={item.portion_estimate_g} 
                                onChange={(e) => handleItemEdit(idx, 'portion_estimate_g', parseFloat(e.target.value) || 0)}
                                className="w-14 bg-surface-container-low border-none rounded p-1 font-bold text-center text-xs focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div className="flex items-center gap-1 text-primary">
                              <span className="material-symbols-outlined text-sm">local_fire_department</span>
                              <input 
                                type="number" 
                                value={item.calories} 
                                onChange={(e) => handleItemEdit(idx, 'calories', parseFloat(e.target.value) || 0)}
                                className="w-14 bg-surface-container-low border-none rounded p-1 font-bold text-center text-xs focus:ring-1 focus:ring-primary"
                              />
                              <span className="text-[10px] text-on-surface-variant">kkal</span>
                            </div>
                          </div>

                          {/* Macros editing */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20">
                            <div className="flex flex-col text-center">
                              <span className="text-[10px] text-on-surface-variant mb-0.5">Protein</span>
                              <input 
                                className="bg-surface-container-low border-none rounded p-1.5 text-on-surface font-bold text-center text-xs focus:ring-1 focus:ring-primary" 
                                type="number" 
                                value={item.protein_g}
                                onChange={(e) => handleItemEdit(idx, 'protein_g', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="flex flex-col text-center">
                              <span className="text-[10px] text-on-surface-variant mb-0.5">Carbs</span>
                              <input 
                                className="bg-surface-container-low border-none rounded p-1.5 text-on-surface font-bold text-center text-xs focus:ring-1 focus:ring-primary" 
                                type="number" 
                                value={item.carbs_g}
                                onChange={(e) => handleItemEdit(idx, 'carbs_g', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="flex flex-col text-center">
                              <span className="text-[10px] text-on-surface-variant mb-0.5">Fats</span>
                              <input 
                                className="bg-surface-container-low border-none rounded p-1.5 text-on-surface font-bold text-center text-xs focus:ring-1 focus:ring-primary" 
                                type="number" 
                                value={item.fat_g}
                                onChange={(e) => handleItemEdit(idx, 'fat_g', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <button 
                    onClick={handleAddItem}
                    className="w-full py-3 border-2 border-dashed border-outline-variant text-on-surface-variant rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors text-xs"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">add_circle</span>
                    <span className="font-semibold">Tambah Item Lain</span>
                  </button>

                  <div className="bg-surface-container-high rounded-2xl p-6 border border-primary/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-on-surface text-sm">Total Ringkasan</h3>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {totals.calories} <span className="text-xs font-normal text-on-surface-variant">kkal</span>
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider">Protein</span>
                          <span className="font-bold text-sm">{totals.protein.toFixed(1)}g</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider">Carbs</span>
                          <span className="font-bold text-sm">{totals.carbs.toFixed(1)}g</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider">Fats</span>
                          <span className="font-bold text-sm">{totals.fat.toFixed(1)}g</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleSave}
                      disabled={saving || saveSuccess}
                      className={`w-full py-3.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 ${
                        saveSuccess 
                          ? 'bg-secondary text-white' 
                          : 'bg-primary text-on-primary hover:bg-primary/95'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {saveSuccess ? 'check_circle' : saving ? 'sync' : 'save'}
                      </span>
                      <span>{saveSuccess ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan ke Riwayat'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Pro Tips */}
            <aside className="col-span-3">
              <div className="bg-tertiary-container/10 p-6 rounded-2xl border border-outline-variant/20 sticky top-24 space-y-4">
                <h4 className="font-bold text-primary text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">lightbulb</span>
                  Pro Tips
                </h4>
                <ul className="space-y-4 text-xs">
                  <li className="flex gap-3">
                    <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold">1</div>
                    <div>
                      <p className="font-bold text-on-surface">Pencahayaan Terang</p>
                      <p className="text-on-surface-variant mt-0.5">Pencahayaan yang cukup membantu AI mengenali detail bahan makanan.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold">2</div>
                    <div>
                      <p className="font-bold text-on-surface">Sudut Atas (Top-Down)</p>
                      <p className="text-on-surface-variant mt-0.5">Ambil foto tegak lurus dari atas piring untuk memperkirakan ukuran porsi secara akurat.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold">3</div>
                    <div>
                      <p className="font-bold text-on-surface">Pisahkan Makanan</p>
                      <p className="text-on-surface-variant mt-0.5">Hindari tumpang tindih makanan jika Anda ingin porsi masing-masing terdeteksi terpisah.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          {/* MOBILE SCAN VIEW (Preserved) */}
          <div className="lg:hidden max-w-lg mx-auto">
            {!analysisResult ? (
              <section className="flex flex-col items-center space-y-6">
                <div className="text-center w-full">
                  <h2 className="font-bold text-lg mb-1 text-on-surface">Ambil Foto Makanan Anda</h2>
                  <p className="text-sm text-on-surface-variant">AI kami akan menghitung kalori dan nutrisi secara otomatis.</p>
                </div>

                <div 
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => !analyzing && fileInputRef.current?.click()}
                  className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-surface-container-low border-2 border-dashed border-outline-variant flex items-center justify-center cursor-pointer"
                >
                  {!previewUrl ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4 text-white">
                        <span className="material-symbols-outlined text-3xl">center_focus_strong</span>
                      </div>
                      <p className="font-semibold text-primary">Ketuk untuk Memotret</p>
                      <p className="text-xs text-on-surface-variant mt-1">atau seret foto ke sini</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 w-full h-full">
                      <img className="w-full h-full object-cover" alt="Preview Makanan" src={previewUrl} />
                      {analyzing && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4 z-20">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#62fae3] to-transparent shadow-[0_0_15px_#62fae3] animate-[scan_3s_linear_infinite]" />
                          <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
                          </div>
                          <p className="font-bold text-sm">Menganalisis foto...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full space-y-3">
                  {previewUrl && !analyzing ? (
                    <button 
                      onClick={handleAnalyze}
                      className="w-full h-14 bg-primary text-on-primary rounded-full font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">auto_awesome</span>
                      Analisis dengan AI
                    </button>
                  ) : (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-14 bg-primary text-on-primary rounded-full font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                      Pilih Gambar Makanan
                    </button>
                  )}
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 h-12 bg-surface-container border border-outline-variant text-on-surface-variant rounded-full text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">image</span>
                      Galeri
                    </button>
                    <button 
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 h-12 bg-surface-container border border-outline-variant text-on-surface-variant rounded-full text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                      Kamera
                    </button>
                  </div>
                </div>

                <div className="w-full bg-secondary-container/20 p-4 rounded-2xl flex gap-4 items-start border border-secondary-container/10">
                  <span className="material-symbols-outlined text-primary">lightbulb</span>
                  <div className="text-left text-xs">
                    <p className="font-bold text-primary mb-1">Tips untuk Hasil Terbaik</p>
                    <p className="text-on-surface-variant">Pastikan pencahayaan cukup dan foto diambil tegak lurus dari atas piring Anda.</p>
                  </div>
                </div>
              </section>
            ) : (
              <section className="space-y-6 text-left">
                <div>
                  <h2 className="font-bold text-xl">Hasil Analisis</h2>
                  <p className="text-xs text-on-surface-variant">Verifikasi item yang terdeteksi dan sesuaikan nilai makronutrisi jika perlu.</p>
                </div>

                <div className="space-y-4">
                  {editedItems.map((item, idx) => (
                    <article key={idx} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-variant/20">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container border border-outline-variant/10">
                          {previewUrl ? (
                            <img className="w-full h-full object-cover" alt={item.name} src={previewUrl} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <input 
                              type="text" 
                              value={item.name} 
                              onChange={(e) => handleItemEdit(idx, 'name', e.target.value)}
                              className="font-bold text-on-surface text-sm bg-transparent border-none p-0 focus:ring-0 w-full hover:bg-surface-container-low transition rounded px-1"
                            />
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary uppercase">
                              {item.confidence === 'high' ? 'Akurat' : 'Sedang'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <label className="text-on-surface-variant">Porsi (g):</label>
                            <input 
                              type="number" 
                              value={item.portion_estimate_g} 
                              onChange={(e) => handleItemEdit(idx, 'portion_estimate_g', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-surface-container-low border-none rounded p-1 text-on-surface font-semibold text-center focus:ring-1 focus:ring-primary text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-1 mt-1 text-primary text-xs">
                            <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                            <input 
                              type="number" 
                              value={item.calories} 
                              onChange={(e) => handleItemEdit(idx, 'calories', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-surface-container-low border-none rounded p-1 text-primary font-bold text-center focus:ring-1 focus:ring-primary text-xs"
                            />
                            <span className="text-[10px] text-on-surface-variant">kkal</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-outline-variant/30 grid grid-cols-3 gap-2 text-xs">
                        <div className="flex flex-col text-center">
                          <label className="text-[10px] text-on-surface-variant mb-1">Protein (g)</label>
                          <input 
                            className="bg-surface-container-low border-none rounded p-2 text-on-surface font-bold text-center focus:ring-2 focus:ring-primary" 
                            type="number" 
                            value={item.protein_g}
                            onChange={(e) => handleItemEdit(idx, 'protein_g', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="flex flex-col text-center">
                          <label className="text-[10px] text-on-surface-variant mb-1">Karbo (g)</label>
                          <input 
                            className="bg-surface-container-low border-none rounded p-2 text-on-surface font-bold text-center focus:ring-2 focus:ring-primary" 
                            type="number" 
                            value={item.carbs_g}
                            onChange={(e) => handleItemEdit(idx, 'carbs_g', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="flex flex-col text-center">
                          <label className="text-[10px] text-on-surface-variant mb-1">Lemak (g)</label>
                          <input 
                            className="bg-surface-container-low border-none rounded p-2 text-on-surface font-bold text-center focus:ring-2 focus:ring-primary" 
                            type="number" 
                            value={item.fat_g}
                            onChange={(e) => handleItemEdit(idx, 'fat_g', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <button 
                  onClick={handleAddItem}
                  className="w-full py-3 border-2 border-dashed border-outline-variant text-on-surface-variant rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors text-xs"
                >
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                  <span className="font-semibold">Tambah Item Lain</span>
                </button>

                <div className="bg-surface-container-high rounded-3xl p-4 relative overflow-hidden border border-primary/10">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <h3 className="font-bold text-on-surface">Total Ringkasan</h3>
                      <p className="text-xl font-bold text-primary mt-1">
                        {totals.calories} <span className="text-xs font-normal text-on-surface-variant">kkal</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div>
                        <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider">Prot</span>
                        <span className="font-bold">{totals.protein.toFixed(1)}g</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider">Carb</span>
                        <span className="font-bold">{totals.carbs.toFixed(1)}g</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-on-surface-variant block uppercase tracking-wider">Fat</span>
                        <span className="font-bold">{totals.fat.toFixed(1)}g</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={saving || saveSuccess}
                    className={`mt-4 w-full py-4 rounded-full font-semibold shadow-md transition-all flex items-center justify-center gap-2 text-sm ${
                      saveSuccess 
                        ? 'bg-secondary text-white' 
                        : 'bg-primary text-on-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {saveSuccess ? 'check_circle' : saving ? 'sync' : 'save'}
                    </span>
                    <span>{saveSuccess ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan ke Riwayat'}</span>
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Hidden inputs */}
          <input 
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
          <input 
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />

        </main>
      </div>

      <BottomNav />

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-on-background text-background px-6 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce z-[60]">
          <span className="material-symbols-outlined text-secondary-fixed">check_circle</span>
          <span className="text-xs font-semibold text-white">Berhasil disimpan ke riwayat!</span>
        </div>
      )}
    </div>
  )
}
