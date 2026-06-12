'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  style: CSSProperties
}

export function HeaderAuthButton({ style }: Props) {
  const [label, setLabel] = useState('Anmelden')
  const [href, setHref] = useState('/anmelden')

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setLabel('Profil')
        setHref('/profil/meine-wohnung')
      }
    })
  }, [])

  return (
    <a href={href} style={style}>
      {label}
    </a>
  )
}
