import type { Metadata } from 'next'
import { AuthPageShell } from '@/components/ui/AuthPageShell'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Passwort zurücksetzen – Homelio',
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell>
      <ResetPasswordForm />
    </AuthPageShell>
  )
}
