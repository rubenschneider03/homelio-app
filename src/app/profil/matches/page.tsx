import type { Metadata } from 'next'
import { MatchList } from '@/components/profil/MatchList'

export const metadata: Metadata = {
  title: 'Matches – Homelio',
}

export default function MatchesPage() {
  return <MatchList />
}
