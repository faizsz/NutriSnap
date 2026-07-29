'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import UpdateWeightModal from './UpdateWeightModal'

export default function BottomNav() {
  const pathname = usePathname()
  const [showWeightModal, setShowWeightModal] = useState(false)

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: '/dashboard', label: 'Beranda', icon: 'dashboard' },
    { href: '/scan', label: 'Scan', icon: 'center_focus_strong' },
    { type: 'button', onClick: () => setShowWeightModal(true), label: 'Berat', icon: 'monitoring' },
    { href: '/exercise', label: 'Olahraga', icon: 'fitness_center' },
    { href: '/history', label: 'Riwayat', icon: 'history' },
  ]

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] h-16 px-4 pb-safe flex justify-around items-center border-t border-surface-variant/10">
        <div className="flex justify-around items-center w-full max-w-container-max mx-auto h-full">
          {navItems.map((item, idx) => {
            const active = item.href ? isActive(item.href) : false

            if (item.type === 'button') {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant p-2 hover:opacity-80 active:scale-95 transition-transform duration-150"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {item.icon}
                  </span>
                  <span className="font-label-sm text-[11px] mt-0.5">{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={idx}
                href={item.href || '#'}
                className={`flex flex-col items-center justify-center transition-all duration-150 ${
                  active
                    ? 'bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary rounded-full px-4 py-1.5 active:scale-95'
                    : 'text-on-surface-variant dark:text-on-surface-variant p-2 hover:opacity-80 active:scale-95'
                }`}
              >
                <span 
                  className="material-symbols-outlined text-[24px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                {!active && <span className="font-label-sm text-[11px] mt-0.5">{item.label}</span>}
                {active && <span className="font-label-sm text-[11px] font-bold mt-0.5">{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      <UpdateWeightModal 
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSuccess={() => {
          console.log('Weight updated successfully')
          // Trigger a page refresh to update weight metrics on the active page if possible
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        }}
      />
    </>
  )
}
