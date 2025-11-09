import { Suspense } from 'react'
import ContactsPageClient from './ContactsPageClient'

export default function ContactsPage() {
  return (
    <Suspense fallback={null}>
      <ContactsPageClient />
    </Suspense>
  )
}