import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Scan Commission Sheet using OpenAI Vision API
 * 
 * This endpoint processes commission sheet images (JPG, PNG, WebP) and extracts
 * transaction data using OpenAI's GPT-4 Omni Vision model.
 * 
 * Note: OpenAI Vision only supports images, not PDFs.
 * For PDFs, user should convert to image first or take a screenshot.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' 
        },
        { status: 500 }
      )
    }

    console.log('Scanning commission sheet with OpenAI Vision...')

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // GPT-4 Omni with vision (latest model)
        messages: [
          {
            role: 'system',
            content: `You are a real estate commission sheet parser. Extract transaction data from commission sheets (KW, BDH, etc.) and return it as JSON.

Your response must be ONLY valid JSON with these exact fields (use null for missing values):
{
  "transactionType": "Sale" | "Referral $ Received" | "Referral $ Paid",
  "propertyType": "Residential" | "Commercial" | "Land",
  "clientType": "Buyer" | "Seller",
  "address": string,
  "city": string,
  "listPrice": number,
  "closedPrice": number,
  "listDate": "YYYY-MM-DD",
  "closingDate": "YYYY-MM-DD",
  "brokerage": "KW" | "Keller Williams" | "BDH" | "Bennion Deville Homes",
  "commissionPct": number (as decimal, e.g. 0.03 for 3%),
  "gci": number,
  "referralPct": number (as decimal, e.g. 0.25 for 25%),
  "referralDollar": number,
  "adjustedGci": number,
  "totalBrokerageFees": number,
  "nci": number,
  "status": "Closed" | "Pending" | "Cancelled",
  "referringAgent": string,
  "referralFeeReceived": number,
  "confidence": number (0-100, your confidence in the extraction)
}

DETECTION RULES:
- Transaction Type:
  - If sheet says "Transaction Type: Referral" OR commission is just a flat fee with no property price calculation = "Referral $ Received"
  - If commission % is very low (under 1%) on a property sale AND there's a referring agent = "Referral $ Paid"
  - Otherwise = "Sale"
- Look for "Referring Agent" or "Referring Agents" fields
- KW sheets: Look for Royalty, Company Dollar in brokerage fees
- BDH sheets: Look for 6% pre-split deduction
- Extract ALL monetary values as numbers (no $ or commas)
- Return dates in YYYY-MM-DD format
- Commission percentages should be returned as decimals (0.03 = 3%, not 3.0)
- Brokerage: Use "KW" or "Keller Williams" for Keller Williams, "BDH" or "Bennion Deville Homes" for BDH`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all transaction data from this commission sheet. Return ONLY the JSON object, no other text.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1 // Low temperature for consistent extraction
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      
      let errorMessage = 'OpenAI API request failed'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorMessage
      } catch (e) {
        // If not JSON, use the text as is
        errorMessage = errorText || errorMessage
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          statusCode: response.status,
          details: errorText 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Parse the JSON response
    let extractedData
    try {
      // Try to extract JSON if there's any surrounding text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      } else {
        extractedData = JSON.parse(content)
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content)
      return NextResponse.json(
        { 
          error: 'Failed to parse extracted data',
          rawResponse: content 
        },
        { status: 500 }
      )
    }

    // Return the extracted data
    return NextResponse.json({
      success: true,
      data: extractedData,
      usage: data.usage
    })

  } catch (error) {
    console.error('Error scanning commission sheet:', error)
    return NextResponse.json(
      { 
        error: 'Failed to scan commission sheet',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
