import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { calculateAge } from '@/lib/utils'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exerciseType, duration, reps, userId } = body

    if (!exerciseType || !userId) {
      return NextResponse.json(
        { error: 'Exercise type and userId are required' },
        { status: 400 }
      )
    }

    // Get latest weight from weight_logs
    const { data: weightLog, error: weightError } = await supabase
      .from('weight_logs')
      .select('berat_kg')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    if (weightError || !weightLog) {
      return NextResponse.json(
        { error: 'Weight data not found. Please update your weight first.' },
        { status: 404 }
      )
    }

    // Get user profile untuk gender & tanggal_lahir
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gender, tanggal_lahir')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const beratKg = weightLog.berat_kg
    const gender = profile.gender || 'pria'
    const umur = profile.tanggal_lahir 
      ? calculateAge(profile.tanggal_lahir)
      : 25 // Default 25 if no birth date

    // Call Gemini AI untuk estimasi kalori dengan retry logic
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash' 
    })

    const prompt = `Calculate calories burned for this exercise using MET (Metabolic Equivalent) formula.

Exercise details:
- Type: ${exerciseType}
- Duration: ${duration || 'N/A'} minutes
- Reps: ${reps || 'N/A'}
- User weight: ${beratKg} kg
- Gender: ${gender}
- Age: ${umur} years

Use the standard MET formula: Calories = MET × weight (kg) × duration (hours)

Return ONLY a valid JSON object with NO markdown formatting:
{
  "calories_burned": number (estimated total calories burned),
  "met_value": number (MET value used for this exercise),
  "explanation": "string (brief 1-2 sentence explanation of the calculation)"
}

Consider:
- Choose appropriate MET value based on exercise intensity
- For rep-based exercises (situp, pushup), estimate duration based on reps
- Adjust for gender and age if significant
- Round calories_burned to nearest whole number

Return ONLY the JSON object, no other text.`

    // Retry logic untuk handle 503 errors
    let result
    let lastError
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await model.generateContent(prompt)
        break // Success, exit retry loop
      } catch (err: any) {
        lastError = err
        
        // Check if it's a 503 (service unavailable) or rate limit error
        if (err.message?.includes('503') || err.message?.includes('high demand') || err.message?.includes('overloaded')) {
          if (attempt < maxRetries) {
            // Wait before retry: 1s, 2s, 4s (exponential backoff)
            const waitTime = Math.pow(2, attempt - 1) * 1000
            console.log(`Gemini API busy, retrying in ${waitTime}ms... (attempt ${attempt}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
        }
        
        // If not 503 or max retries reached, throw error
        throw err
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to get response from Gemini AI')
    }

    const response = result.response
    let text = response.text()

    console.log('Gemini raw response:', text)

    // Clean up response - remove markdown code fences if present
    text = text.trim()
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    // Parse JSON
    let estimateResult
    try {
      estimateResult = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Text that failed to parse:', text)
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      )
    }

    // Validate structure
    if (
      typeof estimateResult.calories_burned !== 'number' ||
      typeof estimateResult.met_value !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      )
    }

    return NextResponse.json(estimateResult)

  } catch (error: any) {
    console.error('Estimate error:', error)
    
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'AI estimation timed out. Please try again.' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to estimate calories' },
      { status: 500 }
    )
  }
}
