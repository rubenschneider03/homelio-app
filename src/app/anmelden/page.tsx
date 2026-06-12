import type { Metadata } from 'next'
import { AuthPageShell } from '@/components/ui/AuthPageShell'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata: Metadata = {
  title: 'Anmelden – Homelio',
}

export default function AnmeldenPage() {
  return (
    <AuthPageShell>
      <AuthForm />
    </AuthPageShell>
  )
}
