import { getListings, getListingPipelineTemplates, serializeListing, serializePipelineTemplate } from '@/lib/listings'
import ListingsPageClient from './ListingsPageClient'

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

