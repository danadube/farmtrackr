# Email API Routes Documentation

## Overview
All Next.js API routes for the email module have been created and are ready to use. These routes connect to the Google Apps Script Web App backend.

## Web App URL
**Update your `.env.local` file with:**
```
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/AKfycbyvL6MwQ7I_HGEZkuTOn-tuOMbvXePw83kpIKTbR1SlIY3TaIo2MUuj1I9_PSumFB11/exec
```

## API Routes

### 1. `/api/gmail/send` (POST)
**Existing route** - Sends emails via Gmail API
- **Request Body:**
  ```json
  {
    "to": "recipient@example.com",
    "subject": "Email subject",
    "body": "<html>Email body</html>",
    "cc": "cc@example.com",
    "bcc": "bcc@example.com",
    "transactionId": "optional-transaction-id",
    "contactId": "optional-contact-id",
    "attachments": []
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "messageId": "gmail-message-id",
    "timestamp": "2025-11-07T00:00:00.000Z"
  }
  ```

### 2. `/api/emails/transactions` (GET)
**Fetches active transactions** for email filtering/linking
- **Response:**
  ```json
  [
    {
      "id": "transaction-id",
      "propertyAddress": "123 Main St",
      "clientName": "John Doe",
      "clientEmail": "client@example.com",
      "status": "Active",
      "price": 500000
    }
  ]
  ```
- **Fallback:** Uses Google Apps Script if database unavailable

### 3. `/api/emails/labels` (GET)
**Fetches Gmail labels** (system + custom)
- **Response:**
  ```json
  {
    "system": [
      {
        "name": "INBOX",
        "count": 42,
        "icon": "📥"
      }
    ],
    "custom": [
      {
        "name": "FarmTrackr/Active",
        "count": 10,
        "color": "#4285f4",
        "icon": "🏠"
      }
    ]
  }
  ```

### 4. `/api/emails/link` (POST)
**Links or unlinks an email to/from a transaction**
- **Request Body:**
  ```json
  {
    "messageId": "gmail-message-id",
    "transactionId": "transaction-id" // or null to unlink
  }
  ```
- **Response:**
  ```json
  {
    "success": true
  }
  ```
- **Hybrid Storage:** Updates both Prisma database and Google Sheets

### 5. `/api/emails/reply` (POST)
**Replies to an email thread**
- **Request Body:**
  ```json
  {
    "messageId": "gmail-message-id",
    "body": "<html>Reply body</html>",
    "transactionId": "optional-transaction-id"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "messageId": "new-reply-message-id"
  }
  ```

### 6. `/api/emails/forward` (POST)
**Forwards an email**
- **Request Body:**
  ```json
  {
    "messageId": "gmail-message-id",
    "forwardTo": "recipient@example.com",
    "body": "<html>Forward message</html>",
    "transactionId": "optional-transaction-id"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "messageId": "forward-message-id"
  }
  ```

### 7. `/api/emails/list` (GET)
**Gets filtered emails** based on various criteria
- **Query Parameters:**
  - `transactionId`: Filter by transaction (or 'all')
  - `label`: Gmail label to filter by (default: 'INBOX')
  - `search`: Search term for Gmail search
  - `status`: Status filter ('all', 'unread', 'starred', etc.)
  - `maxResults`: Maximum number of results (default: 50)
- **Example:**
  ```
  GET /api/emails/list?transactionId=txn-123&label=INBOX&search=property&status=unread&maxResults=25
  ```
- **Response:**
  ```json
  {
    "success": true,
    "emails": [...],
    "count": 10
  }
  ```

### 8. `/api/emails/templates` (GET)
**Gets all email templates**
- **Response:**
  ```json
  {
    "success": true,
    "templates": [
      {
        "id": "welcome",
        "name": "Welcome Email",
        "subject": "Welcome to FarmTrackr",
        "body": "<html>...</html>",
        "variables": ["clientName", "propertyAddress"]
      }
    ]
  }
  ```

### 9. `/api/emails/template` (POST)
**Gets a specific template with variable substitution**
- **Request Body:**
  ```json
  {
    "templateId": "welcome",
    "variables": {
      "clientName": "John Doe",
      "propertyAddress": "123 Main St"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "subject": "Welcome to FarmTrackr - John Doe",
    "body": "<html>Welcome John Doe, regarding 123 Main St...</html>"
  }
  ```

## Error Responses
All routes return errors in this format:
```json
{
  "error": "Error message here"
}
```
With appropriate HTTP status codes (400 for bad requests, 500 for server errors).

## Testing
You can test the routes using:
1. **Browser DevTools** - Network tab
2. **Postman/Insomnia** - API testing tools
3. **curl** - Command line
4. **Next.js API test page** - Create a test page with fetch calls

## Next Steps
1. ✅ API routes created
2. ⏳ Install TipTap rich text editor
3. ⏳ Create TransactionSelector component
4. ⏳ Enhance EmailPanel and EmailComposer
5. ⏳ Create standalone /emails page
6. ⏳ Add reply/forward UI to email detail view

