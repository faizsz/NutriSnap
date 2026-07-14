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

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

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
        label = 'Hari Ini'
      } else if (logDate.getTime() === yesterday.getTime()) {
        label = 'Kemarin'
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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin text-4xl text-primary">🔄</div>
      </div>
    )
  }

  const filteredLogs = getFilteredLogs()
  const groupedLogs = groupLogsByDate(filteredLogs)

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 transition-colors duration-300 font-sans">
      
      {/* Top App Bar */}
      <header className="bg-background sticky top-0 z-50 border-b border-surface-variant/10 shadow-sm">
        <div className="flex justify-between items-center w-full px-margin-mobile py-xs max-w-container-max mx-auto h-16">
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

      <main className="max-w-container-max mx-auto px-margin-mobile pt-sm max-w-xl">
        
        {/* Header & Search */}
        <section className="mb-lg text-left">
          <h2 className="font-headline-lg text-headline-lg mb-sm">Riwayat Aktivitas</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-body-md" 
              placeholder="Cari makanan atau latihan..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Filter Tabs */}
        <nav className="flex gap-2 mb-lg overflow-x-auto scrollbar-none pb-1">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-6 py-2 rounded-full font-label-sm whitespace-nowrap transition-all ${
              activeFilter === 'all' 
                ? 'bg-primary text-on-primary shadow-sm font-semibold' 
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Semua
          </button>
          <button 
            onClick={() => setActiveFilter('food')}
            className={`px-6 py-2 rounded-full font-label-sm whitespace-nowrap transition-all ${
              activeFilter === 'food' 
                ? 'bg-primary text-on-primary shadow-sm font-semibold' 
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Makanan
          </button>
          <button 
            onClick={() => setActiveFilter('exercise')}
            className={`px-6 py-2 rounded-full font-label-sm whitespace-nowrap transition-all ${
              activeFilter === 'exercise' 
                ? 'bg-primary text-on-primary shadow-sm font-semibold' 
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Olahraga
          </button>
        </nav>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-16 space-y-md">
            <div className="animate-spin text-5xl">🔄</div>
            <p className="text-on-surface-variant text-sm">Memuat riwayat...</p>
          </div>
        ) : groupedLogs.length === 0 ? (
          // Empty State
          <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-surface-variant/20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Belum Ada Riwayat</h3>
            <p className="text-gray-600 mb-6">Mulai catat asupan makanan atau olahraga harian Anda.</p>
            <div className="flex gap-sm justify-center">
              <Link href="/scan" className="px-5 py-3 bg-primary text-white rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all text-sm shadow-md">
                Scan Makanan
              </Link>
              <Link href="/exercise" className="px-5 py-3 border border-outline text-primary rounded-full font-semibold hover:bg-surface-container-low active:scale-95 transition-all text-sm">
                Input Olahraga
              </Link>
            </div>
          </div>
        ) : (
          // Grouped Logs List
          <div className="space-y-lg text-left">
            {groupedLogs.map((group) => (
              <div key={group.date} className="space-y-sm">
                <div className="flex justify-between items-center px-xs">
                  <h3 className="font-title-md text-title-md text-primary font-bold">{group.label}</h3>
                  <span className="font-label-sm text-on-surface-variant text-[12px]">{group.date}</span>
                </div>
                
                <div className="space-y-sm">
                  {group.items.map((item) => {
                    const expanded = expandedId === item.id
                    
                    if (item.type === 'food') {
                      const log = item.log
                      const foodNames = log.items?.map((i) => i.name).join(', ') || 'Makanan'
                      return (
                        <div 
                          key={item.id}
                          className={`bg-surface-container-lowest rounded-2xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-surface-variant/20 transition-all cursor-pointer ${
                            expanded ? 'ring-1 ring-primary' : ''
                          }`}
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center text-primary flex-shrink-0">
                              <span className="material-symbols-outlined text-[24px]">breakfast_dining</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline gap-2">
                                <span className="font-body-md font-bold text-on-surface truncate">{foodNames}</span>
                                <span className="font-label-sm text-on-surface-variant text-[11px] flex-shrink-0">{formatTime(log.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded bg-primary-container/10 text-primary-container text-[10px] font-medium uppercase tracking-wider">Makanan</span>
                                <span className="text-[12px] font-bold text-primary">{log.total_calories} kkal</span>
                              </div>
                            </div>
                            <span 
                              className={`material-symbols-outlined text-on-surface-variant transition-transform ${expanded ? 'rotate-180' : ''}`}
                            >
                              expand_more
                            </span>
                          </div>

                          {expanded && (
                            <div className="mt-4 pt-4 border-t border-surface-variant/10 space-y-md animate-in fade-in duration-200">
                              {log.items && log.items.length > 0 && (
                                <div className="space-y-2">
                                  {log.items.map((fi, fIdx) => (
                                    <div key={fIdx} className="bg-surface-container-low p-sm rounded-xl text-xs space-y-1">
                                      <p className="font-semibold text-on-surface">{fi.name}</p>
                                      <p className="text-on-surface-variant">Porsi: {fi.portion_estimate_g}g • Energi: {fi.calories} kkal</p>
                                      <div className="grid grid-cols-3 gap-2 text-on-surface-variant pt-1 text-[10px] uppercase font-bold tracking-wider">
                                        <span>P: {fi.protein_g}g</span>
                                        <span>K: {fi.carbs_g}g</span>
                                        <span>L: {fi.fat_g}g</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="grid grid-cols-3 gap-4 text-center bg-surface-container p-3 rounded-xl">
                                <div>
                                  <p className="text-caption text-on-surface-variant uppercase tracking-widest text-[9px]">Protein</p>
                                  <p className="font-label-sm font-bold text-on-surface">{(log.total_protein ?? 0).toFixed(1)}g</p>
                                </div>
                                <div>
                                  <p className="text-caption text-on-surface-variant uppercase tracking-widest text-[9px]">Karbo</p>
                                  <p className="font-label-sm font-bold text-on-surface">{(log.total_carbs ?? 0).toFixed(1)}g</p>
                                </div>
                                <div>
                                  <p className="text-caption text-on-surface-variant uppercase tracking-widest text-[9px]">Lemak</p>
                                  <p className="font-label-sm font-bold text-on-surface">{(log.total_fat ?? 0).toFixed(1)}g</p>
                                </div>
                              </div>

                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                                disabled={deletingId === item.id}
                                className="w-full py-2.5 bg-error/15 text-error rounded-full text-xs font-semibold hover:bg-error/25 active:scale-95 transition-all flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                <span>{deletingId === item.id ? 'Menghapus...' : 'Hapus Log Makanan'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    } else {
                      const log = item.log
                      return (
                        <div 
                          key={item.id}
                          className={`bg-surface-container-lowest rounded-2xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-surface-variant/20 transition-all cursor-pointer ${
                            expanded ? 'ring-1 ring-tertiary' : ''
                          }`}
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary flex-shrink-0">
                              <span className="material-symbols-outlined text-[24px]">directions_run</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline gap-2">
                                <span className="font-body-md font-bold text-on-surface truncate">{log.exercise_type}</span>
                                <span className="font-label-sm text-on-surface-variant text-[11px] flex-shrink-0">{formatTime(log.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded bg-tertiary-container/10 text-tertiary text-[10px] font-medium uppercase tracking-wider">Olahraga</span>
                                <span className="text-[12px] font-bold text-tertiary">-{log.calories_burned} kkal</span>
                              </div>
                            </div>
                            <span 
                              className={`material-symbols-outlined text-on-surface-variant transition-transform ${expanded ? 'rotate-180' : ''}`}
                            >
                              expand_more
                            </span>
                          </div>

                          {expanded && (
                            <div className="mt-4 pt-4 border-t border-surface-variant/10 space-y-md animate-in fade-in duration-200">
                              <div className="grid grid-cols-2 gap-4">
                                {log.duration_minutes !== null && (
                                  <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-xl text-xs">
                                    <span className="text-on-surface-variant">Durasi</span>
                                    <span className="font-bold text-on-surface">{log.duration_minutes} menit</span>
                                  </div>
                                )}
                                {log.reps !== null && (
                                  <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-xl text-xs">
                                    <span className="text-on-surface-variant">Repetisi</span>
                                    <span className="font-bold text-on-surface">{log.reps}x</span>
                                  </div>
                                )}
                              </div>

                              {log.notes && (
                                <div className="bg-surface-container p-3 rounded-xl text-xs">
                                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Catatan</p>
                                  <p className="text-on-surface">{log.notes}</p>
                                </div>
                              )}

                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                                disabled={deletingId === item.id}
                                className="w-full py-2.5 bg-error/15 text-error rounded-full text-xs font-semibold hover:bg-error/25 active:scale-95 transition-all flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                <span>{deletingId === item.id ? 'Menghapus...' : 'Hapus Log Olahraga'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
