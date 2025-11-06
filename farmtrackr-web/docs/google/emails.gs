/**
 * FarmTrackr Gmail Integration - Google Apps Script
 * 
 * This script provides email functionality for the FarmTrackr CRM:
 * - Send emails via Gmail API
 * - Fetch emails from Gmail
 * - Log emails to transactions
 * 
 * Setup:
 * 1. Deploy this as a Web App
 * 2. Set execution permissions to "Me"
 * 3. Set access to "Anyone" or specific users
 * 4. Copy the Web App URL to use in Next.js app
 */

// ============================================
// CONFIGURATION
// ============================================

// Google Sheet ID for Email Log (create this sheet manually)
const EMAIL_LOG_SHEET_NAME = 'Email_Log';
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your spreadsheet ID

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Send email from CRM
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.body - Email body (HTML supported)
 * @param {string} emailData.transactionId - Optional transaction ID to link
 * @param {string} emailData.contactId - Optional contact ID to link
 * @param {Array} emailData.attachments - Optional array of attachment objects
 * @returns {Object} Result object with success status and message ID
 */
function sendEmailFromCRM(emailData) {
  try {
    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.body) {
      return {
        success: false,
        error: 'Missing required fields: to, subject, body'
      };
    }

    // Prepare email options
    const options = {
      htmlBody: emailData.body,
      name: 'Janice Glaab',
      replyTo: 'janice@glaab.com'
    };

    // Add CC if provided
    if (emailData.cc) {
      options.cc = emailData.cc;
    }

    // Add BCC if provided
    if (emailData.bcc) {
      options.bcc = emailData.bcc;
    }

    // Add attachments if provided
    if (emailData.attachments && emailData.attachments.length > 0) {
      options.attachments = emailData.attachments.map(att => {
        // Convert base64 to blob if needed
        if (att.content && att.filename) {
          return Utilities.newBlob(
            Utilities.base64Decode(att.content),
            att.mimeType || 'application/octet-stream',
            att.filename
          );
        }
        return null;
      }).filter(att => att !== null);
    }

    // Send email via Gmail API
    GmailApp.sendEmail(emailData.to, emailData.subject, '', options);

    // Get the sent message ID (for logging)
    const threads = GmailApp.search(`to:${emailData.to} subject:"${emailData.subject}"`, 0, 1);
    let messageId = null;
    if (threads.length > 0) {
      const messages = threads[0].getMessages();
      if (messages.length > 0) {
        messageId = messages[messages.length - 1].getId();
      }
    }

    // Log to Email_Log sheet if transaction ID provided
    if (emailData.transactionId) {
      logEmailToSheet({
        messageId: messageId || `sent-${Date.now()}`,
        transactionId: emailData.transactionId,
        contactId: emailData.contactId || null,
        direction: 'sent',
        to: emailData.to,
        from: Session.getActiveUser().getEmail(),
        subject: emailData.subject,
        body: emailData.body,
        date: new Date(),
        attachments: emailData.attachments || []
      });
    }

    return {
      success: true,
      messageId: messageId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get recent emails from Gmail
 * @param {Object} queryParams - Query parameters
 * @param {string} queryParams.query - Gmail search query (e.g., "from:client@email.com")
 * @param {number} queryParams.maxResults - Maximum number of results (default: 25)
 * @returns {Array} Array of email objects
 */
function getRecentEmails(queryParams) {
  try {
    const query = queryParams.query || '';
    const maxResults = queryParams.maxResults || 25;

    // Search Gmail threads
    const threads = GmailApp.search(query, 0, maxResults);
    const emails = [];

    threads.forEach(thread => {
      const messages = thread.getMessages();
      messages.forEach(msg => {
        emails.push({
          id: msg.getId(),
          threadId: thread.getId(),
          from: msg.getFrom(),
          to: msg.getTo(),
          cc: msg.getCc(),
          subject: msg.getSubject(),
          body: msg.getBody(),
          plainBody: msg.getPlainBody(),
          date: msg.getDate().toISOString(),
          isUnread: msg.isUnread(),
          attachments: msg.getAttachments().map(att => ({
            name: att.getName(),
            size: att.getSize(),
            type: att.getContentType()
          })),
          labels: thread.getLabels().map(l => l.getName())
        });
      });
    });

    return {
      success: true,
      emails: emails,
      count: emails.length
    };
  } catch (error) {
    Logger.log('Error fetching emails: ' + error.toString());
    return {
      success: false,
      error: error.toString(),
      emails: []
    };
  }
}

/**
 * Log email to Email_Log sheet
 * @param {Object} emailData - Email data object
 */
function logEmailToSheet(emailData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(EMAIL_LOG_SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(EMAIL_LOG_SHEET_NAME);
      
      // Add headers
      sheet.appendRow([
        'Message ID',
        'Transaction ID',
        'Contact ID',
        'Direction',
        'From',
        'To',
        'Subject',
        'Date/Time',
        'Body Preview',
        'Full Body',
        'Attachments JSON',
        'Thread ID',
        'Saved By'
      ]);

      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, 13);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
    }

    // Append email data
    sheet.appendRow([
      emailData.messageId || '',
      emailData.transactionId || '',
      emailData.contactId || '',
      emailData.direction || 'sent',
      emailData.from || '',
      emailData.to || '',
      emailData.subject || '',
      emailData.date || new Date(),
      (emailData.body || '').substring(0, 200), // Preview
      emailData.body || '', // Full body
      JSON.stringify(emailData.attachments || []),
      emailData.threadId || '',
      Session.getActiveUser().getEmail()
    ]);
  } catch (error) {
    Logger.log('Error logging email: ' + error.toString());
  }
}

/**
 * Web app entry point - Handle POST requests from Next.js
 * @param {Object} e - Event object from doPost
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;

    switch (action) {
      case 'send':
        result = sendEmailFromCRM(data.emailData);
        break;
      case 'fetch':
        result = getRecentEmails(data.queryParams);
        break;
      default:
        result = {
          success: false,
          error: 'Invalid action: ' + action
        };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Web app entry point - Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'FarmTrackr Email Service is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

