# Commission Sheet Scanner - Integration Guide

**Version:** 1.0  
**Last Updated:** December 2024

---

## Overview

The Commission Sheet Scanner is an AI-powered feature that automatically extracts transaction data from commission sheet images using OpenAI's GPT-4 Omni Vision API. This feature has been integrated from the standalone Commission Dashboard app into FarmTrackr.

---

## Features

- ✅ **Automatic Data Extraction** - Extracts all transaction fields from commission sheet images
- ✅ **Supports Multiple Brokerages** - Works with Keller Williams (KW) and Bennion Deville Homes (BDH) commission sheets
- ✅ **High Accuracy** - Uses GPT-4 Omni Vision API for reliable data extraction
- ✅ **Auto-Fills Forms** - Automatically populates the transaction form with extracted data
- ✅ **Confidence Scoring** - Shows confidence level for each extraction
- ✅ **Secure** - API key stored server-side, never exposed to client

---

## Supported File Formats

- ✅ **JPG/JPEG** - Full support
- ✅ **PNG** - Full support
- ✅ **WebP** - Full support
- ❌ **PDF** - Not supported (OpenAI Vision API limitation)
  - **Workaround:** Take a screenshot of the PDF (Cmd+Shift+4 on Mac, Windows+S on Windows)

---

## File Size Limits

