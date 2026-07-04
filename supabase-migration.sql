-- NutriSnap Database Schema Migration
-- Jalankan SQL ini di Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tinggi_cm NUMERIC,
  berat_kg NUMERIC,
  umur INTEGER,
  gender TEXT CHECK (gender IN ('pria', 'wanita')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. FOOD_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT,
  items JSONB,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES untuk performa query
-- ============================================
CREATE INDEX IF NOT EXISTS food_logs_user_id_idx ON public.food_logs(user_id);
CREATE INDEX IF NOT EXISTS food_logs_created_at_idx ON public.food_logs(created_at DESC);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS pada kedua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
-- User bisa membaca profile miliknya sendiri
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- User bisa insert profile pertama kali (saat onboarding)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User bisa update profile miliknya sendiri
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- FOOD_LOGS Policies
-- User bisa membaca food logs miliknya sendiri
CREATE POLICY "Users can view their own food logs"
  ON public.food_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- User bisa insert food log baru
CREATE POLICY "Users can insert their own food logs"
  ON public.food_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User bisa update food logs miliknya sendiri
CREATE POLICY "Users can update their own food logs"
  ON public.food_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User bisa delete food logs miliknya sendiri
CREATE POLICY "Users can delete their own food logs"
  ON public.food_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. FUNCTION untuk auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update updated_at di profiles
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. FUNCTION untuk auto-create profile setelah signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk auto-create profile ketika user baru register
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Setelah run script ini, struktur database sudah siap!
-- RLS policies memastikan setiap user hanya bisa akses datanya sendiri.
