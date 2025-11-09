import { redirect } from 'next/navigation'

export default function GoogleContactsPage() {
  redirect('/contacts?view=google')
}
