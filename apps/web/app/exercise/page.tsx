'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { CalorieBurnEstimate } from '@nutrisnap/shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

interface ExerciseOption {
  value: string
  label: string
  icon: string
  useReps?: boolean
  useDuration?: boolean
}

const EXERCISE_TYPES: ExerciseOption[] = [
  { value: 'lari', label: 'Lari', icon: 'directions_run', useDuration: true },
  { value: 'renang', label: 'Renang', icon: 'pool', useDuration: true },
  { value: 'pushup', label: 'Push Up', icon: 'fitness_center', useReps: true },
  { value: 'situp', label: 'Sit Up', icon: 'self_improvement', useReps: true },
  { value: 'bersepeda', label: 'Bersepeda', icon: 'directions_bike', useDuration: true },
  { value: 'jalan_kaki', label: 'Jalan Kaki', icon: 'directions_walk', useDuration: true },
  { value: 'yoga', label: 'Yoga', icon: 'spa', useDuration: true },
  { value: 'angkat_beban', label: 'Angkat Beban', icon: 'fitness_center', useDuration: true },
]

export default function ExercisePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [notes, setNotes] = useState('')
  
  const [estimating, setEstimating] = useState(false)
  const [estimate, setEstimate] = useState<CalorieBurnEstimate | null>(null)
  const [editedCalories, setEditedCalories] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleSelectExercise = (type: ExerciseOption) => {
    setSelectedExercise(type)
    setInputValue('')
    setEstimate(null)
    setEditedCalories(null)
    setError(null)
  }

  const handleEstimate = async () => {
    if (!selectedExercise || !user || !inputValue) return

    setEstimating(true)
    setError(null)
    setEstimate(null)

    try {
      const isReps = selectedExercise.useReps
      const parsedValue = parseFloat(inputValue)

      const response = await fetch('/api/estimate-calories-burned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseType: selectedExercise.label,
          duration: !isReps ? parsedValue : null,
          reps: isReps ? Math.round(parsedValue) : null,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghitung estimasi kalori')
      }

      setEstimate(data)
      setEditedCalories(data.calories_burned)
    } catch (err: any) {
      setError(err.message || 'Gagal menghitung kalori')
    } finally {
      setEstimating(false)
    }
  }

  const handleSave = async () => {
    if (!user || !selectedExercise || editedCalories === null || !inputValue) return

    setSaving(true)
    setError(null)

    try {
      const isReps = selectedExercise.useReps
      const parsedValue = parseFloat(inputValue)

      const { error: insertError } = await supabase.from('exercise_logs').insert({
        user_id: user.id,
        exercise_type: selectedExercise.label,
        duration_minutes: !isReps ? parsedValue : null,
        reps: isReps ? Math.round(parsedValue) : null,
        calories_burned: editedCalories,
        notes: notes || null,
      })

      if (insertError) throw insertError

      setSaveSuccess(true)
      // Wait briefly before redirecting
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan log olahraga')
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

  return (
    <div className="min-h-screen bg-background text-on-background pb-32 transition-colors duration-300 font-sans">
      
      {/* Top App Bar */}
      <header className="bg-background sticky top-0 z-50 border-b border-surface-variant/10 shadow-sm">
        <div className="flex justify-between items-center w-full px-margin-mobile py-xs max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">NutriSnap</h1>
          </div>
          <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
            <img 
              className="w-full h-full object-cover" 
              alt="Avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLk6QRPxegBLCbwsZxrznTF0GjzBKheF-BMpWSmRLyS1wNUQge-SAeCCNTKbdUGZslKh-_qOLnu4jGXTQHiUOnO20BL-jAYGkgH4LHiMlUbP_Gq2u-oU5drKhg5FIEVILMNLR9Orly-wPu5FklI0CkNc_Q3ZCi1MNptLXAKi7JQP63FvP0kagBvaVeCgv26O7fqVff8p0juA99V76HirDteCJiAHNzuINAAfWJA4vT51VAiZ0-W__X"
            />
          </Link>
        </div>
      </header>

      <main className="max-w-container-max mx-auto px-margin-mobile mt-lg max-w-lg">
        
        {/* Header Section */}
        <section className="mb-lg text-left">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-xs">Log Latihan</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Catat aktivitas fisikmu dan pantau pembakaran kalori hari ini.</p>
        </section>

        {error && (
          <div className="mb-md p-sm bg-error-container text-on-error-container rounded-2xl text-center">
            <p className="text-caption">{error}</p>
          </div>
        )}

        {/* Exercise Selection Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-sm mb-lg">
          {EXERCISE_TYPES.map((type) => {
            const active = selectedExercise?.value === type.value
            return (
              <button 
                key={type.value}
                onClick={() => handleSelectExercise(type)}
                className={`flex flex-col items-center justify-center p-md rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border-2 transition-all hover:scale-105 active:scale-95 group text-center ${
                  active 
                    ? 'border-primary bg-green-50/50' 
                    : 'border-transparent bg-surface-container-lowest dark:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-primary text-4xl mb-2 group-hover:scale-110 transition-transform">
                  {type.icon}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">{type.label}</span>
              </button>
            )
          })}
        </section>

        {/* Input Details */}
        <section className="mb-lg space-y-md text-left">
          <div className="relative group">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs ml-1" htmlFor="inputValue">
              Durasi / Repetisi ({selectedExercise ? (selectedExercise.useReps ? 'repetisi' : 'menit') : 'pilih latihan'})
            </label>
            <div className="flex items-center bg-surface-container-low dark:bg-surface-container rounded-2xl p-xs border-2 border-transparent focus-within:border-primary focus-within:bg-white transition-all">
              <span className="material-symbols-outlined text-outline-variant px-2">schedule</span>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 font-title-md text-title-md py-2 px-2 disabled:cursor-not-allowed" 
                id="inputValue" 
                type="number"
                placeholder="0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={!selectedExercise}
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs ml-1" htmlFor="notes">
              Catatan Tambahan (opsional)
            </label>
            <div className="flex items-center bg-surface-container-low dark:bg-surface-container rounded-2xl p-xs border-2 border-transparent focus-within:border-primary focus-within:bg-white transition-all">
              <span className="material-symbols-outlined text-outline-variant px-2">edit</span>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 font-body-md py-2 px-2 disabled:cursor-not-allowed" 
                id="notes" 
                type="text"
                placeholder="Intensitas, rute, dll"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!selectedExercise}
              />
            </div>
          </div>

          <button 
            onClick={handleEstimate}
            disabled={!selectedExercise || !inputValue || estimating}
            className={`w-full h-14 bg-primary text-on-primary rounded-full font-title-md text-title-md flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-primary/20 ${
              (!selectedExercise || !inputValue || estimating) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined">
              {estimating ? 'sync' : 'calculate'}
            </span>
            <span>{estimating ? 'Menghitung...' : 'Estimasi Kalori'}</span>
          </button>
        </section>

        {/* Result Card */}
        {estimating && (
          <div className="p-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-center py-8">
            <div className="animate-spin text-4xl mb-2">🔄</div>
            <p className="text-on-surface-variant text-sm font-semibold">AI sedang menghitung pembakaran kalori...</p>
          </div>
        )}

        {estimate && editedCalories !== null && (
          <section className="transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-md bg-white dark:bg-surface-container rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <div className="flex justify-between items-start mb-md">
                <div>
                  <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Hasil Estimasi</h3>
                  <p className="font-title-md text-title-md text-on-surface">
                    {selectedExercise?.label} - {inputValue} {selectedExercise?.useReps ? 'Repetisi' : 'Menit'}
                  </p>
                </div>
                <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-white">bolt</span>
                  <span className="font-label-sm text-label-sm text-white">MET: {estimate.met_value}</span>
                </div>
              </div>

              <div className="flex items-end gap-2 mb-md">
                <input 
                  className="w-32 bg-surface-container-low dark:bg-surface-variant border-none rounded-xl font-display-lg text-display-lg text-primary text-center p-2 focus:ring-2 focus:ring-primary" 
                  type="number" 
                  value={editedCalories}
                  onChange={(e) => setEditedCalories(parseFloat(e.target.value) || 0)}
                  min="0"
                />
                <span className="font-headline-lg text-headline-lg text-on-surface-variant pb-2">kkal</span>
              </div>

              {estimate.explanation && (
                <div className="bg-surface-container p-sm rounded-xl mb-md text-xs text-on-surface-variant leading-relaxed">
                  {estimate.explanation}
                </div>
              )}

              <p className="font-caption text-caption text-on-surface-variant mb-md flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                Nilai di atas dapat diedit secara manual sebelum disimpan.
              </p>
              
              <button 
                onClick={handleSave}
                disabled={saving || saveSuccess}
                className={`w-full py-4 rounded-full font-title-md text-title-md flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${
                  saveSuccess 
                    ? 'bg-secondary text-white' 
                    : 'bg-primary text-on-primary hover:opacity-95 shadow-primary/20 hover:scale-[1.01]'
                }`}
              >
                <span className="material-symbols-outlined">
                  {saveSuccess ? 'check_circle' : saving ? 'sync' : 'save'}
                </span>
                <span>{saveSuccess ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan Latihan'}</span>
              </button>
            </div>
          </section>
        )}

      </main>

      <BottomNav />

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-on-background text-background px-lg py-sm rounded-full shadow-xl flex items-center gap-sm animate-bounce z-[60]">
          <span className="material-symbols-outlined text-secondary-fixed">check_circle</span>
          <span className="font-label-sm font-semibold text-white">Log latihan berhasil disimpan!</span>
        </div>
      )}
    </div>
  )
}
