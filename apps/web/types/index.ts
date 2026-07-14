// Type definitions untuk NutriSnap
// Akan diisi di step selanjutnya sesuai kebutuhan database schema

export interface User {
  id: string
  email: string
  created_at: string
}

// Placeholder types untuk food entries (akan dikembangkan nanti)
export interface FoodEntry {
  id: string
  user_id: string
  created_at: string
}
