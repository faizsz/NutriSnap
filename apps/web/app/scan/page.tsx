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

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleFileSelect = async (file: File) => {
    try {
      setError(null)
      setSaveSuccess(false)
      
      // Compress image
      const compressed = await compressImage(file, 2)
      setSelectedFile(compressed)
      
      // Create preview
      const url = URL.createObjectURL(compressed)
      setPreviewUrl(url)
      
      // Reset analysis
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
      // Wait briefly before redirecting
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan riwayat makanan')
    } finally {
      setSaving(false)
    }
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
    <div className="min-h-screen bg-background text-on-background pb-32 transition-colors duration-300 font-sans">
      
      {/* Top App Bar */}
      <header className="bg-background fixed top-0 w-full z-50 border-b border-surface-variant/10 shadow-sm">
        <div className="flex justify-between items-center w-full px-margin-mobile py-xs max-w-container-max mx-auto h-16">
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

      <main className="max-w-container-max mx-auto pt-20 px-margin-mobile">
        
        {error && (
          <div className="mb-md p-sm bg-error-container text-on-error-container rounded-2xl text-center max-w-lg mx-auto">
            <p className="text-caption">{error}</p>
          </div>
        )}

        {/* DEFAULT UPLOAD STATE */}
        {!analysisResult && (
          <section className="max-w-lg mx-auto flex flex-col items-center space-y-md">
            
            {/* Instructional Header */}
            <div className="text-center w-full">
              <h2 className="font-title-md text-title-md mb-xs text-on-surface">Ambil Foto Makanan Anda</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">AI kami akan menghitung kalori dan nutrisi secara otomatis.</p>
            </div>

            {/* Upload Container */}
            <div 
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !analyzing && fileInputRef.current?.click()}
              className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-surface-container-low dark:bg-surface-container-high group cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-dashed border-outline-variant hover:border-primary flex items-center justify-center"
            >
              {!previewUrl ? (
                // Default placeholder
                <div className="flex flex-col items-center justify-center p-md text-center">
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-md transition-transform group-hover:scale-110 text-white">
                    <span className="material-symbols-outlined text-[40px]">center_focus_strong</span>
                  </div>
                  <p className="font-title-md text-title-md text-primary font-semibold">Ketuk untuk Memotret</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">atau seret foto ke sini</p>
                </div>
              ) : (
                // Selected image preview
                <div className="absolute inset-0 w-full h-full">
                  <img className="w-full h-full object-cover" alt="Preview Makanan" src={previewUrl} />
                  {analyzing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-md z-20">
                      {/* Scanning Line Animation */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#62fae3] to-transparent shadow-[0_0_15px_#62fae3] animate-[scan_3s_linear_infinite]" />
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
                      </div>
                      <p className="font-title-md text-title-md font-medium">Menganalisis foto...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

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

            {/* Action Buttons */}
            <div className="w-full space-y-sm">
              {previewUrl && !analyzing ? (
                <button 
                  onClick={handleAnalyze}
                  className="w-full h-14 bg-primary text-on-primary rounded-full font-title-md text-title-md shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Analisis dengan AI
                </button>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-14 bg-primary text-on-primary rounded-full font-title-md text-title-md shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">photo_camera</span>
                  Pilih Gambar Makanan
                </button>
              )}
              
              <div className="flex gap-sm">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-12 bg-surface-container border border-outline-variant text-on-surface-variant rounded-full font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">image</span>
                  Galeri
                </button>
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 h-12 bg-surface-container border border-outline-variant text-on-surface-variant rounded-full font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                  Kamera
                </button>
              </div>
            </div>

            {/* Tip Card */}
            <div className="w-full bg-secondary-container/20 p-md rounded-2xl flex gap-md items-start border border-secondary-container/10">
              <span className="material-symbols-outlined text-primary text-[24px]">lightbulb</span>
              <div className="text-left">
                <p className="font-label-sm font-bold text-primary mb-1">Tips untuk Hasil Terbaik</p>
                <p className="font-body-md text-caption text-on-surface-variant">Pastikan pencahayaan cukup dan foto diambil tegak lurus dari atas piring Anda.</p>
              </div>
            </div>
          </section>
        )}

        {/* RESULTS BREAKDOWN STATE */}
        {analysisResult && (
          <section className="space-y-lg animate-in fade-in duration-300">
            
            {/* Title */}
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-background">Hasil Analisis</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Verifikasi item yang terdeteksi dan sesuaikan nilai makronutrisi jika perlu.</p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {editedItems.map((item, idx) => (
                <article 
                  key={idx} 
                  className="bg-surface-container-lowest dark:bg-inverse-surface rounded-2xl p-md shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-transparent hover:border-primary-container transition-all group"
                >
                  <div className="flex gap-md">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container border border-outline-variant/10">
                      {previewUrl ? (
                        <img className="w-full h-full object-cover" alt={item.name} src={previewUrl} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-primary/10 text-primary">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0 text-left">
                      <div className="flex justify-between items-start gap-1">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => handleItemEdit(idx, 'name', e.target.value)}
                          className="font-title-md text-title-md text-on-surface font-semibold bg-transparent border-none p-0 focus:ring-0 w-full hover:bg-surface-container-low transition rounded px-1"
                        />
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          item.confidence === 'high' 
                            ? 'bg-primary/10 text-primary' 
                            : item.confidence === 'medium' 
                            ? 'bg-secondary-container text-on-secondary-container' 
                            : 'bg-error-container text-on-error-container'
                        }`}>
                          {item.confidence === 'high' ? 'Akurat' : item.confidence === 'medium' ? 'Sedang' : 'Rendah'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                        <label className="font-caption text-caption text-on-surface-variant">Porsi (g):</label>
                        <input 
                          type="number" 
                          value={item.portion_estimate_g} 
                          onChange={(e) => handleItemEdit(idx, 'portion_estimate_g', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-surface-container-low border-none rounded-lg p-1 text-on-surface font-semibold text-center text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 text-primary">
                        <span className="material-symbols-outlined text-[16px]">fitness_center</span>
                        <input 
                          type="number" 
                          value={item.calories} 
                          onChange={(e) => handleItemEdit(idx, 'calories', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-surface-container-low border-none rounded-lg p-1 text-primary font-bold text-center text-xs focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-[10px] text-on-surface-variant font-medium">kkal</span>
                      </div>
                    </div>
                  </div>

                  {/* Macros Inputs */}
                  <div className="mt-md pt-md border-t border-outline-variant/30 grid grid-cols-3 gap-xs">
                    <div className="flex flex-col text-center">
                      <label className="font-caption text-[11px] text-on-surface-variant mb-1">Protein (g)</label>
                      <input 
                        className="bg-surface-container-low dark:bg-surface-dim border-none rounded-lg p-2 text-on-surface font-bold focus:ring-2 focus:ring-primary text-center text-sm" 
                        type="number" 
                        value={item.protein_g}
                        onChange={(e) => handleItemEdit(idx, 'protein_g', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex flex-col text-center">
                      <label className="font-caption text-[11px] text-on-surface-variant mb-1">Karbo (g)</label>
                      <input 
                        className="bg-surface-container-low dark:bg-surface-dim border-none rounded-lg p-2 text-on-surface font-bold focus:ring-2 focus:ring-primary text-center text-sm" 
                        type="number" 
                        value={item.carbs_g}
                        onChange={(e) => handleItemEdit(idx, 'carbs_g', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex flex-col text-center">
                      <label className="font-caption text-[11px] text-on-surface-variant mb-1">Lemak (g)</label>
                      <input 
                        className="bg-surface-container-low dark:bg-surface-dim border-none rounded-lg p-2 text-on-surface font-bold focus:ring-2 focus:ring-primary text-center text-sm" 
                        type="number" 
                        value={item.fat_g}
                        onChange={(e) => handleItemEdit(idx, 'fat_g', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Add Item Button */}
            <button 
              onClick={handleAddItem}
              className="w-full py-md border-2 border-dashed border-outline-variant text-on-surface-variant rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors group"
            >
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add_circle</span>
              <span className="font-label-sm text-label-sm font-semibold">Tambah Item Lain</span>
            </button>

            {/* Summary Section */}
            <section className="mt-xl">
              <div className="bg-surface-container-high dark:bg-inverse-surface rounded-3xl p-md sm:p-lg relative overflow-hidden shadow-lg border border-primary/10">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-md text-left">
                  <div className="flex flex-col gap-xs">
                    <h3 className="font-title-md text-title-md text-on-surface font-bold">Total Ringkasan</h3>
                    <p className="font-display-lg text-display-lg text-primary leading-tight font-bold">
                      {totals.calories} <span className="text-title-md font-medium text-on-surface-variant">kkal</span>
                    </p>
                  </div>
                  <div className="flex gap-lg pr-4">
                    <div className="flex flex-col">
                      <span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">Protein</span>
                      <span className="font-title-md text-title-md font-bold">{totals.protein.toFixed(1)}g</span>
                      <div className="w-16 h-1 bg-primary/20 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(totals.protein * 1.5, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">Karbo</span>
                      <span className="font-title-md text-title-md font-bold">{totals.carbs.toFixed(1)}g</span>
                      <div className="w-16 h-1 bg-secondary/20 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: `${Math.min(totals.carbs * 1.0, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest">Lemak</span>
                      <span className="font-title-md text-title-md font-bold">{totals.fat.toFixed(1)}g</span>
                      <div className="w-16 h-1 bg-tertiary/20 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-tertiary" style={{ width: `${Math.min(totals.fat * 2.0, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button 
                  onClick={handleSave}
                  disabled={saving || saveSuccess}
                  className={`mt-lg w-full py-4 rounded-full font-title-md shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                    saveSuccess 
                      ? 'bg-secondary text-white' 
                      : 'bg-primary text-on-primary hover:scale-[1.01]'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {saveSuccess ? 'check_circle' : saving ? 'sync' : 'save'}
                  </span>
                  <span>{saveSuccess ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan ke Riwayat'}</span>
                </button>
              </div>
            </section>
          </section>
        )}

      </main>

      <BottomNav />

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-on-background text-background px-lg py-sm rounded-full shadow-xl flex items-center gap-sm animate-bounce z-[60]">
          <span className="material-symbols-outlined text-secondary-fixed">check_circle</span>
          <span className="font-label-sm font-semibold text-white">Berhasil disimpan ke riwayat!</span>
        </div>
      )}
    </div>
  )
}
