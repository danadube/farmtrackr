import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/letter-templates → list templates
export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.letterTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Letter templates GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/letter-templates → create template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, content, variables } = body

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 })
    }

    const created = await prisma.letterTemplate.create({
      data: {
        name,
        description: description || null,
        content,
        variables: variables ? JSON.parse(JSON.stringify(variables)) : null,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Letter templates POST error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

