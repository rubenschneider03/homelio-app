'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/anmelden')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        position: 'absolute', right: 0,
        fontSize: 12, color: 'rgba(245,245,244,0.35)',
        background: 'none', border: 'none', cursor: 'pointer',
        letterSpacing: '0.04em', padding: '6px 0',
        fontFamily: 'inherit',
      }}
    >
      Abmelden
    </button>
  )
}
