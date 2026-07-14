/**
 * Nutrition and fitness calculations
 * BMR, TDEE, and other metabolic calculations
 */

export type Gender = 'pria' | 'wanita'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

/**
 * Activity level multipliers for TDEE calculation
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,      // Little to no exercise
  light: 1.375,        // Exercise 1-3 days/week
  moderate: 1.55,      // Exercise 3-5 days/week
  active: 1.725,       // Exercise 6-7 days/week
  very_active: 1.9,    // Very intense exercise, physical job
}

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 * 
 * @param weight_kg - Body weight in kilograms
 * @param height_cm - Height in centimeters
 * @param age - Age in years
 * @param gender - 'pria' or 'wanita'
 * @returns BMR in calories per day
 * 
 * Formula:
 * - Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5
 * - Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161
 */
export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: Gender
): number {
  const baseBMR = 10 * weight_kg + 6.25 * height_cm - 5 * age
  
  if (gender === 'pria') {
    return baseBMR + 5
  } else {
    return baseBMR - 161
  }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * TDEE = BMR × Activity Multiplier
 * 
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - Activity level (sedentary to very_active)
 * @returns TDEE in calories per day
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel
): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel]
  return bmr * multiplier
}

/**
 * Calculate both BMR and TDEE at once
 * 
 * @param weight_kg - Body weight in kilograms
 * @param height_cm - Height in centimeters
 * @param age - Age in years
 * @param gender - 'pria' or 'wanita'
 * @param activityLevel - Activity level
 * @returns Object with BMR and TDEE
 */
export function calculateMetabolicRate(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel
): { bmr: number; tdee: number } {
  const bmr = calculateBMR(weight_kg, height_cm, age, gender)
  const tdee = calculateTDEE(bmr, activityLevel)
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  }
}

/**
 * Calculate net calories for the day
 * Net = TDEE - calories_in + calories_burned
 * 
 * Positive net = calorie deficit (good for weight loss)
 * Negative net = calorie surplus (good for weight gain)
 * 
 * @param tdee - Total Daily Energy Expenditure
 * @param caloriesIn - Calories consumed (from food)
 * @param caloriesBurned - Calories burned (from exercise)
 * @returns Net calorie balance
 */
export function calculateNetCalories(
  tdee: number,
  caloriesIn: number,
  caloriesBurned: number
): number {
  return tdee - caloriesIn + caloriesBurned
}

/**
 * Calculate percentage of daily calorie goal consumed
 * 
 * @param caloriesIn - Calories consumed
 * @param tdee - Daily calorie target (TDEE)
 * @returns Percentage (0-100+)
 */
export function calculateCaloriePercentage(
  caloriesIn: number,
  tdee: number
): number {
  if (tdee === 0) return 0
  return Math.round((caloriesIn / tdee) * 100)
}

/**
 * Get activity level label in Indonesian
 */
export function getActivityLevelLabel(level: ActivityLevel): string {
  const labels: Record<ActivityLevel, string> = {
    sedentary: 'Tidak Aktif',
    light: 'Ringan',
    moderate: 'Sedang',
    active: 'Aktif',
    very_active: 'Sangat Aktif',
  }
  return labels[level]
}

/**
 * Calculate macronutrient percentages
 * 
 * @param protein_g - Protein in grams
 * @param carbs_g - Carbohydrates in grams
 * @param fat_g - Fat in grams
 * @returns Percentages for each macro
 */
export function calculateMacroPercentages(
  protein_g: number,
  carbs_g: number,
  fat_g: number
): { protein: number; carbs: number; fat: number } {
  // Calories per gram: Protein=4, Carbs=4, Fat=9
  const proteinCal = protein_g * 4
  const carbsCal = carbs_g * 4
  const fatCal = fat_g * 9
  const totalCal = proteinCal + carbsCal + fatCal
  
  if (totalCal === 0) {
    return { protein: 0, carbs: 0, fat: 0 }
  }
  
  return {
    protein: Math.round((proteinCal / totalCal) * 100),
    carbs: Math.round((carbsCal / totalCal) * 100),
    fat: Math.round((fatCal / totalCal) * 100),
  }
}

/**
 * Calculate BMI (Body Mass Index)
 * 
 * @param weight_kg - Weight in kilograms
 * @param height_cm - Height in centimeters
 * @returns BMI value
 */
export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100
  return Math.round((weight_kg / (height_m * height_m)) * 10) / 10
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Kurus'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Gemuk'
  return 'Obesitas'
}
