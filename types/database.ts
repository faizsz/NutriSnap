// Database types untuk NutriSnap
// Sync dengan Supabase schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      food_logs: {
        Row: FoodLog
        Insert: FoodLogInsert
        Update: FoodLogUpdate
      }
      exercise_logs: {
        Row: ExerciseLog
        Insert: ExerciseLogInsert
        Update: ExerciseLogUpdate
      }
      weight_logs: {
        Row: WeightLog
        Insert: WeightLogInsert
        Update: WeightLogUpdate
      }
    }
  }
}

export interface Profile {
  id: string // UUID references auth.users
  tinggi_cm: number | null
  berat_kg: number | null // Deprecated: use weight_logs instead
  umur: number | null // Deprecated: use tanggal_lahir instead
  tanggal_lahir: string | null // Date in YYYY-MM-DD format
  gender: 'pria' | 'wanita' | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  tinggi_cm?: number | null
  berat_kg?: number | null // Deprecated
  umur?: number | null // Deprecated
  tanggal_lahir?: string | null // YYYY-MM-DD format
  gender?: 'pria' | 'wanita' | null
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
}

export interface ProfileUpdate {
  tinggi_cm?: number | null
  berat_kg?: number | null // Deprecated
  umur?: number | null // Deprecated
  tanggal_lahir?: string | null // YYYY-MM-DD format
  gender?: 'pria' | 'wanita' | null
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  updated_at?: string
}

export interface FoodItem {
  name: string
  portion_estimate_g: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  confidence: 'low' | 'medium' | 'high'
}

export interface FoodLog {
  id: string
  user_id: string
  photo_url: string | null
  items: FoodItem[] | null
  total_calories: number | null
  total_protein: number | null
  total_carbs: number | null
  total_fat: number | null
  created_at: string
}

export interface FoodLogInsert {
  user_id: string
  photo_url?: string | null
  items?: FoodItem[] | null
  total_calories?: number | null
  total_protein?: number | null
  total_carbs?: number | null
  total_fat?: number | null
}

export interface FoodLogUpdate {
  photo_url?: string | null
  items?: FoodItem[] | null
  total_calories?: number | null
  total_protein?: number | null
  total_carbs?: number | null
  total_fat?: number | null
}

export interface ExerciseLog {
  id: string
  user_id: string
  exercise_type: string
  duration_minutes: number | null
  reps: number | null
  calories_burned: number
  notes: string | null
  created_at: string
}

export interface ExerciseLogInsert {
  user_id: string
  exercise_type: string
  duration_minutes?: number | null
  reps?: number | null
  calories_burned: number
  notes?: string | null
}

export interface ExerciseLogUpdate {
  exercise_type?: string
  duration_minutes?: number | null
  reps?: number | null
  calories_burned?: number
  notes?: string | null
}

export interface WeightLog {
  id: string
  user_id: string
  berat_kg: number
  recorded_at: string
}

export interface WeightLogInsert {
  user_id: string
  berat_kg: number
  recorded_at?: string
}

export interface WeightLogUpdate {
  berat_kg?: number
  recorded_at?: string
}

// API Response Types
export interface AnalyzeResponse {
  items: FoodItem[]
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  photo_url?: string
}

export interface CalorieBurnEstimate {
  calories_burned: number
  met_value: number
  explanation: string
}

// Helper type untuk user session
export interface User {
  id: string
  email: string
  created_at: string
}
