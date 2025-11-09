import ContactForm from '@/components/ContactForm'

interface NewContactPageProps {
  searchParams?: Record<string, string | string[] | undefined>
}

export default function NewContactPage({ searchParams }: NewContactPageProps) {
  const typeParam = searchParams?.type
  const variant = typeParam === 'general' ? 'general' : 'farm'

  return <ContactForm variant={variant} />
}
