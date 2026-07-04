'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { compressImage } from '@/lib/image-utils'
import { FoodItem, AnalyzeResponse } from '@/types/database'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ScanPage() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editedItems, setEditedItems] = useState<FoodItem[]>([])

  // Redirect if not logged in
  if (!user) {
    router.push('/login')
    return null
  }

  const handleFileSelect = async (file: File) => {
    try {
      setError(null)
      
      // Compress image
      const compressed = await compressImage(file, 2)
      setSelectedFile(compressed)
      
      // Create preview
      const url = URL.createObjectURL(compressed)
      setPreviewUrl(url)
      
      // Reset analysis
      setAnalysisResult(null)
      setEditedItems([])
    } catch (err: any) {
      setError(err.message || 'Failed to process image')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile || !user) return

    setAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('userId', user.id)

      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setAnalysisResult(data)
      setEditedItems(data.items)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleItemEdit = (index: number, field: keyof FoodItem, value: any) => {
    const updated = [...editedItems]
    updated[index] = { ...updated[index], [field]: value }
    setEditedItems(updated)
  }

  const calculateTotals = () => {
    return editedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein_g || 0),
        carbs: acc.carbs + (item.carbs_g || 0),
        fat: acc.fat + (item.fat_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  const handleSave = async () => {
    if (!analysisResult || !user) return

    setSaving(true)
    setError(null)

    try {
      const totals = calculateTotals()

      const { error: insertError } = await supabase.from('food_logs').insert({
        user_id: user.id,
        photo_url: analysisResult.photo_url,
        items: editedItems,
        total_calories: totals.calories,
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fat: totals.fat,
      })

      if (insertError) throw insertError

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to save food log')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">🍎</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Scan Makanan</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Kembali</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!analysisResult ? (
          <>
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
              {!previewUrl ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-500 transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-6xl mb-4">📸</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    Upload Foto Makanan
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drag & drop foto atau klik untuk pilih file
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                    >
                      Pilih File
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        cameraInputRef.current?.click()
                      }}
                    >
                      📷 Buka Kamera
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                  />
                </div>
              ) : (
                <div>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-96 object-contain rounded-lg mb-4"
                  />
                  <div className="flex gap-4">
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {analyzing ? 'Menganalisis...' : '🔍 Analisis Makanan'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreviewUrl(null)
                        setSelectedFile(null)
                      }}
                    >
                      Ganti Foto
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {analyzing && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-spin text-6xl mb-4">🔄</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  Sedang Menganalisis...
                </h3>
                <p className="text-gray-600">
                  AI sedang mengenali makanan dan menghitung nutrisinya
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Hasil Analisis
              </h2>

              <div className="space-y-4">
                {editedItems.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {item.name}
                        </h3>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.confidence === 'high'
                              ? 'bg-green-100 text-green-700'
                              : item.confidence === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.confidence === 'high'
                            ? '✓ Akurat'
                            : item.confidence === 'medium'
                            ? '⚠ Cukup Yakin'
                            : '⚠ Perlu Dicek'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <label className="text-xs text-gray-600">
                          Porsi (g)
                        </label>
                        <input
                          type="number"
                          value={item.portion_estimate_g}
                          onChange={(e) =>
                            handleItemEdit(
                              index,
                              'portion_estimate_g',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Kalori
                        </label>
                        <input
                          type="number"
                          value={item.calories}
                          onChange={(e) =>
                            handleItemEdit(
                              index,
                              'calories',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          value={item.protein_g}
                          onChange={(e) =>
                            handleItemEdit(
                              index,
                              'protein_g',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Karbo (g)
                        </label>
                        <input
                          type="number"
                          value={item.carbs_g}
                          onChange={(e) =>
                            handleItemEdit(
                              index,
                              'carbs_g',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          Lemak (g)
                        </label>
                        <input
                          type="number"
                          value={item.fat_g}
                          onChange={(e) =>
                            handleItemEdit(
                              index,
                              'fat_g',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-900">
                  Total Nutrisi
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Kalori</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {calculateTotals().calories}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Protein</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {calculateTotals().protein.toFixed(1)}g
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Karbo</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {calculateTotals().carbs.toFixed(1)}g
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Lemak</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {calculateTotals().fat.toFixed(1)}g
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {saving ? 'Menyimpan...' : '💾 Simpan ke Riwayat'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalysisResult(null)
                    setEditedItems([])
                    setPreviewUrl(null)
                    setSelectedFile(null)
                  }}
                >
                  Scan Lagi
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
