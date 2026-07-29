'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { FoodLog, ExerciseLog } from '@nutrisnap/shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

type MergedLog = 
  | { type: 'food'; id: string; created_at: string; log: FoodLog }
  | { type: 'exercise'; id: string; created_at: string; log: ExerciseLog }

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [logs, setLogs] = useState<MergedLog[]>([])
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'food' | 'exercise'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Sync dark mode state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchHistoryLogs()
    }
  }, [user])

  const fetchHistoryLogs = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // 1. Fetch food logs
      const { data: foodData, error: foodError } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)

      if (foodError) throw foodError

      // 2. Fetch exercise logs
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', user.id)

      if (exerciseError) throw exerciseError

      // 3. Merge logs
      const merged: MergedLog[] = []
      
      foodData?.forEach((log) => {
        merged.push({
          type: 'food',
          id: `food-${log.id}`,
          created_at: log.created_at,
          log: log,
        })
      })

      exerciseData?.forEach((log) => {
        merged.push({
          type: 'exercise',
          id: `exercise-${log.id}`,
          created_at: log.created_at,
          log: log,
        })
      })

      // Sort by date descending
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setLogs(merged)
    } catch (err: any) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (mergedLog: MergedLog) => {
    if (!confirm('Yakin ingin menghapus log ini?')) return

    setDeletingId(mergedLog.id)

    try {
      if (mergedLog.type === 'food') {
        const { error } = await supabase
          .from('food_logs')
          .delete()
          .eq('id', mergedLog.log.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('exercise_logs')
          .delete()
          .eq('id', mergedLog.log.id)
        if (error) throw error
      }

      setLogs((prev) => prev.filter((item) => item.id !== mergedLog.id))
      setExpandedId(null)
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const getFilteredLogs = () => {
    return logs.filter((item) => {
      // 1. Filter by tab
      if (activeFilter === 'food' && item.type !== 'food') return false
      if (activeFilter === 'exercise' && item.type !== 'exercise') return false

      // 2. Filter by search query
      if (searchQuery.trim() === '') return true
      const query = searchQuery.toLowerCase()
      if (item.type === 'food') {
        const names = item.log.items?.map((i) => i.name).join(', ') || ''
        return names.toLowerCase().includes(query)
      } else {
        return item.log.exercise_type.toLowerCase().includes(query)
      }
    })
  }

  const groupLogsByDate = (filteredList: MergedLog[]) => {
    const groups: { [key: string]: { label: string; date: string; items: MergedLog[] } } = {}
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    filteredList.forEach((item) => {
      const logDate = new Date(item.created_at)
      logDate.setHours(0, 0, 0, 0)

      let label = ''
      if (logDate.getTime() === today.getTime()) {
        label = 'Today'
      } else if (logDate.getTime() === yesterday.getTime()) {
        label = 'Yesterday'
      } else {
        label = logDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      }

      const dateStr = logDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

      if (!groups[dateStr]) {
        groups[dateStr] = { label, date: dateStr, items: [] }
      }
      groups[dateStr].items.push(item)
    })

    return Object.values(groups)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
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

  const filteredLogs = getFilteredLogs()
  const groupedLogs = groupLogsByDate(filteredLogs)

  // Dynamic Statistics calculations for Desktop Right Column
  const foodLogsOnly = logs.filter(l => l.type === 'food')
  const avgIntake = foodLogsOnly.length > 0 
    ? Math.round(foodLogsOnly.reduce((sum, l) => sum + (l.log.total_calories || 0), 0) / foodLogsOnly.length) 
    : 0

  const foodCounts: { [key: string]: number } = {}
  foodLogsOnly.forEach(log => {
    log.log.items?.forEach((item: any) => {
      foodCounts[item.name] = (foodCounts[item.name] || 0) + 1
    })
  })
  const topFoods = Object.entries(foodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))

  const totalP = foodLogsOnly.reduce((sum, l) => sum + (l.log.total_protein || 0), 0)
  const totalC = foodLogsOnly.reduce((sum, l) => sum + (l.log.total_carbs || 0), 0)
  const totalF = foodLogsOnly.reduce((sum, l) => sum + (l.log.total_fat || 0), 0)
  const totalMacrosGrams = totalP + totalC + totalF
  const avgP = totalMacrosGrams > 0 ? Math.round((totalP / totalMacrosGrams) * 100) : 30
  const avgC = totalMacrosGrams > 0 ? Math.round((totalC / totalMacrosGrams) * 100) : 50
  const avgF = totalMacrosGrams > 0 ? Math.round((totalF / totalMacrosGrams) * 100) : 20

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
            <Link className="flex items-center gap-4 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container/40 hover:text-primary transition-all" href="/scan">
              <span className="material-symbols-outlined">qr_code_scanner</span>
              <span>Scan Food</span>
            </Link>
            <Link className="flex items-center gap-4 px-4 py-3 rounded-xl text-primary font-bold bg-secondary-container/20 border-r-4 border-primary transition-all" href="/history">
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
              <input 
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary text-body-md placeholder:text-outline/60 transition-all" 
                placeholder="Search logs, foods, or dates..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
        <header className="bg-background sticky top-0 z-50 border-b border-surface-variant/10 shadow-sm">
          <div className="flex justify-between items-center w-full px-margin-mobile py-xs h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-primary">arrow_back</span>
              </Link>
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">NutriSnap</h1>
            </div>
            <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </Link>
          </div>
        </header>
      </div>

      {/* ----------------- MAIN CONTENT (Responsive Grid Layout) ----------------- */}
      <div className="lg:pl-64 min-h-screen">
        <main className="max-w-container-max mx-auto px-margin-mobile lg:px-8 pt-6 lg:pt-24 pb-28">
          
          <div className="grid grid-cols-12 gap-8">
            
            {/* Left Column: History Logs List */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              
              {/* Header Titles */}
              <div className="flex flex-col gap-2">
                <h2 className="font-headline-lg text-2xl lg:text-headline-lg text-on-surface font-extrabold tracking-tight">Nutritional History</h2>
                <p className="text-on-surface-variant text-sm">Review your daily intake and activity patterns.</p>
              </div>

              {/* Filters & Search Input (shown on desktop and mobile) */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <nav className="flex gap-2 overflow-x-auto scrollbar-none pb-1 w-full sm:w-auto">
                  <button 
                    onClick={() => setActiveFilter('all')}
                    className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === 'all' 
                        ? 'bg-primary text-on-primary shadow-sm font-semibold' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    All Logs
                  </button>
                  <button 
                    onClick={() => setActiveFilter('food')}
                    className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === 'food' 
                        ? 'bg-primary text-on-primary shadow-sm font-semibold' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    Food
                  </button>
                  <button 
                    onClick={() => setActiveFilter('exercise')}
                    className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFilter === 'exercise' 
                        ? 'bg-primary text-on-primary shadow-sm font-semibold' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    Exercise
                  </button>
                </nav>

                <div className="relative w-full sm:w-64 lg:hidden">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                  <input 
                    className="w-full pl-9 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-xs focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/50" 
                    placeholder="Search logs..." 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Logs Content Area */}
              {loading ? (
                <div className="text-center py-16 space-y-4">
                  <div className="animate-spin text-4xl">🔄</div>
                  <p className="text-on-surface-variant text-xs">Memuat riwayat...</p>
                </div>
              ) : groupedLogs.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-variant/20">
                  <div className="text-5xl mb-4">📭</div>
                  <h3 className="text-lg font-bold mb-1 text-on-surface">Belum Ada Riwayat</h3>
                  <p className="text-on-surface-variant text-xs mb-6 max-w-xs mx-auto">Mulai catat asupan makanan atau olahraga harian Anda.</p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/scan" className="px-5 py-2.5 bg-primary text-white rounded-full text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md">
                      Scan Makanan
                    </Link>
                    <Link href="/exercise" className="px-5 py-2.5 border border-outline text-primary rounded-full text-xs font-semibold hover:bg-surface-container-low active:scale-95 transition-all">
                      Input Olahraga
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 text-left">
                  {groupedLogs.map((group) => (
                    <section key={group.date} className="space-y-4">
                      <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-outline-variant/10 pb-2">
                        {group.label} — {group.date}
                      </h3>
                      
                      <div className="space-y-4">
                        {group.items.map((item) => {
                          const expanded = expandedId === item.id
                          
                          if (item.type === 'food') {
                            const log = item.log
                            const foodNames = log.items?.map((i) => i.name).join(', ') || 'Makanan'
                            return (
                              <div 
                                key={item.id}
                                className={`bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden group hover:border-primary/30 transition-all cursor-pointer ${
                                  expanded ? 'ring-1 ring-primary' : 'shadow-sm'
                                }`}
                                onClick={() => setExpandedId(expanded ? null : item.id)}
                              >
                                <div className="p-4 flex items-center gap-4">
                                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-surface-container flex-shrink-0">
                                    {log.photo_url ? (
                                      <img className="w-full h-full object-cover" alt={foodNames} src={log.photo_url} />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-2xl bg-secondary-container/10">🍽️</div>
                                    )}
                                  </div>
                                  <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="font-bold text-on-surface text-sm truncate">{foodNames}</h4>
                                      <span className="text-[10px] text-on-surface-variant font-medium whitespace-nowrap">{formatTime(log.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                      <div className="flex items-center gap-0.5 text-primary">
                                        <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                                        <span className="font-bold text-xs">{log.total_calories} kcal</span>
                                      </div>
                                      <div className="flex gap-1 text-[9px] font-bold text-on-surface/90 uppercase">
                                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded">P: {log.total_protein}g</span>
                                        <span className="px-1.5 py-0.5 bg-amber-400/10 text-amber-600 rounded">C: {log.total_carbs}g</span>
                                        <span className="px-1.5 py-0.5 bg-secondary/10 text-secondary rounded">F: {log.total_fat}g</span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className={`material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-transform ${expanded ? 'rotate-180' : ''}`}>
                                    expand_more
                                  </span>
                                </div>

                                {expanded && (
                                  <div className="px-4 pb-4 border-t border-outline-variant/10 pt-4 bg-surface-container-low/30 space-y-4 animate-in fade-in duration-200">
                                    {log.items && log.items.length > 0 && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {log.items.map((fi, fIdx) => (
                                          <div key={fIdx} className="bg-surface-container-low p-3 rounded-xl text-xs space-y-1">
                                            <p className="font-bold text-on-surface">{fi.name}</p>
                                            <p className="text-on-surface-variant text-[11px]">Portion: {fi.portion_estimate_g}g • Energy: {fi.calories} kcal</p>
                                            <div className="grid grid-cols-3 gap-2 text-on-surface-variant pt-1 text-[9px] uppercase font-bold tracking-wider">
                                              <span>P: {fi.protein_g}g</span>
                                              <span>C: {fi.carbs_g}g</span>
                                              <span>F: {fi.fat_g}g</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <div className="flex justify-end gap-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                                        disabled={deletingId === item.id}
                                        className="px-4 py-2 bg-error/15 text-error rounded-xl text-xs font-semibold hover:bg-error/25 active:scale-95 transition-all flex items-center gap-1"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                        <span>{deletingId === item.id ? 'Deleting...' : 'Delete'}</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          } else {
                            const log = item.log
                            return (
                              <div 
                                key={item.id}
                                className={`bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden group hover:border-primary/30 transition-all cursor-pointer ${
                                  expanded ? 'ring-1 ring-tertiary' : 'shadow-sm'
                                }`}
                                onClick={() => setExpandedId(expanded ? null : item.id)}
                              >
                                <div className="p-4 flex items-center gap-4">
                                  <div className="h-14 w-14 rounded-lg bg-tertiary-container/10 flex items-center justify-center text-tertiary flex-shrink-0">
                                    <span className="material-symbols-outlined text-2xl">directions_run</span>
                                  </div>
                                  <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="font-bold text-on-surface text-sm truncate">{log.exercise_type}</h4>
                                      <span className="text-[10px] text-on-surface-variant font-medium whitespace-nowrap">{formatTime(log.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                      <div className="flex items-center gap-0.5 text-error">
                                        <span className="material-symbols-outlined text-[16px]">bolt</span>
                                        <span className="font-bold text-xs">-{log.calories_burned} kcal</span>
                                      </div>
                                      {log.duration_minutes !== null && (
                                        <div className="flex items-center gap-0.5 text-on-surface-variant">
                                          <span className="material-symbols-outlined text-[16px]">timer</span>
                                          <span className="text-xs">{log.duration_minutes} mins</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-transform ${expanded ? 'rotate-180' : ''}`}>
                                    expand_more
                                  </span>
                                </div>

                                {expanded && (
                                  <div className="px-4 pb-4 border-t border-outline-variant/10 pt-4 bg-surface-container-low/30 space-y-3 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                      {log.duration_minutes !== null && (
                                        <div className="flex justify-between items-center bg-surface-container-low p-2.5 rounded-xl">
                                          <span className="text-on-surface-variant">Duration</span>
                                          <span className="font-bold text-on-surface">{log.duration_minutes} minutes</span>
                                        </div>
                                      )}
                                      {log.reps !== null && (
                                        <div className="flex justify-between items-center bg-surface-container-low p-2.5 rounded-xl">
                                          <span className="text-on-surface-variant">Repetitions</span>
                                          <span className="font-bold text-on-surface">{log.reps}x</span>
                                        </div>
                                      )}
                                    </div>

                                    {log.notes && (
                                      <div className="bg-surface-container-low p-3 rounded-xl text-xs text-left">
                                        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Notes</p>
                                        <p className="text-on-surface">{log.notes}</p>
                                      </div>
                                    )}

                                    <div className="flex justify-end gap-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                                        disabled={deletingId === item.id}
                                        className="px-4 py-2 bg-error/15 text-error rounded-xl text-xs font-semibold hover:bg-error/25 active:scale-95 transition-all flex items-center gap-1"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                        <span>{deletingId === item.id ? 'Deleting...' : 'Delete'}</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          }
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Dynamic Monthly Insights */}
            <aside className="col-span-12 lg:col-span-4 space-y-6">
              <div className="sticky top-24 space-y-6">
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-6">
                  
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-on-surface text-base">Monthly Insights</h3>
                    <span className="text-xs bg-secondary-container/35 text-primary px-2 py-0.5 rounded-full font-semibold">
                      {new Date().toLocaleDateString('en-US', { month: 'long' })}
                    </span>
                  </div>

                  {/* Average intake */}
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 relative overflow-hidden">
                    <div className="relative z-10 space-y-1">
                      <p className="text-[11px] text-on-surface-variant font-semibold">Daily Average Intake</p>
                      <h4 className="font-display-lg text-3xl text-primary font-bold">
                        {avgIntake} <span className="text-xs font-normal text-on-surface-variant">kcal</span>
                      </h4>
                      <div className="flex items-center gap-1 text-secondary text-xs mt-1">
                        <span className="material-symbols-outlined text-sm">trending_down</span>
                        <span>4% vs last month</span>
                      </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <span className="material-symbols-outlined text-[80px]">monitoring</span>
                    </div>
                  </div>

                  {/* Top Logged Foods */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-on-surface">Top Logged Foods</h4>
                    <div className="space-y-2 text-xs">
                      {topFoods.length > 0 ? (
                        topFoods.map((food, fIdx) => (
                          <div key={fIdx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${fIdx === 0 ? 'bg-primary' : fIdx === 1 ? 'bg-secondary' : 'bg-tertiary'}`}></div>
                              <span>{food.name}</span>
                            </div>
                            <span className="text-on-surface-variant font-semibold">{food.count} logs</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-on-surface-variant text-xs italic">No foods logged yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Average Macro Split */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-on-surface">Average Macro Split</h4>
                    <div className="flex h-3 w-full rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${avgP}%` }}></div>
                      <div className="h-full bg-amber-400" style={{ width: `${avgC}%` }}></div>
                      <div className="h-full bg-secondary" style={{ width: `${avgF}%` }}></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
                      <div>
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Protein</p>
                        <p className="font-bold">{avgP}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Carbs</p>
                        <p className="font-bold">{avgC}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Fats</p>
                        <p className="font-bold">{avgF}%</p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-2.5 border border-outline-variant/30 rounded-xl text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Download Full Report
                  </button>
                </div>

                <div className="bg-inverse-surface rounded-2xl p-6 text-inverse-on-surface space-y-1">
                  <h4 className="font-bold text-sm text-white">Health Goal Tip</h4>
                  <p className="text-xs text-white/90 leading-relaxed">
                    Increasing protein by 5% could help your recovery time after those workouts! Keep logging to optimize your goals.
                  </p>
                </div>
              </div>
            </aside>

          </div>

        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  )
}
