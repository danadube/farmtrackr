import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureListingPipelineTemplate, createListingFromTemplate, moveListingToStage, rebuildListingStagesFromTemplate } from '@/lib/listings'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  try {
    console.log('Reseed API: Starting Desert Holly deletion and recreation')

    // Find Desert Holly listing
    const desertHolly = await prisma.listing.findFirst({
      where: {
        address: '479 Desert Holly Drive',
        city: 'Palm Desert',
        state: 'CA'
      }
    })

    if (desertHolly) {
      console.log('Reseed API: Found Desert Holly, deleting:', desertHolly.id)

      // Delete all related records
      await prisma.listingTaskInstance.deleteMany({
        where: { listingId: desertHolly.id }
      })

      await prisma.listingStageInstance.deleteMany({
        where: { listingId: desertHolly.id }
      })

      // Delete the listing
      await prisma.listing.delete({
        where: { id: desertHolly.id }
      })

      console.log('Reseed API: Deleted Desert Holly listing')
    } else {
      console.log('Reseed API: Desert Holly not found, will create new')
    }

    // Get pipeline template
    const pipelineTemplateId = await ensureListingPipelineTemplate(prisma)

    if (!pipelineTemplateId) {
      return NextResponse.json({ error: 'Failed to get pipeline template' }, { status: 500 })
    }

    // Create fresh listing
    const created = await createListingFromTemplate(
      {
        pipelineTemplateId,
        title: '479 Desert Holly Drive',
        address: '479 Desert Holly Drive',
        city: 'Palm Desert',
        state: 'CA',
        zipCode: '92211',
        listPrice: 930000,
        notes: 'Indian Ridge Country Club condo on the 7th fairway with retractable awnings and full-time amenities.'
      },
      prisma
    )

    console.log('Reseed API: Created new Desert Holly listing:', created.id)

    // Rebuild stages from template
    await rebuildListingStagesFromTemplate(created.id, pipelineTemplateId, prisma, 'pre_listing_intake')

    // Move to intake stage
    try {
      await moveListingToStage(created.id, 'pre_listing_intake', prisma)
    } catch (error) {
      console.error('Reseed API: Error moving to stage (non-fatal):', error)
    }

    console.log('Reseed API: Successfully recreated Desert Holly with all stages')

    return NextResponse.json({ 
      success: true, 
      message: 'Desert Holly listing deleted and recreated successfully',
      listingId: created.id
    })
  } catch (error) {
    console.error('Reseed API: Error reseeding Desert Holly:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: 'Failed to reseed Desert Holly',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}

