import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Use service role key for server-side operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('=== Analyze Food API Called ===')
    
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const userId = formData.get('userId') as string

    console.log('Image file:', imageFile?.name, imageFile?.type, imageFile?.size)
    console.log('User ID:', userId)

    if (!imageFile || !userId) {
      return NextResponse.json(
        { error: 'Image and userId are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    console.log('Converting image to buffer...')
    // Convert image to base64
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    console.log('Uploading to Supabase Storage...')
    // Upload to Supabase Storage
    const timestamp = Date.now()
    const fileName = `${userId}/${timestamp}.jpg`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('food-photos')
      .upload(fileName, buffer, {
        contentType: imageFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image to storage: ' + uploadError.message },
        { status: 500 }
      )
    }

    console.log('Upload success:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('food-photos')
      .getPublicUrl(fileName)

    const photoUrl = urlData.publicUrl
    console.log('Photo URL:', photoUrl)

    // Call Gemini AI
    console.log('Calling Gemini AI with model:', process.env.GEMINI_MODEL)
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' 
    })

    const prompt = `Analyze this food image and return ONLY a valid JSON object with NO markdown formatting, NO code blocks, and NO additional text.

The JSON must follow this EXACT structure:
{
  "items": [
    {
      "name": "string (Indonesian food name)",
      "portion_estimate_g": number (estimated weight in grams),
      "calories": number (estimated calories),
      "protein_g": number (protein in grams),
      "carbs_g": number (carbohydrates in grams),
      "fat_g": number (fat in grams),
      "confidence": "low" | "medium" | "high"
    }
  ],
  "total_calories": number,
  "total_protein_g": number,
  "total_carbs_g": number,
  "total_fat_g": number
}

Rules:
- Identify ALL visible food items
- Use Indonesian food names when applicable
- Estimate portion sizes realistically
- Confidence: "high" for clear items, "medium" for partially visible, "low" for unclear
- Calculate totals by summing all items
- Return ONLY the JSON object, no other text`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image,
        },
      },
    ])

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
    let analysisResult
    try {
      analysisResult = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Text that failed to parse:', text)
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      )
    }

    // Validate structure
    if (!analysisResult.items || !Array.isArray(analysisResult.items)) {
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      )
    }

    // Return analysis result with photo URL
    return NextResponse.json({
      ...analysisResult,
      photo_url: photoUrl,
    })

  } catch (error: any) {
    console.error('Analysis error:', error)
    
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'AI analysis timed out. Please try again.' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    )
  }
}
