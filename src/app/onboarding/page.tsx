import type { Metadata } from 'next'
import { AuthPageShell } from '@/components/ui/AuthPageShell'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'

export const metadata: Metadata = {
  title: 'Onboarding – Homelio',
}

export default function OnboardingPage() {
  return (
    <AuthPageShell maxWidth={500}>
      <OnboardingForm />
    </AuthPageShell>
  )
}
