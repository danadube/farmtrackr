import { EmailData, GmailMessage } from '@/types'

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEB_APP_URL

/**
 * Send email via Gmail API
 */
export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('/api/gmail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch emails from Gmail
 */
export async function fetchEmails(
  query: string = '',
  maxResults: number = 25
): Promise<{ success: boolean; emails?: GmailMessage[]; count?: number; error?: string }> {
  try {
    const params = new URLSearchParams({
      query,
      maxResults: maxResults.toString(),
    })

    const response = await fetch(`/api/gmail/fetch?${params}`)
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error fetching emails:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      emails: [],
    }
  }
}

/**
 * Fetch emails for a specific contact
 */
export async function fetchContactEmails(contactEmail: string, maxResults: number = 25) {
  const query = `to:${contactEmail} OR from:${contactEmail}`
  return fetchEmails(query, maxResults)
}

/**
 * Fetch emails for a specific transaction (via contact email)
 */
export async function fetchTransactionEmails(contactEmail: string, maxResults: number = 25) {
  return fetchContactEmails(contactEmail, maxResults)
}

