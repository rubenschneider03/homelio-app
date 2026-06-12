import type { Metadata } from 'next'
import { SucheinstellungenForm } from '@/components/profil/SucheinstellungenForm'

export const metadata: Metadata = {
  title: 'Sucheinstellungen – Homelio',
}

export default function SucheinstellungenPage() {
  return <SucheinstellungenForm />
}
