import { NextRequest, NextResponse } from 'next/server'
import { getListings, createListingFromTemplate } from '@/lib/listings'

export async function GET() {
  try {
    const listings = await getListings()
    return NextResponse.json(listings)
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body?.pipelineTemplateId) {
      return NextResponse.json({ error: 'pipelineTemplateId is required' }, { status: 400 })
    }

    const listing = await createListingFromTemplate({
      pipelineTemplateId: body.pipelineTemplateId,
      title: body.title,
      sellerId: body.sellerId,
      buyerClientId: body.buyerClientId,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      listPrice: body.listPrice,
      targetListDate: body.targetListDate,
      projectedCloseDate: body.projectedCloseDate,
      notes: body.notes
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}

