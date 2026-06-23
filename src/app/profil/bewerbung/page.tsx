import type { Metadata } from 'next'
import { ApplicationPanel } from '@/components/profil/ApplicationPanel'

export const metadata: Metadata = {
  title: 'Bewerbungsdossier – Homelio',
}

export default function BewerbungPage() {
  return <ApplicationPanel />
}
