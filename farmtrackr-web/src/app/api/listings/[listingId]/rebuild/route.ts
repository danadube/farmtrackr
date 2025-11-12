import { NextRequest, NextResponse } from 'next/server'
import { rebuildListingStagesFromTemplate, serializeListing } from '@/lib/listings'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    listingId: string
  }
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { listingId } = params

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    console.log('Rebuild API: Starting stage rebuild for listing:', listingId)

    // Get the listing to find its pipeline template
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { pipelineTemplateId: true, currentStageKey: true }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (!listing.pipelineTemplateId) {
      return NextResponse.json({ error: 'Listing has no pipeline template' }, { status: 400 })
    }

    // Rebuild stages from template, preserving current stage if possible
    await rebuildListingStagesFromTemplate(
      listingId,
      listing.pipelineTemplateId,
      prisma,
      listing.currentStageKey
    )

    // Fetch the updated listing with all relations (using LISTING_INCLUDE structure)
    const updatedListing = await prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
      include: {
        stageInstances: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { createdAt: 'asc' },
              include: {
                document: true
              }
            }
          }
        },
        pipelineTemplate: true
      }
    })

    console.log('Rebuild API: Successfully rebuilt stages for listing:', listingId)
    console.log('Rebuild API: Stage count:', updatedListing.stageInstances.length)

    return NextResponse.json(serializeListing(updatedListing))
  } catch (error) {
    console.error('Rebuild API: Error rebuilding listing stages:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: 'Failed to rebuild listing stages',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}

