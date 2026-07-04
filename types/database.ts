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
    }
  }
}

export interface Profile {
  id: string // UUID references auth.users
  tinggi_cm: number | null
  berat_kg: number | null
  umur: number | null
  gender: 'pria' | 'wanita' | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  tinggi_cm?: number | null
  berat_kg?: number | null
  umur?: number | null
  gender?: 'pria' | 'wanita' | null
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
}

export interface ProfileUpdate {
  tinggi_cm?: number | null
  berat_kg?: number | null
  umur?: number | null
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

// API Response Types
export interface AnalyzeResponse {
  items: FoodItem[]
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  photo_url?: string
}

// Helper type untuk user session
export interface User {
  id: string
  email: string
  created_at: string
}
