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
  
  // Interactive water intake state for desktop & mobile
  const [waterIntake, setWaterIntake] = useState(1.8)

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
  const remainingCalories = Math.max(0, data.tdee - data.caloriesIn + data.caloriesBurned)

  // Calculations for protein, carbs, fat goals based on TDEE (30% Protein, 50% Carbs, 20% Fat)
  const proteinGoal = Math.round((data.tdee * 0.3) / 4)
  const carbsGoal = Math.round((data.tdee * 0.5) / 4)
  const fatGoal = Math.round((data.tdee * 0.2) / 9)

  const proteinPercentage = Math.round((data.protein / proteinGoal) * 100)
  const carbsPercentage = Math.round((data.carbs / carbsGoal) * 100)
  const fatPercentage = Math.round((data.fat / fatGoal) * 100)

  const COLORS = ['#006c49', '#006b5f', '#a43a3a']
  const macroPercentages = calculateMacroPercentages(data.protein, data.carbs, data.fat)
  const macroData = [
    { name: 'Protein', value: data.protein, pct: macroPercentages.protein },
    { name: 'Carbs', value: data.carbs, pct: macroPercentages.carbs },
    { name: 'Fats', value: data.fat, pct: macroPercentages.fat },
  ]

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

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
            <Link className="flex items-center gap-4 px-4 py-3 rounded-xl text-primary font-bold bg-secondary-container/20 border-r-4 border-primary transition-all" href="/dashboard">
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link className="flex items-center gap-4 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container/40 hover:text-primary transition-all" href="/scan">
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
            <button onClick={toggleDarkMode} className="text-on-surface-variant hover:text-primary transition-colors">
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
        <header className="bg-background sticky top-0 z-40 border-b border-surface-variant/10 shadow-sm">
          <div className="flex justify-between items-center w-full px-margin-mobile py-xs h-16">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">NutriSnap</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors" onClick={toggleDarkMode}>
                <span className="material-symbols-outlined text-on-surface-variant">{isDark ? 'light_mode' : 'dark_mode'}</span>
              </button>
              <Link href="/profile" className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-outline-variant">
                <img className="w-full h-full object-cover" alt="Profile Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGRu8gSInXdOdzf7J1WZf_smTv-LSHV8w-FB-UubS95XyfEaJgjobUik-KfO6WMCBIXB5GJ8Z9hm0jZwHSPMIw4Rm8nePItLtlDMujuHRjE5Sg-PZzpQnDrHH-QKTJbPgkJHco45t01Z4hONPSH8PZflP63bYYuqnK-9EnY8EoUkv9i3nWKPJ_tG6Iixe6xJAy8xtOR6ASSbjBfAVtU7wyTtT7orQ028nSJmDHbg1cZOZ6X1UbD_Y-"/>
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* ----------------- MAIN CONTENT (Responsive Switch) ----------------- */}
      {/* Desktop Main Content wrapper */}
      <div className="lg:pl-64 min-h-screen">
        <main className="max-w-container-max mx-auto px-margin-mobile lg:px-8 pt-6 lg:pt-24 pb-28 space-y-6">
          
          {/* Welcome Header */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-headline-lg text-2xl lg:text-headline-lg text-on-surface">Good Morning, {userName}</h2>
              <p className="text-on-surface-variant font-body-lg text-sm lg:text-base">
                You&apos;ve reached {Math.min(100, caloriePercentage)}% of your daily intake goal. Keep it up!
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/exercise" className="bg-secondary-container text-on-secondary-container px-5 py-3 rounded-xl font-label-sm text-xs flex items-center gap-2 hover:brightness-95 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[18px]">fitness_center</span>
                Log Exercise
              </Link>
              <Link href="/scan" className="bg-primary text-on-primary px-5 py-3 rounded-xl font-label-sm text-xs flex items-center gap-2 hover:brightness-95 transition-all shadow-md shadow-primary/10">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                Scan Food
              </Link>
            </div>
          </section>

          {/* Bento Grid - Row 1: Daily Summary & Quick Stats */}
          <div className="grid grid-cols-12 gap-6">
            {/* Main Summary Card */}
            <article className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row gap-6">
              <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Daily Progress</span>
                <div className="flex items-baseline gap-2 justify-center md:justify-start">
                  <span className="font-display-lg text-4xl lg:text-display-lg text-on-surface">{data.caloriesIn}</span>
                  <span className="font-headline-md text-sm lg:text-headline-md text-on-surface-variant">/ {data.tdee} kcal</span>
                </div>
                <div className="w-full bg-surface-container h-4 rounded-full mt-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.min(caloriePercentage, 100)}%` }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-on-surface-variant">
                  <span>{caloriePercentage}% Achieved</span>
                  <span>{remainingCalories} kcal left</span>
                </div>
              </div>
              
              <div className="w-px bg-outline-variant/30 hidden md:block"></div>
              
              <div className="flex-grow flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface-variant flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Protein
                    </span>
                    <span className="font-bold text-on-surface">{data.protein}g / {proteinGoal}g</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(proteinPercentage, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface-variant flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Carbs
                    </span>
                    <span className="font-bold text-on-surface">{data.carbs}g / {carbsGoal}g</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(carbsPercentage, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface-variant flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> Fats
                    </span>
                    <span className="font-bold text-on-surface">{data.fat}g / {fatGoal}g</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(fatPercentage, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </article>

            {/* Micro Goal Card (Water Tracker) */}
            <article className="col-span-12 lg:col-span-4 bg-primary-container text-on-primary-container rounded-2xl p-6 shadow-md relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[120px]">water_drop</span>
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-headline-md text-lg lg:text-headline-md mb-1 font-bold text-white">Hydration Goal</h3>
                  <p className="font-body-md text-xs opacity-90 mb-4 text-white/95">Keep up the health momentum!</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center relative">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle 
                        className="text-white" 
                        cx="36" 
                        cy="36" 
                        fill="none" 
                        r="28" 
                        stroke="currentColor" 
                        strokeDasharray="176" 
                        strokeDashoffset={176 - (176 * Math.min(waterIntake, 2.5)) / 2.5}
                        strokeWidth="5"
                      ></circle>
                    </svg>
                    <span className="font-bold text-sm text-white">{waterIntake.toFixed(2)}L</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white/90">Goal: 2.5L</p>
                    <button 
                      onClick={() => setWaterIntake(prev => parseFloat((prev + 0.25).toFixed(2)))}
                      className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-semibold shadow-sm hover:bg-white/90 active:scale-95 transition-all"
                    >
                      Add 250ml
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Visual Data - Row 2: History & Weight Trends */}
          <div className="grid grid-cols-12 gap-6">
            {/* Calorie History Chart */}
            <article className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline-md text-base lg:text-headline-md font-bold">7-Day Calorie History</h3>
                <span className="text-xs px-2 py-1 bg-surface-container rounded-lg text-on-surface-variant font-bold">
                  Last 7 Days
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weeklyCalories}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '11px' }} />
                    <YAxis tickLine={false} axisLine={false} width={30} style={{ fontSize: '11px' }} />
                    <Tooltip />
                    <Bar dataKey="caloriesIn" fill="#006c49" name="In" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="caloriesBurned" fill="#ffb3af" name="Out" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Weight Trend Chart */}
            <article className="col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline-md text-base lg:text-headline-md font-bold">Weight Trend</h3>
                <span className="text-xs px-2 py-1 bg-surface-container rounded-lg text-on-surface-variant font-bold">
                  30 Days History
                </span>
              </div>
              <div className="h-64 w-full">
                {data.weightHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.weightHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '11px' }} />
                      <YAxis tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} width={30} style={{ fontSize: '11px' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#006c49" name="Weight (kg)" strokeWidth={3} dot={{ r: 4, fill: '#006c49' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
                    No weight records found
                  </div>
                )}
              </div>
            </article>
          </div>

          {/* Recent Meals Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-md text-base lg:text-headline-md font-bold text-on-surface">Recent Foods</h3>
              <Link href="/history" className="text-primary font-bold text-xs hover:underline flex items-center gap-1">
                View History Log
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </Link>
            </div>

            {data.recentFood.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.recentFood.map((log) => {
                  const names = log.items?.map((i: any) => i.name).join(', ') || 'Unnamed Food Log'
                  const timestamp = new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div 
                      key={log.id} 
                      className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-surface-variant/20 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:border-primary/20 transition-all duration-300"
                    >
                      <div className="w-14 h-14 rounded-xl bg-surface-container overflow-hidden flex-shrink-0 border border-outline-variant/20">
                        {log.photo_url ? (
                          <img className="w-full h-full object-cover" alt={names} src={log.photo_url} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl bg-primary/10 text-primary">
                            🍽️
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-on-surface text-sm truncate">{names}</h4>
                        <p className="text-xs text-on-surface-variant">{timestamp}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-primary text-base block">{log.total_calories}</span>
                        <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider block">kkal</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl p-8 text-center text-on-surface-variant text-sm border border-surface-variant/20">
                Belum ada log makanan. Mulai dengan men-scan makanan Anda!
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  )
}
