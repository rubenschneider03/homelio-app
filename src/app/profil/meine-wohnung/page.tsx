import type { Metadata } from 'next'
import { MeineWohnungForm } from '@/components/profil/MeineWohnungForm'

export const metadata: Metadata = {
  title: 'Meine Wohnung – Homelio',
}

export default function MeineWohnungPage() {
  return <MeineWohnungForm />
}