- **Maximum:** 20MB per image
- **Recommended:** Under 5MB for faster processing

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "📷 Scan Commission Sheet" button            │
│    in the transaction form                                   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. User uploads commission sheet image (JPG, PNG, WebP)     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend converts image to base64 string                  │
│    - FileReader API reads image file                         │
│    - Converts to data URI (data:image/png;base64,...)       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend sends POST request to API route                  │
│    POST /api/transactions/scan-commission-sheet              │
│    Body: { imageBase64: "data:image/png;base64,..." }       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Next.js API route calls OpenAI Vision API                │
│    - Model: gpt-4o (GPT-4 Omni)                             │
│    - Temperature: 0.1 (low for consistent extraction)       │
│    - System prompt instructs AI to extract JSON data         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. OpenAI returns extracted transaction data as JSON        │
│    {                                                         │
│      transactionType, propertyType, clientType,             │
│      address, city, dates, prices, commission %,           │
│      brokerage fees, NCI, confidence score, etc.          │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. API route returns extracted data to frontend            │
│    { success: true, data: {...}, usage: {...} }            │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend auto-fills transaction form with extracted data│
│    - Only fills fields that were successfully extracted     │
│    - Shows confidence score to user                        │
│    - User reviews and can edit before saving               │
└─────────────────────────────────────────────────────────────┘
```

---

## Extracted Data Fields

The scanner extracts the following fields:

| Field | Type | Description |
|-------|------|-------------|
| Transaction Type | String | "Sale", "Referral $ Received", or "Referral $ Paid" |
| Property Type | String | "Residential", "Commercial", or "Land" |
| Client Type | String | "Buyer" or "Seller" |
| Address | String | Street address |
| City | String | City name |
| List Price | Number | Listing price |
| Closed Price | Number | Sale price |
| List Date | Date | Listing date (YYYY-MM-DD) |
| Closing Date | Date | Closing date (YYYY-MM-DD) |
| Brokerage | String | "Keller Williams", "KW", "BDH", or "Bennion Deville Homes" |
| Commission % | Number | Commission percentage (as decimal, e.g. 0.03 for 3%) |
| GCI | Number | Gross Commission Income |
| Referral % | Number | Referral percentage (as decimal) |
| Referral $ | Number | Referral dollar amount |
| Adjusted GCI | Number | GCI after referral deduction |
| Total Brokerage Fees | Number | Total brokerage fees |
| NCI | Number | Net Commission Income |
| Status | String | "Closed", "Pending", or "Cancelled" |
| Referring Agent | String | Name of referring agent (if applicable) |
| Referral Fee Received | Number | Referral fee amount (if applicable) |
| Confidence | Number | AI confidence score (0-100) |

---

## Usage Instructions

### Step 1: Add a New Transaction

1. Navigate to the **Commissions** page
2. Click **"New Transaction"** button
3. The transaction form will open

### Step 2: Scan Commission Sheet

1. In the transaction form, scroll to the **"AI Commission Sheet Scanner"** section
2. Click **"📷 Scan Commission Sheet"** button
3. Select an image file (JPG, PNG, or WebP) of your commission sheet
4. Wait for the scan to complete (typically 10-30 seconds)

### Step 3: Review Extracted Data

1. After scanning, the form will be automatically filled with extracted data
2. A success message will show the confidence score
3. **Review all fields** to ensure accuracy
4. Make any necessary corrections

### Step 4: Save Transaction

1. Complete any missing required fields
2. Review calculated values (GCI, Adjusted GCI, Brokerage Fees, NCI)
3. Click **"Create Transaction"** to save

---

## Best Practices

### For Best Results:

1. **Use Clear Images:**
   - Ensure all text is readable
   - Use high resolution (but keep file size under 20MB)
   - Crop to commission sheet area only (remove blank space)

2. **PDF Handling:**
   - Take a screenshot of the PDF page (Cmd+Shift+4 on Mac, Windows+S on Windows)
   - Save as PNG or JPG
   - Upload the screenshot

3. **Review Before Saving:**
   - Always review extracted data
   - Verify monetary values are correct
   - Check dates are in the correct format
   - Confirm brokerage type matches

4. **Manual Corrections:**
   - Form remains fully editable after scan
   - You can modify any extracted field
   - Calculations will auto-update based on your edits

---

## API Endpoint

**Endpoint:** `POST /api/transactions/scan-commission-sheet`

**Request:**
```typescript
{
  imageBase64: string  // Base64-encoded image (data URI format)
}
```

**Response (Success):**
```typescript
{
  success: true,
  data: {
    transactionType: "Sale",
    propertyType: "Residential",
    clientType: "Buyer",
    address: "123 Main St",
    city: "Los Angeles",
    listPrice: 500000,
    closedPrice: 495000,
    listDate: "2025-01-15",
    closingDate: "2025-02-20",
    brokerage: "KW",
    commissionPct: 0.03,
    gci: 14850,
    referralPct: 0,
    referralDollar: 0,
    adjustedGci: 14850,
    totalBrokerageFees: 2376,
    nci: 12474,
    status: "Closed",
    referringAgent: null,
    referralFeeReceived: 0,
    confidence: 92
  },
  usage: {
    prompt_tokens: 1500,
    completion_tokens: 300,
    total_tokens: 1800
  }
}
```

**Response (Error):**
```typescript
{
  error: "Failed to scan commission sheet",
  message: "OpenAI API error details"
}
```

---

## Configuration

### Environment Variables

Add to `.env.local` (local) or Vercel environment variables (production):

```env
# OpenAI API Key (required for commission sheet scanner)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### OpenAI API Key Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to **"API keys"** → **"Create new secret key"**
4. Name it: `FarmTrackr Commission Scanner`
5. Copy the API key (starts with `sk-...`)
6. **⚠️ Important:** This key will only be shown once. Save it immediately!
7. Add to `.env.local` or Vercel environment variables

### Pricing

**GPT-4 Omni Vision API Pricing** (as of December 2024):
- **Input:** ~$0.005 per 1K tokens (images cost more)
- **Output:** ~$0.015 per 1K tokens
- **Average cost per commission sheet scan:** $0.05 - $0.15

**Recommendations:**
- Set up usage limits in OpenAI dashboard
- Monitor usage regularly
- Consider caching frequently scanned sheets (future enhancement)

---

## Troubleshooting

### "OpenAI API key not configured" Error

**Solution:**
- ✅ Verify `OPENAI_API_KEY` is set in `.env.local` (local) or Vercel environment variables (production)
- ✅ Restart development server after adding to `.env.local`
- ✅ Redeploy after adding to Vercel

### Scan Never Completes

**Solutions:**
- ✅ Check OpenAI API key is valid and active
- ✅ Ensure payment method is added in OpenAI dashboard
- ✅ Check OpenAI API usage/quota limits
- ✅ Verify file is image format (JPG, PNG, WebP), not PDF

### "PDFs not supported" Error

**Solution:**
- ✅ Take a screenshot of the PDF (Cmd+Shift+4 on Mac, Windows+S on Windows)
- ✅ Save as PNG or JPG
- ✅ Upload the screenshot

### Extracted Data is Incorrect

**Solutions:**
- ✅ Ensure commission sheet image is clear and readable
- ✅ Crop image to commission sheet area only
- ✅ Use higher resolution image if text is blurry
- ✅ Review and manually correct any incorrect fields (form is fully editable)

### "Failed to parse extracted data" Error

**Solutions:**
- ✅ Try scanning again (may be a temporary OpenAI API issue)
- ✅ Ensure commission sheet is a standard format (KW or BDH)
- ✅ Check that image is not corrupted

---

## Implementation Details

### Files Created/Modified

1. **API Route:**
   - `src/app/api/transactions/scan-commission-sheet/route.ts`
   - Handles server-side OpenAI API calls

2. **Component:**
   - `src/components/TransactionForm.tsx`
   - Added commission sheet scanner UI and handler

3. **Environment:**
   - `env.example`
   - Added `OPENAI_API_KEY` example

### Architecture

- **Frontend:** React component with file upload and form auto-fill
- **Backend:** Next.js API route that securely calls OpenAI Vision API
- **Security:** API key stored server-side only, never exposed to client

---

## Future Enhancements

Potential improvements for future versions:

- [ ] PDF support (convert PDF to images server-side)
- [ ] Batch scanning (scan multiple sheets at once)
- [ ] Image storage for audit trail
- [ ] Scan history/logs
- [ ] Custom field mapping per brokerage
- [ ] Confidence threshold settings
- [ ] Manual field correction suggestions

---

## Related Documentation

- [Google Cloud Console Setup Guide](./GOOGLE_CLOUD_SETUP_FARMTRACKR.md) - For Google Sheets integration
- [Deployment Guide](../README.md) - For production deployment
- [OpenAI API Documentation](https://platform.openai.com/docs/guides/vision) - For Vision API details

---

**Last Updated:** December 2024  
**Documentation Version:** 1.0

