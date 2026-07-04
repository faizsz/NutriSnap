'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { calculateMetabolicRate, calculateNetCalories, calculateCaloriePercentage, calculateMacroPercentages } from '@/lib/calculations'
import { calculateAge } from '@/lib/utils'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DashboardData {
  tdee: number
  bmr: number
  caloriesIn: number
  caloriesBurned: number
  netCalories: number
  protein: number
  carbs: number
  fat: number
  hasData: boolean
  weeklyCalories: Array<{ date: string; caloriesIn: number; caloriesBurned: number }>
  weightHistory: Array<{ date: string; weight: number }>
  recentFood: any[]
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Sync state with HTML dark class
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
  }, [])

  const toggleDarkMode = () => {
    if (typeof window !== 'undefined') {
      const dark = document.documentElement.classList.toggle('dark')
      setIsDark(dark)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // 1. Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tinggi_cm, tanggal_lahir, gender, activity_level')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      // Check if profile is complete
      if (!profile.tinggi_cm || !profile.tanggal_lahir || !profile.gender || !profile.activity_level) {
        router.push('/onboarding')
        return
      }

      // 2. Get latest weight
      const { data: weightLog, error: weightError } = await supabase
        .from('weight_logs')
        .select('berat_kg')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      if (weightError && weightError.code !== 'PGRST116') throw weightError
      
      if (!weightLog) {
        router.push('/onboarding')
        return
      }

      // Calculate BMR & TDEE
      const age = calculateAge(profile.tanggal_lahir)
      const { bmr, tdee } = calculateMetabolicRate(
        weightLog.berat_kg,
        profile.tinggi_cm,
        age,
        profile.gender,
        profile.activity_level
      )

      // 3. Get today's food logs
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data: foodLogs, error: foodError } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      if (foodError) throw foodError

      // 4. Get today's exercise logs
      const { data: exerciseLogs, error: exerciseError } = await supabase
        .from('exercise_logs')
        .select('calories_burned')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      if (exerciseError) throw exerciseError

      // Aggregate today's data
      const caloriesIn = foodLogs?.reduce((sum, log) => sum + (log.total_calories || 0), 0) || 0
      const protein = foodLogs?.reduce((sum, log) => sum + (log.total_protein || 0), 0) || 0
      const carbs = foodLogs?.reduce((sum, log) => sum + (log.total_carbs || 0), 0) || 0
      const fat = foodLogs?.reduce((sum, log) => sum + (log.total_fat || 0), 0) || 0
      const caloriesBurned = exerciseLogs?.reduce((sum, log) => sum + (log.calories_burned || 0), 0) || 0
      
      const netCalories = calculateNetCalories(tdee, caloriesIn, caloriesBurned)

      // 5. Get 7 days data for charts
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

      const { data: weeklyFood, error: weeklyFoodError } = await supabase
        .from('food_logs')
        .select('created_at, total_calories')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      if (weeklyFoodError) throw weeklyFoodError

      const { data: weeklyExercise, error: weeklyExerciseError } = await supabase
        .from('exercise_logs')
        .select('created_at, calories_burned')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      if (weeklyExerciseError) throw weeklyExerciseError

      // Aggregate by day
      const dailyData: { [key: string]: { caloriesIn: number; caloriesBurned: number } } = {}
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo)
        date.setDate(date.getDate() + i)
        const dateStr = date.toLocaleDateString('id-ID', { weekday: 'short' })
        dailyData[dateStr] = { caloriesIn: 0, caloriesBurned: 0 }
      }

      weeklyFood?.forEach(log => {
        const date = new Date(log.created_at).toLocaleDateString('id-ID', { weekday: 'short' })
        if (dailyData[date]) {
          dailyData[date].caloriesIn += log.total_calories || 0
        }
      })

      weeklyExercise?.forEach(log => {
        const date = new Date(log.created_at).toLocaleDateString('id-ID', { weekday: 'short' })
        if (dailyData[date]) {
          dailyData[date].caloriesBurned += log.calories_burned || 0
        }
      })

      const weeklyCalories = Object.entries(dailyData).map(([date, data]) => ({
        date,
        caloriesIn: data.caloriesIn,
        caloriesBurned: data.caloriesBurned,
      }))

      // 6. Get weight history (last 30 days)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

      const { data: weightHistory, error: weightHistoryError } = await supabase
        .from('weight_logs')
        .select('recorded_at, berat_kg')
        .eq('user_id', user.id)
        .gte('recorded_at', thirtyDaysAgo.toISOString())
        .order('recorded_at', { ascending: true })

      if (weightHistoryError) throw weightHistoryError

      const weightData = weightHistory?.map(log => ({
        date: new Date(log.recorded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        weight: log.berat_kg,
      })) || []

      // 7. Get recent food logs (limit to 3)
      const { data: recentFood, error: recentFoodError } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (recentFoodError) throw recentFoodError

      setData({
        tdee,
        bmr,
        caloriesIn,
        caloriesBurned,
        netCalories,
        protein,
        carbs,
        fat,
        hasData: (foodLogs?.length || 0) > 0 || (exerciseLogs?.length || 0) > 0,
        weeklyCalories,
        weightHistory: weightData,
        recentFood: recentFood || [],
      })
    } catch (err: any) {
      console.error('Dashboard error:', err)
      setError(err.message || 'Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center space-y-md">
          <div className="animate-spin text-6xl">🔄</div>
          <p className="text-on-surface-variant font-body-md">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col justify-center px-margin-mobile">
        <div className="bg-error-container text-on-error-container rounded-3xl p-md shadow border border-error/20 max-w-md mx-auto space-y-md">
          <h2 className="font-title-md text-title-md">Gagal Memuat Data</h2>
          <p className="text-body-md">{error}</p>
          <button 
            onClick={fetchDashboardData} 
            className="w-full py-3 bg-error text-white font-semibold rounded-full hover:opacity-90 active:scale-95 transition-all"
          >
            Coba Lagi
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!data) return null

  const caloriePercentage = calculateCaloriePercentage(data.caloriesIn, data.tdee)
  const remainingCalories = data.tdee - data.caloriesIn + data.caloriesBurned

  const COLORS = ['#006c49', '#006b5f', '#a43a3a'] // Match Stitch colors: Primary, Secondary, Tertiary
  const macroPercentages = calculateMacroPercentages(data.protein, data.carbs, data.fat)
  const macroData = [
    { name: 'Protein', value: data.protein, pct: macroPercentages.protein },
    { name: 'Carbs', value: data.carbs, pct: macroPercentages.carbs },
    { name: 'Fats', value: data.fat, pct: macroPercentages.fat },
  ]

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 transition-colors duration-300 font-sans">
      {/* Top App Bar */}
      <header className="bg-background sticky top-0 z-40 border-b border-surface-variant/10 shadow-sm">
        <div className="flex justify-between items-center w-full px-margin-mobile py-xs max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">NutriSnap</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="p-2 hover:bg-surface-container-low rounded-full transition-colors" 
              onClick={toggleDarkMode}
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <Link href="/profile" className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-outline-variant hover:scale-105 transition-transform">
              <img 
                className="w-full h-full object-cover" 
                alt="Profile Avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGRu8gSInXdOdzf7J1WZf_smTv-LSHV8w-FB-UubS95XyfEaJgjobUik-KfO6WMCBIXB5GJ8Z9hm0jZwHSPMIw4Rm8nePItLtlDMujuHRjE5Sg-PZzpQnDrHH-QKTJbPgkJHco45t01Z4hONPSH8PZflP63bYYuqnK-9EnY8EoUkv9i3nWKPJ_tG6Iixe6xJAy8xtOR6ASSbjBfAVtU7wyTtT7orQ028nSJmDHbg1cZOZ6X1UbD_Y-"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-container-max mx-auto px-margin-mobile pb-8 space-y-md">
        
        {/* Quick Actions Bento */}
        <section className="grid grid-cols-2 gap-sm mt-md">
          <Link 
            href="/scan"
            className="flex flex-col items-center justify-center gap-2 bg-primary-container text-on-primary-container p-md rounded-2xl shadow-sm hover:opacity-90 active:scale-95 transition-all text-center"
          >
            <span className="material-symbols-outlined text-[32px]">center_focus_strong</span>
            <span className="font-title-md text-title-md">Scan Makanan</span>
          </Link>
          <Link 
            href="/exercise"
            className="flex flex-col items-center justify-center gap-2 bg-secondary-container text-on-secondary-container p-md rounded-2xl shadow-sm hover:opacity-90 active:scale-95 transition-all text-center"
          >
            <span className="material-symbols-outlined text-[32px]">fitness_center</span>
            <span className="font-title-md text-title-md">Input Olahraga</span>
          </Link>
        </section>

        {/* Daily Summary & Macro Card */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          
          {/* Calorie Progress */}
          <div className="bg-surface-container-lowest p-md rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-variant/20 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-md">
              <div>
                <h2 className="font-title-md text-title-md text-on-surface">Ringkasan Harian</h2>
                <p className="font-caption text-caption text-on-surface-variant">Target TDEE: {data.tdee} kkal</p>
              </div>
              <span className="text-primary font-bold text-headline-lg-mobile">{data.caloriesIn} <span className="text-[12px] font-normal text-on-surface-variant">kkal</span></span>
            </div>
            
            <div className="space-y-xs">
              {/* Progress Bar */}
              <div className="relative h-4 w-full bg-surface-container rounded-full overflow-hidden">
                <div 
                  className={`absolute h-full rounded-full transition-all duration-300 ${caloriePercentage > 100 ? 'bg-error' : 'bg-primary'}`} 
                  style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Dikonsumsi: {data.caloriesIn} kkal</span>
                <span>Sisa: {remainingCalories >= 0 ? `${remainingCalories} kkal` : `Surplus ${Math.abs(remainingCalories)} kkal`}</span>
              </div>
            </div>
          </div>

          {/* Macro Donut Chart */}
          <div className="bg-surface-container-lowest p-md rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-variant/20 flex items-center justify-between">
            <div className="relative w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={48}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-title-md text-[13px] font-bold text-on-surface leading-none">Makro</span>
              </div>
            </div>

            <div className="flex-grow ml-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Protein ({macroPercentages.protein}%)</span>
                </div>
                <span className="font-label-sm font-bold text-on-surface">{data.protein}g</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Karbo ({macroPercentages.carbs}%)</span>
                </div>
                <span className="font-label-sm font-bold text-on-surface">{data.carbs}g</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Lemak ({macroPercentages.fat}%)</span>
                </div>
                <span className="font-label-sm font-bold text-on-surface">{data.fat}g</span>
              </div>
            </div>
          </div>
        </section>

        {/* Trends Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-sm">
          
          {/* 7-Day Calorie History */}
          <div className="bg-surface-container-lowest p-md rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-variant/20">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-title-md text-title-md text-on-surface">Tren Kalori 7 Hari</h3>
              <span className="font-caption text-caption px-2 py-1 bg-surface-container rounded-lg text-on-surface-variant">
                Kalori Harian
              </span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyCalories}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '11px' }} />
                  <YAxis tickLine={false} axisLine={false} width={30} style={{ fontSize: '11px' }} />
                  <Tooltip />
                  <Bar dataKey="caloriesIn" fill="#006c49" name="Masuk" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="caloriesBurned" fill="#ffb3af" name="Keluar" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weight Trend */}
          <div className="bg-surface-container-lowest p-md rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-variant/20">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-title-md text-title-md text-on-surface">Tren Berat Badan</h3>
              <span className="font-caption text-caption px-2 py-1 bg-surface-container rounded-lg text-on-surface-variant">
                30 Hari Terakhir
              </span>
            </div>
            <div className="h-48 w-full">
              {data.weightHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.weightHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '11px' }} />
                    <YAxis tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} width={30} style={{ fontSize: '11px' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#006c49" name="Berat (kg)" strokeWidth={3} dot={{ r: 4, fill: '#006c49' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
                  Belum ada data riwayat berat badan
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recent Logs / Meals */}
        <section className="space-y-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-title-md text-title-md text-on-surface">Makanan Terbaru</h3>
            <Link href="/history" className="text-primary font-semibold text-label-sm hover:underline">
              Lihat Riwayat
            </Link>
          </div>

          {data.recentFood.length > 0 ? (
            <div className="space-y-sm">
              {data.recentFood.map((log) => {
                const names = log.items?.map((i: any) => i.name).join(', ') || 'Makanan Tanpa Nama'
                const timestamp = new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div 
                    key={log.id} 
                    className="flex items-center gap-md p-sm bg-surface-container-low dark:bg-surface-container-high/40 rounded-2xl border border-surface-variant/10 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden flex-shrink-0 border border-outline-variant/20">
                      {log.photo_url ? (
                        <img className="w-full h-full object-cover" alt={names} src={log.photo_url} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-primary/10 text-primary">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-body-md font-semibold text-on-surface truncate">{names}</h4>
                      <p className="font-caption text-caption text-on-surface-variant">{timestamp}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-body-md font-bold text-primary block">{log.total_calories}</span>
                      <span className="font-caption text-[10px] text-on-surface-variant block uppercase tracking-wider">kkal</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-2xl p-md text-center text-on-surface-variant text-sm border border-surface-variant/10">
              Belum ada log makanan. Mulai dengan men-scan makanan Anda!
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
