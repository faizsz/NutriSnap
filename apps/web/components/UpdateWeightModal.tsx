'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface UpdateWeightModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function UpdateWeightModal({ isOpen, onClose, onSuccess }: UpdateWeightModalProps) {
  const { user } = useAuth()
  const [beratKg, setBeratKg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!user) {
      setError('User tidak ditemukan')
      setLoading(false)
      return
    }

    try {
      const weight = parseFloat(beratKg)
      
      if (weight < 30 || weight > 300) {
        setError('Berat badan harus antara 30-300 kg')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('weight_logs')
        .insert({
          user_id: user.id,
          berat_kg: weight,
        })

      if (insertError) throw insertError

      // Success
      setBeratKg('')
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan berat badan')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setBeratKg('')
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-surface-variant/20 rounded-[28px] shadow-[0px_8px_40px_rgba(0,0,0,0.12)] max-w-md w-full p-md">
        <div className="flex justify-between items-center mb-sm">
          <h2 className="font-title-md text-title-md text-on-surface">Update Berat Badan</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-on-surface-variant hover:text-on-surface text-[24px] w-8 h-8 rounded-full hover:bg-surface-container-low transition flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-sm p-sm bg-error-container text-on-error-container rounded-xl">
            <p className="text-caption">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-sm">
          <div className="space-y-xs">
            <label htmlFor="weight" className="font-label-sm text-label-sm text-on-surface-variant block ml-1">
              Berat Badan Terbaru (kg)
            </label>
            <input
              id="weight"
              type="number"
              value={beratKg}
              onChange={(e) => setBeratKg(e.target.value)}
              required
              min="30"
              max="300"
              step="0.1"
              className="w-full px-4 py-3 bg-surface-container-low dark:bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all text-body-lg"
              placeholder="Contoh: 65.5"
              autoFocus
            />
            <p className="font-caption text-caption text-on-surface-variant ml-1">
              Entry baru akan ditambahkan ke riwayat berat badan Anda
            </p>
          </div>

          <div className="flex gap-sm pt-xs">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-3 border border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-label-sm rounded-full transition-all duration-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary hover:bg-on-primary-fixed-variant text-white font-label-sm rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] duration-200"
            >
              {loading ? 'Menyimpan...' : '💾 Simpan'}
            </button>
          </div>
        </form>

        <div className="mt-sm p-sm bg-surface-container rounded-xl flex gap-2 items-start">
          <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
          <p className="font-caption text-caption text-on-surface-variant">
            Tips: Update berat badan secara berkala untuk estimasi kalori yang lebih akurat.
          </p>
        </div>
      </div>
    </div>
  )
}
