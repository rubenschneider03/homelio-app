import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SucheinstellungenForm } from '@/components/profil/SucheinstellungenForm'
import { PremiumPaymentBanner } from '@/components/profil/PremiumPaymentBanner'

export const metadata: Metadata = {
  title: 'Sucheinstellungen – Homelio',
}

export default function SucheinstellungenPage() {
  return (
    <>
      <Suspense fallback={null}>
        <PremiumPaymentBanner />
      </Suspense>
      <SucheinstellungenForm />
    </>
  )
}
