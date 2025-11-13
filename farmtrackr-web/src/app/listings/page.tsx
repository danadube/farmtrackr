import { getListings, getListingPipelineTemplates, serializeListing, serializePipelineTemplate } from '@/lib/listings'
import ListingsPageClient from './ListingsPageClient'

// Mark as dynamic to prevent static generation (requires database access)
export const dynamic = 'force-dynamic'

export default async function ListingsPage() {
  const [listings, templates] = await Promise.all([
    getListings(),
    getListingPipelineTemplates()
  ])

  return (
    <ListingsPageClient
      initialListings={listings.map(serializeListing)}
      pipelineTemplates={templates.map(serializePipelineTemplate)}
    />
  )
}

